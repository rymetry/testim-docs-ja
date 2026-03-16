---
title: 非表示パラメータ
description: >-
  テストでパラメータを使うと、実行時に使用された値がUIに保存・表示され、デバッグや原因追跡に役立ちます。一方で機微情報を扱う場合は値を表示したくないことがあります。Testim
  では、非表示にするパラメータを定義できます。非表示パラメータは
category: 高度な編集
order: 5048
updated: '2026-03-17'
sourceUrl: 'https://help.testim.io/docs/hidden-parameters'
keywords:
  - Testim
  - パラメータ
  - 非表示
  - セキュリティ
  - 機密情報
  - 隠しパラメータ
  - CLI
  - Pro機能
---

テストで[パラメータ](/docs/parameters)を使うと、実行時に使用された値がUIに保存・表示され、デバッグや原因追跡に役立ちます。一方で機微情報を扱う場合は値を表示したくないことがあります。Testim では、非表示にするパラメータを定義できます。非表示パラメータはクラウドに保存されないため、「同じパラメータで再実行」は利用できません。

:::note{title="Pro機能"}
この機能は Professional planで利用可能です。詳細は [こちら](https://www.testim.io/pricing/)。
:::

## 非表示パラメータを追加する

手順:

1. メインメニューで **Resources** を選択。
2. **Hidden Parameters** セクションで **Add hidden parameter** をクリック。

   ![非表示パラメータの追加](/images/parameters/hidden-parameters/8a620c6-image.png)
3. パラメータ名と説明（任意）を入力し、**Create**。

## 非表示パラメータの編集・削除

手順:

1. メインメニューから **Resources** → **Hidden Parameters** を開き、一覧を表示。
2. 目的のパラメータを右クリックし **Edit**。削除は **Delete** を選択。

   ![非表示パラメータの編集](/images/parameters/hidden-parameters/d3dc1ce-image.png)

## 非表示パラメータを使ってテストを実行

非表示パラメータを使用するテスト実行は [CLI](/docs/cli-settings) のみ対応です（スケジューラ不可）。CLI では次の方法で値を渡せます。

* JSON パラメータファイル — 非表示パラメータをJSONで定義して渡す。詳細は[JSON パラメータファイル](/docs/json-parameters-file-parameters)
* 設定ファイル — 設定ファイルで定義して渡す。詳細は[設定ファイルのパラメータ](/docs/configuration-file-parameters)

## テスト内での表示

非表示パラメータの値は **\*** として表示されます。

![非表示パラメータの表示](/images/parameters/hidden-parameters/fac42c0-step_passed.png)
