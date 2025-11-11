# 翻訳タスク (browserstack-integration-copy)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

Run tests you create with Testim on LambdaTest

This article will review how to set your LambdaTest on Testim and how to run your tests.

> 📘
>
> Within LambdaTest integration Testim currently only supports the [selenium testing](https://www.lambdatest.com/support/docs/getting-started-with-lambdatest-automation/) option, excluding all other choices, including [Hyper Execute](https://www.lambdatest.com/support/docs/getting-started-with-hyperexecute/).

## How to add a LambdaTest grid

:fa-arrow-right: **To add a LambdaTest grid:**

1. Follow the instructions in the [Adding a grid](https://help.testim.io/docs/grid-management#adding-a-grid) section, while selecting the **LambdaTest** option as the **Grid Type**.
2. Click **Next**.
3. Update the following fields:

- **Name**: The grid name to use at run time.
- **Host**: LambdaTest host name (e.g. hub.lambdatest.com).
- **Port**: LambdaTest port. Default - 443
- **Username**: LambdaTest user name.
- **Password/access key**: LambdaTest access key to connect or password.

![](/images/grid-management/browserstack-integration-copy/9301458-gridmanagement.gif)

## How to run on the grid

You can run your tests remotely using one of the following methods:

[CLI](/docs/running-tests/the-command-line-cli) / [CI](/docs/ci-integrations/integrate-testim-to-your-ci)

Add --grid parameter with the grid name.

[Scheduler](/docs/running-tests/scheduler)

Use Grid field to choose on which grid to run your tests.

[Test Plan](/docs/test-management/test-plans)

Use Grid field to choose on which grid to run your tests.

### From the editor

You can run your test on the grid directly from the test editor.

- Click on the options arrow next to the "**Run**" button
- Click on "**Run on a grid**".

To change the configuration/grid/base url for that run click on "**Edit**".

![](/images/grid-management/browserstack-integration-copy/2b9a380-lambdagrid.gif)

> 📘
>
> Grid parameter replaces the old host and port parameters.
