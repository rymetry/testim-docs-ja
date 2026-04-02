---
title: ビジュアル検証テスト結果
description: Applitools 統合プロジェクトでのビジュアル検証テスト結果の確認方法について説明します。
category: テスト結果
order: 7007
updated: '2025-09-22'
sourceUrl: 'https://docs.tricentis.com/testim/content/results/test-results/visual-validation-test-results.htm'
keywords:
  - ビジュアル検証
  - Applitools
  - スクリーンショット比較
  - 並列表示
  - 追加環境
  - 実行設定
---

プロジェクトが Applitools と統合されている場合、テスト結果にはビジュアル検証設定に固有の情報も含まれます。

## テスト結果全体

Applitools と統合されているプロジェクトでは、すべてのテスト実行で**実行設定**セクションが利用可能になります。**ビジュアル検証パラメーターを表示するには:**

1. **実行 > テスト実行**に移動し、テスト実行を開きます。
2. テスト実行の**実行設定**セクションで、**プラス記号**をクリックして、テストが実行されたビジュアル検証パラメーター設定を表示します。詳細については、[ビジュアル検証パラメーター](/docs/advanced-editing/validations/pixel-validation-and-pixel-wait-for#ビジュアル検証パラメーター)を参照してください。

![ビジュアル検証の実行設定セクション](/images/results/visual-validation-test-results/c6419a9-run-config.jpg)

## ステップ結果 – 並列表示

複数の環境で実行されたビジュアル検証ステップで、「並列表示」を表示する場合、ステップが実行された**ステップ設定**情報が表示されます。テスト設定の詳細については、[テスト設定の設定](/docs/recording-tests/how-to-record-a-test#ステップ-3-テスト構成を設定する)を参照してください。

![並列表示でのステップ設定情報](/images/results/visual-validation-test-results/343cfce-6e55497-Testim_574a.png)

テストに複数の環境で実行されたビジュアル検証ステップが含まれている場合、結果に表示されるこれらのステップのスクリーンショットは、メイン/初期環境での実行からのものであり、画面下部に通知が表示されます。**追加環境での実行からのスクリーンショットを表示するには:**

1. テスト結果の**並列表示**ビューに移動します。
2. 通知をクリックして Applitools を開き、追加環境での実行からのスクリーンショットを表示します。詳細については、[ビジュアル検証](/docs/advanced-editing/validations/pixel-validation-and-pixel-wait-for)を参照してください。

![Applitools へのリンク通知](/images/results/visual-validation-test-results/690b0f7-applitoolslink.png)
