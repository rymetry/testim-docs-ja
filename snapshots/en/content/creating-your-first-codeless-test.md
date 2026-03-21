# Web Testing Getting Started (Codeless Test)

## Welcome aboard!

Upon completion of the signup process, you were redirected to the Testim Home screen.

<Image align="center" src="https://files.readme.io/4b0e58e-gettingstarted1.png" />

> 📘
>
> You can access this screen at any time by clicking the Testim icon in your browser toolbar or by going to [https://app.testim.io/](https://app.testim.io/).

Now, Let's create your first test!

## Tutorial Use Case

Creating a test with Testim starts with going to the relevant website and recording the series of actions that you would like to test. Later you will be able to edit the properties for each of the steps and add validations.\
For this tutorial we will be testing Testim’s demo website “Space & Beyond”. We will run a test of the site’s login procedure.

## Recording the Test

:fa-arrow-right: **To record the test:**

1. Click on **Create Test**.

<Image align="center" src="https://files.readme.io/8d9ef22-gettingstarted2.png" />

A new test opens in the Editor. This is where you record the test, add validations and edit the test steps.

2. Click on the red **Record** button in the toolbar.

   <Image align="center" src="https://files.readme.io/ce98d0d-gettingstarted3.png" />

   If your default **Base URL** is set to the demo site’s URL “[demo.testim.io](http://google.com)”, then a new browser window opens showing the Space & Beyond website. At this point, you may proceed to step 4. If no Base URL was configured, the **Start A New Test** window opens.

<Image align="center" className="border" width="80%" border={true} src="https://files.readme.io/d42b2ee-gettingstarted4.png" />

3. In the **Your app URL** field, enter the demo site’s URL “[demo.testim.io](http://google.com)”, then click **Create Test**.\
   A new browser window opens showing the Space & Beyond website. This is the **Application Under Test (AUT)** window. The series of actions that you take in this window are recorded and saved as a test in Testim.
4. In the AUT browser, log in to the system (using any username and password).

   <Image align="center" src="https://files.readme.io/7baa100-login.png" />
5. Now, go back to the Testim Editor browser.\
   The procedure that you did on the Space & Beyond website is shown as a series of actions in the test window. Each box represents a step in the test procedure. An icon at the top left of the box indicates the type of action (click, enter text, scroll, etc.) that was performed.

<Image align="center" src="https://files.readme.io/bcf55a9-steps.png" />

6. Click **Save**.\
   The Save Test window is displayed.

<Image align="center" className="border" width="80%" border={true} src="https://files.readme.io/f78c409-savetest.png" />

> 🚧 Auto Recovery
>
> Whenever you create a new test or make changes to an existing test, make sure to save the test. But don't worry, if you close your browser before saving your test, it will be stored in your browser's cache and you should be able to resume your work. See [Recovering a test that was not saved](https://help.testim.io/docs/recovering-a-test-that-was-not-saved) for more details.

7. In the **Name** field, enter “Space & Beyond Demo 01”, then click **OK**.\
   The test is saved.\
   Congratulations, you have created your first test in Testim!

## Adding Validation

Whenever you run a test, the system automatically verifies that all of the steps in your flow are executed consecutively. However, this doesn’t ensure that each step has yielded all expected results. You can add additional validation elements to ensure that all desired results of your actions are occurring properly.\
For this tutorial we will add a validation to ensure that once the user has logged in, the Login button in the Header bar is replaced by the text “HELLO, JOHN” (on this demo site, John is always shown, independent of the username that was input.).

:fa-arrow-right: **To record the test:**

1. On the Editor screen of the *Space & Beyond Demo 01* test, hover over the last “**+**” button to the right of the Click “*LOG IN*” step.

   <Image align="center" src="https://files.readme.io/177c8fc-plus.png" />

<br />

2. Click on the **"M"** (Testim predefined steps).\
   The Predefined steps menu opens.

   <Image align="center" src="https://files.readme.io/03388a3-stepsmenu.png" />
3. Click on **Validations**.\
   The Validations section expands.

   <Image align="center" src="https://files.readme.io/12dda9f-validations.png" />
4. Select **Validate element text**.
5. In the AUT browser, click on the words “HELLO, JOHN”.

<Image align="center" src="https://files.readme.io/6b89de8-hellojohn.png" />

A new *Text Validation* step is added to your test.

<Image align="center" src="https://files.readme.io/d6cad45-hellostep.png" />

<br />

:fa-arrow-right: **To save the results for the current test version:**

1. Click on the **Save** button in the header bar.

<Image align="center" className="border" width="80%" border={true} src="https://files.readme.io/84d3a25-savetest1.png" />

2. In the **Message** field, enter a description of the test version (optional), then click **OK**.\
   Congratulations! You have successfully saved your test with the added validation. Now let’s run the test.

## Running a Test

:fa-arrow-right: **To run the test locally:**

1. On the Editor screen, click on the **Play** button in the toolbar.

<Image align="center" src="https://files.readme.io/de7d41f-play.png" />

A new browser opens and runs the test actions on the demo site. When the test is completed a pop-up window indicates whether the test was successful.

<Image align="center" src="https://files.readme.io/f0fa541-testcompleted.png" />

<br />

## Viewing Test Results

On the test Editor screen, you can view the test results. Overall run data is shown at the top of the screen. In addition, the colored icons at the top of each step indicate whether or not that action was successful.

<Image align="center" src="https://files.readme.io/bdb4507-passed.png" />

If you would like to view detailed results for a specific action, double-click on the step. The action results screen is displayed for that action.

<Image align="center" src="https://files.readme.io/e9c28f4d9ebacc87582af8b8202408a7623c08f515955eaaa2632432a46dbd3c-stepresult.jpg" />

In case of a test failure, detailed info is shown about the cause of the failure. (In the following example, the validation was set to expect “Goodbye” and the value received was “Hello”.)

<Image align="center" src="https://files.readme.io/6bb34c8-failed.png" />