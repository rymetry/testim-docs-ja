---
title: Test capabilities for SauceLabs & BrowserStack in CLI
description: >-
  SauceLabs と BrowserStack の Grid で JSON file を使って capability を CLI
  から渡す方法と、mobile 実行時の override rule を説明します。
category: 統合
order: 12030
updated: '2025-11-21'
sourceUrl: 'https://docs.tricentis.com/testim/content/integrations/grid-management/saucelabs-browserstack-options.htm'
keywords:
  - SauceLabs
  - BrowserStack
  - capability
  - CLI
  - sauce-options
  - browserstack-options
---

定義済みの capability を含む JSON ファイルを使うことで、SauceLabs と BrowserStack へ追加の構成パラメーターを渡せます。例えば、特定の browser バージョンやタイムゾーンでテストを実行したい場合は、次の手順に従います。

1. 次の JSON file を作成します。

```json
{
  "screenResolution": "2560x1600",
  "timeZone": "New_York"
}
```

2. CLI に `--sauce-options` と `"<aboveConfigFileName>.json"` を追加します。

capability は次のような用途に利用できます。

- デバイス割り当ての制御
- Appium バージョンの制御
- 自動アラート承認の制御
- Grid 側で取得するデータの制御
- 動画記録の無効化
- ネットワークログの無効化
- ビルドやプロジェクトの option capability を使ったカスタムテスト結果のマッピング
- reset strategy の制御

## capability のオーバーライド規則 (mobile)

JSON の capability ファイルの設定は、次の設定を上書きします。

- CLI フラグ (`deviceName`、`osVersion`)
- Mobile Config
- `autoGrantPermissions`、`AutoAcceptAlerts`、動画キャプチャーの無効化などの既定値

:::info{title="PlatformVersion capabilities"}
`platformVersion` capability は検証され、使用すべき Appium のバージョンを決定するために使われます。例えばクライアントが Appium バージョン `1.22.2` と、iOS 実行で `platformVersion` `17.2` を要求した場合、自動的に Appium 2 が使用され、その旨の警告が表示されます。これは mobile config / CLI フラグの `osVersion` の挙動と同様です。
:::

## SauceLabs

**Web の場合:**

CLI に `--sauce-options` と `"config_saucelabs.json"` を追加します。ファイルの例:

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

**Mobile の場合:**

- プレフィックスなしの W3C 形式で Appium の capability と SauceLabs の オプションを指定します。

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

**Web の場合:**

CLI に `--browserstack-options` と `"config_browserstack.json"` を追加します。サポートされる代表的な override パラメーターの例は次のとおりです。

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

parameter の詳細は、BrowserStack の公式ドキュメントを参照してください。

[https://www.browserstack.com/automate/capabilities](https://www.browserstack.com/automate/capabilities)

**Mobile の場合:**

- Appium の capability には、プレフィックスなしの W3C 形式を使用します。
- BrowserStack の capability には、レガシー (Wire JSON) 形式を使用します。

[Appium caps](https://www.browserstack.com/docs/app-automate/appium/debug-failed-tests/appium-logs)

[BrowserStack options](https://www.browserstack.com/app-automate/capabilities?tag=jsonwire)。JSON ファイルの例:

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
Android 13.0 以上のデバイスでテストしている場合、証明書の問題により対象デバイスがオフラインのように見えることがあります。詳細と解決方法は BrowserStack の関連ドキュメントを参照してください。\
[https://www.browserstack.com/docs/app-automate/appium/troubleshooting/networklogs-acceptinsecurecerts-issues](https://www.browserstack.com/docs/app-automate/appium/troubleshooting/networklogs-acceptinsecurecerts-issues)
:::
