---
title: Salesforce 環境の接続
description: >-
  Testim for
  SalesforceにSalesforce環境を接続し、既存環境の管理（名前変更・再接続・削除・キャッシュクリア）を行う手順を説明します。
category: Salesforceテスト
order: 16005
updated: '2025-12-02'
sourceUrl: 'https://help.testim.io/docs/create-and-manage-test-environments'
keywords:
  - Salesforce環境接続
  - Environments
  - Production
  - Sandbox
  - ブランチ
  - 再接続
  - 環境削除
  - キャッシュクリア
  - 設定
  - Testim for Salesforce
---

Testim for Salesforce テストを作成する前に、 Salesforce 環境を Testim for Salesforce に接続する必要があります。各環境は 1 つ以上のブランチに関連付けられます（ブランチは 1 つの環境に関連付けることができます）。

## Salesforce 環境の接続

:fa-arrow-right: **Salesforce 環境を接続するには**:

1. Testim for Salesforce アカウントで、**Settings > Salesforce > Environments**に移動し、**Connect a salesforce environment**を選択します。\
   ![スクリーンショット](/images/salesforce-testing/create-and-manage-test-environments/681f2b6-connect.png)
2. **Select Type**フィールドで、 Salesforce 環境のタイプを選択します:
   * **Production** - 本番環境は、エンドユーザーが使用するライブ環境です。
   * **Sandbox** - サンドボックス環境は、より小規模な開発またはテスト環境です。
3. **Environment Name**フィールドに、環境の名前を入力します
4. 次のいずれかを実行します:
   1. 既存のブランチを使用する場合は、**Select Existing Branch**の下で、ドロップダウンメニューから目的のブランチを選択します。
   2. 新しいブランチを作成する場合は、**Create New Branch**フィールドにブランチの名前を入力します。
5. **Connect**をクリックします。\
   Salesforce ログイン画面が表示されます。\
   ![スクリーンショット](/images/salesforce-testing/create-and-manage-test-environments/43f1fac-salesforcelogin.png)
6. システム管理者権限を持つアカウントでログインします。
7. **Allow**を選択して、 Testim for Salesforce が ID URL サービスにアクセスし、 API 経由でユーザーデータを管理し、いつでもリクエストを実行できるようにします。

## 既存のテスト環境の管理

既存のテスト環境を管理するには、環境の行にある**more**メニューを選択し、次のいずれかのアクションを実行します:

* 名前変更 -  新しい名前を入力し、**Save**をクリックすることで、接続されたテスト環境の名前を変更できます。
* 再接続 - Salesforce ステップに問題がある場合、環境のタイプ（Production/Sandbox）を選択し、 Connect をクリックしてから、 Salesforce アカウントにログインすることで、接続されたテスト環境を再接続できます。
* 環境の削除 - 接続されたテスト環境を削除できます。
* キャッシュのクリア - 接続されたテスト環境のキャッシュをクリアできます。
