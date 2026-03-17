---
title: コンソールエラーのデバッグとDOMアクセス
description: Chrome開発者ツールを使用したデバッグ、コンソールエラーとネットワークエラーの確認、失敗ステップのDOMスナップショット表示について説明します。
category: 結果
order: 7008
updated: '2025-09-22'
sourceUrl: 'https://help.testim.io/docs/debug-console-errors-access-dom'
keywords:
  - コンソールエラー
  - ネットワークエラー
  - DOMスナップショット
  - デバッグ
  - Chrome DevTools
  - テストログ
---

## Chromeコンソールを使用したデバッグ

console.log(myVar)を使用するか、Chrome DevToolsデバッガーを使用して、テスト実行中のエラーを確認できます(コードにデバッガーを追加)。

## コンソールエラーとネットワークのデバッグ

Testimはコンソールエラーとネットワークエラーを自動的に記録します。

**テスト実行でエラーを表示するには:**

1. テスト実行または実行に移動します。
2. テスト上部のエラーメッセージと、失敗した特定のテストステップを確認します。

![テスト結果画面のエラー表示](/images/results/debug-console-errors-access-dom/1b081be-displayed-errors.png)

3. コンソールログを開きます。

![ブラウザコンソールログの表示](/images/results/debug-console-errors-access-dom/154a7ab-vewconsolelog.png)

4. コンソールログを表示して、特定のエラーに関する洞察を得ます。

![コンソールエラー一覧の例](/images/results/debug-console-errors-access-dom/8c191a6-consoleerrors.png)

:::warning{title="注意"}
テストログは、Chrome & Edge Chromiumブラウザでの実行にのみ表示されます。
:::

## 失敗ステップのDOMを確認してデバッグする

ステップが失敗すると、Testimは完全なDOMスナップショットを保存するため、後でデバッグできます。

**エラーのDOMスナップショットを表示するには:**

1. テスト実行または実行に移動します。
2. 失敗した特定のテストステップでエラーメッセージを確認します。

![失敗ステップのエラーメッセージ](/images/results/debug-console-errors-access-dom/1400173-steperror.png)

3. DOMスナップショットを表示するには、ステップにカーソルを合わせて**スクリーンショットを表示**ボタンをクリックするか、ステップのプロパティパネルで**DOMを表示**リンクをクリックします。

![DOMスナップショット表示ボタン](/images/results/debug-console-errors-access-dom/a6ac0aa-viewdom1.png)

![DOMスナップショット表示画面](/images/results/debug-console-errors-access-dom/986c536-viewdom2.png)

:::warning{title="注意"}
* DOMは、Chrome & Edge Chromiumブラウザの実行にのみ表示されます。
* DOMは失敗したステップにのみ表示されます。
:::

## ステップパラメータのデバッグ

プロパティパネルでは、各ステップで実行中に使用されたすべてのパラメータを確認できます。これらのパラメータは、実行中の各ステップで何が起こったかを理解するのに役立ちます。

* **受信パラメータ**: このステップで使用できるすべての受信パラメータ。パラメータは、前のステップのエクスポート、スイート内の前のテストから実行されたグローバルエクスポート、データ駆動パラメータ、グループ/ステップパラメータなどから取得できます。
* **ローカルエクスポート**: このステップで作成されたエクスポートパラメータ。
* **グローバルエクスポート**: このステップで作成されたグローバルエクスポートパラメータ。

![ステップパラメータの詳細表示](/images/results/debug-console-errors-access-dom/e5d13c5-step_params.gif)
