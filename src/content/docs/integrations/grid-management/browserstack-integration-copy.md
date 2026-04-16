---
title: LambdaTest Integration
description: >-
  Testim で LambdaTest Grid を追加し、CLI、CI、Scheduler、Test Plan、Test
  Editor から実行する方法を説明します。
category: 統合
order: 12028
updated: '2025-09-22'
sourceUrl: 'https://docs.tricentis.com/testim/content/integrations/grid-management/browserstack-integration-copy.htm'
keywords:
  - LambdaTest
  - Grid
  - CLI
  - Scheduler
  - Test Plan
---

この記事では、Testim 上で LambdaTest を設定する方法と、テストを実行する方法を説明します。

:::info
LambdaTest integration では、Testim は現在 [selenium testing](https://www.lambdatest.com/support/docs/getting-started-with-lambdatest-automation/) のみをサポートしています。[Hyper Execute](https://www.lambdatest.com/support/docs/getting-started-with-hyperexecute/) を含むそれ以外のオプションはサポートしていません。
:::

## LambdaTest Grid を追加する

**LambdaTest Grid を追加するには:**

1. [Adding a grid](/docs/integrations/grid-management#adding-a-grid) の手順に従い、**Grid Type** で **LambdaTest** を選択します。
2. **Next** をクリックします。
3. 次のフィールドを入力します。

- **Name**: 実行時に使用する Grid 名
- **Host**: LambdaTest の host name（例: `hub.lambdatest.com`）
- **Port**: LambdaTest の port。既定値は `443`
- **Username**: LambdaTest の user name
- **Password/access key**: 接続に使用する LambdaTest access key または password

![LambdaTest Grid の接続情報を設定する画面](/images/grid-management/browserstack-integration-copy/9301458-gridmanagement.gif)

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

![Test Editor から LambdaTest Grid を選んで実行する画面](/images/grid-management/browserstack-integration-copy/2b9a380-lambdagrid.gif)

:::info
`--grid` パラメーターは、旧来の host / port パラメーターを置き換えます。
:::
