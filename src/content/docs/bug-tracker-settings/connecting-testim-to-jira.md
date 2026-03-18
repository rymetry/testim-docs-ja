---
title: Testim と Jira の連携
description: Testim から Jira に bug を公開するための接続手順を説明します。 Bug ticket に含まれる内容と Jira への初回接続フローを確認できます。
category: 統合
order: 12034
updated: '2025-09-18'
sourceUrl: 'https://help.testim.io/docs/connecting-testim-to-jira'
keywords:
  - Testim
  - Jira連携
  - バグ報告
  - バグトラッカー
  - Jira issue
  - 不具合チケット
  - 接続設定
---

## Testim と Jira の連携

Testim は、新しい Bug ticket を作成します。これには、 bug の詳細な説明、 bug の再現手順、 screen resolution と browser 、 bug の screenshot が含まれます。次の screenshot は、説明や screenshot などを含む、実際に作成された Bug Ticket の例です。詳細については、[Bug Reporting](/docs/bug-reporting) を参照してください。

![Jira に作成された Bug Ticket の例](/images/bug-tracker-settings/connecting-testim-to-jira/6290943-image.png)

Testim を Jira に接続するには、まず Jira に login する必要があります。初回の handshake が確立されると、その後は接続を再設定しなくても Jira に issue を作成できるようになります。

## Testim を Jira に接続する

1. `Settings > Bug Tracker` に移動します。
2. Jira が選択されており、すでに Jira に logged in していることを確認します。
3. `Host` field に Jira site の URL を入力します。例えば `https://<yourcompany>.atlassian.net` です。

![Jira の Host field](/images/bug-tracker-settings/connecting-testim-to-jira/f26f1c9-jira1.PNG)

logged in していない場合は、**Log in** リンクをクリックして Jira に login します。

4. **Select** をクリックします。**Select** ボタンは **Selected** に置き換わります。

![Jira 接続後に Selected が表示された状態](/images/bug-tracker-settings/connecting-testim-to-jira/ac0f29a-jira2.png)
