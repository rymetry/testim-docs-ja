---
title: 'フック（Hooks）'
description: '原文: https://help.testim.io/docs/hooks'
category: '高度な機能'
order: 8
updated: '2025-11-02'
keywords:
  - testim
  - hooks
  - advanced-features
---
フックは、各ステップの前後やテストの前後に、既存の[共有ステップ](/docs/groups/shareable-steps)や[共有グループ](/docs/groups/groups)を実行する仕組みです。設定後は通常どおりテストを実行でき、フックは他のステップ同様に実行されます。実行後、結果の可視化も可能です。

## よくある用途

### Before test の例

テスト開始前に特定の処理を実行します。

- Initialization of variables:  can be used to initialize variables that will be used in each test.
- Preparation of test environment: can be used to prepare the test environment by setting up a database connection, creating necessary directories, or starting a server.
- Cleaning up after previous tests: can be used to clean up after previous tests and ensure that each test starts with a fresh environment.
- Sharing setup between tests: can be used to setup shared resources that will be used by multiple tests, reducing duplication of logic.

### After test の例

テスト終了後に特定の処理を実行します。

- Cleaning up test environment: can be used to clean up the test environment by closing database connections, removing temporary files, or stopping a server.
- Verifying results: can be used to verify the results of a test, such as checking the contents of a file, or the state of a database.
- Restoring original state: can be used to restore the original state of the environment, ensuring that the next test starts with a clean slate.
- Sharing cleanup between tests: can be used to clean up shared resources that were used by multiple tests, reducing duplication of logic.

### Before/After each step の例

The before and after each step hooks allow you to execute logic before and after each step in a test.

- Debugging: The before and after step hooks can be used to add 'debugging' statements or to understand the state of the application before and after each step in a test.
- Verifying intermediate results: The after step hook can be used to verify the intermediate results of a test, such as checking the values of variables after each step.
- Sharing setup between steps: The before step hook can be used to set up shared resources that will be used by multiple steps, reducing duplication of logic.
- Monitoring progress: The after step hook can be used to monitor the progress of a test, such as logging the results of each step.

> 📘
>
> 関連ステップが条件でスキップされる設定でも、Before/After step フックは実行されます。

# フックの作成

フックはテスト設定の構成（Test Configuration）と／または設定ファイル（Config File）で作成します。新規／既存の構成で設定可能な方法:

- プロパティパネルから作成 — テスト内で選択した構成を編集
- 構成リストから作成 — 構成一覧画面で新規作成／編集し、対象テストに適用
- 既定構成から作成 — テストのデフォルト構成を編集（既存編集／新規作成）

> 📘
>
> フックのコピー／切り取り＆貼り付けはできません。

The following table summarizes which type of hook can be configured through each of the methods mentioned above:

| Hook Type        | Test Configuration | Config File | Comments                    |
| :--------------- | :----------------- | :---------- | :-------------------------- |
| Before each step | V                  |             |                             |
| After each step  | V                  |             |                             |
| Before test      | V                  | V           |                             |
| After test       | V                  | V           |                             |
| Before suite     |                    | V           | Not presented in the editor |
| After suite      |                    | V           | Not presented in the editor |

## テスト構成から作成

Test Configuration Hooks can be created via the Properties panel, via the Configuration list screen, or via the test's default configuration settings.

The Some Test Configuration Hooks

### プロパティパネルから作成

テストの**プロパティパネル**から作成できるフック:

- **Before test handler** - will run before the test.
- **Before each step handler** - will run before each step in the test
- **After each step handler** - will run after each step in the test
- **After test handler**- will run after the test

:fa-arrow-right: **手順:**

1. In the test click the **Show Test Properties** button.

![](/images/advanced-features/hooks/8c42f76-2023-01-03_14-15-34.png)

2. In the **Properties** panel, in the **Configuration** section, click the **Edit** button.

![](/images/advanced-features/hooks/c4e3ae5-2023-01-03_14-33-45.png)

The **Edit Configuration** pane is displayed.

3. In the **Before/After Hooks** section, select the checkbox of the hook type you wish to create:  
   _Before test handler - will run before the test.  
   _ Before each step handler - will run before each step in the test  
   _After each step handler - will run after each step in the test  
   _ After test handler - will run after the test

![](/images/advanced-features/hooks/b9e4709-2023-01-03_14-51-20.png)

4. Select the shared step or group from the drop-down menu.

![](/images/advanced-features/hooks/bd656ae-2023-01-03_14-58-41.png)

5. If you have selected **After each step handler** or **After test handler** options, select one of the following options under Run on:
   - Always - specifies that the hook will always run.
   - Success - specifies that the hook will run if the step/test was successful.
   - Failure - specifies that the hook will run if the step/test has failed.

![](/images/advanced-features/hooks/7e42513-2023-01-04_14-36-47small.png)

6. Click **Save** to save the test.  
   The hooks are added to the specific test.

![](/images/advanced-features/hooks/603e29d-propertiespanel.gif)

### Creating hooks via the Configuration List screen

The following hooks can be created via the **Configuration List** screen:

- Before test handler - will run before the test.
- Before each step handler - will run before each step in the test
- After each step handler - will run after each step in the test
- After test handler - will run after the test

:fa-arrow-right: **To create a hook via the Configuration List screen:**

1. Go to **Runs > Configuration List**.
2. Click **Create New**.

![](/images/advanced-features/hooks/fea2a3f-2023-01-03_15-30-30.png)

3. In the **Add New Configuration** screen click **Advanced**.

![](/images/advanced-features/hooks/50907d5-2023-01-03_15-48-32.png)

4. In the **Before/After Hooks** section, select the checkbox of the hook type you wish to create:
   - Before test handler - will run before the test.
   - Before each step handler - will run before each step in the test
   - After each step handler - will run after each step in the test
   - After test handler - will run after the test

![](/images/advanced-features/hooks/b5ea260-2023-01-03_15-49-37.png)

5. Select the shared step or group from the drop-down menu.
6. If you have selected **After each step handler** or **After test handler** options, select one of the following options under **Run on**:
   - **Always**- specifies that the hook will always run.
   - **Success**- specifies that the hook will run if the step/test was successful.
   - **Failure**- specifies that the hook will run if the step/test has failed.
7. Click **Add**.  
   At this point the configuration with the Hooks will be available to be used in the relevant tests.

![](/images/advanced-features/hooks/0cbe19a-configlist.gif)

### Creating hooks via the Default Configuration setting

:fa-arrow-right: **To create a hook via the Default Configuration setting:**

1. In the test, in the **Default Configuration** setting, click the **Edit** button.

![](/images/advanced-features/hooks/54cf195-2023-01-04_13-02-27.png)

2. To create a new configuration, click the**Custom (create new) +** option from the drop-down menu.

![](/images/advanced-features/hooks/c6f2e2e-2023-01-04_13-05-48.png)

   The **Change Default Configuration** dialog is displayed.

3. In the **Before/After Hooks** section, select the checkbox of the hook type you wish to create:

- Before test handler - will run before the test.
- Before each step handler - will run before each step in the test
- After each step handler - will run after each step in the test
- After test handler - will run after the test

![](/images/advanced-features/hooks/4bfbda7-2023-01-04_13-29-01.png)

4. Select the shared step or group from the drop-down menu.
5. If you have selected **After each step handler**or **After test handler**options, select one of the following options under **Run on**:
   - Always - specifies that the hook will always run.
   - Success - specifies that the hook will run if the step/test was successful.
   - Failure - specifies that the hook will run if the step/test has failed.
6. Click **Change** to save.  
   The test will include the new default configuration.

![](/images/advanced-features/hooks/c475584-defaultconfig.gif)

## Test Configuration Hooks Run Parameters

The following Test Configuration Hooks have additional run parameters available only to them that can help gather more information on the test. This information is available in the step/test itself, so, for example, you can a custom step with code that will use the data in these parameters:

- **After each step handler parameters** - the after step test configuration hook includes the following objects and parameters:
  - \_stepData
    - testName - the name of the test.
    - name - the name of the step.
  - \_stepInternalData
    - hookType - the type of hook (e.g., afterStep)
    - path - the URL of the step.
    - stepId - the ID of the step.
    - projectId - the ID of the project.
    - branch - the name of the branch.
    - testId - the ID of the test.
    - testResultId - the ID of the test result.
    - type - the type of step (e.g., action-code-step).
    - failureReason - the reason for failure if failed.
    - errorType - the type of error if there is an error.
- **After test handler parameters** -  the after test test configuration hook includes the following objects and parameters:
  - \_stepData
    - testName - the name of the test.
  - \_stepInternalData
    - hookType - the type of hook (e.g., afterTest)
    - projectId - the ID of the project.
    - branch -  the name of the branch.
    - testId - the ID of the test.
    - testResultId - the ID of the test result.
    - failureReason - the reason for failure if failed.
    - errorType - the type of error if there is an error.

# Creating Hooks via the Config File

The Configuration File is a common JS containing all the required parameters to run your test and/or test suite. It includes run hooks which can be used to setup the application backend and define parameters before/after a single test or all tests.  
Through the Config File it is possible to set the following hook types:

- Before test - will run before the test
- After test - will run after the test
- Before Suite - will run before the suite
- After Suite - will run after the suite  

The following guides provides detailed instructions on how to configure before/after hooks through the Config File -

For general information about Config file - [https://help.testim.io/docs/configuration-file-run-hooks](https://help.testim.io/docs/configuration-file-run-hooks)

For instruction on how to add config file parameters via hooks - [https://help.testim.io/docs/configuration-file-parameters#defining-parameters-in-a-configuration-file](https://help.testim.io/docs/configuration-file-parameters#defining-parameters-in-a-configuration-file)

# Hooks Visualizations

After running the test that includes hooks the following visualizations will be displayed.

> 📘
>
> When running tests in Turbo Mode, hooks presentation will not be available to avoid saving unnecessary data. However, hooks will be available only for failed runs in turbo mode.

## Viewing before/after each step hooks

Following the execution, steps that include before/after step hooks have a “Hook” button that is displayed when hovering over the step.

![](/images/advanced-features/hooks/1946c2e-2023-01-08_19-27-53.png)

To view the shared steps/group inside the hook, click the **Hook**button. The hook steps will appear before or after the step as follows:

![](/images/advanced-features/hooks/da1ff7a-2023-01-09_14-42-53.png)

> 📘
>
> To close, click the Hook button again.

To open the hooks for **multiple steps at the same time**, select the desired steps and click the **Hook** button on the editor toolbar.

![](/images/advanced-features/hooks/a8cac90-2023-01-10_11-58-24.png)

If the hook is a shared group, double-clicking the hook step will open the shared group, displaying its steps.

![](/images/advanced-features/hooks/4be982c-2023-01-09_16-20-49.png)

> 📘
>
> If you have selected to use a shared group, the before/after each step hooks will not appear in the group level, but rather in the group’s internal steps.

The step is connected to the related hook step, which it is configured to run before/after, and the connection is indicated with a circle and dotted arrow.

![](/images/advanced-features/hooks/fde7478-hooks_with_callouts.png)

The hook step itself is indicated by a gray bottom with the hook icon and a thicker border. Just like a regular step, you can double click the hook step to view its details. The number at the top right corner indicates the number of tests that are using this shared step (the hook step is actually a shared step that is currently used as a hook).

> 📘
>
> The hook step itself can be viewed but cannot be edited. However, it is possible to edit it by adding it to a test and editing it from there, as any other shared step.

> 📘
>
> When clicking on the **View Screenshot** of a hook step to view the side-by-side view, the **Baseline** side will not be displayed, only the result will be displayed.

## Viewing before/after test hooks

The before/after test hooks run once before/after the test. Following the execution, the first step (setup step) will include a “Hook” button that is displayed when hovering over the step.

![](/images/advanced-features/hooks/26263ab-2023-01-09_14-19-57.png)

To view the shared steps/group inside the hook, click the Hook button. The hook steps will appear before the step as follows:

![](/images/advanced-features/hooks/fefda67-2023-01-09_14-42-53.png)

The step is connected to the related hook step (before it), which it is configured to run before the test. The connection is indicated with a circle and dotted arrow.

![](/images/advanced-features/hooks/2be214f-hookscallouts2.png)

The hook step itself is indicated by a gray bottom with the hook icon and thicker border. Just like a regular step, you can double click the hook step to view its details. The number at the top right corner indicates the number of tests that are using this shared step (the hook step is actually a shared step that is currently used as a hook). On the right side of the Setup step there is an arrow indicating that there is also an after test hook. Click on the arrow to shift to the "after test hook", which is located after the last step.

> 📘
>
> The hook step itself can be viewed but cannot be edited. However, it is possible to edit it by adding it to a test and editing it from there, as any other shared step.

> 📘
>
> When clicking on the **View Screenshot** of a hook step to view the side-by-side view, the **Baseline** side will not be displayed, only the result will be displayed.

## Viewing hooks that did not run due to success/failure conditions

When creating the hook, it is possible to configure that the hook step will run only on success/failure of the step/group. Hook steps that didn’t run due to a success/failure condition, will be marked with a blue dot, as seen below.

![](/images/advanced-features/hooks/b8ecffe-2023-01-10_13-37-28.png)

The hook step itself will include a blue ‘info’ indication and the connecting arrow will be marked in blue, as seen below.

![](/images/advanced-features/hooks/b53a405-2023-01-10_13-43-21.png)

Hover your mouse over the “info” to view the reason the step did not run.

![](/images/advanced-features/hooks/bd7554b-2023-01-10_13-46-41.png)

## Viewing errors related to hooks

Following the test execution, you may encounter error(s) in your test.  
If the error is on a hook step, a red dot on the step indicates that there is an error in the related hook step. On the left side of step (for both ‘before each step’ hook error & ‘before test’ hook error) and on the right side of step (for both ‘after each step’ hook error & ‘after test’ hook error).

![](/images/advanced-features/hooks/2e6d6d0-2023-01-10_13-59-44.png)

Click the hook button to view the hook step.

![](/images/advanced-features/hooks/da8c532-2023-01-10_12-24-18.png)

It is possible to view the erred steps, even if they are inside a group, with a single click.  
:fa-arrow-right: **To drill directly down to the error:**

1. Click the **See Error** link.

![](/images/advanced-features/hooks/4a6b5dd-2023-01-10_12-23-08.png)

The shared group/step that includes the error is displayed and the specific error step is highlighted.

![](/images/advanced-features/hooks/9f90f12-2023-01-10_12-24-18.png)
