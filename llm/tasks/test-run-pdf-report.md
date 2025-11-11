# 翻訳タスク (test-run-pdf-report)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

The result of your Test Run can be exported as a PDF report and sent to you via email. There are three versions of the report as follows:

- **Failed steps screenshots (recommended)** - includes screenshots of failed steps only. This can help you quickly identify issues.
- **All screenshots** - includes screenshots of all the steps in the test.
- **No screenshots** - does not include any screenshots.

The Report includes the following elements:

- **Test details** - the name of the test, its description, and basic details, including Project, Branch, OS, who ran the test, when it started/ended and its result ID.
- **Run result** - the test result summary, including indication of whether the test passed or failed, the test run duration, and the run configuration information (the test’s base URL, target device, application name).
- **Overall Summary** - displays a percentage of the steps that have passed, failed, skipped, and generated a warning.
- **Test Steps** - a list of the test steps and their results. The list may include screenshots according to the report settings during generation.

> 📘 Turbo Mode Enabled Runs
>
> If you have Turbo Mode enabled in your run, it will skips step delays and certain artifacts to accelerate the test execution and therefore will not show up in the report. However, these will be available for failed runs.

## Generating the Test Report from the Test screen

:fa-arrow-right:**To generate the report from the test screen:**

1. After running the test, in the test screen, click the three-dot menu and select **Generate PDF run report**.

   ![](/images/results/test-run-pdf-report/1ff2d09-2024-08-08_16-38-55.png)
2. Select one of the following:

   ![](/images/results/test-run-pdf-report/fb19aab-2024-08-08_16-40-29.png)

   1. **Failed steps screenshots (recommended)** - includes screenshots of failed steps only. This can help you quickly identify issues.
   2. **All screenshots** - includes screenshots of all the steps in the test.
   3. **No screenshots** - does not include any screenshots.
3. Click **Generate**.\
   After a few minutes you will receive an email with a link to download the report.

<br />

## Generating the Test Report from the Test Runs screen

:fa-arrow-right:**To generate the report from the Test Runs screen:**

1. After running the test, in the Test Runs screen, right-click the relevant test and select **Generate PDF run report** .

   ![](/images/results/test-run-pdf-report/74be35f-2024-08-08_16-52-25.png)
2. Select one of the following:

   ![](/images/results/test-run-pdf-report/fb19aab-2024-08-08_16-40-29.png)

   1. **Failed steps screenshots (recommended)** - includes screenshots of failed steps only. This can help you quickly identify issues.
   2. **All screenshots** - includes screenshots of all the steps in the test.
   3. **No screenshots** - does not include any screenshots.
3. Click **Generate**.\
   After a few minutes you will receive an email with a link to download the report.
