---
title: TTM for Jira 統合
description: >-
  TestimとTTM for Jira（Tricentis Test Management for
  Jira）を統合してテスト結果を自動的に同期する方法を説明します。統合設定、手動マッピング、一括作成とマッピング機能を網羅しています。
category: 統合
order: 12041
updated: '2025-09-18'
sourceUrl: 'https://help.testim.io/docs/ttm-for-jira-integration'
keywords:
  - TTM for Jira
  - Tricentis Test Management
  - Jira連携
  - テスト管理ツール
  - テストケース管理
  - 一括マッピング
  - リモートグリッド
---

## TTM for Jira 統合

TTM for Jira プロジェクトで Testim のテスト実行結果を表示します。

## TTM for Jira とは？

[Tricentis Test Management (TTM) for Jira](https://www.tricentis.com/products/test-management-jira)は、 Jira 内でのエンドツーエンドのテスト管理で、 QA と開発を連携させ、アイデアから本番環境まで、ソフトウェアに品質を組み込むことができます。

TTM for Jira は[Atlassian Marketplace](https://marketplace.atlassian.com/apps/1228672/tricentis-test-management-for-jira)にあり、 Jira 内でテスト管理を直接行いたい組織向けに特別に設計されています。 TTM for Jira を使用すると、 QA 、開発、ビジネスが緊密に連携して、品質の高いソフトウェアを一緒に提供できます。

- TTM for Jira のセットアップについては、[こちら](https://documentation.tricentis.com/tricentis_test_management_for_jira/content/admins/admins_overview.htm)の手順に従ってください。
- TTM for Jira のドキュメントを表示するには、[こちら](https://documentation.tricentis.com/tricentis_test_management_for_jira/content/introduction.htm)を参照してください。

## TTM for Jira 統合が必要な理由

TTM for Jira 統合により、 Testim のテストを TTM for Jira のテストケースにリンクできます。 Testim でテストを実行すると、テスト結果が自動的に TTM for Jira の実行結果に表示され、 Testim と TTM for Jira で実行されたテストを一元的に表示できます。

Testim テストを TTM for Jira にマッピングする方法は 2 つあります：

- [Testim テストを TTM for Jira に手動でマッピング](#testimのテストをttm-for-jiraに手動でマッピングする)
- [Testim テストグループ/フォルダーを TTM for Jira に一括作成およびマッピング](#ttm-for-jiraへのテストケースの一括作成とマッピング)

## TTM for Jira 統合の設定

TTM for Jira と Testim の統合を使用する前に、 Testim を TTM for Jira プロジェクトに接続する必要があります。このプロセスは一度だけ必要です。

### Testim を TTM for Jira に接続する手順

1. **Settings（設定）** > **Integrations（統合）** タブに移動します。**Test Management** の下に様々な統合モジュールがあります。
2. TTM for Jira 統合モジュールで、**login（ログイン）** をクリックします。

![TTM for Jira 統合モジュールのログインボタン](/images/test-management-integrations/ttm-for-jira-integration/ae5b0d9-ttmlogin.png)

3. TTM for Jira を開いて API キーを作成し、コピーします。詳細については、[Configure Tricentis Test Management for Jira](https://documentation.tricentis.com/tricentis_test_management_for_jira/content/admins/settings.htm)を参照してください。
4. Testim の **API Key** フィールドに貼り付けます。
5. Testim で **Connect（接続）** をクリックします。

![TTM for Jira API キー入力欄を示す Testim 設定画面](/images/test-management-integrations/ttm-for-jira-integration/cea53ae-addttmapikey.png)

6. Testim で、関連付けたい TTM for Jira プロジェクトをリストから選択します。

![TTM for Jira プロジェクトの選択ダイアログ](/images/test-management-integrations/ttm-for-jira-integration/768edf2-slectproject.png)

この時点で、 Testim は TTM for Jira のプロジェクトに関連付けられましたが、特定のテストにはマッピングされていません。

:::info{title="注意"}
一度に 1 つの TMS（テスト管理システム）のみ接続できます。 Testim システムが既に別の TMS に接続されている場合は、まずその TMS を切断してから TTM for Jira に接続する必要があります。 TMS を切断すると、テスト間の接続が削除されることに注意してください。そのため、以前の TMS に再度接続する場合は、接続も再作成する必要があります。
:::

## Testim のテストを TTM for Jira に手動でマッピングする

Testim と TTM for Jira の統合を設定した後、 Testim の特定のテストを TTM for Jira のテストにマッピングする準備が整います。

### Testim のテストを TTM for Jira のテストにマッピングする手順

1. Testim で、マッピングしたいテストを開きます。
2. Testim のテスト内で、**Setup** ステップ（最初のステップ）の **Properties（プロパティ）** アイコンをクリックします。

![Setup ステップの Properties アイコンが表示された Testim テスト](/images/test-management-integrations/ttm-for-jira-integration/56e072e-setupstepprops.png)

3. Setup ステップの **Properties（プロパティ）** パネルで、 Test in TTM for Jira の下で、最初のドロップダウンメニューから TTM for Jira プロジェクトを選択し、次に 2 番目のドロップダウンメニューから特定のテストを選択します。複数のテストケースをマッピングできます。

![TTM for Jira のテストを選択するマッピング設定画面](/images/test-management-integrations/ttm-for-jira-integration/7957825-maptotest.png)

4. **Save（保存）** をクリックします。

## TTM for Jira へのテストケースの一括作成とマッピング

既存の Testim アプリに大量のテストがあり、 TTM for Jira との連携を開始したいお客様向けに、一括作成およびマッピング機能が便利なソリューションを提供します。お客様は Testim テストライブラリからテストグループを選択でき、 Testim が TTM for Jira でテストケースを自動的に作成し、 Testim テストケースを新しく作成された Jira テストケースにマッピングします。

:::info{title="注意"}
- この一括マッピングオプションは、現在 TTM for Jira にテストがないお客様に最適ですが、一括マッピング機能を使用するための要件ではありません。
- 既に TTM for Jira に手動でマッピングしたテストがある場合、この一括マッピング機能は既にマッピングされたテストをスキップします。一括マッピングプロセスに含めたい場合は、[手動でテストのマッピングを解除](#ttm-for-jiraにマッピング済みのテストのマッピング解除)できます。
:::

### Testim テストケースを自動的に一括マッピングする手順

1. **Test Library（テストライブラリ）** に移動し、**1 つ以上のテストグループまたはテストフォルダーを選択**します。以下の例では、お客様がフォルダー「 aa1 」を選択しており、これには 3 つのテストが含まれています。「 aa1 」内には、さらに 3 つのテストを含むサブフォルダー「 bb1 」があります。フォルダー「 aa1 」を選択すると、 Testim は 6 つすべてのテストを TTM for Jira にマッピングします。

![Test Library で TTM 用フォルダーを選択している画面](/images/test-management-integrations/ttm-for-jira-integration/a2c0d7b-ttm4jira.png)

![選択されたフォルダー構造とテスト一覧の例](/images/test-management-integrations/ttm-for-jira-integration/6e12533-ttm4jira.png)

2. クイックナビゲーションメニューの **Create & map TTM for Jira tests** ボタンをクリックします。

![TTM for Jira への一括マッピングメニュー](/images/test-management-integrations/ttm-for-jira-integration/1ea3500-ttm4jira.png)

3. テストケースが作成される **TTM for Jira Project** を選択します。

![TTM for Jira プロジェクト選択とフォルダーパスオプション設定画面](/images/test-management-integrations/ttm-for-jira-integration/5ca389d-ttm4jira.png)

4. **Folder Path in TTM for Jira** セクションで、 Testim が TTM for Jira で作成するフォルダーパスオプションを選択します。
   1. **Create the same Testim folder path（同じ Testim フォルダーパスを作成）**: Jira のテストケースは、 Testim のテストケースと同じ名前と階層を使用します。
   2. **Create all test cases in My test cases folder（すべてのテストケースを My test cases フォルダーに作成）**: Jira のすべてのテストケースが単一の「 My Test Cases 」フォルダーに追加されます。

![TTM for Jira への一括作成とマッピング設定ダイアログ](/images/test-management-integrations/ttm-for-jira-integration/330c79b-image_2.png)

5. **Create & Map** ボタンをクリックします。 Testim はプログレスバーを表示します。

![TTM for Jira 一括マッピング処理の進行状況バー](/images/test-management-integrations/ttm-for-jira-integration/3750ea9-ttm4jira.png)

6. Testim は選択された Testim テストを反復処理し、 Testim テストケース名と選択したフォルダー構造を使用して TTM for Jira でテストケースを作成します。

![TTM for Jira に作成されたテストケースの一覧](/images/test-management-integrations/ttm-for-jira-integration/8997b82-ttm4jira.png)

7. 操作の終了時に、 Testim はマッピング結果を表示します。すべてのテストが正常にマッピングされた場合、 100% 完了メッセージが表示されます。

![一括マッピングが 100% 完了したことを示すメッセージ](/images/test-management-integrations/ttm-for-jira-integration/a63029e-ttm4jira.png)

8. マッピングに失敗したテストがある場合、正常にマッピングされたテストの総数と失敗したマッピングの名前を含むメッセージが表示されます。❗アイコンをクリックすると、失敗に関する追加の詳細を表示できます。

![マッピング失敗テストとエラー詳細を表示する画面](/images/test-management-integrations/ttm-for-jira-integration/b12eefd-ttm4jira.png)

9. テストまたは TTM for Jira 設定を調整した後、**Retry all** リンクをクリックすると、 Testim は**失敗したテストのみ**を再度 TTM for Jira にマッピングしようとします。

![Retry all リンクで失敗したテストのみを再マッピングする画面](/images/test-management-integrations/ttm-for-jira-integration/151d26f-ttm4jira.png)

### テストが TTM for Jira にマッピング済みかどうかを確認する方法

Testim テストプロパティで、テストが既に TTM for Jira にマッピングされているかどうかを識別できます。

#### テストが TTM for Jira にマッピング済みかどうかを確認する手順

1. テストに移動し、**Test Properties（テストプロパティ）** パネルを開きます。
2. **Test in TTM for Jira** セクションに移動します。このセクションに選択された Jira プロジェクトとテスト名がある場合、このテストは既に TTM for Jira にマッピングされています。

![Test Properties パネルに表示された TTM for Jira マッピング情報](/images/test-management-integrations/ttm-for-jira-integration/7c5dd59-ttm4jira.png)

### TTM for Jira にマッピング済みのテストのマッピング解除

Testim テストプロパティから、テストの TTM for Jira マッピングを手動で解除できます。

1. テストに移動し、**Test Properties（テストプロパティ）** パネルを開きます。
2. **Test in TTM for Jira** セクションに移動します。 Jira プロジェクトと Test Name フィールドから値をクリアします。

![TTM for Jira のマッピングを解除する Test Properties 画面](/images/test-management-integrations/ttm-for-jira-integration/36345a8-ttm4jira.png)

## テストの実行と TTM for Jira での Testim テスト結果の表示

TTM for Jira でテスト実行の結果を表示するには、リモートグリッドのみを使用して Testim でマッピングされたテストを実行する必要があります。 Testim でマッピングされたテストを実行すると、テスト結果が関連する TTM for Jira プロジェクトの「 Test Execution 」タブに表示されます（[こちら](https://documentation.tricentis.com/tricentis_test_management_for_jira/content/test_execution/test_cycles_runs.htm)を参照）。

![TTM for Jira の Test Execution タブに表示された Testim 実行結果](/images/test-management-integrations/ttm-for-jira-integration/40ba92d-testexectab.png)

Testim 発のテスト実行の名前は、以下の命名規則を使用します：

- `Testim.io <ブランチ名> : <実行名>` **`<YYYY-MM-DD>`** または
- `Testim.io <ブランチ名>` **`<YYYY-MM-DD>`**（実行名がない場合）

:::info{title="注意"}
データは UTC 日付を反映します。
:::

### TTM for Jira でテスト実行を表示する手順

1. 関連する実行をクリックして実行の詳細を取得します（[こちら](https://documentation.tricentis.com/tricentis_test_management_for_jira/content/test_execution/test_cycles_runs.htm)を参照）。

### Testim テスト実行の終了時

以下の詳細が Testim から TTM for Jira にプッシュされます：

- **Name** - Testim のテスト名
- **Status** - 実行のステータス。表示されるステータスは TTM for Jira ステータスで、 Testim ステータスから以下のように変換されます（Testim > TTM for Jira）：

<table class="md-table md-table-2cols">
 <thead>
  <tr>
   <th style="text-align: left;">
    Testim
   </th>
   <th style="text-align: left;">
    TTM for Jira
   </th>
  </tr>
 </thead>
 <tbody>
  <tr>
   <td style="text-align: left;">
    ABORTED
   </td>
   <td style="text-align: left;">
    Unexecuted
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    SKIPPED（テストが「 Quarantine 」ステータスの場合）
   </td>
   <td style="text-align: left;">
    Blocked
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    TIMEOUT
   </td>
   <td style="text-align: left;">
    Failed
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    PASSED
   </td>
   <td style="text-align: left;">
    Passed
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    FAILED
   </td>
   <td style="text-align: left;">
    Failed
   </td>
  </tr>
 </tbody>
</table>

:::warning{title="注意"}
TTM for Jira でこれらのステータスを変更すると、統合が中断される可能性があります。
:::

:::warning{title="注意"}
TTM for Jira の必須カスタムフィールドはサポートされていません。 TTM for Jira でカスタムフィールドを必須にすると、統合が機能しなくなる可能性があります。
:::
