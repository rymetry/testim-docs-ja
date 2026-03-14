---
title: ベストプラクティス - クリーンアップを容易にする変数命名規則
description: テストで作成したSalesforceレコードを後で削除しやすくする命名規則（固定プレフィックス＋ランダムサフィックス）を紹介します。
category: Salesforceテスト
order: 16036
updated: '2025-12-02'
sourceUrl: >-
  https://help.testim.io/docs/best-practice-variable-naming-convention-for-easy-cleanup
keywords:
  - 変数命名規則
  - クリーンアップ
  - テストデータ
  - 固定プレフィックス
  - ランダムサフィックス
  - TestAccount
  - Apex
  - レコード削除
---

テストケースまたはスイートの実行中に作成されたレコードの削除を自動化するには、テスト中に作成されたレコードを見つけて削除するコードを含む[APEX実行](/docs/sfdc-step-apex-action)ステップを作成して実行する必要があります。ただし、レコードを識別できるようにするために、ベストプラクティスとして、固定プレフィックス（例：`TestAccount`）とランダムなサフィックスを追加した変数をレコード名に使用することをお勧めします。

これにより、Salesforceで重複レコードが発生せず、固定プレフィックスを使用してテストケースまたはスイートの終了時に削除するレコードを「APEX実行」ステップで見つけることができます。

**例:**

以下のテストには**アカウント作成**ステップが含まれており、**アカウント名**フィールドには、プレフィックス「Test Account」の後にランダム値サフィックスが続きます。

![アカウント名の命名例（固定プレフィックス＋ランダムサフィックス）](/images/salesforce-utilities/best-practice-variable-naming-convention-for-easy-cleanup/db4e504-testaccount.png)
