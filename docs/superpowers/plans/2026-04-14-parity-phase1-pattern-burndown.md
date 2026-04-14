# Parity Phase 1 — 頻出パターン Burn-down Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Phase 0 完了後の baseline (total **2337** / segment-untranslated **1904** / segment-extra **150** / segment-missing 136 / section-structure-mismatch 86 / segment-token-gap 49 / segment-inconclusive 11 / segment-order-mismatch 1) に残る `segment-extra` **150 件** のうち、機械的に修正可能な 3 パターン (preface 重複、手順導入文分離、callout 内番号リスト展開) を 3 本の並列 PR でバッチ修正する。派生する `section-structure-mismatch` の大半も連鎖解消する想定。

> **実測内訳 (baseline 再生成 @ 2026-04-14 時点):** segment-extra 150 = preface (sectionPath=空) **35 件 / 22 slug**、section-internal **115 件** (unordered-list-item 47, callout-body 17, ordered-list-item 14, paragraph 20, table-cell 13, details-summary 4)。unique slug 68。

**Architecture:** 3 つの独立 sub-phase (1.1 / 1.2 / 1.3) を並列実行可能。各 sub-phase は (a) 対象 slug を baseline から enumerate、(b) 正規表現 + 手動確認で修正、(c) baseline 再生成で削減確認、の 3 段構成。パターン検知を汎化する補助スクリプトを `scripts/phase1/` 配下に新設し、再実行可能にする。

**Tech Stack:** Node.js 20 (enumerate スクリプト), 既存 `scripts/check_source_parity.mjs` + `generate_parity_baseline.mjs`, Markdown 直接編集。

**Prerequisite:** Phase 0 PR (#265) がマージ済み、baseline が glossary_mask + URL normalize + CJK 早期 return 削除後の最終状態 (2337 entries) で再生成済み。

**File ownership map:**
- `scripts/phase1/enumerate_preface_duplicates.mjs` — Phase 1.1 (新規、slug 列挙)
- `scripts/phase1/enumerate_step_intro_split.mjs` — Phase 1.2 (新規)
- `scripts/phase1/enumerate_callout_list_expansion.mjs` — Phase 1.3 (新規)
- `src/content/docs/**/*.md` — 各 sub-phase で修正
- `parity-baseline.json` — 各 sub-phase 完了後に再生成
- `docs/superpowers/specs/2026-04-14-parity-phase1-report.md` — 全 sub-phase 完了後の総括レポート (新規)

**並列実行の注意:**
- 3 sub-phase は**論理上**並列可能 (異なる slug 集合を触るため)。ただし同一 worktree で並列 subagent dispatch すると `parity-baseline.json` 再生成の競合、git lock、同 branch の commit 衝突リスクあり
- 同じ slug に複数パターンが同居する場合は、ファイル単位で責務者を決める (baseline 分析で enumerate 時に重複検知、1 sub-phase に割り当てる)
- Worktree 命名 (並列時): `worktree-phase1-preface` / `worktree-phase1-step-intro` / `worktree-phase1-callout-list`

**Phase 1 実行実態 (2026-04-14):**
Phase 1 は単一 worktree (`giggly-moseying-flamingo`) で 3 sub-phase を **順次** 実行し、1 PR (#266) に集約した。ユーザ判断により Phase 1.2 / 1.3 も同 worktree 継続。理由: baseline 再生成を 1 回にまとめられる / 最終 review を Phase 全体で 1 回で済む / 並列 worktree 運用のオーバーヘッド回避。後続 Phase 2/3 でも同パターン (1 PR / sub-phase 順次) を第 1 選択肢とし、並列 worktree は特に時間制約がある場合のみ検討する。

---

## Phase 1.1: preface 重複削除 (35 件、22 slug)

> **実測:** `segment-extra` かつ `sectionPath` 空 = 35 件 / 22 unique slug。原本 plan の「45 件 / 27 slug」は Phase 0 前の想定値で、Phase 0 の glossary_mask / URL normalize / CJK 早期 return 削除後の再生成で 35 件 / 22 slug に減少している。

### Task 1.1.1: 対象 slug を列挙する

**Files:**
- Create: `scripts/phase1/enumerate_preface_duplicates.mjs`

**Context:** `parity-baseline.json` から `segment-extra` かつ `sectionPath` が空のエントリを抽出。JA ファイルを読み、frontmatter description と最初の段落本文を比較して「重複」と判定できたら対象候補として出力する。

- [ ] **Step 1: enumerate スクリプトを作成**

```js
// scripts/phase1/enumerate_preface_duplicates.mjs
/**
 * Phase 1.1: preface 重複候補を baseline から抽出するスクリプト。
 *
 * 対象: segment-extra in preface (sectionPath is empty).
 * 判定: JA file の frontmatter description と最初の段落本文を比較。
 *       正規化した文字列が一致 or 90%+ 重複なら候補として出力。
 *
 * Usage:
 *   node scripts/phase1/enumerate_preface_duplicates.mjs
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

const candidates = baseline.entries.filter(
  (e) => e.issueType === 'segment-extra' && (!e.sectionPath || e.sectionPath === ''),
);

const bySlug = new Map();
for (const c of candidates) {
  if (!bySlug.has(c.slug)) bySlug.set(c.slug, []);
  bySlug.get(c.slug).push(c);
}

function extractFrontmatterDescription(md) {
  const m = md.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return null;
  const dm = m[1].match(/^description:\s*(.+)$/m);
  return dm ? dm[1].trim().replace(/^['"]|['"]$/g, '') : null;
}

function extractFirstParagraph(md) {
  const body = md.replace(/^---\n[\s\S]*?\n---\n/, '').trim();
  const firstNonEmpty = body.split('\n\n').find((p) => p.trim().length > 0);
  if (!firstNonEmpty) return null;
  if (firstNonEmpty.startsWith('#')) return null;
  return firstNonEmpty.trim();
}

function normalizeForCompare(s) {
  return s ? s.replace(/[\s、。]/g, '').toLowerCase() : '';
}

let hits = 0;
let misses = 0;
for (const [slug, entries] of bySlug) {
  const path = join(REPO_ROOT, 'src/content/docs', slug + '.md');
  if (!existsSync(path)) {
    console.log(`[MISS] ${slug}: file not found`);
    misses++;
    continue;
  }
  const md = readFileSync(path, 'utf8');
  const desc = extractFrontmatterDescription(md);
  const para = extractFirstParagraph(md);
  const descN = normalizeForCompare(desc);
  const paraN = normalizeForCompare(para);
  const dupRatio =
    descN.length > 0 && paraN.length > 0
      ? Math.max(
          descN.length / Math.max(paraN.length, 1),
          paraN.length / Math.max(descN.length, 1),
        )
      : 0;
  const match = descN === paraN || (descN.length > 20 && descN === paraN.slice(0, descN.length));
  if (match) {
    hits++;
    console.log(`[HIT] ${slug} (${entries.length} entries)`);
    console.log(`  desc: ${desc?.slice(0, 80)}...`);
    console.log(`  para: ${para?.slice(0, 80)}...`);
  } else {
    console.log(`[REVIEW] ${slug} (${entries.length} entries)`);
    console.log(`  desc: ${desc?.slice(0, 80)}`);
    console.log(`  para: ${para?.slice(0, 80)}`);
  }
}

console.log(`\nTotal: ${bySlug.size} slugs, ${candidates.length} entries`);
console.log(`HITs (auto-removable): ${hits}`);
console.log(`REVIEWs (manual check needed): ${bySlug.size - hits - misses}`);
```

- [ ] **Step 2: スクリプト実行で対象リストを生成**

```bash
node scripts/phase1/enumerate_preface_duplicates.mjs > /tmp/phase1-1-targets.txt
cat /tmp/phase1-1-targets.txt | head -80
```

- [ ] **Step 3: commit enumerate スクリプト**

```bash
git add scripts/phase1/enumerate_preface_duplicates.mjs
git commit -m "chore: Phase 1.1 preface 重複候補列挙スクリプト"
```

### Task 1.1.2: HIT (自動判定可能) slug の preface 段落を削除

**Files:**
- Modify: `src/content/docs/**/*.md` (HIT 候補の各ファイル)

- [ ] **Step 1: HIT の各 slug に対し、frontmatter description と一致する先頭段落を削除**

WRITING_GUIDE §Source-First に従い、frontmatter を残し、直後の重複段落のみを削除する。削除後は空行 2 つ以上が連続する場合、1 つの空行に整える。

ファイルごとの修正例 (`editing-tests/generating-a-random-value.md`):

```diff
 ---
 title: ランダムな値の生成
 description: ランダムな値を生成してテストで使用する方法を説明します。
 ---

-ランダムな値を生成してテストで使用する方法を説明します。
-
 ## 概要
```

- [ ] **Step 2: lint 確認**

```bash
npm run lint:docs 2>&1 | tail -10
```

- [ ] **Step 3: 修正済みファイルを逐次 commit**

複数 slug を 1 commit に含める場合、slug 数を commit message に明記。

```bash
git add src/content/docs/<slug>.md
git commit -m "docs: Phase 1.1 preface 重複削除 (<slug>)"
```

実装者は enumerate 結果の HIT リスト (最大 27 slug) を順に処理。1 commit あたり 3-5 slug が目安。

### Task 1.1.3: REVIEW (手動判定) slug を個別確認

**Files:**
- Modify: enumerate で REVIEW と出た slug

- [ ] **Step 1: 各 REVIEW slug で frontmatter description と preface 段落を並べ、「意味的に重複」かを判定**

重複と判断した場合は Task 1.1.2 と同様に削除。重複ではない場合 (EN 原文にも同内容の段落がある、等) は REVIEW リストから除外し、別 Phase/タスクで処理する旨を `docs/superpowers/specs/2026-04-14-parity-phase1-report.md` に記録。

- [ ] **Step 2: 削除した分を commit**

### Task 1.1.4: baseline 再生成 + 削減確認

- [ ] **Step 1: parity check + baseline 再生成**

```bash
npm run check:parity 2>&1 | tail -20
node scripts/generate_parity_baseline.mjs --rationale="Phase 1.1: preface 重複削除完了"
```

- [ ] **Step 2: 削減件数確認**

```bash
node -e "
const b = require('./parity-baseline.json');
const extras = b.entries.filter(e => e.issueType === 'segment-extra' && (!e.sectionPath || e.sectionPath === ''));
console.log('preface segment-extra 残: ' + extras.length);
"
```

Expected: 大幅減 (35 → 10 以下が目標)。残件は REVIEW で除外したものか、機械判定に漏れたものなので、report に記録して次に進む。

- [ ] **Step 3: commit baseline**

```bash
git add parity-baseline.json
git commit -m "chore: Phase 1.1 完了後の baseline 再生成"
```

### Task 1.1.5: PR 作成

- [ ] **Step 1: PR 作成**

```bash
git push -u origin worktree-phase1-preface

gh pr create --title "fix: Phase 1.1 preface 重複削除 (segment-extra 20-30 件解消)" --body "## Summary

Phase 1.1 として、frontmatter description と内容が重複する preface 段落を削除しました。

- 対象: preface の segment-extra 35 件 / 22 slug (HIT 判定分)
- 解消: segment-extra ~20-30 件 + 派生 section-structure-mismatch

## Test plan

- [x] npm run lint:docs — pass
- [x] npm run check:parity — baseline 再生成後に新規 issue 0
- [x] WRITING_GUIDE §Source-First 契約に準拠

## 参考

- Roadmap: docs/superpowers/specs/2026-04-14-parity-burndown-roadmap.md
- Plan: docs/superpowers/plans/2026-04-14-parity-phase1-pattern-burndown.md (Phase 1.1)
"
```

---

## Phase 1.2: 手順導入文の段落結合 (~20 件)

> **実測:** section-internal `segment-extra` かつ `segmentKind=paragraph` = **20 件**。原本 plan の ~25 件は Phase 0 前の想定値。手順導入文 (`**〜するには:**`) パターンに該当するのはこの 20 件の一部。

### Task 1.2.1: 対象 slug を列挙する

**Files:**
- Create: `scripts/phase1/enumerate_step_intro_split.mjs`

**Context:** EN 原文の `:fa-arrow-right:` 付き太字テキストは手順導入文 (`**XXXするには:**`) として JA に落ちるべきだが、EN 1 段落が JA で 2 段落に分離しているケースを enumerate する。

- [ ] **Step 1: enumerate スクリプトを作成**

```js
// scripts/phase1/enumerate_step_intro_split.mjs
/**
 * Phase 1.2: 手順導入文の段落分離候補を列挙する。
 *
 * EN 原文で `:fa-arrow-right:` 直前の文 + 太字導入文が 1 段落にまとまっている
 * のに、JA で別段落 (空行) で分離されているケース。
 *
 * 判定: JA の segment-extra かつ kind=paragraph で、該当段落の本文が
 *       `**〜するには:**` or `**〜するには：**` 形式で始まる、または
 *       前後の段落に手順 (ordered-list) が続くケースを候補とする。
 *
 * Usage:
 *   node scripts/phase1/enumerate_step_intro_split.mjs
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

const STEP_INTRO_RE = /^\*\*[^*]+(するには|するとき|の手順)[:：]\*\*/;

const paragraphExtras = baseline.entries.filter(
  (e) => e.issueType === 'segment-extra' && e.segmentKind === 'paragraph',
);

for (const entry of paragraphExtras) {
  const path = join(REPO_ROOT, 'src/content/docs', entry.slug + '.md');
  if (!existsSync(path)) continue;
  const md = readFileSync(path, 'utf8');
  // 本文を段落単位に分割し、「**〜するには:**」形式の孤立段落を探す
  const body = md.replace(/^---\n[\s\S]*?\n---\n/, '').trim();
  const paragraphs = body.split('\n\n');
  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i].trim();
    if (STEP_INTRO_RE.test(p) && i > 0) {
      const prev = paragraphs[i - 1].trim();
      // 前段落が平叙文で、直後が手順 (数字のリスト) なら候補
      const next = paragraphs[i + 1]?.trim() ?? '';
      if (/^\d+\.\s/.test(next) || /^[-*]\s/.test(next)) {
        console.log(`[CANDIDATE] ${entry.slug} | section=${entry.sectionPath}`);
        console.log(`  prev: ${prev.slice(0, 60)}`);
        console.log(`  intro: ${p}`);
        console.log(`  next: ${next.slice(0, 60)}`);
      }
    }
  }
}
```

- [ ] **Step 2: enumerate 実行**

```bash
node scripts/phase1/enumerate_step_intro_split.mjs > /tmp/phase1-2-targets.txt
wc -l /tmp/phase1-2-targets.txt
head -40 /tmp/phase1-2-targets.txt
```

- [ ] **Step 3: commit enumerate スクリプト**

```bash
git add scripts/phase1/enumerate_step_intro_split.mjs
git commit -m "chore: Phase 1.2 手順導入文分離候補列挙スクリプト"
```

### Task 1.2.2: 候補 slug で段落を結合

**Files:**
- Modify: enumerate で候補になった slug の各 md ファイル

**Context:** `[前段落文字列]` と `**〜するには:**` の間の空行を削除し、`→` でつなぐ。WRITING_GUIDE §Source-First 契約の推奨形。

- [ ] **Step 1: 各候補 slug で修正**

修正例:

```diff
-ループを使用すると、同じアクションを繰り返せます。
-
-**ループを設定するには:**
+ループを使用すると、同じアクションを繰り返せます。→ **ループを設定するには:**
```

- [ ] **Step 2: lint 確認**

```bash
npm run lint:docs 2>&1 | tail -10
```

- [ ] **Step 3: 逐次 commit**

```bash
git add src/content/docs/<slug>.md
git commit -m "docs: Phase 1.2 手順導入文を前段落に結合 (<slug>)"
```

### Task 1.2.3: baseline 再生成 + PR 作成

- [ ] **Step 1: parity check + baseline 再生成**

```bash
npm run check:parity 2>&1 | tail -15
node scripts/generate_parity_baseline.mjs --rationale="Phase 1.2: 手順導入文結合完了"
git add parity-baseline.json
git commit -m "chore: Phase 1.2 完了後の baseline 再生成"
```

- [ ] **Step 2: PR 作成**

```bash
git push -u origin worktree-phase1-step-intro
gh pr create --title "fix: Phase 1.2 手順導入文の段落結合" --body "## Summary

EN 原文で 1 段落にまとまっている「〜するには:」手順導入文が JA で別段落に分離していたケースを 結合しました。

Plan: docs/superpowers/plans/2026-04-14-parity-phase1-pattern-burndown.md (Phase 1.2)
"
```

---

## Phase 1.3: callout 内番号リスト inline 化 (~75 件)

> **実測:** section-internal `segment-extra` のうち ul-item **47 件** + ol-item **14 件** + callout-body **17 件** = 最大 78 件が理論上のスコープ。原本 plan の ~80 件と概ね一致。実際に callout 内のインライン列挙を展開したケースは EN snapshot との突き合わせで判定。

### Task 1.3.1: 対象 slug を列挙する

**Files:**
- Create: `scripts/phase1/enumerate_callout_list_expansion.mjs`

**Context:** EN `<p>` 内にインラインで `1. x 2. y 3. z` と書かれる callout が、JA で Markdown 番号付きリストに展開されているケースを検出。segment-extra の ul-item / ol-item が callout 内 (sectionPath に callout 識別子がある、または近傍が callout-body) のものが対象。

- [ ] **Step 1: enumerate スクリプト作成**

```js
// scripts/phase1/enumerate_callout_list_expansion.mjs
/**
 * Phase 1.3: callout 内の番号リスト / 箇条書き展開候補を列挙する。
 *
 * 対象: segment-extra in sections で segmentKind が ul-item / ol-item、
 *       かつ該当段落が callout block (`:::warning` 等) の内部にある。
 *
 * 判定: JA ファイルから該当 sectionPath 周辺を読み、`:::` で囲まれた block
 *       内に `- ` or `1. ` の list が連続している場合、候補として出力。
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

const candidates = baseline.entries.filter(
  (e) =>
    e.issueType === 'segment-extra' &&
    (e.segmentKind === 'unordered-list-item' || e.segmentKind === 'ordered-list-item'),
);

const bySlug = new Map();
for (const c of candidates) {
  if (!bySlug.has(c.slug)) bySlug.set(c.slug, new Set());
  bySlug.get(c.slug).add(c.sectionPath);
}

for (const [slug, sections] of bySlug) {
  const path = join(REPO_ROOT, 'src/content/docs', slug + '.md');
  if (!existsSync(path)) continue;
  const md = readFileSync(path, 'utf8');

  // :::<type> ... ::: ブロック内で - や 1. の連続リストを探す
  const calloutBlocks = md.matchAll(/^:::(note|warning|caution|tip|info|danger)[^\n]*\n([\s\S]*?)^:::$/gm);
  for (const block of calloutBlocks) {
    const content = block[2];
    const hasList = /^[-*]\s|^\d+\.\s/m.test(content);
    if (hasList) {
      console.log(`[CANDIDATE] ${slug} | callout type: ${block[1]}`);
      console.log('  content preview:');
      content.split('\n').slice(0, 6).forEach((l) => console.log('    ' + l));
      console.log('');
    }
  }
}
```

- [ ] **Step 2: enumerate 実行**

```bash
node scripts/phase1/enumerate_callout_list_expansion.mjs > /tmp/phase1-3-targets.txt
wc -l /tmp/phase1-3-targets.txt
head -60 /tmp/phase1-3-targets.txt
```

- [ ] **Step 3: commit**

```bash
git add scripts/phase1/enumerate_callout_list_expansion.mjs
git commit -m "chore: Phase 1.3 callout リスト展開候補列挙スクリプト"
```

### Task 1.3.2: 候補 callout を EN 原文と突き合わせて inline 化

**Files:**
- Modify: 各候補 slug の md ファイル

**Context:** 各候補で EN snapshot (`snapshots/en/content/<slug>.html`) を確認し、該当 callout が `<p>` 内インラインで列挙されているなら JA も inline に戻す。EN が実際にリストなら JA のリストはそのまま正しい (baseline から外れる)。

- [ ] **Step 1: 各候補で EN snapshot を確認し、対応を決定**

候補ごとに以下を判断:
- EN が inline (`<p>1. x 2. y</p>`) → JA も inline にする (修正)
- EN がリスト (`<ol><li>x</li>...</ol>`) → JA のリストはそのまま正しい (修正不要、baseline は別の原因)

修正例 (inline 化):

修正前:

```markdown
:::warning
以下の制限があります:
1. 制限 A
2. 制限 B
3. 制限 C
:::
```

修正後:

```markdown
:::warning
以下の制限があります: 1. 制限 A 2. 制限 B 3. 制限 C
:::
```

- [ ] **Step 2: 逐次 commit**

```bash
git add src/content/docs/<slug>.md
git commit -m "docs: Phase 1.3 callout 内番号リストを inline 化 (<slug>)"
```

### Task 1.3.3: baseline 再生成 + PR 作成

- [ ] **Step 1: parity check + baseline 再生成**

```bash
npm run check:parity 2>&1 | tail -15
node scripts/generate_parity_baseline.mjs --rationale="Phase 1.3: callout リスト inline 化完了"
git add parity-baseline.json
git commit -m "chore: Phase 1.3 完了後の baseline 再生成"
```

- [ ] **Step 2: PR 作成**

```bash
git push -u origin worktree-phase1-callout-list
gh pr create --title "fix: Phase 1.3 callout 内番号リストの inline 化" --body "## Summary

EN 原文で `<p>` 内にインライン列挙されている callout 内の番号付き/箇条書きを、JA で Markdown リストに展開していたケースを inline に戻しました。

Plan: docs/superpowers/plans/2026-04-14-parity-phase1-pattern-burndown.md (Phase 1.3)
"
```

---

## Phase 1 総括レポート

### Task 1.4: Phase 1 完了レポート作成

**Files:**
- Create: `docs/superpowers/specs/2026-04-14-parity-phase1-report.md`

- [ ] **Step 1: レポート作成**

3 sub-phase 完了後の baseline を分析し、以下を記載:

```markdown
# Parity Phase 1 — 頻出パターン Burn-down Report

- **Date**: (完了日付)
- **Plan**: docs/superpowers/plans/2026-04-14-parity-phase1-pattern-burndown.md

## 削減結果

| 種別 | Phase 0 後 | Phase 1 後 | 差 |
| --- | --- | --- | --- |
| segment-extra (preface) | 45 | (実測) | (実測) |
| segment-extra (section: ul-item) | 58 | (実測) | (実測) |
| segment-extra (section: ol-item) | 23 | (実測) | (実測) |
| segment-extra (section: paragraph) | 25 | (実測) | (実測) |
| section-structure-mismatch | 86 | (実測) | (実測) |

## Sub-phase 別

- **Phase 1.1** (preface 重複削除): 27 slug → ??? slug 修正、??? entries 解消
- **Phase 1.2** (手順導入文結合): ??? 候補 → ??? 修正、??? entries 解消
- **Phase 1.3** (callout 番号リスト inline): ??? 候補 → ??? 修正、??? entries 解消

## 残件と Phase 2 へのインプット

- REVIEW リストで除外した件数: ???
- Phase 2 で扱う候補 slug: ???
```

- [ ] **Step 2: commit**

```bash
git add docs/superpowers/specs/2026-04-14-parity-phase1-report.md
git commit -m "docs: Phase 1 完了レポート"
```

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-14-parity-phase1-pattern-burndown.md`.

3 sub-phase は並列実行可能。Subagent-Driven で各 sub-phase に別 worktree + fresh subagent を割り当てるのが推奨。
