---
title: '権限の検証'
description: '原文: https://help.testim.io/docs/sfdc-step-permission-validation'
category: 'Salesforceステップ'
order: 10
updated: '2025-11-02'
keywords:
  - testim
  - sfdc-step-permission-validation
  - salesforce-steps
---
> 📘 Salesforce ステップ
>
> これは Salesforce ステップです。

権限の検証は、Salesforce オブジェクトとそのフィールドに対するユーザー権限をキャプチャ、設定、継続的に検証できる Salesforce ステップです。このステップは、各オブジェクトとそのフィールドを読み取り、Salesforce インスタンスを接続したときに選択したユーザーと比較して変更を検証することで、Testim for Salesforce アカウントのセキュリティを強化するために使用されます。

権限検証を実行するには、Salesforce エディターで **Salesforce ステップ > API 操作 > 権限の検証**に移動します。権限検証は、API レベルで権限のリストを検証します。

![](/images/salesforce-steps/sfdc-step-permission-validation/0039077-permission_validation.png)

各テストステップで、Salesforce ペルソナまたはプロファイルを選択し、検証したいオブジェクトを追加すると、Testim for Salesforce は接続された Salesforce インスタンスの権限リストを自動的に表示します。これらの権限は、ユーザーの権限セットとそれに関連するオブジェクトおよびフィールド権限に基づいています。このステップは権限の検証のみを行います。権限を更新するには、Salesforce インスタンスに移動して権限を更新する必要があります。

1つの権限検証ステップで複数のオブジェクトを選択してテストを実行できます。

テストが実行されると、テストステップの権限と接続された Salesforce 環境で構成された権限が検証されます。権限が一致しない場合、エラーが発生します。Salesforce ログをチェックして、権限に関連する詳細を確認できます。
