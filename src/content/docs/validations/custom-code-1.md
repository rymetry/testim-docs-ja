---
title: カスタムコードによる検証
description: カスタム JavaScript コードを使用した検証ステップの作成方法。高度な検証ロジックや独自の検証条件を実装できる PRO機能です。
category: 高度な編集
order: 5006
updated: '2025-09-14'
sourceUrl: 'https://help.testim.io/docs/custom-code-1'
keywords:
  - カスタムコード
  - JavaScript
  - カスタム検証
  - スクリプト
  - 高度な検証
  - プログラマブル
  - コーディング
  - テスト拡張
  - 独自ロジック
  - 柔軟な検証
---

カスタムコードによる検証

任意のユースケースに対応するために、カスタムコードを使ったテストステップを作成できます。

Testim では、独自の JavaScript コードを入力してアクションや検証を作成できます。コードの実行場所は、ブラウザ内（DOM にアクセス可）と、ブラウザ外の Node.js 実行環境のいずれかを選べます。

## ブラウザ内で実行する場合

ブラウザ内で実行する利点は DOM と直接やり取りできる点です。アプリ内要素の特定には Testim の Smart Locators も活用できます。また、多くの場合 API リクエストは認証済み（Cookie が自動的に渡されます）です。詳しくは [Add custom validations and actions](/docs/custom-code) を参照してください。

## ブラウザ外（Node.js）で実行する場合

ブラウザ外で実行する利点は CORS 制約が無いことです。さらに、任意の NPM パッケージを利用できます。詳しくは [Validating using code in Node.js](/docs/validate-download) を参照してください。
