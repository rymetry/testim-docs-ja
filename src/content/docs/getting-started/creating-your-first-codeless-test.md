---
title: Web テスト入門（コードレステスト）
description: >-
  Testim の「Space &
  Beyond」デモサイトを使って最初のコードレス Web テストを記録し、検証を追加し、ローカルで実行して結果を確認するまでの流れと押さえておきたいポイントを詳しく解説します。
category: はじめに
order: 2002
updated: '2025-09-19'
sourceUrl: 'https://help.testim.io/docs/creating-your-first-codeless-test'
keywords:
  - はじめに
  - コードレステスト
  - テスト記録
  - 検証
  - テスト結果
  - Web テスト
  - ログインテスト
  - バリデーション
  - テストエディター
  - ローカル実行
---

## ようこそ

サインアップが完了すると、Testim のホーム画面にリダイレクトされます。

![Testim ホーム画面](/images/getting-started/creating-your-first-codeless-test/4b0e58e-gettingstarted1.png)

:::info
**ヒント**: Testim アイコンをブラウザのツールバーでクリックするか、[https://app.testim.io/](https://app.testim.io/) にアクセスすると、いつでもこの画面に戻れます。
:::

さっそく最初のテストを作成してみましょう。

## チュートリアルのユースケース

Testim でテストを作成する際は、対象の Web サイトを開いてテストしたい操作を記録します。各ステップのプロパティは後から編集でき、検証（バリデーション）も追加できます。
このチュートリアルでは Testim のデモサイト「Space & Beyond」を使用し、ログイン手順をテストします。

## テストを記録する

### テストを記録する手順

1. **Create Test** をクリックします。

![Create Test ボタン](/images/getting-started/creating-your-first-codeless-test/8d9ef22-gettingstarted2.png)

   エディターで新しいテストが開きます。ここでテストの記録、検証の追加、ステップの編集を行います。

2. ツールバーの赤い **Record** ボタンをクリックします。

   ![Record ボタン](/images/getting-started/creating-your-first-codeless-test/ce98d0d-gettingstarted3.png)

   既定の **Base URL** にデモサイトの URL「[demo.testim.io](https://demo.testim.io)」が設定されている場合は、新しいブラウザウィンドウが開き、Space & Beyond サイトが表示されます。そのままステップ 4 に進みます。Base URL が未設定の場合は **Start A New Test** ウィンドウが開きます。

![Start A New Test ウィンドウ](/images/getting-started/creating-your-first-codeless-test/d42b2ee-gettingstarted4.png)

3. **Your app URL** フィールドにデモサイトの URL「[demo.testim.io](https://demo.testim.io)」を入力し、**Create Test** をクリックします。
   新しいブラウザウィンドウが開き、Space & Beyond サイトが表示されます。このウィンドウが **Application Under Test (AUT)** です。このウィンドウで行った操作が記録され、Testim のテストとして保存されます。
4. AUT のブラウザで任意のユーザー名とパスワードを使ってログインします。

   ![Space & Beyond のログイン画面](/images/getting-started/creating-your-first-codeless-test/7baa100-login.png)

5. Testim エディターのブラウザに戻ります。
   Space & Beyond サイトで実行した手順がテストウィンドウ上にアクションの一覧として表示されます。各ボックスはテスト手順のステップで、左上のアイコンは実行したアクションの種類（クリック、テキスト入力、スクロールなど）を示します。

![記録されたステップ一覧](/images/getting-started/creating-your-first-codeless-test/bcf55a9-steps.png)

6. **Save** をクリックします。
   **Save Test** ウィンドウが表示されます。

![Save Test ウィンドウ](/images/getting-started/creating-your-first-codeless-test/f78c409-savetest.png)

:::warning{title="自動復旧"}
新しいテストを作成したり既存テストを編集したりしたら、必ず保存してください。保存前にブラウザを閉じてしまっても、テストはブラウザのキャッシュに保存され、作業を再開できる場合があります。詳しくは[保存していないテストを復元する](/docs/recovering-a-test-that-was-not-saved)を参照してください。
:::

7. **Name** フィールドに「Space & Beyond Demo 01」と入力し、**OK** をクリックします。
   テストが保存され、最初のテストが完成しました！

## 検証（バリデーション）の追加

テストを実行すると、フロー内のステップが順番通りに実行されるかは自動で検証されます。ただし、それぞれのステップで期待した結果が得られているかを保証するものではありません。必要に応じて検証ステップを追加し、アプリケーションが期待どおりに動作していることを確認しましょう。
このチュートリアルでは、ユーザーがログインした後にヘッダーバーの **Login** ボタンが「HELLO, JOHN」というテキストに置き換わることを確認する検証を追加します（このデモサイトでは入力したユーザー名に関係なく常に John が表示されます）。

### 検証ステップを追加する手順

1. *Space & Beyond Demo 01* テストのエディター画面で、Click "*LOG IN*" ステップの右側にある最後の「**+**」ボタンにカーソルを合わせます。

   ![Testim の + ボタン](/images/getting-started/creating-your-first-codeless-test/177c8fc-plus.png)

2. **"M"**（Testim の定義済みステップ）をクリックします。
   定義済みステップのメニューが開きます。

   ![定義済みステップのメニュー](/images/getting-started/creating-your-first-codeless-test/03388a3-stepsmenu.png)

3. **Validations** をクリックします。
   Validation セクションが展開されます。

   ![Validations セクション](/images/getting-started/creating-your-first-codeless-test/12dda9f-validations.png)

4. **Validate element text** を選択します。
5. AUT のブラウザで「HELLO, JOHN」のテキストをクリックします。

![HELLO, JOHN テキスト](/images/getting-started/creating-your-first-codeless-test/6b89de8-hellojohn.png)

新しい *Text Validation* ステップがテストに追加されます。

![Text Validation ステップ](/images/getting-started/creating-your-first-codeless-test/d6cad45-hellostep.png)

### 現在のテストバージョンの結果を保存する手順

1. ヘッダーバーの **Save** ボタンをクリックします。

![Save ボタン](/images/getting-started/creating-your-first-codeless-test/84d3a25-savetest1.png)

2. **Message** フィールドにテストバージョンの説明（任意）を入力し、**OK** をクリックします。
   検証を追加したテストが保存されました。次はテストを実行してみましょう。

## テストの実行

### テストをローカルで実行する手順

1. エディター画面でツールバーの **Play** ボタンをクリックします。

![Play ボタン](/images/getting-started/creating-your-first-codeless-test/de7d41f-play.png)

   新しいブラウザが開き、デモサイト上でテストのアクションが実行されます。テスト完了後、ポップアップに成功したかどうかが表示されます。

![テスト完了のポップアップ](/images/getting-started/creating-your-first-codeless-test/f0fa541-testcompleted.png)

## テスト結果の確認

エディター画面ではテスト結果を確認できます。画面上部には全体の実行状況が表示され、各ステップの上にあるカラーアイコンでアクションの成功／失敗がひと目でわかります。

![テスト結果の概要](/images/getting-started/creating-your-first-codeless-test/bdb4507-passed.png)

特定のアクションの詳細結果を確認したい場合は、そのステップをダブルクリックします。該当アクションの結果画面が表示されます。

![ステップ結果の詳細](/images/getting-started/creating-your-first-codeless-test/e9c28f4-stepresult.jpg)

テストが失敗した場合は、失敗の原因に関する詳細情報が表示されます（次の例では、検証で「Goodbye」を期待していたのに対し、実際の値が「Hello」でした）。

![失敗時の結果例](/images/getting-started/creating-your-first-codeless-test/6bb34c8-failed.png)
