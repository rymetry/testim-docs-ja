---
title: Excel ファイルからパラメーターを渡す
description: Excel/CSV のデータをテストにパラメーターとして渡す方法
category: 高度な編集
order: 5045
updated: '2025-09-22'
sourceUrl: 'https://help.testim.io/docs/passing-parameters-from-excel-file'
keywords:
  - Testim
  - Excel
  - CSV
  - データ駆動テスト
  - パラメーター
  - 外部データ
  - インポート
---

Excel/CSV のデータをテストにパラメーターとして渡す方法

[データ駆動テスト](/docs/data-driven-testing)の一環として、Excel ファイルからパラメーターを渡す方法は 2 つあります。

* Testim Visual Editor から Excel/CSV をアップロードする — 複数データセットが含まれていても、エディターからの実行では最初の 1 件のみ実行されます。複数回実行されるのは CLI／スケジューラ／ローカルスイート実行時です。また、この方法ではファイル変更時に自動更新されず、都度アップロードが必要です。手順は「[CSV/Excel のアップロードでテストデータを追加](/docs/configuring-a-data-driven-test-from-the-visual-editor#csvexcelファイルをアップロードしてテストデータを追加)」を参照してください。

* 設定ファイル経由でパラメーターを渡す — Excel のデータを設定ファイル経由で 1 つまたは複数テストへ受け渡し、CLI 実行時に設定ファイルを使用するフラグを付与します。複数データセットがある場合、順番に複数回実行されます。ファイルは毎回自動でパースされるため、Excel を更新すれば次回実行で反映されます。手順は「[外部ソースのデータを使ったデータ駆動テスト](/docs/configuring-data-driven-tests-using-data-from-an-external-source)」。
