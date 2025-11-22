---
title: 'CLI設定'
description: 'コマンドラインインターフェース(CLI)を使用してテストを実行するための基本コードの生成方法について説明します。CI統合とローカルシェルの両方をサポートします。'
category: 'cli-api'
order: 1
updated: '2025-09-18'
sourceUrl: 'https://help.testim.io/docs/cli-settings'
keywords:
  - CLI
  - CLI設定
  - CI統合
  - ローカルシェル
  - コード生成
  - Grid設定
---

**Settings > CLI** タブでは、コマンドラインインターフェース(CLI)を使用してテストを実行するために必要な基本コードを生成できます。CLIを使用してテストを実行する方法は2つあります:

- 継続的インテグレーション(CI)プラットフォームとテストを統合できます。以下の[CI統合](/docs/cli-settings#section-ci-integration)を参照してください。
- ローカルシェルを使用できます。以下の[ローカルシェル](/docs/cli-settings#section-local-shell)を参照してください。

CLIの使用方法と利用可能なパラメータの詳細については、[コマンドラインインターフェース(CLI)](/docs/the-command-line-cli)を参照してください。CIとの統合の詳細については、[CI統合](/docs/integrate-testim-to-your-ci)を参照してください。

> 📘 CLIコマンドがブロックされている場合、現在のプランではサポートされていません。有効化する方法については[お問い合わせ](https://www.testim.io/root-cause/contact-us/)ください。

## CI統合

TestimのCLIを使用して、テストをCIと統合できます。Testimは、シンプルなシェルコマンドを実行できる主要なCIすべてをサポートしています。

:fa-arrow-right: **CIのコードを生成するには:**

1. **Settings > CLI** ページで、**CI** をクリックします。

![CI用コードを生成するダイアログ](/images/cli-api/cli-settings/a2b3e5f-Testim_368a.png)

2. **CI platform** セクションで、ドロップダウンオプションから使用するCIプラットフォームを選択します。

![CIプラットフォームの選択ドロップダウン](/images/cli-api/cli-settings/5f37f1d-Testim_369_r.png)

> 📘 または、メニュー上部の検索ボックスを使用してプラットフォームを検索することもできます。

3. グリッドを編集または追加する必要がある場合は、**Manage grids** をクリックします。グリッドの詳細については、[グリッド管理](/docs/grid-management)を参照してください。

![管理グリッド画面へのリンクと説明テキスト](/images/cli-api/cli-settings/e1fb3e2-Testim_368b.png)

4. **Grid** セクションで、ドロップダウンオプションから使用するグリッドを選択します。

![グリッドの選択ドロップダウンと説明テキスト](/images/cli-api/cli-settings/dc7acb1-Testim_370_r.png)

> 📘 または、メニュー上部の検索ボックスを使用してグリッドを検索することもできます。

上記の設定に基づいて、CI用の基本コード(トークンとプロジェクトIDを含む)と、CI固有の手順へのリンクが生成されます。\
5\. **Copy** をクリックして、CIで使用するためのコードをクリップボードにコピーします。

![CI用コードとトークンを含む生成結果](/images/cli-api/cli-settings/7ebd207-Testim_371a.png)

6. **doc** リンクをクリックすると、選択したCIの統合手順が新しいタブで開きます。

![CI統合手順ドキュメントへのリンクが表示されたセクション](/images/cli-api/cli-settings/0cdade3-Testim_371b.png)

## ローカルシェル

ローカルシェルを使用して、CLIでテストを実行できます。CLIの実行方法と利用可能なパラメータの詳細については、[コマンドラインインターフェース(CLI)](/docs/the-command-line-cli)を参照してください。

:fa-arrow-right: **シェルで使用するコードを生成するには:**

1. **Settings > CLI** ページで、**Local** をクリックします。

![Localタブでローカルシェルコードを生成する画面](/images/cli-api/cli-settings/6f0fa29-Testim_368c.png)

トークンとプロジェクトIDを含む基本コードが生成されます。\
2\. **Copy** をクリックして、シェルで使用するためのコードをクリップボードにコピーします。

![ローカル用コードをコピーするためのCopyボタンとテキスト](/images/cli-api/cli-settings/9c559db-Testim_372a.png)
