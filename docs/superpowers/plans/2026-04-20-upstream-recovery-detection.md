# Upstream Recovery Detection & Registry Lifecycle Management (Revision 4)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans。Steps use checkbox (`- [ ]`)。新規 worktree 推奨。本 plan は **2 phase 分割**で実行:
> - **Phase A** (worktree `claude/upstream-recovery-phase-a`): Task 1 / 2 / 6 — PR Z と並列実行可
> - **Phase B** (worktree `claude/upstream-recovery-phase-b`): Task 4 / 5 + sticky comment — **PR Z merge 後**実施必須

> **大前提 (preserved across all revisions):** M2.5 で達成した **baseline=0 / audit-signal=0 / inconclusive=0** を何があっても regression させない。本 plan の Phase A / Phase B いずれも既存 parity gate の挙動を変更しない (新 field 追加のみ、既存 summary 計算には触れない)。

> **Rev 4 (2026-04-20 深夜):** 第三者 + Codex 2nd pass レビューで判明した 10 findings (R1-R10) を反映し、Phase 分割 で実装制約を明示化した。主要変更:
> - **R4 対応**: `scripts/lib/detection_reports.mjs` が PR Z Task 4.6.3 の変更対象であることを確認 (`docs/superpowers/plans/2026-04-14-parity-phase4-schema-cleanup.md:1276` 参照)。detection_reports 統合 Task (旧 Task 4) を **Phase B (post-PR Z)** に分離。
> - **R1/R2 対応 — Task 3 廃止**: PR comment 実装が schema mismatch (`e.status` vs `statusA`) + firing condition 不整合 (non-blocking exit なので outcome=='failure' 不発火)。**Task 3 全体を廃止し、Phase B の sticky-comment 1 実装に統合**。
> - **R3 対応**: Phase B に `loadDetectionInputs()` / `generateDetectionReports()` 配管 step を明示追加。
> - **R5/R6 対応**: Architecture / 変更対象外 / DoD / Task 配管の内部矛盾を整理。旧 workflow 参照を全削除。
> - **R7 対応**: `PARITY_GUIDE.md` / `OPS_DESIGN.md` 更新を **Phase B** (post-PR Z) に明示。
> - **R8 対応**: 残存していた旧 patch count ("26 unique slugs") を全削除、34 IDs / 42 bindings / 34 slugs に統一。
> - **R9 対応**: `source-sync-status.json` 不在時の graceful degradation を明示 (local test では `statusA: 'unknown'`、DoD は CI artifact 下のみで評価)。
> - **R10 対応**: Background の旧記述削除。

> **Rev 3 / 2 / 1**: [履歴 — Revision History §参照]

**Goal:** EN upstream 欠陥を許容する 2 registry (`source_sync_exclusions.mjs` / `en_source_patches.mjs`) に対して、**(A) upstream 修正の自動検知** と **(B) 登録解除忘れの persistent reminder** を、**既存 infrastructure の拡張として**整備する。registry が上流修正後に stale 化したまま放置されるリスクを排除する。

**Architecture:** 本 plan は既存信号の **integration + expansion** のみ。新 workflow / 新 issue family / 新 CI job は追加しない。

既存 Axis B (`check_patch_review_cadence.mjs:53-77` が `check_source_parity.mjs:376` から毎 run `console.warn` 出力) を `SOURCE_SYNC_EXCLUSIONS` にも広げ、両 registry の `reviewAfter` overdue を同じ channel で扱う。Axis A for en_patches (現 `TARGET_SLUG_SNAPSHOTS` 8/34 slugs カバー) を **全 34 patch IDs へ拡張 (slug-driven loop)**。

`upstream-recovery-status.json` は両 registry の既存信号 (`reviewAfter` / `fetchStatus: 'excluded-recovered'` / `patch.find` 不在) を集約した **derived view**。ゼロからの status computation ではない。将来 Pattern D (unified debt catalog) への bridge として設計。

**Tech Stack:** Node.js 20, node:test, GitHub Actions (既存 `scheduled-actionable.yml` 活用)。新 workflow 追加なし。

---

## Background

### 現状 (2026-04-20 M2.5 merge 完了時点)

- **`source_sync_exclusions.mjs`** — page-level freeze registry。登録 1 slug (`testops/testops-version-control/pull-requests`)。EN-only recovery probe が実装済で `fetchStatus: 'excluded-recovered'` を `source-sync-status.json` に出力する。ただし **surfacing は quiet** — 人手で JSON を読まないと気付けない。
- **`en_source_patches.mjs`** — segment-level patch registry。登録 34 patch IDs / 42 patch-to-slug bindings / 34 unique slugs (UD-001〜UD-022)。`patchCoverage` aggregator は runtime で実装済だが、**test coverage は TARGET_SLUG_SNAPSHOTS の 8 unique slugs 限定**。残 26 slugs の patch は stale 化しても検知されない。

### 問題 (R10 対応で Rev 4 再整理)

1. **Axis A for en_patches の test coverage gap**: `en_source_patches_integration.test.mjs` は `TARGET_SLUG_SNAPSHOTS` 8 unique slugs のみ。残 26 unique slugs の patch は `find` 不在になっても test fail しない。
2. **Axis B for source_sync_exclusions の不在**: `SOURCE_SYNC_EXCLUSIONS` entry は `addedAt` のみで `reviewAfter` field が無い。`check_patch_review_cadence.mjs` の cadence warn 対象外 (en_patches 側は既に対象)。
3. **surfacing の分散**: 既存信号 (`check_patch_review_cadence` stderr warning / `source-sync-status.json.fetchStatus` / `sourceSyncHealth` managed issue) が entry 種別によって異なる channel に出る。運用者が横断確認できる unified view が無い。
4. **lifecycle ドキュメント不足**: entry の "追加 → 監視 → 上流修正 → 削除" フローが docs に明文化されていない。

### 設計原則

- **2-mechanism (ONE purpose, two granularities)** を維持: broken-EN retreat という目的は 1 つだが、page-level (sync_exclusions) / segment-level (en_patches) の粒度分割は正当化される (`docs/PARITY_GUIDE.md §PR-merge-gate-matrix §2` で既に正式化)
- **非 blocking**: 未関連 PR を stale entry の放置で blocking しない。代わりに可視化と periodic reminder で圧力をかける
- **既存 infra 流用**: `createEnSourcePatchCoverage()` / `source-sync-status.json` を拡張、新 framework 禁止
- **単調性維持**: 本 plan は既存 DoD counter (baseline=0 etc.) を regression させない

---

## 最終 DoD (Phase 分割 / Rev 4)

### 大前提 (全 phase 共通 / 不変)

- `parity-baseline.json.entries.length === 0` (M2.5-C で達成、regression 禁止)
- `parity-check-status.summary.{reportableActiveFiles, baselinedIssues, advisoryQueueIssues, auditSignalIssues} === 0` (全て 0、regression 禁止)
- `parity-check-status.summary.baselinedByInconclusiveCategory === {}` (heading-count 0、regression 禁止)
- 本 plan による runtime / test 変更は、上記 counter の計算ロジックを **読み取らない / 変更しない**

### Phase A DoD (PR Z 並列可)

機械判定:
```
# upstream-recovery-status.json が本 plan のみで生成可能になる
exists('upstream-recovery-status.json') === true (`npm run check:upstream-recovery` 実行後)
schema is {schemaVersion: 1, summary: {...}, mechanisms: {en_source_patches: [...], source_sync_exclusions: [...]}}

# source_sync_exclusions cadence parity
every SOURCE_SYNC_EXCLUSIONS entry has valid reviewAfter: 'YYYY-MM-DD'

# en_source_patches test coverage
en_source_patches_integration.test.mjs が全 34 patch IDs を網羅 (slug-driven loop、8 → 34 拡張)

# CLI
package.json に "check:upstream-recovery" script 登録済
local 実行で JSON 生成 + stdout に active/stale 件数 log

# Graceful degradation (R9)
source-sync-status.json 不在時、sync_exclusions entries は statusA: 'unknown' で出力
(local 開発 / PR CI では unknown が通常、DoD の unknownEntries 評価は CI artifact 下のみ)
```

非機械判定:
- Phase A 完了後、Phase B 着手前に以下が確認できる:
  - `upstream-recovery-status.json` の mechanisms.en_source_patches[i].statusA が全 34 patches について active 判定 (定常状態)
  - source_sync_exclusions entries (現 1 件) に reviewAfter field 存在

### Phase B DoD (PR Z merge 後実施)

機械判定:
```
# detection_reports 統合
docs-actionable-report.json.sourceSyncHealth に enPatchRecovery / sourceSyncRecovery section 追加
(既存 sourceSyncHealth family 内拡張、新 family 追加なし)
shouldOpenIssue() が enPatchRecovery.stalePatches > 0 / overdueEntries > 0 でも trigger

# Sticky PR comment
既存 CI workflow (非 scheduled-actionable) に 1 step 追加
firing condition: 'upstream-recovery-status.json' に stale or overdue entries が存在
hidden marker '<!-- upstream-recovery: sticky -->' で idempotent upsert
(Rev 3 Task 3 の new-comment-per-push design は R1/R2 で廃止、統合)

# Documentation (PR Z で v2 schema 確定後)
docs/PARITY_GUIDE.md §許容機構 に 2-mechanism lifecycle flow 明記 (PR Z schema v2 と整合)
docs/OPS_DESIGN.md §定常運用 に weekly triage 手順追加
docs/DOCS_DATE_TRACKING.md に upstream-recovery-status.json 追記
```

### 運用 DoD (数週後に自律検証)

- 月次 review で `upstream-recovery-status.json` を読み、stale/overdue entries が全件処置済か確認
- `sourceSyncHealth` managed issue に `enPatchRecovery` / `sourceSyncRecovery` 情報が出ていること
- 本 plan landing 以降に新規 registry entry が追加された場合、reviewAfter を正しく設定していること

### 不変条件 (M2.5 達成後ずっと満たすべき)

- baseline=0 / audit=0 / inconclusive=0 (既存)
- `scripts/__tests__/source_parity_source_side_debt.test.mjs` の seeded pin が維持される (pull-requests registry 削除は **別 PR scope** のため本 plan で触らない)

---

## 設計: 2 軸を単一メカニズムで実現

ユーザー指定の 2 軸:
- **Axis A**: upstream が修正された場合の検知
- **Axis B**: 修正後に registry から削除忘れを防ぐ検知

→ **同一 status computation + 3-channel surfacing で両方を実現**:

| Surfacing channel | Axis A カバー | Axis B カバー | 発火条件 |
|---|---|---|---|
| `upstream-recovery-status.json` (real-time) | ✓ | ✓ | 毎 run |
| Per-PR non-blocking comment | ✓ | ✓ | stale entry 存在時 |
| Weekly GitHub tracking issue | △ (weekly 粒度) | ✓ (primary) | stale entry が 1+ の時 |

**Axis A** は status JSON の `statusA: 'stale'` field で即時可視化。**Axis B** は `statusB: 'overdue'` field + sticky PR comment + sourceSyncHealth managed issue で「削除するまで消えない」persistent 圧力を生む。

### Entry 状態遷移

```
  [registered] → [active] → [stale (upstream fixed)] → [removed (human action)]
                    ↑            │
                    └────────────┘  (upstream regresses — 稀)
```

- `active`: patch/exclusion の `find` or `expectedIssueType` が依然として EN に存在
- `stale`: EN から消えた (上流修正済)。このまま放置すると registry cruft → Axis B が警告
- `unknown`: snapshot fetch failure 等で判定不能 — fail-closed (stale 扱い)

---

## 重要ファイルマップ (Rev 4 — Phase 分割)

### Phase A: 新規

- `scripts/check_upstream_recovery.mjs` — **完全 standalone** aggregator。既存信号 (`EN_SOURCE_PATCHES` scan / `source-sync-status.json.pages[].fetchStatus` / snapshot の `patch.find` 存在) を読み取り `upstream-recovery-status.json` を derive
- `upstream-recovery-status.json` — derived view (`.gitignore` 対象、CI artifact として保存)
- `docs/superpowers/specs/2026-04-20-upstream-recovery-spec.md` — status JSON schema + lifecycle 状態遷移図

### Phase A: 変更

- `scripts/check_patch_review_cadence.mjs` — **既存 cadence check を `SOURCE_SYNC_EXCLUSIONS` エントリにも拡張**。現在は `EN_SOURCE_PATCHES` のみ scan → 両 registry 対応に。`collectOverdueDebt(registry)` として一般化
- `scripts/lib/source_sync_exclusions.mjs` — 各 entry に `reviewAfter: 'YYYY-MM-DD'` field を追加 (cadence parity)
- `scripts/lib/en_source_patches.mjs` — `createEnSourcePatchCoverage` の snapshot shape に `byPatchId: {[id]: {matched, hits}}` を追加 (全 34 patch IDs 列挙、hit 無しでも entry 存在)
- `scripts/__tests__/en_source_patches_integration.test.mjs` — `TARGET_SLUG_SNAPSHOTS` (8 unique slugs) を **全 34 unique slugs / 42 patch-to-slug bindings** へ拡張、**slug-driven loop**
- `scripts/__tests__/source_parity_source_side_debt.test.mjs` — `reviewAfter` field 存在の shape test 追加
- `scripts/__tests__/en_source_patches.test.mjs` — `byPatchId` enumeration shape test 追加
- `package.json` — `"check:upstream-recovery": "node scripts/check_upstream_recovery.mjs"` script 追加
- `.gitignore` — `upstream-recovery-status.json` を追加

### Phase B: 変更 (PR Z merge 後実施必須)

- `scripts/lib/detection_reports.mjs` — `sourceSyncHealth` family に `enPatchRecovery` / `sourceSyncRecovery` section 追加 (既存 family 内拡張、新 family 追加なし)
  - **理由で Phase B に送った**: `docs/superpowers/plans/2026-04-14-parity-phase4-schema-cleanup.md:1276` で PR Z Task 4.6.3 が本 file の schema v2 対応 (reviewAfter/baselineExpired 削除) を含む
- `scripts/__tests__/detection_reports.test.mjs` — `enPatchRecovery` passthrough 確認 test 追加
- 既存 CI workflow (parity-check.yml 相当) — sticky PR comment step 追加 (`<!-- upstream-recovery: sticky -->` marker で idempotent upsert)
- `docs/PARITY_GUIDE.md` — §許容機構 に 2-mechanism lifecycle 節追加 (PR Z で確定した v2 schema 用語と整合させた上で)
- `docs/OPS_DESIGN.md` — §定常運用 に weekly triage 手順追加
- `docs/DOCS_DATE_TRACKING.md` — `upstream-recovery-status.json` 追記

### **変更対象外** (全 Phase 共通)

- `scripts/check_source_parity.mjs` — PR Z (`docs/superpowers/plans/2026-04-14-parity-phase4-schema-cleanup.md §Task 4.6.1`) が primary owner。本 plan では touch しない
- `scripts/lib/parity_*.mjs` / `source_parity_*.mjs` (alignment / classifier / extractor) — parity gate の挙動変更は baseline=0 regression リスクあり、本 plan では触らない
- **新 workflow / 新 issue family** — Rev 2 で計画していた `upstream-recovery-tracking.yml` は採用せず、既存 `scheduled-actionable.yml` と既存 `sourceSyncHealth` family で完結 (Rev 3 以降一貫)
- **`pull-requests.md` registry 削除** — 別 PR (seeded pin test との scope 混合回避、Rev 2 決定)

---

## Task 1: Status infrastructure (Phase A — PR Z 並列可 / Axis A 基盤)

**Rev 3 変更点:** `check_source_parity.mjs` への介入を完全削除。`check_upstream_recovery.mjs` は standalone aggregator として既存信号のみ消費。

**Files:**
- Create: `scripts/check_upstream_recovery.mjs`
- Create: `docs/superpowers/specs/2026-04-20-upstream-recovery-spec.md`
- Modify: `scripts/lib/en_source_patches.mjs` (patchCoverage の byPatchId field 追加のみ)
- Modify: `package.json` (script 追加)
- **NOT modified**: `scripts/check_source_parity.mjs` (PR Z owner)

- [ ] **Step 1: Spec 起票**

`docs/superpowers/specs/2026-04-20-upstream-recovery-spec.md` に以下を記載:
- Entry 状態遷移図 (`active` → `stale` → `removed`)
- `upstream-recovery-status.json` schema
- status 判定条件:
  - en_patches: `patch.find` 不在 → `stale` (Axis A) / `reviewAfter` 期限超 → `overdue` (Axis B)
  - sync_exclusions: `source-sync-status.json.pages[].fetchStatus === 'excluded-recovered'` → `stale` (Axis A) / `reviewAfter` 期限超 → `overdue` (Axis B)
- `unknown` fail-closed policy (snapshot fetch 失敗 / source-sync-status.json 不在 時)

- [ ] **Step 2: `createEnSourcePatchCoverage` 拡張**

現行 shape: `{matchedHits, bySlug, mismatches}` → 拡張 shape: `{matchedHits, bySlug, byPatchId: {[id]: {matched: boolean, hits: number}}, mismatches}`

重要: aggregator 生成時に **全 34 patch IDs を seed** (hit 無しでも entry 存在、initialized to `{matched: false, hits: 0}`)。これにより stale 検知が可能。

単体 test を `scripts/__tests__/en_source_patches.test.mjs` に追加:
- `coverage.snapshot().byPatchId` が全 34 ID を enumerate (hit しなかった patch も `matched: false` で含む)

- [ ] **Step 3: `check_upstream_recovery.mjs` 実装 (Rev 3 標準形)**

```js
// scripts/check_upstream_recovery.mjs — standalone aggregator
// NO dependency on check_source_parity.mjs. Reads existing signals only.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  EN_SOURCE_PATCHES,
  createEnSourcePatchCoverage,
} from './lib/en_source_patches.mjs';
import { SOURCE_SYNC_EXCLUSIONS } from './lib/source_sync_exclusions.mjs';
import { preprocessEnHtml } from './lib/turndown.mjs';

const SNAPSHOTS_ROOT = 'snapshots/en/content';

function daysSince(dateStr) { /* ... */ }
function daysUntil(dateStr) { /* ... */ }

// Axis A: EN upstream 修正検知 (en_patches)
// slug-driven loop: preprocessEnHtml は slug ごとに全 applicable patches を
// 1 回で適用するため、unique slug を回して per-slug 1 call。
// per-patch status は coverage aggregator から導出。
function computeEnPatchStatus() {
  const coverage = createEnSourcePatchCoverage();
  const uniqueSlugs = new Set(EN_SOURCE_PATCHES.flatMap((p) => [...p.slugs]));
  for (const slug of uniqueSlugs) {
    const path = join(SNAPSHOTS_ROOT, `${slug}.html`);
    if (!existsSync(path)) continue;
    const raw = readFileSync(path, 'utf8');
    preprocessEnHtml(raw, { slug, patchCoverage: coverage });
  }
  const snap = coverage.snapshot();
  return EN_SOURCE_PATCHES.map((p) => {
    const cov = snap.byPatchId[p.id] ?? { matched: false, hits: 0 };
    const overdue = daysSince(p.reviewAfter) > 0;
    return {
      id: p.id,
      slugs: [...p.slugs],
      statusA: cov.matched ? 'active' : 'stale',  // Axis A
      statusB: overdue ? 'overdue' : 'current',   // Axis B
      hits: cov.hits,
      addedAt: p.addedAt,
      reviewAfter: p.reviewAfter,
      daysUntilReview: daysUntil(p.reviewAfter),
    };
  });
}

// Axis A: EN upstream 修正検知 (sync_exclusions) — 既存 fetchStatus を読む
function computeSyncExclusionStatus() {
  let syncPages = [];
  if (existsSync('source-sync-status.json')) {
    syncPages = JSON.parse(readFileSync('source-sync-status.json', 'utf8')).pages ?? [];
  }
  return Object.entries(SOURCE_SYNC_EXCLUSIONS).map(([slug, entry]) => {
    const fetched = syncPages.find((p) => p.slug === slug);
    const fetchStatus = fetched?.fetchStatus ?? 'unknown';
    const overdue = entry.reviewAfter ? daysSince(entry.reviewAfter) > 0 : false;
    return {
      slug,
      statusA:
        fetchStatus === 'excluded-recovered' ? 'stale' :
        fetchStatus === 'excluded-broken' ? 'active' : 'unknown',
      statusB: overdue ? 'overdue' : 'current',
      fetchStatus,
      addedAt: entry.addedAt,
      reviewAfter: entry.reviewAfter ?? null,  // Task 6 で追加予定
      daysUntilReview: entry.reviewAfter ? daysUntil(entry.reviewAfter) : null,
    };
  });
}

function main() {
  const enPatches = computeEnPatchStatus();
  const syncExclusions = computeSyncExclusionStatus();
  const allEntries = [
    ...enPatches.map((e) => ({ ...e, mechanism: 'en_source_patches' })),
    ...syncExclusions.map((e) => ({ ...e, mechanism: 'source_sync_exclusions' })),
  ];
  const staleCount = allEntries.filter((e) => e.statusA === 'stale').length;
  const overdueCount = allEntries.filter((e) => e.statusB === 'overdue').length;
  const unknownCount = allEntries.filter((e) => e.statusA === 'unknown').length;
  const output = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    summary: {
      totalEntries: allEntries.length,
      activeEntries: allEntries.length - staleCount - unknownCount,
      staleEntries: staleCount,       // Axis A signal
      overdueEntries: overdueCount,   // Axis B signal
      unknownEntries: unknownCount,
    },
    mechanisms: {
      en_source_patches: enPatches,
      source_sync_exclusions: syncExclusions,
    },
  };
  writeFileSync('upstream-recovery-status.json', JSON.stringify(output, null, 2));
  // Non-blocking exit (no process.exit(1)): consumers decide via JSON
  return output;
}

main();
```

**重要な Rev 3 設計**:
- **slug-driven loop** (patches per slug は preprocessEnHtml が一括適用): HIGH-3 finding 対応
- **Axis A と Axis B を独立 field に分離** (`statusA` / `statusB`): 混同回避
- `overdue` は既存 `check_patch_review_cadence.mjs` 判定ロジックと align
- Non-blocking exit: consumer が JSON 読んで判断

- [ ] **Step 4: package.json script 追加 + .gitignore**

```json
"check:upstream-recovery": "node scripts/check_upstream_recovery.mjs"
```

`.gitignore` に `upstream-recovery-status.json` 追加。

- [ ] **Step 5: commit**

```
feat(recovery): upstream-recovery-status.json 出力 + check:upstream-recovery CLI
```

---

## Task 2: Test coverage expansion (Phase A — Axis A / 全 34 patch IDs / 42 bindings 網羅)

**Rev 3 変更点:**
- patch count 修正: 34 patch IDs / **42 patch-to-slug bindings** / 34 unique slugs (Rev 2 "26 unique slugs" は誤り)
- Loop 構造を **slug-driven** に: `preprocessEnHtml(raw, {slug, patchCoverage})` は slug ごとに全 applicable patches を 1 回で適用するため、unique slug を回して per-slug 1 call すれば coverage aggregator が per-patch 状態を返す。patch-driven だと同じ slug に対して重複 preprocess 呼び出しになる
- 既存 TARGET_SLUG_SNAPSHOTS test とは共存 (既存は hit-count assertion、本 test は stale surfacing)

**Files:**
- Modify: `scripts/__tests__/en_source_patches_integration.test.mjs`

- [ ] **Step 1: 全 34 patch 網羅 stale-detection test 追加 (slug-driven)**

```js
describe('en_source_patches stale detection (全 34 patch IDs / 42 bindings) — non-gating', () => {
  it('report patches whose find string is missing from any of their registered snapshots', () => {
    const coverage = createEnSourcePatchCoverage();
    const uniqueSlugs = new Set(EN_SOURCE_PATCHES.flatMap((p) => [...p.slugs]));
    for (const slug of uniqueSlugs) {
      const snapshotPath = join(SNAPSHOTS_ROOT, `${slug}.html`);
      if (!existsSync(snapshotPath)) continue;
      const raw = readFileSync(snapshotPath, 'utf8');
      preprocessEnHtml(raw, { slug, patchCoverage: coverage });
    }
    const snap = coverage.snapshot();
    const stale = EN_SOURCE_PATCHES
      .filter((p) => !snap.byPatchId[p.id]?.matched)
      .map((p) => ({ id: p.id, slugs: [...p.slugs], reviewAfter: p.reviewAfter }));
    // Non-gating: warn only. Enforcement is via upstream-recovery-status.json + sticky PR comment.
    if (stale.length > 0) {
      console.warn(
        `[stale en_source_patches] ${stale.length} of ${EN_SOURCE_PATCHES.length} patches — ` +
        `EN may be fixed upstream:\n${JSON.stringify(stale, null, 2)}\n` +
        'Action: verify JA source-first correctness, remove entry, update upstream-defect-tracker.md'
      );
    }
    // Test always passes — do NOT assert stale.length === 0 here.
  });
});
```

**注意**: gate 化する必要が出た場合 (stale 放置が depression パターン化したら) は別途 policy 変更を議論。現時点では non-blocking で observability 優先。

- [ ] **Step 2: sync_exclusions recovery test**

```js
describe('source_sync_exclusions recovery status', () => {
  it('excluded-recovered entries should be removed from registry (stale detection)', () => {
    if (!existsSync('source-sync-status.json')) return; // CI-only artifact
    const status = JSON.parse(readFileSync('source-sync-status.json', 'utf8'));
    const stale = status.pages.filter(p =>
      p.fetchStatus === 'excluded-recovered' &&
      SOURCE_SYNC_EXCLUSIONS[p.slug]
    );
    if (stale.length > 0) {
      console.warn(`stale sync_exclusions: ${stale.map(s => s.slug).join(', ')}`);
      // Non-gating warning. Weekly workflow surfaces via issue.
    }
  });
});
```

注: sync_exclusions は CI artifact 依存なので local test では skip。weekly workflow が primary surfacing channel。

- [ ] **Step 3: commit**

```
test(recovery): expand en_source_patches stale detection to all 34 patches + sync_exclusions
```

---

## Task 3: **廃止** (Rev 4)

**Rev 4 変更点 (R1/R2/R6):** Rev 3 Task 3 は以下 3 問題を抱えていた:
- R1 API mismatch: `e.status` / `e.daysSinceAdded` を参照するが Task 1 schema は `statusA` / `statusB` + `daysUntilReview`
- R2 firing condition 不発: `steps.recovery.outcome == 'failure'` で発火するが `check_upstream_recovery.mjs` は non-blocking exit (process.exit(1) しない) のため永久に trigger されない
- R6 重複: Task 4 Step 3 の sticky comment 実装と design 重複

**対応**: Task 3 全体を削除。**Phase B Task 4 Step 3 の sticky PR comment に一本化**。

→ 詳細は §Task 4 (Phase B) Step 3 参照。

---

## Task 4: detection_reports / sourceSyncHealth 統合 (Phase B — PR Z merge 後)

**⚠️ Phase B 限定:** 本 Task は **`scripts/lib/detection_reports.mjs` を変更する**。同 file は **PR Z Task 4.6.3 (`docs/superpowers/plans/2026-04-14-parity-phase4-schema-cleanup.md:1269-1276`)** が `reviewAfter` / `baselineExpired` 参照を削除する schema v2 対応を行うため、**本 plan の PR と PR Z を直接 merge 衝突させてはいけない**。PR Z が main に merge された後で Phase B 作業を開始する。

**既存 infra 参照 (読み取りのみ、変更は最小限):**
- `scripts/lib/detection_reports.mjs:1148` — `sourceSyncHealth` family の既存定義 (PR Z 後の新 line 番号を確認必要)
- `scripts/lib/detection_reports.mjs:293` — `['snapshotDiff', 'parityRegression', 'sourceSyncHealth', 'parityFollowup']` family enumeration
- `.github/workflows/scheduled-actionable.yml:115-135` — weekly schedule + `syncDetectionIssues` 呼出し
- `.github/scripts/sync-detection-issues.cjs` — detection-family marker (`<!-- detection-family: ... -->`)

**Files:**
- Modify: `scripts/lib/detection_reports.mjs` — `sourceSyncHealth` 内に `enPatchRecovery` + `sourceSyncRecovery` section 追加 (既存 family 拡張、新 family 追加なし)
- Modify: `scripts/__tests__/detection_reports.test.mjs` — 新 section passthrough test 追加
- Modify: `.github/workflows/scheduled-actionable.yml` — artifact upload list に `upstream-recovery-status.json` 追加 (1 行)
- Modify: 既存 PR trigger CI workflow (parity-check.yml 等) — sticky PR comment step 追加

- [ ] **Step 1: `loadDetectionInputs()` に `upstream-recovery-status.json` 読込追加 (R3 対応)**

`scripts/lib/detection_reports.mjs` の `loadDetectionInputs()` (既存 function) に以下を追加:

```js
// Pseudocode additions to loadDetectionInputs()
const upstreamRecoveryPath = resolveInputPath('upstream-recovery-status.json');
let upstreamRecovery = null;
if (existsSync(upstreamRecoveryPath)) {
  try {
    upstreamRecovery = JSON.parse(readFileSync(upstreamRecoveryPath, 'utf8'));
  } catch (err) {
    // Non-fatal: treat absent as "no signal", log warning
    console.warn(`[detection] failed to parse upstream-recovery-status.json: ${err.message}`);
  }
}
// ... existing returns ... , upstreamRecovery,
```

不在時は `null` を許容し、`generateDetectionReports()` が graceful degradation (section 出力なし or `enPatchRecovery: null`)。

- [ ] **Step 2: `generateDetectionReports()` で `sourceSyncHealth` に新 section 追加**

```js
// Existing sourceSyncHealth family assembly に追加
sourceSyncHealth: {
  // ... existing fields ...
  enPatchRecovery: upstreamRecovery ? {
    totalPatches: upstreamRecovery.mechanisms.en_source_patches.length,
    activePatches: upstreamRecovery.mechanisms.en_source_patches.filter(e => e.statusA === 'active').length,
    stalePatches: upstreamRecovery.mechanisms.en_source_patches.filter(e => e.statusA === 'stale').length,
    overduePatches: upstreamRecovery.mechanisms.en_source_patches.filter(e => e.statusB === 'overdue').length,
    stale: upstreamRecovery.mechanisms.en_source_patches.filter(e => e.statusA === 'stale').map(e => ({
      id: e.id, slugs: e.slugs, reviewAfter: e.reviewAfter, daysUntilReview: e.daysUntilReview,
    })),
  } : null,
  sourceSyncRecovery: upstreamRecovery ? {
    // similar shape for source_sync_exclusions
  } : null,
},
```

`shouldOpenIssue()` の条件に以下を追加 (OR で他条件に追記):
```js
(sourceSyncHealth.enPatchRecovery?.stalePatches > 0) ||
(sourceSyncHealth.enPatchRecovery?.overduePatches > 0) ||
(sourceSyncHealth.sourceSyncRecovery?.stalePatches > 0)
```

既存の `syncDetectionIssues` が `sourceSyncHealth` family issue を自動 upsert するため、新 family marker は不要。

- [ ] **Step 3: Sticky PR comment (Rev 3 Task 3 廃止 → ここに一本化 / R1/R2 修正済)**

```yaml
# .github/workflows/parity-check.yml (or equivalent PR-triggered workflow) に追加
- name: Upstream recovery — generate status
  continue-on-error: true
  run: npm run check:upstream-recovery

- name: Upstream recovery — sticky PR comment
  if: always() && github.event_name == 'pull_request' && hashFiles('upstream-recovery-status.json') != ''
  uses: actions/github-script@v7
  with:
    script: |
      const fs = require('fs');
      const MARKER = '<!-- upstream-recovery: sticky -->';
      const status = JSON.parse(fs.readFileSync('upstream-recovery-status.json', 'utf8'));
      const enStale = status.mechanisms.en_source_patches.filter(e => e.statusA === 'stale');
      const enOverdue = status.mechanisms.en_source_patches.filter(e => e.statusB === 'overdue');
      const syncStale = status.mechanisms.source_sync_exclusions.filter(e => e.statusA === 'stale');
      const syncOverdue = status.mechanisms.source_sync_exclusions.filter(e => e.statusB === 'overdue');

      // Find existing sticky comment (idempotent)
      const comments = await github.paginate(github.rest.issues.listComments, {
        owner: context.repo.owner, repo: context.repo.repo, issue_number: context.issue.number,
      });
      const existing = comments.find(c => c.body?.includes(MARKER));

      const total = enStale.length + enOverdue.length + syncStale.length + syncOverdue.length;
      if (total === 0) {
        // Cleanup: delete existing sticky when all resolved
        if (existing) {
          await github.rest.issues.deleteComment({
            owner: context.repo.owner, repo: context.repo.repo, comment_id: existing.id,
          });
        }
        return;
      }

      const fmt = (e) => `- \`${e.id ?? e.slug}\` reviewAfter=${e.reviewAfter} daysUntil=${e.daysUntilReview}`;
      const body = `${MARKER}\n\n## 🧹 Upstream recovery: ${total} entries need attention\n\n` +
        (enStale.length ? `### en_source_patches stale (${enStale.length})\n${enStale.map(fmt).join('\n')}\n\n` : '') +
        (enOverdue.length ? `### en_source_patches overdue (${enOverdue.length})\n${enOverdue.map(fmt).join('\n')}\n\n` : '') +
        (syncStale.length ? `### source_sync_exclusions stale (${syncStale.length})\n${syncStale.map(fmt).join('\n')}\n\n` : '') +
        (syncOverdue.length ? `### source_sync_exclusions overdue (${syncOverdue.length})\n${syncOverdue.map(fmt).join('\n')}\n\n` : '') +
        `_Informational only. See docs/PARITY_GUIDE.md §許容機構 for removal workflow._`;

      if (existing) {
        await github.rest.issues.updateComment({
          owner: context.repo.owner, repo: context.repo.repo, comment_id: existing.id, body,
        });
      } else {
        await github.rest.issues.createComment({
          owner: context.repo.owner, repo: context.repo.repo, issue_number: context.issue.number, body,
        });
      }
```

**重要な R2 修正**: firing は `if: always()` + hashFiles 存在確認。step outcome に依存せず、status JSON が生成された場合のみ動く。delete logic (`total === 0`) で問題解消時に sticky comment を自動 cleanup。

Permissions:
```yaml
permissions:
  issues: write
  pull-requests: write
```

`concurrency` group (`upstream-recovery-${{ github.event.pull_request.number }}`) を workflow-level で設定し race condition 回避。

- [ ] **Step 4: 全 gate green 確認 + commit**

```
feat(recovery): Phase B — detection_reports + sticky PR comment
```

---

## Task 5: Documentation (Phase B — PR Z merge 後 / R7 対応)

**⚠️ Phase B 限定:** `docs/PARITY_GUIDE.md` / `docs/OPS_DESIGN.md` は PR Z Task 4.7 が全面更新 (schema v2 言及、`reviewAfter` / `baselineExpired` 削除等) の primary owner。本 Task は **PR Z merge 後**に、v2 schema と整合する形で §許容機構 / §定常運用 section を追加する。

**Files:**
- Modify: `docs/PARITY_GUIDE.md` (PR Z 後)
- Modify: `docs/OPS_DESIGN.md` (PR Z 後)
- Modify: `docs/DOCS_DATE_TRACKING.md` (PR Z impact 少なめ、Phase B の最初に実施可)

- [ ] **Step 1: `docs/PARITY_GUIDE.md §許容機構` 拡張**

追加セクション:
```markdown
## 許容機構 (2-mechanism design)

EN upstream の欠陥を JA side に mirror させず吸収するため、以下の 2 mechanism を採用する。どちらも **"broken-EN retreat" という ONE purpose** に属し、granularity が異なるだけ。

### Mechanism 1: page-level freeze (`scripts/lib/source_sync_exclusions.mjs`)

ページ全体が MadCap 出力で使い物にならない slug を snapshot 凍結対象として登録。snapshot fetch は行うが、実際の file は上書きしない。

### Mechanism 2: segment-level patch (`scripts/lib/en_source_patches.mjs`)

ページの一部に限定した MadCap authoring artifact (ZWSP 段落、broken pipe row、href-miswire 等) を抽出前に literal replace する。粒度を保ちつつ JA を source-first mirror させられる。

### Lifecycle (entry 追加 → 上流修正 → 削除)

1. Upstream 欠陥を人手で検証後、appropriate mechanism に entry 追加
2. Automated detection:
   - `upstream-recovery-status.json` が毎 run で per-entry status を出力
   - `en_source_patches_integration.test.mjs` が全 patch の `find` 存在を assert
   - `source-sync-status.json` の `fetchStatus: excluded-recovered` が page recovery を signal
3. Upstream 修正時:
   - sticky PR comment が stale 状態を surface (non-blocking)
   - 既存 `scheduled-actionable.yml` が `sourceSyncHealth` managed issue (`enPatchRecovery` / `sourceSyncRecovery` section) を weekly update
4. 人手削除:
   - registry entry を削除
   - `upstream-defect-tracker.md` の対応 entry を archive
   - 該当 JA file の parity check が引き続き 0 issues であることを確認

### 禁止事項

- 第 3 の許容機構を追加しないこと (ack 追加 / 新 registry 新設 等)
- entry 削除前に upstream 修正を確認しないこと
```

- [ ] **Step 2: `docs/OPS_DESIGN.md §定常運用` 追記**

週次 triage section:
```markdown
### Weekly: Upstream recovery triage

1. `sourceSyncHealth` managed issue (scheduled-actionable が weekly update) の `enPatchRecovery` / `sourceSyncRecovery` section を確認
2. 各 stale / overdue entry について:
   a. 該当 slug の snapshot を手動で fetch し直す
   b. 現在の EN HTML で欠陥が消えているか目視確認
   c. 消えていれば registry から削除 → `upstream-defect-tracker.md` を archive 状態に更新
   d. まだ消えていなければ issue コメントで状況記録 (次週 run で再評価)
3. 全 stale 解消後、`sourceSyncHealth` issue の当該 section が空になり、他 sync 問題も無ければ workflow が自動で issue を close
```

- [ ] **Step 3: `docs/DOCS_DATE_TRACKING.md` 追記**

```markdown
### upstream-recovery-status.json

- 生成: `npm run check:upstream-recovery` or weekly cron
- 用途: `en_source_patches` + `source_sync_exclusions` の per-entry status
- Schema: `docs/superpowers/specs/2026-04-20-upstream-recovery-spec.md` 参照
- 配布: `.gitignore` 対象。CI artifact のみ保存
```

- [ ] **Step 4: commit**

```
docs(recovery): 2-mechanism lifecycle + weekly triage procedure
```

---

## Task 6: `source_sync_exclusions` entries に `reviewAfter` 追加 (Phase A)

**Context:** Codex Q5 指摘の gap。`en_source_patches.mjs` は各 entry に `reviewAfter` (6 ヶ月 cadence) を持つが、`source_sync_exclusions.mjs:55-67` は `addedAt` のみで review cadence 非整合。本 Task で parity を取る。

**Files:**
- Modify: `scripts/lib/source_sync_exclusions.mjs` — `SOURCE_SYNC_EXCLUSIONS` の各 entry に `reviewAfter: 'YYYY-MM-DD'` を追加
- Modify: `scripts/__tests__/source_parity_source_side_debt.test.mjs` — `reviewAfter` field 存在の shape test を追加
- Modify: `scripts/check_patch_review_cadence.mjs` (`scripts/check_patch_review_cadence.mjs:4-9,83-94` 参照) — `source_sync_exclusions` entries も cadence check 対象に含める

- [ ] **Step 1: registry に `reviewAfter` field 追加**

```js
// scripts/lib/source_sync_exclusions.mjs
'testops/testops-version-control/pull-requests': Object.freeze({
  ...existing fields,
  addedAt: '2026-04-09',
  reviewAfter: '2026-10-09',  // 6 months cadence, parity with en_source_patches
  linkedIssue: 247,
}),
```

- [ ] **Step 2: shape test**

`scripts/__tests__/source_parity_source_side_debt.test.mjs` に invariant test 追加: 全 entry に `reviewAfter` field 存在 + `YYYY-MM-DD` format 確認。

- [ ] **Step 3: cadence check script 拡張**

`scripts/check_patch_review_cadence.mjs` を拡張し、`source_sync_exclusions` の `reviewAfter` 期限も集計対象に。90 日超 past-due は `sourceSyncHealth.sourceSyncRecovery` section 経由で surface される (新 family 追加なし)。

- [ ] **Step 4: commit**

```
feat(recovery): add reviewAfter to source_sync_exclusions for cadence parity
```

---

## Task 7 (Rev 2 Appendix): pull-requests.md 初回 cleanup (**別 PR として分離**)

**Rev 2 変更点:** Rev 1 では本 Task を同 PR に含めていたが、Codex Q6 指摘により **別 PR に分離**。理由:
- `scripts/__tests__/source_parity_source_side_debt.test.mjs:47-55` が `pull-requests` を seeded debt として pin している
- Registry 削除 = test 変更を伴い、recovery infrastructure PR と review scope が混合
- infrastructure PR は stable (long-running review OK)、cleanup PR は upstream 状態依存 (mutable)

**別 PR のスコープ:**
- Branch: `claude/pull-requests-registry-removal` (新規)
- 本 plan (infrastructure) が merge された後に実施
- Steps:
  1. snapshot 再 fetch + EN HTML 目視確認
  2. 修復済なら: `SOURCE_SYNC_EXCLUSIONS` から entry 削除 + `source_parity_source_side_debt.test.mjs` の seeded pin を "at least 0 entries OK" に緩和 (or 別 seed に差し替え)
  3. `npm run check:parity` で 0 issues 維持確認
  4. `docs/superpowers/specs/upstream-defect-tracker.md` に archive 記録
  5. 未修復なら: snapshot + `reviewAfter` 更新のみ (cleanup はさらに延期)

本 plan の Task 1-6 とは independent、順序は: **本 plan merge → pull-requests cleanup PR**。

---

## Task 8: E2E verification + PR

- [ ] **Step 1: local 全 gate 緑確認**

```
npm run test && npm run lint && npm run build
npm run check:parity && npm run check:snapshots:diff
npm run check:upstream-recovery
```

- [ ] **Step 2: dry-run existing scheduled workflow**

```
gh workflow run scheduled-actionable.yml -f debug=true
```

実行ログで:
- `upstream-recovery-status.json` が artifact upload に含まれる
- `docs-actionable-report.json` に `sourceSyncHealth.enPatchRecovery` / `sourceSyncRecovery` section が出力される (Phase B で追加)
- Phase B sticky PR comment が該当 PR に post される (PR trigger test)

- [ ] **Step 3: PR 作成 (Phase A / Phase B ごとに別 PR)**

**Phase A PR**:
```
feat(recovery): Phase A — check_upstream_recovery.mjs + test 拡張 + reviewAfter parity

- scripts/check_upstream_recovery.mjs (standalone aggregator)
- check:upstream-recovery CLI + upstream-recovery-status.json
- en_source_patches_integration.test.mjs 全 34 patches slug-driven 網羅
- check_patch_review_cadence.mjs を source_sync_exclusions にも拡張
- source_sync_exclusions に reviewAfter 追加 (cadence parity)
```

**Phase B PR** (PR Z merge 後):
```
feat(recovery): Phase B — detection_reports 統合 + sticky PR comment + docs

- detection_reports.mjs に enPatchRecovery / sourceSyncRecovery section 追加
- sticky PR comment (non-blocking, upsert, cleanup-on-resolved)
- docs/PARITY_GUIDE §許容機構 + docs/OPS_DESIGN §定常運用 追記
- docs/DOCS_DATE_TRACKING.md に upstream-recovery-status.json 追記
```

**注意**: pull-requests.md の registry 削除は含めない (Task 7 として別 PR)。

- [ ] **Step 4: 4-reviewer gate (per docs/PARITY_GUIDE §J)**

- code quality
- security
- typescript correctness
- parity contract / source-first adherence

---

## 完了条件 (all true) — Rev 4 / Phase A + Phase B

- [ ] `upstream-recovery-status.json` schema が spec 通りに生成される
- [ ] `en_source_patches_integration.test.mjs` が全 34 patches を網羅 (non-gating warning mode)
- [ ] `sourceSyncHealth` detection-family に `enPatchRecovery` section が追加され、既存 `scheduled-actionable.yml` で週次 issue sync される (新 workflow 追加なし)
- [ ] sticky PR comment (update-in-place) が stale entry 存在時に non-blocking で post される
- [ ] `source_sync_exclusions` entries に `reviewAfter` field が追加され cadence check 対象になる
- [ ] `docs/PARITY_GUIDE.md §許容機構` に 2-mechanism lifecycle が明記されている
- [ ] `docs/OPS_DESIGN.md §定常運用` に weekly triage 手順がある (既存 managed issue を check する form で)
- [ ] 既存 DoD counter (baseline=0 / audit-signal=0 / inconclusive=0) が regression していない
- [ ] `pull-requests.md` registry 削除は **別 PR (Task 7 scope)**。本 plan 完了条件には含めない。

---

## Dependencies / Ordering vs PR Z (Rev 3 改訂)

### 本 plan と PR Z の依存関係 (HIGH-2 finding 対応)

**Rev 3 変更点:** Rev 2 の「並列実行可」宣言を撤回。実態として以下の衝突あり:

| File | PR Z owner | 本 plan Rev 2 | 衝突 |
|---|---|---|---|
| `scripts/check_source_parity.mjs` | Task 4.6.1 が書き換え | Task 1 で status 書き出し追加 | YES |
| `docs/PARITY_GUIDE.md` | Task 4.7 で全面更新 | Task 5 で §許容機構 追加 | YES |
| `docs/OPS_DESIGN.md` | Task 4.7 で schema v2 言及更新 | Task 5 で定常運用追加 | YES |

Rev 3 でこれらの衝突ファイルは **本 plan の変更対象から削除** (重要ファイルマップ §変更対象外 参照)。代わりに:

- `scripts/check_upstream_recovery.mjs` を **完全 standalone** にし、`check_source_parity.mjs` には触らない
- `PARITY_GUIDE.md` / `OPS_DESIGN.md` の更新は **PR Z merge 後に別 PR** で実施 (PR Z の v2 schema 言及と整合させた上で追記)

### 推奨順序 (Rev 3)

```
[M2.5 merged] → [PR Z (schema v2 cutover)] → [本 plan implementation] → [pull-requests cleanup PR]
```

理由:
- PR Z は `check_source_parity.mjs` / schema / docs に大規模変更を入れる。本 plan を先行させると PR Z merge 時に rebase conflict
- 本 plan が既存 `check_patch_review_cadence.mjs` を拡張する際、PR Z で schema 変更が入っても `reviewAfter` field は v1/v2 両方で存在し続ける (破壊的変更なし)
- pull-requests cleanup は本 plan の infrastructure 完成後 (`upstream-recovery-status.json` + weekly surfacing が運用 loop の材料)

### 並列実行を許容する例外

doc 更新を全て省略 + `check_source_parity.mjs` 触らないなら PR Z と並列可。ただし **PR Z の schema v2 命名に合わせた docs 更新は必須で、それは本 plan 完了後になる**。

---

## 参考

- `feedback_baseline_zero_increase.md` — ONE purpose rule の source
- `docs/PARITY_GUIDE.md §PR-merge-gate-matrix §2` — 2-mechanism sanctioning
- `scripts/lib/source_sync_exclusions.mjs` — 既存 recovery probe 実装
- `scripts/lib/en_source_patches.mjs` — `createEnSourcePatchCoverage` の既存 API
- `scripts/lib/detection_reports.mjs:1105-1153` — 既存 `sourceSyncHealth` family 実装 (Rev 2 で拡張対象)
- `.github/workflows/scheduled-actionable.yml:115-135` — 既存 weekly scheduler (Rev 2 で活用)
- `.github/scripts/sync-detection-issues.cjs` — 既存 detection-family marker / issue sync 実装
- `scripts/__tests__/source_parity_source_side_debt.test.mjs:47-55` — `pull-requests` seeded pin (Rev 2 で Task 7 分離理由)
- `scripts/check_patch_review_cadence.mjs:4-9,83-94` — 既存 `reviewAfter` cadence check (Rev 2 で拡張対象)
- PR #357 (M2.5-A) / #358 (M2.5-B) / #359 (M2.5-C) — baseline=0 achievement context
- `docs/superpowers/plans/2026-04-14-parity-phase4-schema-cleanup.md` — PR Z (次の主要 milestone)

---

## Appendix A: Scope 外 (将来 plan candidates)

以下は Rev 1 検討 / Rev 2 レビューで議論したが、本 plan では採用しない:

### A.1 en_source_patches 撤廃 + extractor 移行

構造的 artifact patches (UD-015/017/018A-C/019/020/021/022 等) を `preprocessEnHtml` の slug-independent rule に統合し registry を trim する option。**不採用** 理由 (Codex Q4 + self-review §D10):
- 大半の patches は page-shape-specific で slug-scoping を失うと blast radius 拡大
- 候補は ZWSP paragraph (UD-015/022) くらいに限定される
- 別 plan `en_source_patches-trim` として今後検討可

### A.2 pull-requests.md を en_source_patches に転換

page-freeze を segment-patch に変換し mechanism 統一する option。**不採用** 理由 (Codex Q2 + self-review):
- EN body が単一 `<code>` block に完全崩壊 — 本文再構築 patch は数百行規模
- `en_source_patches` の design contract (literal find→replace) を逸脱
- Snapshot overwrite 抑止は page-freeze の primary responsibility であり patch で代替不能

### A.3 90-day hard CI block

stale entry 累積防止のため "90 日経過で CI fail" option。**不採用** 理由 (Codex Q5 + 第三者 review Finding 7):
- 既存 cadence check (`check_patch_review_cadence.mjs`) が non-blocking 方針
- Unrelated PR を stale entry で block するのは運用負荷大
- 現 registry 規模 (1 sync_exclusion + 34 en_patches = 35 entries) では over-engineering
- 代替: sticky PR comment + weekly issue の persistent pressure で compliance を促す
- **Escalation path (将来 entry 数 >100 に膨らんだ場合)**: `docs/PARITY_GUIDE.md` に "registry 規模 >100 で `overdueDays > 180` の entry がある場合、registry-touching PR のみ blocking 化を検討" と 1 文明記

---

## Appendix B: Pattern D — Unified Debt Catalog (中期的進化パス)

**第三者 review で提案された中期 vision。本 plan で採用せず、後続 plan の topic。**

### 動機

現状は 2 registry (`source_sync_exclusions` page-level / `en_source_patches` segment-level) が **パイプラインの異なるレイヤー**で動作する:

```
EN live HTML
  ↓
[snapshot_update]  ← source_sync_exclusions はここで効く (fetch/write 制御)
  ↓
snapshots/en/content/*.html
  ↓
[preprocessEnHtml] ← en_source_patches はここで効く (HTML transform)
  ↓
turndown → parity comparison
```

両者は **責務が異なる** ため統合は表面的な単純化にしかならない (Codex 第三者 review の unanimous conclusion)。

### Pattern D の姿

execution plane は 2 本 (snapshot_update / preprocessEnHtml) 残しつつ、**control plane を 1 本化**:

```js
// scripts/lib/upstream_debt_catalog.mjs (Pattern D)
export const UPSTREAM_DEBT_CATALOG = Object.freeze([
  {
    slug: 'testops/.../pull-requests',
    strategy: 'freeze',         // page-level retreat
    defectClass: 'body-collapse',
    linkedDefect: '...',
    addedAt: '2026-04-09',
    reviewAfter: '2026-10-09',
  },
  {
    slug: 'advanced-editing/api-testing',
    strategy: 'patch',          // segment-level repair
    patchId: 'UD-017',
    find: '...',
    replace: '...',
    defectClass: 'madcap-artifact',
    linkedDefect: '...',
    addedAt: '2026-04-20',
    reviewAfter: '2026-10-20',
  },
]);

// snapshot_update reads entries where strategy === 'freeze'
// preprocessEnHtml reads entries where strategy === 'patch'
// check_upstream_recovery reads all entries → unified view
```

### Pattern D への移行トリガー

以下のいずれかが発生したら検討:

- `source_sync_exclusions` が 3+ slug に増え、管理コストが無視できなくなる
- 新 strategy (例: baseline freeze、class-level retreat) 追加議論
- 本 plan の `upstream-recovery-status.json` 運用を 6 ヶ月続けて、出力 shape が安定した時

### Rev 3 plan における Pattern D bridge

本 plan の `upstream-recovery-status.json` schema (`mechanisms.en_source_patches` / `mechanisms.source_sync_exclusions` を **equal-level fields** として出力) は、Pattern D に移行した際 **そのまま `catalog` section に畳めるように**設計。schema 拡張時の migration cost を最小化。

---

## Revision History

- **Rev 1 (2026-04-20 AM)**: 初版。2 軸検知を単一 status computation + 3-channel surfacing (JSON + PR comment + 新 weekly workflow) で実現。Task 6 として pull-requests cleanup を同 PR 内に含める。
- **Rev 2 (2026-04-20 PM)**: Codex + self-review 結果を反映。主要変更:
  - **新 weekly workflow 追加を取り止め**、既存 `sourceSyncHealth` detection-family infra を拡張する方針に切替 (Codex Q3 — 既存 infra を見落としていた)
  - **pull-requests cleanup を別 PR に分離** (Codex Q6 — seeded pin test との scope 混合回避)
  - **新 Task 6: `source_sync_exclusions` entries に `reviewAfter` 追加** (Codex Q5 — cadence parity gap 解消)
  - en_patches 撤廃 + extractor 移行 / 90-day hard CI block option を Appendix A に scope 外宣言
  - Test 2 を non-gating warning mode に調整 (self-review §A1 — blocking vs non-blocking 矛盾解消)
- **Rev 3 (2026-04-20 夜)**: 第三者独立レビュー結果を反映。**大幅 scale-down**:
  - **HIGH-1 既存 cadence infra 過小評価**: `check_patch_review_cadence.mjs:53-77` が既に en_patches の `reviewAfter` Axis B を実装済、`check_source_parity.mjs:376` から毎 run 呼ばれ `console.warn` で non-blocking surface している。Rev 2 は新規 Axis B を提案していたが、実態は既存機構を `SOURCE_SYNC_EXCLUSIONS` にも広げるだけで十分。
  - **HIGH-2 PR Z との衝突**: Rev 2 は「並列実行可」と宣言しつつ `check_source_parity.mjs` / `PARITY_GUIDE.md` / `OPS_DESIGN.md` を変更対象に含めており、PR Z (Task 4.5-4.8) と owner 衝突。**推奨順序を「PR Z 完了後」に変更**、`check_upstream_recovery.mjs` を完全 standalone 化、conflict ファイルを変更対象から削除。
  - **HIGH-3 patch count 誤差**: 実測で 34 patch IDs / **42 patch-to-slug bindings** / **34 unique slugs** (Rev 2 の "26 unique slugs" / "8 → 26 拡張" は誤り)。Test 拡張 loop を **slug-driven** に変更 (per-slug 1 preprocessEnHtml call + coverage aggregator から per-patch status 導出)。
  - **Axis A と Axis B を独立 field に**: `statusA: active|stale` と `statusB: current|overdue` を分離。混同防止。
  - **Appendix B: Pattern D (unified debt catalog)** を中期進化パスとして明記。`upstream-recovery-status.json` schema を Pattern D への bridge として設計。
  - 第三者 review finding 6: `reviewAfter` を status output に統合 (`daysUntilReview` / `overdue` field 追加)。
  - 第三者 review finding 7: registry 規模 >100 + overdueDays >180 の escalation path を PARITY_GUIDE に 1 文明記 (Appendix A.3)。
- **Rev 4 (2026-04-20 深夜)**: 第三者 + Codex 2nd pass review の 10 findings (R1-R10) を反映。**Phase 分割で内部矛盾を解消**:
  - **R4 対応**: `detection_reports.mjs` も PR Z (Task 4.6.3) が primary owner と確認。detection_reports 統合 Task を **Phase B (post-PR Z)** に分離。
  - **R1/R2/R6 対応 — Task 3 廃止**: PR comment の schema mismatch (`e.status` vs `statusA`) + firing condition 不整合 (non-blocking exit で outcome=='failure' 不発火) + Task 4 Step 3 との重複を解消。Phase B sticky-comment 1 実装に統合。
  - **R3 対応**: Phase B に `loadDetectionInputs()` / `generateDetectionReports()` 配管 step を明示化。
  - **R5 対応**: DoD / Architecture / 変更対象外 の内部矛盾 (旧 `upstream-recovery-tracking.yml` 参照等) を全削除。
  - **R7 対応**: `PARITY_GUIDE.md` / `OPS_DESIGN.md` 更新を **Phase B** に明示分離。
  - **R8 対応**: Background / DoD の旧 patch count ("26 unique slugs") を全削除、34 IDs / 42 bindings / 34 slugs に統一。
  - **R9 対応**: `source-sync-status.json` 不在時の graceful degradation (`fetchStatus ?? 'unknown'`) を Task 1 実装に明示。DoD の `unknownEntries === 0` 評価は **CI artifact 下のみ** と明記。
  - **R10 対応**: Background §問題 節を Rev 3 header の「既存 cadence infra 認識済」と整合する記述に書き直し。
  - **baseline=0 不変性**: 全 Phase で「既存 parity gate 計算ロジックに触らない」を大前提として再明記。Phase B の detection_reports 変更は新 field 追加のみ、既存 summary 計算 / gate 判定には影響しない。
  - **実装規模 phase 別**: Phase A ~200 LOC (PR Z 並列可) / Phase B ~150 LOC (PR Z 後必須)。
