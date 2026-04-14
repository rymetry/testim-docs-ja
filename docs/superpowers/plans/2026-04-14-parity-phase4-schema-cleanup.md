# Parity Phase 4 — Schema 簡素化 + 残存整理 Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (inline batch with checkpoints). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Phase 3 完了後の残 baseline (推定 10-20 件の `segment-inconclusive` + `segment-order-mismatch` + 潜在的 EN-side artifact) を最終整理し、`parity-baseline.json` schema を "allowlist" 前提から "bug backlog" 前提にリファクタする。micro-exclusion 層の必要性も残件を見て判断する。

**Architecture:** 1 PR、単独 worktree。(a) 残 inconclusive の個別判断 → (b) micro-exclusion 必要性判定 → (c) schema migration (`reviewAfter` 等削除) → (d) `source_parity_baseline.mjs` リファクタ → (e) 運用ドキュメント最終更新。

**Tech Stack:** Node.js 20, 既存パイプライン + migration test。

**Prerequisite:** Phase 3 がマージ済み、baseline が最新。

**File ownership map:**
- `parity-baseline.json` — schema migration
- `scripts/lib/source_parity_baseline.mjs` — allowlist 前提コード除去
- `scripts/lib/source_parity_types.mjs` — 必要に応じて型定義更新
- `scripts/__tests__/source_parity_baseline.test.mjs` — schema migration test 追加
- `scripts/phase4/migrate_baseline_schema.mjs` — migration スクリプト (新規、one-shot)
- `docs/OPS_DESIGN.md` — 最終運用記述更新
- `docs/PARITY_GUIDE.md` — 最終運用記述更新
- `docs/superpowers/specs/2026-04-14-parity-phase4-report.md` — 完了レポート (新規、最終)
- `scripts/lib/parity_token_exclusions.mjs` — micro-exclusion 層 (残件次第で新規作成、条件付き)

**Worktree:** `worktree-phase4-schema-cleanup`

---

## Task 4.1: 残 inconclusive / order-mismatch の個別判断

**Files:**
- 各該当 slug の md (1-20 件程度)

- [ ] **Step 1: 残 entry 一覧化**

```bash
node -e "
const b = require('./parity-baseline.json');
const residual = b.entries.filter(e => ['segment-inconclusive', 'segment-order-mismatch'].includes(e.issueType));
console.log('Residual: ' + residual.length);
for (const e of residual) {
  console.log(e.issueType + ' | ' + e.slug + ' | section: ' + e.sectionPath);
  if (e.inconclusiveReason) console.log('  reason: ' + e.inconclusiveReason);
}
" > /tmp/phase4-residual.md
cat /tmp/phase4-residual.md
```

- [ ] **Step 2: 各 entry を分類**

以下 3 つのいずれかに分類:

1. **翻訳修正で解決可能**: segment 境界を揃える、順序を EN に合わせる等で解消
2. **EN-side artifact**: EN 原文が曖昧で JA が正しい → `source_sync_exclusions.mjs` (page-level) 登録 or micro-exclusion 検討
3. **真に曖昧**: 自動判定限界で残すしかない → baseline に残す (ただし `reviewAfter` なし、bug backlog フィールドに)

- [ ] **Step 3: 分類 1 (翻訳修正) を適用**

各該当 slug で修正を入れて commit:

```bash
git add src/content/docs/<slug>.md
git commit -m "fix: Phase 4 inconclusive 修正 (<slug>, 分類1: 境界/順序調整)"
```

## Task 4.2: micro-exclusion 層の必要性判断

**Context:** Phase 3 完了時点で残る EN-side artifact (baseline に残すには位置づけが曖昧、page-level exclusion では大粒すぎるもの) の件数を見て、micro-exclusion 層を作るかを判断する。Codex の指摘通り、**件数が少なければ汎用レイヤーは作らず個別対応**。

### Task 4.2.1: EN-side artifact の件数確認

- [ ] **Step 1: 現状の EN artifact 性質別件数**

```bash
node -e "
const b = require('./parity-baseline.json');
// WRITING_GUIDE §60 で明記されている EN 側 artifact 例
const artifactSlugs = [
  'advanced-editing/validations/validate-element-text',
  'advanced-editing/configuration-file-parameters',
  'getting-started/creating-your-first-codeless-test',
];
for (const slug of artifactSlugs) {
  const e = b.entries.filter(x => x.slug === slug);
  console.log(slug + ': ' + e.length + ' entries');
  for (const ent of e) console.log('  ' + ent.issueType + ' | ' + ent.sectionPath);
}
"
```

### Task 4.2.2: 判定分岐

- [ ] **Step 1: 件数に応じて対応を決定**

- **残 EN-artifact が 0-5 件**: micro-exclusion 層を作らない。個別に `source_sync_exclusions.mjs` (page-level) 登録 or baseline 個別 entry として残す
- **残 EN-artifact が 6-15 件で共通パターンあり**: micro-exclusion 層 (`parity_token_exclusions.mjs`) を新設する。以下の Task 4.2.3 を実施
- **残 EN-artifact が 15+ 件**: Phase 3 で見逃しがある可能性。Phase 3 に差し戻し

### Task 4.2.3 (条件付き): micro-exclusion 層を新設

このタスクは Task 4.2.2 で "6-15 件で共通パターンあり" を選んだ場合のみ実施。

**Files:**
- Create: `scripts/lib/parity_token_exclusions.mjs`
- Create: `scripts/__tests__/parity_token_exclusions.test.mjs`

- [ ] **Step 1: registry を作成**

```js
// scripts/lib/parity_token_exclusions.mjs
/**
 * Token-level exclusion registry for EN-side artifacts that don't warrant
 * full page-level exclusion but produce noise in baseline.
 *
 * Same philosophy as source_sync_exclusions.mjs: human must explicitly register.
 * Auto-detection never populates this.
 */

export const TOKEN_EXCLUSIONS = Object.freeze({
  // 例: display text と href が一致しない EN artifact
  'getting-started/creating-your-first-codeless-test': Object.freeze({
    reason: 'en-side-artifact',
    note: 'EN source has <a href="http://google.com">demo.testim.io</a> — display text is correct, JA uses the correct URL. token-gap for google.com is an EN artifact.',
    expectedIssueType: 'segment-token-gap',
    tokenPatterns: ['http://google.com', 'https://www.google.com'],
    addedAt: '2026-04-14',
    linkedIssue: null,
  }),
  // 必要に応じて追加
});

export function isTokenExcluded(slug, token) {
  const entry = TOKEN_EXCLUSIONS[slug];
  if (!entry) return false;
  return entry.tokenPatterns.some((p) => token === p || token.includes(p));
}

export function listExclusions() {
  return Object.entries(TOKEN_EXCLUSIONS).map(([slug, entry]) => ({
    slug,
    ...entry,
  }));
}
```

- [ ] **Step 2: test 作成**

```js
// scripts/__tests__/parity_token_exclusions.test.mjs
import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';

let isTokenExcluded;

before(async () => {
  ({ isTokenExcluded } = await import('../lib/parity_token_exclusions.mjs'));
});

describe('parity_token_exclusions', () => {
  it('excludes google.com artifact from creating-your-first-codeless-test', () => {
    assert.equal(
      isTokenExcluded('getting-started/creating-your-first-codeless-test', 'http://google.com'),
      true,
    );
  });

  it('does not affect unrelated slugs', () => {
    assert.equal(
      isTokenExcluded('editing-tests/steps', 'http://google.com'),
      false,
    );
  });
});
```

- [ ] **Step 3: align.mjs の token-gap 判定に exclusion を組み込む**

`scripts/lib/source_parity_align.mjs` の token-gap 比較箇所で `isTokenExcluded(slug, token)` をチェックし、excluded token は `missingTokens` に含めない。

- [ ] **Step 4: 対応する baseline entry を削除**

```bash
node scripts/phase4/migrate_baseline_schema.mjs --remove-excluded-artifacts
```

(migrate スクリプトは Task 4.3 で作成)

- [ ] **Step 5: test + commit**

```bash
node --test scripts/__tests__/parity_token_exclusions.test.mjs
git add scripts/lib/parity_token_exclusions.mjs scripts/__tests__/parity_token_exclusions.test.mjs scripts/lib/source_parity_align.mjs
git commit -m "feat: parity_token_exclusions (micro-exclusion 層) を新設"
```

## Task 4.3: baseline schema migration

**Files:**
- Create: `scripts/phase4/migrate_baseline_schema.mjs`
- Modify: `parity-baseline.json`
- Modify: `scripts/lib/source_parity_baseline.mjs`
- Modify: `scripts/lib/source_parity_types.mjs` (必要に応じて)

**Context:** baseline schema から allowlist 前提のフィールドを削除し、bug backlog 前提に簡素化する。

### 削除対象フィールド

- `reviewAfter` — "方針再検討" 前提、bug backlog では不要
- `inconclusiveCategory` / `inconclusiveReason` — Phase 0 で inconclusive 分岐が縮小、残件は自由記述の note で十分
- `usabilityReason` — page-level exclusion へ責務移動済み

### 追加する推奨フィールド

- `priority`: `high` / `medium` / `low` — bug backlog の burn-down 優先度
- `note`: string — 自由記述 (任意)

### Task 4.3.1: migration スクリプト作成

- [ ] **Step 1: migration スクリプト**

```js
// scripts/phase4/migrate_baseline_schema.mjs
/**
 * Phase 4: baseline schema migration.
 *
 * Removes allowlist-era fields (reviewAfter, inconclusiveCategory,
 * inconclusiveReason, usabilityReason) and adds bug-backlog fields
 * (priority default=medium).
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, '../..');
const BASELINE_PATH = join(REPO_ROOT, 'parity-baseline.json');

const DROP_FIELDS = new Set([
  'reviewAfter',
  'inconclusiveCategory',
  'inconclusiveReason',
  'usabilityReason',
]);

function migrate(oldEntry) {
  const migrated = {};
  for (const [k, v] of Object.entries(oldEntry)) {
    if (!DROP_FIELDS.has(k)) migrated[k] = v;
  }
  if (!migrated.priority) migrated.priority = 'medium';
  return migrated;
}

function main() {
  const baseline = JSON.parse(readFileSync(BASELINE_PATH, 'utf8'));
  const migrated = {
    ...baseline,
    schemaVersion: 2, // bump
    generatedAt: new Date().toISOString(),
    rationale: 'Phase 4: schema migration to bug-backlog model',
    entries: baseline.entries.map(migrate),
  };
  writeFileSync(BASELINE_PATH, JSON.stringify(migrated, null, 2));
  console.log('Migrated ' + migrated.entries.length + ' entries to schema v2');
}

main();
```

- [ ] **Step 2: migration の RED → GREEN test**

`scripts/__tests__/baseline_schema_migration.test.mjs` を新規作成:

```js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('baseline schema migration', () => {
  it('removes reviewAfter, inconclusiveCategory, inconclusiveReason, usabilityReason', () => {
    // migration 関数を export して単体 test
    // (migrate_baseline_schema.mjs から migrate() を export)
  });

  it('adds priority=medium default', () => {
    // ...
  });

  it('preserves all other fields', () => {
    // ...
  });
});
```

(migration スクリプトから `migrate()` を export して単体 test で pin)

### Task 4.3.2: migration 実行 + test 更新

- [ ] **Step 1: migration 実行**

```bash
node scripts/phase4/migrate_baseline_schema.mjs
```

- [ ] **Step 2: 既存 test を新 schema に合わせて更新**

`scripts/__tests__/source_parity_baseline.test.mjs` で `reviewAfter` / `inconclusiveCategory` / `usabilityReason` を参照している箇所を削除。`priority` を使うように更新。

- [ ] **Step 3: `source_parity_baseline.mjs` の allowlist コード除去**

- `BASELINE_ELIGIBLE_TYPES` のドキュメント修正 (allowlist 前提の記述 → bug backlog 前提)
- `reviewAfter` による match ロジック (もしあれば) を削除
- identity key 生成から削除フィールドを除外

- [ ] **Step 4: test + commit**

```bash
npm run test 2>&1 | tail -20
git add parity-baseline.json scripts/phase4/migrate_baseline_schema.mjs scripts/lib/source_parity_baseline.mjs scripts/__tests__/*.mjs
git commit -m "refactor: Phase 4 baseline schema v2 migration (allowlist -> bug backlog)"
```

## Task 4.4: 運用ドキュメント最終更新

**Files:**
- Modify: `docs/OPS_DESIGN.md`
- Modify: `docs/PARITY_GUIDE.md`

- [ ] **Step 1: OPS_DESIGN.md を burn-down 完了後の定常運用に更新**

- Baseline は完全に bug backlog、新規 issue は baseline に入れず修正 or page-level/token-level exclusion で対応
- `reviewAfter` による期日管理は廃止、`priority` による優先度管理
- 新規コンテンツ追加時は parity check が green であることが gate

- [ ] **Step 2: PARITY_GUIDE.md を最終化**

- §残債返済優先順位 → §Bug backlog の優先度管理 に改題
- 完了後の定常運用セクションを追加

- [ ] **Step 3: commit**

```bash
git add docs/OPS_DESIGN.md docs/PARITY_GUIDE.md
git commit -m "docs: Phase 4 burn-down 完了後の定常運用に更新"
```

## Task 4.5: 最終 E2E 確認 + PR

- [ ] **Step 1: 全テスト + lint + build + parity**

```bash
npm run test 2>&1 | tail -20
npm run lint 2>&1 | tail -20
npm run build 2>&1 | tail -20
npm run check:parity 2>&1 | tail -20
```

Expected: all green。baseline entries は ~10 件以下の inconclusive + priority 管理のみ。

- [ ] **Step 2: PR 作成**

```bash
git push -u origin worktree-phase4-schema-cleanup
gh pr create --title "refactor: Phase 4 baseline schema 簡素化 + burn-down 完了" --body "## Summary

Parity baseline の burn-down 最終 Phase。

- 残 inconclusive/order-mismatch を個別解消 (??? 件)
- micro-exclusion 層 (parity_token_exclusions.mjs) を ??? 件の EN-artifact で新設 (or 省略)
- baseline schema v1 -> v2 migration (reviewAfter, inconclusiveCategory, inconclusiveReason, usabilityReason を削除、priority を追加)
- source_parity_baseline.mjs の allowlist 前提コードを bug backlog 前提にリファクタ
- 運用ドキュメントを burn-down 完了後の定常運用に更新

## Final state

- baseline entries: 622 (before Phase 0) -> ??? (after Phase 4)
- segment-extra / segment-missing / section-structure-mismatch / segment-untranslated / segment-token-gap / segment-order-mismatch: 全て 0
- 残は真に曖昧な segment-inconclusive のみ

## Roadmap 完了

- Phase 0: 契約整備 ✓
- Phase 1: 頻出パターン ✓
- Phase 2: 手動修正 ✓
- Phase 3: JA 独自 callout 削除 ✓
- Phase 4: schema 簡素化 + 残整理 ✓

## 参考

- Roadmap: docs/superpowers/specs/2026-04-14-parity-burndown-roadmap.md
- Phase 0-4 各 Report: docs/superpowers/specs/2026-04-14-parity-oracle-phase0-report.md 他
"
```

## Task 4.6: 最終レポート

**Files:**
- Create: `docs/superpowers/specs/2026-04-14-parity-phase4-report.md`

- [ ] **Step 1: レポート作成**

```markdown
# Parity Phase 4 — Schema 簡素化 + burn-down 完了 Final Report

## 最終削減結果

| 種別 | Phase 0 前 | Phase 4 後 | 削減 |
| --- | --- | --- | --- |
| segment-extra | 193 | 0 | 193 |
| segment-missing | 136 | 0 | 136 |
| segment-untranslated | 146 | 0 | 146 |
| section-structure-mismatch | 86 | 0 | 86 |
| segment-token-gap | 49 | 0 | 49 |
| segment-inconclusive | 11 | (実測 ~0-10) | (実測) |
| segment-order-mismatch | 1 | 0 | 1 |
| **合計** | **622** | **(実測)** | **(実測)** |

## Schema migration

- v1 -> v2
- 削除: reviewAfter, inconclusiveCategory, inconclusiveReason, usabilityReason
- 追加: priority (high/medium/low, default=medium), note (任意)

## Micro-exclusion 層

- 残 EN-artifact: ??? 件
- 判定: (新設 / 省略)

## 定常運用への移行

- baseline = bug backlog として運用開始
- 新規 issue は baseline に入れず、即修正 or exclusion 登録
- CI gate: parity check が green であることが merge 条件

## 学びと今後の運用
```

- [ ] **Step 2: commit**

```bash
git add docs/superpowers/specs/2026-04-14-parity-phase4-report.md
git commit -m "docs: Phase 4 完了レポート (burn-down 全体の最終報告)"
```

---

## Execution Handoff

Phase 4 は単独 worktree で順次実行。migration は 1 回こなせば戻る理由はないので、test で入念に pin してから実行する。
