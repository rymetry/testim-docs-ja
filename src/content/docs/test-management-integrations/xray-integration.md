---
title: Xray 統合
description: >-
  Testim と Xray for
  Jira を統合してテスト結果を自動的に同期する方法を説明します。統合設定、テストケースのマッピング、結果の表示方法を網羅しています。
category: 統合
order: 12042
updated: '2025-09-18'
sourceUrl: 'https://help.testim.io/docs/xray-integration'
keywords:
  - Xray
  - Jira 連携
  - テスト管理ツール
  - テストケース管理
  - テスト結果同期
  - テスト実行
  - ステータスマッピング
---

## Xray 統合

Xray Jira プロジェクトで Testim のテスト実行結果を表示します。

## Xray とは？

Xray は、テストの計画、設計、実行、およびテストレポートの生成を可能にします。Xray はこのプロセスに特定の Jira 課題タイプを使用します。

## Xray 統合が必要な理由

Xray 統合により、Testim のテストを Xray のテストケースにリンクできます。Testim でテストを実行すると、テスト結果が自動的に Xray の実行結果に表示され、Testim と Xray で実行されたテストを一元的に表示できます。

## Xray 統合の設定

Xray 統合を使用する前に、Testim を Xray プロジェクトに接続する必要があります。このプロセスは一度だけ必要です。

統合を実行するには、以下が必要です：

- **Jira API トークン** - Jira API トークンを取得するには、[https://support.atlassian.com/atlassian-account/docs/manage-api-tokens-for-your-atlassian-account/](https://support.atlassian.com/atlassian-account/docs/manage-api-tokens-for-your-atlassian-account/)の手順に従ってください。
- **Xray クライアント ID と Xray クライアントシークレット** - Xray クライアント ID とクライアントシークレットを取得するには、[https://docs.getxray.app/display/XRAYCLOUD/Global+Settings%3A+API+Keys](https://docs.getxray.app/display/XRAYCLOUD/Global+Settings%3A+API+Keys)の手順に従ってください。

### Testim を Xray に接続する手順

1. **Settings（設定）** > **Integrations（統合）** タブに移動します。**Test Management** の下に様々な統合モジュールがあります。
2. Xray 統合モジュールで、**login（ログイン）** をクリックします。

![Xray 統合モジュールのログインボタン](/images/test-management-integrations/xray-integration/c11e6d6-image.png)

3. **Jira API トークン**、**Xray クライアント ID**、**Xray クライアントシークレット** フィールドに、取得した認証情報を貼り付けます（上記の導入部分を参照）。
4. **Jira ユーザー名** と **Jira URL** を追加します。

![Jira API トークンと Xray クライアント情報を入力する画面](/images/test-management-integrations/xray-integration/a4eef2a-image_1.png)

5. **Connect（接続）** をクリックします。\
   この時点で、Testim は Xray のプロジェクトに関連付けられましたが、特定のテストにはマッピングされていません。

:::info
一度に 1 つの TMS（テスト管理システム）のみ接続できます。Testim システムが既に別の TMS に接続されている場合は、まずその TMS を切断してから Xray に接続する必要があります。ただし、TMS を切断すると、テスト間の接続が削除されます。そのため、以前の TMS に再度接続する場合は、接続も再作成する必要があります。
:::

6. Testim で、関連付けたい Xray プロジェクトをリストから選択します。

   ![関連付けたい Xray プロジェクトを選択する画面](/images/test-management-integrations/xray-integration/88115b5-image_2.png)

## Testim のテストを Xray テストケースにマッピングする

Testim と Xray の統合を設定した後、Testim の特定のテストを Xray のテストにマッピングする準備が整います。

### Testim のテストを Xray のテストにマッピングする手順

1. Testim で、マッピングしたいテストを開きます。
2. Testim のテスト内で、**Setup** ステップ（最初のステップ）の **Properties（プロパティ）** アイコンをクリックします。

![Setup ステップの Properties アイコンが表示された Testim テスト](/images/test-management-integrations/xray-integration/56e072e-setupstepprops.png)

3. Setup ステップの **Properties（プロパティ）** パネルで、Test in Xray の下で、最初のドロップダウンメニューから Xray プロジェクトを選択し、次に 2 番目のドロップダウンメニューから特定のテストを選択します。複数のテストケースをマッピングできます。

![Test in Xray でプロジェクトとテストを選択するドロップダウン](/images/test-management-integrations/xray-integration/54bed6c-Picture3.png)

4. **Save（保存）** をクリックします。

## テストの実行と Xray での Testim テスト結果の表示

Xray でテスト実行の結果を表示するには、リモートグリッドのみを使用して Testim でマッピングされたテストを実行する必要があります。Testim でマッピングされたテストを実行すると、テスト結果が関連する Xray プロジェクトのプロジェクトボードの「To Do」列の適切なテスト実行の下に表示されます。\
実行の名前は `"<Testim実行名><UTC時刻>"` です。

:::info
Xray 側のテストの **issue type（課題タイプ）** は [Test](https://docs.getxray.app/display/ON/Enabling+Xray+Issue+Types) である必要があります。
Xray の **Test** 課題タイプが変更された場合、実行は Xray でテストされません。
:::

![Xray プロジェクトボードの To Do 列に表示されたテスト実行](/images/test-management-integrations/xray-integration/4a95d2f-image_3.png)

関連する実行をクリックして、実行の詳細を取得します。

![Xray でのテスト実行詳細画面](/images/test-management-integrations/xray-integration/c163dfb-image_4.png)

以下の詳細が Testim から Xray にプッシュされます：

![Testim から Xray にプッシュされるテスト名やステータスの一覧](/images/test-management-integrations/xray-integration/ef5842d-Picture7.png)

- Name - Testim のテスト名
- Testim のテスト実行へのリンク
- Testim のテスト実行のコンソールログの URL（Web のみ）
- Testim のテスト実行のネットワークログの URL（Web のみ）
- Status - 実行のステータス。表示されるステータスは Xray ステータスで、Testim ステータスから以下のように変換されます（Testim > Xray）：

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
    Testim に該当なし
   </td>
   <td style="text-align: left;">
    EXECUTING
   </td>
  </tr>
 </tbody>
</table>

:::warning
Xray でこれらのステータスを変更すると、統合が中断される可能性があります。
:::

:::warning
Xray の必須カスタムフィールドはサポートされていません。Xray でカスタムフィールドを必須にすると、統合が機能しなくなる可能性があります。
:::
