# Dynamic text input

Use the power of JavaScript and parameters to set dynamic text

After recording a test that includes a **Set text** step (for entering text), you can edit the static text you typed during the recording and replace it with a dynamic string. This string can contain a JavaScript expression and/or a parameter which was previously defined. For more advanced applications of dynamic text, see [Data-driven testing](https://help.testim.io/docs/data-driven-testing).

## Using a JavaScript expression to set text

:fa-arrow-right: **To set text using a JavaScript expression:**

1. Hover over the **Set text** step you wish to modify (e.g. Set username), and click on the **Show Properties** (:fa-cog:) icon.

![3851](https://files.readme.io/29a0765-Testim_229a.png "Testim 229a.png")

The **Properties** panel opens on the right-hand side.

![200](https://files.readme.io/dab7248-Testim_230_r.png "Testim 230_r.png")

2. In the **Text to assign** field, replace the current static text with a JavaScript expression.\
   For example, to set a unique user name value in an input field, you can set the value to this expression: `'user' + Date.now()` . In this expression the string ‘user’ is followed by a dynamic number of milliseconds elapsed since January 1, 1970, 00:00:00 UTC.\
   The **Text to assign** field can include text strings (surrounded by single or double quotes), JavaScript expressions, previously created variables, or a combination (connected with plus symbols).

> 📘 Variables and JavaScript expressions should NOT be surrounded by quotes.

When the test is run, the text set in the field on the screen is the evaluated JavaScript expression (e.g. `user1619013809723`).

![1920](https://files.readme.io/b3181bc-set_text.gif "set_text.gif")

## Using a parameter to set text

In order to set a parameter as text, it first must have already been created in another step or test. For more information, see [Parameters](https://help.testim.io/docs/parameters).

:fa-arrow-right: **To set text using a parameter:**

1. Hover over the **Set text** step you wish to modify (e.g. Set username), and click on the **Show Properties** (:fa-cog:) icon.

![3838](https://files.readme.io/f4b65c5-Testim_231a.png "Testim 231a.png")

The **Properties** panel opens on the right-hand side.

![200](https://files.readme.io/6dc9ca3-Testim_232_r.png "Testim 232_r.png")

2. In the **Text to assign** field, replace the current static text with a previously created parameter.\
   The **Text to assign** field can include text strings (surrounded by single or double quotes), JavaScript expressions, previously created variables, or a combination (connected with plus symbols).

> 📘 Variables and JavaScript expressions should NOT be surrounded by quotes.

When the test is run, the text set in the field on the screen is the value of your parameter.