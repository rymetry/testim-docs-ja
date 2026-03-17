---
title: Testim Extensionが必要な理由
description: >-
  TestimのSmart Locatorsを使用したテストの作成と実行に必要なTestim
  Extensionの役割と、そのセキュリティポリシーについて説明します。
category: テストの記録
order: 3002
updated: '2025-09-13'
sourceUrl: 'https://help.testim.io/docs/why-do-you-need-testim-extension'
keywords:
  - Testim Extension
  - Smart Locators
  - Chrome拡張機能
  - DOMアクセス
  - セキュリティ
  - テスト記録
  - ユーザーフロー
  - インストール
---

TestimはSmart Locatorsを使用してテストの作成と実行を行います。DOM全体をスキャンし、その要素を抽出して属性をスコアリングします。Testim Extensionは、DOMへのアクセスを取得するための重要なコンポーネントであり、ユーザーフローを記録して新しいテストを作成するために必要です。

![Testim Extension](/images/recording-tests/why-do-you-need-testim-extension/6829989-testim_extension.PNG)

Testim Extensionでできることの詳細については、[Testim Extension - 概要](/docs/testim-extension-overview)を参照してください。

## Testim Extensionのダウンロード

Testim Extensionをダウンロードするには、[Chrome ウェブストア](https://chrome.google.com/webstore/detail/testim-editor/pebeiooilphfmbohdbhbomomkkoghoia)からインストールしてください。

## セキュリティに関する注意事項

Testim Extensionは、アプリケーション外でのユーザーの閲覧を追跡せず、IPアドレスやパスワードなどのプライベート情報を収集しません。ソースコードを変更することはありません。クライアントとサーバー間のすべての通信は、安全な接続を通じて行われます。Chromeの拡張機能に関するガイドラインに準拠しています。
