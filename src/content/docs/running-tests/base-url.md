---
title: 'ベース URL'
description: 'テスト実行セクション「Base URL」に関するドキュメント。'
category: 'テスト実行'
order: 4
updated: '2025-11-11'
keywords:
  - testim
  - base-url
  - running-tests
---
異なるベース URL を使用して、さまざまな環境でテストを実行する方法を学習してください

同じテストを異なる URL で実行する方法を考えたことはありますか？\
テスト、ステージング、本番環境など、さまざまな環境で同じスイートを実行したいけれど、最善の方法がわからなかったことはありますか？\
ここはまさにそのための場所です。

## ベース URL とは？

Testim のベース URL は、テストが開始されるウェブサイトの最初のページです。通常、これはウェブサイトアドレスのルートで、**ホスト**という名前付けにより、通常はウェブサイトのホームページを指します。例えば、[http://demo.testim.io](http://demo.testim.io) や [http://www.google.com](http://www.google.com) です。ベース URL はテストの最初のステップである **セットアップステップ** で定義されます。テスト内の追加ステップには、最初のページ/ホームページから同じウェブサイト内のページへのリンククリックが含まれる場合があります。これらのページの URL には、同じベース URL の後に **相対パス** が含まれます。例えば、[http://demo.testim.io/signup](http://demo.testim.io/signup) です。

![](/images/running-tests/base-url/b1cff8e-baseurl.jpg)

## テスト実行時にベース URL をオーバーライドする

通常、開発/テスト環境でテストを記録してから、他の環境でもテストを実行したいと考えます。これは、テスト実行中にベース URL とすべての相対 URL（リンククリック後）が変更されるべきことを意味します。以下の方法を使用してリモート実行を実行する場合、設定の一部として異なるベース URL を指定できます。

Test Editor を通じてテストを実行する場合は、「Run on a grid」セクションで指定できます。

![](/images/running-tests/base-url/3bcd12f-runongrid.jpg)

さらに、テスト実行時に異なるベース URL を送信するために使用できるコンポーネントの一覧を次に示します：

* [CLI](/docs/running-tests/the-command-line-cli)
* [スケジューラー](/docs/running-tests/scheduler)
* [構成ファイル](/docs/configuration-file/configuration-file-run-hooks)
* [テストプラン](/docs/test-management/test-plans)

テスト実行中に別のベース URL でベース URL がオーバーライドされると、オーバーライドするベース URL が上部に表示されます（下の画像を参照）。このURL は「セットアップステップ」に表示されるものと異なることに注意してください。

![](/images/running-tests/base-url/2907735-fb0b21d-base-url-setup.jpg)

### セットアップステップでベース URL をオーバーライドする

4 つの状況があります：

* **元のベース URL にパスが含まれておらず、オーバーライド URL にパスが含まれている場合** - この場合、新しいベース URL は元のベース URL を完全にオーバーライドします。
* **元のベース URL にパスが含まれておらず、オーバーライド URL にもパスが含まれていない場合** - この場合、新しいベース URL は元のベース URL を完全にオーバーライドします。
* **元のベース URL にパスが含まれており、オーバーライド URL にパスが含まれていない場合** - この場合、テスト実行でのベース URL は、**新しいベース URL + 元のパス** の組み合わせになります。例えば、元のベース URL が [http://staging.com/login](http://staging.com/login) の場合、テスト実行時にベース URL を [http://preprod.com](http://preprod.com) でオーバーライドすると、新しいベース URL は URL のホスト部分だけをオーバーライドします - [http://preprod.com/login](http://preprod.com/login)。
* **元のベース URL にパスが含まれており、オーバーライド URL にもパスが含まれている場合** - この場合、新しいベース URL は元のベース URL を完全にオーバーライドします。

### ナビゲーションステップでベース URL をオーバーライドする

テストにナビゲーションステップも含まれており、**ナビゲーションステップの URL がセットアップステップのホストと同じ** ホストを持っている場合（下の画像を参照）。その場合、Testim は **オリジナルナビゲーションステップのホスト部分のみを置き換え** ます。これは、オーバーライドするベース URL に異なるパスが含まれていても、新しいオーバーライドするベース URL のホストです。例：

* セットアップステップ - [https://demo.testim.io](https://demo.testim.io)
* ナビゲーションステップ - [https://demo.testim.io/checkout](https://demo.testim.io/checkout)
* オーバーライドベース URL - [https://www.google.com/doodles](https://www.google.com/doodles)
* 結果のナビゲーションステップ - [https://www.google.com/checkout](https://www.google.com/checkout)

![](/images/running-tests/base-url/6e073c9-image.png)

> 📘 ナビゲーションステップの URL がパラメータの場合
>
> ナビゲーションステップの URL がハードコードされていないが、むしろパラメータである場合（例：`url`=`<https://demo.testim.io/checkout>`）、およびホスト（demo.testim.io）がセットアップステップの元のホストと一致する場合、同じ動作が適用されます。

## ベース URL 既製パラメータの使用

ベース URL は、Testim の他のパラメータとは異なり、パラメータとして定義する必要がない既製パラメータでもあります。むしろ、すぐに使用できます。パラメータは - `BASE_URL` と呼ばれます。パラメータは、テスト実行のベース URL の値が設定され、これは元のベース URL またはオーバーライド値である場合があります。

ベース URL パラメータは、テスト実行に提供されたデータに基づいて自動的に変更できるデータドリブンテストの動的ベース URL として使用できます。例えば、様々な異なるウェブサイト全体で同じテストを実行したい場合。この場合、ベース URL パラメータを使用して動的 URL をテスト実行に入力します。

データドリブンテストの詳細については、[データドリブンテスト](/docs/data-driven-testing/data-driven-testing) を参照してください。

> 📘
>
> ベース URL パラメータはパラメータ使用がサポートされている任意の場所で使用できます。詳細については、[パラメータ](/docs/parameters/parameters) を参照してください。

### カスタムアクション/検証ステップでベース URL パラメータを使用する

すべてのカスタムアクション/検証では、"BASE\_URL" パラメータを使用してテスト実行のベース URL 値を使用できます。

 **カスタムアクションステップにベース URL パラメータを追加するには：**

1. 新しい **カスタムアクションステップ** を追加する場所で **+** または **矢印** アイコンにマウスをホバーし、**Testim 定義済みステップ** ボタンをクリックします。\
   ![](/images/running-tests/base-url/45c6324-2023-06-13_17-20-26.jpg)
2. **アクション** メニューをクリックします。
3. **カスタムアクションを追加** をクリックします。
4. **新しいステップに名前を付ける** フィールドで、このステップに（意味のある）名前を入力します。\
   ![](/images/running-tests/base-url/e352510-2023-06-13_17-23-03.jpg)
5. **ステップを作成** をクリックします。\
   関数エディタが開き、**プロパティ** パネルが右側に開きます。
6. 関数エディタで、ベース URL パラメータを使用して関数を入力します。次の例では、パラメータを使用してコンソールログに値を出力します：

```javascript
console.log("Base URL:" + BASE_URL)
```

テストを実行した後、ベース URL パラメータ値がログに表示されます：

![](/images/running-tests/base-url/09475a3-2023-06-13_17-28-39.jpg)

### ナビゲーションステップでベース URL パラメータを使用する

ベース URL をナビゲーションステップで使用して、実行のベース URL の後に指定されたパスを含む URL に動的に移動できます。

:fa-arrow-right: **ナビゲーションステップにベース URL パラメータを追加するには：**

1. 新しいナビゲーションステップを追加する場所で **+** または **矢印** アイコンにマウスをホバーし、**Testim 定義済みステップ** ボタンをクリックします。

![](/images/running-tests/base-url/0fa605c-predefined.jpg "predefined.jpg")

2. **ナビゲーションアクションを追加** を検索してクリックします。

![](/images/running-tests/base-url/10e28bf-nav-step.jpg "nav-step.jpg")

3. **BASE\_URL** パラメータを使用して URL を入力し、その後に残りの URL パスを入力します。

![](/images/running-tests/base-url/0017136-nav-url.jpg "nav-url.jpg")

> 📘
>
> URL の前後にシングルクォートマークが追加されます（例：'BASE\_URL + \'/Extension\''）。これらのシングルクォートマークを削除してください（例：BASE\_URL + \'/Extension\'）

Testim は、動的 URL を含むナビゲーションステップを保存します。

![](/images/running-tests/base-url/d14049f-base-url.jpg "base-url.jpg")

テストが実行されると、ナビゲーションステップは、テスト実行のベース URL の後に指定されたパスを含む URL に移動します。
