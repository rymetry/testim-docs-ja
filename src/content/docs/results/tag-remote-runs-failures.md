---
title: '失敗した実行への失敗タイプのタグ付け'
description: '失敗したリモート実行にタグを付けてデータを収集し、レポートのインサイトを提供する方法。失敗タイプ、説明、課題へのリンク。'
category: '結果'
order: 14
updated: '2025-11-11'
keywords:
  - testim
  - tag-remote-runs-failures
  - results
  - 失敗タイプ
  - タグ付け
---

失敗した実行に失敗タイプを追加して、データを収集しレポートのインサイトを提供します。

リモート実行では、失敗したテストに失敗タイプのタグを付けることができます。タグ付けは、テストが失敗した理由の履歴記録を提供し、トレンドを特定してプロセス改善に役立つインサイトを提供します。

## テスト結果画面からのテスト失敗のタグ付け

リモートで実行された失敗したテストにタグを付け、説明を追加し、以前に報告された課題にリンクしたり、新しい課題を作成したりできます。新しい課題をバグ/課題追跡システムに公開する場合は、最初にTestimと課題追跡システム（バグトラッカーとも呼ばれます）との接続を設定する必要があります。詳細については、[バグトラッカー設定](/docs/bug-tracker-settings/bug-tracker-settings)を参照してください。

:fa-arrow-right: **テスト失敗タグを追加するには:**

1. リモート実行テストの実行後、テストが失敗した場合は、**Tag Test Failure**リンクをクリックします。

> ❗️ 「Run locally」ではなく「Run on grid」オプションを使用してテストを実行してください

![1155](/images/results/tag-remote-runs-failures/3ee72ad-tag6.png "tag6.png")

次のダイアログが表示されます。

![](/images/results/tag-remote-runs-failures/49d2321-Screen_Shot_2021-08-21_at_7.47.29.png)

2. **Failure type**フィールドで、次のいずれかのオプションを選択します。

* Bug in app（アプリケーションのバグ）
* Environment issue（環境の問題）
* Invalid test data（無効なテストデータ）
* Test design（テスト設計）
* Other（その他）

3. **Description**フィールドに、失敗の具体的な理由またはコンテキストを入力します（オプション）。
4. **Link to issue**フィールドで、[失敗したテスト実行のバグレポートの作成](docs:tag-remote-runs-failures#creating-a-bug-report-for-the-failed-test-run)の手順に従ってバグレポートを送信します。
5. **Add**をクリックして保存します。

## 失敗したテスト実行のバグレポートの作成

失敗した実行へのタグ付けプロセスの一環として、バグトラッキングシステム（Jira、Slack、Trelloなど）の既存の課題にリンクするか、バグトラッキングシステムに追加される新しい課題/バグレポートを作成することで、バグレポートを作成できます。

:fa-arrow-right: **バグトラッキングシステムの既存の課題にリンクするには:**

1. バグトラッキングシステムがTestimと統合されていることを確認してください。詳細および詳細な手順については、[バグトラッカー設定](/docs/bug-tracker-settings/bug-tracker-settings)を参照してください。
2. **Tag Test Failure**ダイアログの**Link to issue**フィールドに、既存の課題のURLを追加します。
3. テスト失敗のタグ付けプロセスを完了します。

:fa-arrow-right: **新しいバグレポートを作成するには:**

1. バグトラッキングシステムがTestimと統合されていることを確認してください。詳細および詳細な手順については、[バグトラッカー設定](/docs/bug-tracker-settings/bug-tracker-settings)を参照してください。
2. **Tag Test Failure**ダイアログで、**Create issue**をクリックして、バグトラッキングシステムに新しい課題を作成します。\
   バグの詳細が自動的に作成され、**Publish Bug**画面が表示されます。

![3145](/images/results/tag-remote-runs-failures/60c8974-jiraaftercreateissue.PNG "jiraaftercreateissue.PNG")

3. **Summary**フィールドに、わかりやすい要約を入力します。
4. ProjectとTypeの選択を変更し、提案されたテキストを編集できます。
5. 完了したら、**Publish**をクリックして課題を公開します。\
   **Link to issue**フィールドには、新しく作成された課題または既存の課題のURLが含まれます。

![](/images/results/tag-remote-runs-failures/c4ab431-linktoissue.png)

6. **Add**をクリックして保存します。

## 既存のテスト失敗タグの編集

テスト失敗にタグを付けた後、既存のテスト失敗タグを編集できます。

1. **Test List**画面から、該当するテストをクリックします。\
   テストエディター画面に、以前に選択したテスト失敗タグが表示されます。

![](/images/results/tag-remote-runs-failures/84be8ad-previoustag.png)

2. タグにマウスを合わせ、**Edit Tag**アイコンをクリックします。

![398](/images/results/tag-remote-runs-failures/5f62567-edit_tasg_icon.png "edit_tasg_icon.png")

3. 既存のテスト失敗タグを編集します。

![](/images/results/tag-remote-runs-failures/d60af77-newtag.PNG)

4. **ADD**をクリックして保存します。

## Test Runs画面からの複数のテスト失敗のタグ付け

:fa-arrow-right: **Test Runs画面で複数のテストにタグを付けるには:**

1. **Runs -> Test Runs**に移動します。
2. 時間枠ドロップダウンメニューを使用して、該当する時間枠を設定します。\
   リストの下部にテスト実行のリストが表示されます。

![1901](/images/results/tag-remote-runs-failures/8031cf7-tag3.png "tag3.png")

3. リストの上部にあるバグアイコンをクリックします。

![364](/images/results/tag-remote-runs-failures/c5fe49c-tag5.png "tag5.png")

次のダイアログが表示されます。

![](/images/results/tag-remote-runs-failures/95196a8-tag4.PNG)

4. **Failure Type**を選択し、説明を追加し（オプション）、課題追跡システム（Jiraなど）の課題URLを入力して課題にリンクします。
5. **Add**をクリックします。

## 提案される失敗タグ

複数の失敗したテストにタグを付けた後、Testimが再発する問題を認識すると、以前の選択に基づいて失敗タグが提案されます。提案される失敗タグは、テスト結果画面の上部に表示されます。

:fa-arrow-right: **テスト結果画面から提案された失敗タグを使用するには:**

1. テスト結果画面の上部で、提案された失敗タグにマウスを合わせます。\
   次のダイアログが表示されます。

![990](/images/results/tag-remote-runs-failures/bac5964-tag7.PNG "tag7.PNG")

2. 次のいずれかを実行します。

* **Confirm**をクリックして提案を受け入れます。確認後、テストは提案された選択に基づいてタグ付けされ、以前の失敗タグ（提案の基礎として使用された失敗タグ)の説明と課題へのリンクが含まれます。
* **Edit**をクリックして別のタグを選択します。タグ付け画面が表示されます。上記の**テスト結果画面からのテスト失敗のタグ付け**セクションの手順に従ってください。

:fa-arrow-right: **Test Runs画面から提案された失敗タグを使用するには:**

1. **Runs -> Test Runs**に移動します。
2. 時間枠ドロップダウンメニューを使用して、該当する時間枠を設定します。\
   リストの下部にテスト実行のリストが表示されます。
3. 提案された失敗タグを含むテストには、「Suggested」というラベルが付けられます。
4. 提案された失敗タグにマウスを合わせます。

![1231](/images/results/tag-remote-runs-failures/c10c05c-tag8.png "tag8.png")

5. 次のいずれかを実行します。

* **Confirm**をクリックして提案を受け入れます。確認後、テストは提案された選択に基づいてタグ付けされ、以前の失敗タグ（提案の基礎として使用された失敗タグ）の説明と課題へのリンクが含まれます。
* **Edit**をクリックして別のタグを選択します。タグ付け画面が表示されます。**テスト結果画面からのテスト失敗のタグ付け**セクションの手順に従ってください。

## 失敗レポートの表示

レポートビューで、失敗タイプ別の失敗に関する統計を表示できます。失敗に関するデータを蓄積することで、トレンドを特定し、修復やプロセス改善の対象を絞ることができます。

:fa-arrow-right: **失敗レポートを表示するには:**

1. **Insights -> Reports**に移動します。\
   失敗レポートは上から3番目のレポートです。
2. ドロップダウンメニューをクリックして、レポートの時間枠を選択します。

![451](/images/results/tag-remote-runs-failures/65b3172-timeframe.PNG "timeframe.PNG")

3. レポートには**ドーナツチャート**と**折れ線グラフ**の2つのビューがあります。ビューモードをクリックして、ビュー間を切り替えます。

![363](/images/results/tag-remote-runs-failures/3167d19-views.png "views.png")

### タイプ別の失敗 – ドーナツチャート

![1380](/images/results/tag-remote-runs-failures/6817b4d-report1.png "report1.png")

ドーナツチャートには、タグ別の失敗タイプの分布が表示されます。各タグには、実行総数に対する発生率と、前の期間における発生率が含まれます。失敗タグをクリックすると**Test Runs**画面が表示され、このタイプでタグ付けされたすべての実行がリストされます。

### タイプ別の失敗 – 折れ線グラフ

![1380](/images/results/tag-remote-runs-failures/205bbec-report2.png "report2.png")

折れ線グラフには、指定された期間における各タイプの失敗の発生回数が表示されます。各タグは、左側の凡例に従って色分けされています。マウスを合わせると、追加情報が表示されます。
