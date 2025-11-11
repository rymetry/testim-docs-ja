# 翻訳タスク (visual-validation-test-results)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

If a project is integrated with Applitools, the test results also include information specific to the visual validation settings.

## Overall Test Results

The **Run Config** section becomes available for every test run in a project that is integrated with Applitools.

:fa-arrow-right: **To view the Visual Validation parameters:**

1. Navigate to **Runs > Test Runs** and open a test run.
2. In the **Run Config** section of the the test run, click the **plus sign** to display the visual validation parameter configuration under which the test was run. For more information, see [Visual Validation Parameters](doc:pixel-validation-and-pixel-wait-for#visual-validation-parameters).

![883](/images/results/visual-validation-test-results/c6419a9-run-config.jpg "run-config.jpg")

## Step Results – Side by Side View

In visual validation steps that were run under multiple environments, when viewing the “Side by Side” view, the **Step Config** information on which the step was run is shown. For more information on test configuration, see [Setting the Test Configuration](doc:how-to-record-a-test#step-3--setting-the-test-configuration).

![3852](/images/results/visual-validation-test-results/343cfce-6e55497-Testim_574a.png "6e55497-Testim_574a.png")

If the test includes visual validation steps which were run on more than one environment, the screenshots of these steps shown in the result are from the run on the main/initial environment, and a notification is shown on the bottom of the screen.

:fa-arrow-right: **To view the screenshots from the runs on additional environments:**

1. Navigate to the **Side by Side** view of the test result.
2. Click the notification to open Applitools and view the screenshots from the runs on the additional environments. For more information, see [Visual Validation](/docs/validations/pixel-validation-and-pixel-wait-for).

![3853](/images/results/visual-validation-test-results/690b0f7-applitoolslink.png "applitoolslink.png")
