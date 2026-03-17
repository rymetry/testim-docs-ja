---
title: 実行ラン画面
description: 実行ラン画面で実行の結果と統計を表示。実行リスト、統計パネル、グラフ、フィルター、詳細画面、テスト操作。
category: 結果
order: 7009
updated: '2025-09-22'
sourceUrl: 'https://help.testim.io/docs/execution-runs-screen'
keywords:
  - 実行ラン
  - テスト実行一覧
  - 実行統計
  - 成功率
  - 実行フィルター
  - CSVエクスポート
---

実行の結果と統計を表示します。

実行（Execution）は、単一の実行として実行される1つまたは複数のテストのセットです。実行は、自動的に（スケジューラーなど）または手動で（特定のラベルを含むテストを実行するCLIなど）開始できます。Execution Runs画面には、以前の実行ランに関する情報が表示されます。これらの実行は、スイート、ラベル、またはテストプランごとにグループ化されます（実行された各テストを個別のエントリとしてリスト表示する[Test runs](/docs/test-runs)ビューとは対照的です）。

![Execution Runs画面の一覧ビュー](/images/results/execution-runs-screen/e1d2a5a-execution-runs-1.jpg)

:::warning{title="注意"}
テストエディターで直接実行されたテストは、Execution Runsには表示されません。
:::

## 実行リスト

実行リストには、個々の実行ランに関する情報が表示されます。

![実行リストテーブルの例](/images/results/execution-runs-screen/3b4daca-execution-runs-2.jpg)

* **Execution**: 実行の名前。実行名は、実行がどのように実行されたかに関する追加の詳細を提供します。詳細については、以下の実行名の規則を参照してください。実行名をクリックすると、実行の詳細が表示されます。
* **Branch**: 実行のテストブランチの名前
* **Browser (web)**: 実行で使用されたブラウザ
* **Device (mobile)**: 実行で使用された物理または仮想デバイス
* **OS (mobile)**: 実行で使用された物理または仮想デバイスのオペレーティングシステム
* **Started**: 実行が開始された時刻
* **Duration**: 実行の時間
* **Concurrency**: 並列で実行されたテストの数
* **Results**: 合格/不合格テストの数
* **Result labels**: 実行に追加された結果ラベル。詳細については、[結果ラベル](/docs/result-labels)を参照してください。
* **Status**: 現在の実行ステータス。可能なステータス値は次のとおりです。
  * Passed - 実行内のすべてのテストが合格しました。
  * Failed - 実行内の少なくとも1つのテストが失敗しました。
  * Queued - 実行が処理待ちです。
  * Running - 実行が処理中です。
  * Aborted - 実行が停止/中止されました。
  * Timeout - 実行が設定されたタイムアウト期間内に結果を返しませんでした。タイムアウトステータスは必ずしも最終ステータスではありません。詳細については、以下の注記を参照してください。

:::note{title="一時的なタイムアウトステータス"}
実行の全体時間が90分を超える場合、そのステータスは「RUNNING」から「TIMEOUT」に変わります。ただし、TestimとGrid間に継続的な接続がないため、タイムアウト期間後もテストはグリッド上で実行されている可能性があります。この場合、すべてのテストが完了すると（実行が完了すると）、実行ステータスは「TIMEOUT」から「FAILED」/「PASSED」に適切に更新されます。
:::

### 実行名の規則

実行名は、実行がどのように実行されたかに関する追加の詳細を提供します。

<table class="md-table md-table-2cols">
 <thead>
  <tr>
   <th style="text-align: left;">
    実行名
   </th>
   <th style="text-align: left;">
    説明
   </th>
  </tr>
 </thead>
 <tbody>
  <tr>
   <td style="text-align: left;">
    Remote run (Testim Editor)
   </td>
   <td style="text-align: left;">
    テストライブラリから特定のテストをリモート（グリッド上）で実行する場合
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    Local suite
   </td>
   <td style="text-align: left;">
    テストライブラリから特定のテストをローカルで実行する場合
    <br/>
    スイートライブラリから特定のスイートをローカルで実行する場合
    <br/>
    テストエディターから単一のテストを実行した場合は表示されません。
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    \
    <suite name="">
     または\
     <label name="">
      または\
      <test name="" plan="">
      </test>
     </label>
    </suite>
   </td>
   <td style="text-align: left;">
    CLIを使用して特定のスイートおよび/またはラベルを実行する場合
    <br/>
    CLIを使用して特定のテストプランを実行する場合
    <br/>
    CLIまたはスケジューラーを使用して複数のテストプランを実行する場合は、複数の実行エントリが作成され、各テストプランが独自の実行エントリを持ちます。
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    \
    <scheduler name="">
    </scheduler>
   </td>
   <td style="text-align: left;">
    ラベルまたはスイートで特定のスケジューラーを実行する場合
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    \
    <scheduler name="">
     //\
     <test name="" plan="">
     </test>
    </scheduler>
   </td>
   <td style="text-align: left;">
    テストプランで特定のスケジューラーを実行する場合
    <br/>
    CLIを使用して複数のテストプランを実行する場合、各テストプランが独自の実行エントリを持ちます。
   </td>
  </tr>
 </tbody>
</table>

## 統計パネル

統計パネルには、現在表示されている実行ランの集計統計が表示されます。

![統計パネルのサマリー表示](/images/results/execution-runs-screen/d2657a6-execution-runs-3.jpg)

* **Success Rate**: すべてのテストが合格した実行ランの割合を表示します。上記の例では、リスト内の実行ランの67%（3つのうち2つ）が合格しています。
* **Executions Passed**: 合格した実行ランの総数を表示します。
* **Average Duration**: 各実行ランを完了するのにかかった平均時間を表示します。上記の例では、3つの実行（1分、2分、37秒）があり、平均は1分13秒です。

## 実行ラングラフ

実行ラングラフは、実行数と実行ごとのテスト数の概要を提供します。特定の実行をドリルダウンして検査し、各テストの結果を確認できます。ステータス、時間、実行/ラベルでフィルタリングすることもできます。グラフにカーソルを合わせると、各実行の詳細が表示されます。

![実行ラングラフの例](/images/results/execution-runs-screen/1f67add-execution-runs-4.jpg)

* **X軸**: 実行が行われた時刻を含む圧縮されたタイムラインを表示します。
* **Y軸**: 実行の数を表示します。

### 実行ラングラフの非表示/表示

**実行ラングラフを非表示にするには:**

1. グラフの上にある**Hide section**ボタンをクリックします。

![グラフを非表示にする操作](/images/results/execution-runs-screen/9bc14d3-execution-runs-5.jpg)

Testimはグラフを折りたたんで非表示にします。

2. グラフを再度表示するには、Execution Runsタイトルの下にある**Show section**ボタンをクリックします。

![グラフを再表示した状態](/images/results/execution-runs-screen/6252a26-execution-runs-6.jpg)

Testimがグラフを表示します。

## 実行操作

操作パネルを使用すると、実行ランリストをフィルタリングし、リストをエクスポートできます。次のアクションが利用可能です。

* **Filter by Run Date**: 指定された期間中に実行された実行のみを表示します。
* **Advanced Filters**: ステータス、ブラウザ、テストプラン、ラベル、またはブランチに基づいて実行のみを表示します。
* **Export Execution List**: 現在表示されている実行のリストをCSV形式でダウンロードします。
* **Search Execution List**: 名前で実行を検索し、検索条件に一致する実行のみを表示します。

### 実行日でフィルタリング

**実行ランを日付でフィルタリングするには:**

1. 操作パネルの**Filter by Date**ボタンをクリックします。

![日付フィルターの指定画面](/images/results/execution-runs-screen/af82e4f-execution-runs-7.jpg)

2. **事前定義されたリスト**からフィルターを選択するか、**カスタム**の日付範囲を選択します。

![事前定義フィルターとカスタム範囲](/images/results/execution-runs-screen/d3935f9-execution-runs-8.jpg)

Testimは、選択した期間に基づいて実行リストを自動的にフィルタリングします。このフィルタービューの保存について詳しくは、[フィルタービューの保存](/docs/saving-a-filtered-view)を参照してください。タイトルの横の数字は、選択したフィルターに一致する実行の数を表示します。

![フィルター適用後の実行一覧](/images/results/execution-runs-screen/ec5d395-image.png)

### 詳細フィルター

**実行リストに詳細フィルターを適用するには:**

1. 操作パネルの**Advanced Filters**ボタンをクリックします。

![詳細フィルターを開くボタン](/images/results/execution-runs-screen/256b5d0-execution-runs-9.jpg)

Testimが**Filter Execution Runs**パネルを表示します。

![Filter Execution Runsパネル](/images/results/execution-runs-screen/d2233ef-execution-runs-10.jpg)

2. 目的のフィルターを選択し、**Apply**ボタンをクリックして実行リストにフィルターを適用します。このフィルタービューの保存について詳しくは、[フィルタービューの保存](/docs/saving-a-filtered-view)を参照してください。

![詳細フィルター適用後の一覧](/images/results/execution-runs-screen/e2a7dfd-execution-runs-11.jpg)

3. すべてのフィルターを削除するには、詳細フィルターパネルの**Reset filters**リンクをクリックします。

![フィルターリセットリンク](/images/results/execution-runs-screen/e940922-execution-runs-12.jpg)

タイトルの横の数字は、選択したフィルターに一致する実行の数を表示します。

![フィルター件数の表示例](/images/results/execution-runs-screen/b58720a-image.png)

### 実行リストのエクスポート

**現在表示されている実行ランリストをエクスポートするには:**

1. 操作パネルの**Export Execution List**ボタンをクリックします。

![Export Execution Listボタン](/images/results/execution-runs-screen/20419f8-execution-runs-13.jpg)

TestimがローカルにダウンロードするCSVファイルを生成します。

### 実行ランを名前で検索

**実行ランを名前で検索するには:**

1. 操作パネルの検索ボックスに**実行名**を入力します。

![実行名での検索ボックス](/images/results/execution-runs-screen/9d06ec3-execution-runs-14.jpg)

Testimは、一致する実行名を持つ実行ランのみを表示します。

![検索条件に一致する実行のみ表示](/images/results/execution-runs-screen/5d143af-execution-runs-15.jpg)

## 実行詳細画面

実行詳細画面で、特定の実行の追加の詳細を表示できます。

**実行の詳細を表示するには:**

1. **実行リスト**内のいずれかの実行をダブルクリックします。

![実行詳細画面への遷移](/images/results/execution-runs-screen/252ce9a-execution-runs-16.jpg)

Testimが実行詳細画面を表示します。

![実行詳細画面の例](/images/results/execution-runs-screen/7097ad4-execution-runs-17.jpg)

### 実行の詳細

実行詳細画面の上部には、次のような実行に関する基本情報が表示されます。

* 実行の名前
* 実行内のテストの総数
* 実行されたテストの総数
* 実行ラン ID

:::note{title="注意"}
実行ラン IDは、特定の実行の詳細なデバッグを行う際に役立ちます。
:::

### 実行テスト統計

統計パネルには、現在表示されている特定の実行ランの集計統計が表示されます。

* **Success Rate**: 合格したテストの割合を表示します。上記の例では、リスト内の100%（8つのうち8つ）のテストが合格しています。
* **Tests Passed**: 合格したテストの総数を表示します。
* **Average Duration**: 実行内の各テストを実行するのにかかった平均時間を表示します。上記の例では、8つのテストが実行され、平均は各11秒です。

### 実行テストリスト

実行詳細画面の下部には、実行に含まれるテストのリストがあります。各テストについて、次の情報が表示されます。

* **Test Name**: テストの名前
* **Browser (web)**: 実行で使用されたブラウザ
* **Device (mobile)**: 実行で使用された物理または仮想デバイス
* **OS (mobile)**: 実行で使用された物理または仮想デバイスのオペレーティングシステム
* **Started**: テストが開始された時刻
* **Duration**: テスト実行の時間
* **Result labels**: 結果タグ
* **Failure Type**: テストが失敗した場合、失敗のタイプを表示します。表示される可能な失敗タイプの値は次のとおりです。
  * Bug in app（アプリのバグ）
  * Environmental Issue（環境の問題）
  * Invalid test data（無効なテストデータ）
  * Test design（テスト設計）
  * Other（その他）
  * Untagged（タグなし）
* **Status**: 現在の実行ステータス。表示される可能なステータス値は次のとおりです。
  * Passed（合格）
  * Failed（不合格）
  * Queued（キュー）
  * Running（実行中）
  * Aborted（中止）
  * Timeout（タイムアウト）

:::note{title="一時的なタイムアウトステータス"}
実行の全体時間が90分を超える場合、そのステータスは「RUNNING」から「TIMEOUT」に変わります。ただし、TestimとGrid間に継続的な接続がないため、タイムアウト期間後もテストはグリッド上で実行されている可能性があります。この場合、すべてのテストが完了すると（実行が完了すると）、実行ステータスは「TIMEOUT」から「FAILED」/「PASSED」に適切に更新されます。
:::

* **Information Icon**: 情報アイコンにカーソルを合わせると、次のようなテストに関する追加の詳細を取得できます。
  * Status（ステータス）
  * Base URL (web): テストの実施に使用されたベースURL
  * Device Info (mobile): テストの記録に使用された物理または仮想デバイスのデバイス名とオペレーティングシステムを含む
  * Application (mobile): テストの記録に使用されたモバイルアプリ名
  * Test Data: テストの実施に使用されたテストデータ。「See Test Data」をクリックして、テストで使用されたパラメーターを表示します。

## テスト操作

実行詳細画面から、さまざまなアクションを実行し、実行に関する追加の技術的詳細を確認できます。

* 現在実行中の実行を中止する
* 単一のテストを再実行する
* 詳細なデバッグ情報を表示する
* テスト履歴を表示する
* 失敗タイプをタグ付けする
* 実行詳細に表示されるテストをフィルタリングする
* テストの詳細を表示する

### 現在実行中の実行を中止する

テストの実行中に実行詳細画面を表示している場合、実行ランを中止して、それ以上のテストが実行されないようにすることができます。

**実行ランを中止するには:**

1. Execution Runs画面で、現在実行中の実行をダブルクリックします。
2. **Abort Run**ボタンをクリックします。

![Abort Runボタンの位置](/images/results/execution-runs-screen/9b2f2d6-execution-runs-18.jpg)

Testimが実行ランを停止します。

:::warning{title="注意"}
「Abort Run」ボタンは、アクティブに実行中のリモートエディター実行/スケジューラー/ローカル実行でのみ使用できます。CLI実行を中止する方法の詳細については、[CLI](/docs/the-command-line-cli)を参照してください。
:::

### 実行詳細画面から直接テストを再実行する（Web）

実行詳細画面にいる間、テストを再実行できます。\
[コマンドラインインターフェース（CLI）](/docs/the-command-line-cli)\
**実行詳細画面からテストを再実行するには:**

1. 実行詳細画面で、テストリスト内のテストの1つを選択します。

![実行詳細画面でテストを選択](/images/results/execution-runs-screen/8e66ad6-execution-runs-19.jpg)

2. アクションパネルの**Rerun with same params**ボタンをクリックします。テストリスト内の任意のテストを右クリックして、**Rerun with same params**を選択することもできます。

![同じパラメーターでのテスト再実行](/images/results/execution-runs-screen/cd2aaef-execution-runs-20.jpg)

Testimは、テストエディターにいるかのようにテストを実行します。

### 詳細なデバッグ情報の表示

実行詳細画面から、デバッグに役立つ実行に関する追加情報を表示できます。

**詳細なデバッグ情報を表示するには:**

1. 実行詳細画面から、操作パネルの**情報アイコン**にカーソルを合わせます。

![詳細なデバッグ情報のポップアップ](/images/results/execution-runs-screen/7d07e73-execution-runs-21.jpg)

Testimが次の情報を表示します。

* Concurrency - 現在の実行と同時に実行された実行の数
* Extension Version - 実行を実行したTestim Extensionのバージョン
* Source - 実行がどのように実行されたか（ローカル、リモートなど）
* CLI Version - 拡張機能の実行に使用されたCLIのバージョン
* Grid Name - 実行の実行に使用されたグリッドの名前
* Test Data - 実行の実行に使用されたパラメーターおよびその他のテストデータを表示

### テスト履歴の表示

実行詳細画面から、実行内の特定のテストの履歴を表示できます。これにより、過去のテスト実行に関する情報が得られます。

**実行詳細画面からテスト履歴を表示するには:**

1. テスト行を右クリックし、**Test History**を選択します。

![Test Historyメニューの選択](/images/results/execution-runs-screen/cd50136-execution-runs-22.jpg)

Testimがその特定のテストのみのテスト履歴を表示します。

### テスト失敗のタグ付け

テストが失敗した場合、特定の失敗タイプで失敗をタグ付けできます。

**Execution Runs画面から失敗タイプをタグ付けするには:**

1. テストリスト内の失敗したテストを右クリックし、**Tag failure type**を選択します。

![失敗テストに対するTag failure type操作](/images/results/execution-runs-screen/0faac2a-execution-runs-23.jpg)

2. テスト失敗タグ付け画面を完了します。詳細については、[失敗した実行への失敗タイプのタグ付け](/docs/tag-remote-runs-failures)を参照してください。

![失敗タイプタグ付け画面](/images/results/execution-runs-screen/3fee6aa-execution-runs-24.jpg)

### 実行結果画面に表示されるテストのフィルタリング

デフォルトでは、Testimは実行結果画面に実行に含まれるすべてのテストを表示します。ただし、より洗練されたビューのためにテストをフィルタリングできます。

**実行結果画面に表示されるテストをステータスでフィルタリングするには:**

1. 操作パネルの**Advanced Filters**ボタンをクリックします。

![ステータスでテストをフィルタリング](/images/results/execution-runs-screen/393f537-execution-runs-9.jpg)

2. フィルターパネルの**Status**セクションから1つ以上の値を選択します。

![ステータスフィルター選択画面](/images/results/execution-runs-screen/b08df21-execution-runs-25.jpg)

3. **Apply**ボタンをクリックして、実行リストにフィルターを適用します。

![ステータスフィルター適用後の結果一覧](/images/results/execution-runs-screen/7486425-execution-runs-26.jpg)

**実行結果画面に表示されるテストをテスト所有者でフィルタリングするには:**

1. 操作パネルの**Advanced Filters**ボタンをクリックします。

![Test OwnerフィルターのAdvanced Filters](/images/results/execution-runs-screen/83134b4-execution-runs-9.jpg)

2. フィルターパネルの**Test Owner**セクションから1つ以上の値を選択します。

![Test Ownerの選択画面](/images/results/execution-runs-screen/b461691-execution-runs-27.jpg)

3. **Apply**ボタンをクリックして、実行リストにフィルターを適用します。

![Test Ownerフィルター適用後の結果一覧](/images/results/execution-runs-screen/719cabe-execution-runs-26.jpg)

**実行結果画面に表示されるテストを失敗タイプでフィルタリングするには:**

1. 操作パネルの**Advanced Filters**ボタンをクリックします。

![失敗タイプフィルターのAdvanced Filters](/images/results/execution-runs-screen/1437733-execution-runs-9.jpg)

2. フィルターパネルの失敗タイプセクションから1つ以上の値を選択します。

![失敗タイプの選択画面](/images/results/execution-runs-screen/a856dc5-execution-runs-28.jpg)

3. **Apply**ボタンをクリックして、実行リストにフィルターを適用します。

![失敗タイプフィルター適用後の結果一覧](/images/results/execution-runs-screen/8293525-execution-runs-26.jpg)

<br />

**実行結果画面に表示されるテストをラベルでフィルタリングするには:**

1. 操作パネルの**Advanced Filters**ボタンをクリックします。

![ラベルフィルターのAdvanced Filters](/images/results/execution-runs-screen/393f537-execution-runs-9.jpg)

2. フィルターパネルの**Label**セクションから1つ以上の値を選択します。
3. 次のいずれかのオペランドを選択します。
   1. OR - 選択したラベルの1つ以上を含むテストを返します。
   2. AND - 選択したすべてのラベルを含むテストのみを返します。
4. **Apply**ボタンをクリックして、実行リストにフィルターを適用します。

![ラベルフィルター適用後の結果一覧](/images/results/execution-runs-screen/7486425-execution-runs-26.jpg)

### テストの詳細を表示

実行結果画面から、テスト実行に直接移動し、テストのステップバイステップの詳細を表示できます。これは、テストのどのステップが失敗したかを確認したい場合に役立ちます。

**実行ラン内のテストのステップバイステップの詳細を表示するには:**

1. 実行結果画面から、テストリスト内のテストの任意の場所をダブルクリックします。

![テスト行をダブルクリックして詳細に移動](/images/results/execution-runs-screen/fc3e4c2-execution-runs-29.jpg)

Testimがテストの詳細なステップを表示します。

![テスト実行のステップ詳細画面](/images/results/execution-runs-screen/6564064-execution-runs-30.jpg)
