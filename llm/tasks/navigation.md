# 翻訳タスク (navigation)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

アプリをテストする際にナビゲーションステップを追加する方法を学びます

テストに別のページに移動するステップを追加できます。ナビゲーションで既存のタブを上書きしたくない場合は、**新しいタブでURLを開く**オプションを選択できます。

:fa-arrow-right: **テストにナビゲーションステップを追加するには:**

1. **テストリスト > テスト**に移動してテストを開きます。
2. 既存のステップ間の**矢印**または最後のステップの後の**+ボタン**にカーソルを合わせます。

![ステップ矢印](/images/handling-ui-actions/navigation/783be29-step-arrows.jpg)

3. **Testim定義済みステップ**ボタンを選択します。

![定義済みステップ](/images/handling-ui-actions/navigation/2d11731-predefined-steps.jpg)

4. クイック検索で**ナビゲーションアクションを追加**を検索するか、**アクション**セクションを展開して**ナビゲーションアクションを追加**を選択します。

![ナビゲーションアクションを追加](/images/handling-ui-actions/navigation/c8729c0-add-navigation-action.jpg)

5. このステップでテストを移動させたいページの**URL**を挿入します。

![URLの入力](/images/handling-ui-actions/navigation/ac74c3a-image.png)

6. ナビゲーションで新しいタブを開きたい場合は、**新しいタブでURLを開く**チェックボックスを選択します。\
   新しいナビゲーションステップが、選択した場所のテストに追加されます。

![ナビゲーションステップが追加された](/images/handling-ui-actions/navigation/abb8218-navigation-step-added.jpg)
