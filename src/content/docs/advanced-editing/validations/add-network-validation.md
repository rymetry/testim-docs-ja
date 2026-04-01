---
title: ネットワーク検証の追加
description: ネットワークリクエストとレスポンスを検証するステップ。API コール、Ajax リクエスト、HTTP レスポンスの内容を確認し、通信状態を検証します。
category: 高度な編集
order: 5015
updated: '2025-09-19'
sourceUrl: 'https://docs.tricentis.com/testim/content/advanced-editing/validations/add-network-validation.htm'
keywords:
  - ネットワーク検証
  - API 検証
  - HTTP リクエスト
  - レスポンス
  - ネットワーク
  - Ajax
  - XHR
  - Fetch
  - API
  - Testim
---

ネットワークリクエストが期待どおりに実行されたかを検証する

_network validation_ ステップでは、ネットワークリクエストを検証できます。プリセットの検証ステップで、オブジェクトの配列 `networkRequests`（下表）を受け取り、この配列に対して JavaScript を実行します。

:::note
これは Professional plan の機能です。
:::

:::info
このステップは Chrome または Edge Chromium でのみ実行できます。
:::

## ネットワーク検証

_networkRequests_ 配列に含まれるオブジェクトで、次の項目を検証できます：

:::note{title="リクエスト/レスポンスボディ"}
リクエストボディとレスポンスボディのキャプチャも可能です。詳細は [リクエストボディとレスポンスボディのキャプチャ](#リクエストボディとレスポンスボディのキャプチャ) を参照してください。
:::

<table class="md-table md-table-2cols">
 <thead>
  <tr>
   <th>
    プロパティ
   </th>
   <th>
    説明
   </th>
  </tr>
 </thead>
 <tbody>
  <tr>
   <td>
    url
   </td>
   <td>
    リクエスト URL
   </td>
  </tr>
  <tr>
   <td>
    source
   </td>
   <td>
    URL を生成したページ
   </td>
  </tr>
  <tr>
   <td>
    method
   </td>
   <td>
    リクエストメソッド（例: GET, POST, PUT など）
   </td>
  </tr>
  <tr>
   <td>
    startTime
   </td>
   <td>
    リクエストの読み込み開始時刻（Unix 時間、ミリ秒）
   </td>
  </tr>
  <tr>
   <td>
    endTime
   </td>
   <td>
    リクエストの読み込み完了時刻（Unix 時間、ミリ秒）
   </td>
  </tr>
  <tr>
   <td>
    tabNumber
   </td>
   <td>
    リクエスト元のタブ番号
   </td>
  </tr>
  <tr>
   <td>
    statusCode
   </td>
   <td>
    レスポンスのステータスコード
   </td>
  </tr>
  <tr>
   <td>
    statusText
   </td>
   <td>
    ステータスコードに対応するステータステキスト
   </td>
  </tr>
  <tr>
   <td>
    isBlocked
   </td>
   <td>
    リクエストがブロックされたかどうか（true = ブロック済み、false = ブロックされていない）

   </td>
  </tr>
  <tr>
   <td>
    blockReason
   </td>
   <td>
    ブロックされた理由（例: 広告ブロッカー、リクエスト失敗、オリジン、CORS など）
   </td>
  </tr>
  <tr>
   <td>
    isDone
   </td>
   <td>
    リクエストが完了したかどうか（true = 完了、false = 保留中）

   </td>
  </tr>
  <tr>
   <td>
    type
   </td>
   <td>
    レスポンスに含まれるデータの種類（例: XHR, document, Image など）（Chrome より）
   </td>
  </tr>
  <tr>
   <td>
    responseSize
   </td>
   <td>
    レスポンスの合計サイズ（エンコード済み、ヘッダー含む）（バイト）
   </td>
  </tr>
  <tr>
   <td>
    protocol
   </td>
   <td>
    ネットワークプロトコル（例: h2, http/1.1）（Chrome より）
   </td>
  </tr>
 </tbody>
</table>

**Add network validation ステップを追加するには:**

1. ステップを追加したい位置の **（矢印記号）** にカーソルを合わせます。

![テストエディターのナビゲーションステップ選択画面](/images/validations/add-network-validation/a0847f8-Testim_308a.png)

アクションのオプションが表示されます。

![ネットワーク検証ステップの追加画面](/images/validations/add-network-validation/138a257-Testim_283a_r.png)

2. **「M」**（Testim の事前定義ステップ）をクリックします。\
   **Predefined steps** メニューが開きます。

![追加されたネットワーク検証ステップ](/images/validations/add-network-validation/97d3be5-Testim_270_r2.png)

3. **Validations** をクリックします。\
   **Validations** メニューが展開されます。

![ネットワーク検証のコードエディター画面](/images/validations/add-network-validation/82d4e6d-Testim_303_r.png)

4. メニューをスクロールして **Add network validation** を選択します。

:::note
メニュー上部の検索ボックスで検索することもできます。
:::

**Add Step** ウィンドウが表示されます。

![ネットワーク検証のプロパティパネル](/images/validations/add-network-validation/d07a576-Testim_215_r.png)

5. **Name the new step** フィールドに、このステップの（わかりやすい）名前を入力します。
6. このステップを共有ステップとして他のテストでも再利用できるようにする場合は、**Shared step** の隣のチェックボックスを選択したまま（デフォルト）にし、**Select shared step folder** リストからこのステップを保存するフォルダーを選択します。共有しない場合は、チェックボックスの選択を解除します。\
   共有ステップの詳細については、[Groups](/docs/groups) を参照してください。
7. **Create Step** をクリックします。\
   **function** エディターが開き、右側に **Properties** パネルが表示されます。

![ナビゲーションステップ前の状態](/images/validations/add-network-validation/989f939-Testim_310.png)

8. **Properties** パネルの **Description** フィールドで、必要に応じてこのステップの説明を編集します。デフォルトの説明は「Run network validation」です。
9. ステップに必要なパラメーターを次のように定義します:\
   a. **Properties** パネルで **+ PARAMS** ボタンをクリックします。\
   b. **JS parameter**: JavaScript パラメーターを追加する場合は、ドロップダウンリストから **JS** を選択し、JavaScript パラメーターを入力します。\
   c. **HTML parameter**: HTML 要素をパラメーターとして定義する場合は、ドロップダウンリストから **HTML** を選択します。ブラウザが開き、このステップに関連するページが表示されます。次の操作を行います:
   - **AUT** ウィンドウで、関連する要素にマウスを合わせてクリックし、選択します。選択した要素は **Properties** パネルの **Target Element** ボックスに表示されます。選択した要素の表示、置き換え、設定の調整を行う場合は、[Editing Target Element Properties](/docs/editing-target-element-properties) で説明されている手順を使用してください。

d. 選択した要素には、自動的に「param」または「element」という名前が付けられます（JS パラメーターと HTML 要素のどちらを選択したかによって異なります）。パラメーター/要素に適切な名前を割り当てるには、**edit** アイコンをクリックして希望する名前を入力します。

![ネットワーク検証ステップの追加位置](/images/validations/add-network-validation/f5a215a-Testim_285a_r.png)

10. 必要に応じて、次のプロパティを入力します:

- **When this step fails** – このステップが失敗した場合の動作を指定します。
- **When to run step** – ステップを実行する条件を指定します。詳細については、[Conditions](/docs/conditions) を参照してください。
- **Override timeout** – Testim がテストステップの失敗を登録するデフォルトの時間制限設定を上書きし、異なる時間制限値（ミリ秒）を指定できます。

11. **function** テキストボックスに、希望する JavaScript コードを入力します。パラメーターを定義している場合は、JavaScript コード内でそれらのパラメーターを参照できます。

:::note
HTML パラメーター以外の DOM セレクター（jQuery など）を使用している場合、空の配列は truthy であるため、`$(<query>)` の代わりに `$(<query>).length` を使用する必要があります。
:::

12. 左上の戻る矢印でエディターに戻ります。

![ネットワーク検証の JavaScript コード例](/images/validations/add-network-validation/bc0ed89-Testim_311a.png)

:::note
HTML 要素をパラメーターとして定義するために AUT を開いた場合は、**Toggle Breakpoint** ボタンをクリックしてブレークポイントを削除します。
:::

ステップが作成されます。

![テスト実行結果のネットワークログ](/images/validations/add-network-validation/969f2b6-Testim_312a.png)

### ネットワーク検証の例

#### すべての画像リクエストを検証する

![ネットワークログの詳細情報](/images/validations/add-network-validation/b4452ab-Testim_313.png)

**Example Code:**

```javascript
function validateRequestStatuscode(req) {
  //Get status code
  const statusCode = req.statusCode.toString();
  //Check if we got an error
  const badReq = statusCode.startsWith('4') || statusCode.startsWith('5');
  //If we got an error fail the step
  if (badReq) {
    throw new Error(
      `assert failed for request "${req.url}" method: "${req.method}". Statusc code was ${req.statusCode}`
    );
  }
}

console.table(networkRequests);
const imageCalls = networkRequests.filter((call) => call.type == 'Image');
imageCalls.forEach(validateRequestStatuscode);
```

#### 単一のリクエストを検証する

![ナビゲーション後のネットワーク検証設定](/images/validations/add-network-validation/7e9fc8d-Testim_314.png)

**Example Code:**

```javascript
if (networkRequests.length == 0) {
  throw new Error('No requests were made during the time of the test');
}

function validateRequestStatuscode(req) {
  //Get status code
  const statusCode = req.statusCode.toString();
  //Check if we got an error
  const badReq = statusCode.startsWith('4') || statusCode.startsWith('5');
  //If we got an error fail the step
  if (badReq) {
    throw new Error(
      `assert failed for request "${req.url}" method: "${req.method}". Statusc code was ${req.statusCode}`
    );
  }
  return true;
}

//Filter the source of the request
function filterReqestsBySource(source, req) {
  const reqSource = req.source;
  if (source === reqSource) return true;
  return false;
}

//find a single request by it's url and check if they are all valid

const singleReq = networkRequests.find((item) => item.url == 'http://demo.testim.io/bundle.css');

if (!singleReq) {
  throw new Error('Request was not found');
}

return validateRequestStatuscode(singleReq);
```

#### すべてのリクエストが成功したことを検証する

![ネットワーク検証の filterByUrl 関数使用例](/images/validations/add-network-validation/3e299dd-Testim_315.png)

**Example Code:**

```javascript
function validateRequestStatuscode(req) {
  //Get status code
  const statusCode = req.statusCode.toString();
  //Check if we got an error
  const badReq = statusCode.startsWith('4') || statusCode.startsWith('5');
  //If we got an error fail the step
  if (badReq) {
    throw new Error(
      `assert failed for request "${req.url}" method: "${req.method}". Statusc code was ${req.statusCode}`
    );
  }
}

//Check all the requests and see if they are all valid
networkRequests.forEach(validateRequestStatuscode);
return true;
```

#### 呼び出しの最大時間を検証する

![フィルタリングされたネットワークログ結果](/images/validations/add-network-validation/9880f22-Testim_316.png)

**コード例:**

```javascript
const callDur = networkRequests.map((call) => call.endTime - call.startTime);

const isOverMax = callDur.some((time) => time > maxTimeInMS);

if (isOverMax) throw new Error(`Some calls were over ${maxTimeInMS}MS`);
```

**パラメーター例:**

<table class="md-table md-table-3cols">
 <thead>
  <tr>
   <th style="text-align: left;">
    名前
   </th>
   <th style="text-align: left;">
    タイプ
   </th>
   <th style="text-align: left;">
    値
   </th>
  </tr>
 </thead>
 <tbody>
  <tr>
   <td style="text-align: left;">
    maxTimeInMS
   </td>
   <td style="text-align: left;">
    JavaScript
   </td>
   <td style="text-align: left;">
    {ステップが失敗する前にネットワーク呼び出しに許可される最大ミリ秒数}
   </td>
  </tr>
 </tbody>
</table>

## リクエストボディとレスポンスボディのキャプチャ

:::note{title="機能フラグ"}
この機能を有効にするには、サポートにお問い合わせください。
:::

ネットワーク検証の一部として、上記で説明したリクエスト/レスポンスでキャプチャされるオブジェクトの配列に加えて、リクエストボディおよび/またはレスポンスボディをキャプチャし、**add network validation** ステップを使用してボディコンテンツの検証を実行することもできます。ボディコンテンツ自体はネットワークログには表示されませんが、`networkRequests` 配列に追加されます。

:::note
このオプションを有効にすると、テストのパフォーマンスに影響する場合があります。
:::

**リクエストボディとレスポンスボディのキャプチャを有効にするには:**

1. **Setup Step** で **Show Properties** をクリックします。
2. **Network Capture Options** の下で、**Capture request body** および/または **Capture response body** オプションを選択します。

   ![ネットワークキャプチャオプションの設定画面](/images/validations/add-network-validation/f6815ea-network_capture_options.png)

3. **Save** をクリックしてテストを保存します。

## add network validation ステップへのリクエスト/レスポンスボディの追加

**Network Capture Options**（リクエスト/レスポンスボディのキャプチャ）を有効にした後、

**Add network validation** ステップでは、パラメーター `networkRequests` が利用可能になり、実行されたすべての

リクエストが保持されます。各リクエストオブジェクトには、`method`、`statusCode`、`resposeHeaders`、`requestBody`（新しいプロパティ）、`responseBody`（新しいプロパティ）、`headers` などのプロパティがあります。**Add network validation** ステップを追加する際、以下に示すように `requestBody` および/または `responseBody` プロパティを追加できます。

![ネットワーク検証の実行結果画面](/images/validations/add-network-validation/557bd68-image.png)

:::note
fetch および XHR ネットワークのリクエスト/レスポンスボディのみがキャプチャされます。
:::

### テスト例

次のテスト例では、ネットワーク検証ステップでリクエスト/レスポンスボディを使用しています:

[https://app.testim.io/#/project/GYXR2qZC/branch/master/test/8PsdGWbxJx7NsZji](https://app.testim.io/#/project/GYXR2qZC/branch/master/test/8PsdGWbxJx7NsZji)

ボディペイロードをコンソールに出力します。
