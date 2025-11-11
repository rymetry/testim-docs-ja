---
title: 'カスタム検証とアクションの追加'
description: '原文: https://help.testim.io/docs/custom-code'
category: '検証'
order: 6
updated: '2025-11-02'
keywords:
  - testim
  - custom-code
  - validations
---
スクリプトを用いて高度な検証を作成する

プリセットのステップメニューに無い独自のアクションや検証を行いたい場合があります。*Add custom validation* ステップや *Add custom action* ステップを使うと、任意のパラメーターと JavaScript コードを入力するカスタムステップを作成できます。カスタムアクションは戻り値を返さずに記述し、カスタム検証は真偽値を返します。*true* を返すと検証は成功、*false* を返すと失敗になります（サンプルは後述）。

## *Add custom validation* / *Add custom action* ステップの追加

検証やアクションの詳細に関わらず、手順は共通です。実際に記述するコードやパラメーターはユースケースに応じて変わります。以下に共通手順と、いくつかの例のコードとパラメーターを示します。

:fa-arrow-right: **Add custom validation / Add custom action を追加するには:**

1. Hover over the :fa-caret-right: **(arrow symbol)** where you want to add the validation.

![3851](/images/validations/custom-code/b5a63dc-Testim_282a.png "Testim 282a.png")

アクションのオプションが表示されます。

![250](/images/validations/custom-code/ba79996-Testim_283a_r.png "Testim 283a_r.png")

2. Click on the “**M**” (Testim predefined steps).\
   **Predefined steps** メニューが開きます。

![200](/images/validations/custom-code/dc5c5d1-Testim_270_r.png "Testim 270_r.png")

3. **Validations**（または **Actions**）をクリックします。\
   **Validations**（または **Actions**）メニューが展開されます。

![200](/images/validations/custom-code/e14660a-Testim_271_r.png "Testim 271_r.png")

4. **Add custom validation**（または **Add custom action**）を選択します。

:::info
メニュー上部の検索ボックスから **Add custom validation** / **Add custom action** を検索することもできます。
:::

**Add Step** ウィンドウが表示されます。

![300](/images/validations/custom-code/4f2e39a-Testim_215_r.png "Testim 215_r.png")

5. **Name the new step** にステップ名を入力します。
6. このステップを共有ステップとして再利用可能にする場合は **Shared step** をオンのままにし（既定）、**Select shared step** のフォルダーを選択します。共有しない場合はオフにします。\
   共有ステップについては [Groups](/docs/groups/groups) を参照してください。
7. **Create Step** をクリックします。\
   **function** エディターと右側の **Properties** パネルが開きます。

![3837](/images/validations/custom-code/5d95f6a-Testim_284.png "Testim 284.png")

8. **Properties** パネルの **Description** に、必要ならステップの説明を入力します（既定: “Run validation” / “Run action”）。
9. ステップに必要なパラメーターを定義します。\
   a. **Properties** パネルで **+ PARAMS** をクリック\
   b. **JS parameter** — ドロップダウンを **JS** にして JavaScript パラメーターを入力\
   c. **HTML parameter** — ドロップダウンを **HTML** にして HTML 要素をパラメーターとして指定（ブラウザーが開き、対象ページが表示されます）。次を実施します：
   * **AUT** ウィンドウで対象要素にマウスを合わせてクリックし、要素を選択します。選択要素は **Properties** の **Target Element** に表示されます。選択要素の確認・置き換え・設定調整は、[Editing Target Element Properties](/docs/steps-editing-tests/editing-target-element-properties) を参照してください。

  d. 追加した要素は “param” または “element” といった既定名になります（JS/HTML の種別によって異なります）。編集アイコンから分かりやすい名前に変更してください。

![250](/images/validations/custom-code/9e53245-Testim_285a_r.png "Testim 285a_r.png")

10. 必要に応じて次を設定します：

* **When this step fails** – ステップ失敗時の動作を指定します。
* **When to run step** – ステップの実行条件を指定します（[Conditions](/docs/conditions/conditions)）。
* **Override timeout** – 既定のタイムアウト（ミリ秒）を上書きします。

11. **function** テキストボックスに JavaScript コードを記述します。定義したパラメーターはコードから参照できます。

:::info
HTML パラメーター以外の DOM セレクター（例: jQuery）を使う場合、空配列は truthy です。`$(<query>)` ではなく `$(<query>).length` を使用してください。
:::

12. 左上の戻る矢印でメインのエディターに戻ります。

![500](/images/validations/custom-code/6565b36-Testim_286a_r.png "Testim 286a_r.png")

:::info
HTML 要素をパラメーターとして選択するために AUT を開いた場合は、**Toggle Breakpoint** をクリックしてブレークポイントを解除してください。
:::

ステップが作成されます。

![3851](/images/validations/custom-code/c26aea9-Testim_287a.png "Testim 287a.png")

### カスタム検証 / アクションの例

#### 数値の検証（Custom validation）

*Add custom validation* を使って、アプリ内の数値を検証します。次の例では、HTML 要素の数値が 1,000 未満であることを確認します。まず文字列から非数値文字を取り除き、数値に変換しています。

![3851](/images/validations/custom-code/142d406-Testim_288.png "Testim 288.png")

**Example Code:**

```javascript
// Remove  string chars (e.g "$") and turn the price label to a number:
var amount = Number(amountLabel.innerText.replace(/[^\-0-9\.]+/g,""));


// Validate if the number is bigger than 1000:
if(amount > 1000) {
  throw new Error('Amount should not be over 1000! Actual value: ' + amount);
} else {
  return true;
}
```

**Example Parameters:**

<Table align={["left","left","left"]}>
  <thead>
    <tr>
      <th>
        Name
      </th>

      <th>
        Type
      </th>

      <th>
        Value
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        amountLabel
      </td>

      <td>
        HTML
      </td>

      <td>
        \{an HTML element containing a numeral}
      </td>
    </tr>
  </tbody>
</Table>

#### テキスト要素の比較（Custom validation）

2 つの要素のテキストを比較する例です。`innerText` が等しければパスし、異なる場合は失敗します。

![3850](/images/validations/custom-code/d866dbe-Testim_289.png "Testim 289.png")

**Example Code:**

```javascript
var equal = firstLabel.innerText === secondLabel.innerText;

if(!equal) {
  throw new Error('Labels are not equal. First label: ' + firstLabel.innerText + 
                  ' Second label: ' + secondLabel.innerText);
}

return equal;
```

**Example Parameters:**

<Table align={["left","left","left"]}>
  <thead>
    <tr>
      <th>
        Name
      </th>

      <th>
        Type
      </th>

      <th>
        Value
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        firstLabel
      </td>

      <td>
        HTML
      </td>

      <td>
        \{an HTML element containing text}
      </td>
    </tr>

    <tr>
      <td>
        secondLabel
      </td>

      <td>
        HTML
      </td>

      <td>
        \{an HTML element containing text}
      </td>
    </tr>
  </tbody>
</Table>

#### Promise による非同期検証（Custom validation）

JavaScript の Promise を使うと、一定時間（ミリ秒）後に resolve / reject するコードを記述できます。真なら resolve されステップはパス、偽なら reject され失敗になります。以下は概念説明のためのシンプルな例（パラメーターは使用しません）。（10 秒後にパスします）

:::info
検証が失敗した場合、`reject()` に渡した文字列はステップのプロパティパネルに表示されます。
:::

![3851](/images/validations/custom-code/ba1832e-Testim_290.png "Testim 290.png")

**Example Code:**

```javascript
return new Promise(function(resolve, reject) {
  setTimeout(function() {
    if(7 === 7) {
      resolve();
    } else {
      reject('');
    }
  }, 10000);
});
```

#### 別サイトへの遷移（Custom action）

*Add custom action* を使って、テストのベース URL から Testim のホームページに遷移する例です。パラメーターは使用しません。

![3851](/images/validations/custom-code/4ec59f8-Testim_291.png "Testim 291.png")

**Example Code:**

```javascript
window.location.href = 'https://testim.io/';
```

:::info{title="Chrome DevTools debugger"}
ローカル実行時のデバッグには Chrome DevTools を活用できます。詳しくは [Chrome DevTools debugger](doc:advanced-debugging-options#3-chrome-devtools-debugger) を参照してください。
:::

:::info
Testim が公開しているカスタムコードのサンプル集は [https://github.com/testimio/custom-actions-examples](https://github.com/testimio/custom-actions-examples) にあります。ガイドラインに従って、ユーザーの皆さまからのサンプルの提供も歓迎しています。
:::

## 同期検証の成功/失敗例

### 成功例

```javascript
// This  validation will always succeed.
return true;
```

```javascript
// This validation will always succeed.
return 5 === 5;
```

### 失敗例

```javascript
// This validation will always fail after it times out.
return 5 === 6;
```

```javascript
// This validation will always fail after it times out.
throw new Error('Validation failed!!!');
```

ステップが失敗すると、エラーは **result** パネルと **Properties** パネルに表示されます（下図）。

![3851](/images/validations/custom-code/5007015-Testim_292.png "Testim 292.png")
