# Log In As Another User

> 📘 Salesforce Step
>
> This is a Salesforce step.

**The Log In As Another User** step can be used by Admin user only. This means that before the **Log In As Another User** step you will need to add a **Log in** step in which the test will log in to your Admin account. After it logs in as an Admin, you can use the **Log In As Another User** step to log in as different users within a single test.

:fa-arrow-right:**To add a Log In As Another User step:**

1. Add a **Log in as another user** step by clicking the **+** button and under the **Salesforce** steps tab, click **Common operations** and select **Log in as another user** step.\
   The following **Properties Tab** is displayed.

   <Image align="center" src="https://files.readme.io/02cc7f3fcb3adf6183b839e319839f4a6dcf3b51fc063a61d02e2ad9427a0c07-2024-05-05_15-07-06.png" />
2. Do one of the following:

   1. If you want to select a **Persona** that has been already defined through the [Creating a persona](https://help.testim.io/docs/create-a-persona-and-add-users) process, select the desired persona from the **Select persona** drop-down menu.
   2. If you want to use a username that has not been defined as a persona, in the **Input Username** field, enter the user name by doing one of the following:

      1. **Username string** -  to enter a username as a string type the string into field. The string is automatically surrounded by a single quotation mark.
      2. **Username variable** - You can also enter JavaScript code and use a variable for the username so that each execution of the test will use a unique username from the test data. Click the **T** icon and enter a JS code. See  [Data-driven testing](https://help.testim.io/docs/data-driven-testing) to learn more.
3. In the **Navigation options** section, select any of the following options:

   1. **Stay on current page after log in as** - select this option if you want to make sure that you stay on the same page after logging in as another user.
   2. **Return to current page after log out** - elect this option if you want to make sure that you stay on the same page after logging out.
4. At the end of the test, add a **Log out** step, to switch back to Admin so that you can log in as a different user again.
5. When done, click **Save** to save the test.