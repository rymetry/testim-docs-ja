---
title: Testim と Slack の連携
description: Testim から指定した Slack channel に bug の説明を送るための接続手順を説明します。
category: 統合
order: 12036
updated: '2025-09-19'
sourceUrl: 'https://docs.tricentis.com/testim/content/integrations/bug-tracker-settings/connecting-testim-to-slack.htm'
keywords:
  - Testim
  - Slack 連携
  - バグトラッカー
  - バグ報告
  - Slack channel
  - 接続設定
  - アクセス権限
  - PRO機能
  - 不具合通知
---

Testim は、指定した Slack チャンネルにバグの説明を公開できます。投稿には、バグの詳細な説明、再現手順、画面解像度とブラウザ、バグのスクリーンショットが含まれます。Testim を Slack に接続するには、以下の手順でアクセス権限を付与します。開始する前に、データの取り扱いについて [プライバシーポリシー](https://www.testim.io/privacy) を確認してください。

:::info{title="PRO機能"}
この機能は Professional プラン以上で利用できます。Professional プランの詳細は [こちら](https://www.testim.io/pricing/) を参照してください。
:::

→ **Testim を Slack に接続するには:**

1. **Settings > Bug Tracker** に移動します。
2. Slack にログイン済みであることを確認し、**Slack** ロゴをクリックします。
3. **Add to Slack** をクリックします。

次の通知が表示されます。

![Slack の認可画面](/images/bug-tracker-settings/connecting-testim-to-slack/04ae870-f6257bf-Screen_Shot_2019-11-21_at_21.48.45.png)

4. ドロップダウンメニューから対象のチャンネルを選び、**Allow** をクリックします。
5. Testim の画面で **Select** をクリックします。

![Slack チャンネルの選択](/images/bug-tracker-settings/connecting-testim-to-slack/b42f2d6-slack1.PNG)

**Select** ボタンは **Selected** に変わります。

![Selected が表示された状態](/images/bug-tracker-settings/connecting-testim-to-slack/9781336-slack3.PNG)

[バグ報告](/docs/test-management/bug-reporting) の手順に従って、バグのキャプチャを設定してください。
