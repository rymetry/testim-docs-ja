import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const syncDetectionIssues = require('../../.github/scripts/sync-detection-issues.cjs');

const tmpDirs = [];

function createTempReport(report) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sync-detection-issues-'));
  tmpDirs.push(dir);
  const reportPath = path.join(dir, 'docs-actionable-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report), 'utf8');
  return reportPath;
}

function createGithub(existingIssues) {
  const createCalls = [];
  const updateCalls = [];
  const commentCalls = [];

  return {
    github: {
      paginate: async () => existingIssues,
      rest: {
        issues: {
          listForRepo: {},
          create: async (params) => {
            createCalls.push(params);
            return { data: { number: 999 } };
          },
          update: async (params) => {
            updateCalls.push(params);
            return { data: {} };
          },
          createComment: async (params) => {
            commentCalls.push(params);
            return { data: {} };
          },
        },
      },
    },
    createCalls,
    updateCalls,
    commentCalls,
  };
}

const context = {
  repo: {
    owner: 'rymetry',
    repo: 'testim-docs-ja',
  },
};

const core = {
  info() {},
  warning() {},
  error() {},
  debug() {},
};

afterEach(() => {
  while (tmpDirs.length > 0) {
    fs.rmSync(tmpDirs.pop(), { recursive: true, force: true });
  }
});

describe('sync-detection-issues', () => {
  it('creates a parityFollowup issue on the first actionable run', async () => {
    const reportPath = createTempReport({
      snapshotDiff: {
        key: 'snapshot-diff',
        issueTitle: 'Snapshot Diff',
        body: '<!-- detection-family: snapshot-diff -->\nbody',
        shouldOpenIssue: false,
      },
      parityRegression: {
        key: 'parity-regression',
        issueTitle: 'Parity Regression',
        body: '<!-- detection-family: parity-regression -->\nbody',
        shouldOpenIssue: false,
      },
      parityFollowup: {
        key: 'parity-followup',
        issueTitle: 'Parity Followup',
        body: '<!-- detection-family: parity-followup -->\nfollowup body',
        shouldOpenIssue: true,
      },
    });
    const { github, createCalls, updateCalls, commentCalls } = createGithub([]);

    await syncDetectionIssues({ github, context, core, reportPath });

    assert.deepEqual(createCalls, [
      {
        owner: 'rymetry',
        repo: 'testim-docs-ja',
        title: 'Parity Followup',
        body: '<!-- detection-family: parity-followup -->\nfollowup body',
        labels: ['documentation', 'automated'],
      },
    ]);
    assert.deepEqual(updateCalls, []);
    assert.deepEqual(commentCalls, []);
  });

  it('keeps one same-family open issue and closes open duplicates', async () => {
    const reportPath = createTempReport({
      snapshotDiff: {
        key: 'snapshot-diff',
        issueTitle: 'Snapshot Diff',
        body: '<!-- detection-family: snapshot-diff -->\nbody',
        shouldOpenIssue: false,
      },
      parityRegression: {
        key: 'parity-regression',
        issueTitle: 'Parity Regression',
        body: '<!-- detection-family: parity-regression -->\nnew parity body',
        shouldOpenIssue: true,
      },
    });
    const { github, createCalls, updateCalls, commentCalls } = createGithub([
      {
        number: 10,
        title: 'Old Parity Regression',
        body: '<!-- detection-family: parity-regression -->\nold parity body',
        state: 'open',
        updated_at: '2026-04-06T00:00:00Z',
      },
      {
        number: 11,
        title: 'Parity Regression',
        body: 'legacy duplicate without marker',
        state: 'open',
        updated_at: '2026-04-07T00:00:00Z',
      },
    ]);

    await syncDetectionIssues({ github, context, core, reportPath });

    assert.equal(createCalls.length, 0);
    assert.deepEqual(
      updateCalls,
      [
        {
          owner: 'rymetry',
          repo: 'testim-docs-ja',
          issue_number: 10,
          title: 'Parity Regression',
          body: '<!-- detection-family: parity-regression -->\nnew parity body',
        },
        {
          owner: 'rymetry',
          repo: 'testim-docs-ja',
          issue_number: 11,
          state: 'closed',
        },
      ],
    );
    assert.deepEqual(commentCalls, [
      {
        owner: 'rymetry',
        repo: 'testim-docs-ja',
        issue_number: 11,
        body: 'Closing duplicate detection issue for parity-regression; family-key sync keeps one open issue per family.',
      },
    ]);
  });

  it('does not update an already-synced open issue when title and body are unchanged', async () => {
    const reportPath = createTempReport({
      snapshotDiff: {
        key: 'snapshot-diff',
        issueTitle: 'Snapshot Diff',
        body: '<!-- detection-family: snapshot-diff -->\nbody',
        shouldOpenIssue: false,
      },
      parityRegression: {
        key: 'parity-regression',
        issueTitle: 'Parity Regression',
        body: '<!-- detection-family: parity-regression -->\nstable body',
        shouldOpenIssue: true,
      },
    });
    const { github, createCalls, updateCalls, commentCalls } = createGithub([
      {
        number: 10,
        title: 'Parity Regression',
        body: '<!-- detection-family: parity-regression -->\nstable body',
        state: 'open',
        updated_at: '2026-04-07T00:00:00Z',
      },
    ]);

    await syncDetectionIssues({ github, context, core, reportPath });

    assert.deepEqual(createCalls, []);
    assert.deepEqual(updateCalls, []);
    assert.deepEqual(commentCalls, []);
  });

  it('ignores title matches that already belong to a different managed family', async () => {
    const reportPath = createTempReport({
      snapshotDiff: {
        key: 'snapshot-diff',
        issueTitle: 'Snapshot Diff',
        body: '<!-- detection-family: snapshot-diff -->\nbody',
        shouldOpenIssue: false,
      },
      parityRegression: {
        key: 'parity-regression',
        issueTitle: 'Parity Regression',
        body: '<!-- detection-family: parity-regression -->\nnew parity body',
        shouldOpenIssue: true,
      },
    });
    const { github, createCalls, updateCalls, commentCalls } = createGithub([
      {
        number: 42,
        title: 'Parity Regression',
        body: '<!-- detection-family: parity-followup -->\nwrong family',
        state: 'open',
        updated_at: '2026-04-07T00:00:00Z',
      },
      {
        number: 43,
        title: 'Parity Regression',
        body: 'closed legacy issue',
        state: 'closed',
        updated_at: '2026-04-06T00:00:00Z',
      },
    ]);

    await syncDetectionIssues({ github, context, core, reportPath });

    assert.deepEqual(createCalls, [
      {
        owner: 'rymetry',
        repo: 'testim-docs-ja',
        title: 'Parity Regression',
        body: '<!-- detection-family: parity-regression -->\nnew parity body',
        labels: ['documentation', 'automated'],
      },
    ]);
    assert.deepEqual(updateCalls, []);
    assert.deepEqual(commentCalls, []);
  });

  it('closes all open same-family issues when the family is no longer actionable', async () => {
    const reportPath = createTempReport({
      snapshotDiff: {
        key: 'snapshot-diff',
        issueTitle: 'Snapshot Diff',
        body: '<!-- detection-family: snapshot-diff -->\nbody',
        shouldOpenIssue: false,
      },
      parityRegression: {
        key: 'parity-regression',
        issueTitle: 'Parity Regression',
        body: '<!-- detection-family: parity-regression -->\nbody',
        shouldOpenIssue: false,
      },
    });
    const { github, createCalls, updateCalls, commentCalls } = createGithub([
      {
        number: 10,
        title: 'Old Parity Regression',
        body: '<!-- detection-family: parity-regression -->\nold parity body',
        state: 'open',
        updated_at: '2026-04-06T00:00:00Z',
      },
      {
        number: 11,
        title: 'Parity Regression',
        body: 'legacy duplicate without marker',
        state: 'open',
        updated_at: '2026-04-07T00:00:00Z',
      },
      {
        number: 12,
        title: 'Parity Regression',
        body: 'already closed',
        state: 'closed',
        updated_at: '2026-04-05T00:00:00Z',
      },
    ]);

    await syncDetectionIssues({ github, context, core, reportPath });

    assert.equal(createCalls.length, 0);
    assert.deepEqual(
      updateCalls,
      [
        {
          owner: 'rymetry',
          repo: 'testim-docs-ja',
          issue_number: 10,
          state: 'closed',
        },
        {
          owner: 'rymetry',
          repo: 'testim-docs-ja',
          issue_number: 11,
          state: 'closed',
        },
      ],
    );
    assert.deepEqual(commentCalls, [
      {
        owner: 'rymetry',
        repo: 'testim-docs-ja',
        issue_number: 10,
        body: 'Closing because the latest scheduled check reports no actionable or signal parity-regression file(s).',
      },
      {
        owner: 'rymetry',
        repo: 'testim-docs-ja',
        issue_number: 11,
        body: 'Closing because the latest scheduled check reports no actionable or signal parity-regression file(s).',
      },
    ]);
  });
});
