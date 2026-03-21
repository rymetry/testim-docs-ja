# Debugging Controls

The debugging controls allow test developers to locate and fix issues in their tests, while running the test without the need to wait until the test test run is completed. If a test is lacking in coverage (e.g., new features have been added to the AUT), it is also possible to add steps to the test by recording from a specific position. The controls for recording/authoring, running, and debugging the tests are conveniently grouped closely together to create a seamless development environment, where test developers can quickly write, test, and debug their tests, all in one place.

The system supports the following debugging, running and recording capabilities:

<Table align={["left","left","left"]}>
  <thead>
    <tr>
      <th style={{ textAlign: "left" }}>
        Debugging
      </th>

      <th style={{ textAlign: "left" }}>
        Running
      </th>

      <th style={{ textAlign: "left" }}>
        Recording
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td style={{ textAlign: "left" }}>
        • [Step into](#step-into)
        • [Step over](#step-over)
        • [Step out](#step-out)
        • [Pause/Continue](#pause-and-continue-debugging)
        • [Stop Run](#stop-run)
        • [Rerun](#rerun)
      </td>

      <td style={{ textAlign: "left" }}>
        • [Run locally with debug](#running-locally-with-debugging)\
        • [Run locally without debug](#running-locally-without-debugging)\
        • [Run on Grid](https://help.testim.io/docs/running-tests-overview#running-a-remote-web-test)\
        • [Play from here](https://help.testim.io/docs/play-from-here)\
        • [Rerun locally with the same params](https://help.testim.io/docs/rerun-locally-with-the-same-params)
      </td>

      <td style={{ textAlign: "left" }}>
        • [Start recording](https://help.testim.io/docs/recording-additional-steps-to-fix-bugs#start-recording)\
        • [Start recording at position](https://help.testim.io/docs/recording-additional-steps-to-fix-bugs#start-recording-at-this-position)
      </td>
    </tr>
  </tbody>
</Table>

The enablement or disablement of the debugging, running, and recording buttons is determined by the current editor state (e.g. running, recording...).

### Breakpoints

Breakpoints are used to pause the test execution at various stages. There are two types of breakpoints:

* **Manual breakpoint** - breakpoint set manually by the user (See [Insert a breakpoint](https://help.testim.io/docs/stop-pause-debug-tests#insert-a-breakpoint) for more info)\
  ![](https://files.readme.io/4531fad-breakpoint1.png)
* **Virtual breakpoint** - breakpoint created automatically by the system when debugging controls are used (e.g., step into, step out, step over and pause). Virtual breakpoints are represented by a highlighted blinking arrow.\
  ![](https://files.readme.io/64f42cc-breakpoint2.png)

# Running locally with Debugging

Running the test locally with debugging, allows you to execute the test, while using debugging features to closely inspect certain parts of the test with more precision and control. Pausing the test execution at certain points allows you to inspect variables, step through the test, and analyze any errors or unexpected behaviors. For example, when running the test in debug mode you can pause the test at any point, step over a step to execute it, step into a group to view the execution of specific steps within this group, and more. The debug mode works on local runs only.

> 📘 Run locally option
>
> If you want to run the test locally without debugging, so the **editor will not pause when breakpoints are encountered**, use the **Run locally** option. For more information, see [Running locally without debugging](https://help.testim.io/docs/debugging-controls#running-locally-without-debugging)

:fa-arrow-right: **Run the test in debug mode:**

1. Do one of the following:
   1. Click the **Run locally with debugging** button.\
      ![](https://files.readme.io/38a770d-runlocallywithdebug.png)
   2. Click the **Run options** drop down menu and then click the **Run locally with debugging** option.\
      ![](https://files.readme.io/9a27022-rundebugdropdown.png)
   3. Press **F5**.\
      The test begins running and the **Debugging Controls** menu is displayed.\
      ![](https://files.readme.io/b68851e-debugging_controls.png)
2. To pause the test, in the **Debugging Controls Menu**, click the **Pause** button.\
   ![](https://files.readme.io/f8c64f1-pause.png)\
   After pausing the test the debugging controls are displayed. See debugging controls details below.
3. To stop the test run at any point and exit the debug mode, click the **Stop** button.\
   ![](https://files.readme.io/c3c750b-stop.png)

# Debugging Controls Menu

When running the test in debug mode, a **Debug Controls Menu** is displayed providing the following tools to navigate and run specific parts of test.

![](https://files.readme.io/c0e290c-debuggingcontrolswcallouts.png)

## Move Around

Click and drag to move the Debugging Controls Menu around.

## Pause and continue debugging

* **Pause:** Pauses the test execution at any point in the editor. When you click the "pause" button, the test execution will be paused at the “nearest” step.
* **Continue:** Continues the test execution from the current location until the end of the test has been reached.

## Step over

Use this control to skip over a group without stepping inside. When you click the "step over" button, the editor will execute the next step or group. If the next step is a group, the editor will execute the group without stepping inside it and stop after the group step, while marking where it stopped with a blinking arrow, also known as a **virtual breakpoint**. As opposed to a regular breakpoint, the virtual breakpoint is the place in the test where the system has stopped the execution.

![](https://files.readme.io/8735a97-stepover.png "stepover.png")

![](https://files.readme.io/3b312df-steopover.gif)

## Step into

Use this control to step into a group to see its internal execution.  When you click the "step into" button, the editor will open the group (display the group steps) but will not yet execute it. In this case, the virtual breakpoint will be located before the first step in the group.

![](https://files.readme.io/f6562fe-stepinto.png "stepinto.png")

![](https://files.readme.io/0d82c03-stepinto.gif)

## Step out

Use this control to exit the internal view of the group after executing its steps. This can be useful when you have stepped into a group and you want to execute the group's steps and then step out of the group. For example, if you think that the problem is not in the group itself, but its caller. When you click the "step out" button, the system will execute the remaining steps of the group, step out of the group and place the virtual breakpoint after the group step.

![](https://files.readme.io/64e5995-stepout.png "stepout.png")

![](https://files.readme.io/d8b61de-stepout.gif)

## Rerun

Use this control to run the same test again quickly and easily without having to manually stop the test and run again. This can be useful when you want to retest the same scenario or when you want to verify that a fix has resolved the issue.  When you click the "rerun" button, the system immediately begins executing the test from its beginning.

![](https://files.readme.io/9dc6997-rerun.gif)

## Stop run

The **stop run** control can be used to stop the test execution and go into "Authoring Mode". This can be useful when you have identified and fixed the problem in the test, or when you need to interrupt a long-running test or debug session.

:fa-arrow-right: **To stop the test execution:**

* While the test is running, click the **Stop Run** button.

# Running locally (without debugging)

This running option allows you to execute your test locally without any debugging features. When you run your test in this mode, the **test run will not pause if breakpoints are encountered**. This is useful when you want to quickly run your test to see its output or behavior, without the overhead of debugging.

:fa-arrow-right: **To run locally:**

* Click the **Run options** drop down menu and then click the **Run locally** option.

![](https://files.readme.io/91f0e8f-runlocally.png)

The test will run without pausing at breakpoints.