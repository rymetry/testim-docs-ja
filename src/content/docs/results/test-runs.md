---
title: テスト実行
description: >-
  過去のテスト実行の統計を表示するTest Runs画面。Counted RunsとLocal Editor
  Runs、フィルター、グラフ、CSV出力、失敗タグ付け。
category: 結果
order: 7010
updated: '2025-09-22'
sourceUrl: 'https://help.testim.io/docs/test-runs'
keywords:
  - テスト実行
  - 実行統計
  - Counted Runs
  - Local Editor Runs
  - フィルター
  - グラフ
  - CSVエクスポート
---

過去のテスト実行の統計を表示します。

「Test Runs」画面では、過去の実行に関する統計を表示できます。この画面には、選択したすべてのテストの集計統計と、特定のテストの統計（例:合格/不合格回数、平均テスト時間など）が表示されます。画面は次のタブに分かれています。

* **Counted Runs** - このタブには、CLI、CI、またはスケジュール実行によってローカルまたはリモートで実行された過去の実行の統計が表示されます。これらのテスト実行は、サブスクリプションクォータにカウントされます。
* **Local Editor Runs** - このタブには、エディターから直接実行された過去の実行の統計が表示されます。これらのテスト実行は、サブスクリプションクォータにカウントされません。

## Test Runs画面へのアクセス方法

「Test Runs」画面にアクセスするには、2つの異なる方法があります。

* メインメニューで、**Runs > Test runs**をクリックします。

![Test Runs画面の一覧ビュー](/images/results/test-runs/f2c9226-testrunsscreen.png)

* **Execution Runs**画面（**Runs => Executions**）から、実行を選択し、テストを右クリックして、**Test history**オプションを選択します。

![Execution Runs画面からTest Runsを開く操作](/images/results/test-runs/dfeed2f-executions.gif)

## Test Runs画面の要素

Test Runs画面には、選択したフィルターに従って、特定のテスト/すべてのテストの最後の実行に関する統計が表示されます。特定のテストからこの画面に移動すると、そのテストのみの統計が表示されます。特定のテスト実行をクリックすると、テストエディター内でそのテスト実行が開き、ドリルダウンしてテスト実行の詳細（例:各ステップのスクリーンショットと時間）を確認できます。

![Test Runs画面の要素説明付きスクリーンショット](/images/results/test-runs/db5dab5-testrunswithcallouts.png)

### 集計統計

![集計統計セクションの例](/images/results/test-runs/3a186c8-stats.png)

集計統計セクションには、すべての実行の結果の次の要約が表示されます。

* **Success** - 選択した時間中に実行されたすべての実行のうち、成功した実行の割合。
* **Passed** - 成功したテスト実行の数
* **Avr. duration** - 実行の平均時間

## フィルター

次のパラメーターに基づいて統計をフィルタリングできます。フィルターは「counted runs」タブと「local editor runs」タブ間で共有されます。複数のフィルターを選択することで、フィルターを集約できます。

### 期間フィルター

フィルターをクリックし、事前定義されたオプションのいずれかを選択するか、Customを選択して特定の開始日と終了日を指定します。

![期間フィルターの選択画面](/images/results/test-runs/0672e47-timefilter.png)

### 検索

検索クエリを入力して、一致するテスト名を持つテスト結果を検索します。

![テスト名での検索ボックス](/images/results/test-runs/52b1e01-search.png)

### 詳細フィルター

**Advanced Filters**ボタンをクリックして、**Filter Test Runs**ペインを開きます。

![Advanced Filtersボタンとペイン](/images/results/test-runs/0d27b84-advancedfilters.png)

詳細フィルターペインには、次のフィルターがあります。

* **Branch** - **Select All**を選択してすべてのフィルターを含めるか、リストから特定のブランチを選択します。
* **Tests** - 特定のテストまたはすべてのテストを選択します。
* **Status** - 特定のテスト実行ステータスを選択します。
* **Failure type** - 失敗した実行には理由がタグ付けされます。このフィルターを使用して、リストされている理由の1つでタグ付けされた実行を表示できます。このフィルターを選択すると、失敗したテストのみが表示されます。
* **Browser** - テスト実行で使用されたブラウザを選択します。（Webのみ）
* **Test Owner** - テストの該当する所有者を選択します。テストの所有者は、必ずしもテストを実行したユーザーではありません。

このフィルター表示の保存について詳しくは、[フィルター表示の保存](/docs/saving-a-filtered-view)を参照してください。

## 実行グラフ

実行グラフには、時間（x軸）に対する時間（y軸）が表示されます。各バーは次のようにテスト実行を表します。

* 緑のバー - 合格
* 赤のバー - 不合格\
  バーにカーソルを合わせると、その詳細が表示されます。

![実行グラフのバー表示](/images/results/test-runs/221ad29-graph.png)

## CSVダウンロード

デフォルトでは、テスト実行には最大200件の結果が表示されます。200件を超える結果がある場合、CSVをダウンロードするとすべての結果が含まれます。CSVダウンロードは「counted runs」でのみ利用可能です。

CSVをダウンロードするには、**CSV Download**ボタンをクリックして、保存先を選択します。

![CSV Downloadボタン](/images/results/test-runs/c7e1e19-download.png)

## テスト失敗のタグ付け

**Tag Test Failure**ボタンをクリックして、以下のリストにあるすべての失敗した実行に失敗タイプをタグ付けします。詳細については、[失敗した実行への失敗タイプのタグ付け](/docs/tag-remote-runs-failures)を参照してください。

![Tag Test Failureボタンの位置](/images/results/test-runs/1084b14-tag.PNG)

## テスト実行の詳細

テスト実行の詳細には、フィルターの条件に一致するすべてのテスト実行がリストされます。

<table class="md-table md-table-3cols">
 <thead>
  <tr>
   <th style="text-align: left;">
    パラメーター
   </th>
   <th style="text-align: left;">
    説明
   </th>
   <th style="text-align: left;">
    値
   </th>
  </tr>
 </thead>
 <tbody>
  <tr>
   <td style="text-align: left;">
    Test Name
   </td>
   <td style="text-align: left;">
    テスト実行のテスト名。
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    Branch
   </td>
   <td style="text-align: left;">
    実行されたテストを保持するブランチ
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    Browser (web)
   </td>
   <td style="text-align: left;">
    テスト実行で使用されたブラウザ。
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    Device (mobile)
   </td>
   <td style="text-align: left;">
    テスト実行で使用されたデバイス。
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    OS
   </td>
   <td style="text-align: left;">
    テスト実行で使用されたオペレーティングシステム。
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    Started
   </td>
   <td style="text-align: left;">
    実行が開始された時刻。
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    Duration
   </td>
   <td style="text-align: left;">
    テスト実行の時間。
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    Result Labels
   </td>
   <td style="text-align: left;">
    実行に追加された結果ラベル。クリックしてラベルを表示します。
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    Failure Type
   </td>
   <td style="text-align: left;">
    実行に追加された失敗タグ。失敗タグを追加するには、「Tag test failure」リンクをクリックします。詳細については、
    <a href="/docs/tag-remote-runs-failures">
     失敗した実行への失敗タイプのタグ付け
    </a>
    を参照してください。
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    Status
   </td>
   <td style="text-align: left;">
    テスト実行のステータス。
   </td>
   <td style="text-align: left;">
    <strong>
     Failed
    </strong>
    - 赤いx
    <br/>
    <strong>
     Failed with retries
    </strong>
    - 黄色の感嘆符付き赤いx
    <br/>
    <strong>
     Passed
    </strong>
    - 緑のv
   </td>
  </tr>
 </tbody>
</table>

## リトライの表示

テスト実行にいくつかのリトライがあった場合、リトライの結果を表示できます。リトライを伴うテスト実行には、ステータスアイコンに黄色の(!)マークが付きます。\
リトライとその設定方法について詳しくは、[こちら](/docs/the-command-line-cli#failed-test-retries)を参照してください。

![リトライがあるテスト実行の表示例](/images/results/test-runs/47577e0-retries.png)

:fa-arrow-right: **特定の実行のすべてのリトライ結果を表示するには:**

1. 結果行にカーソルを合わせます
2. 「Test retries」アイコンをクリックします
3. 表示したい結果を開きます

![Test retriesアイコンからリトライ結果を確認](/images/results/test-runs/ce29e63-testretries.gif)

> 📘
>
> プランがリトライの表示をサポートしていない場合は、サポートに連絡してください。
