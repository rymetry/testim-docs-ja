---
title: 'TTM for Jira統合'
description: 'TestimとTTM for Jira（Tricentis Test Management for Jira）を統合してテスト結果を自動的に同期する方法を説明します。統合設定、手動マッピング、一括作成とマッピング機能を網羅しています。'
category: 'test-management-integrations'
order: 40
updated: '2025-11-11'
keywords:
  - testim
  - ttm
  - tricentis
  - jira
  - テスト管理
  - 統合設定
---

# TTM for Jira統合

TTM for JiraプロジェクトでTestimのテスト実行結果を表示します。

## TTM for Jiraとは？

[Tricentis Test Management (TTM) for Jira](https://www.tricentis.com/products/test-management-jira)は、Jira内でのエンドツーエンドのテスト管理で、QAと開発を連携させ、アイデアから本番環境まで、ソフトウェアに品質を組み込むことができます。

TTM for Jiraは[Atlassian Marketplace](https://marketplace.atlassian.com/apps/1228672/tricentis-test-management-for-jira)にあり、Jira内でテスト管理を直接行いたい組織向けに特別に設計されています。TTM for Jiraを使用すると、QA、開発、ビジネスが緊密に連携して、品質の高いソフトウェアを一緒に提供できます。

- TTM for Jiraのセットアップについては、[こちら](https://documentation.tricentis.com/tricentis_test_management_for_jira/content/admins/admins_overview.htm)の手順に従ってください。
- TTM for Jiraのドキュメントを表示するには、[こちら](https://documentation.tricentis.com/tricentis_test_management_for_jira/content/introduction.htm)を参照してください。

## TTM for Jira統合が必要な理由

TTM for Jira統合により、TestimのテストをTTM for Jiraのテストケースにリンクできます。Testimでテストを実行すると、テスト結果が自動的にTTM for Jiraの実行結果に表示され、TestimとTTM for Jiraで実行されたテストを一元的に表示できます。

TestimテストをTTM for Jiraにマッピングする方法は2つあります：

- [TestimテストをTTM for Jiraに手動でマッピング](#testimのテストをttm-for-jiraに手動でマッピングする)
- [Testimテストグループ/フォルダをTTM for Jiraに一括作成およびマッピング](#ttm-for-jiraへのテストケースの一括作成とマッピング)

## TTM for Jira統合の設定

TTM for JiraとTestimの統合を使用する前に、TestimをTTM for Jiraプロジェクトに接続する必要があります。このプロセスは一度だけ必要です。

### TestimをTTM for Jiraに接続する手順

1. **Settings（設定）** > **Integrations（統合）** タブに移動します。**Test Management** の下に様々な統合モジュールがあります。
2. TTM for Jira統合モジュールで、**login（ログイン）** をクリックします。

![](/images/test-management-integrations/ttm-for-jira-integration/ae5b0d9-ttmlogin.png)

3. TTM for Jiraを開いてAPIキーを作成し、コピーします。詳細については、[Configure Tricentis Test Management for Jira](https://documentation.tricentis.com/tricentis_test_management_for_jira/content/admins/settings.htm)を参照してください。
4. Testimの **API Key** フィールドに貼り付けます。
5. Testimで **Connect（接続）** をクリックします。

![](/images/test-management-integrations/ttm-for-jira-integration/cea53ae-addttmapikey.png)

6. Testimで、関連付けたいTTM for Jiraプロジェクトをリストから選択します。

![](/images/test-management-integrations/ttm-for-jira-integration/768edf2-slectproject.png)

この時点で、TestimはTTM for Jiraのプロジェクトに関連付けられましたが、特定のテストにはマッピングされていません。

> 📘 注意:
>
> 一度に1つのTMS（テスト管理システム）のみ接続できます。Testimシステムが既に別のTMSに接続されている場合は、まずそのTMSを切断してからTTM for Jiraに接続する必要があります。TMSを切断すると、テスト間の接続が削除されることに注意してください。そのため、以前のTMSに再度接続する場合は、接続も再作成する必要があります。

## TestimのテストをTTM for Jiraに手動でマッピングする

TestimとTTM for Jiraの統合を設定した後、Testimの特定のテストをTTM for Jiraのテストにマッピングする準備が整います。

### TestimのテストをTTM for Jiraのテストにマッピングする手順

1. Testimで、マッピングしたいテストを開きます。
2. Testimのテスト内で、**Setup** ステップ（最初のステップ）の **Properties（プロパティ）** アイコンをクリックします。

![](/images/test-management-integrations/ttm-for-jira-integration/56e072e-setupstepprops.png)

3. Setupステップの **Properties（プロパティ）** パネルで、Test in TTM for Jiraの下で、最初のドロップダウンメニューからTTM for Jiraプロジェクトを選択し、次に2番目のドロップダウンメニューから特定のテストを選択します。複数のテストケースをマッピングできます。

![](/images/test-management-integrations/ttm-for-jira-integration/7957825-maptotest.png)

4. **Save（保存）** をクリックします。

## TTM for Jiraへのテストケースの一括作成とマッピング

既存のTestimアプリに大量のテストがあり、TTM for Jiraとの連携を開始したいお客様向けに、一括作成およびマッピング機能が便利なソリューションを提供します。お客様はTestimテストライブラリからテストグループを選択でき、TestimがTTM for Jiraでテストケースを自動的に作成し、Testimテストケースを新しく作成されたJiraテストケースにマッピングします。

> 📘 注意:
>
> - この一括マッピングオプションは、現在TTM for Jiraにテストがないお客様に最適ですが、一括マッピング機能を使用するための要件ではありません。
> - 既にTTM for Jiraに手動でマッピングしたテストがある場合、この一括マッピング機能は既にマッピングされたテストをスキップします。一括マッピングプロセスに含めたい場合は、[手動でテストのマッピングを解除](#ttm-for-jiraにマッピング済みのテストのマッピング解除)できます。

### Testimテストケースを自動的に一括マッピングする手順

1. **Test Library（テストライブラリ）** に移動し、**1つ以上のテストグループまたはテストフォルダを選択**します。以下の例では、お客様がフォルダ「aa1」を選択しており、これには3つのテストが含まれています。「aa1」内には、さらに3つのテストを含むサブフォルダ「bb1」があります。フォルダ「aa1」を選択すると、Testimは6つすべてのテストをTTM for Jiraにマッピングします。

![](/images/test-management-integrations/ttm-for-jira-integration/a2c0d7b-ttm4jira.png)

![](/images/test-management-integrations/ttm-for-jira-integration/6e12533-ttm4jira.png)

2. クイックナビゲーションメニューの **Create & map TTM for Jira tests** ボタンをクリックします。

![](/images/test-management-integrations/ttm-for-jira-integration/1ea3500-ttm4jira.png)

3. テストケースが作成される **TTM for Jira Project** を選択します。

![](/images/test-management-integrations/ttm-for-jira-integration/5ca389d-ttm4jira.png)

4. **Folder Path in TTM for Jira** セクションで、TestimがTTM for Jiraで作成するフォルダパスオプションを選択します。
   1. **Create the same Testim folder path（同じTestimフォルダパスを作成）**: Jiraのテストケースは、Testimのテストケースと同じ名前と階層を使用します。
   2. **Create all test cases in My test cases folder（すべてのテストケースをMy test casesフォルダに作成）**: Jiraのすべてのテストケースが単一の「My Test Cases」フォルダに追加されます。

![](/images/test-management-integrations/ttm-for-jira-integration/330c79b-image_2.png)

5. **Create & Map** ボタンをクリックします。Testimはプログレスバーを表示します。

![](/images/test-management-integrations/ttm-for-jira-integration/3750ea9-ttm4jira.png)

6. Testimは選択されたTestimテストを反復処理し、Testimテストケース名と選択したフォルダ構造を使用してTTM for Jiraでテストケースを作成します。

![](/images/test-management-integrations/ttm-for-jira-integration/8997b82-ttm4jira.png)

7. 操作の終了時に、Testimはマッピング結果を表示します。すべてのテストが正常にマッピングされた場合、100%完了メッセージが表示されます。

![](/images/test-management-integrations/ttm-for-jira-integration/a63029e-ttm4jira.png)

8. マッピングに失敗したテストがある場合、正常にマッピングされたテストの総数と失敗したマッピングの名前を含むメッセージが表示されます。❗アイコンにカーソルを合わせると、失敗に関する追加の詳細を表示できます。

![](/images/test-management-integrations/ttm-for-jira-integration/b12eefd-ttm4jira.png)

9. テストまたはTTM for Jira設定を調整した後、**Retry all** リンクをクリックすると、Testimは**失敗したテストのみ**を再度TTM for Jiraにマッピングしようとします。

![](/images/test-management-integrations/ttm-for-jira-integration/151d26f-ttm4jira.png)

### テストがTTM for Jiraにマッピング済みかどうかを確認する方法

Testimテストプロパティで、テストが既にTTM for Jiraにマッピングされているかどうかを識別できます。

#### テストがTTM for Jiraにマッピング済みかどうかを確認する手順

1. テストに移動し、**Test Properties（テストプロパティ）** パネルを開きます。
2. **Test in TTM for Jira** セクションに移動します。このセクションに選択されたJiraプロジェクトとテスト名がある場合、このテストは既にTTM for Jiraにマッピングされています。

![](/images/test-management-integrations/ttm-for-jira-integration/7c5dd59-ttm4jira.png)

### TTM for Jiraにマッピング済みのテストのマッピング解除

Testimテストプロパティから、テストのTTM for Jiraマッピングを手動で解除できます。

1. テストに移動し、**Test Properties（テストプロパティ）** パネルを開きます。
2. **Test in TTM for Jira** セクションに移動します。JiraプロジェクトとTest Nameフィールドから値をクリアします。

![](/images/test-management-integrations/ttm-for-jira-integration/36345a8-ttm4jira.png)

## テストの実行とTTM for JiraでのTestimテスト結果の表示

TTM for Jiraでテスト実行の結果を表示するには、リモートグリッドのみを使用してTestimでマッピングされたテストを実行する必要があります。Testimでマッピングされたテストを実行すると、テスト結果が関連するTTM for Jiraプロジェクトの「Test Execution」タブに表示されます（[こちら](https://documentation.tricentis.com/tricentis_test_management_for_jira/content/test_execution/test_cycles_runs.htm)を参照）。

![](/images/test-management-integrations/ttm-for-jira-integration/40ba92d-testexectab.png)

Testim発のテスト実行の名前は、以下の命名規則を使用します：

- "Testim.io `<ブランチ名> : <実行名>" **<YYYY-MM-DD>**` または
- "Testim.io `<ブランチ名>" **<YYYY-MM-DD>**`（実行名がない場合）

> 📘 注意
>
> データはUTC日付を反映します。

### TTM for Jiraでテスト実行を表示する手順

1. 関連する実行をクリックして実行の詳細を取得します（[こちら](https://documentation.tricentis.com/tricentis_test_management_for_jira/content/test_execution/test_cycles_runs.htm)を参照）。

### Testimテスト実行の終了時

以下の詳細がTestimからTTM for Jiraにプッシュされます：

- **Name** - Testimのテスト名
- **Status** - 実行のステータス。表示されるステータスはTTM for Jiraステータスで、Testimステータスから以下のように変換されます（Testim > TTM for Jira）：

| Testim                                        | TTM for Jira |
| :-------------------------------------------- | :----------- |
| ABORTED                                       | Unexecuted   |
| SKIPPED（テストが「Quarantine」ステータスの場合） | Blocked      |
| TIMEOUT                                       | Failed       |
| PASSED                                        | Passed       |
| FAILED                                        | Failed       |

> 📘 注意:
>
> TTM for JIRAでこれらのステータスを変更すると、統合が中断される可能性があります。

> 📘 注意:
>
> TTM for Jiraの必須カスタムフィールドはサポートされていません。TTM for Jiraでカスタムフィールドを必須にすると、統合が機能しなくなる可能性があります。
