---
title: バグ解決のための新しいステップの記録
description: デバッグ中に不足しているステップを追加する方法。テストの最後または途中でステップを記録する手順。
category: デバッグ
order: 8003
updated: '2025-09-22'
sourceUrl: 'https://docs.tricentis.com/testim/content/debugging-tests/recording-additional-steps-to-fix-bugs.htm'
keywords:
  - ステップ追加
  - 途中から記録
  - バグ修正
  - デバッグ
  - テスト編集
  - 再記録
  - テスト修正
  - ステップ記録
  - AUT 操作
  - テスト更新
---

デバッグを伴うテストを実行した後、テストにいくつかのステップが欠けていることや、一部のステップが更新されておらず再記録が必要であることがわかる場合があります。ステップを手動で追加したり、AUT（テスト対象アプリケーション）を介して記録したりすることが可能です。テスト記録は、テスト対象アプリケーション（AUT）と対話するときに、ユーザーアクションのシーケンスを記録できる機能です。

詳細については、[テストの編集](/docs/editing-tests/editing-your-tests)を参照してください。

## 記録を開始

テストの最後にステップを追加する必要がある場合は、**Start recording**ボタンを使用できます。このオプションは、テスト記録プロセスを開始します。記録が開始されると、エディターは AUT で実行するすべてのアクションを追跡して記録します。→ **記録を開始するには:**

- 実行が停止している間に、**Record**ボタンをクリックします。

![Record ボタンの位置](/images/debugging/recording-additional-steps-to-fix-bugs/42ba6df-record.png)

## この位置から記録を開始

既存のテストの途中のどこかにステップを追加する必要がある場合は、**Start recording at this position**機能を使用して、記録を開始する特定のステップを指定できます。これは、セッションの最初からすべてのアクションをキャプチャするのではなく、特定の AUT 状態に記録を集中させたい場合に便利です。→ **この位置から記録を開始するには:**

1. 新しく記録したステップを追加するステップまでテストを実行します。手動ブレークポイントを配置することでこれを行うことができます（詳細については該当セクションを参照してください）。AUT が追加のステップを記録するために使用する画面を表示していることを確認してください。
2. 追加の記録ステップを追加する 2 つのステップ間の矢印にカーソルを合わせ、**Start recording at this position**ボタンをクリックします。\
   ![Start recording at this position ボタン](/images/debugging/recording-additional-steps-to-fix-bugs/603c6fe-startrecordingatthis.png)

3. AUT ウィンドウで、追加のステップを記録します。
4. **Stop recording**ボタンをクリックして、記録を停止します。\
   ![Stop recording ボタン](/images/debugging/recording-additional-steps-to-fix-bugs/8eeb2d5-stoprecording.png)
