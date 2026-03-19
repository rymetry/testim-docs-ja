import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';

let classifyDateStatus;

before(async () => {
  ({ classifyDateStatus } = await import('../check_outdated_docs.mjs'));
});

describe('classifyDateStatus', () => {
  it('treats missing local updated as an error state, not an update candidate', () => {
    const result = classifyDateStatus({
      localDate: null,
      source: {
        fetchError: null,
        resolvedSourceDate: '2025-09-19',
        exceptionApplied: false,
        sourceDateDivergence: false,
      },
    });

    assert.equal(result.status, 'missing-date');
    assert.equal(result.needsUpdate, false);
    assert.equal(result.comparisonStatus, null);
  });

  it('returns ignored-exception when the ignored source date still matches', () => {
    const result = classifyDateStatus({
      localDate: '2025-09-13',
      source: {
        fetchError: null,
        resolvedSourceDate: '2025-09-19',
        exceptionApplied: true,
        sourceDateDivergence: false,
      },
    });

    assert.equal(result.status, 'ignored-exception');
    assert.equal(result.comparisonStatus, 'outdated');
    assert.equal(result.needsUpdate, false);
  });

  it('returns outdated again when the source date advances beyond the exception', () => {
    const result = classifyDateStatus({
      localDate: '2025-09-13',
      source: {
        fetchError: null,
        resolvedSourceDate: '2025-10-01',
        exceptionApplied: false,
        sourceDateDivergence: false,
      },
    });

    assert.equal(result.status, 'outdated');
    assert.equal(result.comparisonStatus, 'outdated');
    assert.equal(result.needsUpdate, true);
    assert.equal(result.daysBehind, 18);
  });
});
