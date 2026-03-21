# Apply new groups to other tests

When you create a group, automatically apply it to other applicable tests.

The auto-grouping feature encourages reuse, by finding potential grouping opportunities across the various tests in the project. As part of the group creation, Testim will identify steps that match the group's steps' sequence in other tests and automatically replace those steps with this new group. The tests with the new auto-groupings will be saved in a new branch, so you can review these changes before merging them into the master branch.

To learn more about auto-grouping - [Auto grouping](https://help.testim.io/docs/auto-grouping2)

:fa-arrow-right: **To enable auto-grouping:**

1. When creating a new [Group](https://help.testim.io/docs/groups), select the **Apply auto group on matching steps**.

![1689](https://files.readme.io/e63b692-auto-group1.png "auto-group1.png")

2. In the **Branch Name field**, enter a name for the new branch that will be created.
3. Click **Confirm**.\
   The following message appears indicating the number of tests that Testim found and performed auto-grouping.

![2426](https://files.readme.io/2a96564-Screen_Shot_2020-07-07_at_13.58.18.png "Screen Shot 2020-07-07 at 13.58.18.png")

> 📘 New branch
>
> When the auto-grouping feature is used, it creates a new branch automatically. This is to prevent creating new groups that could inadvertently impact other users or tests. If the tests affected by the new groups seem fine, you can merge the branch. If not, delete it.