---
title: 'Salesforceステップ'
description: 'Salesforce環境での共通操作・レコード操作・API操作・CPQ操作を、テストに手動追加できる定義済みステップとして提供します。'
category: 'Salesforceステップ'
order: 1
updated: '2025-12-02'
sourceUrl: 'https://help.testim.io/docs/salesforce-steps'
keywords:
  - Salesforce
  - Salesforceステップ
  - Testim for Salesforce
  - 共通操作
  - レコード操作
  - API操作
  - CPQ操作
---
Salesforceステップは、テストに手動で追加できます。これらのステップは、接続されたSalesforce環境のレコードとフィールドで事前入力されたSalesforceの一般的なアクションをカバーしています。ステップは、共通操作、レコード操作、API操作で構成されています。

![](/images/salesforce-steps/salesforce-steps/488aa39-rework_salesforce_steps.gif)

## 共通操作

Salesforceの共通操作には、次のSalesforce操作が含まれます:

* [ログイン](/docs/sfdc-step-login) - Salesforce環境にログインします。ログインするペルソナを選択するか、新しいペルソナを作成します。
* [別のユーザーとしてログイン](/docs/sfdc-step-loginas) - 単一のテストケース内で異なるユーザーとしてログインします（管理者ユーザーが必要です）。
* [アプリを起動](/docs/sfdc-step-launchapp) - 起動する利用可能なアプリを選択します。
* [ログアウト](/docs/sfdc-step-logout) - Salesforceからログアウトします。
* [レコードを検索して移動](/docs/sfdc-step-findandgotorecord) - レコードのテキスト検索。グローバル検索を使用して、最初に一致するレコードを返します。
* [ページ読み込み待機](/docs/sfdc-step-waitforpageload) - 次のステップに進む前に、Salesforceがページを完全に読み込むのを待ちます。
* [コンソールタブを閉じる](/docs/sfdc-step-closeconsoletabs) - Salesforceのコンソールタブを閉じます。
* [ドキュメントの検証](/docs/sfdc-document-validation) - コーディングなしで設定できるさまざまな条件を使用して、PDFドキュメントの内容を検証および/または抽出します。

## レコード操作

Salesforceのレコード操作には、次のSalesforce操作が含まれます:

* [作成](/docs/sfdc-step-create) - フィールドの値で新しいレコードを作成します。
* [編集](/docs/sfdc-step-edit) - フィールドの値で現在のレコードを編集します。
* [検証](/docs/sfdc-step-validate) - 現在のレコードがフィールドと一致することを検証します。すべてのフィールドが完全に一致する場合にのみ、テストステップが合格します。
* [クイックアクション](/docs/sfdc-step-quickactions) - 現在のレコードで利用可能なクイックアクションを実行します。クイックアクションには、新しいタスクの作成、通話のログ記録、新しいイベント、メールなどのオプションが含まれます。アクションは、フィールドで指定された値を使用して実行されます。
* [関連リストアクション](/docs/sfdc-step-relatedlistaction) - 現在のレコードについて、関連リスト内のレコードタイプに対してアクションを実行します。現在のレコードに対して次のようなアクションを実行できます:
  * Create - 関連リスト内のタイプの新しいレコードを作成します。
  * Verify - 関連リスト内のタイプのレコードの値または数を検証します。返されたレコードのフィールドにフィルターを適用できます。
  * View - 関連リスト内のタイプのレコードを表示します。返されたレコードのフィールドにフィルターを適用できます。
* [削除](/docs/sfdc-step-delete) - 現在のレコードを削除します。
* [選択リストオプションの検証](/docs/sfdc-step-verifypicklistoptions) - レコードを作成する際に、特定のフィールドのドロップダウンメニュー（選択リスト）に特定のオプションが表示される、または表示されないことを検証します。

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

* [APEX を実行](/docs/sfdc-step-apex-action) - テスト内のステップとしてAPEXコードを実行することで、E2EテストをUIを超えて拡張できます。
* [権限の検証](/docs/sfdc-step-permission-validation) - Salesforceオブジェクトとそのフィールドに対するユーザー権限をキャプチャ、設定、および継続的に検証できます。

## CPQ操作

Configure Price Quote Softwareは、営業担当者が購入者のニーズに基づいてカスタマイズされた製品と価格設定で見積もりを作成し、取引のドキュメントとのすべてのやり取りをSalesforce CRM内で同期できる営業ツールです。CPQ操作カテゴリには、次のステップが含まれます:

* [リードを商談に変換](/docs/sfdc-step-convertleadtoopportunity) - レコードをリードから商談に分類変換します。
* [見積品目エディターアクション](/docs/sfdc-step-quotelineeditor) - 見積もりの特定の明細項目および/または見積もり全体のCPQアプリケーションで、製品価格計算を入力・検証します。
