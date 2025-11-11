---
title: 'バグ報告'
description: 'バグをキャプチャして報告する方法と、Jira、Slack、Trello、Githubなどのバグトラッカーとの連携について説明します。'
category: 'テスト管理'
order: 16
updated: '2025-11-11'
keywords:
  - testim
  - bug-reporting
  - test-management
  - バグ報告
  - バグトラッカー
---

Testimは、バグをキャプチャして報告する簡単な方法を提供します。バグレポートは、Jira、Slack、Trello、Githubなど、さまざまなバグトラッカーを通じて共有できます。

## バグレポートの作成方法

バグレポートは2つの方法で作成できます:

* **テスト失敗のタグ付け** – テスト失敗にタグを付ける際に、テスト失敗をバグ/課題として報告することもできます。詳細な手順については、[失敗タイプでの失敗した実行のタグ付け](/docs/results/tag-remote-runs-failures)を参照してください。
* **Testim拡張機能** – Testim拡張機能を使用して、Webブラウザから直接Webページで見つかったバグ（テストに関連しないもの）を報告できます。詳細な手順については、[Testim拡張機能 - ビデオとバグシナリオのキャプチャ](/docs/testim-extension/testim-extension-capture-video-bug-scenario)を参照してください。

## バグレポートに含めることができる内容

* 自動テスト - ブラウザでテストをローカルに実行し、バグを再現するだけです。
* 注釈付きスクリーンショット
* バグを再現する様子のビデオ録画
* バグを再現するために行った各操作のステップバイステップのスクリーンショット
* 自動生成される、バグの「再現手順」のテキスト説明。

## バグレポートをバグトラッカーに接続する

開始する前に、Testimを関連するバグトラッカーに接続する必要があります:\
•[Jira](/docs/bug-tracker-settings/connecting-testim-to-jira)\
•[Trello](/docs/bug-tracker-settings/connecting-testim-to-trello)\
•[Slack](/docs/bug-tracker-settings/connecting-testim-to-slack)\
•[Github](/docs/bug-tracker-settings/connecting-testim-to-github)
