---
title: ディープリンク（モバイル）
description: Deep Link ステップで、モバイルアプリ内の特定画面を URL スキームで直接開き、パラメーター付きのディープリンク動作を検証する方法を説明します。
category: 高度な編集
order: 5063
updated: '2025-09-22'
sourceUrl: 'https://docs.tricentis.com/testim/content/advanced-editing/deep-link-mobile/index.htm'
keywords:
  - ディープリンク
  - Deep Link
  - モバイルアプリ
  - URL スキーム
  - モバイルテスト
  - 特殊ステップ
  - VMG
  - パラメーター
  - Testim
  - 画面遷移
---

ディープリンクとは、アプリを起動して特定の画面を直接開くためのリンクです（ホーム画面や Web ページではなく、アプリ内の所定位置へ遷移します）。OS 標準アプリやブラウザを含む端末内のアプリを開けるほか、パラメーター（電話番号など）も渡せます。**Deep Link** ステップは、ディープリンクが期待どおりに動作するかを検証するためのステップであり、指定したアプリの所定位置を開いて、必要ならパラメーターも渡します。ディープリンク遷移後に確認ダイアログが表示される場合は、その承認ボタンをタップする手順も記録してください。

![ディープリンクステップのスクリーンショット](/images/special-steps/deep-link-mobile/58d5cba-open.png)

:::note
本ステップは [VMG](/docs/integrations/grid-management/virtual-mobile-grid) でのみ利用可能です。
:::

## Deep Link ステップを追加する

**追加手順:**

1. Deep Link ステップを追加したい位置の矢印（）にカーソルを合わせます。アクションオプションが表示されます。
2. “**M**”（Testim predefined steps）をクリックします。**Predefined steps** メニューが開きます。
3. **Actions** メニューを展開し、**Deep link** ステップを選択します。

![ディープリンクステップのスクリーンショット](/images/special-steps/deep-link-mobile/213c463-deeplink.png)

:::warning{title="注意"}
メニュー上部の検索ボックスで “Deep link” と入力して検索することもできます。
:::

次のダイアログが表示されます。

![ディープリンクステップのスクリーンショット](/images/special-steps/deep-link-mobile/fdd1fcc-deeplink2.png)

4. **Value** フィールドに、次の形式で値を入力します。
   - 構文: `schemeName://parameterValue`
   - `schemeName` — 起動するアプリのスキーム名（例: `tel`、`sms`、`mailto`、`facetime` など）
   - `parameter` — アプリに渡す値（例: 電話番号）
   - 文字列（JS 式）なので、値は引用符で囲みます
   - 例: `'sms://12354'`、`mailto://example@email.com`、`facetime://1-408-555-1212`

:::note
一部サードパーティアプリは URL ベースのスキームのみ対応です（例: [https://byby.dev/ios-deep-linking](https://byby.dev/ios-deep-linking)）。Spotify は [https://open.spotify.com/...](https://open.spotify.com/artist/1rSGNXhhYuWoq9BEz5DZGO) の形式のみ対応など。
:::

5. ディープリンク値にパラメーターを追加することもできます。通常の Testim パラメーターを、JS 式と同じ要領で連結できます（例: `'sms://12354' + myParam`）。
6. **OK** をクリックします。

Deep Link ステップが追加されます。

7. **Properties** パネルで、必要に応じて次のプロパティを設定します。
   - **When this step fails** – 失敗時の動作を指定します。
   - **When to run step** – 実行条件を指定します（[Conditions](/docs/editing-tests/conditions) を参照）。
   - **Override timeout** – タイムアウト値（ミリ秒）を上書きします。成功に必要な残り時間がある限りリトライします。
