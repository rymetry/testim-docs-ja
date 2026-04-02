---
title: Salesforce ステップ
description: Salesforce 環境での共通操作・レコード操作・ API 操作・ CPQ 操作を、テストに手動追加できる定義済みステップとして提供します。
category: Salesforceテスト
order: 16010
updated: '2025-12-02'
sourceUrl: 'https://docs.tricentis.com/testim/content/salesforce-testing/salesforce-steps/index.htm'
keywords:
  - Salesforce
  - Salesforce ステップ
  - Testim for Salesforce
  - 共通操作
  - レコード操作
  - API 操作
  - CPQ 操作
---

Salesforce ステップは、テストに手動で追加できます。これらのステップは、接続された Salesforce 環境のレコードとフィールドで事前入力された Salesforce の一般的なアクションをカバーしています。ステップは、共通操作、レコード操作、API 操作で構成されています。

![操作手順アニメーション](/images/salesforce-steps/salesforce-steps/488aa39-rework_salesforce_steps.gif)

## 共通操作

Salesforce の共通操作には、次の Salesforce 操作が含まれます:

- [ログイン](/docs/salesforce-testing/salesforce-steps/sfdc-step-login) - Salesforce 環境にログインします。ログインするペルソナを選択するか、新しいペルソナを作成します。
- [別のユーザーとしてログイン](/docs/salesforce-testing/salesforce-steps/sfdc-step-loginas) - 単一のテストケース内で異なるユーザーとしてログインします（管理者ユーザーが必要です）。
- [アプリを起動](/docs/salesforce-testing/salesforce-steps/sfdc-step-launchapp) - 起動する利用可能なアプリを選択します。
- [ログアウト](/docs/salesforce-testing/salesforce-steps/sfdc-step-logout) - Salesforce からログアウトします。
- [レコードを検索して移動](/docs/salesforce-testing/salesforce-steps/sfdc-step-findandgotorecord) - レコードのテキスト検索。グローバル検索を使用して、最初に一致するレコードを返します。
- [ページ読み込み待機](/docs/salesforce-testing/salesforce-steps/sfdc-step-waitforpageload) - 次のステップに進む前に、Salesforce がページを完全に読み込むのを待ちます。
- [コンソールタブを閉じる](/docs/salesforce-testing/salesforce-steps/sfdc-step-closeconsoletabs) - Salesforce のコンソールタブを閉じます。
- [ドキュメントの検証](/docs/salesforce-testing/salesforce-steps/sfdc-document-validation) - コーディングなしで設定できるさまざまな条件を使用して、PDF ドキュメントの内容を検証および/または抽出します。

## レコード操作

Salesforce のレコード操作には、次の Salesforce 操作が含まれます:

- [作成](/docs/salesforce-testing/salesforce-steps/sfdc-step-create) - フィールドの値で新しいレコードを作成します。
- [編集](/docs/salesforce-testing/salesforce-steps/sfdc-step-edit) - フィールドの値で現在のレコードを編集します。
- [検証](/docs/salesforce-testing/salesforce-steps/sfdc-step-validate) - 現在のレコードがフィールドと一致することを検証します。すべてのフィールドが完全に一致する場合にのみ、テストステップが合格します。
- [クイックアクション](/docs/salesforce-testing/salesforce-steps/sfdc-step-quickactions) - 現在のレコードで利用可能なクイックアクションを実行します。クイックアクションには、新しいタスクの作成、通話のログ記録、新しいイベント、メールなどのオプションが含まれます。アクションは、フィールドで指定された値を使用して実行されます。
- [関連リストアクション](/docs/salesforce-testing/salesforce-steps/sfdc-step-relatedlistaction) - 現在のレコードについて、関連リスト内のレコードタイプに対してアクションを実行します。現在のレコードに対して次のようなアクションを実行できます:
  - Create - 関連リスト内のタイプの新しいレコードを作成します。
  - Verify - 関連リスト内のタイプのレコードの値または数を検証します。返されたレコードのフィールドにフィルターを適用できます。
  - View - 関連リスト内のタイプのレコードを表示します。返されたレコードのフィールドにフィルターを適用できます。
- [削除](/docs/salesforce-testing/salesforce-steps/sfdc-step-delete) - 現在のレコードを削除します。
- [選択リストオプションの検証](/docs/salesforce-testing/salesforce-steps/sfdc-step-verifypicklistoptions) - レコードを作成する際に、特定のフィールドのドロップダウンメニュー（選択リスト）に特定のオプションが表示される、または表示されないことを検証します。

レコードに対してアクションを実行する Salesforce ステップの場合、各フィールドにはアクションと値のペアがあります。

:::note{title="ツールチップ"}
フィールド名の上にマウスを置くと、次の情報が表示されます:

- データ型 - フィールドの値のサポートされているデータ型（例: date）
- API 名 - フィールドの実際のフィールド名。これは、表示されているフィールドラベル名とは異なる場合があります。
  :::

各フィールドは、次のような**アクション**で構成されています:

- Input - フィールドに値を入力します。
- Verify - フィールドの値がレコードの値と一致することを検証します。
- Store - レコードの値を値に格納します。これは JavaScript 変数になります。
- Ignore - フィールドに対してアクションを実行しません。

各**値**は、次のモードに設定できます:

- T. テキストモード。値はリテラル文字列として扱われます。
- \{JS}. JavaScript モード。値は JavaScript 式として評価されます。フィールドは JavaScript 変数と関数を評価します。

## API 操作

次のステップは、API（UI 経由ではなく）を使用して Salesforce と対話します:

- [APEX を実行](/docs/salesforce-testing/salesforce-steps/sfdc-step-apex-action) - テスト内のステップとして APEX コードを実行することで、E2E テストを UI を超えて拡張できます。
- [権限の検証](/docs/salesforce-testing/salesforce-steps/sfdc-step-permission-validation) - Salesforce オブジェクトとそのフィールドに対するユーザー権限をキャプチャ、設定、および継続的に検証できます。

## CPQ 操作

Configure Price Quote Software は、営業担当者が購入者のニーズに基づいてカスタマイズされた製品と価格設定で見積もりを作成し、取引のドキュメントとのすべてのやり取りを Salesforce CRM 内で同期できる営業ツールです。CPQ 操作カテゴリには、次のステップが含まれます:

- [リードを商談に変換](/docs/salesforce-testing/salesforce-steps/sfdc-step-convertleadtoopportunity) - レコードをリードから商談に分類変換します。
- [見積品目エディターアクション](/docs/salesforce-testing/salesforce-steps/sfdc-step-quotelineeditor) - 見積もりの特定の明細項目および/または見積もり全体の CPQ アプリケーションで、製品価格計算を入力・検証します。
