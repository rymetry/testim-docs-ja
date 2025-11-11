---
title: 'テストの停止、一時停止、デバッグ'
description: 'テスト実行中の停止、一時停止、ステップバイステップ実行、ブレークポイントの設定方法について説明します。'
category: '結果'
order: 11
updated: '2025-11-11'
keywords:
  - testim
  - stop-pause-debug-tests
  - results
  - デバッグ
  - ブレークポイント
---
失敗したテストがある場合、デバッグを開始するためにテストが完全に実行されるまで待つ必要はありません。Testimには、実行時にテストを迅速にデバッグするためのツールがいくつか含まれています:

* 現在実行中のテストを停止する
* 特定の問題のある/興味深いポイントで一時停止し、詳しく見る
* テストを1ステップずつ実行する

## 現在実行中のテストを停止する

:fa-arrow-right: **テストの実行を停止するには:**

1. アクションメニューの**停止**ボタンをクリックします。

![](/images/results/stop-pause-debug-tests/97c8cc2-test-running.png "test-running.png")

テストは失敗としてマークされ、完了しなかった最後のステップが強調表示されます。

![](/images/results/stop-pause-debug-tests/84ea66c-test-failed-stopped.png "test-failed-stopped.png")

## 実行中のテストを一時停止する

:fa-arrow-right: **現在実行中のテストを一時停止するには:**

1. アクションメニューの「一時停止」ボタンをクリックします。

![](/images/results/stop-pause-debug-tests/32e47a3-test-pause.png "test-pause.png")

2. テストの実行を再開するには、アクションメニューの**再生**ボタンをクリックします。テストは、以前に一時停止されたステップから再開されます。

![](/images/results/stop-pause-debug-tests/680cdd0-test-resume.png "test-resume.png")

## ステップバイステップで実行する

テストを1ステップずつデバッグしている場合、テストの各ステップがいつ実行されるかを制御できます。

:fa-arrow-right: **テストをステップバイステップで実行するには:**

1. **再生**ボタンの横のドロップダウンボタンをクリックし、**ローカルでステップバイステップ実行**を選択します。

![](/images/results/stop-pause-debug-tests/32f50bb-run-step-by-step.png "run-step-by-step.png")

2. アクションメニューの**次のステップを再生**ボタンをクリックして、テストの次のステップを実行します。

![](/images/results/stop-pause-debug-tests/260b2f1-run-next-step.png "run-next-step.png")

## ブレークポイントを挿入する

ブレークポイントは、特定のステップでテストを自動的に一時停止します(実行前)。

:fa-arrow-right: **テストにブレークポイントを挿入するには:**

1. 2つのステップ間の矢印にカーソルを合わせ、**ブレークポイントの切り替え**ボタンをクリックします。

![](/images/results/stop-pause-debug-tests/20582a1-add-breakpoint.png "add-breakpoint.png")

これにより、ステップ間にブレークポイント(一時停止記号)が表示されます。

![](/images/results/stop-pause-debug-tests/2301396-breakpointadded.png "breakpointadded.png")

> 📘 注意:
>
> キーボードショートカット(Ctrl/Cmd + B)を使用してブレークポイントを追加できます。

## 特定のステップから実行する

テストをデバッグするとき、毎回最初からテストを実行したくない場合があります。Testimでは、特定のステップからテストを実行できます。

> 📘 注意:
>
> テストに前のステップに依存するステップ(例: アプリケーションへのログイン)がある場合、ステップの途中からテストを開始すると、常にテストが失敗する可能性があります。

:fa-arrow-right: **特定のステップからテストを実行するには:**

1. 2つのステップ間の矢印にカーソルを合わせ、**ここから再生**ボタンをクリックします。

![](/images/results/stop-pause-debug-tests/0b8ce9d-playfromhere.png "playfromhere.png")

テストは、選択後のステップから実行を開始します。
