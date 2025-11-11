# 翻訳タスク (testops-overview)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

Scale testing with control, management, and insights

## Efficient testing operations at scale

It’s one thing for a few individuals to automate a few test cases and run them at scheduled intervals. It’s quite another for a large scale blended agile team to run hundreds of tests in the continuous integration (CI) server at development milestones. To move from a few tests to hundreds, you need  tools to help scale your testing operations, while being able to effectively manage the complexity that comes with growth in tools, people, and processes.

## TestOps - Scale testing with control, management, and insights

TestOps is a set of capabilities within Testim Automate designed to help scale automation initiatives efficiently and effectively. TestOps helps users establish and maintain control, improve organization and management, and gain insights to help unjumble the growing complexity.\
TestOps' features are organized into three categories. [Merging Branches](/docs/testops-version-control/merging-branches)

### Control

Enables setting policies and controls to ensure tests meet the highest standards.

- [**Branching with conflict resolution**](/docs/testops-version-control/merging-branches) - Synchronize your test branches with your application code, see diffs, resolve conflicts, and cherry-pick what to merge.
- [**Read-only master branch**](/docs/testops-version-control/read-only) - Protect changes to the master branch of tests by restricting changes to your subject matter experts.
- [**Pull requests with approvers**](/docs/testops-version-control/pull-requests) - Users can create tests and submit changes as pull requests to be reviewed by SMEs.

### Management

Helps find the tests faster, reduce switching costs, and improves productivity. The management features also help understand which tests are trusted and CI-ready, and which are temperamental, all while helping balance workload and preventing overlap.

- [**Test library**](/docs/test-management/test-list) - In addition to suites and labels, leaders can organize tests in folders by user type, feature, and more, helping to improve coordination.
- [**Shared Steps Library**](/docs/test-management/shared-steps-library) - Reusable, shared steps, and groups have a new library, providing quick access in the visual editor to facilitate reuse and improve test architecture.
- [**Test Status**](/docs/testops-management/test-status) - Set a test status to reflect how it’s treated by the team and the CI server, for instance, quarantine flaky tests. It helps build trust that tests are accurate when they run in the CI.
- [**Test Owner**](/docs/testops-management/test-owner) - Assign test ownership to yourself or a team member to prevent duplication of effort, distribute workload, or show responsibility.

### Insights

Gain insights from your testing data that help you understand the current state of quality, build competency, team progress, and process improvement areas.

- [**Failure trends**](/docs/tagging-failed-runs-with-failure-types) - Identify troublesome tests and recurring failure types and trends over time to inform areas for process improvement.  
- [**Duplication levels**](/docs/advanced-features/auto-grouping2) - Understand where test steps are duplicated across tests, refactor, and replace with manageable shared groups that lower ongoing maintenance.  
- **Management reports enhancements** (coming soon) - Create and send custom reports to management to demonstrate team and quality status and progress towards goals.
