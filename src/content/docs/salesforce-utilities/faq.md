---
title: よくある質問（FAQ）
description: Testim for Salesforce に関するよくある質問と回答をまとめます。
category: Salesforceテスト
order: 16034
updated: '2025-12-10'
sourceUrl: 'https://help.testim.io/docs/faq'
keywords:
  - FAQ
  - よくある質問
  - Salesforce リリース
  - エンドツーエンドテスト
  - Salesforce ライセンス
  - レコード削除
  - Apex
  - 命名規則
---

## 将来の Salesforce リリースでも Testim for Salesforce が動作することをどのように保証していますか？

リリース前の組織への早期アクセスを取得しているため、Salesforce リリースの前に十分なテストを行っています。これにより、新しい Salesforce リリースがあったときにテストのメンテナンスに時間を費やす必要がありません。

## Testim for Salesforce はウェブサイトや他のアプリケーション全体でのエンドツーエンドテストを可能にしますか？

テストケースに Salesforce のテストが含まれている限り、他のウェブサイト、他のアプリケーション、および外部 API をまたいでテストできます。詳細については、[Salesforce テストの作成](/docs/create-a-salesforce-test)を参照してください。

## Testim for Salesforce を使用する際に追加の Salesforce ライセンス費用はかかりますか？

いいえ、追加の Salesforce ライセンス費用はかかりません。

## これは新しいツールですか、それとも Tricentis Tosca のアドオンですか？

これは、Salesforce ワークフローのテスト専用の新しいスタンドアロンツールです。

## テスト中に作成されたレコードをクリーンアップ/削除するにはどうすればよいですか？

テストケースまたはスイートの実行中に作成されたレコードの削除を自動化するには、テスト中に作成されたレコードを見つけて削除するコードを含む[APEX 実行](/docs/sfdc-step-apex-action)ステップを実行する必要があります。ただし、レコードを識別できるようにするために、ベストプラクティスとして、固定プレフィックス（例：`TestAccount`）とランダムなサフィックスを追加した変数をレコード名に使用することをお勧めします。詳細については、[ベストプラクティス - クリーンアップを容易にする変数命名規則](/docs/best-practice-variable-naming-convention-for-easy-cleanup)を参照してください。

APEX 実行ステップでは、各 sObject について、コードは固定プレフィックスのレコード名で始まるすべてのレコードを見つけ、それらを Salesforce から削除します。すべてのレコードが削除されるように、まず関連するすべてのレコードを削除することをお勧めします。

以下のコード例は、**Case**および**Account** sObject 用の Apex スクリプトを使用しています:

```java
//Delete all Cases related to Test Accounts
List<Case> lstCase =  [SELECT Id FROM Case WHERE AccountId IN (SELECT Id FROM Account WHERE Name LIKE 'TestAccount_%') AND isDeleted = false];
Database.delete(lstCase, false);
//Delete all Test Accounts
List<Account> lstAccount = [SELECT Id FROM Account WHERE Name LIKE 'TestAccount_%' AND isDeleted = false];
Database.delete(lstAccount, false);
```
