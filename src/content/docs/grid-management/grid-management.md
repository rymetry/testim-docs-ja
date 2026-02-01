---
title: 'グリッド管理'
description: 'Testimで利用可能な様々なテスト実行グリッドの概要を説明します。Testimグリッド、クラウドプロバイダー、カスタムグリッドの選択と設定方法を網羅しています。'
category: '統合'
order: 12022
updated: '2025-09-22'
sourceUrl: 'https://help.testim.io/docs/grid-management'
keywords:
  - グリッド管理
  - テスト実行環境
  - Testim Grid
  - ブラウザグリッド
  - モバイルグリッド
  - クラウドグリッド
---

# グリッド管理

Testimでは、様々なグリッド（テスト実行環境）を使用してテストを実行できます。各グリッドには独自の特徴と利点があり、プロジェクトのニーズに合わせて選択できます。

## 利用可能なグリッド

### 1. Testim Grid（推奨）

Testimが提供するマネージドグリッドです。セットアップ不要で、すぐに使い始められます。

**特徴：**
- セットアップ不要
- 自動スケーリング
- 常に最新のブラウザバージョン
- 高速で安定した実行環境

**対象：**
- Webブラウザテスト（Chrome、Firefox、Edge、Safari）

### 2. Tricentis Device Cloud（旧Virtual Mobile Grid）

Tricentisが提供するモバイルデバイスグリッドです。実デバイスでのモバイルテストに最適です。

**特徴：**
- 実デバイスでのテスト実行
- iOS/Androidの幅広いカバレッジ
- マネージドサービス（メンテナンス不要）

**対象：**
- モバイルアプリテスト（iOS/Android）

### 3. SauceLabs

[SauceLabs](https://saucelabs.com/)は、クラウドベースのブラウザおよびモバイルテストプラットフォームです。

**特徴：**
- 多様なブラウザとデバイスの組み合わせ
- 自動ビデオ録画とログ
- グローバルなデータセンター

**対象：**
- Webブラウザテスト
- モバイルアプリテスト

### 4. BrowserStack

[BrowserStack](https://www.browserstack.com/)は、クラウドベースのブラウザおよびモバイルテストプラットフォームです。

**特徴：**
- 3000以上のブラウザ/デバイスの組み合わせ
- ローカルテスト機能
- 詳細なデバッグツール

**対象：**
- Webブラウザテスト
- モバイルアプリテスト

### 5. Headspin

[Headspin](https://www.headspin.io/)は、世界中に配置された実デバイスへのアクセスを提供します。

**特徴：**
- グローバルな実デバイスアクセス
- パフォーマンス分析機能
- ネットワーク条件のシミュレーション

**対象：**
- モバイルアプリテスト

### 6. カスタムグリッド

独自のSelenium GridまたはAppiumグリッドを使用できます。

**特徴：**
- 完全なコントロール
- プライベートネットワーク内での実行
- カスタマイズ可能な設定

**対象：**
- Webブラウザテスト（Selenium Grid）
- モバイルアプリテスト（Appium）

## グリッドの選択基準

プロジェクトに適したグリッドを選択する際の考慮事項：

### テストタイプ
- **Webブラウザ**: Testim Grid、SauceLabs、BrowserStack、カスタムグリッド
- **モバイルアプリ**: Tricentis Device Cloud、SauceLabs、BrowserStack、Headspin、カスタムグリッド

### 予算
- **コスト重視**: Testim Grid（含まれている場合）、カスタムグリッド
- **柔軟性重視**: SauceLabs、BrowserStack（従量課金）

### セキュリティ要件
- **高セキュリティ**: カスタムグリッド（プライベートネットワーク内）
- **標準**: クラウドプロバイダー（SauceLabs、BrowserStack）

### カバレッジ
- **広範なブラウザ/デバイス**: SauceLabs、BrowserStack
- **特定の環境**: Testim Grid、カスタムグリッド

## グリッドの設定

各グリッドの詳細な設定方法については、以下のドキュメントを参照してください：

- [Tricentis Device Cloud](tricentis-device-cloud)
- [カスタムグリッド](custom-grid)
- [SauceLabs統合](saucelabs-integration)
- [BrowserStack統合](browserstack-integration-1)
- [Headspin統合](headspin-integration)
- [Bitbucket統合](bitbucket-integration)

## よくある質問

### Q: 複数のグリッドを同時に使用できますか？

はい、テストごとに異なるグリッドを選択できます。また、同じテストを複数のグリッドで実行することも可能です。

### Q: グリッドを切り替えるとテストを修正する必要がありますか？

いいえ、Testimのテストはグリッドに依存しないため、グリッドを切り替えてもテストの修正は不要です。

### Q: ローカル環境のアプリケーションをテストできますか？

はい、カスタムグリッドまたはBrowserStack/SauceLabsのローカルテスト機能を使用できます。
