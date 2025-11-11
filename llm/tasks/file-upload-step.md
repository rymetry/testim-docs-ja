# 翻訳タスク (file-upload-step)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

OS のファイルブラウザーやドラッグ＆ドロップでファイルアップロード操作を記録する

ファイルアップロードステップ（“File Drop” または “Browse For File”）は、テスト実行場所に依らずアップロード対象のファイルが常に利用可能であることを保証します。テストを「記録」するとファイルは Testim サーバーにアップロードされ、「実行」時はサーバーからローカルにダウンロードされて AUT にアップロードされます。どのファイルがアップロードされたかはステップのプロパティで確認できます。

:::note
アップロード操作はネイティブの input 要素でのみ機能します。
:::

## 主なユースケース

- フロー検証のためにファイルをアップロードする
- 特定の拡張子のみアップロード可能であることを検証する
- 複数ではなく 1 ファイルのみアップロード可能であることを検証する

## 前提条件

- Chrome DevTools を閉じてください。開いているとアップロードステップは実行できません。
- Chrome の「ダウンロード前に各ファイルの保存場所を確認する」を無効にしてください（有効だと記録できません。手順は下記）。
- 推奨ファイルサイズは 2MB 以下です。より大きなファイルでの検証が必要な場合は担当者にご連絡ください。

:::info
アップロード要素が画面上で不可視のため "Element not visible" で失敗する場合があります。ステップのプロパティで「Element must be visible」のチェックを外して再実行してください（下記参照）。
:::

:fa-arrow-right: **Chrome で「ダウンロード前に各ファイルの保存場所を確認する」を無効にするには:**

1. In the Chrome browser, click on the **Chrome menu** (three dots at the top right).

![](/images/validations/file-upload-step/66c3a04-Testim_249a.png "Testim 249a.png")

**Chrome menu** のオプションが表示されます。

2. Click on **Settings**.

![](/images/validations/file-upload-step/a1dc980-Testim_250a_r.png "Testim 250a_r.png")

**Chrome Settings** ページが開きます。

3. Click on **Advanced**.

![](/images/validations/file-upload-step/fd3f76e-Testim_251a.png "Testim 251a.png")

**Advanced** メニューが展開されます。

4. Click on **Downloads**.

![](/images/validations/file-upload-step/bfff7bc-Testim_252a_r.png "Testim 252a_r.png")

**Downloads** 設定ページが表示されます。

5. Ensure the **Ask where to save each file before downloading** toggle is disabled (to the left). Click on it to toggle between enabled (right) and disabled (left).

![](/images/validations/file-upload-step/6631d57-Testim_253a.png "Testim 253a.png")

:fa-arrow-right: **「Element must be visible」のチェックを外すには:**

1. Hover over the desired upload step and click on the **Show Properties** (:fa-cog:) icon.

![](/images/validations/file-upload-step/40da018-Testim_254a.png "Testim 254a.png")

右側に **Properties** パネルが表示されます。

![](/images/validations/file-upload-step/bf62347-Testim_255_r.png "Testim 255_r.png")

2. Click the **Element must be visible** checkbox to deselect it.

## ファイルアップロードステップの追加

ファイルアップロードは、AUT へのアップロード操作を記録することで自動的に追加されるステップです（プリセットではありません）。記録時に AUT へアップロードしたファイルはグリッドにもアップロードされ、テスト実行時に利用されます。

:fa-arrow-right: **“File Drop” / “Browse For File” ステップを作成するには:**

1. In the flow of recording your test, navigate to a location in your app to upload a file. This may be a drag and drop box in your app, or a link which opens your local file browser.
2. Drag and drop your file(s) or follow the prompts in your local file browser to select your file(s).\
   The file is uploaded to the Testim server, and a **File Drop** step or a **Browse For File** step is created.

![](/images/validations/file-upload-step/b79925e-Testim_256a.png "Testim 256a.png")

テスト実行時、ファイルはサーバーからローカルにダウンロードされ、AUT にアップロードされます。

:fa-arrow-right: **“File Drop” / “Browse For File” ステップでファイル一覧を確認するには:**

1. Hover over the upload step for which you want to view the files and click on the **Show Properties** (:fa-cog:) icon.

![](/images/validations/file-upload-step/a68316e-Testim_254a.png "Testim 254a.png")

右側の **Properties** パネルにアップロード済みファイルが表示されます。

![](/images/validations/file-upload-step/dd52cc2-Testim_257a_r.png "Testim 257a_r.png")
