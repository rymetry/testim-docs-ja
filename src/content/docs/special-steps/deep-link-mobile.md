---
title: 'ディープリンク（モバイル）'
description: 'Deep Link ステップで、モバイルアプリ内の特定画面を URL スキームで直接開き、パラメータ付きのディープリンク動作を検証する方法を説明します。'
category: '高度な編集'
order: 5063
updated: '2025-09-22'
sourceUrl: 'https://help.testim.io/docs/deep-link-mobile'
keywords:
  - ディープリンク
  - Deep Link
  - モバイルアプリ
  - URL スキーム
  - モバイルテスト
  - 特殊ステップ
  - VMG
  - パラメータ
  - Testim
  - 画面遷移
---

アプリ内の特定画面を直接開くディープリンクを追加します。

ディープリンクは、アプリを起動して特定の画面を直接開くリンクです（ホーム画面やWebではなく、アプリ内の所定位置へ遷移）。OS標準アプリやブラウザを含む端末内のアプリを開け、パラメータ（例: 電話番号）も渡せます。

**Deep Link** ステップでは、ディープリンクが期待通り動作するかを検証します。指定アプリの指定位置を開き、任意でパラメータを渡します。

ディープリンク遷移後に確認ダイアログが表示される場合は、その承認ボタンをタップするステップを記録してください。

![ディープリンクステップのスクリーンショット](/images/special-steps/deep-link-mobile/58d5cba-open.png)

> 📘
>
> 本ステップは [VMG](/docs/virtual-mobile-grid) でのみ利用可能です。

## Deep Link ステップを追加する

:fa-arrow-right:**追加手順:**

1. Deep Link ステップを追加したい位置の矢印（:fa-caret-right:）にカーソルを合わせます。アクションオプションが表示されます。
2. “**M**”（Testim predefined steps）をクリックします。**Predefined steps** メニューが開きます。
3. **Actions** メニューを展開し、**Deep link** ステップを選択します。

![ディープリンクステップのスクリーンショット](/images/special-steps/deep-link-mobile/213c463-deeplink.png)

> 📘 注意
>
> メニュー上部の検索ボックスで “Deep link” と入力して検索することもできます。

次のダイアログが表示されます。

![ディープリンクステップのスクリーンショット](/images/special-steps/deep-link-mobile/fdd1fcc-deeplink2.png)

4. **Value** に次の形式で値を入力します。
   1. 構文: `schemeName://parameterValue`
   2. schemeName — 起動するアプリのスキーム名（例: `tel`, `sms`, `mailto`, `facetime` など）
   3. parameter — アプリに渡す値（例: 電話番号）
   4. 文字列（JS式）なので引用符で囲みます
   5. 例 — `'sms://12354'`, `mailto://example@email.com`, `facetime://1-408-555-1212`
      > 📘
      >
      > 一部サードパーティアプリは URL ベースのスキームのみ対応です（例: [https://byby.dev/ios-deep-linking](https://byby.dev/ios-deep-linking)）。Spotify は [https://open.spotify.com/...](https://open.spotify.com/artist/1rSGNXhhYuWoq9BEz5DZGO) の形式のみ対応など。
   6. ディープリンク値にパラメータを追加することもできます。通常の Testim パラメータを JS 式と同様に連結できます（例: `'sms://12354' + myParam`）。
5. **OK** をクリックします。\
   Deep Link ステップが追加されます。
6. **Properties** で必要に応じて以下を設定します。
   1. **When this step fails** – 失敗時の動作
   2. **When to run step** – 実行条件（[Conditions](/docs/conditions)）
   3. **Override timeout** – タイムアウトの上書き（ミリ秒）。成功に必要な残時間がある限りリトライします。
