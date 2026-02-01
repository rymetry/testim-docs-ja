---
title: 'Headspin統合'
description: 'TestimとHeadspinを統合してリモートデバイスでモバイルテストを実行する方法を説明します。実デバイスへのアクセス、設定手順、実行方法を網羅しています。'
category: '統合'
order: 12031
updated: '2025-09-22'
sourceUrl: 'https://help.testim.io/docs/headspin-integration'
keywords:
  - HeadSpin
  - モバイルグリッド
  - リモートデバイス
  - クラウドデバイス
  - 統合設定
---

# Headspin統合

[Headspin](https://www.headspin.io/)は、世界中に配置された実デバイスへのアクセスを提供するモバイルテストプラットフォームです。TestimとHeadspinを統合することで、Headspinの実デバイスでモバイルテストを実行できます。

## 前提条件

- 有効なHeadspinアカウント
- Testimプロジェクトへのアクセス権限

## Headspin統合の設定

1. Testimにログインします
2. **Settings（設定）** > **Integration（統合）** に移動します
3. **Headspin**セクションを見つけます
4. 以下の情報を入力します：
   - **API Token（APIトークン）**: HeadspinダッシュボードからAPIトークンを取得して入力
5. **Connect（接続）** をクリックします

## Headspinでテストを実行する

Headspinデバイスでテストを実行するには：

1. テストエディタを開きます
2. **Run（実行）** ボタンをクリックします
3. **Grid（グリッド）** ドロップダウンから **Headspin** を選択します
4. 実行したいデバイスを選択します
5. **Run（実行）** をクリックしてテストを開始します

### CLIでの実行

CLIからHeadspinデバイスでテストを実行する場合は、`--grid` パラメータを使用します：

```bash
testim --grid headspin --device "iPhone 13" --token <your-token>
```

これでHeadspin統合が完了し、実デバイスでモバイルテストを実行できるようになります。
