---
title: 異なるテスト環境からのブランチの作成とマージ
description: 異なるテスト環境でテストを実行するためのブランチ作成とマージ手順（環境選択、マージ後削除など）を説明します。
category: Salesforceテスト
order: 16009
updated: '2025-12-02'
sourceUrl: >-
  https://help.testim.io/docs/create-and-merge-branches-from-different-test-environments
keywords:
  - ブランチ
  - テスト環境
  - 環境切り替え
  - New Branch
  - Merge Branch
  - トランク
  - master
  - Salesforce Environments
  - Testim for Salesforce
  - ブランチ管理
---

Testim for Salesforce の各テスト環境は、次の設定で構成されています:

* 関連する Salesforce 環境の URL
* テスト環境が利用可能なブランチ。

![スクリーンショット](/images/salesforce-testing/create-and-merge-branches-from-different-test-environments/5f39d87-branch.png)

別のテスト環境でテストを実行する場合は、新しいブランチを作成し、別のテスト環境を選択する必要があります。

テストは、各ブランチの単一のテスト環境で実行されます。複数のブランチが同じテスト環境にアクセスできます。すべてのブランチは、master と呼ばれる 1 つのトランクまたはメインブランチから拡張されます。ブランチでテストを作成した後、それをマスターブランチにマージできます。

## ブランチの作成

:fa-arrow-right:**新しいブランチを作成するには:**

![操作手順アニメーション](/images/salesforce-testing/create-and-merge-branches-from-different-test-environments/8d71d98-newbranch.gif)

1. Testim for Salesforce で、**New Branch**アイコンを選択します。
2. **New branch name**フィールドに、ブランチの名前を入力します。
3. **Salesforce environment**フィールドで、ドロップダウンメニューから Salesforce 環境を選択します
4. **OK**をクリックします。\
   すべてのブランチは、Salesforce > Environments の下に表示されます。また、画面上部のブランチ検索ドロップダウンでも利用できます。

## ブランチのマージ

:fa-arrow: :fa-arrow-right: **ブランチをマージするには:**

![操作手順アニメーション](/images/salesforce-testing/create-and-merge-branches-from-different-test-environments/2c34ad0-mergebranch.gif)

1. Testim for Salesforce で、ブランチ検索ドロップダウンから、マージするブランチを選択します。
2. マージアイコンをクリックします。\
   Merge Branch ダイアログが表示されます。
3. マージする前に変更を確認します。
4. マージ後にブランチを削除する場合は、**Delete branch\<branch\_name> upon merge**チェックボックスを選択します。
5. **Merge**をクリックします。
