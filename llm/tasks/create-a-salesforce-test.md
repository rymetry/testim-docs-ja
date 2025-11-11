# 翻訳タスク (create-a-salesforce-test)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

Salesforce tests connect to your connected Salesforce environment and carry out the user journey that you would like to test. The test includes a series of Steps, each representing another interaction with the Salesforce application.

#### Types of Steps

There are two ways to add steps to tests:

- **Manually adding steps** - you can add steps manually. The steps are organized in the following categories:
  - **Salesforce steps** -  steps that are specific to the Salesforce application usage. Salesforce steps are deeply integrated into the Salesforce application, enabling the performance of multiple actions within a single step and/or the ability to display and configure Salesforce objects, such as forms, within Testim for Salesforce application. For more information, see [Salesforce Steps](https://help.testim.io/docs/salesforce-steps)
  - **Predefined steps** - general steps that are related to the testing of a web application. For more information, see [Manual Steps](https://help.testim.io/docs/steps#manual-steps)
  - **Shared steps** - steps that are shared between multiple tests within a certain Project. For more information, see [Shared Steps](/docs/groups/shareable-steps).
- **[Recording steps](doc:create-a-salesforce-test#recording-steps)** - after clicking the Record button, a browser opens displaying the Salesforce application (which is the base URL). Every interaction, such as every input, click, etc., is automatically turned into a step in the test. Recording of steps is useful also in cases when the Salesforce steps cannot be used due to extensive customizations done in the Salesforce environment.

**It is possible to combine the two methods** - adding some of the steps manually and then recording additional steps, and vice versa.

#### Setup Step

The first step of the test is the Setup Step. This step defines the Base URL of the test. By default, this URL will be one of the generic URLs of the Salesforce homepage (`https://login.salesforce.com` or `https://test.salesforce.com`), depending on the first environment you connect. You should not need to modify this as the [Log in](/docs/salesforce-steps/sfdc-step-login) step will take you directly to the environment you have configured for the branch you are on.  

#### Selecting a Persona

In the Personas screen (see example below), you can configure for each persona (rows), different login credentials for each environment (columns). When you create a Salesforce test, you can select any persona defined by you in the **Salesforce Login step**. This persona has a login credentials configured for the environment in which the test was first created. However, if at some point you want to change the environment of this test (see [Changing the Salesforce Environment of a branch](doc:tta-for-salesforce-branch-management#changing-the-salesforce-environment-of-a-branch)) you will not need to select different login credentials in the Login step, because the system automatically allocates the relevant credentials for the newly selected environment based on the Personas screen configuration. So there is no need to re-write the test when you want to use a different environment.

![](/images/salesforce-testing/create-a-salesforce-test/89ceae3-personastable.png)

# Prerequisites

- Download and install the Testim Extension - [Why do you need Testim extension?](/docs/recording-tests/why-do-you-need-testim-extension)
- [Connect your Salesforce test environment to Testim/TTA for Salesforce](/docs/salesforce-testing/create-and-manage-test-environments).
- [Create a persona](/docs/salesforce-testing/create-a-persona-and-add-users).

# Creating a Salesforce test

:fa-arrow-right:**To create a new test:**

1. In your Testim for Salesforce account, go to **Settings > Salesforce** and click **New test** in the top right corner of the screen.  
   ![](/images/salesforce-testing/create-a-salesforce-test/e6d6f6e-newtest.png)  
   A new test is displayed with the default **Setup Step**.  
2. You can modify the step's properties by clicking the **Show Properties** icon and then editing the desired setting in the **Properties Panel**.  
   ![](/images/salesforce-testing/create-a-salesforce-test/1ca3180-properties.png)

The **Setup Step** includes the following properties:

| Parameter            | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |    |
| :------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :- |
| Base URL             | By default, this URL will be one of the generic URLs of the Salesforce homepage (`https://login.salesforce.com` or `https://test.salesforce.com`), depending on the first environment you connect. You should not need to modify this as the Log in step will take you directly to the environment you have configured for the branch you are on.                                                                                                                                                                             |    |
| Test name            | Enter a name for the test. By default, the test is saved as 'untitled test'.                                                                                                                                                                                                                                                                                                                                                                                                                                                  |    |
| Test description     | Enter an optional description for the test.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |    |
| Test owner           | By default the test owner is the user that created the test. Click to optionally select a different user from the list.                                                                                                                                                                                                                                                                                                                                                                                                       |    |
| Mock network         | Testim offers the ability to mock network traffic of the Application Under Test (AUT) as part of a test. During the test run, instead of performing real calls, the system will intercept the call and will return a mocked response. For more information, see [Mock Network Responses](/docs/mock-network-responses/mock-network-responses).                                                                                                                                                                                                         |    |
| Salesforce options   | Enable the **Log screenshots** option if you want to include screenshots of steps in the Salesforce Log. This is only available for Salesforce steps, which perform multiple actions in a single step. The screenshots of Salesforce Steps include all the various actions of the step. To view the **Salesforce Log**, after running the test, click on the step's **View Screenshot** button and then click the **Salesforce Log** tab. For performance reasons it is not recommended to enable this feature unless needed. |    |
| Configuration        | A test’s configuration determines the system specifications used to run the test. If you want to change the test configuration, click **Choose Other** to select an existing test configuration or click the **Edit** button to create a new one. For more information, see [Test Configuration](https://help.testim.io/docs/shared-configuration#creating-and-modifying-test-configurations-in-the-test-editor)                                                                                                            |    |
| Test in TTM for Jira | Tricentis Test Management (TTM) for Jira is an end-to-end test management inside Jira that keeps QA and development aligned, which allows you to collaborate and build quality into your software from idea to production. For more information, see [TTM for Jira Integration](/docs/test-management-integrations/ttm-for-jira-integration)                                                                                                                                                                                                                 |    |
| Test Data            | The Test Data is used for data-driven testing. For more information, see [Configuring a Data-driven Test From The Visual Editor](/docs/data-driven-testing/configuring-a-data-driven-test-from-the-visual-editor).                                                                                                                                                                                                                                                                                                                                  |    |

# Adding Manual Steps

Manual steps can be either Salesforce steps, Predefined steps, or shared steps.

:fa-arrow-right:   **To add a step manually:**

1. After the **Setup step**, hover your mouse on the + button.
2. Click the **Add Steps** button.
3. Click the desired tab - [Salesforce steps](/docs/salesforce-steps/salesforce-steps), Predefined steps, or Shared steps.
4. To search for a step, start typing its name in the search box to narrow the list.
5. Click the desired step from the list.  
   If it is a [Salesforce step](/docs/salesforce-steps/salesforce-steps), the **Properties** pane is displayed on the right. The pane includes two tabs:  
   **Object** - displays the Salesforce object properties for the step. These properties may include mandatory properties that require configuration.  
   **Properties** - displays additional optional properties related to the behavior of the step.  

![](/images/salesforce-testing/create-a-salesforce-test/2752956-manualstep.gif)

> 📘 Best Practice - Variable Naming Convention
>
> To automate the deletion of Records created during the execution of a testcase or suite, when creating variables in the test, follow the instructions in [Best Practice - Variable Naming Convention for Easy Cleanup](/docs/salesforce-utilities/best-practice-variable-naming-convention-for-easy-cleanup).

# Recording Steps

The Recorder can be used to add steps automatically, while interacting with the AUT (Application Under Test). This method is especially useful when adding specific steps that are not included in the Salesforce steps and/or a case where the environment is highly customized, so that the Salesforce steps are not supported. The recorder offers two modes of operation:

- **Salesforce mode** - in this mode, which is indicated by a cloud icon on the recorder (see below), the recorder performs Salesforce steps, which enable the performance of multiple actions within a single step. This mode may not work if your Salesforce environment has been widely customized. In such cases, it is possible to fall back to the Web mode and record all the individual actions/steps. The steps created using this mode are marked with a cloud icon (see below). To revert to Web mode, click the cloud icon on the recorder.

 ![](/images/salesforce-testing/create-a-salesforce-test/9381461-salesforce_mode.png)

![](/images/salesforce-testing/create-a-salesforce-test/de463f1-salesforcestep.png)

- **Web mode** - this is the regular mode of the recorder, which is indicated by a crossed out cloud icon on the recorder (see below). In this mode every interaction (e.g., click, scroll, add text, etc.) is represented by a separate step. To revert to Salesforce mode, click the cloud icon on the recorder.

![](/images/salesforce-testing/create-a-salesforce-test/6dfd53b-nosalesforcemode.png)

> 📘 When you should turn off Salesforce mode
>
> If you notice that the recorded steps are not appearing in the editor, you should turn off Salesforce mode by clicking on the cloud icon.

:fa-arrow-right: **To record steps using the Recorder:**

1. Before you begin, make sure your Salesforce environment is connected. For more information, see [Connecting your Salesforce environment](/docs/salesforce-testing/create-and-manage-test-environments).
2. Add a [Log in](/docs/salesforce-steps/sfdc-step-login) step to your test.
3. Run the test so you are logged-in to the environment to be able to record additional steps.  
4. In the test, hover your mouse on the **+** button next to the desired step and click the **Record** button. The recorder is automatically enabled in **Salesforce Mode**, which is indicated by the blue cloud icon. This means that the interactions with the application generate Salesforce steps, wherever relevant.
5. ![](/images/salesforce-testing/create-a-salesforce-test/1a9ac07-afterlogin.png)
6. Interact with the Salesforce application to generate steps. The Salesforce steps are indicated with the cloud icon.

![](/images/salesforce-testing/create-a-salesforce-test/90023bd-salesforcesteps.png)
7. When done creating the test, click **Save**.
