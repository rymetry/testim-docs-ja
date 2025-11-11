# 翻訳タスク (cli-settings)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

On the **Settings > CLI** tab you can generate the base code you will need to run your tests using the command line interface (CLI). You can run your tests using the CLI in two ways:

- You can integrate your tests with your continuous integration (CI) platform. See [CI Integration](doc:cli-settings#section-ci-integration) below.
- You can use your local shell. See [Local Shell](doc:cli-settings#section-local-shell) below.

For more information on using the CLI and the available parameters, see [Command line interface (CLI)](/docs/running-tests/the-command-line-cli). For more information on integrating with a CI, see [CI integrations](/docs/ci-integrations/integrate-testim-to-your-ci).

> 📘 If the CLI command is blocked, your current plan does not support it. [Contact us](https://www.testim.io/root-cause/contact-us/) to learn how to enable it.

## CI Integration

You can integrate your tests with your CI using Testim’s CLI. Testim supports all the major CIs that can run a simple shell command.

:fa-arrow-right: **To generate the code for your CI:**

1. On the **Settings > CLI** page, click **CI**.

![3829](/images/cli-api/cli-settings/a2b3e5f-Testim_368a.png "Testim 368a.png")

2. In the **CI platform** section, choose your CI’s platform from the dropdown options available.

![300](/images/cli-api/cli-settings/5f37f1d-Testim_369_r.png "Testim 369_r.png")

> 📘 Alternatively, you can use the search box at the top of the menu to search for the platform.

3. If you need to edit or add a grid, click **Manage grids**. For more information on grids, see [Grid management](/docs/grid-management/grid-management).

![3829](/images/cli-api/cli-settings/e1fb3e2-Testim_368b.png "Testim 368b.png")

4. In the **Grid** section, choose your grid from the dropdown options available.

![300](/images/cli-api/cli-settings/dc7acb1-Testim_370_r.png "Testim 370_r.png")

> 📘 Alternatively, you can use the search box at the top of the menu to search for the grid.

The base code for your CI (containing your token and project id) and a link to CI-specific instructions are generated based on your preferences above.\
5\. Click **Copy** to copy the code to your clipboard for use with your CI.

![3839](/images/cli-api/cli-settings/7ebd207-Testim_371a.png "Testim 371a.png")

6. Click the **doc** link to open a new tab with integration instructions for your chosen CI.

![3839](/images/cli-api/cli-settings/0cdade3-Testim_371b.png "Testim 371b.png")

## Local Shell

You can use your local shell to run your tests using the CLI. For more information about running the CLI and the available parameters, see [Command line interface (CLI)](/docs/running-tests/the-command-line-cli).

:fa-arrow-right: **To generate the code to use in your shell:**

1. On the **Settings > CLI** page, click **Local**.

![3829](/images/cli-api/cli-settings/6f0fa29-Testim_368c.png "Testim 368c.png")

The base code containing your token and project id is generated.\
2\. Click **Copy** to copy the code to your clipboard for use in your shell.

![3853](/images/cli-api/cli-settings/9c559db-Testim_372a.png "Testim 372a.png")
