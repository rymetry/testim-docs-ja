---
title: 'Copado統合'
description: 'Copado Release ManagerからURL CalloutステップでTestimテストを自動化する方法について説明します。REST APIの設定とデプロイの一時停止機能を提供します。'
category: '統合'
order: 12013
updated: '2025-02-10'
sourceUrl: 'https://help.testim.io/docs/copado-integration'
keywords:
  - Copado
  - Salesforce
  - Salesforce DevOps
  - リリースマネジメント
  - CI統合
  - CIパイプライン
  - URL Callout
  - テスト自動実行
---

Copadoからテストを自動化するには、Copadoに[URL Calloutステップ](https://docs.copado.com/articles/#!copado-ci-cd-publication/deployment-step-url-callout)を追加し、単一のWebhook呼び出しでTestim/TTA for Salesforce REST APIを使用します。

:fa-arrow-right: **Copadoを統合するには:**

1. Testim/TTA for Salesforceで、**Settings > API**に移動します。
2. **Generate API Key**をクリックします。  

   ![APIキー生成ボタンが表示された画面](/images/ci-integrations/copado-integration/b650ac8-generate1.png)
3. キーの名前を入力し、**Generate**をクリックします。

   ![APIキー名入力とGenerateボタンの画面](/images/ci-integrations/copado-integration/0aab69d-generateAPI.png)
4. 表示されたAPIキーをコピーし、**Done**をクリックします。このキーが表示されるのは生成時のみなので、できるだけ早くコピーしてください。

   ![生成されたAPIキーをコピーする画面](/images/ci-integrations/copado-integration/1b473ef-apikey.png)
5. SwaggerでTestim REST APIに移動し、テスト、テストプラン、テストスイート、またはテストラベルなどのリモート実行API呼び出しのタイプを選択して、JSONペイロードをコピーします。

   ![Swagger上でTestim REST APIエンドポイントを確認する画面](/images/ci-integrations/copado-integration/7c0621b-copado_swagger.png)
6. Copado Release Managerアプリで、Stepsセクションに新しいステップを追加してDeploymentを作成します。そのためには、以下の手順に従います:

   1. **Type**で、**Perform callout and continue with deployment**を選択します。

   2. **Method**で、**POST**を選択します。

   3. **Dynamic URL Parameters**の選択を解除します。

   4. **URL**に、REST API呼び出しを入力し、URLの末尾にテスト、テストプラン、またはスイートIDを追加します。例: `https://api.testim.io/tests/run/234`。

   5. 以下のヘッダーを追加します:
      1. Authorizationに、ステップ4のAPIキーを**Bearer YOUR-API-KEY**形式で入力します。
      2. **Content-Type**に**application/json**を入力します。

   6. **Body**に、Swaggerから(ステップ5)のJSONペイロードを貼り付けます。

      ![CopadoのURL CalloutステップでBodyを設定する画面](/images/ci-integrations/copado-integration/b00424d-copado_steps.png)

   7. JSONペイロードで、`"grid" : "string"`を、Testim/TTA for Salesforceの右上のプロフィールの**Grids**セクションからグリッド名に置き換えます。

      ![Testim/TTA for SalesforceのGridsセクションのスクリーンショット](/images/ci-integrations/copado-integration/4049e1e-copado_grid.png)

   8. テストするには、ステップを保存して**Deploy > Deploy All**をクリックします。

      テストが完了したら、StepsセクションでView Resultsをクリックします。このデプロイは、Continuous Integration(CI)でも実行できます。

## テストが完了するまで、またはテスト結果に基づいてCopadoデプロイを一時停止する

テストまたはテストプランが完了、合格、または失敗するまで、Copadoデプロイを一時停止できます。

:fa-arrow-right:**Copadoを一時停止するには:**

1. Copadoで、**Details > Type**に移動し、**Perform callout and pause step**を選択して**Resume URL**をコピーします。

   ![CopadoでPerform callout and pause stepを選択する画面](/images/ci-integrations/copado-integration/a87ef04-copado_pause_step1.png)
2. Testim/TTA for Salesforceで、エディタで**Add API action**ステップを作成し、共有ステップにします。
3. **Add API action**ステップで、**Resume URL**(ステップ1)を入力し、プロパティで**Send via web page**を無効にします。

   ![Add API actionステップにResume URLを設定する画面](/images/ci-integrations/copado-integration/612d721-copado_pause_step3.png)
4. **Runs > Configuration**リストに移動し、新しい構成を作成して**After test handler**を選択し、共有ステップ(ステップ2)を選択します。

   ![Runs設定でAfter test handlerに共有ステップを設定する画面](/images/ci-integrations/copado-integration/e032878-copado_pause_step4.png)
5. テストまたはテストプランの設定で、新しく作成した構成(ステップ4)を選択します。

   ![テスト設定で新しい構成を選択する画面](/images/ci-integrations/copado-integration/70f00d2-copado_pause_step5.png)
