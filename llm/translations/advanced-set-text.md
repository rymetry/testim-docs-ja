JavaScript とパラメーターを組み合わせて動的なテキストを設定する

**Set text** ステップ（テキスト入力）のあるテストを記録した後、記録時に入力した固定テキストを動的文字列に置き換えられます。動的文字列には JavaScript 式や、あらかじめ作成済みのパラメーターを含めることができます。より高度な活用例については [Data-driven testing](/docs/data-driven-testing/data-driven-testing) を参照してください。

## JavaScript 式でテキストを設定する

:fa-arrow-right: **JavaScript 式でテキストを設定するには:**

1. 変更したい **Set text** ステップ（例: Set username）にカーソルを合わせ、**Show Properties**（:fa-cog:）をクリックします。

![3851](/images/test-utilities/advanced-set-text/29a0765-Testim_229a.png "Testim 229a.png")

   右側に **Properties** パネルが表示されます。

![200](/images/test-utilities/advanced-set-text/dab7248-Testim_230_r.png "Testim 230_r.png")

2. **Text to assign** フィールドの固定テキストを JavaScript 式に置き換えます。\
   例）一意なユーザー名を設定するには、`'user' + Date.now()` とします。この式は文字列 'user' に、1970-01-01 00:00:00 UTC からの経過ミリ秒を連結します。\
   **Text to assign** には、文字列（シングルまたはダブルクォート）、JavaScript 式、既存の変数、またはそれらの組み合わせ（プラス記号で連結）を指定できます。

:::info
変数や JavaScript 式はクォートで囲まないでください。
:::

テスト実行時、画面の入力欄には式の評価結果（例: `user1619013809723`）が入力されます。

![1920](/images/test-utilities/advanced-set-text/b3181bc-set_text.gif "set_text.gif")

## パラメーターでテキストを設定する

パラメーターをテキストとして使用するには、事前に別ステップや別テストで作成されている必要があります。詳細は [Parameters](/docs/parameters/parameters) を参照してください。

:fa-arrow-right: **パラメーターでテキストを設定するには:**

1. 変更したい **Set text** ステップ（例: Set username）にカーソルを合わせ、**Show Properties**（:fa-cog:）をクリックします。

![3838](/images/test-utilities/advanced-set-text/f4b65c5-Testim_231a.png "Testim 231a.png")

   右側に **Properties** パネルが表示されます。

![200](/images/test-utilities/advanced-set-text/6dc9ca3-Testim_232_r.png "Testim 232_r.png")

2. **Text to assign** フィールドの固定テキストを、作成済みのパラメーターに置き換えます。\
   **Text to assign** には、文字列（シングルまたはダブルクォート）、JavaScript 式、既存の変数、またはそれらの組み合わせ（プラス記号で連結）を指定できます。

:::info
変数や JavaScript 式はクォートで囲まないでください。
:::

テスト実行時、画面の入力欄には指定したパラメーターの値が入力されます。
