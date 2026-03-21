# Auto grouping

Discover duplicates step sequences in your tests and group them together

> 📘 This is a Pro feature
>
> This feature is only open to projects on our professional plan. To learn more about our professional plan, see [here](https://www.testim.io/automation-testing-pricing/).

> 📘
>
> Auto grouping works only on master branch, not on any other branch. The auto grouping's status is refreshed weekly during the weekend.

> 📘
>
> You can only use auto grouping for web and mobile web projects.

Auto grouping identifies duplicate test step sequences across your project and allows replacing them with reusable groups. Tests are like code. Similar to the DRY (don't repeat yourself) principle in coding, good test architecture should minimize duplication and simplify maintenance. Groups make maintenance easier as a step is updated in a group it updates all dependent tests.

In the Auto Grouping screen, you can find a list of step sequences that match other groups or other step sequences in other tests.  You can review these auto-grouping suggestions and decide which of these should be turned into a shared group.  The tests with the newly created shared groups will be saved in a new branch, so you can review these changes before merging them into the master branch.

### Duplication level scoring

The duplication level is a score of how many duplications you have in your project. The higher the score, the project contains more duplications.\
When applying auto grouping suggestions, you can reduce your score and avoid these duplications.\
The duplication level scoring can have one of three colors:

* **Green** - your project has a **good** score and does not contain a lot of duplication levels
* **Yellow** - your project has a **medium** score in terms of duplications, it is recommended to apply auto grouping to reduce this score.
* **Red** - Your project contains a lot of duplications, applying auto grouping is highly recommended to reduce this score

# Reviewing auto-grouping suggestion

:fa-arrow-right: **To review the auto-grouping suggestions:**

1. On the main menu, click **Auto-grouping**.\
   A list of auto-grouping suggestions will appear in the **Auto Grouping** pane (black).  The list includes the following information:
   * **Project duplication level** - The duplication level of the project is a score from 0-100 that indicates the amount of duplicate steps that could have been grouped but were not yet grouped within the master branch. In order to reduce the duplication level, you can confirm the suggested auto-groupings listed below. For more information, see [Duplication level scoring](https://help.testim.io/docs/auto-grouping2#duplication-level-scoring)

> 📘
>
> The duplication calculation is an estimate that is based on weekly offline processes (which occurs every Sunday) and doesn't reflect all updates.

* **The number of duplicate steps** - these are the number of identical sequential steps found in other tests.
* **Duplication level reduction** - by accepting the auto-grouping suggestion, the project duplication level will be reduced by the specified number. For example, if the project duplication level is 14% and the specified number is 1%, after accepting the suggestion, the project duplication level will be reduced to 13%.
* **The number tests and groups** - the number of tests and groups in which the same step sequences were found.

![](https://files.readme.io/1839b7d-Screen_Shot_2021-02-28_at_9.51.19.png "Screen Shot 2021-02-28 at 9.51.19.png")

2. Click the desired auto-grouping suggestion to view its details.\
   The detailed list of tests and groups that include the duplicate steps is presented in the **Test List** pane.

<Image align="center" width="smart" src="https://files.readme.io/79c9465-Screen_Shot_2021-02-28_at_9.52.04.png" />

3. Click on the desired test/group item to view the duplicate step sequences.

![](https://files.readme.io/eb1a270-Screen_Shot_2021-02-23_at_6.14.45.png "Screen Shot 2021-02-23 at 6.14.45.png")

4. To view the duplicate step sequence in the context of the entire test in the Editor screen, click **Open Test** icon. The test will be opened in a new tab with the duplicate steps sequence highlighted.

<Image align="center" width="smart" src="https://files.readme.io/bdbe859-Screen_Shot_2020-10-27_at_11.58.10.png" />

## Editing the auto-grouping suggestion

:fa-arrow-right: **To edit the auto-grouping suggestions:**

1. In the **Auto-Grouping** pane, select one of the suggestions and then click the **Edit** icon.

![](https://files.readme.io/e52ddfd-Dec-06-2020_11-38-33.gif "Dec-06-2020 11-38-33.gif")

2. Edit the steps you would like to include in the following ways:
   * Add/remove individual steps from the suggested group by selecting/deselecting them.

![](https://files.readme.io/ca23e3b-Dec-06-2020_11-41-28.gif "Dec-06-2020 11-41-28.gif")

* Click **Clear all** to clear all the selections, and select the desired steps for the group.

> 📘
>
> There should be at least 3 steps.

At any point, you can click **Select original** to revert back to the original selections.\
After editing a suggestion, the new auto group suggestion will appear with the label **Edited**, and the test list will update based on the edited group.

![](https://files.readme.io/52cf745-Screen_Shot_2020-12-06_at_11.45.31.png "Screen Shot 2020-12-06 at 11.45.31.png")

# Filtering auto-grouping suggestions

You can narrow the number of auto-grouping suggestions by filtering them based to various criteria.\
:fa-arrow-right: **To filter the auto grouping suggestions:**

1. In the the **Auto Grouping** pane (black), click on the Filter icon.

![](https://files.readme.io/de78d7f-filter.png "filter.png")

The **FILTER & SORT STEPS DUPLICATIONS** screen is displayed with the following options:

* Test owner - only the tests of the selected test owners will be displayed.
* Test Name - only the selected tests will be displayed.
* Suite Name - only the tests in the selected Suites will be displayed.
* Group Name - only the tests that include the selected groups will be displayed.

![](https://files.readme.io/282da88-Feb-28-2021_10-23-47.gif "Feb-28-2021 10-23-47.gif")

2. Click the relevant filter option.\
   A list of items is displayed.

![](https://files.readme.io/4b25c4d-testname.PNG "testname.PNG")

3. Click **Show all**to display all available items.
4. Select the relevant items.
5. Under **Number of Steps**, if you want to filter the suggestions by the amount of duplicate steps, specify the range by entering the **Min. Steps** and **Max Steps**.
6. Click **Apply**.

# Sorting auto-grouping suggestions

In the **FILTER & SORT STEPS DUPLICATIONS** screen, you can select how to sort the auto-grouping suggestions:

* **Duplication Level - Descending (default)** - suggestions that will reduce the duplication level the most will appear at the top.
* **Duplication level - Ascending** - suggestions that will have the least impact on the duplication level  will appear at the top.
* **Number of steps - Ascending** - suggestions have the least number of  steps will appear at the top.
* **Number of steps - Descending** - suggestions have the most number of  steps will appear at the top.
* **Number of matches - Ascending** - suggestions that affect the most number of tests/shared steps will appear at the top
* **Number of matches - Descending** - suggestions that affect the least number of tests/shared steps will appear at the top.

![](https://files.readme.io/dde76be-Screen_Shot_2021-02-28_at_10.17.23.png "Screen Shot 2021-02-28 at 10.17.23.png")

# Creating the shared group based on the suggestion

:fa-arrow-right: **To create the shared group:**

1. In the **Test List** pane, select/deselect the tests/groups for which you want to implement the suggested auto-grouping.
2. Click **Create Shared Group**.
3. In the **Shared group name** field, enter a name for the shared group.
4. Under **Branch** select one of the following:
   * **New Branch** - a new branch will be created. Enter a name for the new branch in the Branch Name field.
   * **Current Branch** - if you are using a branch that is not the Master branch, the tests with the new shared group will be saved into the current branch.

![](https://files.readme.io/5ac239d-Screen_Shot_2020-10-27_at_12.11.32.png "Screen Shot 2020-10-27 at 12.11.32.png")

5. Click **Next**.
6. In case the group uses parameters, the auto-grouping feature will create new parameters for your groups. In this case, there will be an extra step for you to provide the parameter names:

![](https://files.readme.io/cc757a0-Screen_Shot_2020-10-29_at_18.53.28.png "Screen Shot 2020-10-29 at 18.53.28.png")

7. Click **Create**.\
   After creating the group, you'll get a message the auto grouping was completed and you can move on to creating the next group.

![](https://files.readme.io/0a5c88f-Screen_Shot_2020-10-28_at_13.33.39.png "Screen Shot 2020-10-28 at 13.33.39.png")