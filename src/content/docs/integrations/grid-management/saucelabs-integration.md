---
title: SauceLabs Integration
description: >-
  Testim で SauceLabs Grid を追加し、CLI、CI、Scheduler、Test Plan、Test
  Editor からテストを実行する方法を説明します。
category: 統合
order: 12026
updated: '2025-09-22'
sourceUrl: 'https://docs.tricentis.com/testim/content/integrations/grid-management/saucelabs-integration.htm'
keywords:
  - SauceLabs
  - Grid
  - CLI
  - Scheduler
  - Test Plan
---

この記事では、Testim 上で SauceLabs を設定する方法と、テストを実行する方法を説明します。

## SauceLabs Grid を追加する

**SauceLabs Grid を追加するには:**

1. [Adding a grid](/docs/integrations/grid-management#adding-a-grid) の手順に従い、**Grid Type** で **Saucelabs** を選択します。
2. **Next** をクリックします。
3. 次の field を入力します。

- **Name**: 実行時に使用する Grid 名
- **Saucelabs User**: 接続に使用する SauceLabs key
- **Saucelabs key**: 接続に使用する SauceLabs key
- **Host**: SauceLabs の host name
- **Port**: SauceLabs の port

![SauceLabs Grid の接続情報を設定する画面](/images/grid-management/saucelabs-integration/be4fb2b-Jul-24-2021_08-13-41.gif)

## Grid で実行する方法

次のいずれかの方法で、テストをリモート実行できます。

[CLI](/docs/running-tests/the-command-line-cli) / [CI](/docs/integrations/integrate-testim-to-your-ci)

Grid 名を指定して `--grid` parameter を追加します。

[Scheduler](/docs/running-tests/scheduler)

**Grid** field で、どの Grid 上でテストを実行するかを選択します。

[Test Plan](/docs/test-management/test-plans)

**Grid** field で、どの Grid 上でテストを実行するかを選択します。

### Editor から実行する

Test Editor から直接 Grid 上でテストを実行できます。

- **Run** ボタンの横にある options arrow をクリックします。
- **Run on a grid** をクリックします。

その実行で configuration / Grid / base url を変更したい場合は **Edit** をクリックします。

![Test Editor から SauceLabs Grid を選んで実行する画面](/images/grid-management/saucelabs-integration/0ca9bb7-Jul-21-2021_13-11-22.gif)

テスト実行に追加 option を渡したい場合は、[Test capabilities for SauceLabs & BrowserStack in CLI](/docs/integrations/grid-management/saucelabs-browserstack-options) を参照してください。
