# Groups

Combine several steps into a group and start making use of reuse!

"Reuse" is one of the more basic principles of programming. Instead of copy-pasting the same twenty lines of code over and over, you write them ONCE inside a method and call it whenever you need to.

This principle works precisely the same in the world of automated testing, by grouping steps together and then making these groups available to be called from other tests in your project. Even if you don’t share groups between tests, you can still improve the organization of your tests, by using them to reduce the number of steps presented in the Visual Editor.

In addition to sharing groups, there are some steps that can be shared without the need to group them with other steps. For more information, see [Shareable Steps](https://help.testim.io/docs/shareable-steps).

## Creating a Group

:fa-arrow-right: To create a group:

1. Select multiple steps by holding the **Ctrl** (windows) or **Command** (mac) key while left-clicking on the steps, OR marking an area around the steps.
2. While the steps are selected, click **Add Group**.

<Image align="center" width="smart" src="https://files.readme.io/9bdc970-Screen_Shot_2021-04-07_at_8.14.41.png" />

3. In the **Group Name** field, enter a name for the group.
4. If you want to make this group available to other tests in your project, select the **Shared Group** checkbox.
5. If you want to enable Auto-Grouping, select the **Apply auto group on matching steps** checkbox and follow the instructions in [Auto-grouping](https://help.testim.io/docs/auto-grouping).
6. Click **Confirm**.\
   The steps are grouped into a single group step. If the group is shared between tests, a **Shared** indicator icon is displayed.

![](https://files.readme.io/86a6a5f-Screen_Shot_2021-04-07_at_8.16.06.png "Screen Shot 2021-04-07 at 8.16.06.png")

7. To view the individual steps within the group, double-click the group.

![](https://files.readme.io/053d9d4-Screen_Shot_2021-12-13_at_11.27.08.png "Screen Shot 2021-12-13 at 11.27.08.png")

## Specifying Group Properties (optional)

On the Group Step, click the **Show Properties** (:fa-cog:) icon to open the **Group Properties** pane.

<Table align={["left","left","left"]}>
  <thead>
    <tr>
      <th>
        Property
      </th>

      <th>
        Description
      </th>

      <th>
        Comment
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        Shared step name
      </td>

      <td>
        The name of the group.
      </td>

      <td>
        Changing the name will modify all instances.
      </td>
    </tr>

    <tr>
      <td>
        Description
      </td>

      <td>
        The group’s description.
      </td>

      <td>
        Can be different for each instance of the group.
      </td>
    </tr>

    <tr>
      <td>
        Replace with clone
      </td>

      <td>
        Creates a copy of the group that can be modified without modifying the other instances.
      </td>

      <td />
    </tr>

    <tr>
      <td>
        Params
      </td>

      <td>
        See - [Parameters for groups](https://help.testim.io/docs/parameters-for-groups)
      </td>

      <td>
        Changing the name will modify all instances.
      </td>
    </tr>

    <tr>
      <td>
        When this step fails
      </td>

      <td>
        What occurs if the group step fails
      </td>

      <td>
        Changing the name will modify all instances.
      </td>
    </tr>

    <tr>
      <td>
        When to run step
      </td>

      <td>
        Creates a breakpoint where a condition can be specified when to run this group step.\
        To learn more about Conditions, see -\
        [Conditions](https://help.testim.io/docs/conditions)
      </td>

      <td>
        Changing the name will modify all instances.
      </td>
    </tr>

    <tr>
      <td>
        Repeat group
      </td>

      <td>
        Creates a loop based on conditions. To learn more about loops, see -\
        [Loops](https://help.testim.io/docs/loops)
      </td>

      <td>
        Changing the name will modify all instances.
      </td>
    </tr>

    <tr>
      <td>
        Context
      </td>

      <td>
        Assigns entire groups to different elements of the page and across pages. To learn more, see -\
        [Group context](https://help.testim.io/docs/group-context)
      </td>

      <td>
        Can be different for each instance of the group.
      </td>
    </tr>
  </tbody>
</Table>

## Reusing a Group

You can reuse a group within the same test and if the group is a shared group, you can reuse it in other tests within your project.\
:fa-arrow-right: **To reuse a group within the same test:**

1. Hover over the **> (arrow symbol)** between the two steps.

![](https://files.readme.io/d67e999-Screen_Shot_2021-04-07_at_8.23.10.png "Screen Shot 2021-04-07 at 8.23.10.png")

The action options are displayed.

<Image align="center" width="80%" src="https://files.readme.io/e8714ed-Untitled.png" />

2. Click on the **folder** (Shared steps).\
   The Shared steps menu opens.

<Image align="center" width="80%" src="https://files.readme.io/f27f1ea-Testim_070.png" />

3. Click the group name to add it as a new step.\
   The group is added as a step in the Editor.

> 📘
>
> You can use the search box to help you find your group.

![](https://files.readme.io/ed12ece-Jan-29-2021_05-44-08.gif "Jan-29-2021 05-44-08.gif")

4. If the step expects you to pass parameters, don't forget to assign them by editing the param values (to learn more, see [Parameters](https://help.testim.io/docs/parameters) section). Each step passes its own parameters (e.g. you could call the "login" with "David" as params in one test, and with "John" in another).

> 📘 Note
>
> It is also possible to copy/cut and paste the group. See [Editing Tests](https://help.testim.io/docs/editing-your-tests).

:fa-arrow-right: **To reuse a group in another test:**

1. In the other test, hover over the **> (arrow symbol)** between two steps, or the **+ (plus symbol)** after the last step.

![](https://files.readme.io/dd8aa04-Testim_076b.png "Testim 076b.png")

The action options are displayed.

<Image align="center" width="80%" src="https://files.readme.io/f510425-Testim_072a.png" />

2. Click on the **folder** (Shared steps).\
   The Shared steps menu opens.

<Image align="center" width="80%" src="https://files.readme.io/caf4176-Testim_070.png" />

3. Click the group name to add it as a new step.\
   The group is added as a step in the Editor.

> 📘
>
> You can use the search box to help you find your group.

## Modifying Groups

You can modify an existing group and if this is a shared group, the modification will apply across all tests that use the group.

> 📘 Note
>
> if it's a shared group, but you don’t want the changes to apply to the other tests, you can use the **Replace with clone** feature and then modify this group only.

:fa-arrow-right: **To modify a group:**

1. Access the group details, by doing one of the following:

* In the test that includes the group, double-click the group step.
* If it's a shared group, you can go to **Test List > Shared Steps**, hover over the group and click **See all tests using this shared step**. Click one of the tests in the list and then in the test, double-click the group step.

2. In the group details screen you can modify the test by:

* **Recording additional steps at the beginning/end of the existing steps** -  to add additional steps, you will need the have the AUT opened in the state of the last step (before adding the new steps). To do that, you need to:
  * Specify a breakpoint in the last step (before the new steps)
  * Run the test again.
  * stop the test.
  * Go into the **Group Details** and begin recording the new steps as shown below.

![](https://files.readme.io/5ebf6b1-record.gif "record.gif")

* **Recording additional steps in the middle of the existing steps.** - you will need the have the AUT opened in the state of the last step and then record the additional steps as shown below:

![](https://files.readme.io/0265592-Jan-31-2021_05-55-41.gif "Jan-31-2021 05-55-41.gif")

* **Reordering or deleting steps** - you can reorder the steps by dragging them to the desired location. Delete steps by selecting them and then pressing DELETE.

![](https://files.readme.io/58446f7-MyVideo_9.gif "MyVideo_9.gif")

> 📘 Tip
>
> After modifying the group you may want to change its name in the **Properties** pane to reflect its new functionality.

3. To get back to the test either click the Back button or on the name of the test on the top left.

## Removing the reuse option

You can remove the reuse (share) option from a group without deleting it. This does not delete it from the existing tests, just removes the option to reuse it and add it to tests again.\
:fa-arrow-right: **To remove the reuse option:**

1. Go to **Test Lists > Shared Steps**
2. Select the group
3. Click the **Hide** button, either from the top menu or the context menu\
   This will hide the selected shared step(s) from the shared library. Steps that have already been used in your tests will not be affected.

![](https://files.readme.io/35bff41-Untitled.png "Untitled.png")

## Changing one instance of a Shared Group by replacing it with a clone

Changing shared group in one place will change it in all instances of the branch. Although you can send different parameters to different instances of the shared group, sometimes you need to make changes only in a specific instance (i.e. in a specific test). For this purpose, you will want to clone the group.

:fa-arrow-right: **To clone a group**

1. Edit the shared group that you wish to clone.
2. In the **Properties** panel, click **Replace with a clone**.

![](https://files.readme.io/4195e49-replaceclone.png "replaceclone.png")

3. Enter a new name for the group.

![](https://files.readme.io/96ed6f2-replaceclone2.PNG "replaceclone2.PNG")

4. Decide whether the new step will also be defined as shared.
5. Click **Confirm**.\
   The group and all its steps will be cloned. Shared steps and nested steps will remain shared.