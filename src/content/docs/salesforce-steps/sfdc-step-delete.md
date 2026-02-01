---
title: '削除'
description: '表示中のSalesforceレコードを削除します。'
category: 'Salesforceステップ'
order: 19
updated: '2025-12-02'
sourceUrl: 'https://help.testim.io/docs/sfdc-step-delete'
keywords:
  - Salesforce
  - レコード削除
  - Salesforceステップ
  - Testim for Salesforce
---
> 📘 Salesforce ステップ
>
> これは Salesforce ステップです。

削除ステップは、Salesforce レコードを削除します。

> 📘 レコード表示の要件
>
> ステップ自体はレコードにナビゲートしないため、テストの実行中に特定のレコードにシステムがナビゲートする必要があります。これにより、レコードが Salesforce に表示されたときに指定されたステップが実行されます。詳細については、[テスト実行中に特定の Salesforce レコードを検索して表示する](/docs/methods-for-displaying-a-specific-record-during-test-execution)を参照してください。

# 削除ステップの作成

:fa-arrow-right:**削除ステップを作成するには:**

1. テストで、削除ステップの前に、目的のレコードにナビゲートするステップを追加します。詳細については、[テスト実行中に特定の Salesforce レコードを検索して表示する](/docs/methods-for-displaying-a-specific-record-during-test-execution)を参照してください。
2. **+** ボタンをクリックしてステップを追加します。
3. **Salesforce ステップ**タブの下で、**レコード操作**をクリックし、削除ステップを選択します。\
   **削除**ステップが追加され、次の**オブジェクトプロパティ**が表示されます。

   ![](/images/salesforce-steps/sfdc-step-delete/f1f2053-deletestep.png)
4. 完了したら、**保存**をクリックします。
