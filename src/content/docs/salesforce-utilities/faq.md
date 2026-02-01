---
title: 'よくある質問（FAQ）'
description: 'Testim for Salesforceに関するよくある質問と回答をまとめます。'
category: 'Salesforceユーティリティ'
order: 4
updated: '2025-12-02'
sourceUrl: 'https://help.testim.io/docs/faq'
keywords:
  - FAQ
  - よくある質問
  - Salesforceリリース
  - エンドツーエンドテスト
  - Salesforceライセンス
  - レコード削除
  - Apex
  - 命名規則
---

## 将来のSalesforceリリースでもTestim for Salesforceが動作することをどのように保証していますか？

リリース前の組織への早期アクセスを取得しているため、Salesforceリリースの前に十分なテストを行っています。これにより、新しいSalesforceリリースがあったときにテストのメンテナンスに時間を費やす必要がありません。

## Testim for Salesforceはウェブサイトや他のアプリケーション全体でのエンドツーエンドテストを可能にしますか？

テストケースにSalesforceのテストが含まれている限り、他のウェブサイト、他のアプリケーション、および外部APIをまたいでテストできます。詳細については、[Salesforceテストの作成](/docs/create-a-salesforce-test)を参照してください。

## Testim for Salesforceを使用する際に追加のSalesforceライセンス費用はかかりますか？

いいえ、追加のSalesforceライセンス費用はかかりません。

## これは新しいツールですか、それともTricentis Toscaのアドオンですか？

これは、Salesforceワークフローのテスト専用の新しいスタンドアロンツールです。

## テスト中に作成されたレコードをクリーンアップ/削除するにはどうすればよいですか？

テストケースまたはスイートの実行中に作成されたレコードの削除を自動化するには、テスト中に作成されたレコードを見つけて削除するコードを含む[APEX実行](/docs/sfdc-step-apex-action)ステップを実行する必要があります。ただし、レコードを識別できるようにするために、ベストプラクティスとして、固定プレフィックス（例：`TestAccount`）とランダムなサフィックスを追加した変数をレコード名に使用することをお勧めします。詳細については、[ベストプラクティス - クリーンアップを容易にする変数命名規則](/docs/best-practice-variable-naming-convention-for-easy-cleanup)を参照してください。

APEX実行ステップでは、各sObjectについて、コードは固定プレフィックスのレコード名で始まるすべてのレコードを見つけ、それらをSalesforceから削除します。すべてのレコードが削除されるように、まず関連するすべてのレコードを削除することをお勧めします。

以下のコード例は、**Case**および**Account** sObject用のApexスクリプトを使用しています:

```java
//Delete all Cases related to Test Accounts
List<Case> lstCase =  [SELECT Id FROM Case WHERE AccountId IN (SELECT Id FROM Account WHERE Name LIKE 'TestAccount_%') AND isDeleted = false];
Database.delete(lstCase, false);
//Delete all Test Accounts
List<Account> lstAccount = [SELECT Id FROM Account WHERE Name LIKE 'TestAccount_%' AND isDeleted = false];
Database.delete(lstAccount, false);
```
