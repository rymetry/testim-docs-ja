---
title: Gearset統合
description: >-
  GearsetのCIまたはデプロイジョブからWebhookを使用してTestimテストを自動化する方法について説明します。WebhookとREST
  APIの設定手順を提供します。
category: 統合
order: 12014
updated: '2025-02-10'
sourceUrl: 'https://help.testim.io/docs/gearset-integration'
keywords:
  - Gearset
  - Salesforce
  - Salesforce DevOps
  - リリースマネジメント
  - CI統合
  - CIパイプライン
  - Webhook
  - テスト自動実行
---

GearsetのCIまたはデプロイジョブからテストを自動化するには、GearsetでWebhookを追加し、単一のWebhook呼び出しでTestim/TTA for Salesforce REST APIを使用します。

:fa-arrow-right: **Gearsetを統合するには:**

1. Testim/TTA for Salesforceで、**Settings > API**に移動します。
2. **Generate API Key**をクリックします。  

   ![APIキー生成ボタンが表示された画面](/images/ci-integrations/gearset-integration/b650ac8-generate1.png)
3. キーの名前を入力し、**Generate**をクリックします。

   ![APIキー名入力とGenerateボタンの画面](/images/ci-integrations/gearset-integration/e9d4a48-generateapi.png)
4. 表示されたAPIキーをコピーし、**Done**をクリックします。このキーが表示されるのは生成時のみなので、できるだけ早くコピーしてください。

   ![生成されたAPIキーをコピーする画面](/images/ci-integrations/gearset-integration/7c2ad4a-copy.png)
5. SwaggerでTestim REST APIに移動し、テスト、テストプラン、テストスイート、またはテストラベルなどのリモート実行API呼び出しのタイプを選択して、JSONペイロードをコピーします。

   ![Swagger上でTestim REST APIペイロードを確認する画面](/images/ci-integrations/gearset-integration/05e5bea-gearset_api.png)
6. GearsetのDeploymentまたはCIジョブのWebhookで、以下の手順に従います:

   1. **Outgoing webhook url**に、REST API呼び出しを入力し、URLの末尾にテスト、テストプラン、またはスイートIDを追加します。例: `https://api.testim.io/tests/run/234`

   2. **Triggers**セクションで、**Success events**を選択します。

   3. **Payload**フィールドで、**Custom**を選択します。

   4. **Authentication**フィールドで、**Authorization**を選択します。

   5. **Credentials**フィールドに、**ステップ4**のAPIキーを`Bearer YOUR-API-KEY`形式で追加します。

   6. **Content-Type**フィールドで、**application/json**を選択します。

   7. **Payload**フィールドに、Swaggerから**(ステップ5)**の**JSONペイロード**を貼り付けます。

      ![GearsetのWebhook設定でJSONペイロードを貼り付ける画面](/images/ci-integrations/gearset-integration/5c1e754-gearset_webhook.png)

   8. JSONペイロードで、`"grid" : "string"`を、Testim/TTA for Salesforceの右上のプロフィールの**Grids**セクションからグリッド名に置き換えます。

      ![Testim/TTA for SalesforceのGridsセクションのスクリーンショット](/images/ci-integrations/gearset-integration/c970045-gearset_grid.png)
