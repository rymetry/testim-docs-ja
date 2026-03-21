# Test capabilities for Saucelabs & BrowserStack in CLI

How to configure capabilities using CLI on Saucelabs and Browserstack grids

Using the JSON file with defined capabilities you can send more configuration parameters to Saucelabs and BrowserStack.

For example, if you are looking to run a test on a specific browser version and timezone:

1. Create a JSON file with the following:

```json
{
       "screenResolution": "2560x1600",
       "timeZone": "New_York"
}
```

2. In the CLI, add: **--sauce-options  "\<aboveConfigFileName>.json"**

The capabilities can be used in the following use cases:

* Control devices allocation
* Control Appium version
* Control auto alerts approval
* Control data captured on grid for example
* Disable video
* Disable network logs
* Custom test results mapping with build and project option caps
* Control reset strategy

## Override rules for a capability (mobile)

The JSON capabilities file settings overrides the following settings:

* CLI Flags (deviceName, osVersion)
* Mobile Config
* Default values such as: `autoGrantPermissions`, `AutoAcceptAlerts`, Disable video capturing.

> 📘 PlatformVersion capabilities
>
> `platformVersion` capability is validated and used to compute which Appium version should be used, for example if the client requested Appium version equals “1.22.2” with `platformVersion` equals “17.2” on IOS run, it will automatically use Appium 2 and throw a warning to the user about it (same way as `osVersion` from (mobile config /cli flag) logic).

## SauceLabs

**For Web:**

Add to your CLI: **--sauce-options  "config\_saucelabs.json"**

Example to the file:

```json
{
  "browserName": "Chrome",
  "browserVersion": "latest",
  "platformName": "Windows 10",
  "sauce:options": {
      "screenResolution": "1920x1080",
      "extendedDebugging": true
  }
}
```

Sauce lab options for params: [https://wiki.saucelabs.com/display/DOCS/Test+Configuration+Options](https://wiki.saucelabs.com/display/DOCS/Test+Configuration+Options)

**For mobile:**

* Use W3C format for Appium (without prefix) and saucelabs options.

[Appium caps](https://saucelabs.com/resources/blog/appium-desired-capabilities-tutorial)

[Appium versions](https://docs.saucelabs.com/mobile-apps/automated-testing/appium/appium-versions/#virtual-devices)

[Saucelabs options](https://docs.saucelabs.com/dev/test-configuration-options/#mobile-app-appium-capabilities-sauce-specific--optional)

```json
{
"deviceName": "Samsung Galaxy S10+",
"platformVersion": "12",
"autoGrantPermissions": false,
"sauce:options": {
    "build": "build from json file",
    "name": "test json file caps"
}
}
```

## Browserstack

**For web:**

Add to your CLI:  **--browserstack-options "config\_browserstack.json"**\
All supported override parameters

```json
{
    "project": "my project",
    "build": "build 4.5",
    "browserstack.debug": false,
    "browserstack.console": "info",
    "browserstack.networkLogs": true,
    "browserstack.video": false,
    "browserstack.timezone": "New_York",
    "browserstack.selenium_version": "3.5.2",
    "browser_version": 61,
    "resolution": "2048x1536"
}
```

BrowserStack options for params:\
[https://www.browserstack.com/automate/capabilities](https://www.browserstack.com/automate/capabilities)

**For mobile:**

* Use W3C capabilities format for Appium capabilities without the prefix
* Use legacy (Wire JSON) format for BrowserStack capabilities.

[Appium caps](https://www.browserstack.com/docs/app-automate/appium/debug-failed-tests/appium-logs)

[Browserstack options](https://www.browserstack.com/app-automate/capabilities?tag=jsonwire) JSON File Example:

```json
{
// need to fix project and build (W3C format changed to projectName, buildName)
"project": "json-project-test",
"build": "json-build-test",
"platformVersion": "12",
"deviceName": " Google Pixel 7",
"browserstack.debug": false,
"browserstack.console": "info",
"browserstack.networkLogs": true,
"browserstack.video": false
}
```

> 🚧 Browserstack certificate error
>
> If you're testing with devices that use Android version 13.0 or greater, your target devices may appear as though they are offline due to a certificate issue. For more information on how to resolve this issue, please [review Browserstack's relevant documentation](https://www.browserstack.com/docs/app-automate/appium/troubleshooting/networklogs-acceptinsecurecerts-issues).