---
title: '待機（Wait for）'
description: '原文: https://help.testim.io/docs/wait-for'
category: '高度な機能'
order: 1
updated: '2025-11-02'
keywords:
  - testim
  - wait-for
  - advanced-features
---
ただ「待つ」必要があるときに。

次のステップへ進む前に、あるイベントの発生を待ちたい場面があります。要素の表示待ち、テキストの表示待ち、数秒の待機など、さまざまです。

Testim には待機のためのビルトイン機能があります。提供される待機の種類:

* Wait for element visible ([web](wait-for#wait-for-element-visible-web) and [mobile](wait-for#wait-for-element-visible-mobile))
* Wait for element not visible ([web](wait-for-element-not-visible-web))
* Wait for element text ([web](wait-for#wait-for-element-text-web) and [mobile](wait-for#wait-for-element-text-mobile))
* Sleep ([web](wait-for#sleep-web) and [mobile](wait-for#sleep-mobile))
* Custom Wait for (JavaScript) ([web](wait-for#custom-wait-for-web))
* Wait for element visualization ([web](wait-for#wait-for-element-visualization-web))
* Wait for Download ([web](wait-for#wait-for-download-web))

## 要素の表示を待つ（Web）

ページ上で要素が表示されるまで待機します。

:fa-arrow-right: **Wait for Element Visible を追加するには:**

1. Navigate to the **Test Editor** for your test.
2. Hover over the **arrow** where you want to insert the new step and click **Testim predefined steps.**

![](/images/advanced-features/wait-for/25e3a64-predefined.jpg)

3. Select the **Wait for element visible** step.

![](/images/advanced-features/wait-for/3512b00-wait-for-element-visible-step.png)

4. Select the target element in your application.

![](/images/advanced-features/wait-for/e55a7b4-wait-for-element-visible-selection.png)

> 📘 注意
>
> 「To choose an element Open base URL or Run test to relevant step」と表示された場合は、ベースURLでアプリを開くか、該当ステップまでテストを実行してから追加してください。

## 要素の表示を待つ（モバイル）

Use wait for element visible to wait for your element to be visible on the page.

:fa-arrow-right: **Wait for Element Visible を追加するには:**

1. Navigate to the **Test Editor** for your test.
2. Hover over the **arrow** where you want to insert the new step and click **Testim predefined steps.**

![](/images/advanced-features/wait-for/2737b17-mobile-predefined-step.png)

3. Select the **Wait for element visible** step.

![](/images/advanced-features/wait-for/1403f9a-mobile-element-visible.png)

4. Select the **target element**in your application AUT.

![](/images/advanced-features/wait-for/f85f8ff-select-target.png)

> 📘 注意
>
> 「To choose an element Open App or Run test to relevant step」と表示された場合は、アプリを開くか、該当ステップまで実行してから追加してください。

## 要素の非表示を待つ（Web）

要素がページから消えるまで待機します。

:fa-arrow右: **Wait for Element Not Visible を追加するには:**

1. Navigate to the **Test Editor** for your test.
2. Hover over the **arrow** where you want to insert the new step and click **Testim predefined steps.**

![](/images/advanced-features/wait-for/6b2f5e3-predefined.jpg)

3. Select the **Wait for element not visible** step.

![](/images/advanced-features/wait-for/c9ec1c1-element-not-visible-step.png)

4. Select the target element in your application.

![](/images/advanced-features/wait-for/8327419-wait-for-element-visible-selection.png)

> 📘 注意
>
> 同様のメッセージが出る場合、ベースURLでアプリを開くか該当ステップまで実行してから追加してください。

### 非表示待ちの遅延

非表示の判定前に待機時間を設けたい場合があります。例えば急に要素が再表示されないことを確認したいケースです。

:fa-arrow-right: **待機前の遅延を設定するには:**

1. Enter the properties of the '**Wait for Element not visible**' step that you created.
2. Check **Pre-step delay**.

![](/images/advanced-features/wait-for/7f4b046-pre-step-delay.png)

3. Set **delay time in milliseconds (ms)**. Testim will wait this amount of time before moving to the next step.

![](/images/advanced-features/wait-for/e0a7107-delay.png)

## 要素テキストの表示を待つ（Web）

特定のテキストが表示されるまで待機します。

:fa-arrow-right: **Wait for element text を追加するには:**

1. Navigate to the **Test Editor** for your test.
2. Hover over the **arrow** where you want to insert the new step and click **Testim predefined steps.**

![](/images/advanced-features/wait-for/6cae95d-predefined.jpg)

3. Select the **Wait for element text** step.

![](/images/advanced-features/wait-for/9db9023-wait-element-text-step.png)

4. Select the target text element you want to wait for from your app.

![](/images/advanced-features/wait-for/00ffc60-text-selection.png)

> 📘 注意
>
> 同様のメッセージが出る場合、ベースURLでアプリを開くか該当ステップまで実行してから追加してください。

> 📘 注意
>
> '**Expected Value**' にはパラメータ、正規表現、JavaScript式が使用できます。詳細は[高度なテキスト検証](doc:validate-element-text#advanced-text-validation) を参照してください。

## 要素テキストの表示を待つ（モバイル）

Use wait for element text to make sure a specific text appears before continuing with the test.

:fa-arrow-right: **Wait for element text を追加するには:**

1. Navigate to the **Test Editor** for your test.
2. Hover over the **arrow** where you want to insert the new step and click **Testim predefined steps.**

![](/images/advanced-features/wait-for/0f45edc-mobile-predefined-step.png)

3. Select the **Wait for element text** step.

![](/images/advanced-features/wait-for/6362268-mobile-element-text.png)

4. Select the target text element you want to wait for from your app.

![](/images/advanced-features/wait-for/5bb3fab-select-target.png)

> 📘 注意
>
> 「To choose an element Open App or Run test to relevant step」と表示された場合は、アプリを開くか、該当ステップまで実行してから追加してください。

> 📘 注意
>
> 'Expected Value' にはパラメータ、正規表現、JavaScript式が使用できます（Advanced text validation 参照）。

## スリープ（Web）

ステップ間で数秒待機したい場合に使用します。過度な待機は実行時間の増加につながるため使用は最小限に。

:fa-arrow-right: **Sleep を追加するには:**

1. Navigate to the **Test Editor** for your test.
2. Hover over the **arrow** where you want to insert the new step and click **Testim predefined steps.**

![](/images/advanced-features/wait-for/a5f65a5-predefined.jpg)

3. Select the **Sleep** step.

![](/images/advanced-features/wait-for/e2c3b70-sleep-step.png)

4. 既定は1秒（1,000ms）です。**sleep duration** はステップのプロパティで編集します。

![](/images/advanced-features/wait-for/8cf49cd-sleep-duration.png)

## スリープ（モバイル）

Sometimes you want to wait a few seconds between the steps. Use it carefully as constant waiting will make the test run longer.

:fa-arrow-right: **Sleep を追加するには:**

1. Navigate to the **Test Editor** for your test.
2. Hover over the **arrow** where you want to insert the new step and click **Testim predefined steps.**

![](/images/advanced-features/wait-for/237cdc5-mobile-predefined-step.png)

3. Select the **Sleep** step.

![](/images/advanced-features/wait-for/2b5b317-mobile-sleep.png)

4. 既定は1秒（1,000ms）。**sleep duration** はステップのプロパティで編集します。

![](/images/advanced-features/wait-for/f953339-sleep-duration.png)

## 要素のビジュアル待機（Web）

要素が表示されるのを待ち、期待するビジュアルと一致するか検証します。詳細は[ビジュアル検証](/docs/validations/pixel-validation-and-pixel-wait-for) を参照してください。

:fa-arrow-right: **Wait for element visualization を追加するには:**

1. Navigate to the **Test Editor** for your test.
2. Hover over the **arrow** where you want to insert the new step and click **Testim predefined steps.**

![](/images/advanced-features/wait-for/0819163-predefined.jpg)

3. Select the **Wait for element visualization** step.

![](/images/advanced-features/wait-for/d8b8712-element-visualization-step.png)

4. Select the target element in your application.

![](/images/advanced-features/wait-for/16cbd24-wait-for-element-visible-selection.png)

## カスタム待機（Web）

ビルトインの待機で足りない場合に使う、JavaScriptベースの待機ステップです。

:fa-arrow-right: **Custom wait for を追加するには:**

1. Navigate to the **Test Editor** for your test.
2. Hover over the **arrow** where you want to insert the new step and click **Testim predefined steps.**

![](/images/advanced-features/wait-for/bd85a91-predefined.jpg)

3. Select the **Add custom wait for** step.

![](/images/advanced-features/wait-for/dbfd2ee-custom-wait-step.png)

4. Provide a **name** for the new step and click the **Create Step** button.

![](/images/advanced-features/wait-for/da06ecb-custom-wait-name.png)

5. JSエディタで関数内にコードを記述し、True/False を返すことを確認します。

![](/images/advanced-features/wait-for/94a0b4a-js-wait.png)

> 📘 注意
>
> * 関数が true を返すかステップのタイムアウトに達するまでリトライします。
> * Custom wait for は再利用可能です。
> * ステップパラメータ、エクスポートパラメータなども利用できます。詳細は[カスタム検証・アクション](/docs/validations/custom-code)。

## ダウンロード待機（Web）

次のステップへ進む前に、ファイルの完全なダウンロード完了を待機したい場合に使用します。

:fa-arrow-right: **Wait for Download を追加するには:**

1. Navigate to the **Test Editor** for your test.
2. Hover over the **arrow** where you want to insert the new step and click **Testim predefined steps.**

![](/images/advanced-features/wait-for/dde267a-predefined.jpg)

3. Select the **Wait for Download** step.

![](/images/advanced-features/wait-for/681c4e7-wait-for-download-step.png)

4. Provide a **name** for the new step and click the **Create Step** button.

![](/images/advanced-features/wait-for/fa1cbce-wait-for-download-step-name.png)

5. JSエディタでダウンロード完了の検証コードを記述します。詳細は[ダウンロードの検証](/docs/validations/validate-download) を参照。

![](/images/advanced-features/wait-for/e553c48-wait-for-download.png)

6. Click the **Back Arrow** to return to the test editor. Your script will automatically be saved.

![](/images/advanced-features/wait-for/4a10d25-return-to-test.png)

## Wait For ステップでターゲット要素を再割り当て

作成後でも、ターゲット要素やテキストを再割り当てできます。詳細は[ターゲット要素のプロパティ編集](doc:editing-target-element-properties#reassigningimproving-the-target-element) を参照してください。
