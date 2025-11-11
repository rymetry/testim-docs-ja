# 翻訳タスク (why-did-my-test-fail)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

Understand error messages, why they occur, and how to fix them.

After running a test, you may find that the test fails and Testim displays an error message with some details about the failure. In general, tests fail for two main reasons:

- A defect was identified in the tested application and the test did not return the expected results.
- There was a flaw in the way the test was created.

Testim identifies several different failure types:

1. **[Element not visible](#1-element-not-visible)**: The element exists on the page but is not visible.
2. **[Element not found](#2-element-not-found)**: Testim couldn't detect the element on the page.
3. **[Tab not found](#3-tab-not-found)**: Testim could not find the correct tab for the step to act on.
4. **[Frame not found](#4-frame-not-found)**: Testim could not find the correct frame for the step to act on.
5. **[JavaScript Error](#5-javascript-error)**: An error occurred while evaluating a JavaScript step or expression.
6. **[Could not get browser](#6-could-not-get-browser)**: There is no browser available in the grid, all the browsers in the grid are in use.
7. **[Browser type is not supported](#7-browser-type-is-not-supported)**: The browser you requested to run on is not supported on your grid or the mode does not match the browser.
8. **[Page is not available](#8-page-is-not-available)**: The application is not available from the location from which it is running.
9. **[Failed to set text](#9-failed-to-set-text)**: Setting text in the input text resulted in an empty field.
10. **[Failed to click](#10-failed-to-click)**: The click step passed, however, the click wasn't recognized by the app being tested.
11. **[Concurrency limit reached](#11-concurrency-limit-reached)**: Too many tests were run concurrently.
12. **[Test Timed Out](#12-test-is-too-long-time-out)**: The test took too long to run.
13. **[API Step Failed](#13-api-step-failed)**: An API step did not provide the expected response.

Testim identifies several different warning types:

1. **[Could not resize to view-port size](doc:why-did-my-test-fail#1-could-not-resize-to-view-port-size)** - A warning appears indicating the inability to resize to the required viewport size.

## Test Failure Types

When a test fails, Testim will identify which step of the test failed and display an error message related to the type of failure.

### 1. Element not visible

This error occurs when the target element exists on the page but is not visible.

**Common Causes**:

- The target element is currently not in the viewport.
- The target element visibility is hidden or set to be: "display: none".
- The size (height or width) of one element in your test equals to 0.
- There is an overlay with a high z-index which is placed above the element.
- The opacity of an object is set to 0.

\***\*What can I do?\*\***

- Look at the side-by-side screenshots to determine if the element was visible in the test.
- Update CSS in your application to ensure the element is not hidden, has correct opacity, and has the expected the size and location.
- Check if the resolution of the recording is the same as the computer running the test. If not, adjust the resolution on the computer running the test to match the original recording.
- If the element does not appear in the viewport, you may need to [add a scroll step](/docs/handling-ui-actions/scroll)  to reach it.
- Sometimes elements only become visible when the mouse hovers over another element (e.g. a drop-down menu). As hover steps are not recorded automatically, you may need to record one to make your element visible. See [Hover Step](/docs/handling-ui-actions/hover-step) for more details on how to do this.
- Turn off the "element must be visible" checkbox in the step's properties. Sometimes you will find that the visibility validation is not required for your business logic, in which case you can turn it off. If there are overlays in the system, it can be a quick solution. See [Editing Target Element Properties](/docs/steps-editing-tests/editing-target-element-properties) for more details.
- Check the failed step DOM: When a step fails, Testim saves a complete DOM snapshot, so you can later debug. For more details, see [Debug by seeing the failed step DOM](https://help.testim.io/docs/debug-console-errors-access-dom#debug-by-seeing-the-failed-step-dom).

### 2. Element not Found

This error occurs when Testim couldn't detect the element on the page.

**Common Causes:**

- The element has been removed from the page.
- The element name or ID has been changed.
- The previous steps passed but the test did not progress to the screen where the target element was expected. An example of this is when the test is expecting a username and password entry to login, but the test’s recorded login information is incorrect or has changed.
- The page didn’t finish loading or took too long to load.

**What can I do?**

- Compare the side-by-side screenshots to determine if the element was visible in the test.
- View the screenshot progression to determine if the previous step failed to navigate to the page.
- Ensure all form submission information is correct. See [Parameters](/docs/parameters/parameters) for more info.
- If the page didn't finish loading or has a delay in loading, [add a wait step](/docs/advanced-features/wait-for) to force Testim to wait for the target element to be visible.
- If you can see the element but it is not recognized, try [Improving the target element](doc:editing-target-element-properties#improving-the-target-element).
- Check the failed step DOM: When a step fails, Testim saves a complete DOM snapshot, so you can later debug. For more details, see [Debug by seeing the failed step DOM](https://help.testim.io/docs/debug-console-errors-access-dom#debug-by-seeing-the-failed-step-dom).

### 3. Tab not Found

This error occurs when Testim could not find the correct tab for the step to act on.

**Common Causes:**

- Test opened a new browser window instead of a new tab.
- Opening of new tab was blocked by pop-up blocker.

**What can I do?**

- When running the test, if you see a red warning near your browser's navigation bar, click it and allow pop-ups for that domain.
- Update your browser's advanced settings and pop-up settings to always allow new browser tabs and windows for that domain.

### 4. Frame not Found

This error occurs when Testim could not find the correct frame for the step to act on.

**Common Causes:**

- Frame did not load.
- Expected iframe no longer exists.

**What can I do?**

- Compare the side-by-side screenshots to determine if the frame was visible in the test.
- Inspect the [DOM](/docs/results/debug-console-errors-access-dom) to validate the expected frame was loaded.
- If target element is no longer in an iframe, [reassign the target element](doc:editing-target-element-properties#reassigningimproving-the-target-element) for the failed test step.

### 5. JavaScript Error

This error occurs when JavaScript step or expression is not correctly evaluated.

**Common Causes:**

- “Syntax error” - Incorrect [JavaScript syntax](https://www.w3schools.com/js/js_syntax.asp). The error can be due to code in a custom step or code in a JavaScript parameter.
- "Assertion failed" - A custom validation step returned false.

**What can I do?**

- Review the JavaScript code in the [custom step/action](doc:custom-code#adding-an-add-custom-validation-step-or-an-add-custom-action-step) or [JS Params](/docs/parameters/parameters) of a standard step.
- If the assertion failed, replace this message with a more informative error. View [Add Custom Validations and Actions](/docs/validations/custom-code) for more details.

### 6. Could not get Browser

This error occurs when the expected browser was not available in the grid when running the test.

**Common Causes:**

- No browser is available in the grid
- Al browsers in the grid are in use.
- Browser used in the text is not available in your grid.

**What can I do?**

- Check if your grid contains the browser you tried to run on.
- If you are using the [parallel parameter in the CLI](/docs/parallel), ensure you are not running tests in parallel that use all available browsers on your grid.
- Add more browsers to your grid.
- If all tests fail with this error, there might be a problem with the grid settings. Contact your grid provider for additional help.

See [Grid Management](/docs/grid-management/grid-management) for details on your current grid configuration.

### 7. Browser Type is not Supported

This error occurs when a test is run on an unsupported browser.

**Common Causes:**

- The test was run on a browser not supported by your grid.
- The test was run in a mode that does not match the browser.

**What can I do?**

- Make sure the browser exists on your grid. If it doesn't, you can contact your grid provider for additional help.
- IE, Edge, Firefox and Safari browsers need to [run in selenium](doc:the-command-line-cli#mode-selenium) mode, make sure your CLI contains "--mode selenium".

### 8. Page is not Available

The application is not available from the location from which it is running.

**Common Causes:**

- The base URL is incorrect.
- Application is not available from the grid.

**What can I do?**

- Confirm the [Base URL](/docs/running-tests/base-url) for the test is correct.
- If you’re running on a remote grid, ensure your tested environment is accessible from the grid:
  - **Internal server/localhost:** Contact us to enable a [tunnel](https://help.testim.io/docs/dedicated-run-tunnel).
  - **Public environment with restrictions (VPN/Geolocation):** whitelist your custom/third-party grid’s IPs, or for Testim Grid users, whitelist [Testim Grid IPs](https://help.testim.io/docs/testim-grid-ips).

### 9. Failed to Set Text

This error occurs when a Set Text step resulted in an empty field.

**Common Causes:**

- Target element could not be found.
- Input field does not accept the format of the text assigned to the step. For example, the step is trying to input an email address into a form field that only allows alpha-numeric characters.

**What can I do?**

- Compare the side-by-side screenshots to confirm the target input field is present on the page.
- Confirm the target element allows the expected input.
- Update the Set Text step properties to allow “Native Events.”

### 10. Failed to Click

This error occurs when a Click Step passed but the click wasn't actually executed.

**Common Causes:**

- Testim click event not recognized by the application.
- Page was not fully loaded while the click step was already executed (timing issue).

**What can I do?**

- Run the test manually to confirm the target element can be clicked.
- Add a short ["sleep step"](https://help.testim.io/docs/wait-for#sleep-web) or ["wait for step"](https://help.testim.io/docs/wait-for) before the "click step" to ensure the page is fully loaded and ready for the click/set text event to be triggered.
- Update the Set Text/click step properties to allow/remove “Native Events”.

### 11. Concurrency Limit Reached

This occurs when too many tests are running concurrently and the grid does not support all running tests.

**Common Causes:**

- Your grid(s) do not support the number of concurrent tests you are running.

**What can I do?**

- Increase the number of grids available for testing (See [Grid management](/docs/grid-management/grid-management)).
- Reduce the number of tests running in parallel.

### 12. Test is Too Long (Time Out)

If a test takes too long to complete (default of 10 minutes), the test will timeout and result in a failure.

**Common Causes:**

- Test contains too many steps.

**What can I do?**

- Reduce the number of steps in your test.
- Override the default test timeout (10 minutes) as needed: [https://help.testim.io/docs/the-command-line-cli#test-timeout](https://help.testim.io/docs/the-command-line-cli#test-timeout)

### 13. API Step Failed

If an API step fails, the incorrect results of the API call may prevent the test from completing successfully.

**Common Causes:**

- API endpoint URL is incorrect.
- API response did not provide expected results.
- The step failed due to API response status code 0 (CORS)

**What can I do?**

- Check the endpoint URL manually.
- Run additional code on the API call and display a validation error to help identify the issue. (see [API testing](/docs/advanced-features/api-testing))
- Review [API Parameters](doc:api-testing#using-parameters) are correct.
- If the step failed due to status code 0 (CORS), you should deselect the "Send via webpage" checkbox. This will send the API call **outside** the browser context, thereby bypassing the CORS restrictions.  

## Test Warning Types

### 1. Could not resize to view-port size

A warning may appear in the initial step of the test during test initialization, indicating the inability to resize to the required viewport size.

> 📘
>
> Testim Grid machines support up to 4K resolution, so a resolution of 2560 x 1291 (MacBook Pro resolution) should work without any issues. If the assigned resolution for the test is not supported by the machine, it will fit to the nearest resolution and show a warning in the Setup step.

**Common Causes:**\
The monitor on which the test is executed has a maximum resolution that is smaller than the requested resolution in the test configuration, thus it cannot resize to the requested size due to screen size limitations.\
**What can I do?**

- Run the test with a larger monitor that fits the requested screen size
- If it doesn't affect the test objective, modify the configuration to fit.

## Common Troubleshooting Steps

There are four main troubleshooting steps you can take to help identify the cause of a test failure:

- Compare screenshots: by comparing the screenshots of the original test that passed and the most recent test that failed, you can identify changes in the UI that might have caused the failure. For more details see [Compare Side-by-Side Screenshots](/docs/results/compare-side-by-side-screenshots)
- Check the failed step DOM: When a step fails, Testim saves a complete DOM snapshot, so you can later debug. For more details, see [Debug by seeing the failed step DOM](https://help.testim.io/docs/debug-console-errors-access-dom#debug-by-seeing-the-failed-step-dom).
- Console Log: displays error messages and other console level information such as warnings and info. For more details, see [Console Logs](/docs/results/network-logs-copy)
- Network Log: tracks network connections and when resources are being downloaded or uploaded. This log is used when you need to make sure that resources are being transferred as expected. For more details, see [Network Logs](/docs/results/network-logs)
