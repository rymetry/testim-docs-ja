# 翻訳タスク (deep-link-mobile)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

アプリ内の特定画面を直接開くディープリンクを追加

ディープリンクは、アプリを起動して特定の画面を直接開くリンクです（ホーム画面やWebではなく、アプリ内の所定位置へ遷移）。OS標準アプリやブラウザを含む端末内のアプリを開け、パラメータ（例: 電話番号）も渡せます。

**Deep Link** ステップでは、ディープリンクが期待通り動作するかを検証します。指定アプリの指定位置を開き、任意でパラメータを渡します。

ディープリンク遷移後に確認ダイアログが表示される場合は、その承認ボタンをタップするステップを記録してください。

![](/images/special-steps/deep-link-mobile/58d5cba-open.png)

> 📘
>
> 本ステップは [VMG](/docs/grid-management/virtual-mobile-grid) でのみ利用可能です。

## Deep Link ステップを追加する

:fa-arrow-right:**追加手順:**

1. Hover over the  (arrow symbol) where you want to add the Deep Link step. The action options are displayed.
2. Click on the “M” (Testim predefined steps). The Predefined steps menu opens.
3. Expand the **Actions** menu and select the **Deep link** step.

![](/images/special-steps/deep-link-mobile/213c463-deeplink.png)

> 📘 Note:
>
> Alternatively, you can use the search box at the top of the menu to search for Deep link.

The following dialog is displayed:

![](/images/special-steps/deep-link-mobile/fdd1fcc-deeplink2.png)

4. **Value** に次の形式で値を入力します。
   1. 構文: `schemeName://parameterValue`
   2. schemeName — 起動するアプリのスキーム名（例: `tel`, `sms`, `mailto`, `facetime` など）
   3. parameter — アプリに渡す値（例: 電話番号）
   4. 文字列（JS式）なので引用符で囲みます
   5. 例 — `'sms://12354'`, `mailto://example@email.com`, `facetime://1-408-555-1212`
      > 📘
      >
      > 一部サードパーティアプリはURLベースのスキームのみ対応です（例: [https://byby.dev/ios-deep-linking](https://byby.dev/ios-deep-linking)）。Spotifyは[https://open.spotify.com/...](https://open.spotify.com/artist/1rSGNXhhYuWoq9BEz5DZGO) の形式のみ対応など。
   6. **Adding a parameter to the deep link value** - it is possible to add a regular Testim parameter just like any JS expression. For example - `'sms://12354' + myParam`
5. Click **OK**.\
   The step is added.
6. **Properties** で必要に応じて以下を設定します。
   1. **When this step fails** – 失敗時の動作
   2. **When to run step** – 実行条件（[Conditions](/docs/conditions/conditions)）
   3. **Override timeout** – タイムアウトの上書き（ミリ秒）。成功に必要な残時間がある限りリトライします。
