# 翻訳タスク (record-tests-with-salesforce)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

When a predefined Salesforce step is not available, you can record your desired to bridge the gap. Tests can be created using a combination of predefined and recorded steps. This means that you can add predefined steps and then start recording additional steps after these predefined steps.

:fa-arrow-right: **To record steps in the middle of the test:**

1. Add predefined steps to get to the section in your workflow where you want to record the steps.
2. Hover your mouse over the arrow between the steps where you want to add the recorded steps and select **Toggle Breakpoint**.
3. Run the test.\
   The test will pause at the breakpoint.
4. Hover your mouse over the breakpoint and select **Start recording at this position**.
5. In the AUT/Salesforce browser perform the actions you want to record.  
6. Click the **Stop Recording** button.\
   The steps are added to the test and you may continue adding more steps.  

   ![](/images/salesforce-utilities/record-tests-with-salesforce/4e06137-recording.gif)

:fa-arrow-right: **To record steps at the end of the test:**

1. Add predefined steps to get to the section in your workflow where you want to record the steps.
2. Hover your mouse over the the end of the test and select **Start recording at this position**.
3. In the AUT/Salesforce browser perform the actions you want to record.  
4. Click the **Stop Recording** button.\
   The steps are added to the test and you may continue adding more steps.

# Validating Values

The Recorder can be used to create steps that validate values. After entering the validate mode in the Recorder, Windows Alt + V / Mac Option + V, you can highlight the Fields and Values to be validated. The Recorder is aware of the Field name and the Values, this includes compound Fields such as Addresses, where the Street and City are separate Fields that can be validated independently.
