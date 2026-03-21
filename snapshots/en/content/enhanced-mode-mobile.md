# Enhanced Mode (Mobile)

Testim’s new Enhanced mode delivers a more stable, faster, and more versatile tests compared to Appium-based testing. With its zero-knowledge approach and unified API, the new Enhanced mode sees the structure of your mobile views better than any other tool in the market. This additional visibility enables test flows not possible on other platforms, such as Appium, including cross-platform (React Native, Flutter) and hybrid apps. Enhanced mode supports testing across all mobile applications (native, hybrid, or cross-platform frameworks) on a flexible, fast, and easy-to-use virtual mobile grid in the cloud.

<Image align="center" src="https://files.readme.io/26cb52617662927f234410dbf5999b3f2ca44b42c59ff4e9a65447b3a4465741-mobile-test-setup.png" />

> 📘
>
> Enhanced mode is currently available on VMG (Virtual Mobile Grid) only. If you want to test on a local device, physical device, or another grid, select **Standard Appium** mode.

## Enhanced mode advantages

* **Richer view hierarchy** - a script cannot interact with elements it cannot “see”. Enhanced mode has a richer view hierarchy that sees the structure of your mobile views better than any tool in the market, even in React Native and Flutter apps.
* **Faster scanning** - scans the entire view hierarchy in less than 500ms.
* **Zero Knowledge** - Appium requires knowing which “Appium driver” to use when writing your test (e.g., native driver, web view driver, React Native driver or the Flutter one). The Enhanced mode provides a unified API and doesn’t require any knowledge of the app’s underlying tech to work.
* **Enhanced support for cross-platform application frameworks** - Enables the use of popular cross-platform application frameworks, including React Native and Flutter.
* **Supports hybrid apps** - enables the use of applications with embedded web views.
* **Enhanced test stability** - improves test stability for all mobile applications, reducing maintenance and decreasing test authoring time and effort.

## Supported Frameworks

Enhanced mode supports most leading frameworks, native or hybrid, including:

* Webviews
* React-native
* Flutter
* Swift
* SwiftUI
* Objective-C

## How to use the Enhanced mode in Testim

* **Test recording** - when recording a test, the **Enhanced mode** is selected as the default/preferred mobile testing method. You can also select the **Standard Appium** compatibility mode. Tests recorded using the Enhanced mode will run only on VMG.
* **Test scheduling** - tests that were recorded with Enhanced mode will be executed with Enhanced mode and the tests that were not recorded with Enhanced mode will not be executed with Enhanced mode.
* **CLI execution** - tests that were recorded with Enhanced mode will be executed with Enhanced mode and the tests that were not recorded with Enhanced mode will not be executed with Enhanced mode.

## FAQ

### Can I apply Enhanced mode on previously recorded tests?

No. Enhanced mode execution requires that some parameters are set and recorded during the recording of the test. A test that was recorded with **Enhanced mode** will be run exclusively with **Enhanced mode**, and a test not recorded with **Enhanced mode** won't run in **Enhanced mode**.

### Can I select another mode for my test (not Enhanced mode)?

Absolutely. You can record and run your test in **Appium compatibility** mode. This mode guarantees the compatibility of your test with other Appium-based grids and supports local executions on your local devices. On the other hand, this mode is restricted to Appium's capabilities, meaning that you might not be able to record all your test flows, especially if you use a hybrid app or webviews. Note that existing tests will still work if you are using Appium Compatibility mode

### Can I use Enhanced mode on other grids (not just VMG)?

Currently Enhanced mode requires the use of VMG and does not support using other grids.

### Can I migrate a test recorded on Enhanced mode to Appium compatibility mode?

No. This requires a re-recording the test in Enhanced mode.

### What happens if the test using Enhanced mode fails?

As with the Appium compatibility mode, you will need to troubleshoot the issue and fix your app, or update the test if the failure was caused due to changes in your app. For more details, see [Why did my test fail?](https://help.testim.io/docs/why-did-my-test-fail).