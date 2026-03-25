---
title: CLI 設定
description: >-
  コマンドラインインターフェース（CLI）を使用してテストを実行するための基本コードの生成方法について説明します。CI 統合とローカルシェルの両方をサポートします。
category: 設定
order: 13001
updated: '2025-09-19'
sourceUrl: 'https://docs.tricentis.com/testim/content/settings/cli-settings.htm'
keywords:
  - CLI
  - CLI 設定
  - CI 統合
  - ローカルシェル
  - コード生成
  - Grid 設定
---

**Settings > CLI** タブでは、コマンドラインインターフェース（CLI）を使用してテストを実行するために必要な基本コードを生成できます。CLI を使用してテストを実行する方法は 2 つあります:

- 継続的インテグレーション（CI）プラットフォームとテストを統合できます。以下の[CI 統合](/docs/cli-settings#ci統合)を参照してください。
- ローカルシェルを使用できます。以下の[ローカルシェル](/docs/cli-settings#ローカルシェル)を参照してください。

CLI の使用方法と利用可能なパラメーターの詳細については、[コマンドラインインターフェース（CLI）](/docs/the-command-line-cli)を参照してください。CI との統合の詳細については、[CI 統合](/docs/integrate-testim-to-your-ci)を参照してください。

:::info
CLI コマンドがブロックされている場合、現在のプランではサポートされていません。有効化する方法については[こちらからお問い合わせください](https://www.testim.io/root-cause/contact-us/)。
:::

## CI 統合

Testim の CLI を使用して、テストを CI と統合できます。Testim は、シンプルなシェルコマンドを実行できるすべての主要な CI プラットフォームをサポートしています。

**CI のコードを生成するには:**

1. **Settings > CLI** ページで、**CI** をクリックします。

![CI 用コードを生成するダイアログ](/images/cli-api/cli-settings/a2b3e5f-Testim_368a.png)

2. **CI platform** セクションで、ドロップダウンオプションから使用する CI プラットフォームを選択します。

![CI プラットフォームの選択ドロップダウン](/images/cli-api/cli-settings/5f37f1d-Testim_369_r.png)

:::info
または、メニュー上部の検索ボックスを使用してプラットフォームを検索することもできます。
:::

3. グリッドを編集または追加する必要がある場合は、**Manage grids** をクリックします。グリッドの詳細については、[グリッド管理](/docs/grid-management)を参照してください。

![管理グリッド画面へのリンクと説明テキスト](/images/cli-api/cli-settings/e1fb3e2-Testim_368b.png)

4. **Grid** セクションで、ドロップダウンオプションから使用するグリッドを選択します。

![グリッドの選択ドロップダウンと説明テキスト](/images/cli-api/cli-settings/dc7acb1-Testim_370_r.png)

:::info
または、メニュー上部の検索ボックスを使用してグリッドを検索することもできます。
:::

上記の設定に基づいて、CI 用の基本コード（トークンとプロジェクト ID を含む）と、CI 固有の手順へのリンクが生成されます。

5. **Copy** をクリックして、CI で使用するためのコードをクリップボードにコピーします。

![CI 用コードとトークンを含む生成結果](/images/cli-api/cli-settings/7ebd207-Testim_371a.png)

6. **doc** リンクをクリックすると、選択した CI の統合手順が新しいタブで開きます。

![CI 統合手順ドキュメントへのリンクが表示されたセクション](/images/cli-api/cli-settings/0cdade3-Testim_371b.png)

## ローカルシェル

ローカルシェルを使用して、CLI でテストを実行できます。CLI の実行方法と利用可能なパラメーターの詳細については、[コマンドラインインターフェース（CLI）](/docs/the-command-line-cli)を参照してください。

**シェルで使用するコードを生成するには:**

1. **Settings > CLI** ページで、**Local** をクリックします。

![Local タブでローカルシェルコードを生成する画面](/images/cli-api/cli-settings/6f0fa29-Testim_368c.png)

トークンとプロジェクト ID を含む基本コードが生成されます。

2. **Copy** をクリックして、シェルで使用するためのコードをクリップボードにコピーします。

![ローカル用コードをコピーするための Copy ボタンとテキスト](/images/cli-api/cli-settings/9c559db-Testim_372a.png)
