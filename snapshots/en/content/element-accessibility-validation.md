# Element Accessibility Validation

Accessible web pages are web pages that are designed in a way that people with disabilities or impairments can use them. Most US and EU organizations require accessibility compliance.

Using the *Validate element accessibility* step, you can check if a specific element on your web page could have been made accessible, but was not. The accessibility checks are based on rules, which are listed here: [https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md).

> 📘 This is a pro feature
>
> This is a pro feature only open to projects on our professional plan. To learn more about our professional plan, click [here](https://www.testim.io/pricing/).

> 📘
>
> This step can run only on either Chrome or Edge Chromium.

> 📘 Accessibility Validation Support
>
> Testim Accessibility steps use one of the leading accessibility libraries, [Axe Core by Deque](https://www.deque.com/axe/). Note that pure accessibility violations detected within the Accessibility step are primarily related to your application code. As such, addressing these specific issues falls outside the scope of Testim's support. If you encounter challenges in rectifying accessibility violations through code fixes, we advise you to seek assistance from [Deque Axe-Core](https://www.deque.com/axe/) issues page. As accessibility experts, they can provide specialized guidance and solutions to address these issues effectively.

## Adding a Validate element accessibility step

> 📘
>
> Steps created before Jan 2022 are not shared. To make them shared, please record them again.

:fa-arrow-right: **To add a Validate element accessibility step:**

1. Hover over the :fa-caret-right: **(arrow symbol)** where you want to add the step.

![](https://files.readme.io/4a5271a-Testim_357a.png "Testim 357a.png")

The **action options** are displayed.

![](https://files.readme.io/e69c262-Testim_358a_r.png "Testim 358a_r.png")

2. Click on the **Toggle Breakpoint** button.

![](https://files.readme.io/848348d-Testim_359_r.png "Testim 359_r.png")

3. Click on the **Run test** button to run the test until the breakpoint.

![](https://files.readme.io/6ce633c-Testim_360a.png "Testim 360a.png")

4. Hover over the :fa-caret-right: **(arrow symbol)** again and click on the “**M**” (Testim predefined steps).\
   The **Predefined steps** menu opens.

![](https://files.readme.io/238c2a5-Testim_270_r2_predefined_steps.png "Testim 270_r2 predefined steps.png")

5.Click on **Validations**.\
The **Validations** menu expands.

![](https://files.readme.io/e797323-Testim_271_r2_validations_menu.png "Testim 271_r2 validations menu.png")

6. Scroll down through the menu and select **Validate element accessibility**.

> 📘
>
> Alternatively, you can use the search box at the top of the menu to search for **Validate element accessibility**.

7. In the **AUT** window, identify the relevant element for which you wish to validate its accessibility, and click on it to select it.\
   A *Validate element accessibility* step is added in the **Editor**.

![](https://files.readme.io/2d66ca3-Testim_361a.png "Testim 361a.png")

8. Hover over the newly created step, and click on the **Show Properties** (:fa-cog:) icon.

![](https://files.readme.io/3095c4a-Testim_362a.png "Testim 362a.png")

The **Properties** panel opens on the right-hand side.

![](https://files.readme.io/2b9a324-Screen_Shot_2021-12-22_at_6.15.33.png "Screen Shot 2021-12-22 at 6.15.33.png")

9. Fill in the properties as described below.

* **Description** – The description of the step. (Default = *Accessibility validation*)
* **Fail test from impact level** – The minimal impact level that will fail the test. Options are: *Critical*, *Serious*, *Moderate*, and *Minor*. (Default = *Minor*)
* **Run only specific tags** – Click in this field and choose the protocols you wish to test from the dropdown options available. See table [below](https://help.testim.io/docs/accessibility-validations#section-rules-descriptions). By default all tags are selected.
* **Exclude specific rule IDs** – If you wish to exclude specific rule IDs, select them from the list. In addition if you wish to only check specific rule IDs, you can select all and then un-select the ones you would like to test.
* **When this step fails** – Specify what to do if the step fails.
* **When to run step** – Specify conditions for when to run the step. For more info, see [Conditions](https://help.testim.io/docs/conditions).
* **Override timeout** – Allows you to override the default time lapse setting which causes Testim to register a fail for a test step, and specify a different time lapse value (in milliseconds).
* **Disable auto-scroll** – Disables auto-scrolling to elements that exist, but are outside of the viewport.

![](https://files.readme.io/48398ce-element_accessibility_validation.gif "element_accessibility_validation.gif")

10. Click on the **Toggle Breakpoint** button after the Validation step to remove the breakpoint.\
    When the test is run, the accessibility level of the selected element will be checked against the parameters you set. If accessibility violations are found and the step fails, you can view the accessibility report to see detailed results.

## Viewing the element accessibility results

After a test with a *Validate element accessibility* step is run, if accessibility violations are found, a *Step Failed: Accessibility violations were found* error message is shown, and you can view detailed accessibility violation results.

:fa-arrow-right: **To view the element accessibility results:**

1. Hover over the failed *Validate element accessibility* step, and click on the **Show Properties** (:fa-cog:) icon.

![](https://files.readme.io/b3cc849-Testim_364a.png "Testim 364a.png")

The **Properties** panel opens on the right-hand side.

2. In the **Properties** panel, click the **Check here for more details** link.

![](https://files.readme.io/fe90831-Testim_365a_r.png "Testim 365a_r.png")

> 📘
>
> Alternatively, in the error panel, you can click on the **Accessibility report** link.

![](https://files.readme.io/b5fd0af-Testim_364b.png "Testim 364b.png")

The **Accessibility Result** window is shown (based on the impact level  you chose previously), displaying a list of accessibility issues, the number of occurrences that were found, and their impact levels.

![](https://files.readme.io/2d4772e-Testim_366_r.png "Testim 366_r.png")

If you would like to show the accessibility issues found based on all of the impact levels, click the **All impact levels** toggle.

![](https://files.readme.io/136f7ef-Testim_366a_r.png "Testim 366a_r.png")

3. If you would like to download the results as a CSV file, click the **download** icon. (The CSV file includes the results of all of the accessibility tests, including those that passed.)

![](https://files.readme.io/ecca0de-Testim_366b_r.png "Testim 366b_r.png")

4. Click the **down arrow** next to any of the results to show the following detailed information: *Description*, *How To Fix The Problem*, and *Element CSS Selector*.

![](https://files.readme.io/b81df21-Testim_367a_r.png "Testim 367a_r.png")

5. If more than one occurrence of an accessibility issue was found, click the **arrows** in the **Element CSS Selector** section to show the different instances of the issue.

![](https://files.readme.io/edadefa-Testim_350b_r2.png "Testim 350b_r2.png")

## Rules Descriptions

Testim uses the following library to check the element accessibility level: [https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md). Each rule has an associated impact level (e.g. Critical, Serious, Moderate, or Minor) and associated tags. When configuring the accessibility check, you can limit the check to certain tags and/or impact levels.