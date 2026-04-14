# パリティ残債ガイド

パリティチェック（`npm run check:parity`）で検出される EN/JA 構造差分の修正手順と頻出パターンをまとめたガイドです。

## 頻出パターン

### 1. preface に frontmatter description の重複段落（segment-extra）

多くのファイルで、frontmatter の `description` と同内容の短い要約段落が JA の preface（最初の見出しの前）にだけ存在する。EN は 1 段落のみ。

```text
修正前 (JA):
---
description: テスト実行の概要を説明します。
---
テスト実行の概要を説明します。        ← この行が余分

テストは CLI またはスケジューラーから...

修正後 (JA):
---
description: テスト実行の概要を説明します。
---
テストは CLI またはスケジューラーから...
```

### 2. 手順導入文の段落分離（segment-extra + section-structure-mismatch）

EN の `:fa-arrow-right:` パターン（手順の導入文）が JA で別段落に分かれている。EN は 1 段落にまとまっている。

```text
修正前 (JA):
ループを使用すると、同じアクションを繰り返せます。

**ループを設定するには:**

修正後 (JA):
ループを使用すると、同じアクションを繰り返せます。→ **ループを設定するには:**
```

### 3. callout 内の番号付きリスト（segment-extra）

EN が `<p>` 内にインラインで `1. x 2. y 3. z` を書く callout を、JA が Markdown 番号付きリストに展開している。

```text
修正前 (JA):
:::warning
以下の制限があります:
1. 制限 A
2. 制限 B
3. 制限 C
:::

修正後 (JA):
:::warning
以下の制限があります: 1. 制限 A 2. 制限 B 3. 制限 C
:::
```

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

## 修正ワークフロー

### 単一ファイルの修正

```bash
# 1. 差分を確認
npm run check:parity -- --slug=advanced-editing/loops

# 2. EN スナップショットと JA を比較して修正
# snapshots/en/content/{slug}.html と src/content/docs/{slug}.md

# 3. 修正後に検証
npm run check:parity -- --slug=advanced-editing/loops
npm run lint:docs -- --path=src/content/docs/advanced-editing/loops.md

# 4. baseline 再生成（必要な場合）
npm run check:parity  # フルラン必須
node scripts/generate_parity_baseline.mjs --slug=advanced-editing/loops
```

### 並列エージェント委任時の注意

- **翻訳ガイドライン**: `docs/TRANSLATION_GUIDE.md` のルール（Testim 用語英語維持、ですます調、NG/OK パターン）を必ずエージェントに送ること
- **PR 分離**: 検知コードの修正とドキュメント修正は別 PR にする
- **EN ゴミ混入禁止**: EN のアーティファクト（`</Image>` 等）を JA に含めない。baseline で管理する
- **テスト確認**: リスト項目数を変更したら `KNOWN_ORDERED_DRIFTS`（`source_parity_segments_boundary.test.mjs`）を確認
- **Prettier 注意**: `npm run format` はリポジトリ全体を変更する。PR 対象ファイルのみに限定する

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
