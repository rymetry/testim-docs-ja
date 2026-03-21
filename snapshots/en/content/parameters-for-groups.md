# Groups Parameters

Learn how to pass parameters to groups to improve reuse

[Groups](https://help.testim.io/docs/groups) can include parameters, which are variables that can be used to pass information into a test step. By using parameters in a test, you can test different scenarios without knowing the information in advance. For example, when testing a login scenario, you can use parameters to switch between various username and password options, such as a *registered*user versus a* guest* user, etc.\
If the group is shared between multiple tests, the group parameters will be also available across all the tests and you will only need to set specific values for these parameters.\
You can add parameters to groups the exact same way you define parameters in the [Step Properties Panel Parameters](https://help.testim.io/docs/parameters-in-custom-javascript-steps). First you will need to [create a group](https://help.testim.io/docs/groups), add parameters, assign these parameters to specific steps in the group and then add values to these parameters.

## Parameter Scope

The scope of the defined parameter is within the group itself. This means that all the steps within the group can use the parameter. If its a shared group, the parameter can be shared across multiple tests that use the shared group.\
Parameters created in groups are considered as "local scope". Parameters can be overridden by the same scope or a “smaller” scope. For example, a "test scope" parameter can be overridden by either another test scope or local scope parameter with the same name.

> 🚧 Shared parameters
>
> If its a shared group/step, the  JS/HTML parameters themselves will be shared across tests, **but not their inner values**, so the parameters can be reused in other tests with other values. Deleting a parameter from a shared step or group will have a cascading effect on all instances of that step or group, and this action cannot be undone.

## Adding Parameters to a Group

:fa-arrow-right: **To add parameters to a group:**

1. Create a group by following the instructions in the [Groups](https://help.testim.io/docs/groups)  section. In this example we will create a "Login group" that includes typical login steps.
2. Click the group's **Show Properties** icon (:fa-cog:).
3. Click the **+** icon next to **Params** and then click **JS**.

![](https://files.readme.io/8e504bc-paramsjs.PNG "paramsjs.PNG")

4. Enter a name for the first parameter, by clicking the **Edit** icon and then replacing the "param" text with the new name.

![](https://files.readme.io/0d72468-edit.png "edit.png")

​5. Enter a value in the field below the parameter name. If the value is a constant string value use ' ' around it. For example, 'guest'. This value will be available in this test only (i.e., the value will not be shared across tests.

6. Repeat **steps 4-5** to add additional parameters.

![](https://files.readme.io/4c19442-example.PNG "example.PNG")

7. Click **Save** and then **OK**.​

## Assigning Parameters to Steps in a Group

:fa-arrow-right: **To assign parameters to steps in a group:**

1. Double-click the group step to view the group's internal steps.

> 📘 Note
>
> If it’s a shared group you will need to confirm that the changes will be applied on all related tests.

2. Select the relevant step to assign the parameter and click the **Show Properties** icon (:fa-cog:). For example, we will select the **"Set text"**&#x73;tep to assign the `username` parameter.
3. In the **Properties** panel, in the **Text to assign** field, replace the current static value to the parameter's name (e.g. username).

![](https://files.readme.io/a5856f1-texttoassign.png "texttoassign.png")

4. Repeat steps 1-3 to assign additional parameters to steps. For example, we will assign the password parameter to the Set password step.
5. Click **Save** and **OK**.

That's it!\
We have created a login group with parameters, that can be easily reused in other tests with a different set of values without the need to change the group itself.

## Reusing the Group with the Parameters

:fa-arrow-right: **To reuse the group with parameters:**

1. Add the group to another test by following the instructions in the [Reusing a Group](https://help.testim.io/docs/groups)  section. In this group, the parameters are already assigned to the relevant steps, but the values are empty.

![](https://files.readme.io/c3bace7-addinglogingroup.PNG "addinglogingroup.PNG")

2. Click the group's **Show Properties** icon (:fa-cog:).\
   Notice that the parameters exist, but the values are not assigned.

![](https://files.readme.io/5ccad01-notassigned.png "notassigned.png")

3. Click the **Assign Now**drop-down menu and select **JS**.
4. In the empty field, enter the relevant value. If the value is a constant string value use ' ' around it.
5. Repeat **steps 3-4** for additional parameters.
6. Click **Save** and **OK**.