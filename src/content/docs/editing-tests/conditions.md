---
title: 条件分岐
description: >-
  テストステップに条件を設定して実行を制御する方法を学びます。Element、Element
  text、Custom、Never（skip）など 5 種類の条件設定について詳しく解説します。
category: テスト編集
order: 4010
updated: '2025-09-19'
sourceUrl: 'https://docs.tricentis.com/testim/content/editing-tests/conditions/index.htm'
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

**When to run step** 機能を使うと、テスト内の各ステップを実行するかしないかを制御できます。グループステップを含むあらゆるステップに実行条件を設定できます。ステップの実行条件は次の 5 種類です:

- **Always Run** — このステップには条件がありません。テスト実行時に常に実行されます。すべてのステップの既定設定です。
- **Element** — ページ上に指定要素が存在するか（または存在しないか）に基づいて、ステップの実行可否を制御します。対象要素として、Property ID やテキスト、クラスなどの任意の DOM オブジェクトを指定できます。詳しくは[Element 条件の設定](/docs/editing-tests/conditions#element-条件の設定)を参照してください。
- **Element text** — Element 条件と類似していますが、指定要素に期待するテキスト値が含まれる場合にのみステップを実行します。詳しくは[Element text 条件の設定](/docs/editing-tests/conditions#element-text-条件の設定)を参照してください。
- **Custom** — ページ上の要素について特定の値をチェックします。値が存在する場合にステップを実行します。条件にはカスタム JavaScript を使用できます。詳しくは[Custom 条件の設定](/docs/editing-tests/conditions#custom-条件の設定)を参照してください。
- **Never (skip)** — このオプションが選択されている間、該当ステップは実行されません。一時的にステップを無効化したい場合に使用します。ステップは将来の再利用に備えて保持されます。詳しくは[Never run step 条件の設定](/docs/editing-tests/conditions#never-run-step-条件の設定)を参照してください。

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

8. 選択した要素の設定を確認、置換、または調整したい場合は、Properties パネルの手順に従ってください。
9. Element 条件のタイプを指定します。オプション:
- Visible – 要素がページ上で可視の場合にのみステップを実行します。
- Not visible – 要素がページ上で不可視の場合にのみステップを実行します。
10. 必要に応じて [拡張条件設定](/docs/editing-tests/conditions/advanced-conditions-settings) でタイムアウト設定を調整します。
11. **Toggle Breakpoint** を再度クリックしてブレークポイントを解除します。

ステップタイルに菱形アイコンが表示され、条件が追加されたことを確認できます。

### Element 条件を試してみましょう

[こちらのサンプルテスト](http://bit.ly/2xFTMyW)を開くと、Login グループステップを含むテストが表示されます。Login ボタンが可視のときにのみログインステップを実行する Element 条件を作成してみてください。

## Element text 条件の設定

Element text 条件は Element 条件に類似していますが、指定した要素に特定のテキスト値が含まれる場合にのみステップを実行します。条件として、正規表現・短い JavaScript 式・パラメーターのいずれかを利用できます。\
**Element text 条件を設定するには:**

![Element text 条件設定のデモ](/images/conditions/conditions/59391e6-element_text_condition.gif)

1. 条件を追加したいステップの左にある **>（矢印）** にカーソルを合わせます。

![ステップの矢印アイコン](/images/conditions/conditions/5937c73-Testim_120a.png)

アクションのオプションが表示されます。

![アクションオプションメニュー](/images/conditions/conditions/81cc951-Testim_121a.png)

2. **Toggle Breakpoint** をクリックします。

![Toggle Breakpoint ボタン](/images/conditions/conditions/f29f5bd-Testim_122.png)

3. **Play Scenario** をクリックして、ブレークポイントまでテストを実行します。

![Play Scenario ボタン](/images/conditions/conditions/176b48a-Testim_129a.png)

4. 条件を追加したいステップにカーソルを合わせ、**Show Properties** をクリックします。\
   右側に **Properties** パネルが開きます。
5. **Properties** パネルで **When to run step** をクリックします。\
   オプションが表示されます。
6. **Element Text** を選択します。
7. AUT ウィンドウで対象要素にマウスを合わせてクリックし、要素を選択します。\
   現在の要素の値が **Expected value** ボックスに表示されます。
8. 選択した要素は **When to run step** セクションの **Target Element** ボックスに表示されます。
9. 現在の値以外の値を指定したい場合は、**Expected value** ボックスに値を入力します。値の範囲を設定したい場合は、正規表現、JavaScript 式、またはパラメーターを入力します。

![Element text 条件の設定画面](/images/conditions/conditions/230f6f2-elementtext_r.png)

10. 選択した要素の設定を確認、置換、または調整したい場合は、Properties パネルの手順に従ってください。
11. 必要に応じて [拡張条件設定](/docs/editing-tests/conditions/advanced-conditions-settings) でタイムアウト設定を調整します。
12. **Toggle Breakpoint** をクリックしてブレークポイントを解除します。

ステップタイルに菱形アイコンが表示され、条件が追加されたことを確認できます。

### Element text 条件を試してみましょう

[こちらのサンプルテスト](http://bit.ly/2xFTMyW)を開くと、Login グループステップを含むテストが表示されます。Login ボタンのテキストが「Log in」と表示されているときにのみログインステップを実行する Element text 条件を作成してみてください。

## Custom 条件の設定

要素の可視性や特定テキストの存在を検証するだけでは不十分な場合があります。要素の値をチェックしたり、より複雑な条件を定義したい場合に Custom 条件を使用します。JavaScript ステップとして条件を作成できます。\
例えば、ログインページにいるかどうかを URL で判定するには、次のようなカスタム条件を使用できます:

```javascript
return loginButton.innerText === 'LOG IN';
```

HTML パラメーターや JavaScript パラメーターを条件内で定義し、参照することもできます。例えば、HTML 要素としてボタンを選択し、そのボタンのテキストをチェックする条件を作成できます。Custom 条件はブール値を返すステップとして記述します。`true` を返すとステップは実行され、`false` を返すとスキップされます。\
**Custom 条件を設定するには:**

![Custom 条件設定のデモ](/images/conditions/conditions/12714a6-custom_condition2.gif)

:::warning
以下のステップ 5 で HTML 要素をパラメーターとして定義する場合は、先に AUT を開いておく必要があります。手順は次のとおりです: 1. ステップの左側にある **>（矢印）** にカーソルを合わせます。2. **Toggle Breakpoint** をクリックします。3. **Play Scenario** をクリックして、ブレークポイントまでテストを実行します。
:::

1. 条件を追加したいステップにカーソルを合わせ、**Show Properties** をクリックします。\
   右側に **Properties** パネルが開きます。
2. **Properties** パネルで **When to run step** をクリックします。\
   オプションが表示されます。
3. **Custom** を選択します。
4. **Set condition** ウィンドウが開きます。

![Set condition ウィンドウ](/images/conditions/conditions/fc64429-setcondition.png)

5. カスタム条件にパラメーターを使用する場合は、次のように定義します:
- 右側のペインで **+ PARAMS** ボタンをクリックします。
- **JavaScript パラメーター:** ドロップダウンから **JS** を選択し、JavaScript パラメーターを入力します。
- **HTML パラメーター:** ドロップダウンから **HTML** を選択します。ブラウザが開き、ステップに関連するウェブページが表示されます。次の手順を実行します:
- AUT ウィンドウで対象要素にマウスを合わせてクリックし、選択します。選択した要素は **Properties** ペインの **Target Element** ボックスに表示されます。要素の設定を確認・調整するには、[Properties パネルを使用したテストの変更](/docs/editing-tests/editing-your-tests#ステップの追加削除)の手順に従ってください。

![パラメーター追加](/images/conditions/conditions/5eed156-custom2_r.png)

- 選択した要素には自動的に「element」という名前が付けられます。適切な名前を付けるには、編集アイコンをクリックして名前を入力します。

![JS パラメーター設定](/images/conditions/conditions/6939ac9-custom4_r.png)

6. 関数テキストボックスに、JavaScript 条件を入力します。定義したパラメーターがある場合は、条件内でそれらを参照できます。

:::note
HTML パラメーターではなく jQuery などの DOM セレクターを使用する場合、空の配列も truthy として評価されます。そのため、`$(<query>)` ではなく `$(<query>).length` を使用してください。
:::

7. デフォルトのタイムアウト値（30000ms）を変更する場合は、Custom Step の **Properties** ペインで **Override timeout** ボタンをクリックし、任意のタイムアウト値を入力します。

![HTML パラメーター設定](/images/conditions/conditions/4f76e55-custom5_r.png)

8. 戻る矢印をクリックして、メインの Editor ウィンドウに戻ります。

![メインエディターに戻る](/images/conditions/conditions/4df6f82-custom6_r.png)

9. 必要に応じて [拡張条件設定](/docs/editing-tests/conditions/advanced-conditions-settings) でタイムアウト設定を調整します。

:::warning
AUT を開いて HTML 要素をパラメーターとして定義した場合は、グループステップの前の **Toggle Breakpoint** をクリックしてブレークポイントを解除してください。
:::

ステップタイルに菱形アイコンが表示され、条件が追加されたことを確認できます。

### Custom 条件を試してみましょう

[こちらのサンプルテスト](http://bit.ly/2xFTMyW)を開くと、Login グループステップを含むテストが表示されます。Login ボタンのテキストが「Log in」と表示されているときにのみログインステップを実行する Custom 条件を作成してみてください。まず HTML パラメーターを作成して Login ボタンを選択します。次に、条件 `“return loginButton.innerText === 'LOG IN';”` を入力します。

## Never run step 条件の設定

Never (skip) 条件は、テストステップを一時的に無効化しつつ、将来の再利用に備えてステップ自体は保持しておきたい場合に使用します。\
**Never run step 条件を設定するには:**

1. 対象のステップをクリックします。\
   青いボックスでハイライトされます。
2. **Show Properties** をクリックします。\
   右側に **Properties** パネルが開きます。
3. **Properties** パネルで **When to run step** をクリックします。\
   オプションが表示されます。
4. **Never (skip)** を選択します。\
   再設定するまで、テスト実行時にこのステップはスキップされます。菱形アイコンは **When to run step** オプションが有効であることを示します。
