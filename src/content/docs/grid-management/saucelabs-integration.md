---
title: 'SauceLabs統合'
description: 'TestimとSauceLabsを統合してクラウドベースのブラウザおよびモバイルデバイスでテストを実行する方法を説明します。設定手順、認証情報の管理、実行方法を網羅しています。'
category: 'グリッド管理'
order: 5
updated: '2025-09-22'
sourceUrl: 'https://help.testim.io/docs/saucelabs-integration'
keywords:
  - SauceLabs
  - クラウドグリッド
  - ブラウザテスト
  - モバイルテスト
---

# SauceLabs統合

[SauceLabs](https://saucelabs.com/)は、クラウドベースのブラウザおよびモバイルデバイスでテストを実行できるプラットフォームです。TestimとSauceLabsを統合することで、SauceLabsの広範なブラウザとデバイスのカバレッジを活用できます。

## 前提条件

- 有効なSauceLabsアカウント
- SauceLabsのユーザー名とアクセスキー

## SauceLabs統合の設定

1. Testimにログインします
2. **Settings（設定）** > **Integration（統合）** に移動します
3. **SauceLabs**セクションを見つけます
4. 以下の情報を入力します：
   - **Username（ユーザー名）**: SauceLabsのユーザー名
   - **Access Key（アクセスキー）**: SauceLabsのアクセスキー
5. **Connect（接続）** をクリックします

## SauceLabsでテストを実行する

### エディタから実行

1. テストエディタを開きます
2. **Run（実行）** ボタンをクリックします
3. **Grid（グリッド）** ドロップダウンから **SauceLabs** を選択します
4. 実行したいブラウザまたはデバイスを選択します
5. **Run（実行）** をクリックしてテストを開始します

### CLIから実行

```bash
testim --grid saucelabs --browser chrome --token <your-token>
```

### 追加オプション

SauceLabsの追加オプション（タイムゾーン、画面解像度など）については、[SauceLabs/BrowserStackオプション](saucelabs-browserstack-options)を参照してください。

## SauceLabsでの結果確認

テスト実行後、Testim上で結果を確認できます。また、SauceLabsダッシュボードでも詳細なログ、スクリーンショット、ビデオを確認できます。

## トラブルシューティング

接続に問題がある場合は、以下を確認してください：

- SauceLabsのユーザー名とアクセスキーが正しいか
- SauceLabsアカウントがアクティブか
- 選択したブラウザ/デバイスがSauceLabsで利用可能か
