---
title: 'Tricentis Device Cloud'
description: 'Tricentis Device Cloud（旧Testim Virtual Mobile Grid）を使用してクラウド上の実デバイスでモバイルテストを実行する方法を説明します。'
category: 'グリッド管理'
order: 2
updated: '2025-09-22'
sourceUrl: 'https://help.testim.io/docs/tricentis-device-cloud'
keywords:
  - Tricentis Device Cloud
  - TDC
  - Tricentis
  - モバイルグリッド
  - クラウドデバイス
---

# Tricentis Device Cloud

Tricentis Device Cloud（旧Testim Virtual Mobile Grid）は、クラウド上の実デバイスでモバイルテストを実行できるTricentisのマネージドサービスです。

## 概要

Tricentis Device Cloudを使用すると、以下のことが可能になります：

- 様々なiOSおよびAndroidデバイスでテストを実行
- デバイスのセットアップやメンテナンスの手間を削減
- スケーラブルなテスト実行環境を利用
- 実デバイス上での正確なテスト結果を取得

## 利用可能なデバイス

Tricentis Device Cloudでは、以下のデバイスが利用可能です：

- **iOS**: 最新のiPhoneおよびiPadモデル
- **Android**: 主要メーカーの最新デバイス（Samsung、Google Pixelなど）

利用可能なデバイスの完全なリストは、Testimのデバイス選択画面で確認できます。

## Tricentis Device Cloudでテストを実行する

### エディタから実行

1. テストエディタを開きます
2. **Run（実行）** ボタンをクリックします
3. **Grid（グリッド）** ドロップダウンから **Tricentis Device Cloud** を選択します
4. 実行したいデバイスとOSバージョンを選択します
5. **Run（実行）** をクリックしてテストを開始します

### CLIから実行

```bash
testim --grid "tricentis-device-cloud" --device "iPhone 14" --os-version "16.0" --token <your-token>
```

### スケジューラから実行

1. **Scheduler（スケジューラ）** に移動します
2. スケジュールを作成または編集します
3. **Grid（グリッド）** として **Tricentis Device Cloud** を選択します
4. テストを実行するデバイスを選択します
5. スケジュールを保存して有効化します

## 制限事項

- Tricentis Device Cloudは、Testimプランに応じて利用可能です
- 同時実行数は契約プランによって異なります
- 一部の地域では利用できない場合があります

詳細については、Tricentisサポートにお問い合わせください。
