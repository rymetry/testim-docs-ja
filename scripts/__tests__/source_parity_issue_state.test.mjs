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

describe('Issue #247 PR5 — isReportableParityIssue cutover for structure mismatch', () => {
  // PR5 gate cutover: `isReportableParityIssue` の exclusion を
  // `isStructureMismatchIssue(...) || isSourceUnusableIssue(...)` から
  // `isSourceUnusableIssue(...)` のみに縮小した (§3.6)。
  //
  // 結果として:
  //   - structure mismatch (section-structure-mismatch / segment-order-
  //     mismatch) は ack / baseline で覆われていない限り reportable に
  //     昇格し、`reportableActive*` counter と gate exit code に寄与する。
  //   - source-unusable (snapshot-incomplete / source-unusable) は翻訳者
  //     責任外 (snapshot / source sync 側 debt は翻訳 PR では直せない)
  //     として引き続き advisory のまま。baseline で freeze する枠だけ
  //     提供し、exit code には寄与しない。
  //   - expired baseline が structure mismatch に付くと再点火する (通常の
  //     ack/baseline expiry セマンティクスに整合)。source-unusable は
  //     例外で、expired baseline でも reportable に昇格しない。
  //   - ack / baseline で有効に covered されている structure mismatch は
  //     引き続き非 reportable。

  // ---- structure mismatch: active → reportable に昇格 (flip) ----
  for (const type of ['section-structure-mismatch', 'segment-order-mismatch']) {
    it(`${type} is reportable when active (PR5 cutover, no ack/baseline)`, () => {
      assert.equal(
        isReportableParityIssue({
          type,
          severity: 'actionable',
        }),
        true,
        `${type} must be reportable after PR5 cutover`,
      );
    });
  }

  // ---- source unusable: 引き続き advisory (変化なし) ----
  for (const type of ['snapshot-incomplete', 'source-unusable']) {
    it(`${type} is NOT reportable (translator-out-of-scope, stays advisory after PR5)`, () => {
      assert.equal(
        isReportableParityIssue({
          type,
          severity: 'actionable',
        }),
        false,
        `${type} must stay advisory after PR5 cutover`,
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
        baselineExpired: false,
      }),
      false,
    );
  });

  it('expired baseline on a structure mismatch IS reportable (re-fire after PR5 cutover)', () => {
    // §3.6 の副作用: baseline 期限切れ → reportable に戻る (= 再レビュー
    // 要求)。この非対称性 (structure mismatch は再点火、source-unusable は
    // しない) が PR5 の新しい契約の核。
    assert.equal(
      isReportableParityIssue({
        type: 'section-structure-mismatch',
        severity: 'actionable',
        baselined: true,
        baselineExpired: true,
      }),
      true,
    );
  });

  it('expired ack on a structure mismatch IS reportable (standard ack expiry)', () => {
    // 通常の ack expiry セマンティクスが structure mismatch にも適用される
    // ことを pin。`isValidAcknowledgedIssue` は ackExpired=true で false を
    // 返すので、reportable 経路を通り抜けて true になる。
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
        baselineExpired: false,
      }),
      false,
    );
  });

  it('expired baseline on a source-unusable is STILL non-reportable (translator-out-of-scope asymmetry)', () => {
    // source-unusable の特殊ルール: 期限切れでも reportable にならない。
    // これは `isSourceUnusableIssue(issue)` 分岐が常に false を返すこと
    // から自然に出る挙動で、structure mismatch との非対称性の核心。
    assert.equal(
      isReportableParityIssue({
        type: 'source-unusable',
        severity: 'actionable',
        baselined: true,
        baselineExpired: true,
      }),
      false,
    );
  });

  it('new taxonomy is NOT coarse (isCoarseAuditSignal returns false)', () => {
    // coarse signal の分類は PR5 でも変えない。structure mismatch は
    // reportable になったが coarse には含まれない。
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

describe('Issue #247 PR5 — isAdvisoryOnlyParityIssue scope narrowed to source-unusable', () => {
  // PR5 cutover で scope を縮小 (§3.7): structure mismatch は reportable
  // に昇格したため advisory 分類から外れた。source-unusable は引き続き
  // advisory (翻訳者責任外)。
  //
  // advisory-only の意味: gate には乗らないが、`isNonBlockingIssue`
  // (baseline / ack 経路) にも属さない。CLI で `(covered by baseline/ack)`
  // と表示するのは誤りで、`(source unusable)` のような専用 suffix で
  // 表示する必要がある。

  it('returns false for active structure mismatch (PR5: reportable, not advisory)', () => {
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
        baselineExpired: false,
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
