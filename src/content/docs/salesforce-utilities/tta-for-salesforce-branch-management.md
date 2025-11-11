---
title: 'Testim for Salesforceブランチ管理'
description: '原文: https://help.testim.io/docs/tta-for-salesforce-branch-management'
category: 'Salesforceユーティリティ'
order: 5
updated: '2025-11-02'
keywords:
  - testim
  - tta-for-salesforce-branch-management
  - salesforce-utilities
---

Testim for Salesforceブランチ管理機能は、一般的なTestimブランチ管理機能と似ていますが、いくつかの主要な違いがあります。一般的なTestimブランチ管理の詳細については、[ブランチ管理](/docs/testops-version-control/version-control-branches)を参照してください。

# Testim for Salesforceブランチの使用

* 開始点として、各プロジェクトは単一の「main」ブランチで構成されています。
* 追加のブランチを作成し、いつでもブランチを切り替えて、ブランチ内のテストを好きなように変更できます。1つのブランチでの変更は、他のブランチには影響しません。新しいブランチを作成するには、[ブランチの作成](https://help.testim.io/docs/tta-for-salesforce-branch-management#creating-a-branch)を参照してください。ブランチを切り替えるには、[ブランチの切り替え](https://help.testim.io/docs/version-control-branches#switching-branches)を参照してください。
* 各ブランチは、単一の[Salesforce環境](https://help.testim.io/docs/create-and-manage-test-environments)に関連付けることができます。これは、テストの開発の一部として、同じブランチを異なる環境に関連付け、ある環境から別の環境へ移動できることを意味します（例：QA環境からステージング環境、本番環境へ）。ブランチの環境を変更するには、[ブランチのSalesforce環境の変更](https://help.testim.io/docs/tta-for-salesforce-branch-management#changing-the-salesforce-environment-of-a-branch)を参照してください。ブランチをSalesforce環境に関連付けることは必須ではありませんが、Salesforce関連のステップ（例：ログインステップ）を使用するには、この関連付けを実行する必要があります。
* 各Salesforce環境は、1つ以上のブランチに関連付けられています。関連付けは、ブランチ自体の構成を通じて行われます。Salesforce環境を作成するには、[Salesforce環境の接続](https://help.testim.io/docs/create-and-manage-test-environments#connecting-a-salesforce-environment)を参照してください。
* ある時点で、ブランチ間でマージしたい場合があります（例：フィーチャーブランチをMainブランチにマージする）。ブランチをマージするには、[ブランチのマージ](https://help.testim.io/docs/create-and-merge-branches-from-different-test-environments#merging-a-branch)セクションの指示に従ってください。

## ブランチの作成

:fa-arrow-right:**新しいブランチを作成するには:**

1. メニューの**新しいブランチを作成（フォークアイコン）**ボタンをクリックします。

   ![](/images/salesforce-utilities/tta-for-salesforce-branch-management/35b00be-fork.png)
2. **名前**フィールドに、ブランチの名前を入力します。
3. **Salesforce環境**フィールドで、関連するSalesforce環境をブランチに関連付けます。ブランチをSalesforce環境に関連付けることは必須ではありませんが、Salesforce関連のステップ（例：ログインステップ）を使用するには、この関連付けを実行する必要があります。

   ![](/images/salesforce-utilities/tta-for-salesforce-branch-management/f57b3fa-newbranch2.png)
4. **OK**をクリックします。

## ブランチのSalesforce環境の変更

:fa-arrow-right:**ブランチのSalesforce環境を変更するには:**

1. 上部の**ブランチ**ドロップダウンメニューをクリックして、ブランチのリストを表示します。
2. 目的のブランチの**環境の変更**ボタンをクリックします。

   ![](/images/salesforce-utilities/tta-for-salesforce-branch-management/a0b3049-2023-12-12_17-36-35.png)
3. 環境の変更ダイアログで、新しい環境の下で、ドロップダウンメニューから目的の環境を選択します。

   ![](/images/salesforce-utilities/tta-for-salesforce-branch-management/16ed4e9-2023-12-12_17-40-40.png)
4. **保存**をクリックします。
