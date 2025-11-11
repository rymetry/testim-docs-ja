# 翻訳タスク (custom-grid)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

Run tests on your own selenium grid

This article will explain how to setup your own Selenium grid on Testim.

## How to add a Custom Grid

:fa-arrow-right: **To add a Custom Grid:**

1. Follow the instructions in the [Adding a grid](https://help.testim.io/docs/grid-management#adding-a-grid) section, while selecting the **Custom Grid** option as the **Grid Type**.
2. Click **Next**.
3. In the **Name** field, enter the name of your selenium grid.
4. In the **Host** field, enter the Selenium grid host name (domain) or IP.
5. In the **Port** field, enter the Selenium grid port.

> 📘 Even when running locally, Testim needs to connect to your browser to show and save test results. Please make sure your network can access [https://services.testim.io/](https://services.testim.io/).

![1280](/images/grid-management/custom-grid/caabeca-2023-03-19_17-44-02.gif "2023-03-19_17-44-02.gif")

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

![928](/images/grid-management/custom-grid/0ca9bb7-Jul-21-2021_13-11-22.gif "Jul-21-2021 13-11-22.gif")
