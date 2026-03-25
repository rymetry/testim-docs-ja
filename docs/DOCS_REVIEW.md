以下の手順で英語記事と日本語翻訳ファイルを実行手順を厳守して比較検証してください。

## 対象

- 英語記事: SIDEBAR_URLS.md の {SECTION_NAME} セクション配下の全記事
- 日本語ファイル: `/Users/rym/Dev/personal-projects/testim-docs-ja/src/content/docs/{FOLDER_NAME}` 配下のmdファイル

## 実行手順

1. SIDEBAR_URLS.mdファイルから{SECTION_NAME}セクションの全記事URLリストを取得
2. 各URLのパス名に対応するmdファイルを特定
   - 例: `https://docs.tricentis.com/testim/content/overview/testim-overview/index.htm` → `testim-overview.md`
3. 英語記事と日本語mdファイルのペアごとに以下の検証項目を確認
4. 記事本文内のリンクを確認し、content/docs内に対応する日本語mdファイルがあれば内部リンクに変更
5. プロジェクトディレクトリで`npm run lint`を実行してlintエラーを確認

## 検証項目

### Frontmatter

frontmatter の必須フィールドとルールは `docs/WRITING_GUIDE.md` の「frontmatter 必須ルール」セクションを参照。レビュー時は特に以下を確認:

- [ ] `title`: 原文から適切に日本語翻訳されているか
- [ ] `description`: 記事の要約が日本語で適切に記載されているか（プレースホルダ禁止）
- [ ] `updated`: 英語原文の日付に追従しているか（JA 編集日に変更しないこと。詳細は `DOCS_DATE_TRACKING.md` 参照）
- [ ] `sourceUrl`: `https://docs.tricentis.com/testim/content/.../{slug}.htm` 形式で設定されているか
- [ ] `keywords`: 記事内容に基づいた日本語検索キーワードが設定されているか（上限 10 件）

本文について:

- [ ] 英語記事の全内容が日本語に翻訳されているか(見出し、段落、リスト、コードブロックのコメント等すべて)
- [ ] 原文の本文が要約に置き換わっていないか（原文の手順や説明が削られていないか）
- [ ] 原文にある callout が日本語版にも反映されているか
- [ ] 原文にあるコンテンツ画像がすべてローカル記事に埋め込まれているか
- [ ] 画像ファイルの存在確認だけでなく、本文中の配置順も原文と一致しているか
- [ ] 本文末尾に更新日(updated, 最終更新日等)の記載がないか
- [ ] 記事内のリンクが適切に処理されているか
  - 外部リンク(`https://docs.tricentis.com/testim/content/...`)で、対応する日本語mdファイルが`/Users/rym/Dev/personal-projects/testim-docs-ja/src/content/docs/`配下に存在する場合、内部リンクに変更されているか
  - 例: `https://docs.tricentis.com/testim/content/overview/testim-overview/index.htm` → `/docs/testim-overview` (該当mdファイルが存在する場合)
  - 対応する日本語ファイルが存在しない場合は、元の外部リンクのまま維持

ファイル全体について:

- [ ] プロジェクト全体で`npm run lint`を実行した際にエラーが出ないか

## sourceUrl と画像の扱い

- `sourceUrl` は frontmatter の記録項目ではなく、本文 QA の比較元
- `public/images/...` に画像が存在しても、Markdown から参照されていなければ未完了
- 原文の画像が 3 枚なら、日本語ページでも原則 3 枚を本文に配置していること
- 装飾画像やロゴを除外した場合は、その理由をレビュー時に説明できること

## ルーティングとリンク規則

ルーティングはフォルダ構造を無視してファイル名のみで URL を決定する（例: `src/content/docs/groups/groups.md` → `/docs/groups`）。

内部リンクの形式・変換ルールの詳細は `docs/WRITING_GUIDE.md` の「内部リンク規則」セクションを参照。

要点:
- 正しい形式: `/docs/{slug}`（フォルダ名を含めない）
- `https://docs.tricentis.com/testim/content/.../{slug}.htm` は対応する JA ファイルが存在する場合 `/docs/{slug}` に変換する
- 対応する JA ファイルが存在しない場合は元の外部リンクを維持する

## 出力形式

検証結果を以下の形式で報告してください:

### 📊 検証サマリー

- 検証対象ファイル数: X件
- 問題なし: Y件
- 問題あり: Z件
- keywords未設定: Z件
- リンク変更が必要: Z件

### ✅ 問題なしのファイル

- ファイル名のリスト

### ⚠️ 問題があるファイル

各ファイルについて:

- **ファイル名**: `xxx.md`
- **URL**: (対応する英語記事URL)
- **問題点**:
  - 具体的な問題の説明
  - 期待値と実際の値の比較(該当する場合)

### 🔑 keywords未設定または要改善のファイル

各ファイルについて:

- **ファイル名**: `xxx.md`
- **現状**: (現在のkeywords、未設定の場合は「未設定」)
- **提案**: 記事内容に基づいた推奨キーワード(最大10件)

### 🔗 リンク変更が必要なファイル

各ファイルについて:

- **ファイル名**: `xxx.md`
- **変更すべきリンク**:
  - 現在: `https://docs.tricentis.com/testim/content/{category}/example.htm`
  - 変更後: `/docs/example`

### 🔍 Lintエラー

(あれば記載、なければ「エラーなし」)

<!-- 使い方はコンテキストに本ファイルを指定し、以下を指定してプロンプトに入力して実行 -->
<!--
## Input
- SECTION_NAME: xxxx
- FOLDER_NAME: yyyy
-->
