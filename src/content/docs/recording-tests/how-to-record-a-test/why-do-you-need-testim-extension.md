---
title: Testim Extension が必要な理由
description: >-
  Testim の Smart Locators を使用したテストの作成と実行に必要な Testim
  Extension の役割と、そのセキュリティポリシーについて説明します。
category: テストの記録
order: 3002
updated: '2025-09-19'
sourceUrl: 'https://docs.tricentis.com/testim/content/recording-tests/how-to-record-a-test/why-do-you-need-testim-extension.htm'
keywords:
  - Testim Extension
  - Smart Locators
  - Chrome 拡張機能
  - DOM アクセス
  - セキュリティ
  - テスト記録
  - ユーザーフロー
  - インストール
---

Testim は Smart Locators を使用してテストの作成と実行を行います。DOM 全体をスキャンし、その要素を抽出して属性をスコアリングします。Testim Extension は、DOM へのアクセスを取得するための重要なコンポーネントであり、ユーザーフローを記録して新しいテストを作成するために必要です。

![Testim Extension](/images/recording-tests/why-do-you-need-testim-extension/6829989-testim_extension.PNG)

Testim Extension でできることの詳細については、[Testim Extension - 概要](/docs/testim-extension/testim-extension-overview)を参照してください。

## Testim Extension のダウンロード

Testim Extension をダウンロードするには、[Chrome ウェブストア](https://chrome.google.com/webstore/detail/testim-editor/pebeiooilphfmbohdbhbomomkkoghoia)からインストールしてください。

## セキュリティに関する注意事項

Testim Extension は、アプリケーション外でのユーザーの閲覧を追跡せず、IP アドレスやパスワードなどのプライベート情報を収集しません。ソースコードを変更することはありません。クライアントとサーバー間のすべての通信は、安全な接続を通じて行われます。Chrome の拡張機能に関するガイドラインに準拠しています。
