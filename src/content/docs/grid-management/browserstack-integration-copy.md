---
title: SauceLabs/BrowserStackオプション
description: >-
  SauceLabsおよびBrowserStackで利用可能な高度な設定オプションを説明します。タイムゾーン、画面解像度、デバイス設定、その他のカスタマイズ方法を網羅しています。
category: 統合
order: 12028
updated: '2025-09-22'
sourceUrl: 'https://help.testim.io/docs/browserstack-integration-copy'
keywords:
  - SauceLabs
  - BrowserStack
  - 設定オプション
  - カスタマイズ
---

# SauceLabs/BrowserStackオプション

SauceLabsおよびBrowserStackでテストを実行する際、様々な追加オプションを設定してテスト環境をカスタマイズできます。

## 共通オプション

### タイムゾーン設定

テストを特定のタイムゾーンで実行するには、設定ファイルまたはCLIで指定できます：

```javascript
// 設定ファイル
{
  "gridOptions": {
    "timezone": "America/New_York"
  }
}
```

```bash
# CLI
testim --grid saucelabs --browser chrome --grid-options '{"timezone":"America/New_York"}' --token <your-token>
```

### 画面解像度

画面解像度を指定するには：

```javascript
// 設定ファイル
{
  "gridOptions": {
    "screenResolution": "1920x1080"
  }
}
```

### デバイス名とバージョン

モバイルテストの場合、デバイス名とOSバージョンを指定できます：

```bash
testim --grid browserstack --device "iPhone 13" --os-version "15.0" --token <your-token>
```

## SauceLabs固有のオプション

### ビデオ録画の無効化

```javascript
{
  "gridOptions": {
    "recordVideo": false
  }
}
```

### スクリーンショットの無効化

```javascript
{
  "gridOptions": {
    "recordScreenshots": false
  }
}
```

## BrowserStack固有のオプション

### ローカルテスト

BrowserStack Localを使用してローカル環境のアプリケーションをテストするには：

```javascript
{
  "gridOptions": {
    "local": true,
    "localIdentifier": "my-tunnel"
  }
}
```

### ネットワークログ

```javascript
{
  "gridOptions": {
    "networkLogs": true
  }
}
```

## 詳細情報

各プラットフォームで利用可能なすべてのオプションについては、以下を参照してください：

- [SauceLabs Capabilities](https://docs.saucelabs.com/dev/test-configuration-options/)
- [BrowserStack Capabilities](https://www.browserstack.com/automate/capabilities)
