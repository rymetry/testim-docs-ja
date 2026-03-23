---
title: 結果ラベル
description: テスト実行結果にラベルを追加する方法について説明します。CLI または Scheduler からラベルを追加できます。
category: テスト結果
order: 7012
updated: '2025-09-22'
sourceUrl: 'https://help.testim.io/docs/result-labels'
keywords:
  - 結果ラベル
  - 実行ラベル
  - テスト実行フィルター
  - CLI パラメーター
  - スケジューラー
  - テスト管理
---

実行結果にラベルを追加する方法を学びます。

**「結果ラベル」** を使用すると、リモート実行にテキストラベルを追加できます。\
**「スイート実行」** および **「テスト実行」** ページで、結果ラベルを選択して実行を簡単にフィルタリングできます。

![結果ラベル設定画面の例](/images/results/result-labels/f4b59d0-ResultLabels.gif)

結果ラベルは、以下のようなさまざまなオプションに使用できます:

- テストされたアプリケーション環境
- テストされたアプリケーションバージョン
- 実行を実行したユーザー
- CI/CD システム実行かどうか

例: "nightly-scheduler"、"v1.42.34"、"Jenkins"、"Troubleshooting"、"Staging"

## CLI 経由で結果ラベルを追加する

実行にラベルを追加するには、CLI で以下のパラメーターを使用します:

```shell
--result-label "nightly Jenkins run"
```

- 必要に応じて、CLI コマンドに複数の結果ラベルを追加できます。CLI の実行の詳細については、[コマンドラインインターフェース（CLI）](/docs/the-command-line-cli)を参照してください。

```shell
--result-label "nightly Jenkins run" --result-label "v1.42.35"
```

:::note
結果ラベルは 250 文字を超えることはできません。
:::

## Scheduler 経由で結果ラベルを追加する

スケジュールされた実行は、事前定義されたスケジュールに基づいて実行されるテスト実行です。Scheduler を作成する際、**詳細オプション**の一部として結果ラベルを追加できます。詳細については、[Scheduler](/docs/scheduler)を参照してください。
