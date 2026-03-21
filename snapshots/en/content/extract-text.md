# Extract Value Step

Lets you copy values directly from your web or mobile application to be used in later steps

Imagine the following, you have text in your application and you want to validate that it appears on another page, or you may have a value that you want to use in some calculation at a later step.\
If you answered yes to any of these questions, you came to the right place.\
Let's see how we can easily extract text and use it...

## Add Extract Value Step to a Test

:fa-arrow-right: **To add an extract value step to your test:**

1. Hover over the arrow menu where you want to add the new step and select **Testim predefined steps**.

![634](https://files.readme.io/bc506cc-predefined-steps.png "predefined-steps.png")

2. Search for **Add extract value step** and select the step from the list.

![443](https://files.readme.io/80366ab-add-extract-step.png "add-extract-step.png")

> 📘 Note:
>
> If you do not already have your app opened to the Base URL, you may be directed to first open the Base URL (web) or Open App (mobile) before running the step above (web).

![921](https://files.readme.io/376956a-open-base-url.png "open-base-url.png")

<Image width="100%" src="https://files.readme.io/dcdf523-relevantstep.png" />

3. Select the **element** you want to extract the value from your app. Testim will create the **Extract Value step** and assign the element you selected.

![675](https://files.readme.io/9136b57-select-element.png "select-element.png")

4. Open the **Properties panel** for the Extract Value step.

![284](https://files.readme.io/1a34b50-properties.png "properties.png")

5. Update **Name** of your variable. The default name will be "value".

![322](https://files.readme.io/5ac725a-extract-name.png "extract-name.png")

> 📘 Note:
>
> Variable names are subject to the name limitations in JavaScript. So, for example, spaces and special characters are not allowed. You can read more [here](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/First_steps/Variables).

## Set the Extract Mode

The Extract Mode of an Extract Value step determines the value and format of the contents of your extract variable. The following extract modes are available:

* **Entire String (default)**
* **Number**
  * First Number: if the string contains more than one number, return the *first number* in the list
  * Last Number: if the string contains more than one number, return the *last number* in the list
  * All numbers (array): if the string contains more than one number, return all numbers as an *array*.
* **Date**
  * First Date: if the string contains more than one date, return the *first date* in the list
  * Last Date: if the string contains more than one date, return the *last date* in the list
  * All dates (array): if the string contains more than one date, return all dates as an *array*.
* **Regular Expression**
  * First Match: if the expression contains more than one match, return the *first match* in the list
  * Last Match: if the expression contains more than one match, return the *last match* in the list
  * All matches (array): if the expression contains more than one match, return all matches as an *array*.

> 📘 Note:
>
> * Change to either Number/Date/Regular Exp if you would like to extract only just part of the text
> * Please note that even when extracting  Number/Date/Regular Exp the value will be a string

:fa-arrow-right: **To update the Extract Mode of your step:**

1. Open the **Properties panel** for the Extract Value step.

![284](https://files.readme.io/f7c15b0-properties.png "properties.png")

2. Select the **Extract Mode** you want to use.

![322](https://files.readme.io/90befed-extract-mode.png "extract-mode.png")

3. Click the **Extract Mode Details** icon to select the specific type of extract value.

![330](https://files.readme.io/05c57d3-extract-mode-details.png "extract-mode-details.png")

4. Select the **Extract Mode Type** from the list of options.

![279](https://files.readme.io/d38aeb8-extract-mode-type.png "extract-mode-type.png")

In the example below, the string "Adults(18+)" was captured by the Extract Value step. With the Extract Mode set to **Number**, just the value "18" will be returned in the extract variable.

![397](https://files.readme.io/5559177-number-example.png "number-example.png")

## Set Scope of Extract Variable

Once an Extract Value step runs and saves the extract variable, the value from the variable can be used.

* **Local**: the variable is only available to the current user when run locally in the Test Editor.
* **Test**: the variable is available to any user within the scope of the current test.
* **Suite**: the variable is available to all tests within the Test Suite to which the test belongs.

:fa-arrow-right: **To change the Extract Variable scope:**

1. Open the **Properties panel** for the Extract Value step.

![284](https://files.readme.io/e0a2607-properties.png "properties.png")

2. Select the **Variable Scope** you want to apply to the extract variable.

![326](https://files.readme.io/f45a71b-variable-scope.png "variable-scope.png")

> 📘 Note:
>
> Since suite-scoped variables are shared between all the tests in the suite, make sure to give the variable a unique name so that its value will not be overwritten by a same name variable from another test.

## Use extracted value

You can use your new parameter in a validation, set text, custom steps, etc. In the example below, we'll use it to validate text on another page.

:fa-arrow-right: **To use the extract variable:**

1. Record a text validation step. (Learn more about text validation [here](https://help.testim.io/docs/validations))
2. Open the **properties panel** of the text validation step.

![267](https://files.readme.io/e403d66-text-properties.png "text-properties.png")

3. Replace the constant value typed in the **Expected value field** with the parameter you created.

![329](https://files.readme.io/15ab428-use-variable.png "use-variable.png")