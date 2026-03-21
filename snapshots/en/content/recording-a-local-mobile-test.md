# Recording a Mobile Test Using a Local Device

Record and run mobile tests locally

Mobile tests can be recorded and run locally on both physical and virtual iOS and Android devices. The recording itself can be performed on Windows, Macs or Linux computers using a web browser. When you record a mobile test, Testim converts each action into a test step which is shown on the Testim Visual Editor screen. However, you can always manually add additional steps to the test by [Editing Tests](https://help.testim.io/docs/editing-your-tests). The tests are added to the [Test Library](https://help.testim.io/docs/test-list) and can be run at any time.

> 🚧
>
> Multi-screen devices (e.g., Foldable/Flip phones) are currently not supported.

## Before you begin

Before you begin, make sure you have the following:

* **A mobile testing project** - mobile testing requires a mobile testing project that is separate from the web testing project. If you do not have an existing mobile project, contact Tricentis support.

> 📘
>
> Each project is assigned to a single mobile operating system. A separate project is required to create/run tests on different operating systems. For example, you cannot create a test for an iOS device if the project was created for Android.

* **Tricentis Mobile Agent** - in order to create and run mobile tests on Testim, you need to install the **Tricentis Mobile Agent (TMA)**. This agent manages the physical devices connected to your workstation (e.g., phone or tablet) and simulators/emulators, running on your workstation. To install, connect the TMA to Testim, and configure your device, see - [Configure Tricentis Mobile Agent](https://help.testim.io/docs/configure-tricentis-mobile-agent)

> 📘
>
> Each user that want to run local mobile tests needs to install and configure the Tricentis Mobile Agent on their computer.

* **Application to test** - for Android - **Java, Kotlin**; for iOS - **Objective-C, Swift**

# Step 1 - Connect to TMA

As a first step you will need to connect the TMA to Testim. Follow the instructions in the following section - [Connect the Tricentis Mobile Agent](https://help.testim.io/docs/configure-tricentis-mobile-agent#connect-the-tricentis-mobile-agent-to-testim)

# Step 2 - Connect a Device

## Connecting a physical Android device

To connect your Android device, you must meet the following requirements:

* Tricentis Mobile Agent is installed and running on your computer.
* Your device is in "Debug Mode" - see below.
* Complete all the steps described below.

:fa-arrow-right: **To connect a new physical Android device:**

1. Connect a physical Android device to your local computer (e.g., connect a mobile phone using a USB cable).

> 📘
>
> For Android devices, the device needs to run in "Debug Mode" - [Enable developer options and USB debugging](https://developer.android.com/studio/debug/dev-options#enable). After enabling debug mode, go to **Settings > Developer** options and enable the **USB debugging** option. For more details, see the relevant section in the [https://help.testim.io/docs/configure-tricentis-mobile-agent](https://help.testim.io/docs/configure-tricentis-mobile-agent).

Once the Tricentis Mobile Agent recognizes the device, it will be listed:

![](https://files.readme.io/ec4cb63-4db538d-tma-connected-device.png "4db538d-tma-connected-device.png")

## Connecting a physical iOS device

To connect your iOS device, you must meet the following requirements:

* Tricentis Mobile Agent is installed and running on your computer.
* You have an active Apple Developer Account.
* Complete all the steps described below.

For more information about the process, see the following video tutorial - [https://www.youtube.com/watch?v=eQqh\_PFc6qc\&ab\_channel=TricentisAcademy](https://www.youtube.com/watch?v=eQqh_PFc6qc\&ab_channel=TricentisAcademy)

:fa-arrow-right: **To connect a new physical iOS device:**

1. Connect a physical iOS device to your local computer (e.g., connect a mobile phone using a USB cable).
2. On your iOS device, go to **Settings** and perform the following actions:
   * Enable UI automation - go to **Privacy & Security > Developer settings** and enable **Enable UI automation**.
   * Enable web inspector - go to **Safari > Advanced** and enable **Web Inspector**.
3. On the computer, on Testim, click the **Tricentis Mobile Agent** icon and then click the **Open TMA Console** link.

![](https://files.readme.io/5898953-image_12.png "image (12).png")

4. On the TMA Console, go to **Device Management**
5. Click **Upload iOS image**.

<Image align="center" width="smart" src="https://files.readme.io/8752f3b-2023-01-17_20-29-06.png" />

6. Select an iOS image with the appropriate iOS version for the device (you can download the iOS image from [https://github.com/iGhibli/iOS-DeviceSupport/tree/master/DeviceSupport](https://github.com/iGhibli/iOS-DeviceSupport/tree/master/DeviceSupport)
7. Click **Upload**.
8. Get your **Apple team ID** from the **Membership** section of your **Apple developer account**. For information on how to get your Apple team ID, see [https://developer.apple.com/support/](https://developer.apple.com/support/).
9. On TMA Console, go to **iOS artifacts**.
10. In the **Insert Apple team ID** text field, enter your Apple team ID. If you clear the Apple team ID, this also removes the existing **Certificate Signing Request (CSR)**, certificate, and provisioning profile.

![](https://files.readme.io/8e15426-2023-01-17_20-38-47.png "2023-01-17_20-38-47.png")

11. Under **Certificate Signing Request (CSR)**, click **Generate new CSR**, and download the CSR file. The signed certificate has an expiry date. If the certificate expires, you need to create a new CSR or you can't run your tests. Generating a new CSR removes the previous CSR's signed certificate and provisioning profile.
12. Under **Certificate**, click **Upload**. This certificate confirms the match between the Apple team ID and the CSR. The certificate is stored in a .p12 file that you must upload to Tricentis Mobile Agent. If you upload another certificate, this removes the existing provisioning profile.
13. Under **Provisioning profile**, click **Upload**.
14. Go **Agent Settings**.
15. Make sure that **Debugging mode** is enabled (left toggle).

![](https://files.readme.io/b70cd4f-2023-01-17_21-02-30.png "2023-01-17_21-02-30.png")

16. If you are using a **Windows computer**,  you must [install iTunes](https://support.apple.com/downloads/itunes). Make sure you download iTunes from the App store. After the installation of iTunes, restart your computer and reconnect your iOS device.

At this point you will see your iOS device connected under the physical devices list.

![](https://files.readme.io/1781fa5-image_13.png "image (13).png")

## Connecting a virtual Android device

To connect your Android device, you must meet the following requirements:

* Tricentis Mobile Agent is installed and running on your computer.
* An Android Simulator/IDE, such as [Android Studio](https://developer.android.com/studio).
* Complete all the steps described below.

The following procedure uses Android Studio, however other software can be used.

:fa-arrow-right: **To connect a virtual Android device:**

1. In **Android Studio**, click the kebab menu (three vertical dots) and click **Virtual Device Manager**.

![](https://files.readme.io/d90fde5-2023-01-18_12-34-52.png "2023-01-18_12-34-52.png")

2. Click **Create Device**.
3. Select the desired device definition that meets the mobile platform [system requirements](https://documentation.tricentis.com/tricentis_mobile_agent/content/user_manual/system_requirements.htm).
4. Click **Next**.

![](https://files.readme.io/c1ef05f-2023-01-18_12-59-06.png "2023-01-18_12-59-06.png")

5. To optionally improve the device performance, click **Show Advanced Settings**.

![](https://files.readme.io/ad142e3-2023-01-18_13-07-10.png "2023-01-18_13-07-10.png")

6. Scroll down to the **Memory and Storage** parameters and increase the values in the **RAM**, **VM heap**, and **Internal Storage** parameters. Note that this may require more resources from the computer running it.

![](https://files.readme.io/4c319fe-2023-01-18_13-12-41.png "2023-01-18_13-12-41.png")

7. Click **Finish**.\
   The configured device will be available in the **Device Manager** screen.
8. To run the device, click the **Play** icon.

![](https://files.readme.io/3f29a39-2023-01-18_13-20-07.png "2023-01-18_13-20-07.png")

The device will be automatically added to the **Virtual Devices** list in Testim.

<Image align="center" src="https://files.readme.io/6157466-virtualdevice.png" />

> 📘
>
> By default, virtual devices are pre-configured to be in Debug Mode.

## Connecting a virtual iOS device

To connect an iOS device, you must meet the following requirements:

* Tricentis Mobile Agent is installed and running on your computer.
* An iOS Simulator/IDE, such as [Xcode](https://developer.apple.com/xcode/). Xcode is supported on Mac only.
* Complete all the steps described below.

> 📘
>
> The virtual iOS device option does not require an Apple developer account.

The following procedure uses Xcode, however other software can be used.

:fa-arrow-right: **To connect a virtual iOS device:**

1. Make sure TMA has been installed and is currently running.
2. Make sure Xcode is installed. If not, download it from the [Mac App Store](https://apps.apple.com/us/app/xcode/id497799835?mt=12).
3. In Xcode, from the main menu go to **Xcode > Open developer tool > Simulator**.

![](https://files.readme.io/f695d02-image_21.png "image (21).png")

The Simulator software opens in the system tray.

4. Right-click on the **Simulator** icon and select **Device** and then select the desired device from the list.

![](https://files.readme.io/bae9199-image_22.png "image (22).png")

The device will be automatically added to the **Virtual Devices** list in Testim.

<Image align="center" width="smart" src="https://files.readme.io/36444cd-image_23.png" />

# Step 3 - Prepare an application to be tested

When creating a test you will need to select which app the test will use. Each test can include one app only. Apps are available for testing in three ways:

* **Local device apps** - you can use one of the apps on your connected device (physical or virtual device). These apps will be available to the test when the device is connected to TMA.
* **Mobile Apps Library** - you can use an existing app in Mobile App Library. In this case other users can use a common app for testing without it having to be already installed on their local device. It is possible to add the app before recording the test, by following the instructions in the [Add Mobile App from Local Computer](https://help.testim.io/docs/mobile-apps#add-mobile-app-from-local-computer) section. For more information on how to manage apps in the Mobile Apps Library, see - [Mobile Apps](https://help.testim.io/docs/mobile-apps)
* **Uploading the app** - as part of the test creation, you can upload the app.

> 📘 App compilation compatibility (iOS only)
>
> If you want to record a test using a virtual device, make sure that that the app was compiled for virtual devices (.app). And vice versa, if you want to record using a physical device, make sure that the app was compiled to work on physical devices (.ipa). See [How to Prepare a .ipa for Mobile Testing](https://help.testim.io/docs/how-to-prepare-an-ipa-for-mobile-testing) for more information.

# Step 4 - Record the test

You can record a test on a mobile device to be run automatically at a later time. During the test you can record only a single application from one device.  However, when playing back the test, you will be able to run the same test on another device than the device used during the recording.

:fa-arrow-right: **To record a mobile test:**

1. Make sure a physical or virtual device is connected, by ensuring that the **Tricentis Mobile Agent indicator** is green.
2. From the **Dashboard** screen click the **New Test** button.

<Image align="center" src="https://files.readme.io/ec1bda0-image.png" />

3. To begin recording your test, click the **Record** button in the action menu.

<Image align="center" src="https://files.readme.io/202f05d-image_1.png" />

4. Select **Local Devices** and then select one of the physical or virtual devices displayed in the list.

   <Image align="center" src="https://files.readme.io/9fa3145-image_3.png" />

5. Click **Next** to continue.

6. Select an **Application** to be tested using the following options:
   * **From library** - select this option to use one of the existing apps in the Mobile Apps Library and then select the relevant app from the list.

> 📘
>
> Each test can only interact with a single application. If you are recording a test on a device that does not have the selected app from the Mobile Apps Library installed, the app will be automatically installed on the local device.

* **From device** - select this option to use an existing app from your connected device and then select the relevant app from the list.

> 📘 Changing device after recording
>
> When changing a device after recording, the selected app must be installed on the device to perform additional recording or playback.

* **Upload app** - select this option to add a new app to the [Mobile Apps](https://help.testim.io/docs/mobile-apps) Library from your local computer. Supported file types include for Android devices - .apk files based on Java or Kotlin frameworks;  for iOS devices - .ipa files based Objective C or Swift frameworks. Upload is limited to 150 MB (to upload larger files, contact Tricentis support).

7. Click **Done** to finish

8. An [AUT Mirroring Viewer](https://help.testim.io/docs/mobile-test-editor) is displayed with the opened application under test. The viewer allows you  to view the device and interact with the application under test, while Testim records the actions. For more information about the supported actions, see [**Supported Mobile Actions**](https://help.testim.io/docs/recording-a-mobile-test#supported-mobile-actions) section below.

> 📘
>
> Test steps are only recorded by taking actions on the AUT Mirroring Viewer. Taking actions directly on the device will not record test steps.

![](https://files.readme.io/4ef00e8-mobiletestingv2.gif "mobiletestingv2.gif")

> 🚧 Important Notice
>
> When recording a test try to choose text elements and avoid outer frames, images and icons for better stability

![](https://files.readme.io/4f44670-image_20.png "image (20).png")

9. To stop recording, click the **Stop Recording** button or close the Viewer window.

![](https://files.readme.io/3e199cb-image_7.png "image (7).png")

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

### Supported Mobile Actions

The following actions are currently supported when using the AUT Viewer during the recording of the test:

* **Tap** - simulates a user tapping an element on the mobile device screen. To create this step, click the mouse on the AUT Viewer screen during recording.
* **Swipe Vertical** - simulates a user pressing and dragging their finger across the screen vertically. To create this step, click the mouse, drag the cursor in a vertical direction, and release the mouse button.
* **Swipe Horizonal** - simulates a user pressing and dragging their finger across the screen horizontally. To create this step, click the mouse, drag the cursor in a horizontal direction, and release the mouse button.
* **Set Custom Text** - simulates a user entering text into a text field in the app. When hovering your mouse on a text element, the element is highlighted in red. Clicking the text element open a Set Custom Text Window. Enter the desired text in the field and click the Send button.

![](https://files.readme.io/f316ba0-image_19.png "image (19).png")

# Step 6 - Add additional steps and edit the properties

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
* **Back** - creates a Back button step, which sends a back command to the device. Supported in Android only.
* **Home** - create a Home Button step, which sends a home command to the device.
* **Scroll to element text** - dynamically scrolls to the selected text element.
* [Execute Driver Script Step (mobile)](https://help.testim.io/docs/execute-driver-script-step) - The Execute Driver Script step allows you to run a script using Appium 2.0 or higher for extended capabilities and validations in your tests.