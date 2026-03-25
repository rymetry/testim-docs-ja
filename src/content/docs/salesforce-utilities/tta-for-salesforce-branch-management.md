---
title: Testim for Salesforce ブランチ管理
description: Testim for Salesforce のブランチ作成・切り替え・環境変更・マージの概要を説明します。
category: Salesforceテスト
order: 16035
updated: '2025-12-02'
sourceUrl: 'https://docs.tricentis.com/testim/content/salesforce-testing/tta-for-salesforce-branch-management.htm'
keywords:
  - ブランチ管理
  - Testim for Salesforce
  - Salesforce 環境
  - ブランチ作成
  - ブランチ切り替え
  - 環境変更
  - マージ
  - Main ブランチ
---

Testim for Salesforce ブランチ管理機能は、一般的な Testim ブランチ管理機能と似ていますが、いくつかの主要な違いがあります。一般的な Testim ブランチ管理の詳細については、[ブランチ管理](/docs/version-control-branches)を参照してください。

## Testim for Salesforce ブランチの使用

- 開始点として、各プロジェクトは単一の「main」ブランチで構成されています。
- 追加のブランチを作成し、いつでもブランチを切り替えて、ブランチ内のテストを好きなように変更できます。1 つのブランチでの変更は、他のブランチには影響しません。新しいブランチを作成するには、[ブランチの作成](/docs/tta-for-salesforce-branch-management#creating-a-branch)を参照してください。ブランチを切り替えるには、[ブランチの切り替え](/docs/version-control-branches#switching-branches)を参照してください。
- 各ブランチは、単一の[Salesforce 環境](/docs/create-and-manage-test-environments)に関連付けることができます。これは、テストの開発の一部として、同じブランチを異なる環境に関連付け、ある環境から別の環境へ移動できることを意味します（例：QA 環境からステージング環境、本番環境へ）。ブランチの環境を変更するには、[ブランチの Salesforce 環境の変更](/docs/tta-for-salesforce-branch-management#changing-the-salesforce-environment-of-a-branch)を参照してください。ブランチを Salesforce 環境に関連付けることは必須ではありませんが、Salesforce 関連のステップ（例：ログインステップ）を使用するには、この関連付けを実行する必要があります。
- 各 Salesforce 環境は、1 つ以上のブランチに関連付けられています。関連付けは、ブランチ自体の構成を通じて行われます。Salesforce 環境を作成するには、[Salesforce 環境の接続](/docs/create-and-manage-test-environments#connecting-a-salesforce-environment)を参照してください。
- ある時点で、ブランチ間でマージしたい場合があります（例：フィーチャーブランチを Main ブランチにマージする）。ブランチをマージするには、[ブランチのマージ](/docs/create-and-merge-branches-from-different-test-environments#merging-a-branch)セクションの指示に従ってください。

## ブランチの作成

**新しいブランチを作成するには:**

1. メニューの **新しいブランチを作成（フォークアイコン）** ボタンをクリックします。

   ![新しいブランチを作成（フォークアイコン）](/images/salesforce-utilities/tta-for-salesforce-branch-management/35b00be-fork.png)

2. **名前**フィールドに、ブランチの名前を入力します。
3. **Salesforce 環境**フィールドで、関連する Salesforce 環境をブランチに関連付けます。ブランチを Salesforce 環境に関連付けることは必須ではありませんが、Salesforce 関連のステップ（例：ログインステップ）を使用するには、この関連付けを実行する必要があります。

   ![新しいブランチ作成ダイアログ](/images/salesforce-utilities/tta-for-salesforce-branch-management/f57b3fa-newbranch2.png)

4. **OK**をクリックします。

## ブランチの Salesforce 環境の変更

**ブランチの Salesforce 環境を変更するには:**

1. 上部の**ブランチ**ドロップダウンメニューをクリックして、ブランチのリストを表示します。
2. 目的のブランチの**環境の変更**ボタンをクリックします。

   ![ブランチ一覧で環境の変更を選択](/images/salesforce-utilities/tta-for-salesforce-branch-management/a0b3049-2023-12-12_17-36-35.png)

3. 環境の変更ダイアログで、新しい環境の下で、ドロップダウンメニューから目的の環境を選択します。

   ![環境の変更ダイアログ](/images/salesforce-utilities/tta-for-salesforce-branch-management/16ed4e9-2023-12-12_17-40-40.png)

4. **保存**をクリックします。
