---
title: 'Testim Copilot コーディングアシスタント'
description: '原文: https://help.testim.io/docs/coding-assistant'
category: '特殊ステップ'
order: 3
updated: '2025-11-02'
keywords:
  - testim
  - coding-assistant
  - special-steps
---
Copilot コーディングアシスタントは、以下のステップで用いるJSコードの作成・理解・修正を支援します。

* [Add Custom Action](https://help.testim.io/docs/custom-code)
* [Add Custom Validation](https://help.testim.io/docs/custom-code)
* [Add Custom Wait For](https://help.testim.io/docs/wait-for#custom-wait-for-web)
* [Add Network validation](https://help.testim.io/docs/add-network-validation)
* [Add CLI Validation](https://help.testim.io/docs/add-cli-validations-and-actions)
* [Validate Download](https://help.testim.io/docs/validate-download)
* [Custom Condition](https://help.testim.io/docs/conditions#configuring-a-custom-condition)

このアシスタントは OpenAI の生成AIを Testim 用に統合・最適化したものです。チャットのプロンプト入力に加え、スラッシュ（/）で始まるコマンドも利用できます。

:fa-arrow-right:**使用手順:**

1. Create a custom step. See links above for instructions.

2. Click the **Write code with AI** button.

   ![](/images/special-steps/coding-assistant/cf577d9-writecodewithai.png)

3. 注意事項に同意します。

   ![](/images/special-steps/coding-assistant/df40920-image_4.png)

4. The coding assistant interacts with you through the chat pane. At the bottom of the chat pane you can enter your prompts.

   ![](/images/special-steps/coding-assistant/e2c25d1-codingassistant.png)

5. Click "/" (forward slash).

6. 次のコマンドから選択します:
   1. /generate - プロンプトに基づくJSコードを生成
   2. /explain - エディタで選択中のコードを解説
   3. /fix - エディタで選択中のコードの修正案を提示
   4. /help - ドキュメントを表示

7. 次のいずれかを実行します。

   1. **Generate の場合** - 作成したいコード内容をプロンプトに入力して送信。生成コードはチャットに表示されます。使用するには以下のいずれかを選択:

      * **Paste code at cursor** - カーソル位置に貼り付け

      ![](/images/special-steps/coding-assistant/088b93b-pastecodecursor.png)

      * **Copy code** - コードをクリップボードにコピー

      ![](/images/special-steps/coding-assistant/5b54849-copy.png)
   2. **Explain の場合** - エディタで対象コードを選択し、以下のいずれか:

      1. Click the **Explain code with AI** icon on the floating menu.

         ![](/images/special-steps/coding-assistant/eaf33c5-explainfloating.png)
      2. In the prompt, type `/explain`.
         解説はチャットに表示されます。

         ![](/images/special-steps/coding-assistant/f367d0f-explain.png)
   3. **Fix の場合** - エディタで対象コードを選択し、以下のいずれか:

      1. Click the **Fix code with AI** icon on the floating window.

         ![](/images/special-steps/coding-assistant/9d99571-fixcodefloating.png)
      2. In the prompt, type `/fix`.
         修正案がチャットに表示されます。使用する場合は以下のいずれか:

         * **Paste code at cursor** - place the cursor where you want to add the code and then click the **Paste code at cursor** button to add the generated code to the function editor in the location of the cursor.
         * **Copy code** - click the **Copy code** button to copy the code and then paste it anywhere you want.

# 使用例

利用できるプロンプト例:

<details>

<summary> <b>ページURLを検証するコードを生成</b></summary>

![](/images/special-steps/coding-assistant/485092a-1.png)

ページURLが指定の正規表現に一致するか検証するカスタム検証ステップで使用します。

</details>

<details>

<summary> <b>チェックボックス選択を検証するコードを生成</b></summary>

![](/images/special-steps/coding-assistant/95f3895-2.png)

特定のチェックボックスが選択済みか判定するカスタム条件で使用します。クリック前に未選択であることを確認する用途など。

</details>

<details>

<summary> <b>リッチテキストエディタに文字入力するコードを生成</b></summary>

![](/images/special-steps/coding-assistant/c28ca84-image.png)

Set text ステップで入力できないリッチテキストエディタ要素へ文字列を入力するためのコードです。

</details>

<details>

<summary> <b>3つのパラメータ値を比較するコードを生成</b></summary>

![](/images/special-steps/coding-assistant/417615e-image_1.png)

テスト内で使用した複数パラメータの値が同一であることを確認します。

</details>
