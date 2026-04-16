---
title: Custom Grid
description: >-
  Testim で独自の Selenium Grid を設定し、CLI、CI、Scheduler、Test Plan、
  Test Editor からリモート実行する方法を説明します。
category: 統合
order: 12025
updated: '2025-09-22'
sourceUrl: 'https://docs.tricentis.com/testim/content/integrations/grid-management/custom-grid.htm'
keywords:
  - Custom Grid
  - Selenium Grid
  - Grid
  - CLI
  - Scheduler
  - Test Plan
---

この記事では、Testim 上で独自の Selenium Grid を設定する方法を説明します。

## Custom Grid を追加する

**Custom Grid を追加するには:**

1. [グリッドの追加](/docs/integrations/grid-management#adding-a-grid) の手順に従い、**Grid Type** で **Custom Grid** を選択します。
2. **Next** をクリックします。
3. **Name** フィールドに、利用する Selenium Grid の名前を入力します。
4. **Host** フィールドに、Selenium Grid のホスト名または IP アドレスを入力します。
5. **Port** フィールドに、Selenium Grid のポートを入力します。

:::info
ローカルで実行する場合でも、Testim はテスト結果を表示して保存するためにブラウザーへ接続する必要があります。ネットワークから [https://services.testim.io/](https://services.testim.io/) へアクセスできることを確認してください。
:::

![Custom Grid の Name、Host、Port を設定する画面](/images/grid-management/custom-grid/caabeca-2023-03-19_17-44-02.gif)

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

![Test Editor から Run on a grid を選択している画面](/images/grid-management/custom-grid/0ca9bb7-Jul-21-2021_13-11-22.gif)
