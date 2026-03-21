# Configure Tricentis Mobile Agent

Tricentis Mobile Agent is a centralized service that manages mobile connections to run Testim tests on mobile devices. You can run Tricentis Mobile Agent on Windows, Linux, and Mac operating systems. The software can be used to run tests on local Android and iOS physical devices, as well as virtual devices, including emulators or simulators. This simplifies the setup and configuration of your devices and lets you start testing sooner.

> 📘
>
> The Tricentis Mobile Agent and iOS artifacts are installed locally and can be used by the user of this machine only (i.e., cannot be shared between multiple/remote users).

## Requirements

Before you begin, check out the list of [system requirements for Tricentis Mobile Agent](https://documentation.tricentis.com/tricentis_mobile_agent/content/user_manual/system_requirements.htm).

## Install Tricentis Mobile Agent on your Local Computer

Before you can author/run mobile tests on Testim, you need to install the Tricentis Mobile Agent.

### Installing and Starting Tricentis Mobile Agent on Windows

:fa-arrow-right: **To install the Tricentis Mobile Agent on Windows:**

1. On Testim, click the **Tricentis Mobile Agent** icon at the top.
2. Select **Download for Windows (x64)** from the drop down menu.
3. Click the download icon.

![](https://files.readme.io/ffb03c6-image.png "image.png")

4. Open the downloaded file and **follow the instructions** of the install wizard to complete the installation.
5. To start Tricentis Mobile Agent, use the **Tricentis Mobile Agent desktop shortcut** or search for it in the Windows search bar.
6. You can check the Agent's status by right-clicking the Tricentis icon in the systems tray.

![](https://files.readme.io/0a74d94-tmawindowsconsole.png "tmawindowsconsole.png")

### Installing and Starting Tricentis Mobile Agent on Mac

:fa-arrow-right: **To install the Tricentis Mobile Agent on Mac:**

1. On Testim, click the **Tricentis Mobile Agent** icon at the top.
2. Select **Download for Mac (x64)** from the drop down menu.
3. Click the download icon.

![](https://files.readme.io/4add3ba-image.png "image.png")

4. Open the downloaded file and follow the instructions of the install wizard to complete the installation.
5. To start Tricentis Mobile Agent, double-click Tricentis Mobile Agent in the applications folder.
6. You can check the Agent's status by right-clicking the Tricentis icon in the menu bar.

![](https://files.readme.io/2608a2c-tmamacconsole.png "tmamacconsole.png")

### Installing and Starting Tricentis Mobile Agent on Linux

:fa-arrow-right: **To install the Tricentis Mobile Agent on Linux:**

1. On Testim, click the **Tricentis Mobile Agent** icon at the top.
2. Select **Download for Linux (x64)** from the drop down menu.
3. Click the download icon.

![](https://files.readme.io/64e7a69-image.png "image.png")

2. Locate the installation file and perform these steps:
   * Right-click it and select **Properties > Permissions > Execute**.
   * Choose to **Allow executing file as program** and close the window.
3. Right-click the installation file and select **Open in Terminal**.
4. In the terminal, perform these steps:
   * Enter `./Tricentis_Mobile_Agent_1.0.0.sh`, followed by Enter.
   * Enter `yes` to confirm that you want to proceed with the installation, followed by Enter.
   * Specify the installation destination path, followed by Enter. This completes the installation and creates a desktop shortcut.
5. When prompted, start the application by pressing the `y` key in the terminal. Alternatively, launch the application from the newly created desktop shortcut.

## Connect the Tricentis Mobile Agent to Testim

After installing the Tricentis Mobile Agent, you will need to connect it to Testim.\
:fa-arrow-right: **To connect to the Tricentis Mobile Agent:**

1. Click the **Tricentis Mobile Agent icon.**
2. Click **Retry Connecting**.

![](https://files.readme.io/c9c5dd1-image_1.png "image (1).png")

3. You will be asked to approve the opening of the software. Click **Open Tricentis Mobile Agent**.\
   Once the Tricentis Mobile Agent has connected, the icon will display a **green indicator** and the **Agent Status** will display **Ready**. Note that the TMA (Tricentis Mobile Agent) version is also displayed (e.g. 1.0.0).

![](https://files.readme.io/b039acc-image_2.png "image (2).png")

## Configure your Device

Following the connection of the Tricentis Mobile Agent to Testim, you can connect and configure your devices. Tricentis Mobile Agent detects all the connected devices and lists them under Device management. You can view your connected devices, manage their settings, upload iOS images to iOS devices, and delete an iOS image from iOS devices in the Device management section.

### Prepare your Android device

To prepare your Android device for test automation with Tricentis Mobile Agent, follow these steps:

:fa-arrow-right: **To prepare your Android device:**

1. Connect your Android device to your computer and allow access to your phone data.
2. To enable developer mode on your Android device, go to **Settings > About phone > Software** information and tap on the **Build number** 7 times. The Developer options is now visible under **Settings**.
3. To enable USB debugging, go to **Settings > Developer options** and **enable USB debugging**.
4. To prevent your Android device from going into sleep mode during your tests, enable **Stay awake**.
5. Ensure that the USB driver for the device is installed on your computer. For information on how to install the driver, see this <a href="https://support-hub.tricentis.com/open?sys_kb_id=194a54eedb4f5c181ea7bb13f3961950&id=kb_article_view&number=KB0012723" target="_blank">Tricentis Knowledge Base article</a>.

### Prepare your iOS device

#### Prerequisites

To use an iOS device with Tricentis Mobile Agent, you must meet the following requirements:

* Tricentis Mobile Agent is installed and running on your computer.
* You have an active Apple Developer Account.
* The device is connected to your computer.

:fa-arrow-right: **To prepare your iOS device:**

1. Connect your iOS device to your computer.
2. On your iOS device, go to **Settings** and perform the following actions:
   * Enable UI automation - go to **Privacy & Security > Developer settings** and enable **Enable UI automation**.
   * Enable web inspector - go to **Safari > Advanced** and enable **Web Inspector**.

#### Upload iOS images

To run your iOS device in developer mode and install the WebDriverAgent (WDA) with development certificate, you need an iOS image. An iOS image is a zip folder that is generated by Xcode (iOS IDE). You can also download an iOS image from GitHub - [https://github.com/iGhibli/iOS-DeviceSupport/tree/master/DeviceSupport](https://github.com/iGhibli/iOS-DeviceSupport/tree/master/DeviceSupport).

:fa-arrow-right: **To upload an iOS image:**

1. You can download the relevant iOS image from - [https://github.com/iGhibli/iOS-DeviceSupport/tree/master/DeviceSupport](https://github.com/iGhibli/iOS-DeviceSupport/tree/master/DeviceSupport)
2. In Tricentis Mobile Agent, under **Device Management**, click **Upload iOS image**.
3. Select an iOS image with the appropriate iOS version for the device.
4. Click **Upload**.

#### Get Apple team ID

To automate your iOS device connected to your computer, you need an Apple team ID. The Apple team ID is a 10-character string that is generated by Apple to uniquely identify your team. You can get your Apple team ID from the <a href="https://idmsa.apple.com/IDMSWebAuth/signin?appIdKey=891bd3417a7776362562d2197f89480a8547b108fd934911bcbea0110d07f757&path=%2Faccount%2F&rv=1" target="_blank">Apple Developer Account</a>.

Get your Apple team ID from the **Membership** section of your Apple developer account. For information on how to get your Apple team ID, see the <a href="https://developer.apple.com/support/" target="_blank">Apple online help</a>.

Once you have connected and configured your iOS device, you must perform [additional configuration steps in Tricentis Mobile Agent](https://documentation.tricentis.com/tricentis_mobile_agent/content/user_manual/additional_configuration_ios.htm).

#### Configure Tricentis Mobile Agent iOS Artifacts

To use an iOS device with Tricentis Mobile Agent, you must perform the following additional configuration steps.

:fa-arrow-right: **To configure iOS artifacts:**

1. On Tricentis Mobile Agent, go to **iOS artifacts**.
2. In the **Insert Apple team ID** text field, enter your Apple team ID. If you clear the Apple team ID, this also removes the existing Certificate Signing Request (CSR), certificate, and provisioning profile.
3. Go to **Certificate Signing Request (CSR)**, select **Generate new CSR**, and download the CSR file. The signed certificate has an expiry date. If the certificate expires, you need to create a new CSR or you can't run your tests. Generating a new CSR removes the previous CSR's signed certificate and provisioning profile.
4. Go to **Certificate**, select **Upload certificate**. This certificate confirms the match between the Apple team ID and the CSR. The certificate is stored in a .p12 file that you must upload to Tricentis Mobile Agent. If you upload another certificate, this removes the existing provisioning profile.
5. Under **Provisioning profile**, select **Upload provisioning profile**.

To review your uploaded certificates and provisioning profile, enable **Debugging mode** in **Agent settings**.

#### Install iTunes

To perform test automation of an iOS device on Windows operating system, you must <a href="https://support.apple.com/downloads/itunes" target="_blank">install iTunes</a>. Make sure you download iTunes from the App store.

After the installation of iTunes, perform one of the following actions:

* Restart your computer.
* Reconnect your iOS device.

#### Enable iOS simulator

To enable iOS simulators on Mac, use the simulator app available within Xcode. Interact with an iOS simulator using a keyboard or a mouse. To mirror an iOS simulator using Tricentis Mobile Agent, you don't need an Apple developer account.

:fa-arrow-right: **To enable iOS simulators on Mac for test automation with Tricentis Mobile Agent:**

1. Install and start Tricentis Mobile Agent on Mac.
2. <a href="https://apps.apple.com/us/genre/mac/id39?mt=12" target="_blank">Install Xcode</a> from the Mac App Store.
3. To select and start an iOS simulator available within Xcode, follow the steps in the <a href="https://developer.apple.com/library/archive/documentation/IDEs/Conceptual/iOS_Simulator_Guide/Introduction/Introduction.html#//apple_ref/doc/uid/TP40012848-CH1-SW1" target="_blank">Apple Simulator User Guide</a>.

If Tricentis Mobile Agent is not able to detect an iOS simulator, run the following command in the terminal and restart Tricentis Mobile Agent:

`sudo xcode-select -s $(ls -td /Applications/Xcode* | head -1)/Contents/Developer`

If you encounter the any error while starting WDA on your iOS simulator, shut down all Xcode simulators running on your machine, start the iOS simulator, and restart Tricentis Mobile Agent.

## Troubleshooting

This topic explains solutions for issues you might encounter with Tricentis Mobile Agent.

### Download Agent Logs

When requesting support from the support team, you may be asked to provide information in the Tricentis Mobile Agent logs.

:fa-arrow-right: **To download the Tricentis Mobile Agent logs:**

1. Navigate to the **Agent Settings** tab in the Tricentis Mobile Agent.
2. Click the **Download Logs** hyperlink.

![](https://files.readme.io/a705810-downloadlogs.png "downloadlogs.png")

### iOS Simulators not Detected

If the simulators are not detected, try running the following command and then restart the Tricentis Mobile Agent:

`sudo xcode-select -s $(ls -td /Applications/Xcode* | head -1)/Contents/Developer`

### WebDriverAgent (WDA) Errors

If you encounter errors when starting WDA on your iOS simulators that are similar to this:

`2021-07-18 02:22:22.461 ERROR 37497 qtp499764573-13 i.t.a.i.n Failed trying to start WDA on 2D3C1771-938B-43D7-A95C-5CCB834CE63E for unknown reason java.util.concurrent.ExecutionException: java.io.IOException: There was a problem connecting to the simulator with the udid of 2D3C1771-938B-43D7-A95C-5CCB834CE63E`

Try running the following command to shutdown all XCode simulators running on the machine:

`sudo xcrun simctl shutdown all`

Then try to run your test again. Tricentis Mobile Agent should automatically start the simulator.

### Android device connection issues

If you have issues with connecting your Android device to Tricentis Mobile Agent, go to the Developer options on your device and enable the following settings:

* Disable Permissions Monitoring (optional)
* Under Select USB configuration, select MTP or File transfer.
* Scroll down and turn the animation off for Window animation scale, Transition animation scale, and Animator duration scale.
* When you plug the USB cable to your Android device, perform the following operations:
  * Allow access to device data and select YES.
  * Allow USB debugging and select OK.

If your mirroring or recording still don't work, go to the Developer options, clear trusted computers, unplug and replug.

### UI Automator crash on Android devices

UI Automator is an Android testing framework for functional UI testing across all installed applications. If you come across any issues related to the UI Automator while running an Android device, check the power restrictions on the automation tools that you use.

To improve performance on your Android devices, disable the optimization on the following applications:

* Your application under test
* Android System WebView (for applications using WebView)
* Appium Settings
* Application Installer
* Automation Test
* Chrome (for web tests on mobile)
* io.appium.uiautomator2.server
* io.appium.uiautomator2.server.test