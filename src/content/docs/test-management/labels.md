---
title: 'ラベル'
description: 'テストにラベルを追加して整理し、フィルタリングやテストプランの作成に活用する方法について説明します。'
category: 'テスト管理'
order: 8
updated: '2025-11-11'
keywords:
  - testim
  - labels
  - test-management
  - ラベル
  - テスト整理
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

![](/images/test-management/labels/96cd0e5-edit-labels.png "edit-labels.png")

**テストを右クリック**して、**Edit Labels**オプションを選択することもできます。

![](/images/test-management/labels/ed79e05-editlabelsrightclick.png "editlabelsrightclick.png")

3. テストに適用する既存のラベルを選択または選択解除します。

![](/images/test-management/labels/64cba32-selectdeselectlabels.png "selectdeselectlabels.png")

4. 新しいラベルを追加するには、新しいラベルを入力し、**Create New**リンクをクリックしてから、**Apply**をクリックします。

![](/images/test-management/labels/18b0282-newlabel.png "newlabel.png")

> 🚧
>
> ラベル名にスペースを含めることはできません。

## ラベルでテストをフィルタリング

ラベルを使用して、選択したラベルを含むテストをテストリスト内でフィルタリングできます。

:fa-arrow-right: **ラベルでテストリストをフィルタリングするには:**

1. **Test List > Tests**に移動します。
2. アクションメニューの**Advanced Filters**ボタンをクリックします。

![](/images/test-management/labels/dbf0508-advancedfilters.png "advancedfilters.png")

**Advanced Filters**パネルが表示されます。

![](/images/test-management/labels/e740633-advancedfilterspanel.png "advancedfilterspanel.png")

3. パネルの**Label**セクションで、フィルターのラベルを選択/選択解除し、**Apply**をクリックします。

![](/images/test-management/labels/95aaa61-selectlabels.png "selectlabels.png")

テストリストには、選択したラベルを含むテストのみが表示されます。

![](/images/test-management/labels/12ab199-filteredlist.png "filteredlist.png")

## CLIベースの実行でのラベルの使用

CLIを実行する際、--labelパラメーターを使用して実行するラベルを選択できます:

```shell
testim --label "<YOUR LABEL>" --token "<YOUR ACCESS TOKEN>" --project "<YOUR PROJECT ID>" --grid "<Your grid name>" --report-file test-results/testim-tests-report.xml
```
