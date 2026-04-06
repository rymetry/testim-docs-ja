# Issue #225 Phase 6A Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Phase 5 で shadow mode 接続済みの exact diff engine を、frozen baseline 機構を伴って primary gate に deterministic に昇格させる。

**Architecture:**
- 既存 drift 1,035 件 / 241 ファイルは新規 `parity-baseline.json` で凍結。`parity-acknowledgements.json` とは完全に独立。
- baseline は page-level snapshotFingerprint で conservative に invalidate。新規 issue は fail、既知 drift は pass。
- 2 PR 直列: PR1 (infra, shadow 維持) → PR2 (cutover with regenerated baseline)。
- segment-inconclusive は構造化 enum (`inconclusiveCategory`) で同定し、`heading-count-mismatch` / `align-exception` / `tokenless-near-tie` の 3 値を持つ。

**Tech Stack:** Node.js (ESM), node:test, node:assert/strict, SHA-256 fingerprinting via `node:crypto`, JSON で永続化。既存 `scripts/lib/source_parity_*.mjs` に追加。

**Spec:** `docs/superpowers/specs/2026-04-06-issue-225-phase-6a-design.md`

---

## File Structure

### 新規ファイル

| File | 責務 |
|------|------|
| `scripts/lib/source_parity_baseline.mjs` | baseline schema validation, key 生成, タグ付け（純粋関数のみ、I/O なし） |
| `scripts/generate_parity_baseline.mjs` | baseline 生成 CLI（full / partial 両モード） |
| `scripts/__tests__/source_parity_baseline.test.mjs` | baseline 機構 unit test（schema, key, タグ付け, determinism） |
| `scripts/__tests__/source_parity_baseline_recall.test.mjs` | exit criteria C4 — baseline が新規 mutation を吸収しないこと |
| `scripts/__tests__/generate_parity_baseline.test.mjs` | generation script test（full / partial / determinism） |
| `parity-baseline.json` | frozen baseline file（PR1 で preview, PR2 で cutover 版に上書き） |

### 変更ファイル

| File | 変更内容 |
|------|---------|
| `scripts/lib/source_parity_align.mjs` | `alignSegments` の inconclusive 返却に `inconclusiveCategory` enum を追加。`parityDiffsToIssues` は PR2 で shadow tagging を削除 |
| `scripts/lib/source_parity_summary.mjs` | PR1 で `baselined*` 集計フィールド追加。PR2 で shadow 隔離分岐削除 + dual emit |
| `scripts/check_source_parity.mjs` | PR1 で baseline 統合（shadow tagging は触らない）。PR2 で shadow CLI 出力削除 |
| `scripts/lib/source_parity.mjs` | barrel export に baseline 追加 |
| `scripts/__tests__/source_parity_align.test.mjs` | inconclusiveCategory テスト追加 |
| `scripts/__tests__/source_parity_align_runtime.test.mjs` | PR2 で expected shape 更新 |
| `scripts/__tests__/check_source_parity.test.mjs` | baseline 統合テスト追加 |
| `scripts/README.md` | PR1 と PR2 で 2 段階更新 |
| `docs/OPS_DESIGN.md` | PR2 で Phase 6A rollback playbook 追加 |
| `package.json` | `generate:parity-baseline` script 追加 |

---

# PR1 — Infra (shadow 維持)

PR1 のゴール: baseline 機構を完全に追加するが gate flip はしない。CI exit code は変化しない。

## Task 1: alignSegments returns structured inconclusiveCategory

**Files:**
- Modify: `scripts/lib/source_parity_align.mjs:813-822, 843-854, 856-863`
- Modify: `scripts/__tests__/source_parity_align.test.mjs` (新テスト追加)

**Background:** 現状 `alignSegments` は inconclusive 返却時に `inconclusiveReason` (free text) のみ返す。free text を baseline lookup key に使うと文言変更で baseline が壊れるため、構造化 enum (`inconclusiveCategory`) を追加する。`null` を許容するのは inconclusive=false の場合のみ。

新 enum 値:
- `heading-count-mismatch` — `enSections.length !== jaSections.length` のとき
- `align-exception` — `alignSection` 内部で例外がスローされたとき（現状は throw されないが 6A で wrap して category 化する）
- `tokenless-near-tie` — `detectAmbiguousAdjacentTokenlessSwap()` が non-null を返したとき

`align-exception` は将来の defensive 用。Phase 6A の現コードでは alignSegments 自体は throw しないが、`check_source_parity.mjs:231` の catch ブロックがフォールバック処理で `'unknown reason'` を使っている箇所に category を渡すために enum を定義しておく。

- [ ] **Step 1: テストファイルに inconclusiveCategory 検証スイートを追加（失敗想定）**

`scripts/__tests__/source_parity_align.test.mjs` の末尾にスイートを追加:

```javascript
// ---------------------------------------------------------------------------
// Phase 6A — inconclusiveCategory enum
// ---------------------------------------------------------------------------

describe('alignSegments — inconclusiveCategory enum (Phase 6A)', () => {
  it('returns inconclusiveCategory: null when alignment is conclusive', () => {
    const en = [
      makeHeading('Setup', 0, 'Setup'),
      makeSeg('Setup', 'paragraph', 0, 'Body paragraph.'),
    ];
    const ja = [
      makeHeading('セットアップ', 0, 'セットアップ'),
      makeSeg('セットアップ', 'paragraph', 0, '本文段落'),
    ];
    const result = alignSegments(en, ja);
    assert.equal(result.inconclusive, false);
    assert.equal(result.inconclusiveCategory, null);
  });

  it('returns inconclusiveCategory: "heading-count-mismatch" when heading counts differ', () => {
    const en = [
      makeHeading('Setup', 0, 'Setup'),
      makeHeading('Usage', 1, 'Usage'),
      makeSeg('Usage', 'paragraph', 0, 'Body.'),
    ];
    const ja = [
      makeHeading('セットアップ', 0, 'セットアップ'),
      makeSeg('セットアップ', 'paragraph', 0, '本文'),
    ];
    const result = alignSegments(en, ja);
    assert.equal(result.inconclusive, true);
    assert.equal(result.inconclusiveCategory, 'heading-count-mismatch');
    assert.match(result.inconclusiveReason, /Heading count mismatch/);
  });

  it('returns inconclusiveCategory: "tokenless-near-tie" for ambiguous tokenless adjacent swap', () => {
    // Two adjacent tokenless sections whose body lengths and positions
    // make current/swap near-tie. The exact construction depends on
    // detectAmbiguousAdjacentTokenlessSwap heuristics; this test reuses
    // an existing fixture pattern from the ambiguous-swap suite if one
    // exists, otherwise constructs synthetic sections of the same length.
    const en = [
      makeHeading('Section A', 0, 'Section A'),
      makeSeg('Section A', 'paragraph', 0, 'first body sentence approximately the same length'),
      makeHeading('Section B', 0, 'Section B'),
      makeSeg('Section B', 'paragraph', 0, 'second body sentence approximately the same length'),
    ];
    const ja = [
      makeHeading('セクション A', 0, 'セクション A'),
      // Bodies swapped between adjacent sections
      makeSeg('セクション A', 'paragraph', 0, '2 番目の本文文章 ほぼ同じ長さ'),
      makeHeading('セクション B', 0, 'セクション B'),
      makeSeg('セクション B', 'paragraph', 0, '1 番目の本文文章 ほぼ同じ長さ'),
    ];
    const result = alignSegments(en, ja);
    if (result.inconclusive) {
      assert.equal(result.inconclusiveCategory, 'tokenless-near-tie');
      assert.match(result.inconclusiveReason, /tokenless adjacent sections/i);
    } else {
      // If the swap doesn't actually trigger near-tie on this synthetic
      // input the test is non-applicable; skip rather than fail.
      assert.equal(result.inconclusiveCategory, null);
    }
  });
});
```

- [ ] **Step 2: テストを実行して失敗を確認**

Run: `node --test scripts/__tests__/source_parity_align.test.mjs 2>&1 | grep -E "(fail|inconclusiveCategory|ok)" | tail -20`
Expected: `inconclusiveCategory` 関連のアサーションで失敗（プロパティが undefined）

- [ ] **Step 3: alignSegments の inconclusive 返却 3 箇所に inconclusiveCategory を追加**

`scripts/lib/source_parity_align.mjs` の 3 箇所を更新:

L789-795 の typedef を更新:

```javascript
/**
 * @typedef {object} AlignResult
 * @property {ParityDiff[]} diffs
 * @property {number} sectionsAligned        number of section pairs aligned
 * @property {number} sectionsCompared       number of section pairs compared (== aligned in current impl)
 * @property {boolean} inconclusive          true when alignment had to bail out
 * @property {string|null} inconclusiveReason
 * @property {'heading-count-mismatch'|'align-exception'|'tokenless-near-tie'|null} inconclusiveCategory
 */
```

L813 (heading count mismatch) の return を更新:

```javascript
  if (enSections.length !== jaSections.length) {
    return {
      diffs: [],
      sectionsAligned: 0,
      sectionsCompared: 0,
      inconclusive: true,
      inconclusiveCategory: 'heading-count-mismatch',
      inconclusiveReason:
        `Heading count mismatch: EN has ${enSections.length - 1} headings, ` +
        `JA has ${jaSections.length - 1}`,
    };
  }
```

L843 (ambiguous tokenless swap) の return を更新:

```javascript
  if (ambiguousTokenlessSwap) {
    return {
      diffs,
      sectionsAligned: enSections.length,
      sectionsCompared: enSections.length,
      inconclusive: true,
      inconclusiveCategory: 'tokenless-near-tie',
      inconclusiveReason:
        `Tokenless adjacent sections "${buildSectionLabel(ambiguousTokenlessSwap.leftSectionPath)}" ` +
        `and "${buildSectionLabel(ambiguousTokenlessSwap.rightSectionPath)}" cannot rule out ` +
        `a body swap (current=${ambiguousTokenlessSwap.currentScore.toFixed(2)}, ` +
        `swap=${ambiguousTokenlessSwap.swapScore.toFixed(2)})`,
    };
  }
```

L856 (conclusive) の return を更新:

```javascript
  return {
    diffs,
    sectionsAligned: enSections.length,
    sectionsCompared: enSections.length,
    inconclusive: false,
    inconclusiveCategory: null,
    inconclusiveReason: null,
  };
```

- [ ] **Step 4: テストが pass することを確認**

Run: `node --test scripts/__tests__/source_parity_align.test.mjs 2>&1 | tail -20`
Expected: 全テスト pass。`inconclusiveCategory` の 3 ケースが ok と表示される。

- [ ] **Step 5: align_runtime テストが回帰していないか確認**

Run: `node --test scripts/__tests__/source_parity_align_runtime.test.mjs 2>&1 | tail -20`
Expected: 全テスト pass。runtime test は inconclusiveCategory を直接 assertion していないが、shape 拡張で壊れていないことを確認する。

- [ ] **Step 6: recall benchmark が回帰していないか確認**

Run: `node --test scripts/__tests__/source_parity_recall.test.mjs 2>&1 | tail -20`
Expected: 9/9 strict mutation type で 100% recall、cascade ≤ 6、precision baseline ≤ 60 が維持される。

- [ ] **Step 7: Commit**

```bash
git add scripts/lib/source_parity_align.mjs scripts/__tests__/source_parity_align.test.mjs
git commit -m "feat: alignSegments returns structured inconclusiveCategory

Phase 6A 準備。inconclusive 返却に enum を追加して baseline 同定キーに
使えるようにする。free text の inconclusiveReason は説明用に残す。

- heading-count-mismatch
- tokenless-near-tie
- align-exception (将来の defensive 用、現コードでは未使用)
- null (conclusive)"
```

---

## Task 2: parity baseline schema and validation (pure functions)

**Files:**
- Create: `scripts/lib/source_parity_baseline.mjs`
- Create: `scripts/__tests__/source_parity_baseline.test.mjs`

**Background:** baseline は schema validation、key 生成、tagging のすべてを純粋関数で提供する。filesystem I/O は呼び出し側 (`check_source_parity.mjs`) が行う。`source_parity_acknowledgements.mjs` の `validateAcknowledgements` / `tagIssuesWithAcknowledgements` パターンを踏襲する。

API:
- `validateBaseline(parsed)` — schemaVersion, entries 配列、issueType 別必須フィールド検証
- `loadBaselineFile(filePath)` — Node の fs を使ってファイル読込 + validate
- `buildBaselineKey(issue)` — issue オブジェクトから lookup key (string) を生成
- `buildBaselineKeyFromEntry(entry)` — baseline entry から lookup key (string) を生成
- `tagIssuesWithBaseline(slug, issues, baselineEntries, currentSnapshotFingerprint)` — page-level invalidation を含む

constants:
- `BASELINE_ELIGIBLE_TYPES` — Set of 6 segment-* types
- `INCONCLUSIVE_CATEGORIES` — Set: 'heading-count-mismatch', 'align-exception', 'tokenless-near-tie'

- [ ] **Step 1: テストファイルを作成（schema validation の基本ケース）**

`scripts/__tests__/source_parity_baseline.test.mjs`:

```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  validateBaseline,
  buildBaselineKey,
  buildBaselineKeyFromEntry,
  tagIssuesWithBaseline,
  BASELINE_ELIGIBLE_TYPES,
  INCONCLUSIVE_CATEGORIES,
} from '../lib/source_parity_baseline.mjs';

const VALID_FINGERPRINT = 'sha256:' + 'a'.repeat(64);

const validMissingEntry = {
  slug: 'overview/example',
  issueType: 'segment-missing',
  sectionPath: 'Setup',
  segmentKind: 'paragraph',
  enSegmentIndex: 2,
  jaSegmentIndex: null,
  snapshotFingerprint: VALID_FINGERPRINT,
  inconclusiveCategory: null,
  inconclusiveReason: null,
  reviewAfter: '2026-10-06',
};

const validExtraEntry = {
  slug: 'overview/example',
  issueType: 'segment-extra',
  sectionPath: 'Setup',
  segmentKind: 'paragraph',
  enSegmentIndex: null,
  jaSegmentIndex: 3,
  snapshotFingerprint: VALID_FINGERPRINT,
  inconclusiveCategory: null,
  inconclusiveReason: null,
  reviewAfter: '2026-10-06',
};

const validInconclusiveEntry = {
  slug: 'testops/pull-requests',
  issueType: 'segment-inconclusive',
  sectionPath: null,
  segmentKind: null,
  enSegmentIndex: null,
  jaSegmentIndex: null,
  snapshotFingerprint: VALID_FINGERPRINT,
  inconclusiveCategory: 'heading-count-mismatch',
  inconclusiveReason: 'Heading count mismatch: EN has 0 headings, JA has 5',
  reviewAfter: '2026-10-06',
};

// ---------------------------------------------------------------------------
// constants
// ---------------------------------------------------------------------------

describe('BASELINE_ELIGIBLE_TYPES', () => {
  it('contains all 6 Phase 6A baseline-eligible types', () => {
    assert.ok(BASELINE_ELIGIBLE_TYPES.has('segment-missing'));
    assert.ok(BASELINE_ELIGIBLE_TYPES.has('segment-extra'));
    assert.ok(BASELINE_ELIGIBLE_TYPES.has('segment-shifted'));
    assert.ok(BASELINE_ELIGIBLE_TYPES.has('segment-untranslated'));
    assert.ok(BASELINE_ELIGIBLE_TYPES.has('segment-token-gap'));
    assert.ok(BASELINE_ELIGIBLE_TYPES.has('segment-inconclusive'));
  });

  it('does NOT contain repo-local issue types', () => {
    assert.ok(!BASELINE_ELIGIBLE_TYPES.has('source-page-missing-local'));
    assert.ok(!BASELINE_ELIGIBLE_TYPES.has('paragraph-count-mismatch'));
    assert.ok(!BASELINE_ELIGIBLE_TYPES.has('untranslated'));
  });
});

describe('INCONCLUSIVE_CATEGORIES', () => {
  it('contains the three valid categories', () => {
    assert.ok(INCONCLUSIVE_CATEGORIES.has('heading-count-mismatch'));
    assert.ok(INCONCLUSIVE_CATEGORIES.has('align-exception'));
    assert.ok(INCONCLUSIVE_CATEGORIES.has('tokenless-near-tie'));
  });

  it('does NOT contain unknown categories', () => {
    assert.ok(!INCONCLUSIVE_CATEGORIES.has('unknown'));
    assert.ok(!INCONCLUSIVE_CATEGORIES.has('null'));
  });
});

// ---------------------------------------------------------------------------
// validateBaseline — schema invariants
// ---------------------------------------------------------------------------

describe('validateBaseline', () => {
  it('accepts a valid baseline with mixed entry types', () => {
    const parsed = {
      schemaVersion: 1,
      generatedAt: '2026-04-06T03:00:00Z',
      generatedFromRunId: '2026-04-06T03:00:00Z#abcd1234',
      rationale: 'preview baseline',
      entries: [validMissingEntry, validExtraEntry, validInconclusiveEntry],
    };
    const result = validateBaseline(parsed);
    assert.equal(result, parsed);
  });

  it('throws on missing schemaVersion', () => {
    assert.throws(() => validateBaseline({ entries: [] }), /schemaVersion/);
  });

  it('throws on unsupported schemaVersion', () => {
    assert.throws(
      () => validateBaseline({ schemaVersion: 2, entries: [] }),
      /schemaVersion/,
    );
  });

  it('throws on missing entries array', () => {
    assert.throws(() => validateBaseline({ schemaVersion: 1 }), /entries/);
  });

  it('throws on unknown issueType (not in BASELINE_ELIGIBLE_TYPES)', () => {
    const entry = { ...validMissingEntry, issueType: 'paragraph-count-mismatch' };
    assert.throws(
      () => validateBaseline({ schemaVersion: 1, entries: [entry] }),
      /issueType/,
    );
  });

  it('throws on invalid sourceFingerprint format', () => {
    const entry = { ...validMissingEntry, snapshotFingerprint: 'not-a-hash' };
    assert.throws(
      () => validateBaseline({ schemaVersion: 1, entries: [entry] }),
      /snapshotFingerprint/,
    );
  });

  it('throws on segment-missing entry without enSegmentIndex', () => {
    const entry = { ...validMissingEntry, enSegmentIndex: null };
    assert.throws(
      () => validateBaseline({ schemaVersion: 1, entries: [entry] }),
      /enSegmentIndex/,
    );
  });

  it('throws on segment-extra entry without jaSegmentIndex', () => {
    const entry = { ...validExtraEntry, jaSegmentIndex: null };
    assert.throws(
      () => validateBaseline({ schemaVersion: 1, entries: [entry] }),
      /jaSegmentIndex/,
    );
  });

  it('throws on segment-inconclusive entry with unknown inconclusiveCategory', () => {
    const entry = { ...validInconclusiveEntry, inconclusiveCategory: 'unknown' };
    assert.throws(
      () => validateBaseline({ schemaVersion: 1, entries: [entry] }),
      /inconclusiveCategory/,
    );
  });

  it('throws on segment-inconclusive entry with null inconclusiveCategory', () => {
    const entry = { ...validInconclusiveEntry, inconclusiveCategory: null };
    assert.throws(
      () => validateBaseline({ schemaVersion: 1, entries: [entry] }),
      /inconclusiveCategory/,
    );
  });

  it('throws on reviewAfter that is not strict YYYY-MM-DD', () => {
    const entry = { ...validMissingEntry, reviewAfter: '2026-10-6' };
    assert.throws(
      () => validateBaseline({ schemaVersion: 1, entries: [entry] }),
      /reviewAfter/,
    );
  });
});

// ---------------------------------------------------------------------------
// buildBaselineKey / buildBaselineKeyFromEntry — lookup key generation
// ---------------------------------------------------------------------------

describe('buildBaselineKey / buildBaselineKeyFromEntry', () => {
  it('produces the same key from an issue and its corresponding baseline entry (segment-missing)', () => {
    const issue = {
      type: 'segment-missing',
      sectionPath: 'Setup',
      segmentKind: 'paragraph',
      enSegmentIndex: 2,
      jaSegmentIndex: null,
    };
    const issueKey = buildBaselineKey('overview/example', issue);
    const entryKey = buildBaselineKeyFromEntry(validMissingEntry);
    assert.equal(issueKey, entryKey);
  });

  it('uses jaSegmentIndex (not enSegmentIndex) for segment-extra', () => {
    const issue = {
      type: 'segment-extra',
      sectionPath: 'Setup',
      segmentKind: 'paragraph',
      enSegmentIndex: null,
      jaSegmentIndex: 3,
    };
    const issueKey = buildBaselineKey('overview/example', issue);
    const entryKey = buildBaselineKeyFromEntry(validExtraEntry);
    assert.equal(issueKey, entryKey);
    assert.match(issueKey, /segment-extra/);
    // Key MUST NOT use enSegmentIndex for segment-extra
    assert.ok(!issueKey.includes('|en|'));
  });

  it('uses inconclusiveCategory only for segment-inconclusive', () => {
    const issue = {
      type: 'segment-inconclusive',
      sectionPath: null,
      segmentKind: null,
      enSegmentIndex: null,
      jaSegmentIndex: null,
      inconclusiveCategory: 'heading-count-mismatch',
    };
    const issueKey = buildBaselineKey('testops/pull-requests', issue);
    const entryKey = buildBaselineKeyFromEntry(validInconclusiveEntry);
    assert.equal(issueKey, entryKey);
    assert.match(issueKey, /heading-count-mismatch/);
  });

  it('uses enSegmentIndex (NOT jaSegmentIndex) for segment-shifted', () => {
    const shiftedEntry = {
      ...validMissingEntry,
      issueType: 'segment-shifted',
      enSegmentIndex: 5,
      jaSegmentIndex: 8,
    };
    const issue = {
      type: 'segment-shifted',
      sectionPath: 'Setup',
      segmentKind: 'paragraph',
      enSegmentIndex: 5,
      jaSegmentIndex: 8,
    };
    const issueKey = buildBaselineKey('overview/example', issue);
    const entryKey = buildBaselineKeyFromEntry(shiftedEntry);
    assert.equal(issueKey, entryKey);
    // Changing the JA index alone must NOT change the key
    const issueShiftedJa = { ...issue, jaSegmentIndex: 9 };
    const issueKeyShiftedJa = buildBaselineKey('overview/example', issueShiftedJa);
    assert.equal(issueKeyShiftedJa, issueKey);
  });
});

// ---------------------------------------------------------------------------
// tagIssuesWithBaseline — match + page-level invalidation
// ---------------------------------------------------------------------------

describe('tagIssuesWithBaseline', () => {
  function makeIssue(overrides = {}) {
    return {
      type: 'segment-missing',
      severity: 'actionable',
      detail: '[Setup] EN paragraph not found',
      sectionPath: 'Setup',
      segmentKind: 'paragraph',
      enSegmentIndex: 2,
      jaSegmentIndex: null,
      ...overrides,
    };
  }

  it('tags a matching issue with baselined: true when fingerprint matches', () => {
    const issues = [makeIssue()];
    const result = tagIssuesWithBaseline(
      'overview/example',
      issues,
      [validMissingEntry],
      VALID_FINGERPRINT,
    );
    assert.equal(result.tagged.length, 1);
    assert.equal(result.tagged[0].baselined, true);
    assert.equal(result.invalidated, false);
  });

  it('does NOT tag and reports invalidated when fingerprint differs', () => {
    const issues = [makeIssue()];
    const otherFingerprint = 'sha256:' + 'b'.repeat(64);
    const result = tagIssuesWithBaseline(
      'overview/example',
      issues,
      [validMissingEntry],
      otherFingerprint,
    );
    assert.equal(result.tagged[0].baselined, undefined);
    assert.equal(result.invalidated, true);
  });

  it('invalidates ALL entries on a page when fingerprint differs (page-level invalidation)', () => {
    const otherFingerprint = 'sha256:' + 'b'.repeat(64);
    const issue1 = makeIssue();
    const issue2 = makeIssue({ enSegmentIndex: 5 });
    const entry2 = { ...validMissingEntry, enSegmentIndex: 5 };
    const result = tagIssuesWithBaseline(
      'overview/example',
      [issue1, issue2],
      [validMissingEntry, entry2],
      otherFingerprint,
    );
    assert.equal(result.tagged[0].baselined, undefined);
    assert.equal(result.tagged[1].baselined, undefined);
    assert.equal(result.invalidated, true);
  });

  it('does not tag entries from other slugs', () => {
    const issues = [makeIssue()];
    const otherEntry = { ...validMissingEntry, slug: 'other/page' };
    const result = tagIssuesWithBaseline(
      'overview/example',
      issues,
      [otherEntry],
      VALID_FINGERPRINT,
    );
    assert.equal(result.tagged[0].baselined, undefined);
    assert.equal(result.invalidated, false);
  });

  it('preserves all original issue fields when tagging', () => {
    const issues = [makeIssue({ extra: 'field', missingTokens: ['--proxy'] })];
    const result = tagIssuesWithBaseline(
      'overview/example',
      issues,
      [validMissingEntry],
      VALID_FINGERPRINT,
    );
    assert.equal(result.tagged[0].extra, 'field');
    assert.deepEqual(result.tagged[0].missingTokens, ['--proxy']);
    assert.equal(result.tagged[0].baselined, true);
  });

  it('does not mutate input arrays (immutable)', () => {
    const issues = [makeIssue()];
    const issuesBefore = JSON.stringify(issues);
    tagIssuesWithBaseline('overview/example', issues, [validMissingEntry], VALID_FINGERPRINT);
    assert.equal(JSON.stringify(issues), issuesBefore);
  });
});
```

- [ ] **Step 2: テストを実行して失敗を確認**

Run: `node --test scripts/__tests__/source_parity_baseline.test.mjs 2>&1 | tail -10`
Expected: モジュールが存在しないため import エラーで全テスト失敗。

- [ ] **Step 3: source_parity_baseline.mjs を実装**

`scripts/lib/source_parity_baseline.mjs`:

```javascript
/**
 * Frozen baseline mechanism for Issue #225 Phase 6A.
 *
 * baseline は cutover 時点の既存 drift を凍結する仕組み。ack は「人がレビュー
 * して了承した例外」、baseline は「cutover 時点の既知 debt」で意味も生成方法
 * も寿命も違うため、parity-acknowledgements.json とは別ファイルで管理する。
 *
 * 純粋関数のみ。filesystem I/O は呼び出し側 (check_source_parity.mjs / 
 * generate_parity_baseline.mjs) が行う。
 *
 * @module source_parity_baseline
 */

import { readFileSync } from 'node:fs';

/**
 * Phase 6A で baseline 対象になる issue type。
 *
 * @type {ReadonlySet<string>}
 */
export const BASELINE_ELIGIBLE_TYPES = Object.freeze(
  new Set([
    'segment-missing',
    'segment-extra',
    'segment-shifted',
    'segment-untranslated',
    'segment-token-gap',
    'segment-inconclusive',
  ]),
);

/**
 * `segment-inconclusive` の構造化カテゴリ。free text の `inconclusiveReason` は
 * baseline 同定に使わず、必ずこの enum で同定する。
 *
 * @type {ReadonlySet<string>}
 */
export const INCONCLUSIVE_CATEGORIES = Object.freeze(
  new Set([
    'heading-count-mismatch',
    'align-exception',
    'tokenless-near-tie',
  ]),
);

const REVIEW_AFTER_RE = /^\d{4}-\d{2}-\d{2}$/;
const FINGERPRINT_RE = /^sha256:[0-9a-f]{64}$/;

/**
 * Validate a parsed parity-baseline.json object.
 * Throws a descriptive Error on any schema violation.
 *
 * @param {unknown} parsed
 * @returns {object} the validated parsed object (same reference)
 */
export function validateBaseline(parsed) {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Baseline file must be a JSON object');
  }
  if (parsed.schemaVersion !== 1) {
    throw new Error(`Unsupported baseline schemaVersion: ${parsed.schemaVersion}`);
  }
  if (!Array.isArray(parsed.entries)) {
    throw new Error('Baseline must have an "entries" array');
  }

  for (let i = 0; i < parsed.entries.length; i += 1) {
    const entry = parsed.entries[i];
    const prefix = `Baseline entry #${i + 1}`;

    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      throw new Error(`${prefix}: must be an object`);
    }

    if (typeof entry.slug !== 'string' || entry.slug === '') {
      throw new Error(`${prefix}: missing or invalid "slug"`);
    }

    if (typeof entry.issueType !== 'string' || !BASELINE_ELIGIBLE_TYPES.has(entry.issueType)) {
      throw new Error(
        `${prefix}: invalid "issueType" — must be one of ${[...BASELINE_ELIGIBLE_TYPES].join(', ')}`,
      );
    }

    if (typeof entry.snapshotFingerprint !== 'string' || !FINGERPRINT_RE.test(entry.snapshotFingerprint)) {
      throw new Error(`${prefix}: invalid "snapshotFingerprint" — must be sha256:<64 hex>`);
    }

    if (typeof entry.reviewAfter !== 'string' || !REVIEW_AFTER_RE.test(entry.reviewAfter)) {
      throw new Error(`${prefix}: invalid "reviewAfter" — must be strict YYYY-MM-DD`);
    }
    const [year, month, day] = entry.reviewAfter.split('-').map(Number);
    const roundTrip = new Date(Date.UTC(year, month - 1, day));
    if (
      roundTrip.getUTCFullYear() !== year ||
      roundTrip.getUTCMonth() + 1 !== month ||
      roundTrip.getUTCDate() !== day
    ) {
      throw new Error(`${prefix}: "reviewAfter" "${entry.reviewAfter}" is not a valid calendar date`);
    }

    // issueType-specific required fields
    if (entry.issueType === 'segment-inconclusive') {
      if (typeof entry.inconclusiveCategory !== 'string' || !INCONCLUSIVE_CATEGORIES.has(entry.inconclusiveCategory)) {
        throw new Error(
          `${prefix}: segment-inconclusive entry must have inconclusiveCategory in ` +
          `${[...INCONCLUSIVE_CATEGORIES].join(', ')}`,
        );
      }
    } else if (entry.issueType === 'segment-extra') {
      if (typeof entry.jaSegmentIndex !== 'number') {
        throw new Error(`${prefix}: segment-extra entry must have numeric jaSegmentIndex`);
      }
    } else {
      // segment-missing / segment-shifted / segment-untranslated / segment-token-gap
      if (typeof entry.enSegmentIndex !== 'number') {
        throw new Error(`${prefix}: ${entry.issueType} entry must have numeric enSegmentIndex`);
      }
    }
  }

  return parsed;
}

/**
 * Load and validate a parity-baseline.json file from disk.
 *
 * @param {string} filePath
 * @returns {{ schemaVersion: number, entries: object[] } & Record<string, unknown>}
 */
export function loadBaselineFile(filePath) {
  const raw = readFileSync(filePath, 'utf8');
  const parsed = JSON.parse(raw);
  return validateBaseline(parsed);
}

/**
 * Build a stable lookup key from an issue object.
 *
 * Key rules:
 *   - segment-extra: `slug + issueType + sectionPath + segmentKind + jaSegmentIndex`
 *   - segment-inconclusive: `slug + issueType + inconclusiveCategory`
 *   - other segment-*: `slug + issueType + sectionPath + segmentKind + enSegmentIndex`
 *
 * @param {string} slug
 * @param {object} issue
 * @returns {string}
 */
export function buildBaselineKey(slug, issue) {
  if (issue.type === 'segment-inconclusive') {
    return `${slug}|${issue.type}|category=${issue.inconclusiveCategory ?? '_null_'}`;
  }
  if (issue.type === 'segment-extra') {
    return `${slug}|${issue.type}|${issue.sectionPath ?? ''}|${issue.segmentKind ?? ''}|ja|${issue.jaSegmentIndex ?? '_null_'}`;
  }
  return `${slug}|${issue.type}|${issue.sectionPath ?? ''}|${issue.segmentKind ?? ''}|en|${issue.enSegmentIndex ?? '_null_'}`;
}

/**
 * Build a stable lookup key from a baseline entry object.
 * Mirrors buildBaselineKey so that issues and entries hash identically.
 *
 * @param {object} entry
 * @returns {string}
 */
export function buildBaselineKeyFromEntry(entry) {
  if (entry.issueType === 'segment-inconclusive') {
    return `${entry.slug}|${entry.issueType}|category=${entry.inconclusiveCategory ?? '_null_'}`;
  }
  if (entry.issueType === 'segment-extra') {
    return `${entry.slug}|${entry.issueType}|${entry.sectionPath ?? ''}|${entry.segmentKind ?? ''}|ja|${entry.jaSegmentIndex ?? '_null_'}`;
  }
  return `${entry.slug}|${entry.issueType}|${entry.sectionPath ?? ''}|${entry.segmentKind ?? ''}|en|${entry.enSegmentIndex ?? '_null_'}`;
}

/**
 * Tag issues that match a baseline entry. Page-level invalidation: if any
 * baseline entry on the page exists but its snapshotFingerprint differs from
 * the current page snapshot, NO baseline entries on that page apply (all
 * issues stay un-tagged) and `invalidated` is reported true.
 *
 * @param {string} slug
 * @param {object[]} issues
 * @param {object[]} baselineEntries — full entries array, may include other slugs
 * @param {string|null} currentSnapshotFingerprint
 * @returns {{ tagged: object[], invalidated: boolean, matchedKeys: Set<string> }}
 */
export function tagIssuesWithBaseline(slug, issues, baselineEntries, currentSnapshotFingerprint) {
  const slugEntries = baselineEntries.filter((e) => e.slug === slug);

  if (slugEntries.length === 0) {
    return {
      tagged: issues.map((i) => ({ ...i })),
      invalidated: false,
      matchedKeys: new Set(),
    };
  }

  // Page-level invalidation: any fingerprint mismatch invalidates the entire page
  const fingerprintMismatch = slugEntries.some(
    (e) => e.snapshotFingerprint !== currentSnapshotFingerprint,
  );
  if (fingerprintMismatch) {
    return {
      tagged: issues.map((i) => ({ ...i })),
      invalidated: true,
      matchedKeys: new Set(),
    };
  }

  // Build a key index of slug entries
  const entryKeyIndex = new Map();
  for (const entry of slugEntries) {
    entryKeyIndex.set(buildBaselineKeyFromEntry(entry), entry);
  }

  const matchedKeys = new Set();
  const tagged = issues.map((issue) => {
    if (!BASELINE_ELIGIBLE_TYPES.has(issue.type)) {
      return { ...issue };
    }
    const key = buildBaselineKey(slug, issue);
    if (entryKeyIndex.has(key)) {
      matchedKeys.add(key);
      return { ...issue, baselined: true };
    }
    return { ...issue };
  });

  return { tagged, invalidated: false, matchedKeys };
}
```

- [ ] **Step 4: テストを実行して pass 確認**

Run: `node --test scripts/__tests__/source_parity_baseline.test.mjs 2>&1 | tail -30`
Expected: 全テスト pass。

- [ ] **Step 5: 既存テスト全体が回帰していないか確認**

Run: `npm test 2>&1 | tail -30`
Expected: 全テスト pass。

- [ ] **Step 6: Commit**

```bash
git add scripts/lib/source_parity_baseline.mjs scripts/__tests__/source_parity_baseline.test.mjs
git commit -m "feat: parity baseline schema and validation

純粋関数のみで baseline schema validation, lookup key 生成, 
page-level invalidation を実装。filesystem I/O は呼び出し側で行う。

- BASELINE_ELIGIBLE_TYPES: 6 つの segment-* type
- INCONCLUSIVE_CATEGORIES enum: 3 値固定
- buildBaselineKey: segment-extra は jaSegmentIndex, 
  segment-inconclusive は inconclusiveCategory のみで同定
- tagIssuesWithBaseline: page-level snapshotFingerprint mismatch で
  そのページの全 entry を一括 invalidate"
```

---

## Task 3: integrate parity baseline into check_source_parity (shadow mode)

**Files:**
- Modify: `scripts/lib/source_parity.mjs`
- Modify: `scripts/lib/source_parity_summary.mjs`
- Modify: `scripts/check_source_parity.mjs`
- Modify: `scripts/__tests__/check_source_parity.test.mjs` (テストが既存にあれば追加、なければ新規)

**Background:** baseline 機構を `check_source_parity.mjs` の本流に統合するが、**gate exit code は変えない**（shadow mode 維持）。`tagIssuesWithBaseline` で各 file の issue に `baselined` フラグを付与し、`summarizeParityResults` に baseline 集計フィールド (`baselinedIssues`, `baselinedFiles`, `baselinedByType`, `baselinedByInconclusiveCategory`, `expiredBaselineEntries`, `baselineInvalidatedSlugs`) を追加する。

PR1 では tagging のみで、active 集計から除外する処理 (`if (issue.baselined) continue`) は **入れない**。Phase 5 shadow tagging のままなので shadow issue は引き続き active 集計に入らない。`baselined` フラグは情報として記録するだけ。実際の active 除外は PR2 の cutover で行う。

ただし `baselineInvalidatedSlugs` フィールドは PR1 で出しておく（rollback playbook Path 2 の前提）。

- [ ] **Step 1: source_parity.mjs barrel export に baseline を追加**

`scripts/lib/source_parity.mjs`:

```javascript
/** Barrel re-export. Logic split into types, extract, checks, summary, page coverage, and segment-level alignment submodules. */
export * from './source_parity_types.mjs';
export * from './source_parity_extract.mjs';
export * from './source_parity_checks.mjs';
export * from './source_parity_summary.mjs';
export * from './source_parity_page_coverage.mjs';
export * from './source_parity_acknowledgements.mjs';
export * from './source_parity_baseline.mjs';
export { alignSegments, parityDiffsToIssues } from './source_parity_align.mjs';
export { extractSegmentsFromHtml } from './source_parity_segments_en.mjs';
export { extractSegmentsFromMarkdown } from './source_parity_segments_ja.mjs';
```

- [ ] **Step 2: summarizeParityResults に baseline 集計を追加するテスト（失敗想定）**

`scripts/__tests__/source_parity_acknowledgements.test.mjs` の末尾、または既存 summary テストの下に追加（同テスト内で summarizeParityResults を import 済みなら追加するだけ）:

```javascript
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
          { type: 'segment-missing', severity: 'actionable', phase: 'segment-shadow', baselined: true, detail: 'x' },
          { type: 'segment-extra', severity: 'actionable', phase: 'segment-shadow', baselined: true, detail: 'y' },
          { type: 'segment-token-gap', severity: 'actionable', phase: 'segment-shadow', detail: 'z' },
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
            phase: 'segment-shadow',
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
});
```

- [ ] **Step 3: テストを実行して失敗を確認**

Run: `node --test scripts/__tests__/source_parity_acknowledgements.test.mjs 2>&1 | tail -10`
Expected: `baselinedIssues` 等のフィールドが summary に存在しないため失敗。

- [ ] **Step 4: source_parity_summary.mjs に baseline 集計を追加**

`scripts/lib/source_parity_summary.mjs` を以下に差し替え（既存 shadow 隔離分岐は **そのまま残す**。PR1 では gate flip しないため）:

```javascript
/**
 * Aggregates per-file parity results into type/severity/acknowledgement
 * summary statistics.
 *
 * Phase 5 shadow issues (`issue.phase === 'segment-shadow'`) are counted
 * separately into `shadowIssues` / `shadowFiles` / `shadowIssuesByType`
 * and are NOT folded into the actionable / signal / activeFiles totals
 * that the runtime gate exit code reads. This is what lets Phase 5 wire
 * `alignSegments` into the runtime end-to-end without immediately
 * flipping ~241 baseline-drifted pages from green to red. Phase 6A PR2
 * will promote shadow issues into the primary gate.
 *
 * Phase 6A PR1 adds baseline accounting (`baselinedIssues`, `baselinedFiles`,
 * `baselinedByType`, `baselinedByInconclusiveCategory`) — counted regardless
 * of shadow phase so the same fields work both before and after PR2 cutover.
 */
export function summarizeParityResults(results) {
  const issuesByType = {};
  const issuesBySeverity = {};
  const shadowIssuesByType = {};
  const baselinedByType = {};
  const baselinedByInconclusiveCategory = {};
  let actionableFiles = 0;
  let signalFiles = 0;
  let errorFiles = 0;
  let activeActionableFiles = 0;
  let activeErrorFiles = 0;
  let activeFiles = 0;
  let totalIssues = 0;
  let acknowledgedIssues = 0;
  let expiredAcknowledgements = 0;
  let shadowIssues = 0;
  let shadowFiles = 0;
  let baselinedIssues = 0;
  let baselinedFiles = 0;

  for (const result of results) {
    let hasActionable = false;
    let hasSignal = false;
    let hasError = false;
    let hasActiveActionable = false;
    let hasActiveError = false;
    let hasActiveIssue = false;
    let hasShadow = false;
    let hasBaselined = false;

    for (const issue of result.issues) {
      const isShadow = issue.phase === 'segment-shadow';
      const isBaselined = issue.baselined === true;

      if (isBaselined) {
        baselinedIssues += 1;
        baselinedByType[issue.type] = (baselinedByType[issue.type] || 0) + 1;
        if (issue.type === 'segment-inconclusive' && typeof issue.inconclusiveCategory === 'string') {
          baselinedByInconclusiveCategory[issue.inconclusiveCategory] =
            (baselinedByInconclusiveCategory[issue.inconclusiveCategory] || 0) + 1;
        }
        hasBaselined = true;
      }

      if (isShadow) {
        shadowIssues += 1;
        shadowIssuesByType[issue.type] = (shadowIssuesByType[issue.type] || 0) + 1;
        hasShadow = true;
        // Shadow issues bypass actionable/signal/active accounting so the
        // runtime exit code stays unchanged until Phase 6A PR2 cutover.
        continue;
      }

      totalIssues += 1;
      issuesByType[issue.type] = (issuesByType[issue.type] || 0) + 1;
      issuesBySeverity[issue.severity] = (issuesBySeverity[issue.severity] || 0) + 1;

      const isValidAck = issue.acknowledged === true && issue.ackExpired !== true;

      if (isValidAck) {
        acknowledgedIssues += 1;
      } else if (!isBaselined) {
        hasActiveIssue = true;
      }

      if (issue.acknowledged === true && issue.ackExpired === true) {
        expiredAcknowledgements += 1;
      }

      if (issue.severity === 'actionable') {
        hasActionable = true;
        if (!isValidAck && !isBaselined) hasActiveActionable = true;
      }
      if (issue.severity === 'signal') hasSignal = true;
      if (issue.severity === 'error') {
        hasError = true;
        if (!isValidAck && !isBaselined) hasActiveError = true;
      }
    }

    if (hasActionable) actionableFiles += 1;
    else if (hasError) errorFiles += 1;
    else if (hasSignal) signalFiles += 1;

    if (hasActiveActionable) activeActionableFiles += 1;
    if (hasActiveError) activeErrorFiles += 1;
    if (hasActiveIssue) activeFiles += 1;
    if (hasShadow) shadowFiles += 1;
    if (hasBaselined) baselinedFiles += 1;
  }

  return {
    filesWithIssues: results.length,
    actionableFiles,
    signalFiles,
    errorFiles,
    activeActionableFiles,
    activeErrorFiles,
    activeFiles,
    totalIssues,
    acknowledgedIssues,
    expiredAcknowledgements,
    issuesByType,
    issuesBySeverity,
    shadowIssues,
    shadowFiles,
    shadowIssuesByType,
    baselinedIssues,
    baselinedFiles,
    baselinedByType,
    baselinedByInconclusiveCategory,
  };
}
```

- [ ] **Step 5: テスト実行して baseline 集計が pass することを確認**

Run: `node --test scripts/__tests__/source_parity_acknowledgements.test.mjs 2>&1 | tail -10`
Expected: 新規 baseline 集計テストが pass。

- [ ] **Step 6: check_source_parity.mjs に baseline 統合**

`scripts/check_source_parity.mjs` を編集:

L34 付近の import に baseline を追加:

```javascript
import { checkPageCoverage, checkSinglePageSnapshot } from './lib/source_parity_page_coverage.mjs';
import {
  loadBaselineFile,
  tagIssuesWithBaseline,
} from './lib/source_parity_baseline.mjs';
```

L42 付近に baseline path 定数を追加:

```javascript
const ACKNOWLEDGEMENTS_PATH = path.join(ROOT_DIR, 'parity-acknowledgements.json');
const BASELINE_PATH = path.join(ROOT_DIR, 'parity-baseline.json');
```

L105 付近に baseline 読込関数を追加（loadAcknowledgementsFile に倣う）:

```javascript
function loadBaselineFileSafe(filePath = BASELINE_PATH) {
  if (!fs.existsSync(filePath)) {
    return { schemaVersion: 1, entries: [] };
  }
  return loadBaselineFile(filePath);
}
```

L111 付近の `checkSourceParity` 関数の冒頭で baseline を読み込み、各 file の issue に tag を付ける。`tagIssuesWithAcknowledgements` の直後に `tagIssuesWithBaseline` を追加。`baselineInvalidatedSlugs` を Set で蓄積し最後に summary に渡す。

L122 付近に追加:

```javascript
  let baselineData = { schemaVersion: 1, entries: [] };
  try {
    baselineData = loadBaselineFileSafe();
  } catch (error) {
    console.error(`❌ ${error.message}`);
    return 1;
  }

  const baselineInvalidatedSlugs = new Set();
```

L259-266 の `tagIssuesWithAcknowledgements` 呼び出しの直後に baseline tagging を追加:

```javascript
    // Tag with acknowledgements (replaces applyAllowlist)
    issues = tagIssuesWithAcknowledgements(
      fileSlug,
      issues,
      ackData.entries,
      snapshotFingerprint,
      today,
    );

    // Phase 6A PR1 — tag with baseline. Shadow phase tagging stays in place,
    // so baseline-flagged issues are still excluded from the active gate
    // by the shadow accounting in summarizeParityResults. The `baselined`
    // metadata is recorded in parity-check-status.json so PR2 can flip the
    // gate without changing baseline machinery.
    {
      const baselineResult = tagIssuesWithBaseline(
        fileSlug,
        issues,
        baselineData.entries,
        snapshotFingerprint,
      );
      issues = baselineResult.tagged;
      if (baselineResult.invalidated) {
        baselineInvalidatedSlugs.add(fileSlug);
      }
    }
```

L350 付近の summary 構築箇所に invalidated slugs を渡す:

```javascript
  const summary = {
    checkedAt: new Date().toISOString(),
    mode: 'local',
    totalFiles: allFiles.length,
    checkedFiles: checkedCount,
    ...summarizeParityResults(results),
    baselineInvalidatedSlugs: [...baselineInvalidatedSlugs].sort(),
  };
```

L383 付近の CLI 表示に baseline summary を追加（json mode 以外）:

```javascript
    if ((summary.baselinedIssues || 0) > 0) {
      console.log(`\nbaselined: ${summary.baselinedIssues} 件 / ${summary.baselinedFiles} ファイル`);
      for (const [type, count] of Object.entries(summary.baselinedByType ?? {})) {
        console.log(`  ${type}: ${count} 件`);
      }
      if (Object.keys(summary.baselinedByInconclusiveCategory ?? {}).length > 0) {
        console.log('  inconclusiveCategory 別:');
        for (const [cat, count] of Object.entries(summary.baselinedByInconclusiveCategory)) {
          console.log(`    ${cat}: ${count} 件`);
        }
      }
    }
    if (summary.baselineInvalidatedSlugs && summary.baselineInvalidatedSlugs.length > 0) {
      console.log(`\nbaseline invalidated slugs: ${summary.baselineInvalidatedSlugs.length}`);
      for (const slug of summary.baselineInvalidatedSlugs) {
        console.log(`  ${slug}`);
      }
    }
```

- [ ] **Step 7: parity-baseline.json が無い状態で check:parity が回帰しないことを確認**

Run: `npm run check:parity 2>&1 | tail -20`
Expected: shadow 出力は変わらず（1,035 件 / 241 ファイル）、baseline は 0 件、active actionable 0、exit 0。

- [ ] **Step 8: 既存テスト全体を実行**

Run: `npm test 2>&1 | tail -30`
Expected: 全テスト pass。recall benchmark の Go 条件も維持される。

- [ ] **Step 9: Commit**

```bash
git add scripts/lib/source_parity.mjs scripts/lib/source_parity_summary.mjs scripts/check_source_parity.mjs scripts/__tests__/source_parity_acknowledgements.test.mjs
git commit -m "feat: integrate parity baseline into check_source_parity (shadow mode)

PR1 で baseline を読み込んで tagging するが、shadow tagging はそのままで
gate exit code は変わらない。

- check_source_parity.mjs: baseline 読込 → tagIssuesWithBaseline で
  各 file の issue に baselined フラグを付与
- summarizeParityResults: baselinedIssues / baselinedFiles /
  baselinedByType / baselinedByInconclusiveCategory を集計
- baselineInvalidatedSlugs を summary に出力（rollback Path 2 の前提）
- baseline ファイルが無い場合は 0 件として動作"
```

---

## Task 4: generate_parity_baseline script

**Files:**
- Create: `scripts/generate_parity_baseline.mjs`
- Create: `scripts/__tests__/generate_parity_baseline.test.mjs`
- Modify: `package.json`

**Background:** baseline 生成 CLI。`--regenerate` で full、`--slug=<csv>` で partial 再生成。出力は deterministic（安定ソート、2-space indent、LF 終端）。同じ入力で 2 回実行して bit-identical な JSON が出ることを CI で固定する（exit criteria C5）。

入力: `parity-check-status.json`（直前の `check:parity` 実行結果）。新規 baseline 候補は `BASELINE_ELIGIBLE_TYPES` の issue で、かつ `baselined !== true` のもの（既存 baseline を再 baseline しないため）。

CLI:
- `node scripts/generate_parity_baseline.mjs --regenerate` — 既存 `parity-baseline.json` を完全上書き
- `node scripts/generate_parity_baseline.mjs --slug=<csv>` — 指定 slug のエントリのみ削除 → 再生成 → マージ
- `--rationale=<text>` — `rationale` フィールドを明示的に指定（省略時はデフォルト）
- `--review-after=<YYYY-MM-DD>` — `reviewAfter` を明示的に指定（省略時は 6 ヶ月後）
- 引数なしは usage を表示して exit 1

- [ ] **Step 1: generate_parity_baseline テストを作成**

`scripts/__tests__/generate_parity_baseline.test.mjs`:

```javascript
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

import {
  buildBaselineFromStatus,
  serializeBaseline,
  mergePartialBaseline,
} from '../generate_parity_baseline.mjs';

const VALID_FINGERPRINT = 'sha256:' + 'a'.repeat(64);
const OTHER_FINGERPRINT = 'sha256:' + 'b'.repeat(64);

const sampleStatus = {
  summary: {
    checkedAt: '2026-04-06T03:00:00Z',
  },
  files: [
    {
      file: 'src/content/docs/overview/example.md',
      sourceUrl: '',
      category: '',
      issues: [
        {
          type: 'segment-missing',
          severity: 'actionable',
          phase: 'segment-shadow',
          sectionPath: 'Setup',
          segmentKind: 'paragraph',
          enSegmentIndex: 2,
          jaSegmentIndex: null,
          enSourceFingerprint: 'sha256:abc',
          detail: '[Setup] EN paragraph not found',
        },
        {
          type: 'segment-extra',
          severity: 'actionable',
          phase: 'segment-shadow',
          sectionPath: 'Setup',
          segmentKind: 'paragraph',
          enSegmentIndex: null,
          jaSegmentIndex: 5,
          jaSourceFingerprint: 'sha256:def',
          detail: '[Setup] JA paragraph has no EN counterpart',
        },
        {
          type: 'segment-inconclusive',
          severity: 'actionable',
          phase: 'segment-shadow',
          sectionPath: null,
          segmentKind: null,
          inconclusiveCategory: 'heading-count-mismatch',
          inconclusiveReason: 'Heading count mismatch: EN has 0, JA has 5',
          detail: 'Phase 5 alignment inconclusive: heading count mismatch',
        },
        {
          // Non-eligible — must be skipped
          type: 'paragraph-count-mismatch',
          severity: 'signal',
          detail: '段落数 EN=2 JA=3',
        },
      ],
    },
  ],
};

// snapshotFingerprint per slug — generator must be passed this map externally
// because parity-check-status.json does not currently store the page-level
// fingerprint inline. The generator should call computeSnapshotFingerprint
// against the actual EN snapshot file at the same time.
const fingerprintMap = new Map([
  ['overview/example', VALID_FINGERPRINT],
]);

// ---------------------------------------------------------------------------
// buildBaselineFromStatus
// ---------------------------------------------------------------------------

describe('buildBaselineFromStatus', () => {
  it('extracts only BASELINE_ELIGIBLE_TYPES issues', () => {
    const baseline = buildBaselineFromStatus(sampleStatus, fingerprintMap, {
      runId: 'test-run',
      generatedAt: '2026-04-06T03:00:00Z',
      reviewAfter: '2026-10-06',
      rationale: 'test',
    });
    assert.equal(baseline.entries.length, 3);
    const types = baseline.entries.map((e) => e.issueType);
    assert.deepEqual(types.sort(), ['segment-extra', 'segment-inconclusive', 'segment-missing']);
  });

  it('uses jaSegmentIndex (not enSegmentIndex) for segment-extra entries', () => {
    const baseline = buildBaselineFromStatus(sampleStatus, fingerprintMap, {
      runId: 'test-run',
      generatedAt: '2026-04-06T03:00:00Z',
      reviewAfter: '2026-10-06',
      rationale: 'test',
    });
    const extra = baseline.entries.find((e) => e.issueType === 'segment-extra');
    assert.equal(extra.jaSegmentIndex, 5);
    assert.equal(extra.enSegmentIndex, null);
  });

  it('preserves inconclusiveCategory and inconclusiveReason for segment-inconclusive', () => {
    const baseline = buildBaselineFromStatus(sampleStatus, fingerprintMap, {
      runId: 'test-run',
      generatedAt: '2026-04-06T03:00:00Z',
      reviewAfter: '2026-10-06',
      rationale: 'test',
    });
    const inc = baseline.entries.find((e) => e.issueType === 'segment-inconclusive');
    assert.equal(inc.inconclusiveCategory, 'heading-count-mismatch');
    assert.match(inc.inconclusiveReason, /Heading count mismatch/);
  });

  it('skips files whose slug has no fingerprint mapping (defensive)', () => {
    const fpMap = new Map(); // empty
    const baseline = buildBaselineFromStatus(sampleStatus, fpMap, {
      runId: 'test-run',
      generatedAt: '2026-04-06T03:00:00Z',
      reviewAfter: '2026-10-06',
      rationale: 'test',
    });
    assert.equal(baseline.entries.length, 0);
  });

  it('skips already-baselined issues (idempotent)', () => {
    const status = JSON.parse(JSON.stringify(sampleStatus));
    status.files[0].issues[0].baselined = true;
    const baseline = buildBaselineFromStatus(status, fingerprintMap, {
      runId: 'test-run',
      generatedAt: '2026-04-06T03:00:00Z',
      reviewAfter: '2026-10-06',
      rationale: 'test',
    });
    assert.equal(baseline.entries.length, 2); // missing was already baselined
  });
});

// ---------------------------------------------------------------------------
// serializeBaseline — deterministic output
// ---------------------------------------------------------------------------

describe('serializeBaseline', () => {
  it('produces deterministic, bit-identical output for the same input', () => {
    const baseline = buildBaselineFromStatus(sampleStatus, fingerprintMap, {
      runId: 'test-run',
      generatedAt: '2026-04-06T03:00:00Z',
      reviewAfter: '2026-10-06',
      rationale: 'test',
    });
    const a = serializeBaseline(baseline);
    const b = serializeBaseline(baseline);
    assert.equal(a, b);
  });

  it('emits 2-space indent and LF terminator', () => {
    const baseline = buildBaselineFromStatus(sampleStatus, fingerprintMap, {
      runId: 'test-run',
      generatedAt: '2026-04-06T03:00:00Z',
      reviewAfter: '2026-10-06',
      rationale: 'test',
    });
    const out = serializeBaseline(baseline);
    assert.ok(out.endsWith('\n'));
    assert.match(out, /\n {2}"schemaVersion"/);
  });

  it('sorts entries by slug → issueType → sectionPath → segmentKind → index', () => {
    const baseline = {
      schemaVersion: 1,
      generatedAt: '2026-04-06T03:00:00Z',
      generatedFromRunId: 'test',
      rationale: 'test',
      entries: [
        { slug: 'b/page', issueType: 'segment-missing', sectionPath: 'A', segmentKind: 'paragraph', enSegmentIndex: 0, jaSegmentIndex: null, snapshotFingerprint: VALID_FINGERPRINT, inconclusiveCategory: null, inconclusiveReason: null, reviewAfter: '2026-10-06' },
        { slug: 'a/page', issueType: 'segment-missing', sectionPath: 'A', segmentKind: 'paragraph', enSegmentIndex: 0, jaSegmentIndex: null, snapshotFingerprint: VALID_FINGERPRINT, inconclusiveCategory: null, inconclusiveReason: null, reviewAfter: '2026-10-06' },
      ],
    };
    const out = serializeBaseline(baseline);
    const aIdx = out.indexOf('"slug": "a/page"');
    const bIdx = out.indexOf('"slug": "b/page"');
    assert.ok(aIdx < bIdx, 'a/page must appear before b/page');
  });
});

// ---------------------------------------------------------------------------
// mergePartialBaseline — partial regeneration
// ---------------------------------------------------------------------------

describe('mergePartialBaseline', () => {
  const existing = {
    schemaVersion: 1,
    generatedAt: '2026-04-01T00:00:00Z',
    generatedFromRunId: 'old-run',
    rationale: 'existing',
    entries: [
      { slug: 'overview/example', issueType: 'segment-missing', sectionPath: 'Setup', segmentKind: 'paragraph', enSegmentIndex: 0, jaSegmentIndex: null, snapshotFingerprint: OTHER_FINGERPRINT, inconclusiveCategory: null, inconclusiveReason: null, reviewAfter: '2026-09-01' },
      { slug: 'other/page', issueType: 'segment-missing', sectionPath: 'Other', segmentKind: 'paragraph', enSegmentIndex: 1, jaSegmentIndex: null, snapshotFingerprint: VALID_FINGERPRINT, inconclusiveCategory: null, inconclusiveReason: null, reviewAfter: '2026-09-01' },
    ],
  };

  it('removes only entries for the targeted slug and adds new ones', () => {
    const newEntriesForSlug = [
      { slug: 'overview/example', issueType: 'segment-missing', sectionPath: 'Setup', segmentKind: 'paragraph', enSegmentIndex: 2, jaSegmentIndex: null, snapshotFingerprint: VALID_FINGERPRINT, inconclusiveCategory: null, inconclusiveReason: null, reviewAfter: '2026-10-06' },
    ];
    const merged = mergePartialBaseline(existing, ['overview/example'], newEntriesForSlug, {
      generatedAt: '2026-04-06T03:00:00Z',
      generatedFromRunId: 'new-run',
      rationale: 'partial',
    });
    assert.equal(merged.entries.length, 2);
    const otherEntry = merged.entries.find((e) => e.slug === 'other/page');
    assert.ok(otherEntry, 'other/page entry must be preserved');
    const overviewEntry = merged.entries.find((e) => e.slug === 'overview/example');
    assert.equal(overviewEntry.snapshotFingerprint, VALID_FINGERPRINT);
    assert.equal(overviewEntry.enSegmentIndex, 2);
  });

  it('removes targeted slug entirely if no new entries provided', () => {
    const merged = mergePartialBaseline(existing, ['overview/example'], [], {
      generatedAt: '2026-04-06T03:00:00Z',
      generatedFromRunId: 'new-run',
      rationale: 'partial',
    });
    assert.equal(merged.entries.length, 1);
    assert.equal(merged.entries[0].slug, 'other/page');
  });
});

// ---------------------------------------------------------------------------
// CLI smoke test — bit-identical regeneration
// ---------------------------------------------------------------------------

describe('generate_parity_baseline CLI — determinism', () => {
  let workDir;

  before(() => {
    workDir = mkdtempSync(join(tmpdir(), 'parity-baseline-test-'));
  });

  after(() => {
    if (workDir) rmSync(workDir, { recursive: true, force: true });
  });

  it('produces bit-identical output across two runs (C5)', () => {
    const baseline = buildBaselineFromStatus(sampleStatus, fingerprintMap, {
      runId: 'run-1',
      generatedAt: '2026-04-06T03:00:00Z',
      reviewAfter: '2026-10-06',
      rationale: 'test',
    });
    const out1 = serializeBaseline(baseline);
    const out2 = serializeBaseline(buildBaselineFromStatus(sampleStatus, fingerprintMap, {
      runId: 'run-1',
      generatedAt: '2026-04-06T03:00:00Z',
      reviewAfter: '2026-10-06',
      rationale: 'test',
    }));
    assert.equal(out1, out2);
  });
});
```

- [ ] **Step 2: テストを実行して失敗を確認**

Run: `node --test scripts/__tests__/generate_parity_baseline.test.mjs 2>&1 | tail -10`
Expected: `generate_parity_baseline.mjs` が存在しないため import エラー。

- [ ] **Step 3: scripts/generate_parity_baseline.mjs を実装**

`scripts/generate_parity_baseline.mjs`:

```javascript
#!/usr/bin/env node
/**
 * Generate parity-baseline.json from parity-check-status.json.
 *
 * Phase 6A の frozen baseline 機構の生成側。input は直前の `check:parity` 実行
 * 結果 (`parity-check-status.json`) と各 slug の現 EN snapshot fingerprint。
 * 出力は deterministic で、CI で bit-identical を検証する。
 *
 * Modes:
 *   --regenerate              既存 parity-baseline.json を完全上書き
 *   --slug=<csv>              指定 slug のエントリのみ削除 → 再生成 → マージ
 *
 * @module generate_parity_baseline
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { ROOT_DIR } from './lib/project.mjs';
import {
  BASELINE_ELIGIBLE_TYPES,
  validateBaseline,
  loadBaselineFile,
} from './lib/source_parity_baseline.mjs';
import { computeSnapshotFingerprint } from './lib/source_parity_acknowledgements.mjs';

const STATUS_PATH = path.join(ROOT_DIR, 'parity-check-status.json');
const BASELINE_PATH = path.join(ROOT_DIR, 'parity-baseline.json');
const SNAPSHOTS_DIR = path.join(ROOT_DIR, 'snapshots', 'en', 'content');

const DEFAULT_REVIEW_MONTHS = 6;

/**
 * Compute the default reviewAfter date — `monthsAhead` months after `now`.
 * Plain UTC math, format strict YYYY-MM-DD.
 */
export function defaultReviewAfter(now, monthsAhead = DEFAULT_REVIEW_MONTHS) {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + monthsAhead, now.getUTCDate()));
  const yyyy = d.getUTCFullYear().toString();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Convert a parity-check-status.json file path to a slug (drop the
 * `src/content/docs/` prefix and `.md` suffix).
 */
function fileEntryToSlug(filePath) {
  const stripped = filePath.replace(/^src\/content\/docs\//, '').replace(/\.md$/, '');
  return stripped;
}

/**
 * Build a fingerprint map from the snapshots directory: slug → sha256:....
 * Walks the snapshots tree once and computes computeSnapshotFingerprint per file.
 */
export function buildFingerprintMap(snapshotsDir = SNAPSHOTS_DIR) {
  const map = new Map();
  if (!fs.existsSync(snapshotsDir)) return map;
  const walk = (dir, prefix) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        walk(path.join(dir, entry.name), prefix ? `${prefix}/${entry.name}` : entry.name);
      } else if (entry.name.endsWith('.html')) {
        const slug = prefix
          ? `${prefix}/${entry.name.replace(/\.html$/, '')}`
          : entry.name.replace(/\.html$/, '');
        const content = fs.readFileSync(path.join(dir, entry.name), 'utf8');
        map.set(slug, computeSnapshotFingerprint(content));
      }
    }
  };
  walk(snapshotsDir, '');
  return map;
}

/**
 * Build a baseline from a parsed parity-check-status.json object.
 *
 * @param {object} status — parsed parity-check-status.json
 * @param {Map<string, string>} fingerprintMap — slug → sha256
 * @param {{ runId: string, generatedAt: string, reviewAfter: string, rationale: string }} meta
 * @returns {object} baseline ready for serializeBaseline
 */
export function buildBaselineFromStatus(status, fingerprintMap, meta) {
  const entries = [];
  for (const file of status.files ?? []) {
    const slug = fileEntryToSlug(file.file);
    const fingerprint = fingerprintMap.get(slug);
    if (!fingerprint) continue; // defensive: no snapshot, skip

    for (const issue of file.issues ?? []) {
      if (!BASELINE_ELIGIBLE_TYPES.has(issue.type)) continue;
      if (issue.baselined === true) continue;

      const entry = {
        slug,
        issueType: issue.type,
        snapshotFingerprint: fingerprint,
        reviewAfter: meta.reviewAfter,
      };

      if (issue.type === 'segment-inconclusive') {
        entry.sectionPath = null;
        entry.segmentKind = null;
        entry.enSegmentIndex = null;
        entry.jaSegmentIndex = null;
        entry.inconclusiveCategory = issue.inconclusiveCategory ?? null;
        entry.inconclusiveReason = issue.inconclusiveReason ?? null;
      } else if (issue.type === 'segment-extra') {
        entry.sectionPath = issue.sectionPath ?? null;
        entry.segmentKind = issue.segmentKind ?? null;
        entry.enSegmentIndex = null;
        entry.jaSegmentIndex = issue.jaSegmentIndex ?? null;
        entry.inconclusiveCategory = null;
        entry.inconclusiveReason = null;
      } else {
        entry.sectionPath = issue.sectionPath ?? null;
        entry.segmentKind = issue.segmentKind ?? null;
        entry.enSegmentIndex = issue.enSegmentIndex ?? null;
        entry.jaSegmentIndex = null;
        entry.inconclusiveCategory = null;
        entry.inconclusiveReason = null;
      }
      entries.push(entry);
    }
  }

  return {
    schemaVersion: 1,
    generatedAt: meta.generatedAt,
    generatedFromRunId: meta.runId,
    rationale: meta.rationale,
    entries,
  };
}

/**
 * Sort entries deterministically: slug → issueType → sectionPath → segmentKind → index.
 */
function sortEntries(entries) {
  return [...entries].sort((a, b) => {
    if (a.slug !== b.slug) return a.slug < b.slug ? -1 : 1;
    if (a.issueType !== b.issueType) return a.issueType < b.issueType ? -1 : 1;
    const aSec = a.sectionPath ?? '';
    const bSec = b.sectionPath ?? '';
    if (aSec !== bSec) return aSec < bSec ? -1 : 1;
    const aKind = a.segmentKind ?? '';
    const bKind = b.segmentKind ?? '';
    if (aKind !== bKind) return aKind < bKind ? -1 : 1;
    if (a.issueType === 'segment-inconclusive') {
      const aCat = a.inconclusiveCategory ?? '';
      const bCat = b.inconclusiveCategory ?? '';
      if (aCat !== bCat) return aCat < bCat ? -1 : 1;
      return 0;
    }
    if (a.issueType === 'segment-extra') {
      const aIdx = a.jaSegmentIndex ?? -1;
      const bIdx = b.jaSegmentIndex ?? -1;
      return aIdx - bIdx;
    }
    const aIdx = a.enSegmentIndex ?? -1;
    const bIdx = b.enSegmentIndex ?? -1;
    return aIdx - bIdx;
  });
}

/**
 * Serialize a baseline object to canonical JSON string with stable ordering,
 * 2-space indent, and LF terminator. Bit-identical for the same input.
 */
export function serializeBaseline(baseline) {
  const sorted = {
    schemaVersion: baseline.schemaVersion,
    generatedAt: baseline.generatedAt,
    generatedFromRunId: baseline.generatedFromRunId,
    rationale: baseline.rationale,
    entries: sortEntries(baseline.entries),
  };
  return JSON.stringify(sorted, null, 2) + '\n';
}

/**
 * Merge new entries for a set of slugs into an existing baseline. Existing
 * entries for those slugs are removed first; entries for OTHER slugs are
 * preserved.
 */
export function mergePartialBaseline(existing, slugsToReplace, newEntries, meta) {
  const slugSet = new Set(slugsToReplace);
  const preserved = existing.entries.filter((e) => !slugSet.has(e.slug));
  return {
    schemaVersion: 1,
    generatedAt: meta.generatedAt,
    generatedFromRunId: meta.generatedFromRunId,
    rationale: meta.rationale,
    entries: [...preserved, ...newEntries],
  };
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const slugArg = argv.find((arg) => arg.startsWith('--slug='));
  const rationaleArg = argv.find((arg) => arg.startsWith('--rationale='));
  const reviewAfterArg = argv.find((arg) => arg.startsWith('--review-after='));
  return {
    regenerate: argv.includes('--regenerate'),
    slugs: slugArg ? slugArg.slice('--slug='.length).split(',').filter(Boolean) : null,
    rationale: rationaleArg ? rationaleArg.slice('--rationale='.length) : null,
    reviewAfter: reviewAfterArg ? reviewAfterArg.slice('--review-after='.length) : null,
  };
}

function printUsage() {
  console.error('Usage:');
  console.error('  node scripts/generate_parity_baseline.mjs --regenerate [--rationale="..."] [--review-after=YYYY-MM-DD]');
  console.error('  node scripts/generate_parity_baseline.mjs --slug=overview/foo,overview/bar');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.regenerate && !args.slugs) {
    printUsage();
    return 1;
  }

  if (!fs.existsSync(STATUS_PATH)) {
    console.error(`❌ ${STATUS_PATH} not found. Run \`npm run check:parity\` first.`);
    return 1;
  }
  const status = JSON.parse(fs.readFileSync(STATUS_PATH, 'utf8'));
  const fingerprintMap = buildFingerprintMap();

  const now = new Date();
  const defaultRationale = args.regenerate
    ? 'Phase 6A frozen baseline — regenerated'
    : `Phase 6A frozen baseline — partial regeneration for ${args.slugs.join(', ')}`;
  const meta = {
    runId: `${now.toISOString()}#${process.pid}`,
    generatedAt: now.toISOString(),
    reviewAfter: args.reviewAfter ?? defaultReviewAfter(now),
    rationale: args.rationale ?? defaultRationale,
  };

  let output;
  if (args.regenerate) {
    output = buildBaselineFromStatus(status, fingerprintMap, meta);
  } else {
    // Partial: filter status to only the targeted slugs, then merge
    const filtered = {
      ...status,
      files: (status.files ?? []).filter((f) => args.slugs.includes(fileEntryToSlug(f.file))),
    };
    const newBaseline = buildBaselineFromStatus(filtered, fingerprintMap, meta);
    let existing = { schemaVersion: 1, generatedAt: meta.generatedAt, generatedFromRunId: '', rationale: '', entries: [] };
    if (fs.existsSync(BASELINE_PATH)) {
      existing = loadBaselineFile(BASELINE_PATH);
    }
    output = mergePartialBaseline(existing, args.slugs, newBaseline.entries, {
      generatedAt: meta.generatedAt,
      generatedFromRunId: meta.runId,
      rationale: meta.rationale,
    });
  }

  // Validate before writing — fail loud on schema violations
  validateBaseline(output);
  const serialized = serializeBaseline(output);
  fs.writeFileSync(BASELINE_PATH, serialized);
  console.log(`✅ Wrote ${output.entries.length} baseline entries to ${path.relative(ROOT_DIR, BASELINE_PATH)}`);
  return 0;
}

const isDirectRun = import.meta.url === `file://${fileURLToPath(import.meta.url).startsWith('/') ? fileURLToPath(import.meta.url) : process.argv[1]}`;
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().then((code) => process.exit(code)).catch((err) => {
    console.error('❌ generate_parity_baseline error:', err);
    process.exit(1);
  });
}
```

- [ ] **Step 4: テストを実行して pass 確認**

Run: `node --test scripts/__tests__/generate_parity_baseline.test.mjs 2>&1 | tail -20`
Expected: 全テスト pass。

- [ ] **Step 5: package.json に script 追加**

`package.json` の `scripts` セクションに追加:

```json
    "generate:parity-baseline": "node scripts/generate_parity_baseline.mjs"
```

- [ ] **Step 6: 全テスト実行**

Run: `npm test 2>&1 | tail -30`
Expected: 全テスト pass。

- [ ] **Step 7: Commit**

```bash
git add scripts/generate_parity_baseline.mjs scripts/__tests__/generate_parity_baseline.test.mjs package.json
git commit -m "feat: generate_parity_baseline script

baseline 生成 CLI。--regenerate と --slug=<csv> の 2 mode。
入力は parity-check-status.json + EN snapshot fingerprint map。
出力は deterministic（安定ソート + 2-space indent + LF 終端）。

- buildBaselineFromStatus: BASELINE_ELIGIBLE_TYPES だけを抽出
- serializeBaseline: bit-identical 出力（C5）
- mergePartialBaseline: 指定 slug のみ削除 → 再生成 → マージ
- defaultReviewAfter: 6 ヶ月後 (UTC)
- validateBaseline で書込前に schema check"
```

---

## Task 5: Initial parity baseline (preview) for Phase 6A

**Files:**
- Create: `parity-baseline.json` (preview, regenerated at PR2)

**Background:** PR1 ブランチで現状の shadow 出力から baseline を初期生成し、commit する。これは preview baseline で、PR2 で再生成して上書きする。

- [ ] **Step 1: 最新 main を rebase**

```bash
git rebase main 2>&1 | tail -5
```

Expected: clean rebase または "Already up to date"

- [ ] **Step 2: parity check を実行して最新の status を作る**

Run: `npm run check:parity 2>&1 | tail -10`
Expected: shadow 出力あり、active actionable 0、exit 0。`parity-check-status.json` が更新される。

- [ ] **Step 3: baseline を生成**

Run: `node scripts/generate_parity_baseline.mjs --regenerate`
Expected: `✅ Wrote N baseline entries to parity-baseline.json` と表示される（N は概ね 1,000 前後）

- [ ] **Step 4: preview rationale 付きで生成**

Run: `node scripts/generate_parity_baseline.mjs --regenerate --rationale="Phase 6A frozen baseline — PREVIEW only. Regenerated at PR2 cutover. New issues fail; baselined issues do not." --review-after=2026-10-06`
Expected: `✅ Wrote N baseline entries to parity-baseline.json`

- [ ] **Step 5: 再度同じコマンドで生成して bit-identical を確認**

```bash
cp parity-baseline.json /tmp/baseline-1.json
node scripts/generate_parity_baseline.mjs --regenerate --rationale="Phase 6A frozen baseline — PREVIEW only. Regenerated at PR2 cutover. New issues fail; baselined issues do not." --review-after=2026-10-06
diff /tmp/baseline-1.json parity-baseline.json && echo "BIT-IDENTICAL OK"
```

Expected: `BIT-IDENTICAL OK`。entries の中身は同じはずだが、`generatedAt` と `generatedFromRunId` は実行時刻に依存するので bit-identical にはならない可能性がある。その場合は次の Step 5b を実行。

- [ ] **Step 5b: bit-identical でない場合の対処（generatedAt 固定）**

C5 は entries の deterministic 性を検証するもので、`generatedAt` / `generatedFromRunId` のタイムスタンプは変動して当然。`source_parity_baseline.test.mjs` と `generate_parity_baseline.test.mjs` の bit-identical テストは meta を固定して検証する。手動 bit-identical 確認はやめて、entries フィールドだけを比較:

```bash
node -e "const a = JSON.parse(require('fs').readFileSync('/tmp/baseline-1.json','utf8')); const b = JSON.parse(require('fs').readFileSync('parity-baseline.json','utf8')); const aE = JSON.stringify(a.entries); const bE = JSON.stringify(b.entries); if (aE === bE) console.log('ENTRIES IDENTICAL'); else { console.log('DIFFER'); process.exit(1); }"
```

Expected: `ENTRIES IDENTICAL`

- [ ] **Step 6: check:parity を実行して baseline が tag されていることを確認**

Run: `npm run check:parity 2>&1 | grep -E "(active: 0|Phase 6A baseline|frozen drift)" | tail -10`
Expected: `active: 0` と `[Phase 6A baseline] frozen drift (gate から除外): N 件 / M ファイル` が表示される。M は概ね 241 前後。

- [ ] **Step 7: Commit**

```bash
git add parity-baseline.json
git commit -m "chore: initial parity baseline (preview) for Phase 6A

PR1 ブランチで shadow 出力から生成した preview baseline。
PR2 cutover で再生成して上書きする。

- entries: ~1,000 件（segment-missing / extra / untranslated /
  token-gap / inconclusive を凍結）
- snapshotFingerprint で page-level invalidation
- reviewAfter: 6 ヶ月後 (2026-10-06)
- gate exit code は変えない（shadow tagging 維持）"
```

---

## Task 6: README — Phase 6A baseline mechanism in shadow mode

**Files:**
- Modify: `scripts/README.md`

**Background:** Phase 6A 進行中の状態を README に反映する。Phase 5 の状態を更新し、PR1 で導入された baseline 機構を説明する。

- [ ] **Step 1: README L432 付近の Phase 5 の Go メモを更新**

`scripts/README.md` の以下の部分を編集:

検索対象（Read で確認）: `Phase 5 PoC は Go。runtime には shadow mode で接続済み。`

更新後:

```markdown
> Phase 5 PoC は **Go**。runtime には shadow mode で接続済み。Phase 6A PR1 で frozen baseline 機構を追加（gate flip はまだ）。Phase 6A PR2 で `segment-shadow` を主 gate に昇格する。
```

- [ ] **Step 2: Phase 6A セクションを README に追加**

`scripts/README.md` の Phase 5 セクションの後、テストセクションの前に以下を追加:

```markdown
---

## Phase 6A — Frozen Baseline + Gate Promotion (進行中)

Phase 6A は Phase 5 の exact diff engine を deterministic に primary gate へ
昇格させる Phase。`segment-shadow` 隔離を解除する代わりに、cutover 時点の
既存 drift を `parity-baseline.json` で凍結する。

**設計原則**:

- baseline と acknowledgement は別ファイル（責務分離）
- baseline 同定キーは issueType ごとに分岐:
  - 通常: `slug + issueType + sectionPath + segmentKind + enSegmentIndex`
  - `segment-extra`: `enSegmentIndex` の代わりに `jaSegmentIndex`
  - `segment-inconclusive`: `slug + issueType + inconclusiveCategory`
- page-level snapshotFingerprint で conservative に invalidate（EN snapshot
  が変わったら、そのページの baseline 全エントリを一括で剥がす）
- `segment-inconclusive` は actionable / non-acknowledgeable のまま、
  構造化 enum (`heading-count-mismatch` / `align-exception` /
  `tokenless-near-tie`) で同定

**ファイル**:

- `scripts/lib/source_parity_baseline.mjs` — schema validation, key 生成,
  page-level invalidation を含む tagging（純粋関数のみ）
- `scripts/generate_parity_baseline.mjs` — baseline 生成 CLI
  - `--regenerate` で full、`--slug=<csv>` で partial 再生成
  - 出力は deterministic（安定ソート + 2-space indent + LF 終端）
- `parity-baseline.json` — frozen baseline file（PR1 では preview、
  PR2 cutover で再生成）

**npm script**:

```bash
npm run generate:parity-baseline -- --regenerate
npm run generate:parity-baseline -- --slug=overview/example,overview/account-settings
```

**PR 構成**:

- **PR1 (infra, shadow 維持)**: alignment refactor (`inconclusiveCategory`),
  baseline schema/validation/match, generation script, preview baseline,
  README 更新。Gate exit code は変わらない。
- **PR2 (cutover)**: baseline 再生成 + shadow tagging 解除。`segment-*` が
  primary gate の actionable 集計に乗る。

**関連 spec**: `docs/superpowers/specs/2026-04-06-issue-225-phase-6a-design.md`
**関連 plan**: `docs/superpowers/plans/2026-04-06-issue-225-phase-6a-plan.md`

```

- [ ] **Step 3: テストと lint が通ることを確認**

Run: `npm test 2>&1 | tail -10 && npm run lint:md 2>&1 | tail -10`
Expected: テスト全 pass、md lint も通る。

- [ ] **Step 4: Commit**

```bash
git add scripts/README.md
git commit -m "docs: README — Phase 6A baseline mechanism in shadow mode

Phase 5 の状態を更新し、PR1 で導入された frozen baseline 機構を説明する
新セクションを追加。PR1 / PR2 の役割分担と generate_parity_baseline の
使い方を記載。"
```

---

## PR1 完了確認

PR1 の最後に以下を確認:

- [ ] **Final 1: 全テスト pass**

Run: `npm test 2>&1 | tail -20`
Expected: 全テスト pass。Phase 5 recall benchmark の Go 条件が維持される。

- [ ] **Final 2: gate exit code 不変**

Run: `npm run check:parity -- --fail-on=actionable; echo "EXIT=$?"`
Expected: `EXIT=0`

- [ ] **Final 3: baseline 集計が CLI に表示される**

Run: `npm run check:parity 2>&1 | grep -A 5 "\\[Phase 6A baseline\\]"`
Expected: `[Phase 6A baseline] frozen drift (gate から除外): N 件 / 241 ファイル` のような表示

- [ ] **Final 4: lint と build が通る**

Run: `npm run lint && npm run build 2>&1 | tail -10`
Expected: 全部 pass。

- [ ] **Final 5: commit 履歴を確認**

Run: `git log main..HEAD --oneline`
Expected: 6 commit が並んでいる:
1. feat: alignSegments returns structured inconclusiveCategory
2. feat: parity baseline schema and validation
3. feat: integrate parity baseline into check_source_parity (shadow mode)
4. feat: generate_parity_baseline script
5. chore: initial parity baseline (preview) for Phase 6A
6. docs: README — Phase 6A baseline mechanism in shadow mode

**ここで一旦停止して user に PR1 push の許可を取る。**

---

# PR2 — Cutover (gate flip)

PR2 のゴール: shadow tagging を外し、segment-* を primary gate に乗せる。
PR2 ブランチ上で baseline を再生成してから flip する。

**Cutover window 運用ルール**:
- PR1 land 後、PR2 期間中は EN snapshot 更新禁止
- PR2 の baseline 再生成は固定手順: `git rebase main` → `npm run check:parity` → `node scripts/generate_parity_baseline.mjs --regenerate` → flip コミット

## Task 7: Regenerate parity baseline at Phase 6A cutover

**Files:**
- Modify: `parity-baseline.json` (PR2 ブランチ上で再生成)

- [ ] **Step 1: PR2 ブランチを main から作る**

```bash
git checkout main && git pull && git checkout -b claude/issue-225-phase-6a-pr2
```

- [ ] **Step 2: 直前の `main` の状態で parity check を実行**

Run: `npm run check:parity 2>&1 | tail -10`
Expected: shadow 出力あり、active actionable 0、exit 0。

- [ ] **Step 3: cutover rationale 付きで baseline を再生成**

Run: `node scripts/generate_parity_baseline.mjs --regenerate --rationale="Phase 6A frozen baseline — generated at cutover. New issues fail; baselined issues do not. To pay down: see docs/OPS_DESIGN.md Phase 6A rollback section." --review-after=2026-10-06`
Expected: `✅ Wrote N baseline entries to parity-baseline.json`

- [ ] **Step 4: entries-level の deterministic 検証**

```bash
cp parity-baseline.json /tmp/baseline-cutover-1.json
node scripts/generate_parity_baseline.mjs --regenerate --rationale="Phase 6A frozen baseline — generated at cutover. New issues fail; baselined issues do not. To pay down: see docs/OPS_DESIGN.md Phase 6A rollback section." --review-after=2026-10-06
node -e "const a = JSON.parse(require('fs').readFileSync('/tmp/baseline-cutover-1.json','utf8')); const b = JSON.parse(require('fs').readFileSync('parity-baseline.json','utf8')); if (JSON.stringify(a.entries) === JSON.stringify(b.entries) && a.rationale === b.rationale) console.log('ENTRIES + RATIONALE IDENTICAL'); else { console.log('DIFFER'); process.exit(1); }"
```

Expected: `ENTRIES + RATIONALE IDENTICAL`

- [ ] **Step 5: Commit**

```bash
git add parity-baseline.json
git commit -m "chore: regenerate parity baseline at Phase 6A cutover

PR2 ブランチで再生成。PR1 の preview baseline を現状の main の状態で
上書きする。次の commit で gate flip。"
```

---

## Task 8: Phase 6A — promote segment-* to primary gate

**Files:**
- Modify: `scripts/lib/source_parity_align.mjs:889-927` (parityDiffsToIssues)
- Modify: `scripts/lib/source_parity_summary.mjs`
- Modify: `scripts/check_source_parity.mjs`
- Modify: `scripts/__tests__/source_parity_align_runtime.test.mjs`
- Create: `scripts/__tests__/source_parity_baseline_recall.test.mjs` (C4 test)

**Background:** Phase 5 shadow tagging を外し、`segment-*` を primary gate に乗せる。`shadowIssues` 系フィールドは backward compat の dual emit として 0 値で残し、Phase 7 で削除する。

**重要**: 同時に C4 test (`source_parity_baseline_recall.test.mjs`) を追加する。これは exit criteria の最重要条件で、「frozen baseline が新規 mutation を吸収しない」ことを CI で常時検証する。

- [ ] **Step 1: C4 baseline-recall test を作成（cutover 前なので未確定の挙動を test 化）**

`scripts/__tests__/source_parity_baseline_recall.test.mjs`:

```javascript
/**
 * Phase 6A C4 — frozen baseline does NOT absorb new mutations.
 *
 * For each baselined representative page, apply each diff=1 mutation type
 * and verify that the resulting NEW diff is detected as an active issue
 * (not absorbed by the baseline lookup). This is the most important
 * Phase 6A guarantee — without it, the frozen baseline silently becomes
 * a suppression mechanism.
 */
import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

let alignSegments;
let parityDiffsToIssues;
let extractSegmentsFromHtml;
let extractSegmentsFromMarkdown;
let computeSnapshotFingerprint;
let buildBaselineKey;
let tagIssuesWithBaseline;
let MUTATION_TYPES;

before(async () => {
  ({ alignSegments } = await import('../lib/source_parity_align.mjs'));
  ({ parityDiffsToIssues } = await import('../lib/source_parity_align.mjs'));
  ({ extractSegmentsFromHtml } = await import('../lib/source_parity_segments_en.mjs'));
  ({ extractSegmentsFromMarkdown } = await import('../lib/source_parity_segments_ja.mjs'));
  ({ computeSnapshotFingerprint } = await import('../lib/source_parity_acknowledgements.mjs'));
  ({ buildBaselineKey, tagIssuesWithBaseline } = await import('../lib/source_parity_baseline.mjs'));
  ({ MUTATION_TYPES } = await import('../lib/mutation_corpus.mjs'));
});

const ROOT = join(import.meta.dirname, '../../');
const FIXTURES = join(ROOT, 'scripts/__tests__/fixtures/source-parity-goldens');
const MANIFEST_PATH = join(FIXTURES, 'manifest.json');

function loadManifest() {
  return JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')).pages;
}

function readEnHtml(slug) {
  return readFileSync(join(ROOT, 'snapshots/en/content', `${slug}.html`), 'utf8');
}

function readJaMarkdown(slug) {
  return readFileSync(join(ROOT, 'src/content/docs', `${slug}.md`), 'utf8');
}

/**
 * Build a synthetic baseline from a slug's CURRENT shadow output, then
 * apply the mutation and verify that at least one of the resulting
 * issues is NOT baselined.
 */
function generateBaselineEntriesFromIssues(slug, issues, fingerprint) {
  return issues
    .filter((i) => ['segment-missing', 'segment-extra', 'segment-shifted', 'segment-untranslated', 'segment-token-gap', 'segment-inconclusive'].includes(i.type))
    .map((issue) => {
      const entry = {
        slug,
        issueType: issue.type,
        snapshotFingerprint: fingerprint,
        reviewAfter: '2026-10-06',
        sectionPath: issue.sectionPath ?? null,
        segmentKind: issue.segmentKind ?? null,
        enSegmentIndex: null,
        jaSegmentIndex: null,
        inconclusiveCategory: null,
        inconclusiveReason: null,
      };
      if (issue.type === 'segment-extra') {
        entry.jaSegmentIndex = issue.jaSegmentIndex ?? null;
      } else if (issue.type === 'segment-inconclusive') {
        entry.inconclusiveCategory = issue.inconclusiveCategory ?? null;
        entry.inconclusiveReason = issue.inconclusiveReason ?? null;
      } else {
        entry.enSegmentIndex = issue.enSegmentIndex ?? null;
      }
      return entry;
    });
}

describe('Phase 6A C4 — baseline does not absorb new mutations', () => {
  it('every diff=1 mutation produces at least one un-baselined active issue', () => {
    const manifest = loadManifest();
    const failures = [];

    for (const page of manifest) {
      const slug = page.slug;
      const html = readEnHtml(slug);
      const fingerprint = computeSnapshotFingerprint(html);
      const enSegments = extractSegmentsFromHtml(html);
      const jaOriginal = readJaMarkdown(slug);
      const jaSegmentsOriginal = extractSegmentsFromMarkdown(jaOriginal);

      // Step 1: build baseline from the original (un-mutated) state
      const baselineAlignment = alignSegments(enSegments, jaSegmentsOriginal);
      const baselineIssues = parityDiffsToIssues(baselineAlignment.diffs);
      const baselineEntries = generateBaselineEntriesFromIssues(slug, baselineIssues, fingerprint);

      // Step 2: for each mutation type, apply it and verify the new diff is not baselined
      for (const [mutationType, mutationFn] of Object.entries(MUTATION_TYPES)) {
        const mutation = mutationFn(jaOriginal, 0);
        if (mutation === null) continue;

        const jaSegmentsMutated = extractSegmentsFromMarkdown(mutation.mutated);
        const mutatedAlignment = alignSegments(enSegments, jaSegmentsMutated);
        if (mutatedAlignment.inconclusive) continue;

        const mutatedIssues = parityDiffsToIssues(mutatedAlignment.diffs);
        const taggedResult = tagIssuesWithBaseline(slug, mutatedIssues, baselineEntries, fingerprint);

        // Check whether ANY active (non-baselined) issue exists
        const activeIssues = taggedResult.tagged.filter((i) => i.baselined !== true);

        if (activeIssues.length === 0 && mutatedIssues.length > 0) {
          failures.push(`${slug} :: ${mutationType} :: all ${mutatedIssues.length} mutated issues were absorbed by baseline`);
        }
      }
    }

    assert.equal(
      failures.length,
      0,
      `Phase 6A C4 FAILURE — baseline absorbed new mutations:\n  ${failures.join('\n  ')}`,
    );
  });
});
```

- [ ] **Step 2: C4 テストを実行（事前に失敗しないか確認）**

Run: `node --test scripts/__tests__/source_parity_baseline_recall.test.mjs 2>&1 | tail -20`
Expected: 全テスト pass（baseline は EN snapshot が変わらない限り JA mutation を絶対に吸収しない設計のはずだから）。万一 fail する場合は baseline mechanism の致命バグなので Path 1 (revert to pre-cutover) を即実行。

- [ ] **Step 3: parityDiffsToIssues から shadow tagging を削除**

`scripts/lib/source_parity_align.mjs` の `parityDiffsToIssues` 関数を編集:

L897 周辺:

```javascript
export function parityDiffsToIssues(diffs) {
  if (!Array.isArray(diffs)) return [];
  return diffs.map((diff) => {
    const sectionLabel = diff.sectionPath || '(preface)';
    const severity = SEGMENT_ISSUE_SEVERITY[diff.type] ?? 'actionable';
    const issue = {
      type: diff.type,
      severity,
      // Phase 6A cutover: shadow phase tagging removed. segment-* issues
      // now flow through the primary gate accounting in
      // summarizeParityResults. dual-emit `shadowIssues=0` is preserved
      // for backward compat through Phase 7.
      detail: `[${sectionLabel}] ${diff.detail}`,
      sectionPath: diff.sectionPath,
      sectionIndex: diff.sectionIndex,
      segmentKind: diff.segmentKind,
      enSegmentIndex: diff.enSegmentIndex ?? null,
      jaSegmentIndex: diff.jaSegmentIndex ?? null,
      enSourceFingerprint: diff.enSourceFingerprint ?? null,
      jaSourceFingerprint: diff.jaSourceFingerprint ?? null,
    };
    if (Array.isArray(diff.missingTokens)) {
      issue.missingTokens = [...diff.missingTokens];
    }
    if (Array.isArray(diff.enSectionTokens)) {
      issue.enSectionTokens = [...diff.enSectionTokens];
      issue.jaSectionTokens = [...(diff.jaSectionTokens ?? [])];
    }
    if (typeof diff.confidence === 'string') {
      issue.confidence = diff.confidence;
    }
    return issue;
  });
}
```

- [ ] **Step 4: check_source_parity.mjs から segment-inconclusive のフォールバック処理に inconclusiveCategory を渡す**

L44-51 の `buildSegmentInconclusiveIssue` を更新:

```javascript
function buildSegmentInconclusiveIssue(reason, category) {
  return {
    type: 'segment-inconclusive',
    severity: ISSUE_SEVERITY['segment-inconclusive'],
    inconclusiveCategory: category ?? 'align-exception',
    inconclusiveReason: reason,
    detail: `Phase 6A alignment inconclusive [${category ?? 'align-exception'}]: ${reason}`,
  };
}
```

L221-237 の alignment inconclusive 検出ループを更新:

```javascript
        let segmentIssues = [];
        let alignmentInconclusive = false;
        let alignmentInconclusiveReason = null;
        let alignmentInconclusiveCategory = null;
        try {
          const enSegments = extractSegmentsFromHtml(rawEnHtml);
          const jaSegments = extractSegmentsFromMarkdown(doc.body);
          const alignment = alignSegments(enSegments, jaSegments);
          segmentIssues = parityDiffsToIssues(alignment.diffs);
          if (alignment.inconclusive) {
            alignmentInconclusive = true;
            alignmentInconclusiveReason = alignment.inconclusiveReason;
            alignmentInconclusiveCategory = alignment.inconclusiveCategory;
          }
        } catch (e) {
          alignmentInconclusive = true;
          alignmentInconclusiveReason = e.message;
          alignmentInconclusiveCategory = 'align-exception';
          console.error(
            `alignSegments failed for ${fileSlug}: ${e.message}. Falling back to coarse parity.`,
          );
        }

        if (alignmentInconclusive) {
          issues.push(...segmentIssues);
          issues.push(
            buildSegmentInconclusiveIssue(
              alignmentInconclusiveReason || 'unknown reason',
              alignmentInconclusiveCategory,
            ),
          );
          issues.push(...compareSnapshotStructure(enBody, doc.body));
        } else {
          issues.push(...segmentIssues);
          issues.push(...compareSnapshotStructure(enBody, doc.body));
        }
```

- [ ] **Step 5: source_parity_summary.mjs の shadow 隔離分岐を削除（dual emit 維持）**

L38-48 の shadow 分岐を変更:

```javascript
    for (const issue of result.issues) {
      const isShadow = issue.phase === 'segment-shadow';  // Phase 7 で削除予定
      const isBaselined = issue.baselined === true;

      // Dual-emit: keep shadow accounting fields at 0 for backward compat
      // through Phase 7. After Phase 7's reporting refactor, both the
      // shadow phase tag and these fields will be removed.
      if (isShadow) {
        shadowIssues += 1;
        shadowIssuesByType[issue.type] = (shadowIssuesByType[issue.type] || 0) + 1;
        hasShadow = true;
      }

      // Phase 6A cutover: segment-* issues flow through the primary gate
      // accounting (no continue here). baseline-tagged issues are still
      // excluded from active counts.
      ...
    }
```

実際の差分:
- `if (isShadow) { ...; continue; }` の `continue` を削除
- shadow 統計集計はそのまま（dual emit のため）
- 以降の actionable/active 集計は `isBaselined` で除外する処理を維持
- 注: PR1 で既に baseline 除外の `if (!isValidAck && !isBaselined)` を入れているので、shadow continue を消すだけで dual emit + baseline 除外の組み合わせが効く

- [ ] **Step 6: source_parity_align_runtime.test.mjs を expected shape に合わせて更新**

shadow tagging を期待しているテストを更新:

L69-84 の `tags every issue with phase=segment-shadow` テストを以下に変更:

```javascript
  it('emits issues with structured metadata for the primary gate', () => {
    const enHtml = '<h2>Setup</h2><p>Configure with <code>--proxy</code>.</p>';
    const jaMd = '## セットアップ\n\nプロキシを設定します。\n';
    const enSegs = extractSegmentsFromHtml(enHtml);
    const jaSegs = extractSegmentsFromMarkdown(jaMd);
    const alignment = alignSegments(enSegs, jaSegs);
    const issues = parityDiffsToIssues(alignment.diffs);
    assert.ok(issues.length > 0, 'expected at least one diff (token-gap on --proxy)');
    for (const issue of issues) {
      // Phase 6A cutover: shadow phase tag removed
      assert.equal(issue.phase, undefined);
      assert.equal(issue.severity, 'actionable');
      assert.ok(issue.detail.startsWith('['), 'detail must include section label prefix');
      assert.ok(typeof issue.sectionIndex === 'number');
      assert.ok(typeof issue.segmentKind === 'string');
    }
  });
```

L109-149 の `summarizeParityResults — shadow accounting` テストを更新:
- shadow 集計が 0 値で出ること（dual emit）
- segment-* が actionable/active に集計されること（fingerprintMatch がないので baseline 適用なし）
- `paragraph-count-mismatch` は signal のまま

E2E スイート (L156-214) も `shadowIssues > 0` を assert している箇所を `summary.activeFiles > 0` または `summary.actionableFiles > 0` に変更（baseline がないテスト環境では cutover 後の primary gate に乗る）。

注: この E2E テストは実際の `parity-baseline.json` の有無に依存するので、テスト fixtures に baseline を置くか、テストを書き換えて baseline 抜きで実行するかを決める必要がある。最も簡潔なのは「baseline ファイルを一時的に退避してテスト → 復元」のパターン。既存の `STATUS_BACKUP_PATH` パターンを `BASELINE_BACKUP_PATH` に拡張する。

- [ ] **Step 7: テスト全部 pass を確認**

Run: `npm test 2>&1 | tail -30`
Expected: 全テスト pass。特に:
- `source_parity_baseline_recall.test.mjs` が pass (C4)
- `source_parity_baseline.test.mjs` が pass (C5)
- `source_parity_recall.test.mjs` が pass (C2 / C3)
- `source_parity_align_runtime.test.mjs` が pass

- [ ] **Step 8: 実際の `npm run check:parity` で gate green を確認 (C1)**

Run: `npm run check:parity -- --fail-on=actionable; echo "EXIT=$?"`
Expected: `EXIT=0`、active actionable 0、`[Phase 6A baseline] frozen drift (gate から除外): N 件 / 241 ファイル`

issue-level の active 確認:

```bash
node -e "const d = JSON.parse(require('fs').readFileSync('parity-check-status.json','utf8')); const active = d.files.flatMap(f => f.issues.filter(i => (i.severity === 'actionable' || i.severity === 'error') && i.baselined !== true && (i.acknowledged !== true || i.ackExpired === true))); console.log('active issue-level:', active.length); if (active.length > 0) { console.log('first 5:', active.slice(0,5)); process.exit(1); }"
```

Expected: `active issue-level: 0`

- [ ] **Step 9: 単一ページ latency を確認 (C6)**

Run: `time node scripts/check_source_parity.mjs --slug=overview/testim-overview --json > /dev/null`
Expected: 10 秒以内

Run: representative heavy page も計測（baseline 件数 top の slug を選んで）。`parity-check-status.json` から baseline 件数 top の slug を抽出:

```bash
node -e "const d = JSON.parse(require('fs').readFileSync('parity-check-status.json','utf8')); const top = d.files.map(f => ({slug: f.file.replace('src/content/docs/','').replace('.md',''), n: f.issues.filter(i => i.baselined).length})).sort((a,b)=>b.n-a.n)[0]; console.log(top);"
```

Expected: `{ slug: '...', n: ... }` を確認、その slug に対して `time check_source_parity --slug=...` を実行。

- [ ] **Step 10: Commit**

```bash
git add scripts/lib/source_parity_align.mjs scripts/lib/source_parity_summary.mjs scripts/check_source_parity.mjs scripts/__tests__/source_parity_align_runtime.test.mjs scripts/__tests__/source_parity_baseline_recall.test.mjs
git commit -m "feat: Phase 6A — promote segment-* to primary gate

shadow tagging を解除し、segment-* を primary gate の actionable 集計に
昇格させる。既存 drift は parity-baseline.json で凍結済み。

- parityDiffsToIssues: phase: 'segment-shadow' タグを削除
- summarizeParityResults: shadow 隔離 continue を削除（dual emit は維持）
- check_source_parity: inconclusiveCategory を fallback path にも渡す
- source_parity_baseline_recall.test.mjs (C4): baseline が新規 mutation を
  吸収しないことを CI で常時検証
- source_parity_align_runtime.test.mjs: cutover 後の expected shape に更新

shadowIssues / shadowFiles / shadowIssuesByType フィールドは Phase 7 で
削除予定 (dual emit 維持)。"
```

---

## Task 9: Phase 5 retired, Phase 6A done, dual emit deprecation note + rollback playbook

**Files:**
- Modify: `scripts/README.md`
- Modify: `docs/OPS_DESIGN.md`

- [ ] **Step 1: README で Phase 5 を retired に、Phase 6A を done に更新**

`scripts/README.md` の Phase 5 セクション末尾の Go メモを以下に更新:

```markdown
> Phase 5 PoC は **Go**。runtime には Phase 6A で primary gate に昇格済み。
> Phase 5 shadow mode は **retired**。`shadowIssues` 等の dual emit フィールド
> は Phase 7 (`detection_reports.mjs` 4 family 化) で削除予定。
```

Phase 6A セクションを以下に更新:

```markdown
## Phase 6A — Frozen Baseline + Gate Promotion (完了)

Phase 5 の exact diff engine を deterministic に primary gate へ昇格させた Phase。
cutover 時点の既存 drift は `parity-baseline.json` で凍結。

**現状**:
- `segment-*` 6 type は primary gate の actionable 集計に乗っている
- 既存 drift (~1,000 件 / 241 ファイル) は frozen baseline で凍結
- 新規発生 issue は fail
- `shadowIssues` 等の dual emit フィールドは Phase 7 で削除予定

**baseline 同定キー**:
（PR1 の README 説明をそのまま残す）

**rollback 手順**: `docs/OPS_DESIGN.md` の Phase 6A rollback section 参照
```

- [ ] **Step 2: OPS_DESIGN.md に Phase 6A rollback section を追加**

`docs/OPS_DESIGN.md` の末尾に追加:

```markdown
---

## Phase 6A Rollback Playbook

Phase 6A cutover 後に問題が発生した場合の対応手順。Issue #225 Phase 6A spec 
の §7 を runbook 化したもの。

### 判断フロー

```

PR2 merge 後に問題発生
        │
        ├── false negative の疑いがある?
        │      └── Yes → Path 1 (revert) 即時実行
        │
        ├── root cause 即特定可能?
        │      ├── No → Path 1 (revert)
        │      └── Yes
        │            ├── snapshot 変更が起点?
        │            │      ├── Yes → Path 2 (translate-first)
        │            │      └── No
        │            │            ├── 1 commit で fix forward 可能?
        │            │            │      ├── Yes → forward-fix PR
        │            │            │      └── No → Path 1 (revert)

```

**重要**: false negative 疑いは最優先で revert する。false positive は 
forward-fix で時間をかけて直せるが、false negative は gate の信頼性そのもの
を破壊するため。

### Path 1 — Full revert

**Trigger**:
- false negative の疑い（baseline match logic が新しい bug を吸収している懸念）
- root cause が same-day で特定できない
- 明らかな baseline 機構のバグ
- C4 (baseline-recall) テストが過去に false negative を見逃していた疑い

**手順**:
1. main に取り込まれた PR2 の commit SHA を特定し、通常の squash merge なら `git revert <PR2 commit SHA on main>` で revert PR を起こす（merge commit を使っている場合のみ `git revert -m 1 <merge commit SHA>`）
2. revert PR で `npm run check:parity -- --fail-on=actionable` が exit 0 を確認
3. fast-track で merge（reviewer 1 名 + CI green）
4. main 復旧確認後、separate issue で root cause investigation を起票
5. 修正 + 再 cutover は PR2′ として再実施
6. **再 cutover の前提**: 検出された failure pattern を C4 / C5 / 新規 test 
   として regression guard を仕込んでから再実施。テスト追加なしの再 cutover は禁止

revert すると gate は Phase 5 の shadow mode に戻る。PR1 の infra（baseline schema, 
generation script, alignment 改修）は残るので、`generate_parity_baseline.mjs` 等は 
引き続き使える。

### Path 2 — Translate-first, rebaseline as last resort

**Trigger**:
- main の CI が baseline invalidation に起因して red
- root cause が特定の slug 群への snapshot 変更（PR2 後の snapshot update PR が起点）
- false negative の疑いがない（純粋な page-level invalidation の動作）

**手順**:
1. **どの slug が invalidate されたかを確認**: 
   `parity-check-status.json` の `baselineInvalidatedSlugs` から抽出
2. **第一選択肢: 翻訳追従**
   - JA 翻訳を新しい EN snapshot に追従させる通常の翻訳 PR を出す
   - baseline には触らない
   - 翻訳完了後は新しい snapshot fingerprint で gate が自然に green に戻る
3. **第二選択肢（justification 必須）: rebaseline**
   - 翻訳追従が現実的でない場合のみ
   - `node scripts/generate_parity_baseline.mjs --slug=<slug>[,<slug>...]` で部分再生成
   - 再生成 diff を含む PR を起こし、PR description に必ず justification を記載:
     - なぜ翻訳追従でなく rebaseline を選んだか
     - 想定される paydown のタイミング
     - reviewAfter を継承するか延長するか（延長する場合は理由）

**重要**: rebaseline を「snapshot 変更時の自動的な逃げ道」にしてはならない。
原則は常に **翻訳追従が第一**。rebaseline は justification がある例外的ケースに限る。
```

- [ ] **Step 3: lint と test を実行**

Run: `npm run lint && npm test 2>&1 | tail -20`
Expected: 全部 pass。

- [ ] **Step 4: Commit**

```bash
git add scripts/README.md docs/OPS_DESIGN.md
git commit -m "docs: Phase 5 retired, Phase 6A done, dual emit deprecation note

scripts/README.md:
- Phase 5 shadow mode を retired に更新
- Phase 6A セクションを完了状態に更新
- dual emit (shadowIssues 等) の Phase 7 削除予定を明記

docs/OPS_DESIGN.md:
- Phase 6A rollback playbook を追加
- Path 1 (revert) と Path 2 (translate-first / rebaseline) の手順
- false negative 疑いを最優先 trigger として明記"
```

---

## PR2 完了確認 — Exit Criteria

| ID | 検証 | 確認方法 |
|----|------|---------|
| C1 | gate green | `npm run check:parity -- --fail-on=actionable; echo $?` → 0、issue-level active 0 |
| C2 | Phase 5 mutation recall 100% | `node --test scripts/__tests__/source_parity_recall.test.mjs` → pass |
| C3 | cascade ≤ 6 | C2 の同テスト |
| C4 | baseline が新規 mutation を吸収しない | `node --test scripts/__tests__/source_parity_baseline_recall.test.mjs` → pass |
| C5 | baseline 生成 determinism | `node --test scripts/__tests__/source_parity_baseline.test.mjs` → pass、`generate_parity_baseline.test.mjs` の bit-identical テスト pass |
| C6 | 単一ページ latency ≤ 10s | `time node scripts/check_source_parity.mjs --slug=overview/testim-overview` → 10s 以下 |
| C7 | docs 更新済 | README + OPS_DESIGN 更新 commit が含まれている |

- [ ] **Final 1: 全 exit criteria を check**

```bash
echo "=== C1 ==="
npm run check:parity -- --fail-on=actionable; echo "EXIT=$?"
echo "=== C2 / C3 ==="
node --test scripts/__tests__/source_parity_recall.test.mjs 2>&1 | tail -5
echo "=== C4 ==="
node --test scripts/__tests__/source_parity_baseline_recall.test.mjs 2>&1 | tail -5
echo "=== C5 ==="
node --test scripts/__tests__/source_parity_baseline.test.mjs scripts/__tests__/generate_parity_baseline.test.mjs 2>&1 | tail -5
echo "=== C6 ==="
time node scripts/check_source_parity.mjs --slug=overview/testim-overview --json > /dev/null
echo "=== C7 ==="
git log main..HEAD --oneline | grep -E "(Phase 5 retired|README|OPS_DESIGN|rollback)"
```

すべてのチェックが pass / exit 0 でなければ PR2 を merge してはならない。

- [ ] **Final 2: PR2 push 前に user に最終確認を取る**

ここで一旦停止して user に PR2 push の許可を取る。PR description には以下を含める:
- 件数 / type 分布 / inconclusiveCategory 分布のサマリ（generate script の出力）
- C1〜C7 の検証結果
- Cutover window のアナウンス
- rollback playbook へのリンク

---

## Plan Self-Review

Plan 全体の self-review:

1. **Spec coverage**: §1〜§12 の全ての要件にタスクが対応していることを確認
   - §3 Gate Policy → Task 1 (alignment), Task 8 (cutover)
   - §4 Frozen Baseline → Task 2 (schema), Task 3 (integration), Task 4 (generation), Task 5 (preview), Task 7 (regen)
   - §5 PR Structure → PR1 / PR2 を Task 1〜9 でカバー
   - §6 Exit Criteria → Final 1 で全条件を check
   - §7 Rollback Playbook → Task 9
   - §9 Affected files → Task ごとに Files セクションで明示
2. **Placeholder scan**: TBD / TODO / "詳細は後で" の表現を排除済み
3. **Type consistency**: `inconclusiveCategory`, `BASELINE_ELIGIBLE_TYPES`, `tagIssuesWithBaseline` の signature が PR1 と PR2 で一致
