---
title: 'コンソールエラーのデバッグとDOMアクセス'
description: 'Chrome開発者ツールを使用したデバッグ、コンソールエラーとネットワークエラーの確認、失敗ステップのDOMスナップショット表示について説明します。'
category: '結果'
order: 8
updated: '2025-11-11'
keywords:
  - testim
  - debug-console-errors-access-dom
  - results
  - デバッグ
  - コンソールエラー
  - DOM
---
## Chromeコンソールを使用したデバッグ

console.log(myVar)を使用するか、Chrome DevToolsデバッガーを使用して、テスト実行中のエラーを確認できます(コードにデバッガーを追加)。

## コンソールエラーとネットワークのデバッグ

Testimはコンソールエラーとネットワークエラーを自動的に記録します。

:fa-arrow-right: **テスト実行でエラーを表示するには:**

1. テスト実行または実行に移動します。
2. テスト上部のエラーメッセージと、失敗した特定のテストステップを確認します。

![1920](/images/results/debug-console-errors-access-dom/1b081be-displayed-errors.png)

3. コンソールログを開きます。

![401](/images/results/debug-console-errors-access-dom/154a7ab-vewconsolelog.png)

4. コンソールログを表示して、特定のエラーに関する洞察を得ます。

![1161](/images/results/debug-console-errors-access-dom/8c191a6-consoleerrors.png)

> 📘 注意:
>
> テストログは、Chrome & Edge Chromiumブラウザでの実行にのみ表示されます。

## 失敗ステップのDOMを確認してデバッグする

ステップが失敗すると、Testimは完全なDOMスナップショットを保存するため、後でデバッグできます。

:fa-arrow-right: **エラーのDOMスナップショットを表示するには:**

1. テスト実行または実行に移動します。
2. 失敗した特定のテストステップでエラーメッセージを確認します。

![270](/images/results/debug-console-errors-access-dom/1400173-steperror.png)

3. DOMスナップショットを表示するには、ステップにカーソルを合わせて**スクリーンショットを表示**ボタンをクリックするか、ステップのプロパティパネルで**DOMを表示**リンクをクリックします。

![281](/images/results/debug-console-errors-access-dom/a6ac0aa-viewdom1.png)

![324](/images/results/debug-console-errors-access-dom/986c536-viewdom2.png)

> 📘 注意:
>
> * DOMは、Chrome & Edge Chromiumブラウザの実行にのみ表示されます。
> * DOMは失敗したステップにのみ表示されます。

## ステップパラメータのデバッグ

プロパティパネルでは、各ステップで実行中に使用されたすべてのパラメータを確認できます。これらのパラメータは、実行中の各ステップで何が起こったかを理解するのに役立ちます。

* **受信パラメータ**: このステップで使用できるすべての受信パラメータ。パラメータは、前のステップのエクスポート、スイート内の前のテストから実行されたグローバルエクスポート、データ駆動パラメータ、グループ/ステップパラメータなどから取得できます。
* **ローカルエクスポート**: このステップで作成されたエクスポートパラメータ。
* **グローバルエクスポート**: このステップで作成されたグローバルエクスポートパラメータ。

![1414](/images/results/debug-console-errors-access-dom/e5d13c5-step_params.gif)
