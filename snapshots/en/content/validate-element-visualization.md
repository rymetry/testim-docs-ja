# Validate Element Visualization

Validate visual details down to the pixel level

The Validate element visualization step allows you to compare visual differences of a specific element between your baseline and your current test run. This functionality is provided as a service by [Applitools](https://applitools.com), and requires integration with their Applitools Eyes app. For more information see [Visual Validation (element, viewport, full-page)](https://help.testim.io/docs/pixel-validation-and-pixel-wait-for)

> 📘 This is a PRO feature
>
> This feature is only open to projects on our professional plan. To learn more about our professional plan, click [here](https://www.testim.io/pricing/).

## Adding a Validate element visualization step

:fa-arrow-right: **To add a Validate element visualization step:**

1. Hover over the :fa-caret-right: **(arrow symbol)** where you want to add the validation.

![3851](https://files.readme.io/250d552-Testim_266b.png "Testim 266b.png")

The **action options** are displayed.

![200](https://files.readme.io/4835d90-Testim_267a_r.png "Testim 267a_r.png")

2. Click on the **Toggle breakpoint** button.

![300](https://files.readme.io/a315470-Testim_268_r.png "Testim 268_r.png")

3. Click on the **Run test** button, to run the test until the breakpoint.

![3851](https://files.readme.io/bf77731-Testim_269b.png "Testim 269b.png")

4. Hover over the :fa-caret-right: **(arrow symbol)** again and click on the “**M**” (Testim predefined steps).\
   The **Predefined steps** menu opens.

![200](https://files.readme.io/8b2baf7-Testim_270_r.png "Testim 270_r.png")

5. Click on **Validations**.\
   The **Validations** menu expands.

![200](https://files.readme.io/57ab006-Testim_271_r.png "Testim 271_r.png")

6. Scroll down through the menu and select **Validate element visualization**.

> 📘 Alternatively, you can use the search box at the top of the menu to search for **Validate element visualization**.

7. In the **AUT** window, identify the relevant element for which you wish to validate an HTML attribute, and click on it to select it.\
   The “Element Visual Validation” step is added in the **Editor**, and a thumbnail of the selected element is shown in the step.

![3851](https://files.readme.io/9db6ffb-Testim_272a.png "Testim 272a.png")

8. Click on the **Toggle Breakpoint** button after the validation step to remove the breakpoint.\
   When you run your test, the baseline visualization will be compared to the test run. If the step fails due to a visual validation failure, double-click the failed visual validation step to open the details in Applitools Eyes.

> 📘 You can also use keyboard shortcuts to add a **Validate element visualization** step. See [Keyboard shortcuts](https://help.testim.io/docs/keyboard-shortcuts).

> 📘 Testim automatically creates a baseline in the first step run. It is recommended that in the Applitools UI you review, customize, and confirm that this baseline meets your expectations.