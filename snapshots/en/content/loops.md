# Repeat Group Loops

Repeat a group of steps using: while... do... loops & for loops

The Repeat Group Loop feature lets you execute a [Group](https://help.testim.io/docs/groups) step multiple times according to a set of predefined conditions. A “Loop” must be run on a series of steps which have already been configured as a “group”. To learn more about creating groups, see [Groups](https://help.testim.io/docs/groups).

> 📘
>
> The maximum number of iterations for any loop is 99 iterations.

There are 6 options for when to repeat a group:

* **Don’t repeat** – Use this option (default) when you don’t want your group of steps to be repeated.
* **While element** – A **While element** loop enables you to specify whether or not to run the same set of actions/validations depending on whether or not the specified element exists (or does not exist) on the page. The element can be any DOM object, such as property ID, text, or class. See [CONFIGURING A “WHILE ELEMENT” LOOP](https://help.testim.io/docs/loops#section-configuring-a-while-element-loop).
* **While element text is** – A **While element text** is loop is similar to the **While element** loop; however, this loop enables you to specify an expected text value for the specified element. The loop will run only if the specified text exists. See [CONFIGURING A “WHILE ELEMENT TEXT IS” LOOP](https://help.testim.io/docs/loops#section-configuring-a-while-element-text-is-loop).
* **For each item** – A **For each item** loop (i.e. for each loop) allows you to run the same set of actions/validations on similar elements. This is useful to test a list of repeating elements, like a table with multiple rows. See [CONFIGURING A “FOR EACH ITEM” LOOP](https://help.testim.io/docs/loops#section-configuring-a-for-each-item-loop).
* **Loop for (i.e. for loop)** – A **Loop for** loop (i.e. a for loop) allows you to run the same set of actions/validations a specified number of times. This value can be set to a *number* or a *parameter* with a number value. See [CONFIGURING A “LOOP FOR” LOOP](https://help.testim.io/docs/loops#section-configuring-a-loop-for-loop).
* **Custom** – A **Custom** loop allows you to run the same set of actions/validations depending on a specific value of an element on a page. The loop will run if the value exists. You can enable custom JavaScript code for the condition. See [CONFIGURING A “CUSTOM” LOOP](https://help.testim.io/docs/loops#section-configuring-a-custom-loop).

It is often necessary to keep track of the current iteration you are in while using a loop, for example when iterating through an array. For that purpose, you can use the **TESTIM\_ITERATOR variable** in loops. See [USING THE LOOP ITERATOR VARIABLE](https://help.testim.io/docs/loops#section-using-the-loop-iterator-variable) .

## Configuring a “While element” loop

A **While element** loop enables you to specify whether or not to run the same set of actions/validations depending on whether or not the specified element exists (or does not exist) on the page. The element can be any DOM object, such as property ID, text, or class.

:fa-arrow-right: **To configure a “While element” loop:**

1. Choose a group step which contains the steps you want to include in the loop.

> 📘
>
> Group steps can be identified by the Group icon (a picture of a folder) in the upper left-hand corner of the step.

2. Hover over the **> (arrow symbol)** to the left of that group step.

![](https://files.readme.io/1693a09-Testim_091a.png "Testim 091a.png")

The action options are displayed.

<Image align="center" width="smart" src="https://files.readme.io/f40d741-Testim_083a_r.png" />

3. Click on the **Toggle Breakpoint** button.

<Image align="center" width="smart" src="https://files.readme.io/4fb9e2a-Testim_092_r.png" />

4. Click on the **Play Scenario** button, to run the test until the breakpoint.

![](https://files.readme.io/ec526a2-Testim_093a.png "Testim 093a.png")

5. Hover over the group step and then click on the **Show Properties** (:fa-cog:) icon.

<Image align="center" width="smart" src="https://files.readme.io/5c94cb4-Testim_094a.png" />

The **Group Properties** panel opens on the right-hand side.

6. In the **Group Properties** panel, click on **Repeat** group.

![](https://files.readme.io/c449676-Testim_Image_027_r.png "Testim Image 027_r.png")

7. Select the **While element** radio button.

![](https://files.readme.io/4625b02-Testim_Image_028.png "Testim Image 028.png")

8. In the AUT window, hover your mouse on the relevant element and then click on it to select it.\
   The selected element is shown in the **Target element** box in the **Repeat group** section of the **Group Properties** panel.

![](https://files.readme.io/45c5627-Testim_Loops_Image_012_r.png "Testim Loops Image 012_r.png")

9. If you would like to view, replace, or adjust the settings for the selected element, use the procedures described in [Modifying the Test Using the Properties Panel](https://help.testim.io/docs/editing-your-tests#section-modifying-the-test-using-the-properties-panel).
10. Specify the type of Element condition to apply. Options are:

* **Visible** – the step only runs if the element is visible on the page.
* **Not visible** – the step runs only if the element is not visible on the page.

11. If you would like to adjust the settings for how long Testim checks before declaring a condition to be true or false, use the procedure described in [Advanced Condition Settings](https://help.testim.io/docs/advanced-conditions-settings).
12. Click on the **Toggle Breakpoint** button after to remove the breakpoint.

The loop is added to the step as indicated by the **loop** icon shown on the group step tile. Whenever you run this test, the loop process will run. To learn how to view the results of the run, see [VIEWING LOOP RUN RESULTS](https://help.testim.io/docs/loops#section-viewing-loop-run-results).

<Image align="center" width="smart" src="https://files.readme.io/4695ece-Testim_Image_032_r.png" />

## Configuring a “While element text is” loop

A **While element text is** loop is similar to the **While element** loop; however, this loop enables you to specify an expected text value for the specified element. The loop will run only if the specified text exists.\
:fa-arrow-right: **To configure a “While element text is” loop:**

1. Choose a group step which contains the steps you want to include in the loop.

> 📘
>
> Group steps can be identified by the Group icon (a picture of a folder) in the upper left-hand corner of the step.

2. Hover over the **> (arrow symbol)** to the left of that group step.

![](https://files.readme.io/5089a7f-Testim_095a.png "Testim 095a.png")

The action options are displayed.

<Image align="center" width="smart" src="https://files.readme.io/3bf47bc-Testim_096a_r.png" />

3. Click on the **Toggle Breakpoint** button.

<Image align="center" width="smart" src="https://files.readme.io/dfbc182-Testim_097_r.png" />

4. Click on the **Play Scenario** button, to run the test until the breakpoint.

![](https://files.readme.io/86f2293-Testim_098a.png "Testim 098a.png")

5. Hover over the group step and then click on the **Show Properties** (:fa-cog:) icon.

![](https://files.readme.io/068feb8-Testim_099a.png "Testim 099a.png")

The **Group Properties** panel opens on the right-hand side.

6. In the **Group Properties** panel, click on **Repeat group**.

<Image align="center" width="smart" src="https://files.readme.io/eedaeda-Testim_Image_037.png" />

7. Select the **While element text is** radio button.

![](https://files.readme.io/2ae3dea-Testim_Image_038.png "Testim Image 038.png")

8. In the AUT window, hover your mouse on the relevant element and then click on it to select it.\
   The selected element is shown in the **Target element** box in the **Repeat group** section of the **Group Properties** panel.

![](https://files.readme.io/01baa9d-Testim_Image_039_r.png "Testim Image 039_r.png")

9. In the **Expected value** box, the current value for the selected element is set by default. If you would like to specify a different value, enter the value in the **Expected value** box. If you would like to set a range of values, enter a Regex expression, a short JS expression, or a parameter.

![](https://files.readme.io/9681edd-Testim_Image_063_r.png "Testim Image 063_r.png")

10. If you would like to view, replace, or adjust the settings for the selected element, use the procedures described in [Modifying the Test Using the Properties Panel](https://help.testim.io/docs/editing-your-tests#section-modifying-the-test-using-the-properties-panel).
11. If you would like to adjust the settings for how long Testim checks before declaring a condition to be true or false, use the procedure described in [Advanced Condition Settings](https://help.testim.io/docs/advanced-conditions-settings).
12. Click on the **Toggle Breakpoint** button after to remove the breakpoint.

The loop is added to the step as indicated by the **loop** icon shown on the group step tile. Whenever you run this test, the loop process will run. To learn how to view the results of the run, see [VIEWING LOOP RUN RESULTS](https://help.testim.io/docs/loops#section-viewing-loop-run-results).

![](https://files.readme.io/67007a9-Testim_Image_041.png "Testim Image 041.png")

## Configuring a “For each item” loop

A **For each item** loop (i.e. for each loop) allows you to run the same set of actions/validations on similar elements. This is useful to test a list of repeating elements, like a table with multiple rows.

:fa-arrow-right: **To configure a “For each item” loop:**

1. Choose a group step which contains the steps you want to include in the loop.

> 📘
>
> Group steps can be identified by the Group icon (a picture of a folder) in the upper left-hand corner of the step.

2. Hover over the **> (arrow symbol)** to the left of that group step.

![](https://files.readme.io/740405e-Testim_100a.png "Testim 100a.png")

The action options are displayed.

<Image align="center" width="smart" src="https://files.readme.io/2c3f81b-Testim_083a_r.png" />

3. Click on the **Toggle Breakpoint** button.

<Image align="center" width="smart" src="https://files.readme.io/3b582ee-Testim_101_r.png" />

4. Click on the **Play Scenario** button, to run the test until the breakpoint.

![](https://files.readme.io/69671a7-Testim_102a.png "Testim 102a.png")

5. Hover over the group step and then click on the **Show Properties** (:fa-cog:) icon.

![](https://files.readme.io/c10c4c3-Testim_103a.png "Testim 103a.png")

The **Group Properties** panel opens on the right-hand side.

6. In the **Group Properties** panel, click on **Repeat group**.

![](https://files.readme.io/7eb5251-Testim_Image_022_r.png "Testim Image 022_r.png")

7. Select the **For each item** radio button.

![](https://files.readme.io/ea95fb7-Testim_Image_023.png "Testim Image 023.png")

8. In the AUT window, using your mouse, select the first repeating relevant element (for example, the first cell of a table) to select it.\
   The selected element is shown in the **Target element** box in the **Group Properties** panel, and the **Max number of items** field opens showing the default value as 99, meaning that this loop will run for up to 99 similar items. If you would like to set a lower limit, you may optionally enter a smaller value for the maximum number of items.

![](https://files.readme.io/599ba05-Testim_Image_024.png "Testim Image 024.png")

9. If you would like to view, replace, or adjust the settings for the selected element, use the procedures described in [Modifying the Test Using the Properties Panel](https://help.testim.io/docs/editing-your-tests#section-modifying-the-test-using-the-properties-panel).
10. If you would like to adjust the settings for how long Testim checks before declaring a condition to be true or false, use the procedure described in [Advanced Condition Settings](https://help.testim.io/docs/advanced-conditions-settings).
11. Click on the **Toggle Breakpoint** button after to remove the breakpoint.

The loop is added to the step as indicated by the **loop** icon shown on the group step tile. Whenever you run this test, the loop process will run through each of the items similar to the item you selected. To learn how to view the results of the run, see [VIEWING LOOP RUN RESULTS](https://help.testim.io/docs/loops#section-viewing-loop-run-results).

![](https://files.readme.io/5d8487f-Testim_Image_033_r.png "Testim Image 033_r.png")

### Try it yourself

Click [here](https://app.testim.io/#/project/GYXR2qZC/branch/master/test/ZWStqQOFst) to open a sample test which includes a **For each item** loop. Try running the test and adjusting the loop configuration.

## Configuring a “Loop for” Loop

A **Loop for** loop (i.e. a for loop) allows you to run the same set of actions/validations a specified number of times. This value can be set to a *number* or a *parameter* with a number value.

:fa-arrow-right: **To configure a “Loop for” loop: where the value is a number:**

1. Choose a group step which contains the steps you want to include in the loop.

> 📘
>
> Group steps can be identified by the Group icon (a picture of a folder) in the upper left-hand corner of the step.

2. Hover over the group step and then click on the **Show Properties** (:fa-cog:) icon. The **Group Properties** panel opens on the right-hand side.

![](https://files.readme.io/b4bc73a-Capture3.PNG "Capture3.PNG")

3. In the **Group Properties** panel, click on **Repeat group**.

![](https://files.readme.io/6d63491-Testim_Image_006_r.png "Testim Image 006_r.png")

4. Select the **Loop for** radio button. The **Value to loop for** field opens.

![](https://files.readme.io/fb2dc35-Testim_Image_007.png "Testim Image 007.png")

![](https://files.readme.io/182470c-Testim_Image_008.png "Testim Image 008.png")

5. Enter a value for the number of times you want these steps to be looped through.

> 📘
>
> The maximum number of iterations allowed is 99.

6. If you would like to adjust the settings for how long Testim checks before declaring a condition to be true or false, use the procedure described in [Advanced Condition Settings](https://help.testim.io/docs/advanced-conditions-settings).

The loop is added to the step as indicated by the **loop** icon shown on the group step tile. Whenever you run this test, the loop process will run. To learn how to view the results of the run, see [VIEWING LOOP RUN RESULTS](https://help.testim.io/docs/loops#section-viewing-loop-run-results).

![](https://files.readme.io/a37cc8d-Testim_Image_034.png "Testim Image 034.png")

:fa-arrow-right: **To configure a “Loop for” loop: where the value is a parameter:**

1. Choose a group step which contains the steps you want to include in the loop.

> 📘
>
> Group steps can be identified by the Group icon (a picture of a folder).

2. Hover over the arrow to the left of the group.

![](https://files.readme.io/fecc504-Testim_110a.png "Testim 110a.png")

The action options are displayed.

<Image align="center" width="smart" src="https://files.readme.io/c18755c-Testim_111a_r.png" />

3. Click on the **"M"** (Testim predefined steps).\
   The Predefined steps menu opens.

<Image align="center" width="smart" src="https://files.readme.io/cec147c-Testim_034_r.png" />

4. Click on **Actions**.\
   The Actions section expands.

<Image align="center" width="smart" src="https://files.readme.io/988d6c6-Testim_079_r.png" />

5. Scroll down through the menu and select **Add custom action**.

> 📘
>
> Alternatively, you can use the search box at the top of the menu to search for **Add custom action**.

The **Add Step** window opens.\
For more information about adding custom actions, see [Creating a Custom Action](https://help.testim.io/docs/custom-validations-and-actions#section-creating-a-custom-action).

![](https://files.readme.io/967959b-Testim_Image_013_r.png "Testim Image 013_r.png")

6. In the **Enter a name for the new step** field, enter a (meaningful) name for this step.
7. If this is a shared step (to be made available to reuse in this and other tests), keep the box next to **Shared step** selected. This is the default. Otherwise, deselect it.\
   For more information about shared steps, see [Reuse](https://help.testim.io/docs/reuse).
8. Click **Create Step**.\
   The editor opens, and the **Custom Action Properties** panel opens on the right-hand side.

![](https://files.readme.io/631c1dc-Testim_Image_017.png "Testim Image 017.png")

9. Enter the appropriate code to pass the parameter you are exporting to the group step. (For example: exportsTest.number = 2;) For more information about exporting parameters, see [Exports Parameters](https://help.testim.io/docs/exports-parameters#section-adding-export-parameter).\
   Note: The maximum number of iterations allowed is 99.
10. Optionally edit the properties in the **Custom Action Properties** panel.

* **Description** - Change the description of the step.
* **+PARAMS** - Add JavaScript or HTML parameters. For more information, see [Parameters in custom JavaScript steps](https://help.testim.io/docs/parameters-in-custom-javascript-steps).
* **When this step fails** - Specify what should happen if the step has failed.
* **When to run step** - Specify when this step should be included in the test. Conditions may include the existence of an element/element text, or a custom JS function.
* **Override timeout** - Keep waiting until the refresh occurs even after timeout.

11. Click the **back arrow** to return to the main editor window.

![](https://files.readme.io/296bcee-Testim_Image_018_r.png "Testim Image 018_r.png")

12. Hover over the group step and then click on the **Show Properties** (:fa-cog:) icon. The **Group Properties** panel opens on the right-hand side.

![](https://files.readme.io/729e357-Capture2_r.png "Capture2_r.png")

13. In the **Group Properties** panel, click on **Repeat group**.

![](https://files.readme.io/ade40f3-Testim_Image_006_r.png "Testim Image 006_r.png")

14. Select the **Loop for** radio button. The **Value to loop for** field opens.

![](https://files.readme.io/a01813c-Testim_Image_007.png "Testim Image 007.png")

![](https://files.readme.io/5227e8f-Testim_Image_008.png "Testim Image 008.png")

15. Enter the parameter you used in Step 7 (above). (For example, **number**).
16. If you would like to adjust the settings for how long Testim checks before declaring a condition to be true or false, use the procedure described in [Advanced Condition Settings](https://help.testim.io/docs/advanced-conditions-settings).

The loop is added to the step as indicated by the **loop** icon shown on the group step tile. Whenever you run this test, the loop process will run. To learn how to view the results of the run, see [VIEWING LOOP RUN RESULTS](https://help.testim.io/docs/loops#section-viewing-loop-run-results).

![](https://files.readme.io/0875ae1-Testim_Image_035_r.png "Testim Image 035_r.png")

### Try it yourself

Click [here](https://app.testim.io/#/project/GYXR2qZC/branch/master/test/oojAc9nzab) to open a sample test which includes a “Loop by Number” for loop and a “Loop by Parameter” for loop. Try running the test and practice adjusting the configuration.

## Configuring a “Custom” loop

There are times that you may want to create loops that are based on more than just validating that an element is visible or that specific text exists. You may want to check an element’s value or create more complex conditions. The **Custom** loop option enables you to do this by creating conditions for your loop defined as JavaScript steps.\
For example, if you would like to check the URL in order to identify whether or not you are on the login page, you could use the following custom condition in your loop:

```text
return loginButton.innerText === 'LOG IN';
```

You can also define HTML or JavaScript parameters and then refer to these parameters in the step. For example, you can select an HTML element such as a button and then create a condition to check the text on that button.

:fa-arrow-right: **To configure a “Custom" loop:**

1. Choose a group step which contains the steps you want to include in the loop.

> 📘
>
> Group steps can be identified by the Group icon (a picture of a folder) in the upper left-hand corner of the step.

> 🚧
>
> If you will be defining an HTML element as a parameter in Step 6 (below), you first must open your AUT by doing the following:
>
> 1. Hover over the **> (arrow symbol)** to the left of your group step.
> 2. Click on the **Toggle Breakpoint** button.
> 3. Click on the **Play Scenario** button, to run the test until the breakpoint.

2. Hover over the group step and then click on the **Show Properties** (:fa-cog:) icon. The **Group Properties** panel opens on the right-hand side.

![](https://files.readme.io/4409611-Capture_07.PNG "Capture 07.PNG")

3. In the **Group Properties** panel, click on **Repeat group**.

![](https://files.readme.io/b67bf7a-Testim_Image_037_r.png "Testim Image 037_r.png")

4. Select the **Custom** radio button.

![](https://files.readme.io/72e1145-Testim_Image_042.png "Testim Image 042.png")

5. The **Set condition** window opens.

![](https://files.readme.io/5b61591-Testim_Image_043.png "Testim Image 043.png")

6. If you would like to use parameters for your custom loop, define the parameters as follows:
   * In the right-hand pane, click the **+ PARAMS** button.
   * **JS parameter**: If you would like to add a JavaScript parameter, select **JS** from the dropdown list and type in the JavaScript parameter.
   * **HTML parameter**: If you would like to define an HTML element as a parameter, select **HTML** from the dropdown list. The browser opens, displaying the relevant webpage for this step. Do the following:
     * In the AUT window, hover your mouse on the relevant element and then click on it to select it. The selected element is shown in the **Target element** box in the **Properties** panel.
   * The selected element is automatically named "param" or “element” (depending on whether you chose a JS parameter or HTML element parameter). To assign a relevant name to the parameter/element, click on the **edit** icon and enter the desired name.

![](https://files.readme.io/6f45634-Testim_Image_045.png "Testim Image 045.png")

7. In the function text box, type in the desired JavaScript condition. If you have defined parameters, you can refer to those parameters in your JavaScript condition.

> 📘
>
> If you are using DOM selectors other than HTML parameters (e.g. jQuery), then empty arrays are truthy, so you need to use `$(<query>)`.length instead of `$(<query>)`.

8. If you would like to override the default timeout setting (30000 ms), click on the **Override timeout** button in the Custom Step **Properties** pane, and enter the desired timeout limit.

![](https://files.readme.io/32e2c33-Testim_Image_047.png "Testim Image 047.png")

9. Click the **back arrow** to return to the main Editor window.

![](https://files.readme.io/1872b2e-Testim_Image_048_r.png "Testim Image 048_r.png")

10. If you would like to adjust the settings for how long Testim checks before declaring a condition to be true or false, use the procedure described in [Advanced Condition Settings](https://help.testim.io/docs/advanced-conditions-settings).

> 🚧
>
> If you opened your AUT to define an HTML element as a parameter, click on the **Toggle Breakpoint** button before your group step to remove the breakpoint.

The loop is added to the step as indicated by the **loop** icon shown on the group step tile. Whenever you run this test, the loop process will run. To learn how to view the results of the run, see [VIEWING LOOP RUN RESULTS](https://help.testim.io/docs/loops#section-viewing-loop-run-results).

![](https://files.readme.io/5de7f77-Testim_Image_050.png "Testim Image 050.png")

## Using the Loop Iterator Parameter

TESTIM\_ITERATOR is an out-of-the-box parameter that allows you to keep track of and use the value of the current loop iteration. Each time a loop is run, the value of TESTIM\_ITERATOR increases by one. The following are some examples of how you can use TESTIM\_ITERATOR.

* Example 1 – using the value of the current loop iteration in a step of a test
* Example 2 – designate the number of times to repeat a loop by using the value of the current loop iteration in the conditions of a loop step

### Example 1

You can use TESTIM\_ITERATOR in a step of your test that is within a loop. The value of the current iteration of the loop will be used when the step is run.\
The following procedure explains how to use TESTIM\_ITERATOR for text validation in a step within a “For each item” loop.

:fa-arrow-right: **To use the value of the current loop iteration in a step:**

1. Choose a group step which contains the step for which you would like to use the TESTIM\_ITERATOR.

> 📘
>
> Group steps can be identified by the Group icon (a picture of a folder).

2. Double-click on the group tile to open the group.

![](https://files.readme.io/63a05a7-Testim_Loops_Image_003_r.png "Testim Loops Image 003_r.png")

3. Hover over a step where you want to use the iteration value (e.g. text validation), and then click on the **Show Properties** (:fa-cog:) icon. The **Properties** panel opens on the right-hand side.

![](https://files.readme.io/ec64a9b-Testim_Loops_Image_007_r.png "Testim Loops Image 007_r.png")

4. Edit the properties based on the type of loop you are editing, including the property based on the loop iterator. (See the explanation of configuring loops above.) For example, if you are editing a “For each item” loop, enter “\<array\_name>e \*\*Expected valu” in the **Expected value** field.

<Image align="center" width="smart" src="https://files.readme.io/2c12efe-Testim_Loops_Image_004.png" />

5. Click the **back arrow** to return to the main Editor window.

![](https://files.readme.io/2182847-Testim_Image_062_r.png "Testim Image 062_r.png")

Whenever you run this test, the loop process will use the value of the loop iteration wherever you indicated using “TESTIM\_ITERATOR” in a step. To learn how to view the results of the run, see [VIEWING LOOP RUN RESULTS](https://help.testim.io/docs/loops#section-viewing-loop-run-results).

### Example 2

You can use TESTIM\_ITERATOR to define the conditions of a loop step, which will determine the number of times to repeat the loop.\
The following procedure explains how to run a test that uses TESTIM\_ITERATOR and the length of an array to set the loop to run once for each array element.

:fa-arrow-right: **To create a loop condition using an array and TESTIM\_ITERATOR:**

1. Choose a group step which contains the steps you want to include in the loop.

> 📘
>
> Group steps can be identified by the Group icon (a picture of a folder).

2. Hover over the arrow to the left of the group.

![](https://files.readme.io/1945b88-Testim_112a.png "Testim 112a.png")

The action options are displayed.

<Image align="center" width="smart" src="https://files.readme.io/d5d3d87-Testim_113a_r.png" />

3. Click on the **"M"** (Testim predefined steps).\
   The Predefined steps menu opens.

<Image align="center" width="smart" src="https://files.readme.io/8512e3c-Testim_034_r.png" />

4. Click on **Actions**.\
   The Actions section expands.

<Image align="center" width="smart" src="https://files.readme.io/56ede45-Testim_079_r2.png" />

5. Scroll down through the menu and select **Add custom action**.

> 📘
>
> Alternatively, you can use the search box at the top of the menu to search for **Add custom action**.

For more information about adding custom actions, see [Creating a Custom Action](https://help.testim.io/docs/custom-validations-and-actions#section-creating-a-custom-action).\
The **Add Step** window opens.

![](https://files.readme.io/61f003a-Testim_Image_019_r.png "Testim Image 019_r.png")

6. In the **Enter a name for the new step** field, enter a (meaningful) name for this step.
7. If this is a shared step (to be made available to reuse in this and other tests), keep the box next to **Shared step** selected. This is the default. Otherwise, deselect it.\
   For more information about shared steps, see [Reuse](https://help.testim.io/docs/reuse).
8. Click **Create Step**.\
   The condition editor opens, and the **Custom Action Properties** panel opens on the right-hand side.

![](https://files.readme.io/372d6d8-Testim_Image_056.png "Testim Image 056.png")

9. Enter the appropriate code to create your array. (For example: exportsTest.destinations = lagstaff", "Sant Cugat Del Valles", "Shaheying"];) For more information about ex;) For more information about exporting parameters, see [Exports Parameters](https://help.testim.io/docs/exports-parameters#section-adding-export-parameter).
10. Optionally edit the properties in the **Custom Action Properties** panel.

* **Description** - Change the description of the step.
* **+PARAMS** - Add JavaScript or HTML parameters. For more information, see [Parameters in custom JavaScript steps](https://help.testim.io/docs/parameters-in-custom-javascript-steps)
* **When this step fails** - Specify what should happen if the step has failed.
* **When to run step** - Specify when this step should be included in the test. Conditions may include the existence of an element/element text, or a custom JS function.
* **Override timeout** - Keep waiting until the refresh occurs even after timeout.

11. Click the **back arrow** to return to the main Editor window.

![](https://files.readme.io/16fd5ad-Testim_Image_057.png "Testim Image 057.png")

12. Hover over the group step and then click on the **Show Properties** (:fa-cog:) icon. The **Group Properties** panel opens on the right-hand side.

![](https://files.readme.io/1881828-Capture_16_r.png "Capture 16_r.png")

13. In the **Group Properties** panel, click on **Repeat group**.

![](https://files.readme.io/8874ec3-Testim_Image_058_r.png "Testim Image 058_r.png")

14. Select the **Custom** radio button. The **Set condition** window opens.

![](https://files.readme.io/a65143b-Testim_Image_042.png "Testim Image 042.png")

![](https://files.readme.io/502cfab-Testim_Image_043.png "Testim Image 043.png")

15. In the **function** text box, type in the desired JavaScript condition using TESTIM\_ITERATOR based on the array you just created, for example “return TESTIM\_ITERATOR \< destinations.length;”.\
    If you have defined parameters, you can refer to those parameters in your JavaScript condition.

> 📘
>
> If you are using DOM selectors other than HTML parameters (e.g. jQuery), then empty arrays are truthy, so you need to use `$(<query>)`.length instead of `$(<query>)`.

16. If you would like to override the default timeout setting (30000 ms), click on the **Override timeout** button in the Custom Step **Properties** pane, and enter the desired timeout limit.

![](https://files.readme.io/aaa1cab-Testim_Image_047.png "Testim Image 047.png")

17. Click the **back arrow** to return to the main Editor window.

![](https://files.readme.io/5d3577d-Testim_Image_059_r.png "Testim Image 059_r.png")

18. The loop is added to the step as indicated by the **loop** icon shown on the group step tile. Whenever you run this test, the loop process will loop over the contents in the array using the value of TESTIM\_ITERATOR. To learn how to view the results of the run, see [VIEWING LOOP RUN RESULTS](https://help.testim.io/docs/loops#section-viewing-loop-run-results).

![](https://files.readme.io/6ad3321-Testim_Loops_Image_002_r.png "Testim Loops Image 002_r.png")

### Try it yourself

Click [here](https://app.testim.io/#/project/GYXR2qZC/branch/master/test/klrbUhXahs) to open a sample test in which the “Loop iterator” is used. Try running the test, and practice adjusting the configuration.

## Viewing Loop Run Results

After running your test, the number of iterations the loop step was run is shown within the loop icon in the loop step.

<Image align="center" width="smart" src="https://files.readme.io/87c8a8a-Testim_Loops_Image_006_r.png" />

You can go through each iteration and look at each of the results separately.\
There are two methods for viewing loop results:

* In the properties pane for the group step, or
* By opening up the group step and viewing the iterations within the group. If one of the iterations failed, then when you open the group, you will be taken directly to the failed iteration.

:fa-arrow-right: **To view Run Results from the group’s properties:**

1. Hover over the group step and then click on the **Show Properties** (:fa-cog:) icon. The **Group Properties** panel opens on the right-hand side.

![](https://files.readme.io/2f8cb07-Capture_08.PNG "Capture 08.PNG")

2. In the **Group Properties** panel, click on the iteration you would like to view. The group steps for the specified iteration are shown in the editor.

![](https://files.readme.io/cfe58d9-Testim_Image_051.png "Testim Image 051.png")

![](https://files.readme.io/88e5c3a-Testim_Image_052_r.png "Testim Image 052_r.png")

3. Hover over the step you would like to view, and click on the **Show Screenshot** icon. The details for the specified step are shown.

![](https://files.readme.io/9cd383d-Testim_Loops_Image_009_r.png "Testim Loops Image 009_r.png")

![](https://files.readme.io/1d49a1b-Testim_Image_053.png "Testim Image 053.png")

4. Click the **right arrow** to view the results of the next step in that group.

![](https://files.readme.io/be771d0-Testim_Loops_Image_010.png "Testim Loops Image 010.png")

5. Click the **X** to return to the previous screen.

![](https://files.readme.io/2c78c61-Testim_Loops_Image_011.png "Testim Loops Image 011.png")

:fa-arrow-right: **To view Run Results from inside the group:**

1. Double-click on the group tile to open the group.
2. Click on the Iteration dropdown list, and choose the iteration you would like to view.

![](https://files.readme.io/500e31a-Testim_Image_054_r.png "Testim Image 054_r.png")

3. Hover over the step you would like to view, and click on the **Show Screenshot** icon. The details for the specified step are shown.

![](https://files.readme.io/1f78878-Capture_09_r.png "Capture 09_r.png")

![](https://files.readme.io/82a4cd9-Testim_Image_053.png "Testim Image 053.png")

4. Click the **right arrow** to view the results of the next step in that group.

![](https://files.readme.io/6df5267-Testim_Loops_Image_010.png "Testim Loops Image 010.png")

5. Click the **X** to return to the previous screen.

![](https://files.readme.io/80ecbe3-Testim_Loops_Image_011.png "Testim Loops Image 011.png")