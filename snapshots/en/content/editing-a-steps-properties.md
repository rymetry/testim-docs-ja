# Editing a Step’s Properties

You can edit the Properties of a step after the step has been created. The configurable Properties options vary depending on the type of step that you are editing.

:fa-arrow-right: **To edit the properties of a step:**

1. Hover over the desired step and click on the **Show Properties** (:fa-cog:) icon.

<Image align="center" width="smart" src="https://files.readme.io/3bd689a-properties.png" />

The **Properties** panel opens on the right-hand side.

<Image align="center" src="https://files.readme.io/2958483-2023-10-10_16-17-44.png" />

2. Make the desired changes.\
   The changes are automatically applied to the test.

> ❗️
>
> Before closing the Editor screen, make sure to save all changes by clicking the **Save** button in the header bar.

## Properties Configuration

The list of properties shown in the **Properties** panel varies depending on the type of step that is selected. There are several Properties that are relevant for most types of steps, while others are relevant only for certain specialized types of steps.\
The following table describes how to configure the various Properties with links to more complete documentation of its related features.

<Table align={["left","left","left","left"]}>
  <thead>
    <tr>
      <th>
        Property
      </th>

      <th>
        Related Step Types
      </th>

      <th>
        Description
      </th>

      <th>
        Additional Info
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        **General Properties**
      </td>

      <td />

      <td />

      <td />
    </tr>

    <tr>
      <td>
        Description
      </td>

      <td>
        All
      </td>

      <td>
        This is the editable name for the step. Try to give your steps informative names to make your tests more comprehensible.
      </td>

      <td />
    </tr>

    <tr>
      <td>
        Disable Auto-scroll
      </td>

      <td>
        Recorded steps and validations
      </td>

      <td>
        Finding the target element may require scrolling, even though it wasn’t required when the test was initially recorded. By default, Testim automatically scrolls to elements outside the viewport. Selecting this checkbox disables this feature for this step. Testim will only look within (and will not scroll outside) the viewport for the target element.
      </td>

      <td>
        [Auto scroll](https://help.testim.io/docs/auto-scroll)
      </td>
    </tr>

    <tr>
      <td>
        Element must be visible
      </td>

      <td>
        Recorded steps and validations
      </td>

      <td>
        There are times when the target element exists on a page, but is not visible to the user.  For example, the element might not currently be in the viewport, or its visibility is set as “display: none”. If this box is checked (default), the step will only run if the target element is visible.
      </td>

      <td>
        [Element not visible](https://help.testim.io/docs/why-did-my-test-fail#1-element-not-visible)
      </td>
    </tr>

    <tr>
      <td>
        Error Suffix
      </td>

      <td>
        All
      </td>

      <td>
        Add a custom message as a suffix to the error message that is displayed when the step fails. You can enter a simple string (e.g., 'my custom error’) or you can enter a string that includes parameters (e.g., ‘my custom error’ + `Param1`).
      </td>

      <td>
        [Error Suffix Customization](https://help.testim.io/docs/error-suffix-customization)
      </td>
    </tr>

    <tr>
      <td>
        Override timeout
      </td>

      <td>
        All except *Sleep*  and *Generate Date*
      </td>

      <td>
        The “step timeout” is the time lapse (in milliseconds) which causes Testim to register a fail for a test step. The default time lapse for each step is initially set in the Setup step configuration. Selecting this checkbox allows you to override the default setting for this step and specify a different time lapse value (in milliseconds).\
        **NOTE: Ensure the step timeout exceeds the step's run time. Failed steps will be retried until there's insufficient remaining time for a successful run**
      </td>

      <td />
    </tr>

    <tr>
      <td>
        Target Element
      </td>

      <td>
        Recorded Steps and validations
      </td>

      <td>
        This is the element that was selected in the AUT (application under test) browser (represented by a thumbnail image of the element in the Properties panel) that will be clicked on when this step of the test is run. The target element is editable. The following options are shown when hovering over the thumbnail: *Highlight*, *Reassign*, *Improve*, and *View locators*.
      </td>

      <td>
        [Editing Target Element Properties](https://help.testim.io/docs/editing-target-element-properties)
      </td>
    </tr>

    <tr>
      <td>
        When this step fails
      </td>

      <td>
        All
      </td>

      <td>
        When a step fails, the default behavior is to mark the step with an error and stop the test. You can override this default behavior. The options for this property are:

        * **Mark error & stop** (default) – When this option is selected, a failed step is marked in red, indicating an error. The test will stop and fail.
        * **Mark error & continue** – When this option is selected, a failed step is marked in red, indicating an error. The test will not stop but will still fail.
        * \*Mark warning & continue\*\* – when this option is selected, a failed step is marked in orange, indicating a warning. The test will not stop and will not fail.
      </td>

      <td>
        [Why did my test fail?](https://help.testim.io/docs/why-did-my-test-fail)
      </td>
    </tr>

    <tr>
      <td>
        When to run step
      </td>

      <td>
        All
      </td>

      <td>
        The "when to run step" feature lets you control when a step in your test runs or doesn’t run. The following options can be applied:

        * **Always Ru**n – The step will run whenever you run the test.
        * **Element**– The step will run if the specified element exists (or does not exist) on the page.
        * **Element text** – The step will run if the specified text exists within a specific element.
        * **Custom**– The step will run if an element has a specific value.
        * *Never (skip)* \* – The step will not run.
      </td>

      <td>
        [Conditions](https://help.testim.io/docs/conditions)
      </td>
    </tr>

    <tr>
      <td>
        **Specialized Properties**
      </td>

      <td />

      <td />

      <td />
    </tr>

    <tr>
      <td>
        Add Prefix
      </td>

      <td>
        *Generate random value*
      </td>

      <td>
        Add a prefix string to the value. For example, "User", then all of the values would start with User: User47, User65, User32.
      </td>

      <td>
        [Generate Random Value Step](https://help.testim.io/docs/generating-a-random-value#generate-random-value-step)
      </td>
    </tr>

    <tr>
      <td>
        Add Suffix
      </td>

      <td>
        *Generate random value*
      </td>

      <td>
        Add a suffix string to the value.
      </td>

      <td>
        [Generate Random Value Step](https://help.testim.io/docs/generating-a-random-value#generate-random-value-step)
      </td>
    </tr>

    <tr>
      <td>
        Allow API request retry
      </td>

      <td>
        *Add API action*, *Validate API*
      </td>

      <td>
        Will retry the API request if it fails.
      </td>

      <td>
        [API Validation](https://help.testim.io/docs/api-testing#api-validation)
      </td>
    </tr>

    <tr>
      <td>
        Attribute name
      </td>

      <td>
        *Validate HTML attribute*
      </td>

      <td>
        This is the Attribute name that was entered by the user when the step was initially created. To change the name, click inside the field, and edit the contents.
      </td>

      <td>
        [HTML Attribute Validation](https://help.testim.io/docs/html-attribute-validation)
      </td>
    </tr>

    <tr>
      <td>
        Cookie name
      </td>

      <td>
        *Get Cookie*
      </td>

      <td>
        The Get Cookie step allows you to get cookies in the context of a test directly from the UI. After creating the step, you need to edit the step and provide the name of the cookie you would like to get. To enter or change the name, click inside the field, and edit the contents.
      </td>

      <td>
        [Cookies](https://help.testim.io/docs/cookies)
      </td>
    </tr>

    <tr>
      <td>
        Date format
      </td>

      <td>
        *Generate date*
      </td>

      <td>
        The default format that Testim uses for a Generate date step is 'YYYY-MM-DD'. To change this format, click inside the field, and edit the contents. The format can be any JS date format.
      </td>

      <td>
        [JS Date Formats](https://day.js.org/docs/en/parse/string-format)
      </td>
    </tr>

    <tr>
      <td>
        Expected status
      </td>

      <td>
        *Validate checkbox*, *Validate radio button*
      </td>

      <td>
        This property is applicable when you are validating the checked or unchecked state of a checkbox or radio button. The default setting is **Checked**. To change the setting, click the **Unchecked**radio button. **Note**: Checkbox and radio button validations can be used only on native checkboxes or radio input elements. Custom checkbox implementations that don't use an underlaying input are not supported.
      </td>

      <td>
        [How to Add Checkbox and Radio Button Validation](https://help.testim.io/docs/checkbox-and-radio-button-validation#how-to-add)
      </td>
    </tr>

    <tr>
      <td>
        Expected value
      </td>

      <td>
        *Validate element text*, *Validate CSS property*, *Validate HTML attribute*, *Wait for element text*
      </td>

      <td>
        This is the value that Testim is looking for when this step is run. This value was initially set when the step was created. To change the value, click inside the field, and edit the contents. **Note**: Parameters, regular expressions, and JavaScript expressions can be used in the Expected value field.
      </td>

      <td>
        [Advanced text validation](https://help.testim.io/docs/advanced-text-validations)
      </td>
    </tr>

    <tr>
      <td>
        Extract Mode
      </td>

      <td>
        *Add extract value step*
      </td>

      <td>
        Specifies which data type to extract. By default, the mode is to extract the entire string. You can modify the mode to either extract a number, date or use regular expression to extract just part of the text. Please note that even when extracting Number/Date/Regular Exp the extracted value will be a string.
      </td>

      <td>
        [Extract Text](https://help.testim.io/docs/extract-text)
      </td>
    </tr>

    <tr>
      <td>
        Length
      </td>

      <td>
        *Generate random value*
      </td>

      <td>
        Specify the length of the generated value.
      </td>

      <td>
        [Generate Random Value Step](https://help.testim.io/docs/generating-a-random-value#generate-random-value-step)
      </td>
    </tr>

    <tr>
      <td>
        Native events
      </td>

      <td>
        *Click*
      </td>

      <td>
        The Click step is configured (at the project level) to translate it into either native or non-native events. <br />  **Native events** are typically triggered by user interactions, such as clicking a mouse button or tapping on a touch device. When a native click occurs, the browser handles the event natively, following its built-in event processing pipeline. <br />\_ **Non-Native event** also known as a synthetic or programmatic click, is a click event that is artificially created and dispatched using JavaScript or other programmatic means. Non-native clicks are usually generated by scripts or automation tools to simulate user interactions.<br /> Sometimes a test will fail because even though the “click step” passed, the click wasn’t actually executed. As a possible solution, select or de-select the **Native events**checkbox.
      </td>

      <td />
    </tr>

    <tr>
      <td>
        Pre-step delay (ms)
      </td>

      <td>
        *Validate element not visible*, *Wait for element not visible*
      </td>

      <td>
        In some cases, you want to set a delay time before checking that the element is not visible. For example, you want to make sure that the element does not suddenly appear on the page. By default, no delay is set. To set a delay, select the **Pre-step delay** checkbox, and then set the delay time in milliseconds.
      </td>

      <td>
        [Validate element not visible](https://help.testim.io/docs/validate-element-not-visible)
      </td>
    </tr>

    <tr>
      <td>
        Property name
      </td>

      <td>
        *Validate CSS property*
      </td>

      <td>
        This is the CSS Property name that was entered by the user when the step was initially created. To change the name, click inside the field, and edit the contents.
      </td>

      <td />
    </tr>

    <tr>
      <td>
        Replace with a clone
      </td>

      <td>
        *Add custom action, Add API action, Add custom validation, Validate API, Add network validation, Add custom wait for*
      </td>

      <td>
        If you are editing a shared step, changing it in one place will change it in all instances of the project. To modify the step for a specific test only, click Replace with a clone.
      </td>

      <td>
        [How to change only one instance of a group](https://help.testim.io/docs/reuse#how-to-change-only-one-instance-of-a-group)
      </td>
    </tr>

    <tr>
      <td>
        See old revisions
      </td>

      <td>
        *Add custom action, Add API action, Add custom validation, Validate API, Add network validation, Add custom wait for*
      </td>

      <td>
        Every time you save a test that includes a change, including changes to a shared step, the version of the test before the change is automatically stored. Each of these versions of the test is called a revision. The revision list contains the change message, the name of the user who made the change, and date in which it was made. Revisions gives you the power to always look back at your changes and revert back to an older revision. Click the **See old revisions** link to see the revision list.
      </td>

      <td>
        [Revisions](https://help.testim.io/docs/revisions)
      </td>
    </tr>

    <tr>
      <td>
        Send via web page
      </td>

      <td>
        *Add API action, Validate API*
      </td>

      <td>
        This property is applicable when you are sending HTTP requests or validating values returned from API calls. Keep this option checked if you need the API to also send browser information such as cookies. (They are sent automatically.) Uncheck this option only if you want to send the API call outside the browser context, so that browser-restrictions do not apply to it. (For example, if your API doesn't support CORS.)
      </td>

      <td>
        [API Testing](https://help.testim.io/docs/api-testing)
      </td>
    </tr>

    <tr>
      <td>
        (Shared) step name
      </td>

      <td>
        *Add custom action, Add API action, Add custom validation, Validate API, Add network validation, Add custom wait for*
      </td>

      <td>
        This is the name that was entered by the user when the step was initially created. To change the name, click inside the field, and edit the contents. (If the step is a shared step, the property is labeled **Shared step name**. If the step is not a shared step, the property is labeled **Step name**.)
      </td>

      <td />
    </tr>

    <tr>
      <td>
        Sleep duration
      </td>

      <td>
        *Sleep*
      </td>

      <td>
        This property sets the amount of time that the test waits before proceeding to the next step. The default is 1 second (1,000 ms). To change this value, click inside the field, and edit the new sleep value (in ms).
      </td>

      <td>
        [Wait for](https://help.testim.io/docs/wait-for#sleep)
      </td>
    </tr>

    <tr>
      <td>
        String type
      </td>

      <td>
        *Generate random value*
      </td>

      <td>
        The type of string to be generated. Whether it will include letters only, numbers only, or a mix of the two.
      </td>

      <td>
        [Generating a Random Value Step](https://help.testim.io/docs/generating-a-random-value#generate-random-value-step)
      </td>
    </tr>

    <tr>
      <td>
        Time difference
      </td>

      <td>
        *Generate date*
      </td>

      <td>
        The generated date/time can be set to before or after the browser time or UTC (if UTC was selected).
      </td>

      <td>
        [Generating a Date](https://help.testim.io/docs/generating-a-date)
      </td>
    </tr>

    <tr>
      <td>
        URL to assign
      </td>

      <td>
        *Add navigation action*
      </td>

      <td>
        Specify the URL to navigate to another page during the test.
      </td>

      <td>
        [How to Add a Parameter](https://help.testim.io/docs/navigation#how-to-add-parameter)
      </td>
    </tr>

    <tr>
      <td>
        Use UTC
      </td>

      <td>
        *Generate date*
      </td>

      <td>
        Select to use UTC instead of the browser's time zone.
      </td>

      <td>
        [Generating a Date](https://help.testim.io/docs/generating-a-date)
      </td>
    </tr>

    <tr>
      <td>
        Variable name
      </td>

      <td>
        *Add extract value step, Get cookie, Generate random value, Generate date*
      </td>

      <td>
        This is the default name that Testim uses for the variable that holds the data in each of these steps. To change the name, click inside the field, and edit the contents. **Note**: Variable names are subject to the name limitations in JavaScript. So, for example, spaces and special characters are not allowed.
      </td>

      <td>
        [JavaScript variables](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/First_steps/Variables)
      </td>
    </tr>

    <tr>
      <td>
        Variable scope
      </td>

      <td>
        *Add extract value step, Get cookie, Generate random value, Generate date*
      </td>

      <td>
        You can choose the scope of the variables that Testim uses in these types of steps. By default, the variable scope is set to **Test**. If you would like to change it, click on the **Variable scope** dropdown, and select one of the following three options:

        * **Local**: allows you to pass the parameter between steps in the same group (if declared within a group) or test (if declared from the test level).
        * **Test**: allows you to pass parameters between steps and groups in the same test.
        * **Suite**: allows you to pass parameters between tests in the same test suite.
      </td>

      <td />
    </tr>

    <tr>
      <td>
        * PARAMS
      </td>

      <td>
        *Add custom action, Add API action, Add custom validation, Validate API, Add network validation, and Add custom wait for*
      </td>

      <td>
        Parameters can be used in steps to test different scenarios without knowing the information ahead of time. If you click on the + next to **PARAMS**, Testim allows you to define HTML parameters and JS parameters to use in your step.
      </td>

      <td>
        [Parameters](https://help.testim.io/docs/parameters)
      </td>
    </tr>
  </tbody>
</Table>