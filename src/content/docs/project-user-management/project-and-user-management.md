---
title: 'プロジェクトとユーザー管理(企業レベル)'
description: '企業(アカウント)レベルでのプロジェクトとユーザーの構造、チームメイトの追加と削除、企業オーナーの管理方法について説明します。'
category: 'project-user-management'
order: 2
updated: '2025-11-11'
keywords:
  - testim
  - 企業管理
  - プロジェクト構造
  - チームメイト管理
  - 企業オーナー
---

組織のプロジェクトとユーザー構造を理解する

Testimは組織構造を提供しており、**Company**(「アカウント」のようなもの)には **Projects**(各プロジェクトは「ワークスペース」のようなもの)のリストと **Teammates** のリストが含まれます。

- **Company**(アカウント)は **Pro**(有料版)または **Trial**(無料/トライアル版)になります。
- **Teammate** は複数の **Companies** のメンバーになれます。
- **Project** は以下のいずれかのタイプになります:
  - Webプロジェクト
  - モバイルプロジェクト
  - Salesforceプロジェクト

## プロジェクトライブラリの表示

:fa-arrow-right: **プロジェクトライブラリを表示するには:**

1. ユーザーアバターをクリックします。
2. **Team** ハイパーリンクをクリックします。

![](/images/project-user-management/project-and-user-management/4129216-projects.png "projects.png")

> 📘
>
> リストの最後のプロジェクトは使用例プロジェクトで、読み取り専用のプロジェクトです。このプロジェクトは、新しいユーザーがTestimの使用方法を学ぶためにドキュメント全体で使用されています。

## 企業チームメイトの表示

:fa-arrow-right: **企業チームメイトを表示するには:**

1. ユーザーアバターをクリックします。
2. **Team** ハイパーリンクをクリックします。

![](/images/project-user-management/project-and-user-management/cfcf882-5543298-team.png "5543298-team.png")

### 企業チームメイトの追加

誰でも他の企業ユーザーを招待できますが、アクセス権のあるプロジェクトへのアクセスのみを付与できます。

:fa-arrow-right: **ユーザーを追加するには:**

1. Team画面で、**+ Teammate** をクリックします。
2. フィールドにユーザーのメールアドレスを入力します。複数のメールアドレスを入力できます。

![](/images/project-user-management/project-and-user-management/b9302f5-invite_teammates.png)

3. これらのユーザーがアクセスできるプロジェクトを選択するには、プロジェクト名の横にある + ボタンをクリックします。
4. **Invite** をクリックします。\
   ユーザーは、アカウントを有効化するための招待メールを受け取ります。

### 企業チームメイトの削除

:fa-arrow-right: **企業チームメイトを削除するには:**

1. 削除したいチームメイトを1人以上選択します。複数のチームメイトを選択するには CTRL/CMD + クリックを使用します。
2. **Delete User** ボタンをクリックします。または、選択したチームメイトを右クリックして「Delete users」を選択することもできます。

![](/images/project-user-management/project-and-user-management/3af9d4d-deletecompanyusers.png "deletecompanyusers.png")

![](/images/project-user-management/project-and-user-management/0724162-4a1895b-rightclickdelete.png "4a1895b-rightclickdelete.png")

選択したチームメイトが企業から削除されます。

### 読み取り専用ユーザー

読み取り専用ユーザーを追加したい場合は、Testimセールス担当者にお問い合わせください。\
このようなユーザーは、UIでのテスト保存のみがブロックされることに注意してください。

### 企業オーナーとプロジェクトオーナーの変更/追加

企業オーナーは、他のユーザーを企業オーナーとして割り当て/削除できます。企業には複数のオーナーを設定できます。現在の企業オーナーはオーナーシップを削除することもできますが、少なくとも1人の企業オーナーが必要であるため、最後のオーナーはオーナーとして削除したり、削除したりすることはできません。

:fa-arrow-right: **ユーザーを企業オーナーとして割り当てるには:**

1. 企業オーナーとしてログインしていることを確認します。
2. **Team** 画面で、企業オーナーではないユーザーを右クリックし、**Add company owner** を選択します。

![](/images/project-user-management/project-and-user-management/3151c91-c0f396c-addcompanyowner.png "c0f396c-addcompanyowner.png")

### 企業オーナーの削除

:fa-arrow-right: **ユーザーを企業オーナーから削除するには:**

1. 企業オーナーとしてログインしていることを確認します。
2. **Team** 画面で、企業オーナーのユーザーを右クリックし、**Remove company owner** を選択します。

![](/images/project-user-management/project-and-user-management/397901e-ef3c7bd-remove.png "ef3c7bd-remove.png")

## 企業とプロジェクト間のナビゲーション

**企業間のナビゲーション**\
複数の企業のメンバーである場合、企業間を移動できます。

:fa-arrow-right:**企業間を移動するには**

1. ユーザーアバター(右上隅)をクリックします。
2. **Company** セクションの下にリストされている希望の企業を選択します。

   ![](/images/project-user-management/project-and-user-management/8a4e71c-companyselection.png)

**プロジェクト間のナビゲーション**\
いつでも別のプロジェクトに切り替えることができます。

:fa-arrow-right: **アクティブなプロジェクトを切り替えるには:**

1. ヘッダーバー(左上)のプロジェクトドロップダウンメニューをクリックします。\
   以下のカテゴリに整理されたプロジェクトのリストが表示されます:

   1. Webプロジェクト - Testim Webプロジェクト
   2. モバイルプロジェクト - Testim モバイルプロジェクト
   3. Salesforceプロジェクト - Testim Salesforceプロジェクト

      ![](/images/project-user-management/project-and-user-management/6b17344-projects.png)
