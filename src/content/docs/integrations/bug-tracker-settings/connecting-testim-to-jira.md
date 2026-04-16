---
title: Testim と Jira の連携
description: Testim から Jira に bug を公開するための接続手順を説明します。Bug ticket に含まれる内容と Jira への初回接続フローを確認できます。
category: 統合
order: 12034
updated: '2025-09-19'
sourceUrl: 'https://docs.tricentis.com/testim/content/integrations/bug-tracker-settings/connecting-testim-to-jira.htm'
keywords:
  - Testim
  - Jira 連携
  - バグ報告
  - バグトラッカー
  - Jira issue
  - 不具合チケット
  - 接続設定
---

Testim は新しい Bug チケットを作成します。チケットにはバグの詳細な説明、バグの再現手順、画面解像度とブラウザ、バグのスクリーンショットが含まれます。次のスクリーンショットは、説明やスクリーンショットなどを含む、実際に作成された Bug チケットの例です。詳細については [Bug Reporting](/docs/test-management/bug-reporting) を参照してください。

![Jira に作成された Bug チケットの例](/images/bug-tracker-settings/connecting-testim-to-jira/6290943-image.png)

Testim を Jira に接続するには、まず Jira にログインする必要があります。初回のハンドシェイクが確立されれば、その後は接続を再設定しなくても Jira にイシューを作成できるようになります。
→ **Testim を Jira に接続するには:**

1. **Settings > Bug Tracker** に移動します。
2. **Jira** が選択されており、すでに Jira にログインしていることを確認します。
3. **Host** フィールドに Jira サイトの URL を入力します。例えば `https://<yourcompany>.atlassian.net` です。

![Jira の Host フィールド](/images/bug-tracker-settings/connecting-testim-to-jira/f26f1c9-jira1.PNG)

ログインしていない場合は、**Log in** リンクをクリックして Jira にログインします。

4. **Select** をクリックします。

**Select** ボタンは **Selected** に置き換わります。

![Jira 接続後に Selected が表示された状態](/images/bug-tracker-settings/connecting-testim-to-jira/ac0f29a-jira2.png)
