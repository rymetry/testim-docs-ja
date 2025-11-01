---
title: 'モバイルテストエディタ画面'
description: 'Testimモバイルテストエディタ画面の構成要素と機能について説明します。'
category: 'テスト作成'
order: 10
updated: '2025-11-02'
keywords:
  - モバイルテストエディタ
  - AUT Viewer
  - テストステップ
  - デバイス情報
  - テストアクション
---

Mobile Test Editor 画面には、現在のモバイルテストと Application Under Test (AUT) Viewer が表示されます。

![モバイルテストエディタ](/images/recording-tests/mobile-test-editor/0b45d6b-mobiletesteditor.png)

Mobile Test Editor 画面には、上の画像に示されているように、以下のセクションがあります:

1. **Device and Mobile Application Information** - テストに使用される物理または仮想デバイスとモバイルアプリケーションに関する情報を表示します。
2. **Mobile Test Steps** - モバイルテストの記録されたステップを表示します。
3. **Mobile Test Action Panel** - モバイルテストと対話するために実行できるアクションを表示します。
4. **Application Under Test (AUT) Viewer** - Testim に接続された物理または仮想デバイスと対話できるビューポート。

## デバイスとモバイルアプリケーション情報

![デバイス情報](/images/recording-tests/mobile-test-editor/c04932f-image_14.png)

テストエディタの Device and Mobile Application Information セクションには、以下の情報が表示されます:

- **Target Device**: 記録/再生セッションに現在使用されているデバイスの構成情報（ターゲットモバイルデバイス、オペレーティングシステム、ディスプレイ解像度に関する情報を含む）を表示します。
- **Application Name**: テストに使用されているモバイルアプリケーションを表示します。

:::info
**注意:**

Testim で使用する仮想デバイスを追加するには、以下のソフトウェアを使用できます:

- Android デバイス: Virtual Device Manager 付き Android Studio
- Apple デバイス: XCode iOS Simulator
:::

### テストに使用するモバイルアプリの変更

モバイルテストは一度に1つのアプリケーションのみをテストできます。テストするアプリケーションはいつでも変更できます。

**テストに使用するモバイルアプリを変更するには:**

1. 現在の Application Name の横にある **Edit** アイコンをクリックします。

![編集アイコン](/images/recording-tests/mobile-test-editor/06fdee9-image_16.png)

2. Properties パネルから **Change app** リンクをクリックします。

![アプリ変更](/images/recording-tests/mobile-test-editor/3379eae-changeapp.png)

3. 新しいアプリを選択またはアップロードし、**Done** ボタンをクリックします。

![アプリ選択](/images/recording-tests/mobile-test-editor/2491dd8-selectapp.png)

:::info
**注意:**

テストを記録した後に完全に異なるアプリに変更することは推奨されません。アプリの変更は、同じアプリの新しいバージョンをテストする場合に役立ちます。
:::

## モバイルテストステップ

![テストステップ](/images/recording-tests/mobile-test-editor/d0a4502-image_15.png)

テストを記録すると、テストステップがエディタに順番に表示されます。各テストステップには以下の情報が表示されます:

- ステップ番号
- ステップタイプ
- 対話した要素のサムネイル(ボタン、画像、テキストなど)

### テストステッププロパティの表示

テストステップが記録された後、テストステップのプロパティを表示できます。

**テストステップのプロパティを表示するには:**

1. ステップの **Show Properties** アイコンをクリックします。

![プロパティ表示](/images/recording-tests/mobile-test-editor/d104475-showproperties.png)

ステップの Properties パネルが表示されます。

![ステッププロパティ](/images/recording-tests/mobile-test-editor/157cda8-stepprops.png)

ステップの Properties パネルには以下の情報が表示されます:

- **Test Step Name**: Testim によってステップに自動的に割り当てられた名前。
- **Target Element**: テスト中にユーザーが対話した要素(ボタン、画像、テキストなど)。
- **When this step fails**: テスト実行中にステップにエラーが発生した場合に Testim が応答する方法の指示:
  - **Mark error & stop**: ステップにエラーインジケータを追加し、テストの実行を停止します。
  - **Mark error & continue**: ステップにエラーインジケータを追加し、テストの実行を続行します。
  - **Mark warning & continue**: ステップに警告インジケータを追加し、テストの実行を続行します。
- **When to run step**: テストのステップを実行するタイミングを制御できます。以下のオプションを適用できます:
  - **Always Run** - テストを実行するたびにステップが実行されます。
  - **Element** - 指定された要素がページに存在する(または存在しない)場合にステップが実行されます。
  - **Element text** - 特定のテキストが特定の要素内に存在する場合にステップが実行されます。
  - **Custom** - 要素が特定の値を持っている場合にステップが実行されます。
  - **Never (skip)** - ステップは実行されません。
- **Override timeout**: 「ステップタイムアウト」は、Testim がテストステップに対して失敗を登録する時間経過(ミリ秒単位)です。各ステップのデフォルトの時間経過は、最初に Setup ステップ構成で設定されます。このチェックボックスを選択すると、このステップのデフォルト設定を上書きし、異なる時間経過値(ミリ秒単位)を指定できます。

## モバイルテストアクションパネル

![テストアクション](/images/recording-tests/mobile-test-editor/8949a49-testactions.png)

Test Action Panel を使用すると、以下のことができます:

- **View Device**: テストの記録中に、このボタンは AUT Viewer をすべてのウィンドウの最前面に移動させます。
- **Record/Pause**: テストを記録していないときは、記録を開始する記録ボタンとして表示されます。記録中は、記録を一時停止する一時停止ボタンとして表示されます。
- **Play**: このボタンを押すと、Testim は自動的にテストを実行します。
- **Turn On/Off Element Highlighting**: AUT Viewer と対話してモバイルテストステップを記録するとき、Testim はビューアで対話している要素を強調表示します。この強調表示をオフにすることができます。

## Application Under Test (AUT) Viewer

モバイルテストの記録を開始すると、AUT Viewer は物理または仮想デバイスとのインターフェイスを表示する別のウィンドウです。このビューアを使用すると、Testim はデバイスで実行されたアクションをテストステップとしてキャプチャできます。

![AUT Viewer](/images/recording-tests/mobile-test-editor/7e3ad4d-image_17.png)

AUT Viewer には以下の情報が表示されます:

- **Title Bar**: 接続されたデバイスとデバイスのオペレーティングシステムを表示します。
- **Display Window**: ユーザーがデバイスを持っているかのようにデバイスと対話できる、物理または仮想デバイスとのインターフェイスを表示します。
- **Recording Indication**: 画面が記録されていることを示すインジケータを表示します。

:::info
**注意:**

AUT Viewer ウィンドウの角をドラッグして、ビューアのサイズを変更できます。Testim は、接続されたデバイスに固有のディスプレイ比率を維持します。
:::

:::info
**注意:**

AUT Viewer ウィンドウを閉じると、テストの記録が停止し、再生中はテストが停止して失敗します。
:::
