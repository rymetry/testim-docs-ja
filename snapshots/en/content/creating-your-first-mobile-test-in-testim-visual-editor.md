# Mobile Testing Getting Started

# Welcome to Testim's mobile testing tutorial!

In this tutorial you will learn how to test a mobile app using the [Virtual Mobile Grid](https://help.testim.io/docs/virtual-mobile-grid). As part of the tutorial you will learn how to create a new test, select a device from the **Virtual Mobile Grid**, select a mobile app to be tested, record a test, and finally run it. As part of the tutorial you will record the test using [Enhanced mode](https://help.testim.io/docs/enhanced-mode-mobile), which delivers a more stable, faster, and more versatile tests compared to Appium-based testing. The tutorial does not cover all the various options in the process, but rather a specific scenario that illustrates a process from beginning to end.

> 🚧
>
> Multi-screen devices (e.g., Foldable/Flip phones) are currently not supported.

## Before we begin

Before we begin, make sure you have the following:

* **A mobile testing project** - mobile testing requires a mobile testing project that is separate from the web testing project. If you do not have an existing mobile project, contact Tricentis support.

> 📘 Note:
>
> Each project is assigned to a single mobile operating system. A separate project is required to create/run tests on different operating systems. For example, you cannot create a test for an iOS device if the project was created for Android.

* **Virtual Mobile Grid** - The Virtual Mobile Grid does not require any special integration. It is included in the license for paying customers. However, for Community license, it is possible to enroll in a free trial as a Company Owner or Project Owner. During the free trial period, a variety of virtual devices (Android and iOS) will be available for you to use. For more information, see [Virtual Mobile Grid](https://help.testim.io/docs/virtual-mobile-grid).

> 📘 Free Trial limitations
>
> The following limitations apply to the free trial:
>
> * No parallelization
> * Executions are limited to 10 minutes
> * Executions can run once every hour
>
> If you need additional capabilities, please contact your Tricentis representative.

* **Application Requirements** - since in this getting started guide we will be using [Enhanced Mode (Mobile)](https://help.testim.io/docs/enhanced-mode-mobile) only, the following requirements apply:
  * Native apps - For Android devices - Java or Kotlin apps. For iOS devices - Objective C or Swift.
  * Native apps with Webviews
  * React Native apps
  * Flutter apps

## Recording a Mobile Test

You can record a test on a mobile device to be run manually or automatically at a later time. During the test you can record only a single application from one device.  However, when playing back the test, you will be able to run the same test on another device than the device used during the recording.

> 📘
>
> Enhanced mode is only available on VMG.
>
> * A test recorded with Enhanced mode can only run on VMG virtual devices.
> * A test recorded with Appium compatibility mode can run on physical or virtual devices from your local devices, external grids, and VMG.

:fa-arrow-right: **To record a mobile test:**

1. From the Dashboard screen click the **New Test** button.
2. To begin recording your test, click the **Record** button in the action menu.
3. Select a device for your test. In this tutorial we are using a virtual device from the Virtual Mobile Grid. To select the device, click Virtual Mobile Grid option and then under **Device**, select the desired device, and under **OS Version**, select the desired operating system version. Click **Next** to continue.
4. Select an **Application** to be tested. In this tutorial we will test the Wikipedia app from the **Demo App** category.  Click **Demo App** and then navigate and select the desired application. Click **Done** to finish.

> 📘
>
> When running the test on Virtual Mobile Grid it may take about 30 seconds up to a minute to initiate the test. This is the time VMG needs to create a fresh virtual device from a pristine device image and install your app on it.

<Image align="center" src="https://files.readme.io/5d1fd0015ff99173416febeebefa3abad4930450040098d68907a80e17194461-gettingstedvid.gif" />

> 📘 Note:
>
> Each test can only interact with a single application.

7. An **AUT (Application Under Test) Mirroring Viewer** is displayed with the opened application under test. The viewer allows you to view the device and interact with the application under test, while Testim records the actions.

<Image align="center" src="https://files.readme.io/8429769aea466e4d548d3dd553d4c98d8e6fd2bee5ce1eb651dccf003da76dc8-gettingstartedwithoutblue.gif" />

> 🚧 Important Notice
>
> When recording a test, try to choose text elements and avoid outer frames, images and icons for better stability.

![](https://files.readme.io/b4b47b7-image_20.png "image (20).png")

8. To stop recording, click the **Stop Recording** button or close the Viewer window.

<Image align="center" width="smart" src="https://files.readme.io/92a68f8-stoprecording.png" />

9. Click the **Setup step** and enter a **Test Name** and **Test Description**.

   <Image align="center" src="https://files.readme.io/9bad4a3554317dbabbc58a18f4517013812d21ee8d0b72850799a3126a4ad786-setupstep.png" />
10. Click **Save** to save the test.

### Supported Mobile Actions

The following actions are currently supported when using the AUT Viewer during the recording of the test:

* **Tap** - simulates a user tapping an element on the mobile device screen. To create this step, click the mouse on the AUT Viewer screen during recording.
* **Swipe Vertical** - simulates a user pressing and dragging their finger across the screen vertically. To create this step, click the mouse, drag the cursor in a vertical direction, and release the mouse button.
* **Swipe Horizonal** - simulates a user pressing and dragging their finger across the screen horizontally. To create this step, click the mouse, drag the cursor in a horizontal direction, and release the mouse button.
* **Set Custom Text** - simulates a user entering text into a text field in the app. When hovering your mouse on a text element, the element is highlighted in red. Clicking the text element open a **Set Custom Text** window. Enter the desired text in the field and click the **Send** button.

![](https://files.readme.io/d9a3899-image_19.png "image (19).png")

## Running a Mobile Test

Once you have created a test, you can run the test and Testim will automatically repeat the recorded steps.

> 📘 Enhanced mode run
>
> Test that have been recorded in Enhanced mode will run in enhanced mode only. To run in Appium mode, you will have to re-record the test.

### Run Mobile Test in Testim Editor

:fa-arrow-right: **To run a mobile test in the test editor:**

1. Navigate to the **Test List** and select the test you want to run.

![](https://files.readme.io/5cf3463-test-list.png "test-list.png")

2. Click the **Run** button in the action menu.

   <Image align="center" src="https://files.readme.io/2222b370dfc1b049f82b46f7a75dc9141ca20719edbf20b0141676d96f1955c7-runtest4.png" />
3. Select the device to run the test on. If you have recorded using Enhanced Mode, you will be able to run it on a device on VMG only.
4. Click **Done**.

The device viewer window opens and runs the test actions. When the test is completed, a pop-up window indicates whether the test was successful.

<Image align="center" src="https://files.readme.io/2278ec82029e3cd85cbd466c189c3f46ccb1cee5d58f4ebdf29bc0a86328c593-runtest2.png" />

## Viewing Test Results

On the Test Editor screen, you can view the test results. The test result (Passed or Failed) is displayed at the top of the test.  In addition, the colored icons at the top of each step indicate whether or not that action was successful.

<Image align="center" src="https://files.readme.io/8103c68ddbc456ee67fc4e9139c6f5f822ced0d54c4017ba486c2c13ea314d60-runtest3.png" />

If you would like to view detailed results for a specific action, double-click on the step. The action results screen is displayed for that action.

In case of a test failure, detailed info is shown about the cause of the failure.

<Image align="center" src="https://files.readme.io/3cdb29d44deb4ca16f347c400a15dc7b826ca80b8e7b2283bd90ee1c71c927ba-Test_failed.png" />