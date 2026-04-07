import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  computeSnapshotFingerprint,
  NON_ACKNOWLEDGEABLE_TYPES,
  validateAcknowledgements,
  isAcknowledgementExpired,
  findMatchingAcknowledgement,
  tagIssuesWithAcknowledgements,
} from '../lib/source_parity_acknowledgements.mjs';
import { summarizeParityResults } from '../lib/source_parity_summary.mjs';

// ---------------------------------------------------------------------------
// computeSnapshotFingerprint
// ---------------------------------------------------------------------------

describe('computeSnapshotFingerprint', () => {
  it('returns a sha256:<64 hex> string for content', () => {
    const result = computeSnapshotFingerprint('hello world');
    assert.match(result, /^sha256:[0-9a-f]{64}$/);
  });

  it('returns the same hash for the same content', () => {
    const a = computeSnapshotFingerprint('same content');
    const b = computeSnapshotFingerprint('same content');
    assert.equal(a, b);
  });

  it('returns different hashes for different content', () => {
    const a = computeSnapshotFingerprint('content A');
    const b = computeSnapshotFingerprint('content B');
    assert.notEqual(a, b);
  });

  it('handles empty string without throwing', () => {
    const result = computeSnapshotFingerprint('');
    assert.match(result, /^sha256:[0-9a-f]{64}$/);
  });
});

// ---------------------------------------------------------------------------
// NON_ACKNOWLEDGEABLE_TYPES
// ---------------------------------------------------------------------------

describe('NON_ACKNOWLEDGEABLE_TYPES', () => {
  it('contains source-page-missing-local', () => {
    assert.ok(NON_ACKNOWLEDGEABLE_TYPES.has('source-page-missing-local'));
  });

  it('contains segment-missing', () => {
    assert.ok(NON_ACKNOWLEDGEABLE_TYPES.has('segment-missing'));
  });

  it('contains segment-untranslated', () => {
    assert.ok(NON_ACKNOWLEDGEABLE_TYPES.has('segment-untranslated'));
  });

  it('contains segment-token-gap', () => {
    assert.ok(NON_ACKNOWLEDGEABLE_TYPES.has('segment-token-gap'));
  });

  it('does NOT contain paragraph-count-mismatch', () => {
    assert.ok(!NON_ACKNOWLEDGEABLE_TYPES.has('paragraph-count-mismatch'));
  });
});

// ---------------------------------------------------------------------------
// validateAcknowledgements
// ---------------------------------------------------------------------------

const VALID_FINGERPRINT = 'sha256:' + 'a'.repeat(64);

const validEntry = {
  slug: 'overview/testim-overview',
  issueType: 'paragraph-count-mismatch',
  detailIncludes: 'セクション #1',
  sourceFingerprint: VALID_FINGERPRINT,
  reason: 'EN/JA structure difference',
  owner: 'rymetry',
  reviewAfter: '2026-07-06',
};

describe('validateAcknowledgements', () => {
  it('accepts a valid acknowledgements object', () => {
    const parsed = { schemaVersion: 1, entries: [validEntry] };
    const result = validateAcknowledgements(parsed);
    assert.equal(result, parsed);
  });

  it('throws on missing schemaVersion', () => {
    assert.throws(
      () => validateAcknowledgements({ entries: [] }),
      /schemaVersion/,
    );
  });

  it('throws on unsupported schemaVersion', () => {
    assert.throws(
      () => validateAcknowledgements({ schemaVersion: 2, entries: [] }),
      /schemaVersion/,
    );
  });

  it('throws on missing entries array', () => {
    assert.throws(
      () => validateAcknowledgements({ schemaVersion: 1 }),
      /entries/,
    );
  });

  it('throws on non-acknowledgeable issueType (source-page-missing-local)', () => {
    const entry = { ...validEntry, issueType: 'source-page-missing-local' };
    assert.throws(
      () => validateAcknowledgements({ schemaVersion: 1, entries: [entry] }),
      /cannot be acknowledged/,
    );
  });

  it('throws when neither detailIncludes nor detailRegex is specified', () => {
    const { detailIncludes: _removed, ...entry } = validEntry;
    assert.throws(
      () => validateAcknowledgements({ schemaVersion: 1, entries: [entry] }),
      /detailIncludes.*detailRegex|detailRegex.*detailIncludes/,
    );
  });

  it('throws on invalid detailRegex', () => {
    const entry = { ...validEntry, detailRegex: '[invalid(regex' };
    assert.throws(
      () => validateAcknowledgements({ schemaVersion: 1, entries: [entry] }),
      /detailRegex/,
    );
  });

  it('throws on invalid sourceFingerprint format', () => {
    const entry = { ...validEntry, sourceFingerprint: 'notafingerprint' };
    assert.throws(
      () => validateAcknowledgements({ schemaVersion: 1, entries: [entry] }),
      /sourceFingerprint/,
    );
  });

  it('throws on invalid reviewAfter date', () => {
    const entry = { ...validEntry, reviewAfter: 'not-a-date' };
    assert.throws(
      () => validateAcknowledgements({ schemaVersion: 1, entries: [entry] }),
      /reviewAfter/,
    );
  });

  it('throws on non-zero-padded reviewAfter (e.g. 2026-7-6)', () => {
    // Lexicographic comparison breaks for unpadded dates, so reject them outright.
    const entry = { ...validEntry, reviewAfter: '2026-7-6' };
    assert.throws(
      () => validateAcknowledgements({ schemaVersion: 1, entries: [entry] }),
      /reviewAfter.*YYYY-MM-DD/,
    );
  });

  it('throws on reviewAfter with extra characters (e.g. 2026-07-06T12:00:00Z)', () => {
    const entry = { ...validEntry, reviewAfter: '2026-07-06T12:00:00Z' };
    assert.throws(
      () => validateAcknowledgements({ schemaVersion: 1, entries: [entry] }),
      /reviewAfter.*YYYY-MM-DD/,
    );
  });

  it('throws on unknown issueType (typo detection)', () => {
    const entry = { ...validEntry, issueType: 'paragraph-count-missmatch' };
    assert.throws(
      () => validateAcknowledgements({ schemaVersion: 1, entries: [entry] }),
      /unknown issueType/,
    );
  });

  it('throws on nonexistent calendar date (e.g. 2026-02-31)', () => {
    // Date.parse accepts '2026-02-31' and normalizes it to March 3,
    // which would silently shift expiry semantics. We must round-trip validate.
    const entry = { ...validEntry, reviewAfter: '2026-02-31' };
    assert.throws(
      () => validateAcknowledgements({ schemaVersion: 1, entries: [entry] }),
      /reviewAfter.*not a valid calendar date/,
    );
  });

  it('throws on nonexistent calendar date (e.g. 2026-13-01)', () => {
    const entry = { ...validEntry, reviewAfter: '2026-13-01' };
    assert.throws(
      () => validateAcknowledgements({ schemaVersion: 1, entries: [entry] }),
      /reviewAfter.*not a valid calendar date/,
    );
  });

  it('accepts leap day 2024-02-29 (valid)', () => {
    const entry = { ...validEntry, reviewAfter: '2024-02-29' };
    const result = validateAcknowledgements({ schemaVersion: 1, entries: [entry] });
    assert.equal(result.entries.length, 1);
  });

  it('throws on non-leap-year Feb 29 (2025-02-29)', () => {
    const entry = { ...validEntry, reviewAfter: '2025-02-29' };
    assert.throws(
      () => validateAcknowledgements({ schemaVersion: 1, entries: [entry] }),
      /reviewAfter.*not a valid calendar date/,
    );
  });

  it('throws on missing slug', () => {
    const { slug: _removed, ...entry } = validEntry;
    assert.throws(
      () => validateAcknowledgements({ schemaVersion: 1, entries: [entry] }),
      /slug/,
    );
  });

  it('throws on missing issueType', () => {
    const { issueType: _removed, ...entry } = validEntry;
    assert.throws(
      () => validateAcknowledgements({ schemaVersion: 1, entries: [entry] }),
      /issueType/,
    );
  });

  it('throws on missing sourceFingerprint', () => {
    const { sourceFingerprint: _removed, ...entry } = validEntry;
    assert.throws(
      () => validateAcknowledgements({ schemaVersion: 1, entries: [entry] }),
      /sourceFingerprint/,
    );
  });

  it('throws on missing reason', () => {
    const { reason: _removed, ...entry } = validEntry;
    assert.throws(
      () => validateAcknowledgements({ schemaVersion: 1, entries: [entry] }),
      /reason/,
    );
  });

  it('throws on missing owner', () => {
    const { owner: _removed, ...entry } = validEntry;
    assert.throws(
      () => validateAcknowledgements({ schemaVersion: 1, entries: [entry] }),
      /owner/,
    );
  });

  it('throws on missing reviewAfter', () => {
    const { reviewAfter: _removed, ...entry } = validEntry;
    assert.throws(
      () => validateAcknowledgements({ schemaVersion: 1, entries: [entry] }),
      /reviewAfter/,
    );
  });

  it('accepts entry with detailRegex instead of detailIncludes', () => {
    const { detailIncludes: _removed, ...entry } = validEntry;
    const entryWithRegex = { ...entry, detailRegex: 'セクション #\\d+' };
    const result = validateAcknowledgements({ schemaVersion: 1, entries: [entryWithRegex] });
    assert.ok(result.entries[0].detailRegex);
  });

  it('accepts empty entries array', () => {
    const result = validateAcknowledgements({ schemaVersion: 1, entries: [] });
    assert.deepEqual(result.entries, []);
  });
});

// ---------------------------------------------------------------------------
// isAcknowledgementExpired
// ---------------------------------------------------------------------------

const FP = 'sha256:' + 'a'.repeat(64);
const FP_OTHER = 'sha256:' + 'b'.repeat(64);

describe('isAcknowledgementExpired', () => {
  const entry = { sourceFingerprint: FP, reviewAfter: '2026-06-01' };

  it('returns not expired when fingerprint matches and today is before reviewAfter', () => {
    const result = isAcknowledgementExpired(entry, FP, '2026-05-01');
    assert.deepEqual(result, { expired: false });
  });

  it('returns not expired ON reviewAfter date itself (inclusive)', () => {
    const result = isAcknowledgementExpired(entry, FP, '2026-06-01');
    assert.deepEqual(result, { expired: false });
  });

  it('returns expired with fingerprint-changed when fingerprints differ', () => {
    const result = isAcknowledgementExpired(entry, FP_OTHER, '2026-05-01');
    assert.deepEqual(result, { expired: true, reason: 'fingerprint-changed' });
  });

  it('returns expired with no-snapshot when currentSnapshotFingerprint is null', () => {
    const result = isAcknowledgementExpired(entry, null, '2026-05-01');
    assert.deepEqual(result, { expired: true, reason: 'no-snapshot' });
  });

  it('returns expired with review-date-passed when today is after reviewAfter', () => {
    const result = isAcknowledgementExpired(entry, FP, '2026-06-02');
    assert.deepEqual(result, { expired: true, reason: 'review-date-passed' });
  });

  it('uses lexicographic YYYY-MM-DD comparison (timezone-independent / UTC)', () => {
    // The caller passes UTC `today` (new Date().toISOString().slice(0, 10));
    // reviewAfter is strict YYYY-MM-DD. Both sides are timezone-independent
    // strings, so comparison must never cross over due to local-time nuance.
    const e = { sourceFingerprint: FP, reviewAfter: '2026-06-01' };
    assert.deepEqual(isAcknowledgementExpired(e, FP, '2026-06-01'), { expired: false });
    assert.deepEqual(isAcknowledgementExpired(e, FP, '2025-12-31'), { expired: false });
    assert.deepEqual(
      isAcknowledgementExpired(e, FP, '2026-06-02'),
      { expired: true, reason: 'review-date-passed' },
    );
    // With the strict YYYY-MM-DD regex the old lexicographic bug is gone too:
    // unpadded inputs are rejected at validation, so comparison is stable.
  });

  it('fingerprint check takes precedence over date check', () => {
    const result = isAcknowledgementExpired(entry, FP_OTHER, '2026-06-02');
    assert.deepEqual(result, { expired: true, reason: 'fingerprint-changed' });
  });
});

// ---------------------------------------------------------------------------
// findMatchingAcknowledgement
// ---------------------------------------------------------------------------

describe('findMatchingAcknowledgement', () => {
  const ackEntry = {
    slug: 'overview/testim-overview',
    issueType: 'paragraph-count-mismatch',
    detailIncludes: 'セクション #1',
    sourceFingerprint: FP,
    reason: 'EN/JA structure difference',
    owner: 'rymetry',
    reviewAfter: '2099-01-01',
  };

  it('returns match when slug + type + detailIncludes all match', () => {
    const issue = { type: 'paragraph-count-mismatch', detail: 'セクション #1 has 3 vs 2' };
    const result = findMatchingAcknowledgement(
      'overview/testim-overview',
      issue,
      [ackEntry],
      FP,
      '2026-04-06',
    );
    assert.ok(result !== null);
    assert.equal(result.entry, ackEntry);
    assert.equal(result.expired, false);
    assert.equal(result.expiryReason, null);
  });

  it('returns null when slug does not match', () => {
    const issue = { type: 'paragraph-count-mismatch', detail: 'セクション #1 has 3 vs 2' };
    const result = findMatchingAcknowledgement(
      'other/slug',
      issue,
      [ackEntry],
      FP,
      '2026-04-06',
    );
    assert.equal(result, null);
  });

  it('returns null when issueType does not match', () => {
    const issue = { type: 'heading-count-mismatch', detail: 'セクション #1 has 3 vs 2' };
    const result = findMatchingAcknowledgement(
      'overview/testim-overview',
      issue,
      [ackEntry],
      FP,
      '2026-04-06',
    );
    assert.equal(result, null);
  });

  it('returns null when detail does not contain detailIncludes', () => {
    const issue = { type: 'paragraph-count-mismatch', detail: 'セクション #99 has 3 vs 2' };
    const result = findMatchingAcknowledgement(
      'overview/testim-overview',
      issue,
      [ackEntry],
      FP,
      '2026-04-06',
    );
    assert.equal(result, null);
  });

  it('returns match with expired=true when fingerprint changed', () => {
    const issue = { type: 'paragraph-count-mismatch', detail: 'セクション #1 has 3 vs 2' };
    const result = findMatchingAcknowledgement(
      'overview/testim-overview',
      issue,
      [ackEntry],
      FP_OTHER,
      '2026-04-06',
    );
    assert.ok(result !== null);
    assert.equal(result.expired, true);
    assert.equal(result.expiryReason, 'fingerprint-changed');
  });

  it('returns null for empty entries', () => {
    const issue = { type: 'paragraph-count-mismatch', detail: 'セクション #1 has 3 vs 2' };
    const result = findMatchingAcknowledgement(
      'overview/testim-overview',
      issue,
      [],
      FP,
      '2026-04-06',
    );
    assert.equal(result, null);
  });

  it('supports detailRegex matching', () => {
    const regexEntry = { ...ackEntry, detailRegex: 'セクション #\\d+', detailIncludes: undefined };
    const issue = { type: 'paragraph-count-mismatch', detail: 'セクション #42 has 3 vs 2' };
    const result = findMatchingAcknowledgement(
      'overview/testim-overview',
      issue,
      [regexEntry],
      FP,
      '2026-04-06',
    );
    assert.ok(result !== null);
    assert.equal(result.entry, regexEntry);
  });

  it('falls back to issue.text when issue.detail is absent', () => {
    const issue = { type: 'paragraph-count-mismatch', text: 'セクション #1 has 3 vs 2' };
    const result = findMatchingAcknowledgement(
      'overview/testim-overview',
      issue,
      [ackEntry],
      FP,
      '2026-04-06',
    );
    assert.ok(result !== null);
  });
});

// ---------------------------------------------------------------------------
// tagIssuesWithAcknowledgements
// ---------------------------------------------------------------------------

describe('tagIssuesWithAcknowledgements', () => {
  const ackEntry = {
    slug: 'overview/testim-overview',
    issueType: 'paragraph-count-mismatch',
    detailIncludes: 'セクション #1',
    sourceFingerprint: FP,
    reason: 'EN/JA structure difference',
    owner: 'rymetry',
    reviewAfter: '2099-01-01',
  };

  const matchingIssue = {
    type: 'paragraph-count-mismatch',
    detail: 'セクション #1 has 3 vs 2',
  };

  const unmatchedIssue = {
    type: 'heading-count-mismatch',
    detail: 'heading differs',
  };

  it('tags matching issue with acknowledged metadata', () => {
    const result = tagIssuesWithAcknowledgements(
      'overview/testim-overview',
      [matchingIssue],
      [ackEntry],
      FP,
      '2026-04-06',
    );
    assert.equal(result.length, 1);
    assert.equal(result[0].acknowledged, true);
    assert.equal(result[0].ackReason, 'EN/JA structure difference');
    assert.equal(result[0].ackOwner, 'rymetry');
    assert.equal(result[0].ackReviewAfter, '2099-01-01');
    assert.equal(result[0].ackExpired, false);
    assert.ok(!('ackExpiryReason' in result[0]));
  });

  it('does not modify unmatched issues (no acknowledged field)', () => {
    const result = tagIssuesWithAcknowledgements(
      'overview/testim-overview',
      [unmatchedIssue],
      [ackEntry],
      FP,
      '2026-04-06',
    );
    assert.equal(result.length, 1);
    assert.ok(!('acknowledged' in result[0]));
  });

  it('tags expired acknowledgement with ackExpired=true and ackExpiryReason', () => {
    const result = tagIssuesWithAcknowledgements(
      'overview/testim-overview',
      [matchingIssue],
      [ackEntry],
      FP_OTHER,
      '2026-04-06',
    );
    assert.equal(result[0].ackExpired, true);
    assert.equal(result[0].ackExpiryReason, 'fingerprint-changed');
  });

  it('preserves all original issue fields', () => {
    const issue = { type: 'paragraph-count-mismatch', detail: 'セクション #1 has 3 vs 2', extra: 42 };
    const result = tagIssuesWithAcknowledgements(
      'overview/testim-overview',
      [issue],
      [ackEntry],
      FP,
      '2026-04-06',
    );
    assert.equal(result[0].type, 'paragraph-count-mismatch');
    assert.equal(result[0].detail, 'セクション #1 has 3 vs 2');
    assert.equal(result[0].extra, 42);
  });

  it('returns empty array for empty issues', () => {
    const result = tagIssuesWithAcknowledgements(
      'overview/testim-overview',
      [],
      [ackEntry],
      FP,
      '2026-04-06',
    );
    assert.deepEqual(result, []);
  });

  it('returns original issues when entries empty (no acknowledged field)', () => {
    const result = tagIssuesWithAcknowledgements(
      'overview/testim-overview',
      [matchingIssue],
      [],
      FP,
      '2026-04-06',
    );
    assert.equal(result.length, 1);
    assert.ok(!('acknowledged' in result[0]));
  });

  it('does not mutate original issues array', () => {
    const originalIssues = [matchingIssue];
    const originalRef = originalIssues[0];
    tagIssuesWithAcknowledgements(
      'overview/testim-overview',
      originalIssues,
      [ackEntry],
      FP,
      '2026-04-06',
    );
    assert.equal(originalIssues[0], originalRef);
    assert.ok(!('acknowledged' in originalRef));
  });
});

// ---------------------------------------------------------------------------
// summarizeParityResults — acknowledgement counting
// ---------------------------------------------------------------------------

describe('summarizeParityResults — acknowledgement counting', () => {
  it('counts acknowledged issues separately', () => {
    const results = [
      {
        file: 'test.md',
        issues: [
          { type: 'bullet-count-mismatch', severity: 'signal', acknowledged: true, ackExpired: false },
          { type: 'untranslated', severity: 'actionable' },
        ],
      },
    ];
    const summary = summarizeParityResults(results);
    assert.equal(summary.totalIssues, 2);
    assert.equal(summary.acknowledgedIssues, 1);
    assert.equal(summary.activeFiles, 1);
  });

  it('counts expired acknowledgements as active (not acknowledged)', () => {
    const results = [
      {
        file: 'test.md',
        issues: [
          { type: 'bullet-count-mismatch', severity: 'signal', acknowledged: true, ackExpired: true },
        ],
      },
    ];
    const summary = summarizeParityResults(results);
    assert.equal(summary.acknowledgedIssues, 0);
    assert.equal(summary.expiredAcknowledgements, 1);
    assert.equal(summary.activeFiles, 1);
  });

  it('returns activeFiles=0 when all issues are validly acknowledged', () => {
    const results = [
      {
        file: 'test.md',
        issues: [
          { type: 'paragraph-count-mismatch', severity: 'signal', acknowledged: true, ackExpired: false },
        ],
      },
    ];
    const summary = summarizeParityResults(results);
    assert.equal(summary.activeFiles, 0);
    assert.equal(summary.acknowledgedIssues, 1);
    assert.equal(summary.filesWithIssues, 1);
  });

  it('returns zero acknowledgement counts when no issues are acknowledged', () => {
    const results = [
      {
        file: 'test.md',
        issues: [{ type: 'untranslated', severity: 'actionable' }],
      },
    ];
    const summary = summarizeParityResults(results);
    assert.equal(summary.acknowledgedIssues, 0);
    assert.equal(summary.expiredAcknowledgements, 0);
    assert.equal(summary.activeFiles, 1);
  });

  it('counts activeActionableFiles correctly', () => {
    const results = [
      {
        file: 'test.md',
        issues: [
          { type: 'image-mismatch', severity: 'actionable', acknowledged: true, ackExpired: false },
        ],
      },
    ];
    const summary = summarizeParityResults(results);
    assert.equal(summary.activeActionableFiles, 0);
    assert.equal(summary.actionableFiles, 1);
  });

  it('counts expired actionable acknowledgement as active', () => {
    const results = [
      {
        file: 'test.md',
        issues: [
          { type: 'image-mismatch', severity: 'actionable', acknowledged: true, ackExpired: true },
        ],
      },
    ];
    const summary = summarizeParityResults(results);
    assert.equal(summary.activeActionableFiles, 1);
    assert.equal(summary.actionableFiles, 1);
    assert.equal(summary.activeFiles, 1);
  });

  it('counts activeErrorFiles separately from errorFiles', () => {
    const results = [
      {
        file: 'valid-ack.md',
        issues: [
          { type: 'source-fetch-error', severity: 'error', acknowledged: true, ackExpired: false },
        ],
      },
      {
        file: 'unack.md',
        issues: [{ type: 'source-fetch-error', severity: 'error' }],
      },
    ];
    const summary = summarizeParityResults(results);
    assert.equal(summary.errorFiles, 2);
    assert.equal(summary.activeErrorFiles, 1);
  });
});

// ---------------------------------------------------------------------------
// summarizeParityResults — baseline accounting (Phase 6A PR1)
// ---------------------------------------------------------------------------

describe('summarizeParityResults — baseline accounting', () => {
  it('counts baselined issues separately', () => {
    const results = [
      {
        file: 'a.md',
        sourceUrl: '',
        category: '',
        issues: [
          { type: 'segment-missing', severity: 'actionable', baselined: true, detail: 'x' },
          { type: 'segment-extra', severity: 'actionable', baselined: true, detail: 'y' },
          { type: 'segment-token-gap', severity: 'actionable', detail: 'z' },
        ],
      },
    ];
    const summary = summarizeParityResults(results);
    assert.equal(summary.baselinedIssues, 2);
    assert.equal(summary.baselinedFiles, 1);
    assert.deepEqual(summary.baselinedByType, {
      'segment-missing': 1,
      'segment-extra': 1,
    });
  });

  it('counts baselined inconclusive entries by category', () => {
    const results = [
      {
        file: 'a.md',
        sourceUrl: '',
        category: '',
        issues: [
          {
            type: 'segment-inconclusive',
            severity: 'actionable',
            baselined: true,
            inconclusiveCategory: 'heading-count-mismatch',
            detail: 'inc',
          },
        ],
      },
    ];
    const summary = summarizeParityResults(results);
    assert.deepEqual(summary.baselinedByInconclusiveCategory, {
      'heading-count-mismatch': 1,
    });
  });

  it('counts expired baseline entries and re-activates them in active accounting', () => {
    // Phase 7: expired baselines re-enter the gate, consistent with
    // isReportableParityIssue.  Non-expired baselines remain frozen.
    const results = [
      {
        file: 'a.md',
        sourceUrl: '',
        category: '',
        issues: [
          {
            type: 'segment-missing',
            severity: 'actionable',
            baselined: true,
            baselineExpired: true,
            detail: 'expired baseline',
          },
        ],
      },
    ];
    const summary = summarizeParityResults(results);
    assert.equal(summary.expiredBaselineEntries, 1);
    // Expired baseline is active — it shows up in the gate
    assert.equal(summary.activeFiles, 1);
    assert.equal(summary.activeActionableFiles, 1);
  });

  it('keeps non-expired baselines frozen (not active)', () => {
    const results = [
      {
        file: 'a.md',
        sourceUrl: '',
        category: '',
        issues: [
          {
            type: 'segment-missing',
            severity: 'actionable',
            baselined: true,
            detail: 'non-expired baseline',
          },
        ],
      },
    ];
    const summary = summarizeParityResults(results);
    assert.equal(summary.baselinedIssues, 1);
    assert.equal(summary.activeFiles, 0);
    assert.equal(summary.activeActionableFiles, 0);
  });

  it('reports baselinedFiles=0 when no baseline tags are present', () => {
    const results = [
      {
        file: 'a.md',
        sourceUrl: '',
        category: '',
        issues: [
          { type: 'segment-missing', severity: 'actionable', detail: 'x' },
        ],
      },
    ];
    const summary = summarizeParityResults(results);
    assert.equal(summary.baselinedIssues, 0);
    assert.equal(summary.baselinedFiles, 0);
    assert.deepEqual(summary.baselinedByType, {});
    assert.deepEqual(summary.baselinedByInconclusiveCategory, {});
    assert.equal(summary.expiredBaselineEntries, 0);
  });
});
