---
title: Gearset 統合
description: >-
  Gearset の CI またはデプロイジョブから Webhook を使用して Testim テストを自動化する方法について説明します。Webhook と REST
  API の設定手順を提供します。
category: 統合
order: 12014
updated: '2025-09-19'
sourceUrl: 'https://docs.tricentis.com/testim/content/integrations/integrate-testim-to-your-ci/gearset-integration.htm'
keywords:
  - Gearset
  - Salesforce
  - Salesforce DevOps
  - リリースマネジメント
  - CI 統合
  - CI パイプライン
  - Webhook
  - テスト自動実行
---

Gearset の CI またはデプロイジョブからテストを自動化するには、Gearset で Webhook を追加し、単一の Webhook 呼び出しで Testim/TTA for Salesforce REST API を使用します。

**Gearset を統合するには:**

1. Testim/TTA for Salesforce で、**Settings > API**に移動します。
2. **Generate API Key**をクリックします。

   ![API キー生成ボタンが表示された画面](/images/ci-integrations/gearset-integration/b650ac8-generate1.png)

3. キーの名前を入力し、**Generate**をクリックします。

   ![API キー名入力と Generate ボタンの画面](/images/ci-integrations/gearset-integration/e9d4a48-generateapi.png)

4. 表示された API キーをコピーし、**Done**をクリックします。このキーが表示されるのは生成時のみなので、できるだけ早くコピーしてください。

   ![生成された API キーをコピーする画面](/images/ci-integrations/gearset-integration/7c2ad4a-copy.png)

5. Swagger で Testim REST API に移動し、テスト、テストプラン、テストスイート、またはテストラベルなどのリモート実行 API 呼び出しのタイプを選択して、JSON ペイロードをコピーします。

   ![Swagger 上で Testim REST API ペイロードを確認する画面](/images/ci-integrations/gearset-integration/05e5bea-gearset_api.png)

6. Gearset の Deployment または CI ジョブの Webhook で、以下の手順に従います:
   1. **Outgoing webhook url**に、REST API 呼び出しを入力し、URL の末尾にテスト、テストプラン、またはスイート ID を追加します。例: `https://api.testim.io/tests/run/234`

   2. **Triggers**セクションで、**Success events**を選択します。

   3. **Payload**フィールドで、**Custom**を選択します。

   4. **Authentication**フィールドで、**Authorization**を選択します。

   5. **Credentials**フィールドに、**ステップ 4**の API キーを`Bearer YOUR-API-KEY`形式で追加します。

   6. **Content-Type**フィールドで、**application/json**を選択します。

   7. **Payload**フィールドに、Swagger から**（ステップ 5）**の**JSON ペイロード**を貼り付けます。

      ![Gearset の Webhook 設定で JSON ペイロードを貼り付ける画面](/images/ci-integrations/gearset-integration/5c1e754-gearset_webhook.png)

   8. JSON ペイロードで、`"grid" : "string"`を、Testim/TTA for Salesforce の右上のプロフィールの**Grids**セクションからグリッド名に置き換えます。

      ![Testim/TTA for Salesforce の Grids セクションのスクリーンショット](/images/ci-integrations/gearset-integration/c970045-gearset_grid.png)
