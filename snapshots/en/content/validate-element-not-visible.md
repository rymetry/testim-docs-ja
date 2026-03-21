# Validate element not visible

Validate that an element is not visible

The Element not visible validation allows you to verify that an element is not visible on the page. Use this validation to make sure an element disappeared from the screen or was never initially shown.

> 📘 Web-only step
>
> This step is available for web only.

## Adding a Validate element not visible step

:fa-arrow-right: **To add an Element Not Visible validation:**

1. Hover over the **> (arrow symbol)** where you want to add the validation.

![](https://files.readme.io/effce9f-Screen_Shot_2021-04-18_at_6.37.44.png "Screen Shot 2021-04-18 at 6.37.44.png")

The action options are displayed.

<Image align="center" width="smart" src="https://files.readme.io/5357ef7-Testim_083a_r.png" />

2. Click on the **Toggle Breakpoint** button.

<Image align="center" width="smart" src="https://files.readme.io/065d541-Testim_085_r.png" />

3. Click on the **Play Scenario** button, to run the test until the breakpoint.

![](https://files.readme.io/a073c5b-Screen_Shot_2021-04-18_at_6.39.03.png "Screen Shot 2021-04-18 at 6.39.03.png")

4. Hover over the position again and click on the **"M"** (Testim predefined steps).\
   The Predefined steps menu opens.

<Image align="center" width="smart" src="https://files.readme.io/33395a4-Testim_034_r.png" />

5. Click on **Validations**.\
   The Validations section expands.

<Image align="center" width="smart" src="https://files.readme.io/3cb61d5-Testim_035_r.png" />

6. Scroll down through the menu and select **Validate element not visible**.

> 📘
>
> Alternatively, you can use the search box at the top of the menu to search for **Validate element not visible**.

7. In the AUT window, identify the relevant element that you wish to validate, and click on it to select it.\
   The step is created, and a thumbnail of the selected element is shown in the step.

![](https://files.readme.io/5680a81-Testim_089.png "Testim 089.png")

8. If you want to add a delay before checking that the element is not visible, hover over the step and click on the **Show Properties** (:fa-cog:) icon.

![](https://files.readme.io/bf63c08-Screen_Shot_2021-04-18_at_6.40.55.png "Screen Shot 2021-04-18 at 6.40.55.png")

The Properties panel opens on the right-hand side.

9. Select the **Pre-step delay (ms)** checkbox.

<Image align="center" width="smart" src="https://files.readme.io/73e40b0-Testim_011b_r.png" />

10. In the field that opens, enter the delay duration (in ms).

<Image align="center" width="smart" src="https://files.readme.io/670a2b2-Testim_012a_r.png" />

When the test is run and gets to this step, it will wait the specified amount of time before moving to the next step.

11. Click on the **Toggle Breakpoint** button after the Validation step to remove the breakpoint.

## Modifying a Validate element not visible step

If you want to change the element you selected, you don’t need to delete and re-record the step. Instead, you can just reassign the element with a different element.

:fa-arrow-right: **To reassign the selected element in a Validate element not visible step:**

1. Hover over the position to the left of the step for which you want to reassign the element and click on the **Toggle Breakpoint** button.
2. Click on the **Play Scenario** button, to run the test until the breakpoint.
3. Hover over the step for which you want to reassign the element and click on the **Show Properties** (:fa-cog:) icon.

![](https://files.readme.io/5ad089f-Screen_Shot_2021-04-18_at_6.40.55.png "Screen Shot 2021-04-18 at 6.40.55.png")

The Properties panel opens on the right-hand side.

4. Hover over the **Target element** thumbnail.

<Image align="center" width="smart" src="https://files.readme.io/e427d93-Testim_011a_r.png" />

The **Target element** options are shown.

<Image align="center" width="smart" src="https://files.readme.io/a16fb1c-Testim_010_r.png" />

5. Click **Reassign**.

<Image align="center" width="smart" src="https://files.readme.io/756ba35-Testim_010a_r.png" />

6. In the AUT browser, identify the relevant element and click on it to select it.\
   The selected element is shown in the Target element box in the Properties panel.
7. Click on the same **Toggle Breakpoint** button as before (the one to the left of the step for which you reassigned the element) to remove the breakpoint.