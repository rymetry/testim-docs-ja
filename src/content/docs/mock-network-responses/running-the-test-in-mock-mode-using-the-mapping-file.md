---
title: モックモードでのテスト実行
description: マッピングファイルを使用したモックモードでのテスト実行方法について説明します。UI 経由または CLI 経由での実行手順を学びます。
category: テスト実行
order: 6016
updated: '2025-11-11'
sourceUrl: >-
  https://help.testim.io/docs/running-the-test-in-mock-mode-using-the-mapping-file
keywords:
  - モックモード
  - ネットワークモック
  - テスト実行
  - マッピングファイル
  - HAR ファイル
  - CLI 実行
  - ローカル実行
  - リモート実行
---

新しい HAR の記録後、カスタム HAR のアップロード後、またはマッピングファイルのアップロード後、テストのモックネットワークモードが自動的に有効になります。

![モックネットワークモードが有効なテストの設定画面](/images/mock-network-responses/running-the-test-in-mock-mode-using-the-mapping-file/26999eb-mock9.png)

UI 経由でローカルに、または CLI 経由でリモートで、モックネットワークモードでテストを実行できます。

## UI 経由でローカルにテストを実行

**ローカルでテストを実行するには:**

1. Testim Visual Editor で、**テストリスト**画面に移動し、新しい HAR を記録したか、カスタム HAR をアップロードしたテストをクリックします。
2. テストエディター画面で、**再生**ボタンの横に**モックネットワーク**アイコンが表示され、モックネットワークが利用可能であることを示します。

![再生ボタン横にモックネットワークアイコンが表示されたテスト一覧](/images/mock-network-responses/running-the-test-in-mock-mode-using-the-mapping-file/173c389-mock6.png)

3. **再生**ボタンをクリックして、モックネットワークを使用してテストを実行します。

## CLI 経由でローカルにテストを実行

エディターでテストがモックモードの場合、CLI 経由でもデフォルトの実行モードはモックになります。追加のフラグは必要ありません。

### マッピングファイルのみを使用してテストを実行

エディター経由でマッピングファイルを既にアップロードしている場合、このファイルは CLI 実行でも使用されます。また、作成したマッピングファイルへのパスを提供することで、実行全体のマッピングファイルをオーバーライドすることも可能です。このオプションはリモート実行でのみサポートされています。

```shell
> testim --override-map-file </path/to/mapping/file.json>
```

この場合、リクエストをモックする階層は次のようになります:

- CLI マッピングファイル
- テストマッピングファイル
- HAR ファイル
- 実際の呼び出しを実行

例:

```shell
testim <your CLI options> <your CLI parameters> --override-map-file <documents/mappingFile.json>
```
