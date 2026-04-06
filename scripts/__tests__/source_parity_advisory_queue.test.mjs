import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  buildAdvisoryQueueIssueKey,
  buildAdvisoryReviewQueue,
  buildAdvisoryReviewScope,
  isAdvisoryReviewCandidate,
  summarizeAdvisoryReviewQueue,
} from '../lib/source_parity_advisory_queue.mjs';

describe('isAdvisoryReviewCandidate', () => {
  it('matches tokenless-near-tie segment-inconclusive issues', () => {
    assert.equal(
      isAdvisoryReviewCandidate({
        type: 'segment-inconclusive',
        inconclusiveCategory: 'tokenless-near-tie',
      }),
      true,
    );
  });

  it('rejects other inconclusive categories and issue types', () => {
    assert.equal(
      isAdvisoryReviewCandidate({
        type: 'segment-inconclusive',
        inconclusiveCategory: 'heading-count-mismatch',
      }),
      false,
    );
    assert.equal(
      isAdvisoryReviewCandidate({
        type: 'segment-missing',
        inconclusiveCategory: 'tokenless-near-tie',
      }),
      false,
    );
  });
});

describe('buildAdvisoryReviewQueue', () => {
  it('extracts and sorts tokenless-near-tie review candidates', () => {
    const queue = buildAdvisoryReviewQueue([
      {
        file: 'src/content/docs/zeta.md',
        sourceUrl: 'https://example.com/zeta',
        category: 'docs',
        issues: [
          {
            type: 'segment-inconclusive',
            severity: 'actionable',
            inconclusiveCategory: 'tokenless-near-tie',
            detail: 'zeta review',
            inconclusiveMeta: {
              leftSectionPath: 'Zeta A',
              rightSectionPath: 'Zeta B',
              currentScore: 1.2,
              swapScore: 1.21,
            },
            baselined: true,
            baselineReviewAfter: '2026-10-06',
          },
        ],
      },
      {
        file: 'src/content/docs/alpha.md',
        sourceUrl: 'https://example.com/alpha',
        category: 'docs',
        issues: [
          {
            type: 'segment-inconclusive',
            severity: 'actionable',
            inconclusiveCategory: 'tokenless-near-tie',
            detail: 'alpha review',
            inconclusiveMeta: {
              leftSectionPath: 'Alpha A',
              rightSectionPath: 'Alpha B',
              currentScore: 1.0,
              swapScore: 1.01,
            },
            baselined: false,
          },
          {
            type: 'segment-missing',
            severity: 'actionable',
            detail: 'not advisory',
          },
        ],
      },
    ]);

    assert.deepEqual(queue.map((entry) => entry.slug), ['alpha', 'zeta']);
    assert.equal(queue[0].blocking, true);
    assert.equal(queue[1].blocking, false);
    assert.equal(queue[1].issues[0].baselineReviewAfter, '2026-10-06');
    assert.equal(
      queue[0].issues[0].queueKey,
      'alpha|segment-inconclusive|category=tokenless-near-tie|pair=Alpha A=>Alpha B',
    );
    assert.equal(queue[0].issues[0].leftSectionPath, 'Alpha A');
    assert.equal(queue[0].issues[0].rightSectionPath, 'Alpha B');
    assert.equal(queue[0].issues[0].currentScore, 1.0);
    assert.equal(queue[0].issues[0].swapScore, 1.01);
  });

  it('skips files without tokenless-near-tie issues', () => {
    const queue = buildAdvisoryReviewQueue([
      {
        file: 'src/content/docs/overview/test.md',
        issues: [
          {
            type: 'segment-inconclusive',
            inconclusiveCategory: 'heading-count-mismatch',
            detail: 'not in review queue',
          },
        ],
      },
    ]);

    assert.deepEqual(queue, []);
  });
});

describe('buildAdvisoryQueueIssueKey', () => {
  it('uses structured pair metadata when available', () => {
    const key = buildAdvisoryQueueIssueKey('running-tests/scheduler', {
      type: 'segment-inconclusive',
      inconclusiveCategory: 'tokenless-near-tie',
      inconclusiveMeta: {
        leftSectionPath: 'Activate or Pause',
        rightSectionPath: 'Edit',
      },
    });
    assert.equal(
      key,
      'running-tests/scheduler|segment-inconclusive|category=tokenless-near-tie|pair=Activate or Pause=>Edit',
    );
  });

  it('falls back to slug/type/category when pair metadata is absent', () => {
    const key = buildAdvisoryQueueIssueKey('overview/changelog', {
      type: 'segment-inconclusive',
      inconclusiveCategory: 'tokenless-near-tie',
    });
    assert.equal(
      key,
      'overview/changelog|segment-inconclusive|category=tokenless-near-tie',
    );
  });
});

describe('buildAdvisoryReviewScope', () => {
  it('marks slug runs as partial queue scope', () => {
    assert.deepEqual(
      buildAdvisoryReviewScope({
        totalFiles: 288,
        checkedFiles: 1,
        slug: 'running-tests/scheduler',
      }),
      {
        type: 'slug',
        isComplete: false,
        filters: {
          slug: 'running-tests/scheduler',
          section: null,
        },
        checkedFiles: 1,
        totalFiles: 288,
      },
    );
  });

  it('marks unfiltered runs as complete queue scope', () => {
    assert.deepEqual(
      buildAdvisoryReviewScope({
        totalFiles: 288,
        checkedFiles: 288,
      }),
      {
        type: 'full',
        isComplete: true,
        filters: {
          slug: null,
          section: null,
        },
        checkedFiles: 288,
        totalFiles: 288,
      },
    );
  });
});

describe('summarizeAdvisoryReviewQueue', () => {
  it('counts queue issues and files by inconclusive category', () => {
    const summary = summarizeAdvisoryReviewQueue([
      {
        file: 'a.md',
        issues: [
          { inconclusiveCategory: 'tokenless-near-tie' },
          { inconclusiveCategory: 'tokenless-near-tie' },
        ],
      },
      {
        file: 'b.md',
        issues: [
          { inconclusiveCategory: 'tokenless-near-tie' },
        ],
      },
    ]);

    assert.deepEqual(summary, {
      advisoryQueueIssues: 3,
      advisoryQueueFiles: 2,
      advisoryQueueByCategory: {
        'tokenless-near-tie': 3,
      },
    });
  });

  it('includes scope metadata when provided', () => {
    const summary = summarizeAdvisoryReviewQueue(
      [
        {
          file: 'a.md',
          issues: [{ inconclusiveCategory: 'tokenless-near-tie' }],
        },
      ],
      buildAdvisoryReviewScope({
        totalFiles: 288,
        checkedFiles: 1,
        slug: 'running-tests/scheduler',
      }),
    );

    assert.equal(summary.advisoryQueueComplete, false);
    assert.equal(summary.advisoryQueueScopeType, 'slug');
  });
});
