以下の手順で英語記事と日本語翻訳ファイルを実行手順を厳守して比較検証してください。

## 対象

- 英語記事: SIDEBAR_URLS.md の {SECTION_NAME} セクション配下の全記事
- 日本語ファイル: `/Users/rym/Dev/personal-projects/testim-docs-ja/src/content/docs/{FOLDER_NAME}` 配下のmdファイル

## 実行手順

1. SIDEBAR_URLS.mdファイルから{SECTION_NAME}セクションの全記事URLリストを取得
2. 各URLのパス名に対応するmdファイルを特定
   - 例: `https://help.testim.io/docs/testim-overview` → `testim-overview.md`
3. 英語記事と日本語mdファイルのペアごとに以下の検証項目を確認
4. 記事本文内のリンクを確認し、content/docs内に対応する日本語mdファイルがあれば内部リンクに変更
5. プロジェクトディレクトリで`npm run lint`を実行してlintエラーを確認

## 検証項目

各ファイルのfrontmatter(---で囲まれた部分)について:

- [ ] `title`: 原文から適切に日本語翻訳されているか
- [ ] `description`: 記事の要約が日本語で適切に記載されているか
- [ ] `category`: 原文から適切に日本語翻訳されているか
- [ ] `updated`: YYYY-MM-DD形式の日付が設定されているか
  - 英語記事のHTMLソースから`"updatedAt":"YYYY-MM-DDTHH:mm:ss.sssZ"`または`updatedAt&quot;:&quot;YYYY-MM-DDTHH:mm:ss.sssZ&quot;`形式で抽出
  - 日付部分のみ（YYYY-MM-DD）を使用
  - 注意: 英語サイトの表示テキスト（"Updated about X months ago"）と実際のメタデータが異なる場合があるため、HTMLソースから直接取得すること
  - 詳細は`DOCS_DATE_TRACKING.md`を参照
- [ ] `sourceUrl`: 対応する英語記事のURLが設定されているか
  - 形式: `https://help.testim.io/docs/{path}`
  - 将来的な更新追跡のために必須
- [ ] `keywords`: 記事内容から抽出した日本語の検索キーワードが設定されているか
  - 上限10件まで
  - 英語のkeywordsを直訳するのではなく、記事内容に基づいて日本語で適切に設定
  - 記事の主要なトピック、機能名、技術用語、ユースケースなどを含む
  - ユーザーが検索しそうな単語を優先

本文について:

- [ ] 英語記事の全内容が日本語に翻訳されているか(見出し、段落、リスト、コードブロックのコメント等すべて)
- [ ] 原文の本文が要約に置き換わっていないか（原文の手順や説明が削られていないか）
- [ ] 原文にある callout が日本語版にも反映されているか
- [ ] 原文にあるコンテンツ画像がすべてローカル記事に埋め込まれているか
- [ ] 画像ファイルの存在確認だけでなく、本文中の配置順も原文と一致しているか
- [ ] 本文末尾に更新日(updated, 最終更新日等)の記載がないか
- [ ] 記事内のリンクが適切に処理されているか
  - 外部リンク(`https://help.testim.io/docs/...`)で、対応する日本語mdファイルが`/Users/rym/Dev/personal-projects/testim-docs-ja/src/content/docs/`配下に存在する場合、内部リンクに変更されているか
  - 例: `https://help.testim.io/docs/testim-overview` → `/docs/testim-overview` (該当mdファイルが存在する場合)
  - 対応する日本語ファイルが存在しない場合は、元の外部リンクのまま維持

ファイル全体について:

- [ ] プロジェクト全体で`npm run lint`を実行した際にエラーが出ないか

## sourceUrl と画像の扱い

- `sourceUrl` は frontmatter の記録項目ではなく、本文 QA の比較元
- `public/images/...` に画像が存在しても、Markdown から参照されていなければ未完了
- 原文の画像が 3 枚なら、日本語ページでも原則 3 枚を本文に配置していること
- 装飾画像やロゴを除外した場合は、その理由をレビュー時に説明できること

## ルーティングシステムの重要事項

**このプロジェクトのルーティングは、フォルダ構造を無視してファイル名のみを使用します。**

- ファイルパス: `src/content/docs/groups/groups.md`
- 生成されるURL: `/docs/groups` (フォルダ名は含まれない)

詳細は `src/lib/docs.ts` の `buildNavigation` 関数を参照:

```typescript
// URLに使うslugは最後のファイル名部分のみ
const urlSlug = doc.id.replace(/\.md$/, '').split('/').pop() || doc.slug;
```

**注意:** ファイル名の重複がないため、このシステムは正常に機能します。

## リンク変換ルール

### 内部リンクの正しい形式

- ❌ 間違い: `/docs/カテゴリ/ファイル名` (フォルダ構造を含む)
- ✅ 正しい: `/docs/ファイル名` (ファイル名のみ)

### 変換手順

1. 記事本文内の全リンクをスキャン
2. `https://help.testim.io/docs/{path}` または `/docs/{category}/{filename}` 形式のリンクを抽出
3. `/Users/rym/Dev/personal-projects/testim-docs-ja/src/content/docs/` 内で対応する `.md` ファイルの存在を確認
   - 英語URL `https://help.testim.io/docs/testim-overview` → ファイル検索パターン `**/testim-overview.md`
4. ファイルが存在する場合:
   - リンクをファイル名のみの形式に変更: `/docs/{filename}`
   - 例: `[テキスト](https://help.testim.io/docs/testim-overview)` → `[テキスト](/docs/testim-overview)`
   - 例: `[Groups](/docs/groups/groups)` → `[Groups](/docs/groups)`
5. ファイルが存在しない場合:
   - 元の外部リンクを維持

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
  - 現在: `https://help.testim.io/docs/example`
  - 変更後: `/docs/example`

### 🔍 Lintエラー

(あれば記載、なければ「エラーなし」)

<!-- 使い方はコンテキストに本ファイルを指定し、以下を指定してプロンプトに入力して実行 -->
<!--
## Input
- SECTION_NAME: xxxx
- FOLDER_NAME: yyyy
-->
