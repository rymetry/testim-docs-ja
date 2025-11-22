---
title: 'SauceLabs/BrowserStackオプション'
description: 'SauceLabsおよびBrowserStackで利用可能な拡張実行パラメーターの設定方法について説明します。JSONファイルでのオプション指定やCLIの使用例を提供します。'
category: 'グリッド管理'
order: 8
updated: '2025-11-21'
sourceUrl: 'https://help.testim.io/docs/saucelabs-browserstack-options'
keywords:
  - SauceLabs
  - BrowserStack
  - 拡張実行パラメーター
  - grid-options
  - 設定オプション
  - カスタマイズ
---
SauceLabsおよびBrowserStackでテストを実行する際、JSON形式の拡張実行パラメーターを使用して、追加の設定を渡すことができます。

たとえば、特定の画面解像度やタイムゾーンでテストを実行したい場合は、次のようなJSONファイルを作成します:

```json
{
  "screenResolution": "2560x1600",
  "timeZone": "New_York"
}
```

CLIでこの設定を使用するには、次のオプションを追加します:

```shell
testim --grid saucelabs --browser chrome --grid-options '{"screenResolution":"2560x1600","timeZone":"New_York"}'
```

拡張実行パラメーターは、次のようなユースケースに使用できます:

- デバイスの割り当て方法の制御
- 使用するAppiumバージョンの制御
- 自動アラート承認の有効化/無効化
- グリッド側で取得するデータ量の制御（動画やネットワークログなど）
- 動画の有効/無効の切り替え
- ネットワークログの有効/無効の切り替え
- ビルドやプロジェクトに応じたカスタムテスト結果マッピング
- リセット戦略の制御

## モバイル向けの拡張実行パラメーターの上書きルール

モバイル向けのJSON拡張実行パラメーターを使用すると、次の設定が上書きされます:

- CLIフラグ（`deviceName`、`osVersion`）
- モバイル構成（Mobile Config）
- デフォルト値（`autoGrantPermissions`、`AutoAcceptAlerts`、動画キャプチャの有効/無効 など）

> 📘 `platformVersion` の扱い
>
> `platformVersion` ケイパビリティは検証され、使用すべきAppiumバージョンを決定するために使用されます。たとえば、クライアントがAppiumバージョン`1.22.2`と `platformVersion` `17.2`（iOS）の組み合わせを指定した場合、自動的にAppium 2が使用され、同時にその旨の警告が表示されます（これは、モバイル構成やCLIフラグの `osVersion` ロジックと同様です）。

## SauceLabs

**Webでの利用:**

CLIに次のオプションを追加します: **--sauce-options  "config_saucelabs.json"**

設定ファイルの例:

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

SauceLabsで利用できるケイパビリティの詳細は、公式ドキュメントを参照してください:  
[https://wiki.saucelabs.com/display/DOCS/Test+Configuration+Options](https://wiki.saucelabs.com/display/DOCS/Test+Configuration+Options)

**モバイルでの利用:**

- AppiumのW3Cフォーマット（接頭辞なし）を使用し、SauceLabsオプションを指定します。

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

## BrowserStack

**Webでの利用:**

CLIに次のオプションを追加します: **--browserstack-options "config_browserstack.json"**  
以下はサポートされる代表的なオーバーライドパラメーターの例です:

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

BrowserStackで利用できるケイパビリティの詳細は、公式ドキュメントを参照してください:  
[https://www.browserstack.com/automate/capabilities](https://www.browserstack.com/automate/capabilities)

**モバイルでの利用:**

- Appiumの拡張実行パラメーターには、接頭辞なしのW3Cケイパビリティ形式を使用します。
- BrowserStack側の拡張実行パラメーターには、レガシー（Wire JSON）形式を使用します。

[Appium caps](https://www.browserstack.com/docs/app-automate/appium/debug-failed-tests/appium-logs)

[Browserstack options](https://www.browserstack.com/app-automate/capabilities?tag=jsonwire) JSON File Example:

```json
{
// project と build を修正する必要があります（W3C形式では projectName, buildName に変更）
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

> 🚧 BrowserStackの証明書エラーについて
>
> Android 13.0以降を使用するデバイスでテストしている場合、証明書の問題によりターゲットデバイスがオフラインのように見えることがあります。この問題の詳細および解決方法については、BrowserStackのドキュメントを参照してください:  
> [https://www.browserstack.com/docs/app-automate/appium/troubleshooting/networklogs-acceptinsecurecerts-issues](https://www.browserstack.com/docs/app-automate/appium/troubleshooting/networklogs-acceptinsecurecerts-issues)
