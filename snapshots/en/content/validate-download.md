# Validate download

Validate that the download contents are as expected by executing Node.js scripts from within your tests

The *Validate download* step is a specialized [CLI step](https://help.testim.io/docs/add-cli-validations-and-actions) which allows you to validate that the download content of various file types are as expected. You can check the relevant parameters for each type of file. For example: for csv files, you can check the number of rows and the content; for image files, you can check image type and dimensions; for MS PowerPoint, you can check the number of slides and their content.

> 📘 This is a pro feature
>
> This feature is only open to projects on our professional plan. To learn more about our professional plan, click [here](https://www.testim.io/pricing/).

## Prerequisites

> 📘
>
> This step can run only on either Chrome or Edge Chromium.

* In order to locally run tests which contain CLI action steps, the following command needs to be executed: **npm i -g @testim/testim-cli && testim connect** (see below).
* Tests which include a *Validate download* step require access to file URLs. In order to run these tests, you will need to enable the **Allow access to file URLs** permission in the Testim Editor Chrome extension (see below).
* For tests which include a *Validate download* step for a PDF file, there are two additional prerequisites:
  * Ensure that you are running **Chrome version 67** or above.
  * Ensure that your Chrome browser PDF settings are set to the following: **Download PDF files instead of automatically opening them in Chrome** (see below).

:fa-arrow-right: **To enable the “Download PDFs” permission:**

1. In the Chrome browser, click on the **Chrome menu** (three dots at the top right).
2. Click on **Settings**.
3. Click on **Privacy and security**.
4. Click **Site settings**.
5. Click **Additional content settings**.
6. Click **PDF documents**.
7. Under **default behavior**, make sure **Download PDFs option** is selected.

<Image align="center" src="https://files.readme.io/ae3ceb4-validatedownload1020.gif" />

:fa-arrow-right: **To locally run tests which contain CLI action steps:**

1. Open the **Command Prompt** window for your operating system.
2. In the command prompt, enter the following command: **npm i -g @testim/testim-cli && testim connect**

<Image align="center" width="80%" src="https://files.readme.io/2ab6f86-Testim_164.png" />

3. Wait for the process to execute.

![](https://files.readme.io/84cc9af-Testim_186.png "Testim 186.png")

:fa-arrow-right: **To set your Chrome browser to automatically download PDF files (instead of opening them):**

1. In the Chrome browser, click on the **Chrome menu** (three dots at the top right).

![](https://files.readme.io/8ca2d29-Testim_180a.png "Testim 180a.png")

The **Chrome menu** options are shown.

2. Click on **Settings**.

<Image align="center" width="smart" src="https://files.readme.io/46a37c0-Testim_181a_r.png" />

The **Chrome Settings** page opens.

3. Scroll down to the **Privacy and security** section and click on **Site Settings**.

![](https://files.readme.io/24609eb-Testim_187a.png "Testim 187a.png")

4. Scroll down to the **Additional content settings** section. If the section is not expanded, click on it to expand it.
5. In the **Additional content settings** section, scroll down to **PDF documents** and click on it.

![](https://files.readme.io/dbf04ff-Testim_189a.png "Testim 189a.png")

6. Verify that the **Download PDF files instead of automatically opening them in Chrome** toggle is enabled (to the right). If it isn’t, click it to enable it.

![](https://files.readme.io/2b6f060-Testim_190a.png "Testim 190a.png")

The setting is enabled.

## Adding a *Validate download* step

The general procedure for adding a Validate download step is the same, regardless of what file type you are downloading (e.g. csv, jpg, ppt, doc, etc.). Your code and parameters will change depending on the type of file you are downloading, and the aspect of the file you want to verify. Below is the procedure (using a csv file example), followed by sample code and parameters for the following file types: csv, image, xls, ppt, doc, and pdf.

> 📘
>
> If while recording a test you click on a link to download a file, Testim automatically creates an empty *Validate download step* (named *untitled download validation*) after the *Click*step. To edit this step, double click on the step to open the* Validate Download editor*, and proceed to Step 8 below.

:fa-arrow-right: **To add a Validate download step:**

1. Hover over the :fa-caret-right: **(arrow symbol)** (or **+ symbol** after the final step) where you want to add the validation.

![](https://files.readme.io/2258769-Testim_155a.png "Testim 155a.png")

2. Click on the “**M**” (Testim predefined steps).\
   The **Predefined steps** menu opens.

<Image align="center" width="smart" src="https://files.readme.io/001f998-Testim_134_r.png" />

3. Click on **Validations**.\
   The **Validations** menu expands.

<Image align="center" width="smart" src="https://files.readme.io/75e9d7f-Testim_156_r.png" />

4. Scroll down through the menu and select **Validate download**.

> 📘
>
> Alternatively, you can use the search box at the top of the menu to search for **Validate download**.

The **Add Step** window is shown.

<Image align="center" width="smart" src="https://files.readme.io/f9f35d5-Testim_157_r.png" />

5. In the **Name the new step** field, enter a name for this step.
6. If this is a shared step to be made available to reuse in this or other tests, keep the box next to **Shared step** selected (default), and choose a folder from the **Select shared step** folder list where you want this step stored. Otherwise, deselect the checkbox.\
   For more information about shared steps, see [Groups](https://help.testim.io/docs/groups).
7. Click **Create Step**.\
   The **function** editor opens, and the **Properties** panel opens on the right-hand side.

![](https://files.readme.io/7d6af62-Testim_158.png "Testim 158.png")

8. In the **Properties** panel, in the **Description** field, optionally edit the description of this step. The default description is “*Run download validation*”.
9. Define the parameters you will need for your step as follows:\
   a. In the **Properties** panel, click the **+ PARAMS** button.\
   b. **JS parameter**: If you would like to add a JavaScript parameter, select **JS** from the dropdown list and type in the JavaScript parameter.\
   c. **Package parameter**: If you would like to add an NPM package variable, select **Package** from the dropdown list and type in the package variable.

> 📘
>
> In case your code uses an npm package, make sure NOT to `require` it, but rather replace the `require` line with a PACKAGE parameter in the step properties.

![](https://files.readme.io/0e1debb-CLI_action_param.gif "CLI_action_param.gif")

d. The selected element is automatically named “param” or “packageVariable” (depending on whether you chose a JS parameter or NPM package variable). To assign a relevant name to the parameter/variable, click on the **edit** icon and enter the desired name.

<Image align="center" width="smart" src="https://files.readme.io/75ad16c-Testim_159a_r.png" />

10. In the **function** editor, enter your desired code. If you have defined parameters, you can refer to those parameters in your code.

> 📘
>
> To run async code in the CLI step, you have to return the promise you wish to resolve. Without returning it, the step will run synchronously and will resolve when the last line of code is executed, regardless of the expected results.

![](https://files.readme.io/56c3ce0-Testim_160.png "Testim 160.png")

> 📘
>
> The code and parameters in the example above will check if the downloaded csv file has *237* rows and if the A1 cell contains the text *JURISDICTION NAME*.

11. If you would like to specify what happens if the step fails, click the **When this step fails** down arrow in the **Properties** panel, and choose your desired option. Options are: *Mark error & stop*, *Mark error & continue*, and *Mark warning & continue*.
12. If you would like to control when this step runs (or doesn’t run), click the **When to run step** down arrow in the **Properties** panel, and choose your desired option. For more information, see [Conditions](https://help.testim.io/docs/conditions).
13. If you would like to override the default timeout setting (30000 ms), click on the **Override timeout** button in the **Properties** panel, and enter the desired timeout limit.
14. Click the **back arrow** to return to the main **Editor** window.

![](https://files.readme.io/ae8ec4a-Testim_160a.png "Testim 160a.png")

The step is created.

![](https://files.readme.io/4c6be7f-Testim_161.png "Testim 161.png")

## Validate download examples

### CSV files

You can use the *Validate download* step to perform advanced validations of CSV files such as number of rows and content.\
The code and parameters in this example check if the downloaded csv file consists of *237* rows and if the A1 cell contains the text *JURISDICTION NAME*.

![](https://files.readme.io/daa4195-Testim_160.png "Testim 160.png")

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

### Image files

You can use the *Validate download* step to perform advanced validations of image files such as type and dimensions.\
The code and parameters in this example check if the downloaded image file is named *yellow-cat-cartoon-style-clipart*, is a *jpg*file, and has the dimensions of* 573* (width) X *600* (height).

![](https://files.readme.io/09c48ec-Testim_167.png "Testim 167.png")

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

### MS Excel files

You can use the *Validate download* step to perform advanced validations of Excel files such as number of sheets and sheet names.\
The code and parameters in this example check if the downloaded MS Excel file consists of *3* sheets, with the first one named *Example Test*.

![](https://files.readme.io/aef9e2b-Testim_171.png "Testim 171.png")

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

### MS PowerPoint files

You can use the *Validate download* step to perform advanced validations of PowerPoint files such as number of slides and content.\
The code and parameters in this example check if the downloaded MS PowerPoint file consists of *9* slides, with the word *Department* on the first page and the word *Location* on the second page.

![](https://files.readme.io/4914681-Testim_175.png "Testim 175.png")

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
      <td />

      <td>
        Package
      </td>

      <td>
        \[lodash\@4.17.11]
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

### MS Word files

You can use the *Validate download* step to perform advanced validations of Word files such as content.\
The code and parameters in this example check if the downloaded MS Word file contains the text *Item A*.

![](https://files.readme.io/2775ebe-Testim_178.png "Testim 178.png")

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

### PDF files

You can use the *Validate download* step to perform advanced validations of PDF files such as number of pages and content.\
**Prerequisites**:

* Ensure that you are running **Chrome version 67** or above.
* Ensure that your Chrome browser PDF settings are set to the following: **Download PDF files instead of automatically opening them in Chrome**.

The code and parameters in this example check if the downloaded pdf file consists of *2* pages and contains the text *A Simple PDF file*.

![](https://files.readme.io/2ae00b2-Testim_179.png "Testim 179.png")

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