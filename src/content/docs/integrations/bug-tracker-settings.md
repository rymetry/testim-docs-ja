---
title: バグトラッカー設定
description: Testim から bug / issue tracking system に issue を公開する方法と、接続できるバグトラッカーを説明します。
category: 統合
order: 12033
updated: '2025-09-19'
sourceUrl: 'https://docs.tricentis.com/testim/content/integrations/bug-tracker-settings/index.htm'
keywords:
  - Testim
  - バグトラッカー設定
  - バグ報告
  - issue 管理
  - Jira 連携
  - Trello 連携
  - Slack 連携
  - GitHub 連携
---

失敗したテストやバグは、bug / issue tracking system に簡単に報告できます。Testim は一般的なバグトラッカーと統合されており、ワンクリックで issue を公開できます。作成される issue には、詳細な説明とバグのスクリーンショットが含まれます。

:::info{title="PRO機能"}
この機能は Professional plan 以上で利用できます。
:::

bug や issue を tracking system に報告する方法はいくつかあります。

- [失敗した実行への失敗タイプのタグ付け](/docs/results/tag-remote-runs-failures) の手順の一部として、**Create issue** リンクをクリックして issue を作成できます。

![失敗した実行から Create issue を選択](/images/bug-tracker-settings/bug-tracker-settings/78599fb-tagtestwithcreateissue.png)

- [Testim Chrome Extension](/docs/testim-extension/testim-extension-overview) を使うと、issue を [Screenshot](/docs/testim-extension/testim-extension-capture-screenshot) または [Video & Bug Scenario](/docs/testim-extension/testim-extension-capture-video-bug-scenario) としてキャプチャし、**Publish** をクリックして送信できます。

![Testim Extension から bug を Publish](/images/bug-tracker-settings/bug-tracker-settings/23ee812-publishbug.png)

Testim は次の bug tracking system に接続できます。

- [Testim と Jira の連携](/docs/integrations/bug-tracker-settings/connecting-testim-to-jira)
- [Testim と Trello の連携](/docs/integrations/bug-tracker-settings/connecting-testim-to-trello)
- [Testim と Slack の連携](/docs/integrations/bug-tracker-settings/connecting-testim-to-slack)
- [Testim と GitHub の連携](/docs/integrations/bug-tracker-settings/connecting-testim-to-github)
