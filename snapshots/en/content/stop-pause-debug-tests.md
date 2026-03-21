# Stop, Pause & Debug Tests

If you have tests that fail, you don't have to wait until your test fully runs to begin debugging. Testim includes some tools to help you quickly debug your tests during runtime:

* Stop a test that is currently running
* Pause at certain problematic/interesting points and take a closer look.
* Run the test one step at a time

## Stop a Test that is Currently Running

:fa-arrow-right: **To stop a test from running:**

1. Click the **Stop** button on the action menu.recorded.

![](https://files.readme.io/97c8cc2-test-running.png "test-running.png")

The test will be marked as failed and the last step not completed will be highlighted.

![](https://files.readme.io/84ea66c-test-failed-stopped.png "test-failed-stopped.png")

## Pause test while it's running

:fa-arrow-right: **To pause a test currently running:**

1. Click on the "Pause" button in the action menu.

![](https://files.readme.io/32e47a3-test-pause.png "test-pause.png")

2. To resume running the test, click the **Play** button in the action menu. The test will resume at the step where the test was previously paused.

![](https://files.readme.io/680cdd0-test-resume.png "test-resume.png")

## Run Step by Step

If you are debugging a test one step at a time, you can control when each step of the test runs.

:fa-arrow-right: **To run a test step-by-step:**

1. Click the drop down button next to the **Play** button and select **Run locally step by step**.

![](https://files.readme.io/32f50bb-run-step-by-step.png "run-step-by-step.png")

2. Click the \*\*Play Next Step" button on the action menu to execute the next step in the test.

![](https://files.readme.io/260b2f1-run-next-step.png "run-next-step.png")

## Insert a Breakpoint

Breakpoints will automatically pause the test at a specific step (before it runs).

:fa-arrow-right: **To insert a Breakpoint in a test:**

1. Hover on an arrow between two steps and click the **Toggle Breakpoint** button.

![](https://files.readme.io/20582a1-add-breakpoint.png "add-breakpoint.png")

This will display a breakpoint (pause symbol) between the steps.

![](https://files.readme.io/2301396-breakpointadded.png "breakpointadded.png")

> 📘 Note:
>
> You can add a breakpoint by using a keyboard shortcut (Ctrl/Cmd + B).

## Run from a specific step

Sometimes when you are debugging a test, you don't want to run a test from the very beginning each time. Testim allows you to run a test starting from a specific step.

> 📘 Note:
>
> If you have steps in your test that are dependent on previous steps (e.g., logging into an application), starting a test in the middle of the steps may always cause the test to fail.

:fa-arrow-right: **To run a test from a specific step:**

1. Hover on an arrow between two steps and click the **Play from here** button.

![](https://files.readme.io/0b8ce9d-playfromhere.png "playfromhere.png")

The test will begin running from the step after the selection.