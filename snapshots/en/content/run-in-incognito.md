# Run in incognito

Always start from fresh - Learn how to run your tests in Incognito mode

Running tests in Chrome in Incognito mode is ideal if you would like to run a test as if it were the first time it has run. This is great when you want to mimic how the test performs on a remote run or via the CLI.

**When you run in Incognito:**

* No cookies will be stored (thus, the recorded app won't be affected at future test runs)
* Log in states won’t be saved
* Autocomplete options will not be stored for any text fields that were filled.

## Allow Testim Chrome Extension to Run in Incognito Mode

Before you can run tests in Incognito mode in your Chrome browser, you need to allow the Testim extension to run in Incognito mode.

:fa-arrow-right: **To allow the Testim Chrome extension to run in Incognito mode:**

1. In your Chrome browser, navigate to **chrome://extensions** URL.

![1242](https://files.readme.io/c469394-File1485182199573.png "File1485182199573.png")

2. Locate the **Testim Editor** extension and click the **Details** button.

<Image width="smart" src="https://files.readme.io/32e8712-testim-extension-details.jpg" />

3. Toggle the **Allow in Incognito** setting to **On**.

![694](https://files.readme.io/3cb1da7-testim-extension-allow-incognito.jpg "testim-extension-allow-incognito.jpg")

You are now ready to run tests in Incognito mode.

## How to Run Tests in Incognito Mode

You can run local or remote tests in Incognito mode in your Chrome browser.

:fa-arrow-right: **To run a test in Incognito mode:**

1. Navigate to **Test List > Tests**.

2. Open a test and click the **Options** arrow next to the **Run** button.

![322](https://files.readme.io/cbf521b-run-options.jpg "run-options.jpg")

3. Select **Run in Incognito mode**.

![305](https://files.readme.io/81ebcd1-check-run-in-incognito.jpg "check-run-in-incognito.jpg")

The **Incognito** icon is shown next each of the run options to show you are running in Incognito mode.

![278](https://files.readme.io/6a4f471-incognito-icons.jpg "incognito-icons.jpg")

4. Choose how you would like to run the test.

   * **Run locally** – a new browser window opens and runs all steps in the test.
   * **Run locally step by step** – a new browser window opens and runs the test one step at a time.
   * **Rerun locally with same params** – a new browser window opens and runs all steps in the test with the same parameters as the previous test.
   * **Run on a grid** – test runs remotely on a Selenium grid.

Now everything is ready, you can start running your tests Incognito.