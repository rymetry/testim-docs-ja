import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';

const syncDetectionIssues = createRequire(import.meta.url)(
  '../../.github/scripts/sync-detection-issues.cjs'
);

const tmpDirs = [];

function createTempReport(report) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sync-detection-issues-'));
  tmpDirs.push(dir);
  const reportPath = path.join(dir, 'docs-actionable-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report), 'utf8');
  return reportPath;
}

function createGithub(existingIssues, options = {}) {
  const createCalls = [];
  const updateCalls = [];
  const commentCalls = [];
  let createAttempt = 0;

  return {
    github: {
      paginate: async () => existingIssues,
      rest: {
        issues: {
          listForRepo: {},
          create: async (params) => {
            createCalls.push(params);
            if (typeof options.createImpl === 'function') {
              return options.createImpl(params, createAttempt++);
            }
            createAttempt += 1;
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

  it('migrates a legacy title-only open issue to marker-based management', async () => {
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
        title: 'Parity Regression',
        body: 'legacy issue without marker',
        state: 'open',
        updated_at: '2026-04-07T00:00:00Z',
      },
    ]);

    await syncDetectionIssues({ github, context, core, reportPath });

    assert.deepEqual(createCalls, []);
    assert.deepEqual(updateCalls, [
      {
        owner: 'rymetry',
        repo: 'testim-docs-ja',
        issue_number: 10,
        title: 'Parity Regression',
        body: '<!-- detection-family: parity-regression -->\nnew parity body',
      },
    ]);
    assert.deepEqual(commentCalls, []);
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

  it('retries issue creation without labels when GitHub rejects labels', async () => {
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
    const labelError = Object.assign(new Error('Validation Failed'), {
      status: 422,
      response: {
        data: {
          errors: [{ field: 'labels' }],
        },
      },
    });
    const { github, createCalls, updateCalls, commentCalls } = createGithub([], {
      createImpl: async (_params, attempt) => {
        if (attempt === 0) throw labelError;
        return { data: { number: 1000 } };
      },
    });

    await syncDetectionIssues({ github, context, core, reportPath });

    assert.deepEqual(createCalls, [
      {
        owner: 'rymetry',
        repo: 'testim-docs-ja',
        title: 'Parity Regression',
        body: '<!-- detection-family: parity-regression -->\nnew parity body',
        labels: ['documentation', 'automated'],
      },
      {
        owner: 'rymetry',
        repo: 'testim-docs-ja',
        title: 'Parity Regression',
        body: '<!-- detection-family: parity-regression -->\nnew parity body',
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

// ---------------------------------------------------------------------------
// Phase 8 PR2: partial-run guard
// ---------------------------------------------------------------------------
//
// The Phase 8 partial-run guard refuses to sync managed GitHub issues
// from a docs-actionable-report.json that was generated by a partial
// run (--slug or --section). This prevents deep-audit and ad-hoc
// debugging runs from accidentally overwriting the managed issue body
// when their artifacts get wired into the wrong workflow step.
//
// Contract:
//   report.runScope === undefined  →  legacy report, sync as before
//   report.runScope === null       →  legacy report, sync as before
//   report.runScope.isComplete === true  →  full run, sync as before
//   report.runScope.isComplete === false →  partial run, NO-OP + warning

describe('sync-detection-issues partial-run guard (Phase 8 PR2)', () => {
  // Build a report whose 4 families ALL want to open issues. If the guard
  // is missing, this would create / update / close issues. With the
  // guard active, no GitHub mutation calls should fire when the run
  // scope is partial.
  function buildReportWantingChanges(extra = {}) {
    return {
      snapshotDiff: {
        key: 'snapshot-diff',
        issueTitle: 'Snapshot Diff',
        body: '<!-- detection-family: snapshot-diff -->\nbody',
        shouldOpenIssue: true,
      },
      parityRegression: {
        key: 'parity-regression',
        issueTitle: 'Parity Regression',
        body: '<!-- detection-family: parity-regression -->\nbody',
        shouldOpenIssue: true,
      },
      sourceSyncHealth: {
        key: 'source-sync-health',
        issueTitle: 'Source Sync Health',
        body: '<!-- detection-family: source-sync-health -->\nbody',
        shouldOpenIssue: true,
      },
      parityFollowup: {
        key: 'parity-followup',
        issueTitle: 'Parity Followup',
        body: '<!-- detection-family: parity-followup -->\nbody',
        shouldOpenIssue: true,
      },
      ...extra,
    };
  }

  it('does NOT touch GitHub when runScope.isComplete is false (slug)', async () => {
    const reportPath = createTempReport(
      buildReportWantingChanges({
        runScope: {
          type: 'slug',
          isComplete: false,
          filters: { slug: 'overview/page-a', section: null },
        },
      }),
    );
    const { github, createCalls, updateCalls, commentCalls } = createGithub([]);

    let warning = null;
    const guardCore = {
      info() {},
      warning(msg) {
        warning = msg;
      },
      error() {},
      debug() {},
    };

    await syncDetectionIssues({ github, context, core: guardCore, reportPath });

    assert.equal(createCalls.length, 0);
    assert.equal(updateCalls.length, 0);
    assert.equal(commentCalls.length, 0);
    assert.ok(warning, 'partial-run guard must emit a warning');
    assert.match(warning, /partial run/i);
  });

  it('does NOT touch GitHub when runScope.isComplete is false (section)', async () => {
    const reportPath = createTempReport(
      buildReportWantingChanges({
        runScope: {
          type: 'section',
          isComplete: false,
          filters: { slug: null, section: 'Overview' },
        },
      }),
    );
    const { github, createCalls, updateCalls, commentCalls } = createGithub([]);

    await syncDetectionIssues({ github, context, core, reportPath });

    assert.equal(createCalls.length, 0);
    assert.equal(updateCalls.length, 0);
    assert.equal(commentCalls.length, 0);
  });

  it('proceeds normally when runScope.isComplete === true', async () => {
    const reportPath = createTempReport(
      buildReportWantingChanges({
        runScope: {
          type: 'full',
          isComplete: true,
          filters: { slug: null, section: null },
        },
      }),
    );
    const { github, createCalls } = createGithub([]);

    await syncDetectionIssues({ github, context, core, reportPath });

    // All four families want changes → all four create calls fire
    assert.equal(createCalls.length, 4);
    const families = createCalls.map((call) => {
      const match = call.body?.match(/<!--\s*detection-family:\s*([a-z0-9-]+)\s*-->/);
      return match?.[1];
    });
    assert.deepEqual(new Set(families), new Set([
      'snapshot-diff',
      'parity-regression',
      'source-sync-health',
      'parity-followup',
    ]));
  });

  it('proceeds normally when runScope is null (legacy report)', async () => {
    // Backward compatibility: a docs-actionable-report.json that
    // pre-dates Phase 8 PR2 has no runScope. The guard treats this as
    // "legacy, sync as before" so existing CI runs are not broken by
    // the guard alone.
    const reportPath = createTempReport(buildReportWantingChanges({ runScope: null }));
    const { github, createCalls } = createGithub([]);

    await syncDetectionIssues({ github, context, core, reportPath });

    assert.equal(createCalls.length, 4);
  });

  it('proceeds normally when runScope is missing entirely (legacy report)', async () => {
    const reportPath = createTempReport(buildReportWantingChanges());
    const { github, createCalls } = createGithub([]);

    await syncDetectionIssues({ github, context, core, reportPath });

    assert.equal(createCalls.length, 4);
  });

  it('partial-run guard runs BEFORE listing existing issues (cheap check)', async () => {
    // The guard must be cheap: in particular it must not page through
    // every issue in the repo just to discover that it has nothing to
    // do. We assert this by making `paginate` throw — if the guard runs
    // first, the call never happens and the function returns cleanly.
    const reportPath = createTempReport(
      buildReportWantingChanges({
        runScope: {
          type: 'slug',
          isComplete: false,
          filters: { slug: 'overview/page-a', section: null },
        },
      }),
    );
    const github = {
      paginate: async () => {
        throw new Error('paginate must NOT be called for partial runs');
      },
      rest: {
        issues: {
          listForRepo: {},
          create: async () => {
            throw new Error('create must NOT be called for partial runs');
          },
          update: async () => {
            throw new Error('update must NOT be called for partial runs');
          },
          createComment: async () => {
            throw new Error('createComment must NOT be called for partial runs');
          },
        },
      },
    };

    // Should not throw — the guard short-circuits before paginate.
    await syncDetectionIssues({ github, context, core, reportPath });
  });
});
