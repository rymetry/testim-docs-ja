---
title: レコードを検索して移動
description: テキスト検索で一致するレコードを探し、最初の検索結果に移動します。
category: Salesforceテスト
order: 16015
updated: '2025-12-02'
sourceUrl: 'https://docs.tricentis.com/testim/content/salesforce-testing/salesforce-steps/sfdc-step-findandgotorecord.htm'
keywords:
  - Salesforce
  - レコード検索
  - グローバル検索
  - Salesforce ステップ
  - Testim for Salesforce
---

:::note{title="Salesforce ステップ"}
これは Salesforce ステップです。
:::

**レコードを検索して移動**ステップは、レコードのテキスト検索を実行するために使用されます。システムは検索の最初の結果として表示される一致するレコードに移動します。
**レコードを検索して移動ステップを追加するには:**

1. エディターで、+ ボタンをクリックしてステップを追加します。
2. Salesforce ステップタブの下で、**共通操作**をクリックし、**レコードを検索して移動**ステップを選択します。
3. **オブジェクトを選択**フィールドで、検索したいオブジェクトのタイプを選択します。
4. **検索対象**フィールドに、探しているレコードに一致するテキスト文字列を入力します。

![スクリーンショット](/images/salesforce-steps/sfdc-step-findandgotorecord/ef0246d-acme.png)

5. 検索クエリとして変数を使用したい場合は、**検索対象**フィールドをクリックし、**T** サインをクリックします。\
フィールドが **JS** パラメーターフィールドに変わります。
6. フィールドに変数名を入力します。

![スクリーンショット](/images/salesforce-steps/sfdc-step-findandgotorecord/28f5b3c-companyname.png)

7. **保存**をクリックします。\
テストを実行すると、検索ステップは一致するレコードを検索し、複数の結果が返された場合は最初の結果に移動します。結果が見つからない場合、ステップは失敗します。
