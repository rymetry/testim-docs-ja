---
title: AutoRABIT 統合
description: >-
  AutoRABIT の CI ジョブから Testim REST API を使用してテスト実行を自動化する方法について説明します。Callout
  URL の設定手順を提供します。
category: 統合
order: 12015
updated: '2025-09-19'
sourceUrl: 'https://docs.tricentis.com/testim/content/integrations/integrate-testim-to-your-ci/autorabit-integration.htm'
keywords:
  - AutoRABIT
  - Salesforce DevOps
  - CI 統合
  - REST API
  - テスト実行自動化
  - Webhook
---

AutoRABIT からテストを自動化するには、CI ジョブで Callout URL を追加することで Testim REST API を呼び出し、テスト / テストプラン / テストスイート / テストラベルの実行をトリガーできます。これは単一の Webhook 呼び出しでシームレスに実行でき、中間の VM や CI ツールは不要です。

:::info
この機能は Pro アカウントでのみ利用できます。
:::

**Testim と AutoRABIT を統合するには:**

1. Testim で **Settings > API** に移動します。
2. **Generate Key** をクリックします。
3. 生成されたキーは即座にコピーしてください。キーが表示されるのは生成時のみです。

   ![API キー生成画面のスクリーンショット](/images/ci-integrations/autorabit-integration/671408c-2025-02-10_11-11-43.png)

4. Swagger で Testim.io の Public API に移動し、テスト実行用のリモート実行 API 呼び出しの種類 (テスト / テストプラン / テストスイート / テストラベル) を選択します。続いて JSON ペイロードをコピーします。

   ![Swagger 上で Testim の Public API ペイロードを確認する画面](/images/ci-integrations/autorabit-integration/648e981-2025-02-10_11-15-58.png)

5. AutoRABIT で新しい CI ジョブを作成する際に、Callout URL を作成して Testim でのテスト実行を自動化します。Callout URL はデプロイ前またはデプロイ後 (デプロイ成功時 / 失敗時) に実行するように選択できます。Callout URL の画面で、以下の設定を構成します。

6. Method - POST に設定します。

7. URL - 手順 2 で取得した REST API 呼び出しを使用し、URL の末尾にテスト / プラン / スイートの ID またはラベルを追加します。例: [https://api.testim.io/tests/run/234](https://api.testim.io/tests/run/234)

8. Authorization - 「Custom」を選択して、値に `Bearer <手順 3 のキー>` を設定します。

9. Content-Type - 「JSON (application/json)」を選択します。

10. Content - 手順 4 で Swagger からコピーした JSON ペイロードを貼り付けます。JSON ペイロードのキー / 値ペアでは、次のように置き換えます。

    - `"grid" : "string"` の `string` を、Testim Salesforce の右上プロフィール内 Grids セクションに表示されるグリッド名のいずれかに置き換えます。
    - `"branch" : "master"` の `master` を、テストを実行する Salesforce 環境を指すブランチ名に置き換えます。

![AutoRABIT の Callout URL 設定画面の例](/images/ci-integrations/autorabit-integration/da52470-2025-02-10_11-21-25.png)

11. CI ジョブを保存します。

CI ジョブが実行されるたびに、Callout URL が Testim でのテスト実行をトリガーします。Testim にログインして結果を確認してください。
