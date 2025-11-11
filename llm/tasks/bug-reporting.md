# 翻訳タスク (bug-reporting)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

Learn how to add labels to your tests

Testim offers an easy way to capture and report bugs. The bug reports can be shared through a variety of bug trackers, including Jira, Slack, Trello, and Github.

## How bug reports are created

Bug reports can be created in two ways:

- **Tag test failure** – when tagging a test failure, you can also report the test failure as a bug/issue. For detailed instructions, see [Tagging failed runs with failure types](/docs/results/tag-remote-runs-failures).
- **Testim extension** – you can use the Testim extension to report bugs found on web pages (i.e., not related to tests) straight from your web browser. For detailed instructions, see [Testim Extension - Capture Video & Bug Scenario](/docs/testim-extension/testim-extension-capture-video-bug-scenario).

## What can be included in the bug report

- Automated test - simply run the test locally in your browser and reproduce the bug.
- Annotated screenshot
- Video recording of you reproducing the bug
- Step by step screenshots of each interaction taken to reproduce the bug
- A text description of the "steps to reproduce" of the bug, which is automatically generated.

## Connecting the bug report to the bug tracker

Before you begin, you need to connect Testim to the relevant bug tracker:\
• [Jira](/docs/bug-tracker-settings/connecting-testim-to-jira)\
• [Trello](/docs/bug-tracker-settings/connecting-testim-to-trello)\
• [Slack](/docs/bug-tracker-settings/connecting-testim-to-slack)\
• [Github](/docs/bug-tracker-settings/connecting-testim-to-github)
