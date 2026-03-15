---
title: バグトラッカー設定
description: Testim から bug / issue tracking system に issue を公開する方法と、接続できるバグトラッカーを説明します。
category: 統合
order: 12033
updated: '2025-09-18'
sourceUrl: 'https://help.testim.io/docs/bug-tracker-settings'
keywords:
  - Testim
  - バグトラッカー設定
  - バグ報告
  - issue管理
  - Jira連携
  - Trello連携
  - Slack連携
  - GitHub連携
---

# バグトラッカー設定

失敗したテストやバグは、bug / issue tracking system に簡単に報告できます。Testim は一般的なバグトラッカーと統合されており、ワンクリックで issue を公開できます。作成される issue には、詳細な説明とバグのスクリーンショットが含まれます。

:::info{title="プロ機能"}
この機能はProfessionalプラン以上で利用できます。プランの詳細については [Testimの料金プラン](https://www.testim.io/pricing/) を参照してください。
:::

bug や issue を tracking system に報告する方法はいくつかあります。

- [失敗した実行への失敗タイプのタグ付け](/docs/tag-remote-runs-failures) の手順の一部として、**Create issue** リンクをクリックして issue を作成できます。

![失敗した実行から Create issue を選択](/images/bug-tracker-settings/bug-tracker-settings/78599fb-tagtestwithcreateissue.png)

- [Testim Chrome Extension](/docs/testim-extension-overview) を使うと、issue を [Screenshot](/docs/testim-extension-capture-screenshot) または [Video & Bug Scenario](/docs/testim-extension-capture-video-bug-scenario) としてキャプチャし、**Publish** をクリックして送信できます。

![Testim Extension から bug を Publish](/images/bug-tracker-settings/bug-tracker-settings/23ee812-publishbug.png)

Testim は次の bug tracking system に接続できます。

- [TestimとJiraの連携](/docs/connecting-testim-to-jira)
- [TestimとTrelloの連携](/docs/connecting-testim-to-trello)
- [TestimとSlackの連携](/docs/connecting-testim-to-slack)
- [TestimとGitHubの連携](/docs/connecting-testim-to-github)
