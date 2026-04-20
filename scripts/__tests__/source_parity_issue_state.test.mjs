import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';

let COARSE_SIGNAL_TYPES;
let STRUCTURE_MISMATCH_TYPES;
let SOURCE_UNUSABLE_TYPES;
let ISSUE_SEVERITY;
let isCoarseAuditSignal;
let isReportableParityIssue;
let isFrozenByBaseline;
let isValidAcknowledgedIssue;
let isActiveParityIssue;
let isNonBlockingParityIssue;
let isStructureMismatchIssue;
let isSourceUnusableIssue;
let isAdvisoryOnlyParityIssue;

before(async () => {
  ({
    isCoarseAuditSignal,
    isReportableParityIssue,
    isFrozenByBaseline,
    isValidAcknowledgedIssue,
    isActiveParityIssue,
    isNonBlockingParityIssue,
    isStructureMismatchIssue,
    isSourceUnusableIssue,
    isAdvisoryOnlyParityIssue,
  } = await import('../lib/source_parity_issue_state.mjs'));
  ({
    COARSE_SIGNAL_TYPES,
    STRUCTURE_MISMATCH_TYPES,
    SOURCE_UNUSABLE_TYPES,
    ISSUE_SEVERITY,
  } = await import('../lib/source_parity_types.mjs'));
});

// COARSE_SIGNAL_TYPES allowlist contract

describe('COARSE_SIGNAL_TYPES allowlist', () => {
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

  it('does NOT include any segment-* type', () => {
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

// isCoarseAuditSignal predicate

describe('isCoarseAuditSignal', () => {
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
    // acknowledged / baselined でも coarse signal の分類は変えない。
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

// isReportableParityIssue rejects coarse audit signals

describe('isReportableParityIssue rejects coarse signals', () => {
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

  it('rejects coarse signal even when baselined: true (coarse stays non-reportable)', () => {
    assert.equal(
      isReportableParityIssue({
        type: 'heading-mismatch',
        severity: 'signal',
        baselined: true,
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

  it('still rejects baselined actionable issues (baselined === frozen in v2)', () => {
    assert.equal(
      isReportableParityIssue({
        type: 'segment-missing',
        severity: 'actionable',
        baselined: true,
      }),
      false,
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

// existing predicates remain unchanged for non-coarse issues

describe('existing predicates unchanged for non-coarse issues', () => {
  it('isFrozenByBaseline is a pure baselined-truthy check (no expiry in v2)', () => {
    assert.equal(isFrozenByBaseline({ baselined: true }), true);
    // v2: baselineExpired tag is no longer emitted. Legacy stray flags must
    // not change the result — baselined: true alone freezes the issue.
    assert.equal(
      isFrozenByBaseline({ baselined: true, baselineExpired: true }),
      true,
    );
    assert.equal(isFrozenByBaseline({ baselined: false }), false);
    assert.equal(isFrozenByBaseline({}), false);
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
    // coarse signal でも active 判定自体は変えず、後段で reportable から落とす。
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
      isNonBlockingParityIssue({ baselined: true }),
      true,
    );
    assert.equal(
      isNonBlockingParityIssue({ acknowledged: true, ackExpired: false }),
      true,
    );
    assert.equal(isNonBlockingParityIssue({}), false);
  });
});

// ---------------------------------------------------------------------------
// structure mismatch / source unusable taxonomy
// ---------------------------------------------------------------------------

describe('STRUCTURE_MISMATCH_TYPES allowlist', () => {
  it('contains exactly the 2 canonical block sequence mismatch types', () => {
    const expected = new Set([
      'section-structure-mismatch',
      'segment-order-mismatch',
    ]);
    assert.deepEqual(new Set(STRUCTURE_MISMATCH_TYPES), expected);
  });

  it('does NOT overlap with COARSE_SIGNAL_TYPES', () => {
    for (const type of STRUCTURE_MISMATCH_TYPES) {
      assert.equal(
        COARSE_SIGNAL_TYPES.has(type),
        false,
        `${type} must not be in COARSE_SIGNAL_TYPES (structure violations must be reportable)`,
      );
    }
  });

  it('does NOT overlap with SOURCE_UNUSABLE_TYPES', () => {
    for (const type of STRUCTURE_MISMATCH_TYPES) {
      assert.equal(
        SOURCE_UNUSABLE_TYPES.has(type),
        false,
        `${type} must not be in SOURCE_UNUSABLE_TYPES (translation drift vs source unusable are separate counters)`,
      );
    }
  });

  it('every type is registered in ISSUE_SEVERITY as actionable', () => {
    for (const type of STRUCTURE_MISMATCH_TYPES) {
      assert.equal(
        ISSUE_SEVERITY[type],
        'actionable',
        `${type} must be registered as actionable in ISSUE_SEVERITY`,
      );
    }
  });
});

describe('SOURCE_UNUSABLE_TYPES allowlist', () => {
  it('contains exactly the 2 source usability issue types', () => {
    const expected = new Set(['snapshot-incomplete', 'source-unusable']);
    assert.deepEqual(new Set(SOURCE_UNUSABLE_TYPES), expected);
  });

  it('does NOT overlap with COARSE_SIGNAL_TYPES', () => {
    for (const type of SOURCE_UNUSABLE_TYPES) {
      assert.equal(
        COARSE_SIGNAL_TYPES.has(type),
        false,
        `${type} must not be in COARSE_SIGNAL_TYPES (source usability must be reportable as its own family)`,
      );
    }
  });

  it('every type is registered in ISSUE_SEVERITY as actionable', () => {
    for (const type of SOURCE_UNUSABLE_TYPES) {
      assert.equal(
        ISSUE_SEVERITY[type],
        'actionable',
        `${type} must be registered as actionable in ISSUE_SEVERITY`,
      );
    }
  });
});

describe('isStructureMismatchIssue', () => {
  it('returns true for section-structure-mismatch', () => {
    assert.equal(
      isStructureMismatchIssue({
        type: 'section-structure-mismatch',
        severity: 'actionable',
      }),
      true,
    );
  });

  it('returns true for segment-order-mismatch', () => {
    assert.equal(
      isStructureMismatchIssue({
        type: 'segment-order-mismatch',
        severity: 'actionable',
      }),
      true,
    );
  });

  it('returns true ignoring ack / baseline flags (pure classification)', () => {
    assert.equal(
      isStructureMismatchIssue({
        type: 'section-structure-mismatch',
        severity: 'actionable',
        acknowledged: true,
        ackExpired: false,
      }),
      true,
    );
    assert.equal(
      isStructureMismatchIssue({
        type: 'segment-order-mismatch',
        severity: 'actionable',
        baselined: true,
      }),
      true,
    );
  });

  it('returns false for segment-* types (these are emitted by the legacy aligner)', () => {
    for (const type of ['segment-missing', 'segment-extra', 'segment-shifted']) {
      assert.equal(
        isStructureMismatchIssue({ type, severity: 'actionable' }),
        false,
        `${type} must not be classified as structure mismatch`,
      );
    }
  });

  it('returns false for coarse count heuristics', () => {
    for (const type of [
      'paragraph-count-mismatch',
      'bullet-count-mismatch',
      'heading-mismatch',
      'section-count-mismatch',
    ]) {
      assert.equal(
        isStructureMismatchIssue({ type, severity: 'signal' }),
        false,
        `${type} must not be classified as structure mismatch (still coarse)`,
      );
    }
  });

  it('returns false for source usability types', () => {
    for (const type of ['snapshot-incomplete', 'source-unusable']) {
      assert.equal(
        isStructureMismatchIssue({ type, severity: 'actionable' }),
        false,
        `${type} must not be classified as structure mismatch (source usability family)`,
      );
    }
  });

  it('returns false for null / undefined / non-issue inputs', () => {
    assert.equal(isStructureMismatchIssue(null), false);
    assert.equal(isStructureMismatchIssue(undefined), false);
    assert.equal(isStructureMismatchIssue({}), false);
    assert.equal(isStructureMismatchIssue({ type: null }), false);
  });
});

describe('isSourceUnusableIssue', () => {
  it('returns true for snapshot-incomplete', () => {
    assert.equal(
      isSourceUnusableIssue({
        type: 'snapshot-incomplete',
        severity: 'actionable',
      }),
      true,
    );
  });

  it('returns true for source-unusable', () => {
    assert.equal(
      isSourceUnusableIssue({
        type: 'source-unusable',
        severity: 'actionable',
      }),
      true,
    );
  });

  it('returns false for structure mismatch types', () => {
    for (const type of ['section-structure-mismatch', 'segment-order-mismatch']) {
      assert.equal(
        isSourceUnusableIssue({ type, severity: 'actionable' }),
        false,
        `${type} must not be classified as source unusable`,
      );
    }
  });

  it('returns false for segment-* types', () => {
    for (const type of ['segment-missing', 'segment-extra', 'segment-shifted']) {
      assert.equal(
        isSourceUnusableIssue({ type, severity: 'actionable' }),
        false,
      );
    }
  });

  it('returns false for null / undefined / non-issue inputs', () => {
    assert.equal(isSourceUnusableIssue(null), false);
    assert.equal(isSourceUnusableIssue(undefined), false);
    assert.equal(isSourceUnusableIssue({}), false);
    assert.equal(isSourceUnusableIssue({ type: null }), false);
  });
});

describe('isReportableParityIssue — structure mismatch / source unusable', () => {
  for (const type of ['section-structure-mismatch', 'segment-order-mismatch']) {
    it(`${type} is reportable when active`, () => {
      assert.equal(
        isReportableParityIssue({
          type,
          severity: 'actionable',
        }),
        true,
        `${type} must be reportable`,
      );
    });
  }

  for (const type of ['snapshot-incomplete', 'source-unusable']) {
    it(`${type} is NOT reportable`, () => {
      assert.equal(
        isReportableParityIssue({
          type,
          severity: 'actionable',
        }),
        false,
        `${type} must stay advisory`,
      );
    });
  }

  it('valid ack on a structure mismatch keeps it non-reportable (ack path wins)', () => {
    assert.equal(
      isReportableParityIssue({
        type: 'section-structure-mismatch',
        severity: 'actionable',
        acknowledged: true,
        ackExpired: false,
      }),
      false,
    );
  });

  it('frozen baseline on a structure mismatch keeps it non-reportable', () => {
    assert.equal(
      isReportableParityIssue({
        type: 'segment-order-mismatch',
        severity: 'actionable',
        baselined: true,
      }),
      false,
    );
  });

  it('expired ack on a structure mismatch IS reportable', () => {
    assert.equal(
      isReportableParityIssue({
        type: 'section-structure-mismatch',
        severity: 'actionable',
        acknowledged: true,
        ackExpired: true,
      }),
      true,
    );
  });

  it('valid ack on a source-unusable keeps it non-reportable (ack-covered)', () => {
    assert.equal(
      isReportableParityIssue({
        type: 'source-unusable',
        severity: 'actionable',
        acknowledged: true,
        ackExpired: false,
      }),
      false,
    );
  });

  it('frozen baseline on a source-unusable keeps it non-reportable (baseline-covered)', () => {
    assert.equal(
      isReportableParityIssue({
        type: 'snapshot-incomplete',
        severity: 'actionable',
        baselined: true,
      }),
      false,
    );
  });

  it('new taxonomy is NOT coarse', () => {
    for (const type of [
      'section-structure-mismatch',
      'segment-order-mismatch',
      'snapshot-incomplete',
      'source-unusable',
    ]) {
      assert.equal(
        isCoarseAuditSignal({ type, severity: 'actionable' }),
        false,
        `${type} must not be a coarse audit signal`,
      );
    }
  });
});

describe('isAdvisoryOnlyParityIssue — source unusable only', () => {

  it('returns false for active structure mismatch', () => {
    assert.equal(
      isAdvisoryOnlyParityIssue({
        type: 'section-structure-mismatch',
        severity: 'actionable',
      }),
      false,
    );
    assert.equal(
      isAdvisoryOnlyParityIssue({
        type: 'segment-order-mismatch',
        severity: 'actionable',
      }),
      false,
    );
  });

  it('returns true for active source-unusable (still advisory)', () => {
    assert.equal(
      isAdvisoryOnlyParityIssue({
        type: 'source-unusable',
        severity: 'actionable',
      }),
      true,
    );
    assert.equal(
      isAdvisoryOnlyParityIssue({
        type: 'snapshot-incomplete',
        severity: 'actionable',
      }),
      true,
    );
  });

  it('returns false for source-unusable when valid ack is present (ack path wins)', () => {
    assert.equal(
      isAdvisoryOnlyParityIssue({
        type: 'source-unusable',
        severity: 'actionable',
        acknowledged: true,
        ackExpired: false,
      }),
      false,
    );
  });

  it('returns false for source-unusable when baseline is frozen (baseline path wins)', () => {
    assert.equal(
      isAdvisoryOnlyParityIssue({
        type: 'snapshot-incomplete',
        severity: 'actionable',
        baselined: true,
      }),
      false,
    );
  });

  it('returns false for segment-* types (not in advisory scope)', () => {
    for (const type of ['segment-missing', 'segment-extra', 'segment-untranslated']) {
      assert.equal(
        isAdvisoryOnlyParityIssue({ type, severity: 'actionable' }),
        false,
      );
    }
  });

  it('returns false for null / undefined / non-issue inputs', () => {
    assert.equal(isAdvisoryOnlyParityIssue(null), false);
    assert.equal(isAdvisoryOnlyParityIssue(undefined), false);
    assert.equal(isAdvisoryOnlyParityIssue({}), false);
  });
});
