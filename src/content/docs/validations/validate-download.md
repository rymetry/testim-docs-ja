---
title: 'Validate download'
description: '原文: https://help.testim.io/docs/validate-download'
category: '検証'
order: 8
updated: '2025-11-02'
keywords:
  - testim
  - validate-download
  - validations
---
Validate that the download contents are as expected by executing Node.js scripts from within your tests

The *Validate download* step is a specialized [CLI step](/docs/validations/add-cli-validations-and-actions) which allows you to validate that the download content of various file types are as expected. You can check the relevant parameters for each type of file. For example: for csv files, you can check the number of rows and the content; for image files, you can check image type and dimensions; for MS PowerPoint, you can check the number of slides and their content.

> 📘 This is a pro feature
>
> This feature is only open to projects on our professional plan. To learn more about our professional plan, click [here](https://www.testim.io/pricing/).

## Prerequisites

> 📘
>
> このステップは Chrome または Edge Chromium でのみ実行できます。

* In order to locally run tests which contain CLI action steps, the following command needs to be executed: **npm i -g @testim/testim-cli && testim connect** (see below).
* Tests which include a *Validate download* step require access to file URLs. In order to run these tests, you will need to enable the **Allow access to file URLs** permission in the Testim Editor Chrome extension (see below).
* For tests which include a *Validate download* step for a PDF file, there are two additional prerequisites:
  * **Chrome 67** 以上を使用していること
  * Ensure that your Chrome browser PDF settings are set to the following: **Download PDF files instead of automatically opening them in Chrome** (see below).

:fa-arrow-right: **To enable the “Download PDFs” permission:**

1. In the Chrome browser, click on the **Chrome menu** (three dots at the top right).
2. Click on **Settings**.
3. Click on **Privacy and security**.
4. Click **Site settings**.
5. Click **Additional content settings**.
6. Click **PDF documents**.
7. Under **default behavior**, make sure **Download PDFs option** is selected.

![](/images/validations/validate-download/ae3ceb4-validatedownload1020.gif)

:fa-arrow-right: **To locally run tests which contain CLI action steps:**

1. Open the **Command Prompt** window for your operating system.
2. In the command prompt, enter the following command: **npm i -g @testim/testim-cli && testim connect**

![](/images/validations/validate-download/2ab6f86-Testim_164.png)

3. Wait for the process to execute.

![](/images/validations/validate-download/84cc9af-Testim_186.png "Testim 186.png")

:fa-arrow-right: **To set your Chrome browser to automatically download PDF files (instead of opening them):**

1. In the Chrome browser, click on the **Chrome menu** (three dots at the top right).

![](/images/validations/validate-download/8ca2d29-Testim_180a.png "Testim 180a.png")

**Chrome menu** のオプションが表示されます。

2. Click on **Settings**.

![](/images/validations/validate-download/46a37c0-Testim_181a_r.png)

**Chrome Settings** ページが開きます。

3. Scroll down to the **Privacy and security** section and click on **Site Settings**.

![](/images/validations/validate-download/24609eb-Testim_187a.png "Testim 187a.png")

4. Scroll down to the **Additional content settings** section. If the section is not expanded, click on it to expand it.
5. In the **Additional content settings** section, scroll down to **PDF documents** and click on it.

![](/images/validations/validate-download/dbf04ff-Testim_189a.png "Testim 189a.png")

6. Verify that the **Download PDF files instead of automatically opening them in Chrome** toggle is enabled (to the right). If it isn’t, click it to enable it.

![](/images/validations/validate-download/2b6f060-Testim_190a.png "Testim 190a.png")

The setting is enabled.

## Adding a *Validate download* step

The general procedure for adding a Validate download step is the same, regardless of what file type you are downloading (e.g. csv, jpg, ppt, doc, etc.). Your code and parameters will change depending on the type of file you are downloading, and the aspect of the file you want to verify. Below is the procedure (using a csv file example), followed by sample code and parameters for the following file types: csv, image, xls, ppt, doc, and pdf.

> 📘
>
> If while recording a test you click on a link to download a file, Testim automatically creates an empty *Validate download step* (named *untitled download validation*) after the *Click\_step. To edit this step, double click on the step to open the \_Validate Download editor*, and proceed to Step 8 below.

:fa-arrow-right: **To add a Validate download step:**

1. Hover over the :fa-caret-right: **(arrow symbol)** (or **+ symbol** after the final step) where you want to add the validation.

![](/images/validations/validate-download/2258769-Testim_155a.png "Testim 155a.png")

2. Click on the “**M**” (Testim predefined steps).\
   **Predefined steps** メニューが開きます。

![](/images/validations/validate-download/001f998-Testim_134_r.png)

3. Click on **Validations**.\
   **Validations** メニューが展開されます。

![](/images/validations/validate-download/75e9d7f-Testim_156_r.png)

4. Scroll down through the menu and select **Validate download**.

> 📘
>
> メニュー上部の検索ボックスで検索することもできます。

**Add Step** ウィンドウが表示されます。

![](/images/validations/validate-download/f9f35d5-Testim_157_r.png)

5. In the **Name the new step** field, enter a name for this step.
6. If this is a shared step to be made available to reuse in this or other tests, keep the box next to **Shared step** selected (default), and choose a folder from the **Select shared step** folder list where you want this step stored. Otherwise, deselect the checkbox.\
   For more information about shared steps, see [Groups](/docs/groups/groups).
7. **Create Step** をクリックします。\
   **function** エディターが開き、右側に **Properties** パネルが表示されます。

![](/images/validations/validate-download/7d6af62-Testim_158.png "Testim 158.png")

8. **Properties** パネルの **Description** に必要なら説明を入力します（既定: “Run download validation”）。
9. 次の手順で必要なパラメーターを定義します:\
   a. **Properties** パネルで **+ PARAMS** をクリック\
   b. **JS parameter** — ドロップダウンを **JS** にし、JavaScript パラメーターを入力\
   c. **Package parameter** — ドロップダウンを **Package** にし、NPM パッケージ変数を入力

:::warning
コード内で npm パッケージを使用する場合は `require` を書かず、ステップのプロパティで PACKAGE パラメーターとして渡してください。
:::

![](/images/validations/validate-download/0e1debb-CLI_action_param.gif "CLI_action_param.gif")

  d. 追加した項目は “param” または “packageVariable” といった既定名になります。わかりやすい名前にするには **edit** アイコンから変更してください。

![](/images/validations/validate-download/75ad16c-Testim_159a_r.png)

10. **function** エディターにコードを記述します。定義したパラメーターはコード内から参照できます。

:::info
CLI ステップで非同期コードを実行する場合は、解決させたい Promise を return してください。return しない場合は同期的に扱われ、最終行の実行時点で解決されます（期待した結果に関わらず）。
:::

![](/images/validations/validate-download/56c3ce0-Testim_160.png "Testim 160.png")

:::info
上の例のコードとパラメーターは、ダウンロードした CSV の行数が 237 行であること、A1 セルに “JURISDICTION NAME” が含まれることを検証します。
:::

11. If you would like to specify what happens if the step fails, click the **When this step fails** down arrow in the **Properties** panel, and choose your desired option. Options are: *Mark error & stop*, *Mark error & continue*, and *Mark warning & continue*.
12. If you would like to control when this step runs (or doesn’t run), click the **When to run step** down arrow in the **Properties** panel, and choose your desired option. For more information, see [Conditions](/docs/conditions/conditions).
13. If you would like to override the default timeout setting (30000 ms), click on the **Override timeout** button in the **Properties** panel, and enter the desired timeout limit.
14. 左上の戻る矢印でエディターに戻ります。

![](/images/validations/validate-download/ae8ec4a-Testim_160a.png "Testim 160a.png")

ステップが作成されます。

![](/images/validations/validate-download/4c6be7f-Testim_161.png "Testim 161.png")

## Validate download の例

### CSV ファイル

*Validate download* ステップで、行数や内容など CSV の高度な検証ができます。\
以下の例では、CSV の行数が 237 行で、A1 セルに “JURISDICTION NAME” が含まれることを検証します。

![](/images/validations/validate-download/daa4195-Testim_160.png "Testim 160.png")

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

| Name              | Type       | Value               |
| :---------------- | :--------- | :------------------ |
| csv               | Package    | \[csvtojson\@2.0.8] |
| expectedNumOfRows | JavaScript | '237'               |
| expectedText      | JavaScript | 'JURISDICTION NAME' |

### 画像ファイル

*Validate download* ステップで、画像タイプや寸法など画像の高度な検証ができます。\
The code and parameters in this example check if the downloaded image file is named *yellow-cat-cartoon-style-clipart*, is a *jpg\_file, and has the dimensions of \_573* (width) X *600* (height).

![](/images/validations/validate-download/09c48ec-Testim_167.png "Testim 167.png")

**Example Code:**

```javascript
var dimensions = sizeOf(fileBuffer);
var {width, height, type} = dimensions;
console.log("Image dimensions", JSON.stringify(dimensions));

return width === parseInt(expectedWidth) &&
       height === parseInt(expectedHeight) &&
       type === expectedImageType &&
       fileName.includes(expectedName);
```

**Example Parameters:**

| Name              | Type       | Value                              |
| :---------------- | :--------- | :--------------------------------- |
| sizeOf            | Package    | \[image-size\@0.6.3]               |
| expectedName      | JavaScript | 'yellow-cat-cartoon-style-clipart' |
| expectedImageType | JavaScript | 'jpg'                              |
| expectedWidth     | JavaScript | '573'                              |
| expectedHeight    | JavaScript | '600'                              |

### MS Excel ファイル

*Validate download* ステップで、シート数やシート名など Excel の高度な検証ができます。\
以下の例では、シート数が 3、最初のシート名が “Example Test” であることを検証します。

![](/images/validations/validate-download/aef9e2b-Testim_171.png "Testim 171.png")

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

| Name                | Type       | Value           |
| :------------------ | :--------- | :-------------- |
| XLSX                | Package    | \[xlsx\@0.14.1] |
| expectedNumOfSheets | JavaScript | '3'             |
| expectedPageName    | JavaScript | 'Example Test'  |

### MS PowerPoint ファイル

*Validate download* ステップで、スライド数や内容など PowerPoint の高度な検証ができます。\
The code and parameters in this example check if the downloaded MS PowerPoint file consists of *9* slides, with the word \_Department \_on the first page and the word \_Location \_on the second page.

![](/images/validations/validate-download/4914681-Testim_175.png "Testim 175.png")

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
        Docxtemplater
      </td>

      <td>
        Package
      </td>

      <td>
        \[docxtemplater\@3.9.5]
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
        \[jszip\@2.\*]
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
      
     `:0,"text":"Department"},{"slideIndex":1,"text":"Location"}]`
      </td>
    </tr>

    <tr>
      <td>
        
      </td>

      <td>
        Package
      </td>

      <td>
        [lodash\@4.17.11]
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
</Table>

<br />

> 📘
>
> JSZip only supports .docx files and does not work with .doc files. Ensure that you are working with the .docx format when using JSZip for download validation.

### MS Word ファイル

*Validate download* ステップで、内容など Word の高度な検証ができます。\
以下の例では、ダウンロードした Word に “Item A” というテキストが含まれることを検証します。

![](/images/validations/validate-download/2775ebe-Testim_178.png "Testim 178.png")

**Example code:**

```javascript
var zip = new JSZip(fileBuffer);
var doc = new Docxtemplater();

doc.loadZip(zip);
var docxText = doc.getFullText();
console.log("text:", docxText);

return docxText.includes(expectedText);
```

**Example Parameters:**

| Name          | Type       | Value                   |
| :------------ | :--------- | :---------------------- |
| Docxtemplater | Package    | \[docxtemplater\@3.9.5] |
| JSZip         | Package    | \[jszip\@2.\*]          |
| expectedText  | JavaScript | 'Item A'                |

<br />

> 📘
>
> JSZip only supports .docx files and does not work with .doc files. Ensure that you are working with the .docx format when using JSZip for download validation.

### PDF ファイル

You can use the \_Validate download \_step to perform advanced validations of PDF files such as number of pages and content.\
**前提条件**:

* **Chrome 67** 以上を使用していること
* Chrome の PDF 設定で **Download PDF files instead of automatically opening them in Chrome** を有効にしていること

以下の例では、PDF のページ数が 2、テキスト “A Simple PDF file” が含まれることを検証します。

![](/images/validations/validate-download/2ae00b2-Testim_179.png "Testim 179.png")

**Example code:**

```javascript
return pdf(fileBuffer).then((data) => {
  const {numpages, text} = data;
  // number of pages
  console.log("numpages", numpages);
  // PDF text
  console.log("text", text);
  if(numpages !== parseInt(expectedNumOfPages)) {
    return Promise.reject(new Error(`Invalid number of pages: ${numpages}`));
  }
  if(!text.includes(expectedText)) {
    return Promise.reject(new Error(`Invalid pdf text: ${text}`));
  }
});
```

**Example Parameters:**

| Name               | Type       | Value                |
| :----------------- | :--------- | :------------------- |
| pdf                | Package    | \[pdf-parse\@latest] |
| expectedNumOfPages | JavaScript | '2'                  |
| expectedText       | JavaScript | 'A Simple PDF File'  |
