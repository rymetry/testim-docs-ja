---
title: 'Xray統合'
description: 'TestimとXray for Jiraを統合してテスト結果を自動的に同期する方法を説明します。統合設定、テストケースのマッピング、結果の表示方法を網羅しています。'
category: 'test-management-integrations'
order: 50
updated: '2025-09-18'
sourceUrl: 'https://help.testim.io/docs/xray-integration'
keywords:
  - Xray
  - Jira連携
  - テスト管理ツール
  - テストケース管理
  - テスト結果同期
  - テスト実行
  - ステータスマッピング
---

# Xray統合

Xray JiraプロジェクトでTestimのテスト実行結果を表示します。

## Xrayとは？

Xrayは、テストの計画、設計、実行、およびテストレポートの生成を可能にします。Xrayはこのプロセスに特定のJira課題タイプを使用します。

## Xray統合が必要な理由

Xray統合により、TestimのテストをXrayのテストケースにリンクできます。Testimでテストを実行すると、テスト結果が自動的にXrayの実行結果に表示され、TestimとXrayで実行されたテストを一元的に表示できます。

## Xray統合の設定

Xray統合を使用する前に、TestimをXrayプロジェクトに接続する必要があります。このプロセスは一度だけ必要です。

統合を実行するには、以下が必要です：

- **Jira APIトークン** - Jira APIトークンを取得するには、[https://support.atlassian.com/atlassian-account/docs/manage-api-tokens-for-your-atlassian-account/](https://support.atlassian.com/atlassian-account/docs/manage-api-tokens-for-your-atlassian-account/)の手順に従ってください。
- **XrayクライアントIDとXrayクライアントシークレット** - XrayクライアントIDとクライアントシークレットを取得するには、[https://docs.getxray.app/display/XRAYCLOUD/Global+Settings%3A+API+Keys](https://docs.getxray.app/display/XRAYCLOUD/Global+Settings%3A+API+Keys)の手順に従ってください。

### TestimをXrayに接続する手順

1. **Settings（設定）** > **Integrations（統合）** タブに移動します。**Test Management** の下に様々な統合モジュールがあります。
2. Xray統合モジュールで、**login（ログイン）** をクリックします。

![Xray統合モジュールのログインボタン](/images/test-management-integrations/xray-integration/c11e6d6-image.png)

3. **Jira APIトークン**、**XrayクライアントID**、**Xrayクライアントシークレット** フィールドに、取得した認証情報を貼り付けます（上記の導入部分を参照）。
4. **Jiraユーザー名** と **Jira URL** を追加します。

![Jira APIトークンとXrayクライアント情報を入力する画面](/images/test-management-integrations/xray-integration/a4eef2a-image_1.png)

5. **Connect（接続）** をクリックします。\
   この時点で、TestimはXrayのプロジェクトに関連付けられましたが、特定のテストにはマッピングされていません。

> 📘
>
> 一度に1つのTMS（テスト管理システム）のみ接続できます。Testimシステムが既に別のTMSに接続されている場合は、まずそのTMSを切断してからXrayに接続する必要があります。ただし、TMSを切断すると、テスト間の接続が削除されます。そのため、以前のTMSに再度接続する場合は、接続も再作成する必要があります。

6. Testimで、関連付けたいXrayプロジェクトをリストから選択します。

   ![関連付けたいXrayプロジェクトを選択する画面](/images/test-management-integrations/xray-integration/88115b5-image_2.png)

## TestimのテストをXrayテストケースにマッピングする

TestimとXrayの統合を設定した後、Testimの特定のテストをXrayのテストにマッピングする準備が整います。

### TestimのテストをXrayのテストにマッピングする手順

1. Testimで、マッピングしたいテストを開きます。
2. Testimのテスト内で、**Setup** ステップ（最初のステップ）の **Properties（プロパティ）** アイコンをクリックします。

![SetupステップのPropertiesアイコンが表示されたTestimテスト](/images/test-management-integrations/xray-integration/56e072e-setupstepprops.png)

3. Setupステップの **Properties（プロパティ）** パネルで、Test in Xrayの下で、最初のドロップダウンメニューからXrayプロジェクトを選択し、次に2番目のドロップダウンメニューから特定のテストを選択します。複数のテストケースをマッピングできます。

![Test in Xrayでプロジェクトとテストを選択するドロップダウン](/images/test-management-integrations/xray-integration/54bed6c-Picture3.png)

4. **Save（保存）** をクリックします。

## テストの実行とXrayでのTestimテスト結果の表示

Xrayでテスト実行の結果を表示するには、リモートグリッドのみを使用してTestimでマッピングされたテストを実行する必要があります。Testimでマッピングされたテストを実行すると、テスト結果が関連するXrayプロジェクトのプロジェクトボードの「To Do」列の適切なテスト実行の下に表示されます。\
実行の名前は `"<Testim実行名><UTC時刻>"` です。

> 📘
>
> Xray側のテストの **issue type（課題タイプ）** は [Test](https://docs.getxray.app/display/ON/Enabling+Xray+Issue+Types) である必要があります。\
> Xrayの **Test** 課題タイプが変更された場合、実行はXrayでテストされません。

![XrayプロジェクトボードのTo Do列に表示されたテスト実行](/images/test-management-integrations/xray-integration/4a95d2f-image_3.png)

関連する実行をクリックして、実行の詳細を取得します。

![Xrayでのテスト実行詳細画面](/images/test-management-integrations/xray-integration/c163dfb-image_4.png)

以下の詳細がTestimからXrayにプッシュされます：

![TestimからXrayにプッシュされるテスト名やステータスの一覧](/images/test-management-integrations/xray-integration/ef5842d-Picture7.png)

- Name - Testimのテスト名
- Testimのテスト実行へのリンク
- Testimのテスト実行のコンソールログのURL（Webのみ）
- Testimのテスト実行のネットワークログのURL（Webのみ）
- Status - 実行のステータス。表示されるステータスはXrayステータスで、Testimステータスから以下のように変換されます（Testim > Xray）：

<table class="md-table md-table-2cols">
 <thead>
  <tr>
   <th style="text-align: left;">
    Testim
   </th>
   <th style="text-align: left;">
    Xray
   </th>
  </tr>
 </thead>
 <tbody>
  <tr>
   <td style="text-align: left;">
    skipped
   </td>
   <td style="text-align: left;">
    TODO
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    failed
   </td>
   <td style="text-align: left;">
    FAIL
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    timeout
   </td>
   <td style="text-align: left;">
    FAIL
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    aborted
   </td>
   <td style="text-align: left;">
    TODO
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    passed
   </td>
   <td style="text-align: left;">
    PASSED
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    Testimに該当なし
   </td>
   <td style="text-align: left;">
    EXECUTING
   </td>
  </tr>
 </tbody>
</table>


> 📘
>
> Xrayでこれらのステータスを変更すると、統合が中断される可能性があります。

> 📘
>
> Xrayの必須カスタムフィールドはサポートされていません。Xrayでカスタムフィールドを必須にすると、統合が機能しなくなる可能性があります。
