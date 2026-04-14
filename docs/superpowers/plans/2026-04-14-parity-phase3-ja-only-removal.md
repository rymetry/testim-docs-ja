# Parity Phase 3 — JA 独自 callout の削除 Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development with careful quality gate. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `segment-extra` かつ `segmentKind = callout-body` の 29 件 (20 slug) — JA が読者のために独自追加した callout を削除する。翻訳ニュアンスが重要な callout は「情報を本文に統合 + callout 削除」で構造契約を守りながら情報保存する。

**Architecture:** 1-2 PR。並列エージェント委任可能だが、**単純削除ではなく情報保存を伴う判断が必要**なため、個別レビュー必須。

**Tech Stack:** 既存パイプライン + 翻訳者 / LLM レビュー。

**Prerequisite:** Phase 2 がマージ済み、baseline が最新の状態。

**File ownership map:**
- `src/content/docs/**/*.md` — 20 slug
- `scripts/phase3/enumerate_ja_only_callouts.mjs` — 対象 enumerate (新規)
- `docs/superpowers/specs/2026-04-14-parity-phase3-report.md` — 完了レポート (新規)

**Worktree:** `worktree-phase3-ja-only`

---

## Task 3.1: 対象 callout の enumerate + 分類

**Files:**
- Create: `scripts/phase3/enumerate_ja_only_callouts.mjs`

- [ ] **Step 1: enumerate スクリプト作成**

```js
// scripts/phase3/enumerate_ja_only_callouts.mjs
/**
 * Phase 3: segment-extra callout-body を JA ファイルから抽出し、
 * callout 本文を表示して分類 (削除可能 vs 情報統合が必要) しやすくする。
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

const calloutExtras = baseline.entries.filter(
  (e) => e.issueType === 'segment-extra' && e.segmentKind === 'callout-body',
);

const bySlug = new Map();
for (const e of calloutExtras) {
  if (!bySlug.has(e.slug)) bySlug.set(e.slug, []);
  bySlug.get(e.slug).push(e);
}

console.log('# Phase 3 JA-only callouts\n');
console.log('Total: ' + calloutExtras.length + ' entries in ' + bySlug.size + ' slugs\n');

for (const [slug, entries] of [...bySlug.entries()].sort((a, b) => b[1].length - a[1].length)) {
  const path = join(REPO_ROOT, 'src/content/docs', slug + '.md');
  if (!existsSync(path)) continue;
  const md = readFileSync(path, 'utf8');
  console.log('## ' + slug + ' (' + entries.length + ' entries)');
  console.log('- JA file: src/content/docs/' + slug + '.md');
  console.log('- EN snapshot: snapshots/en/content/' + slug + '.html');
  // Extract all callout blocks to show candidates
  const calloutBlocks = [...md.matchAll(/^:::(note|warning|caution|tip|info|danger)[^\n]*\n([\s\S]*?)^:::$/gm)];
  console.log('  total callouts in JA file: ' + calloutBlocks.length);
  calloutBlocks.slice(0, 5).forEach((b, i) => {
    const preview = b[2].trim().split('\n').slice(0, 2).join(' ').slice(0, 80);
    console.log('    [' + i + '] :::' + b[1] + ' | ' + preview + '...');
  });
  console.log('');
}
```

- [ ] **Step 2: enumerate 実行**

```bash
node scripts/phase3/enumerate_ja_only_callouts.mjs > /tmp/phase3-targets.md
head -60 /tmp/phase3-targets.md
```

- [ ] **Step 3: commit**

```bash
git add scripts/phase3/enumerate_ja_only_callouts.mjs
git commit -m "chore: Phase 3 JA 独自 callout 候補列挙スクリプト"
```

## Task 3.2: 各 slug で EN 突き合わせ + 判断

**Files:**
- Modify: 各 slug の md (20 files)

**Context:** 各 slug の JA callout を EN snapshot と照合し、以下の 3 つに分類:

1. **純粋な JA 独自 callout** (EN に対応する情報が本文にもない) → 削除
2. **EN 本文にある情報を JA で callout 化** → callout を解除して本文に戻す (構造を EN に合わせる)
3. **情報保存が必須** (読者への重要注記) → 本文に段落として統合、callout は削除

- [ ] **Step 1: 各 slug を個別処理**

各 slug で以下を実行:

1. `snapshots/en/content/<slug>.html` を読み、該当箇所 (entry の `sectionPath`) を確認
2. JA の callout 内容を確認
3. 3 分類のいずれかに決定
4. 分類に応じて修正:
   - 分類 1: callout ブロックを削除 (`:::type\n...\n:::` の行をまとめて削除、空行整理)
   - 分類 2: `:::type` と `:::` の行を削除、本文はそのまま
   - 分類 3: callout を本文段落に統合 (文章を再構成して本文に溶かす)

**Top 5 slug** (入口):
- `recording-tests/recording-a-mobile-test/recording-a-vmg-mobile-test` (5 entries)
- `administration/secrets` (3)
- `advanced-editing/validations/html-attribute-validation` (2)
- `getting-started/creating-your-first-mobile-test-in-testim-visual-editor` (2)
- `recording-tests/recording-a-mobile-test` (2)

各 slug で上記 3 分類を適用。

- [ ] **Step 2: 修正後の検証**

```bash
npm run check:parity -- --slug=<slug> 2>&1 | tail -10
```

Expected: 該当 slug の segment-extra (callout-body) が 0、新規 issue も 0。

- [ ] **Step 3: 逐次 commit**

```bash
git add src/content/docs/<slug>.md
git commit -m "fix: Phase 3 JA 独自 callout を削除 (<slug>, <分類番号>)"
```

## Task 3.3: 分類判断に迷うケースの review

**Files:**
- Modify: review で判断した slug

**Context:** 分類 2 / 3 (情報保存を伴う削除) の判断は翻訳品質に影響するので、codex review を挟むのが推奨。

- [ ] **Step 1: 分類 3 (情報統合) を適用した slug を codex にレビュー依頼**

各 commit 前に以下で review:

```bash
# codex skill を使用
# "Phase 3 Task 3.3: JA 独自 callout を本文に統合した修正を review してください。情報欠落がないか、翻訳品質が維持されているかを確認"
```

- [ ] **Step 2: codex 指摘を反映した修正を commit**

## Task 3.4: baseline 再生成 + PR 作成

- [ ] **Step 1: baseline 再生成**

```bash
npm run check:parity 2>&1 | tail -15
node scripts/generate_parity_baseline.mjs --rationale="Phase 3: JA 独自 callout 削除完了"
git add parity-baseline.json
git commit -m "chore: Phase 3 完了後の baseline 再生成"
```

- [ ] **Step 2: PR 作成**

```bash
git push -u origin worktree-phase3-ja-only
gh pr create --title "fix: Phase 3 JA 独自 callout の削除 (29 entries, 20 slug)" --body "## Summary

EN 原文にない JA 独自の callout を 3 分類 (純粋削除 / callout 解除 / 本文統合) に従って整理しました。

- 純粋な JA 独自 callout 削除: ??? 件
- EN 本文にある内容を callout 化していたもの (callout 解除): ??? 件
- 情報保存のため本文統合: ??? 件

Plan: docs/superpowers/plans/2026-04-14-parity-phase3-ja-only-removal.md
"
```

## Task 3.5: Phase 3 完了レポート

**Files:**
- Create: `docs/superpowers/specs/2026-04-14-parity-phase3-report.md`

- [ ] **Step 1: レポート作成**

```markdown
# Parity Phase 3 — JA 独自 callout 削除 Report

## 削減結果

| 種別 | Phase 2 後 | Phase 3 後 | 差 |
| --- | --- | --- | --- |
| segment-extra (callout-body) | 29 | (実測) | (実測) |
| segment-extra total | ??? | (実測) | (実測) |

## 分類別修正件数

- 分類 1 (純粋削除): ??? 件
- 分類 2 (callout 解除): ??? 件
- 分類 3 (本文統合): ??? 件

## Phase 4 へのインプット

- 残 baseline (全種類合計): ??? 件
- Phase 4 対象 (inconclusive, order-mismatch): ??? 件
- schema 簡素化の対象フィールド棚卸し済み
```

- [ ] **Step 2: commit**

```bash
git add docs/superpowers/specs/2026-04-14-parity-phase3-report.md
git commit -m "docs: Phase 3 完了レポート"
```

---

## Execution Handoff

Phase 3 は分類判断を伴うため、並列化より codex review を挟んだ確実な進行が推奨。1 worktree で順次処理が安全。
