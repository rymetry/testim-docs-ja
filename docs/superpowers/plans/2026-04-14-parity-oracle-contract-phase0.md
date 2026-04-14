# Parity Oracle Contract — Phase 0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** EN 原文を構造の oracle、JA をその鏡写しとして機械検知可能にする基盤を Phase 0 で揃える。具体的には (1) 4 つのガイドを Invariant 1-5 準拠に改訂、(2) GLOSSARY.md / INVARIANT_TOKENS.md を新設、(3) `parity_normalize.mjs` と `parity_glossary_mask.mjs` を TDD で実装、(4) `source_parity_align.mjs` の fuzzy 分岐を glossary_mask 経由に置換、(5) callout type 集合を 4 レイヤーで統一、(6) `parity-check-status.json` に `debug.maskCoverage` を追加、(7) baseline を再生成し削減レポートを出す。

**Architecture:** 8 フェーズの直列構成。Phase A (ガイド absolute 化) と Phase B (GLOSSARY/INVARIANT_TOKENS 新設) が基盤。Phase C (normalize) と Phase D (glossary_mask) は独立した TDD ループ。Phase E (callout 契約) も独立。Phase F (integration) は C/D/E の成果を align.mjs と check_source_parity.mjs に配線し、`debug.maskCoverage` を emit する。Phase G で baseline 再生成と分析レポート、Phase H で仕上げと PR 準備。各フェーズで RED → GREEN → COMMIT を守る。

**Tech Stack:** Node.js 20, `node:test` + `node:assert/strict`, Astro 6 + `@microflash/remark-callout-directives`, Tailwind v4 (CSS), bespoke EN/JA segment extractors。

**Spec Invariants (本 plan の全タスクが従う不変条件、詳細は spec 第 3 節):**
1. Baseline = 未解決 issue の凍結のみ
2. Mask = issue ではない invariant の説明可能な除外
3. Debug artifact (`parity-check-status.json debug.*`) は gate/baseline/ack から独立
4. Callout type 集合 `{note, caution, warning, info, tip, danger}` で 4 レイヤー統一
5. Residue = バグ（blanket allowlist 禁止）

**File ownership map:**
- `docs/WRITING_GUIDE.md` — Phase A.1 (source-first 絶対化、§133 callout mapping 拡張)、Phase E.5 (caution 行追加)
- `docs/TRANSLATION_GUIDE.md` — Phase A.2 (reader-helpful 削除)
- `docs/PARITY_GUIDE.md` — Phase A.3 (§60 reframe、baseline = bug backlog)、Phase G.4 (Phase 0 完了後の workflow 追記)
- `docs/OPS_DESIGN.md` — Phase A.4 (review cadence → burn-down)
- `docs/GLOSSARY.md` — Phase B.1 (新規)
- `docs/INVARIANT_TOKENS.md` — Phase B.2 (新規)
- `scripts/lib/parity_normalize.mjs` — Phase C (新規)
- `scripts/__tests__/parity_normalize.test.mjs` — Phase C (新規)
- `scripts/lib/parity_glossary_mask.mjs` — Phase D (新規)
- `scripts/__tests__/parity_glossary_mask.test.mjs` — Phase D (新規)
- `astro.config.mjs` — Phase E.1 (caution 追加、success 削除)
- `src/styles/global.css` — Phase E.2 (.callout-caution 追加、.callout-success 削除)
- `scripts/__tests__/callout_contract.test.mjs` — Phase E.3 (新規、4 レイヤー contract)
- `scripts/lib/source_parity_align.mjs` — Phase F.1 (looksUntranslated → glossary_mask 呼び出し)
- `scripts/check_source_parity.mjs` — Phase F.2 (debug.maskCoverage emit)
- `scripts/__tests__/debug_artifact_independence.test.mjs` — Phase F.3 (新規、static grep contract)
- `parity-baseline.json` — Phase G.1 (再生成)
- `docs/superpowers/specs/2026-04-14-parity-oracle-phase0-report.md` — Phase G.2 (新規)
- `scripts/README.md` — Phase H.1 (command 追記)

**Phase 間依存:**

```
A (ガイド絶対化) ──┐
                  │
B (GLOSSARY 新設) ─┼─> C (normalize TDD) ──┐
                  │                       │
                  │                       ├─> F (integration) ─> G (baseline 再生成) ─> H (wrap-up)
                  ├─> D (glossary_mask) ──┤
                  │                       │
                  └─> E (callout 契約) ───┘
```

A/B は独立で先行。C/D は B (GLOSSARY/INVARIANT) を参照。E は C/D と独立 (callout は別レイヤー)。F は C/D/E 全て統合。G は F 後。H は最後。

---

## Phase A: ガイド absolute 化

Spec Invariant 1-5 をガイドにハードコードする。

### Task A.1: WRITING_GUIDE.md line 164 の逃げ道削除

**Files:**
- Modify: `docs/WRITING_GUIDE.md:160-168`

**Context:** spec §3 Invariant 5 (Residue = バグ) に従い「補足説明を追加する場合でも〜」を削除し、「一切追加しない」を absolute に書く。

- [ ] **Step 1: WRITING_GUIDE.md §160 を書き換える**

修正前 (line 160-168):

```markdown
## 🪞 原文準拠ルール（Source-First 構造契約）

`sourceUrl` を持つページは、原文の要約ではなく公開用の日本語版として整備してください。

- 原文の本文段落、番号手順、箇条書き、callout は省略しない
- 原文にコンテンツ画像がある場合、ローカルに保存するだけでなく本文中の対応位置へ埋め込む
- 画像数だけでなく、画像の配置順も原文に合わせる
- 原文にしかない重要な UI ラベル、確認メッセージ、遷移先画面は本文に明記する
- 補足説明を追加する場合でも、原文の内容が先に満たされていることを前提にする
```

修正後:

```markdown
## 🪞 原文準拠ルール（Source-First 構造契約）

`sourceUrl` を持つページは、原文の要約ではなく原文の**構造を鏡写しにした**日本語版として整備してください。

- 原文の本文段落、番号手順、箇条書き、callout は省略しない
- 原文にコンテンツ画像がある場合、ローカルに保存するだけでなく本文中の対応位置へ埋め込む
- 画像数だけでなく、画像の配置順も原文に合わせる
- 原文にしかない重要な UI ラベル、確認メッセージ、遷移先画面は本文に明記する
- **原文にない段落・callout・リスト項目・見出し・補足説明は一切追加しない**（JA 独自構造の禁止）
- 唯一の許容される content 差分は次の 2 つのみ:
  1. Testim 用語の英語維持（[GLOSSARY.md](./GLOSSARY.md) の entry に従う）
  2. URL のローカライズ書き換え（`help.testim.io/docs/X` ↔ `/docs/X`、`docs.tricentis.com/testim/content/...` → canonical、[PARITY_GUIDE.md](./PARITY_GUIDE.md) 参照）
- 上記 2 つに該当しない英語 prose が JA に残っていれば **検知系がバグとして報告する**。その場合は翻訳する
```

- [ ] **Step 2: commit**

```bash
git add docs/WRITING_GUIDE.md
git commit -m "docs: WRITING_GUIDE source-first 契約を absolute 化"
```

### Task A.2: WRITING_GUIDE.md §214 "JA のみのセクション" を strengthen

**Files:**
- Modify: `docs/WRITING_GUIDE.md:214-223`

- [ ] **Step 1: §214 を書き換える**

修正前:

```markdown
### JA のみのセクション

- EN に存在しないセクション（「次のステップ」「関連リンク」等の JA 独自追加）は source parity のために削除する
- 「原文から意図的に除外するコンテンツ」（下記）は例外
```

修正後:

```markdown
### JA のみのセクション / 独自 callout（絶対禁止）

- EN に存在しない **セクション / 段落 / callout / リスト項目 / 見出し** は source parity のために削除する
- 「読者に親切な補足」「JA 読者向けの注記」等の追加は禁止。翻訳ニュアンスは構造を変えずに文内で表現する
- 例外は §「原文から意図的に除外するコンテンツ」のみ（Tricentis からの削除依頼ページ）
```

- [ ] **Step 2: commit**

```bash
git add docs/WRITING_GUIDE.md
git commit -m "docs: WRITING_GUIDE JA 独自構造の禁止を absolute 化"
```

### Task A.3: TRANSLATION_GUIDE.md reader-helpful 記述の削除

**Files:**
- Modify: `docs/TRANSLATION_GUIDE.md`

**Context:** reader-helpful addition を示唆する記述が残っていれば削除し、「自然な日本語は構造内で実現する」を明示する。

- [ ] **Step 1: 該当箇所を grep**

```bash
grep -n "補足\|読者に\|親切\|分かりやすく\|理解しやすく\|追加\|注記" docs/TRANSLATION_GUIDE.md | head -30
```

- [ ] **Step 2: 該当記述を修正**

見つかった「補足してもよい」「読者に分かりやすく追加してもよい」系の記述を削除または「構造を変えずに文内で表現する」に置換する。具体的な置換は grep 結果に応じて判断。

TRANSLATION_GUIDE.md 冒頭 (目的節付近) に以下を追記:

```markdown
## ⚖️ 翻訳の構造契約

翻訳ニュアンス（自然さ、丁寧語、語順等）は **原文の構造を変えずに** 文内で実現してください。

- NG: EN 原文の 1 段落を JA で 2 段落に分けて説明する
- NG: EN 原文にない補助 callout を JA で追加する
- NG: EN 原文の番号リストを JA で箇条書きに変換する
- OK: EN 原文の 1 段落を JA の 1 段落として訳し、その中で自然な語順にする
- OK: Testim 用語は英語のまま維持する（[GLOSSARY.md](./GLOSSARY.md) 参照）

構造契約の詳細は [WRITING_GUIDE.md §Source-First 構造契約](./WRITING_GUIDE.md) を参照。
```

- [ ] **Step 3: commit**

```bash
git add docs/TRANSLATION_GUIDE.md
git commit -m "docs: TRANSLATION_GUIDE reader-helpful 追加の禁止を明文化"
```

### Task A.4: PARITY_GUIDE.md §60 "EN artifact は baseline 管理" の reframe

**Files:**
- Modify: `docs/PARITY_GUIDE.md:60-70` および §99 残債優先順位節

- [ ] **Step 1: §60-70 を書き換える**

修正後の書き込み内容:

```markdown
## EN ソース side の既知 artifact

EN upstream に由来する artifact の扱い（Phase 0 以降の契約）:

| artifact 種別 | 対応層 | 例 |
| ------ | -------- | ------ |
| Page 全体が壊れている | `scripts/lib/source_sync_exclusions.mjs` (page-level update-lock + 復旧 probe) | `testops/testops-version-control/pull-requests` |
| URL / link token の差異 | `scripts/lib/parity_normalize.mjs` (URL rewrite ルール) | `help.testim.io/docs/X` ↔ `/docs/X` |
| 英語 UI 用語・機能名 | `docs/GLOSSARY.md` + `parity_glossary_mask.mjs` | `Visual Editor`, `Pre-run hook` |
| 英語 invariant pattern (CLI flag、キーボードショートカット等) | `docs/INVARIANT_TOKENS.md` + `parity_glossary_mask.mjs` | `--project-id`, `Shift+S` |
| EN-only の壊れた token (display text と href 不一致等)、小規模 artifact | 現時点では baseline に残る (Phase 0 後に件数を見て micro-exclusion 層の必要性を判断) | `creating-your-first-codeless-test` の google.com |

**重要**: baseline は「未解決 issue の凍結」のみ。上記 normalize / mask / page-level exclusion で吸収される artifact は baseline の対象ではない。blanket に "方針だから baseline に入れる" は禁止。
```

- [ ] **Step 2: §99 "残債の返済優先順位" を "bug backlog の返済優先順位" に reframe**

修正後:

```markdown
## Bug backlog の返済優先順位

Phase 0 後の baseline は「未解決バグの backlog」になる。Phase 1 以降で以下の優先順位で返済する:

| 種別 | 対応内容 | 難易度 |
| ------ | ---------- | -------- |
| segment-extra (preface 重複、手順導入文分離、callout 番号リスト展開) | パターン化されており機械的修正可能 | 低 |
| segment-missing | EN にあって JA にない段落の翻訳復元 | 中 |
| segment-untranslated (glossary mask 後の残り) | 本物の翻訳抜け。翻訳が必要 | 中 |
| section-structure-mismatch | 上記の派生、自動解消されることが多い | — |
| segment-token-gap (URL normalize 後の残り) | CLI フラグ・内部リンクの欠落。ピンポイント修正 | 低 |
| segment-inconclusive | tokenless-near-tie 等。自動判定の限界。手動確認 | 高 |

Top 2 大物ファイルとロングテール (1-3 件ファイル 69 ファイル) はバッチ処理で返済する。
```

- [ ] **Step 3: commit**

```bash
git add docs/PARITY_GUIDE.md
git commit -m "docs: PARITY_GUIDE EN artifact 管理を baseline から責務レイヤーへ reframe"
```

### Task A.5: OPS_DESIGN.md review cadence の更新

**Files:**
- Modify: `docs/OPS_DESIGN.md` (§Baseline 運用ルール 周辺、line 387-)

- [ ] **Step 1: 該当節に Phase 0 後の運用を追記**

`### Baseline 運用ルール` に以下を追加:

```markdown
### Phase 0 後の baseline 運用（2026-04-14 以降）

baseline は bug backlog として運用する:

- 新規 issue は原則として baseline に追加しない。修正するか、glossary / normalize / page-level exclusion のいずれかで説明可能に除外する
- `reviewAfter` フィールドは既存 entry の互換性のため残すが、新規 entry では不要（Phase 4 で schema から削除予定）
- Quarterly review は「方針再検討」ではなく「残 backlog の burn-down 進捗確認」として実施
- 再生成手順: `npm run check:parity` と `node scripts/generate_parity_baseline.mjs`
```

- [ ] **Step 2: commit**

```bash
git add docs/OPS_DESIGN.md
git commit -m "docs: OPS_DESIGN Phase 0 後の baseline 運用 (bug backlog) を明文化"
```

---

## Phase B: GLOSSARY / INVARIANT_TOKENS 新設

### Task B.1: docs/GLOSSARY.md 新設

**Files:**
- Create: `docs/GLOSSARY.md`

**Context:** WRITING_GUIDE.md §253 の Testim 用語表を昇格 + 拡張。masker が読む canonical source にする。

- [ ] **Step 1: GLOSSARY.md を作成**

```markdown
# Testim Docs JA 用語集（GLOSSARY）

本ファイルは **翻訳者と検知系 (`scripts/lib/parity_glossary_mask.mjs`) が参照する canonical な用語集** です。ここに登録された用語は英語のまま維持され、`segment-untranslated` 検知から除外されます。

登録基準:
- Testim / Tricentis の固有名詞（製品名・機能名・画面名）
- 広く通用する英語 UI ラベルで、日本語化すると逆に混乱を招くもの
- CLI コマンド名・設定キー名

登録手順:
1. 以下のカテゴリ配下に行を追加する
2. `scripts/lib/parity_glossary_mask.mjs` は起動時に本ファイルをパースするため、再起動で反映される
3. 登録後に `npm run check:parity` で影響を確認する

---

## 製品名 / 会社名

| 用語 | 備考 |
| --- | --- |
| Testim | |
| Testim Automate | |
| Testim Grid | |
| Tricentis | |
| Tricentis Testim | |

## 拡張機能 / IDE

| 用語 | 備考 |
| --- | --- |
| Testim Extension | |
| Tricentis Testim Extension | |
| Testim Visual Editor | |
| Visual Editor | |

## 機能 / 技術名

| 用語 | 備考 |
| --- | --- |
| Visual AI | |
| Smart Locators | |
| Branching | |
| Hooks | |
| Agentic Test Automation | |
| Shared Steps | |
| Groups | |
| Validations | |
| CodeBot | |
| Coding Assistant | |

## 画面 / UI 領域

| 用語 | 備考 |
| --- | --- |
| Test Editor | |
| Project Settings | |
| Test Suite | |
| Test List | |
| Dashboard | |
| Run View | |
| Step Properties | |

## 一般的な技術用語（英語維持）

| 用語 | 備考 |
| --- | --- |
| CLI | Command Line Interface |
| CI | Continuous Integration |
| CI/CD | |
| API | |
| URL | |
| URI | |
| JSON | |
| YAML | |
| XML | |
| HTML | |
| CSS | |
| JavaScript | |
| TypeScript | |
| npm | |
| Node.js | |
```

- [ ] **Step 2: WRITING_GUIDE.md §253 から正本性を GLOSSARY.md に委譲**

`docs/WRITING_GUIDE.md:253` の `## 🏷️ Testim 機能名・製品名・画面名の英語維持` の冒頭に以下を追加:

```markdown
> **正本は [GLOSSARY.md](./GLOSSARY.md) です**。本節は執筆者向けの要約で、detector (`scripts/lib/parity_glossary_mask.mjs`) は GLOSSARY.md のみを参照します。用語追加・更新は GLOSSARY.md に対して行ってください。
```

- [ ] **Step 3: commit**

```bash
git add docs/GLOSSARY.md docs/WRITING_GUIDE.md
git commit -m "docs: GLOSSARY.md を新設、Testim 用語の canonical source として昇格"
```

### Task B.2: docs/INVARIANT_TOKENS.md 新設

**Files:**
- Create: `docs/INVARIANT_TOKENS.md`

**Context:** キーボードショートカット、CLI フラグ、コード等の invariant パターンを正規表現で定義。masker が読む。

- [ ] **Step 1: INVARIANT_TOKENS.md を作成**

````markdown
# Invariant Token Patterns

本ファイルは **JA 内に英語のまま残るべき invariant token のパターン定義** です。`scripts/lib/parity_glossary_mask.mjs` が読み、マッチした token は `segment-untranslated` 検知から除外されます。

各 pattern には:
- `id`: 識別子（debug.maskCoverage で出力される）
- `regex`: マッチ正規表現（JavaScript、`g` flag 推奨）
- `example`: 正しくマッチする例
- `note`: 例外や注意点

登録基準:
- 英語のまま残すべき token で、決定論的に識別できるパターン
- Glossary に個別登録するには数が多すぎる、または動的なもの（バージョン番号・タイムスタンプ等）

---

## keyboard-shortcut

| 項目 | 値 |
| --- | --- |
| id | `keyboard-shortcut` |
| regex | `\b(Ctrl\|Cmd\|Shift\|Alt\|Option\|Meta\|Enter\|Esc\|Escape\|Tab\|Space\|Backspace\|Delete)(\+\w+)+\b` |
| example | `Ctrl+S`, `Shift+Cmd+K`, `Alt+Tab` |
| note | 修飾キー (`Ctrl\|Cmd\|...`) から始まり `+` で連結されるもののみ |

## cli-flag

| 項目 | 値 |
| --- | --- |
| id | `cli-flag` |
| regex | `(?:^\|\s)--?[a-zA-Z][\w-]*(?=\s\|$\|[,;])` |
| example | `--project-id`, `-h`, `--token` |
| note | 既存 `extractInvariantTokens()` と重複するが、glossary mask でも同等にマスクする |

## version-number

| 項目 | 値 |
| --- | --- |
| id | `version-number` |
| regex | `\bv?\d+\.\d+(?:\.\d+)?\b` |
| example | `v1.2.3`, `4.0`, `2.3.1` |

## file-path-or-extension

| 項目 | 値 |
| --- | --- |
| id | `file-path-or-extension` |
| regex | `\b[\w.-]+\.(json\|yml\|yaml\|js\|ts\|mjs\|md\|css\|html\|htm\|sh\|env)\b` |
| example | `package.json`, `.testimrc`, `config.yml` |

## numeric-unit

| 項目 | 値 |
| --- | --- |
| id | `numeric-unit` |
| regex | `\b\d+(?:\.\d+)?\s*(?:ms\|sec\|s\|min\|hr\|px\|em\|rem\|%\|MB\|GB\|KB)\b` |
| example | `30000ms`, `5 sec`, `1024px` |

## env-var

| 項目 | 値 |
| --- | --- |
| id | `env-var` |
| regex | `\b[A-Z][A-Z0-9_]{2,}\b` |
| example | `BASIC_AUTH_ENABLED`, `NODE_ENV` |
| note | 全大文字 + アンダースコア の識別子。3 文字以上で誤検知を避ける |

---

## 登録手順

1. 本ファイルに `##` で新規 pattern の節を追加
2. `id`, `regex`, `example`, `note` を埋める
3. `scripts/__tests__/parity_glossary_mask.test.mjs` に該当 pattern の TDD ケースを追加
4. 実装を追加し、`npm run test` で通るか確認
````

- [ ] **Step 2: commit**

```bash
git add docs/INVARIANT_TOKENS.md
git commit -m "docs: INVARIANT_TOKENS.md を新設、正規表現パターンの canonical source"
```

---

## Phase C: parity_normalize.mjs TDD

### Task C.1: RED — normalize テストファイル作成

**Files:**
- Create: `scripts/__tests__/parity_normalize.test.mjs`
- Create: `scripts/lib/parity_normalize.mjs` (空ファイル)

- [ ] **Step 1: テストファイルを作成**

```js
// scripts/__tests__/parity_normalize.test.mjs
/**
 * parity_normalize — URL rewrite rules for parity comparison.
 *
 * Normalizes URL tokens so that localized-link differences between EN and JA
 * do not generate segment-token-gap issues. Deterministic, bidirectional
 * mapping. No fuzzy logic.
 */

import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';

let normalizeUrlForParity;
let canonicalizeDocsUrl;
let normalizeSegmentTokens;

before(async () => {
  ({ normalizeUrlForParity, canonicalizeDocsUrl, normalizeSegmentTokens } =
    await import('../lib/parity_normalize.mjs'));
});

describe('normalizeUrlForParity — help.testim.io → canonical', () => {
  it('rewrites help.testim.io/docs/X to /docs/X', () => {
    assert.equal(
      normalizeUrlForParity('https://help.testim.io/docs/loops'),
      '/docs/loops',
    );
  });

  it('preserves hash fragment', () => {
    assert.equal(
      normalizeUrlForParity(
        'https://help.testim.io/docs/loops#using-the-loop-iterator-parameter',
      ),
      '/docs/loops#using-the-loop-iterator-parameter',
    );
  });

  it('handles help.testim.io without protocol', () => {
    assert.equal(
      normalizeUrlForParity('help.testim.io/docs/configuration-file'),
      '/docs/configuration-file',
    );
  });
});

describe('canonicalizeDocsUrl — docs.tricentis.com/testim/content/...', () => {
  it('rewrites docs.tricentis.com/testim/content/Topics/Help/X.htm to /docs/X', () => {
    assert.equal(
      canonicalizeDocsUrl(
        'https://docs.tricentis.com/testim/content/Topics/Help/loops.htm',
      ),
      '/docs/loops',
    );
  });

  it('handles nested path /Topics/Help/advanced-editing/loops.htm', () => {
    assert.equal(
      canonicalizeDocsUrl(
        'https://docs.tricentis.com/testim/content/Topics/Help/advanced-editing/loops.htm',
      ),
      '/docs/advanced-editing/loops',
    );
  });
});

describe('normalizeSegmentTokens — applies both rewrites', () => {
  it('returns token set with all URLs normalized', () => {
    const tokens = [
      'https://help.testim.io/docs/loops',
      'https://docs.tricentis.com/testim/content/Topics/Help/hooks.htm',
      '--project-id',
      'Ctrl+S',
    ];
    const result = normalizeSegmentTokens(tokens);
    assert.deepEqual(result.sort(), ['--project-id', '/docs/hooks', '/docs/loops', 'Ctrl+S']);
  });

  it('preserves non-URL tokens unchanged', () => {
    const tokens = ['--token', 'package.json', 'Shift+K'];
    const result = normalizeSegmentTokens(tokens);
    assert.deepEqual(result.sort(), ['--token', 'Shift+K', 'package.json']);
  });

  it('deduplicates when EN and JA produce the same canonical form', () => {
    const enTokens = ['https://help.testim.io/docs/loops'];
    const jaTokens = ['/docs/loops'];
    assert.deepEqual(normalizeSegmentTokens(enTokens), normalizeSegmentTokens(jaTokens));
  });
});

describe('normalizeUrlForParity — passthrough cases', () => {
  it('passes through external URLs unchanged', () => {
    assert.equal(
      normalizeUrlForParity('https://applitools.com/'),
      'https://applitools.com/',
    );
  });

  it('passes through non-URL strings unchanged', () => {
    assert.equal(normalizeUrlForParity('--project-id'), '--project-id');
  });
});
```

- [ ] **Step 2: 空の実装ファイルを作成**

```js
// scripts/lib/parity_normalize.mjs
/**
 * URL rewrite rules for parity comparison.
 *
 * @module parity_normalize
 */

export function normalizeUrlForParity(_url) {
  throw new Error('not implemented');
}

export function canonicalizeDocsUrl(_url) {
  throw new Error('not implemented');
}

export function normalizeSegmentTokens(_tokens) {
  throw new Error('not implemented');
}
```

- [ ] **Step 3: RED verify**

```bash
node --test scripts/__tests__/parity_normalize.test.mjs 2>&1 | head -30
```

Expected: All tests fail with `not implemented`.

- [ ] **Step 4: commit**

```bash
git add scripts/__tests__/parity_normalize.test.mjs scripts/lib/parity_normalize.mjs
git commit -m "test: parity_normalize RED skeleton"
```

### Task C.2: GREEN — normalize 実装

**Files:**
- Modify: `scripts/lib/parity_normalize.mjs`

- [ ] **Step 1: 実装**

```js
// scripts/lib/parity_normalize.mjs
/**
 * URL rewrite rules for parity comparison.
 *
 * Normalizes URL tokens deterministically so that localized-link differences
 * between EN and JA do not generate false segment-token-gap issues.
 *
 * @module parity_normalize
 */

const HELP_TESTIM_RE = /^(?:https?:\/\/)?help\.testim\.io(\/docs\/[^\s)]+)/;
const TRICENTIS_DOCS_RE =
  /^https?:\/\/docs\.tricentis\.com\/testim\/content\/Topics\/Help\/(.+?)\.htm(#[^\s)]*)?$/;

export function normalizeUrlForParity(url) {
  if (typeof url !== 'string' || url.length === 0) return url;

  const helpMatch = url.match(HELP_TESTIM_RE);
  if (helpMatch) return helpMatch[1];

  const tricentisMatch = url.match(TRICENTIS_DOCS_RE);
  if (tricentisMatch) return `/docs/${tricentisMatch[1]}${tricentisMatch[2] ?? ''}`;

  return url;
}

export function canonicalizeDocsUrl(url) {
  return normalizeUrlForParity(url);
}

export function normalizeSegmentTokens(tokens) {
  if (!Array.isArray(tokens)) return [];
  const seen = new Set();
  const out = [];
  for (const t of tokens) {
    const normalized = normalizeUrlForParity(t);
    if (!seen.has(normalized)) {
      seen.add(normalized);
      out.push(normalized);
    }
  }
  return out;
}
```

- [ ] **Step 2: GREEN verify**

```bash
node --test scripts/__tests__/parity_normalize.test.mjs 2>&1 | tail -10
```

Expected: All tests pass.

- [ ] **Step 3: commit**

```bash
git add scripts/lib/parity_normalize.mjs
git commit -m "feat: parity_normalize で help.testim.io と docs.tricentis.com を canonical URL に正規化"
```

---

## Phase D: parity_glossary_mask.mjs TDD

### Task D.1: RED — glossary_mask テストファイル作成

**Files:**
- Create: `scripts/__tests__/parity_glossary_mask.test.mjs`
- Create: `scripts/lib/parity_glossary_mask.mjs` (空)

- [ ] **Step 1: テストファイルを作成**

```js
// scripts/__tests__/parity_glossary_mask.test.mjs
/**
 * parity_glossary_mask — Testim 用語 / invariant pattern のマスキング。
 *
 * GLOSSARY.md + INVARIANT_TOKENS.md を参照し、segment text をマスクする。
 * マスクされた token は issue として上がらない。残る英語 prose は residue = バグ。
 */

import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';

let loadGlossary;
let loadInvariantPatterns;
let maskSegmentText;
let classifySegment;

before(async () => {
  ({ loadGlossary, loadInvariantPatterns, maskSegmentText, classifySegment } =
    await import('../lib/parity_glossary_mask.mjs'));
});

describe('loadGlossary — reads docs/GLOSSARY.md', () => {
  it('returns a Set of canonical terms including Testim and Visual Editor', () => {
    const glossary = loadGlossary();
    assert.ok(glossary instanceof Set);
    assert.ok(glossary.has('Testim'));
    assert.ok(glossary.has('Visual Editor'));
    assert.ok(glossary.has('Test Editor'));
  });
});

describe('loadInvariantPatterns — reads docs/INVARIANT_TOKENS.md', () => {
  it('returns an array of { id, regex } entries', () => {
    const patterns = loadInvariantPatterns();
    assert.ok(Array.isArray(patterns));
    const ids = patterns.map((p) => p.id);
    assert.ok(ids.includes('keyboard-shortcut'));
    assert.ok(ids.includes('cli-flag'));
    for (const p of patterns) {
      assert.ok(p.regex instanceof RegExp);
    }
  });
});

describe('maskSegmentText — glossary match', () => {
  it('masks multi-word glossary term correctly', () => {
    const result = maskSegmentText('The Visual Editor shows step properties.');
    assert.ok(result.maskedText.includes('__GLOSSARY__'));
    const entries = result.masks.map((m) => m.entry);
    assert.ok(entries.includes('Visual Editor'));
  });

  it('masks Testim term at start of sentence', () => {
    const result = maskSegmentText('Testim helps you build tests.');
    const entries = result.masks.map((m) => m.entry);
    assert.ok(entries.includes('Testim'));
  });
});

describe('maskSegmentText — invariant pattern match', () => {
  it('masks keyboard shortcut via invariant pattern', () => {
    const result = maskSegmentText('Press Ctrl+S to save.');
    assert.ok(result.maskedText.includes('__INVARIANT__'));
    const patterns = result.masks.map((m) => m.pattern);
    assert.ok(patterns.includes('keyboard-shortcut'));
  });

  it('masks CLI flag', () => {
    const result = maskSegmentText('Run with --project-id option.');
    const patterns = result.masks.map((m) => m.pattern);
    assert.ok(patterns.includes('cli-flag'));
  });
});

describe('classifySegment — residue detection', () => {
  it('returns isFullyMasked=true when no residue English remains', () => {
    const cls = classifySegment('Testim Visual Editor');
    assert.equal(cls.isFullyMasked, true);
  });

  it('returns isFullyMasked=false when untranslated English prose remains', () => {
    const cls = classifySegment('This is an untranslated description of the feature.');
    assert.equal(cls.isFullyMasked, false);
    assert.ok(typeof cls.residue === 'string');
    assert.ok(cls.residue.length > 0);
  });

  it('returns isFullyMasked=true for pure invariant content', () => {
    const cls = classifySegment('--project-id abc Ctrl+S');
    assert.equal(cls.isFullyMasked, true);
  });

  it('returns isFullyMasked=true for Japanese-only text (no English at all)', () => {
    const cls = classifySegment('これは日本語の段落です。');
    assert.equal(cls.isFullyMasked, true);
  });

  it('detects bug: English prose mixed with glossary term', () => {
    const cls = classifySegment(
      'The Visual Editor is a powerful tool for recording tests.',
    );
    assert.equal(cls.isFullyMasked, false);
    assert.ok(cls.residue.length > 10);
  });
});

describe('maskSegmentText — mask record shape', () => {
  it('mask record includes source, entry OR pattern, span (start/end)', () => {
    const result = maskSegmentText('Use the Visual Editor to edit.');
    assert.ok(result.masks.length > 0);
    for (const m of result.masks) {
      assert.ok(['glossary', 'invariant-pattern'].includes(m.source));
      assert.ok(typeof m.span === 'object');
      assert.ok(typeof m.span.start === 'number');
      assert.ok(typeof m.span.end === 'number');
      assert.ok(m.span.end > m.span.start);
    }
  });
});
```

- [ ] **Step 2: 空の実装ファイルを作成**

```js
// scripts/lib/parity_glossary_mask.mjs
/**
 * Glossary + invariant pattern masker for parity detection.
 *
 * @module parity_glossary_mask
 */

export function loadGlossary() {
  throw new Error('not implemented');
}

export function loadInvariantPatterns() {
  throw new Error('not implemented');
}

export function maskSegmentText(_text) {
  throw new Error('not implemented');
}

export function classifySegment(_text) {
  throw new Error('not implemented');
}
```

- [ ] **Step 3: RED verify**

```bash
node --test scripts/__tests__/parity_glossary_mask.test.mjs 2>&1 | head -30
```

Expected: All tests fail.

- [ ] **Step 4: commit**

```bash
git add scripts/__tests__/parity_glossary_mask.test.mjs scripts/lib/parity_glossary_mask.mjs
git commit -m "test: parity_glossary_mask RED skeleton"
```

### Task D.2: GREEN — glossary loader 実装

**Files:**
- Modify: `scripts/lib/parity_glossary_mask.mjs`

- [ ] **Step 1: `loadGlossary()` と `loadInvariantPatterns()` を実装**

```js
// scripts/lib/parity_glossary_mask.mjs
/**
 * Glossary + invariant pattern masker for parity detection.
 *
 * Reads docs/GLOSSARY.md and docs/INVARIANT_TOKENS.md, masks segment text
 * against the union of glossary terms and invariant patterns. Returns both
 * masked text and a per-match record (source, entry/pattern, span) for
 * debug.maskCoverage emission.
 *
 * @module parity_glossary_mask
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, '../..');

const GLOSSARY_PATH = join(REPO_ROOT, 'docs/GLOSSARY.md');
const INVARIANT_PATH = join(REPO_ROOT, 'docs/INVARIANT_TOKENS.md');

let glossaryCache = null;
let patternsCache = null;

/**
 * Parses docs/GLOSSARY.md and returns a Set of canonical terms.
 * Extracts leading table-cell text from any "| term | ... |" row under any
 * `## ` heading, ignoring backtick-wrapped code cells and header separators.
 */
export function loadGlossary() {
  if (glossaryCache) return glossaryCache;
  const md = readFileSync(GLOSSARY_PATH, 'utf8');
  const terms = new Set();
  const lines = md.split('\n');
  let inTable = false;
  let skipSeparator = false;
  for (const line of lines) {
    if (line.startsWith('## ')) {
      inTable = false;
      continue;
    }
    if (line.startsWith('|') && line.includes('|')) {
      if (!inTable) {
        inTable = true;
        skipSeparator = true;
        continue; // header row
      }
      if (skipSeparator) {
        skipSeparator = false;
        continue; // separator row
      }
      const cells = line.split('|').map((c) => c.trim());
      const raw = cells[1] ?? '';
      if (!raw) continue;
      const term = raw.replace(/^`|`$/g, '').trim();
      if (term.length > 0) terms.add(term);
    } else {
      inTable = false;
    }
  }
  glossaryCache = terms;
  return terms;
}

/**
 * Parses docs/INVARIANT_TOKENS.md and returns [{ id, regex }] for each pattern.
 * Expects sections named `## <id>` with a table containing `id` / `regex` rows.
 */
export function loadInvariantPatterns() {
  if (patternsCache) return patternsCache;
  const md = readFileSync(INVARIANT_PATH, 'utf8');
  const patterns = [];
  const sections = md.split(/^## /m).slice(1);
  for (const section of sections) {
    const firstLine = section.split('\n')[0].trim();
    if (!firstLine || firstLine === '登録手順') continue;
    const id = firstLine;
    const regexMatch = section.match(/\|\s*regex\s*\|\s*`(.+?)`\s*\|/);
    if (!regexMatch) continue;
    try {
      const regex = new RegExp(regexMatch[1], 'g');
      patterns.push({ id, regex });
    } catch {
      // invalid regex — skip (will be caught by tests)
    }
  }
  patternsCache = patterns;
  return patterns;
}

// Test 用 cache クリア
export function __clearCaches() {
  glossaryCache = null;
  patternsCache = null;
}

export function maskSegmentText(_text) {
  throw new Error('not implemented');
}

export function classifySegment(_text) {
  throw new Error('not implemented');
}
```

- [ ] **Step 2: loader テスト部分だけ GREEN verify**

```bash
node --test scripts/__tests__/parity_glossary_mask.test.mjs --test-name-pattern="loadGlossary|loadInvariantPatterns" 2>&1 | tail -10
```

Expected: loader テストが pass。他はまだ fail。

- [ ] **Step 3: commit**

```bash
git add scripts/lib/parity_glossary_mask.mjs
git commit -m "feat: parity_glossary_mask loader (GLOSSARY/INVARIANT_TOKENS parser) 実装"
```

### Task D.3: GREEN — maskSegmentText / classifySegment 実装

**Files:**
- Modify: `scripts/lib/parity_glossary_mask.mjs`

- [ ] **Step 1: `maskSegmentText()` と `classifySegment()` を実装**

既存 stub (`throw new Error('not implemented')`) を置換:

```js
const GLOSSARY_PLACEHOLDER = '__GLOSSARY__';
const INVARIANT_PLACEHOLDER = '__INVARIANT__';

/**
 * Mask glossary terms and invariant patterns in text, returning both the
 * masked string and a list of mask records.
 *
 * Process order: longest glossary terms first (to handle multi-word matches
 * before single-word substrings), then invariant patterns applied to remainder.
 */
export function maskSegmentText(text) {
  if (typeof text !== 'string' || text.length === 0) {
    return { maskedText: text, masks: [] };
  }

  const glossary = loadGlossary();
  const patterns = loadInvariantPatterns();
  const masks = [];

  const sortedTerms = [...glossary].sort((a, b) => b.length - a.length);

  let masked = text;
  for (const term of sortedTerms) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp('\\b' + escaped + '\\b', 'g');
    for (const match of masked.matchAll(re)) {
      masks.push({
        source: 'glossary',
        entry: term,
        span: { start: match.index, end: match.index + match[0].length },
      });
    }
    masked = masked.replace(re, GLOSSARY_PLACEHOLDER);
  }

  for (const { id, regex } of patterns) {
    const localRe = new RegExp(regex.source, regex.flags);
    for (const match of masked.matchAll(localRe)) {
      if (match[0].length === 0) continue;
      masks.push({
        source: 'invariant-pattern',
        pattern: id,
        span: { start: match.index, end: match.index + match[0].length },
      });
    }
    masked = masked.replace(new RegExp(regex.source, regex.flags), INVARIANT_PLACEHOLDER);
  }

  return { maskedText: masked, masks };
}

const RESIDUE_MIN_WORDS = 3;
const RESIDUE_MIN_LENGTH = 15;
const CJK_RE = /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf\uff00-\uffef]/;

/**
 * After masking, decide whether the remaining text is (a) fully covered
 * (glossary + invariant + CJK only, no English prose) or (b) contains
 * untranslated English prose (= a bug).
 */
export function classifySegment(text) {
  if (typeof text !== 'string' || text.length === 0) {
    return { isFullyMasked: true, residue: '' };
  }

  // ASCII 英字が全くなければ翻訳の問題はない
  const stripped = text.trim();
  const hasAscii = /[a-zA-Z]/.test(stripped);
  if (!hasAscii) {
    return { isFullyMasked: true, residue: '' };
  }

  const { maskedText } = maskSegmentText(text);

  // Placeholder と inline code / URLs / backticks を除去して residue を見る
  const residue = maskedText
    .replace(new RegExp(GLOSSARY_PLACEHOLDER, 'g'), ' ')
    .replace(new RegExp(INVARIANT_PLACEHOLDER, 'g'), ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/\/docs\/\S+/g, ' ')
    .trim();

  const englishPortion = residue.replace(CJK_RE, ' ').trim();
  if (englishPortion.length < RESIDUE_MIN_LENGTH) {
    return { isFullyMasked: true, residue: '' };
  }
  const words = englishPortion.split(/\s+/).filter((w) => /[a-z]/i.test(w));
  if (words.length < RESIDUE_MIN_WORDS) {
    return { isFullyMasked: true, residue: '' };
  }

  return { isFullyMasked: false, residue: englishPortion };
}
```

- [ ] **Step 2: 全テスト GREEN verify**

```bash
node --test scripts/__tests__/parity_glossary_mask.test.mjs 2>&1 | tail -10
```

Expected: All tests pass.

- [ ] **Step 3: commit**

```bash
git add scripts/lib/parity_glossary_mask.mjs
git commit -m "feat: parity_glossary_mask maskSegmentText と classifySegment 実装"
```

---

## Phase E: Callout 契約整合

### Task E.1: RED — callout contract test 作成

**Files:**
- Create: `scripts/__tests__/callout_contract.test.mjs`

**Context:** 4 レイヤー (EN extractor / JA extractor / renderer / WRITING_GUIDE mapping) の callout type 集合が `{note, caution, warning, info, tip, danger}` に一致することを静的に検証する。

- [ ] **Step 1: contract test 作成**

```js
// scripts/__tests__/callout_contract.test.mjs
/**
 * Callout contract test — 4 レイヤーの callout type 集合が一致することを pin する。
 *
 * Layer 1: EN extractor (scripts/lib/source_parity_segments_en.mjs)
 *          CALLOUT_CLASS_RE で認識する class
 * Layer 2: JA extractor (scripts/lib/source_parity_segments_ja.mjs)
 *          CALLOUT_OPEN_RE で認識する :::type
 * Layer 3: Renderer (astro.config.mjs)
 *          remarkCalloutDirectives.callouts の keys
 * Layer 4: WRITING_GUIDE.md §133 callout mapping table
 *
 * 期待値: {note, caution, warning, info, tip, danger} 6 種。
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, '../..');

const EXPECTED = new Set(['note', 'caution', 'warning', 'info', 'tip', 'danger']);

function extractAlternationFromRegex(path, regexSource) {
  const content = readFileSync(path, 'utf8');
  const match = content.match(regexSource);
  if (!match) throw new Error('Pattern not found in ' + path);
  return match[1]
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean);
}

describe('callout contract — 4 レイヤーで type 集合が一致する', () => {
  it('Layer 1 (EN extractor): CALLOUT_CLASS_RE matches expected set', () => {
    const types = extractAlternationFromRegex(
      join(REPO_ROOT, 'scripts/lib/source_parity_segments_en.mjs'),
      /CALLOUT_CLASS_RE\s*=\s*\/\\b\(([^)]+)\)\\b\//,
    );
    assert.deepEqual(new Set(types), EXPECTED);
  });

  it('Layer 2 (JA extractor): CALLOUT_OPEN_RE matches expected set', () => {
    const types = extractAlternationFromRegex(
      join(REPO_ROOT, 'scripts/lib/source_parity_segments_ja.mjs'),
      /CALLOUT_OPEN_RE\s*=\s*\/\^:::\(([^)]+)\)/,
    );
    assert.deepEqual(new Set(types), EXPECTED);
  });

  it('Layer 3 (renderer astro.config.mjs): callouts keys match expected set', () => {
    const content = readFileSync(join(REPO_ROOT, 'astro.config.mjs'), 'utf8');
    const calloutsBlock = content.match(/callouts:\s*\{([\s\S]+?)\n\s+\},\s*\n\s*\},/);
    assert.ok(calloutsBlock, 'callouts block not found in astro.config.mjs');
    const keys = [];
    for (const m of calloutsBlock[1].matchAll(/^\s+(\w+):\s*\{/gm)) {
      keys.push(m[1]);
    }
    assert.deepEqual(new Set(keys), EXPECTED);
  });

  it('Layer 4 (WRITING_GUIDE §133): mapping table JA type column matches expected set', () => {
    const content = readFileSync(join(REPO_ROOT, 'docs/WRITING_GUIDE.md'), 'utf8');
    const section = content.match(
      /### 原文 blockquote → JA callout 変換マッピング[\s\S]+?\n\n([\s\S]+?)\n\n/,
    );
    assert.ok(section, 'callout mapping section not found');
    const tableRows = section[1].split('\n').filter((l) => l.startsWith('|') && !l.includes('---'));
    const types = new Set();
    for (const row of tableRows.slice(1)) {
      const cells = row.split('|').map((c) => c.trim());
      const jaType = (cells[2] ?? '').replace(/`/g, '').replace(/:::/g, '');
      if (EXPECTED.has(jaType)) types.add(jaType);
    }
    assert.deepEqual(types, EXPECTED);
  });
});
```

- [ ] **Step 2: RED verify**

```bash
node --test scripts/__tests__/callout_contract.test.mjs 2>&1 | tail -15
```

Expected:
- Layer 1 (EN extractor) PASS (既に `note|caution|warning|info|tip|danger`)
- Layer 2 (JA extractor) PASS (既に同)
- Layer 3 (renderer) FAIL (現在は `tip|warning|success|danger|note|info` で `caution` 欠け、`success` 余剰)
- Layer 4 (WRITING_GUIDE) FAIL (現 mapping 表は caution 行未定義)

- [ ] **Step 3: commit**

```bash
git add scripts/__tests__/callout_contract.test.mjs
git commit -m "test: callout contract test で 4 レイヤーの type 集合一致を pin (RED)"
```

### Task E.2: GREEN — renderer (astro.config.mjs) に caution 追加、success 削除

**Files:**
- Modify: `astro.config.mjs:66-91`

- [ ] **Step 1: `success` ブロックを削除、`caution` ブロックを追加**

既存 `success:` ブロックを削除し、代わりに `caution:` ブロックを追加する。実装時の注意:

- caution の hint (SVG) は既存 warning の hint をそのままコピー
- caution の title は `'警告'` とする (warning は `'注意'` のまま)
- 並び順は `tip, warning, caution, danger, note, info` になるよう配置

```js
          callouts: {
            tip: { /* 既存の tip ブロック */ },
            warning: { /* 既存の warning ブロック (title: '注意') */ },
            // caution は warning と CSS alias。将来 visual 差別化する場合は
            // hint/title を独立させる。
            caution: {
              title: '警告',
              hint: '<svg ... warning の hint と同一 SVG ...>',
            },
            danger: { /* 既存 */ },
            note: { /* 既存 */ },
            info: { /* 既存 */ },
          },
```

既存の success ブロック (title: '推奨', hint の緑 checkmark SVG) は完全削除。

- [ ] **Step 2: Layer 3 test GREEN verify**

```bash
node --test scripts/__tests__/callout_contract.test.mjs --test-name-pattern="Layer 3" 2>&1 | tail -5
```

Expected: PASS.

- [ ] **Step 3: commit**

```bash
git add astro.config.mjs
git commit -m "feat: astro.config.mjs callout に caution 追加、success 削除"
```

### Task E.3: GREEN — CSS に .callout-caution 追加、.callout-success 削除

**Files:**
- Modify: `src/styles/global.css:395-440`

- [ ] **Step 1: `.callout-success` 関連を削除、`.callout-caution` を `.callout-warning` と selector group で alias**

修正前 (line 402-419 付近):

```css
  .docs-prose .callout-warning {
    @apply border-amber-200 bg-amber-50/70 text-amber-900;
  }
  .docs-prose .callout-warning .callout-hint {
    @apply text-amber-600;
  }

  .docs-prose .callout-success {
    @apply border-emerald-200 bg-emerald-50/70 text-emerald-900;
  }
  .docs-prose .callout-success .callout-hint {
    @apply text-emerald-600;
  }

  .docs-prose .callout-danger {
```

修正後:

```css
  .docs-prose .callout-warning,
  .docs-prose .callout-caution {
    @apply border-amber-200 bg-amber-50/70 text-amber-900;
  }
  .docs-prose .callout-warning .callout-hint,
  .docs-prose .callout-caution .callout-hint {
    @apply text-amber-600;
  }

  .docs-prose .callout-danger {
```

(`.callout-success` ブロック全削除、`.callout-caution` は `.callout-warning` と selector group)

- [ ] **Step 2: build で CSS が通ることを確認**

```bash
npm run build 2>&1 | tail -20
```

Expected: build pass。

- [ ] **Step 3: commit**

```bash
git add src/styles/global.css
git commit -m "feat: CSS に .callout-caution を warning alias として追加、.callout-success 削除"
```

### Task E.4: GREEN — WRITING_GUIDE §133 mapping に caution 行追加

**Files:**
- Modify: `docs/WRITING_GUIDE.md:133-148`

- [ ] **Step 1: mapping 表に caution 行を追加**

修正後:

```markdown
### 原文 blockquote → JA callout 変換マッピング

EN 原文の callout (blockquote または `<div class="...">`) を JA の `:::` callout に変換する際は、以下のマッピングに従ってください：

| EN 原文パターン                     | JA callout タイプ | 備考                                                                             |
| ----------------------------------- | ----------------- | -------------------------------------------------------------------------------- |
| `📘` / `<div class="note">`          | `:::note`         | 情報提供                                                                         |
| `🚧` / `<div class="warning">`       | `:::warning`      | 注意喚起                                                                         |
| `<div class="caution">` + 警告       | `:::caution`      | MadCap Flare の caution。当面は `:::warning` と同じ見た目（CSS alias、Phase 0）  |
| `💡` / `<div class="tip">`           | `:::tip`          | 便利情報                                                                         |
| `❗` / `⚠️` / `<div class="danger">`   | `:::danger`       | 重大な警告                                                                       |
| `ℹ️` / `<div class="info">`          | `:::info`         | 補足                                                                             |
```

- [ ] **Step 2: Layer 4 test GREEN verify**

```bash
node --test scripts/__tests__/callout_contract.test.mjs 2>&1 | tail -15
```

Expected: 全 4 レイヤー PASS.

- [ ] **Step 3: commit**

```bash
git add docs/WRITING_GUIDE.md
git commit -m "docs: WRITING_GUIDE §133 callout mapping に caution 行追加"
```

---

## Phase F: align.mjs 統合 + debug artifact

### Task F.1: RED — align.mjs が glossary_mask を使うことを pin するテスト

**Files:**
- Modify: `scripts/__tests__/source_parity_align.test.mjs` (末尾に新 describe 追加)

**Context:** JA segment text が英語のみ (翻訳忘れ) なら segment-untranslated として emit され、Testim 用語 + 日本語で構成されていれば emit されないことを pin する。

- [ ] **Step 1: test 追加**

既存 `scripts/__tests__/source_parity_align.test.mjs` の末尾に追加:

```js
describe('alignSegments — glossary_mask 統合 (Phase 0)', () => {
  it('JA segment が glossary 用語 + 日本語なら segment-untranslated を emit しない', () => {
    const enSegs = [
      createSegment({
        sectionPath: 'Overview',
        kind: 'heading',
        segmentIndex: 0,
        rawText: 'Overview',
      }),
      createSegment({
        sectionPath: 'Overview',
        kind: 'paragraph',
        segmentIndex: 0,
        rawText: 'Open Test Editor to start.',
      }),
    ];
    const jaSegs = [
      createSegment({
        sectionPath: 'Overview',
        kind: 'heading',
        segmentIndex: 0,
        rawText: 'Overview',
      }),
      createSegment({
        sectionPath: 'Overview',
        kind: 'paragraph',
        segmentIndex: 0,
        rawText: 'Test Editor を開いて開始します。',
      }),
    ];
    const result = alignSegments(enSegs, jaSegs);
    const untranslatedDiffs = result.diffs.filter(
      (d) => d.type === 'segment-untranslated',
    );
    assert.equal(
      untranslatedDiffs.length,
      0,
      'glossary term + CJK の混在は untranslated として emit しないべき',
    );
  });

  it('JA segment が英語 prose のまま残っていれば segment-untranslated を emit する', () => {
    const enSegs = [
      createSegment({
        sectionPath: 'Overview',
        kind: 'heading',
        segmentIndex: 0,
        rawText: 'Overview',
      }),
      createSegment({
        sectionPath: 'Overview',
        kind: 'paragraph',
        segmentIndex: 0,
        rawText: 'Open Test Editor to start recording tests.',
      }),
    ];
    const jaSegs = [
      createSegment({
        sectionPath: 'Overview',
        kind: 'heading',
        segmentIndex: 0,
        rawText: 'Overview',
      }),
      createSegment({
        sectionPath: 'Overview',
        kind: 'paragraph',
        segmentIndex: 0,
        rawText: 'Open Test Editor to start recording tests.',
      }),
    ];
    const result = alignSegments(enSegs, jaSegs);
    const untranslatedDiffs = result.diffs.filter(
      (d) => d.type === 'segment-untranslated',
    );
    assert.ok(
      untranslatedDiffs.length >= 1,
      '英語 prose が残る場合は untranslated として emit するべき',
    );
  });
});
```

- [ ] **Step 2: RED verify**

```bash
node --test scripts/__tests__/source_parity_align.test.mjs --test-name-pattern="glossary_mask 統合" 2>&1 | tail -10
```

Expected: 挙動確認。現在の `looksUntranslated` は CJK 検出で早期 return するため、1 つ目の test は現状で pass する可能性が高い。2 つ目の test も現状で pass する可能性が高い。この場合でも、**実装変更後も pass し続けることを保証する pin として機能**する。

- [ ] **Step 3: commit**

```bash
git add scripts/__tests__/source_parity_align.test.mjs
git commit -m "test: align.mjs が glossary_mask 経由で untranslated 判定することを pin"
```

### Task F.2: GREEN — align.mjs の looksUntranslated を glossary_mask 経由に書き換え

**Files:**
- Modify: `scripts/lib/source_parity_align.mjs:257-277` (`looksUntranslated`)
- Modify: `scripts/lib/source_parity_align.mjs:1-40` (import 追加)

- [ ] **Step 1: import 追加**

ファイル冒頭の import ブロックに追加:

```js
import { classifySegment } from './parity_glossary_mask.mjs';
```

- [ ] **Step 2: `looksUntranslated()` を書き換え**

修正後:

```js
/**
 * JA segment の正規化 text が、未翻訳の英語 prose を含むかを判定する。
 *
 * Phase 0: fuzzy なヒューリスティックではなく、`parity_glossary_mask.classifySegment`
 * を呼び、glossary / invariant pattern でマスクされた後に残る residue が
 * 存在するかで判定する。この関数は内部的に glossary_mask に委譲する薄い
 * wrapper だが、旧 API shape を保って align 側の呼び出しコードを変えない。
 *
 * @param {string} text JA 側の正規化済み text (`createSegment` 由来)
 */
function looksUntranslated(text) {
  if (typeof text !== 'string') return false;
  const cls = classifySegment(text);
  return !cls.isFullyMasked;
}
```

既存の MIN_UNTRANSLATED_PROSE_LENGTH / MIN_UNTRANSLATED_WORD_COUNT / CJK_RE 定数は、他で使われていなければ削除。使われていれば残す (grep で確認)。

- [ ] **Step 3: 既存テスト GREEN verify**

```bash
node --test scripts/__tests__/source_parity_align.test.mjs 2>&1 | tail -20
```

Expected: All tests pass (既存の align test + Phase 0 新規 test)。既存 test が 1-2 件 fail する場合、それは「fuzzy 判定から決定論判定への振る舞い変化」であり、case-by-case で判断して必要なら test を新契約に合わせて更新する。

- [ ] **Step 4: commit**

```bash
git add scripts/lib/source_parity_align.mjs
git commit -m "refactor: align.mjs looksUntranslated を glossary_mask 経由に置換"
```

### Task F.3: GREEN — align.mjs で token-gap 比較前に normalize 適用

**Files:**
- Modify: `scripts/lib/source_parity_align.mjs:572-585` (token-gap 比較部分)
- Modify: `scripts/lib/source_parity_align.mjs:1-40` (import 追加)

- [ ] **Step 1: import 追加**

```js
import { normalizeSegmentTokens } from './parity_normalize.mjs';
```

- [ ] **Step 2: token-gap 比較部分で normalize 適用**

修正前 (line 572-585 付近):

```js
  for (const [enIdx, jaIdx] of matched) {
    const enSeg = enBody[enIdx];
    const jaSeg = jaBody[jaIdx];

    const jaTokenSet = new Set(jaSeg.tokensInvariant ?? []);
    const enTokens = enSeg.tokensInvariant ?? [];
    const missingTokens = [];
    for (const token of enTokens) {
      if (!jaTokenSet.has(token)) missingTokens.push(token);
    }
    if (missingTokens.length > 0) {
      diffs.push(diffTokenGap(enSection, enSeg, jaSeg, enIdx, jaIdx, missingTokens));
    }
```

修正後:

```js
  for (const [enIdx, jaIdx] of matched) {
    const enSeg = enBody[enIdx];
    const jaSeg = jaBody[jaIdx];

    // Phase 0: localized-link の差異を token-gap として誤検知しないよう、
    // 比較前に URL を canonical 化する。
    const jaTokenSet = new Set(normalizeSegmentTokens(jaSeg.tokensInvariant ?? []));
    const enTokens = normalizeSegmentTokens(enSeg.tokensInvariant ?? []);
    const missingTokens = [];
    for (const token of enTokens) {
      if (!jaTokenSet.has(token)) missingTokens.push(token);
    }
    if (missingTokens.length > 0) {
      diffs.push(diffTokenGap(enSection, enSeg, jaSeg, enIdx, jaIdx, missingTokens));
    }
```

- [ ] **Step 3: 既存 test 確認**

```bash
node --test scripts/__tests__/source_parity_align.test.mjs 2>&1 | tail -15
```

Expected: all pass.

- [ ] **Step 4: commit**

```bash
git add scripts/lib/source_parity_align.mjs
git commit -m "refactor: align.mjs token-gap 比較前に normalize_tokens 適用"
```

### Task F.4: GREEN — glossary_mask に collector helper を追加

**Files:**
- Modify: `scripts/lib/parity_glossary_mask.mjs`

**Context:** check_source_parity.mjs が一回の run で segment ごとの mask 結果を集約するための helper を追加する。

- [ ] **Step 1: `createMaskCoverage()` を export**

`scripts/lib/parity_glossary_mask.mjs` の末尾に追加:

```js
/**
 * Mask coverage collector — 各 segment の mask 結果を集約する stateful
 * utility。check_source_parity.mjs が run 単位で create し、align 側から
 * record で記録、run 終了後に toJSON() で debug.maskCoverage を得る。
 */
export function createMaskCoverage() {
  const entries = [];
  const byGlossary = new Map();
  const byPattern = new Map();
  return {
    record({ slug, segmentKind, sectionPath, masks }) {
      if (!Array.isArray(masks) || masks.length === 0) return;
      entries.push({ slug, segmentKind, sectionPath, masks });
      for (const m of masks) {
        if (m.source === 'glossary') {
          byGlossary.set(m.entry, (byGlossary.get(m.entry) ?? 0) + 1);
        } else if (m.source === 'invariant-pattern') {
          byPattern.set(m.pattern, (byPattern.get(m.pattern) ?? 0) + 1);
        }
      }
    },
    toJSON() {
      return {
        maskedSegments: entries,
        summary: {
          segmentsMasked: entries.length,
          byGlossaryEntry: Object.fromEntries(byGlossary),
          byInvariantPattern: Object.fromEntries(byPattern),
        },
      };
    },
  };
}
```

- [ ] **Step 2: test 追加 (`scripts/__tests__/parity_glossary_mask.test.mjs` の末尾に)**

```js
describe('createMaskCoverage — run-level collector', () => {
  it('records masks and returns summary counters', async () => {
    const { createMaskCoverage } = await import('../lib/parity_glossary_mask.mjs');
    const cov = createMaskCoverage();
    cov.record({
      slug: 'test/slug',
      segmentKind: 'paragraph',
      sectionPath: 'Overview',
      masks: [
        { source: 'glossary', entry: 'Visual Editor', span: { start: 0, end: 13 } },
        { source: 'invariant-pattern', pattern: 'cli-flag', span: { start: 20, end: 32 } },
      ],
    });
    const json = cov.toJSON();
    assert.equal(json.summary.segmentsMasked, 1);
    assert.equal(json.summary.byGlossaryEntry['Visual Editor'], 1);
    assert.equal(json.summary.byInvariantPattern['cli-flag'], 1);
    assert.equal(json.maskedSegments.length, 1);
  });

  it('returns empty summary when no masks recorded', async () => {
    const { createMaskCoverage } = await import('../lib/parity_glossary_mask.mjs');
    const cov = createMaskCoverage();
    const json = cov.toJSON();
    assert.equal(json.summary.segmentsMasked, 0);
  });
});
```

- [ ] **Step 3: GREEN verify**

```bash
node --test scripts/__tests__/parity_glossary_mask.test.mjs --test-name-pattern="createMaskCoverage" 2>&1 | tail -5
```

Expected: PASS.

- [ ] **Step 4: commit**

```bash
git add scripts/lib/parity_glossary_mask.mjs scripts/__tests__/parity_glossary_mask.test.mjs
git commit -m "feat: parity_glossary_mask に createMaskCoverage collector を追加"
```

### Task F.5: GREEN — check_source_parity.mjs から debug.maskCoverage を emit

**Files:**
- Modify: `scripts/check_source_parity.mjs`
- Modify: `scripts/lib/source_parity_align.mjs` (必要に応じて `onMask` callback 受け付け)

**Context:** 各 JA segment が `looksUntranslated()` を通るときに mask 結果を外へ渡し、check_source_parity.mjs 側で集約して `parity-check-status.json` の `debug.maskCoverage` に書く。

- [ ] **Step 1: check_source_parity.mjs の main 関数を編集**

まず main 関数の位置と現状を確認:

```bash
grep -n "main\|async function\|writeFileSync\|parity-check-status" scripts/check_source_parity.mjs | head -20
```

以下を追加する:

1. `scripts/lib/parity_glossary_mask.mjs` から `createMaskCoverage` と `maskSegmentText` を import
2. Run 開始時に `const maskCoverage = createMaskCoverage()` を作成
3. 各 page の処理で JA segment を受け取り、`maskSegmentText(jaSeg.textNorm)` を呼んで `maskCoverage.record(...)` に集約
4. 最終出力オブジェクトに `debug: { maskCoverage: maskCoverage.toJSON() }` を追加
5. `writeFileSync(outputPath, JSON.stringify(result, null, 2))` で書き出す既存コードを debug field 含めて更新

実装時の注意: 既存 `OUTPUT_PATH` の書き込みパスを変更しない。debug field は optional なので existing consumer が壊れない。

- [ ] **Step 2: `outputPath` テスト注入 hook を追加**

テストから temp file に書き出せるよう、main 関数に optional パラメータを追加:

```js
async function main({ outputPath = OUTPUT_PATH } = {}) {
  // ... 既存の処理 ...
}

// default export でテストからも呼べるように
export default main;
```

`process.argv` 経由の CLI 実行は既存挙動を維持。

- [ ] **Step 3: debug.maskCoverage を emit する integration test**

`scripts/__tests__/debug_mask_coverage.test.mjs` を新規作成:

```js
// scripts/__tests__/debug_mask_coverage.test.mjs
/**
 * parity-check-status.json の debug.maskCoverage 出力契約 (Spec Invariant 3).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('parity-check-status.json — debug.maskCoverage emit', () => {
  it('output includes debug.maskCoverage with summary counters', async () => {
    const { default: main } = await import('../check_source_parity.mjs');
    const tmp = mkdtempSync(join(tmpdir(), 'parity-debug-'));
    const outputPath = join(tmp, 'parity-check-status.json');
    try {
      await main({ outputPath });
      const status = JSON.parse(readFileSync(outputPath, 'utf8'));
      assert.ok(status.debug, 'debug namespace should exist');
      assert.ok(status.debug.maskCoverage, 'debug.maskCoverage should exist');
      const summary = status.debug.maskCoverage.summary;
      assert.ok(summary && typeof summary === 'object');
      assert.equal(typeof summary.segmentsMasked, 'number');
      assert.ok(summary.byGlossaryEntry && typeof summary.byGlossaryEntry === 'object');
      assert.ok(summary.byInvariantPattern && typeof summary.byInvariantPattern === 'object');
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});
```

- [ ] **Step 4: GREEN verify**

```bash
node --test scripts/__tests__/debug_mask_coverage.test.mjs 2>&1 | tail -10
```

Expected: PASS.

- [ ] **Step 5: commit**

```bash
git add scripts/check_source_parity.mjs scripts/__tests__/debug_mask_coverage.test.mjs
git commit -m "feat: check_source_parity で parity-check-status.json に debug.maskCoverage を emit"
```

### Task F.6: debug artifact 独立性の static contract test

**Files:**
- Create: `scripts/__tests__/debug_artifact_independence.test.mjs`

**Context:** gate logic / baseline 生成 / ack 判定が `debug.*` を参照していないことを静的 grep で保証する (Spec Invariant 3)。

- [ ] **Step 1: test 作成**

```js
// scripts/__tests__/debug_artifact_independence.test.mjs
/**
 * Spec Invariant 3: gate logic / baseline 生成 / ack 判定は parity-check-status.json
 * の debug.* namespace を一切読まない。
 *
 * 静的 grep based contract test。
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, '../..');

const GATE_SENSITIVE_FILES = [
  'scripts/lib/source_parity_baseline.mjs',
  'scripts/lib/source_parity_acknowledgements.mjs',
  'scripts/lib/source_parity_summary.mjs',
  'scripts/lib/source_parity_issue_state.mjs',
  'scripts/generate_parity_baseline.mjs',
];

const FORBIDDEN_PATTERNS = [
  /\.debug\.maskCoverage/,
  /status\.debug\b/,
  /parityCheckStatus\.debug/,
  /['"`]debug['"`]\s*\]/,
  /from\s+['"]\.\/parity_glossary_mask\.mjs['"]/,
  /from\s+['"]\.\/parity_normalize\.mjs['"]/,
];

describe('debug artifact independence (Spec Invariant 3)', () => {
  for (const file of GATE_SENSITIVE_FILES) {
    it(file + ' does not read debug.* namespace or import mask/normalize modules', () => {
      const content = readFileSync(join(REPO_ROOT, file), 'utf8');
      for (const pattern of FORBIDDEN_PATTERNS) {
        const match = content.match(pattern);
        assert.equal(
          match,
          null,
          file + ' contains forbidden reference: ' + (match?.[0] ?? ''),
        );
      }
    });
  }
});
```

- [ ] **Step 2: test verify**

```bash
node --test scripts/__tests__/debug_artifact_independence.test.mjs 2>&1 | tail -10
```

Expected: PASS (既存コードに debug 参照はない想定)。

- [ ] **Step 3: commit**

```bash
git add scripts/__tests__/debug_artifact_independence.test.mjs
git commit -m "test: debug artifact 独立性の static contract test 追加"
```

---

## Phase G: Baseline 再生成 + 分析レポート

### Task G.1: baseline 再生成

**Files:**
- Modify: `parity-baseline.json`

- [ ] **Step 1: full parity check 実行**

```bash
npm run check:parity 2>&1 | tail -30
```

Expected: 実行完了。segment-untranslated と segment-token-gap の一部が glossary/normalize で吸収されて issue 数減少。

- [ ] **Step 2: baseline 再生成**

```bash
node scripts/generate_parity_baseline.mjs --rationale="Phase 0 cutover: glossary_mask + normalize 有効化後の再凍結"
```

- [ ] **Step 3: 件数確認**

```bash
node -e "
const b = require('./parity-baseline.json');
const counts = {};
for (const e of b.entries) counts[e.issueType] = (counts[e.issueType] || 0) + 1;
console.log('Total:', b.entries.length);
console.log(JSON.stringify(counts, null, 2));
"
```

Expected: 622 から減少（目標 450-500 程度）。実値を次タスクのレポートに記録。

- [ ] **Step 4: commit**

```bash
git add parity-baseline.json
git commit -m "chore: Phase 0 cutover 後の baseline 再生成 (glossary_mask + normalize 有効化)"
```

### Task G.2: Phase 0 完了レポート作成

**Files:**
- Create: `docs/superpowers/specs/2026-04-14-parity-oracle-phase0-report.md`

- [ ] **Step 1: レポート作成**

Task G.1 の件数と Phase 0 cutover 前 (622 件) を比較し、以下を含むレポートを書く:

```markdown
# Parity Oracle Contract — Phase 0 Cutover Report

- **Date**: 2026-04-14
- **Plan**: `docs/superpowers/plans/2026-04-14-parity-oracle-contract-phase0.md`
- **Spec**: `docs/superpowers/specs/2026-04-14-parity-oracle-contract-design.md`

## Baseline 削減結果

| issueType | Phase 0 前 | Phase 0 後 | 差 |
| --- | --- | --- | --- |
| segment-extra | 193 | (実測) | (実測) |
| segment-missing | 136 | (実測) | (実測) |
| segment-untranslated | 146 | (実測) | (実測) |
| section-structure-mismatch | 86 | (実測) | (実測) |
| segment-token-gap | 49 | (実測) | (実測) |
| segment-inconclusive | 11 | (実測) | (実測) |
| segment-order-mismatch | 1 | (実測) | (実測) |
| **合計** | **622** | **(実測)** | **(実測)** |

## 吸収された内訳 (debug.maskCoverage から)

- Glossary entry 吸収: (実測) segments
  - Top 5 entries: (実測)
- Invariant pattern 吸収: (実測) segments
  - keyboard-shortcut: (実測)
  - cli-flag: (実測)
  - その他
- URL normalize 吸収: (実測) token-gap

## 残 baseline の分類 (Phase 1 以降の burn-down 対象)

- Top 5 slug by entry count: (実測)
- 頻出パターン (preface 重複 / 手順導入文分離 / callout 番号リスト展開) の件数: (実測)

## 発見事項

- (Phase 0 実装中に気づいた未解決論点、EN upstream 側の追加 artifact 等をここに記録)

## Phase 1 へのインプット

- 機械的バッチ修正可能なパターンの内訳
- micro-exclusion 層の必要性判断（残 baseline が 10 件以下なら不要、それ以上なら検討）
```

値は Task G.1 の実測で埋める。debug.maskCoverage は `parity-check-status.json` から抽出。

- [ ] **Step 2: commit**

```bash
git add docs/superpowers/specs/2026-04-14-parity-oracle-phase0-report.md
git commit -m "docs: Phase 0 cutover 完了レポート (baseline 削減結果 + 残 bug backlog 分析)"
```

---

## Phase H: 仕上げと PR 準備

### Task H.1: scripts/README.md 更新

**Files:**
- Modify: `scripts/README.md`

- [ ] **Step 1: 新規 library の使い方を追記**

`scripts/README.md` の該当節に以下を追加:

```markdown
### Parity detection — glossary mask と URL normalize (Phase 0, 2026-04-14 以降)

- `scripts/lib/parity_glossary_mask.mjs`: `docs/GLOSSARY.md` と `docs/INVARIANT_TOKENS.md` を読み、segment text を Testim 用語 + invariant pattern でマスクする
- `scripts/lib/parity_normalize.mjs`: URL rewrite (`help.testim.io/docs/X` ↔ `/docs/X`, `docs.tricentis.com/testim/content/...htm` → `/docs/...`) を適用する
- `scripts/check_source_parity.mjs` は mask 結果を `parity-check-status.json` の `debug.maskCoverage` に出力する（**gate / baseline / ack は debug.* を読まない**契約）
- 新しい Testim 用語を追加する場合は `docs/GLOSSARY.md`、新しい invariant pattern を追加する場合は `docs/INVARIANT_TOKENS.md` を編集し、対応する test を `scripts/__tests__/parity_glossary_mask.test.mjs` に追加する
```

- [ ] **Step 2: commit**

```bash
git add scripts/README.md
git commit -m "docs: scripts/README に parity_glossary_mask と parity_normalize の使い方を追記"
```

### Task H.2: 全テスト + lint + build の最終確認

- [ ] **Step 1: 全テスト実行**

```bash
npm run test 2>&1 | tail -30
```

Expected: All pass。失敗があれば原因を特定して個別修正コミット。

- [ ] **Step 2: lint 実行**

```bash
npm run lint 2>&1 | tail -20
```

Expected: All pass。

- [ ] **Step 3: build 実行**

```bash
npm run build 2>&1 | tail -20
```

Expected: build success。

- [ ] **Step 4: parity check 実行**

```bash
npm run check:parity 2>&1 | tail -20
```

Expected: baseline と一致、新規 issue なし。

### Task H.3: PR 作成

- [ ] **Step 1: 変更サマリ確認**

```bash
git log --oneline main..HEAD
git diff main...HEAD --stat | tail -30
```

- [ ] **Step 2: PR 作成**

```bash
git push -u origin worktree-kind-waddling-axolotl

gh pr create --title "feat: Parity Oracle Contract Phase 0 — glossary mask + URL normalize + callout 契約統一" --body "$(cat <<'EOF'
## Summary

EN 原文を構造の oracle、JA をその鏡写しとして機械検知可能にする基盤 Phase 0 を実装しました。

- **ガイド絶対化**: WRITING_GUIDE / TRANSLATION_GUIDE / PARITY_GUIDE / OPS_DESIGN を 5 Spec Invariants に準拠した記述へ改訂
- **GLOSSARY.md / INVARIANT_TOKENS.md 新設**: Testim 用語と invariant pattern の canonical source
- **parity_glossary_mask.mjs 新規**: GLOSSARY + INVARIANT_TOKENS を読み segment text をマスク、残 residue が issue
- **parity_normalize.mjs 新規**: help.testim.io / docs.tricentis.com の URL canonical 化
- **align.mjs 改変**: looksUntranslated を glossary_mask 経由に置換、token-gap 比較前に normalize 適用
- **callout 契約統一**: 4 レイヤーで `{note, caution, warning, info, tip, danger}` に一致 (caution を renderer に alias 追加、success dead type 削除)
- **debug.maskCoverage**: parity-check-status.json の debug.* に mask 集約を出力（gate/baseline/ack は参照しない契約）
- **baseline 再生成**: 622 → (実測) 件（Phase 0 report 参照）

## Spec Invariants (本 PR で確定)

1. Baseline = 未解決 issue の凍結のみ
2. Mask = issue ではない invariant の説明可能な除外
3. Debug artifact (parity-check-status.json debug.*) は gate/baseline/ack から独立
4. Callout type 集合 {note, caution, warning, info, tip, danger} で 4 レイヤー統一
5. Residue = バグ（blanket allowlist 禁止）

## Test plan

- [x] npm run test — all pass (new: parity_normalize, parity_glossary_mask, callout_contract, debug_mask_coverage, debug_artifact_independence)
- [x] npm run lint — all pass
- [x] npm run build — build success
- [x] npm run check:parity — baseline 再生成後に新規 issue 0
- [x] parity-check-status.json に debug.maskCoverage が出力される
- [x] callout contract test で 4 レイヤー一致を確認

## Out-of-scope (Phase 1 以降)

- Content fixes (132 slug の individual 修正)
- Micro-exclusion layer
- Visual callout redesign
- baseline schema 簡素化 (reviewAfter 削除等)

## 参考ドキュメント

- Spec: docs/superpowers/specs/2026-04-14-parity-oracle-contract-design.md
- Plan: docs/superpowers/plans/2026-04-14-parity-oracle-contract-phase0.md
- Report: docs/superpowers/specs/2026-04-14-parity-oracle-phase0-report.md
EOF
)"
```

- [ ] **Step 3: PR URL を記録**

---

## Self-Review Checklist

Phase 0 の plan を書き終えたら以下を確認する:

- [ ] **Spec 全項目カバー**: spec §5 の Success Criteria 11 項目に対応する task が全て存在するか
- [ ] **Placeholder 無し**: "TBD" / "implement later" / "similar to Task N" が含まれていないか
- [ ] **Type consistency**: `maskSegmentText` / `classifySegment` / `loadGlossary` 等の関数名が Task 間で一致しているか
- [ ] **コード全量**: test/impl を含む各 step に実コードが書かれているか
- [ ] **コマンド exact**: 実行コマンドと expected output が具体的か
- [ ] **Commit frequency**: 各 Task の最後に commit step があるか
- [ ] **依存順**: Phase A/B → C/D/E → F → G → H の順が守られているか

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-14-parity-oracle-contract-phase0.md`. Two execution options:

1. **Subagent-Driven (recommended)** — dispatch fresh subagent per task, review between tasks, fast iteration
2. **Inline Execution** — execute tasks in this session using executing-plans, batch execution with checkpoints

どちらで進めますか？
