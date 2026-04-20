# Upstream Recovery Detection & Registry Lifecycle Management (Revision 2)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans。Steps use checkbox (`- [ ]`)。新規 worktree 推奨 (branch: `claude/upstream-recovery-detection`)。本 plan は M2.5 全 merge 完了後、PR Z と独立 parallel で実行可能。

> **Rev 2 (2026-04-20):** Rev 1 に対して Codex + self レビュー結果を反映。主要変更点:
> - Rev 1 の Task 4 (新規 weekly workflow) → **削除**。既存 `sourceSyncHealth` / `sync-detection-issues.cjs` (`.github/workflows/scheduled-actionable.yml:115-135`, `detection_reports.mjs:1105-1153`) を拡張する方針に切替。
> - Rev 1 の Task 6 (pull-requests.md cleanup 同 PR) → **別 PR に分離**。`source_parity_source_side_debt.test.mjs:47-55` が `pull-requests` seeded pin を強制しているため、同 PR では contract churn 大。
> - **新 Task: `source_sync_exclusions` entries に `reviewAfter` 追加**。現状 `addedAt` のみで review cadence 不整合 (`en_source_patches` には `reviewAfter` あり)。Codex 指摘の Q5 対応。
> - en_source_patches 撤廃 + extractor 移行 option (Rev 1 §D10 / Codex Q4) は scope 外と明示。別 plan candidates として Appendix 化。

**Goal:** EN upstream 側の欠陥を許容する 2 つの registry (`source_sync_exclusions.mjs` / `en_source_patches.mjs`) に対して、**(A) upstream 修正の自動検知** と **(B) 登録解除忘れの persistent reminder** を両方整備する。既存の「baseline monotonic 非増加 / 最終 DoD 全 counter 0」は維持しつつ、registry entry が上流修正後に stale 化したまま放置されるリスクを排除する。

**Architecture:** `upstream-recovery-status.json` を新設し per-entry status を計算。既存 `docs-actionable-report.json` + `.github/scripts/sync-detection-issues.cjs` machinery に **`upstreamRecovery` family を追加**してまとめて扱う (新 workflow / 新 issue family 増設なし)。PR comment は既存 workflow 内で sticky (update-in-place) 出力。test 拡張で全 34 patches + sync_exclusions entries 網羅。

**Tech Stack:** Node.js 20, node:test, GitHub Actions (既存 `scheduled-actionable.yml` 活用)。

---

## Background

### 現状 (2026-04-20 M2.5 merge 完了時点)

- **`source_sync_exclusions.mjs`** — page-level freeze registry。登録 1 slug (`testops/testops-version-control/pull-requests`)。EN-only recovery probe が実装済で `fetchStatus: 'excluded-recovered'` を `source-sync-status.json` に出力する。ただし **surfacing は quiet** — 人手で JSON を読まないと気付けない。
- **`en_source_patches.mjs`** — segment-level patch registry。登録 34 patches / 26 unique slugs (UD-001〜UD-022)。`patchCoverage` aggregator は runtime で実装済だが、**test coverage は TARGET_SLUG_SNAPSHOTS の 8 slugs 限定**。残 18 slugs の patch は stale 化しても検知されない。

### 問題

1. **上流修正検知の非対称性**: sync_exclusions には recovery probe があるが、en_source_patches は 8 slugs のみ test-based 検知、残 18 slugs は無検知。
2. **persistent reminder の欠如**: どちらの registry も、上流修正されて entry が stale になっても、**自動で削除を促すメカニズムが無い**。`source-sync-status.json` の `excluded-recovered` field は quiet。
3. **lifecycle のドキュメント不足**: entry の "追加 → 監視 → 上流修正 → 削除" フローが各 registry で異なる & 明文化されていない。

### 設計原則

- **2-mechanism (ONE purpose, two granularities)** を維持: broken-EN retreat という目的は 1 つだが、page-level (sync_exclusions) / segment-level (en_patches) の粒度分割は正当化される (`docs/PARITY_GUIDE.md §PR-merge-gate-matrix §2` で既に正式化)
- **非 blocking**: 未関連 PR を stale entry の放置で blocking しない。代わりに可視化と periodic reminder で圧力をかける
- **既存 infra 流用**: `createEnSourcePatchCoverage()` / `source-sync-status.json` を拡張、新 framework 禁止
- **単調性維持**: 本 plan は既存 DoD counter (baseline=0 etc.) を regression させない

---

## 最終 DoD (Definition of Done)

### 機械判定 (必須)

```
# upstream-recovery-status.json
summary.totalEntries         === (source_sync_exclusions count) + (en_source_patches count)
summary.activeEntries        === totalEntries (定常状態では全 active)
summary.staleEntries         === 0 (定常状態)
summary.unknownEntries       === 0 (全 entry が active/stale いずれかに判定済)

# Test coverage
en_source_patches_integration.test.mjs が全 EN_SOURCE_PATCHES entry を網羅
(TARGET_SLUG_SNAPSHOTS 限定から全 26 slugs 拡張)

# CI / workflow
weekly cron workflow `upstream-recovery-tracking.yml` が登録済み
local CLI `npm run check:upstream-recovery` が動作する

# Documentation
docs/PARITY_GUIDE.md §許容機構 に 2-mechanism + lifecycle flow 明記
docs/OPS_DESIGN.md §定常運用 に weekly triage 手順追加
docs/DOCS_DATE_TRACKING.md に upstream-recovery-status.json 追記
```

### 運用 DoD (数日後に自律検証)

- stale entry が 1 つも無いこと or 全て tracking issue に list 済
- tracking issue が最新 run を反映していること
- `pull-requests` slug が `excluded-recovered` 状態で放置されていないこと (本 plan 完了時に registry から削除 or 再調査)

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

**Axis A** は status JSON の `status: 'stale'` field で即時可視化。**Axis B** は weekly issue + PR comment で「削除するまで消えない」persistent 圧力を生む。

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

## 重要ファイルマップ

### 新規

- `scripts/check_upstream_recovery.mjs` — 両 registry の status を統合計算、`upstream-recovery-status.json` 書き出し
- `upstream-recovery-status.json` — runtime 出力 (`.gitignore` 対象、ただし CI artifact として保存)
- `.github/workflows/upstream-recovery-tracking.yml` — weekly cron workflow
- `docs/superpowers/specs/2026-04-20-upstream-recovery-spec.md` — status JSON schema + lifecycle 状態遷移図 (設計仕様)

### 変更

- `scripts/lib/en_source_patches.mjs` — `createEnSourcePatchCoverage` を拡張し per-patch `{matched, hits, lastSeenAt}` を記録
- `scripts/check_source_parity.mjs` — 末尾で `upstream-recovery-status.json` の `en_source_patches` section を書き出す (or 新 script を invoke)
- `scripts/__tests__/en_source_patches_integration.test.mjs` — `TARGET_SLUG_SNAPSHOTS` (8 slugs) → **全 EN_SOURCE_PATCHES entries (34/26 slugs) 網羅**に拡張
- `scripts/lib/source_sync_exclusions.mjs` — getter 追加 (`getRecoveryStatus(slug)`) で `fetchStatus` 読み出しを統一
- `docs/PARITY_GUIDE.md` — §許容機構 に 2-mechanism + lifecycle section 追加
- `docs/OPS_DESIGN.md` — §定常運用 に weekly triage ステップ追加
- `docs/DOCS_DATE_TRACKING.md` — `upstream-recovery-status.json` の責務 + schema を記載
- `package.json` — `"check:upstream-recovery": "node scripts/check_upstream_recovery.mjs"` script 追加
- `.gitignore` — `upstream-recovery-status.json` を追加 (CI artifact のみ保存)

---

## Task 1: Status infrastructure (Axis A 基盤)

**Files:**
- Create: `scripts/check_upstream_recovery.mjs`
- Create: `docs/superpowers/specs/2026-04-20-upstream-recovery-spec.md`
- Modify: `scripts/lib/en_source_patches.mjs`
- Modify: `scripts/check_source_parity.mjs`
- Modify: `package.json`

- [ ] **Step 1: Spec 起票**

`docs/superpowers/specs/2026-04-20-upstream-recovery-spec.md` に以下を記載:
- Entry 状態遷移図 (`active` → `stale` → `removed`)
- `upstream-recovery-status.json` schema (両 mechanism 統合 shape)
- `stale` 判定条件 (en_patches: `find` 不在 / sync_exclusions: `fetchStatus === 'excluded-recovered'`)
- `unknown` fail-closed policy

- [ ] **Step 2: `createEnSourcePatchCoverage` 拡張**

現行 shape: `{matchedHits, bySlug, mismatches}` → 拡張 shape: `{matchedHits, bySlug, byPatchId: {[id]: {matched: boolean, hits: number}}, mismatches}`

単体 test を `scripts/__tests__/en_source_patches.test.mjs` に追加:
- `coverage.record()` が `byPatchId[id]` を更新すること
- `coverage.snapshot().byPatchId` が all registered patches を列挙 (not just hit ones)

- [ ] **Step 3: `check_upstream_recovery.mjs` 実装**

```js
// scripts/check_upstream_recovery.mjs — pseudocode
import { EN_SOURCE_PATCHES, createEnSourcePatchCoverage } from './lib/en_source_patches.mjs';
import { SOURCE_SYNC_EXCLUSIONS } from './lib/source_sync_exclusions.mjs';
import { preprocessEnHtml } from './lib/turndown.mjs';

function computeEnPatchStatus() {
  const coverage = createEnSourcePatchCoverage();
  for (const patch of EN_SOURCE_PATCHES) {
    for (const slug of patch.slugs) {
      const path = `snapshots/en/content/${slug}.html`;
      if (!existsSync(path)) continue;
      const raw = readFileSync(path, 'utf8');
      preprocessEnHtml(raw, { slug, patchCoverage: coverage });
    }
  }
  const snap = coverage.snapshot();
  return EN_SOURCE_PATCHES.map(p => ({
    id: p.id,
    slugs: [...p.slugs],
    status: snap.byPatchId[p.id]?.matched ? 'active' : 'stale',
    hits: snap.byPatchId[p.id]?.hits ?? 0,
    addedAt: p.addedAt,
    daysSinceAdded: daysSince(p.addedAt),
  }));
}

function computeSyncExclusionStatus() {
  const syncStatus = JSON.parse(readFileSync('source-sync-status.json', 'utf8'));
  return Object.keys(SOURCE_SYNC_EXCLUSIONS).map(slug => {
    const entry = SOURCE_SYNC_EXCLUSIONS[slug];
    const fetched = syncStatus.pages.find(p => p.slug === slug);
    const fetchStatus = fetched?.fetchStatus ?? 'unknown';
    return {
      slug,
      status: fetchStatus === 'excluded-recovered' ? 'stale' :
              fetchStatus === 'excluded-broken' ? 'active' : 'unknown',
      fetchStatus,
      addedAt: entry.addedAt,
      daysSinceAdded: daysSince(entry.addedAt),
    };
  });
}

function main() {
  const enPatches = computeEnPatchStatus();
  const syncExclusions = computeSyncExclusionStatus();
  const allEntries = [
    ...enPatches.map(e => ({...e, mechanism: 'en_source_patches'})),
    ...syncExclusions.map(e => ({...e, mechanism: 'source_sync_exclusions'})),
  ];
  const staleCount = allEntries.filter(e => e.status === 'stale').length;
  const unknownCount = allEntries.filter(e => e.status === 'unknown').length;
  const output = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    summary: {
      totalEntries: allEntries.length,
      activeEntries: allEntries.length - staleCount - unknownCount,
      staleEntries: staleCount,
      unknownEntries: unknownCount,
      oldestStaleEntry: /* ... */,
    },
    mechanisms: {
      en_source_patches: enPatches,
      source_sync_exclusions: syncExclusions,
    },
  };
  writeFileSync('upstream-recovery-status.json', JSON.stringify(output, null, 2));
  process.exit(staleCount > 0 || unknownCount > 0 ? 1 : 0);
}
```

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

## Task 2: Test coverage expansion (Axis A, 既存 gap)

**Files:**
- Modify: `scripts/__tests__/en_source_patches_integration.test.mjs`

- [ ] **Step 1: 全 patch 網羅 stale-detection test 追加**

**Rev 2 変更点:** Rev 1 は `assert.equal(stale.length, 0)` で gate fail させる設計だったが、design principle の "non-blocking" と矛盾 (self-review §A1)。Rev 2 では **warning-only mode** に変更 — `console.warn` で surface し、CI fail はしない。代わりに `upstream-recovery-status.json` / detection-family issue 経由で恒常的に可視化。

```js
describe('en_source_patches stale detection (all registered patches) — non-gating', () => {
  it('report patches whose find string is missing from target snapshots', () => {
    const stale = [];
    for (const patch of EN_SOURCE_PATCHES) {
      for (const slug of patch.slugs) {
        const snapshotPath = join(SNAPSHOTS_ROOT, `${slug}.html`);
        if (!existsSync(snapshotPath)) continue;  // MIA snapshot は別 gate で検知
        const raw = readFileSync(snapshotPath, 'utf8');
        if (!raw.includes(patch.find)) {
          stale.push({ id: patch.id, slug, daysSinceAdded: daysSince(patch.addedAt) });
        }
      }
    }
    // Non-gating: warn only. Enforcement is via detection-family issue + sticky PR comment.
    if (stale.length > 0) {
      console.warn(
        `[stale en_source_patches] ${stale.length} entries — EN may be fixed upstream:\n` +
        JSON.stringify(stale, null, 2) + '\n' +
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

## Task 3: Per-PR CI signal (Axis B, non-blocking)

**Files:**
- Create or modify: `.github/workflows/parity-check.yml` (既存) or 新 `upstream-recovery-pr-comment.yml`

- [ ] **Step 1: CI step 追加**

既存 CI workflow に non-blocking step を追加:

```yaml
- name: Check upstream recovery status
  id: recovery
  continue-on-error: true
  run: npm run check:upstream-recovery

- name: Post recovery status PR comment
  if: github.event_name == 'pull_request' && steps.recovery.outcome == 'failure'
  uses: actions/github-script@v7
  with:
    script: |
      const fs = require('fs');
      const status = JSON.parse(fs.readFileSync('upstream-recovery-status.json', 'utf8'));
      const stale = [
        ...status.mechanisms.en_source_patches.filter(e => e.status === 'stale'),
        ...status.mechanisms.source_sync_exclusions.filter(e => e.status === 'stale'),
      ];
      if (stale.length === 0) return;
      const body = `## 🧹 Upstream recovery: ${stale.length} stale entries detected\n\n` +
        stale.map(e => `- \`${e.id ?? e.slug}\` (${e.daysSinceAdded} 日経過) — upstream may be fixed, consider removing from registry`).join('\n') +
        `\n\nThis comment is informational only. See docs/PARITY_GUIDE.md §許容機構 for the removal workflow.`;
      github.rest.issues.createComment({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: context.issue.number,
        body,
      });
```

`continue-on-error: true` により **unrelated PR を blocking しない**。

- [ ] **Step 2: commit + workflow sanity check**

local で workflow YAML を GitHub Actions validator にかける (`actionlint` 推奨)。

---

## Task 4: Existing `sourceSyncHealth` / detection-family infra に統合 (Axis B, primary) — Rev 2

**Rev 2 変更点:** Rev 1 の「新 workflow 追加」方針を撤廃し、既存の `docs-actionable-report.json` + `.github/scripts/sync-detection-issues.cjs` + `scheduled-actionable.yml` machinery を拡張する方針に変更。新 workflow / 新 issue 家族は作らない。

**既存 infra 参照:**
- `scripts/lib/detection_reports.mjs:1148` — `sourceSyncHealth` family の既存定義
- `scripts/lib/detection_reports.mjs:293` — `['snapshotDiff', 'parityRegression', 'sourceSyncHealth', 'parityFollowup']` family enumeration
- `.github/workflows/scheduled-actionable.yml:115-135` — weekly schedule + `syncDetectionIssues` 呼出し
- `.github/scripts/sync-detection-issues.cjs` — detection-family marker (`<!-- detection-family: ... -->`) で既存 issue を find → update / create / close

**Files:**
- Modify: `scripts/lib/detection_reports.mjs` — `upstreamRecovery` family を追加 (or `sourceSyncHealth` を拡張して `enPatchesRecovery` セクション含める)
- Modify: `.github/scripts/sync-detection-issues.cjs` — 新 family marker を登録
- (optional) `.github/workflows/scheduled-actionable.yml` — artifact upload list に `upstream-recovery-status.json` 追加

- [ ] **Step 1: detection-family の設計判断**

2 案のうち選択:

**A案: `sourceSyncHealth` family を拡張** — 既存の sync health issue に en_patches stale entries も併記する。1 issue で両 mechanism を一覧可能、mental model もっとも単純。
- `detection_reports.mjs:1148-1153` の `sourceSyncHealth.sourceSideDebt` 配列に `en_source_patches` の stale entries を merge
- `docs-actionable-report.json` schema は既存のまま拡張

**B案: 新 `upstreamRecovery` family を追加** — sync vs patches の混合を避ける。
- `detection_reports.mjs:293` の family list に `upstreamRecovery` を追加
- 新 issue family marker `<!-- detection-family: upstream-recovery -->`
- 既存 sync health と分離 (orthogonal に扱える)

**推奨: A 案** — pull-requests が唯一の sync_exclusion であり、en_patches (34 件) と同じ画面で見た方が運用者の mental load が低い。ただし `docs-actionable-report.json` schema が膨張するので、shape は明確に separate keys (`sourceSyncHealth.excludedDebt[]` + `sourceSyncHealth.enPatchRecovery[]`) にする。

- [ ] **Step 2: `detection_reports.mjs` 拡張**

A 案実装の pseudocode:
```js
// scripts/lib/detection_reports.mjs — sourceSyncHealth family 内
sourceSyncHealth: {
  freshnessState: ...,
  summary: ...,
  sourceSideDebt: [...],           // 既存
  recoveredPages: [...],           // 既存
  enPatchRecovery: {               // Rev 2 追加
    totalPatches: 34,
    activePatches: 33,
    stalePatches: 1,
    stale: [
      { id: 'UD-022', slugs: ['integrations/...'], addedAt: '2026-04-20', daysSinceAdded: 90 },
    ],
  },
},
```

`shouldOpenIssue` 条件 (`detection_reports.mjs:895`) に `enPatchRecovery.stalePatches > 0` を追加。

- [ ] **Step 3: sticky PR comment (Rev 2 追加)**

既存の `scheduled-actionable.yml` は schedule 時のみ issue を sync する。PR context でも stale を可視化するため、**既存 `.github/workflows/parity-check.yml` (or equivalent) に non-blocking 1 step 追加**:

```yaml
- name: Upstream recovery — sticky PR comment
  if: github.event_name == 'pull_request'
  continue-on-error: true
  uses: actions/github-script@v7
  with:
    script: |
      // Use detection-family marker '<!-- upstream-recovery: sticky -->'
      // Find existing comment → update in place. If none → create.
      // If stalePatches === 0 → delete comment (cleanup when resolved).
```

sticky marker で **update-in-place**: 1 PR に 1 comment のみ、push ごとに内容更新。new comment per push を避ける。

- [ ] **Step 4: commit**

```
feat(recovery): extend sourceSyncHealth detection family with enPatchRecovery section
                + sticky PR comment for stale registry entries
```

---

## Task 5: Documentation

**Files:**
- Modify: `docs/PARITY_GUIDE.md`
- Modify: `docs/OPS_DESIGN.md`
- Modify: `docs/DOCS_DATE_TRACKING.md`

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
   - PR comment が stale 状態を surface (non-blocking)
   - Weekly workflow が `upstream-recovery-tracking` issue を維持
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

1. `upstream-recovery-tracking` label の issue を確認
2. 各 stale entry について:
   a. 該当 slug の snapshot を手動で fetch し直す
   b. 現在の EN HTML で欠陥が消えているか目視確認
   c. 消えていれば registry から削除 → `upstream-defect-tracker.md` を archive 状態に更新
   d. まだ消えていなければ issue コメントで状況記録 (workflow が次週再評価)
3. 全 stale 解消後、workflow が自動で issue を close
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

## Task 6: `source_sync_exclusions` entries に `reviewAfter` 追加 (Rev 2 新 Task)

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

`scripts/check_patch_review_cadence.mjs` を拡張し、`source_sync_exclusions` の `reviewAfter` 期限も集計対象に。90 日超 past-due → `upstreamRecovery` family に escalate。

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
- `docs-actionable-report.json` に `sourceSyncHealth.enPatchRecovery` section が出力される
- Rev 2 の sticky PR comment が該当 PR に post される (PR trigger test)

- [ ] **Step 3: PR 作成**

```
feat(recovery): upstream recovery detection + registry lifecycle tracking (Rev 2)

- check:upstream-recovery CLI + upstream-recovery-status.json
- en_source_patches stale detection expanded to all 34 patches
- sourceSyncHealth detection-family に enPatchRecovery section 追加
- sticky PR comment (update-in-place) for stale entries (non-blocking)
- source_sync_exclusions に reviewAfter 追加 (cadence parity)
- docs/PARITY_GUIDE §許容機構 2-mechanism lifecycle 明文化
```

**注意**: pull-requests.md の registry 削除は含めない (Task 7 として別 PR)。

- [ ] **Step 4: 4-reviewer gate (per docs/PARITY_GUIDE §J)**

- code quality
- security
- typescript correctness
- parity contract / source-first adherence

---

## 完了条件 (all true) — Rev 2

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

## Dependencies / Ordering vs PR Z

### 本 plan と PR Z の依存関係

- **独立**: 本 plan は `parity-baseline.json.schemaVersion` を触らない。PR Z の schema v2 cutover とは orthogonal。
- **推奨順序**: 本 plan を先行実施。PR Z 実行中に stale entry が積もる可能性を事前に抑止できる。
- **並列実行可**: worktree を別に切れば M2.5 merge 後に同時進行可能。

### PR Z 完了後の考慮

- PR Z で baseline 形式が v1→v2 に変わるが、本 plan の `upstream-recovery-status.json` は baseline file を参照しないため影響なし
- PR Z 完了後、本 plan の Task 5 で更新した `docs/PARITY_GUIDE.md` の schema 言及を v2 に追従させる必要あり (本 plan の scope 外、PR Z Task 4.7 で吸収)

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

stale entry 累積防止のため "90 日経過で CI fail" option。**不採用** 理由 (Codex Q5):
- 既存 cadence check (`check_patch_review_cadence.mjs`) が non-blocking 方針
- Unrelated PR を stale entry で block するのは運用負荷大
- 代替: sticky PR comment + weekly issue の persistent pressure で compliance を促す

---

## Revision History

- **Rev 1 (2026-04-20 AM)**: 初版。2 軸検知を単一 status computation + 3-channel surfacing (JSON + PR comment + 新 weekly workflow) で実現。Task 6 として pull-requests cleanup を同 PR 内に含める。
- **Rev 2 (2026-04-20 PM)**: Codex + self-review 結果を反映。主要変更:
  - **新 weekly workflow 追加を取り止め**、既存 `sourceSyncHealth` detection-family infra を拡張する方針に切替 (Codex Q3 — 既存 infra を見落としていた)
  - **pull-requests cleanup を別 PR に分離** (Codex Q6 — seeded pin test との scope 混合回避)
  - **新 Task 6: `source_sync_exclusions` entries に `reviewAfter` 追加** (Codex Q5 — cadence parity gap 解消)
  - en_patches 撤廃 + extractor 移行 / 90-day hard CI block option を Appendix A に scope 外宣言
  - Test 2 を non-gating warning mode に調整 (self-review §A1 — blocking vs non-blocking 矛盾解消)
