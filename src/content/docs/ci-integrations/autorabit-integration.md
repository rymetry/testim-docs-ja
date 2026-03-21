---
title: AutoRABIT 統合
description: >-
  AutoRABIT の CI ジョブから Testim REST API を使用してテスト実行を自動化する方法について説明します。Callout
  URL の設定手順を提供します。
category: 統合
order: 12015
updated: '2025-09-19'
sourceUrl: 'https://help.testim.io/docs/autorabit-integration'
keywords:
  - AutoRABIT
  - Salesforce DevOps
  - CI 統合
  - REST API
  - テスト実行自動化
  - Webhook
---

AutoRABIT からテストを自動化するには、CI ジョブで Callout URL を追加して、Testim REST API を呼び出し、テスト、テストプラン、テストスイート、またはテストラベルのテスト実行をトリガーできます。これは、単一の Webhook 呼び出しでシームレスに実行でき、中間 VM や CI ツールは必要ありません。

:::info
これは Pro アカウントでのみ利用可能です
:::

**Testim と AutoRABIT を統合するには:**

1. Testim で、**Settings > API**に移動します。
2. **Generate Key**をクリックします。
3. このキーを即座にコピーしてください。キーが表示されるのは生成時のみです。

   ![API キー生成画面のスクリーンショット](/images/ci-integrations/autorabit-integration/671408c-2025-02-10_11-11-43.png)

4. Swagger で Testim.io Public API に移動し、テスト実行用のリモート実行 API 呼び出しのタイプ（テスト、テストプラン、テストスイート、またはテストラベル）を選択します。JSON ペイロードをコピーします。

   ![Swagger 上で Testim Public API ペイロードを確認する画面](/images/ci-integrations/autorabit-integration/648e981-2025-02-10_11-15-58.png)

5. AutoRABIT で、新しい CI ジョブを作成する際に、Callout URL を作成して Testim でのテスト実行を自動化します。Callout URL は、デプロイ前またはデプロイ後（デプロイ成功時または失敗時）に実行するように選択できます。Callout URL 画面で、以下の設定を構成します:
   1. Method - POST に設定
   2. URL - ステップ 2 の REST API 呼び出しを使用し、URL の末尾にテスト、プラン、スイート ID、またはラベルを追加します。例: [https://api.testim.io/tests/run/234](https://api.testim.io/tests/run/234)
   3. Authorization - "Custom"を選択し、"Bearer YOUR-API-KEY"を追加します。YOUR-API-KEY はステップ 3 のものです。
   4. Content - Type - "JSON (application/json)"を選択
   5. Content - ステップ 4 の Swagger から JSON ペイロードを貼り付けます。JSON ペイロードの key:value ペアで:
      - "grid" : "string" の"string"を、Testim Salesforce の右上のプロフィールの Grids セクションにあるグリッド名の 1 つに置き換えます。
      - "branch" : "master" の"master"を、テストが実行される Salesforce 環境を指すブランチ名に置き換えます。

        ![AutoRABIT の Callout URL 設定画面の例](/images/ci-integrations/autorabit-integration/da52470-2025-02-10_11-21-25.png)

6. CI ジョブを保存します。\
   CI ジョブが実行されるたびに、Callout URL が Testim でのテスト実行をトリガーします。Testim にログインして結果を確認してください。
