# Validate element text

Validate that the expected text is visible

An Element Text validation is similar to an Element Visible validation in that it makes the step dependent on the existence of a specific element. However, for the Element Text validation, you also specify a particular text value that must appear in the specified element. You can easily validate multiple text elements as well.\
The text being validated can be given as a specific string or a range of values represented as a Regex expression, a short JS expression, or a parameter. See [Advanced text validation](https://help.testim.io/docs/validate-element-text#advanced-text-validation).

> 📘 Note (Web Only):
>
> You can use a keyboard shortcut to record text validation from your application during recording. Just use Ctrl +'v' and select the text you want to validate.

## Adding a Validate element text step (Web)

:fa-arrow-right: **To add an Element Text validation:**

1. Hover over the **> (arrow symbol)** where you want to add the validation.

![](https://files.readme.io/c2ef26f-Screen_Shot_2021-04-18_at_6.37.44.png "Screen Shot 2021-04-18 at 6.37.44.png")

The action options are displayed.

<Image align="center" width="smart" src="https://files.readme.io/f9aa3c6-Testim_083a_r.png" />

2. Click on the **Toggle Breakpoint** button.

<Image align="center" width="smart" src="https://files.readme.io/388d9b8-Testim_085_r.png" />

3. Click on the **Play Scenario** button, to run the test until the breakpoint.

![](https://files.readme.io/b22feac-Screen_Shot_2021-04-18_at_6.39.03.png "Screen Shot 2021-04-18 at 6.39.03.png")

4. Hover over the position again and click on the **"M"** (Testim predefined steps).\
   The Predefined steps menu opens.

<Image align="center" width="smart" src="https://files.readme.io/46a723c-Testim_034_r.png" />

5. Click on **Validations**.\
   The Validations section expands.

<Image align="center" width="smart" src="https://files.readme.io/9d4b608-Testim_035_r.png" />

6. Scroll down through the menu and select **Validate element text**.

> 📘
>
> Alternatively, you can use the search box at the top of the menu to search for **Validate element text**.

7. In the AUT window, select the relevant element that you wish to validate by clicking on it.\
   The step is created, and a thumbnail of the selected element is shown in the step.

![](https://files.readme.io/1915d47-Testim_090.png "Testim 090.png")

> 📘
>
> Additionally, you can select multiple text elements to validate by pressing the ‘Ctrl’ key and clicking on multiple elements. A reusable group will be created, which includes all of the validations.

8. Click on the **Toggle Breakpoint** button after the Validation step to remove the breakpoint.

## Adding a Validate element text step (Mobile)

:fa-arrow-right: **To add an Element Text validation:**

1. Hover over the **> (arrow symbol)** where you want to add the validation and click the **Testim predefined steps** button.

![](https://files.readme.io/c16fd83-predefined-steps.png "predefined-steps.png")

2. Select **Validate element text** under the **Validations** group.

![](https://files.readme.io/e3ba3d9-validateelementtext.png "validateelementtext.png")

> 📘 Note:
>
> Alternatively, you can use the search box at the top of the menu to search for Validate element text.

3. The AUT will open. Select the text element on the screen you want to validate.

![](https://files.readme.io/90346f6-selectelement.png "selectelement.png")

4. The **Text Validation step** is created, and a thumbnail of the selected element is shown in the step.

![](https://files.readme.io/2665c9c-textvalidationstep.png "textvalidationstep.png")

## Modifying a Validate element text step (Mobile & Web)

If you want to change the element or text you selected, you don’t need to delete and re-record the step. Instead, you can just reassign the element with a different element, or you can edit the text of the initial element that is being validated.

### Reassigning the selected element

:fa-arrow-right: **To reassign the selected element in a Validate element text step:**

1. Hover over the position to the left of the step for which you want to reassign the element and click on the **Toggle Breakpoint** button.
2. Click on the **Play Scenario** button, to run the test until the breakpoint.
3. Hover over the step for which you want to reassign the element and click on the **Show Properties** (:fa-cog:) icon.

![](https://files.readme.io/705a94f-Screen_Shot_2021-04-18_at_6.40.55.png "Screen Shot 2021-04-18 at 6.40.55.png")

The Properties panel opens on the right-hand side.

4. Hover over the **Target element** thumbnail.

<Image align="center" width="smart" src="https://files.readme.io/5934637-Testim_015a_r.png" />

The **Target element** options are shown.

<Image align="center" width="smart" src="https://files.readme.io/79b44a7-Testim_010_r.png" />

5. Click **Reassign**.

<Image align="center" width="smart" src="https://files.readme.io/17dc6a7-Testim_010a_r.png" />

6. In the AUT browser, identify the relevant element and click on it to select it.\
   The selected element is shown in the Target element box in the Properties panel.
7. Click on the **Toggle Breakpoint** button to the left of the step for which you reassigned the element to remove the breakpoint.

### Editing the validation text

:fa-arrow-right: **To edit the validation text of the initial element:**

1. Hover over the step for which you want to edit the validation text and click on the**Show Properties** (:fa-cog:) icon.

![](https://files.readme.io/4ddc295-Screen_Shot_2021-04-18_at_6.40.55.png "Screen Shot 2021-04-18 at 6.40.55.png")

The Properties panel opens on the right-hand side.

2. In the **Expected value** field, enter the new validation text.

<Image align="center" width="smart" src="https://files.readme.io/d8459d3-Testim_015b_r.png" />

# Advanced text validation (Mobile & Web)

In many cases it is difficult to specify an entire text string that will be matched in its entirety to the text that you want to validate. In the **Expected Value** field, you can create text validations by combining:

* Regular expressions (partial strings)
* JavaScript expressions
* Parameters

## Using Regular Expression (Regex)

Testim supports Regex inside the Expected Value input. These are the most common cases:

### Starts with

Validates that the text that *starts* with a certain word, allowing the rest of the text to be dynamic, and still pass the validation:\
`/^My text/`

![](https://files.readme.io/6ce7739-Ijhqz8PAQMODiuaQYwVv_text-validation-regex.png "Ijhqz8PAQMODiuaQYwVv_text-validation-regex.png")

### Ends with

Validates that the text that *ends* with a certain word, allowing the rest of the text to be dynamic, and still pass the validation:\
`/my text$/`

### Contains

Validates that the text that *contains* a certain word, allowing the rest of the text to be dynamic, and still pass the validation:\
`/my text/`

### Multiple Options (OR) with Parameters

Validates against two possible values, where the text can match either param1 or param2. For example,  If param1 = "Hello" and param2 = "World", it will pass for “Hello”, “World”:\
`new RegExp("^" + "(?:" + param1 + "_" + "|" + param2 + "_)" + "$")`

### Not Equal Validation

Validates that the text does not match param1. For example, if param1 = "Example1", this regex will fail validation if the text is exactly "Example1" but pass for any other value:\
`new RegExp("^" + "((?!" + param1 + ").)*$")`

### Validating Numbers (Only Digits)

Validates that the text consists only of positive whole numbers (digits 0-9). For example, "12345" will pass, but "12a34" or "-123" will fail:\
`/^\d+$/`

### Validating Any Number (Positive, Negative, and Decimals)

Validates that the values consist positive numbers, negative numbers, or decimals only. For example, "123", "-123", "3.14", and "-0.5" will pass, but "12a" or "." will fail:\
`/^-?\d+(\.\d+)?$/`

Of course you can create and use any other valid Regex that you may need.

> 👍 Tips
>
> * [RegexOne](http://regexone.com/) is a great place to learn and practice regular expressions.
> * [RegularExpressions 101](https://regex101.com/) is a great tool for developing and testing a regular expression.

<br />

## Using JavaScript expression

In some cases, you may want to validate that a text equals the result of a JavaScript expression. For example, making sure that the the text holds the current date. In this case you can set the Expected Value to this simple expression: `new Date().toDateString()`, and Testim will compare the calculated string result of this expression. See a failed validation:

![](https://files.readme.io/b1662ca-Screen_Shot_2021-04-18_at_7.06.47.png "Screen Shot 2021-04-18 at 7.06.47.png")

## Using a parameter

You can also use parameters, which were defined in the test or suite level or were defined in the config file to validate the text element.  If you use a parameter that was created in a different step, you will have to export it to the test level ([more about exporting parameters](https://help.testim.io/docs/parameters)).

### Parameter only

There are 2 types of parameters:\
HTML: Allows you to refer to HTML Elements in your app.\
JS (JavaScript): Allows you do define any JS expression.

:fa-arrow-right: **To use a parameter in the Expected Value field:**

1. Define a parameter in one of the following ways:

   * **Add a parameter to a Custom step (web only)** - you can create a Custom step and then add a parameter to this Custom Step. For detailed instructions, see - [Parameters in custom JavaScript steps](https://help.testim.io/docs/parameters-in-custom-javascript-steps).

   * **Add a parameter to the test data** - you can also define the parameter by adding **Test Data** to the **Setup** step (the first step of the test). For detailed instructions, see [Configuring a data driven test from the visual editor](https://help.testim.io/docs/data-driven-testing#section-configuring-a-data-driven-test-from-the-visual-editor)

   * **Add a parameter to the config file (web only)** - you can add the parameter to the [Configuration file](https://help.testim.io/docs/configuration-file-run-hooks). For detailed instructions, see [Configuring Data Driven Tests using the Config file](https://help.testim.io/docs/data-driven-testing#section-configuring-data-driven-tests-using-the-config-file).

<Image title="Untitled_Project.gif" alt={1920} align="center" src="https://files.readme.io/fbf2f95-Untitled_Project.gif">
  **Click on the gif to enlarge**
</Image>

2. If the scope of the parameter was define in a step level, you need to pass the parameter to the Element text validation step or to the test level, by exporting the parameter. For detailed instructions, see [Exports Parameters](https://help.testim.io/docs/exports-parameters).\
   For example, to export a `username` parameter with the value `Hello, John`, we will add a new custom action step and type the following in the editor:

```javascript
exportsTest.usename= "Hello, John"
```

<Image title="export_param.gif" alt={1920} align="center" src="https://files.readme.io/91597d2-export_param.gif">
  **Click on the gif to enlarge**
</Image>

3. Create an **Element text validation** step and add the parameter to the **Expected value** field.

<Image title="textvalidation3.gif" alt={1920} align="center" src="https://files.readme.io/ec83fac-textvalidation3.gif">
  **Click on the gif to enlarge**
</Image>

After running the test you will see that **Element text validation** step will match the expected parameter value.

<Image title="validation2.png" alt={1842} align="center" src="https://files.readme.io/6a9b523-validation2.png">
  **Click on the image to enlarge**
</Image>

You can also combine the parameter with an exact string by adding a '+' between them. For example, instead of setting the `username` parameter value to `Hello, John`, we can define it as `John` and then specify the Expected Value as:\
\``'Hello ' + userName`

### Combining a parameter with Regex.

It is possible to combine the parameter and with Regex by defining a regex function in the **Expected value** field.\
For example a combination that **start with** the parameter will look like this:

```javascript
new RegExp("^" +userName)
```

A combination that **ends with**the parameter will look like this:

```javascript
new RegExp(userName+"$")
```