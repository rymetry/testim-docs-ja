---
title: 'Salesforceステップ'
description: '原文: https://help.testim.io/docs/salesforce-steps'
category: 'Salesforceステップ'
order: 1
updated: '2025-11-02'
keywords:
  - testim
  - salesforce-steps
  - salesforce-steps
---
Salesforceステップは、テストに手動で追加できます。これらのステップは、接続されたSalesforce環境のレコードとフィールドで事前入力されたSalesforceの一般的なアクションをカバーしています。ステップは、共通操作、レコード操作、API操作で構成されています。

![](/images/salesforce-steps/salesforce-steps/488aa39-rework_salesforce_steps.gif)

## 共通操作

Salesforceの共通操作には、次のSalesforce操作が含まれます:

* [Log in](/docs/salesforce-steps/sfdc-step-login) - Salesforce環境にログインします。ログインするペルソナを選択するか、新しいペルソナを作成します。
* [Log In As Another User](/docs/log-in-as-salesforce-step) - 単一のテストケース内で異なるユーザーでテストするためにログインします。
* [Launch App](/docs/salesforce-steps/sfdc-step-launchapp) - 起動する利用可能なアプリを選択します。
* [Log out](docs/sfdc-step-launchapp) - Salesforceからログアウトします。
* [Find and go to record](/docs/sfdc-step-find) - レコードのテキスト検索。グローバル検索を使用して、最初に一致するレコードを返します。
* [Wait for page load](/docs/salesforce-steps/sfdc-step-waitforpageload) - 次のステップに進む前に、Salesforceがページを完全に読み込むのを待ちます。
* [Close console tabs](/docs/salesforce-steps/sfdc-step-closeconsoletabs) - Salesforceのコンソールタブを閉じます。
* [Document validation](https://help.testim.io/docs/sfdc-document-validation) - コーディングなしで設定できるさまざまな条件を使用して、PDFドキュメントの内容を検証および/または抽出します。

## レコード操作

Salesforceのレコード操作には、次のSalesforce操作が含まれます:

* [Create](/docs/salesforce-steps/sfdc-step-create) - フィールドの値で新しいレコードを作成します。
* [Edit](/docs/salesforce-steps/sfdc-step-edit) - フィールドの値で現在のレコードを編集します
* [Validate](/docs/salesforce-steps/sfdc-step-validate) - 現在のレコードがフィールドと一致することを検証します。すべてのフィールドが完全に一致する場合にのみ、テストステップが合格します。
* [Quick actions](docs/sfdc-step-quickactions) - 現在のレコードで利用可能なクイックアクションを実行します。クイックアクションには、新しいタスクの作成、通話のログ記録、新しいイベント、メールなどのオプションが含まれます。アクションは、フィールドで指定された値を使用して実行されます。
* [Related list actions](/docs/salesforce-steps/sfdc-step-relatedlistaction) - 現在のレコードについて、関連リスト内のレコードタイプに対してアクションを実行します。現在のレコードに対して次のようなアクションを実行できます:
  * Create - 関連リスト内のタイプの新しいレコードを作成します。
  * Verify - 関連リスト内のタイプのレコードの値または数を検証します。返されたレコードのフィールドにフィルターを適用できます。
  * View - 関連リスト内のタイプのレコードを表示します。返されたレコードのフィールドにフィルターを適用できます。
* [Delete](/docs/salesforce-steps/sfdc-step-delete) - 現在のレコードを削除します。
* [Verify picklist options](/docs/salesforce-steps/sfdc-step-verifypicklistoptions) - レコードを作成する際に、特定のフィールドのドロップダウンメニュー（選択リスト）に特定のオプションが表示される、または表示されないことを検証します。

レコードに対してアクションを実行するSalesforceステップの場合、各フィールドにはアクションと値のペアがあります。

> 📘 ツールチップ
>
> フィールド名の上にマウスを置くと、次の情報が表示されます:
>
> * データ型 - フィールドの値のサポートされているデータ型（例: date）
> * API名 - フィールドの実際のフィールド名。これは、表示されているフィールドラベル名とは異なる場合があります。

各フィールドは、次のような**アクション**で構成されています:

* Input - フィールドに値を入力します。
* Verify - フィールドの値がレコードの値と一致することを検証します。
* Store - レコードの値を値に格納します。これはJavaScript変数になります。
* Ignore - フィールドに対してアクションを実行しません。

各**値**は、次のモードに設定できます:

* T. テキストモード。値はリテラル文字列として扱われます。
* \{JS}. JavaScriptモード。値はJavaScript式として評価されます。フィールドはJavaScript変数と関数を評価します。

## API操作

次のステップは、API（UI経由ではなく）を使用してSalesforceと対話します:

* [Execute Apex](https://help.testim.io/docs/sfdc-step-apex-action)- テスト内のステップとしてAPEXコードを実行することで、E2EテストをUIを超えて拡張できます。
* [Permission validation](https://help.testim.io/docs/sfdc-step-permission-validation) - Salesforceオブジェクトとそのフィールドに対するユーザー権限をキャプチャ、設定、および継続的に検証できます。

## CPQ操作

Configure Price Quote Softwareは、営業担当者が購入者のニーズに基づいてカスタマイズされた製品と価格設定で見積もりを作成し、取引のドキュメントとのすべてのやり取りをSalesforce CRM内で同期できる営業ツールです。CPQ操作カテゴリには、次のステップが含まれます:

* [Convert lead to opportunity](/docs/salesforce-steps/sfdc-step-convertleadtoopportunity) - レコードをリードから商談に分類変換します。
* [Quote line editor action](https://help.testim.io/docs/sfdc-step-quotelineeditor) - Quote Line Editor Actionステップは、見積もりの特定の明細項目および/または見積もり全体のCPQアプリケーションのQuote Line Editorで製品価格計算をテストするために使用できます。
