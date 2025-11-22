---
title: 'シークレットモードで実行'
description: 'テスト実行セクション「Run in incognito」に関するドキュメント。'
category: 'テスト実行'
order: 10
updated: '2025-11-11'
keywords:
  - testim
  - run-in-incognito
  - running-tests
---

常に新規から開始 - シークレットモードでテストを実行する方法を学習してください

Chrome でシークレットモードでテストを実行することは、初めてテストを実行したかのようにテストを実行したい場合に理想的です。これは、リモート実行時または CLI 経由でテストがどのように実行されるかをシミュレートしたい場合に適しています。

**シークレットモードで実行する場合:**

* Cookie は保存されません (したがって、記録されたアプリケーションは将来のテスト実行に影響されません)
* ログイン状態は保存されません
* 入力されたテキストフィールドのオートコンプリートオプションは保存されません。

## Testim Chrome 拡張機能がシークレットモードで実行することを許可する

Chrome ブラウザのシークレットモードでテストを実行する前に、Testim 拡張機能がシークレットモードで実行することを許可する必要があります。

:fa-arrow-right: **Testim Chrome 拡張機能がシークレットモードで実行することを許可するには:**

1. Chrome ブラウザで、**chrome://extensions** URL に移動します。

![1242](/images/running-tests/run-in-incognito/c469394-File1485182199573.png)

2. **Testim Editor** 拡張機能を見つけて、**詳細** ボタンをクリックします。

![](/images/running-tests/run-in-incognito/32e8712-testim-extension-details.jpg)

3. **シークレットで許可** 設定を **オン** に切り替えます。

![694](/images/running-tests/run-in-incognito/3cb1da7-testim-extension-allow-incognito.jpg)

これでシークレットモードでテストを実行する準備ができました。

## シークレットモードでテストを実行する方法

Chrome ブラウザのシークレットモードでローカルテストまたはリモートテストを実行できます。

:fa-arrow-right: **シークレットモードでテストを実行するには:**

1. **テストリスト > テスト** に移動します。

2. テストを開き、**実行** ボタンの横にある **オプション** 矢印をクリックします。

![322](/images/running-tests/run-in-incognito/cbf521b-run-options.jpg)

3. **シークレットモードで実行** を選択します。

![305](/images/running-tests/run-in-incognito/81ebcd1-check-run-in-incognito.jpg)

**シークレット** アイコンは、各実行オプションの横に表示されて、シークレットモードで実行していることを示します。

![278](/images/running-tests/run-in-incognito/6a4f471-incognito-icons.jpg)

4. テストを実行する方法を選択してください。

   * **ローカルで実行** - 新しいブラウザウィンドウが開き、テスト内のすべてのステップを実行します。
   * **ローカルでステップごとに実行** - 新しいブラウザウィンドウが開き、テストを 1 ステップずつ実行します。
   * **同じパラメータでローカルで再実行** - 新しいブラウザウィンドウが開き、前回のテストと同じパラメータでテスト内のすべてのステップを実行します。
   * **グリッドで実行** - テストは Selenium グリッド上でリモートで実行されます。

これですべて準備ができたので、シークレットモードでテストを実行し始めることができます。
