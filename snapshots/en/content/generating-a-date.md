# Generating a Date

Creating a step to generate a date

Tests that involve dates and times or have a behavior, which is dependent on a date, can be tricky, because the date input format has to match the field's format, the local date/time of the machine may vary from the server, etc.. Testim allows you to easily create a step that will generate a date according to predefined properties. The generated date can be then used to populate a field. Through these properties you can specify the date format, which clock/time zone to use (e.g. browser local clock, UTC) and even account for time differences.

The step can be added to an existing test at any point (e.g. as a last step, in the middle...).

# Adding a Generate Date step

:fa-arrow-right: **To add a Generate date step:**

![894](https://files.readme.io/a09d76d-Jan-31-2021_06-26-26.gif "Jan-31-2021 06-26-26.gif")

1. Hover over the **> (arrow symbol)** between two steps, or the **+ (plus symbol)** after the last step.

![3665](https://files.readme.io/46fca20-Testim_082b.png "Testim 082b.png")

The action options are displayed.

<Image width="80%" src="https://files.readme.io/f22a0db-Testim_083a.png" />

2. Click on the **"M"** (Testim predefined steps).\
   The Predefined steps menu opens.

<Image width="80%" src="https://files.readme.io/bb5ad0a-Testim_034.png" />

3. Click on **Actions**.\
   The Actions section expands.

<Image width="80%" src="https://files.readme.io/981810c-Testim_079.png" />

4. Scroll down through the menu and select **Generate date**.

> 📘 Alternatively, you can use the search box at the top of the menu to search for **Generate date**.

A "Generate date" step is added in the Editor.\
5\. On the newly created step, click **Show Properties** (:fa-cog:) and fill in the properties as described below.\
6\. In the **Properties** pane, you can click the **Step Parameters** drop down menu to view the current date that was generated using the current properties settings.

## Generate Date properties

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
        Comments
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        Description
      </td>

      <td>
        The name of the step.
      </td>

      <td />
    </tr>

    <tr>
      <td>
        Variable Name
      </td>

      <td>
        The name of the variable.
      </td>

      <td>
        Default - "dateValue"
      </td>
    </tr>

    <tr>
      <td>
        Date Format
      </td>

      <td>
        Can be any JS date format, you can read more [here](https://day.js.org/docs/en/display/format) about different date's formats.
      </td>

      <td>
        Default - 'YYYY-MM-DD'
      </td>
    </tr>

    <tr>
      <td>
        Time difference
      </td>

      <td>
        The generated date/time can be set to before or after the browser time or UTC (if UTC was selected).\
        Click the measure field (right side) and select the measure (seconds, minutes, etc.).\
        In the value field click up/down to set the value. Positive values are after the browser/UTC time and negative values are before the browser/UTC time.
      </td>

      <td />
    </tr>

    <tr>
      <td>
        Variable Scope
      </td>

      <td>
        The scope in which the variable can be passed:

        * **Local:** allows you to pass parameter between steps in the same scope (i.e. export parameter in a group allows you to pass parameters between steps in the same group).

        * **Test:** allows you to pass parameters between steps and groups in the same test.

        * **Suite:** allows you to pass parameters between tests in the same test suite.
      </td>

      <td />
    </tr>

    <tr>
      <td>
        When this step fails
      </td>

      <td>
        Specify what to do if the step fails.
      </td>

      <td />
    </tr>

    <tr>
      <td>
        When to run step
      </td>

      <td>
        Specify conditions for when to run the step. For more info, see [Conditions](https://help.testim.io/docs/conditions)
      </td>

      <td />
    </tr>
  </tbody>
</Table>

You can see an example of how to use this step [here](https://app.testim.io/#/project/GYXR2qZC/branch/master/test/IrAg1rfldG).