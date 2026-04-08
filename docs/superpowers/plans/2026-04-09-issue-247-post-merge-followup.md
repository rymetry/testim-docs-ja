# Issue #247 Post-Merge Complete Resolution Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (inline batch with checkpoints) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Issue #247 を「baseline で隠している分も含めて」完全解消する。代表ページ 3 件は JA を実修正し、artifact 2 ページは extractor/normalizer を実装して吸収し、`faq` は preprocessor を強化して source-unusable から脱却させ、legacy orphan entries を掃除し、残った契約バグとテスト・運用 docs を実装と同期する。

**Architecture:** 9 フェーズの直列構成。Phase A-C は基盤修正(契約バグ・migration 安全性・observability)、Phase D-F は実 debt の除去(JA 修正 / artifact absorber / faq parser)、Phase G-I は統合(baseline 再生成 / fixture 拡張 / docs + Issue closure)。各フェーズで TDD サイクル(RED → GREEN → COMMIT)を守り、Phase 末で `npm run test` / `npm run lint` / `npm run check:parity` を走らせて回帰を検知する。

**Tech Stack:** Node.js 20, `node:test` + `node:assert`, Astro 6 (無関係), MadCap Flare HTML preprocessor, bespoke EN/JA segment extractors と canonical block sequence comparator。

**File ownership map (Phase をまたいで触るファイル):**
- `scripts/lib/source_parity_source_usability.mjs` — Phase A (reason token を detail に埋め込む)
- `scripts/lib/source_parity_acknowledgements.mjs` — Phase A (docstring の契約記述を実装と同期)
- `scripts/lib/source_parity_baseline.mjs` — Phase B (`validateTypesArg` helper 追加), Phase C (`computeOrphanBaselineEntries` helper 追加)
- `scripts/generate_parity_baseline.mjs` — Phase B (main() で `validateTypesArg` を配線)
- `scripts/lib/source_parity_summary.mjs` — Phase C (`orphanBaselineEntries` counter)
- `scripts/check_source_parity.mjs` — Phase C (per-slug `matchedKeys` を消費), Phase G (再生成後の検証), Phase H.2 (test-only `baselinePath` / `outputPath` 注入で integration test を隔離)
- `scripts/lib/detection_reports.mjs` — Phase C (followup report に orphan を追加)
- `scripts/lib/turndown.mjs` — Phase F (`unescapeDetails` + 新規 `normalizeEscapedFaqDetails` で broken multi-paragraph details を **valid sibling `<h2>/<p>` block tree** に再構成, Finding 14 対応の最終方針)
- `scripts/lib/source_parity_segments_en.mjs` — Phase E (FileOrFilePath list item / table-cell-inside-ul の normalization). **Phase F は extractor を touch しない** (Finding 6 でスコープ縮小)
- `src/content/docs/running-tests/the-command-line-cli.md` — Phase D (JA 構造修正)
- `src/content/docs/results/test-results/network-logs.md` — Phase D (JA 構造修正)
- `src/content/docs/advanced-editing/validations/email-validation.md` — Phase D (JA 構造修正)
- `parity-baseline.json` — Phase G (cutover 後の再生成)
- `scripts/__tests__/*.test.mjs` — Phase A/B/C/H (tests が随時追加)
- `docs/OPS_DESIGN.md` — Phase A/C/I (契約記述と完了条件更新)
- `scripts/README.md` — Phase A/I (CLI 契約の同期)

**重要な設計決定 (codex advice 反映済み):**
- `main(['--types='])` は `main()` が `process.argv.slice(2)` をハードコードしているため直接テストできない。**Phase B では `validateTypesArg(types)` という純粋関数 helper を新設し、helper 単体を test する。** `main()` は helper を呼ぶだけの thin wrapper にする。

**Plan 改訂履歴 (2026-04-09 post-drafting review 第 1 弾 — Finding 1-4):**
- **Finding 1** (当時): Phase F の preprocessor 修正だけでは faq は green にならない。`walkDetails` が summary を `details-summary` kind で emit するため。→ **F.2.5 で extractor を summary→heading に書き換える案を追加** (**第 2 弾で破棄**)
- **Finding 2**: Phase G の purge 対象 `pull-requests` は legacy `segment-inconclusive` の他に **live な `snapshot-incomplete (extractor-empty)` 実測確認済み** が同居。→ **Phase G.2/G.3 を `FULL_PURGE_SLUGS` (6) と `RESEED_SLUGS` (2: salesforce-testing-overview + pull-requests) に分割**
- **Finding 3**: Phase H.2 の orphan E2E test が「存在しない slug に架空 entry」を使う設計だが、orphan 検知は checked slug にしか反応しないため false negative になる。→ **Phase H.2 を「存在する clean slug に synthetic stale entry を仕込む」設計に変更**
- **Finding 4**: `result: pass` は local で達成不可能(`freshnessState: broken` → `inconclusive` に degrade される実装契約)。→ **Phase G.4 / Phase I の完了条件を `reportableActiveFiles === 0 && orphanBaselineEntries === 0` に緩和**

**Plan 改訂履歴 (2026-04-09 post-drafting review 第 2 弾 — Finding 5-8):**
- **Finding 5 [P1]**: 第 1 弾の F.2.5 「EN extractor の summary→heading 昇格」案のテスト自体が不正。(1) `<h1>` は `h1Consumed` フラグで skip される契約 (`source_parity_segments_en.mjs:394`, 既存 test `source_parity_segments_en.test.mjs:25` で pin) なので `h1 + 2 summary = 3 headings` は成立しない。(2) Segment schema は `textNorm` フィールドで `text` は存在しない (`source_parity_segments_shared.mjs:184`)。→ **F.2.5 を extractor 変更から preprocessor 正規化に方針転換**
- **Finding 6 [P1]**: `details-summary` は `STRUCTURE_COMPARATOR_KINDS` の **FROZEN 語彙** で baseline identity key に畳み込まれている (`source_parity_structure.mjs:74-81`)。さらに JA extractor も `<summary>` を `details-summary` として emit (`source_parity_segments_ja.mjs:366-368`)、`coding-assistant.md` には raw `<details><summary>` が残っている。EN 側だけ変えると契約が割れ、FAQ は救えても別ページで regression を作る。→ **F.2.5 は extractor / frozen 語彙に触らず、`turndown.mjs::normalizeEscapedFaqDetails` による preprocessor 正規化に限定**
- **Finding 7 [P2]**: `SUMMARY_HEADING_LEVEL = 2` 固定は `pushHeading` の `entry.level < level` フィルタ (`source_parity_segments_shared.mjs:134`) によってネストした parent h2 を落とす。`Examples > Q1` ではなく `Q1` になる。→ **extractor 変更案を破棄したので本 Finding は moot、ただし記録として残す**
- **Finding 8 [P3]**:
  - Phase G.3 の期待値が緩い (`'snapshot-incomplete' or 'source-unusable'` を許容)。regression を飲み込む。→ **G.3 を `issueType` + `usabilityReason` ペア厳密 assert に強化** (`salesforce-testing-overview`: `snapshot-incomplete/shallow-snapshot`, `pull-requests`: `snapshot-incomplete/extractor-empty`)
  - Phase H.1 の placeholder が plan 完了前に実 slug へ置換される前提が不明確。→ **H.1 に「置換手順」節を追加し、placeholder のままでは実行できないことを明記**

**Plan 改訂履歴 (2026-04-09 post-drafting review 第 4 弾 — Finding 9-13):**
- **Finding 9 [P1]**: 第 2 弾の F.2.5 発火条件 `spansMultipleP` (`<p>` 内で open あり close なし) は実 snapshot の `coding-assistant.html:120` (`<p>Here are some examples... &lt;details&gt;...&lt;/summary&gt;</p>`) にも match していた。結果として coding-assistant の sample prompt が `<h2>` に潰される false positive。→ **discriminator を `startsWith('&lt;details&gt;')` に変更** (faq は `<p>&lt;details&gt;...`、coding-assistant は `<p>Here are some examples... &lt;details&gt;...` で区別)
- **Finding 10 [P1]**: `summary→h2` 変換 regex `(?:<b>)?` が raw `<b>` しかマッチせず、実 snapshot では両 page とも `&lt;b&gt;` (escaped) を使っているため `<h2>&lt;b&gt;Q&lt;/b&gt;</h2>` が生成されていた。→ **regex を escaped `&lt;b&gt;` 対応に修正、さらに captured inner から残存 escaped HTML tag を strip する保険を追加**
- **Finding 11 [P2]**: 初稿 F.2.5 の RED test fixture が raw `<b>` を使っていたため、regex バグが検出できない false assurance。→ **narrow fixture は escaped `&lt;b&gt;` を使う + 実 `faq.html` / `coding-assistant.html` を読む test を新規追加**
- **Finding 12 [P2]**: coding-assistant 回帰 test が `assert.ok(out.length > 0)` しか見ておらず弱すぎ。→ **coding-assistant.html の `<h2>` count を preprocess 前後で同値 assert、sample prompt が `<h2>` に昇格していないことを明示 pin**
- **Finding 13 [P2]**: Self-Review appendix に第 2 弾の古い記述 (「F.2.5 extractor summary→heading 昇格」) が残存していた。→ **Self-Review 第 2 弾エントリに「後に第 3/4 弾で再設計」の注釈を追加**

**Plan 改訂履歴 (2026-04-09 post-drafting review 第 5 弾 — Finding 14-15):**
- **Finding 14 [P1]**: 第 4 弾の F.2.5 は `&lt;summary&gt;...&lt;/summary&gt; -> <h2>...</h2>` と `&lt;details&gt;` 削除を全体置換していたが、そのままだと `preprocessEnHtml()` の出力に **`<p><h2>Q</h2>...` という invalid HTML** が残る。`turndown` は DOM repair で Markdown 化できる一方、`extractSegmentsFromHtml()` は `preprocessEnHtml()` の結果をそのまま tokenize / tree walk するため heading を拾えず、faq は依然 `heading-count-mismatch` に落ちる。→ **F.2.5 を paragraph-aware な block rewrite に再設計し、valid sibling `<h2></h2><p>...</p>` を emit する方針へ変更。RED/GREEN test も `extractSegmentsFromHtml()` の heading 件数と `/<p>\\s*<h2>/` 非存在を直接 pin する**
- **Finding 15 [P2]**: 第 4 弾の H.2 orphan E2E は repo-global `parity-baseline.json` / `parity-check-status.json` を直接 backup/restore する設計だが、既存 suite にも同じ status file を触る integration test があり、`npm test` (`node --test scripts/__tests__/*.mjs`) 下で race / flake の余地がある。→ **H.2 は `checkSourceParity({ baselinePath, outputPath })` の test-only 注入 hook を先に追加し、temp copy を使う isolated integration test へ変更**

**Phase 間依存関係 (実行順が固定):**
```
A (ack 契約修正) ──┐
                  │
B (--types 検証) ──┤── C (orphan detection) ──┐
                  │                           │
                  │                           │
                  ├──────── F (faq parser) ───┤
                  │                           │
                  ├──────── E (artifact 吸収)─┤
                  │                           │
                  └──────── D (JA 修正) ──────┤
                                              │
                                              G (baseline 再生成) ── H (fixture 拡張) ── I (docs + Issue 閉鎖)
```
A/B は独立。C は A/B が安定してから(orphan 検知テストで ack/baseline 契約を使うため)。D/E/F は B/C が安定してから(baseline 再生成の安全性確保のため)。G は D/E/F 全部が終わってから(baseline を一度に再生成する)。H は各 phase で fixture を足していく。I は最後。

---

## Phase A: `source-unusable` ack 契約の修正

### Task A.1: 失敗するべき結合テストを書く (RED)

**Files:**
- Create: `scripts/__tests__/source_parity_usability_ack_integration.test.mjs`

**Context:** `detectSourceUsability()` が emit する実際の issue object に対して `findMatchingAcknowledgement()` を呼び、`detailIncludes: "escaped-details-residue"` で match するかを確認する。現状は detail に reason token が含まれないので match しない → test は RED になるはず。

- [ ] **Step 1: 新規テストファイルを作成**

```js
// scripts/__tests__/source_parity_usability_ack_integration.test.mjs
/**
 * Issue #247 post-merge — detectSourceUsability → findMatchingAcknowledgement の
 * round-trip 結合テスト。実 emitter の出力に対して ack matcher が機能することを
 * 保証する。fabricated detail string で通るテストの再発を防ぐセーフティネット。
 */
import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

let detectSourceUsability;
let extractSegmentsFromHtml;
let extractSegmentsFromMarkdown;
let findMatchingAcknowledgement;
let computeSnapshotFingerprint;

before(async () => {
  ({ detectSourceUsability } = await import('../lib/source_parity_source_usability.mjs'));
  ({ extractSegmentsFromHtml } = await import('../lib/source_parity_segments_en.mjs'));
  ({ extractSegmentsFromMarkdown } = await import('../lib/source_parity_segments_ja.mjs'));
  ({ findMatchingAcknowledgement, computeSnapshotFingerprint } = await import(
    '../lib/source_parity_acknowledgements.mjs'
  ));
});

const ROOT = join(import.meta.dirname, '../../');
const SNAPSHOTS_DIR = join(ROOT, 'snapshots/en/content');
const JA_CONTENT_DIR = join(ROOT, 'src/content/docs');

function extractJaBody(md) {
  return md.replace(/^---[\s\S]*?---\n/m, '').trim();
}

function buildAckEntry({ slug, issueType, detailIncludes, fingerprint }) {
  return {
    slug,
    issueType,
    sourceFingerprint: fingerprint,
    reason: 'known source-side debt, tracked in ops queue',
    owner: 'snapshot-ops',
    reviewAfter: '2027-01-01',
    detailIncludes,
  };
}

describe('Issue #247 post-merge — detector→matcher round-trip (source-unusable)', () => {
  it('faq (escaped-details-residue) は detailIncludes で ack 可能', () => {
    const rawEnHtml = readFileSync(
      join(SNAPSHOTS_DIR, 'salesforce-testing/faq.html'),
      'utf8',
    );
    const jaBody = extractJaBody(
      readFileSync(join(JA_CONTENT_DIR, 'salesforce-testing/faq.md'), 'utf8'),
    );
    let enSegments = [];
    let extractError = null;
    try {
      enSegments = extractSegmentsFromHtml(rawEnHtml);
    } catch (e) {
      extractError = e;
    }
    const jaSegments = extractSegmentsFromMarkdown(jaBody);

    const issue = detectSourceUsability({ rawEnHtml, enSegments, jaSegments, extractError });
    assert.ok(issue, 'detector は issue を返すべき');
    assert.equal(issue.type, 'source-unusable');

    const fingerprint = computeSnapshotFingerprint(rawEnHtml);
    const entry = buildAckEntry({
      slug: 'salesforce-testing/faq',
      issueType: 'source-unusable',
      detailIncludes: 'escaped-details-residue',
      fingerprint,
    });

    const match = findMatchingAcknowledgement(
      'salesforce-testing/faq',
      issue,
      [entry],
      fingerprint,
      '2026-04-09',
    );
    assert.ok(
      match,
      'detailIncludes: "escaped-details-residue" は実 emitter 出力の detail に当たるべき ' +
      `(actual detail=${JSON.stringify(issue.detail)})`,
    );
    assert.equal(match.expired, false);
  });

  it('salesforce-testing-overview (shallow-snapshot) は detailIncludes で ack 可能', () => {
    const rawEnHtml = readFileSync(
      join(SNAPSHOTS_DIR, 'salesforce-testing/salesforce-testing-overview.html'),
      'utf8',
    );
    const jaBody = extractJaBody(
      readFileSync(
        join(JA_CONTENT_DIR, 'salesforce-testing/salesforce-testing-overview.md'),
        'utf8',
      ),
    );
    let enSegments = [];
    let extractError = null;
    try {
      enSegments = extractSegmentsFromHtml(rawEnHtml);
    } catch (e) {
      extractError = e;
    }
    const jaSegments = extractSegmentsFromMarkdown(jaBody);

    const issue = detectSourceUsability({ rawEnHtml, enSegments, jaSegments, extractError });
    assert.ok(issue);
    assert.equal(issue.type, 'snapshot-incomplete');

    const fingerprint = computeSnapshotFingerprint(rawEnHtml);
    const entry = buildAckEntry({
      slug: 'salesforce-testing/salesforce-testing-overview',
      issueType: 'snapshot-incomplete',
      detailIncludes: 'shallow-snapshot',
      fingerprint,
    });

    const match = findMatchingAcknowledgement(
      'salesforce-testing/salesforce-testing-overview',
      issue,
      [entry],
      fingerprint,
      '2026-04-09',
    );
    assert.ok(match, 'shallow-snapshot token は detail に含まれるべき');
  });
});
```

- [ ] **Step 2: テストを実行して失敗を確認**

Run: `npm test -- --test-reporter=spec scripts/__tests__/source_parity_usability_ack_integration.test.mjs`

Expected: FAIL。`detectSourceUsability` は issue を返すが、`findMatchingAcknowledgement` が `null` を返す(detail に `escaped-details-residue` / `shallow-snapshot` 文字列が含まれないため)。エラー message は `expected a match for source-unusable via detailIncludes` 相当。

### Task A.2: `describeReason` に reason token suffix を追加 (GREEN)

**Files:**
- Modify: `scripts/lib/source_parity_source_usability.mjs:218-246`

**Context:** `describeReason()` の各 return に `[reason=<token>]` suffix を追加することで、`detail` 文字列に構造化 reason を埋め込む。既存の prose は維持する(reviewer 可読性のため)。

- [ ] **Step 1: `describeReason` を修正**

変更前:
```js
function describeReason(type, reason, signals) {
  switch (reason) {
    case 'extractor-empty':
      return (
        `EN snapshot extractor produced 0 body segments while JA has ` +
        `${signals.jaBodySegmentCount} body segments — snapshot likely shallow / fetch incomplete`
      );
    case 'escaped-details-residue': {
      const n =
        signals.residualEscapedDetailsOpen + signals.residualEscapedDetailsClose;
      return (
        `EN HTML still contains ${n} escaped <details> markers after preprocessEnHtml ` +
        `— widget tree is unbalanced and comparator cannot align sections`
      );
    }
    case 'shallow-snapshot': {
      const ratio =
        signals.enBodySegmentCount === 0
          ? signals.jaBodySegmentCount
          : (signals.jaBodySegmentCount / signals.enBodySegmentCount).toFixed(1);
      return (
        `EN body has ${signals.enBodySegmentCount} segments while JA body has ` +
        `${signals.jaBodySegmentCount} (${ratio}× larger) — snapshot likely missing main article body`
      );
    }
    default:
      return `${type}: ${reason}`;
  }
}
```

変更後:
```js
function describeReason(type, reason, signals) {
  // Issue #247 post-merge — reason token を detail 末尾に埋め込むことで、
  // `findMatchingAcknowledgement` の `detailIncludes` / `detailRegex` が
  // 安定して狙い撃てるようにする。generic ack contract を維持するための
  // 最小変更。baseline 経路は従来通り `usabilitySignals.reason` を読む。
  const tokenSuffix = ` [reason=${reason}]`;
  switch (reason) {
    case 'extractor-empty':
      return (
        `EN snapshot extractor produced 0 body segments while JA has ` +
        `${signals.jaBodySegmentCount} body segments — snapshot likely shallow / fetch incomplete` +
        tokenSuffix
      );
    case 'escaped-details-residue': {
      const n =
        signals.residualEscapedDetailsOpen + signals.residualEscapedDetailsClose;
      return (
        `EN HTML still contains ${n} escaped <details> markers after preprocessEnHtml ` +
        `— widget tree is unbalanced and comparator cannot align sections` +
        tokenSuffix
      );
    }
    case 'shallow-snapshot': {
      const ratio =
        signals.enBodySegmentCount === 0
          ? signals.jaBodySegmentCount
          : (signals.jaBodySegmentCount / signals.enBodySegmentCount).toFixed(1);
      return (
        `EN body has ${signals.enBodySegmentCount} segments while JA body has ` +
        `${signals.jaBodySegmentCount} (${ratio}× larger) — snapshot likely missing main article body` +
        tokenSuffix
      );
    }
    default:
      return `${type}: ${reason}${tokenSuffix}`;
  }
}
```

- [ ] **Step 2: テスト再実行で integration test が GREEN になることを確認**

Run: `npm test -- --test-reporter=spec scripts/__tests__/source_parity_usability_ack_integration.test.mjs`

Expected: PASS。`detail` に `[reason=escaped-details-residue]` / `[reason=shallow-snapshot]` が含まれるため `detailIncludes` が match する。

- [ ] **Step 3: 既存 detector テストの回帰確認**

Run: `npm test -- scripts/__tests__/source_parity_source_usability.test.mjs scripts/__tests__/source_parity_source_usability_fixtures.test.mjs`

Expected: PASS。既存テストは `result.detail.length > 0` と `result.usabilitySignals.reason === ...` しか見ていないので、suffix 追加で破れない(`source_parity_source_usability.test.mjs:460-461` 参照)。

### Task A.3: fabricated ack test を実 emitter 出力 pattern に差し替え

**Files:**
- Modify: `scripts/__tests__/source_parity_acknowledgements.test.mjs:919-942`

**Context:** 既存の test は `detail: 'source snapshot is unusable (escaped-details-residue)'` という fabricated string で ack match を assert していた。これを実 emitter が生成する prose pattern (`[reason=escaped-details-residue]` を含む) に差し替える。

- [ ] **Step 1: 既存テストを実 emitter 出力 pattern に差し替え**

変更前(lines 919-942):
```js
it('findMatchingAcknowledgement matches source-unusable via detailIncludes on usability reason', () => {
  // source-unusable は page-level issue だが、validateAcknowledgements は
  // detailIncludes / detailRegex のいずれかを必須にする。emitter が
  // detail 文字列に usabilityReason 由来の wording を埋め込むので、
  // ack entry 側で reason 文字列を detailIncludes に書けば狙い撃てる。
  const entry = baseAckEntry({
    slug: 'salesforce-testing/faq',
    issueType: 'source-unusable',
    detailIncludes: 'escaped-details-residue',
  });
  const issue = {
    type: 'source-unusable',
    detail: 'source snapshot is unusable (escaped-details-residue)',
  };
  const match = findMatchingAcknowledgement(
    'salesforce-testing/faq',
    issue,
    [entry],
    VALID_FP,
    '2026-04-08',
  );
  assert.ok(match, 'expected a match for source-unusable via detailIncludes');
  assert.equal(match.expired, false);
});
```

変更後:
```js
it('findMatchingAcknowledgement matches source-unusable via detailIncludes on usability reason', () => {
  // Issue #247 post-merge — emitter の describeReason() は detail 末尾に
  // `[reason=<token>]` を埋め込むので、ack entry 側はこの token 文字列を
  // detailIncludes に書けば狙い撃てる。実 emitter の生成 pattern に対して
  // assert すること (fabricated string は使わない — 再発防止)。
  const entry = baseAckEntry({
    slug: 'salesforce-testing/faq',
    issueType: 'source-unusable',
    detailIncludes: '[reason=escaped-details-residue]',
  });
  const issue = {
    type: 'source-unusable',
    // 実 describeReason('source-unusable', 'escaped-details-residue', ...) の
    // 出力形式を pin する。signals の数値部分は具体値を埋めておく。
    detail:
      'EN HTML still contains 3 escaped <details> markers after preprocessEnHtml ' +
      '— widget tree is unbalanced and comparator cannot align sections ' +
      '[reason=escaped-details-residue]',
  };
  const match = findMatchingAcknowledgement(
    'salesforce-testing/faq',
    issue,
    [entry],
    VALID_FP,
    '2026-04-08',
  );
  assert.ok(match, 'expected a match for source-unusable via detailIncludes');
  assert.equal(match.expired, false);
});
```

- [ ] **Step 2: 既存 ack test suite 全体で回帰確認**

Run: `npm test -- scripts/__tests__/source_parity_acknowledgements.test.mjs`

Expected: 全テスト PASS。

### Task A.4: 契約を docstring と運用 docs に同期

**Files:**
- Modify: `scripts/lib/source_parity_acknowledgements.mjs:8-19` (module docstring)
- Modify: `docs/OPS_DESIGN.md:80` (contract 記述)
- Modify: `scripts/README.md:122` 周辺 (ack 契約記述)

- [ ] **Step 1: `source_parity_acknowledgements.mjs` の module docstring を更新**

変更前:
```js
/**
 * ...
 * Issue #247 PR5 以降、structure mismatch (section-structure-mismatch /
 * segment-order-mismatch) と source unusable (snapshot-incomplete /
 * source-unusable) も当 matcher の generic contract (slug + issueType +
 * detailIncludes/detailRegex) でそのまま ack 可能。専用分岐や専用 key
 * 構築は **追加しない** — 追加すると generic contract から外れて二重
 * メンテナンスになるため。structure mismatch を ack する場合は detail に
 * 埋め込まれた section path を detailIncludes で狙い撃てばよい (例:
 * `detailIncludes: "[Viewing the network logs at the step level >"`)。
 * 同様に source unusable は usabilityReason 由来の wording を狙い撃つ
 * (`detailIncludes: "escaped-details-residue"` 等)。
 */
```

変更後:
```js
/**
 * ...
 * Issue #247 PR5 以降、structure mismatch (section-structure-mismatch /
 * segment-order-mismatch) と source unusable (snapshot-incomplete /
 * source-unusable) も当 matcher の generic contract (slug + issueType +
 * detailIncludes/detailRegex) でそのまま ack 可能。専用分岐や専用 key
 * 構築は **追加しない** — 追加すると generic contract から外れて二重
 * メンテナンスになるため。
 *
 * structure mismatch を ack する場合は detail に埋め込まれた section path を
 * detailIncludes で狙い撃てばよい (例: `detailIncludes: "[Viewing the network
 * logs at the step level >"`)。
 *
 * source unusable は emitter (`source_parity_source_usability.mjs::describeReason`)
 * が detail 末尾に `[reason=<token>]` を埋め込むので、ack entry 側は
 * `detailIncludes: "[reason=escaped-details-residue]"` /
 * `"[reason=shallow-snapshot]"` / `"[reason=extractor-empty]"` の形で指定する。
 * この契約が壊れていると silent no-op を起こすため、
 * `scripts/__tests__/source_parity_usability_ack_integration.test.mjs` が
 * 実 emitter → matcher の round-trip で回帰を検知する。
 */
```

- [ ] **Step 2: `docs/OPS_DESIGN.md` の ack 契約記述を更新**

現状の line ~80 に (source-unusable の wording 埋め込み形式を明記):

検索文字列: `\`detail\` は acknowledgements の \`detailIncludes\`/\`detailRegex\` マッチに使われるため不変`

置換後の文字列 (同じ行の後に段落を追加):
```markdown
`detail` は acknowledgements の `detailIncludes`/`detailRegex` マッチに使われるため不変。CLI 表示時のみ suffix として表示する。

**`source-unusable` / `snapshot-incomplete` の ack 形式**: emitter (`source_parity_source_usability.mjs::describeReason`) は `detail` 末尾に `[reason=<token>]` を埋め込む。ack 作成時はこの token を `detailIncludes` に指定する:

- `detailIncludes: "[reason=escaped-details-residue]"` — `<details>` widget tree 破壊
- `detailIncludes: "[reason=shallow-snapshot]"` — EN snapshot が本文欠損
- `detailIncludes: "[reason=extractor-empty]"` — extractor が body=0 を返した

`reason` token は `usabilitySignals.reason` と 1:1 対応で、baseline 側 (`buildBaselineKey`) は同じ token を構造化 identity key に使う。
```

- [ ] **Step 3: `scripts/README.md` の ack 契約記述を同期**

検索文字列: `slug + issueType + (detailIncludes or detailRegex) で一致`

同じ段落の直後に以下の注記を追加:
```markdown

`source-unusable` / `snapshot-incomplete` を ack する場合は `detailIncludes: "[reason=<token>]"` 形式を使う(`token` は `escaped-details-residue` / `shallow-snapshot` / `extractor-empty`)。emitter が `detail` 末尾に埋め込む reason token で狙い撃つ契約で、`source_parity_usability_ack_integration.test.mjs` が round-trip を保証する。
```

- [ ] **Step 4: 全テスト回帰**

Run: `npm test`

Expected: 全 test suite PASS。既存 describeReason 出力を文字列 include で見ている箇所が無いことは事前確認済み。

### Task A.5: Phase A を commit

- [ ] **Step 1: 変更内容を確認**

Run: `git status && git diff --stat`

- [ ] **Step 2: 関連ファイルのみ staged して commit**

```bash
git add scripts/lib/source_parity_source_usability.mjs \
        scripts/lib/source_parity_acknowledgements.mjs \
        scripts/__tests__/source_parity_acknowledgements.test.mjs \
        scripts/__tests__/source_parity_usability_ack_integration.test.mjs \
        docs/OPS_DESIGN.md \
        scripts/README.md
git commit -m "$(cat <<'EOF'
fix: Issue #247 post-merge — source-unusable ack 契約を実装と同期

describeReason() の detail 末尾に `[reason=<token>]` suffix を追加し、
findMatchingAcknowledgement の detailIncludes が安定して狙い撃てる
generic contract を復元する。従来は detail が prose だけで reason token
を含まず、ops docs の契約記述と食い違っていた (silent no-op)。

- detectSourceUsability → findMatchingAcknowledgement の round-trip
  結合テストを新規追加 (fabricated detail の再発防止)
- 既存の fabricated ack test を実 emitter 出力 pattern に差し替え
- OPS_DESIGN / scripts/README / 対象 module docstring を同期

refs Issue #247 post-merge review
EOF
)"
```

---

## Phase B: `--types` validation helper (codex advice 反映)

### Task B.1: `validateTypesArg` 失敗テスト (RED)

**Files:**
- Modify: `scripts/__tests__/generate_parity_baseline.test.mjs` (末尾に追加)

**Context:** codex advice に従い、`main(['--types='])` を直接 assert する代わりに、入力検証専用の純粋関数 `validateTypesArg(types)` を新設してそれをテストする。

- [ ] **Step 1: 新規 test describe を generate_parity_baseline.test.mjs 末尾に追加**

```js
// ファイル末尾 (describe('Issue #247 PR5 — mergePartialBaselineByType', ...) の後) に追加

// ---------------------------------------------------------------------------
// Issue #247 post-merge — validateTypesArg helper contract
//
// main() は process.argv.slice(2) を直読みするので main() 自体は直接
// テストできない。その代わりに --types CSV を検証する純粋関数を切り出し、
// ここで allowlist / 空配列 / typo をピン止めする。codex review に従った
// 設計で、CLI wiring はこの helper を呼ぶ thin wrapper に留める。
// ---------------------------------------------------------------------------

describe('Issue #247 post-merge — validateTypesArg', () => {
  let validateTypesArg;
  before(async () => {
    ({ validateTypesArg } = await import('../lib/source_parity_baseline.mjs'));
  });

  it('returns { ok: true } when types is null (--types not specified)', () => {
    assert.deepEqual(validateTypesArg(null), { ok: true });
  });

  it('returns { ok: false } for empty array (empty --types=)', () => {
    const result = validateTypesArg([]);
    assert.equal(result.ok, false);
    assert.match(result.error, /empty|空/);
  });

  it('returns { ok: false } for unknown types (typo guard)', () => {
    const result = validateTypesArg(['section-structure-misatch']);
    assert.equal(result.ok, false);
    assert.match(result.error, /unsupported|unknown|未知/);
    assert.match(result.error, /section-structure-misatch/);
  });

  it('returns { ok: false } when ANY element is unknown (mixed input)', () => {
    const result = validateTypesArg(['section-structure-mismatch', 'foo-bar']);
    assert.equal(result.ok, false);
    assert.match(result.error, /foo-bar/);
  });

  it('returns { ok: true } for the 4 PR5 migration types', () => {
    for (const t of [
      'section-structure-mismatch',
      'segment-order-mismatch',
      'snapshot-incomplete',
      'source-unusable',
    ]) {
      assert.deepEqual(
        validateTypesArg([t]),
        { ok: true },
        `${t} should be accepted`,
      );
    }
  });

  it('returns { ok: true } for a combination of the 4 PR5 migration types', () => {
    const result = validateTypesArg([
      'section-structure-mismatch',
      'snapshot-incomplete',
    ]);
    assert.deepEqual(result, { ok: true });
  });

  it('rejects legacy segment-* types (tightest allowlist — PR5 migration only)', () => {
    // segment-missing / segment-extra / segment-shifted / segment-untranslated /
    // segment-token-gap / segment-inconclusive は --types 経路では扱わない。
    // これらを書き換えたいときは --regenerate か --slug で処理する。
    for (const t of [
      'segment-missing',
      'segment-extra',
      'segment-shifted',
      'segment-untranslated',
      'segment-token-gap',
      'segment-inconclusive',
    ]) {
      const result = validateTypesArg([t]);
      assert.equal(
        result.ok,
        false,
        `${t} should NOT be accepted by --types (use --regenerate instead)`,
      );
    }
  });

  it('rejects non-array input defensively', () => {
    const result = validateTypesArg('section-structure-mismatch');
    assert.equal(result.ok, false);
  });
});
```

- [ ] **Step 2: テストを実行して失敗を確認**

Run: `npm test -- scripts/__tests__/generate_parity_baseline.test.mjs`

Expected: FAIL。`validateTypesArg` がまだ export されていないため import エラー、もしくは undefined 呼び出しエラー。

### Task B.2: `validateTypesArg` を実装 (GREEN)

**Files:**
- Modify: `scripts/lib/source_parity_baseline.mjs` (末尾付近に追加)

- [ ] **Step 1: 許可 type 定数を追加**

`BASELINE_ELIGIBLE_TYPES` 定義の直後 (line ~49 付近) に以下を追加:

```js
/**
 * Issue #247 post-merge — `generate_parity_baseline --types` で受け入れる
 * issueType の allowlist。BASELINE_ELIGIBLE_TYPES より狭く、PR5 migration
 * 対象 (structure mismatch + source unusable) の 4 type のみを許可する。
 *
 * これより広くすると `--types` が既存 segment-* entry を touch できて
 * しまい、reviewAfter の意図しない shift を起こす (§7.4 の意図と反する)。
 * 逆にこれより狭くすると PR5 migration 自体が不可能になる。
 *
 * `--types=` を空で渡した場合 (silent no-op が起きる入力パターン) も
 * このリストで reject される。
 *
 * @type {ReadonlySet<string>}
 */
export const TYPES_ARG_ALLOWLIST = Object.freeze(
  new Set([
    'section-structure-mismatch',
    'segment-order-mismatch',
    'snapshot-incomplete',
    'source-unusable',
  ]),
);

/**
 * `generate_parity_baseline.mjs --types=<csv>` の引数を検証する純粋関数。
 * `main()` は `process.argv.slice(2)` を直読みしているため単体テストしづらい
 * ので、検証ロジックを helper として切り出す。CLI wiring 側はこの helper の
 * 戻り値を見てエラー出力 → return 1 する thin wrapper に留める。
 *
 * 受理:
 *   - `null` (= `--types` flag が指定されていない) → `{ ok: true }`
 *   - `TYPES_ARG_ALLOWLIST` の非空部分集合 → `{ ok: true }`
 *
 * reject:
 *   - 非 Array → `{ ok: false, error: string }`
 *   - 空配列 → `{ ok: false, error: string }` (silent no-op 防止)
 *   - allowlist 外の要素を含む → `{ ok: false, error: string }`
 *
 * @param {unknown} types
 * @returns {{ ok: true } | { ok: false, error: string }}
 */
export function validateTypesArg(types) {
  if (types === null) return { ok: true };
  if (!Array.isArray(types)) {
    return {
      ok: false,
      error: `--types must be a comma-separated list (got ${typeof types})`,
    };
  }
  if (types.length === 0) {
    return {
      ok: false,
      error:
        '--types cannot be empty. Use --regenerate for a full rebuild, ' +
        `or pass a non-empty csv of: ${[...TYPES_ARG_ALLOWLIST].join(', ')}`,
    };
  }
  const unknown = types.filter((t) => !TYPES_ARG_ALLOWLIST.has(t));
  if (unknown.length > 0) {
    return {
      ok: false,
      error:
        `--types contains unsupported issueType(s): ${unknown.join(', ')}. ` +
        `Allowed: ${[...TYPES_ARG_ALLOWLIST].join(', ')}`,
    };
  }
  return { ok: true };
}
```

- [ ] **Step 2: テストを再実行して GREEN を確認**

Run: `npm test -- scripts/__tests__/generate_parity_baseline.test.mjs`

Expected: PASS。

### Task B.3: `generate_parity_baseline.mjs` の main() に配線

**Files:**
- Modify: `scripts/generate_parity_baseline.mjs:26-38, 534-550`

- [ ] **Step 1: `validateTypesArg` を import に追加**

現状 lines 26-33:
```js
import {
  BASELINE_ELIGIBLE_TYPES,
  STRUCTURE_CATEGORIES,
  USABILITY_REASONS,
  computeStructureFingerprint,
  validateBaseline,
  loadBaselineFile,
} from './lib/source_parity_baseline.mjs';
```

変更後:
```js
import {
  BASELINE_ELIGIBLE_TYPES,
  STRUCTURE_CATEGORIES,
  USABILITY_REASONS,
  computeStructureFingerprint,
  validateBaseline,
  loadBaselineFile,
  validateTypesArg,
} from './lib/source_parity_baseline.mjs';
```

- [ ] **Step 2: `main()` の mutex check 直後に validation を追加**

現状 lines 534-549:
```js
async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.regenerate && !args.slugs && !args.types) {
    printUsage();
    return 1;
  }
  // Issue #247 PR5 — --types は --regenerate / --slug と排他的。
  // 同時指定を許すと「partial mode なのに既存 segment-* も touch される」
  // 状態が起き得るので明示的に reject する。
  const modeCount =
    (args.regenerate ? 1 : 0) + (args.slugs ? 1 : 0) + (args.types ? 1 : 0);
  if (modeCount > 1) {
    console.error('❌ --regenerate / --slug / --types are mutually exclusive');
    printUsage();
    return 1;
  }
```

変更後 (mutex check の直後に追加):
```js
async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.regenerate && !args.slugs && !args.types) {
    printUsage();
    return 1;
  }
  // Issue #247 PR5 — --types は --regenerate / --slug と排他的。
  // 同時指定を許すと「partial mode なのに既存 segment-* も touch される」
  // 状態が起き得るので明示的に reject する。
  const modeCount =
    (args.regenerate ? 1 : 0) + (args.slugs ? 1 : 0) + (args.types ? 1 : 0);
  if (modeCount > 1) {
    console.error('❌ --regenerate / --slug / --types are mutually exclusive');
    printUsage();
    return 1;
  }
  // Issue #247 post-merge — --types の allowlist / 空配列 / typo は純粋 helper
  // に委譲して fail-fast する (silent no-op 再発防止)。
  {
    const validation = validateTypesArg(args.types);
    if (!validation.ok) {
      console.error(`❌ ${validation.error}`);
      printUsage();
      return 1;
    }
  }
```

- [ ] **Step 3: 結合パス(`parseArgs → validateTypesArg`)の test を追加**

`scripts/__tests__/generate_parity_baseline.test.mjs` の既存 `describe('Issue #247 post-merge — validateTypesArg', ...)` の直後に追加:

```js
describe('Issue #247 post-merge — parseArgs + validateTypesArg integration', () => {
  let parseArgs;
  let validateTypesArg;
  before(async () => {
    ({ parseArgs } = await import('../generate_parity_baseline.mjs'));
    ({ validateTypesArg } = await import('../lib/source_parity_baseline.mjs'));
  });

  it('parseArgs(["--types="]) produces an empty array which validateTypesArg rejects', () => {
    const args = parseArgs(['--types=']);
    // filter(Boolean) が空要素を落として [] になる
    assert.deepEqual(args.types, []);
    // その [] を validateTypesArg に渡すと reject される
    const v = validateTypesArg(args.types);
    assert.equal(v.ok, false);
  });

  it('parseArgs(["--types=typo"]) produces ["typo"] which validateTypesArg rejects', () => {
    const args = parseArgs(['--types=section-structure-misatch']);
    assert.deepEqual(args.types, ['section-structure-misatch']);
    const v = validateTypesArg(args.types);
    assert.equal(v.ok, false);
    assert.match(v.error, /section-structure-misatch/);
  });

  it('parseArgs(["--types=source-unusable"]) round-trips as valid', () => {
    const args = parseArgs(['--types=source-unusable']);
    assert.deepEqual(args.types, ['source-unusable']);
    const v = validateTypesArg(args.types);
    assert.equal(v.ok, true);
  });
});
```

- [ ] **Step 4: 全テスト回帰**

Run: `npm test -- scripts/__tests__/generate_parity_baseline.test.mjs`

Expected: PASS。

### Task B.4: Phase B を commit

- [ ] **Step 1: staging + commit**

```bash
git add scripts/lib/source_parity_baseline.mjs \
        scripts/generate_parity_baseline.mjs \
        scripts/__tests__/generate_parity_baseline.test.mjs
git commit -m "$(cat <<'EOF'
fix: Issue #247 post-merge — generate_parity_baseline --types の silent no-op を塞ぐ

`--types=` 空指定と typo で migration が silent no-op する問題を fail-fast に
切り替える。main() は process.argv を直読みしていて直接テストできないため、
純粋関数 validateTypesArg(types) を新設して単体テストを固める
(codex review 指摘)。

- TYPES_ARG_ALLOWLIST を PR5 migration 対象 4 type に narrow
- validateTypesArg: null / [] / typo / legacy segment-* / non-array を契約化
- main() は validation.ok をチェックして error return するだけの thin wrapper
- parseArgs + validateTypesArg の integration test で round-trip を pin

refs Issue #247 post-merge review
EOF
)"
```

---

## Phase C: Orphan baseline detection (runtime + summary)

### Task C.1: `computeOrphanBaselineEntries` helper の失敗テスト (RED)

**Files:**
- Modify: `scripts/__tests__/source_parity_baseline.test.mjs` (末尾に追加)

**Context:** `tagIssuesWithBaseline` は `matchedKeys` を返すが、consumer 側(`check_source_parity.mjs`)が使っていない。runtime 一致しない baseline entry を orphan として集計する純粋 helper を追加する。

- [ ] **Step 1: 新規 test describe を追加**

```js
// 既存 tagIssuesWithBaseline の test describe の後に追加

describe('Issue #247 post-merge — computeOrphanBaselineEntries', () => {
  let computeOrphanBaselineEntries;
  let tagIssuesWithBaseline;
  let buildBaselineKeyFromEntry;
  before(async () => {
    ({ computeOrphanBaselineEntries, tagIssuesWithBaseline, buildBaselineKeyFromEntry } =
      await import('../lib/source_parity_baseline.mjs'));
  });

  const SLUG = 'overview/example';
  const FP = 'sha256:' + 'a'.repeat(64);
  const EN_FP = 'sha256:' + 'b'.repeat(64);

  function segmentMissingEntry(idx) {
    return {
      slug: SLUG,
      issueType: 'segment-missing',
      sectionPath: 'Setup',
      segmentKind: 'paragraph',
      enSegmentIndex: idx,
      enSourceFingerprint: EN_FP,
      snapshotFingerprint: FP,
      reviewAfter: '2026-10-01',
    };
  }

  function segmentMissingIssue(idx) {
    return {
      type: 'segment-missing',
      severity: 'actionable',
      sectionPath: 'Setup',
      segmentKind: 'paragraph',
      enSegmentIndex: idx,
      enSourceFingerprint: EN_FP,
    };
  }

  it('returns [] when every entry matched a runtime issue', () => {
    const entries = [segmentMissingEntry(0), segmentMissingEntry(1)];
    const issues = [segmentMissingIssue(0), segmentMissingIssue(1)];
    const tagResult = tagIssuesWithBaseline(SLUG, issues, entries, FP, '2026-04-09');
    const orphans = computeOrphanBaselineEntries(SLUG, entries, tagResult.matchedKeys);
    assert.deepEqual(orphans, []);
  });

  it('returns entries whose key did not appear in matchedKeys', () => {
    const entries = [segmentMissingEntry(0), segmentMissingEntry(1), segmentMissingEntry(2)];
    // runtime issue は idx=0 のみ
    const issues = [segmentMissingIssue(0)];
    const tagResult = tagIssuesWithBaseline(SLUG, issues, entries, FP, '2026-04-09');
    const orphans = computeOrphanBaselineEntries(SLUG, entries, tagResult.matchedKeys);
    assert.equal(orphans.length, 2);
    assert.deepEqual(
      orphans.map((e) => e.enSegmentIndex).sort(),
      [1, 2],
    );
  });

  it('only considers entries for the given slug', () => {
    const entries = [
      segmentMissingEntry(0),
      { ...segmentMissingEntry(0), slug: 'other/page' },
    ];
    const issues = []; // nothing matches
    const tagResult = tagIssuesWithBaseline(SLUG, issues, entries, FP, '2026-04-09');
    const orphans = computeOrphanBaselineEntries(SLUG, entries, tagResult.matchedKeys);
    // 'other/page' entry は現在の slug の orphan ではない
    assert.equal(orphans.length, 1);
    assert.equal(orphans[0].slug, SLUG);
  });

  it('returns [] when the page was invalidated (fingerprint mismatch)', () => {
    const entries = [segmentMissingEntry(0), segmentMissingEntry(1)];
    const issues = [segmentMissingIssue(0), segmentMissingIssue(1)];
    const OTHER_FP = 'sha256:' + 'c'.repeat(64);
    // invalidated === true のケースは matchedKeys === Set() になる
    const tagResult = tagIssuesWithBaseline(SLUG, issues, entries, OTHER_FP, '2026-04-09');
    assert.equal(tagResult.invalidated, true);
    assert.equal(tagResult.matchedKeys.size, 0);
    // helper は invalidated を受け取らないので、呼び出し側が invalidated 時は
    // orphan 集計をスキップする契約。helper 自体は entries をそのまま返す。
    const orphans = computeOrphanBaselineEntries(SLUG, entries, tagResult.matchedKeys);
    assert.equal(
      orphans.length,
      2,
      'invalidated 時は全 entry が "unmatched" になるが、呼び出し側が invalidated フラグで skip する契約',
    );
  });

  it('orphan entries retain their original fields (identity preserved)', () => {
    const entries = [segmentMissingEntry(0)];
    const issues = [];
    const tagResult = tagIssuesWithBaseline(SLUG, issues, entries, FP, '2026-04-09');
    const orphans = computeOrphanBaselineEntries(SLUG, entries, tagResult.matchedKeys);
    assert.equal(orphans.length, 1);
    assert.equal(orphans[0].slug, SLUG);
    assert.equal(orphans[0].issueType, 'segment-missing');
    assert.equal(orphans[0].enSegmentIndex, 0);
  });
});
```

- [ ] **Step 2: 失敗確認**

Run: `npm test -- scripts/__tests__/source_parity_baseline.test.mjs`

Expected: FAIL (関数未 export)。

### Task C.2: `computeOrphanBaselineEntries` を実装 (GREEN)

**Files:**
- Modify: `scripts/lib/source_parity_baseline.mjs` (`tagIssuesWithBaseline` の直後に追加)

- [ ] **Step 1: helper を実装**

`tagIssuesWithBaseline` の return の直後(line ~597 付近)に以下を追加:

```js
/**
 * Issue #247 post-merge — tagIssuesWithBaseline の `matchedKeys` を使って
 * 「runtime に一致する issue が無かった baseline entry」= orphan を返す
 * 純粋関数。detector/emitter が仕様変更したときに legacy entry が
 * 取り残されるパターン(PR5 migration で `segment-inconclusive` が 3 slug
 * 分残った件)を可視化する。
 *
 * 呼び出し側の契約:
 *   - page-level invalidation (fingerprint mismatch) 時は `matchedKeys` が
 *     空になり、全 entry が「unmatched」として返るが、それは orphan では
 *     ない (snapshot 更新に伴う invalidation)。呼び出し側が
 *     `tagIssuesWithBaseline` の `invalidated` フラグを見て orphan 集計を
 *     スキップすること。
 *   - helper 自体は entries 配列と matchedKeys Set を機械的に突き合わせ
 *     るのみで、invalidation 状態や checked/unchecked の概念を持たない。
 *
 * @param {string} slug
 * @param {object[]} baselineEntries — 全 slug 混じった entries でも良い
 * @param {Set<string>} matchedKeys — `tagIssuesWithBaseline` の戻り値
 * @returns {object[]} orphan baseline entries (sourceFingerprint 等そのまま)
 */
export function computeOrphanBaselineEntries(slug, baselineEntries, matchedKeys) {
  if (!Array.isArray(baselineEntries)) return [];
  if (!(matchedKeys instanceof Set)) return [];
  const slugEntries = baselineEntries.filter((e) => e.slug === slug);
  return slugEntries.filter((e) => {
    const key = buildBaselineKeyFromEntry(e);
    return !matchedKeys.has(key);
  });
}
```

- [ ] **Step 2: テスト PASS を確認**

Run: `npm test -- scripts/__tests__/source_parity_baseline.test.mjs`

Expected: PASS。

### Task C.3: summary counter に orphan を追加 (RED → GREEN)

**Files:**
- Modify: `scripts/__tests__/source_parity_summary.test.mjs` (新規 describe 追加 — ファイルが無ければ作成)
- Modify: `scripts/lib/source_parity_summary.mjs` (counter 追加)

- [ ] **Step 1: summary の test が既存で無ければ場所を確認**

Run: `ls scripts/__tests__/ | grep source_parity_summary`

想定: 専用の test ファイルが無い場合は、`source_parity.test.mjs` もしくは `source_parity_baseline.test.mjs` の末尾に追加する。以下は既存ファイルが無い想定で summary 専用ファイルを作成する例。

- [ ] **Step 2: summary 側の orphan counter test を追加**

`scripts/__tests__/source_parity_baseline.test.mjs` の末尾に追加:

```js
describe('Issue #247 post-merge — summary orphanBaselineEntries counter', () => {
  let summarizeParityResults;
  before(async () => {
    ({ summarizeParityResults } = await import('../lib/source_parity_summary.mjs'));
  });

  it('exposes orphanBaselineEntries === 0 when no orphans are passed', () => {
    const summary = summarizeParityResults([], { orphanBaselineEntries: 0, orphanBaselineByType: {} });
    assert.equal(summary.orphanBaselineEntries, 0);
    assert.deepEqual(summary.orphanBaselineByType, {});
  });

  it('propagates a provided orphan count + byType breakdown', () => {
    const summary = summarizeParityResults([], {
      orphanBaselineEntries: 3,
      orphanBaselineByType: { 'segment-inconclusive': 3 },
    });
    assert.equal(summary.orphanBaselineEntries, 3);
    assert.deepEqual(summary.orphanBaselineByType, { 'segment-inconclusive': 3 });
  });

  it('defaults to 0 / {} when no orphan metadata is passed (backward compat)', () => {
    const summary = summarizeParityResults([]);
    assert.equal(summary.orphanBaselineEntries, 0);
    assert.deepEqual(summary.orphanBaselineByType, {});
  });
});
```

- [ ] **Step 3: `summarizeParityResults` のシグネチャを拡張**

Modify: `scripts/lib/source_parity_summary.mjs:56`

変更前:
```js
export function summarizeParityResults(results) {
```

変更後:
```js
/**
 * @param {object[]} results
 * @param {object} [orphanMeta] — Issue #247 post-merge。呼び出し側が
 *   checkSourceParity ループ内で計算した orphan baseline entry の集計結果。
 *   省略時は 0 件 / {} (後方互換)。
 * @param {number} [orphanMeta.orphanBaselineEntries]
 * @param {Record<string, number>} [orphanMeta.orphanBaselineByType]
 */
export function summarizeParityResults(results, orphanMeta = {}) {
```

さらに return 文の末尾 (line ~232 付近) に以下を追加:

```js
    snapshotUnusableByType,
    // Issue #247 post-merge — baseline orphan detection。呼び出し側が
    // tagIssuesWithBaseline の matchedKeys を使って計算した結果を
    // そのまま summary に透過させる。counter そのものは
    // parityRegression / gate exit code には寄与しない (情報のみ)。
    orphanBaselineEntries: orphanMeta.orphanBaselineEntries || 0,
    orphanBaselineByType:
      orphanMeta.orphanBaselineByType && typeof orphanMeta.orphanBaselineByType === 'object'
        ? orphanMeta.orphanBaselineByType
        : {},
  };
}
```

- [ ] **Step 4: テスト PASS 確認**

Run: `npm test -- scripts/__tests__/source_parity_baseline.test.mjs`

Expected: PASS。

### Task C.4: `check_source_parity.mjs` で orphan を集計・出力に配線

**Files:**
- Modify: `scripts/check_source_parity.mjs:554-566` (`tagIssuesWithBaseline` 呼び出し周辺)
- Modify: `scripts/check_source_parity.mjs:681-712` (`summaryBase` 構築周辺)

- [ ] **Step 1: per-file loop で matchedKeys を蓄積**

line ~554 の付近、`baselineResult` 使用箇所を拡張:

変更前(line 554-566):
```js
    // baseline タグ付け。frozen (非 expired) baseline entries は
    // isFrozenByBaseline / isReportableParityIssue で gate から除外される
    // (scripts/lib/source_parity_issue_state.mjs を参照)。期限切れ baseline
    // entries は gate に refire する。
    {
      const baselineResult = tagIssuesWithBaseline(
        fileSlug,
        issues,
        baselineData.entries,
        snapshotFingerprint,
        today,
      );
      issues = baselineResult.tagged;
      if (baselineResult.invalidated) {
        baselineInvalidatedSlugs.add(fileSlug);
      }
    }
```

変更後:
```js
    // baseline タグ付け。frozen (非 expired) baseline entries は
    // isFrozenByBaseline / isReportableParityIssue で gate から除外される
    // (scripts/lib/source_parity_issue_state.mjs を参照)。期限切れ baseline
    // entries は gate に refire する。
    // Issue #247 post-merge — matchedKeys を consumer 側で消費して orphan
    // baseline entry を集計する。invalidated なページは skip する契約。
    {
      const baselineResult = tagIssuesWithBaseline(
        fileSlug,
        issues,
        baselineData.entries,
        snapshotFingerprint,
        today,
      );
      issues = baselineResult.tagged;
      if (baselineResult.invalidated) {
        baselineInvalidatedSlugs.add(fileSlug);
      } else {
        const orphans = computeOrphanBaselineEntries(
          fileSlug,
          baselineData.entries,
          baselineResult.matchedKeys,
        );
        for (const o of orphans) {
          orphanBaselineEntries.push(o);
        }
      }
    }
```

- [ ] **Step 2: loop の外側で `orphanBaselineEntries` と `computeOrphanBaselineEntries` を準備**

line ~388 の前後 (per-file loop 直前)、`const results = [];` 近辺:

変更前:
```js
  const results = [];
  let checkedCount = 0;

  for (const filePath of allFiles) {
```

変更後:
```js
  const results = [];
  // Issue #247 post-merge — orphan baseline entries を per-slug で蓄積する。
  // 完走後に byType で集計して summary に出す。invalidated slug のものは
  // 含まない (snapshot 更新での再タグ付け待ちなので orphan ではない)。
  const orphanBaselineEntries = [];
  let checkedCount = 0;

  for (const filePath of allFiles) {
```

- [ ] **Step 3: `computeOrphanBaselineEntries` を import に追加**

line ~41-44 の baseline 関連 import を拡張:

変更前:
```js
import {
  loadBaselineFile,
  tagIssuesWithBaseline,
} from './lib/source_parity_baseline.mjs';
```

変更後:
```js
import {
  loadBaselineFile,
  tagIssuesWithBaseline,
  computeOrphanBaselineEntries,
} from './lib/source_parity_baseline.mjs';
```

- [ ] **Step 4: `summaryBase` 構築時に orphan を渡す**

line ~681-701 付近で `summarizeParityResults(results)` 呼び出しを拡張:

変更前:
```js
  const summaryBase = {
    checkedAt: new Date().toISOString(),
    mode: 'local',
    totalFiles: allFiles.length,
    checkedFiles: checkedCount,
    ...summarizeParityResults(results),
    ...advisoryQueueSummary,
```

変更後:
```js
  // Issue #247 post-merge — orphan baseline entries の byType 集計。
  // --slug / --section mode では checked 範囲だけが対象 (未 check 分は
  // orphan 判定できない)。
  const orphanBaselineByType = {};
  for (const o of orphanBaselineEntries) {
    orphanBaselineByType[o.issueType] = (orphanBaselineByType[o.issueType] || 0) + 1;
  }

  const summaryBase = {
    checkedAt: new Date().toISOString(),
    mode: 'local',
    totalFiles: allFiles.length,
    checkedFiles: checkedCount,
    ...summarizeParityResults(results, {
      orphanBaselineEntries: orphanBaselineEntries.length,
      orphanBaselineByType,
    }),
    ...advisoryQueueSummary,
```

- [ ] **Step 5: CLI 表示に 1 行追加 (non-json mode)**

line ~726 付近のサマリー表示ブロック内、`reportableActiveFiles` 表示の後に追加:

検索文字列:
```js
    console.log(
      `問題あり: ${summary.filesWithIssues} ファイル (active: ${summary.activeFiles}, ` +
        `covered by baseline/ack: ${coveredFiles})`,
    );
```

その直後に以下を追加:
```js
    // Issue #247 post-merge — orphan baseline entries を reviewer に可視化する。
    // 0 件なら silent、非ゼロなら件数 + byType 上位を 1 行で表示する。
    if ((summary.orphanBaselineEntries || 0) > 0) {
      const top = Object.entries(summary.orphanBaselineByType || {})
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([type, count]) => `${type}×${count}`)
        .join(', ');
      console.log(
        `🧹 orphan baseline entries: ${summary.orphanBaselineEntries} 件 (${top}) — ` +
          `runtime で一致しないため掃除対象。--slug で再生成してください`,
      );
    }
```

- [ ] **Step 6: 全 test 回帰**

Run: `npm test`

Expected: 全 PASS。

### Task C.5: `detection_reports.mjs` の followup report に orphan 節を追加

**Files:**
- Modify: `scripts/lib/detection_reports.mjs:455-510` 付近 (parityFollowup section 構築箇所)

- [ ] **Step 1: parityFollowup の sourceUnusable セクション直後に orphan 節を追加**

line ~455-510 の sourceUnusable セクション(`if (sourceUnusable && sourceUnusable.snapshotUnusableIssues > 0)`)の閉じ括弧の直後に追加:

```js
  // Issue #247 post-merge — orphan baseline entries を followup report に
  // 可視化する。detector / emitter が仕様変更したときに legacy entry が
  // 取り残されるパターンを検知する (PR5 migration 後の segment-inconclusive
  // 3 件の事例が典型)。
  const orphanBaselineEntries = summary.orphanBaselineEntries || 0;
  if (orphanBaselineEntries > 0) {
    lines.push('');
    lines.push('### 🧹 Orphan baseline entries');
    lines.push('');
    lines.push(
      `- Total: ${orphanBaselineEntries} entries (runtime で一致する issue が無い — 掃除対象)`,
    );
    const byType = summary.orphanBaselineByType || {};
    const sortedTypes = Object.keys(byType).sort();
    if (sortedTypes.length > 0) {
      lines.push('- By type:');
      for (const type of sortedTypes) {
        lines.push(`  - ${type}: ${byType[type]}`);
      }
    }
    lines.push('');
    lines.push(
      '対応: `node scripts/generate_parity_baseline.mjs --slug=<slug>` で該当 slug を再生成すると orphan が purge されます。',
    );
  }
```

- [ ] **Step 2: detection_reports test があれば実行**

Run: `npm test -- scripts/__tests__/detection_reports.test.mjs`

Expected: 回帰無し (PASS)。新しい節は summary counter がゼロなら出力されない。

### Task C.6: Phase C を commit

- [ ] **Step 1: staging + commit**

```bash
git add scripts/lib/source_parity_baseline.mjs \
        scripts/lib/source_parity_summary.mjs \
        scripts/lib/detection_reports.mjs \
        scripts/check_source_parity.mjs \
        scripts/__tests__/source_parity_baseline.test.mjs
git commit -m "$(cat <<'EOF'
feat: Issue #247 post-merge — orphan baseline entry の検出と可視化

tagIssuesWithBaseline が返す matchedKeys を consumer 側で使い、runtime に
一致しない baseline entry を summary と CLI と followup report に出す。
PR5 migration 後に `segment-inconclusive` 3 件が legacy として残留していた
pattern を検知するための恒久策。

- computeOrphanBaselineEntries 純粋 helper を source_parity_baseline に追加
- summarizeParityResults に orphanBaselineEntries / orphanBaselineByType
  オプション引数を追加 (後方互換デフォルト 0 / {})
- check_source_parity のファイルループで orphan を蓄積、invalidated slug は
  除外する契約
- CLI サマリー: orphan が 0 でなければ 1 行で件数と byType 上位 3 件を表示
- detection_reports.parityFollowup に 🧹 Orphan baseline entries 節を追加

refs Issue #247 post-merge review
EOF
)"
```

---

## Phase D: Representative pages の JA 実修正 (3 slugs)

> **Warning:** この phase は **実コンテンツ修正** を含む。TDD というよりは「EN snapshot を読んで構造を理解 → JA を EN と同じ block sequence に書き直す → fixture test で pin する」というループ。1 slug ずつ commit する。

### Task D.0: 事前調査 — 現在の structure mismatch detail を書き出す

**Files:**
- Read: `scripts/__tests__/source_parity_structure_fixtures.test.mjs` (PR6 fixture — 現在 pin されている drift の内訳)

- [ ] **Step 1: 3 slug それぞれで alignSegments の structure diff を人が読める形で出力する**

Run (一時スクリプトを `/tmp/dump_structure_diff.mjs` に書いて実行):

```js
// /tmp/dump_structure_diff.mjs
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = '/Users/rym/Dev/personal-projects/testim-docs-ja/.claude/worktrees/sharded-sprouting-manatee';
const { extractSegmentsFromHtml } = await import(
  join(ROOT, 'scripts/lib/source_parity_segments_en.mjs')
);
const { extractSegmentsFromMarkdown } = await import(
  join(ROOT, 'scripts/lib/source_parity_segments_ja.mjs')
);
const { alignSegments, parityDiffsToIssues } = await import(
  join(ROOT, 'scripts/lib/source_parity_align.mjs')
);

function extractJaBody(md) { return md.replace(/^---[\s\S]*?---\n/m, '').trim(); }

const SLUGS = [
  'running-tests/the-command-line-cli',
  'results/test-results/network-logs',
  'advanced-editing/validations/email-validation',
];

for (const slug of SLUGS) {
  const en = readFileSync(join(ROOT, 'snapshots/en/content', `${slug}.html`), 'utf8');
  const ja = extractJaBody(readFileSync(join(ROOT, 'src/content/docs', `${slug}.md`), 'utf8'));
  const enSegs = extractSegmentsFromHtml(en);
  const jaSegs = extractSegmentsFromMarkdown(ja);
  const alignment = alignSegments(enSegs, jaSegs);
  const issues = parityDiffsToIssues(alignment.diffs).filter(
    (i) => i.type === 'section-structure-mismatch' || i.type === 'segment-order-mismatch' || i.type.startsWith('segment-'),
  );
  console.log('='.repeat(80));
  console.log(slug);
  console.log('='.repeat(80));
  for (const issue of issues) {
    console.log(`- ${issue.type} | section=${issue.sectionPath || '(preface)'} | kind=${issue.structureCategory || issue.segmentKind || '(n/a)'}`);
    if (issue.enKinds) console.log(`    EN kinds: ${JSON.stringify(issue.enKinds)}`);
    if (issue.jaKinds) console.log(`    JA kinds: ${JSON.stringify(issue.jaKinds)}`);
  }
}
```

`node /tmp/dump_structure_diff.mjs` を実行し、各 slug の全 diff を書き出す。

- [ ] **Step 2: 出力を `docs/superpowers/plans/2026-04-09-issue-247-structure-diff-dump.md` に保存**

調査結果は後の修正作業の参考資料として保存する。

### Task D.1: `running-tests/the-command-line-cli.md` の JA を EN と構造一致させる

**Context:** 10 件の `section-structure-mismatch` (全 `kind-multiset`) がある。PR6 fixture で pin されている最初の diff は `CLI Installation > Basic CLI command` section で EN 13 segments vs JA 6 segments。JA が大幅に pack されているパターン。

- [ ] **Step 1: `src/content/docs/running-tests/the-command-line-cli.md` を読む**

- [ ] **Step 2: `snapshots/en/content/running-tests/the-command-line-cli.html` を読む**

- [ ] **Step 3: 各 structure mismatch section について、EN の block 列と JA の block 列を比較し、JA を EN と同じ block sequence に書き直す**

書き直しの原則:
- 見出しは原文と 1:1 対応
- 段落は EN で 3 paragraphs なら JA も 3 paragraphs (1 つにまとめない)
- list item は分割しない
- callout は preserve
- content は WRITING_GUIDE の natural Japanese に従う

- [ ] **Step 4: `npm run lint:docs -- --path=src/content/docs/running-tests/the-command-line-cli.md` で linting 合格**

- [ ] **Step 5: 調査スクリプトを再実行し、structure mismatch が 0 件になったことを確認**

```bash
node /tmp/dump_structure_diff.mjs
# the-command-line-cli の section-structure-mismatch が 0 件になっているはず
```

- [ ] **Step 6: commit**

```bash
git add src/content/docs/running-tests/the-command-line-cli.md
git commit -m "$(cat <<'EOF'
docs: Issue #247 post-merge — the-command-line-cli の JA を EN と構造一致させる

PR5 で baseline に逃がしていた 10 件の section-structure-mismatch を実修正。
各 section で EN の block kind / 順序 / 件数 と一致するよう JA を書き直し、
paragraph の不適切な pack / list item の縮約 / callout 混入を解消した。

- 対象 section: CLI Installation > Basic CLI command ほか 9 section
- alignSegments の structure diff が 0 件になることを確認済み

refs Issue #247 post-merge — representative page 実修正
EOF
)"
```

### Task D.2: `results/test-results/network-logs.md` の JA を EN と構造一致させる

同じプロセスを `network-logs` に適用:

- [ ] **Step 1-5**: D.1 と同じ手順。対象 section は `Viewing the network logs at the step level > Filtering request results` (14 EN segments vs 10 JA segments) ほか 1 件。

- [ ] **Step 6: commit**

```bash
git add src/content/docs/results/test-results/network-logs.md
git commit -m "$(cat <<'EOF'
docs: Issue #247 post-merge — network-logs の JA を EN と構造一致させる

PR5 で baseline に逃がしていた 2 件の section-structure-mismatch を実修正。
対象 section: Viewing the network logs at the step level > Filtering request results

refs Issue #247 post-merge — representative page 実修正
EOF
)"
```

### Task D.3: `advanced-editing/validations/email-validation.md` の JA を EN と構造一致させる

- [ ] **Step 1-5**: 同様。対象 section は preface (EN 8 blocks vs JA 9 blocks — extra paragraph) ほか 1 件。

- [ ] **Step 6: commit**

```bash
git add src/content/docs/advanced-editing/validations/email-validation.md
git commit -m "$(cat <<'EOF'
docs: Issue #247 post-merge — email-validation の JA を EN と構造一致させる

PR5 で baseline に逃がしていた 2 件の section-structure-mismatch を実修正。
preface の余剰 paragraph を削除し、EN の block sequence と一致させた。

refs Issue #247 post-merge — representative page 実修正
EOF
)"
```

### Task D.4: structure_fixtures.test.mjs の pin 値を「0 件」に更新

**Files:**
- Modify: `scripts/__tests__/source_parity_structure_fixtures.test.mjs:79-159`

**Context:** Phase D.1-D.3 で JA を実修正したので、これまで pin していた件数と enKinds/jaKinds は全て 0 件 / 空配列 / 修正後の値になる。fixture を更新して「PR5 では baseline 経由で吸収されていたが、post-merge では 0 件」を pin する。

- [ ] **Step 1: 3 slug の `PINNED_*` オブジェクトを `structureIssueCount: 0, byType: { 'section-structure-mismatch': 0, 'segment-order-mismatch': 0 }, byCategory: { ... all 0 }, firstIssue: null` に変更**

変更後の `assertStructurePin` を呼ぶ箇所を `assertStructureClean` に差し替え:

```js
function assertStructureClean(slug) {
  const { structureIssues } = runStructureComparator(slug);
  assert.equal(
    structureIssues.length,
    0,
    `${slug}: Phase D で JA を修正済み。structure issue は 0 件であるべき。` +
      `最初の issue: ${JSON.stringify(structureIssues[0] ?? null)}`,
  );
}
```

- [ ] **Step 2: 既存の describe を clean 版に置き換え**

```js
describe('source_parity_structure_fixtures: running-tests/the-command-line-cli', () => {
  it('Phase D.1 以降 structure issue が 0 件 (JA を実修正済み)', () => {
    assertStructureClean('running-tests/the-command-line-cli');
  });
});
// 他 2 slug も同様
```

- [ ] **Step 3: test 実行で PASS 確認**

Run: `npm test -- scripts/__tests__/source_parity_structure_fixtures.test.mjs`

Expected: PASS (JA 修正が正しければ structureIssues.length === 0)。

- [ ] **Step 4: commit**

```bash
git add scripts/__tests__/source_parity_structure_fixtures.test.mjs
git commit -m "$(cat <<'EOF'
test: Issue #247 post-merge — structure fixture を clean (0 件) に flip

Phase D で JA を実修正した 3 slug について、PR6 で pin していた
drift 件数と enKinds/jaKinds の期待値を全て 0 件 / null に切り替える。
これが将来 regress した場合、fixture が即座に検知する。

refs Issue #247 post-merge — representative page 実修正
EOF
)"
```

---

## Phase E: Artifact absorption (custom-action-step-mobile + test-runs)

### Task E.0: artifact 実態調査

**Context:** Issue #247 が指した 2 つの artifact:
- `custom-action-step-mobile`: `<li><p><span class="FileOrFilePath">methodName</span></p></li>` パターン — EN 側は list item 内 paragraph + span、JA は `- \`methodName\`` の inline code。構造上の差は「list item の子が paragraph かプレーンテキスト inline code か」。
- `test-runs`: `<td><p class="tableBody"><ul>...</ul></p></td>` パターン — EN table cell 内の `<p>` の中に `<ul>` が nest している(非標準 HTML)。JA は table cell 内に改行付き list で書かれている。構造上の差は extractor の handling。

- [ ] **Step 1: `scripts/lib/source_parity_segments_en.mjs` を読み、list item 内 `<p><span class="FileOrFilePath">` 処理の現状を確認**

- [ ] **Step 2: `scripts/lib/source_parity_segments_en.mjs` の table cell + nested `<ul>` 処理を確認**

- [ ] **Step 3: 現在の extract 出力を dump する**

`/tmp/dump_artifact_segments.mjs` を書いて実行し、2 slug の EN/JA segment 列を可視化:

```js
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
const ROOT = '/Users/rym/Dev/personal-projects/testim-docs-ja/.claude/worktrees/sharded-sprouting-manatee';
const { extractSegmentsFromHtml } = await import(join(ROOT, 'scripts/lib/source_parity_segments_en.mjs'));
const { extractSegmentsFromMarkdown } = await import(join(ROOT, 'scripts/lib/source_parity_segments_ja.mjs'));
function extractJaBody(md) { return md.replace(/^---[\s\S]*?---\n/m, '').trim(); }
for (const slug of ['advanced-editing/custom-action-step-mobile', 'results/test-runs']) {
  console.log('='.repeat(60) + '\n' + slug);
  const en = readFileSync(join(ROOT, 'snapshots/en/content', `${slug}.html`), 'utf8');
  const ja = extractJaBody(readFileSync(join(ROOT, 'src/content/docs', `${slug}.md`), 'utf8'));
  const enS = extractSegmentsFromHtml(en);
  const jaS = extractSegmentsFromMarkdown(ja);
  console.log(`EN segments: ${enS.length}, JA segments: ${jaS.length}`);
  for (let i = 0; i < Math.min(enS.length, 30); i++) {
    console.log(`  EN[${i}] ${enS[i].segmentKind} @ ${enS[i].sectionPath || '(preface)'} — ${(enS[i].text || '').slice(0, 80)}`);
  }
}
```

### Task E.1: `FileOrFilePath` list item 吸収の TDD

**Files:**
- Modify: `scripts/lib/source_parity_segments_en.mjs`
- Modify: 該当する test (既存もしくは新規 fixture test)

- [ ] **Step 1: 失敗テスト**

`scripts/__tests__/source_parity_segments_en.test.mjs` に fixture HTML で assert する test を追加(もしくは新規ファイル):

```js
describe('Issue #247 post-merge — FileOrFilePath list item absorption', () => {
  let extractSegmentsFromHtml;
  before(async () => {
    ({ extractSegmentsFromHtml } = await import('../lib/source_parity_segments_en.mjs'));
  });

  it('li > p > span.FileOrFilePath は unordered-list-item 1 つとして扱う (内側 paragraph を入れ子にしない)', () => {
    const html = `
      <h2>Supported methods</h2>
      <ul>
        <li><p><span class="FileOrFilePath">performActions</span></p></li>
        <li><p><span class="FileOrFilePath">findElement</span></p></li>
      </ul>`;
    const segs = extractSegmentsFromHtml(html);
    const listItems = segs.filter((s) => s.segmentKind === 'unordered-list-item');
    assert.equal(listItems.length, 2);
    // nested paragraph segment は生成しない
    const nestedParas = segs.filter(
      (s) => s.segmentKind === 'paragraph' && /performActions|findElement/.test(s.text || ''),
    );
    assert.equal(nestedParas.length, 0, 'list item の子 paragraph を重複 segment として出してはいけない');
    // 文字列は維持される
    assert.ok(listItems[0].text.includes('performActions'));
  });
});
```

Run: `npm test -- scripts/__tests__/source_parity_segments_en.test.mjs`

Expected: 現状失敗するはず(list item と内側 paragraph の両方が segment になっている)。

- [ ] **Step 2: extractor を修正して GREEN**

`source_parity_segments_en.mjs` 内の list item 処理ロジックを特定し、以下の条件のとき内側 paragraph を unwrap する:
- `<li>` の唯一の子が `<p>`
- その `<p>` の唯一の非 whitespace 内容が `<span class="FileOrFilePath">...</span>`

実装は既存コードの構造を読んでから決める (対象関数は `extractSegmentsFromHtml` 内の list walking 部分)。

- [ ] **Step 3: テスト PASS を確認**

- [ ] **Step 4: custom-action-step-mobile fixture が 0 件に近づいたか調査**

`node /tmp/dump_artifact_segments.mjs` を再実行し、structure mismatch 件数が減っていることを確認。

### Task E.2: Table cell 内 `<ul>` 吸収の TDD

**Files:**
- Modify: `scripts/lib/source_parity_segments_en.mjs` (table cell handler)
- Modify: test 追加

- [ ] **Step 1: 失敗テスト**

```js
it('td > p > ul は table cell 内 list として処理する (p の wrapping を無視)', () => {
  const html = `
    <table>
      <tr>
        <td>
          <p class="tableBody">
            <ul>
              <li><p><strong>Failed</strong> - red x</p></li>
              <li><p><strong>Passed</strong> - green v</p></li>
            </ul>
          </p>
        </td>
      </tr>
    </table>`;
  const segs = extractSegmentsFromHtml(html);
  // 表の内側の list items が認識される (1 cell 扱いか 2 list item 扱いかは実装契約で決める)
  // ここでは segment 数だけを pin する (post-fix での数値は実装時に決定)
  assert.ok(segs.length > 0);
  const hasListItems = segs.some((s) => s.segmentKind === 'unordered-list-item');
  const hasTableCell = segs.some((s) => s.segmentKind === 'table-cell');
  assert.ok(
    hasListItems || hasTableCell,
    `list items or table cell segment が無い。実出力: ${JSON.stringify(segs.map(s => s.segmentKind))}`,
  );
});
```

- [ ] **Step 2: extractor の table cell handler を修正**

MadCap の非標準 HTML パターン (`<p><ul>...</ul></p>`) に対し、table cell の子を抽出するときに `<p>` の wrapping を透過する処理を追加。

- [ ] **Step 3: test PASS と test-runs fixture の structure mismatch 件数減少を確認**

### Task E.3: custom-action-step-mobile / test-runs の残存 drift を JA 修正で消す

E.1/E.2 で artifact が吸収されても、JA 側の翻訳 drift (無関係の structure mismatch) が残っている可能性がある。Phase D と同じ手順で:

- [ ] **Step 1: `node /tmp/dump_structure_diff.mjs` で 2 slug の残存 diff を確認**

- [ ] **Step 2: 各 slug で JA を EN と構造一致させる**

- [ ] **Step 3: lint + fixture 確認**

- [ ] **Step 4: commit**

```bash
git add scripts/lib/source_parity_segments_en.mjs \
        src/content/docs/advanced-editing/custom-action-step-mobile.md \
        src/content/docs/results/test-runs.md \
        scripts/__tests__/source_parity_segments_en.test.mjs
git commit -m "$(cat <<'EOF'
feat: Issue #247 post-merge — artifact 吸収 (FileOrFilePath / table-cell ul)

PR5 で baseline に逃がしていた 2 pattern の artifact を extractor 側で
正しく吸収する:

- FileOrFilePath list item: <li><p><span class="FileOrFilePath">…</span></p></li>
  を unordered-list-item 1 件として扱う (内側 paragraph の重複 segment を
  解消)
- table cell 内 <ul>: <td><p><ul>…</ul></p></td> を table cell 内 list
  として処理 (非標準 HTML の <p> wrapping を透過)

対応 slug: custom-action-step-mobile, test-runs — どちらも artifact 起因の
mismatch が 0 件、残存する JA drift を追加修正で clean green に。

refs Issue #247 post-merge — artifact absorber 実装
EOF
)"
```

---

## Phase F: `faq` preprocessor root cause fix

**Phase F 改訂通知 (Finding 5-8)**: 初稿の F.1/F.2 は「escaped details を real `<details>` に復元 → 後で extractor を書き換えて summary を heading に昇格」という 2 段階方針だったが、第 3 弾レビューで以下が判明して破綻:

- Finding 6: `details-summary` は frozen vocabulary で extractor 書き換えは破壊的変更
- Finding 5: 初稿の F.2.5 テストが無効な segment schema 前提で書かれていた

→ **F.1 と F.2 を削除し、F.2.5 (preprocessor で faq escaped details を valid sibling `<h2>/<p>` block へ再構成) を唯一の主タスクとする**。F.2.5 は `turndown.mjs::normalizeEscapedFaqDetails` を新規追加し、extractor / frozen vocabulary / JA 側を一切触らない最小変更で faq を clean green にする。

### Task F.0: 調査 — unescapeDetails の現状と broken pattern の解析

**Context:** `salesforce-testing/faq.html` (3603 bytes) は MadCap が `<details>` 内容を複数の `<p>` に跨って escape 出力する。現状 `unescapeDetails` は単一の `<p>` 内で `&lt;details&gt;` で始まる場合のみ処理する。broken details tree は hyperlink が別 `<p>` に分割され、code block が `<div class="codeSnippet">` になり、close タグが最後の独立 `<p>` に残るケースで失敗する。

- [ ] **Step 1: `faq.html` を読んで正確な pattern を把握**

- [ ] **Step 2: `scripts/lib/turndown.mjs` の `unescapeDetails` / `preprocessEnHtml` の現状実装を読む**

- [ ] **Step 3: `coding-assistant.html` を grep して single-<p> 内 balanced 例 (legacy unescape で扱う) と faq の multi-paragraph broken tree (新 normalize で扱う) の境界を確認**

### ~~Task F.1: preprocessEnHtml 失敗テスト~~ → **F.2.5 に統合、削除**

### ~~Task F.2: unescapeDetails を multi-paragraph 対応に拡張~~ → **F.2.5 に統合、削除**

### Task F.2.5: faq escaped details を valid sibling `<h2>/<p>` block に正規化 (Finding 5-14 反映版)

**Files:**
- Modify: `scripts/lib/turndown.mjs` (`unescapeDetails` / 新規 `normalizeEscapedFaqDetails` / `preprocessEnHtml` docstring sync)
- Modify: `scripts/__tests__/turndown.test.mjs` (新規 test)
- Modify: `scripts/__tests__/source_parity_source_usability_fixtures.test.mjs` (faq 契約を null + heading exact 5 に flip, file header comment も同期)

**Context (再改訂理由):** 初稿の「EN extractor の `<summary>` を heading kind に昇格」案は以下の 4 つの Finding で破綻:

1. **Finding 5**: 初稿テストは `h1 + 2 summary = 3 headings` を期待したが、extractor は最初の `<h1>` を `h1Consumed` フラグで skip する契約 (`source_parity_segments_en.mjs:394`, `source_parity_segments_en.test.mjs:25` で pin)。segment schema は `textNorm` で `text` フィールドは存在しない (`source_parity_segments_shared.mjs:184`)
2. **Finding 6**: `details-summary` は `STRUCTURE_COMPARATOR_KINDS` の **FROZEN 語彙** で baseline identity key に畳み込まれている (`source_parity_structure.mjs:74-81`)。削除は破壊的変更
3. **Finding 6 補足**: JA extractor (`source_parity_segments_ja.mjs:366-368`) も `<summary>` を `details-summary` として emit、実データでも `coding-assistant.md` に raw `<details><summary>` が残っている。EN だけ変えると EN/JA 契約が非対称になる
4. **Finding 7**: `SUMMARY_HEADING_LEVEL = 2` 固定は `pushHeading` の `entry.level < level` フィルタ (`source_parity_segments_shared.mjs:134`) によってネストした h2 を潰す。`Examples > Q1` ではなく `Q1` になる
5. **Finding 14**: 第 4 弾の preprocessor-only 案は `&lt;summary&gt;...&lt;/summary&gt; -> <h2>...</h2>` を全体置換しただけなので、`preprocessEnHtml()` の出力に **`<p><h2>Q</h2>...` という invalid HTML** が残る。`convertEnHtmlToMd()` は DOM repair で見かけ上うまく変換できても、EN extractor は `preprocessEnHtml()` 後の HTML を **DOM repair なしで** tokenize / tree walk するため heading を拾えない (`source_parity_segments_en.mjs:571-583`)。よって 「turndown は green だが parity gate は red」のズレが起きる

**新最終方針 (scope 最小化 + extractor 実契約準拠)**: extractor 契約を一切触らず、`turndown.mjs` の preprocessor で **faq 特有の broken escaped details tree を valid sibling block HTML へ再構成** する。単なる `summary -> <h2>` 置換ではなく、**段落境界ごと rewrite して `<h2>Q?</h2><p>body...</p>` を sibling として emit** する。

具体的には:

- `&lt;details&gt; &lt;summary&gt;&lt;b&gt;Q?&lt;/b&gt;&lt;/summary&gt; ...` が **paragraph の先頭** にある場合:
  - `<p>&lt;details&gt; ... &lt;summary&gt;Q...&lt;/summary&gt; body` → `<h2>Q...</h2><p>body`
- `&lt;/details&gt; &lt;details&gt; &lt;summary&gt;Q...` が **paragraph の先頭** にある場合:
  - `<p>&lt;/details&gt; &lt;details&gt; ... &lt;summary&gt;Q...&lt;/summary&gt; body` → `<h2>Q...</h2><p>body`
- `&lt;/details&gt; &lt;details&gt; &lt;summary&gt;Q...` が **paragraph の途中** にある場合:
  - `... body1 &lt;/details&gt; &lt;details&gt; ... &lt;summary&gt;Q2...&lt;/summary&gt; body2 ...`
  - → `... body1 </p><h2>Q2...</h2><p>body2 ...`
- 末尾の `<p>&lt;/details&gt;</p>` や残存 close marker は除去する

この形なら:

- faq は `preprocessEnHtml()` 後に **valid な block tree** を持つ
- `extractSegmentsFromHtml(rawFaqHtml)` が heading 5 件を実際に emit できる
- `turndown` でも同じ `<h2>` / paragraph 構造が Markdown に落ちる
- line 4 の link paragraph / line 6-9 の `codeSnippet` block は untouched のまま Q2 / Q5 の body に自然にぶら下がる

**影響範囲の確認 (repo 全体で実測):**

- EN 側で `&lt;details&gt;` を持つ snapshot: `faq.html`, `coding-assistant.html` (計 2 page)
- JA 側で raw `<details>` を持つ md: `coding-assistant.md` (1 page のみ)
- **どちらも `<b>` は escaped**: faq.html line 3 は `&lt;summary&gt;&lt;b&gt;How do...&lt;/b&gt;&lt;/summary&gt;`、coding-assistant.html line 120 は `&lt;summary&gt; &lt;b&gt;generate code...&lt;/b&gt;&lt;/summary&gt;`

**`faq` vs `coding-assistant` の discriminator (Finding 9 対応、Finding 14 後も継続利用)**:

初稿の `spansMultipleP` 条件 (`<p>` 内で open はあるが close が無い) は **coding-assistant にも当たる**。実測:

- `coding-assistant.html` line 120: `<p>Here are some examples of possible prompts that you can use: &lt;details&gt; &lt;summary&gt; &lt;b&gt;...&lt;/b&gt;&lt;/summary&gt;</p>` — open あり、close なし → spansMultipleP が true になってしまう
- その結果 coding-assistant も normalization 対象に入り、`&lt;h2&gt;generate code...&lt;/h2&gt;` がドキュメント本文中に注入される

**本当の discriminator**: **faq の first-open `<p>` は `&lt;details&gt;` で開始する**、**coding-assistant の first-open `<p>` は prose で開始して中ほどに `&lt;details&gt;` がある**。既存 legacy `unescapeDetails` (`turndown.mjs:217-221`) と同じ `startsWith('&lt;details&gt;')` check を再利用できる。

- faq line 3: `<p>&lt;details&gt; &lt;summary&gt;...` — 先頭から `&lt;details&gt;` ✓
- coding-assistant line 120: `<p>Here are some examples... &lt;details&gt; ...` — prose 先行 ✗

したがって新正規化ルールは:

- **faq**: first `<p>` with details-open starts with `&lt;details&gt;` → 正規化発火 → valid sibling `<h2>/<p>` block 生成
- **coding-assistant**: first `<p>` with details-open has prose prefix → 正規化**発火せず** → 現状維持
- **その他**: 影響なし

実装戦略:
1. `normalizeEscapedFaqDetails(html)` を新規追加
2. 発火条件 (全部満たす):
   - `&lt;details&gt;` open と `&lt;/details&gt;` close の件数が balanced
   - 少なくとも 1 つの `<p>` が trimmed content `startsWith('&lt;details&gt;')` (faq discriminator)
3. condition 合致時にのみ、paragraph-start opener / paragraph-start close+opener / mid-paragraph boundary を **別 regex で段階的に rewrite** し、`<p><h2>` を一切作らない
4. その後 legacy `unescapeDetails` が走る(coding-assistant の single-<p> 例や「既に normalization で消えた場合」の noop)

- [ ] **Step 1: 失敗テスト (RED) — 実 snapshot を使った extractor 契約 pin**

`scripts/__tests__/turndown.test.mjs` に追加:

```js
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Issue #247 post-merge — normalizeEscapedFaqDetails (Finding 9-14)', () => {
  let preprocessEnHtml;
  let extractSegmentsFromHtml;
  before(async () => {
    ({ preprocessEnHtml } = await import('../lib/turndown.mjs'));
    ({ extractSegmentsFromHtml } = await import('../lib/source_parity_segments_en.mjs'));
  });

  const ROOT = join(import.meta.dirname, '../../');
  const SNAPSHOTS_DIR = join(ROOT, 'snapshots/en/content');

  // ---------------------------------------------------------------------
  // Narrow fixture (実 faq 構造の抜粋 — escaped <b> を含むことが Finding 11 の
  // 保険)。
  // ---------------------------------------------------------------------

  it('narrow fixture: valid sibling `<h2>/<p>` block を生成し、extractor でも heading を拾える', () => {
    const html = [
      '<h1>FAQ</h1>',
      '<p>&lt;details&gt; &lt;summary&gt;&lt;b&gt;Q1?&lt;/b&gt;&lt;/summary&gt; Answer 1. &lt;/details&gt; &lt;details&gt; &lt;summary&gt;&lt;b&gt;Q2?&lt;/b&gt;&lt;/summary&gt; Answer 2.&lt;/details&gt;</p>',
    ].join('\n');

    const out = preprocessEnHtml(html);
    // escaped markers は残らない (details / summary / b すべて)
    assert.equal(out.includes('&lt;details&gt;'), false);
    assert.equal(out.includes('&lt;/details&gt;'), false);
    assert.equal(out.includes('&lt;summary&gt;'), false);
    assert.equal(out.includes('&lt;/summary&gt;'), false);
    assert.equal(out.includes('&lt;b&gt;'), false);
    // Finding 14: invalid `<p><h2>` を作らないこと
    assert.equal(/<p\b[^>]*>\s*<h2\b/i.test(out), false);

    const segs = extractSegmentsFromHtml(html);
    const headings = segs.filter((s) => s.segmentKind === 'heading');
    assert.equal(headings.length, 2);
  });

  // ---------------------------------------------------------------------
  // 実 snapshot を使った contract pin (Finding 11 への対抗措置 — 疑似 fixture が
  // 現実を反映できていないときに備えて、実ファイルを直接読む)
  // ---------------------------------------------------------------------

  it('real faq.html: no `<p><h2>` + extractor heading=5 + details-summary=0', () => {
    const raw = readFileSync(
      join(SNAPSHOTS_DIR, 'salesforce-testing/faq.html'),
      'utf8',
    );
    const out = preprocessEnHtml(raw);
    // escaped details / summary / b が残らない
    assert.equal(out.includes('&lt;details&gt;'), false);
    assert.equal(out.includes('&lt;/details&gt;'), false);
    assert.equal(out.includes('&lt;summary&gt;'), false);
    assert.equal(out.includes('&lt;b&gt;'), false);
    // Finding 14: invalid nesting を明示的に禁止
    assert.equal(/<p\b[^>]*>\s*<h2\b/i.test(out), false);
    // real <details> tag も残らない (faq は h2/p block に再構成されているので不要)
    assert.equal(/<details\b/i.test(out), false);

    const segs = extractSegmentsFromHtml(raw);
    const headings = segs.filter((s) => s.segmentKind === 'heading');
    const detailSummaries = segs.filter((s) => s.segmentKind === 'details-summary');
    assert.equal(headings.length, 5, `faq の heading 件数が不正: ${headings.length}`);
    assert.equal(detailSummaries.length, 0, 'faq に details-summary は残ってはいけない');
  });

  // ---------------------------------------------------------------------
  // Finding 9 対応 — coding-assistant は normalize 対象外 (強い契約 pin)
  // ---------------------------------------------------------------------

  it('real coding-assistant.html: normalization は発火せず <h2> 注入ゼロ', () => {
    const raw = readFileSync(
      join(SNAPSHOTS_DIR, 'advanced-editing/coding-assistant.html'),
      'utf8',
    );
    // preprocess 前の `<h2>` 件数を記録 (実データでは 0 だが、増えないことを pin)
    const h2Before = (raw.match(/<h2[^>]*>/gi) || []).length;

    const out = preprocessEnHtml(raw);

    // 正規化が発火してはいけない:
    //   - details/summary/b marker は normalization で消えると 0 になるが、
    //     発火していなければ「何かしら」残っているはず (escaped or real)。
    //     ここでは h2 の件数が増えていないこと = 正規化未発火 を assert する。
    const h2After = (out.match(/<h2[^>]*>/gi) || []).length;
    assert.equal(
      h2After,
      h2Before,
      `coding-assistant に <h2> が注入された (before=${h2Before}, after=${h2After})。` +
        `faq 正規化が誤発火している可能性`,
    );
    assert.equal(/<p\b[^>]*>\s*<h2\b/i.test(out), false);

    // 本文の prose ("generate code to validate page URL" 等) が <h2> に
    // 昇格していないことを追加で確認
    assert.equal(
      /<h2[^>]*>[^<]*generate code/i.test(out),
      false,
      'coding-assistant の sample prompt が <h2> に昇格してはいけない',
    );
  });
});
```

Run: `npm test -- scripts/__tests__/turndown.test.mjs`

Expected: FAIL。現状の preprocessor は faq の broken tree を valid block に再構成できず、real faq.html テストで extractor heading=0 になる。

- [ ] **Step 2: `normalizeEscapedFaqDetails` を実装 (GREEN)**

`scripts/lib/turndown.mjs` の `unescapeDetails` の直後に追加:

```js
/**
 * Issue #247 post-merge (Finding 9-14) — faq の multi-paragraph broken
 * details tree を valid sibling `<h2>/<p>` block に再構成する。
 *
 * MadCap が `<details><summary>Q</summary>body</details>` 構造を複数の
 * `<p>` に跨って escape 出力するパターンで、`unescapeDetails` (per-<p>)
 * では扱えない。このヘルパは以下の条件をすべて満たす場合にだけ、HTML 全体を
 * paragraph-aware に rewrite して valid sibling block を emit する:
 *
 *   1. `&lt;details&gt;` open と `&lt;/details&gt;` close の件数が一致
 *   2. **少なくとも 1 つの `<p>` が (trimmed) `&lt;details&gt;` で開始**
 *      — この条件が `faq` と `coding-assistant` を分ける discriminator。
 *      `coding-assistant` は prose が先行 (`"Here are some examples of
 *      possible prompts that you can use: &lt;details&gt;..."`) するので
 *      ここで弾かれる。
 *
 * Finding 14: `summary -> <h2>` を global 置換しただけでは
 * `<p><h2>Q</h2>...` が残り、extractor が heading を拾えない。したがって
 * 以下の 3 ケースを別々に rewrite する:
 *
 *   A. paragraph-start opener:
 *      `<p>&lt;details&gt; ... &lt;summary&gt;Q&lt;/summary&gt; body`
 *      → `<h2>Q</h2><p>body`
 *   B. paragraph-start close+opener:
 *      `<p>&lt;/details&gt; &lt;details&gt; ... &lt;summary&gt;Q&lt;/summary&gt; body`
 *      → `<h2>Q</h2><p>body`
 *   C. mid-paragraph boundary:
 *      `... &lt;/details&gt; &lt;details&gt; ... &lt;summary&gt;Q&lt;/summary&gt; body ...`
 *      → `...</p><h2>Q</h2><p>body ...`
 *
 * 末尾の `<p>&lt;/details&gt;</p>` や residual close marker は最後に除去する。
 *
 * **契約**: EN extractor / JA extractor / structure comparator の frozen
 * vocabulary は一切触らない。影響範囲は preprocessor 内に閉じる。
 *
 * @param {string} html
 * @returns {string}
 */
function normalizeEscapedFaqDetails(html) {
  const openRe = /&lt;details(\b[^&]*)?&gt;/gi;
  const closeRe = /&lt;\/details&gt;/gi;
  const openCount = (html.match(openRe) || []).length;
  const closeCount = (html.match(closeRe) || []).length;
  if (openCount === 0 || openCount !== closeCount) return html;

  // Discriminator: 少なくとも 1 つの <p> が (trimmed) `&lt;details&gt;` で
  // 開始していること。prose が先行する coding-assistant ケースはここで弾く。
  const pSegments = [...html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)];
  const hasFaqStart = pSegments.some((pm) => {
    const inner = pm[1] || '';
    return inner.trim().startsWith('&lt;details&gt;');
  });
  if (!hasFaqStart) return html;

  const extractHeading = (summaryInner) => summaryInner
    .replace(/&lt;\/?[a-z][^&]*&gt;/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  const pOpen = (attrs = '') => `<p${attrs || ''}>`;

  let out = html;
  // A. first item in a paragraph: `<p>&lt;details&gt; ... <summary>Q</summary>` → `<h2>Q</h2><p>`
  out = out.replace(
    /<p(\b[^>]*)>\s*&lt;details(?:\b[^&]*)?&gt;\s*&lt;summary&gt;\s*(?:&lt;b(?:\b[^&]*)?&gt;)?\s*([\s\S]*?)\s*(?:&lt;\/b&gt;)?\s*&lt;\/summary&gt;\s*/gi,
    (_m, attrs, headingInner) => `<h2>${extractHeading(headingInner)}</h2>${pOpen(attrs)}`,
  );
  // B. paragraph starts with close+next-open: `<p>&lt;/details&gt; &lt;details&gt; ...`
  out = out.replace(
    /<p(\b[^>]*)>\s*&lt;\/details&gt;\s*&lt;details(?:\b[^&]*)?&gt;\s*&lt;summary&gt;\s*(?:&lt;b(?:\b[^&]*)?&gt;)?\s*([\s\S]*?)\s*(?:&lt;\/b&gt;)?\s*&lt;\/summary&gt;\s*/gi,
    (_m, attrs, headingInner) => `<h2>${extractHeading(headingInner)}</h2>${pOpen(attrs)}`,
  );
  // C. item boundary inside an already-open paragraph.
  out = out.replace(
    /&lt;\/details&gt;\s*&lt;details(?:\b[^&]*)?&gt;\s*&lt;summary&gt;\s*(?:&lt;b(?:\b[^&]*)?&gt;)?\s*([\s\S]*?)\s*(?:&lt;\/b&gt;)?\s*&lt;\/summary&gt;\s*/gi,
    (_m, headingInner) => `</p><h2>${extractHeading(headingInner)}</h2><p>`,
  );
  // Remove terminal close-only paragraphs and residual wrappers.
  out = out.replace(/<p\b[^>]*>\s*&lt;\/details&gt;\s*<\/p>/gi, '');
  out = out.replace(openRe, '');
  out = out.replace(closeRe, '');
  out = out.replace(/<p\b[^>]*>\s*<\/p>/gi, '');
  return out;
}
```

`preprocessEnHtml` チェインに挟む:

```js
export function preprocessEnHtml(html) {
  if (typeof html !== 'string') {
    throw new TypeError(`preprocessEnHtml expected string, got ${typeof html}`);
  }
  // 順序: (1) normalizeEscapedCallouts → (2) 新規 normalizeEscapedFaqDetails
  //        → (3) legacy unescapeDetails (coding-assistant / single-<p> 例向け)
  // (2) は faq discriminator で発火し、invalid `<p><h2>` を作らない valid
  //     sibling block を emit する。coding-assistant には当たらず、(3) の
  //     legacy path が従来通り処理する。
  return unescapeDetails(normalizeEscapedFaqDetails(normalizeEscapedCallouts(html)));
}
```

同時に docstring も更新:

```js
/**
 * Normalize EN HTML before turndown conversion.
 *
 * Chains three preprocessing steps:
 *   1. `normalizeEscapedCallouts` — convert escaped `>` callout patterns
 *   2. `normalizeEscapedFaqDetails` — rewrite faq broken escaped details into
 *      valid sibling `<h2>/<p>` blocks
 *   3. `unescapeDetails` — legacy single-<p> escaped details restoration
 *
 * @param {string} html - Raw MadCap Flare HTML from EN snapshot
 * @returns {string} Normalized HTML for both turndown and EN extractor
 */
```

Run: `npm test -- scripts/__tests__/turndown.test.mjs`

Expected: PASS (narrow fixture + real faq.html + real coding-assistant.html の 3 test 全 green。特に real faq で `extractSegmentsFromHtml()` heading=5)。

- [ ] **Step 3: 既存 detector 契約の再確認 — faq が source-unusable を出さないことを pin**

`scripts/__tests__/source_parity_source_usability_fixtures.test.mjs` の faq describe を更新:

ファイル先頭 comment も同期:

```js
/**
 * detectSourceUsability の fixture integration テスト (Issue #247 PR3)。
 *
 * 対象 2 ページ:
 *   - salesforce-testing/salesforce-testing-overview → snapshot-incomplete / shallow-snapshot
 *   - salesforce-testing/faq                        → usable after Phase F (detector returns null)
 */
```

変更前:
```js
describe('detectSourceUsability fixture: salesforce-testing/faq', () => {
  it('escaped-details-residue を検出する (source-unusable / reason=escaped-details-residue)', () => {
    // ...
    assert.ok(result !== null);
    assert.equal(result.type, 'source-unusable');
    assert.equal(result.usabilitySignals.reason, 'escaped-details-residue');
  });
  it('faq は residualEscapedDetailsClose >= 1 を持つ', () => {
    // ...
    assert.ok(result.usabilitySignals.residualEscapedDetailsClose >= 1);
  });
});
```

変更後:
```js
describe('detectSourceUsability fixture: salesforce-testing/faq (Phase F 完了後)', () => {
  it('Phase F preprocessor で faq は source-unusable を出さない', () => {
    // (既存の load コード)
    // normalizeEscapedFaqDetails が発火したあと、detector は null を返す
    assert.equal(
      result,
      null,
      `faq は Phase F 以降 usable と判定されるべき。actual: ${JSON.stringify(result)}`,
    );
  });

  it('Phase F 後: faq は extractor で heading 5 件 / details-summary 0 件になる', () => {
    const rawEnHtml = readFileSync(
      join(SNAPSHOTS_DIR, 'salesforce-testing/faq.html'),
      'utf8',
    );
    const enSegs = extractSegmentsFromHtml(rawEnHtml);
    const headings = enSegs.filter((s) => s.segmentKind === 'heading');
    const detailSummaries = enSegs.filter((s) => s.segmentKind === 'details-summary');
    assert.equal(headings.length, 5, `faq heading count mismatch: ${headings.length}`);
    assert.equal(detailSummaries.length, 0, 'faq に details-summary は残らないはず');
  });
});
```

既存の `coding-assistant` fixture describe (`source_parity_source_usability_fixtures.test.mjs:87-209` 相当) は**変更不要**で、`detectSourceUsability` が `null` を返す contract を引き続き pin する(正規化条件を faq discriminator に限定しているため)。

- [ ] **Step 4: 全 test 回帰 (PHASE F.2.5 完了判定)**

Run: `npm test`

Expected: 全 1555+ tests PASS。特に:
- `source_parity_source_usability_fixtures.test.mjs` の faq describe が GREEN (null + heading exact 5 + details-summary 0)
- `source_parity_source_usability_fixtures.test.mjs` の coding-assistant describe が **回帰なし** (null 契約維持)
- `source_parity_structure_fixtures.test.mjs` の既存 3 slug fixture は Phase D 前なので対象外

- [ ] **Step 5: commit (Phase F の main commit の前に separate)**

```bash
git add scripts/lib/turndown.mjs \
        scripts/__tests__/turndown.test.mjs \
        scripts/__tests__/source_parity_source_usability_fixtures.test.mjs
git commit -m "$(cat <<'EOF'
fix: Issue #247 post-merge — faq broken details を valid h2/p block に正規化

MadCap が faq の <details><summary>Q</summary>Answer</details> を複数 <p>
に跨って escape 出力する broken tree を、preprocessor 段階で valid sibling
<h2>Q</h2><p>Answer...</p> block に再構成する。これで EN extractor が
DOM repair に頼らず real heading を拾え、JA 側の ## h2 と整合する。

以前の「EN extractor の <summary> を heading kind に昇格」案は以下の理由で
破棄 (Finding 5-8):

- details-summary は structure comparator の FROZEN 語彙で破壊的変更になる
- JA extractor も同じ semantics を持っており片側だけ変えると契約が割れる
- pushHeading の level filter により固定 level 2 だと nested details の
  sectionPath を潰す
- 初稿テストが誤った segment schema 前提 (text vs textNorm, h1 emit)

新方針は turndown.mjs に閉じた最小変更で、extractor / comparator / JA 側は
一切触らない。normalizeEscapedFaqDetails は multi-paragraph broken tree に
のみ発火する条件付きで、coding-assistant の single-<p> balanced 例には
影響しない。

refs Issue #247 post-merge review (Finding 5-8)
EOF
)"
```

### Task F.3: faq JA の structure drift を修正して clean green にする

Phase D と同じプロセス。5 つの details セクションが real `<h2>` anchor に変換されると、EN/JA の alignSegments が走れる状態になる。残存する structure mismatch があれば JA を EN と構造一致させる。

- [ ] **Step 1: 残存 drift を dump**

Phase D の `/tmp/dump_structure_diff.mjs` に `salesforce-testing/faq` を追加して実行し、Phase F.2.5 完了後の faq の structure issue 一覧を書き出す。

- [ ] **Step 2: 必要なら faq.md を EN と構造一致させる**

5 QnA section それぞれで EN の block 列と JA の block 列を比較し、drift があれば JA を書き換える。

- [ ] **Step 3: lint + fixture 回帰**

Run: `npm run lint:docs -- --path=src/content/docs/salesforce-testing/faq.md`
Run: `npm test -- scripts/__tests__/source_parity_source_usability_fixtures.test.mjs`

- [ ] **Step 4: commit**

```bash
git add src/content/docs/salesforce-testing/faq.md
git commit -m "$(cat <<'EOF'
docs: Issue #247 post-merge — faq JA を EN structure と一致させて clean green 化

Phase F.2.5 の preprocessor 変更で faq EN が real <h1>/<h2> anchor を持つ
ようになったので、JA 側の structure drift を解消して baseline なしで
alignSegments を通す。

refs Issue #247 post-merge — faq root cause fix
EOF
)"
```

---

## Phase G: Baseline cleanup + regeneration

### Task G.1: 事前確認 — 対象 slug の現状

- [ ] **Step 1: Phase A-F 完了後の parity 状態をフル実行**

Run: `npm run check:parity`

- [ ] **Step 2: 対象 6 slug の issue 件数を確認**

Run: `node -e "
const data = JSON.parse(require('fs').readFileSync('parity-check-status.json', 'utf8'));
const targets = ['running-tests/the-command-line-cli', 'results/test-results/network-logs', 'advanced-editing/validations/email-validation', 'salesforce-testing/faq', 'advanced-editing/custom-action-step-mobile', 'results/test-runs'];
for (const t of targets) {
  const f = (data.files || []).find(f => f.file === 'src/content/docs/' + t + '.md');
  console.log(t, '->', f ? f.issues.length : 0, 'issues');
}
"`

Expected: 全て 0 件(Phase D/E/F の修正結果)。

### Task G.2: baseline から対象 slug の entry を削除 + orphan も purge

**Finding 2 対応**: 現行 baseline には `testops/testops-version-control/pull-requests` の **live な `snapshot-incomplete (extractor-empty)` が実測で確認されている** (2026-04-09 時点)。`salesforce-testing-overview` と同じく「legacy segment-inconclusive は purge、live snapshot-incomplete は残す」扱いが必要。purge 方針を以下に変更:

- **Full purge (全 entries 削除)**: Phase D/E/F で実修正したため baseline entry が 1 件も要らない slug
- **Re-seed (全 entries 削除 → --slug で再生成)**: live な source-side debt が残っている slug。legacy orphan と live entry が同居しているので全削除した上で再生成し、現在の runtime 実態を反映した entry だけ残す

- [ ] **Step 1: 対象 slug の分類と削除 script を書く**

`scripts/tmp_purge_247_baseline.mjs` として一時ファイル作成:

```js
import fs from 'node:fs';
import { loadBaselineFile, validateBaseline } from './lib/source_parity_baseline.mjs';

const BASELINE_PATH = 'parity-baseline.json';

// Phase D/E/F で実修正したため baseline entry を 0 にする slug
const FULL_PURGE_SLUGS = new Set([
  'running-tests/the-command-line-cli',
  'results/test-results/network-logs',
  'advanced-editing/validations/email-validation',
  'salesforce-testing/faq',
  'advanced-editing/custom-action-step-mobile',
  'results/test-runs',
]);

// live な source-side debt を持つが legacy orphan entries (segment-inconclusive)
// が同居している slug。全削除 → Phase G.3 で --slug 再生成して live debt のみ
// 復元する。
const RESEED_SLUGS = new Set([
  'salesforce-testing/salesforce-testing-overview',
  'testops/testops-version-control/pull-requests', // Finding 2: 実測で live snapshot-incomplete 確認済み
]);

const PURGE_SLUGS = new Set([...FULL_PURGE_SLUGS, ...RESEED_SLUGS]);

const baseline = loadBaselineFile(BASELINE_PATH);
const before = baseline.entries.length;

// 分類ごとに削除件数を記録
const removedByCategory = { full: 0, reseed: 0 };
baseline.entries = baseline.entries.filter((e) => {
  if (FULL_PURGE_SLUGS.has(e.slug)) {
    removedByCategory.full += 1;
    return false;
  }
  if (RESEED_SLUGS.has(e.slug)) {
    removedByCategory.reseed += 1;
    return false;
  }
  return true;
});

const after = baseline.entries.length;
console.log(`Removed ${before - after} entries (${before} → ${after})`);
console.log(`  Full purge: ${removedByCategory.full}`);
console.log(`  Re-seed (will be restored in G.3): ${removedByCategory.reseed}`);

validateBaseline(baseline);
fs.writeFileSync(BASELINE_PATH, JSON.stringify(baseline, null, 2) + '\n');
console.log('✅ baseline purged');
```

Run: `node scripts/tmp_purge_247_baseline.mjs`

- [ ] **Step 2: 一時ファイルを削除**

Run: `rm scripts/tmp_purge_247_baseline.mjs`

### Task G.3: live snapshot-incomplete 2 slug の再 seed

`salesforce-testing-overview` と `pull-requests` の両方について、live な snapshot-incomplete を `--slug` 再生成で復元する:

- [ ] **Step 1: `--slug` で 2 slug を一括再生成**

Run:

```bash
node scripts/generate_parity_baseline.mjs \
  --slug=salesforce-testing/salesforce-testing-overview,testops/testops-version-control/pull-requests \
  --rationale="Issue #247 post-merge — re-seed live snapshot-incomplete after legacy orphan purge (Finding 2)"
```

- [ ] **Step 2: 各 slug の entries が期待する `snapshot-incomplete` + 正しい usabilityReason で 1 件だけ残っていることを assert (Finding 8 対応 — 期待値を緩めない)**

```bash
node -e "
const data = JSON.parse(require('fs').readFileSync('parity-baseline.json', 'utf8'));
const EXPECTED = {
  'salesforce-testing/salesforce-testing-overview': { issueType: 'snapshot-incomplete', usabilityReason: 'shallow-snapshot' },
  'testops/testops-version-control/pull-requests':  { issueType: 'snapshot-incomplete', usabilityReason: 'extractor-empty' },
};
let ok = true;
for (const [slug, exp] of Object.entries(EXPECTED)) {
  const entries = data.entries.filter(e => e.slug === slug);
  if (entries.length !== 1) {
    console.error('❌', slug, ': expected 1 entry, got', entries.length);
    ok = false;
    continue;
  }
  const e = entries[0];
  if (e.issueType !== exp.issueType) {
    console.error('❌', slug, ': issueType mismatch (expected', exp.issueType, ', got', e.issueType, ')');
    ok = false;
  }
  if (e.usabilityReason !== exp.usabilityReason) {
    console.error('❌', slug, ': usabilityReason mismatch (expected', exp.usabilityReason, ', got', e.usabilityReason, ')');
    ok = false;
  }
  console.log('✅', slug, '->', e.issueType, '/', e.usabilityReason);
}
process.exit(ok ? 0 : 1);
"
```

Expected:
- `salesforce-testing/salesforce-testing-overview` → `snapshot-incomplete` / `shallow-snapshot`
- `testops/testops-version-control/pull-requests` → `snapshot-incomplete` / `extractor-empty`
- `source-unusable` も `segment-inconclusive` の legacy entry も残っていない
- **`source-unusable` を一般的な「OK 値」として飲み込まないこと** — Finding 8 で指摘されたように、regression (例: `pull-requests` が何らかの理由で `source-unusable` に分類替えされる) を assert で漏らしてはならない

### Task G.4: フル gate で完全解消を確認

- [ ] **Step 1: `npm run check:parity`**

Expected:
- `reportableActiveFiles: 0`
- `orphanBaselineEntries: 0`
- `result` は **`pass` または `inconclusive`** (Finding 4 — ローカル環境の `freshnessState` が `broken` の場合 `inconclusive` に degrade するのは正常な実装契約。`freshnessState === 'fresh'` の CI 環境でのみ `pass` になる)

完了条件は `result === 'pass'` ではなく、以下 2 つの conjunction で判定する:

```bash
node -e "
const s = JSON.parse(require('fs').readFileSync('parity-check-status.json', 'utf8')).summary;
const reportable = s.reportableActiveFiles || 0;
const orphan = s.orphanBaselineEntries || 0;
console.log('reportableActiveFiles:', reportable);
console.log('orphanBaselineEntries:', orphan);
console.log('freshnessState:', s.freshnessState);
console.log('result:', s.result);
console.log('PASS GATE:', reportable === 0 && orphan === 0 ? 'YES' : 'NO');
process.exit(reportable === 0 && orphan === 0 ? 0 : 1);
"
```

Expected exit code: 0。`result: inconclusive` でも `reportable + orphan === 0` なら Issue #247 完全解消の判定を満たす。

- [ ] **Step 2: 対象 slug での個別確認**

```bash
for slug in running-tests/the-command-line-cli results/test-results/network-logs advanced-editing/validations/email-validation salesforce-testing/faq advanced-editing/custom-action-step-mobile results/test-runs; do
  echo "=== $slug ==="
  npm run check:parity -- --slug=$slug 2>&1 | grep -E "問題あり|reportableActive|exit code|✅|❌" | head
done
```

Expected: 全 slug で `reportableActiveFiles: 0` かつ ack/baseline なしで green。

### Task G.5: commit

```bash
git add parity-baseline.json
git commit -m "$(cat <<'EOF'
chore: Issue #247 post-merge — 完全解消済み slug を baseline から purge

Phase D (representative JA 修正) / Phase E (artifact 吸収) / Phase F
(faq preprocessor fix) で実修正した 6 slug の baseline entry と、
migration で残留していた legacy orphan 3 slug 分 を parity-baseline.json
から削除。salesforce-testing-overview の shallow-snapshot entry は
snapshot 側 debt として --slug 再生成で復元した。

対象:
- 実修正で clean になった 6 slug:
  the-command-line-cli, network-logs, email-validation, faq,
  custom-action-step-mobile, test-runs
- legacy orphan segment-inconclusive が残っていた 3 slug:
  faq, salesforce-testing-overview, testops-version-control/pull-requests

post-merge レビューの Finding 1 (ack 契約), 2 (--types validation),
3 (orphan detection), 完了条件 #2/#4 (baseline 吸収) を全て解消。

refs Issue #247 post-merge — baseline cleanup
EOF
)"
```

---

## Phase H: Fixture 拡張と regression guard

### Task H.1: clean sentinel を 2 → 5-6 ページに拡張

**Files:**
- Modify: `scripts/__tests__/source_parity_clean_page_fixtures.test.mjs:82-86`

- [ ] **Step 1: 候補 pages を実測で確認**

`/tmp/find_clean_pages.mjs` を書いて、`src/content/docs/` 全ページから structure issue 0 件のものを 5-6 候補抽出する:

```js
// structure/content variety 別に clean page を探す
const PATTERNS = {
  'list-heavy': (segs) => segs.filter(s => s.segmentKind.includes('list-item')).length > 5,
  'callout-heavy': (segs) => segs.filter(s => s.segmentKind === 'callout-body').length > 2,
  'table-heavy': (segs) => segs.filter(s => s.segmentKind === 'table-cell').length > 5,
  'nested-section': (segs) => new Set(segs.map(s => s.sectionPath)).size > 4,
};
// ... 各 pattern で structure issue 0 件の page を 1 件ずつ拾う
```

- [ ] **Step 2: Step 1 の出力で placeholder を実 slug に置換 (Finding 8 対応 — 実行前に必ず完了させる)**

**重要**: 以下の 4 placeholder は **Phase H.1 実行前に必ず Step 1 の実測結果で置換すること**。placeholder のままでは `readFileSync` が失敗するか、存在しないファイルで test が abort する。

```js
const CLEAN_PAGE_SLUGS = Object.freeze([
  // 既存 (2)
  'settings/cli-prerequisites',
  'salesforce-testing/salesforce-testing-getting-started',
  // Phase H で追加 (structure variety 別に 4 件)
  // ⚠️ 以下は placeholder。Step 1 で実測した候補 slug で置換すること
  '<TBD-list-heavy slug from Step 1 output>',
  '<TBD-callout-heavy slug from Step 1 output>',
  '<TBD-table-heavy slug from Step 1 output>',
  '<TBD-nested-section slug from Step 1 output>',
]);
```

置換手順:
1. Step 1 の dump 出力から各 pattern の候補 slug を 1 件ずつ選ぶ(structure issue 0 件 + segment mismatch 0 件 が必須)
2. 選んだ slug を `CLEAN_PAGE_SLUGS` に埋め込む
3. `npm test -- scripts/__tests__/source_parity_clean_page_fixtures.test.mjs` で全 6 slug が PASS することを確認
4. どれか 1 つでも drift がある slug なら選び直す(または該当 pattern を省略する)

- [ ] **Step 3: test 実行で全 sentinel が clean であることを確認**

Run: `npm test -- scripts/__tests__/source_parity_clean_page_fixtures.test.mjs`

### Task H.2: Phase C integration test — check_source_parity の orphan 検知 E2E (Finding 3 + 15 対応)

**Files:**
- Modify: `scripts/check_source_parity.mjs` (test-only `baselinePath` / `outputPath` optional arg)
- Create: `scripts/__tests__/source_parity_orphan_integration.test.mjs`

**Context:** Finding 3 により、「存在しない slug に架空 entry」は false negative になるため、**存在する clean slug に stale entry を仕込む** 方式へ変える必要がある。一方で Finding 15 により、repo-global `parity-baseline.json` / `parity-check-status.json` を直接 backup/restore する設計は、既存 integration test 群と race して flaky になる余地がある。したがって H.2 は **temp copy を使う isolated integration test** にする。

設計:
1. `checkSourceParity()` に test-only の optional arg `baselinePath = BASELINE_PATH`, `outputPath = OUTPUT_PATH` を追加
2. runtime の baseline load / status write は injected path を使う
3. integration test は `mkdtemp` で temp dir を作り、real baseline を temp baseline に copy
4. temp baseline に synthetic stale `segment-missing` entry を注入
5. `checkSourceParity({ slug: 'settings/cli-prerequisites', json: true, baselinePath: BASELINE_TMP, outputPath: STATUS_TMP })` を in-process で呼ぶ
6. `summary.orphanBaselineEntries >= 1` を assert
7. temp dir を削除し、repo root の baseline/status は一切触らない

- [ ] **Step 1: `checkSourceParity` に path injection hook を追加**

`scripts/check_source_parity.mjs`:

```js
const OUTPUT_PATH = path.join(ROOT_DIR, 'parity-check-status.json');
const BASELINE_PATH = path.join(ROOT_DIR, 'parity-baseline.json');

export async function checkSourceParity({
  json = false,
  includeAdvisory = false,
  includeAuditSignals = false,
  section = null,
  failOn = null,
  slug = null,
  baselinePath = BASELINE_PATH,
  outputPath = OUTPUT_PATH,
} = {}) {
  // ...
  let baselineData = { schemaVersion: 1, entries: [] };
  try {
    baselineData = loadBaselineFileSafe(baselinePath);
  } catch (error) {
    console.error(`❌ ${error.message}`);
    return 1;
  }
  // ...
  fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2));
}
```

注意:
- これは **test-only dependency injection**。CLI の parseArgs / flag surface は増やさない
- 既定値は従来どおり repo root の `parity-baseline.json` / `parity-check-status.json`
- production path の挙動は変えず、integration test だけ temp copy を使えるようにする

- [ ] **Step 2: isolated integration test を作成**

```js
// scripts/__tests__/source_parity_orphan_integration.test.mjs
/**
 * Issue #247 post-merge — Phase C orphan detection の E2E 結合テスト。
 *
 * 設計:
 *   - 架空 slug では orphan 検知が走らないので、存在する clean slug
 *     (settings/cli-prerequisites) に stale な segment-missing entry を仕込む
 *   - repo-global baseline/status を汚さないよう、temp dir 上の copy を使う
 */
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  copyFileSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

let checkSourceParity;
let computeSnapshotFingerprint;

before(async () => {
  ({ checkSourceParity } = await import('../check_source_parity.mjs'));
  ({ computeSnapshotFingerprint } = await import(
    '../lib/source_parity_acknowledgements.mjs'
  ));
});

const ROOT = join(import.meta.dirname, '../../');
const REAL_BASELINE_PATH = join(ROOT, 'parity-baseline.json');
const TARGET_SLUG = 'settings/cli-prerequisites';
const SNAPSHOT_PATH = join(ROOT, 'snapshots/en/content/settings/cli-prerequisites.html');

const TMP_DIR = mkdtempSync(join(tmpdir(), 'parity-orphan-e2e-'));
const BASELINE_TMP = join(TMP_DIR, 'parity-baseline.json');
const STATUS_TMP = join(TMP_DIR, 'parity-check-status.json');

before(() => {
  copyFileSync(REAL_BASELINE_PATH, BASELINE_TMP);

  const baseline = JSON.parse(readFileSync(BASELINE_TMP, 'utf8'));
  const snapshotContent = readFileSync(SNAPSHOT_PATH, 'utf8');
  const fp = computeSnapshotFingerprint(snapshotContent);

  baseline.entries.push({
    slug: TARGET_SLUG,
    issueType: 'segment-missing',
    sectionPath: '__synthetic_orphan__',
    segmentKind: 'paragraph',
    enSegmentIndex: 9999,
    jaSegmentIndex: null,
    enSourceFingerprint: 'sha256:' + '9'.repeat(64),
    jaSourceFingerprint: null,
    missingTokens: null,
    inconclusiveCategory: null,
    inconclusiveReason: null,
    sectionIndex: null,
    structureCategory: null,
    structureFingerprint: null,
    usabilityReason: null,
    snapshotFingerprint: fp,
    reviewAfter: '2027-01-01',
  });
  writeFileSync(BASELINE_TMP, JSON.stringify(baseline, null, 2) + '\n');
});

after(() => {
  rmSync(TMP_DIR, { recursive: true, force: true });
});

describe('Issue #247 post-merge — orphan baseline detection E2E', () => {
  it('temp baseline 上の synthetic stale entry を orphan として集計する', async () => {
    await checkSourceParity({
      slug: TARGET_SLUG,
      json: true,
      baselinePath: BASELINE_TMP,
      outputPath: STATUS_TMP,
    });

    const status = JSON.parse(readFileSync(STATUS_TMP, 'utf8'));
    const orphanCount = status.summary.orphanBaselineEntries || 0;
    const byType = status.summary.orphanBaselineByType || {};

    assert.ok(
      orphanCount >= 1,
      `orphan counter should be >= 1 (actual: ${orphanCount}, byType=${JSON.stringify(byType)})`,
    );
    assert.ok(
      (byType['segment-missing'] || 0) >= 1,
      `segment-missing orphan should be present: ${JSON.stringify(byType)}`,
    );
  });
});
```

- [ ] **Step 3: test 実行**

Run: `npm test -- scripts/__tests__/source_parity_orphan_integration.test.mjs`

Expected: PASS (orphan counter が >= 1)。

- [ ] **Step 4: repo root が汚れていないことを確認**

Run: `git status --short parity-baseline.json parity-check-status.json`

Expected: どちらも変更なし。test は temp copy しか触らない。

### Task H.3: artifact regression fixture

**Files:**
- Modify: `scripts/__tests__/source_parity_structure_fixtures.test.mjs` (custom-action-step-mobile と test-runs を追加)

- [ ] **Step 1: 2 slug を structure_fixtures.test.mjs に追加**

```js
describe('source_parity_structure_fixtures: custom-action-step-mobile (Phase E 吸収対象)', () => {
  it('Phase E 以降 structure issue が 0 件 (artifact extractor で吸収)', () => {
    assertStructureClean('advanced-editing/custom-action-step-mobile');
  });
});

describe('source_parity_structure_fixtures: test-runs (Phase E 吸収対象)', () => {
  it('Phase E 以降 structure issue が 0 件 (table cell ul absorber で吸収)', () => {
    assertStructureClean('results/test-runs');
  });
});
```

- [ ] **Step 2: commit**

```bash
git add scripts/__tests__/source_parity_clean_page_fixtures.test.mjs \
        scripts/__tests__/source_parity_structure_fixtures.test.mjs \
        scripts/__tests__/source_parity_orphan_integration.test.mjs
git commit -m "$(cat <<'EOF'
test: Issue #247 post-merge — fixture 拡張 (clean sentinel + orphan + artifact)

- clean page sentinel を structure variety 別に 2 → 6 ページ拡張
- artifact regression fixture: custom-action-step-mobile / test-runs を
  structure_fixtures.test.mjs に追加 (Phase E 吸収後は 0 件を pin)
- orphan baseline detection の E2E integration test を新規追加

refs Issue #247 post-merge — fixture 拡張
EOF
)"
```

---

## Phase I: Docs 同期と Issue closure

### Task I.1: OPS_DESIGN に完了条件 #2 / #4 の着地点を追記

**Files:**
- Modify: `docs/OPS_DESIGN.md` (Issue #247 節)

- [ ] **Step 1: 既存の Issue #247 言及箇所を確認**

Run: `grep -n "Issue #247" docs/OPS_DESIGN.md`

- [ ] **Step 2: 「Issue #247 完了条件の着地点」節を追加**

```markdown
## Issue #247 完了条件の着地点 (2026-04 post-merge)

Issue #247 は PR1-6 のタクソノミー / gate cutover 以降、post-merge レビューで
完了条件 #2 と #4 が未達だったため、以下の追加作業で完全解消した。

### 完了条件 #2: 4 slug が structure mismatch として reportable

PR1-6 merge 直後は `baseline` 吸収で「reportable ではないが debt は pin
されている」状態だった。post-merge で以下の形に解消:

| slug | 方針 | 着地点 |
|---|---|---|
| `running-tests/the-command-line-cli` | JA 実修正 | structure issue 0 件、baseline entry なし、gate green |
| `results/test-results/network-logs` | JA 実修正 | 同上 |
| `advanced-editing/validations/email-validation` | JA 実修正 | 同上 |
| `salesforce-testing/faq` | preprocessor root cause fix + JA 修正 | source-unusable も structure mismatch も出ない、gate green |

### 完了条件 #4: artifact 吸収で green

PR1-6 では未達だった 2 slug を extractor レベルで吸収:

| slug | artifact | 実装 |
|---|---|---|
| `advanced-editing/custom-action-step-mobile` | `<li><p><span class="FileOrFilePath">…</span></p></li>` | `source_parity_segments_en.mjs` の list item handler で内側 `<p>` を unwrap |
| `results/test-runs` | `<td><p class="tableBody"><ul>…</ul></p></td>` | table cell handler で `<p>` wrapping を透過 |

### 完了条件 #2/#4 の保証 (regression guard)

- `scripts/__tests__/source_parity_structure_fixtures.test.mjs` — 6 slug で
  structure issue 0 件を pin (回帰したら即座に RED)
- `scripts/__tests__/source_parity_source_usability_fixtures.test.mjs` —
  faq が source-unusable を出さないことを pin
- `scripts/__tests__/source_parity_clean_page_fixtures.test.mjs` — 6 clean
  sentinel ページで structure/segment 共に 0 件を pin (false-positive ガード)

## Baseline / debt 運用の明文化 (Issue #247 post-merge)

### 何を baseline に入れていいか

- **入れていい**: 「今は直せないが debt として認めて時限管理する」 drift
- **入れてはいけない**: 「detector / extractor / preprocessor のバグで
  発火している false positive」。baseline に入れずに実装を直す
- **入れてはいけない**: 「Issue の完了条件で 0 件にすることが明記されている
  代表ページ」。baseline 吸収は Issue close 条件を満たさない

### reviewAfter 期限到来時の扱い

baseline entry の `reviewAfter` は 6 ヶ月 + stagger(最大 90 日)で初期化される。
期限到来時の流れ:

1. `isBaselineExpired` が true を返すと該当 issue は gate に refire する
2. reviewer は (a) 修正する、(b) 再度 debt 認定して延長する、(c) 別の解決策を取る
3. 延長する場合は `generate_parity_baseline.mjs --slug=<slug>` で再生成

### orphan baseline entry

detector / extractor の仕様変更で、runtime が emit しなくなった issueType の
baseline entry は orphan として残留する。`check_source_parity.mjs` は完走時に
orphan を summary counter (`orphanBaselineEntries`) と CLI に出力し、
`detection_reports.parityFollowup` でも可視化する。

orphan 掃除の手順:
1. CLI 出力の `🧹 orphan baseline entries: N 件` を確認
2. 該当 slug に対して `node scripts/generate_parity_baseline.mjs --slug=<slug>` を実行
3. orphan counter が 0 になっていることを `npm run check:parity` で確認
```

### Task I.2: scripts/README.md の関連節を更新

**Files:**
- Modify: `scripts/README.md`

- [ ] **Step 1: orphan baseline 節の追加**

既存の baseline 節の後に以下を追加:

```markdown
### Orphan baseline entry

detector / extractor の仕様変更で runtime が emit しなくなった issueType の
baseline entry は orphan として残留する。`check:parity` は完走時に summary
counter (`orphanBaselineEntries`) と CLI に件数を出す。

`--slug=<slug>` で該当 slug を再生成すると orphan は自動的に purge される。
```

- [ ] **Step 2: `--types` 契約の update (Phase B で narrow した allowlist)**

既存の `--types` 説明に以下を追記:

```markdown
`--types` は Issue #247 PR5 migration 専用で、許可される issueType は
`section-structure-mismatch` / `segment-order-mismatch` /
`snapshot-incomplete` / `source-unusable` の 4 つのみ。それ以外 (空文字や
typo を含む) は fail-fast される (silent no-op 防止)。
```

### Task I.3: Issue #247 本体に完了報告を投稿

**Context:** この repo 内でできるのは PR + ドキュメント更新のみ。実際の Issue #247 へのコメント投稿は gh CLI 経由で行う。

- [ ] **Step 1: `gh issue comment 247` で完了報告を投稿**

本文 template:

```markdown
## Issue #247 完全解消レポート (post-merge followup)

PR1-6 merge 後の批判的レビューで浮上した 3 つのコード defect + 完了条件 #2/#4
の未達を以下の作業で完全解消しました。

### 修正内容

- **Phase A**: `source-unusable` ack 契約の不整合を `describeReason` の
  reason token 埋め込みで解消 (fabricated test も実 emitter pattern に差し替え)
- **Phase B**: `generate_parity_baseline --types` の silent no-op を
  `validateTypesArg` 純粋 helper で fail-fast に
- **Phase C**: orphan baseline entry の runtime 検知 (summary counter + CLI +
  followup report)
- **Phase D**: 3 representative slug (the-command-line-cli / network-logs /
  email-validation) の JA を EN と構造一致させて structure mismatch を実解消
- **Phase E**: artifact 2 slug (custom-action-step-mobile / test-runs) を
  extractor レベルで吸収 (FileOrFilePath list item / table cell 内 ul)
- **Phase F**: `faq` preprocessor root cause fix — broken details tree を
  global balanced unescape で real `<details>` に復元
- **Phase G**: 完全解消済み 6 slug + legacy orphan 3 slug を baseline から purge
- **Phase H**: clean sentinel 拡張 + orphan integration test + artifact
  regression fixture
- **Phase I**: OPS_DESIGN / scripts/README の契約記述を実装と同期

### 完了条件との対応

- [x] `paragraph-count-mismatch` が主判定から外れても構造差検知が成立する
- [x] `the-command-line-cli` / `network-logs` / `faq` / `email-validation`
  が structure mismatch (または source-unusable) なしで baseline 0 entry で
  green
- [x] `salesforce-testing-overview` は shallow-snapshot として分離済み (baseline 1 件保持)
- [x] `custom-action-step-mobile` / `test-runs` の artifact が吸収で green
- [x] `reportableActiveFiles` が「全文構造を保っていない翻訳」を取りこぼさない
- [x] テスト fixture で 6 slug の clean green と artifact 吸収が pin されている

### 残存 debt

- `salesforce-testing-overview` の shallow-snapshot は upstream snapshot 側
  debt なので baseline 1 件を保持(翻訳者責任外)。snapshot fetch が復旧すれば
  orphan 検知経由で自動 cleanup される

Issue #247 をこのコメントを持って close します。
```

- [ ] **Step 2: Issue を close**

Run: `gh issue close 247`

- [ ] **Step 3: 最終 commit (docs のみ)**

```bash
git add docs/OPS_DESIGN.md scripts/README.md
git commit -m "$(cat <<'EOF'
docs: Issue #247 post-merge — 完了条件着地点 + baseline/debt 運用を OPS_DESIGN に追記

Issue #247 post-merge 作業の着地点と、将来の baseline/debt 運用ルール、
orphan baseline entry の掃除手順を明文化。Phase A-H で導入した契約・fixture・
helper の use cases を docs 側で pin する。

refs Issue #247 post-merge — docs 同期
EOF
)"
```

---

## 完了条件 (Plan 全体)

以下が全て満たされたら Issue #247 完全解消:

- [ ] Phase A: `source-unusable` ack の integration test が green (実 emitter → matcher round-trip)
- [ ] Phase B: `validateTypesArg` の 7 tests 全 green + parseArgs 結合 test green
- [ ] Phase C: `computeOrphanBaselineEntries` unit test green + summary counter test green + CLI/followup 表示手動確認
- [ ] Phase D: 3 slug (the-command-line-cli / network-logs / email-validation) が baseline なし gate green
- [ ] Phase E: 2 slug (custom-action-step-mobile / test-runs) が baseline なし gate green
- [ ] Phase F: `faq` が source-unusable を出さず baseline なし gate green
- [ ] Phase G: `parity-baseline.json` に Issue #247 対象 6 slug (full purge) 分の entry が残っていない。`salesforce-testing-overview` / `pull-requests` は live な `snapshot-incomplete` 1 件ずつのみ残存(Finding 2)
- [ ] Phase G: `npm run check:parity` で `reportableActiveFiles === 0 && orphanBaselineEntries === 0`(Finding 4: `result` は local の `freshnessState` 次第で `pass` または `inconclusive` — これは実装契約に沿った正常動作)
- [ ] Phase H: `npm run test` 全 suite PASS + clean sentinel 6 ページ + artifact regression fixture 2 ページ
- [ ] Phase I: Issue #247 が closed, OPS_DESIGN / scripts/README の契約記述が実装と一致
- [ ] 全 phase の commit が個別に cherry-pick 可能 (線形履歴)

---

## Self-Review (2026-04-09 + post-drafting revision)

### Initial self-review (2026-04-09 初稿時)

1. **Spec coverage**: ユーザ要求の 7 項目すべてと post-merge review の 4 findings すべてが phase に対応 (A→ack 契約, B→--types 検証, C→orphan detection, D/E/F→完了条件 #2/#4, G→cleanup, H→fixture 拡張, I→docs 同期 + Issue close)。✓

2. **Placeholder scan**: Phase D / E / F の投入 code snippet で placeholder が残る:
   - D: 「JA を EN と構造一致させる」ステップは実 content を見ないと exact code block を書けない — D.0 で dump を取ってから手作業する契約。
   - E: `source_parity_segments_en.mjs` の extractor 修正点は E.0 調査次第。
   - F: `legacyUnescapeDetails` の移植コードは skeleton のみ。

3. **Type consistency**: `validateTypesArg` / `computeOrphanBaselineEntries` / `summarizeParityResults` の各 signature は task 間で一致 ✓

### Post-drafting review (2026-04-09 第二弾 — Finding 1-4)

初稿に対して以下の問題が判明(レビュー出典: 同日付 post-drafting review):

1. **[P1] Phase F の green 前提ズレ (Finding 1 → 後に第 3/4 弾で再設計)**: `source_parity_segments_en.mjs::walkDetails` が `<summary>` を `'details-summary'` kind で emit しており、JA 側の `## h2` 翻訳と segment 契約が合わない。preprocessor を修正しても `alignSegments` が heading-count-mismatch で inconclusive に落ちる可能性が高い。
   - **当時の対応**: Phase F に Task F.2.5 (EN extractor の summary→heading 昇格) を追加(**第 3 弾 Finding 5-7 で破棄**、**第 4/5 弾 Finding 9-15 で再改訂**)。現在の F.2.5 は preprocessor-only の `normalizeEscapedFaqDetails` で faq discriminator (`startsWith('&lt;details&gt;')`) を使い、valid sibling `<h2>/<p>` block を emit する設計。

2. **[P1] Phase G purge が live debt を破壊 (Finding 2)**: `testops/testops-version-control/pull-requests` は baseline に **live な `snapshot-incomplete (extractor-empty)` が実測で確認できている**。`salesforce-testing-overview` だけ再 seed する当初案ではこの live debt が失われる。
   - **修正**: Phase G.2 を `FULL_PURGE_SLUGS` (6 slug) と `RESEED_SLUGS` (2 slug) に分割。G.3 で `--slug=salesforce-testing/salesforce-testing-overview,testops/testops-version-control/pull-requests` を一括再 seed する。

3. **[P2] Phase H.2 orphan E2E が false negative (Finding 3)**: 「存在しない slug に架空 entry」設計は、orphan 検知が per-file loop 内の checked slug にしか反応しないため検出されない。
   - **修正**: Phase H.2 を「`settings/cli-prerequisites` に synthetic な stale `segment-missing` entry を注入」設計に変更。第 5 弾でさらに `baselinePath` / `outputPath` 注入 + temp copy に改め、repo-global file を触らない isolated integration test にした。

4. **[P2] `result: pass` は local で達成不可能 (Finding 4)**: `checkSourceParity.mjs:155-169 (computeParityResult)` は `freshnessState !== 'fresh'` なら clean run を `inconclusive` に degrade する実装契約。実測で `freshnessState: broken`, `result: inconclusive` が確認されている。
   - **修正**: Phase G.4 / Plan 完了条件を `reportableActiveFiles === 0 && orphanBaselineEntries === 0` に緩和。`result` 値は local の freshness 状態依存で `pass` または `inconclusive` の両方を許容することを明記。

### Post-drafting review (2026-04-09 第三弾 — Finding 5-8)

第 1 弾の F.2.5 (extractor 変更案) に対する user のコードレベルレビューで以下が判明:

1. **[P1] F.2.5 初稿テストが無関係な赤で立つ (Finding 5)**: `h1 + 2 summary = 3 headings` は extractor の `h1Consumed` フラグ契約で成立しない。segment field は `textNorm` で `text` フィールドは存在しない。実コードを grep せず書いた placeholder に近い。
   - **修正**: F.2.5 を extractor 変更から preprocessor 正規化 (`normalizeEscapedFaqDetails` in `turndown.mjs`) に完全に差し替え。新テストは real fixture (`snapshots/en/content/salesforce-testing/faq.html`) を使って `<h2>` anchor の生成と `<details>` marker の除去を pin する。

2. **[P1] `details-summary` の片側変更が frozen 契約を破る (Finding 6)**: `details-summary` は `STRUCTURE_COMPARATOR_KINDS` の **FROZEN 語彙** で baseline identity key に hash されている (`source_parity_structure.mjs:74-81`)。削除は破壊的変更で既存 baseline を silently 壊す。加えて JA extractor も同じ kind を emit しており、`coding-assistant.md` は raw `<details><summary>` を持っている。EN だけ変更すると契約が割れる。
   - **修正**: F.2.5 は extractor と frozen 語彙を一切触らない。`turndown.mjs` の preprocessor 層に閉じた最小変更で、multi-paragraph broken details にのみ発火する条件付き正規化。`coding-assistant` の single-<p> 例は legacy `unescapeDetails` 経路が引き続き扱う。

3. **[P2] `SUMMARY_HEADING_LEVEL = 2` 固定が nested sectionPath を潰す (Finding 7)**: `pushHeading` の `entry.level < level` フィルタにより、親 h2 の下で level 2 を push すると親が drop され `Examples > Q1` が `Q1` に。
   - **修正**: extractor 変更案自体を破棄したので moot。preprocessor ルートでは heading level は HTML tag (`<h2>`) で直接決まるので、extractor の heading stack 処理は既存挙動のまま機能する。

4. **[P3] Phase G.3 assert が `source-unusable` も許容して regression を飲み込む (Finding 8 前半)**: `usabilityReason` を見ず `issueType` だけチェック → `snapshot-incomplete` が何らかの理由で `source-unusable` に classify 変更されても検知されない。
   - **修正**: G.3 を `{ issueType: 'snapshot-incomplete', usabilityReason: 'shallow-snapshot' | 'extractor-empty' }` のペアで厳密 assert に変更。regression を漏らさない。

5. **[P3] Phase H.1 の placeholder が plan 完了の前提を曖昧にする (Finding 8 後半)**: `<list-heavy slug>` 等が placeholder のまま残っていると、executing-plans が literal に解釈して test が abort する。
   - **修正**: H.1 Step 2 に「placeholder は **Phase H.1 実行前に必ず** Step 1 の実測結果で置換する」ことと、置換手順(候補抽出 → 試験 run → 確定) を明記。

### Post-drafting review (2026-04-09 第四弾 — Finding 9-13)

第 3 弾の `normalizeEscapedFaqDetails` 設計に対して、user の実 snapshot レビューで以下が判明:

1. **[P1] 発火条件 `spansMultipleP` が coding-assistant にも当たる (Finding 9)**: 初稿条件 `<p>` 内で open あり close なしは、`coding-assistant.html:120` (`<p>Here are some examples... &lt;details&gt; &lt;summary&gt;...&lt;/summary&gt;</p>`) にも match。結果として coding-assistant の sample prompt が `<h2>` に潰される危険があった。
   - **修正**: discriminator を `startsWith('&lt;details&gt;')` に変更。faq は line 3 で `<p>&lt;details&gt;...` (先頭から details)、coding-assistant は `<p>Here are some examples...` (prose 先行) なので区別できる。既存 legacy `unescapeDetails` の同一 check を再利用。

2. **[P1] summary→h2 regex が escaped `<b>` を扱えない (Finding 10)**: 初稿 regex `(?:<b>)?` は raw `<b>` しかマッチしないが、実 faq.html / coding-assistant.html は両方とも `&lt;b&gt;...&lt;/b&gt;` (escaped)。結果 `<h2>&lt;b&gt;Q&lt;/b&gt;</h2>` が生成されていた。
   - **修正**: regex を `(?:&lt;b(?:\b[^&]*)?&gt;)?\s*([\s\S]*?)\s*(?:&lt;\/b&gt;)?` に修正 (escaped `<b>` 対応)。加えて captured inner から残存 escaped HTML tag を strip する保険 (`inner.replace(/&lt;\/?[a-z][^&]*&gt;/gi, '')`) を追加して安全側に倒す。

3. **[P2] RED test fixture が実データと乖離 (Finding 11)**: 初稿 fixture は raw `<b>` を使っていたので、regex バグが検出されなかった(green なのに実 snapshot では壊れる false assurance)。
   - **修正**: narrow fixture は escaped `&lt;b&gt;` を使う。加えて **実 `snapshots/en/content/salesforce-testing/faq.html` を読む test** を追加して「h2 が 5 件 / escaped marker 0 件 / real details tag 0 件」を実データで直接 pin する。

4. **[P2] coding-assistant 回帰テストが弱すぎ (Finding 12)**: 初稿は `assert.ok(out.length > 0)` しか見ていなかった。「`<h2>` が注入されていない」「`detectSourceUsability === null` が維持される」といった本当に守りたい契約を pin していなかった。
   - **修正**: **実 `snapshots/en/content/advanced-editing/coding-assistant.html` を読む test** を追加して、`<h2>` count が preprocess 前後で変化しないこと、`generate code ...` のような sample prompt が `<h2>` に昇格していないことを pin する。detector 側の `null` 契約は既存の `source_parity_source_usability_fixtures.test.mjs` が引き続き担保する。

5. **[P2] Self-Review appendix が古い方針を残していた (Finding 13)**: 第 2 弾の「F.2.5 で extractor の summary→heading 昇格」記述が本文の新方針と矛盾していた。
   - **修正**: Self-Review 第 2 弾のエントリに「後に第 3/4 弾で再設計」の注釈を追加、現在の F.2.5 が preprocessor-only 設計であることを明記。

### Post-drafting review (2026-04-09 第五弾 — Finding 14-15)

第 4 弾の F.2.5 / H.2 に対して、さらに project code と runtime 契約を照合した結果、以下が判明:

1. **[P1] `summary -> <h2>` 全体置換では extractor が heading を拾えない (Finding 14)**: `<p><h2>Q</h2>...` の invalid HTML は `turndown` では DOM repair されるが、`extractSegmentsFromHtml()` は `preprocessEnHtml()` 後の HTML をそのまま tokenize / tree walk するため heading=0 のままになる。`faq` は依然 `heading-count-mismatch` へ落ちる。
   - **修正**: F.2.5 を paragraph-aware block rewrite に再設計。paragraph-start opener / paragraph-start close+opener / mid-paragraph boundary を別 regex で処理し、valid sibling `<h2></h2><p>...</p>` を emit する。test も `/<p>\\s*<h2>/` 非存在 + `extractSegmentsFromHtml()` heading exact 5 を直接 pin する。

2. **[P2] H.2 orphan E2E が repo-global state file を奪い合う (Finding 15)**: `parity-baseline.json` / `parity-check-status.json` を repo root で backup/restore する設計は、既存 integration test 群も同じ status file を触るため `npm test` 下で flaky になる余地がある。
   - **修正**: `checkSourceParity({ baselinePath, outputPath })` の test-only dependency injection を追加し、H.2 は `mkdtemp` 上の temp baseline/status copy を使う isolated integration test に変更。repo root の baseline/status は不変に保つ。

### 残存 open question

- Phase D の JA 実修正は人間レビューが必要(natural Japanese の品質保証)。自動テストでは「structure issue 0 件」しか pin できないので、content 品質は `npm run lint:docs` と人間校正に依存する。

- F.2.5 の `normalizeEscapedFaqDetails` の discriminator は `startsWith('&lt;details&gt;')` に依存する。将来 `coding-assistant` と同等パターンの新 page (= prose 先行の escaped details) が追加された場合は自動的に legacy path に流れるので安全。逆に **faq と同等パターンの新 page** (= `<p>&lt;details&gt;` で始まる multi-paragraph broken tree) が追加された場合は自動的に新 path に乗って **valid sibling `<h2>/<p>` block** 化される。意図しない match があった場合は discriminator を更に narrow する (e.g., `h1` の後ろ直後という構造条件を追加) 必要がある。Phase F.2.5 の Step 1/Step 3 の実 snapshot fixture test が最終防衛線。

---

Plan complete. See execution handoff section for next step.
