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
  } = await import('../lib/source_parity_issue_state.mjs'));
  ({
    COARSE_SIGNAL_TYPES,
    STRUCTURE_MISMATCH_TYPES,
    SOURCE_UNUSABLE_TYPES,
    ISSUE_SEVERITY,
  } = await import('../lib/source_parity_types.mjs'));
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

// ---------------------------------------------------------------------------
// Issue #247 PR1: new taxonomy — structure mismatch / source unusable
// ---------------------------------------------------------------------------

describe('Issue #247 PR1 — STRUCTURE_MISMATCH_TYPES allowlist', () => {
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

describe('Issue #247 PR1 — SOURCE_UNUSABLE_TYPES allowlist', () => {
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

describe('Issue #247 PR1 — isStructureMismatchIssue', () => {
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
        baselineExpired: false,
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

describe('Issue #247 PR1 — isSourceUnusableIssue', () => {
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

describe('Issue #247 PR2 — isReportableParityIssue excludes new taxonomy until PR4 cutover', () => {
  // PR2 で structure-mismatch / source-unusable の emission を入れたが、
  // gate cutover (= `reportableActive*` への組み込み) は Issue #247 の
  // PR 分割案で PR4 の責務になっている。
  //
  // PR2 時点で gate に載せると、PR1 で `BASELINE_ELIGIBLE_TYPES` に新 type
  // を入れていない (PR5 で wiring 予定) ため、既存の segment-* drift で
  // baseline されているページが PR2 から structure-mismatch を emit した
  // 瞬間に gate exit 1 でブロックされる。これを避けるため `isReportable
  // ParityIssue` で新 type を gate 経路から明示的に exclude する。
  //
  // PR4 の cutover では `source_parity_issue_state.mjs::isReportable
  // ParityIssue` の `if (isStructureMismatchIssue(...) || isSourceUnusable
  // Issue(...)) return false;` を削除するだけで、structure mismatch が
  // `reportableActive*` に流れ込む。それまでは独立 counter
  // (`structureMismatchIssues` / `snapshotUnusableIssues`) からだけ参照
  // される構造化 advisory として動く。
  //
  // 注意 — ack / baseline 周りのテストは、新 type の述語がまだ実運用
  // フロー上では到達しない (loader が reject する) が、forward-compatible
  // に「ack/baseline ロジックを通っても結果が一貫する」ことを pin する。

  for (const type of [
    'section-structure-mismatch',
    'segment-order-mismatch',
    'snapshot-incomplete',
    'source-unusable',
  ]) {
    it(`${type} is NOT reportable in PR2 even when active (gate cutover deferred to PR4)`, () => {
      assert.equal(
        isReportableParityIssue({
          type,
          severity: 'actionable',
        }),
        false,
        `${type} must not be reportable until PR4 cutover`,
      );
    });
  }

  it('valid ack on a structure mismatch keeps it non-reportable (ack already covered the gate exclusion)', () => {
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
    // baseline が新 type に付くのは PR5 以降だが、述語が forward-
    // compatible に動くことを pin。
    assert.equal(
      isReportableParityIssue({
        type: 'segment-order-mismatch',
        severity: 'actionable',
        baselined: true,
        baselineExpired: false,
      }),
      false,
    );
  });

  it('expired baseline on a structure mismatch is STILL non-reportable in PR2 (gate cutover is PR4)', () => {
    // PR4 では「baseline 期限切れ → 再点火」だが、PR2 時点では gate
    // cutover 自体が未実施なので、期限切れも reportable にならない。
    // PR4 でこのテストを「true 期待」に flip する。
    assert.equal(
      isReportableParityIssue({
        type: 'section-structure-mismatch',
        severity: 'actionable',
        baselined: true,
        baselineExpired: true,
      }),
      false,
    );
  });

  it('new taxonomy is NOT coarse (isCoarseAuditSignal returns false)', () => {
    // coarse signal とは別経路で gate exclusion されている点を pin。
    // PR4 でこの分類は変えず、isReportableParityIssue 側だけ flip する。
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
