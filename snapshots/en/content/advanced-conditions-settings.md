# Advanced Conditions Settings

Conditions in Testim can be applied to running a step or to repeating a loop (see [Repeat Group Loops](https://help.testim.io/docs/loops)).\
If a condition for a step or loop is false, the default action is to skip the step or end the loop immediately. Alternatively, if a condition for a step or loop is true, the default action is to immediately execute the step or repeat the loop. Use the advanced options below if you want the system to continue checking the condition for a specific amount of time before declaring it to be true or false.

> 📘 Advanced settings can be applied to the following types of conditions: Element, Element text, & Custom\
> Advanced settings can be applied to the following types of loops: While element, While element text is, For each item, Loop for, & Custom

:fa-arrow-right: **To configure advanced condition settings:**

1. Configure a condition as described in [Conditions](https://help.testim.io/docs/conditions) or configure a loop as described in [Repeat Group Loops](https://help.testim.io/docs/loops).
2. In the Properties panel, in the **When to run step** section (or the **Repeat group** section for Loops), click on the **Settings** (:fa-cog:) icon. The **Advanced** panel opens on the right side.

![276](https://files.readme.io/9e54f5e-WhenToRunStepCustom.png "WhenToRunStepCustom.png")

![293](https://files.readme.io/2d936c1-Testim_Image_031.png "Testim Image 031.png")

Configure the advanced settings as follows:

* **When a condition fails retry** – Select this checkbox and specify a period of time in milliseconds for retries when the condition is false before continuing with the next steps. By default, if the condition returns false on the first try, the step is immediately skipped (or the loop will immediately stop). If you want the system to try again before moving on to the next step (or exiting the loop), use this option.
* **When a condition passes verify** – By default, if the condition is true the step (or group step in a loop) will be executed. However, by selecting this option and specifying a period of time in milliseconds, the system will retry again before declaring a condition to be true and executing the step (or entering the loop). If the condition returns false on the first attempt, it will not retry again even if this option was marked.