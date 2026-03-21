# Step Properties Panel Parameters

Defining parameters through the step's properties panel (JavaScript/HTML)

Most step types include the ability to define a parameter in **PARAMS** field, located in the **Properties** panel.

There are 2 types of parameters:

* **HTML**: Allows you to refer to HTML Elements in your app.
* **JS (JavaScript)**: Allows you do define any JS expression.

### Parameter Scope

The scope of the defined parameter is within the step itself. For example, if you defined the parameter in the **Add custom action** step, this parameter will be available to the JS function defined in the same step.

## Defining an HTML parameter in a step's Properties panel

The following procedure uses the Custom Action step as an example, but it applies to all steps that include the PARAMS field in the Properties panel.

> 🚧 Shared parameter
>
> If its a shared group/step, the JS/HTML parameters themselves will be shared across tests, **but not their inner values**, so the parameters can be reused in other tests with other values. Deleting a parameter from a shared step or group will have a cascading effect on all instances of that step or group, and this action cannot be undone.

:fa-arrow-right: **To define an HTML parameter:**

1. In a new or existing test, add a step for which you want to define the parameter. For example, add an **Add Custom Action** step ('+' ⇒ Testim predefined steps ⇒ Actions ⇒ **Add Custom Action**)  .
2. In the **Add Step** dialog, enter a name for the step. For example, 'Click'.
3. Click **Create Step**.\
   The **Function editor** pane is displayed on the left and the **Properties** pane on the right.

![](https://files.readme.io/f73cb06-function.jpg "function.jpg")

4. Click on the '+' icon next to the **PARAMS** field, and select HTML.

![](https://files.readme.io/45bd5ce-selecthtml.jpg "selecthtml.jpg")

5. In the AUT, select an element for which you want to assign the parameter. For example, the Twitter icon at the bottom of the page.

![](https://files.readme.io/6e230ca-twittericon.jpg "twittericon.jpg")

A snippet of the selected element is displayed in the PARAMS section.

![](https://files.readme.io/fe4964c-snippet.jpg "snippet.jpg")

6. Double-click the name next to the HTML title and type a new name.

![](https://files.readme.io/c719269-name.jpg "name.jpg")

At this stage the HTML parameter is defined and ready to be used.

## Using the parameter in the step

The defined parameter can be used within the step itself.\
For example, you can define a function that uses the parameter.\
In the **Function** pane, type a function that uses the parameter:

```javascript
twitter.click()
```

Run the test and see that the element is clicked.

> 📘
>
> In order to use Jquery in your custom validations and actions, your site needs to have Jquery installed.

## Reusing the step and assigning a different parameter

The scope of the parameter that we have defined is within the step itself, but it is possible to reuse this step to create another step of the same type (e.g. Custom Action) and then simply reassign the parameter to another element (e.g., instead of the Twitter icon, we will now assign the LinkedIn icon).

:fa-arrow-right: **To reuse the step and assign a different parameter:**

1. In the same test, add the shared step that we have previously created from the **Shared Steps** menu. For example,  **'+'** ⇒ **Shared steps** ⇒ **Click**

![](https://files.readme.io/0f78633-sharedsteps.jpg "sharedsteps.jpg")

The shared step is duplicated.

![](https://files.readme.io/ed59427-duplicated.jpg "duplicated.jpg")

2. Double-click the new step to edit it.
3. The previous parameter still exists, but you are required to assign a new HTML element, by clicking the Assign HTML button.

![](https://files.readme.io/94de6da-assignhtml.jpg "assignhtml.jpg")

4. Choose another element. For example, the LinkedIn icon at the bottom of the page.

![](https://files.readme.io/8b65e10-linkedin.jpg "linkedin.jpg")

When you will run the test both buttons will be clicked.

## Adding JavaScript parameter in the step's Properties panel

JavaScript parameters are commonly used for constants and variables.\
We will mainly use those when we want to forward values to a group or to other reusable steps.\
You can find examples for using JS params [here](https://help.testim.io/docs/parameters-for-groups).

:fa-arrow-right:**To add a JavaScript parameter:**

1. In the **Properties Panel**, click the **+** button next to **Params** and then click **JS**.

   <Image align="center" width="-44% " src="https://files.readme.io/d5ea619-plus.png" />
2. Enter a name for the first parameter, by clicking the **Edit** icon and then replace the "param" text with the new name.

   <Image align="center" width="-48% " src="https://files.readme.io/96cc4ee-edit.png" />
3. Enter a value in the field below the parameter name. If the value is a constant string value use ' ' around it. For example, 'guest'. This value will be available in this test only (i.e., the value will not be shared across tests.

<Image align="center" src="https://files.readme.io/898f70a-guest.png" />

4. Repeat steps **1-3** to add additional parameters.
5. Click **Save** and then **OK**.​