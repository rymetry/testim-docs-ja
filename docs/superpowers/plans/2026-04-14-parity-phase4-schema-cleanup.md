# Parity Phase 4 — Final Cutover Implementation Plan (Revision 7)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`). PR A 実行 worktree は `noble-squishing-bee`。PR Z は別 worktree で実行 (別途 `claude/parity-phase4-pr-z` 系を用意)。

> **Revision 7 (2026-04-15):** 最終 DoD を「機械判定 JSON assertion」ベースに置換 (本 plan §最終 DoD 参照)。`baselineExpired` / `acknowledged` (non-blocking) / `audit manifest` / `debug.artifactCoverage` を DoD **非含有**として明示。PR Z entry criteria は `docs/superpowers/plans/2026-04-15-parity-bulk-remediation.md §10` に集約し、entries 数閾値は廃止、issueType ベース (`segment-inconclusive ≤ 3`、他 6 種 = 0) に統一。最終判定ルール「green だから OK ではなく、残件ゼロだから OK」を明記。Rev 6 以前の DoD 記述は本 Rev 7 で置換 (履歴は git に残る)。

**Goal:** Phase 4 を「最終 cutover」として parity 運用の数値状態をすべて 0 に落とす。`parity-baseline.json.entries.length === 0`、`parity-check-status.summary.{reportableActiveFiles, baselinedIssues, advisoryQueueIssues, auditSignalIssues} === 0`、`snapshot-diff-status.summary.{changed, added, removed} === 0`。残る EN-side artifact / URL normalizer ターゲット / intentional divergence は checker 側で吸収する。schema を v1→v2 に atomic cutover し、baseline 契約から非 JA-actionable な type (`segment-inconclusive` / `snapshot-incomplete` / `source-unusable`) を除外する。

**Architecture:** 1 PR / 1 worktree。順序: (0) DoD 再定義 → (1) 5-bucket 残件実測 (JSON + md) → (2) parity_artifact_registry (slug-scope token + runtime coverage aggregator) + `alignSegments({slug, coverage})` への全呼出更新 → (3) URL normalizer 対称化 → (4) HTML extractor (`preprocessHtml`) で EN blockquote→callout 限定正規化 → (5) 残 baseline を 0 まで解消 → (6) schema v2 atomic cutover (types / loader / generator / advisory / summary / check / issue_state / detection_reports / status / migration / tests) → (7) docs 最終化 (scripts/README.md を含む) → (8) E2E JSON assertion → report → push → PR。

**Tech Stack:** Node.js 20, node:test。

---

## Execution Strategy — PR 分割 (2026-04-15 追記)

本 plan Rev 6 は **PR Z (final cutover)** の contract 定義として維持する。
ただし Task 4.1 inventory 実測で判明した baseline 1873 entries のうち
~1851 件が JA 側翻訳 / 整合性修正を要する actionable entries であり、
1 セッション / 1 PR での完遂は非現実的であることが明らかになった。
よって実行は 3 段階に分割する。

### PR A — Pre-Cutover Mechanism Infrastructure

本 worktree (`noble-squishing-bee`) のスコープ。Task 4.0–4.4 のみを入れ、
baseline / schema / docs 運用は現状のまま残す (schema v1 維持)。

- Task 4.0: DoD 再定義 + final-goal.md
- Task 4.1: 5-bucket residual inventory
- Task 4.2: parity_artifact_registry + alignSegments({slug, coverage}) 全呼出移行
- Task 4.3: URL normalizer 対称化
- Task 4.4: preprocessHtml で EN blockquote→callout-note 限定正規化

成果: runtime で artifact 抑止 / URL 対称化 / extractor 正規化が発火する状態
になる。baseline 再生成 (非必須) を行えば、mechanism で自動解消される ~10 件
(artifact 7 + extractor 3) が orphan 化する。schema migration は PR Z。

### 中間 PRs — Bulk Remediation (multi-session / multi-PR)

別 plan `docs/superpowers/plans/2026-04-15-parity-bulk-remediation.md` に従い、
新規 worktree を per-Stage で切って以下 bucket を順次消化する:

- segment-untranslated 1571 件 (LLM pipeline 優先)
- segment-missing 107 件
- segment-extra 87 件
- section-structure-mismatch 56 件
- segment-token-gap 残 ~39 件
- advisoryResidual (segment-inconclusive) 11 件

### PR Z — Final Cutover

baseline が十分に薄くなってから (目標: advisoryResidual ~10 件未満) 新しい
worktree で Task 4.5–4.8 を実行する:

- Task 4.5: 残 baseline entries=0 + status 4 counter=0
- Task 4.6.1–4.6.3: schema v1→v2 atomic cutover (types / loader / generator /
  advisory / summary / issue_state / detection_reports / check / migration)
- Task 4.7: 運用 docs 最終化 (scripts/README.md 含む)
- Task 4.8: E2E 5 counter 0 検証 + report + push + PR

この時点で Rev 6 の 5-counter 0 DoD を完全達成する。

### PR 境界の理由

1. **atomic cutover 規律**: schema v2 migration は baseline.entries=0 を前提
   に設計されている (`feedback_parity_phase_discipline` memory #2)。bulk
   remediation を同一 PR に混ぜると、翻訳 regression が schema migration を
   巻き込む危険がある。
2. **review 性**: 1500+ translation diff と runtime / schema 変更が同一 PR
   だと意味のある review が不可能。
3. **rollback 単位**: mechanism 変更 / bulk translation / schema migration は
   それぞれ異なる failure mode を持ち、独立 rollback できるべき。

---

## Context — Review 2 findings (Rev 5 → Rev 6) と対応

| # | Finding | Rev 6 の対応 |
|---|---|---|
| 1 | Rev 5 の empty baseline default test は `checkSourceParity()` 戻り値を status として読んでいた。実際は `outputPath` に JSON 書き出し、戻り値は exit code | test を `outputPath` + tmp dir + `readFileSync` で payload を読む形に具体化。実装側は `status.debug.baselineSchemaVersion = baselineData.schemaVersion` を追加 |
| 2 | Task 4.6.3 で参照していた `source_parity_summary.test.mjs` は存在せず、実在は `source_parity_summary_format.test.mjs` | owner / `git add` を実在 file 名に統一 |

---

## Context — Review 4 findings (Rev 4 → Rev 5) と対応

| # | Finding | Rev 5 の対応 |
|---|---|---|
| 1 | `source_parity_baseline_recall.test.mjs` が schema cutover ownership から漏れ、v2 契約に適合しない (`segment-inconclusive` / `inconclusiveReason` / `reviewAfter` を前提) | **Task 4.6.1** ownership に追加、v2 eligible type への差し替え / 削除を明記 |
| 2 | Rev 4 の `loadBaselineFileSafe returns v2 empty` test は private helper を直接 import している。現物は export していない | Rev 5 は public behavior 経由 (`checkSourceParity({ baselinePath: '/nonexistent' })` と `status.debug.baselineSchemaVersion` で検証) に変更 |
| 3 | Task 4.7 Step 5 の "本 Rev 3 内容で上書き" が過去 Rev 参照 | "本 Rev 4 内容で上書き" → Rev 5 では本ファイル最終状態を意味 |
| 4 | bucket 数 (4-bucket vs 5 実装) / test 数 (8 vs 7) の表現ズレ | "5-bucket" と "7 tests" に全面統一 |

---

## Context — Review 6 findings (Rev 3 → Rev 4) と対応

| # | Finding | Rev 4 の対応 |
|---|---|---|
| 1 | `scripts/__tests__/generate_parity_baseline.test.mjs` (1014 行、41×`reviewAfter` / 6×`segment-inconclusive` / 4×`schemaVersion`) が Task 4.6.2 ownership から漏れている | **Task 4.6.2** ownership に明示追加、更新項目をチェックリスト化 |
| 2 | `scripts/lib/parity_check_status.mjs` / `scripts/__tests__/parity_check_status.test.mjs` は repo に**存在しない**。Rev 3 は実在しない file を commit に列挙 | Rev 4 は status 書き出しを `check_source_parity.mjs` に寄せ、status shape test は既存 `check_source_parity.test.mjs` / `detection_reports.test.mjs` を更新対象にする。新 file は作らない |
| 3 | EN extractor の public API は `extractSegmentsFromHtml` (L595)、既存 test は `segmentKind === 'callout-body'`。Rev 3 の `extractEnSegments` / `kind === 'callout'` は現実装と不整合 | **Task 4.4** を `extractSegmentsFromHtml(html, options)` signature 拡張 + `segmentKind === 'callout-body'` assertion に書き換え。caller (`check_source_parity.mjs:453`) を ownership 追加 |
| 4 | Task 4.2 Step 1 の RED test は `http://google.com` 等の具体 entry 前提だが Step 2 は空 registry を返す。順序矛盾 | **Task 4.2** を 2 段に分割: 先に shape / empty / coverage aggregator を通す → inventory 反映後に具体 exclusion test を追加 |
| 5 | `check_source_parity.mjs:300-302, 342` の empty baseline default が `{ schemaVersion: 1, entries: [] }`。v2 cutover 後もこの既定値が残ると schema 契約が崩れる | **Task 4.6.1** に `loadBaselineFileSafe()` の empty return を `{ schemaVersion: 2, entries: [] }` へ変更 / `baselineData` init も v2 に統一する task を明記 (acknowledgements の v1 既定は不触) |
| 6 | `callout-normalization-slugs` を docs (`final-goal.md`) と code (`CALLOUT_NORMALIZATION_SLUGS`) の両方に書くと二重管理 | **Task 4.4** で code 側 `CALLOUT_NORMALIZATION_SLUGS` を single source of truth と宣言、docs は参照 / 説明のみ (値を docs には書かない) |

---

## Context — Rev 2 → Rev 3 で解消済み findings (履歴)

| # | Finding | Rev 3 の対応 |
|---|---|---|
| 1 | `snapshot-diff-status` の field は `summary.{changed, added, removed, unchanged}` (確認: `scripts/snapshot_diff.mjs:399-407`)。Rev 2 は `deleted` / top-level を使用 | **DoD / Task 4.1 / Task 4.8** を `summary.changed/added/removed = 0` に統一 |
| 2 | `source_parity_segments_en.mjs` は HTML 直接抽出 (`preprocessHtml` L44 / `walkBlock` L411)。MD `^>` ベースの正規化は入らない | **Task 4.4** を HTML layer の `preprocessHtml()` 拡張に書き直す。fixture は HTML 入力 |
| 3 | api-access の実 slug は `administration/api-access` (md: `src/content/docs/administration/api-access.md` / snapshot: `snapshots/en/content/administration/api-access.html`) | **Task 4.1 / 4.4** 全参照を `administration/api-access` に統一 |
| 4 | `alignSegments(` は 10 file で call (`source_parity_align.mjs` / `check_source_parity.mjs` + 8 tests)。Rev 2 は test 1 本しか修正せず他は 2 引数のまま壊れる | **Task 4.2** owner に 8 test 全件追加、最後に `grep -n "alignSegments\\s*(" scripts/ \| grep -v "{ slug"` が 0 件を確認する gate step を追加 |
| 5 | `baselineExpired` / `isFrozenByBaseline` は 12 file (lib 5 + check + 6 tests)。Rev 2 は 4 file のみ列挙 | **Task 4.6.3** owner に `source_parity_issue_state.mjs` + 4 tests を追加。`isFrozenByBaseline(issue) === (issue.baselined === true)` に縮約する契約を明記 |
| 6 | `debug.artifactCoverage` の contract は「この run で何件抑止したか」が traceable。Rev 2 は静的 `{entries, bySlug}` のみで runtime 集計がない | **Task 4.2** に `createArtifactCoverage()` (runtime aggregator) を新設。`alignSegments({slug, coverage})` で `coverage.record()` を叩き、`check_source_parity` が `status.debug.artifactCoverage = coverage.snapshot()` を出力 (shape: `{ registryEntries, matchedHits, bySlug, byToken }`) |
| 7 | Rev 2 の `KNOWN_ARTIFACT_URL_PATTERNS` に `help.testim.io` を入れると Task 4.3 の normalizer 対象が artifact に誤送される | **Task 4.1 classify_residual** の bucket を 4 種 (`actionable` / `artifactCandidates` / `normalizerCandidates` / `intentionalDivergenceCandidates`) に分離 |
| 8 | `option A` で runtime `inconclusiveReason` は残る方針。grep が必ずヒット。`scripts/README.md` に `reviewAfter` 言及あり (Rev 2 owner に未掲載) | **Task 4.8 Step 6** の grep scope を `scripts/lib scripts/check_source_parity.mjs docs/OPS_DESIGN.md docs/PARITY_GUIDE.md scripts/README.md` に限定し、対象 field も `reviewAfter / baselineReviewAfter / baselineExpired` のみ。`inconclusiveReason` は runtime 残存 (deprecated check から外す)。**Task 4.7** owner に `scripts/README.md` を追加 |

---

## 最終 DoD (Definition of Done) — Rev 7

### 機械判定 (必須 / authoritative)

以下の JSON assertion がすべて true であること。これが Phase 4 の唯一の authoritative DoD:

```
# parity-baseline.json
entries.length === 0

# parity-check-status.json
summary.reportableActiveFiles === 0
summary.baselinedIssues       === 0
summary.advisoryQueueIssues   === 0
summary.auditSignalIssues     === 0

# snapshot-diff-status.json
summary.changed === 0
summary.added   === 0
summary.removed === 0
```

### DoD に含めないもの (明示的除外)

以下は DoD **非含有**。PR Z 判定では評価しない:

- `baselineExpired === 0` — schema v2 cutover でこの概念自体を削除するため、ゼロ化対象ではなく「削除対象」。残っている/残っていないは DoD 判定には使わない。
- `acknowledged` / `non-blocking === 0` — baseline / advisory / audit とは別概念。必要なら別途「open acknowledgements なし」という独立ルールとして扱う。DoD には組み込まない。
- `audit manifest === 0` — 派生物。一次判定は `auditSignalIssues === 0` と `snapshot-diff-status.summary.{changed, added, removed} === 0` で行う。
- `debug.artifactCoverage === 0` — checker が artifact を吸収した証跡。runtime で非ゼロになるのは正常動作であり、DoD 違反ではない。

### Schema v2 / runtime 契約 (cutover で満たす副次条件)

以下は schema cutover の完了を表す契約条件。機械判定 DoD と分けて扱う:

```
parity-baseline.json.schemaVersion === 2
BASELINE_ELIGIBLE_TYPES ⊆ { segment-missing, segment-extra, segment-shifted,
                             segment-untranslated, segment-token-gap,
                             section-structure-mismatch, segment-order-mismatch }
reviewAfter は baseline schema / runtime tagging / summary / queue どこにも存在しない
baselineReviewAfter / baselineExpired は issue / queue / issue_state どこにも存在しない
inconclusiveReason は runtime issue 側にのみ存在。baseline entry schema には存在しない
isFrozenByBaseline(issue) ≡ issue.baselined === true
alignSegments は必ず { slug } option 付きで呼ばれる (grep 検証)
debug.artifactCoverage は shape { registryEntries, matchedHits, bySlug, byToken } で出力される (値は非ゼロ可)
```

### Gate コマンド (PR Z merge 前)

```
npm run test && npm run lint && npm run build が green
npm run check:parity && npm run check:snapshots:diff が green
```

### 判定ルール

- 「green だから OK」ではなく「残件ゼロだから OK」とする
- checker 吸収後も residual が残るなら未達
- baseline / advisory / audit に逃がしたままなら未達
- EN 更新取り込み後に同じ手順でゼロへ戻せないなら未達

---

## Schema v2 仕様 (最終形)

### Entry fields

| field | v1 | v2 | 備考 |
|---|---|---|---|
| `slug` | ✓ | ✓ | identity |
| `issueType` | ✓ | ✓ | identity |
| `snapshotFingerprint` | ✓ | ✓ | page-scope invalidation |
| `reviewAfter` | ✓ | **削除** | allowlist era 残滓 |
| `sectionPath` | ✓ | ✓ | segment identity (structure 系除外) |
| `segmentKind` | ✓ | ✓ | segment identity |
| `enSegmentIndex` / `jaSegmentIndex` | ✓ | ✓ | segment identity |
| `enSourceFingerprint` / `jaSourceFingerprint` | ✓ | ✓ | segment identity |
| `missingTokens` | ✓ | ✓ | registry 適用後の残トークン |
| `inconclusiveCategory` | ✓ | — | baseline 型集合から除外するため entry には不在。runtime issue で保持 |
| `inconclusiveReason` | ✓ | — | 同上 (runtime issue のみ) |
| `sectionIndex` / `structureCategory` / `structureFingerprint` | ✓ | ✓ | structure mismatch identity |
| `usabilityReason` | ✓ | — | baseline 対象外 (snapshot-incomplete / source-unusable 除外) |
| `priority` | ✗ | **追加** | `high` / `medium` / `low` (default=`medium`) |
| `note` | ✗ | **追加** | 任意 free-text (max 500 chars) |
| `schemaVersion` (root) | `1` | **`2`** | loader/validator で排他的に受理 |

### BASELINE_ELIGIBLE_TYPES (v2)

```js
export const BASELINE_ELIGIBLE_TYPES = Object.freeze(new Set([
  'segment-missing', 'segment-extra', 'segment-shifted',
  'segment-untranslated', 'segment-token-gap',
  'section-structure-mismatch', 'segment-order-mismatch',
]));
export const TYPES_ARG_ALLOWLIST = Object.freeze(new Set([
  'section-structure-mismatch', 'segment-order-mismatch',
]));
```

### `isFrozenByBaseline` 契約 (v2)

```js
// scripts/lib/source_parity_issue_state.mjs
export function isFrozenByBaseline(issue) {
  return issue.baselined === true;
}
```

expiry logic (旧 `baselineExpired` / `reviewAfter` 参照) は全撤去。

---

## 重要ファイルマップ

### 新規
- `scripts/lib/parity_artifact_registry.mjs` — static registry + `isArtifactExcluded` + `registryEntries` + `createArtifactCoverage()` (runtime aggregator)
- `scripts/__tests__/parity_artifact_registry.test.mjs`
- `scripts/phase4/classify_residual.mjs` — 5-bucket JSON 出力
- `scripts/phase4/render_residual_inventory.mjs` — JSON → md
- `scripts/phase4/migrate_baseline_schema.mjs` — one-shot v1→v2 migration (export)
- `scripts/__tests__/baseline_schema_migration.test.mjs`
- `docs/superpowers/specs/2026-04-14-parity-phase4-final-goal.md`
- `docs/superpowers/specs/2026-04-14-parity-phase4-residual-inventory.{json,md}`
- `docs/superpowers/specs/2026-04-14-parity-phase4-report.md`

### 変更 (runtime — Task 4.2 ownership)
- `scripts/lib/source_parity_align.mjs:527-577` — `alignSegments(enSections, jaSections, { slug, coverage })` 化、`isArtifactExcluded` + `coverage.record()` 注入
- `scripts/check_source_parity.mjs` — `createArtifactCoverage()` 生成、`alignSegments` を `{ slug, coverage }` 付きで呼ぶ、`status.debug.artifactCoverage = coverage.snapshot()` をここで書き出す (新 module は作らない)
- `scripts/__tests__/source_parity_align.test.mjs`
- `scripts/__tests__/source_parity_align_runtime.test.mjs`
- `scripts/__tests__/source_parity_recall.test.mjs`
- `scripts/__tests__/source_parity_baseline_recall.test.mjs`
- `scripts/__tests__/source_parity_structure_fixtures.test.mjs`
- `scripts/__tests__/source_parity_clean_page_fixtures.test.mjs`
- `scripts/__tests__/source_parity_source_usability_fixtures.test.mjs`
- `scripts/phase2/lib/baseline.mjs` — re-export (import path: `../../lib/parity_artifact_registry.mjs`)
- `scripts/phase2/enumerate_token_gaps.mjs` — registry 参照に更新 (あるいは archive)

### 変更 (runtime — Task 4.3 / 4.4)
- `scripts/lib/parity_normalize.mjs:11-37` — `help.testim.io#fragment` ↔ `/docs/...#fragment` 対称化
- `scripts/__tests__/parity_normalize.test.mjs`
- `scripts/lib/source_parity_segments_en.mjs:44, 595` — `preprocessHtml(html, options)` / `extractSegmentsFromHtml(html, options)` 双方を options 対応化。`CALLOUT_NORMALIZATION_SLUGS` 定数を export (allow list の single source of truth)
- `scripts/check_source_parity.mjs:453` — EN extractor caller を `{ slug, calloutAllowSlugs: CALLOUT_NORMALIZATION_SLUGS }` 付きで呼ぶ
- `scripts/__tests__/source_parity_segments_en.test.mjs` — HTML fixture で `segmentKind === 'callout-body'` assertion

### 変更 (runtime — Task 4.6 schema cutover)
- `scripts/lib/source_parity_types.mjs` — entry 型刷新 (priority/note 追加、reviewAfter/inconclusiveReason 削除)
- `scripts/lib/source_parity_baseline.mjs:31-48, 52-72, 198-204, 233, 264, 269-282, 317-335, 405-440, 454, 460-552, 560-615` — BASELINE_ELIGIBLE_TYPES / TYPES_ARG_ALLOWLIST 縮約、v2 validator、expiry 関数削除、`tagIssuesWithBaseline` の `baselineReviewAfter/Expired` 撤去、priority/note 対応
- `scripts/generate_parity_baseline.mjs:184-225, 262-282, 308, 500-533` — v2 出力、`--review-after` option 削除 (usage 文面更新)
- `scripts/check_source_parity.mjs:78, 520, 615-620` — `baselineReviewAfter` 付与撤去
- `scripts/lib/source_parity_advisory_queue.mjs:104-128` — queue entry から `baselineReviewAfter` / `baselineExpired` 削除。`inconclusiveReason` は runtime issue 直読みで残す (option A)
- `scripts/lib/source_parity_summary.mjs:50-131` — `baselineExpired` / `baselineExpiringSoon` 集計撤去、`priorityCounts` 追加
- `scripts/lib/source_parity_issue_state.mjs` — `isFrozenByBaseline(issue) === issue.baselined === true` に縮約、`baselineExpired` 参照全撤去
- `scripts/lib/detection_reports.mjs` — `reviewAfter` / `baselineExpired` 参照削除
- `scripts/__tests__/source_parity_baseline.test.mjs`
- `scripts/__tests__/source_parity_advisory_queue.test.mjs`
- `scripts/__tests__/source_parity_summary_format.test.mjs` (存在すれば)
- `scripts/__tests__/source_parity_issue_state.test.mjs`
- `scripts/__tests__/source_parity.test.mjs`
- `scripts/__tests__/detection_reports.test.mjs`
- `scripts/__tests__/check_source_parity.test.mjs`
- `scripts/__tests__/source_parity_acknowledgements.test.mjs` (`baselineExpired` 参照があれば更新)
- `scripts/__tests__/check_source_parity.test.mjs` (`status.debug.artifactCoverage` shape + v2 empty baseline default を既存 test に追記)

### 変更 (docs — Task 4.7)
- `docs/superpowers/specs/2026-04-14-parity-burndown-roadmap.md:120-127`
- `docs/superpowers/plans/2026-04-14-parity-phase4-schema-cleanup.md` — 本 plan で置換
- `docs/OPS_DESIGN.md`
- `docs/PARITY_GUIDE.md`
- `docs/WRITING_GUIDE.md`
- `scripts/README.md` — `reviewAfter` 言及削除、v2 運用に更新

### baseline
- `parity-baseline.json` — v2 化、最終 entries=0

---

## Task 4.0: DoD 再定義 + artifact coverage 契約

**Files:**
- Modify: `docs/superpowers/specs/2026-04-14-parity-burndown-roadmap.md:120-127`
- Create: `docs/superpowers/specs/2026-04-14-parity-phase4-final-goal.md`

- [ ] **Step 1: roadmap DoD を 5 counter 0 に書き換え**

上記 "最終 DoD" セクションを roadmap §5 に反映。`snapshot-diff-status.summary.{changed, added, removed} = 0` を明示。

- [ ] **Step 2: final-goal.md 作成**

内容:
- 5 カウンタ 0 DoD の根拠と測定方法 (JSON 参照先フィールド確定)
- runtime 検出 3 枠: actionable-baseline / parity-artifact-registry / advisory-residual
- `debug.artifactCoverage` 契約: `{ registryEntries, matchedHits, bySlug, byToken }` (runtime aggregate)
- `debug.maskCoverage` は glossary/invariant mask 専用、artifact とは分離 (Phase 0 契約再掲)
- intentional divergence は HTML extractor (`preprocessHtml`) の slug-allow-list 限定 rule で吸収 (turndown singleton 非侵襲)
- page-level exclusion (`source_sync_exclusions.mjs`) は壊れた page の lock のみ
- **callout-normalization** section を作り、仕組みの説明のみ記載。slug 値は docs に書かず、`scripts/lib/source_parity_segments_en.mjs` の `CALLOUT_NORMALIZATION_SLUGS` が single source of truth と明記 (Finding 6)

- [ ] **Step 3: commit**

```bash
git add docs/superpowers/specs/2026-04-14-parity-burndown-roadmap.md \
        docs/superpowers/specs/2026-04-14-parity-phase4-final-goal.md
git commit -m "docs: Phase 4 DoD を 5 counter 0 に / artifactCoverage を final-goal に明記"
```

---

## Task 4.1: 残件実測 (5-bucket JSON) + md render

**Context:** Finding 7 対応。5 bucket (actionable / artifactCandidates / normalizerCandidates / intentionalDivergenceCandidates / advisoryResidual) に分離することで Task 4.2 (artifact registry) と Task 4.3 (normalizer) の入力混線を防ぐ。

**Files:**
- Create: `scripts/phase4/classify_residual.mjs`
- Create: `scripts/phase4/render_residual_inventory.mjs`
- Create: `docs/superpowers/specs/2026-04-14-parity-phase4-residual-inventory.{json,md}`

- [ ] **Step 1: classify_residual.mjs**

```js
// scripts/phase4/classify_residual.mjs
// Output: JSON to stdout
import { readFileSync } from 'node:fs';

// 本物の EN artifact (翻訳でも normalizer でも直らない)
const ARTIFACT_TOKEN_MATCHERS = [
  (t) => t === '/docs/index',
  (t) => t === 'http://google.com',
];
// Task 4.3 の URL normalizer が正規化すべきもの
const NORMALIZER_TOKEN_MATCHERS = [
  (t) => typeof t === 'string' && /^https?:\/\/help\.testim\.io/.test(t),
];
// Task 4.4 の HTML extractor で正規化すべき intentional divergence 候補
const INTENTIONAL_SLUGS = new Set(['administration/api-access']);

function classify(entry) {
  if (entry.issueType === 'segment-inconclusive') return 'advisoryResidual';
  if (INTENTIONAL_SLUGS.has(entry.slug)) return 'intentionalDivergenceCandidates';
  const tokens = entry.missingTokens ?? [];
  if (tokens.length > 0) {
    if (tokens.every(t => NORMALIZER_TOKEN_MATCHERS.some(f => f(t)))) return 'normalizerCandidates';
    if (tokens.every(t => ARTIFACT_TOKEN_MATCHERS.some(f => f(t)))) return 'artifactCandidates';
  }
  return 'actionable';
}

function main() {
  const baseline = JSON.parse(readFileSync('./parity-baseline.json', 'utf8'));
  let status = null, snapDiff = null;
  try { status = JSON.parse(readFileSync('./parity-check-status.json', 'utf8')); } catch {}
  try { snapDiff = JSON.parse(readFileSync('./snapshot-diff-status.json', 'utf8')); } catch {}

  const out = {
    baseline: { total: baseline.entries.length, byIssueType: {} },
    buckets: {
      actionable: [],
      artifactCandidates: [],
      normalizerCandidates: [],
      intentionalDivergenceCandidates: [],
      advisoryResidual: [],
    },
    summary: {
      reportableActiveFiles: status?.summary?.reportableActiveFiles ?? null,
      baselinedIssues: status?.summary?.baselinedIssues ?? null,
      advisoryQueueIssues: status?.summary?.advisoryQueueIssues ?? null,
      auditSignalIssues: status?.summary?.auditSignalIssues ?? null,
    },
    snapshotDiff: {
      changed: snapDiff?.summary?.changed ?? null,
      added:   snapDiff?.summary?.added   ?? null,
      removed: snapDiff?.summary?.removed ?? null,
    },
  };
  for (const e of baseline.entries) {
    out.baseline.byIssueType[e.issueType] = (out.baseline.byIssueType[e.issueType] ?? 0) + 1;
    out.buckets[classify(e)].push({
      slug: e.slug,
      issueType: e.issueType,
      sectionPath: e.sectionPath,
      segmentKind: e.segmentKind,
      missingTokens: e.missingTokens,
      inconclusiveCategory: e.inconclusiveCategory,
      inconclusiveReason: e.inconclusiveReason,
    });
  }
  process.stdout.write(JSON.stringify(out, null, 2));
}
main();
```

- [ ] **Step 2: 実行 & JSON 固定**

```bash
node scripts/phase4/classify_residual.mjs > docs/superpowers/specs/2026-04-14-parity-phase4-residual-inventory.json
```

- [ ] **Step 3: render_residual_inventory.mjs**

JSON を読み、md で以下 section を出力:
- 概要 (合計 / byIssueType)
- 5 bucket 別 entry 表 (slug | issueType | key meta)
- summary counters / snapshotDiff

```bash
node scripts/phase4/render_residual_inventory.mjs \
  docs/superpowers/specs/2026-04-14-parity-phase4-residual-inventory.json \
  > docs/superpowers/specs/2026-04-14-parity-phase4-residual-inventory.md
```

- [ ] **Step 4: inventory 末尾に分配方針を手動追記**

- `artifactCandidates` → Task 4.2 registry の初期 entries に登録 (slug list 固定)
- `normalizerCandidates` → Task 4.3 で normalizer 修正
- `intentionalDivergenceCandidates` → Task 4.4 の slug allow list に追加
- `actionable` → Task 4.5 で翻訳修正
- `advisoryResidual` → Task 4.5 で全件解消 (翻訳 / alignment 改善 / artifact 昇格いずれか)

- [ ] **Step 5: commit**

```bash
git add scripts/phase4/classify_residual.mjs \
        scripts/phase4/render_residual_inventory.mjs \
        docs/superpowers/specs/2026-04-14-parity-phase4-residual-inventory.json \
        docs/superpowers/specs/2026-04-14-parity-phase4-residual-inventory.md
git commit -m "chore: Phase 4 residual inventory (5-bucket) を実測"
```

---

## Task 4.2: `parity_artifact_registry` 新設 + runtime coverage + `alignSegments({slug, coverage})` 全呼出更新

**Context:** Finding 4 (blast radius) + 6 (runtime aggregate) + 11 (slug-scope) + 12 (import path) を反映。`alignSegments` の signature 変更は 10 file に波及する。

**Files (ownership):**
- Create: `scripts/lib/parity_artifact_registry.mjs`
- Create: `scripts/__tests__/parity_artifact_registry.test.mjs`
- Modify: `scripts/lib/source_parity_align.mjs:527-577`
- Modify: `scripts/check_source_parity.mjs` (status 書き出しはここで行う — 新 module は作らない)
- Modify (2 引数 → 3 引数移行):
  - `scripts/__tests__/source_parity_align.test.mjs`
  - `scripts/__tests__/source_parity_align_runtime.test.mjs`
  - `scripts/__tests__/source_parity_recall.test.mjs`
  - `scripts/__tests__/source_parity_baseline_recall.test.mjs`
  - `scripts/__tests__/source_parity_structure_fixtures.test.mjs`
  - `scripts/__tests__/source_parity_clean_page_fixtures.test.mjs`
  - `scripts/__tests__/source_parity_source_usability_fixtures.test.mjs`
- Modify: `scripts/phase2/lib/baseline.mjs` (re-export path `../../lib/parity_artifact_registry.mjs`)
- Modify: `scripts/phase2/enumerate_token_gaps.mjs` (registry 参照へ)
- Modify: `scripts/__tests__/check_source_parity.test.mjs` (status.debug.artifactCoverage shape assertion 追加)
- Modify: `scripts/__tests__/detection_reports.test.mjs` (artifactCoverage field passthrough が壊れないことを assert)

- [ ] **Step 1a: registry shape + empty-safe + coverage aggregator の RED テスト (inventory 非依存)**

```js
// scripts/__tests__/parity_artifact_registry.test.mjs
import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
let isArtifactExcluded, registryEntries, createArtifactCoverage;
before(async () => {
  ({ isArtifactExcluded, registryEntries, createArtifactCoverage } = await import('../lib/parity_artifact_registry.mjs'));
});

describe('parity_artifact_registry (shape / empty-safe)', () => {
  it('isArtifactExcluded returns false for unregistered (slug, token)', () => {
    assert.equal(isArtifactExcluded({ slug: 'nonexistent/slug', token: 'nonexistent-token' }), false);
  });
  it('registry entries have required shape (slugs non-empty, token string, dated)', () => {
    for (const e of registryEntries()) {
      assert.ok(Array.isArray(e.slugs) && e.slugs.length > 0);
      assert.ok(typeof e.token === 'string' && e.token.length > 0);
      assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(e.addedAt));
    }
  });
});

describe('createArtifactCoverage', () => {
  it('starts empty and records hits per (slug, token)', () => {
    const c = createArtifactCoverage();
    const s0 = c.snapshot();
    assert.equal(s0.matchedHits, 0);
    c.record({ slug: 'a', token: '/docs/index', reason: 'en-unresolvable' });
    c.record({ slug: 'a', token: '/docs/index', reason: 'en-unresolvable' });
    c.record({ slug: 'b', token: 'http://google.com', reason: 'en-demo' });
    const s = c.snapshot();
    assert.equal(s.matchedHits, 3);
    assert.equal(s.bySlug.a, 2);
    assert.equal(s.bySlug.b, 1);
    assert.equal(s.byToken['/docs/index'], 2);
    assert.equal(s.byToken['http://google.com'], 1);
    assert.equal(typeof s.registryEntries, 'number');
  });
});
```

Run: `node --test scripts/__tests__/parity_artifact_registry.test.mjs` → FAIL (module absent)。

- [ ] **Step 2: registry + coverage 実装 (GREEN)**

```js
// scripts/lib/parity_artifact_registry.mjs
/**
 * EN-side artifact registry (slug-scope, token) + runtime coverage aggregator.
 * See docs/superpowers/specs/2026-04-14-parity-phase4-final-goal.md for contract.
 */

export const ARTIFACT_REGISTRY = Object.freeze([
  // 初期 entries は Task 4.1 inventory に基づく。例:
  // Object.freeze({
  //   slugs: ['getting-started/creating-your-first-codeless-test'],
  //   token: 'http://google.com',
  //   reason: 'en-side-demo-link-artifact',
  //   note: 'EN <a href="http://google.com">demo.testim.io</a>',
  //   expectedIssueType: 'segment-token-gap',
  //   addedAt: '2026-04-15',
  //   linkedIssue: null,
  // }),
]);

export function isArtifactExcluded({ slug, token }) {
  for (const e of ARTIFACT_REGISTRY) {
    if (!e.slugs.includes(slug)) continue;
    if (e.token === token) return true;
  }
  return false;
}

export function registryEntries() {
  return ARTIFACT_REGISTRY.slice();
}

export function createArtifactCoverage() {
  const hits = [];
  return {
    record({ slug, token, reason }) {
      hits.push({ slug, token, reason: reason ?? null });
    },
    snapshot() {
      const bySlug = {};
      const byToken = {};
      for (const h of hits) {
        bySlug[h.slug] = (bySlug[h.slug] ?? 0) + 1;
        byToken[h.token] = (byToken[h.token] ?? 0) + 1;
      }
      return {
        registryEntries: ARTIFACT_REGISTRY.length,
        matchedHits: hits.length,
        bySlug,
        byToken,
      };
    },
  };
}

// Call-site default — alignSegments で coverage 未指定時の no-op
export const NOOP_COVERAGE = Object.freeze({
  record() {},
  snapshot: () => ({ registryEntries: ARTIFACT_REGISTRY.length, matchedHits: 0, bySlug: {}, byToken: {} }),
});
```

Task 4.1 inventory を確定後、`ARTIFACT_REGISTRY` に slug/token pair を投入する (Step 3)。この時点で Step 1a は shape / empty-safe / coverage だけを通過できる。

Run: PASS (Step 1a のみ、具体 exclusion test はまだ書かない)。

- [ ] **Step 3: inventory から初期 entries を投入 + 具体 exclusion テストを追加 (Step 1b)**

1. Task 4.1 inventory の `artifactCandidates` bucket から slug/token pair を抽出し `ARTIFACT_REGISTRY` に追加。
2. `parity_artifact_registry.test.mjs` に inventory-driven な test を追記:

```js
describe('parity_artifact_registry (inventory-driven exclusion)', () => {
  it('excludes http://google.com for creating-your-first-codeless-test (EN demo link artifact)', () => {
    assert.equal(isArtifactExcluded({ slug: 'getting-started/creating-your-first-codeless-test', token: 'http://google.com' }), true);
    assert.equal(isArtifactExcluded({ slug: 'editing-tests/steps', token: 'http://google.com' }), false);
  });
  // 他、inventory に挙がった (slug, token) pair ごとに slug-scope 抑止 / 未登録 slug 非抑止の pair 検証を追加
});
```

Run: PASS (Step 1a + Step 1b 両方)。

- [ ] **Step 4: `alignSegments` signature 変更 + coverage hook (RED → GREEN)**

```js
// scripts/lib/source_parity_align.mjs (L527 付近)
import { isArtifactExcluded, NOOP_COVERAGE } from './parity_artifact_registry.mjs';

export function alignSegments(enSections, jaSections, options = {}) {
  const { slug, coverage = NOOP_COVERAGE } = options;
  if (typeof slug !== 'string' || slug.length === 0) {
    throw new Error('alignSegments: slug option is required');
  }
  // ... 既存ロジック ...
  for (const [enIdx, jaIdx] of matched) {
    const enSeg = enBody[enIdx];
    const jaSeg = jaBody[jaIdx];
    const jaTokenSet = new Set(normalizeSegmentTokens(jaSeg.tokensInvariant ?? []));
    const enTokens = normalizeSegmentTokens(enSeg.tokensInvariant ?? []);
    const missingTokens = [];
    for (const token of enTokens) {
      if (jaTokenSet.has(token)) continue;
      if (isArtifactExcluded({ slug, token })) {
        coverage.record({ slug, token, reason: 'artifact-registry' });
        continue;
      }
      missingTokens.push(token);
    }
    if (missingTokens.length > 0) {
      diffs.push(diffTokenGap(enSection, enSeg, jaSeg, enIdx, jaIdx, missingTokens));
    }
    // ...
  }
}
```

align test 追加:

```js
// scripts/__tests__/source_parity_align.test.mjs (追記)
import { createArtifactCoverage } from '../lib/parity_artifact_registry.mjs';
// ...
it('throws when slug option is missing (safety guard)', () => {
  assert.throws(() => alignSegments(enFixture, jaFixture), /slug option is required/);
});
it('suppresses segment-token-gap via artifact registry and records coverage', () => {
  const coverage = createArtifactCoverage();
  const diffs = alignSegments(enFixture, jaFixture, { slug: '<REGISTERED_SLUG>', coverage });
  assert.equal(diffs.filter(d => d.type === 'segment-token-gap').length, 0);
  const s = coverage.snapshot();
  assert.ok(s.matchedHits >= 1);
});
```

Run: PASS。

- [ ] **Step 5: 全 test の 2 引数呼出を `{ slug }` 付きに移行**

以下 7 test を順に修正:
- `source_parity_align.test.mjs`
- `source_parity_align_runtime.test.mjs`
- `source_parity_recall.test.mjs`
- `source_parity_baseline_recall.test.mjs`
- `source_parity_structure_fixtures.test.mjs`
- `source_parity_clean_page_fixtures.test.mjs`
- `source_parity_source_usability_fixtures.test.mjs`

fixture ごとに適切な slug を渡す (fixture 内で定義済みなら import、なければ dummy 'test/fixture' 等)。

- [ ] **Step 6: `check_source_parity.mjs` で coverage 生成 → 集約 → status**

```js
// scripts/check_source_parity.mjs (該当箇所)
import { createArtifactCoverage } from './lib/parity_artifact_registry.mjs';
// ...
const coverage = createArtifactCoverage();
for (const slug of slugs) {
  // ... existing per-slug work ...
  const diffs = alignSegments(en, ja, { slug, coverage });
  // ...
}
// status 書き出し直前
status.debug = {
  ...status.debug,
  artifactCoverage: coverage.snapshot(),
};
```

- [ ] **Step 7: `scripts/phase2/lib/baseline.mjs` を re-export に置換**

```js
export {
  isArtifactExcluded, registryEntries, createArtifactCoverage,
  ARTIFACT_REGISTRY, NOOP_COVERAGE,
} from '../../lib/parity_artifact_registry.mjs';
```

`scripts/phase2/enumerate_token_gaps.mjs` が旧 `EN_SIDE_ARTIFACT_TOKENS` 等を使っていたら registry API に書き換え。

- [ ] **Step 8: status.debug.artifactCoverage shape test を既存 check_source_parity.test.mjs に追加**

新規 module / test file は作らず、既存 `scripts/__tests__/check_source_parity.test.mjs` に assertion を追記:

```js
// scripts/__tests__/check_source_parity.test.mjs (追記)
it('status.debug.artifactCoverage has runtime aggregate shape', async () => {
  // check_source_parity 相当を実行し、書き出された status を読む
  const status = /* 既存 test の status 取得手順に合わせる */;
  const ac = status.debug?.artifactCoverage;
  assert.ok(ac, 'artifactCoverage missing');
  assert.ok(typeof ac.registryEntries === 'number');
  assert.ok(typeof ac.matchedHits === 'number');
  assert.ok(typeof ac.bySlug === 'object' && ac.bySlug !== null);
  assert.ok(typeof ac.byToken === 'object' && ac.byToken !== null);
});
```

`scripts/__tests__/detection_reports.test.mjs` 側でも `debug.artifactCoverage` field が report 生成時に保持されることを確認する test を追加 (単純な passthrough assertion)。

- [ ] **Step 9: 2 引数 alignSegments 残存の全滅 gate**

```bash
grep -rn "alignSegments\s*(" scripts/ \
  | grep -v "^Binary" \
  | grep -vE "\{\s*slug" \
  | grep -v "function alignSegments" \
  | grep -v "// "
```

Expected: 0 行 (定義行とコメント以外 0)。Hit があれば該当箇所を修正。

```bash
npm run test 2>&1 | tail -40
```

Expected: all green。

- [ ] **Step 10: commit**

```bash
git add scripts/lib/parity_artifact_registry.mjs \
        scripts/__tests__/parity_artifact_registry.test.mjs \
        scripts/lib/source_parity_align.mjs \
        scripts/check_source_parity.mjs \
        scripts/__tests__/check_source_parity.test.mjs \
        scripts/__tests__/detection_reports.test.mjs \
        scripts/__tests__/source_parity_align.test.mjs \
        scripts/__tests__/source_parity_align_runtime.test.mjs \
        scripts/__tests__/source_parity_recall.test.mjs \
        scripts/__tests__/source_parity_baseline_recall.test.mjs \
        scripts/__tests__/source_parity_structure_fixtures.test.mjs \
        scripts/__tests__/source_parity_clean_page_fixtures.test.mjs \
        scripts/__tests__/source_parity_source_usability_fixtures.test.mjs \
        scripts/phase2/lib/baseline.mjs \
        scripts/phase2/enumerate_token_gaps.mjs
git commit -m "feat: parity_artifact_registry + coverage / alignSegments({slug,coverage}) へ全呼出移行"
```

---

## Task 4.3: URL normalizer 非対称性修正

**Files:**
- Modify: `scripts/lib/parity_normalize.mjs:11-37`
- Modify: `scripts/__tests__/parity_normalize.test.mjs`

- [ ] **Step 1: pin test (RED)**

```js
it('normalizes help.testim.io URL with fragment symmetrically', () => {
  assert.equal(
    normalizeUrlForParity('https://help.testim.io/docs/api-access#api-access'),
    normalizeUrlForParity('/docs/api-access#api-access'),
  );
});
it('preserves fragment on /docs path', () => {
  assert.equal(
    normalizeUrlForParity('https://help.testim.io/docs/index#top'),
    '/docs/index#top',
  );
});
it('drops trailing slash differences', () => {
  assert.equal(
    normalizeUrlForParity('https://help.testim.io/docs/api-access/'),
    normalizeUrlForParity('/docs/api-access'),
  );
});
```

Run 現状確認: FAIL が 1 件以上。

- [ ] **Step 2: normalizer 修正**

canonical form:
1. `https?://help.testim.io` prefix を削除
2. path は `/docs/` 始まりで末尾 `/` を除去
3. `#fragment` は保持
4. `?query` は削除 (既存挙動)

Run Step 1 test: PASS。

- [ ] **Step 3: commit**

```bash
git add scripts/lib/parity_normalize.mjs scripts/__tests__/parity_normalize.test.mjs
git commit -m "fix: URL normalizer を help.testim.io ↔ /docs で対称化"
```

---

## Task 4.4: HTML extractor で EN `<blockquote>` → callout-body 限定正規化

**Context:** Finding 2 + 3 + 6。EN extractor の public API は `extractSegmentsFromHtml(html)` (`source_parity_segments_en.mjs:595`)、callout segment は `segmentKind === 'callout-body'` で emit される (`source_parity_segments_en.test.mjs:153` 等で既に前提)。`preprocessHtml()` (L44) と `extractSegmentsFromHtml()` (L595) の両方に `options` を受け取らせ、slug allow list + warning-like 先頭 + 短長制約に該当する `<blockquote>` を callout HTML (例: `<div class="callout-note">`) に書き換える。turndown は不触。caller (`check_source_parity.mjs:453`) も options 付きで呼ぶよう更新。

**allow list の single source of truth:** code 側の `CALLOUT_NORMALIZATION_SLUGS` (in `source_parity_segments_en.mjs`) を唯一の truth にする。`final-goal.md` は説明のみで、slug 値は docs に書かず「詳細は code 参照」と明記する (Finding 6)。

**Files:**
- Modify: `scripts/lib/source_parity_segments_en.mjs:44, 595` (`preprocessHtml(html, options)` / `extractSegmentsFromHtml(html, options)` 拡張 + `CALLOUT_NORMALIZATION_SLUGS` 定数 export)
- Modify: `scripts/check_source_parity.mjs:453` (caller に `{ slug, calloutAllowSlugs: CALLOUT_NORMALIZATION_SLUGS }` 付与)
- Modify: `scripts/__tests__/source_parity_segments_en.test.mjs` (HTML fixture で assertion)
- Read for design: `snapshots/en/content/administration/api-access.html` / `src/content/docs/administration/api-access.md`
- Modify: `docs/superpowers/specs/2026-04-14-parity-phase4-final-goal.md` (callout-normalization 説明 only、slug 値は掲載しない)

- [ ] **Step 1: 実体確認**

```bash
sed -n '1,300p' snapshots/en/content/administration/api-access.html
sed -n '1,200p' src/content/docs/administration/api-access.md
```

`<blockquote>` の具体形、JA 側 `:::danger` / `:::note` などの期待形を読む。Task 4.1 `intentionalDivergenceCandidates` bucket と突合し、allow list 最終決定。

- [ ] **Step 2: final-goal.md に callout-normalization の説明を掲載 (slug 値は書かない)**

```md
## callout-normalization (parity HTML extractor 限定正規化)

EN snapshot の warning-like な短い `<blockquote>` は、slug allow list
に含まれる場合に限り `<div class="callout-note">` に書き換え、JA 側
callout と kind-level parity を保つ。

**allow list の single source of truth:** `scripts/lib/source_parity_segments_en.mjs`
の `CALLOUT_NORMALIZATION_SLUGS` 定数。slug を追加 / 削除する際は
この定数を更新する (docs を先に書かない)。
```

- [ ] **Step 3: RED test (HTML fixture, `extractSegmentsFromHtml` + `callout-body` kind)**

```js
// scripts/__tests__/source_parity_segments_en.test.mjs (追記)
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

let preprocessHtml, extractSegmentsFromHtml, CALLOUT_NORMALIZATION_SLUGS;
before(async () => {
  ({ preprocessHtml, extractSegmentsFromHtml, CALLOUT_NORMALIZATION_SLUGS } =
    await import('../lib/source_parity_segments_en.mjs'));
});

describe('preprocessHtml callout normalization', () => {
  it('rewrites short warning-like <blockquote> to <div class="callout-note"> for allowed slug', () => {
    const html = '<blockquote><p><strong>Note</strong>: Keep your API key safe.</p></blockquote>';
    const out = preprocessHtml(html, { slug: 'administration/api-access', calloutAllowSlugs: CALLOUT_NORMALIZATION_SLUGS });
    assert.match(out, /<div class="callout-note">/);
    assert.doesNotMatch(out, /<blockquote>/);
  });
  it('does NOT rewrite when slug is not allowed', () => {
    const html = '<blockquote><p><strong>Note</strong>: Keep.</p></blockquote>';
    const out = preprocessHtml(html, { slug: 'editing-tests/steps', calloutAllowSlugs: CALLOUT_NORMALIZATION_SLUGS });
    assert.match(out, /<blockquote>/);
  });
  it('does NOT rewrite long (>3 paragraph) blockquote', () => {
    const html = '<blockquote><p>a</p><p>b</p><p>c</p><p>d</p></blockquote>';
    const out = preprocessHtml(html, { slug: 'administration/api-access', calloutAllowSlugs: CALLOUT_NORMALIZATION_SLUGS });
    assert.match(out, /<blockquote>/);
  });
  it('does NOT rewrite blockquote without warning-like leading token', () => {
    const html = '<blockquote><p>This is a quotation.</p></blockquote>';
    const out = preprocessHtml(html, { slug: 'administration/api-access', calloutAllowSlugs: CALLOUT_NORMALIZATION_SLUGS });
    assert.match(out, /<blockquote>/);
  });
});

describe('extractSegmentsFromHtml emits callout-body after normalization', () => {
  it('emits segmentKind=callout-body for allowed slug + warning-like short blockquote', () => {
    const html = '<h2>Heading</h2><blockquote><p><strong>Warning</strong>: drop zone</p></blockquote>';
    const segments = extractSegmentsFromHtml(html, { slug: 'administration/api-access', calloutAllowSlugs: CALLOUT_NORMALIZATION_SLUGS });
    const kinds = segments.map(s => s.segmentKind);
    assert.ok(kinds.includes('callout-body'));
  });
  it('legacy 1-arg call still works (backward compat, no normalization)', () => {
    const html = '<blockquote><p>Quote</p></blockquote>';
    const segments = extractSegmentsFromHtml(html);
    // 既存 test (L153 等) の kind 前提が壊れないこと
    assert.ok(Array.isArray(segments));
  });
});
```

Run: FAIL (signature 拡張未実装)。

- [ ] **Step 4: `preprocessHtml` + `extractSegmentsFromHtml` を options 対応化 + caller 更新 (GREEN)**

実装方針:
1. `source_parity_segments_en.mjs` に `CALLOUT_NORMALIZATION_SLUGS` 定数を export (single source of truth):
   ```js
   export const CALLOUT_NORMALIZATION_SLUGS = Object.freeze(new Set([
     'administration/api-access',
     // Task 4.1 inventory 追加分
   ]));
   ```
2. `preprocessHtml(html, options = {})` に `{ slug, calloutAllowSlugs }` を受け取るよう signature 拡張。options なしは既存挙動 (normalize 無し) を維持。
3. `extractSegmentsFromHtml(html, options = {})` も同様に options を受け、内部で `preprocessHtml(html, options)` を呼ぶ。options なしは既存挙動を維持 (後方互換)。
4. allow list に含まれる slug のみで `<blockquote>...</blockquote>` を検出 (既存 parser に沿って簡潔な regex / HTML walker、既存スタイルに合わせる)。
5. warning-like 判定: blockquote 内の最初の段落テキストが `(Note|Warning|Important|Caution|Tip|Danger)` (case-insensitive、前後に `<strong>` / `<b>` / `:` を許容) で始まる。
6. 短長制約: `<p>` 個数 ≤ 3。
7. 該当 blockquote を `<div class="callout-note">...content...</div>` にリライト (中身の HTML はそのまま)。既存の callout 変換ロジック (既にある `<div class="caution">` 等の扱い) に揃える。
8. `check_source_parity.mjs:453` 付近の `extractSegmentsFromHtml(html)` 呼び出しを `extractSegmentsFromHtml(html, { slug, calloutAllowSlugs: CALLOUT_NORMALIZATION_SLUGS })` に書き換える。

既存 `source_parity_segments_en.test.mjs` (約 260 行以降の `callout-body` 前提の test) は options なし呼び出しで通ることを確認する。

Run: PASS。

- [ ] **Step 5: `check:parity` で api-access を実機確認**

```bash
npm run check:snapshots:fetch -- --slug=administration/api-access
npm run check:parity -- --slug=administration/api-access 2>&1 | tail -30
```

Expected: blockquote 起因の kind-level mismatch が消滅。残 issue があれば Task 4.5 で JA 側 `:::danger` → `:::note` 調整 (または allow list 再設計)。

- [ ] **Step 6: commit**

```bash
git add scripts/lib/source_parity_segments_en.mjs \
        scripts/check_source_parity.mjs \
        scripts/__tests__/source_parity_segments_en.test.mjs \
        docs/superpowers/specs/2026-04-14-parity-phase4-final-goal.md
git commit -m "feat: preprocessHtml で EN blockquote→callout-note を slug 限定で正規化 (caller 更新含む)"
```

---

## Task 4.5: 残 baseline を全解消 (entries = 0 / advisory = 0)

**Files:**
- Modify: `parity-baseline.json`
- Modify: 対象 slug の `src/content/docs/**/*.md`
- Modify: 必要に応じ `scripts/lib/parity_artifact_registry.mjs` (entry 追加) / `scripts/lib/parity_normalize.mjs` / `scripts/lib/source_parity_segments_en.mjs` (narrow 修正) / `scripts/lib/source_parity_align.mjs` (narrow alignment 修正)

- [ ] **Step 1: baseline 再生成 (v1 のまま)**

```bash
node scripts/generate_parity_baseline.mjs --regenerate
```

Expected: exit 0。

- [ ] **Step 2: 各残 entry を 1 件ずつ処理 (判定フロー)**

1. 翻訳で直せる → md 修正 → slug 単位 commit
2. EN artifact 追加 → registry に slug-scope 登録 → commit
3. URL normalizer で直せる → normalizer narrow 修正 → commit
4. HTML extractor 正規化候補 → allow list / 変換条件 narrow 修正 → commit
5. alignment 誤判定 → align narrow 修正 (広範は別 PR 推奨) → commit
6. segment-inconclusive で自動限界 → JA wording / section 境界調整 → md 修正 → commit
7. 上記で解けない case が残れば plan 停止、user に scope 相談

- [ ] **Step 3: 途中で baseline 再生成 → 0 を確認**

```bash
node scripts/generate_parity_baseline.mjs --regenerate
node -e "
const b = require('./parity-baseline.json');
if (b.entries.length !== 0) {
  console.error('entries:', b.entries.length);
  console.error(b.entries.map(e => e.slug + '|' + e.issueType).slice(0,50).join('\n'));
  process.exit(1);
}
console.log('baseline entries = 0');
"
```

Expected: exit 0。

- [ ] **Step 4: runtime counters 0 を確認**

```bash
npm run check:parity 2>&1 | tail -20
node -e "
const s = require('./parity-check-status.json');
const z = s.summary;
const ok = z.reportableActiveFiles===0 && z.baselinedIssues===0 && z.advisoryQueueIssues===0 && z.auditSignalIssues===0;
if (!ok) { console.error('not zero', z); process.exit(1); }
console.log('runtime counters all 0');
"
```

Expected: exit 0。

- [ ] **Step 5: commit 最終 baseline (v1 最終状態 entries=0)**

```bash
git add parity-baseline.json
git commit -m "chore: Phase 4 baseline を entries=0 まで解消 (v1 最終)"
```

---

## Task 4.6: schema v1 → v2 atomic cutover

### Task 4.6.1: 型 + loader + BASELINE_ELIGIBLE_TYPES 縮約 + empty baseline default v2 化

**Files:**
- Modify: `scripts/lib/source_parity_types.mjs`
- Modify: `scripts/lib/source_parity_baseline.mjs`
- Modify: `scripts/check_source_parity.mjs:300-302, 342` (`loadBaselineFileSafe()` empty return / `baselineData` 初期値)
- Modify: `scripts/__tests__/source_parity_baseline.test.mjs`
- Modify: `scripts/__tests__/source_parity_baseline_recall.test.mjs` (`segment-inconclusive` / `inconclusiveReason` / `reviewAfter` 前提を v2 契約に更新 — baseline 対象外の issueType を baseline match させていた assertion を削除 or type を v2 eligible に差し替え)
- Modify: `scripts/__tests__/check_source_parity.test.mjs` (empty baseline default が v2 であることを public behavior 経由で assertion 追加 — `loadBaselineFileSafe` は private helper のまま維持)

- [ ] **Step 1: types**

```js
// scripts/lib/source_parity_types.mjs
export const PRIORITY_VALUES = Object.freeze(['high', 'medium', 'low']);
// BaselineEntry 型から reviewAfter / inconclusiveReason / inconclusiveCategory /
// usabilityReason を除去 (eligible types 縮約に合わせる)。priority / note 追加
```

- [ ] **Step 2: BASELINE_ELIGIBLE_TYPES / TYPES_ARG_ALLOWLIST 縮約**

```js
// scripts/lib/source_parity_baseline.mjs L36-48 置換
export const BASELINE_ELIGIBLE_TYPES = Object.freeze(new Set([
  'segment-missing','segment-extra','segment-shifted',
  'segment-untranslated','segment-token-gap',
  'section-structure-mismatch','segment-order-mismatch',
]));
// L65-72 置換
export const TYPES_ARG_ALLOWLIST = Object.freeze(new Set([
  'section-structure-mismatch','segment-order-mismatch',
]));
```

- [ ] **Step 3: validator / expiry / tag 撤去**

- `schemaVersion` 受理は v2 のみ
- `reviewAfter` 検証 (L269-282) 削除
- `inconclusiveReason` / `inconclusiveCategory` / `usabilityReason` entry 検証は型集合縮約に伴い不要分岐削除
- `isBaselineExpired` / `isBaselineExpiringSoon` (L405-440) 関数削除
- `buildBaselineKey` / `buildBaselineKeyFromEntry` の `segment-inconclusive` / `source-unusable` / `snapshot-incomplete` 分岐削除
- `tagIssuesWithBaseline` (L560) の `baselineReviewAfter` / `baselineExpired` 付与削除
- priority enum (`PRIORITY_VALUES`) 検証追加
- note (max 500 chars, optional) 検証追加

- [ ] **Step 4: baseline test を v2 に**

- 全 fixture に priority='medium' 追加、reviewAfter / inconclusiveReason / inconclusiveCategory / usabilityReason を除去
- `it('rejects segment-inconclusive / snapshot-incomplete / source-unusable as baseline entry', ...)` を追加
- schemaVersion=1 を reject する test を追加
- priority / note invalid 系 test を追加

Run: loader test のみ pass する想定。

- [ ] **Step 5: empty baseline default を v2 化 + `debug.baselineSchemaVersion` を status に露出**

```js
// scripts/check_source_parity.mjs:300-302 差し替え
function loadBaselineFileSafe(filePath = BASELINE_PATH) {
  if (!fs.existsSync(filePath)) {
    return { schemaVersion: 2, entries: [] }; // v2 へ
  }
  return loadBaselineFile(filePath);
}

// scripts/check_source_parity.mjs:342 差し替え
let baselineData = { schemaVersion: 2, entries: [] }; // v2 へ

// status payload 組み立て箇所 (L727 付近) に追加
status.debug = {
  ...status.debug,
  baselineSchemaVersion: baselineData.schemaVersion,
};
```

`ackData` の `{ schemaVersion: 1, entries: [] }` (L329) は acknowledgements 側の schema なので **不触** (範囲外)。

`loadBaselineFileSafe()` は private helper のまま維持 (export しない)。`checkSourceParity()` の戻り値は status 本体ではなく exit code で、status 内容は `outputPath` に JSON で書き出される (`scripts/check_source_parity.mjs:307` 前提)。v2 empty default の検証は以下の 2 段階で行う:

**実装側 (check_source_parity.mjs):** status payload に `debug.baselineSchemaVersion = baselineData.schemaVersion` を追加する。既存の `debug` 枠 (artifactCoverage と同じ) に載せる小さな追加で、public API 拡張は最小限。

**test:**

```js
// scripts/__tests__/check_source_parity.test.mjs (追記)
import { writeFileSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

it('uses v2 empty baseline default when baseline file is missing', async () => {
  const tmpDir = mkdtempSync(join(tmpdir(), 'parity-v2-empty-'));
  const tmpPath = join(tmpDir, 'parity-check-status.json');
  await checkSourceParity({
    baselinePath: '/nonexistent/path.json',
    outputPath: tmpPath,
    json: true,
  });
  const payload = JSON.parse(readFileSync(tmpPath, 'utf8'));
  assert.equal(payload.debug?.baselineSchemaVersion, 2);
});
```

- [ ] **Step 6: commit**

```bash
git add scripts/lib/source_parity_types.mjs \
        scripts/lib/source_parity_baseline.mjs \
        scripts/check_source_parity.mjs \
        scripts/__tests__/source_parity_baseline.test.mjs \
        scripts/__tests__/source_parity_baseline_recall.test.mjs \
        scripts/__tests__/check_source_parity.test.mjs
git commit -m "refactor: baseline v2 loader + BASELINE_ELIGIBLE_TYPES 縮約 + empty baseline default v2 化 / baseline_recall を v2 契約に更新"
```

### Task 4.6.2: generator v2 化 + migration script + 既存 generator test の全面更新

**Files:**
- Modify: `scripts/generate_parity_baseline.mjs:184-225, 262-282, 308, 500-533`
- Modify: `scripts/__tests__/generate_parity_baseline.test.mjs` (1014 行、41 箇所の `reviewAfter` / 6 箇所の `segment-inconclusive` / 4 箇所の `schemaVersion` 参照を v2 契約に更新)
- Create: `scripts/phase4/migrate_baseline_schema.mjs`
- Create: `scripts/__tests__/baseline_schema_migration.test.mjs`

**generator test 更新チェックリスト (Finding 1):**
- [ ] `defaultReviewAfter` / `reviewAfterOverride` を使う assertion を削除 (または `--review-after` option 廃止に合わせて "該当 option が reject される" negative test に置換)
- [ ] `segment-inconclusive` / `snapshot-incomplete` / `source-unusable` を baseline entry に含める assertion を削除 + "これらの type は generator が skip する" positive test を追加
- [ ] root `schemaVersion: 2` を前提に書き換え
- [ ] fixture entry に `priority: 'medium'` default が付与されることを assert
- [ ] `--review-after` CLI arg が usage で削除 / reject されることを assert
- [ ] `TYPES_ARG_ALLOWLIST` の縮約 (2 種のみ) が generator 側でも尊重されることを assert

- [ ] **Step 1: generator v2 化**

- root `schemaVersion: 2`
- staggered `reviewAfter` 生成削除
- `inconclusiveReason` / `inconclusiveCategory` / `usabilityReason` emission 削除
- 除外 issueType (segment-inconclusive / snapshot-incomplete / source-unusable) の entry 生成 skip
- `priority: 'medium'` default
- `--review-after` option 削除、usage 文面更新 (`scripts/generate_parity_baseline.mjs:518-532`)

- [ ] **Step 2: migration 関数 + test**

```js
// scripts/phase4/migrate_baseline_schema.mjs
const DROP_FIELDS = new Set(['reviewAfter','inconclusiveReason','inconclusiveCategory','usabilityReason']);
const DROP_ISSUE_TYPES = new Set(['segment-inconclusive','snapshot-incomplete','source-unusable']);

export function migrateEntry(old) {
  if (DROP_ISSUE_TYPES.has(old.issueType)) return null;
  const out = {};
  for (const [k, v] of Object.entries(old)) if (!DROP_FIELDS.has(k)) out[k] = v;
  if (!out.priority) out.priority = 'medium';
  return out;
}
export function migrateBaseline(b) {
  return {
    ...b,
    schemaVersion: 2,
    generatedAt: new Date().toISOString(),
    rationale: `${b.rationale ?? ''} / Phase 4 v2`.trim(),
    entries: b.entries.map(migrateEntry).filter(e => e !== null),
  };
}
```

test (baseline_schema_migration.test.mjs): DROP 4 fields / drop 3 issueTypes / default priority / existing priority 保持。

Run: PASS。

- [ ] **Step 3: baseline を v2 で再生成**

```bash
node scripts/generate_parity_baseline.mjs --regenerate
node --test scripts/__tests__/source_parity_baseline.test.mjs
```

Expected: schemaVersion=2、entries=0、validator 通過。

- [ ] **Step 4: commit**

```bash
git add scripts/generate_parity_baseline.mjs \
        scripts/__tests__/generate_parity_baseline.test.mjs \
        scripts/phase4/migrate_baseline_schema.mjs \
        scripts/__tests__/baseline_schema_migration.test.mjs \
        parity-baseline.json
git commit -m "refactor: generate_parity_baseline を v2 出力化 / 既存 generator test を v2 契約に更新 / migration 関数を export"
```

### Task 4.6.3: advisory / summary / check / issue_state / detection_reports / status の v2 対応 (blast radius 対処)

**Files (ownership expanded):**
- Modify: `scripts/lib/source_parity_advisory_queue.mjs:104-128`
- Modify: `scripts/lib/source_parity_summary.mjs`
- Modify: `scripts/check_source_parity.mjs`
- Modify: `scripts/lib/source_parity_issue_state.mjs`
- Modify: `scripts/lib/detection_reports.mjs`
- Modify: `scripts/__tests__/source_parity_advisory_queue.test.mjs`
- Modify: `scripts/__tests__/source_parity_summary_format.test.mjs` (`baselineExpired` / `baselineExpiringSoon` 集計を参照する assertion があれば v2 契約に合わせて削除 / 書き換え。`priorityCounts` 追加分の assertion を追記)
- Modify: `scripts/__tests__/source_parity_issue_state.test.mjs`
- Modify: `scripts/__tests__/source_parity.test.mjs`
- Modify: `scripts/__tests__/check_source_parity.test.mjs`
- Modify: `scripts/__tests__/detection_reports.test.mjs`
- Modify: `scripts/__tests__/source_parity_acknowledgements.test.mjs` (`baselineExpired` 参照箇所を削除)

- [ ] **Step 1: `isFrozenByBaseline` 縮約 (`issue_state.mjs`)**

```js
// scripts/lib/source_parity_issue_state.mjs
export function isFrozenByBaseline(issue) {
  return issue.baselined === true;
}
// baselineExpired / reviewAfter を読んでいた分岐を全削除
```

対応 test (`source_parity_issue_state.test.mjs`) も v2 契約に書き換え:
- baselined=true で freeze、baselined=false で freeze しない
- 旧 `baselineExpired=true` によって freeze 解除されていた test は「v2 ではその概念がない」と明記して削除

- [ ] **Step 2: advisory queue field 整理 (option A)**

`source_parity_advisory_queue.mjs:104-128`:
- 削除: `baselineReviewAfter`, `baselineExpired`
- 維持: `inconclusiveCategory`, `inconclusiveReason` (runtime issue 直読み)
- 維持: `baselined`, `acknowledged`, `ackExpired` (他機能の context)

test 更新: 旧 field 参照を除去、runtime `inconclusiveReason` が entry に残る正常系 assertion。

- [ ] **Step 3: summary v2 化**

- 旧 `baselineExpired` / `baselineExpiringSoon` counter 削除
- `priorityCounts` 追加 (baselined 内訳)
- `advisoryQueueIssues` / `auditSignalIssues` / `reportableActiveFiles` / `baselinedIssues` field は維持 (DoD 測定用)

対応 test 更新。

- [ ] **Step 4: check_source_parity v2 対応 + artifactCoverage 出力**

- `baselineReviewAfter` / `baselineExpired` tagging 削除
- `alignSegments` 呼出に `{ slug, coverage }` (Task 4.2 Step 6 で反映済みなら確認のみ)
- status 書出し前に `status.debug.artifactCoverage = coverage.snapshot()` (Task 4.2 Step 6 で反映済みなら確認のみ)
- console 出力で `baselineReviewAfter` / `baselineExpired` 参照があれば削除

対応 test (`check_source_parity.test.mjs`) 更新。

- [ ] **Step 5: detection_reports v2 対応**

- `reviewAfter` / `baselineExpired` 参照を全削除
- v2 schema で想定される report 項目に整理

対応 test (`detection_reports.test.mjs`) 更新。

- [ ] **Step 6: source_parity.test.mjs / source_parity_acknowledgements.test.mjs の残留参照解消**

- `baselineExpired` / `baselineReviewAfter` / `reviewAfter` 参照があれば v2 契約に合わせ削除 or 書き換え

- [ ] **Step 7: 全 test 通す**

```bash
npm run test 2>&1 | tail -50
```

Expected: all green。

- [ ] **Step 8: commit**

```bash
git add scripts/lib/source_parity_advisory_queue.mjs \
        scripts/lib/source_parity_summary.mjs \
        scripts/lib/source_parity_issue_state.mjs \
        scripts/lib/detection_reports.mjs \
        scripts/check_source_parity.mjs \
        scripts/__tests__/source_parity_advisory_queue.test.mjs \
        scripts/__tests__/source_parity_summary_format.test.mjs \
        scripts/__tests__/source_parity_issue_state.test.mjs \
        scripts/__tests__/source_parity.test.mjs \
        scripts/__tests__/check_source_parity.test.mjs \
        scripts/__tests__/detection_reports.test.mjs \
        scripts/__tests__/source_parity_acknowledgements.test.mjs
git commit -m "refactor: advisory/summary/issue_state/detection_reports/check を v2 に (baselineExpired 撤去 / isFrozenByBaseline 縮約)"
```

---

## Task 4.7: 運用ドキュメント最終化

**Files:**
- Modify: `docs/OPS_DESIGN.md`
- Modify: `docs/PARITY_GUIDE.md`
- Modify: `docs/WRITING_GUIDE.md`
- Modify: `scripts/README.md`
- Modify: `docs/superpowers/plans/2026-04-14-parity-phase4-schema-cleanup.md`

- [ ] **Step 1: OPS_DESIGN.md**

- `reviewAfter` 期日管理を全削除、priority burn-down に置換
- baseline = JA-actionable、Phase 4 終了時点で 0
- 新規 issue 発生フロー: 翻訳 / registry / normalizer / extractor / alignment / source lock
- CI gate: status JSON の 4 counter + baseline entries + snapshot diff で機械判定

- [ ] **Step 2: PARITY_GUIDE.md**

- residual 3 分類 (actionable-baseline / parity-artifact-registry / advisory-residual) 正式記載
- artifact registry 登録手順 (slug-scope のみ, global 禁止)
- `debug.artifactCoverage` の読み方
- `debug.maskCoverage` と `debug.artifactCoverage` の責務分離

- [ ] **Step 3: WRITING_GUIDE.md**

- source-first 契約再確認
- EN artifact は JA 側で模倣しない (checker 吸収)
- callout-normalization-slugs の truth source は `scripts/lib/source_parity_segments_en.mjs` の `CALLOUT_NORMALIZATION_SLUGS` 定数 (final-goal.md は仕組み説明のみ)

- [ ] **Step 4: scripts/README.md**

- `reviewAfter` / `--review-after` option 関連記述を削除
- v2 schema (priority / note) と新規 artifact registry / coverage の説明を追加
- `generate_parity_baseline.mjs` の最新 usage (`--regenerate` / `--slug` / `--types`)

- [ ] **Step 5: Phase 4 plan ファイルを本 plan で置換**

`docs/superpowers/plans/2026-04-14-parity-phase4-schema-cleanup.md` を本 plan (Rev 6) 内容で上書き。

- [ ] **Step 6: commit**

```bash
git add docs/OPS_DESIGN.md docs/PARITY_GUIDE.md docs/WRITING_GUIDE.md \
        scripts/README.md \
        docs/superpowers/plans/2026-04-14-parity-phase4-schema-cleanup.md
git commit -m "docs: Phase 4 完了後の定常運用 (5 counter 0 / artifact registry / README 更新)"
```

---

## Task 4.8: 最終 E2E (JSON assertion) → report → push → PR

**Files:**
- Create: `docs/superpowers/specs/2026-04-14-parity-phase4-report.md`

- [ ] **Step 1: snapshot fresh fetch + diff 0 確認**

```bash
npm run check:snapshots:fetch
npm run check:snapshots:diff 2>&1 | tail -20
node -e "
const d = require('./snapshot-diff-status.json');
const s = d.summary ?? {};
const ok = s.changed === 0 && s.added === 0 && s.removed === 0;
if (!ok) { console.error('snapshot diff not zero', s); process.exit(1); }
console.log('snapshot diff: changed/added/removed = 0');
"
```

- [ ] **Step 2: parity + baseline + counters + artifactCoverage**

```bash
npm run test && npm run lint && npm run build
npm run check:parity 2>&1 | tail -20
node -e "
const b = require('./parity-baseline.json');
if (b.entries.length !== 0) { console.error('baseline not empty', b.entries.length); process.exit(1); }
if (b.schemaVersion !== 2) { console.error('schema not v2', b.schemaVersion); process.exit(1); }
const s = require('./parity-check-status.json');
const z = s.summary ?? {};
const ok = z.reportableActiveFiles===0 && z.baselinedIssues===0 && z.advisoryQueueIssues===0 && z.auditSignalIssues===0;
if (!ok) { console.error('status counters not zero', z); process.exit(1); }
const ac = s.debug?.artifactCoverage;
if (!ac || typeof ac.registryEntries !== 'number' || typeof ac.matchedHits !== 'number' || typeof ac.bySlug !== 'object' || typeof ac.byToken !== 'object') {
  console.error('artifactCoverage shape invalid', ac);
  process.exit(1);
}
console.log('baseline=0, summary counters=0, schemaVersion=2, artifactCoverage shape OK');
"
```

- [ ] **Step 3: alignSegments の 2 引数残存の最終確認**

```bash
LEAK=$(grep -rn "alignSegments\s*(" scripts/ \
  | grep -v "^Binary" \
  | grep -vE "\{\s*slug" \
  | grep -v "function alignSegments" \
  | grep -v "// ")
if [ -n "$LEAK" ]; then echo "leak:\n$LEAK"; exit 1; fi
echo "alignSegments call sites: all migrated"
```

- [ ] **Step 4: deprecated field の scope 限定 grep**

```bash
grep -nr "reviewAfter\|baselineReviewAfter\|baselineExpired" \
  scripts/lib scripts/check_source_parity.mjs \
  docs/OPS_DESIGN.md docs/PARITY_GUIDE.md scripts/README.md \
  | grep -v "^Binary" \
  || echo "clean"
```

Expected: `clean` または historical comment のみ (該当行は手動レビューで説明付与)。

- [ ] **Step 5: 最終 report 作成**

```markdown
# Parity Phase 4 — Final Cutover Report

## 完了条件 (all true)
- parity-baseline.json.entries.length = 0
- parity-baseline.json.schemaVersion = 2
- parity-check-status.summary.{reportableActiveFiles, baselinedIssues, advisoryQueueIssues, auditSignalIssues} = 0
- parity-check-status.debug.artifactCoverage = { registryEntries, matchedHits, bySlug, byToken }
- snapshot-diff-status.summary.{changed, added, removed} = 0

## 削減結果
(表)

## Schema migration
- v1 → v2
- 削除 (entry): reviewAfter / inconclusiveReason / inconclusiveCategory / usabilityReason
- 削除 (tagging / queue): baselineReviewAfter / baselineExpired
- 追加 (entry): priority / note
- 追加 (status): debug.artifactCoverage
- BASELINE_ELIGIBLE_TYPES = JA-actionable 7 種
- isFrozenByBaseline(issue) ≡ issue.baselined === true

## Checker simplification
- parity_normalize: help.testim.io ↔ /docs URL fragment 対称化
- parity_artifact_registry: slug-scope token + runtime coverage aggregator
- preprocessHtml: slug allow list 限定 <blockquote>→<div class="callout-note"> (turndown 非侵襲)
- alignSegments({slug, coverage}) 化 + 全呼出移行

## 定常運用
- CI gate: status / snapshot / baseline JSON で 機械判定
- 新規 issue フロー: 翻訳 / registry / normalizer / extractor / alignment / source lock
```

- [ ] **Step 6: commit report (PR 作成より前)**

```bash
git add docs/superpowers/specs/2026-04-14-parity-phase4-report.md
git commit -m "docs: Phase 4 最終 report"
```

- [ ] **Step 7: push**

```bash
git push -u origin worktree-noble-squishing-bee
```

- [ ] **Step 8: PR 作成**

```bash
gh pr create --title "refactor: Phase 4 final cutover (baseline=0 / schema v2 / artifact registry + coverage)" --body "$(cat <<'EOF'
## Summary

Parity burn-down の最終 cutover。5 counter (baseline.entries, baselinedIssues, advisoryQueueIssues, auditSignalIssues, snapshot-diff) をすべて 0 に落とし、schema を v2 に移行。

- Task 4.0: DoD を 5 counter 0 に再定義、final-goal.md / debug.artifactCoverage 契約
- Task 4.1: 5-bucket 残件 inventory (actionable / artifactCandidates / normalizerCandidates / intentionalDivergenceCandidates / advisoryResidual)
- Task 4.2: parity_artifact_registry + createArtifactCoverage + alignSegments({slug,coverage}) へ全呼出移行
- Task 4.3: URL normalizer 対称化
- Task 4.4: preprocessHtml で EN blockquote→callout-note を slug 限定正規化 (turndown 非侵襲)
- Task 4.5: 残 baseline 全解消 (entries=0)
- Task 4.6: schema v1→v2 atomic cutover (types/loader/generator/advisory/summary/issue_state/detection_reports/check/status/migration/tests)
- Task 4.7: OPS / PARITY / WRITING / Phase 4 plan / scripts/README 更新
- Task 4.8: JSON assertion + alignSegments 呼出 leak 検証

## Final state
(前述 Final state 参照)

## 参考
- Roadmap / Final-goal / Residual inventory / Final report へのリンク
EOF
)"
```

---

## Verification Summary

Task 4.8 の各 Step が機械的に確認する条件の一覧:

1. `npm run test && npm run lint && npm run build` green
2. `snapshot-diff-status.summary.{changed, added, removed} = 0`
3. `parity-baseline.json.entries.length = 0 && schemaVersion = 2`
4. `parity-check-status.summary.{reportableActiveFiles, baselinedIssues, advisoryQueueIssues, auditSignalIssues} = 0`
5. `parity-check-status.debug.artifactCoverage` が shape OK
6. `alignSegments(` 呼出のうち `{ slug` を含まないものが 0 件 (定義行・コメント除く)
7. `reviewAfter` / `baselineReviewAfter` / `baselineExpired` が scope (`scripts/lib`, `scripts/check_source_parity.mjs`, `docs/OPS_DESIGN.md`, `docs/PARITY_GUIDE.md`, `scripts/README.md`) で 0 件

---

## 実行順序サマリ

```
Task 4.0  DoD 再定義 + final-goal.md                 (docs)
Task 4.1  residual inventory (5-bucket JSON + md)    (script)
Task 4.2  parity_artifact_registry + coverage +
          alignSegments({slug,coverage}) 全呼出移行  (runtime + 7 tests)
Task 4.3  URL normalizer 対称化                      (runtime + test)
Task 4.4  preprocessHtml で callout 限定正規化       (runtime + test)
Task 4.5  残 baseline entries=0 まで解消             (md / registry / narrow 修正)
Task 4.6  schema v2 atomic cutover
  4.6.1 types / loader / BASELINE_ELIGIBLE_TYPES
  4.6.2 generator + migration + test
  4.6.3 advisory / summary / issue_state / detection_reports / check / status / tests
Task 4.7  docs final (OPS / PARITY / WRITING / README / Phase 4 plan)
Task 4.8  JSON assertion → alignSegments leak check → deprecated grep → report → push → PR
```
