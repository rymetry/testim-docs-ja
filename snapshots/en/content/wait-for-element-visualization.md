# Wait For Element Visualization

Validate visual details down to the pixel level

A Wait For step allows you to force your test to pause and wait for a certain event to occur before moving to the next step. In the case of a Wait for element visualization step, Testim waits for the element to be visible on the page and then validates the element on a visual level.

The visual validation and wait-for steps allow you to compare visual differences between your baseline and your current test run with precision. You can modify several parameters to customize  the comparison method between the baseline and the test. This functionality is provided as a service by [Applitools](https://applitools.com/), and requires integration with their Applitools Eyes app.

> 📘 The RCA and Ultrafast Test Cloud (i.e. adding extra environments) features will be rejected by Applitools without appropriate licensing. Contact your Applitools representative for more information.

You can perform the following visual validations:

* **Element Visualization** – Visual validation on a specific element.
* **Viewport Visualization** – Visual validation on your viewport.
* **Full-page Visualization** – Visual validation on your entire page.

> 📘 This is a PRO feature
>
> This feature is only open to projects on our professional plan. To learn more about our professional plan, click [here](https://www.testim.io/pricing/).

> 📘 If you change the configuration of your test, a new baseline will be created in Applitools but not in Testim. If you want a new baseline for each configuration, you need to create different tests for each one.

## Adding a Wait for element visualization step

:fa-arrow-right: **To add a Wait for element visualization step:**

1. Hover over the :fa-caret-right: **(arrow symbol)** where you want to add the validation.

![3851](https://files.readme.io/e9b93ef-Testim_276b.png "Testim 276b.png")

The **action options** are displayed.

![200](https://files.readme.io/abc8595-Testim_267a_r.png "Testim 267a_r.png")

2. Click on the **Toggle breakpoint** button.

![300](https://files.readme.io/e46753b-Testim_268_r.png "Testim 268_r.png")

3. Click on the **Run test** button, to run the test until the breakpoint.

![3849](https://files.readme.io/25f5431-Testim_277b.png "Testim 277b.png")

4. Hover over the :fa-caret-right: **(arrow symbol)** again and click on the “**M**” (Testim predefined steps).\
   The **Predefined steps** menu opens.

![200](https://files.readme.io/2ab8794-Testim_270_r.png "Testim 270_r.png")

5. Click on **Wait For**.\
   The **Wait For** menu expands.

![200](https://files.readme.io/1140ec5-Testim_278_r.png "Testim 278_r.png")

6. Scroll down through the menu and select **Wait for element visualization**.

> 📘 Alternatively, you can use the search box at the top of the menu to search for **Wait for element visualization**.

7. In the **AUT** window, identify the relevant element for which you wish to wait for an HTML attribute, and click on it to select it.\
   The “Wait for element visualization” step is added in the **Editor**, and a thumbnail of the selected element is shown in the step.

![3851](https://files.readme.io/974471e-Testim_279a.png "Testim 279a.png")

8. Click on the **Toggle Breakpoint** button after the "wait for"step to remove the breakpoint.\
   When you run your test, the baseline visualization will be compared to the test run. If the step fails due to a visual validation failure, double-click the failed Wait for element visualization step to open the details in Applitools Eyes.