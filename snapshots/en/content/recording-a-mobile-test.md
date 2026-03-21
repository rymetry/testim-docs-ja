# Recording a Mobile Test

Mobile tests can be recorded and run on both physical and virtual iOS and Android devices. The recording itself can be performed on Windows, Macs or Linux computers using a web browser. When you record a mobile test, Testim converts each action into a test step, which is shown on the Testim Visual Editor screen. However, you can always manually add additional steps to the test by [Editing Tests](https://help.testim.io/docs/editing-your-tests). The tests are added to the [Test Library](https://help.testim.io/docs/test-list) and can be run at any time.

> 🚧 Before you start recording
>
> Please keep the following device limitations in mind:
>
> * Multi-screen devices such as foldable/flip phones are currently not supported.
> * Tests recorded on a specific device model can only be run on that same model. To ensure accurate results, create separate tests for each device.

# Recording a Mobile Test

There are two ways to record a mobile test:

[Recording a Mobile Test Using VMG](https://help.testim.io/docs/recording-a-vmg-mobile-test) (recommended) - The Virtual Mobile Grid can be used to record tests as well as to run them across a wide variety of iOS simulators and Android emulators. It is included in the license for paying customers and does not require any special integration or installation of additional software. The recording can be performed in one of the following modes:

* **Enhanced mode (recommended)** -   Testim’s new Enhanced mode delivers more stable, faster, and more versatile tests compared to Appium-based testing. With its zero-knowledge approach and unified API, the new Enhanced mode sees the structure of your mobile views better than any other tool in the market. This mode supports testing across all mobile applications (native, hybrid, or cross-platform frameworks). Tests recorded in this mode can be executed on VMG only. See [Enhanced Mode (Mobile)](https://help.testim.io/docs/enhanced-mode-mobile) for more details.
* **Appium mode** -  This mode guarantees the compatibility of your test with other Appium-based grids and supports local executions on your local devices. On the other hand, this mode is restricted to Appium's capabilities, meaning that you might not be able to record all your test flows, especially if you use a hybrid app or webviews. Note that existing tests will still work if you are using Appium Compatibility mode.

[Recording a Mobile Test Using a Local Device](https://help.testim.io/docs/recording-a-local-mobile-test) - local mobile tests can be recorded and run locally on both physical and virtual iOS and Android devices. This option is supported in Appium mode only.

<br />

> 📘 Virtual/physical recording
>
> Tests that were recorded on a virtual device, such as the virtual devices provided on the Virtual Mobile Grid, can be run on virtual devices only. And tests that were recorded on physical devices can be run on a physical device only.