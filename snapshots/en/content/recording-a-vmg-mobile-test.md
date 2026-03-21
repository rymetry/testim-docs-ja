# Recording a Mobile Test Using VMG

The Virtual Mobile Grid can be used to record tests as well as to run them across a wide variety of iOS simulators and Android emulators. It is connected to your [Mobile Apps Library](https://help.testim.io/docs/mobile-apps).  This means that if the test that you are running uses a mobile app, this app needs to be added to the Mobile Apps Library before running the test on the Virtual Mobile Grid.

The Virtual Mobile Grid does not require any special integration. It is included in the license for paying customers. However, Community license users can to enroll in a free trial as a Company Owner or Project Owner. Once the free trial is started, the Virtual Mobile Grid is immediately available under [Device Management](https://help.testim.io/docs/view-local-connected-mobile-devices).  During the free trial period, a variety of virtual devices (Android and iOS) will be available for you to use.

## Modes

The recording can be performed in one of the following modes:

* **Enhanced mode (recommended)** -   Testim’s new Enhanced mode delivers stable, faster, and more versatile tests compared to Appium-based testing. With its zero-knowledge approach and unified API, the new Enhanced mode sees the structure of your mobile views better than any other tool in the market. This mode supports testing across all mobile applications (native, hybrid, or cross-platform frameworks). Tests recorded in this mode can be executed on VMG only. See [Enhanced Mode (Mobile)](https://help.testim.io/docs/enhanced-mode-mobile) for more details.
* **Appium mode** -  This mode guarantees the compatibility of your test with other Appium-based grids and supports local executions on your local devices. On the other hand, this mode is restricted to Appium's capabilities, meaning that you might not be able to record all your test flows, especially if you use a hybrid app or webviews. Note that existing tests will still work if you are using Appium Compatibility mode.

## Before we begin

Before we begin, make sure you have the following:

* **A mobile testing project** - mobile testing requires a mobile testing project that is separate from the web testing project. If you do not have an existing mobile project, contact Tricentis support.

> 📘 Note:
>
> Each project is assigned to a single mobile operating system. A separate project is required to create/run tests on different operating systems. For example, you cannot create a test for an iOS device if the project was created for Android.

* **Virtual Mobile Grid** - The Virtual Mobile Grid does not require any special integration. It is included in the license for paying customers. However, Community license users, it is possible to enroll in a free trial as a Company Owner or Project Owner. During the free trial period, a variety of virtual devices (Android and iOS) will be available for you to use. For more information, see [Virtual Mobile Grid](https://help.testim.io/docs/virtual-mobile-grid).

<br />

> 📘 Free Trial limitations
>
> The following limitations apply to the free trial:
>
> * No parallelization
> * Executions are limited to 10 minutes
> * Executions can run once every hour
>
> If you need additional capabilities, please contact your Tricentis representative.

* **Application Requirements -**
  * **Enhanced Mode** - the following requirements apply:
    * Native apps - For Android devices - Java or Kotlin apps. For iOS devices - Objective C or Swift.
    * Native apps with Webviews
    * React Native apps
    * Flutter apps
  * **Appium Mode** - in this mode only native apps are supported. For Android devices - **Java or Kotlin** apps. For iOS devices - **Objective C or Swift**.

## Recording a Mobile Test

You can record a test on a mobile device to be run manually or automatically at a later time. During the test you can record only a single application from one device.  However, when playing back the test, you will be able to run the same test on another device than the device used during the recording.

> 📘 Virtual/Physical recording
>
> Tests that were recorded on a virtual device, such as the virtual devices provided on the Virtual Mobile Grid, can be run on virtual devices only. And tests that were recorded on physical devices can be run on a physical device only.

:fa-arrow-right: **To record a mobile test:**

1. From the Dashboard screen click the **New Test** button.

   <Image align="center" src="https://files.readme.io/5302733-new_test.png" />
2. To begin recording your test, click the **Record** button in the action menu.
3. In the **Select a device**  dialog, make sure **Virtual Mobile Grid** is selected.
4. Do one of the following:

   1. To use [Enhanced Mode (Mobile)](https://help.testim.io/docs/enhanced-mode-mobile), select the **Enhanced mode** tab.

      <Image align="center" src="https://files.readme.io/ea12c91ebcf0e6e6d427134bdcfce9308a06ba296f36d0e93998b3b2f6f416a0-enhancedmodetab.png" />
   2. To use Appium mode, select the **Appium mode** tab.

      <Image align="center" src="https://files.readme.io/92b76958e6b1820076226cf7ede65fc2a2cf8ddafdc64c40f7ae2a63224dfa1e-appiummodetab.png" />
5. Select the desired **Device** and **OS Version** from the drop-down menus.
6. Select an **Application** to be tested by doing one of the following:
   1. **To use an app from the library** - click **From Library** and then navigate and select the desired application. Click **Done** to finish.
   2. **To upload an app** - click **Upload App** and then from the .apk file to the designated area or click to open a file explorer to find the file.

> 📘 App compilation compatibility (iOS only)
>
> If you want to record a test using a virtual device, make sure that that the app was compiled for virtual devices (.app). And vice versa, if you want to record using a physical device, make sure that the app was compiled to work on physical devices (.ipa). See [How to Prepare a .ipa for Mobile Testing](https://help.testim.io/docs/how-to-prepare-an-ipa-for-mobile-testing) for more information.

> 📘
>
> When running the test on Virtual Mobile Grid it may take about 30 seconds up to a minute to initiate the test. This is the time VMG needs to create a fresh virtual device from a pristine device image and install your app on it.

> 📘 Note:
>
> Each test can only interact with a single application.

7. Click **Done**.
8. An **AUT (Application Under Test) Mirroring Viewer** is displayed with the opened application under test. The viewer allows you to view the device and interact with the application under test, while Testim records the actions. See [Supported Mobile Actions](https://help.testim.io/docs/recording-a-vmg-mobile-test#supported-mobile-actions)

<Image align="center" src="https://files.readme.io/90125a4e26d68431edb0550f0ba266a6e101c4ccabb1965fdf3ea4abf1a7dd2d-recording2.gif" />

> 🚧 Important Notice
>
> When recording a test, try to choose text elements and avoid outer frames, images and icons for better stability.

![](https://files.readme.io/b4b47b7-image_20.png "image (20).png")

8. To stop recording, click the **Stop Recording** button or close the Viewer window.

<Image align="center" width="smart" src="https://files.readme.io/92a68f8-stoprecording.png" />

9. Click the **Show Properties** button on the **Setup step**.

   <Image align="center" src="https://files.readme.io/ca97285-showproperties.png" />
10. In the **Properties Pane**, configure the following settings:

<Image align="center" src="https://files.readme.io/4d9063d-testconfiguration.png" />

* **Test name** - enter the name for the test. By default the test name is "untitled test"
* **Description** - optionally enter a description for the test.
* **Configuration** - by default the configuration is set to use any device with any OS version that is available on VMG. If you would like to use a different configuration, see [Setting the Test Configuration](https://help.testim.io/docs/setting-the-test-configuration).
* **Test Data** - allows you to configure data-driven tests by defining a Data Set in JavaScript or multiple ordered Data Sets with a JS Array literal of objects. See [Configuring a Data-driven Test From The Visual Editor](https://help.testim.io/docs/configuring-a-data-driven-test-from-the-visual-editor).

11. Click **Save** to save the test.
    > 🚧 Auto Recovery
    >
    > Whenever you create a new test or make changes to an existing test, make sure to save the test. But don't worry, if you close your browser before saving your test, it will be stored in your browser's cache and you should be able to resume your work. See [Recovering a test that was not saved](https://help.testim.io/docs/recovering-a-test-that-was-not-saved) for more details.
12. If you want to configure additional test configuration settings, see [Setting the Test Configuration](https://help.testim.io/docs/setting-the-test-configuration).

## Supported Mobile Actions

The following actions are currently supported when using the AUT Viewer during the recording of the test:

* **Tap** - simulates a user tapping an element on the mobile device screen. To create this step, click the mouse on the AUT Viewer screen during recording.
* **Swipe Vertical** - simulates a user pressing and dragging their finger across the screen vertically. To create this step, click the mouse, drag the cursor in a vertical direction, and release the mouse button.
* **Swipe Horizonal** - simulates a user pressing and dragging their finger across the screen horizontally. To create this step, click the mouse, drag the cursor in a horizontal direction, and release the mouse button.
* **Set Custom Text** - simulates a user entering text into a text field in the app. When hovering your mouse on a text element, the element is highlighted in red. Clicking the text element open a **Set Custom Text** window. Enter the desired text in the field and click the **Send** button.

## Adding additional steps and edit the properties

During the recording or after the test is saved, you can add additional predefined steps  and edit the some or all of the steps' properties.

To learn more about common step properties, see - [Editing a Step’s Properties](https://help.testim.io/docs/editing-a-steps-properties)

## Supported Predefined Mobile Actions

The following actions are currently supported when adding steps manually during or after the recording of the test:

* [**Validate email**](https://help.testim.io/docs/email-validation) - Testim offers a built-in email service which provides permanent and temporary email addresses. The Validate email step can be used with these email addresses to test your app sign-up or login flows.
* [**Validate element visible**](https://help.testim.io/docs/validate-element-visible) - The element visible validation allows you to check whether your element exists and is visible on the page. If your element contains a variable image or text, validation will still work. This validation verifies that the element exists and is visible, but does not check its specific content.
* [**Validate element text**](https://help.testim.io/docs/validate-element-text) - An Element Text validation is similar to an Element Visible validation in that it makes the step dependent on the existence of a specific element. However, for the Element Text validation, you also specify a particular text value that must appear in the specified element.
* [**Wait for element visible**](https://help.testim.io/docs/wait-for#wait-for-element-visible) - Use wait for element visible to wait for your element to be visible on the page.
* [**Wait for element text**](https://help.testim.io/docs/wait-for#wait-for-element-text) - Use wait for element text to make sure a specific text appears before continuing with the test.
* [**Sleep**](https://help.testim.io/docs/wait-for#sleep) - Enable waiting for a period of time between steps. - [**Add extract value step**](https://help.testim.io/docs/extract-text) - Lets you copy values directly from your application to be used in later steps.
* **Add set text step** - adds a specified text to the selected target element.
* **Code verification** - sends key strokes to the device. This is typically used to fill code verification elements, such as a one-time password code element. It is possible to add delays between characters.
* [**Generate email address**](https://help.testim.io/docs/email-validation#generating-a-temporary-email-address) - generate a new random email address to be used every time you run a test, for example to test a sign-up flow multiple times with a new user each time.
* [**Add CLI action**](https://help.testim.io/docs/add-cli-validations-and-actions) - executes custom Node.js scripts  in your CLI environment.
* [**Add API action**](https://help.testim.io/docs/api-testing#adding-an-api-action-step) - used when you want to get data that is returned from an API call. You can use this data just to check that it is returned.

> 📘
>
> Before running custom code using **Add CLI action** and/or Add API action steps, you will need to run [Testim CLI](https://help.testim.io/docs/the-command-line-cli).

* [**Generate random value**](https://help.testim.io/docs/generating-a-random-value) - generates random values for dynamic data testing.
* [**Generate date**](https://help.testim.io/docs/generating-a-date) - generates a date according to predefined properties.
* **Reset app** - In Android this step closes the application, clears the cache and then starts the app again. In iOS this step closes and starts the application (does not clear its cache). The step is typically used to reset the app and clear its cache before the next run.
* **Back** - sends a back command to the device. Supported in Android only.
* **Scroll to element text** - dynamically scrolls to the selected text element.
* [Execute Driver Script Step (mobile)](https://help.testim.io/docs/execute-driver-script-step) - The Execute Driver Script step allows you to run a script using Appium 2.0 or higher for extended capabilities and validations in your tests.