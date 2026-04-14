---
title: 待機（Wait for）
description: 各種「待機」ステップを使って要素の表示・非表示、テキスト、ダウンロード完了などを待ってから処理を進める方法を説明します。
category: 高度な編集
order: 5049
updated: '2025-09-22'
sourceUrl: 'https://docs.tricentis.com/testim/content/advanced-editing/wait-for.htm'
keywords:
  - 待機
  - 要素の表示
  - 要素の非表示
  - テキスト待機
  - スリープ
  - カスタム待機
  - ビジュアル検証
  - ダウンロード待機
  - Testim
  - 高度な機能
---

次のステップへ進む前に、あるイベントの発生を待ちたい場面があります。要素の表示待ち、テキストの表示待ち、数秒の待機など、さまざまです。Testim には待機のためのビルトイン機能があります。提供される待機の種類:

- 要素の表示待機（[Web](#wait-for-element-visible-web)、[モバイル](#wait-for-element-visible-mobile)）
- 要素の非表示待機（[Web](#wait-for-element-not-visible-web)）
- 要素テキストの表示待機（[Web](#wait-for-element-text-web)、[モバイル](#wait-for-element-text-mobile)）
- スリープ（[Web](#sleep-web)、[モバイル](#sleep-mobile)）
- カスタム待機（JavaScript）（[Web](#custom-wait-for-web)）
- 要素のビジュアル待機（[Web](#wait-for-element-visualization-web)）
- ダウンロード待機（[Web](#wait-for-download-web)）

## 要素の表示を待つ（Web）

ページ上で要素が表示されるまで待機します。
**Wait for Element Visible を追加するには:**

1. テストの **Test Editor** を開きます。
2. 新しいステップを挿入したい **矢印** にカーソルを合わせ、**Testim predefined steps** をクリックします。

![Wait for ステップのスクリーンショット](/images/advanced-features/wait-for/25e3a64-predefined.jpg)

3. **Wait for element visible** ステップを選択します。

![Wait for ステップのスクリーンショット](/images/advanced-features/wait-for/3512b00-wait-for-element-visible-step.png)

4. AUT 上のターゲット要素を選択します。

![Wait for ステップのスクリーンショット](/images/advanced-features/wait-for/e55a7b4-wait-for-element-visible-selection.png)

:::warning{title="注意"}
「To choose an element Open base URL or Run test to relevant step」と表示された場合は、ベース URL でアプリを開くか、該当ステップまでテストを実行してから追加してください。
:::

## 要素の表示を待つ（モバイル）

画面上で要素が表示されるまで待機する場合に **Wait for element visible** を使用します。
**Wait for Element Visible を追加するには:**

1. テストの **Test Editor** を開きます。
2. 新しいステップを挿入したい **矢印** にカーソルを合わせ、**Testim predefined steps** をクリックします。

![Wait for ステップのスクリーンショット](/images/advanced-features/wait-for/2737b17-mobile-predefined-step.png)

3. **Wait for element visible** ステップを選択します。

![Wait for ステップのスクリーンショット](/images/advanced-features/wait-for/1403f9a-mobile-element-visible.png)

4. AUT 上で対象要素（**target element**）を選択します。

![Wait for ステップのスクリーンショット](/images/advanced-features/wait-for/f85f8ff-select-target.png)

:::warning{title="注意"}
「To choose an element Open App or Run test to relevant step」と表示された場合は、アプリを開くか、該当ステップまで実行してから追加してください。
:::

## 要素の非表示を待つ（Web）

要素がページから消えるまで待機します。
**Wait for Element Not Visible を追加するには:**

1. テストの **Test Editor** を開きます。
2. 新しいステップを挿入したい **矢印** にカーソルを合わせ、**Testim predefined steps** をクリックします。

![Wait for ステップのスクリーンショット](/images/advanced-features/wait-for/6b2f5e3-predefined.jpg)

3. **Wait for element not visible** ステップを選択します。

![Wait for ステップのスクリーンショット](/images/advanced-features/wait-for/c9ec1c1-element-not-visible-step.png)

4. AUT 上のターゲット要素を選択します。

![Wait for ステップのスクリーンショット](/images/advanced-features/wait-for/8327419-wait-for-element-visible-selection.png)

:::warning{title="注意"}
同様のメッセージが出る場合、ベース URL でアプリを開くか該当ステップまで実行してから追加してください。
:::

### 非表示待ちの遅延

非表示の判定前に待機時間を設けたい場合があります。例えば急に要素が再表示されないことを確認したいケースです。
**待機前の遅延を設定するには:**

1. 作成した '**Wait for Element not visible**' ステップのプロパティを開きます。
2. **Pre-step delay** をオンにします。

![Wait for ステップのスクリーンショット](/images/advanced-features/wait-for/7f4b046-pre-step-delay.png)

3. **delay time in milliseconds (ms)** に待機させたい時間をミリ秒で入力します。この時間だけ待ってから次のステップへ進みます。

![Wait for ステップのスクリーンショット](/images/advanced-features/wait-for/e0a7107-delay.png)

## 要素テキストの表示を待つ（Web）

特定のテキストが表示されるまで待機します。
**Wait for element text を追加するには:**

1. テストの **Test Editor** を開きます。
2. 新しいステップを挿入したい **矢印** にカーソルを合わせ、**Testim predefined steps** をクリックします。

![Wait for ステップのスクリーンショット](/images/advanced-features/wait-for/6cae95d-predefined.jpg)

3. **Wait for element text** ステップを選択します。

![Wait for ステップのスクリーンショット](/images/advanced-features/wait-for/9db9023-wait-element-text-step.png)

4. 待機対象としたいテキスト要素を AUT 上で選択します。

![Wait for ステップのスクリーンショット](/images/advanced-features/wait-for/00ffc60-text-selection.png)

:::warning{title="注意"}
同様のメッセージが出る場合、ベース URL でアプリを開くか該当ステップまで実行してから追加してください。  
また、'**Expected Value**' にはパラメーター、正規表現、JavaScript 式が使用できます。詳細は[高度なテキスト検証](/docs/advanced-editing/validations/validate-element-text#advanced-text-validation) を参照してください。
:::

## 要素テキストの表示を待つ（モバイル）

特定のテキストが表示されるまで待機したい場合に **Wait for element text** を使用します。
**Wait for element text を追加するには:**

1. テストの **Test Editor** を開きます。
2. 新しいステップを挿入したい **矢印** にカーソルを合わせ、**Testim predefined steps** をクリックします。

![Wait for ステップのスクリーンショット](/images/advanced-features/wait-for/0f45edc-mobile-predefined-step.png)

3. **Wait for element text** ステップを選択します。

![Wait for ステップのスクリーンショット](/images/advanced-features/wait-for/6362268-mobile-element-text.png)

4. 待機対象としたいテキスト要素を AUT 上で選択します。

![Wait for ステップのスクリーンショット](/images/advanced-features/wait-for/5bb3fab-select-target.png)

:::warning{title="注意"}
「To choose an element Open App or Run test to relevant step」と表示された場合は、アプリを開くか、該当ステップまで実行してから追加してください。  
また、'Expected Value' にはパラメーター、正規表現、JavaScript 式が使用できます（[高度なテキスト検証](/docs/advanced-editing/validations/validate-element-text#advanced-text-validation) を参照）。
:::

## スリープ（Web）

ステップ間で数秒待機したい場合に使用します。過度な待機は実行時間の増加につながるため使用は最小限に。
**Sleep を追加するには:**

1. テストの **Test Editor** を開きます。
2. 新しいステップを挿入したい **矢印** にカーソルを合わせ、**Testim predefined steps** をクリックします。

![Wait for ステップのスクリーンショット](/images/advanced-features/wait-for/a5f65a5-predefined.jpg)

3. **Sleep** ステップを選択します。

![Wait for ステップのスクリーンショット](/images/advanced-features/wait-for/e2c3b70-sleep-step.png)

4. 既定は 1 秒（1,000ms）です。**sleep duration** はステップのプロパティで編集します。

![Wait for ステップのスクリーンショット](/images/advanced-features/wait-for/8cf49cd-sleep-duration.png)

## スリープ（モバイル）

ステップ間で数秒待機したい場合に使用します。待機時間が長すぎるとテスト全体の実行時間が延びるため、必要最小限に留めてください。
**Sleep を追加するには:**

1. テストの **Test Editor** を開きます。
2. 新しいステップを挿入したい **矢印** にカーソルを合わせ、**Testim predefined steps** をクリックします。

![Wait for ステップのスクリーンショット](/images/advanced-features/wait-for/237cdc5-mobile-predefined-step.png)

3. **Sleep** ステップを選択します。

![Wait for ステップのスクリーンショット](/images/advanced-features/wait-for/2b5b317-mobile-sleep.png)

4. 既定は 1 秒（1,000ms）。**sleep duration** はステップのプロパティで編集します。

![Wait for ステップのスクリーンショット](/images/advanced-features/wait-for/f953339-sleep-duration.png)

## 要素のビジュアル待機（Web）

要素が表示されるのを待ち、期待するビジュアルと一致するか検証します。詳細は[ビジュアル検証](/docs/advanced-editing/validations/pixel-validation-and-pixel-wait-for) を参照してください。
**Wait for element visualization を追加するには:**

1. テストの **Test Editor** を開きます。
2. 新しいステップを挿入したい **矢印** にカーソルを合わせ、**Testim predefined steps** をクリックします。

![Wait for ステップのスクリーンショット](/images/advanced-features/wait-for/0819163-predefined.jpg)

3. **Wait for element visualization** ステップを選択します。

![Wait for ステップのスクリーンショット](/images/advanced-features/wait-for/d8b8712-element-visualization-step.png)

4. AUT 上のターゲット要素を選択します。

![Wait for ステップのスクリーンショット](/images/advanced-features/wait-for/16cbd24-wait-for-element-visible-selection.png)

## カスタム待機（Web）

ビルトインの待機で足りない場合に使う、JavaScript ベースの待機ステップです。
**Custom wait for を追加するには:**

1. テストの **Test Editor** を開きます。
2. 新しいステップを挿入したい **矢印** にカーソルを合わせ、**Testim predefined steps** をクリックします。

![Wait for ステップのスクリーンショット](/images/advanced-features/wait-for/bd85a91-predefined.jpg)

3. **Add custom wait for** ステップを選択します。

![Wait for ステップのスクリーンショット](/images/advanced-features/wait-for/dbfd2ee-custom-wait-step.png)

4. 新しいステップの **name** を入力し、**Create Step** をクリックします。

![Wait for ステップのスクリーンショット](/images/advanced-features/wait-for/da06ecb-custom-wait-name.png)

5. JS エディターで関数内にコードを記述し、true/false を返すことを確認します。

![Wait for ステップのスクリーンショット](/images/advanced-features/wait-for/94a0b4a-js-wait.png)

:::warning{title="注意"}

- 関数が true を返すかステップのタイムアウトに達するまでリトライします。
- Custom wait for は再利用可能です。
- ステップパラメーター、エクスポートパラメーターなども利用できます。詳細は[カスタム検証・アクション](/docs/advanced-editing/validations/custom-code)。
  :::

## ダウンロード待機（Web）

次のステップへ進む前に、ファイルの完全なダウンロード完了を待機したい場合に使用します。
**Wait for Download を追加するには:**

1. テストの **Test Editor** を開きます。
2. 新しいステップを挿入したい **矢印** にカーソルを合わせ、**Testim predefined steps** をクリックします。

![Wait for ステップのスクリーンショット](/images/advanced-features/wait-for/dde267a-predefined.jpg)

3. **Wait for Download** ステップを選択します。

![Wait for ステップのスクリーンショット](/images/advanced-features/wait-for/681c4e7-wait-for-download-step.png)

4. 新しいステップの **name** を入力し、**Create Step** をクリックします。

![Wait for ステップのスクリーンショット](/images/advanced-features/wait-for/fa1cbce-wait-for-download-step-name.png)

5. JS エディターでダウンロード完了の検証コードを記述します。詳細は[ダウンロードの検証](/docs/advanced-editing/validations/validate-download) を参照してください。

![Wait for ステップのスクリーンショット](/images/advanced-features/wait-for/e553c48-wait-for-download.png)

6. **Back Arrow** をクリックしてTest Editorに戻ります。スクリプトは自動的に保存されます。

![Wait for ステップのスクリーンショット](/images/advanced-features/wait-for/4a10d25-return-to-test.png)

## Wait For ステップでターゲット要素を再割り当て

作成後でも、ターゲット要素やテキストを再割り当てできます。詳細は[ターゲット要素のプロパティ編集](/docs/editing-tests/editing-your-tests/editing-target-element-properties#ターゲット要素のハイライト) を参照してください。
