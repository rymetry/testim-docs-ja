---
title: 別のユーザーとしてログイン
description: 管理者ユーザーとして、別のユーザーに切り替えてログインします。
category: Salesforceテスト
order: 16012
updated: '2025-12-02'
sourceUrl: 'https://help.testim.io/docs/sfdc-step-loginas'
keywords:
  - Salesforce
  - 別のユーザーとしてログイン
  - 管理者
  - ペルソナ
  - Salesforceステップ
  - Testim for Salesforce
---

:::note{title="Salesforce ステップ"}
これは Salesforce ステップです。
:::

**Log In As Another User**ステップは、管理者ユーザーのみが使用できます。つまり、**Log In As Another User**ステップの前に、テストが管理者アカウントにログインする**Log in**ステップを追加する必要があります。管理者としてログインした後、**Log In As Another User**ステップを使用して、単一のテスト内で異なるユーザーとしてログインできます。

:fa-arrow-right:**Log In As Another User ステップを追加するには:**

1. **+**ボタンをクリックし、**Salesforce**ステップタブの下で、**Common operations**をクリックして**Log in as another user**ステップを選択することで、**Log in as another user**ステップを追加します。\
   次の**Properties Tab**が表示されます。

   ![スクリーンショット](/images/salesforce-steps/sfdc-step-loginas/02cc7f3-2024-05-05_15-07-06.png)
2. 次のいずれかを実行します:

   1. [ペルソナの作成](/docs/create-a-persona-and-add-users)プロセスですでに定義されている**ペルソナ**を選択する場合は、**Select persona**ドロップダウンメニューから目的のペルソナを選択します。
   2. ペルソナとして定義されていないユーザー名を使用する場合は、**Input Username**フィールドに次のいずれかの方法でユーザー名を入力します:

      1. **ユーザー名文字列** - ユーザー名を文字列として入力するには、文字列をフィールドに入力します。文字列は自動的に単一引用符で囲まれます。
      2. **ユーザー名変数** - JavaScript コードを入力し、ユーザー名に変数を使用して、テストの各実行でテストデータから一意のユーザー名を使用することもできます。**T**アイコンをクリックして JS コードを入力します。詳細については、[データ駆動テスト](/docs/data-driven-testing)を参照してください。
3. **Navigation options**セクションで、次のオプションのいずれかを選択します:

   1. **Stay on current page after log in as** - 別のユーザーとしてログインした後、同じページに留まることを確認する場合は、このオプションを選択します。
   2. **Return to current page after log out** - ログアウト後に同じページに留まることを確認する場合は、このオプションを選択します。
4. テストの最後に、**Log out**ステップを追加して、管理者に戻り、別のユーザーとして再度ログインできるようにします。
5. 完了したら、**Save**をクリックしてテストを保存します。
