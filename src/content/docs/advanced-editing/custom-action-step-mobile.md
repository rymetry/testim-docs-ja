---
title: カスタムアクションステップ（モバイル）
description: モバイル向けカスタムアクションステップで Appium コマンドを使った高度な操作や検証を実装する方法を説明します。
category: 高度な編集
order: 5055
updated: '2025-09-22'
sourceUrl: 'https://docs.tricentis.com/testim/content/advanced-editing/custom-action-step-mobile.htm'
keywords:
  - カスタムアクション
  - モバイルテスト
  - Appium
  - performActions
  - sendKeys
  - hideKeyboard
  - findElement
  - TMA
  - モバイルコマンド
  - Testim モバイル
---

事前定義ステップにないアクションや検証を行いたい場合に、Appium を用いたスクリプトを実行できる「カスタムアクション（モバイル）」ステップを使用します。複数のモバイルコマンドをバッチ実行でき、JS パラメーターも利用可能です。カスタムアクション（モバイル）は TMA でのみ完全にサポートされます。サードパーティのグリッドでは未サポートです（例）：

- Browserstack では、サーバーが `--allow-insecure` オプション付きで起動していない旨のエラーメッセージが返ります。
- Headspin では、コマンド処理中にキーボードを非表示にできない旨の不明なサーバー側エラーメッセージが返ります。

:::note{title="ローカル実行の前提条件"}
物理デバイス／エミュレータでローカル実行する場合、テスト実行前に端末で次のコマンドを実行してください: tricentis-mobile-agent start -e
:::

## VMG でサポートされる Appium メソッド

次の Appium メソッドがサポートされています:

- `performActions`
- `findElement`
- `findElements`
- `sendKeys`
- `hideKeyboard`
- `getWindowRect`

`findElement(s)` は strategy に "text" を使用できません。一般的には "label" や "value" での検索が有効です。

:::note
上記以外のメソッド利用を希望する場合は Tricentis サポートにお問い合わせください。
:::

## カスタムアクション（モバイル）ステップを追加する

1. 追加したい位置の矢印（）または **+** にカーソルを合わせます。
2. “M”（Testim 定義済みステップ）をクリックし、メニューを開きます。

![カスタムアクション（モバイル）のスクリーンショット](/images/advanced-features/custom-action-step-mobile/0b5972d-ca1.png)

3. **Actions** を展開し、**Add custom action** を選択します。

![カスタムアクション（モバイル）のスクリーンショット](/images/advanced-features/custom-action-step-mobile/603ef8c-customaction.png)

:::warning{title="注意"}
メニュー上部の検索ボックスで Add custom action を検索しても構いません。
:::

4. **Name** にわかりやすい名前を入力します。
5. 共有ステップとして再利用したい場合は、デフォルトのチェックを保持し、**Select shared step folder** から保存先フォルダーを選びます。共有不要ならチェックを外します。共有ステップの詳細は [グループ](/docs/editing-tests/groups) を参照してください。
6. **Create Step** をクリックします。関数エディターと右側の **Properties** パネルが開きます。

![カスタムアクション（モバイル）のスクリーンショット](/images/advanced-features/custom-action-step-mobile/795f7e2-ca3.png)

7. **Properties** の **Description** を必要に応じて編集します（既定: Run shared action / Run action）。

8. 必要なパラメーターを定義します。

9. **+ PARAMS** をクリックします。

10. **JS** を選択して JavaScript パラメーターを追加します。

11. 任意のプロパティを設定します。

12. **When this step fails** – 失敗時の動作を指定します。

13. **When to run step** – 実行条件を指定します（Conditions 参照）。

14. **Override timeout** – タイムアウトの上書き（ミリ秒）を指定します。

15. **function** テキストボックスに JS コードを記述します。定義したパラメーターを参照できます。

16. 戻る矢印でエディターに戻ります。

    ![カスタムアクション（モバイル）のスクリーンショット](/images/advanced-features/custom-action-step-mobile/af049a0-Run_Shared_action.jpg)

ステップが作成されます。

![カスタムアクション（モバイル）のスクリーンショット](/images/advanced-features/custom-action-step-mobile/0b1c350-customaction3.png)

:::warning{title="注意"}
AUT で要素をパラメーター定義するためにブレークポイントを有効化した場合は、Toggle Breakpoint で解除してください。
:::

## 例

### デバイスのナビゲーションバーを引き下げる

`performActions` の使用例です。画面左上から 100ms 待機後、100 ピクセル下方向へドラッグして指を離します。

```javascript
const start_x = 50;
const start_y = 1;
const end_x = 50;
const end_y = 2000;

await DRIVER.performActions([
  {
    type: 'pointer',
    id: 'finger1',
    parameters: { pointerType: 'touch' },
    actions: [
      { type: 'pointerMove', duration: 0, x: start_x, y: start_y },
      { type: 'pointerDown', button: 0 },
      { type: 'pause', duration: 100 },
      { type: 'pointerMove', duration: 500, x: end_x, y: end_y },
      { type: 'pointerUp', button: 0 },
    ],
  },
]);
```

### xpath でボタン要素を探す

`findElement` の使用例です。

```javascript js
const el = await DRIVER.findElement(
  'xpath',
  '//XCUIElementTypeApplication/XCUIElementTypeWindow/XCUIElementTypeOther/XCUIElementTypeOther[2]/XCUIElementTypeOther/XCUIElementTypeOther/XCUIElementTypeOther/XCUIElementTypeOther/XCUIElementTypeCollectionView'
);
/*const e2 = await DRIVER.findElement('class name', "XCUIElementTypeButton");*/
```

### キーボード入力

`sendKeys` と `hideKeyboard` の使用例です。キーボード表示中に文字列を入力し、その後キーボードを隠します。

```javascript
await DRIVER.sendKeys('abcdef');
await DRIVER.hideKeyboard();
```
