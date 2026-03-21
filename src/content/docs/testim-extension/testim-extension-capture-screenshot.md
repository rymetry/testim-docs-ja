---
title: Testim Extension - スクリーンショットをキャプチャ
description: >-
  Testim Extension のスクリーンショットキャプチャ機能で Web ページのスクリーンショットを撮影し、注釈を追加して Jira、Slack、Trello などのバグトラッキングシステムに送信できます。
category: Testim拡張機能
order: 17002
updated: '2025-11-02'
sourceUrl: 'https://help.testim.io/docs/testim-extension-capture-screenshot'
keywords:
  - Testim Extension
  - スクリーンショット
  - キャプチャ
  - 注釈ツール
  - バグトラッキング
  - Jira
  - Slack
  - Trello
  - GitHub
---

Testim Extension のスクリーンショットキャプチャ機能を使用すると、Web ページのスクリーンショットをキャプチャし、注釈（矢印、テキストなど）を追加し、Jira、Slack、Trello、GitHub などのバグトラッキングシステムにバグ/問題として送信できます。

バグトラッカーにバグを送信するには、まず Testim をバグトラッキングシステムに接続する必要があります。詳細については、[バグトラッカー設定](/docs/bug-tracker-settings)を参照してください。

スクリーンショットキャプチャ機能を使用するには、Testim Extension をダウンロードする必要があります。Testim Extension をダウンロードするには、[こちら](https://chrome.google.com/webstore/detail/testim-editor/pebeiooilphfmbohdbhbomomkkoghoia)からインストールしてください。

## スクリーンショットのキャプチャと注釈の追加

**スクリーンショットをキャプチャして注釈を付けるには:**

1. Web ブラウザで、キャプチャしたい Web ページに移動し、**Testim Extension**アイコンをクリックします。
2. Testim にログインしていない場合は、**Login To Start**をクリックします。すでにログインしている場合は、ステップ 5 に進みます。
3. 開いた新しいタブでログインプロセスを完了し、前のタブに戻ります。
4. 再度**Testim Extension**アイコンをクリックします。\
   拡張機能メニューが開きます。

![Testim Extension メニュー](/images/testim-extension/testim-extension-capture-screenshot/9919332-Testim_extension.PNG)

5. **Capture Screenshot**をクリックします。\
   画面が固定され、注釈ツールバーが表示されます。

![注釈ツールバー](/images/testim-extension/testim-extension-capture-screenshot/92260ba-annotation_toolbar.PNG)

6. 以下の注釈ツールを使用してスクリーンショットに注釈を付けます（上から下の順）:

- **矢印を追加** – このオプションを選択してから、クリックしてドラッグして矢印を描画します。これは画面上の何かを指すために使用できます。カラーセレクターを使用して色を変更できます。
- **テキストを追加** – このオプションを選択してから、画面上の任意の場所をクリックしてテキストボックスを追加します。次に、プレースホルダーテキストを置き換えてテキストを入力します。カラーセレクターを使用して色を変更できます。
- **長方形を追加** – このオプションを選択してから、画面上の任意の場所をクリックしてドラッグして長方形を作成します。これは画面上の何かをマークするために使用できます。カラーセレクターを使用して色を変更できます。
- **カラーセレクター** – このオプションを選択して、すべての注釈要素に異なる色を選択します。
- **破棄** – このオプションを選択して、このスクリーンショット/バグレポートを破棄します。

7. この時点で、以下の手順に従ってバグトラッカーにバグを送信できます。

## バグトラッカーへのバグの送信

**注釈付きバグをバグトラッカーに送信するには:**

1. Testim をバグトラッカーに接続していることを確認してください。詳細については、[バグトラッカー設定](/docs/bug-tracker-settings)を参照してください。
2. スクリーンショットに注釈を付けた後、注釈ツールバーで**Publish**をクリックします。

![Publish ボタン](/images/testim-extension/testim-extension-capture-screenshot/a636079-publishbutton.png)

3. 接続したバグトラッカーシステムに応じて、バグ情報を入力するための異なるフォームが表示されます。以下の説明に基づいてフォームに入力し、**Publish**をクリックします。

![バグ情報入力フォーム](/images/testim-extension/testim-extension-capture-screenshot/403ffb7-trelloformwithcallouts.PNG)

フォームには以下の要素が含まれます:

- **バグトラッカーシステムを切り替え** – 歯車アイコンをクリックして、バグトラッキング設定ダイアログを開きます。詳細については、[バグトラッカー設定](/docs/bug-tracker-settings)を参照してください。
- **Testim 自動テスト** – 単一ステップの自動テストが Testim で自動的に作成され、このテストへのリンクが問題/バグレポートに含まれます。クリックして Testim でテストにアクセスします。
- **スクリーンショット** – キャプチャされたスクリーンショットが問題/バグレポートに含まれます。
- **Trello での場所** – 問題/バグが報告される Trello の正確な場所を指定します。
- **問題の詳細** – Summary フィールドで、問題/バグのタイトルを編集します。Description フィールドには、問題/バグの再現方法の詳細が含まれます。編集して詳細を追加できます。
