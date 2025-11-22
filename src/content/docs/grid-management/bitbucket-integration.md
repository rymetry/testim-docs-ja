---
title: 'Bitbucket統合'
description: 'TestimとBitbucketを統合してバージョン管理とCI/CDパイプラインを連携させる方法を説明します。リポジトリ接続、Bitbucket Pipelines設定、自動テスト実行を網羅しています。'
category: 'グリッド管理'
order: 10
updated: '2025-09-22'
sourceUrl: 'https://help.testim.io/docs/bitbucket-integration'
keywords:
  - Bitbucket
  - バージョン管理
  - CI/CD
  - パイプライン
---

# Bitbucket統合

[Bitbucket](https://bitbucket.org/)は、Gitベースのバージョン管理システムおよびCI/CDプラットフォームです。TestimとBitbucketを統合することで、コード変更に合わせて自動的にテストを実行できます。

## Bitbucket統合の設定

### 1. Bitbucketリポジトリの準備

1. Bitbucketアカウントにログインします
2. Testimテストを管理するリポジトリを作成または選択します

### 2. Testim CLIのセットアップ

Bitbucket Pipelinesで Testim CLIを使用するには、以下の手順に従います：

#### `bitbucket-pipelines.yml` の作成

リポジトリのルートに以下の内容で `bitbucket-pipelines.yml` を作成します：

```yaml
image: node:14

pipelines:
  default:
    - step:
        name: Testim Tests
        script:
          - npm install -g @testim/testim-cli
          - testim --token "$TESTIM_TOKEN" --project "$TESTIM_PROJECT" --grid "Testim Grid"
        services:
          - docker
```

### 3. 環境変数の設定

1. Bitbucketリポジトリの **Settings（設定）** > **Repository variables（リポジトリ変数）** に移動します
2. 以下の変数を追加します：
   - `TESTIM_TOKEN`: Testimのアクセストークン
   - `TESTIM_PROJECT`: TestimプロジェクトID
3. **Secured（保護）** にチェックを入れて変数を保護します

## カスタマイズ

### 特定のブランチでのみ実行

```yaml
pipelines:
  branches:
    master:
      - step:
          name: Testim Tests
          script:
            - npm install -g @testim/testim-cli
            - testim --token "$TESTIM_TOKEN" --project "$TESTIM_PROJECT" --grid "Testim Grid"
```

### 並列実行

```yaml
pipelines:
  default:
    - parallel:
        - step:
            name: Testim Tests - Suite 1
            script:
              - npm install -g @testim/testim-cli
              - testim --token "$TESTIM_TOKEN" --project "$TESTIM_PROJECT" --suite "Suite 1"
        - step:
            name: Testim Tests - Suite 2
            script:
              - npm install -g @testim/testim-cli
              - testim --token "$TESTIM_TOKEN" --project "$TESTIM_PROJECT" --suite "Suite 2"
```

## トラブルシューティング

パイプラインが失敗する場合は、以下を確認してください：

- Testim CLIが正しくインストールされているか
- 環境変数が正しく設定されているか
- Testimトークンが有効か
- 選択したグリッドが利用可能か
