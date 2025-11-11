# 翻訳タスク (team-productivity)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

Have better visibility to your team’s work and productivity

## Team productivity report

Tests are counted per branch. So, if user created or updated the test in a specific branch this branch,\
when filtered, will reflect that user work. If a branch is merged, for example to master, the work is still\
counted on the branch (and not the master). If you want to see the full extent of the users work filter all\
branches and master.

> 📘 Note:
>
> This counting mechanism was implemented to refrain from having work duplicated.

### Access team productivity report

To access the team productivity report, go to Insights --> Reports --> Team productivity tab

![](/images/insights/team-productivity/88a14b0-Screen_Shot_2021-11-23_at_14.28.30.png "Screen Shot 2021-11-23 at 14.28.30.png")

### Team productivity - view

In the top section you can see:

1. How many teammates total in the project
2. Active teammates  - teammates that either created or updated a test, based on the time frame filtered, and the users filtered
3. Tests created - how many tests were created at the time selected by the team members selected, compared to the previous period
4. Tests updated - how many tests were updated at the time selected by the team members selected, compared to the previous period

![](/images/insights/team-productivity/0961ae3-Screen_Shot_2021-08-08_at_13.50.12.png "Screen Shot 2021-08-08 at 13.50.12.png")

In the bar view, you can see:

1. New tests created by users (+/- previous period )
2. Tests updated by users (+/- previous period)

### Team productivity - filters

#### Branch filter

By default, the team productivity report data is from the master branch only. You can select which branches you would like to filter, including multiple branches. When branch is switched the property filter in changed to select, by default, the newly selected branch.

> 📘 Note:
>
> when using read-only master the report is showing data from all branches by default.

#### User filter

By default, all users are shown in the report. You can select specific team members from the filter.
