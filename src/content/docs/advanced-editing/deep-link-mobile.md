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

→**Deep Link ステップを追加するには:**

1. Deep Link ステップを追加したい位置の（矢印記号）にカーソルを合わせます。アクションオプションが表示されます。
2. "**M**"（Testim predefined steps）をクリックします。**Predefined steps** メニューが開きます。
3. **Actions** メニューを展開し、**Deep link** ステップを選択します。

![ディープリンクステップのスクリーンショット](/images/special-steps/deep-link-mobile/213c463-deeplink.png)

:::note
Note: メニュー上部の検索ボックスで Deep link と入力して検索することもできます。
:::

次のダイアログが表示されます:

![ディープリンクステップのスクリーンショット](/images/special-steps/deep-link-mobile/fdd1fcc-deeplink2.png)

4. **Value** フィールドに、deep link の値を次の形式で入力します:
5. **構文:** `schemeName://parameterValue`
6. **schemeName** - スキーム名は deep link で起動するアプリの名前です。`tel`、`sms`、`mailto`、`facetime` など OS 内部アプリのいずれか、または通常のモバイルアプリ名を指定できます。
7. **parameter** - アプリに渡される値。たとえばモバイルの電話番号。
8. 値は JS 式文字列なので、引用符で囲んでください。
9. **例** - `'sms://12354'`、`mailto://example@email.com`、`facetime://1-408-555-1212` などを指定できます。

:::note
サードパーティアプリは URL ベースのスキームのみサポートする場合があります。例: [https://byby.dev/ios-deep-linking](https://byby.dev/ios-deep-linking)。Spotify は次の種類の deep link のみサポートします: [https://open.spotify.com/artist/1rSGNXhhYuWoq9BEz5DZGO](https://open.spotify.com/artist/1rSGNXhhYuWoq9BEz5DZGO)
:::

10. **deep link 値にパラメーターを追加する** - 通常の Testim パラメーターを、JS 式と同じ要領で追加できます。例: `'sms://12354' + myParam`
11. **OK** をクリックします。

ステップが追加されます。

12. ステップの **Properties** パネルで、必要に応じて次のプロパティを指定します:
13. **When this step fails** – このステップが失敗した場合の動作を指定します。
14. **When to run step** – ステップを実行する条件を指定します。詳細は [Conditions](/docs/editing-tests/conditions) を参照してください。
15. **Override timeout** – テストステップを失敗として登録するまでのデフォルトのタイムアウト設定を上書きし、異なるタイムアウト値（ミリ秒）を指定できます。成功に必要な残り時間がある限り、失敗したステップは再試行されます。
