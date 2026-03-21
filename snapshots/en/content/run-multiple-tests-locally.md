# Run multiple tests locally

Run multiple tests on your local browser rather than in the grid.

You can run multiple tests on your local browser instead of on the grid. Locally you can run tests only on Chrome browser.

:fa-arrow-right: **To run multiple tests:**

1. Go to **Test List > Tests**

2. Select two or more tests in the **Test Library**.

![](https://files.readme.io/be99418-test-library.jpg "test-library.jpg")

> 📘
>
> You can select multiple tests by holding down the CTRL/CMD key and then clicking on each of the desired tests.

3. Right click on your selected tests and click **Play** from the right click menu or click the **Play** icon from the actions menu.

![](https://files.readme.io/3fc7106-run-tests.jpg "run-tests.jpg")

4. Select any of the desired options and then click the **OK** button.

   * **Run in Incognito Mode** - select this option if you would like to run a test as if it was the first time it has run. This is great when you want to mimic how the test performs on a remote run or via the CLI. ([Learn More](https://help.testim.io/docs/run-in-incognito))
   * **Override Base URL** - select this option if you would like to override the current test configurations concerning the base URL. After selecting this option, enter the new Base URL.

![](https://files.readme.io/5b7669c-run-options.jpg "run-options.jpg")

Testim will take control over your mouse and begin running the selected tests in your local browser. Once the tests have completed, you will see the Execution Runs results screen.

> 🚧
>
> Do not use your mouse or computer while the tests are running.

![](https://files.readme.io/eaa0844-execution-runs.jpg "execution-runs.jpg")

## Trace your Team's Local Test Runs in Real Time

Any test that is run locally through the Test List is tracked and can be easily viewed from the Runs tab.

1. Go to **Runs > Executions**.
2. Select the **Time Frame** to filter execution results based on when the tests were run.

![](https://files.readme.io/991886d-runs-timeframe.jpg "runs-timeframe.jpg")

3. Select **Advanced Filters** to filter execution results by specific criteria including:

   * **Status of the execution** - filter execution results by their current status
   * **Browser** - filter execution results by the browser(s) the execution was run on
   * **Label** - filter execution results for tests with specific [Labels](https://help.testim.io/docs/labels).
   * **Plan** - filter execution results for tests within a specific [Test Plan](https://help.testim.io/docs/test-plans).

You will see a list of the tests and their results marked “local-suite” indicating the tests have run locally.

![](https://files.readme.io/b42f121-filtered-execution-runs.jpg "filtered-execution-runs.jpg")

4. Double click one of the **Execution Results** at the bottom to view more details.

![](https://files.readme.io/c36a25b-click-execution-run.jpg "click-execution-run.jpg")