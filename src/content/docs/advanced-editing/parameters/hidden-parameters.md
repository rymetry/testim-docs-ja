---
title: 非表示パラメーター
description: >-
  テストでパラメーターを使うと、実行時に使用された値が UI に保存・表示され、デバッグや原因追跡に役立ちます。一方で機微情報を扱う場合は値を表示したくないことがあります。Testim
  では、非表示にするパラメーターを定義できます。非表示パラメーターは
category: 高度な編集
order: 5048
updated: '2025-09-22'
sourceUrl: 'https://docs.tricentis.com/testim/content/advanced-editing/parameters/hidden-parameters.htm'
keywords:
  - Testim
  - パラメーター
  - 非表示
  - セキュリティ
  - 機密情報
  - 隠しパラメーター
  - CLI
  - PRO機能
---

テストで[パラメーター](/docs/advanced-editing/parameters)を使用すると、実行時に使われた値がデバッグや失敗原因の特定に役立つように UI に保存・表示されます。ただし情報が機微な場合、値を非表示にしたいことがあります。Testim では、どのパラメーターを非表示にするかを定義できます。非表示パラメーターは Testim のクラウドに一切保存されないため、「同じパラメーターで再実行」機能は使用できません。

:::note
これは PRO 機能です。この機能は Professional plan のプロジェクトでのみ利用できます。Professional plan の詳細は、[こちら](https://www.testim.io/pricing/)をクリックしてください。
:::

## 非表示パラメーターを追加する

手順:

1. メインメニューで **Resources** を選択。
2. **Hidden Parameters** セクションで **Add hidden parameter** をクリック。

   ![非表示パラメーターの追加](/images/parameters/hidden-parameters/8a620c6-image.png)

3. パラメーター名と説明（任意）を入力し、**Create**。

## 非表示パラメーターの編集・削除

手順:

1. メインメニューから **Resources** → **Hidden Parameters** を開き、一覧を表示。
2. 目的のパラメーターを右クリックし **Edit**。削除は **Delete** を選択。

   ![非表示パラメーターの編集](/images/parameters/hidden-parameters/d3dc1ce-image.png)

## 非表示パラメーターを使ってテストを実行

非表示パラメーターを使用するテストの実行は [CLI](/docs/running-tests/the-command-line-cli) 経由でのみ可能です。Scheduler を使って非表示パラメーターのテストを実行することはできません。\
CLI 実行には次のいずれかの方法で非表示パラメーターの値を渡せます:

- JSON パラメーターファイル — 非表示パラメーターを JSON で定義して渡す。詳細は[JSON パラメーターファイル](/docs/advanced-editing/parameters/json-parameters-file-parameters)
- 設定ファイル — 設定ファイルで定義して渡す。詳細は[設定ファイルのパラメーター](/docs/advanced-editing/parameters/configuration-file-parameters)

## テスト内での表示

非表示パラメーターの値は **\*** として表示されます。

![非表示パラメーターの表示](/images/parameters/hidden-parameters/fac42c0-step_passed.png)
