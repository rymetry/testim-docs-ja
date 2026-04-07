import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';

let COARSE_SIGNAL_TYPES;
let isCoarseAuditSignal;
let isReportableParityIssue;
let isFrozenByBaseline;
let isValidAcknowledgedIssue;
let isActiveParityIssue;
let isNonBlockingParityIssue;

before(async () => {
  ({
    isCoarseAuditSignal,
    isReportableParityIssue,
    isFrozenByBaseline,
    isValidAcknowledgedIssue,
    isActiveParityIssue,
    isNonBlockingParityIssue,
  } = await import('../lib/source_parity_issue_state.mjs'));
  ({ COARSE_SIGNAL_TYPES } = await import('../lib/source_parity_types.mjs'));
});

// ---------------------------------------------------------------------------
// Phase 8: COARSE_SIGNAL_TYPES allowlist contract
// ---------------------------------------------------------------------------

describe('Phase 8 — COARSE_SIGNAL_TYPES allowlist', () => {
  it('contains exactly the 9 demoted coarse signal types', () => {
    const expected = new Set([
      'paragraph-count-mismatch',
      'bullet-count-mismatch',
      'step-count-mismatch',
      'section-count-mismatch',
      'heading-mismatch',
      'table-shape-mismatch',
      'table-cell-english-residual',
      'table-cell-empty-mismatch',
      'table-cell-token-mismatch',
    ]);
    assert.deepEqual(new Set(COARSE_SIGNAL_TYPES), expected);
  });

  it('does NOT include missing-snapshot (gate signal for new pages)', () => {
    assert.equal(COARSE_SIGNAL_TYPES.has('missing-snapshot'), false);
  });

  it('does NOT include source-snapshot-missing (gate signal for missing fetches)', () => {
    assert.equal(COARSE_SIGNAL_TYPES.has('source-snapshot-missing'), false);
  });

  it('does NOT include content-root-missing (no live emitter)', () => {
    // content-root-missing is declared in ISSUE_SEVERITY but has no emitter.
    // Phase 8 keeps it untouched rather than including it in the allowlist.
    assert.equal(COARSE_SIGNAL_TYPES.has('content-root-missing'), false);
  });

  it('does NOT include any segment-* type (Phase 5/6A primary gate)', () => {
    for (const type of [
      'segment-missing',
      'segment-extra',
      'segment-shifted',
      'segment-untranslated',
      'segment-token-gap',
      'segment-inconclusive',
    ]) {
      assert.equal(
        COARSE_SIGNAL_TYPES.has(type),
        false,
        `${type} must NOT be in COARSE_SIGNAL_TYPES`,
      );
    }
  });

  it('does NOT include actionable mismatch types (image/codeblock/order/nesting)', () => {
    for (const type of [
      'image-mismatch',
      'codeblock-mismatch',
      'image-order-mismatch',
      'callout-nesting-mismatch',
      'untranslated',
      'legacy-callout',
      'jsx-callout',
      'h1-in-body',
    ]) {
      assert.equal(
        COARSE_SIGNAL_TYPES.has(type),
        false,
        `${type} must NOT be in COARSE_SIGNAL_TYPES`,
      );
    }
  });
});

// ---------------------------------------------------------------------------
// Phase 8: isCoarseAuditSignal predicate
// ---------------------------------------------------------------------------

describe('Phase 8 — isCoarseAuditSignal', () => {
  it('returns true for paragraph-count-mismatch', () => {
    assert.equal(
      isCoarseAuditSignal({ type: 'paragraph-count-mismatch', severity: 'signal' }),
      true,
    );
  });

  it('returns true for table-cell-token-mismatch', () => {
    assert.equal(
      isCoarseAuditSignal({ type: 'table-cell-token-mismatch', severity: 'signal' }),
      true,
    );
  });

  it('returns true ignoring severity field', () => {
    // The predicate is type-only; severity is irrelevant.
    assert.equal(
      isCoarseAuditSignal({ type: 'heading-mismatch', severity: 'actionable' }),
      true,
    );
  });

  it('returns true ignoring acknowledged / baselined flags', () => {
    // Phase 8 intent: even acked / baselined coarse signals are still
    // classified as audit signals (so the gate never re-lights on them).
    assert.equal(
      isCoarseAuditSignal({
        type: 'bullet-count-mismatch',
        severity: 'signal',
        acknowledged: true,
        ackExpired: true,
      }),
      true,
    );
    assert.equal(
      isCoarseAuditSignal({
        type: 'step-count-mismatch',
        severity: 'signal',
        baselined: true,
        baselineExpired: true,
      }),
      true,
    );
  });

  it('returns false for missing-snapshot (still a gate signal)', () => {
    assert.equal(
      isCoarseAuditSignal({ type: 'missing-snapshot', severity: 'signal' }),
      false,
    );
  });

  it('returns false for source-snapshot-missing', () => {
    assert.equal(
      isCoarseAuditSignal({ type: 'source-snapshot-missing', severity: 'signal' }),
      false,
    );
  });

  it('returns false for segment-* types', () => {
    for (const type of [
      'segment-missing',
      'segment-extra',
      'segment-shifted',
      'segment-untranslated',
      'segment-token-gap',
      'segment-inconclusive',
    ]) {
      assert.equal(
        isCoarseAuditSignal({ type, severity: 'actionable' }),
        false,
        `${type} must not be a coarse audit signal`,
      );
    }
  });

  it('returns false for image-mismatch and codeblock-mismatch', () => {
    assert.equal(
      isCoarseAuditSignal({ type: 'image-mismatch', severity: 'actionable' }),
      false,
    );
    assert.equal(
      isCoarseAuditSignal({ type: 'codeblock-mismatch', severity: 'actionable' }),
      false,
    );
  });

  it('returns false for null / undefined / non-issue inputs', () => {
    assert.equal(isCoarseAuditSignal(null), false);
    assert.equal(isCoarseAuditSignal(undefined), false);
    assert.equal(isCoarseAuditSignal({}), false);
    assert.equal(isCoarseAuditSignal({ type: null }), false);
  });
});

// ---------------------------------------------------------------------------
// Phase 8: isReportableParityIssue rejects coarse audit signals
// ---------------------------------------------------------------------------

describe('Phase 8 — isReportableParityIssue rejects coarse signals', () => {
  it('rejects plain coarse signal (no ack, no baseline)', () => {
    assert.equal(
      isReportableParityIssue({
        type: 'paragraph-count-mismatch',
        severity: 'signal',
      }),
      false,
    );
  });

  it('rejects coarse signal even when acknowledged is expired', () => {
    assert.equal(
      isReportableParityIssue({
        type: 'paragraph-count-mismatch',
        severity: 'signal',
        acknowledged: true,
        ackExpired: true,
      }),
      false,
    );
  });

  it('rejects coarse signal even when baseline is expired', () => {
    assert.equal(
      isReportableParityIssue({
        type: 'heading-mismatch',
        severity: 'signal',
        baselined: true,
        baselineExpired: true,
      }),
      false,
    );
  });

  it('still accepts non-coarse actionable issues (image-mismatch)', () => {
    assert.equal(
      isReportableParityIssue({
        type: 'image-mismatch',
        severity: 'actionable',
      }),
      true,
    );
  });

  it('still accepts segment-missing with no ack/baseline', () => {
    assert.equal(
      isReportableParityIssue({
        type: 'segment-missing',
        severity: 'actionable',
      }),
      true,
    );
  });

  it('still rejects valid (non-expired) ack on actionable issues', () => {
    assert.equal(
      isReportableParityIssue({
        type: 'image-mismatch',
        severity: 'actionable',
        acknowledged: true,
        ackExpired: false,
      }),
      false,
    );
  });

  it('still rejects non-expired baseline on actionable issues', () => {
    assert.equal(
      isReportableParityIssue({
        type: 'segment-missing',
        severity: 'actionable',
        baselined: true,
        baselineExpired: false,
      }),
      false,
    );
  });

  it('still accepts expired baseline on non-coarse actionable issues (refire)', () => {
    assert.equal(
      isReportableParityIssue({
        type: 'segment-missing',
        severity: 'actionable',
        baselined: true,
        baselineExpired: true,
      }),
      true,
    );
  });

  it('still rejects unknown severity', () => {
    assert.equal(
      isReportableParityIssue({
        type: 'image-mismatch',
        severity: 'unknown',
      }),
      false,
    );
  });

  it('still accepts missing-snapshot (gate signal — not in allowlist)', () => {
    assert.equal(
      isReportableParityIssue({
        type: 'missing-snapshot',
        severity: 'signal',
      }),
      true,
    );
  });
});

// ---------------------------------------------------------------------------
// Phase 8: existing predicates remain unchanged for non-coarse issues
// ---------------------------------------------------------------------------

describe('Phase 8 — existing predicates unchanged for non-coarse issues', () => {
  it('isFrozenByBaseline stays the same', () => {
    assert.equal(
      isFrozenByBaseline({ baselined: true, baselineExpired: false }),
      true,
    );
    assert.equal(
      isFrozenByBaseline({ baselined: true, baselineExpired: true }),
      false,
    );
    assert.equal(isFrozenByBaseline({ baselined: false }), false);
  });

  it('isValidAcknowledgedIssue stays the same', () => {
    assert.equal(
      isValidAcknowledgedIssue({ acknowledged: true, ackExpired: false }),
      true,
    );
    assert.equal(
      isValidAcknowledgedIssue({ acknowledged: true, ackExpired: true }),
      false,
    );
  });

  it('isActiveParityIssue stays the same', () => {
    // isActiveParityIssue is defined as the negation of isValidAcknowledgedIssue;
    // Phase 8 does NOT reroute it through coarse-signal demotion. Coarse signals
    // are still "active" from this predicate's standpoint — they are filtered
    // later by isReportableParityIssue.
    assert.equal(
      isActiveParityIssue({ type: 'paragraph-count-mismatch' }),
      true,
    );
    assert.equal(
      isActiveParityIssue({
        type: 'paragraph-count-mismatch',
        acknowledged: true,
        ackExpired: false,
      }),
      false,
    );
  });

  it('isNonBlockingParityIssue stays the same', () => {
    assert.equal(
      isNonBlockingParityIssue({ baselined: true, baselineExpired: false }),
      true,
    );
    assert.equal(
      isNonBlockingParityIssue({ acknowledged: true, ackExpired: false }),
      true,
    );
    assert.equal(isNonBlockingParityIssue({}), false);
  });
});
