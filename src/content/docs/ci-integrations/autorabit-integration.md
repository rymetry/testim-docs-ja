---
title: AutoRABIT統合
description: >-
  AutoRABITのCIジョブからTestim REST APIを使用してテスト実行を自動化する方法について説明します。Callout
  URLの設定手順を提供します。
category: 統合
order: 12015
updated: '2025-02-10'
sourceUrl: 'https://help.testim.io/docs/autorabit-integration'
keywords:
  - AutoRABIT
  - Salesforce DevOps
  - CI統合
  - REST API
  - テスト実行自動化
  - Webhook
---

AutoRABITからテストを自動化するには、CIジョブでCallout URLを追加して、Testim REST APIを呼び出し、テスト、テストプラン、テストスイート、またはテストラベルのテスト実行をトリガーできます。これは、単一のWebhook呼び出しでシームレスに実行でき、中間VMやCIツールは必要ありません。

> 📘
>
> これはProアカウントでのみ利用可能です

:fa-arrow-right:**TestimとAutoRABITを統合するには:**

1. Testimで、**Settings > API**に移動します。
2. **Generate Key**をクリックします。
3. このキーを即座にコピーしてください。キーが表示されるのは生成時のみです。

   ![APIキー生成画面のスクリーンショット](/images/ci-integrations/autorabit-integration/671408c-2025-02-10_11-11-43.png)
4. SwaggerでTestim.io Public APIに移動し、テスト実行用のリモート実行API呼び出しのタイプ(テスト、テストプラン、テストスイート、またはテストラベル)を選択します。JSONペイロードをコピーします。

   ![Swagger上でTestim Public APIペイロードを確認する画面](/images/ci-integrations/autorabit-integration/648e981-2025-02-10_11-15-58.png)
5. AutoRABITで、新しいCIジョブを作成する際に、Callout URLを作成してTestimでのテスト実行を自動化します。Callout URLは、デプロイ前またはデプロイ後(デプロイ成功時または失敗時)に実行するように選択できます。Callout URL画面で、以下の設定を構成します:

   1. Method - POSTに設定  
   2. URL - ステップ2のREST API呼び出しを使用し、URLの末尾にテスト、プラン、スイートID、またはラベルを追加します。例: [https://api.testim.io/tests/run/234](https://api.testim.io/tests/run/234)  
   3. Authorization - "Custom"を選択し、"Bearer YOUR-API-KEY"を追加します。YOUR-API-KEYはステップ3のものです。  
   4. Content - Type - "JSON (application/json)"を選択  
   5. Content - ステップ4のSwaggerからJSONペイロードを貼り付けます。JSONペイロードのkey:valueペアで:

      - "grid" : "string" の"string"を、Testim Salesforceの右上のプロフィールのGridsセクションにあるグリッド名の1つに置き換えます。
      - "branch" : "master" の"master"を、テストが実行されるSalesforce環境を指すブランチ名に置き換えます。

        ![AutoRABITのCallout URL設定画面の例](/images/ci-integrations/autorabit-integration/da52470-2025-02-10_11-21-25.png)
6. CIジョブを保存します。\
   CIジョブが実行されるたびに、Callout URLがTestimでのテスト実行をトリガーします。Testimにログインして結果を確認してください。
