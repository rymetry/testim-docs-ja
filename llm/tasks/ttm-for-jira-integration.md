# 翻訳タスク (ttm-for-jira-integration)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

Show Tests run results in your TTM for Jira project

## What is TTM for Jira?

[Tricentis Test Management (TTM) for Jira](https://www.tricentis.com/products/test-management-jira) is an end-to-end test management inside Jira that keeps QA and development aligned, which allows you to collaborate and build quality into your software from idea to production.

TTM for Jira is in the [Atlassian Marketplace](https://marketplace.atlassian.com/apps/1228672/tricentis-test-management-for-jira), designed specifically for organizations who want to place test management directly within Jira. With TTM for Jira, QA, development, and the business can collaborate closely to deliver quality software together.

- To setup TTM for Jira please follow the instructions [here](https://documentation.tricentis.com/tricentis_test_management_for_jira/content/admins/admins_overview.htm).
- To view TTM for Jira documentation see [here](https://documentation.tricentis.com/tricentis_test_management_for_jira/content/introduction.htm).

## Why do I need a TTM for Jira integration?

The TTM for Jira integration allows you to link a test in Testim to a test case in TTM for Jira. After running the test in Testim, the test results will be automatically displayed in TTM for Jira execution results, giving you a single view of the tests that were executed in Testim and in TTM for Jira.

You can map Testim tests to TTM for Jira in two ways:

- [Manually map a single Testim test to TTM for Jira](#manually-map-a-test-in-testim-to-ttm-for-jira)
- [Bulk create & map Testim test groups/folders to TTM for Jira](#bulk-create--map-test-cases-to-ttm-for-jira)

## Setting up TTM for Jira Integration

Before using the TTM for Jira and Testim integration, you will need to connect Testim to the desired TTM for Jira project(s). This process is required only once.

:fa-arrow-right: **To connect Testim to TTM for Jira:**

1. Go to **Settings > Integrations** tab. Under **Test Management** you will find various integration\
   modules.
2. In the TTM for Jira integration module, click **login**.

![](/images/test-management-integrations/ttm-for-jira-integration/ae5b0d9-ttmlogin.png)

3. Open TTM for Jira and create an API key and copy it – see [Configure Tricentis Test Management for Jira](https://documentation.tricentis.com/tricentis_test_management_for_jira/content/admins/settings.htm) for more information.
4. Paste it in the **API Key** field in Testim.
5. In Testim, click **Connect**

![](/images/test-management-integrations/ttm-for-jira-integration/cea53ae-addttmapikey.png)

6. In Testim, select the TTM for Jira project(s) from the list that you would like to associate.

![](/images/test-management-integrations/ttm-for-jira-integration/768edf2-slectproject.png)

At this point Testim is associated to a project in TTM for Jira, but not mapped to a specific test.

> 📘 Note:
>
> You may connect one TMS (Test Management System) at a time. So, if your Testim system is already connected to another TMS, you will need to disconnect this TMS first and only then connect TTM for Jira. Note that by disconnecting the TMS, you will remove the connections between the tests. So, if you want to connect to the previous TMS again you will have to recreate the connections as well.

## Manually Map a test in Testim to TTM for Jira

After setting up the integration between Testim and TTM for Jira, you are ready to map a specific test in Testim to a test in TTM for Jira.

:fa-arrow-right: **To map a test in Testim to a test in TTM for Jira:**

1. In Testim, open the test that you would like to be mapped.
2. Inside the test in Testim, click the **Properties** icon on the **Setup** step (the first step).

![](/images/test-management-integrations/ttm-for-jira-integration/56e072e-setupstepprops.png "setupstepprops.png")

3. In the setup step's **Properties** panel, under Test in TTM for Jira, select the TTM for Jira project from the first drop-down menu and then the specific test from the second drop-down menu. There can be multiple mapped test cases

![](/images/test-management-integrations/ttm-for-jira-integration/7957825-maptotest.png)

10. Click Test **Save**.

## Bulk Create & Map Test Cases to TTM for Jira

For customers who have an existing Testim app with a large number of tests and wish to start working\
with TTM for Jira, our bulk creation and mapping feature offers a convenient solution. Customers can select a group of tests from the Testim test library and Testim will automatically create test cases in TTM for Jira and map Testim test cases to the newly created Jira test cases.

> 📘 Note:
>
> - This bulk mapping options is best suited for customers that don't currently have any tests in TTM for Jira, but this is not a requirement to use the bulk mapping feature.
> - If you have already manually mapped any tests to TTM for Jira, this bulk mapping feature will skip any tests already mapped. You can [manually unmap a test](#unmap-a-test-already-mapped-to-ttm-for-jira) if you want to include it in the bulk mapping process.

:fa-arrow-right: **To automatically bulk map Testim test cases to TTM for Jira:**

1. Navigate to the **Test Library** and **select one or more groups of tests or test folders**. In the example below, the customer has selected folder "aa1" which contains 3 tests. Within "aa1" is a subfolder "bb1" that contains 3 additional tests. With folder "aa1" selected, Testim will map all 6 tests to TTM for Jira.

![](/images/test-management-integrations/ttm-for-jira-integration/a2c0d7b-ttm4jira.png)

![](/images/test-management-integrations/ttm-for-jira-integration/6e12533-ttm4jira.png)

2. Click the **Create & map TTM for Jira tests** button in the quick navigation menu.

![](/images/test-management-integrations/ttm-for-jira-integration/1ea3500-ttm4jira.png)

3. Select the **TTM for Jira Project** where the test cases will be created.

![](/images/test-management-integrations/ttm-for-jira-integration/5ca389d-ttm4jira.png)

4. In the **Folder Path in TTM for Jira** section, select the folder paths option you want Testim to create in TTM for Jira.
   1. **Create the same Testim folder path**: your test cases in Jira will use the same names and hierarchy as your test cases in Testim.
   2. **Create all test caes in My test cases folder**: all test cases in Jira will be added to a single "My Test Cases" folder.

![](/images/test-management-integrations/ttm-for-jira-integration/330c79b-image_2.png)

5. Click the **Create & Map** button. Testim will display a progress bar.

![](/images/test-management-integrations/ttm-for-jira-integration/3750ea9-ttm4jira.png)

6. Testim will iterate through the selected Testim tests and create test cases in TTM for Jira using the Testim test case names and your selected folder structure.

![](/images/test-management-integrations/ttm-for-jira-integration/8997b82-ttm4jira.png)

7. At the end of the operation, Testim will display the mapping results. If all tests were mapped successfully, you will see a 100% completion message.

![](/images/test-management-integrations/ttm-for-jira-integration/a63029e-ttm4jira.png)

8. If any tests failed to map, you will see a message containing the total number of successful tests mapped and the names of any failed mappings. You can hover over the ❗icon to view additional details about the failure.

![](/images/test-management-integrations/ttm-for-jira-integration/b12eefd-ttm4jira.png)

8. After making any adjustments to your tests or TTM for Jira settings, click the **Retry all** link and Testim will attempt to map **only the failed** tests to TTM for Jira again.

![](/images/test-management-integrations/ttm-for-jira-integration/151d26f-ttm4jira.png)

### How to Know if a Test is Already Mapped to TTM for Jira

You can identify if a test has already been mapped to TTM for Jira in the Testim test properties.

:fa-arrow-right: **To see if a test has already been mapped to TTM for Jira:**

1. Navigate to the test and open the **Test Properties** panel.
2. Navigate to the **Test in TTM for Jira** section. If this section has a selected Jira project and Test Name, this test has already been mapped to TTM for Jira.

![](/images/test-management-integrations/ttm-for-jira-integration/7c5dd59-ttm4jira.png)

### Unmap a Test Already Mapped to TTM for Jira

You can manually unmap a test from TTM for Jira in the Testim test properties.

1. Navigate to the test and open the **Test Properties** panel.
2. Navigate to the **Test in TTM for Jira** section. Clear the values from the Jira Project and Test Name fields.

![](/images/test-management-integrations/ttm-for-jira-integration/36345a8-ttm4jira.png)

## Running a test and viewing the Testim test results in TTM for Jira

To view the result of a test execution in TTM for Jira, you will need to run the mapped test in Testim using a Remote Grid only. After running a mapped test in Testim, the test result will be displayed in the relevant TTM for Jira relevant project under the ‘Test Execution’ tab ([see here](https://documentation.tricentis.com/tricentis_test_management_for_jira/content/test_execution/test_cycles_runs.htm)).

![](/images/test-management-integrations/ttm-for-jira-integration/40ba92d-testexectab.png)

The names of Testim-originated test runs will use the following naming convention:

- “Testim.io `<branchName> : <executionName>" **<YYYY-MM-DD>**` or
- “Testim.io `<branchName>” **<YYYY-MM-DD>**` (If there is no execution name)

> 📘 Note
>
> Data will reflect the UTC date.

:fa-arrow-right: **To view a test execution in TTM for Jira:**

1. Click on the relevant execution and get execution details ([see here](https://documentation.tricentis.com/tricentis_test_management_for_jira/content/test_execution/test_cycles_runs.htm)).

### Upon Testim test run execution end

The following details are pushed from testim to TTM for Jira:

- **Name** - the name of the test in Testim.
- **Status** - the status of the execution. The status displayed is the TTM for Jira status, which was translated from the Testim status as follows (Testim > TTM for Jira):

| Testim                                        | TTM for Jira |
| :-------------------------------------------- | :----------- |
| ABORTED                                       | Unexecuted   |
| SKIPPED (When test is in "Quarantine" status) | Blocked      |
| TIMEOUT                                       | Failed       |
| PASSED                                        | Passed       |
| FAILED                                        | Failed       |

> 📘 Note:
>
> Changing these statuses in TTM for JIRA may cause interruption in the integration

> 📘 Note:
>
> Mandatory custom fields in TTM for Jira are not supported. Making a custom field on TTM for Jira\
> mandatory may cause the integration to stop working.
