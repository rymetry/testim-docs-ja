---
title: カスタムコードによる検証
description: カスタム JavaScript コードを使用した検証ステップの作成方法。高度な検証ロジックや独自の検証条件を実装できる PRO機能です。
category: 高度な編集
order: 5006
updated: '2025-09-19'
sourceUrl: 'https://docs.tricentis.com/testim/content/advanced-editing/validations/custom-code-1.htm'
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

任意のユースケースに対応するために、カスタムコードを使ったテストステップを作成できます。
Testim では、独自の JavaScript コードを入力してアクションや検証を作成できます。コードの実行場所は、ブラウザ内（DOM にアクセス可）と、ブラウザ外の Node.js 実行環境のいずれかを選べます。

## ブラウザ内で実行する場合

ブラウザ内で実行する主な利点は、DOM と直接やり取りできることです。アプリケーション内の要素特定には Testim の Smart Locators も活用できます。さらに、API リクエストの多くは認証済みの状態（Cookie が自動的に送信される）で実行できます。詳細は [Add custom validations and actions](/docs/advanced-editing/validations/custom-code) を参照してください。

## ブラウザ外（Node.js）で実行する場合

ブラウザ外で実行する主な利点は、CORS の制約を受けないことです。加えて、任意の NPM パッケージを利用できます。詳細は [Validating using code in Node.js](/docs/advanced-editing/validations/validate-download) を参照してください。
