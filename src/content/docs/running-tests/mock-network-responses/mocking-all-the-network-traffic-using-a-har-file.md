---
title: HAR ファイルを使用したネットワークトラフィックのモック
description: >-
  HAR ファイルを使用してネットワークトラフィックをモックする方法について説明します。Testim で作成する方法とカスタム HAR ファイルを作成する方法の両方を解説します。
category: テスト実行
order: 6014
updated: '2025-11-11'
sourceUrl: 'https://docs.tricentis.com/testim/content/running-tests/mock-network-responses/mocking-all-the-network-traffic-using-a-har-file.htm'
keywords:
  - HAR ファイル
  - ネットワークトラフィック
  - ネットワークモック
  - Chrome デベロッパーツール
  - テスト記録
  - モックレスポンス
  - 記録モード
  - ログ保存
---

モックネットワークレスポンスは HAR ファイルに基づくことができます。HAR ファイルは、Web ブラウザとサイトの間のやり取りをログに記録するための JSON 形式のアーカイブファイルフォーマットです。すべての HTTP 呼び出しとレスポンスがこのファイルに記録されます。各リクエストは HAR ファイル内の順序で処理されます。同じ呼び出しの複数のインスタンスは異なるレスポンスを返すことができます。例えば、最初の呼び出しは X を返し、2 番目の呼び出しは Y を返す場合があります。Testim は、テスト実行中に HAR ファイル内の関連データを自動的に使用します。

HAR ファイルを作成する方法は 2 つあります:

- **オプション 1 - Testim を使用して HAR ファイルを作成** - このオプションでは、テストを作成し（[テストの記録方法](/docs/recording-tests/how-to-record-a-test)を参照）、次に一度実行する必要があります（「Include full network in HAR」設定を使用）。Testim でテストを実行すると、HAR ファイルが作成されます。Testim は、この HAR ファイルを使用して、同じテストの後続の実行でモックネットワークレスポンスを作成します。モックネットワークレスポンスを使用したいテストを再度実行する場合は、Testim によって記録された HAR ファイルを使用することを指定する必要があります。
- **オプション 2 - 独自の HAR を作成** - Chrome 開発者ツールを使用して、独自の HAR ファイルを作成し、URL 経由でアクセス可能な場所に保存できます。モックネットワークレスポンスを使用したいテストを実行する場合は、独自の HAR ファイルとその場所を使用することを指定する必要があります。

:::warning{title="ログインプロセスを含むテスト"}
テストにサーバーへの認証情報の受け渡しを含むログインプロセスが含まれている場合、モックネットワーク上でテストを実行すると、ログインリクエストがタイムアウトするため、正しく動作しない可能性があります。この問題を解決するには、ログインリクエストを送信する際にパススルー認証を有効にする必要があります。これを行うには、ログインリクエストとパススルー認証プロパティを有効にしたマッピングファイルを追加する必要があります。詳細な手順は**[マッピングファイルのアップロード](/docs/running-tests/mock-network-responses/creating-a-mapping-file#マッピングファイルのアップロード)**をご覧ください。
:::

## オプション 1 - Testim を使用して HAR ファイルを作成

**Testim で HAR ファイルを作成するには:**

1. テストを保存した後（[テストの記録方法](/docs/recording-tests/how-to-record-a-test)を参照）、**プロパティ**アイコンをクリックします。**テストプロパティ**ペインが表示されます:

![テストプロパティペインでモックネットワークを構成する画面](/images/mock-network-responses/mocking-all-the-network-traffic-using-a-har-file/ba55bd3-mock1.PNG)

2. **モックネットワーク**プロパティで、矢印をクリックしてメニューオプションを開きます。
3. **新しい HAR を記録**をクリックします。テストがローカルで実行され、HAR ファイルが自動的に作成されます。

![モックネットワークメニューから新しい HAR 記録を選択する操作](/images/mock-network-responses/mocking-all-the-network-traffic-using-a-har-file/1192e87-mock5.png)

4. プロセスが完了したら、**保存**をクリックします。

![HAR 記録完了後に保存ボタンをクリックする画面](/images/mock-network-responses/mocking-all-the-network-traffic-using-a-har-file/4d5a0c7-mock4.PNG)

## オプション 2 - カスタム HAR ファイルを作成

**独自の HAR ファイルを作成するには:**

1. Google Chrome を開きます。
2. Chrome で、テストで使用したい Web ページに移動します。
3. **Chrome メニュー > その他のツール > デベロッパーツール**を選択します。
4. **ネットワーク**タブを選択します。
5. **ネットワーク**タブ内で、**ログを保持**オプションを選択します。

![Chrome デベロッパーツールでログを保持オプションを有効にする画面](/images/mock-network-responses/mocking-all-the-network-traffic-using-a-har-file/99eaa6e-preserve_log.png)

6. **ネットワーク**タブの左上にある赤い円を選択してログを記録します。
7. ページを更新し、Chrome がブラウザとウェブサイトの対話を記録できるようにします。
8. ページが読み込まれたら、**コンソール**タブを選択し、コンソールボックス内で右クリックします。メニューが表示されます。
9. **名前を付けて保存**を選択し、ファイルに名前を付けます。

![コンソールのログ保存メニュー](/images/mock-network-responses/mocking-all-the-network-traffic-using-a-har-file/8624d01-consolesave.png)

10. **ネットワーク**タブに戻り、**名前**列の任意の項目を右クリックします。
11. **「コンテンツ付きで HAR を保存」** を選択します。

![コンテンツ付きで HAR を保存するメニュー](/images/mock-network-responses/mocking-all-the-network-traffic-using-a-har-file/64ef4f1-saveallhar.png)

ログと HAR ファイルが保存されます。

## カスタム HAR ファイルのアップロード

**カスタム HAR ファイルをアップロードするには:**

1. **テストプロパティ**ペインで、**カスタム HAR をアップロード**をクリックします。

![テストプロパティペインでカスタム HAR ファイルをアップロードする設定](/images/mock-network-responses/mocking-all-the-network-traffic-using-a-har-file/fc7237d-mock3.png)

2. 保存したカスタム HAR ファイルを見つけて、**開く**をクリックしてアップロードします。

## HAR ファイルを使用してテストを実行

**HAR ファイルを使用してテストを実行するには:**

1. Testim Visual Editor で、**テストリスト**画面に移動し、新しい HAR を記録したか、カスタム HAR をアップロードしたテストをクリックします。
2. テストエディター画面で、**再生**ボタンの横に**モックネットワーク**アイコンが表示され、モックネットワークが利用可能であることを示します。

![モックネットワークアイコンが表示されたテスト再生ボタン](/images/mock-network-responses/mocking-all-the-network-traffic-using-a-har-file/7a3343e-mock6.png)

3. **再生**ボタンをクリックして、モックネットワークを使用してテストを実行します。
4. **保存**をクリックします。
