# Web and Mobile Testing

Testim Automate is a full-featured test automation platform enabling fast authoring of stable tests.

## Codeless Test Authoring

Testim offers a codeless test authoring environment where you can create tests by recording your steps.  All you have to do is simply start a recording within the Testim visual editor, record steps in your application by clicking, selecting menu options, typing in text, etc. The result is a step-by-step test that can be edited within the visual editor. The great part about recording a test is that it uses Testim's algorithm to uniquely identify each element and its parameters. Our AI uses what we call, Smart Locators, to evaluate hundreds of attributes and score them so that if elements change, your tests don’t break. To get started, follow the instructions in the following Getting Started Guides:

* For web - [Creating your First Codeless Test in Testim Visual Editor](https://help.testim.io/docs/creating-your-first-codeless-test)
* For mobile - [Creating your First Mobile Test in Testim Visual Editor](https://help.testim.io/docs/creating-your-first-mobile-test-in-testim-visual-editor-edited)

## Customize tests

Testim has many features built into the visual test editor to help you customize your tests.

### **Visual test editor**

We've built a lot of features right into the editor so there's no need to write code if you don't want to. Here are a few examples **(Hint: There are waaaay more, just search for what you need)**:

* **[Groups](https://help.testim.io/docs/groups)** - You can group steps and reuse them. You can nest groups within groups. Grouping helps you architect tests so that you aren't repeatedly creating the same steps. You can also create more efficient test architecture by reusing proven steps.
* **[Validations](https://help.testim.io/docs/validation)** - Ensure the output of a test matches the expected output. You can configure validations for data, PDFs, email, Word docs, and much more.
* **[Conditions](https://help.testim.io/docs/conditions)** - Configure a step or group of steps to run (or skip) if certain conditions are met (or absent).
* **[Smart Locators](https://help.testim.io/docs/core-concepts)** - These make your tests stable. However, you may want to adjust the settings so that they are more or less strict, or even prioritize different attributes. We give you the information to see how Smart Locators are weighting attributes and the ability to override. See [Smart Locators](https://help.testim.io/docs/testim-automate#smart-locators---where-a-lot-of-the-magic-of-testims-ai-happens) below.
* **[Loops](https://help.testim.io/docs/loops)** - Run the same step multiple times until you get the expected output.
* **[Data-driven testing](https://help.testim.io/docs/data-driven-testing)** - Integrate test data to push input or boundary conditions. Link a CSV, Excel, or JSON file to reference your data.
* **[Custom actions through code](https://help.testim.io/docs/custom-code-1)** - Okay, for this one you do need to write some code. But it does give you the flexibility to execute code on any step.

## Execute your tests

Run and troubleshoot your tests locally. When you are ready, you can schedule, trigger by CI or run on demand. Tests can run on Testim Cloud Grid, a local Selenium-compatible test cloud, or third party grids.

**Run Locally** - After you have written your test, you will want to run it locally to verify that it works. If it doesn't you can troubleshoot, looking at comparison screenshots, HTML DOM data, and console logs to identify the problem.

**[Debugging](https://help.testim.io/docs/debugging-overview)** - Testim offers a variety of tools to quickly debug your tests during runtime, without the need to wait until your test fully runs. Using these tools you will be able to isolate the exact steps that lead to the error, to recreate the issue consistently; You can use tools like “break points” and “step-by-step execution” to identify the source of the issue and then analyze the test results to verify that the test is passing or repeat the steps until the issue is resolved.

**[Test grid](https://help.testim.io/docs/grid-management)** - Also known as a test cloud, test grids allow you to test multiple virtual (and sometimes physical) devices and configurations in parallel. It can greatly speed up test execution.

**[Virtual Mobile Grid](https://help.testim.io/docs/virtual-mobile-grid)** - The Virtual Mobile Grid (VMG) enables testing across a wide variety of iOS simulators and Android emulators.

**Cross-browser** - You will want to make sure that your application runs the same way in Safari as it does in Edge. Cross-browser support lets you simulate different desktop and mobile web browsers in parallel.

**[CI integrations](https://help.testim.io/docs/integrate-testim-to-your-ci)** - We easily integrate with Continuous Integration tools so that your tests can run automatically at desired process points.

## Report results

Regardless of how your tests were created (code or codeless) when they run, you will see the results in Testim so you can troubleshoot and capture bugs. You'll also want to show your team all of the great work you've been doing and that releases are ready to ship.

**[Root cause analysis](https://help.testim.io/docs/why-did-my-test-fail)** - We aggregate error types so that you can quickly identify problems that are affecting multiple tests. You'll have tools including screenshots, console logs, and HTML DOM info at your fingertips.

**[Test results](https://help.testim.io/docs/test-results)** - Measure team and test suite performance. See how tests are trending over time.

**[Bug capture](https://help.testim.io/docs/capture)** - Bug reporting is really easy with our capture tool. Capture screenshots, video, add a description of the error and then pop it into a bug tracker—in less than 60 seconds.

## TestOps: Scale testing with control, management, and insights

[TestOps](https://help.testim.io/docs/testops-overview) is a set of capabilities within Testim Automate that enable efficient testing operations at scale. The set of features are designed to help managers and teams focused on high-quality code, scale automation initiatives. Using the TestOps features users can establish and maintain control, improve organization and management, and gain insights to help unjumble the growing complexity.

TestOps' features are organized into three categories:

* **Control** - enables setting policies and controls to ensure tests meet the highest standards.
* **Management** - helps find the tests faster, reduce switching costs, and improves productivity. The management features also help understand which tests are trusted and CI-ready, and which are temperamental, all while helping balance workload and preventing overlap.
* **Insights** - gain insights from your testing data that help you understand the current state of quality,  build competency, team progress, and process improvement areas.

## Smart Locators - where a lot of the magic of Testim's AI happens

When you record a test, you need to identify the elements on the page. In some test automation tools, visual elements are identified by a single locator such as property ID, text, or class. However, if this locator changes due to a feature update, the test won't find the element and fail.

Testim's Smart Locators solve this problem by taking a more holistic approach to identifying the element. When an element is selected during a recording (click, hover, enter, etc.) Testim's algorithm analyzes potentially hundreds of attributes associated with the element. It then assigns weights to the attributes to uniquely identify the element.

The Smart Locators learn with each test run. If some attributes change, the Smart Locator will use other attributes to identify the element. This way, if the element was changed but it is still functioning, Testim's Smart Locators will find it and keep the test from failing. If you are wondering how a Smart Locator identifies an element, you can look in the Properties panel. You can also change how Smart Locators are weighted and override them if desired.

Over time, as your app changes, the locator scores of your elements can degrade. If a locator score drops below 70%, Testim automatically attempts to improve that locator in order to enhance the stability of your test. For more information, see [Locators: Auto Improve](https://help.testim.io/docs/locators-auto-improve)