---
title: Testim Copilot コーディングアシスタント
description: >-
  Testim Copilot コーディングアシスタントで、カスタムアクションやカスタム検証などの JavaScript
  コードを生成・解説・修正し、テスト用スクリプトの作成を効率化する方法を説明します。
category: 高度な編集
order: 5060
updated: '2025-09-22'
sourceUrl: 'https://docs.tricentis.com/testim/content/advanced-editing/coding-assistant.htm'
keywords:
  - コーディングアシスタント
  - Copilot
  - カスタムアクション
  - カスタム検証
  - JavaScript コード生成
  - AI 支援
  - Testim Copilot
  - 特殊ステップ
  - コード修正
  - コード解説
---

Copilot コーディングアシスタントは、以下のステップで用いる JS コードの作成・理解・修正を支援します。

- [Add Custom Action](/docs/custom-code)
- [Add Custom Validation](/docs/custom-code)
- [Add Custom Wait For](/docs/wait-for#custom-wait-for-web)
- [Add Network validation](/docs/add-network-validation)
- [Add CLI Validation](/docs/add-cli-validations-and-actions)
- [Validate Download](/docs/validate-download)
- [Custom Condition](/docs/conditions#configuring-a-custom-condition)

このアシスタントは OpenAI の生成 AI を Testim 用に統合・最適化したものです。チャットのプロンプト入力に加え、スラッシュ（/）で始まるコマンドも利用できます。

**使用手順:**

1. カスタムステップを作成します（上記リンク先の手順を参照）。

2. **Write code with AI** ボタンをクリックします。

   ![Coding Assistant のスクリーンショット](/images/special-steps/coding-assistant/cf577d9-writecodewithai.png)

3. 注意事項を確認し、同意します。

   ![Coding Assistant のスクリーンショット](/images/special-steps/coding-assistant/df40920-image_4.png)

4. コーディングアシスタントとは右側のチャットペインを通じて対話します。チャットペイン下部にプロンプトを入力できます。

   ![Coding Assistant のスクリーンショット](/images/special-steps/coding-assistant/e2c25d1-codingassistant.png)

5. 「/」（スラッシュ）キーを押します。

6. 次のコマンドから選択します:
   1. /generate - プロンプトに基づく JS コードを生成
   2. /explain - エディターで選択中のコードを解説
   3. /fix - エディターで選択中のコードの修正案を提示
   4. /help - ドキュメントを表示

7. 次のいずれかを実行します。
   1. **Generate の場合** – 作成したいコード内容をプロンプトに入力して送信します。生成されたコードはチャットに表示され、次の方法で利用できます。
      - **Paste code at cursor** – カーソル位置にコードを貼り付けます。

      ![Coding Assistant のスクリーンショット](/images/special-steps/coding-assistant/088b93b-pastecodecursor.png)
      - **Copy code** – コードをクリップボードにコピーします。

      ![Coding Assistant のスクリーンショット](/images/special-steps/coding-assistant/5b54849-copy.png)

   2. **Explain の場合** – エディターで対象コードを選択し、次のいずれかを実行します。
      1. フローティングメニューの **Explain code with AI** アイコンをクリックします。

         ![Coding Assistant のスクリーンショット](/images/special-steps/coding-assistant/eaf33c5-explainfloating.png)

      2. プロンプト欄に `/explain` と入力します。\
         解説結果はチャットに表示されます。

         ![Coding Assistant のスクリーンショット](/images/special-steps/coding-assistant/f367d0f-explain.png)

   3. **Fix の場合** – エディターで対象コードを選択し、次のいずれかを実行します。
      1. フローティングウィンドウの **Fix code with AI** アイコンをクリックします。

         ![Coding Assistant のスクリーンショット](/images/special-steps/coding-assistant/9d99571-fixcodefloating.png)

      2. プロンプト欄に `/fix` と入力します。\
         修正案がチャットに表示され、次の方法で利用できます。
         - **Paste code at cursor** – 挿入したい位置にカーソルを置き、**Paste code at cursor** をクリックして生成コードをその位置に挿入します。
         - **Copy code** – **Copy code** ボタンをクリックして生成コードをコピーし、任意の場所に貼り付けます。

## 使用例

利用できるプロンプト例:

<details>
<summary><b>ページ URL を検証するコードを生成</b></summary>

![Coding Assistant のスクリーンショット](/images/special-steps/coding-assistant/485092a-1.png)

ページ URL が指定の正規表現に一致するか検証する [Add Custom Validation](/docs/custom-code) ステップで使用します。
</details>

<details>
<summary><b>チェックボックス選択を検証するコードを生成</b></summary>

![Coding Assistant のスクリーンショット](/images/special-steps/coding-assistant/95f3895-2.png)

特定のチェックボックスが選択済みか判定する [Custom Condition](/docs/conditions#configuring-a-custom-condition) で使用します。クリックステップでチェックボックスを選択する際に、事前に未選択であることを確認する用途などがあります。
</details>

<details>
<summary><b>リッチテキストエディターに文字入力するコードを生成</b></summary>

![Coding Assistant のスクリーンショット](/images/special-steps/coding-assistant/c28ca84-image.png)

Set text ステップで入力できないリッチテキストエディター要素へ文字列を入力するためのコードです。カスタム検証ステップのコードにより、実行時にリッチテキストエディター要素にテキストを入力します。
</details>

<details>
<summary><b>3 つのパラメーター値を比較するコードを生成</b></summary>

![Coding Assistant のスクリーンショット](/images/special-steps/coding-assistant/417615e-image_1.png)

テスト内で使用した複数パラメーターの値が同一であることを確認するカスタム条件やカスタム検証ステップで使用します。
</details>
