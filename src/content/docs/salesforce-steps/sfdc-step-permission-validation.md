---
title: 権限の検証
description: ユーザー権限（オブジェクト/フィールド）を取得し、期待値との差分を検証します。
category: Salesforceテスト
order: 16019
updated: '2025-12-02'
sourceUrl: 'https://help.testim.io/docs/sfdc-step-permission-validation'
keywords:
  - Salesforce
  - 権限
  - セキュリティ
  - オブジェクト権限
  - フィールド権限
  - Salesforceステップ
  - Testim for Salesforce
---

:::note{title="Salesforce ステップ"}
これは Salesforce ステップです。
:::

権限の検証は、 Salesforce オブジェクトとそのフィールドに対するユーザー権限をキャプチャ、設定、継続的に検証できる Salesforce ステップです。このステップは、各オブジェクトとそのフィールドを読み取り、 Salesforce インスタンスを接続したときに選択したユーザーと比較して変更を検証することで、 Testim for Salesforce アカウントのセキュリティを強化するために使用されます。

権限検証を実行するには、 Salesforce エディターで **Salesforce ステップ > API 操作 > 権限の検証**に移動します。権限検証は、 API レベルで権限のリストを検証します。

![スクリーンショット](/images/salesforce-steps/sfdc-step-permission-validation/0039077-permission_validation.png)

各テストステップで、 Salesforce ペルソナまたはプロファイルを選択し、検証したいオブジェクトを追加すると、 Testim for Salesforce は接続された Salesforce インスタンスの権限リストを自動的に表示します。これらの権限は、ユーザーの権限セットとそれに関連するオブジェクトおよびフィールド権限に基づいています。このステップは権限の検証のみを行います。権限を更新するには、 Salesforce インスタンスに移動して権限を更新する必要があります。

1 つの権限検証ステップで複数のオブジェクトを選択してテストを実行できます。

テストが実行されると、テストステップの権限と接続された Salesforce 環境で構成された権限が検証されます。権限が一致しない場合、エラーが発生します。 Salesforce ログをチェックして、権限に関連する詳細を確認できます。
