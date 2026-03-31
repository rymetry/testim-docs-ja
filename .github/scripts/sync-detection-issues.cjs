const fs = require('fs');

const DEFAULT_LABELS = ['documentation', 'automated'];

function loadReport(reportPath) {
  return JSON.parse(fs.readFileSync(reportPath, 'utf8'));
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
      actionableCount: report.snapshotDiff.summary.actionableCount,
    },
    {
      key: 'parity-regression',
      title: report.parityRegression.issueTitle,
      body: report.parityRegression.body,
      shouldOpenIssue: report.parityRegression.shouldOpenIssue,
      actionableCount: report.parityRegression.summary.actionableCount,
    },
  ];
}

async function listManagedIssues({ github, owner, repo }) {
  const issues = await github.paginate(github.rest.issues.listForRepo, {
    owner,
    repo,
    state: 'all',
    per_page: 100,
  });

  return issues.filter((issue) => !issue.pull_request);
}

async function createIssue({ github, owner, repo, title, body, labels, core }) {
  try {
    return await github.rest.issues.create({
      owner,
      repo,
      title,
      body,
      labels,
    });
  } catch (error) {
    if (error.status === 422 && labels?.length) {
      core?.warning(
        `Creating issue without labels after validation error for "${title}".`,
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
  actionableCount,
  key,
  core,
}) {
  const matching = existingIssues
    .filter((issue) => issue.title === title)
    .sort(sortByUpdatedDesc);
  const openIssue = matching.find((issue) => issue.state === 'open') ?? null;
  const latestClosedIssue = matching.find((issue) => issue.state === 'closed') ?? null;

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
        core?.info(`Updated open issue #${openIssue.number} (${key}).`);
      } else {
        core?.info(`No body changes for open issue #${openIssue.number} (${key}).`);
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
      core,
    });
    core?.info(`Created issue #${created.data.number} (${key}).`);
    return;
  }

  if (!openIssue) {
    core?.info(`No open issue to close for ${key}.`);
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
  core?.info(`Closed issue #${openIssue.number} (${key}).`);
}

module.exports = async function syncDetectionIssues({
  github,
  context,
  core,
  reportPath = 'docs-actionable-report.json',
}) {
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
      core,
      ...spec,
    });
  }
};
