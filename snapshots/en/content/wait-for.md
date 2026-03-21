# Wait for

When you just want to wait...

There might be instances where you want to wait for a certain event to occur before taking the next step. It can be a wait to display an element, wait for text display, simply wait for 2 seconds, or for any other reason for which the wait is required.

Testim has a built-in capability to help you wait...

Types of waits we provide:

* Wait for element visible ([web](wait-for#wait-for-element-visible-web) and [mobile](wait-for#wait-for-element-visible-mobile))
* Wait for element not visible ([web](wait-for-element-not-visible-web))
* Wait for element text ([web](wait-for#wait-for-element-text-web) and [mobile](wait-for#wait-for-element-text-mobile))
* Sleep ([web](wait-for#sleep-web) and [mobile](wait-for#sleep-mobile))
* Custom Wait for (JavaScript) ([web](wait-for#custom-wait-for-web))
* Wait for element visualization ([web](wait-for#wait-for-element-visualization-web))
* Wait for Download ([web](wait-for#wait-for-download-web))

## Wait for element visible (Web)

Use wait for element visible to wait for your element to be visible on the page.

:fa-arrow-right: **To add a Wait for Element Visible step:**

1. Navigate to the **Test Editor** for your test.
2. Hover over the **arrow** where you want to insert the new step and click **Testim predefined steps.**

![](https://files.readme.io/25e3a64-predefined.jpg "predefined.jpg")

3. Select the **Wait for element visible** step.

![](https://files.readme.io/3512b00-wait-for-element-visible-step.png "wait-for-element-visible-step.png")

4. Select the target element in your application.

![](https://files.readme.io/e55a7b4-wait-for-element-visible-selection.png "wait-for-element-visible-selection.png")

> 📘 Note:
>
> If you get the message "**To choose an element Open base URL or Run test to relevant step**" this means that you must first open the application in the base URL or run the test until the relevant step, before adding the Wait for Element Visible step.

## Wait for element visible (Mobile)

Use wait for element visible to wait for your element to be visible on the page.

:fa-arrow-right: **To add a Wait for Element Visible step:**

1. Navigate to the **Test Editor** for your test.
2. Hover over the **arrow** where you want to insert the new step and click **Testim predefined steps.**

![](https://files.readme.io/2737b17-mobile-predefined-step.png "mobile-predefined-step.png")

3. Select the **Wait for element visible** step.

![](https://files.readme.io/1403f9a-mobile-element-visible.png "mobile-element-visible.png")

4. Select the **target element**in your application AUT.

![](https://files.readme.io/f85f8ff-select-target.png "select-target.png")

> 📘 Note:
>
> If you get the message "To choose an element Open App or Run test to relevant step" this means that you must first open the application or run the test until the relevant step, before adding the Wait for Element Visible step.

## Wait for element not visible (Web)

Use "Wait for element not visible" to wait until an element disappears from the page.

:fa-arrow-right: **To add a Wait for Element Not Visible step:**

1. Navigate to the **Test Editor** for your test.
2. Hover over the **arrow** where you want to insert the new step and click **Testim predefined steps.**

![](https://files.readme.io/6b2f5e3-predefined.jpg "predefined.jpg")

3. Select the **Wait for element not visible** step.

![](https://files.readme.io/c9ec1c1-element-not-visible-step.png "element-not-visible-step.png")

4. Select the target element in your application.

![](https://files.readme.io/8327419-wait-for-element-visible-selection.png "wait-for-element-visible-selection.png")

> 📘 Note:
>
> If you get the message "**To choose an element Open base URL or Run test to relevant step**" this means that you must first open the application in the base URL or run the test until the relevant step, before adding the Wait for element not visible step.

### Wait for element not visible delay

In some cases, you want to set a delay time before checking that the element is not visible. For example, you want to make sure that the element does not suddenly appear on the page.

:fa-arrow-right: **To add a delay to a Wait for Element Not Visible Step:**

1. Enter the properties of the '**Wait for Element not visible**' step that you created.
2. Check **Pre-step delay**.

![](https://files.readme.io/7f4b046-pre-step-delay.png "pre-step-delay.png")

3. Set **delay time in milliseconds (ms)**. Testim will wait this amount of time before moving to the next step.

![](https://files.readme.io/e0a7107-delay.png "delay.png")

## Wait for element text (Web)

Use wait for element text to make sure a specific text appears before continuing with the test.

:fa-arrow-right: **To add a Wait for element text step:**

1. Navigate to the **Test Editor** for your test.
2. Hover over the **arrow** where you want to insert the new step and click **Testim predefined steps.**

![](https://files.readme.io/6cae95d-predefined.jpg "predefined.jpg")

3. Select the **Wait for element text** step.

![](https://files.readme.io/9db9023-wait-element-text-step.png "wait-element-text-step.png")

4. Select the target text element you want to wait for from your app.

![](https://files.readme.io/00ffc60-text-selection.png "text-selection.png")

> 📘 Note:
>
> If you get the message "**To choose an element Open base URL or Run test to relevant step**" this means that you must first open the application in the base URL or run the test until the relevant step, before adding the Wait for element text step.

> 📘 Note:
>
> Parameters, regular expressions, and Java Script expression can be used in the '**Expected Value**' field. Read [Advanced text validation](https://help.testim.io/docs/validate-element-text#advanced-text-validation) to learn how.

## Wait for element text (Mobile)

Use wait for element text to make sure a specific text appears before continuing with the test.

:fa-arrow-right: **To add a Wait for element text step:**

1. Navigate to the **Test Editor** for your test.
2. Hover over the **arrow** where you want to insert the new step and click **Testim predefined steps.**

![](https://files.readme.io/0f45edc-mobile-predefined-step.png "mobile-predefined-step.png")

3. Select the **Wait for element text** step.

![](https://files.readme.io/6362268-mobile-element-text.png "mobile-element-text.png")

4. Select the target text element you want to wait for from your app.

![](https://files.readme.io/5bb3fab-select-target.png "select-target.png")

> 📘 Note:
>
> If you get the message "To choose an element Open App or Run test to relevant step" this means that you must first open the application or run the test until the relevant step, before adding the Wait for element text step.

> 📘 Note:
>
> Parameters, regular expressions, and Java Script expression can be used in the 'Expected Value' field. Read Advanced text validation to learn how.

## Sleep (Web)

Sometimes you want to wait a few seconds between the steps. Use it carefully as constant waiting will make the test run longer.

:fa-arrow-right: **To add a Sleep step:**

1. Navigate to the **Test Editor** for your test.
2. Hover over the **arrow** where you want to insert the new step and click **Testim predefined steps.**

![](https://files.readme.io/a5f65a5-predefined.jpg "predefined.jpg")

3. Select the **Sleep** step.

![](https://files.readme.io/e2c3b70-sleep-step.png "sleep-step.png")

4. The default sleep duration is 1 second (1,000ms). To update the **sleep duration** click the step properties and edit the milliseconds value.

![](https://files.readme.io/8cf49cd-sleep-duration.png "sleep-duration.png")

## Sleep (Mobile)

Sometimes you want to wait a few seconds between the steps. Use it carefully as constant waiting will make the test run longer.

:fa-arrow-right: **To add a Sleep step:**

1. Navigate to the **Test Editor** for your test.
2. Hover over the **arrow** where you want to insert the new step and click **Testim predefined steps.**

![](https://files.readme.io/237cdc5-mobile-predefined-step.png "mobile-predefined-step.png")

3. Select the **Sleep** step.

![](https://files.readme.io/2b5b317-mobile-sleep.png "mobile-sleep.png")

4. The default sleep duration is 1 second (1,000ms). To update the **sleep duration** click the step properties and edit the milliseconds value.

![](https://files.readme.io/f953339-sleep-duration.png "sleep-duration.png")

## Wait for element visualization (Web)

Use wait for element visualization to wait for your element to be visible on the page and validate its expected visualization. See [Visual Validation](https://help.testim.io/docs/pixel-validation-and-pixel-wait-for) for more information.

:fa-arrow-right: **To add a Wait for element visualization step:**

1. Navigate to the **Test Editor** for your test.
2. Hover over the **arrow** where you want to insert the new step and click **Testim predefined steps.**

![](https://files.readme.io/0819163-predefined.jpg "predefined.jpg")

3. Select the **Wait for element visualization** step.

![](https://files.readme.io/d8b8712-element-visualization-step.png "element-visualization-step.png")

4. Select the target element in your application.

![](https://files.readme.io/16cbd24-wait-for-element-visible-selection.png "wait-for-element-visible-selection.png")

## Custom Wait for (Web)

Custom Wait are JavaScript steps that are used in instances where none of the built-in steps presented fit your need.

:fa-arrow-right: **To add a Custom wait for step:**

1. Navigate to the **Test Editor** for your test.
2. Hover over the **arrow** where you want to insert the new step and click **Testim predefined steps.**

![](https://files.readme.io/bd85a91-predefined.jpg "predefined.jpg")

3. Select the **Add custom wait for** step.

![](https://files.readme.io/dbfd2ee-custom-wait-step.png "custom-wait-step.png")

4. Provide a **name** for the new step and click the **Create Step** button.

![](https://files.readme.io/da06ecb-custom-wait-name.png "custom-wait-name.png")

5. In the JavaScript editor, add any code in the function area and verify that the function returns a True / False value.

![](https://files.readme.io/94a0b4a-js-wait.png "js-wait.png")

> 📘 Note:
>
> * Wait for step will retry until the function returns a true value or until the timeout for the step is reached.
> * Custom Wait for steps are reusable components. You can use them on other tests.
> * You can use step parameters, export parameters, and so on in your Custom wait for step.  See [Add custom validations and actions](https://help.testim.io/docs/custom-code) for more information about custom actions.

## Wait for Download (Web)

Add a Wait for Download step if you want Testim to pause to ensure a file is completely downloaded before moving on to the next step.

:fa-arrow-right: **To add a Wait for Download step:**

1. Navigate to the **Test Editor** for your test.
2. Hover over the **arrow** where you want to insert the new step and click **Testim predefined steps.**

![](https://files.readme.io/dde267a-predefined.jpg "predefined.jpg")

3. Select the **Wait for Download** step.

![](https://files.readme.io/681c4e7-wait-for-download-step.png "wait-for-download-step.png")

4. Provide a **name** for the new step and click the **Create Step** button.

![](https://files.readme.io/fa1cbce-wait-for-download-step-name.png "wait-for-download-step-name.png")

5. In the JavaScript editor, add script language to validate the download has completed. See [Validate download](https://help.testim.io/docs/validate-download) for more information.

![](https://files.readme.io/e553c48-wait-for-download.png "wait-for-download.png")

6. Click the **Back Arrow** to return to the test editor. Your script will automatically be saved.

![](https://files.readme.io/4a10d25-return-to-test.png "return-to-test.png")

## Reassign Target Element in Wait For Steps

After a Wait For step has been created, you can reassign the target element or target text in the step. See [Editing Target Element Properties](https://help.testim.io/docs/editing-target-element-properties#reassigningimproving-the-target-element) for more information.