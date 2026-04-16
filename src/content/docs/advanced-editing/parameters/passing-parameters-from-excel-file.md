---
title: Excel ファイルからパラメーターを渡す
description: Excel/CSV のデータをテストにパラメーターとして渡す方法
category: 高度な編集
order: 5045
updated: '2025-09-22'
sourceUrl: 'https://docs.tricentis.com/testim/content/advanced-editing/parameters/passing-parameters-from-excel-file.htm'
keywords:
  - Testim
  - Excel
  - CSV
  - データ駆動テスト
  - パラメーター
  - 外部データ
  - インポート
---

[データ駆動テスト](/docs/advanced-editing/data-driven-testing)の一環として、Excel ファイルからパラメーターを渡す方法は 2 つあります。

- **Testim Visual Editor を使った Excel/CSV ファイルのアップロード** - 複数回の実行で使用するデータセットが Excel データに含まれている場合、エディターからテストを実行すると最初のデータセットのみが実行されます。Testim CLI、スケジューラ、またはローカルスイート実行からテストを実行した場合のみ、テストは順に複数回、それぞれ異なるデータセットで実行されます。また、この方法ではファイルが変更されてもアップロードされたデータは更新されません。更新のたびに Excel ファイルを再度アップロードする必要があります。詳細な手順については [CSV/Excel ファイルのアップロードでテストデータを追加する](/docs/advanced-editing/data-driven-testing/configuring-a-data-driven-test-from-the-visual-editor#csvexcel-ファイルをアップロードしてテストデータを追加) を参照してください。

<!-- -->

- **設定ファイル経由でパラメーターを渡す** - Excel ファイルのテストデータを設定ファイル経由で 1 つまたは複数のテストに渡し、CLI からテストを実行する際に設定ファイルを使用するフラグを追加します。Excel データに複数回の実行で使用する複数データセットが含まれている場合、テストは順に複数回、それぞれ異なるデータセットで実行されます。さらに、ファイルは実行のたびに自動的にパースされるため、Excel ファイルを更新すれば、次回の実行で更新後のデータが使用されます。詳細な手順については [外部ソースのデータを使ったデータ駆動テスト](/docs/advanced-editing/data-driven-testing/configuring-data-driven-tests-using-data-from-an-external-source) を参照してください。
