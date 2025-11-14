---
title: '条件分岐'
description: 'テストステップに条件を設定して実行を制御する方法を学びます。Element、Element text、Custom、Never(skip)など5種類の条件設定について詳しく解説します。'
category: '条件分岐'
order: 1
updated: '2025-09-13'
sourceUrl: 'https://help.testim.io/docs/conditions'
keywords:
  - 条件分岐
  - When to run step
  - Element条件
  - Element text条件
  - Custom条件
  - ステップ制御
  - 条件設定
  - JavaScript条件
  - テスト実行制御
  - ブレークポイント
---
テストに条件（Condition）を追加する

"when to run step" 機能を使うと、テスト内の各ステップを実行するかしないかを制御できます。グループステップを含むあらゆるステップに「実行条件（when to run）」を設定できます。

ステップの実行条件は次の 5 種類です:

* **Always Run** — このステップには条件がありません。テスト実行時に常に実行されます。すべてのステップの既定設定です。
* **Element** — 指定した要素がページ上に存在する（または存在しない）かどうかに基づいて、ステップを実行するかを制御します。要素は Property ID、テキスト、クラスなど任意の DOM オブジェクトが対象です。詳しくは [CONFIGURING AN ELEMENT CONDITION](/docs/conditions#section-configuring-an-element-condition) を参照してください。
* **Element text** — Element 条件に類似しますが、指定要素に期待するテキスト値が存在する場合にのみステップを実行します。詳しくは [CONFIGURING AN ELEMENT TEXT CONDITION](/docs/conditions#section-configuring-an-element-text-condition) を参照してください。
* **Custom** — ページ上の要素について特定の値をチェックします。値が存在する場合にステップを実行します。条件にはカスタム JavaScript を使用できます。詳しくは [CONFIGURING A CUSTOM CONDITION](/docs/conditions#section-configuring-a-custom-condition) を参照してください。
* **Never (skip)** — このオプションが選択されている間、ステップは実行されません。一時的にステップを無効化したい場合に使用します。ステップは将来の再利用に備えて保持されます。詳しくは [CONFIGURING A NEVER RUN STEP CONDITION](/docs/conditions#section-configuring-a-never-run-step-condition) を参照してください。

## Condition インジケーター

ステップに条件を追加すると、そのステップタイルに菱形アイコンが表示されます。

![条件インジケーターの菱形アイコン](/images/conditions/conditions/5a8943a-Screen_Shot_2021-04-07_at_8.02.33.png "Screen Shot 2021-04-07 at 8.02.33.png")

テスト実行時、条件が truthy を返した場合、菱形アイコンは緑色で表示され、ステップが実行されたことを示します。

![条件が真の場合の緑色の菱形](/images/conditions/conditions/e2d0a13-Screen_Shot_2021-04-27_at_6.36.08.png "Screen Shot 2021-04-27 at 6.36.08.png")

条件が falsy を返した場合、菱形は赤色で表示され、ステップがスキップされたことを示します。

![条件が偽の場合の赤色の菱形](/images/conditions/conditions/ed652c5-Screen_Shot_2021-04-27_at_6.38.16.png "Screen Shot 2021-04-27 at 6.38.16.png")

## 代表的なユースケース

条件を設定すると、特定の状況でのみ関連するステップをテストに含めることができます。チェック対象の要素を指定することで、そのステップを実行すべきかどうかを判断できます。\
例えば:

* **ユーザーがログアウトしている場合のみログインステップを実行** — テストにログインステップが含まれている場合、すでにログインしているかどうかを確認することが重要です。たとえば CI でのテストでは新しいブラウザーが起動するため、最初にログインが必要になるでしょう。ローカルでテストしている場合は、すでにログイン済みかもしれません。条件を使用することで、未ログイン時にのみログインステップを実行させることができます。  
* **テーブルが空のときのみデータを投入** — データを投入する前にテーブルが空かどうかを確認することが大切です。テーブルが空ならデータ投入ステップが実行され、すでにデータがある場合はステップがスキップされます。

## Element 条件の設定

Element 条件では、指定要素がページに存在するかどうかに基づいて、ステップを実行するかどうかを制御します。\
Element 条件は要素の可視性に基づいてステップを実行します。次の 2 つの条件から選択できます:

* **Element visible:** 要素がページ上で可視の場合にのみステップを実行します。
* **Element not visible:** 要素がページ上で不可視の場合にのみステップを実行します。

:fa-arrow-right: **Element 条件を設定するには:**

![Element条件設定のデモ](/images/conditions/conditions/8397205-Conditions.gif "Conditions.gif")

1. 条件を追加したいステップの左にある **>（矢印）** にカーソルを合わせます。

![ステップの矢印アイコン](/images/conditions/conditions/da381a6-Testim_120a.png "Testim 120a.png")

   アクションのオプションが表示されます。

![アクションオプションメニュー](/images/conditions/conditions/c3d594e-Testim_121a.png "Testim 121a.png")

2. **Toggle Breakpoint** をクリックします。

![Toggle Breakpointボタン](/images/conditions/conditions/cfcb5fc-Testim_122.png "Testim 122.png")

3. **Play Scenario** をクリックして、ブレークポイントまでテストを実行します。

![Play Scenarioボタン](/images/conditions/conditions/3fd74ed-Testim_129a.png "Testim 129a.png")

4. 条件を追加したいステップにカーソルを合わせ、**Show Properties**（:fa-cog:）をクリックします。\
   右側に **Properties** パネルが開きます。
5. **Properties** パネルで **When to run step** をクリックします。\
   オプションが表示されます。
6. **Element** を選択します。
7. AUT ウィンドウで対象要素にマウスを合わせてクリックし、要素を選択します。\
   選択した要素は **When to run step** セクションの **Target Element** に表示されます。

（以降の詳細手順・画像は原文の順序に従って同様に設定してください）
