# 翻訳タスク (debug-console-errors-access-dom)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

## Debug using Chrome Console

You can use console.log(myVar) or use the chrome DevTools debugger to see errors while running the test (add a debugger to the code).

## Debug console errors and network

Testim records console errors and network errors automatically.

:fa-arrow-right: **To view errors in a test run:**

1. Navigate to your text run or execution.
2. View the error messages at the top of the test and the specific test step that failed.

![1920](/images/results/debug-console-errors-access-dom/1b081be-displayed-errors.png "displayed-errors.png")

3. Open the console log.

![401](/images/results/debug-console-errors-access-dom/154a7ab-vewconsolelog.png "vewconsolelog.png")

4. View the console log to gain insight in the specific errors.

![1161](/images/results/debug-console-errors-access-dom/8c191a6-consoleerrors.png "consoleerrors.png")

> 📘 Note:
>
> The test logs will only appear for runs on Chrome & Edge Chromium browser.

## Debug by seeing the failed step DOM

When a step fails, Testim saves a complete DOM snapshot, so you can later debug.

:fa-arrow-right: **To view the DOM snapshot of an error:**

1. Navigate to your text run or execution.
2. View the error messages at the specific test step that failed.

![270](/images/results/debug-console-errors-access-dom/1400173-steperror.png "steperror.png")

3. To view the DOM snapshot, hover over the step and click the **View screenshot** button or click the **View DOM** link in the step's properties panel.

![281](/images/results/debug-console-errors-access-dom/a6ac0aa-viewdom1.png "viewdom1.png")

![324](/images/results/debug-console-errors-access-dom/986c536-viewdom2.png "viewdom2.png")

> 📘 Note:
>
> - The DOM will only appear on Chrome & Edge Chromium browser runs.
> - The DOM will only appear on failed steps.

## Debug Step parameters

In the properties panel you can see in each step all the parameters used during the run. These parameters can help you understand what happened in each step during the run.

- **Incoming params**:  All incoming parameters that could be used in this step. Parameters can come from the exports in previous steps, from global exports carried out from previous  tests in the suite, from data driven parameters, group / step parameters, etc.
- **Local exports**: Export parameters created in this step.
- **Global exports**: Global export parameters created in this step.

![1414](/images/results/debug-console-errors-access-dom/e5d13c5-step_params.gif "step params.gif")
