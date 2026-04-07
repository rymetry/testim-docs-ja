const fs = require('fs');

const DEFAULT_LABELS = ['documentation', 'automated'];

/**
 * Builds the HTML comment marker embedded in the issue body.
 * Used to find existing issues by family key rather than by exact title string,
 * so title edits or emoji changes never create duplicate issues.
 */
function buildFamilyMarker(key) {
  return `<!-- detection-family: ${key} -->`;
}

function fallbackCore(core) {
  return core ?? {
    info: console.log,
    warning: console.warn,
    error: console.error,
    debug: console.debug,
  };
}

function loadReport(reportPath) {
  try {
    return JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  } catch (error) {
    throw new Error(`Failed to load report from "${reportPath}": ${error.message}`, { cause: error });
  }
}

function sortByUpdatedDesc(left, right) {
  return Date.parse(right.updated_at) - Date.parse(left.updated_at);
}

function hasFamilyMarker(issue, marker) {
  return issue.body?.includes(marker) === true;
}

function getIssueFamilyKey(issue) {
  const match = issue.body?.match(/<!--\s*detection-family:\s*([a-z0-9-]+)\s*-->/);
  return match?.[1] ?? null;
}

function sortMatchingIssues(marker) {
  return (left, right) => {
    const markerDiff =
      Number(hasFamilyMarker(right, marker)) - Number(hasFamilyMarker(left, marker));
    if (markerDiff !== 0) return markerDiff;
    const updatedDiff = sortByUpdatedDesc(left, right);
    if (Number.isFinite(updatedDiff) && updatedDiff !== 0) return updatedDiff;
    return (right.number ?? 0) - (left.number ?? 0);
  };
}

function buildIssueSpecs(report) {
  const specs = [
    {
      key: report.snapshotDiff.key ?? 'snapshot-diff',
      title: report.snapshotDiff.issueTitle,
      body: report.snapshotDiff.body,
      shouldOpenIssue: report.snapshotDiff.shouldOpenIssue,
    },
    {
      key: report.parityRegression.key ?? 'parity-regression',
      title: report.parityRegression.issueTitle,
      body: report.parityRegression.body,
      shouldOpenIssue: report.parityRegression.shouldOpenIssue,
    },
  ];

  if (report.sourceSyncHealth) {
    specs.push({
      key: report.sourceSyncHealth.key ?? 'source-sync-health',
      title: report.sourceSyncHealth.issueTitle,
      body: report.sourceSyncHealth.body,
      shouldOpenIssue: report.sourceSyncHealth.shouldOpenIssue,
    });
  }

  if (report.parityFollowup) {
    specs.push({
      key: report.parityFollowup.key ?? 'parity-followup',
      title: report.parityFollowup.issueTitle,
      body: report.parityFollowup.body,
      shouldOpenIssue: report.parityFollowup.shouldOpenIssue,
    });
  }

  return specs;
}

async function listManagedIssues({ github, owner, repo }) {
  try {
    const issues = await github.paginate(github.rest.issues.listForRepo, {
      owner,
      repo,
      state: 'all',
      per_page: 100,
    });
    return issues.filter((issue) => !issue.pull_request);
  } catch (error) {
    throw new Error(`Failed to list issues for ${owner}/${repo}: ${error.message}`, { cause: error });
  }
}

async function createIssue({ github, owner, repo, title, body, labels, log }) {
  try {
    return await github.rest.issues.create({
      owner,
      repo,
      title,
      body,
      labels,
    });
  } catch (error) {
    const structuredErrors = error.response?.data?.errors ?? [];
    const isLabelError = error.status === 422
      && labels?.length
      && structuredErrors.some((e) => e.field === 'labels' || e.resource === 'Label');
    if (isLabelError) {
      log.warning(
        `Issue creation failed for "${title}" (${error.message}). Retrying without labels.`,
      );
      return github.rest.issues.create({
        owner,
        repo,
        title,
        body,
      });
    }
    throw error;
  }
}

async function closeIssue({
  github,
  owner,
  repo,
  issueNumber,
  commentBody,
}) {
  await github.rest.issues.createComment({
    owner,
    repo,
    issue_number: issueNumber,
    body: commentBody,
  });
  await github.rest.issues.update({
    owner,
    repo,
    issue_number: issueNumber,
    state: 'closed',
  });
}

async function syncOneIssue({
  github,
  owner,
  repo,
  existingIssues,
  title,
  body,
  shouldOpenIssue,
  key,
  log,
}) {
  // Prefer key-based matching (HTML comment in body) over title matching so
  // that title renames never create duplicate issues.  Fall back to title
  // matching only for OPEN legacy issues that do not already belong to some
  // other managed detection family.
  const marker = buildFamilyMarker(key);
  const byMarker = existingIssues.filter((issue) => hasFamilyMarker(issue, marker));
  const byTitle = existingIssues.filter(
    (issue) =>
      issue.state === 'open'
      && issue.title === title
      && getIssueFamilyKey(issue) === null,
  );
  const matching = [...new Map(
    [...byMarker, ...byTitle].map((issue) => [issue.number, issue]),
  ).values()].sort(sortMatchingIssues(marker));
  const openIssues = matching.filter((issue) => issue.state === 'open');
  const openIssue = openIssues[0] ?? null;
  const duplicateOpenIssues = openIssues.slice(1);

  if (shouldOpenIssue) {
    if (openIssue) {
      if (openIssue.body !== body || openIssue.title !== title) {
        await github.rest.issues.update({
          owner,
          repo,
          issue_number: openIssue.number,
          title,
          body,
        });
        log.info(`Updated open issue #${openIssue.number} (${key}).`);
      } else {
        log.info(`No body changes for open issue #${openIssue.number} (${key}).`);
      }
      for (const duplicate of duplicateOpenIssues) {
        await closeIssue({
          github,
          owner,
          repo,
          issueNumber: duplicate.number,
          commentBody:
            `Closing duplicate detection issue for ${key}; family-key sync keeps one open issue per family.`,
        });
        log.info(`Closed duplicate issue #${duplicate.number} (${key}).`);
      }
      return;
    }

    const created = await createIssue({
      github,
      owner,
      repo,
      title,
      body,
      labels: DEFAULT_LABELS,
      log,
    });
    log.info(`Created issue #${created.data.number} (${key}).`);
    return;
  }

  if (!openIssue) {
    log.info(`No open issue to close for ${key}.`);
    return;
  }

  for (const issue of openIssues) {
    await closeIssue({
      github,
      owner,
      repo,
      issueNumber: issue.number,
      commentBody:
        `Closing because the latest scheduled check reports no actionable or signal ${key} file(s).`,
    });
    log.info(`Closed issue #${issue.number} (${key}).`);
  }
}

/**
 * actionable report が full run か partial (--slug / --section) run か
 * を判定する純粋ヘルパー。
 *
 * Contract:
 *   report.runScope === undefined / null  → legacy report、従来通り sync
 *   report.runScope.isComplete === true   → full run、従来通り sync
 *   report.runScope.isComplete === false  → partial run、no-op + warning
 *
 * legacy fallback は意図的。runScope field を持たない既存 CI run を
 * 壊さないための互換処理で、将来的には missing runScope を error にする
 * tightening を follow-up で検討する (soft landing 優先)。
 */
function isPartialRunReport(report) {
  const scope = report?.runScope;
  if (scope == null) return false; // legacy
  return scope.isComplete !== true;
}

module.exports = async function syncDetectionIssues({
  github,
  context,
  core,
  reportPath = 'docs-actionable-report.json',
}) {
  const log = fallbackCore(core);
  const { owner, repo } = context.repo;
  const report = loadReport(reportPath);

  // partial-run guard: actionable report が partial run 由来のときは
  // managed GitHub issue を一切触らない。listManagedIssues より前に
  // 早期 return することで、deep-audit / 手動デバッグ run が誤って
  // workflow に紛れ込んでも managed issue を上書きしない契約。
  if (isPartialRunReport(report)) {
    const scope = report.runScope ?? {};
    const slug = scope.filters?.slug ?? null;
    const section = scope.filters?.section ?? null;
    const filterDesc = slug
      ? `slug=${slug}`
      : section
        ? `section=${section}`
        : '(unknown filter)';
    log.warning(
      `Skipping detection issue sync — partial run (${scope.type ?? 'unknown'}, ${filterDesc}). ` +
        'Managed issues are only synced from full-repo (scheduled-actionable) runs.',
    );
    return;
  }

  const issueSpecs = buildIssueSpecs(report);
  const existingIssues = await listManagedIssues({ github, owner, repo });

  for (const spec of issueSpecs) {
    await syncOneIssue({
      github,
      owner,
      repo,
      existingIssues,
      log,
      ...spec,
    });
  }
};
