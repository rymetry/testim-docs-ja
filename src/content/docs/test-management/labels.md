---
title: ラベル
description: テストにラベルを追加して整理し、フィルタリングやテストプランの作成に活用する方法について説明します。
category: テスト管理
order: 9008
updated: '2025-09-15'
sourceUrl: 'https://help.testim.io/docs/labels'
keywords:
  - テストラベル
  - テスト整理
  - テスト分類
  - ラベルフィルター
  - ラベル管理
  - サニティテスト
  - ナイトリーテスト
  - モニタリングテスト
---

ラベルは、特定のスイートやテストプランに配置することなく、テストを1つ以上の特性に関連付けるために使用されます。テストには複数のラベルを設定できます。たとえば、各コード変更時に実行されるテストにタグ付けする「sanity」ラベル、各デプロイ後に統合/ステージング環境で実行されるテストにタグ付けする「nightly」ラベル、本番アプリケーションが正常に動作していることを確認するために15分ごとに実行されるテストにタグ付けする「monitor」ラベルなどがあります。

ラベルは、主に2つの目的で役立ちます:

* **ラベルでフィルタリング** - テストリストを整理し、ラベルでリストをフィルタリングして簡単に見つけることができます。
* **ラベルでテストスイートを作成** – テストスイートを作成する際に、ラベルを使用して関連するテストを迅速に見つけることができます。
* **ラベルでテストプランを作成** – テストプランを設定する際に、テストプランに含める特定のラベルを定義できます。

## テストへのラベルの追加/削除

テストリスト内の各テストに、ラベルを簡単に追加または削除できます。

:fa-arrow-right: **テストからラベルを追加/削除するには:**

1. テストリスト画面で、テスト名をクリックして選択します。
2. **Edit Labels**ボタンをクリックします。

![テストプロパティでEdit Labelsボタンを選択する画面](/images/test-management/labels/96cd0e5-edit-labels.png)

**テストを右クリック**して、**Edit Labels**オプションを選択することもできます。

![テストを右クリックしてEdit Labelsオプションを開くコンテキストメニュー](/images/test-management/labels/ed79e05-editlabelsrightclick.png)

3. テストに適用する既存のラベルを選択または選択解除します。

![既存ラベルを選択または選択解除してテストに適用するダイアログ](/images/test-management/labels/64cba32-selectdeselectlabels.png)

4. 新しいラベルを追加するには、新しいラベルを入力し、**Create New**リンクをクリックしてから、**Apply**をクリックします。

![新しいラベル名を入力してCreate Newで作成する画面](/images/test-management/labels/18b0282-newlabel.png)

> 🚧
>
> ラベル名にスペースを含めることはできません。

## ラベルでテストをフィルタリング

ラベルを使用して、選択したラベルを含むテストをテストリスト内でフィルタリングできます。

:fa-arrow-right: **ラベルでテストリストをフィルタリングするには:**

1. **Test List > Tests**に移動します。
2. アクションメニューの**Advanced Filters**ボタンをクリックします。

![Test List画面のアクションメニューからAdvanced Filtersを開くボタン](/images/test-management/labels/dbf0508-advancedfilters.png)

**Advanced Filters**パネルが表示されます。

![ラベルなどの条件を設定できるAdvanced Filtersパネル](/images/test-management/labels/e740633-advancedfilterspanel.png)

3. パネルの**Label**セクションで、フィルターのラベルを選択/選択解除し、**Apply**をクリックします。

![Advanced Filtersパネル内でフィルターに使用するラベルを選択する画面](/images/test-management/labels/95aaa61-selectlabels.png)

テストリストには、選択したラベルを含むテストのみが表示されます。

![選択したラベルでフィルタリングされたテストリストの結果](/images/test-management/labels/12ab199-filteredlist.png)

## CLIベースの実行でのラベルの使用

CLIを実行する際、--labelパラメーターを使用して実行するラベルを選択できます:

```shell
testim --label "<YOUR LABEL>" --token "<YOUR ACCESS TOKEN>" --project "<YOUR PROJECT ID>" --grid "<Your grid name>" --report-file test-results/testim-tests-report.xml
```
