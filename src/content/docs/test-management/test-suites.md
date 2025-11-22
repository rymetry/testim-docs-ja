---
title: 'テストスイート'
description: 'テストをテストスイートに整理し、実行順序を管理する方法について説明します。'
category: 'テスト管理'
order: 14
updated: '2025-11-11'
keywords:
  - testim
  - test-suites
  - test-management
  - テストスイート
  - 実行順序
---

テストスイートを使用すると、テスト間の順序を柔軟に管理できます。テストをスイートにグループ化することで、異なるテストグループを作成できます。この機能により、スイートに含めるテストの選択と、実行順序の決定が簡単になります。テストスイートは、Webとモバイルの両方でサポートされています。

## 新しいテストスイートの作成

:fa-arrow-right: **新しいテストスイートを作成するには:**

1. **Test List > Suites**に移動します。
2. **New Suite**ボタンをクリックするか、現在テストスイートがない場合は**Create Suite**をクリックします。

![](/images/test-management/test-suites/0bfe227-newtestsuite.png)

3. テストスイートに**Name**と**Description**を付けます。

![](/images/test-management/test-suites/866a2f2-geninfo.png)

4. 名前またはラベルでテストを検索し、スイートに含める1つ以上のテストを選択します。

![](/images/test-management/test-suites/85b039b-tests.png)

5. **OK**ボタンをクリックして、テストスイートを作成します。新しいスイートが作成され、スイートライブラリに表示されます。

![](/images/test-management/test-suites/b38b549-suitecreated.png)

### ラベルでテストスイートにテストを追加

特定の[ラベル](/docs/test-management/labels)を持つテストをテストスイートに追加できます。

![](/images/test-management/test-suites/9085a97-testlabels.png)

:fa-arrow-right: **ラベルでテストスイートにテストを追加するには:**

1. テストスイートにテストを追加する際、ラベルを名前で検索します。

![](/images/test-management/test-suites/37cd081-label.png)

2. Testimは、そのラベルを持つテストのリストを表示します。そのラベルを持つリストから1つ以上のテストを選択し、テストを保存します。

![](/images/test-management/test-suites/b982b26-labelfiltered.png)

## 既存のテストスイートの編集

:fa-arrow-right: **既存のテストスイートを編集するには:**

1. 編集するテストスイートを選択し、アクションパネルの**Edit**ボタンをクリックします。

![](/images/test-management/test-suites/17f71bf-editsuite.png)

2. スイート情報を更新し、スイートからテストを追加/削除して、**OK**ボタンをクリックします。

![](/images/test-management/test-suites/029def2-editsuite2.png)

## テストスイート内のテストの並べ替え

デフォルトでは、テストは選択された順序に基づいてスイートに並べられます。スイートが作成された後、スイート内のテストの順序を並べ替えて変更できます。

:fa-arrow-right: **テストスイート内のテストを並べ替えるには:**

1. 並べ替えるテストスイートをダブルクリックします。

![](/images/test-management/test-suites/425cccb-doubleclick.png)

2. テストを選択し、**Move Up**および**Move Down**ボタンを使用して、リスト内のテストの順序を変更します。

![](/images/test-management/test-suites/de91845-reorder.png)

## テストスイートの実行

#### CLIを使用

テストスイートを実行するには、次のようにCLIコマンドでテストスイート名を指定する必要があります:

```shell
--suite "Tutorial Demo"
```

[CLI](/docs/cli-api/cli-settings)の実行の詳細については、こちらをご覧ください。

#### スケジューラーを使用

Testimスケジューラーからスイートを実行できます。\
方法については、[こちら](https://help.testim.io/docs/scheduler)をご覧ください。

> 📘 注意:
>
> コマンドでparallelを使用すると、実行順序は保証されなくなります。
