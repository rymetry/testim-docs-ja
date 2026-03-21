# Group context

Learn how to maximize reuse by assigning entire groups to different elements of the page and across pages

The **Group Context** feature enables you to run groups of steps on other, slightly different, elements (contexts), without the need to manually reconfigure the steps. When setting a context for a group step, the locators in its steps are automatically and dynamically changed to fit the new context.\
For example, if you created a group of steps for booking a reservation to Madan and you want to run that group for booking a reservation to Shenji, instead of manually changing the step details, Group Context will automatically make the appropriate adjustments for you.

> 📘
>
> For background information about *Groups*and* Shared Groups*, see [Groups](https://help.testim.io/docs/groups).

Examples of when you may want to use this feature include:

* **Repeating elements** – when you have similar elements repeating in the page and want to execute the same steps on each of them.
* **Table rows** – when you want to execute the same steps on each row in a table.
* **Tabs or frames** – when you want to use a group of steps, which were recorded on one tab, in another tab. In this case you should group all the steps that involve using the second tab in a group and then set the group context by following the instructions below.

> 📘
>
> In case of multi tab application, when a step is recorded, the specific tab (e.g., tab #3) is stored. When the step is played, as part of test run, the Testim application looks for the tab based on two parameters: tab number and tab URL. The decision to run on a specific tab is based on these two parameters – so, the actual playing can result in a different tab number (e.g. tab #2) if both tabs URLs are identical.

## Setting a context for a group

When assigning custom context, it is recommended to assign the largest element in the DOM (e.g., the Body element). For detailed instructions see - [Selecting the largest element in the DOM](https://help.testim.io/docs/group-context#selecting-the-largest-element-in-the-dom). The following procedure assumes that you have already created a shared group step that you would like to reuse in a new context. The procedure for creating a group is described [here](https://help.testim.io/docs/groups#creating-a-group).\
:fa-arrow-right: **To set a context for a group:**

![](https://files.readme.io/3d67f16-Jan-31-2021_08-33-20.gif "Jan-31-2021 08-33-20.gif")

1. Hover over the **> (arrow symbol)** where you want to add your step.

![](https://files.readme.io/8acff4c-Testim_115a.png "Testim 115a.png")

The action options are displayed.

![](https://files.readme.io/014defd-Testim_116a.png "Testim 116a.png")

2. Click on the **folder** (Shared steps).\
   The Shared steps menu opens.

<Image align="center" width="smart" src="https://files.readme.io/ab52494-Testim_070_r.png" />

3. Select the desired group from the list of existing group steps.\
   The group is added to your test.

![](https://files.readme.io/b9e1760-Testim_117.png "Testim 117.png")

4. Hover over the **> (arrow symbol)** to the left of that group step.\
   The action options are displayed.
5. Click on the **Toggle Breakpoint** button.

<Image align="center" width="smart" src="https://files.readme.io/c007533-Testim_118_r.png" />

6. Click on the **Play Scenario** button, to run the test until the breakpoint.

![](https://files.readme.io/42c85ed-Testim_119a.png "Testim 119a.png")

7. Hover over the group step you just added and click on the **Show Properties** (:fa-cog:) icon.

![](https://files.readme.io/cbec1d6-Testim_001a.png "Testim 001a.png")

The Properties panel opens on the right-hand side.

8. Click the **down arrow** next to Context, and select **Custom**.

<Image align="center" width="smart" src="https://files.readme.io/5c07e48-Testim_002a.png" />

The AUT browser opens.

9. In the AUT browser, identify the relevant element (context) you would like your group to run on, and click on it to select it. It is important to select the largest element in the DOM. For detailed instructions see - [Selecting the largest element in the DOM](https://help.testim.io/docs/group-context#selecting-the-largest-element-in-the-dom)

> 📘
>
> By default, when selecting context for a group, the application will be in "Context selection mode". In this mode the repeating elements on the page will be highlighted to help with the selection. To exit this mode and return to the normal selection mode, click Q on your keyboard.

10. The selected element is shown in the **Target element** box in the Context section of the **Properties** panel.

![](https://files.readme.io/2402cd0-Testim_003.png "Testim 003.png")

The new context is automatically applied to the group step, with no additional need for you to reassign the step.

11. Click on the **Toggle Breakpoint** button to remove the breakpoint.

> 📘
>
> Testim automatically identifies which steps in the group should run on the provided context, and which should run outside of it.

### Selecting the largest element in the DOM

When performing the context selection, select the largest element in the DOM (e.g., Body), so that all the steps will be included in the context.

:fa-arrow-right:**To select the largest element in the DOM:**

1. After selecting the **Custom** option in the **Context** section of the **Properties** panel, press **Q** (on your keyboard) to enter into the **Context selection mode**.
2. On the designated browser tab (for which the group was created) select any element on the page.
3. On your keyboard, press the **Up** arrow multiple times until you reach the largest element in the DOM (e.g., Body).
4. When you have reached the body element, press **Enter** to select it.

<Image align="center" src="https://files.readme.io/268664d-groupcontext.gif" />

### Try it yourself

Click [here](https://app.testim.io/#/project/GYXR2qZC/branch/master/test/HGAvmbTcfT) to view a test where a group step has been applied to more than one context. Use the shared group step “book” to create a new booking for a different destination in the app by changing the Context of the group step.