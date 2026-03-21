---
title: 条件分岐
description: >-
  テストステップに条件を設定して実行を制御する方法を学びます。Element、Element
  text、Custom、Never（skip）など 5 種類の条件設定について詳しく解説します。
category: テスト編集
order: 4010
updated: '2025-09-19'
sourceUrl: 'https://help.testim.io/docs/conditions'
keywords:
  - 条件分岐
  - When to run step
  - Element 条件
  - Element text 条件
  - Custom 条件
  - ステップ制御
  - 条件設定
  - JavaScript 条件
  - テスト実行制御
  - ブレークポイント
---

テストに条件（Condition）を追加する

"when to run step" 機能を使うと、テスト内の各ステップを実行するかしないかを制御できます。グループステップを含むあらゆるステップに「実行条件（when to run）」を設定できます。

ステップの実行条件は次の 5 種類です:

- **Always Run** — このステップには条件がありません。テスト実行時に常に実行されます。すべてのステップの既定設定です。
- **Element** — 指定した要素がページ上に存在する（または存在しない）かどうかに基づいて、ステップを実行するかを制御します。要素は Property ID、テキスト、クラスなど任意の DOM オブジェクトが対象です。詳しくは [CONFIGURING AN ELEMENT CONDITION](/docs/conditions#section-configuring-an-element-condition) を参照してください。
- **Element text** — Element 条件に類似しますが、指定要素に期待するテキスト値が存在する場合にのみステップを実行します。詳しくは [CONFIGURING AN ELEMENT TEXT CONDITION](/docs/conditions#section-configuring-an-element-text-condition) を参照してください。
- **Custom** — ページ上の要素について特定の値をチェックします。値が存在する場合にステップを実行します。条件にはカスタム JavaScript を使用できます。詳しくは [CONFIGURING A CUSTOM CONDITION](/docs/conditions#section-configuring-a-custom-condition) を参照してください。
- **Never (skip)** — このオプションが選択されている間、ステップは実行されません。一時的にステップを無効化したい場合に使用します。ステップは将来の再利用に備えて保持されます。詳しくは [CONFIGURING A NEVER RUN STEP CONDITION](/docs/conditions#section-configuring-a-never-run-step-condition) を参照してください。

## Condition インジケーター

ステップに条件を追加すると、そのステップタイルに菱形アイコンが表示されます。

![条件インジケーターの菱形アイコン](/images/conditions/conditions/5a8943a-Screen_Shot_2021-04-07_at_8.02.33.png)

テスト実行時、条件が truthy を返した場合、菱形アイコンは緑色で表示され、ステップが実行されたことを示します。

![条件が真の場合の緑色の菱形](/images/conditions/conditions/e2d0a13-Screen_Shot_2021-04-27_at_6.36.08.png)

条件が falsy を返した場合、菱形は赤色で表示され、ステップがスキップされたことを示します。

![条件が偽の場合の赤色の菱形](/images/conditions/conditions/ed652c5-Screen_Shot_2021-04-27_at_6.38.16.png)

## 代表的なユースケース

条件を設定すると、特定の状況でのみ関連するステップをテストに含めることができます。チェック対象の要素を指定することで、そのステップを実行すべきかどうかを判断できます。\
例えば:

- **ユーザーがログアウトしている場合のみログインステップを実行** — テストにログインステップが含まれている場合、すでにログインしているかどうかを確認することが重要です。例えば CI でのテストでは新しいブラウザが起動するため、最初にログインが必要になるでしょう。ローカルでテストしている場合は、すでにログイン済みかもしれません。条件を使用することで、未ログイン時にのみログインステップを実行させることができます。
- **テーブルが空のときのみデータを投入** — データを投入する前にテーブルが空かどうかを確認することが大切です。テーブルが空ならデータ投入ステップが実行され、すでにデータがある場合はステップがスキップされます。

## Element 条件の設定

Element 条件では、指定要素がページに存在するかどうかに基づいて、ステップを実行するかどうかを制御します。\
Element 条件は要素の可視性に基づいてステップを実行します。次の 2 つの条件から選択できます:

- **Element visible:** 要素がページ上で可視の場合にのみステップを実行します。
- **Element not visible:** 要素がページ上で不可視の場合にのみステップを実行します。

**Element 条件を設定するには:**

![Element 条件設定のデモ](/images/conditions/conditions/8397205-Conditions.gif)

1. 条件を追加したいステップの左にある **>（矢印）** にカーソルを合わせます。

![ステップの矢印アイコン](/images/conditions/conditions/da381a6-Testim_120a.png)

アクションのオプションが表示されます。

![アクションオプションメニュー](/images/conditions/conditions/c3d594e-Testim_121a.png)

2. **Toggle Breakpoint** をクリックします。

![Toggle Breakpoint ボタン](/images/conditions/conditions/cfcb5fc-Testim_122.png)

3. **Play Scenario** をクリックして、ブレークポイントまでテストを実行します。

![Play Scenario ボタン](/images/conditions/conditions/3fd74ed-Testim_129a.png)

4. 条件を追加したいステップにカーソルを合わせ、**Show Properties** をクリックします。\
   右側に **Properties** パネルが開きます。
5. **Properties** パネルで **When to run step** をクリックします。\
   オプションが表示されます。
6. **Element** を選択します。
7. AUT ウィンドウで対象要素にマウスを合わせてクリックし、要素を選択します。\
   選択した要素は **When to run step** セクションの **Target Element** に表示されます。

![Element 条件の設定画面](/images/conditions/conditions/a8a3d48-TestimConditions01_r.png)

8. Properties パネルの手順に従って、要素の設定を確認・調整します。
9. 条件タイプ（**Visible** または **Not visible**）を指定します。
10. 必要に応じて [拡張条件設定](/docs/advanced-conditions-settings) でタイムアウト設定を調整します。
11. **Toggle Breakpoint** を再度クリックしてブレークポイントを解除します。

ステップタイルに菱形アイコンが表示され、条件が追加されたことを確認できます。

### Element 条件を試してみましょう

[こちら](https://app.testim.io/#/project/GYXR2qZC/branch/master/test/RQyrVVAjJp) を開くと、Login グループステップを含むサンプルテストが表示されます。Login ボタンが可視のときにのみログインを実行する Element 条件を作成してみてください。

## Element text 条件の設定

Element text 条件は Element 条件に類似しますが、指定した要素に特定のテキスト値が含まれる場合にのみステップを実行します。条件には正規表現、短い JavaScript 式、またはパラメーターを使用できます。

![Element text 条件設定のデモ](/images/conditions/conditions/59391e6-element_text_condition.gif)

**Element text 条件を設定するには:**

1. 条件を追加したいステップの左にある **>（矢印）** にカーソルを合わせます。

![ステップの矢印アイコン](/images/conditions/conditions/5937c73-Testim_120a.png)

アクションのオプションが表示されます。

![アクションオプションメニュー](/images/conditions/conditions/81cc951-Testim_121a.png)

2. **Toggle Breakpoint** をクリックします。

![Toggle Breakpoint ボタン](/images/conditions/conditions/f29f5bd-Testim_122.png)

3. **Play Scenario** をクリックして、ブレークポイントまでテストを実行します。

![Play Scenario ボタン](/images/conditions/conditions/176b48a-Testim_129a.png)

4. 条件を追加したいステップにカーソルを合わせ、**Show Properties** をクリックします。
5. **Properties** パネルで **When to run step** をクリックします。
6. **Element Text** を選択します。
7. AUT ウィンドウで対象要素にマウスを合わせてクリックし、要素を選択します。\
   現在の要素の値が **Expected value** ボックスに表示されます。
8. 選択した要素は **Target Element** ボックスに表示されます。
9. **Expected value** ボックスに別の値を入力するか、正規表現、JavaScript 式、またはパラメーターを指定します。

![Element text 条件の設定画面](/images/conditions/conditions/230f6f2-elementtext_r.png)

10. Properties パネルの手順に従って、要素の設定を確認・調整します。
11. 必要に応じて [拡張条件設定](/docs/advanced-conditions-settings) でタイムアウト設定を調整します。
12. **Toggle Breakpoint** をクリックしてブレークポイントを解除します。

ステップタイルに菱形アイコンが表示され、条件が追加されたことを確認できます。

### Element text 条件を試してみましょう

[こちら](https://app.testim.io/#/project/GYXR2qZC/branch/master/test/RQyrVVAjJp) を開くと、Login グループステップを含むサンプルテストが表示されます。Login ボタンのテキストが「Log in」と表示されているときにのみログインを実行する Element text 条件を作成してみてください。

## Custom 条件の設定

Custom 条件は、単純な要素の可視性チェックを超えた、複雑な条件を JavaScript で記述できます。パラメーター（HTML 要素または JavaScript の値）を定義し、条件式内で参照することが可能です。

例:

```javascript
return loginButton.innerText === 'LOG IN';
```

:::note
Custom 条件はブール値を返します。`true` を返すとステップが実行され、`false` を返すとスキップされます。
:::

**HTML パラメーターの前提条件**: AUT を開く必要があります。ステップの左にある矢印にカーソルを合わせ、**Toggle Breakpoint** をクリックし、**Play Scenario** をクリックしてください。

![Custom 条件設定のデモ](/images/conditions/conditions/12714a6-custom_condition2.gif)

**Custom 条件を設定するには:**

1. 条件を追加したいステップにカーソルを合わせ、**Show Properties** をクリックします。
2. **Properties** パネルで **When to run step** をクリックします。
3. **Custom** を選択します。
4. **Set condition** ウィンドウが開きます。

![Set condition ウィンドウ](/images/conditions/conditions/fc64429-setcondition.png)

5. パラメーターを定義します（任意）。**+ PARAMS** ボタンをクリックします。

![パラメーター追加](/images/conditions/conditions/5eed156-custom2_r.png)

- **JavaScript パラメーター**: ドロップダウンから **JS** を選択し、パラメーターを入力します。

![JS パラメーター設定](/images/conditions/conditions/6939ac9-custom4_r.png)

- **HTML パラメーター**: ドロップダウンから **HTML** を選択するとブラウザが開きます。AUT ウィンドウで対象要素にカーソルを合わせてクリックします。デフォルトの名前「element」から変更する場合は、編集アイコンをクリックしてリネームします。

![HTML パラメーター設定](/images/conditions/conditions/4f76e55-custom5_r.png)

6. 関数テキストボックスに、定義したパラメーターを参照する JavaScript 条件を入力します。

![JavaScript 条件の入力](/images/conditions/conditions/4df6f82-custom6_r.png)

7. デフォルトのタイムアウト（30000ms）を変更する場合は、**Override timeout** ボタンをクリックします。
8. 戻る矢印をクリックして、メインの Editor ウィンドウに戻ります。
9. 必要に応じて [拡張条件設定](/docs/advanced-conditions-settings) でタイムアウト設定を調整します。

:::note
jQuery などの DOM セレクター（HTML パラメーターではなく）を使用する場合、空の配列は truthy として評価されます。`$(<query>)` ではなく `$(<query>).length` を使用してください。
:::

AUT を開いた場合は、**Toggle Breakpoint** をクリックしてブレークポイントを解除してください。

### Custom 条件を試してみましょう

[こちら](https://app.testim.io/#/project/GYXR2qZC/branch/master/test/RQyrVVAjJp) を開くと、Login グループステップを含むサンプルテストが表示されます。Login ボタンを選択する HTML パラメーターを作成し、`return loginButton.innerText === 'LOG IN';` という Custom 条件を入力して、ボタンが可視かつ正しいテキストを表示しているときにのみログインを実行するように設定してみてください。

## Never run step 条件の設定

Never（skip）条件は、テストステップを一時的に無効化しながらも、将来の再利用に備えてステップ自体を保持する場合に使用します。

**Never run step 条件を設定するには:**

1. 対象のステップをクリックします（青いボックスでハイライトされます）。
2. **Show Properties** をクリックします。
3. **Properties** パネルで **When to run step** をクリックします。
4. **Never (skip)** を選択します。

再設定するまで、テスト実行時にこのステップはスキップされます。菱形アイコンは **When to run step** オプションが有効であることを示します。
