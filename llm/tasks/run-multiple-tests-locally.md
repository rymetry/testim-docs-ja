# 翻訳タスク (run-multiple-tests-locally)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

Run multiple tests on your local browser rather than in the grid.

You can run multiple tests on your local browser instead of on the grid. Locally you can run tests only on Chrome browser.

:fa-arrow-right: **To run multiple tests:**

1. Go to **Test List > Tests**

2. Select two or more tests in the **Test Library**.

![](/images/running-tests/run-multiple-tests-locally/be99418-test-library.jpg "test-library.jpg")

> 📘
>
> You can select multiple tests by holding down the CTRL/CMD key and then clicking on each of the desired tests.

3. Right click on your selected tests and click **Play** from the right click menu or click the **Play** icon from the actions menu.

![](/images/running-tests/run-multiple-tests-locally/3fc7106-run-tests.jpg "run-tests.jpg")

4. Select any of the desired options and then click the **OK** button.

   - **Run in Incognito Mode** - select this option if you would like to run a test as if it was the first time it has run. This is great when you want to mimic how the test performs on a remote run or via the CLI. ([Learn More](/docs/running-tests/run-in-incognito))
   - **Override Base URL** - select this option if you would like to override the current test configurations concerning the base URL. After selecting this option, enter the new Base URL.

![](/images/running-tests/run-multiple-tests-locally/5b7669c-run-options.jpg "run-options.jpg")

Testim will take control over your mouse and begin running the selected tests in your local browser. Once the tests have completed, you will see the Execution Runs results screen.

> 🚧
>
> Do not use your mouse or computer while the tests are running.

![](/images/running-tests/run-multiple-tests-locally/eaa0844-execution-runs.jpg "execution-runs.jpg")

## Trace your Team's Local Test Runs in Real Time

Any test that is run locally through the Test List is tracked and can be easily viewed from the Runs tab.

1. Go to **Runs > Executions**.
2. Select the **Time Frame** to filter execution results based on when the tests were run.

![](/images/running-tests/run-multiple-tests-locally/991886d-runs-timeframe.jpg "runs-timeframe.jpg")

3. Select **Advanced Filters** to filter execution results by specific criteria including:

   - **Status of the execution** - filter execution results by their current status
   - **Browser** - filter execution results by the browser(s) the execution was run on
   - **Label** - filter execution results for tests with specific [Labels](/docs/test-management/labels).
   - **Plan** - filter execution results for tests within a specific [Test Plan](/docs/test-management/test-plans).

You will see a list of the tests and their results marked “local-suite” indicating the tests have run locally.

![](/images/running-tests/run-multiple-tests-locally/b42f121-filtered-execution-runs.jpg "filtered-execution-runs.jpg")

4. Double click one of the **Execution Results** at the bottom to view more details.

![](/images/running-tests/run-multiple-tests-locally/c36a25b-click-execution-run.jpg "click-execution-run.jpg")
