# Validate Full-page Visualization

Validate visual details down to the pixel level

The Validate full page visualization step allows you to compare visual differences of a specific element between your baseline and your current test run. This functionality is provided as a service by [Applitools](https://applitools.com), and requires integration with their Applitools Eyes app. For more information see [Visual Validation (element, viewport, full-page)](https://help.testim.io/docs/pixel-validation-and-pixel-wait-for)

> 📘 The RCA and Ultrafast Test Cloud (i.e. adding extra environments) features will be rejected by Applitools without appropriate licensing. Contact your Applitools representative for more information.

> 📘 This is a PRO feature
>
> This feature is only open to projects on our professional plan. To learn more about our professional plan, click [here](https://www.testim.io/pricing/).

> 📘 If you change the configuration of your test, a new baseline will be created in Applitools but not in Testim. If you want a new baseline for each configuration, you need to create different tests for each one.

## Adding a Validate full-page visualization step

These two steps allow you to compare the visual difference between your baseline and your current test run of your viewport OR your page.

:fa-arrow-right: **To add a Validate full-page visualization step:**

1. Hover over the :fa-caret-right: **(arrow symbol)** where you want to add the validation.

![3851](https://files.readme.io/2760163-Testim_275b.png "Testim 275b.png")

The **action options** are displayed.

![200](https://files.readme.io/3bc96ed-Testim_267a_r.png "Testim 267a_r.png")

2. Click on the “**M**” (Testim predefined steps).\
   The **Predefined steps** menu opens.

![200](https://files.readme.io/8957b3e-Testim_270_r.png "Testim 270_r.png")

3. Click on **Validations**.\
   The **Validations** menu expands.

![200](https://files.readme.io/d74c896-Testim_271_r.png "Testim 271_r.png")

4. Scroll down through the menu and select **Validate full-page visualization**.

> 📘 Alternatively, you can use the search box at the top of the menu to search for **Validate full-page visualization**.

5. The visual validation step is added in the **Editor**, and a thumbnail of the selected element is shown in the step.\
   When you run your test, the baseline visualization will be compared to the test run. If the step fails due to a visual validation failure, double-click the failed visual validation step to open the details in Applitools Eyes.

> 📘 You can also use keyboard shortcuts to add a **Validate viewport visualization** step or a **Validate full-page visualization** step. See [Keyboard shortcuts](https://help.testim.io/docs/keyboard-shortcuts).