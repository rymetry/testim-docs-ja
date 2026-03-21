# Hidden parameters

When you use [parameters](https://help.testim.io/docs/parameters) in your tests, the values that are used during run time are saved and shown in the UI, as this is very useful for debugging and understanding the root cause of the failure. However, sometimes the information is sensitive, so you want the value to be hidden. Testim features the ability to define which parameters will be hidden. The hidden parameters will not be saved in Testim's Cloud at any point, so the "Rerun with same parameters" feature will not be available.

> 📘 This is a pro feature
>
> This feature is only open to projects on our professional plan. To learn more about our professional plan, click [here](https://www.testim.io/pricing/).

## Add a hidden parameter

To add a hidden parameter, follow these steps:

1. In the main menu, select **Resources**.
2. Under the **Hidden Parameters** section, click **Add hidden parameter**.

   ![](https://files.readme.io/8a620c67961ff63c9a3ec7f75879b2ea8f31a024bbf494d95e0a7ba1f951e33d-image.png)
3. Type the name of a parameter you want to add and a description (optional). Then select **Create**.

## Edit or delete a hidden parameter

To edit or delete a hidden parameter, follow the steps:

1. Select **Resources** from the main menu and then select the **Hidden Parameters** section to see all your hidden parameters.
2. Right-click on the parameter you want to edit and select **Edit**. To delete the parameter, select **Delete** instead.

   ![](https://files.readme.io/d3dc1ceb5e01ad3f8c0dfd745287e03d791fd9c3f520ded6ec566072a31f0826-image.png)

## Run a test with hidden parameters

Running a test that is using a hidden parameter is available only via [CLI](https://help.testim.io/docs/the-command-line-cli). It is not possible to use the Scheduler to run tests with hidden parameters.\
You can pass a hidden parameter value to a CLI run by using one of the following options:

* **Pass it through a JSON Parameters File** - You can define parameters in a JSON Parameters File and then pass the hidden parameters to test runs. For more information, see [JSON Parameters File Parameters](https://help.testim.io/docs/json-parameters-file-parameters).
* **Pass it through the Configuration File** -  You can define parameters in a Configuration File and then pass the hidden parameters to test runs. For more information, see [Configuration File Parameters](https://help.testim.io/docs/configuration-file-parameters).

## Hidden parameters in a test

The Hidden parameters values will appear as **\*** in the UI:

<Image align="center" src="https://files.readme.io/fac42c05074591bd2d940d57de80b74e7f56eb9f2cf304ba60ae1302933b8887-step_passed.png" />