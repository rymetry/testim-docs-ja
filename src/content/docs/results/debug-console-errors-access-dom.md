---
title: コンソールエラーのデバッグと DOM アクセス
description: Chrome 開発者ツールを使用したデバッグ、コンソールエラーとネットワークエラーの確認、失敗ステップの DOM スナップショット表示について説明します。
category: テスト結果
order: 7008
updated: '2025-09-22'
sourceUrl: 'https://help.testim.io/docs/debug-console-errors-access-dom'
keywords:
  - コンソールエラー
  - ネットワークエラー
  - DOM スナップショット
  - デバッグ
  - Chrome DevTools
  - テストログ
---

## Chrome コンソールを使用したデバッグ

console.log（myVar）を使用するか、Chrome DevTools デバッガーを使用して、テスト実行中のエラーを確認できます（コードにデバッガーを追加）。

## コンソールエラーとネットワークのデバッグ

Testim はコンソールエラーとネットワークエラーを自動的に記録します。

**テスト実行でエラーを表示するには:**

1. テスト実行または実行に移動します。
2. テスト上部のエラーメッセージと、失敗した特定のテストステップを確認します。

![テスト結果画面のエラー表示](/images/results/debug-console-errors-access-dom/1b081be-displayed-errors.png)

3. コンソールログを開きます。

![ブラウザコンソールログの表示](/images/results/debug-console-errors-access-dom/154a7ab-vewconsolelog.png)

4. コンソールログを表示して、特定のエラーに関する洞察を得ます。

![コンソールエラー一覧の例](/images/results/debug-console-errors-access-dom/8c191a6-consoleerrors.png)

:::warning{title="注意"}
テストログは、Chrome & Edge Chromium ブラウザでの実行にのみ表示されます。
:::

## 失敗ステップの DOM を確認してデバッグする

ステップが失敗すると、Testim は完全な DOM スナップショットを保存するため、後でデバッグできます。

**エラーの DOM スナップショットを表示するには:**

1. テスト実行または実行に移動します。
2. 失敗した特定のテストステップでエラーメッセージを確認します。

![失敗ステップのエラーメッセージ](/images/results/debug-console-errors-access-dom/1400173-steperror.png)

3. DOM スナップショットを表示するには、ステップにカーソルを合わせて**スクリーンショットを表示**ボタンをクリックするか、ステップのプロパティパネルで**DOM を表示**リンクをクリックします。

![DOM スナップショット表示ボタン](/images/results/debug-console-errors-access-dom/a6ac0aa-viewdom1.png)

![DOM スナップショット表示画面](/images/results/debug-console-errors-access-dom/986c536-viewdom2.png)

:::warning{title="注意"}

- DOM は、Chrome & Edge Chromium ブラウザの実行にのみ表示されます。
- DOM は失敗したステップにのみ表示されます。
  :::

## ステップパラメーターのデバッグ

プロパティパネルでは、各ステップで実行中に使用されたすべてのパラメーターを確認できます。これらのパラメーターは、実行中の各ステップで何が起こったかを理解するのに役立ちます。

- **受信パラメーター**: このステップで使用できるすべての受信パラメーター。パラメーターは、前のステップのエクスポート、スイート内の前のテストから実行されたグローバルエクスポート、データ駆動パラメーター、グループ/ステップパラメーターなどから取得できます。
- **ローカルエクスポート**: このステップで作成されたエクスポートパラメーター。
- **グローバルエクスポート**: このステップで作成されたグローバルエクスポートパラメーター。

![ステップパラメーターの詳細表示](/images/results/debug-console-errors-access-dom/e5d13c5-step_params.gif)
