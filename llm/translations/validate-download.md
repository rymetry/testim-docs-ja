Node.js スクリプトを用いて、ダウンロードしたファイルの内容が期待どおりであることを検証する

*Validate download* は [CLI ステップ](/docs/validations/add-cli-validations-and-actions) の一種で、各種ファイルのダウンロード内容を検証できます。ファイル種別ごとに適切なパラメーターで確認します。例えば CSV では行数や内容、画像ではタイプや寸法、PowerPoint ではスライド数や各スライドの内容、などを検証できます。

:::note
これは Professional プランの機能です。詳細は [pricing](https://www.testim.io/pricing/) を参照してください。
:::

## 前提条件

:::note
このステップは Chrome または Edge Chromium でのみ実行できます。
:::

* CLI アクションを含むテストをローカル実行するには、`npm i -g @testim/testim-cli && testim connect` を実行します。
* *Validate download* を含むテストはファイル URL へのアクセスが必要です。Testim Editor の Chrome 拡張で **Allow access to file URLs** を有効にしてください。
* PDF の検証を行う場合は、次の追加前提があります：
  * **Chrome 67** 以上を使用していること
  * Chrome の PDF 設定で **Download PDF files instead of automatically opening them in Chrome** を有効にしていること

:fa-arrow-right: **「Download PDFs」権限を有効にするには:**

1. Chrome の **メニュー（三点）** → **Settings** を開きます。
2. **Privacy and security** をクリック。
3. **Site settings** をクリック。
4. **Additional content settings** → **PDF documents** を開きます。
5. **Download PDF files instead of automatically opening them in Chrome** をオンにします。

![](/images/validations/validate-download/ae3ceb4-validatedownload1020.gif)

:fa-arrow-right: **CLI アクションを含むテストをローカル実行するには:**

1. 端末を開きます。
2. `npm i -g @testim/testim-cli && testim connect` を実行します。

![](/images/validations/validate-download/2ab6f86-Testim_164.png)

3. 完了を待ちます。

![](/images/validations/validate-download/84cc9af-Testim_186.png "Testim 186.png")

:fa-arrow-right: **PDF を自動表示せずダウンロードに切り替えるには（Chrome）:**

1. Chrome の **メニュー（三点）** をクリック。

![](/images/validations/validate-download/8ca2d29-Testim_180a.png "Testim 180a.png")

2. **Settings** → **Privacy and security** → **Site Settings**。

![](/images/validations/validate-download/46a37c0-Testim_181a_r.png)

3. **Additional content settings** → **PDF documents** で、**Download PDF files instead of automatically opening them in Chrome** をオンにします。

![](/images/validations/validate-download/2b6f060-Testim_190a.png "Testim 190a.png")

## Validate download ステップの追加

ダウンロード対象（csv / jpg / ppt / doc / pdf など）によらず、追加手順は共通です。検証のコードとパラメーターは、対象ファイル種別と検証観点に応じて変わります。以下に CSV を例に手順を示し、その後に CSV / 画像 / XLS / PPT / DOC / PDF のサンプルコードとパラメーターを記載します。

:::note
記録中にファイルダウンロードのリンクをクリックすると、*Click* の直後に空の *Validate download* ステップ（untitled download validation）が自動挿入されます。ダブルクリックで *Validate Download editor* を開き、後述の手順 8 以降を実施してください。
:::

:fa-arrow-right: **Validate download ステップを追加するには:**
