---
title: BrowserStack Integration
description: >-
  Testim で BrowserStack Grid を追加し、CLI、CI、Scheduler、Test Plan、Test
  Editor からテストを実行する方法を説明します。
category: 統合
order: 12027
updated: '2025-09-22'
sourceUrl: 'https://docs.tricentis.com/testim/content/integrations/grid-management/browserstack-integration-1.htm'
keywords:
  - BrowserStack
  - Grid
  - CLI
  - Scheduler
  - Test Plan
---

この記事では、Testim 上で BrowserStack を設定する方法と、テストを実行する方法を説明します。

## BrowserStack Grid を追加する

**BrowserStack Grid を追加するには:**

1. [グリッドの追加](/docs/integrations/grid-management#adding-a-grid) の手順に従い、**Grid Type** で **Browserstack** を選択します。
2. **Next** をクリックします。
3. 次のフィールドを入力します。

- **Name**: 実行時に使用する Grid 名
- **Host**: BrowserStack の host name
- **Port**: BrowserStack の port
- **Username**: BrowserStack の user name
- **Password/access key**: 接続に使用する BrowserStack access key または password

![BrowserStack Grid の接続情報を設定する画面](/images/grid-management/browserstack-integration-1/be4fb2b-Jul-24-2021_08-13-41.gif)

## Grid で実行する方法

次のいずれかの方法で、テストをリモート実行できます。

[CLI](/docs/running-tests/the-command-line-cli) / [CI](/docs/integrations/integrate-testim-to-your-ci)

Grid 名を指定して `--grid` パラメーターを追加します。

[Scheduler](/docs/running-tests/scheduler)

**Grid** フィールドで、どの Grid 上でテストを実行するかを選択します。

[Test Plan](/docs/test-management/test-plans)

**Grid** フィールドで、どの Grid 上でテストを実行するかを選択します。

### エディターから実行する

Test Editor から直接 Grid 上でテストを実行できます。

- **Run** ボタンの横にある options arrow をクリックします。
- **Run on a grid** をクリックします。

その実行で構成 / Grid / ベース URL を変更したい場合は **Edit** をクリックします。

![Test Editor から BrowserStack Grid を選んで実行する画面](/images/grid-management/browserstack-integration-1/0ca9bb7-Jul-21-2021_13-11-22.gif)

テスト実行に追加オプションを渡したい場合は、[SauceLabs と BrowserStack の CLI 用テスト capabilities](/docs/integrations/grid-management/saucelabs-browserstack-options) を参照してください。

:::info
`--grid` パラメーターは、旧来の host / port パラメーターを置き換えます。
:::
