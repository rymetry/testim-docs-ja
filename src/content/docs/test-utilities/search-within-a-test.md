---
title: テスト内検索
description: テスト内のステップ、JavaScriptコード、パラメーター、URL、条件などを横断検索する方法を学びます。
category: テスト編集
order: 4014
updated: '2025-09-18'
sourceUrl: 'https://help.testim.io/docs/search-within-a-test'
keywords:
  - テスト内検索
  - 検索機能
  - ステップ検索
  - JavaScriptコード検索
  - パラメーター検索
  - URL検索
  - 条件検索
  - ループ検索
  - テストユーティリティ
  - 検索制限事項
---

テスト内のオブジェクトを検索する方法

検索機能を使うと、テスト内のオブジェクトを横断して検索できます。テスト画面の検索フィールドに自由入力（最低3文字）すると検索が行われます。検索は**大文字・小文字を区別しません**。

検索対象（制限事項は末尾参照）

* **Step description** — ステップの **Description** フィールドや **Text to assign** フィールドに入力したテキスト
* **JS Code** — ステップ内の JavaScript コード（例: [Add custom validations and actions](/docs/custom-code) ステップ内のコード）
* **Parameters** — ステップ内の JS/HTML パラメーター名・値
* **Base URL** — ベースURLの任意の部分
* **URL** — [Navigation Step](/docs/navigation) や [Add an API Action Step](/docs/api-testing#adding-an-api-action-step) 内のURLの任意の部分
* **Test Data** — ステップ内のテストデータの任意の部分
* **Condition** — **When to run step** で **Custom** を選択した際の JavaScript 条件（[Conditions](/docs/conditions) 参照）
* **Loop** — **When to run step** で **Loop for** を選択した際の JavaScript 条件

## 検索の使い方

**テスト内を検索するには:**

1. テスト画面で **Search** ボタンをクリックします。\
   ![検索ボタン](/images/test-utilities/search-within-a-test/e200c02-searchbutton.png)
2. 検索語を入力します。検索は大文字・小文字を区別しません。検索語は最低 3 文字必要です。\
   検索結果は **Search Results** ペインに表示されます。各結果は、検索語に（完全または部分的に）一致した要素を含むステップを表します。一致箇所は黄色でハイライトされます。詳細は [検索結果の見方](#検索結果の見方) を参照してください。\
   ![検索結果ペイン](/images/test-utilities/search-within-a-test/f945272-searchresults.JPG)
3. 任意の検索結果をクリックすると該当ステップが開きます。

## 検索結果の見方

検索結果はオブジェクトタイプごとのカテゴリにグループ化され、各カテゴリ名の右に該当件数が表示されます。特記がない限り、結果をクリックすると一致が見つかったステップに移動します。

* **Step Description** — 1 行目に、検索語に一致した **Description** または **Text to assign** の値が表示され（一致箇所は黄色でハイライト）、2 行目にはカテゴリ名とステップ名（= **Text to assign** の値）が表示されます。
* **JS Code** — 1 行目に一致件数、2 行目にカテゴリ名とステップ名を表示。クリックするとステップ内の JS コードエディターを開きます。
* **Parameters** — 1 行目にパラメーター名と値（一致箇所は黄色でハイライト）、2 行目にカテゴリ名とステップ名を表示。複数一致は別々の結果として表示されます。
* **Base URL** — 1 行目に Base URL の値（一致箇所は黄色でハイライト）、2 行目にカテゴリ名とステップ名を表示。
* **URL** — 1 行目に URL の値（一致箇所は黄色でハイライト）、2 行目にカテゴリ名とステップ名を表示。
* **Test Data** — 1 行目に一致件数、2 行目にカテゴリ名とステップ名を表示。
* **Condition** — 1 行目に一致件数、2 行目にカテゴリ名とステップ名を表示。クリックでステップ内の JS コードエディターを開きます。
* **Loop** — 1 行目に一致件数、2 行目にカテゴリ名とステップ名を表示。クリックでステップ内の JS コードエディターを開きます。

### 検索の制限

検索機能で見つからない値:

* Extract value — 変数名
* Sleep — 待機時間
* Generate email address — 変数名
* Set cookie — 説明以外の項目
* Get cookie — クッキー名・変数名
* Run dev-kit — 関数名
* API — URL と関数以外
* Generate random value — 説明以外
* Generate date — 説明以外
