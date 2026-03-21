# Page Accessibility Validation

Accessible web pages are web pages that are designed in a way that people with disabilities or impairments can use them. Most US and EU organizations require accessibility compliance.

Using the *Validate page accessibility* step, you can check the accessibility level of your web page, while identifying elements in your web page that could have been made accessible, but were not. The accessibility checks are based on rules, which are listed here: [https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)).

> 📘 This is a pro feature
>
> This is a pro feature only open to projects on our professional plan. To learn more about our professional plan, click [here](https://www.testim.io/pricing/).

> 📘
>
> The *Validate page accessibility* step feature is only available when using the Chrome browser.

> 📘 Accessibility Validation Support
>
> Testim Accessibility steps use one of the leading accessibility libraries, [Axe Core by Deque](https://www.deque.com/axe/). Note that pure accessibility violations detected within the Accessibility step are primarily related to your application code. As such, addressing these specific issues falls outside the scope of Testim's support. If you encounter challenges in rectifying accessibility violations through code fixes, we advise you to seek assistance from [Deque Axe-Core](https://www.deque.com/axe/) issues page. As accessibility experts, they can provide specialized guidance and solutions to address these issues effectively.

## Adding a Validate page accessibility step

The Validate page accessibility step should be placed in the part of your test where the desired page to be tested is currently open in the AUT. If your test involves navigating to more than one page, be sure that the step is placed in the testing sequence where the desired page is open.

> 📘
>
> Steps created before Jan 2022 are not shared. To make them shared, please record them again.

:fa-arrow-right: **To add a Validate page accessibility step:**

1. Hover over the :fa-caret-right: **(arrow symbol)** where you want to add the step.

![](https://files.readme.io/04ebd5b-Testim_340a.png "Testim 340a.png")

The **action options** are displayed.

![](https://files.readme.io/4b0c617-Testim_283a_r_action_options.png "Testim 283a_r action options.png")

2. Click on the **Toggle Breakpoint** button.

![](https://files.readme.io/96c08f9-Testim_341_r.png "Testim 341_r.png")

3. Click on the **Run test** button to run the test until the breakpoint.

![](https://files.readme.io/c1f821e-Testim_342a.png "Testim 342a.png")

4. Hover over the :fa-caret-right: **(arrow symbol)** again and click on the “**M**” (Testim predefined steps).\
   The **Predefined steps** menu opens.

![](https://files.readme.io/ea60818-Testim_270_r2_predefined_steps.png "Testim 270_r2 predefined steps.png")

5. Click on **Validations**.\
   The **Validations** menu expands.

![](https://files.readme.io/e0f49dc-Testim_271_r2_validations_menu.png "Testim 271_r2 validations menu.png")

6. Scroll down through the menu and select **Validate page accessibility**.

> 📘
>
> Alternatively, you can use the search box at the top of the menu to search for **Validate page accessibility**.

A *Validate page accessibility* step is added in the **Editor**.

![](https://files.readme.io/e967a00-Testim_343a.png "Testim 343a.png")

7. Hover over the newly created step, and click on the **Show Properties** (:fa-cog:) icon.

![](https://files.readme.io/170105b-Testim_344a.png "Testim 344a.png")

The **Properties** panel opens on the right-hand side.

<Image align="center" width="-30% " src="https://files.readme.io/04ae060-Screen_Shot_2021-12-16_at_9.42.42.png" />

8. Fill in the properties as described below.

* **Description** – The description of the step. (Default = *Page accessibility validation*)
* **Fail test from impact level** – The minimal impact level that will fail the test. Options are: *Critical*, *Serious*, *Moderate*, and *Minor*. (Default = *Minor*) The impact levels of the different rules are shown in the table [below](https://help.testim.io/docs/accessibility-validations#section-rules-descriptions).
* **Run only specific tags** – Click in this field and choose the protocols you wish to test from the dropdown options available. See table [below](https://help.testim.io/docs/accessibility-validations#section-rules-descriptions). By default all tags are selected.
* **Exclude specific rule IDs** – If you wish to exclude specific rule IDs, select them from the list. In addition if you wish to only check specific rule IDs, you can select all and then un-select the ones you would like to test.
* **When this step fails** – Specify what to do if the step fails.
* **When to run step** – Specify conditions for when to run the step. For more info, see [Conditions](https://help.testim.io/docs/conditions).
* **Override timeout** – Allows you to override the default time lapse setting which causes Testim to register a fail for a test step, and specify a different time lapse value (in milliseconds).

9. Click on the **Toggle Breakpoint** button after the Validation step to remove the breakpoint.\
   When the test is run, the accessibility level of your page will be checked against the parameters you set. If accessibility violations are found and the step fails, you can view the accessibility report to see detailed results.

## Viewing the page accessibility results

After a test with a *Validate page accessibility* step is run, if accessibility violations are found, a *Step Failed: Accessibility violations were found* error message is shown, and you can view detailed accessibility violation results.

:fa-arrow-right: **To view the page accessibility results:**

1. Hover over the failed *Validate page accessibility* step, and click on the **Show Properties** (:fa-cog:) icon.

![](https://files.readme.io/791f79c-Testim_345a.png "Testim 345a.png")

The **Properties** panel opens on the right-hand side.

2. In the **Properties** panel, click the **Check here for more details** link.

![](https://files.readme.io/08c719f-Screen_Shot_2021-12-20_at_8.27.57.png "Screen Shot 2021-12-20 at 8.27.57.png")

> 📘
>
> Alternatively, in the error panel, you can click on the **Accessibility report** link.

![](https://files.readme.io/2b2619c-Testim_345b.png "Testim 345b.png")

The **Accessibility Result** window is shown (based on the impact level  you chose previously), displaying a list of accessibility issues, the number of occurrences that were found, and their impact levels.

![](https://files.readme.io/f450ae7-Testim_348z_r.png "Testim 348z_r.png")

If you would like to show the accessibility issues found based on all of the impact levels, click the **All impact level** toggle.

![](https://files.readme.io/7e6519c-Testim_349za_r.png "Testim 349za_r.png")

3. If you would like to download the results as a CSV file, click the **download** icon. (The CSV file includes the results of all of the accessibility tests, including those that passed.)

![](https://files.readme.io/f155939-Testim_349zb_r.png "Testim 349zb_r.png")

4. Click the **down arrow** next to any of the results to show the following detailed information: *Description*, *How To Fix The Problem*, and *Element CSS Selector*.

![](https://files.readme.io/47bcc8a-Testim_350a_r2.png "Testim 350a_r2.png")

5. If more than one occurrence of an accessibility issue was found, click the **arrows** in the **Element CSS Selector** section to show the different instances of the issue.

![](https://files.readme.io/09ff7dd-Testim_350b_r2.png "Testim 350b_r2.png")

## Rules Descriptions

Testim uses the following library to check the element accessibility level: [https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md). Each rule has an associated impact level (e.g. Critical, Serious, Moderate, or Minor) and associated tags. When configuring the accessibility check, you can limit the check to certain tags and/or impact levels.