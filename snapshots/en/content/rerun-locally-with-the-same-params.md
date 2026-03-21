# Rerun locally with the same params

The Rerun locally with same parameters option allows you to **execute a test locally based on the parameter's data in a past test run**. It overcomes the fact that these parameters may not be available, by using the data stored in the original test run results.

> 📘 Note
>
> This option is available when there is an existing result ID (via editor or test run page)

:fa-arrow-right: **To rerun a test locally with the same params:**

1. Navigate to the completed test in the **Test Editor** or the **Test Runs** screen.
2. Click the **play menu** (Test Editor) or **right click the test execution** (Test Runs) and select the **Rerun locally with same params** option.\
   ![](https://files.readme.io/09763c4-c367a60-rerunlocally.png)

> 📘 Base URL
>
> The base URL used in the selected test run will be used in the "Rerun locally with same parameters" option. The Setup Step base URL may have been overridden in the specific test run.  To learn more about base URL settings, see [Base URL](https://help.testim.io/docs/base-url).