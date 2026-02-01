---
title: 'テストデータ（再利用）'
description: 'Test Data ファイルを使って複数テスト間でデータを再利用し、スケジューラやテスト設定から上書き・割り当てを行う方法を説明します。'
category: '高度な編集'
order: 5066
updated: '2025-09-22'
sourceUrl: 'https://help.testim.io/docs/reusable-test-data'
keywords:
  - テストデータ
  - 再利用可能データ
  - Test Data
  - CSV
  - JSON
  - Excel
  - スケジューラ
  - Override test data
  - Test Data Library
  - 特殊ステップ
---

テストデータを再利用し、テスト実行ごとに使い回す方法を説明します。

Testim のテストデータファイルは、複数テストで使うデータを一元管理する仕組みです。毎回テストに同じ値を埋め込む代わりに、**Resources > Test Data** に1度登録しておけば、必要なときに参照できます。実行時に値を上書きすることも可能で、テストの保守性・可読性・更新効率が向上します。

再利用可能なテストデータが有効な場面:

* 同一テストを複数イテレーションで回す
* ユーザーや商品などを変えて同一テストを実行する
* チームで共通のテストデータソースを共有したい

![再利用可能なテストデータのスクリーンショット](/images/special-steps/reusable-test-data/5ad1c9f-Test_Data_Files.jpg)
*** End Patch!*\

### Testim での使い方

テストデータファイルの利用方法は3つあります。

1. テストデータファイルをアップロード

CSV/JSON/Excel 形式のローカルファイルをアップロードできます。サンプルもダウンロード可能です。アップロードしたファイルは Test Data Library に一覧表示され、テストから参照できます。

2. スケジューラで既定のテストデータを上書き

[scheduler](https://dash.readme.com/project/testim/v2.0/docs/scheduler) では **Override test data** を使って既定のテストデータをファイルで置き換えられます。上書きに加えて新しい値の追加も可能です。

3. テストにテストデータファイルを割り当て

既存の埋め込みテストデータをファイルに変換して割り当てるか、ライブラリのファイルを割り当てます。優先度を上げて、実行レベルのデータより先に使用させることも可能です。

## テストデータファイルをアップロード

:fa-arrow-right: **手順:**

1. Testim 画面で **Resources > Test Data** を開きます。
2. **Upload Test Data** を選択します。
3. 表示されたダイアログで名前を入力し、テストデータファイルをアップロードして **OK** をクリックします。

アップロードが完了すると **Test Data** タブに一覧表示されます。

## テストデータファイルの管理

:fa-arrow-right: **行を右クリックして次を利用できます:**

* **Edit** – 既存データを別ファイルで置き換え
* **Download csv file** – 現在の行をCSVとしてエクスポート
* **Delete** – **Deleted** セクションにアーカイブ（復元可能）

## 削除したテストデータの復元

削除から30日以内であれば復元できます。

:fa-arrow-right: **手順:**

1. **Resources > Test Data** を開きます。
2. **Deleted** タブを選択します。
3. 復元したいテストデータ行を右クリックし、**Restore** を選択します。

復元後、**Test Data** タブから利用できます。

## スケジューラで既定のテストデータを上書き

[scheduler](https://dash.readme.com/project/testim/v2.0/docs/scheduler) 作成/編集時に **Override test data** を有効化して、既定のデータを置換/追加できます。

:fa-arrow-right: **上書き手順:**

1. Testim 画面で **Runs > Scheduled Runs** を開きます。
2. **New scheduler** を選択します。
3. **Override test data** をオンに切り替えます。

> 📘
>
> ここでの上書きは既定のテストデータのみ対象で、テスト内で定義した上書き値には影響しません。

4. ドロップダウンからテストデータファイルを選択するか、**Upload data file** で新しいファイルをアップロードします。CSV / JSON / Excel 形式に対応しており、最大サイズは 2 MB です。
5. **Create** を選択します。

既定のテストデータは選択したファイルの値に置き換わります。

![再利用可能なテストデータのスクリーンショット](/images/special-steps/reusable-test-data/79b7927-uploading_file.jpg)

## テストへテストデータファイルを割り当て

既存データをファイルへ変換するか、ライブラリから再利用ファイルを選んで割り当てます。新規アップロードも可能です。テスト単位で優先度の設定もできます。

> 📘 優先度
>
> 優先度を付けると、実行レベルで設定したデータより先に適用されます。重複するキーは上書きではなくマージされます。

![再利用可能なテストデータのスクリーンショット](/images/special-steps/reusable-test-data/9cbb820-Assign_data_file.jpg)

### 既存のテストデータをファイルに変換

:fa-arrow-right: **手順:**

1. Testim で対象テストを開き、**Editor** 画面を表示します。
2. **Show step properties** アイコンをクリックし、**Test Configuration Properties** パネルを開きます。
3. **Editor > Test Data** を選択します。
4. テストデータプレビューの上にある **Convert to file** をクリックします。
5. 入力フィールドに新しいテストデータファイル名を入力し、**Convert** をクリックします。

> 📘
>
> 既存の埋め込みデータは再利用可能なファイルに変換され、ライブラリへ保存されます（以後、他テストでも利用可）。

6. テストデータファイルの優先度を上げたい場合は、**Prioritize test data** チェックボックスをオンにします。

変換されたテストデータファイルはこのテストに割り当てられ、Test Data Library に追加されます。次回のテスト実行から新しい値が使用されます。

### テストデータファイルを再利用

:fa-arrow-right: **手順:**

1. Testim で対象テストを開き、**Editor** 画面を表示します。
2. **Show step properties** アイコンをクリックして **Test Configuration Properties** パネルを開きます。
3. **Editor > Reusable File** を選択します。
4. ドロップダウンからテストデータファイルを選択するか、**Upload data file** を選択して新しいファイルをアップロードします。
5. テストデータファイルを優先的に使用したい場合は、**Prioritize test data** チェックボックスをオンにします。

選択したテストデータファイルがこのテストに割り当てられ、次回のテスト実行時にその値が使用されます。

### CLI

CLI 実行時に `--test-data-set` を指定して、任意のテストデータセットを適用できます。
