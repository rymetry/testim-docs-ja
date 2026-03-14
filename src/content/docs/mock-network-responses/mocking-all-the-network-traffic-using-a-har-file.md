---
title: HARファイルを使用したネットワークトラフィックのモック
description: >-
  HARファイルを使用してネットワークトラフィックをモックする方法について説明します。Testimで作成する方法とカスタムHARファイルを作成する方法の両方を解説します。
category: テスト実行
order: 6014
updated: '2025-11-11'
sourceUrl: 'https://help.testim.io/docs/mocking-all-the-network-traffic-using-a-har-file'
keywords:
  - HARファイル
  - ネットワークトラフィック
  - ネットワークモック
  - Chromeデベロッパーツール
  - テスト記録
  - モックレスポンス
  - 記録モード
  - ログ保存
---

モックネットワークレスポンスはHARファイルに基づくことができます。HARファイルは、Webブラウザとサイトの間のやり取りをログに記録するためのJSON形式のアーカイブファイルフォーマットです。すべてのHTTP呼び出しとレスポンスがこのファイルに記録されます。各リクエストはHARファイル内の順序で処理されます。同じ呼び出しの複数のインスタンスは異なるレスポンスを返すことができます。例えば、最初の呼び出しはXを返し、2番目の呼び出しはYを返す場合があります。Testimは、テスト実行中にHARファイル内の関連データを自動的に使用します。

HARファイルを作成する方法は2つあります:

* **オプション1 - Testimを使用してHARファイルを作成** - このオプションでは、テストを作成し（[テストの記録方法](/docs/how-to-record-a-test)を参照）、次に一度実行する必要があります(「Include full network in HAR」設定を使用)。Testimでテストを実行すると、HARファイルが作成されます。Testimは、このHARファイルを使用して、同じテストの後続の実行でモックネットワークレスポンスを作成します。モックネットワークレスポンスを使用したいテストを再度実行する場合は、Testimによって記録されたHARファイルを使用することを指定する必要があります。
* **オプション2 - 独自のHARを作成** - Chrome開発者ツールを使用して、独自のHARファイルを作成し、URL経由でアクセス可能な場所に保存できます。モックネットワークレスポンスを使用したいテストを実行する場合は、独自のHARファイルとその場所を使用することを指定する必要があります。

> 🚧 ログインプロセスを含むテスト
>
> テストにサーバーへの認証情報の受け渡しを含むログインプロセスが含まれている場合、モックネットワーク上でテストを実行すると、ログインリクエストがタイムアウトするため、正しく動作しない可能性があります。この問題を解決するには、ログインリクエストを送信する際にパススルー認証を有効にする必要があります。これを行うには、ログインリクエストとパススルー認証プロパティを有効にしたマッピングファイルを追加する必要があります。詳細な手順は**[マッピングファイルのアップロード](/docs/creating-a-mapping-file#section-uploading-the-mapping-file)**をご覧ください。

## オプション1 - Testimを使用してHARファイルを作成

:fa-arrow-right:**TestimでHARファイルを作成するには:**

1. テストを保存した後([テストの記録方法](/docs/how-to-record-a-test)を参照)、プロパティ(:fa-cog:)アイコンをクリックします。**テストプロパティ**ペインが表示されます:

![テストプロパティペインでモックネットワークを構成する画面](/images/mock-network-responses/mocking-all-the-network-traffic-using-a-har-file/ba55bd3-mock1.PNG)

2. **モックネットワーク**プロパティで、矢印をクリックしてメニューオプションを開きます。
3. **新しいHARを記録**をクリックします。テストがローカルで実行され、HARファイルが自動的に作成されます。

![モックネットワークメニューから新しいHAR記録を選択する操作](/images/mock-network-responses/mocking-all-the-network-traffic-using-a-har-file/1192e87-mock5.png)

4. プロセスが完了したら、**保存**をクリックします。

![HAR記録完了後に保存ボタンをクリックする画面](/images/mock-network-responses/mocking-all-the-network-traffic-using-a-har-file/4d5a0c7-mock4.PNG)

## オプション2 - カスタムHARファイルを作成

:fa-arrow-right:**独自のHARファイルを作成するには:**

1. Google Chromeを開きます。
2. Chromeで、テストで使用したいWebページに移動します。
3. **Chromeメニュー > その他のツール > デベロッパーツール**を選択します。
4. **ネットワーク**タブを選択します。
5. **ネットワーク**タブ内で、**ログを保持**オプションを選択します。

![Chromeデベロッパーツールでログを保持オプションを有効にする画面](/images/mock-network-responses/mocking-all-the-network-traffic-using-a-har-file/99eaa6e-preserve_log.png)

6. **ネットワーク**タブの左上にある赤い円を選択してログを記録します。
7. ページを更新し、Chromeがブラウザとウェブサイトの対話を記録できるようにします。
8. ページが読み込まれたら、**コンソール**タブを選択し、コンソールボックス内で右クリックします。メニューが表示されます。
9. **名前を付けて保存**を選択し、ファイルに名前を付けます。

![コンソールのログ保存メニュー](/images/mock-network-responses/mocking-all-the-network-traffic-using-a-har-file/8624d01-consolesave.png)

10. **ネットワーク**タブに戻り、**名前**列の任意の項目を右クリックします。
11. **「コンテンツ付きでHARを保存」**を選択します。

![コンテンツ付きでHARを保存するメニュー](/images/mock-network-responses/mocking-all-the-network-traffic-using-a-har-file/64ef4f1-saveallhar.png)

ログとHARファイルが保存されます。

## カスタムHARファイルのアップロード

:fa-arrow-right:**カスタムHARファイルをアップロードするには:**

1. **テストプロパティ**ペインで、**カスタムHARをアップロード**をクリックします。

![テストプロパティペインでカスタムHARファイルをアップロードする設定](/images/mock-network-responses/mocking-all-the-network-traffic-using-a-har-file/fc7237d-mock3.png)

2. 保存したカスタムHARファイルを見つけて、**開く**をクリックしてアップロードします。

## HARファイルを使用してテストを実行

:fa-arrow-right:**HARファイルを使用してテストを実行するには:**

1. Testim Visual Editorで、**テストリスト**画面に移動し、新しいHARを記録したか、カスタムHARをアップロードしたテストをクリックします。
2. テストエディタ画面で、**再生**ボタンの横に**モックネットワーク**アイコンが表示され、モックネットワークが利用可能であることを示します。

![モックネットワークアイコンが表示されたテスト再生ボタン](/images/mock-network-responses/mocking-all-the-network-traffic-using-a-har-file/7a3343e-mock6.png)

3. **再生**ボタンをクリックして、モックネットワークを使用してテストを実行します。
4. **保存**をクリックします。
