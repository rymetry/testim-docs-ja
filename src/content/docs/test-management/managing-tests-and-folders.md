---
title: 'テストとフォルダーの管理'
description: 'フォルダーとラベルを使用してテストを整理し、テストのクローン作成やベース URL の変更を行います'
category: 'テスト管理'
order: 2
updated: '2025-11-11'
keywords:
  - testim
  - managing-tests-and-folders
  - test-management
  - テスト管理
  - フォルダー
  - ラベル
---

フォルダーに保存したりラベルを使用したりすることで、テストを整理できます。このガイドでは、テストのクローン作成とテストのベース URL の変更についても説明します。

## 新しいフォルダーを作成する

:fa-arrow-right: **新しいフォルダーを作成するには:**

1. Test Library 画面で、**+** ボタンをクリックし、**New Folder** を選択します。

![](/images/test-management/managing-tests-and-folders/43e2f2e-new-folder.png "new-folder.png")

2. フォルダーに **New Name**（新しい名前）を付けて、**OK** ボタンをクリックします。

![](/images/test-management/managing-tests-and-folders/3b2a89b-folder-name.png)

新しいフォルダーがテストライブラリに追加されます。

![](/images/test-management/managing-tests-and-folders/704b426-folder-added.png "folder-added.png")

> 📘
>
> 新しいフォルダーの名前は、このプロジェクトに既に存在する他のフォルダーと同じ名前であってはなりません。

## テスト/フォルダーをフォルダーに移動する

デフォルトでは、新しいテストはルートフォルダーに配置されます。テストとフォルダーを他のフォルダーに移動できます。

:fa-arrow-right: **アイテムをフォルダーに移動するには:**

1. テストまたはフォルダー名をクリックして選択します。
2. **Move to Folder** ボタンをクリックします。

![](/images/test-management/managing-tests-and-folders/b9c5a31-move-to-folder.png "move-to-folder.png")

テストを右クリックして、**Move to Folder** オプションを選択することもできます。

![](/images/test-management/managing-tests-and-folders/fcdaa0c-move-to-folder-rightclick.png "move-to-folder-rightclick.png")

> 📘
>
> * CTRL/CMD キーを押しながら、目的のテストとフォルダーのそれぞれをクリックすることで、複数のテストやフォルダーを選択できます。*一連のアイテムを選択するには、シーケンスの最初のアイテムを選択し、Tab キーを押しながらシーケンスの最後のアイテムを右クリックします。* キーボードで CTRL/CMD キー + A を押すことで、すべてのテストまたはフォルダーを選択することもできます。

3. **Move To** ウィンドウが開きます。テストを移動したいフォルダーを選択し、**Select** ボタンをクリックします。

![](/images/test-management/managing-tests-and-folders/290064c-select-folder.png)

> 📘
>
> ターゲットフォルダーがまだ存在しない場合は、**New Folder** アイコン（ウィンドウの左下）をクリックし、新しいフォルダーの名前を入力して、OK をクリックすることで、今すぐ作成できます。

## テストにラベルを適用する

既存のラベルをテストに適用または削除できます。また、テストに適用する新しいラベルを作成することもできます。

:fa-arrow-right: **ラベルを適用/削除するには:**

1. テスト名をクリックして選択します。
2. **Edit Labels** ボタンをクリックします。

![](/images/test-management/managing-tests-and-folders/ec0956e-edit-labels.png "edit-labels.png")

テストを右クリックして、**Edit Labels** オプションを選択することもできます。

![](/images/test-management/managing-tests-and-folders/0a03342-editlabelsrightclick.png "editlabelsrightclick.png")

3. テストに適用する既存のラベルを選択または選択解除します。

![](/images/test-management/managing-tests-and-folders/0bb369c-selectdeselectlabels.png "selectdeselectlabels.png")

4. 新しいラベルを追加するには、新しいラベルを入力し、**Create New** リンクをクリックしてから、**Apply** をクリックします。

![](/images/test-management/managing-tests-and-folders/6737516-newlabel.png "newlabel.png")

> 📘
>
> * CTRL/CMD キーを押しながら、目的のテストのそれぞれをクリックすることで、複数のテストを選択できます。* テストライブラリにフォルダーがない場合は、キーボードで CTRL/CMD キー + A を押すことで、すべてのテストを選択することもできます。

> 🚧
>
> ラベル名にはスペースを含めないでください。

成功メッセージが表示されます。

![](/images/test-management/managing-tests-and-folders/0f7531e-Testim_051.png)

## テストのベース URL を変更する

特定のテストまたは複数のテストに対して、テスト用に構成されたデフォルトのベース URL とは異なるベース URL を指定できます。

:fa-arrow-right: **ベース URL を変更するには:**

1. テスト名をクリックして選択します。CTL/cmd ボタンを使用して複数のテストを選択できます。
2. **Change Base URL** ボタンをクリックします。

![](/images/test-management/managing-tests-and-folders/23df7a9-2023-11-05_13-11-49.png)

3. 目的のベース URL を入力し、**Change** をクリックします。\
   ![](/images/test-management/managing-tests-and-folders/9f47ff5-2023-11-05_13-26-59.png)

## テストのクローン作成

同じプロジェクト内でテストをクローンしたり、現在選択されている Company にないプロジェクトであっても、メンバーである別のプロジェクトにクローンしたりできます。詳細については、[Cloning tests](/docs/test-management/cloning-tests) を参照してください。

## テスト/フォルダーの名前を変更する

Test Library 画面でテストとフォルダーの名前を変更できます。

:fa-arrow-right: **テストまたはフォルダーの名前を変更するには:**

1. テストまたはフォルダーを右クリックします。
2. **Rename** をクリックします。

![](/images/test-management/managing-tests-and-folders/0b4c5dd-rename.png)

**Edit Name** ウィンドウが開きます。

![](/images/test-management/managing-tests-and-folders/0af2d80-Testim_054_r.png)

3. **New name** フィールドに、ファイルまたはフォルダーの新しい名前を入力します。
4. **OK** をクリックします。\
   名前が変更されたファイルまたはフォルダーがテストライブラリに表示されます。

## テスト/フォルダーを削除する

Test Library 画面から、テストまたはフォルダー、あるいは複数のテストまたはフォルダーを削除できます。

:fa-arrow-right: **テストまたはフォルダーを削除するには:**

1. テストまたはフォルダー名をクリックして選択します。
2. **Delete** アイコンをクリックします

![](/images/test-management/managing-tests-and-folders/fd32693-delete-test.png "delete-test.png")

テストまたはフォルダー名を右クリックして、右クリックメニューから **Delete** を選択することもできます。

![](/images/test-management/managing-tests-and-folders/f8f3e24-delete-right-click.png "delete-right-click.png")

> 📘
>
> * ctrl/cmd キーを押しながら、目的のテストのそれぞれをクリックすることで、複数のテストを選択できます。* キーボードで ctrl/cmd キー + A を押すことで、すべてのテストとフォルダーを選択することもできます。

**Delete** 確認ウィンドウが開きます。

![](/images/test-management/managing-tests-and-folders/f254b04-delete-confirmation.png)

3. **Delete** ボタンをクリックします。

ファイルやフォルダーが削除されます。
