const fs = require('fs');

const DEFAULT_LABELS = ['documentation', 'automated'];

function fallbackCore(core) {
  return core ?? { info: console.log, warning: console.warn };
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

function buildIssueSpecs(report) {
  return [
    {
      key: 'snapshot-diff',
      title: report.snapshotDiff.issueTitle,
      body: report.snapshotDiff.body,
      shouldOpenIssue: report.snapshotDiff.shouldOpenIssue,
    },
    {
      key: 'parity-regression',
      title: report.parityRegression.issueTitle,
      body: report.parityRegression.body,
      shouldOpenIssue: report.parityRegression.shouldOpenIssue,
    },
  ];
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
    const isLabelError = error.status === 422
      && labels?.length
      && /label/i.test(error.message ?? '');
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
  const matching = existingIssues
    .filter((issue) => issue.title === title)
    .sort(sortByUpdatedDesc);
  const openIssue = matching.find((issue) => issue.state === 'open') ?? null;

  if (shouldOpenIssue) {
    if (openIssue) {
      if (openIssue.body !== body) {
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

  await github.rest.issues.createComment({
    owner,
    repo,
    issue_number: openIssue.number,
    body: `Closing because the latest scheduled actionable snapshot reports 0 actionable ${key} file(s).`,
  });
  await github.rest.issues.update({
    owner,
    repo,
    issue_number: openIssue.number,
    state: 'closed',
  });
  log.info(`Closed issue #${openIssue.number} (${key}).`);
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
