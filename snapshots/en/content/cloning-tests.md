# Cloning tests

Clone tests to the current or other project

You can clone tests within the same project or clone them to another project to which you are a member, even if the project is not in the currently selected Company. The new cloned test will have “Clone of” added as a prefix to both the description and the name.

## What happens after cloning

<br />

<Table align={["left","left","left"]}>
  <thead>
    <tr>
      <th />

      <th>
        Cloning to another project
      </th>

      <th>
        Cloning to same project
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        Branch settings
      </td>

      <td>
        Cloned to the master branch of the target project
      </td>

      <td>
        The same branch as the original test.
      </td>
    </tr>

    <tr>
      <td>
        Shared steps
      </td>

      <td>
        Will become unshared and duplicated. If multiple tests use the same shared step, each test will receive its own copy of the step, breaking any links between them.
      </td>

      <td>
        Clones the shared step without duplicating.
      </td>
    </tr>

    <tr>
      <td>
        Test configuration
      </td>

      <td>
        Will reset to default based on the project type:

        * Mobile Web - Default will be set to iPhone 6/7/8.
        * Web and Mobile Native - The configuration will be labeled as “untitled” with values appropriate for the project type.
      </td>

      <td>
        Clones the test configuration.
      </td>
    </tr>

    <tr>
      <td>
        Mobile native apps
      </td>

      <td>
        Tests with library apps will be cloned without the app. You will have to assign the app manually. Tests with apps from a device will keep the app details.
      </td>

      <td>
        Clones the native apps without the need for reassignment.
      </td>
    </tr>

    <tr>
      <td>
        Test owner
      </td>

      <td>
        Test owner will not be assigned to the test.
      </td>

      <td>
        Remains with the same test owner
      </td>
    </tr>

    <tr>
      <td>
        Test labels
      </td>

      <td>
        Will be copied without changes
      </td>

      <td>
        Will be copied without changes
      </td>
    </tr>

    <tr>
      <td>
        Test revisions
      </td>

      <td>
        Will not be cloned; the test will be created with a new single revision
      </td>

      <td>
        Will not be cloned; the test will be created with a new single revision
      </td>
    </tr>

    <tr>
      <td>
        Latest test results
      </td>

      <td>
        Will not be cloned
      </td>

      <td>
        Will not be cloned
      </td>
    </tr>

    <tr>
      <td>
        Step parameters
      </td>

      <td>
        Will be copied without changes
      </td>

      <td>
        Will be copied without changes
      </td>
    </tr>

    <tr>
      <td>
        Test data
      </td>

      <td>
        Will be copied without changes
      </td>

      <td>
        Will be copied without changes
      </td>
    </tr>

    <tr>
      <td>
        Network capture options
      </td>

      <td>
        Will be copied without changes
      </td>

      <td>
        Will be copied without changes
      </td>
    </tr>

    <tr>
      <td>
        Mock-network files
      </td>

      <td>
        Will be copied without changes
      </td>

      <td>
        Will be copied without changes
      </td>
    </tr>
  </tbody>
</Table>

<br />

:fa-arrow-right:**To clone a test:**

1. On the **Test Library** screen (Test List > Tests), click on the test name to select it. You can select multiple tests by holding down the **CTRL/CMD key** and then clicking on each of the desired tests. If there are no folders in your Test Library, you can also select all of your tests by holding down the **CTRL/CMD key + A** on the keyboard.
2. Click the **Clone** button at the top.

   <Image align="center" src="https://files.readme.io/0d3e5cbe6becad9725ac73084aa9f8feb6b68b262cc08373aa5796b7e53543de-clonetop.png" />

   You can also right-click a test and select the **Clone** option.

   <Image align="center" src="https://files.readme.io/7baf98b9a96ee916fb032c02822cf545b9198acff09fd83a1cda428722132882-clonerightclick.png" />
3. In the **Clone Test** dialog, select the **Target Project**. The current project is selected by default.

   <Image align="center" width="-4px" src="https://files.readme.io/cd000a2ae1b7abb13f5ccfb10364a589b394dd5a4a1307fd837f3de7e8d3dcb4-image_1.png" />
4. Under **Tests to be cloned**, select that tests that you would like to clone.
5. Click **Confirm**.\
   The tests are cloned to the selected project. Testim will name the test using the original test's name. For example: "Copy of \[original test name]".