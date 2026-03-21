---
title: Test capabilities for SauceLabs & BrowserStack in CLI
description: >-
  SauceLabs と BrowserStack の Grid で JSON file を使って capability を CLI
  から渡す方法と、mobile 実行時の override rule を説明します。
category: 統合
order: 12030
updated: '2025-11-21'
sourceUrl: 'https://help.testim.io/docs/saucelabs-browserstack-options'
keywords:
  - SauceLabs
  - BrowserStack
  - capability
  - CLI
  - sauce-options
  - browserstack-options
---

SauceLabs と BrowserStack の Grid で CLI から capability を設定する方法を説明します。

定義済み capability を含む JSON file を使うことで、SauceLabs と BrowserStack へ追加の configuration parameter を渡せます。

例えば、特定の browser version と time zone でテストを実行したい場合は、次の手順に従います。

1. 次の JSON file を作成します。

```json
{
  "screenResolution": "2560x1600",
  "timeZone": "New_York"
}
```

2. CLI では次を追加します: **--sauce-options "\<aboveConfigFileName>.json"**

capability は次のような用途に利用できます。

- device allocation の制御
- Appium version の制御
- auto alert approval の制御
- Grid 側で取得する data の制御
- video の無効化
- network log の無効化
- build / project option capability を使った custom test result mapping
- reset strategy の制御

## capability の override rule (mobile)

JSON capability file の設定は、次の設定を上書きします。

- CLI flag (`deviceName`, `osVersion`)
- Mobile Config
- `autoGrantPermissions`、`AutoAcceptAlerts`、video capturing 無効化などの default value

:::info{title="PlatformVersion capabilities"}
`platformVersion` capability は検証され、使用すべき Appium version を決定するために使われます。例えば client が Appium version `1.22.2` と、iOS 実行で `platformVersion` `17.2` を要求した場合、自動的に Appium 2 が使用され、その旨の warning が表示されます。これは mobile config / CLI flag の `osVersion` logic と同様です。
:::

## SauceLabs

### SauceLabs を web で使用する場合

CLI に次を追加します: **--sauce-options "config_saucelabs.json"**

file の例:

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

parameter の詳細は、SauceLabs の公式ドキュメントを参照してください。\
[https://wiki.saucelabs.com/display/DOCS/Test+Configuration+Options](https://wiki.saucelabs.com/display/DOCS/Test+Configuration+Options)

### SauceLabs を mobile で使用する場合

- prefix なしの W3C format で Appium capability と SauceLabs option を指定します。

[Appium caps](https://saucelabs.com/resources/blog/appium-desired-capabilities-tutorial)

[Appium versions](https://docs.saucelabs.com/mobile-apps/automated-testing/appium/appium-versions/#virtual-devices)

[SauceLabs options](https://docs.saucelabs.com/dev/test-configuration-options/#mobile-app-appium-capabilities-sauce-specific--optional)

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

## BrowserStack

### BrowserStack を web で使用する場合

CLI に次を追加します: **--browserstack-options "config_browserstack.json"**\
次はサポートされる代表的な override parameter の例です。

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

parameter の詳細は、BrowserStack の公式ドキュメントを参照してください。\
[https://www.browserstack.com/automate/capabilities](https://www.browserstack.com/automate/capabilities)

### BrowserStack を mobile で使用する場合

- Appium capability には、prefix なしの W3C capability format を使用します。
- BrowserStack capability には、legacy (Wire JSON) format を使用します。

[Appium caps](https://www.browserstack.com/docs/app-automate/appium/debug-failed-tests/appium-logs)

[BrowserStack options](https://www.browserstack.com/app-automate/capabilities?tag=jsonwire) JSON File Example:

```json
{
  // project と build は修正が必要です（W3C format では projectName と buildName へ変更）
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

:::warning{title="BrowserStack 証明書エラー"}
Android version 13.0 以上の device でテストしている場合、certificate issue により target device が offline のように見えることがあります。詳細と解決方法は BrowserStack の関連ドキュメントを参照してください。\
[https://www.browserstack.com/docs/appium/troubleshooting/networklogs-acceptinsecurecerts-issues](https://www.browserstack.com/docs/appium/troubleshooting/networklogs-acceptinsecurecerts-issues)
:::
