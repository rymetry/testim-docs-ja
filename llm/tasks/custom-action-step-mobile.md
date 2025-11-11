# 翻訳タスク (custom-action-step-mobile)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

事前定義ステップにないアクションや検証を行いたい場合に、Appium を用いたスクリプトを実行できる「カスタムアクション（モバイル）」ステップを使用します。複数のモバイルコマンドをバッチ実行でき、JSパラメータも利用可能です。

カスタムアクション（モバイル）は TMA でのみ完全にサポートされます。サードパーティのグリッドでは未サポートです（例）：

- Browserstack returns: \``Execute driver script functionality is not available unless server is started with --allow-insecure including the 'execute_driver_script' flag, e.g., --allow-insecure=execute_driver_script`
- Headspin returns: `An unknown server-side error occurred while processing the command. Original error: The software keyboard cannot be hidden`

> 📘 ローカル実行の前提条件
>
> 物理デバイス／エミュレータでローカル実行する場合、テスト実行前に端末で次のコマンドを実行してください: `tricentis-mobile-agent start -e`

## VMGでサポートされるAppiumメソッド

The following Appium methods are supported:

- `performActions`
- `findElement`
- `findElements`
- `sendKeys`
- `hideKeyboard`
- `getWindowRect`

`findElement(s)` は strategy に "text" を使用できません。一般的には "label" や "value" での検索が有効です。

> 📘
>
> 上記以外のメソッド利用を希望する場合は Tricentis サポートにお問い合わせください。

## カスタムアクション（モバイル）ステップを追加する

1. 追加したい位置の矢印（:fa-caret-right:）または **+** にカーソルを合わせます。
2. “M”（Testim 定義済みステップ）をクリックし、メニューを開きます。

![](/images/advanced-features/custom-action-step-mobile/0b5972d-ca1.png)

3. **Actions** を展開し、**Add custom action** を選択します。

![](/images/advanced-features/custom-action-step-mobile/603ef8c-customaction.png)

> 📘 注意
>
> メニュー上部の検索ボックスで Add custom action を検索しても構いません。

4. **Name** にわかりやすい名前を入力します。
5. 共有ステップとして再利用したい場合は、デフォルトのチェックを保持し、**Select shared step folder** から保存先フォルダを選びます。共有不要ならチェックを外します。共有ステップの詳細は [グループ](/docs/groups/groups) を参照してください。
6. **Create Step** をクリックします。関数エディタと右側の **Properties** パネルが開きます。

![](/images/advanced-features/custom-action-step-mobile/795f7e2-ca3.png)

7. **Properties** の **Description** を必要に応じて編集します（既定: Run shared action / Run action）。
8. 必要なパラメータを定義します。
   1. **+ PARAMS** をクリック
   2. **JS** を選択してJavaScriptパラメータを追加
9. 任意のプロパティを設定します。
   1. **When this step fails** – 失敗時の動作
   2. **When to run step** – 実行条件（Conditions参照）
   3. **Override timeout** – タイムアウトの上書き（ミリ秒）
10. **function** テキストボックスにJSコードを記述します。定義したパラメータを参照できます。
11. 戻る矢印でエディタに戻ります。

    ![](/images/advanced-features/custom-action-step-mobile/af049a0-Run_Shared_action.jpg)

ステップが作成されます。

![](/images/advanced-features/custom-action-step-mobile/0b1c350-customaction3.png)

<br />

> 📘 注意
>
> AUTで要素をパラメータ定義するためにブレークポイントを有効化した場合は、Toggle Breakpoint で解除してください。

## 例

### デバイスのナビゲーションバーを引き下げる

`performActions` の使用例です。画面左上から100ms待機後、100ピクセル下方向へドラッグして指を離します。

```
const start_x = 50
const start_y = 1
const end_x = 50
const end_y = 2000

await DRIVER.performActions([
    {
        "type": "pointer",
        "id": "finger1",
        "parameters": {"pointerType": "touch"},
        "actions": [
            {"type": "pointerMove", "duration": 0, "x": start_x, "y": start_y},
            {"type": "pointerDown", "button": 0},
            {"type": "pause", "duration": 100},
            {"type": "pointerMove", "duration": 500, "x": end_x, "y": end_y},
            {"type": "pointerUp", "button": 0}
        ]
    }
])
```

<br />

### xpathでボタン要素を探す

`findElement` の使用例です。

```javascript js
const el = await DRIVER.findElement('xpath', "//XCUIElementTypeApplication/XCUIElementTypeWindow/XCUIElementTypeOther/XCUIElementTypeOther[2]/XCUIElementTypeOther/XCUIElementTypeOther/XCUIElementTypeOther/XCUIElementTypeOther/XCUIElementTypeCollectionView");
/*const e2 = await DRIVER.findElement('class name', "XCUIElementTypeButton");*/
```

### キーボード入力

`sendKeys` と `hideKeyboard` の使用例です。キーボード表示中に文字列を入力し、その後キーボードを隠します。

```javascript
await DRIVER.sendKeys('abcdef');
await DRIVER.hideKeyboard();
```
