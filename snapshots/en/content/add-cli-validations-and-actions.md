# Add CLI validations and actions

Execute Node.js scripts from within your tests

In addition to writing [custom validations and actions](https://help.testim.io/docs/custom-code) (which execute in the browser run-time environment), you can also create custom Node.js scripts that are executed in your CLI environment.

These scripts are initiated from inside a test just like a standard custom action. However, unlike custom validations and actions, CLI actions and validations open the gateway for some very advanced actions such as database validation and manipulation, image and PDF validations, and other validations. The real power of CLI steps comes from the ability to add any node package directly from npm (or any other source) and have those packages scoped to the CLI step during the execution of the test. We support all of the standard methods for defining package dependencies.

In addition to the *Add CLI validation* and *Add CLI action* steps, there is also the *Validate download* step, which is a specialized CLI step which allows you to validate that the download content of various file types are as expected. For more information, see [Validate download](https://help.testim.io/docs/validate-download).

> 📘
>
> Logs generated during the CLI action step will be displayed in the terminal, initiated in the execution, and preserved within the step in the 'Step Log' section at the bottom.

> 📘 This is a pro feature
>
> This feature is only open to projects on our professional plan. To learn more about our professional plan, click [here](https://www.testim.io/pricing/).

## Prerequisites

* In order to locally run tests which contain CLI validation or action steps, the following command needs to be executed: **npm i -g @testim/testim-cli && testim connect** (see below).

:fa-arrow-right: **To locally run tests which contain CLI validation or action steps:**

1. Open the **Command Prompt** window for your operating system.
2. In the command prompt, enter the following command: **npm i -g @testim/testim-cli && testim connect**

<Image align="center" width="80%" src="https://files.readme.io/2ab6f86-Testim_164.png" />

3. Wait for the process to execute.

![](https://files.readme.io/84cc9af-Testim_186.png "Testim 186.png")

## Adding a CLI step

The general procedure for adding a CLI step is the same regardless of whether you are adding an *Add CLI action* step or an *Add CLI validation* step.

:fa-arrow-right: **To add a CLI step:**

1. Hover over the :fa-caret-right: **(arrow symbol)** (or **+ symbol** after the final step) where you want to add the CLI step.

![](https://files.readme.io/f982ee3-Testim_329a.png "Testim 329a.png")

2. Click on the “**M**” (Testim predefined steps).\
   The **Predefined steps** menu opens.

![](https://files.readme.io/2d8835c-Testim_270_r2.png "Testim 270_r2.png")

3. Click on **Validations** (or **Actions**).\
   The **Validations** (or **Actions**) menu expands.

![](https://files.readme.io/6485d77-Testim_271_r2.png "Testim 271_r2.png")

4. Scroll down through the menu and select **Add CLI validation** (or **Add CLI action**).

> 📘
>
> Alternatively, you can use the search box at the top of the menu to search for **Add CLI validation** (or **Add CLI action**).

The **Add Step** window is shown.

![](https://files.readme.io/62c3379-Testim_215_r.png "Testim 215_r.png")

5. In the **Name the new step** field, enter a name for this step.
6. If this is a shared step to be made available to reuse in this or other tests, keep the box next to **Shared step** selected (default), and choose a folder from the **Select shared step** folder list where you want this step stored. Otherwise, deselect the checkbox.\
   For more information about shared steps, see [Groups](https://help.testim.io/docs/groups).
7. Click **Create Step**.\
   The **function** editor opens, and the **Properties** panel opens on the right-hand side.

![](https://files.readme.io/3c8168d-Testim_330.png "Testim 330.png")

8. In the **Properties** panel, in the **Description** field, optionally edit the description of this step. The default description is “*Run CLI validation*” (or “*Run CLI action*”).
9. Define the parameters you will need for your step as follows:\
   a. In the **Properties** panel, click the **+ PARAMS** button.\
   b. **JS parameter**: If you would like to add a JavaScript parameter, select **JS** from the dropdown list and type in the JavaScript parameter.\
   c. **Package parameter**: If you would like to add an NPM package variable, select **Package** from the dropdown list and type in the package variable.

> 📘
>
> In case your code uses an npm package, make sure NOT to `require` it, but rather replace the `require` line with a PACKAGE parameter in the step properties.

![](https://files.readme.io/4d4751d-CLI_action_param.gif "CLI_action_param.gif")

d. The selected element is automatically named “param” or “packageVariable” (depending on whether you chose a JS parameter or NPM package variable). To assign a relevant name to the parameter/variable, click on the **edit** icon and enter the desired name.

![](https://files.readme.io/d9532c0-Testim_331a_r.png "Testim 331a_r.png")

10. In the **function** editor, enter your desired code. If you have defined parameters, you can refer to those parameters in your code.

> 📘
>
> To run async code in the CLI step, you have to return the promise you wish to resolve. Without returning it, the step will run synchronously and will resolve when the last line of code is executed, regardless of the expected results.

![](https://files.readme.io/1418058-Testim_332.png "Testim 332.png")

11. If you would like to specify what happens if the step fails, click the **When this step fails** down arrow in the **Properties** panel, and choose your desired option. Options are: *Mark error & stop*, *Mark error & continue*, and *Mark warning & continue*.
12. If you would like to control when this step runs (or doesn’t run), click the **When to run step** down arrow in the **Properties** panel, and choose your desired option. For more information, see [Conditions](https://help.testim.io/docs/conditions).
13. If you would like to override the default timeout setting (30000 ms), click on the **Override timeout** button in the **Properties** panel, and enter the desired timeout limit.
14. Click the **back arrow** to return to the main **Editor** window.

![](https://files.readme.io/31b0037-Testim_332a.png "Testim 332a.png")

The step is created.

![](https://files.readme.io/a1d4d65-Testim_333.png "Testim 333.png")

### CLI step examples

Below are examples that use CLI steps.

* [MongoDB validation](https://help.testim.io/docs/mongodb-validation)
* [MySQL validation](https://help.testim.io/docs/mysql-validation)
* [Extract SMS message](https://help.testim.io/docs/extract-sms-message)