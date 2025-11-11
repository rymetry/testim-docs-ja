# 翻訳タスク (custom-code-1)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

カスタムコードによる検証

任意のユースケースに対応するために、カスタムコードを使ったテストステップを作成できます。

Testim では、独自の JavaScript コードを入力してアクションや検証を作成できます。コードの実行場所は、ブラウザー内（DOM にアクセス可）と、ブラウザー外の Node.js 実行環境のいずれかを選べます。

## ブラウザー内で実行する場合

ブラウザー内で実行する利点は DOM と直接やり取りできる点です。アプリ内要素の特定には Testim の Smart Locators も活用できます。また、多くの場合 API リクエストは認証済み（Cookie が自動的に渡されます）です。詳しくは [Add custom validations and actions](/docs/validations/custom-code) を参照してください。

## ブラウザー外（Node.js）で実行する場合

ブラウザー外で実行する利点は CORS 制約が無いことです。さらに、任意の NPM パッケージを利用できます。詳しくは [Validating using code in Node.js](/docs/validations/validate-download) を参照してください。
