---
title: 'Testim拡張機能が必要な理由'
description: 'TestimのSmart Locatorsを使用したテストの作成と実行に必要なTestim拡張機能の役割と、そのセキュリティポリシーについて説明します。'
category: 'テスト作成'
order: 2
updated: 'about 2 months ago'
keywords:
  - Testim拡張機能
  - Smart Locators
  - Chrome拡張機能
  - DOMアクセス
  - セキュリティ
  - テスト記録
  - ユーザーフロー
  - インストール
---

TestimはSmart Locatorsを使用してテストの作成と実行を行います。DOM全体をスキャンし、その要素を抽出して属性をスコアリングします。Testim拡張機能は、DOMへのアクセスを取得するための重要なコンポーネントであり、ユーザーフローを記録して新しいテストを作成するために必要です。

![Testim拡張機能](/images/recording-tests/why-do-you-need-testim-extension/6829989-testim_extension.PNG)

Testim拡張機能でできることの詳細については、[Testim Extension - 概要](/docs/testim-extension-overview)を参照してください。

## Testim拡張機能のダウンロード

Testim拡張機能をダウンロードするには、[こちらをクリック](https://chrome.google.com/webstore/detail/testim-editor/pebeiooilphfmbohdbhbomomkkoghoia)してください。

## セキュリティに関する注意事項

Testim拡張機能は、アプリケーション外でのユーザーの閲覧を追跡せず、IPアドレスやパスワードなどのプライベート情報を収集しません。ソースコードを変更することはありません。クライアントとサーバー間のすべての通信は、安全な接続を通じて行われます。Chromeの拡張機能に関するガイドラインに準拠しています。
