# Validation

Validate that the expected outcome occurred

When testing an app, it isn’t enough just to know that the steps ran effectively. In many cases, you will also want to verify that the expected result was produced by the test step. For example, after logging in, you may want to verify that the correct username is now shown in the page header.\
The following types of validations are available:

* **[Page Accessibility Validation](https://help.testim.io/docs/accessibility-validations)** – Validate page accessibility.
* **[Element Accessibility Validation](https://help.testim.io/docs/element-accessibility-validation)** – Validate page element accessibility.
* **[Validate Element Visualization](https://help.testim.io/docs/validate-element-visualization)** – Record file upload interactions.
* **[Validate Viewport Visualization](https://help.testim.io/docs/validate-viewport-visualization)** – Record file upload interactions.
* **[Validate Full Page Visualization](https://help.testim.io/docs/validate-full-page-visualization)** – Record file upload interactions.
* **[Wait for Element Visualization](https://help.testim.io/docs/wait-for-element-visualization)** – Record file upload interactions.
* **[Validate element visible](https://help.testim.io/docs/validate-element-visible)** – Validate that the expected element is visible.
* **[Validate element not visible](https://help.testim.io/docs/validate-element-not-visible)** – Validate that an element is not visible.
* **[Validate element text](https://help.testim.io/docs/validate-element-text)** – Validate that the expected text is visible.
* **[Add custom validation](https://help.testim.io/docs/custom-code)** – Create complex validations using custom scripts.
* **[Validate using custom code](https://help.testim.io/docs/custom-code-1)** – Create a test step with custom code.
* **[Validate download](https://help.testim.io/docs/validate-download)** – Validate that the download content is as expected.
* **[Validate email](https://help.testim.io/docs/email-validation)** – Validate sign-up and login flows.
* **[Validate CSS property](https://help.testim.io/docs/css-property-validation)** – Validate any CSS property of an element.
* **[Validate HTML attribute](https://help.testim.io/docs/html-attribute-validation)** – Validate any HTML attribute in your app.
* **[Validate checkbox](https://help.testim.io/docs/checkbox-and-radio-button-validation)** – Validate whether a checkbox is checked or unchecked.
* **[Validate radio button](https://help.testim.io/docs/checkbox-and-radio-button-validation)** – Validate whether a radio button is checked or unchecked.
* **[Validate API](https://help.testim.io/docs/api-testing#api-validation)** – Validate API response values against elements in the UI.
* **[Visual validation (element, viewport, full-page)](https://help.testim.io/docs/pixel-validation-and-pixel-wait-for)**  – Validate visual details down to the pixel level.
* **[Add network validation](https://help.testim.io/docs/add-network-validation)** – Validate that network requests were executed as expected.
* **[Add CLI validations and actions](https://help.testim.io/docs/add-cli-validations-and-actions)** – Execute node.js scripts from within your tests.
* **[File upload step validation](https://help.testim.io/docs/file-upload-step)** – Record file upload interactions.
* **[MonboDB validation](https://help.testim.io/docs/mongodb-validation)** – Validate MongoDB using a CLI action step.
* **[My SQL validation](https://help.testim.io/docs/mysql-validation)** – Validate MySQL using a CLI action step and SQL queries.

## Validation Step Display

When you add a validation step, it is shown in the Editor as a new step in your test, indicated by an icon in the upper-left corner of the test step. Each type of validation step is represented by a different icon. The following are a few examples of the icons shown for various types of validations.

**Validate element visible**

![](https://files.readme.io/9dc088f-Testim_019_r.png "Testim 019_r.png")

**Validate element text**

<Image align="center" width="smart" src="https://files.readme.io/f7cbcdc-Testim_021_r.png" />

**Custom validation**

<Image align="center" width="smart" src="https://files.readme.io/3260e0d-Testim_018_r.png" />

## Validation Test Results

When you run your test, each validation step will either pass or fail depending on whether or not the validation criteria were met.

If the validation step passes, the icon in the upper-left of the test step is shown in green, and there is a message in the Properties panel showing that it passed.

<Image align="center" src="https://files.readme.io/9373384076d1aa60f511228c7ed591c15ff47c36384c7680b85a28f7e277fb04-3280147-Screen_Shot_2021.jpg" />

If a validation step fails, the icon in the upper-left corner of the test step turns red, and there is a message in the Properties panel showing that the step failed. Additionally, a red bar will appear at the top of the Editor indicating that the step failed. The red bar shows the expected and actual values for the failed step. There is also a **See error** link that can be clicked in order to open the full error message.

![](https://files.readme.io/ecfa22f-Screen_Shot_2021-04-18_at_6.35.08.png "Screen Shot 2021-04-18 at 6.35.08.png")

For more information, see [Test results](https://help.testim.io/docs/test-results).