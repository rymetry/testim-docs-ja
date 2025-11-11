---
title: 'ベストプラクティス - クリーンアップを容易にする変数命名規則'
description: '原文: https://help.testim.io/docs/best-practice-variable-naming-convention-for-easy-cleanup'
category: 'Salesforceユーティリティ'
order: 6
updated: '2025-11-02'
keywords:
  - testim
  - best-practice-variable-naming-convention-for-easy-cleanup
  - salesforce-utilities
---

テストケースまたはスイートの実行中に作成されたレコードの削除を自動化するには、テスト中に作成されたレコードを見つけて削除するコードを含む[APEX実行](/docs/salesforce-steps/sfdc-step-apex-action)ステップを作成して実行する必要があります。ただし、レコードを識別できるようにするために、ベストプラクティスとして、固定プレフィックス（例：`TestAccount`）とランダムなサフィックスを追加した変数をレコード名に使用することをお勧めします。

これにより、Salesforceで重複レコードが発生せず、固定プレフィックスを使用してテストケースまたはスイートの終了時に削除するレコードを「APEX実行」ステップで見つけることができます。

**例:**

以下のテストには**アカウント作成**ステップが含まれており、**アカウント名**フィールドには、プレフィックス「Test Account」の後にランダム値サフィックスが続きます。

![](/images/salesforce-utilities/best-practice-variable-naming-convention-for-easy-cleanup/db4e504-testaccount.png)
