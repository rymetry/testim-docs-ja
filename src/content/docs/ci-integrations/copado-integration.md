---
title: Copado 統合
description: >-
  Copado Release Manager から URL Callout ステップで Testim テストを自動化する方法について説明します。REST
  API の設定とデプロイの一時停止機能を提供します。
category: 統合
order: 12013
updated: '2025-09-19'
sourceUrl: 'https://help.testim.io/docs/copado-integration'
keywords:
  - Copado
  - Salesforce
  - Salesforce DevOps
  - リリースマネジメント
  - CI 統合
  - CI パイプライン
  - URL Callout
  - テスト自動実行
---

Copado からテストを自動化するには、Copado に[URL Callout ステップ](https://docs.copado.com/articles/#!copado-ci-cd-publication/deployment-step-url-callout)を追加し、単一の Webhook 呼び出しで Testim/TTA for Salesforce REST API を使用します。

**Copado を統合するには:**

1. Testim/TTA for Salesforce で、**Settings > API**に移動します。
2. **Generate API Key**をクリックします。  

   ![API キー生成ボタンが表示された画面](/images/ci-integrations/copado-integration/b650ac8-generate1.png)

3. キーの名前を入力し、**Generate**をクリックします。

   ![API キー名入力と Generate ボタンの画面](/images/ci-integrations/copado-integration/0aab69d-generateAPI.png)

4. 表示された API キーをコピーし、**Done**をクリックします。このキーが表示されるのは生成時のみなので、できるだけ早くコピーしてください。

   ![生成された API キーをコピーする画面](/images/ci-integrations/copado-integration/1b473ef-apikey.png)

5. Swagger で Testim REST API に移動し、テスト、テストプラン、テストスイート、またはテストラベルなどのリモート実行 API 呼び出しのタイプを選択して、JSON ペイロードをコピーします。

   ![Swagger 上で Testim REST API エンドポイントを確認する画面](/images/ci-integrations/copado-integration/7c0621b-copado_swagger.png)

6. Copado Release Manager アプリで、Steps セクションに新しいステップを追加して Deployment を作成します。そのためには、以下の手順に従います:

   1. **Type**で、**Perform callout and continue with deployment**を選択します。

   2. **Method**で、**POST**を選択します。

   3. **Dynamic URL Parameters**の選択を解除します。

   4. **URL**に、REST API 呼び出しを入力し、URL の末尾にテスト、テストプラン、またはスイート ID を追加します。例: `https://api.testim.io/tests/run/234`。

   5. 以下のヘッダーを追加します:
      1. Authorization に、ステップ 4 の API キーを**Bearer YOUR-API-KEY**形式で入力します。
      2. **Content-Type**に**application/json**を入力します。

   6. **Body**に、Swagger から（ステップ 5）の JSON ペイロードを貼り付けます。

      ![Copado の URL Callout ステップで Body を設定する画面](/images/ci-integrations/copado-integration/b00424d-copado_steps.png)

   7. JSON ペイロードで、`"grid" : "string"`を、Testim/TTA for Salesforce の右上のプロフィールの**Grids**セクションからグリッド名に置き換えます。

      ![Testim/TTA for Salesforce の Grids セクションのスクリーンショット](/images/ci-integrations/copado-integration/4049e1e-copado_grid.png)

   8. テストするには、ステップを保存して**Deploy > Deploy All**をクリックします。

      テストが完了したら、Steps セクションで View Results をクリックします。このデプロイは、Continuous Integration（CI）でも実行できます。

## テストが完了するまで、またはテスト結果に基づいて Copado デプロイを一時停止する

テストまたはテストプランが完了、合格、または失敗するまで、Copado デプロイを一時停止できます。

**Copado を一時停止するには:**

1. Copado で、**Details > Type**に移動し、**Perform callout and pause step**を選択して**Resume URL**をコピーします。

   ![Copado で Perform callout and pause step を選択する画面](/images/ci-integrations/copado-integration/a87ef04-copado_pause_step1.png)

2. Testim/TTA for Salesforce で、エディターで**Add API action**ステップを作成し、共有ステップにします。
3. **Add API action**ステップで、**Resume URL**（ステップ 1）を入力し、プロパティで**Send via web page**を無効にします。

   ![Add API action ステップに Resume URL を設定する画面](/images/ci-integrations/copado-integration/612d721-copado_pause_step3.png)

4. **Runs > Configuration**リストに移動し、新しい構成を作成して**After test handler**を選択し、共有ステップ（ステップ 2）を選択します。

   ![Runs 設定で After test handler に共有ステップを設定する画面](/images/ci-integrations/copado-integration/e032878-copado_pause_step4.png)

5. テストまたはテストプランの設定で、新しく作成した構成（ステップ 4）を選択します。

   ![テスト設定で新しい構成を選択する画面](/images/ci-integrations/copado-integration/70f00d2-copado_pause_step5.png)
