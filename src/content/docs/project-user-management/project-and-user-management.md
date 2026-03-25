---
title: プロジェクトとユーザー管理（企業レベル）
description: 企業（アカウント）レベルでのプロジェクトとユーザーの構造、チームメイトの追加と削除、企業オーナーの管理方法について説明します。
category: 管理者機能
order: 14003
updated: '2025-09-19'
sourceUrl: 'https://docs.tricentis.com/testim/content/administration/project-and-user-management.htm'
keywords:
  - 企業管理
  - 組織構造
  - Company
  - Projects
  - Teammates
  - 企業オーナー
  - プロジェクトライブラリ
---

組織のプロジェクトとユーザー構造を理解する

Testim は組織構造を提供しており、**Company**（「アカウント」のようなもの）には **Projects**（各プロジェクトは「ワークスペース」のようなもの）のリストと **Teammates** のリストが含まれます。

- **Company**（アカウント）は **Pro**（有料版）または **Trial**（無料/トライアル版）になります。
- **Teammate** は複数の **Companies** のメンバーになれます。
- **Project** は以下のいずれかのタイプになります:
  - Web プロジェクト
  - モバイルプロジェクト
  - Salesforce プロジェクト

## プロジェクトライブラリの表示

**プロジェクトライブラリを表示するには:**

1. ユーザーアバターをクリックします。
2. **Team** ハイパーリンクをクリックします。

![Company 配下の Projects 一覧を表示したプロジェクトライブラリ画面](/images/project-user-management/project-and-user-management/4129216-projects.png)

:::note
リストの最後のプロジェクトは使用例プロジェクトで、読み取り専用のプロジェクトです。このプロジェクトは、新しいユーザーが Testim の使用方法を学ぶためにドキュメント全体で使用されています。
:::

## 企業チームメイトの表示

**企業チームメイトを表示するには:**

1. ユーザーアバターをクリックします。
2. **Team** ハイパーリンクをクリックします。

![Team 画面に表示される企業チームメイト一覧](/images/project-user-management/project-and-user-management/cfcf882-5543298-team.png)

### 企業チームメイトの追加

誰でも他の企業ユーザーを招待できますが、アクセス権のあるプロジェクトへのアクセスのみを付与できます。

**ユーザーを追加するには:**

1. Team 画面で、**+ Teammate** をクリックします。
2. フィールドにユーザーのメールアドレスを入力します。複数のメールアドレスを入力できます。

![+ Teammate ボタンをクリックした後の招待フォーム](/images/project-user-management/project-and-user-management/b9302f5-invite_teammates.png)

3. これらのユーザーがアクセスできるプロジェクトを選択するには、プロジェクト名の横にある + ボタンをクリックします。
4. **Invite** をクリックします。\
   ユーザーは、アカウントを有効化するための招待メールを受け取ります。

### 企業チームメイトの削除

**企業チームメイトを削除するには:**

1. 削除したいチームメイトを 1 人以上選択します。複数のチームメイトを選択するには CTRL/CMD + クリックを使用します。
2. **Delete User** ボタンをクリックします。または、選択したチームメイトを右クリックして「Delete users」を選択することもできます。

![企業チームメイトを選択して Delete User ボタンを押す画面](/images/project-user-management/project-and-user-management/3af9d4d-deletecompanyusers.png)

![右クリックメニューから Delete users を選択する画面](/images/project-user-management/project-and-user-management/0724162-4a1895b-rightclickdelete.png)

選択したチームメイトが企業から削除されます。

### 読み取り専用ユーザー

読み取り専用ユーザーを追加したい場合は、Testim セールス担当者にお問い合わせください。\
このようなユーザーは、UI でのテスト保存のみがブロックされることに注意してください。

### 企業オーナーとプロジェクトオーナーの変更/追加

企業オーナーは、他のユーザーを企業オーナーとして割り当て/削除できます。企業には複数のオーナーを設定できます。現在の企業オーナーはオーナーシップを削除することもできますが、少なくとも 1 人の企業オーナーが必要であるため、最後のオーナーはオーナーとして削除したり、削除したりすることはできません。

**ユーザーを企業オーナーとして割り当てるには:**

1. 企業オーナーとしてログインしていることを確認します。
2. **Team** 画面で、企業オーナーではないユーザーを右クリックし、**Add company owner** を選択します。

![企業チームメイトに Company Owner 権限を割り当てるメニュー](/images/project-user-management/project-and-user-management/3151c91-c0f396c-addcompanyowner.png)

### 企業オーナーの削除

**ユーザーを企業オーナーから削除するには:**

1. 企業オーナーとしてログインしていることを確認します。
2. **Team** 画面で、企業オーナーのユーザーを右クリックし、**Remove company owner** を選択します。

![Company Owner 権限を削除するオプション](/images/project-user-management/project-and-user-management/397901e-ef3c7bd-remove.png)

## 企業とプロジェクト間のナビゲーション

**企業間のナビゲーション**\
複数の企業のメンバーである場合、企業間を移動できます。

**企業間を移動するには:**

1. ユーザーアバター（右上隅）をクリックします。
2. **Company** セクションの下にリストされている希望の企業を選択します。

![複数 Company から対象会社を選択するダイアログ](/images/project-user-management/project-and-user-management/8a4e71c-companyselection.png)

**プロジェクト間のナビゲーション**\
いつでも別のプロジェクトに切り替えることができます。

**アクティブなプロジェクトを切り替えるには:**

1. ヘッダーバー（左上）のプロジェクトドロップダウンメニューをクリックします。\
   以下のカテゴリに整理されたプロジェクトのリストが表示されます:
   1. Web プロジェクト - Testim Web プロジェクト
   2. モバイルプロジェクト - Testim モバイルプロジェクト
   3. Salesforce プロジェクト - Testim Salesforce プロジェクト

![企業内のすべての Projects リストを表示した画面](/images/project-user-management/project-and-user-management/6b17344-projects.png)
