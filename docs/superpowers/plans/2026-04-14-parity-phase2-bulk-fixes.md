# Parity Phase 2 — 手動修正 (Top 2 files + segment-missing + token-gap residual) Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) with parallel worktrees. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Phase 1 完了後の baseline から、パターン化できない個別修正を 3 本の PR (Top 2 大物、segment-missing 翻訳復元、token-gap 残件) に分けて burn-down する。並列エージェント委任 + glossary_mask / URL normalize を参照しながら進める。

**Architecture:** 3 sub-phase 並列可。Sub-phase 2.1 は Phase 0 の glossary mask 効果で残件が激減するので、先に残件を確認してからスコープを確定する。Sub-phase 2.2 は EN 段落を復元する翻訳作業なので LLM エージェント委任が有効。Sub-phase 2.3 は CLI フラグ / 内部リンクのピンポイント修正。

**Tech Stack:** 既存パイプライン + 並列エージェント (codex / claude subagent)。

**Prerequisite:** Phase 1 PR (3 本) がマージされ、baseline が再生成済み。

**File ownership map:**
- `src/content/docs/editing-tests/steps.md` — Phase 2.1 (Top 1)
- `src/content/docs/editing-tests/editing-your-tests/editing-a-steps-properties.md` — Phase 2.1 (Top 2)
- `src/content/docs/**/*.md` — Phase 2.2 で segment-missing の 71 slug、Phase 2.3 で token-gap の 43 slug
- `scripts/phase2/enumerate_missing_segments.mjs` — Phase 2.2 (新規、対象 enumerate)
- `scripts/phase2/enumerate_token_gaps.mjs` — Phase 2.3 (新規)
- `docs/superpowers/specs/2026-04-14-parity-phase2-report.md` — 完了レポート (新規)

**並列 worktree:** `worktree-phase2-top2` / `worktree-phase2-missing` / `worktree-phase2-token-gap`

---

## Phase 2.1: Top 2 files の残件修正

**Context:** Phase 0 の glossary_mask で Top 2 files (`editing-tests/steps` 34 件、`editing-your-tests/editing-a-steps-properties` 28 件) の大半 (両者 58 件全てが segment-untranslated) が吸収される想定。Phase 1 完了後の実 baseline を見てスコープ確定。

### Task 2.1.1: Phase 1 後 baseline で両 file の残件確認

- [ ] **Step 1: 残件確認スクリプト実行**

```bash
node -e "
const b = require('./parity-baseline.json');
for (const slug of ['editing-tests/steps', 'editing-tests/editing-your-tests/editing-a-steps-properties']) {
  const entries = b.entries.filter(e => e.slug === slug);
  const byType = {};
  for (const e of entries) byType[e.issueType] = (byType[e.issueType] || 0) + 1;
  console.log(slug + ': ' + entries.length + ' entries');
  Object.entries(byType).forEach(([t,c]) => console.log('  ' + c + ' ' + t));
}
"
```

- [ ] **Step 2: 残件数に応じてスコープ決定**

- **残 0-5 件**: Phase 2.1 スキップ、Phase 2.2 に統合可能
- **残 6-20 件**: そのまま Phase 2.1 として処理
- **残 20+ 件**: Phase 0 の glossary_mask が想定通り吸収していない可能性 → GLOSSARY.md / INVARIANT_TOKENS.md を拡張すべき。Phase 0 に巻き戻して対応

結果を `/tmp/phase2-1-scope.md` に記録。

### Task 2.1.2: 残件ごとの修正

**Files:**
- Modify: `editing-tests/steps.md` / `editing-a-steps-properties.md`

- [ ] **Step 1: 各残件 entry を debug.maskCoverage と照合し、分類**

`parity-check-status.json` の `debug.maskCoverage` で masked entry 一覧を確認。各残件が:
- glossary に未登録の Testim 用語 → GLOSSARY.md に追加 (Phase 0 に戻す分)
- invariant pattern で拾えるべきだった → INVARIANT_TOKENS.md に追加
- 実際の翻訳抜け → JA を翻訳

- [ ] **Step 2: 各残件を分類に従って修正**

翻訳抜けは、EN snapshot (`snapshots/en/content/editing-tests/steps.html`) を読み、該当 segment を JA に翻訳して追加する。

- [ ] **Step 3: parity 確認**

```bash
npm run check:parity -- --slug=editing-tests/steps 2>&1 | tail -10
npm run check:parity -- --slug=editing-tests/editing-your-tests/editing-a-steps-properties 2>&1 | tail -10
```

- [ ] **Step 4: commit**

```bash
git add src/content/docs/editing-tests/steps.md src/content/docs/editing-tests/editing-your-tests/editing-a-steps-properties.md
git commit -m "fix: Phase 2.1 Top 2 files の残件修正"
```

### Task 2.1.3: baseline 再生成 + PR

- [ ] **Step 1: baseline 再生成 + PR**

```bash
npm run check:parity 2>&1 | tail -10
node scripts/generate_parity_baseline.mjs --rationale="Phase 2.1: Top 2 files 残件修正完了"
git add parity-baseline.json
git commit -m "chore: Phase 2.1 完了後の baseline 再生成"
git push -u origin worktree-phase2-top2
gh pr create --title "fix: Phase 2.1 Top 2 files 残件修正" --body "Plan: docs/superpowers/plans/2026-04-14-parity-phase2-bulk-fixes.md"
```

---

## Phase 2.2: segment-missing 翻訳復元 (136 件、71 slug)

**Context:** EN にある本文段落が JA で統合・省略されているケース。並列エージェント委任が有効だが、GLOSSARY.md / INVARIANT_TOKENS.md を**必ず**エージェントに送り、翻訳後の segment が再度 segment-untranslated に落ちないようにする。

### Task 2.2.1: 対象 enumerate

**Files:**
- Create: `scripts/phase2/enumerate_missing_segments.mjs`

- [ ] **Step 1: enumerate スクリプト**

```js
// scripts/phase2/enumerate_missing_segments.mjs
/**
 * Phase 2.2: segment-missing の各 entry を EN snapshot と照合し、
 * 翻訳復元タスクリストを生成する。
 */

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, '../..');

const baseline = JSON.parse(
  readFileSync(join(REPO_ROOT, 'parity-baseline.json'), 'utf8'),
);

const missing = baseline.entries.filter((e) => e.issueType === 'segment-missing');

const bySlug = new Map();
for (const e of missing) {
  if (!bySlug.has(e.slug)) bySlug.set(e.slug, []);
  bySlug.get(e.slug).push(e);
}

console.log('# Phase 2.2 Task List\n');
console.log('Total: ' + missing.length + ' entries in ' + bySlug.size + ' slugs\n');

for (const [slug, entries] of [...bySlug.entries()].sort((a, b) => b[1].length - a[1].length)) {
  console.log('## ' + slug + ' (' + entries.length + ' entries)');
  console.log('- EN snapshot: snapshots/en/content/' + slug + '.html');
  console.log('- JA file: src/content/docs/' + slug + '.md');
  for (const e of entries) {
    console.log('  - section: "' + (e.sectionPath || '(preface)') + '" segmentKind=' + e.segmentKind + ' enSegmentIndex=' + e.enSegmentIndex);
  }
  console.log('');
}
```

- [ ] **Step 2: enumerate 実行**

```bash
node scripts/phase2/enumerate_missing_segments.mjs > /tmp/phase2-2-tasklist.md
head -80 /tmp/phase2-2-tasklist.md
```

- [ ] **Step 3: commit**

```bash
git add scripts/phase2/enumerate_missing_segments.mjs
git commit -m "chore: Phase 2.2 segment-missing タスクリスト生成スクリプト"
```

### Task 2.2.2: 並列エージェントに翻訳復元を委任

**Files:**
- Modify: 各 slug の md (71 files)

**Context:** Subagent-driven で Top 10 slug (entry 数降順) を 2 並列で処理。各エージェントに以下を提供:
- WRITING_GUIDE.md §Source-First 契約
- GLOSSARY.md (Testim 用語リスト)
- INVARIANT_TOKENS.md (invariant pattern)
- TRANSLATION_GUIDE.md (自然な日本語ガイドライン)
- 該当 slug の EN snapshot と JA ファイル
- task entries 一覧 (section, segmentKind, enSegmentIndex)

- [ ] **Step 1: Top 10 slug を Subagent 2 並列で処理**

Subagent prompt template:

```
Phase 2.2: <slug> の segment-missing 翻訳復元

- EN snapshot: snapshots/en/content/<slug>.html
- JA file: src/content/docs/<slug>.md
- 対象 entries:
  - section "<sectionPath>" segmentKind=<kind> enSegmentIndex=<idx>
  ...

必須参照:
- docs/WRITING_GUIDE.md §Source-First 構造契約
- docs/GLOSSARY.md (Testim 用語は英語維持)
- docs/INVARIANT_TOKENS.md
- docs/TRANSLATION_GUIDE.md

手順:
1. EN snapshot の <sectionPath> セクションから対象 segment を特定
2. JA ファイルの対応箇所で該当段落が省略/統合されている箇所を見つける
3. EN segment を自然な日本語に翻訳して復元 (Testim 用語は英語維持)
4. npm run check:parity -- --slug=<slug> で検証
5. 新規 issue 0 になるまで修正

完了条件:
- 該当 slug の segment-missing が 0
- 新規 segment-untranslated / segment-extra が発生していない
```

- [ ] **Step 2: 各エージェント完了後に親セッションで検証**

```bash
npm run check:parity -- --slug=<slug> 2>&1 | tail -10
```

失敗した slug はエージェント結果を review して修正。

- [ ] **Step 3: 逐次 commit (slug 単位 or まとめて)**

```bash
git add src/content/docs/<slug>.md
git commit -m "fix: Phase 2.2 segment-missing 翻訳復元 (<slug>)"
```

- [ ] **Step 4: Top 10 以降の slug を 4-5 並列で処理**

同様の手順で残 61 slug を処理。

### Task 2.2.3: baseline 再生成 + PR

- [ ] **Step 1: baseline 再生成**

```bash
npm run check:parity 2>&1 | tail -15
node scripts/generate_parity_baseline.mjs --rationale="Phase 2.2: segment-missing 翻訳復元完了"
git add parity-baseline.json
git commit -m "chore: Phase 2.2 完了後の baseline 再生成"
```

- [ ] **Step 2: PR 作成**

```bash
git push -u origin worktree-phase2-missing
gh pr create --title "fix: Phase 2.2 segment-missing 翻訳復元 (71 slug、136 entries)" --body "## Summary

EN 本文段落が JA で統合・省略されていた 136 箇所を並列エージェント委任で翻訳復元しました。

Plan: docs/superpowers/plans/2026-04-14-parity-phase2-bulk-fixes.md (Phase 2.2)
"
```

---

## Phase 2.3: segment-token-gap 残件 (~34 件、Phase 0 後の残)

**Context:** Phase 0 の URL normalize で localized link 分 (~15 件) が吸収された後の残。CLI フラグ欠落、内部リンク欠落、数値単位等が対象。

### Task 2.3.1: 対象 enumerate

**Files:**
- Create: `scripts/phase2/enumerate_token_gaps.mjs`

- [ ] **Step 1: enumerate スクリプト**

```js
// scripts/phase2/enumerate_token_gaps.mjs
/**
 * Phase 2.3: segment-token-gap 残件を性質別に分類する。
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, '../..');

const baseline = JSON.parse(
  readFileSync(join(REPO_ROOT, 'parity-baseline.json'), 'utf8'),
);

const gaps = baseline.entries.filter((e) => e.issueType === 'segment-token-gap');

const categories = { cliFlag: [], internalLink: [], numeric: [], externalUrl: [], other: [] };
for (const g of gaps) {
  const tokens = g.missingTokens || [];
  const first = tokens[0] || '';
  if (first.startsWith('--') || first.startsWith('-')) categories.cliFlag.push(g);
  else if (first.startsWith('/docs/')) categories.internalLink.push(g);
  else if (/^\d+(ms|sec|s|min|hr|px|em|rem|MB|GB|KB|%)$/.test(first)) categories.numeric.push(g);
  else if (first.startsWith('http')) categories.externalUrl.push(g);
  else categories.other.push(g);
}

for (const [cat, items] of Object.entries(categories)) {
  console.log('## ' + cat + ' (' + items.length + ')');
  for (const g of items) {
    console.log('- ' + g.slug + ' | section: ' + g.sectionPath + ' | tokens: ' + JSON.stringify(g.missingTokens));
  }
  console.log('');
}
```

- [ ] **Step 2: enumerate 実行 + commit**

```bash
node scripts/phase2/enumerate_token_gaps.mjs > /tmp/phase2-3-targets.md
cat /tmp/phase2-3-targets.md | head -40
git add scripts/phase2/enumerate_token_gaps.mjs
git commit -m "chore: Phase 2.3 token-gap 残件分類スクリプト"
```

### Task 2.3.2: カテゴリ別に修正

**Files:**
- Modify: 各 slug の md

- [ ] **Step 1: cliFlag カテゴリ**

EN の CLI フラグ (`--project-id` 等) が JA に欠けている場合、JA 本文 or code block に追加。EN snapshot を参照して正しい位置 / 記法を確認。

- [ ] **Step 2: internalLink カテゴリ**

`/docs/X` 形式の内部リンクが JA に欠けている場合、対応する JA 本文に `[表示テキスト](/docs/X)` を追加。

- [ ] **Step 3: numeric / externalUrl / other カテゴリ**

個別判断で修正。修正できないもの (EN 側の typo 等) は `source_sync_exclusions.mjs` の検討対象として report に記録。

- [ ] **Step 4: 各修正を逐次 commit**

```bash
git add src/content/docs/<slug>.md
git commit -m "fix: Phase 2.3 token-gap 修正 (<slug>, <category>)"
```

### Task 2.3.3: baseline 再生成 + PR

```bash
npm run check:parity 2>&1 | tail -10
node scripts/generate_parity_baseline.mjs --rationale="Phase 2.3: token-gap 残件修正完了"
git add parity-baseline.json
git commit -m "chore: Phase 2.3 完了後の baseline 再生成"
git push -u origin worktree-phase2-token-gap
gh pr create --title "fix: Phase 2.3 segment-token-gap 残件修正" --body "Plan: docs/superpowers/plans/2026-04-14-parity-phase2-bulk-fixes.md (Phase 2.3)"
```

---

## Phase 2 総括レポート

### Task 2.4: Phase 2 完了レポート

**Files:**
- Create: `docs/superpowers/specs/2026-04-14-parity-phase2-report.md`

- [ ] **Step 1: レポート作成**

```markdown
# Parity Phase 2 — 手動修正 Report

## 削減結果

| 種別 | Phase 1 後 | Phase 2 後 | 差 |
| --- | --- | --- | --- |
| segment-missing | 136 | (実測) | (実測) |
| segment-token-gap | 34 (想定) | (実測) | (実測) |
| (Top 2 残) | (実測) | (実測) | (実測) |

## Sub-phase 別

- **Phase 2.1** (Top 2 残件): ??? entries 修正、GLOSSARY への追加 ??? 件
- **Phase 2.2** (segment-missing): 71 slug、??? entries 修正
- **Phase 2.3** (token-gap): ??? entries 修正、??? 件は EN 側 artifact として次 Phase へ

## Phase 3 へのインプット

- 残 segment-extra (callout-body): ??? 件 (Phase 3 対象)
- 残 segment-inconclusive: ??? 件 (Phase 4 対象)
- EN-side artifact として保留: ??? 件
```

- [ ] **Step 2: commit**

```bash
git add docs/superpowers/specs/2026-04-14-parity-phase2-report.md
git commit -m "docs: Phase 2 完了レポート"
```

---

## Execution Handoff

3 sub-phase は並列実行可能。Subagent-Driven with parallel worktrees が推奨。
