---
title: ネットワークログ
description: ステップレベルとテストレベルでのネットワークログの表示方法。リクエスト情報、HTTPヘッダー、HARファイルのダウンロード。
category: 結果
order: 7004
updated: '2025-09-22'
sourceUrl: 'https://help.testim.io/docs/network-logs'
keywords:
  - ネットワークログ
  - HARファイル
  - HTTPリクエスト
  - デバッグ
  - パフォーマンス
  - テスト結果
  - HARファイル
---

ネットワークログには、Webブラウザとテスト対象サイト間のリクエストに関する情報が含まれます。テスト実行中に収集されたネットワークログは、テスト結果の一部として表示されます。ネットワークログは、ステップレベルまたはテストレベルで確認できます。

## ステップレベルでのネットワークログ表示

**ステップのネットワークログを表示するには:**

1. テストを実行します。
2. メインメニューで**Runs**をクリックします。
3. 該当する実行をクリックします。
4. **Execution**画面で該当するテストをクリックします。\
   テストが表示され、実行されたステップが合格または不合格としてマークされます。
5. 該当するステップの**View Screenshot**ボタンをクリックします。
6. **Network Log**タブをクリックします。\
   複数の要素でフィルタリングできます。リクエストをクリックすると、そのリクエストに関連するHTTPヘッダーが表示されます。

:::note
画面の左右の矢印をクリックすると、前後のステップのリクエスト結果を表示できます。
:::

![ステップレベルのネットワークログ画面](/images/results/network-logs/1eac062-network_log.gif)

各リクエストに表示される情報は、次の表のとおりです。

<table class="md-table md-table-2cols">
 <thead>
  <tr>
   <th style="text-align: left;">
    項目
   </th>
   <th style="text-align: left;">
    説明
   </th>
  </tr>
 </thead>
 <tbody>
  <tr>
   <td style="text-align: left;">
    File
   </td>
   <td style="text-align: left;">
    ファイル名
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    Status
   </td>
   <td style="text-align: left;">
    HTTPステータスコード
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    Method
   </td>
   <td style="text-align: left;">
    HTTPリクエストメソッド
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    Domain
   </td>
   <td style="text-align: left;">
    リクエスト送信先のドメイン
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    Type
   </td>
   <td style="text-align: left;">
    リクエストタイプ（XHR、JS、CSSなど）
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    Size
   </td>
   <td style="text-align: left;">
    レスポンスサイズ（ヘッダーとボディを含む）
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    Time
   </td>
   <td style="text-align: left;">
    リクエスト開始からレスポンス受信までの時間
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    Waterfall
   </td>
   <td style="text-align: left;">
    リクエストアクティビティの視覚的な内訳
   </td>
  </tr>
 </tbody>
</table>

### リクエスト結果のフィルタリング

ファイル名テキスト、ドメイン、タイプ、エラーでフィルタリングできます。

**ファイル名テキストとドメインでフィルタリングするには:**

1. FilterボックスにフィルタリングするテキストSTRINGを入力します。

![ファイル名とドメインでのフィルター例](/images/results/network-logs/e21c0d7-Testim_074a.png)

*File*列と*Domain*列のテキストに基づいて、結果が即座にフィルタリングされます。

**リクエストタイプでフィルタリングするには:**

1. リクエスト結果テーブルのヘッダーで、いずれかのリクエストタイプを選択します。オプションには*XHR*、*JS*、*CSS*、*Img*、*Media*、*Font*、*Doc*、*WS*、*Manifest*が含まれます。

![リクエストタイプ別フィルターの例](/images/results/network-logs/0d05487-Testim_074b.png)

選択内容に基づいて、結果が即座にフィルタリングされます。

:::note
デフォルトでは「All」が選択されています。一度に1つのリクエストタイプのみを選択してフィルタリングできます。
:::

**エラーのあるリクエストでフィルタリングするには:**

1. リクエスト結果テーブルのヘッダーで、**Errors Only**チェックボックスを選択します。

![エラーのみフィルターの例](/images/results/network-logs/b45e218-Testim_074c.png)

エラーのある結果のみが表示されます。

### HTTPヘッダーの表示

各リクエストのHTTPヘッダーデータを表示できます。

**HTTPヘッダーを表示するには:**

1. リクエストデータを含む任意の行をクリックします。

![リクエスト一覧テーブルの例](/images/results/network-logs/190bb8b-results-rows.png)

Headersウィンドウが開き、*General*、*Response Headers*、*Request Headers*の3つのセクションが表示されます。

![Headersウィンドウに表示される情報](/images/results/network-logs/a67587b-result-headers.png)

2. 左上隅の**X**をクリックして、Headersウィンドウを閉じます。

![Headersウィンドウの閉じる操作](/images/results/network-logs/3049d02-result-headers.png)

:::note
Headersウィンドウの3つのセクションはそれぞれ、各セクションの左上にある**展開矢印**をクリックすることで最小化および展開できます。
:::

## テストレベルでのネットワークログ表示

テスト全体の集約されたネットワークログを1か所で表示できます。テストネットワークログは、失敗したテスト実行のデバッグやテスト結果の詳細な理解に役立ちます。

**テストのネットワークログを表示するには:**

1. テストを実行します。
2. メインメニューで**Runs**をクリックします。
3. 該当する実行をクリックします。
4. **Execution**画面で該当するテストをクリックします。\
   テストが表示され、実行されたステップが合格または不合格としてマークされます。
5. 横に並んだ3点メニューをクリックし、**View network log**をクリックします。\
   複数の要素でフィルタリングできます。リクエストをクリックすると、そのリクエストに関連するHTTPヘッダーが表示されます。

![テストレベルのネットワークログ画面](/images/results/network-logs/661f4ae-networklogtest.gif)

各リクエストに表示される情報は、次の表のとおりです。

<table class="md-table md-table-2cols">
 <thead>
  <tr>
   <th style="text-align: left;">
    項目
   </th>
   <th style="text-align: left;">
    説明
   </th>
  </tr>
 </thead>
 <tbody>
  <tr>
   <td style="text-align: left;">
    File
   </td>
   <td style="text-align: left;">
    ファイル名
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    Status
   </td>
   <td style="text-align: left;">
    HTTPステータスコード
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    Method
   </td>
   <td style="text-align: left;">
    HTTPリクエストメソッド
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    Domain
   </td>
   <td style="text-align: left;">
    リクエスト送信先のドメイン
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    Type
   </td>
   <td style="text-align: left;">
    リクエストタイプ（XHR、JS、CSSなど）
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    Size
   </td>
   <td style="text-align: left;">
    レスポンスサイズ（ヘッダーとボディを含む）
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    Time
   </td>
   <td style="text-align: left;">
    リクエスト開始からレスポンス受信までの時間
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    Waterfall
   </td>
   <td style="text-align: left;">
    リクエストアクティビティの視覚的な内訳
   </td>
  </tr>
 </tbody>
</table>

:::note
この機能はChromeブラウザでのみサポートされています。
プライバシーとセキュリティ上の理由から、HARファイルにはレスポンスボディは含まれません。
完全なHARを作成してダウンロードするには、[モックネットワーク](/docs/mocking-all-the-network-traffic-using-a-har-file#option-1---using-testim-to-create-the-har-file)を使用してください。
:::

## HARファイルのダウンロード

**HARファイルをダウンロードするには:**

1. テスト画面から、**HAR**ボタンをクリックします。\
   **Network Activity**画面が表示されます。
2. **Download**ボタンをクリックして、ファイルを保存します。

![HARファイルダウンロードボタン](/images/results/network-logs/f1b8915-download.png)

3. さらなるデバッグと分析のために、ファイルを開発者ツールにアップロードすることをお勧めします。

## ネットワークアクティビティの表示

Network Activity画面には、ネットワークトラフィックが表示されます。次のフィルターツールを使用して、ネットワークトラフィックをフィルタリングできます。

* ファイル名に基づくフィルター - **Filter**フィールドに完全または部分的なファイル名を入力します。
* リクエストタイプに基づくフィルター - リストされているリクエストタイプ（XHR、JS、CSSなど）のいずれかを選択します。
* エラーのみフィルター - **Error Only**チェックボックスを選択すると、エラーで応答されたリクエストのみが表示されます。

![Network Activity画面のフィルタリング例](/images/results/network-logs/aee6500-Screen_Shot_2020-11-24_at_8.03.42.png)

ネットワークアクティビティエントリには、次の情報が含まれます。

* File - リクエストのURL
* Status - HTTPレスポンスコード
* Request method - HTTPリクエストメソッド
* Request domain - リクエストドメイン
* Request type - リクエストタイプ
* Size - レスポンスサイズ
* Time - レスポンスを取得するまでの時間
* Waterfall - リクエストの各段階をグラフィカルに表現したもの。Waterfallにカーソルを合わせると、詳細な内訳が表示されます。

下部のサマリーペインには、次の情報が含まれます。

* リクエストの総数
* リクエストの合計ダウンロードサイズ
* 読み込まれたリソースの合計サイズ
