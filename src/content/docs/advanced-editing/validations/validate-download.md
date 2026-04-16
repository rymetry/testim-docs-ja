---
title: ダウンロード検証
description: ダウンロードしたファイルの内容を検証する CLI ステップ。CSV、PDF、画像などのファイル形式に対応し、ファイルの内容や属性を確認できる PRO機能です。
category: 高度な編集
order: 5009
updated: '2025-09-23'
sourceUrl: 'https://docs.tricentis.com/testim/content/advanced-editing/validations/validate-download.htm'
keywords:
  - ダウンロード検証
  - ファイル検証
  - CSV
  - PDF
  - 画像検証
  - Node.js
  - CLI ステップ
  - ファイル内容
  - PRO機能
  - ファイルチェック
---

_Validate download_ ステップは専用の [CLI ステップ](/docs/advanced-editing/validations/add-cli-validations-and-actions)で、さまざまなファイル形式のダウンロード内容が期待通りであることを検証できます。各ファイル形式に関連するパラメーターをチェックできます。例：CSV ファイルの場合は行数と内容をチェック、画像ファイルの場合は画像タイプと寸法をチェック、MS PowerPoint の場合はスライド数とその内容をチェックできます。

:::note{title="これはPRO機能です"}
この機能は Professional plan のプロジェクトでのみ利用できます。
:::

## 前提条件

:::note
このステップは Chrome または Edge Chromium でのみ実行できます。
:::

- CLI アクションステップを含むテストをローカルで実行するには、次のコマンドを実行する必要があります：**npm i -g @testim/testim-cli && testim connect**（下記参照）。

_Validate download_ ステップを含むテストにはファイル URL へのアクセスが必要です。これらのテストを実行するには、Testim Editor Chrome 拡張機能で **Allow access to file URLs** 権限を有効にする必要があります（下記参照）。

PDF ファイルの _Validate download_ ステップを含むテストには、さらに 2 つの前提条件があります：

- **Chrome 67** 以上を使用していること
- Chrome ブラウザの PDF 設定が次のように設定されていることを確認してください：**Download PDF files instead of automatically opening them in Chrome**（下記参照）。

**「Download PDFs」権限を有効にするには：**

1. Chrome ブラウザで、**Chrome メニュー**（右上の三点リーダー）をクリックします。
2. **Settings** をクリックします。
3. **Privacy and security** をクリックします。
4. **Site settings** をクリックします。
5. **Additional content settings** をクリックします。
6. **PDF documents** をクリックします。
7. **default behavior** で、**Download PDFs option** が選択されていることを確認します。

![Chrome PDF 設定の手順アニメーション](/images/validations/validate-download/ae3ceb4-validatedownload1020.gif)

**CLI アクションステップを含むテストをローカルで実行するには：**

1. お使いのオペレーティングシステムの **コマンドプロンプト** ウィンドウを開きます。
2. コマンドプロンプトで次のコマンドを入力します：**npm i -g @testim/testim-cli && testim connect**

![コマンドプロンプトでの CLI 接続コマンド入力](/images/validations/validate-download/2ab6f86-Testim_164.png)

3. プロセスの実行が完了するまで待ちます。

![CLI コマンド実行中の画面](/images/validations/validate-download/84cc9af-Testim_186.png)

**Chrome ブラウザで PDF ファイルを自動的にダウンロードするように設定するには（開く代わりに）：**

1. Chrome ブラウザで、**Chrome メニュー**（右上の三点リーダー）をクリックします。

![Chrome メニューの表示](/images/validations/validate-download/8ca2d29-Testim_180a.png)

**Chrome menu** のオプションが表示されます。

2. **Settings** をクリックします。

![Chrome 設定画面](/images/validations/validate-download/46a37c0-Testim_181a_r.png)

**Chrome Settings** ページが開きます。

3. **Privacy and security** セクションまでスクロールし、**Site Settings** をクリックします。

![プライバシーとセキュリティのサイト設定](/images/validations/validate-download/24609eb-Testim_187a.png)

4. **Additional content settings** セクションまでスクロールします。セクションが展開されていない場合は、クリックして展開します。
5. **Additional content settings** セクションで、**PDF documents** までスクロールしてクリックします。

![追加のコンテンツ設定セクション](/images/validations/validate-download/dbf04ff-Testim_189a.png)

6. **Download PDF files instead of automatically opening them in Chrome** トグルが有効（右側）になっていることを確認します。有効でない場合は、クリックして有効にします。

![PDF ダウンロード設定のトグル](/images/validations/validate-download/2b6f060-Testim_190a.png)

設定が有効になります。

## **Validate download** ステップの追加

Validate download ステップを追加する一般的な手順は、ダウンロードするファイル形式（csv、jpg、ppt、doc など）に関わらず同じです。コードとパラメーターは、ダウンロードするファイルの種類や検証したい属性に応じて変わります。以下の手順（CSV ファイルを例として）の後に、次のファイル形式のサンプルコードとパラメーターを示します:csv、image、xls、ppt、doc、pdf。

:::note
テストの記録中にファイルをダウンロードするリンクをクリックすると、Testim は _Click_ ステップの後に空の _Validate download ステップ_（_untitled download validation_ という名前）を自動的に作成します。このステップを編集するには、ステップをダブルクリックして _Validate Download エディター_ を開き、以下の手順 8 に進んでください。
:::

**Validate download ステップを追加するには:**

1. 検証を追加したい位置の **（矢印記号）**（または最終ステップの後の **+ 記号**）にカーソルを合わせます。

![テストステップの追加位置](/images/validations/validate-download/2258769-Testim_155a.png)

2. 「**M**」（Testim 定義済みステップ）をクリックします。\
   **Predefined steps** メニューが開きます。

![Testim 定義済みステップメニュー](/images/validations/validate-download/001f998-Testim_134_r.png)

3. **Validations** をクリックします。\
   **Validations** メニューが展開されます。

![Validate download ステップの選択](/images/validations/validate-download/75e9d7f-Testim_156_r.png)

4. メニューをスクロールして **Validate download** を選択します。

:::note
メニュー上部の検索ボックスで検索することもできます。
:::

**Add Step** ウィンドウが表示されます。

![追加された Validate download ステップ](/images/validations/validate-download/f9f35d5-Testim_157_r.png)

5. **Name the new step** フィールドに、このステップの名前を入力します。
6. このステップをこのテストまたは他のテストで再利用可能な共有ステップにする場合は、**Shared step** の横のチェックボックスを選択したまま（デフォルト）にし、**Select shared step** フォルダーリストからこのステップを保存するフォルダーを選択します。そうでない場合は、チェックボックスの選択を解除します。\
   共有ステップの詳細については [Groups](/docs/editing-tests/groups) を参照してください。
7. **Create Step** をクリックします。\
   **function** エディターが開き、右側に **Properties** パネルが表示されます。

![Validate download エディター画面](/images/validations/validate-download/7d6af62-Testim_158.png)

8. **Properties** パネルの **Description** に必要なら説明を入力します（既定: “Run download validation”）。
9. 次の手順で必要なパラメーターを定義します:\
   a. **Properties** パネルで **+ PARAMS** をクリック\
   b. **JS parameter** — ドロップダウンを **JS** にし、JavaScript パラメーターを入力\
   c. **Package parameter** — ドロップダウンを **Package** にし、NPM パッケージ変数を入力

:::warning
コード内で npm パッケージを使用する場合は `require` を書かず、ステップのプロパティで PACKAGE パラメーターとして渡してください。
:::

![パラメーター編集のアニメーション](/images/validations/validate-download/0e1debb-CLI_action_param.gif)

d. 追加した項目は “param” または “packageVariable” といった既定名になります。わかりやすい名前にするには **edit** アイコンから変更してください。

![パラメーター設定画面](/images/validations/validate-download/75ad16c-Testim_159a_r.png)

10. **function** エディターにコードを記述します。定義したパラメーターはコード内から参照できます。

:::info
CLI ステップで非同期コードを実行する場合は、解決させたい Promise を return してください。return しない場合は同期的に扱われ、最終行の実行時点で解決されます（期待した結果に関わらず）。
:::

![npm パッケージのインストールコード例](/images/validations/validate-download/56c3ce0-Testim_160.png)

:::info
上の例のコードとパラメーターは、ダウンロードした CSV の行数が 237 行であること、A1 セルに “JURISDICTION NAME” が含まれることを検証します。
:::

11. ステップが失敗した場合の動作を指定するには、**Properties** パネルの **When this step fails** の下矢印をクリックし、希望するオプションを選択します。オプション: _Mark error & stop_、_Mark error & continue_、_Mark warning & continue_。
12. このステップの実行条件を制御するには、**Properties** パネルの **When to run step** の下矢印をクリックし、希望するオプションを選択します。詳細については、[Conditions](/docs/editing-tests/conditions) を参照してください。
13. デフォルトのタイムアウト設定（30000ms）を上書きするには、**Properties** パネルの **Override timeout** ボタンをクリックし、希望するタイムアウト値を入力します。
14. 左上の戻る矢印でエディターに戻ります。

![CSV ファイル検証のコード例](/images/validations/validate-download/ae8ec4a-Testim_160a.png)

ステップが作成されます。

![Validate download ステップの作成完了](/images/validations/validate-download/4c6be7f-Testim_161.png)

## Validate download の例

### CSV ファイル

_Validate download_ ステップで、行数や内容など CSV の高度な検証ができます。\
以下の例では、CSV の行数が 237 行で、A1 セルに "JURISDICTION NAME" が含まれることを検証します。

![Excel ファイル検証用パッケージのインストール](/images/validations/validate-download/daa4195-Testim_160.png)

**Example Code:**

```text
const csvStr = fileBuffer.toString("utf8");
return csv({
  noheader: true,
  output: "csv"
})
  .fromString(csvStr)
  .then(csvRow => {
    // Number of rows in CSV
   console.log("Number of rows in CSV: ", csvRow.length);
    // Value in  csvRow[0][0] in CSV
   console.log("Value in  csvRow[0][0] in CSV: ", csvRow[0][0]);
    if (csvRow.length !== parseInt(expectedNumOfRows)) {
      return Promise.reject(
        new Error(`Number of rows doesn't match ${csvRow.length}`)
      );
    }
    if (csvRow[0][0] !== expectedText) {

      return Promise.reject(
        new Error(`Failed to find expected text ${csvRow[0][0]}`)
      );
    }
  });
```

**Example Parameters:**

<table class="md-table md-table-3cols">
 <thead>
  <tr>
   <th style="text-align: left;">
    Name
   </th>
   <th style="text-align: left;">
    Type
   </th>
   <th style="text-align: left;">
    Value
   </th>
  </tr>
 </thead>
 <tbody>
  <tr>
   <td style="text-align: left;">
    csv
   </td>
   <td style="text-align: left;">
    Package
   </td>
   <td style="text-align: left;">
    [csvtojson@2.0.8]
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    expectedNumOfRows
   </td>
   <td style="text-align: left;">
    JavaScript
   </td>
   <td style="text-align: left;">
    '237'
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    expectedText
   </td>
   <td style="text-align: left;">
    JavaScript
   </td>
   <td style="text-align: left;">
    'JURISDICTION NAME'
   </td>
  </tr>
 </tbody>
</table>

### 画像ファイル

_Validate download_ ステップで、画像タイプや寸法など画像の高度な検証ができます。\
以下の例では、ダウンロードした画像ファイルの名前が _yellow-cat-cartoon-style-clipart_、ファイル形式が _jpg_、寸法が _573_（幅）X _600_（高さ）であることをチェックします。

![Excel ファイル検証のコード例](/images/validations/validate-download/09c48ec-Testim_167.png)

**Example Code:**

```javascript
var dimensions = sizeOf(fileBuffer);
var { width, height, type } = dimensions;
console.log('Image dimensions', JSON.stringify(dimensions));

return (
  width === parseInt(expectedWidth) &&
  height === parseInt(expectedHeight) &&
  type === expectedImageType &&
  fileName.includes(expectedName)
);
```

**Example Parameters:**

<table class="md-table md-table-3cols">
 <thead>
  <tr>
   <th style="text-align: left;">
    Name
   </th>
   <th style="text-align: left;">
    Type
   </th>
   <th style="text-align: left;">
    Value
   </th>
  </tr>
 </thead>
 <tbody>
  <tr>
   <td style="text-align: left;">
    sizeOf
   </td>
   <td style="text-align: left;">
    Package
   </td>
   <td style="text-align: left;">
    [image-size@0.6.3]
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    expectedName
   </td>
   <td style="text-align: left;">
    JavaScript
   </td>
   <td style="text-align: left;">
    'yellow-cat-cartoon-style-clipart'
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    expectedImageType
   </td>
   <td style="text-align: left;">
    JavaScript
   </td>
   <td style="text-align: left;">
    'jpg'
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    expectedWidth
   </td>
   <td style="text-align: left;">
    JavaScript
   </td>
   <td style="text-align: left;">
    '573'
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    expectedHeight
   </td>
   <td style="text-align: left;">
    JavaScript
   </td>
   <td style="text-align: left;">
    '600'
   </td>
  </tr>
 </tbody>
</table>

### MS Excel ファイル

_Validate download_ ステップで、シート数やシート名など Excel の高度な検証ができます。\
以下の例では、シート数が 3、最初のシート名が “Example Test” であることを検証します。

![PowerPoint 検証用パッケージのインストール](/images/validations/validate-download/aef9e2b-Testim_171.png)

**Example code:**

```text
const { SheetNames, Sheets } = XLSX.read(fileBuffer);
const sheet = SheetNames[0];

if (SheetNames.length !== parseInt(expectedNumOfSheets)) {
  throw new Error(`Failed to validate: Number of sheets doesn't match "${expectedNumOfSheets}"`);
}

if (sheet !== expectedPageName) {
  throw new Error(`Failed to validate: Sheet 1 name doesn't match "${expectedPageName}"`);
}
```

**Example Parameters:**

<table class="md-table md-table-3cols">
 <thead>
  <tr>
   <th style="text-align: left;">
    Name
   </th>
   <th style="text-align: left;">
    Type
   </th>
   <th style="text-align: left;">
    Value
   </th>
  </tr>
 </thead>
 <tbody>
  <tr>
   <td style="text-align: left;">
    XLSX
   </td>
   <td style="text-align: left;">
    Package
   </td>
   <td style="text-align: left;">
    [xlsx@0.14.1]
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    expectedNumOfSheets
   </td>
   <td style="text-align: left;">
    JavaScript
   </td>
   <td style="text-align: left;">
    '3'
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    expectedPageName
   </td>
   <td style="text-align: left;">
    JavaScript
   </td>
   <td style="text-align: left;">
    'Example Test'
   </td>
  </tr>
 </tbody>
</table>

### MS PowerPoint ファイル

_Validate download_ ステップで、スライド数や内容など PowerPoint の高度な検証ができます。\
以下の例では、ダウンロードした MS PowerPoint ファイルのスライド数が _9_ で、最初のページに _Department_、2 ページ目に _Location_ という単語が含まれていることをチェックします。

![PowerPoint ファイル検証のコード例](/images/validations/validate-download/4914681-Testim_175.png)

**Example code:**

```text
var zip = new JSZip(fileBuffer);
var doc = new Docxtemplater();
doc.loadZip(zip);
const slides = Object.keys(doc.zip.files).filter(
  fileName =>
    _.startsWith(fileName, "ppt/slides/") && _.endsWith(fileName, ".xml")
);
console.log("Num of slides:", slides.length);

if (slides.length !== parseInt(excpectedNumOfSlides)) {
  return false;
}

expectedText = JSON.parse(expectedText);

expectedText.forEach(item => {
  const { slideIndex, text } = item;
  const slideText = doc.getFullText(slides[slideIndex]);
  if (!slideText.includes(text)) {
    throw new Error(`Failed to find ${text} in slide index: ${slideIndex}`);
  }
});
```

**Example Parameters:**

<table class="md-table md-table-3cols">
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
    Docxtemplater
   </td>
   <td>
    Package
   </td>
   <td>
    [docxtemplater@3.9.5]
   </td>
  </tr>
  <tr>
   <td>
    JSZip
   </td>
   <td>
    Package
   </td>
   <td>
    [jszip@2.*]
   </td>
  </tr>
  <tr>
   <td>
    expectedText
   </td>
   <td>
    JavaScript
   </td>
   <td>
    <code>
     :0,"text":"Department"},{"slideIndex":1,"text":"Location"}]
    </code>
   </td>
  </tr>
  <tr>
   <td>
   </td>
   <td>
    Package
   </td>
   <td>
    [lodash@4.17.11]
   </td>
  </tr>
  <tr>
   <td>
    excpectedNumOfSlides
   </td>
   <td>
    JavaScript
   </td>
   <td>
    '9'
   </td>
  </tr>
 </tbody>
</table>

:::note
JSZip は .docx ファイルのみをサポートしており、.doc ファイルには対応していません。JSZip を使用したダウンロード検証では、.docx 形式を使用してください。
:::

### MS Word ファイル

_Validate download_ ステップで、内容など Word の高度な検証ができます。\
以下の例では、ダウンロードした Word に “Item A” というテキストが含まれることを検証します。

![Word ファイル検証のコード例](/images/validations/validate-download/2775ebe-Testim_178.png)

**Example code:**

```javascript
var zip = new JSZip(fileBuffer);
var doc = new Docxtemplater();

doc.loadZip(zip);
var docxText = doc.getFullText();
console.log('text:', docxText);

return docxText.includes(expectedText);
```

**Example Parameters:**

<table class="md-table md-table-3cols">
 <thead>
  <tr>
   <th style="text-align: left;">
    Name
   </th>
   <th style="text-align: left;">
    Type
   </th>
   <th style="text-align: left;">
    Value
   </th>
  </tr>
 </thead>
 <tbody>
  <tr>
   <td style="text-align: left;">
    Docxtemplater
   </td>
   <td style="text-align: left;">
    Package
   </td>
   <td style="text-align: left;">
    [docxtemplater@3.9.5]
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    JSZip
   </td>
   <td style="text-align: left;">
    Package
   </td>
   <td style="text-align: left;">
    [jszip@2.*]
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    expectedText
   </td>
   <td style="text-align: left;">
    JavaScript
   </td>
   <td style="text-align: left;">
    'Item A'
   </td>
  </tr>
 </tbody>
</table>

:::note
JSZip は .docx ファイルのみをサポートしており、.doc ファイルには対応していません。JSZip を使用したダウンロード検証では、.docx 形式を使用してください。
:::

### PDF ファイル

_Validate download_ ステップで、ページ数や内容など PDF の高度な検証ができます。

**前提条件**:

- **Chrome 67** 以上を使用していること
- Chrome の PDF 設定で **Download PDF files instead of automatically opening them in Chrome** を有効にしていること

以下の例では、PDF のページ数が 2、テキスト "A Simple PDF file" が含まれることを検証します。

![PDF ファイル検証のコード例](/images/validations/validate-download/2ae00b2-Testim_179.png)

**Example code:**

```javascript
return pdf(fileBuffer).then((data) => {
  const { numpages, text } = data;
  // number of pages
  console.log('numpages', numpages);
  // PDF text
  console.log('text', text);
  if (numpages !== parseInt(expectedNumOfPages)) {
    return Promise.reject(new Error(`Invalid number of pages: ${numpages}`));
  }
  if (!text.includes(expectedText)) {
    return Promise.reject(new Error(`Invalid pdf text: ${text}`));
  }
});
```

**Example Parameters:**

<table class="md-table md-table-3cols">
 <thead>
  <tr>
   <th style="text-align: left;">
    Name
   </th>
   <th style="text-align: left;">
    Type
   </th>
   <th style="text-align: left;">
    Value
   </th>
  </tr>
 </thead>
 <tbody>
  <tr>
   <td style="text-align: left;">
    pdf
   </td>
   <td style="text-align: left;">
    Package
   </td>
   <td style="text-align: left;">
    [pdf-parse@latest]
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    expectedNumOfPages
   </td>
   <td style="text-align: left;">
    JavaScript
   </td>
   <td style="text-align: left;">
    '2'
   </td>
  </tr>
 </tbody>
</table>

| expectedText       | JavaScript | 'A Simple PDF File'  |
