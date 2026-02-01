---
title: 'APEX を実行'
description: 'テスト内のステップとしてApexコードを実行し、値のエクスポートも行えます。'
category: 'Salesforceテスト'
order: 16018
updated: '2025-12-02'
sourceUrl: 'https://help.testim.io/docs/sfdc-step-apex-action'
keywords:
  - Salesforce
  - Apex
  - SOQL
  - SOSL
  - エクスポート
  - Salesforceステップ
  - Testim for Salesforce
---

> 📘 Salesforce ステップ
>
> これは Salesforce ステップです。

Salesforce APEX アクションステップを使用すると、テスト内のステップとして APEX コードを実行することで、E2E テストを UI を超えて拡張できます。データ操作言語（DML）ステートメントを使用して Salesforce オブジェクトをプログラムで挿入、更新、マージ、削除、復元したり、Salesforce Object Query Language（SOQL）または Salesforce Object Search Language（SOSL）ステートメントを使用して環境をクエリし、後続のステップで使用するデータをエクスポートしたりできます。

## APEX 実行アクションステップの追加

:fa-arrow-right: **APEX 実行アクションステップを追加するには:**

1. エディターで、**+** ボタンをクリックしてステップを追加します。
2. **Salesforce ステップ**タブの下で、**API 操作**をクリックし、**APEX を実行**ステップを選択します。\
   **function** エディターが開き、右側に **プロパティ**パネルが開きます:

   ![スクリーンショット](/images/salesforce-steps/sfdc-step-apex-action/c0c4dc9-Picture2.png)
3. **プロパティ**パネルの**説明**フィールドで、このステップの説明をオプションで編集します。デフォルトの説明は「Salesforce - APEX Action」です。
4. function テキストボックスに、目的の APEX コードを入力します。パラメータを定義している場合は、APEX コードでそれらのパラメータを参照できます。
5. 戻る矢印をクリックして、メインエディターウィンドウに戻ります。

## パラメータの渡し方

定義されたパラメータを使用して、テストレベルまたはスイートレベル、構成ファイル、または別のステップで定義された値を APEX 関数に渡すことができます（現在は String 値のみサポート）。

:fa-arrow-right: **APEX 実行アクションステップを追加するには:**

1. **プロパティ**パネルで、**PARAMS** セクションの **+** をクリックしてパラメータを追加します。

2. テスト、スイート、または構成ファイルで定義されたパラメータ名をテキストボックスに入力します。

3. **JS** インジケーターの横に、APEX スクリプトで使用されるこのパラメータの名前を付けます。これは、エディターウィンドウの関数宣言で自動的に引数として表示されます。

   ![スクリーンショット](/images/salesforce-steps/sfdc-step-apex-action/fbe2f4f-Picture3.png)

## 値のエクスポート

APEX スクリプトから値をエクスポートするには、次の要件を満たす必要があります:

1. 値をエクスポートするには **Export** 関数を使用してください。[/docs/exports-parameters#exporting-a-parameter](/docs/exports-parameters#exporting-a-parameter) を参照してください。
2. エクスポートする値は APEX 変数に格納する必要があります。
3. APEX 変数名とエクスポート変数名の両方は、アルファベット文字（A-z）とアンダースコアのみで構成される必要があります。
4. APEX スクリプトに Salesforce DML 関数が含まれている場合、値のエクスポートはできません。DML 関数が必要な場合は、複数のテストステップに分割する必要があります。

> 📘
>
> パラメータはステップ間で JSON としてシリアライズされるため、JSON としてシリアライズできる値のみが安全に使用できます。

## Salesforce APEX アクションの例

このシナリオでは、APEX 実行ステップを使用して次のことを行います:

1. SOQL を使用して商談を検索します。商談の名前は渡されたパラメータ opportunity と一致し、これらすべての商談をリストに格納します。
2. リストの最初の商談を取得し、Amount 値を APEX 変数 `firstoppAmount` に割り当てます。
3. `firstoppAmount` の値をエクスポート変数 `oppAmount` にエクスポートして、テストの後続のテストステップで使用できるようにします。

### コード

```javascript
function f(opportunity: any) {
List<Opportunity> firstOpportunity = [SELECT Id, Name FROM Opportunity WHERE Name LIKE :opportunity AND isDeleted = false];
int firstoppAmount = firstOpportunity[0].Amount;
exportsTest.oppAmount = firstoppAmount;
  }
```

![スクリーンショット](/images/salesforce-steps/sfdc-step-apex-action/da0a612-Picture4.png)

## APEX アクション結果ログの表示

*APEX を実行*ステップを含むテストが実行された後、Salesforce からのテスト結果を含むステップログがコードエディターで利用できます。

:fa-arrow-right: **APEX アクション結果ログを表示するには:**

1. 結果ログを表示したい *Salesforce APEX アクション*ステップをダブルクリックします。

**コードエディター**が開き、画面下部に**ステップログ**が表示されます。

Salesforce から受信したログがある場合、詳細がステップログセクションに表示されます。

![スクリーンショット](/images/salesforce-steps/sfdc-step-apex-action/825fff5-view_apex_action_2.png)
