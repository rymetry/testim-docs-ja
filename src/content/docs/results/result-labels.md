---
title: '結果ラベル'
description: 'テスト実行結果にラベルを追加する方法について説明します。CLIまたはスケジューラーからラベルを追加できます。'
category: '結果'
order: 12
updated: '2025-11-11'
keywords:
  - testim
  - result-labels
  - results
  - 結果ラベル
---
実行結果にラベルを追加する方法を学びます。

**「結果ラベル」**を使用すると、リモート実行にテキストラベルを追加できます。\
**「スイート実行」**および**「テスト実行」**ページで、結果ラベルを選択して実行を簡単にフィルタリングできます。

![1893](/images/results/result-labels/f4b59d0-ResultLabels.gif)

結果ラベルは、以下のようなさまざまなオプションに使用できます:

* テストされたアプリケーション環境
* テストされたアプリケーションバージョン
* 実行を実行したユーザー
* CI/CDシステム実行かどうか

例: "nightly-scheduler"、"v1.42.34"、"Jenkins"、"Troubleshooting"、"Staging"

## CLI経由で結果ラベルを追加する

実行にラベルを追加するには、CLIで以下のパラメータを使用します:

```shell
--result-label "nightly Jenkins run"
```

* 必要に応じて、CLIコマンドに複数の結果ラベルを追加できます。CLIの実行の詳細については、[コマンドラインインターフェース(CLI)](/docs/running-tests/the-command-line-cli)を参照してください。

```shell
--result-label "nightly Jenkins run" --result-label "v1.42.35"
```

> 📘 結果ラベルは250文字を超えることはできません

## スケジューラー経由で結果ラベルを追加する

スケジュールされた実行は、事前定義されたスケジュールに基づいて実行されるテスト実行です。スケジューラーを作成する際、**詳細オプション**の一部として結果ラベルを追加できます。詳細については、[スケジューラー](/docs/running-tests/scheduler)を参照してください。
