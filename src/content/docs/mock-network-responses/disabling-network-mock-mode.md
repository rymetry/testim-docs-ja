---
title: ネットワークモックモードの無効化
description: ネットワークモックモードを無効化する方法について説明します。UI経由またはCLI経由での無効化手順を学びます。
category: テスト実行
order: 6017
updated: '2025-11-11'
sourceUrl: 'https://help.testim.io/docs/disabling-network-mock-mode'
keywords:
  - ネットワークモック
  - モックモード
  - 無効化
  - テスト実行
  - CLIフラグ
  - テストプロパティ
  - 実行設定
---

以前にモックネットワークモードを有効にしたテストに対して、ネットワークモックモードを無効にすることができます。

## UI経由でモックネットワークモードを無効化する

UI経由でモックネットワークモードを無効化するには:\
**プロパティ**ペインで、モックネットワークの下にある**モックネットワークでテストを実行**設定を切り替えます。

![モックネットワークを無効化するトグル設定画面](/images/mock-network-responses/disabling-network-mock-mode/26999eb-mock9.png)

## CLI経由でモックネットワークモードを無効化する

## CLI実行全体でモックモードを無効化する

CLI実行全体でモックモードをキャンセルする場合は、`--disable-mock-network`フラグを渡します。一部のテストでモックトグルがオンになっている場合でも、モックモードは無効化されます。

```shell
> testim --disable-mock-network
```

例:

```shell
testim <your CLI options> <your CLI parameters> --mock-network-pattern
```
