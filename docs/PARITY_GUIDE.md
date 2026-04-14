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

## EN ソースの既知問題

JA に含めず baseline で管理すべき EN 側のアーティファクト。

| 問題 | 対象ファイル例 | 対応 |
| ------ | --------------- | ------ |
| MadCap `</Image>` テキスト | `validate-element-text` | EN HTML に `<p>&lt;/Image&gt;</p>` がゴミテキストとして存在。JA に追加しない |
| `<span class="FileOrFilePath">` | `configuration-file-parameters` | EN が `<code>` ではなく `<span>` でコード表示。JA で backtick にすると token 抽出が変わる場合がある |
| `pull-requests` ページ壊れ | `testops/testops-version-control/pull-requests` | EN ソース自体が空。`source_sync_exclusions.mjs` で除外管理 |
| 壊れたリンク（display text と href 不一致） | `creating-your-first-codeless-test` | EN に `<a href="http://google.com">demo.testim.io</a>` が存在。display text が正。JA は正しい URL（`https://demo.testim.io`）を維持し、token-gap は baseline で管理 |

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

## 残債の返済優先順位

| 種別 | 残件数 | 対応内容 | 難易度 |
| ------ | -------- | ---------- | -------- |
| segment-extra | 最大 | preface 重複・手順分離が大半。パターン化されており機械的に修正可能 | 低 |
| segment-untranslated | 中 | テーブルセルの未翻訳が中心 | 中 |
| segment-missing | 中 | EN にあって JA にない内容。翻訳が必要 | 中 |
| section-structure-mismatch | 中 | 上記 3 つの修正に伴い自動解消されることが多い | — |
| segment-token-gap | 少 | CLI フラグ・URL の不足。ピンポイント修正 | 低 |
| segment-inconclusive | 少 | tokenless-near-tie 等。自動判定の限界。手動確認が必要 | 高 |

1-3 件のロングテールファイルが 128 ファイルあり、バッチ処理で効率的に返済可能。
