# Generating a random value

Creating a step to create random values for dynamic data testing

After recording a test that includes a **Set text** step (for entering text), you can edit the test configuration so that a different, randomly generated, string will be entered for that step each time that the test runs. The random text is generated and stored in a variable using the **Generate random value** step which you insert prior to the **Set text** step. You then edit your **Set text** step to use the variable created in the **Generate random value** step.\
Being able to generate random data for testing enables you to extend coverage without needing to create additional tests, find failed cases within specification, enable distribution of sets of data, and ensure that you're not using the same data over and over in your tests.

:fa-arrow-right: **To generate a random value using a “Generate random value” step:**

1. Hover over the :fa-caret-right: **(arrow symbol)** where you want to add the step.

![3849](https://files.readme.io/4924b93-Testim_223a.png "Testim 223a.png")

The action options are displayed.

<Image width="smart" src="https://files.readme.io/077856e-Testim_224a_r.png" />

2. Click on the **"M"** (Testim predefined steps).\
   The **Predefined steps** menu opens.

<Image width="smart" src="https://files.readme.io/509a4e6-Testim_034_r.png" />

3. Click on **Actions**.\
   The Actions menu expands.

<Image width="smart" src="https://files.readme.io/987804d-Testim_079_r.png" />

4. Scroll down through the menu and select **Generate random value**.

> 📘 Alternatively, you can use the search box at the top of the menu to search for **Generate random value**.

A "Generate random value" step is added in the **Editor**.\
5\. Hover over the newly created step, and click on the **Show Properties** (:fa-cog:) icon.

![3848](https://files.readme.io/a6856ec-Testim_225a.png "Testim 225a.png")

The **Properties** panel opens on the right-hand side.

![200](https://files.readme.io/caec929-Testim_226_r.png "Testim 226_r.png")

6. Fill in the properties as described below.

* **Description** – The description of the step. (Default = *Generate Random Value*)
* **Variable name** – The name of the variable in which you are storing the random data. (Default = *randomValue*)
* **String type** – The type of characters which your random value consists of:
  * **Letters Only**: The random data includes only uppercase and lowercase letters.
  * **Numbers Only**: The random data includes only numerals.
  * **Mixed**: The random data includes numerals and uppercase and lowercase letters. *This is the default*.
* **Length** – The number of random characters you are generating. (Maximum = *256*; Default = *12*)
* **Add prefix** – Enables you to add a prefix to your randomly generated characters. The prefix can include strings (surrounded by single or double quotes), previously created variables, or a combination of both (connected with a plus symbol).
* **Add suffix** – Enables you to add a suffix to your randomly generated characters. The suffix can include strings (surrounded by single or double quotes), previously created variables, or a combination of both (connected with a plus symbol).
* **Variable scope** – The scope in which the variable can be passed:
  * **Local**: Allows you to pass parameters between steps in the same scope.
  * **Test**: Allows you to pass parameters between steps and groups in the same test. *This is the default*.
  * **Suite**: Allows you to pass parameters between tests in the same test suite.
* **When this step fails** – Specify what to do if the step fails.
* **When to run step** – Specify conditions for when to run the step. For more info, see [Conditions](https://help.testim.io/docs/conditions).
* **Override timeout** – Allows you to override the default time lapse setting which causes Testim to register a fail for a test step, and specify a different time lapse value (in milliseconds).

When the test is run, the generated random value (along with the optional prefix and suffix) is stored in the designated variable.

:fa-arrow-right: **To modify your “Set text” step to set random text:**

1. Hover over the **Set text** step you wish to modify, and click on the **Show Properties** (:fa-cog:) icon.

![3849](https://files.readme.io/4a5bd98-Testim_227a.png "Testim 227a.png")

The **Properties** panel opens on the right-hand side.

![200](https://files.readme.io/7a35bba-Testim_228_r.png "Testim 228_r.png")

2. In the **Text to assign** field, enter the **Variable Name** which you used in the **Generate random value** step.

> 📘 The **Text to assign** field can include text strings (surrounded by single or double quotes), JavaScript expressions, previously created variables, or a combination (connected with a plus symbol).\
> Variables and JavaScript expressions should NOT be surrounded by quotes.

When the test is run, the text inputted on the screen includes the random value stored in the variable created in the **Generate random value** step.

## Try it yourself

Click [here](https://app.testim.io/#/project/GYXR2qZC/branch/master/test/uLiH9r9jPk) to open a sample test which includes several **Generate random value** steps. Try running the test and practice adjusting the configuration.

![894](https://files.readme.io/0c1762d-Jan-31-2021_06-20-28.gif "Jan-31-2021 06-20-28.gif")