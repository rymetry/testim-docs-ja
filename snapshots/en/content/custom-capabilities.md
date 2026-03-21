# Custom test capabilities

How to add advanced test configurations (capabilities) on all grids 

Custom capabilities allow you to add a wide range of advanced test parameters on all available grids. They are encoded as key-value pairs using JSON objects. For example, the system language of the device ortime zone:

```json
{
    "appium:language": "en",
    "appium:timeZone": "Europe/London"
}
```

In this example, we are instructing the drivers to start the test automation session with English as the system language and London as the time zone.

## Available capabilities

You can choose from a wide range of capabilities. Their availability depends on the grid where your tests run, so make sure to check what’s supported by the grid before you start.

Please note that you can't overwrite some capabilities that are already defined by Testim's test configurations. These capabilities include:

* `platformName `/ `platform`
* `app`/`bundleId`/`appPackage`
* `chromiumOptions.extensions`

## Create custom capabilities

All custom capabilities are created and stored on the **Runs** page under **Custom capabilities**. Follow these steps to create a new custom capability:

1. Go to **Custom capabilities** and select **+**.
2. In the Monaco Code Editor, start typing the name of the capability you'd like to add to the test. The editor will automatically suggest and fill in the available keys.
3. Select your keys and define their values.
4. Select **Save**.
5. Name your custom capability.

## Add custom capabilities to a test

After you have created the custom capabilities, it's time to add them to your tests. To do so, follow these steps:

1. Open a test from your test library.
2. Select **Show step properties** in the top right corner.
3. Choose the custom capability you created earlier from the **Custom capabilities** list.
4. If you haven't created a custom capability in advance, select **Add new one**. You'll redirect to the **Custom capabilities** page, where you can create a new one following the steps from the instructions above.
5. Run your test.

## Use custom capabilities with CLI

You can run your tests with custom capabilities using the command line interface (CLI). To do so, use one of the two parameters:

* `--custom-capabilities-name` to add a custom capability that you created in advance in Testim.
* `--custom-capabilities-file` to add a custom capability that you created locally as a JSON file.

These two parameters can't be used at the same time.

<Callout icon="📘" theme="info">
  If you'd like to learn more about working with capabilities using CLI specifically on Saucelabs and BrowserStack grids, check out [Test capabilities for Saucelabs & BrowserStack in CLI](https://help.testim.io/update/docs/saucelabs-browserstack-options#/).
</Callout>

## Schedule tests with custom capabilities

Once you add a custom capability to a test, you can go ahead and [schedule your test](https://help.testim.io/docs/scheduler-mobile#/).

You can also override custom capabilities in the scheduled test runs. To do so, follow these steps:

1. Start scheduling a test as usual.
2. In scheduler settings, go to **What to run on** and select **Override custom capabilities**.
3. Select the new custom capabilities. These custom capabilities will only add to this scheduled run, without changing the original custom capabilities of the test.
4. Select **Save**.