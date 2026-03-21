# Flaky tests

Find your flaky tests easily using Testim's library

A test is considered flaky if it passed after a retry, meaning on the first try it failed and then after one or more retries it passed. To read more about retries and how to set them up, read [here](https://help.testim.io/docs/the-command-line-cli#failed-test-retries).

> 📘
>
> A flaky test becomes normal only after 10 consecutive passes or fails without retries.

Testim provides you with an easy way to find these flaky tests, and decide what will be their status.

> 📘 This is a PRO feature
>
> This feature is only open to projects on our professional plan. To learn more about our professional plan, see [here](https://www.testim.io/pricing/).

## Find your flaky tests

This feature is part of the **[Test Status](https://help.testim.io/docs/test-status)** feature. To use this feature, make sure you have turned on the **Test Status** feature in the Testim LABS settings.\
:fa-arrow-right: **To view your flaky tests:**

1. Go to **Test List ⇒ Tests**.
2. Click the **Filter** button.
3. In the **Filter Test** pane, under **Show only flaky tests**, select the Yes checkbox.

![](https://files.readme.io/af759d0-Jan-28-2021_11-20-25.gif "Jan-28-2021 11-20-25.gif")

The tests that passed on a re-run will appear with a yellow mark in the "Last Runs" column.

![](https://files.readme.io/03bc19a-Untitled.png "Untitled.png")

## Changing flaky tests status

Based on the reason for the flaky test, you may want to consider changing its status. The following steps are recommended for each reason:

* **Test is still in progress and requires additional work**- in this case, if you want the test to keep running,  it is recommended to change the test status to **"Evaluating"**. After changing the status, the test will keep running but will not fail the CI/Scheduled run.
* **There is a bug in your app** - in this case, you should consider two options:
  * If you would like to fix the bug immediately - make sure the test has an **"Active"** status, so in case it fails, the entire run will fail. In the meantime keep working on fixing the bug in your app.
  * If would like to fix the bug later - in this case you should change the test status to **"Quarantine"**. The test will not run as part of your CI/Scheduler. After fixing the bug you can change the test status to either **"Evaluating"** or **"Active"**.

> 📘
>
> In case you identified a bug in your app, it is also recommended to tag the failures as "Bug in app". To learn more about result tagging, see [here](https://help.testim.io/docs/tagging-failed-runs-with-failure-types).