---
title: BrowserStack統合
description: >-
  TestimとBrowserStackを統合してクラウドベースのブラウザおよびモバイルデバイスでテストを実行する方法を説明します。設定手順、認証情報の管理、実行方法を網羅しています。
category: 統合
order: 12027
updated: '2025-09-22'
sourceUrl: 'https://help.testim.io/docs/browserstack-integration-1'
keywords:
  - BrowserStack
  - クラウドグリッド
  - ブラウザテスト
  - モバイルテスト
---

# BrowserStack統合

[BrowserStack](https://www.browserstack.com/)は、クラウドベースのブラウザおよびモバイルデバイスでテストを実行できるプラットフォームです。TestimとBrowserStackを統合することで、BrowserStackの広範なブラウザとデバイスのカバレッジを活用できます。

## 前提条件

- 有効なBrowserStackアカウント
- BrowserStackのユーザー名とアクセスキー

## BrowserStack統合の設定

1. Testimにログインします
2. **Settings（設定）** > **Integration（統合）** に移動します
3. **BrowserStack**セクションを見つけます
4. 以下の情報を入力します：
   - **Username（ユーザー名）**: BrowserStackのユーザー名
   - **Access Key（アクセスキー）**: BrowserStackのアクセスキー
5. **Connect（接続）** をクリックします

## BrowserStackでテストを実行する

### エディタから実行

1. テストエディタを開きます
2. **Run（実行）** ボタンをクリックします
3. **Grid（グリッド）** ドロップダウンから **BrowserStack** を選択します
4. 実行したいブラウザまたはデバイスを選択します
5. **Run（実行）** をクリックしてテストを開始します

### CLIから実行

```bash
testim --grid browserstack --browser chrome --token <your-token>
```

### モバイルテストの実行

BrowserStackでモバイルテストを実行する場合：

```bash
testim --grid browserstack --device "iPhone 13" --os-version "15.0" --token <your-token>
```

### 追加オプション

BrowserStackの追加オプション（タイムゾーン、画面解像度など）については、[SauceLabs/BrowserStackオプション](saucelabs-browserstack-options)を参照してください。

## BrowserStackでの結果確認

テスト実行後、Testim上で結果を確認できます。また、BrowserStackダッシュボードでも詳細なログ、スクリーンショット、ビデオを確認できます。

## トラブルシューティング

接続に問題がある場合は、以下を確認してください：

- BrowserStackのユーザー名とアクセスキーが正しいか
- BrowserStackアカウントがアクティブで、利用可能な並列実行枠があるか
- 選択したブラウザ/デバイスがBrowserStackで利用可能か
