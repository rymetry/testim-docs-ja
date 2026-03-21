# Document Validation

Validate the contents of a downloaded PDF file

> 📘 Salesforce Step
>
> This is a Salesforce step.

The Document Validation step can be used to validate and/or extract the contents of the PDF document using a variety of conditions that can be configured without coding. The step can be  automatically recorded or manually added from the list of predefined steps. The automatic option is generated during the recording of the test when a PDF file is downloaded.

The following conditions and actions can be performed using this step:

* **Existence check:** Verify the presence of specific text within the PDF.
* **Non-existence check:** Confirm the absence of certain text.
* **Key-value pair verification:** Validate the correctness of key-value pairs within the PDF.
* **Table content validation:** Ensure data accuracy within tables embedded in the PDF.
* **Extract content into variables:** Extract the content from key-value pairs or tables into variables  for later use in subsequent steps

## Before you begin

In order for the step to work you will need to configure the following settings:

* **Enable the Download PDFs setting on your Chrome  Browser:** The setting is located at - **Settings > Privacy and security > Site settings > Additional content settings > PDF documents**. Under **Default behavior** make sure the **Download PDFs** option is selected.

  <Image align="center" src="https://files.readme.io/e31ed48-downloadpdfssetting.png" />
* **Enable Access to file URLs  in the Testim Editor extension settings** - enable the Allow access to file URLs  setting in the Testim Editor Extension, as explained below.

:fa-arrow-right:**To enable the Allow access to file URLs setting:**

1. In Chrome Browser, click the **Extensions** icon.

   <Image align="center" src="https://files.readme.io/4c1e0c1-extensionsicon.png" />
2. Click **Manage Extensions**.

   <Image align="center" src="https://files.readme.io/f1de3d3-manageextensions.png" />
3. In the **Testim Editor** extension, click **Details**.

   <Image align="center" src="https://files.readme.io/1708299-details.png" />
4. Enable the **Allow access to file URLs** setting.

   <Image align="center" src="https://files.readme.io/3eac5c9-allowaccess.png" />

## Creating the Document Validation step automatically

The step is created automatically during the recording of the test when a PDF file is downloaded.

:fa-arrow-right:**To add a document validation step automatically:**

1. Record a test using the Recorder and during the recording of the test click a link to download a PDF file.\
   A **Document Validation** step is automatically created.
2. Select the **Document Validation** step.\
   The step's **Object Pane** is displayed. All conditions/actions are optional and it is possible to configure multiple conditions, which will be aggregated to validate the step (AND condition between them) see detailed configuration instructions for each condition/action below:

   * **Content** - performs existence or non-existence checks.
   * **Key Value** - performs key-value pair verification and extraction of content into variables.
   * **Tables** - performs table content validation and extraction of content into variables.

<Image align="center" src="https://files.readme.io/052b47f-documentvalidation1.png" />

3. Edit the conditions/actions as explained below.
4. Click **Save**.

## Creating the Document Validation step manually

It is possible to add the Document Validation step manually. The step will have to follow a step that would prompt the PDF download, such as an **Add navigation action** step or an **Add API action** step.

:fa-arrow-right:**To add a document validation step manually:**

1. In the editor, add a step by clicking the **+** button.
2. Under the **Salesforce** steps tab, click **Common operations** and select **Document validation** step.\
   The step's **Object Pane** is displayed. All conditions/actions are optional and it is possible to configure multiple conditions, which will be aggregated to validate the step (AND condition between them) see detailed configuration instructions for each condition/action below:
   * **Content** - performs existence or non-existence checks.
   * **Key Value** - performs key-value pair verification and extraction of content into variables.
   * **Tables** - performs table content validation and extraction of content into variables.

<Image align="center" src="https://files.readme.io/052b47f-documentvalidation1.png" />

3. Edit the conditions/actions as explained below.
4. Click **Save**.

# Configuring the Content validation

:fa-arrow-right:**To configure the Content validation:**

1. In the **Content** section, click **ADD**.

   The condition/action configuration section is displayed:

   <Image align="center" src="https://files.readme.io/734197c-contentcondition.png" />

2. In the **Verify** field, select one of the following:
   1. **Exists** - to validate whether the specified text exists within the PDF document.
   2. **Not Exists** - to validate that a specified text does not exist within the PDF document.

3. In the **Value** field, enter the string that you want to validate its existence or non-existence.\
   The following example checks the the non-existence of the string.

   <Image align="center" src="https://files.readme.io/8cd3a51-Picture1.png" />

4. To add additional conditions, click the **ADD** button again and repeat the steps above.

# Configuring the Key Value validation

This condition validates that the key and value string combination exists in the PDF.

:fa-arrow-right:**To configure the Key Value validation:**

1. In the **Key Value** section, click **ADD**.

   The condition/action configuration section is displayed:

   <Image align="center" src="https://files.readme.io/610592d-keyvalue.png" />
2. In the **Key** field, enter a combination of a label and a separator. A label is a text string and a separator, can be any symbol such as a colon, semi-colon, dash, hash, comma, etc. For example \`Address:\` is a key for an address field in the PDF.
3. In the **Action** field, select the **Verify** option (checkmark icon).
4. In the **Value** field, enter the string that you want to validate its existence following the specified Key string.\
   The following example checks the existence of two key value pairs.

   <Image align="center" src="https://files.readme.io/866d74b-Picture3.png" />
5. To add additional conditions, click the **ADD** button again and repeat the steps above.

# Configuring the Key Value extraction

This condition extracts the value that appears following the Key string and stores it in a variable defined in the **Value** field. The variable can be a variable that was defined in the previous steps or it can be created ad hoc, which means that when the step is executed, the variable is created with the name specified in the **Value** field.

:fa-arrow-right:**To configure the Key Value extraction:**

1. In the **Key Value** section, click **ADD**.

   The condition/action configuration section is displayed:

   <Image align="center" src="https://files.readme.io/610592d-keyvalue.png" />
2. In the **Key** field, enter a combination of a label and a separator. A label is a text string and a separator, can be any symbol such as a colon, semi-colon, dash, hash, comma, etc. For example \`Address:\` is a key for an address field in the PDF.
3. In the **Action** field, select the **Store** option (x icon).
4. In the **Value** field, enter the name of the variable that will be created or that was defined in a previous step. The value following the Key string will be stored in this variable.\
   The following example will extract the value in the PDF that comes after the `Quote #` key and store it in a variable called `quoteNumber`.

   <Image align="center" src="https://files.readme.io/a4a7fe7-keyvalueextraction.png" />
5. To add additional condition, click the **ADD** button again and repeat the steps above.

# Configuring the Table validation

Validates the existence of specified data within tables in the PDF document. After selecting the table in the document, each action is for one cell in the table.

:fa-arrow-right:**To configure the Table validation:**

1. In the **Table** section, click **ADD**.

   The condition/action configuration section is displayed:

   <Image align="center" src="https://files.readme.io/d5e9840-table1.png" />
2. In the **Table number** field, enter a number indicating the location of the table in the order of appearance. For example, `2` will validate the contents from the second table.
3. Click **Add Action** to specify the exact location and value of the content that you want to validate.
4. In the **Row** field, enter a number indicating the location row within the table in the order of appearance.
5. In the **Column** field, enter a number indicating the location column within the table in the order of appearance.
6. In the **Action** field, select the **Verify** option (checkmark icon).
7. In the **Value** field, enter the string that you want to validate its existence.\
   The following example validates that the string `Product Name` appears in the first row and first column of the first table.
8. To specify additional validations within the same table, click **Add Action** and repeat the steps above.
9. To add an additional table validation, click the **ADD** button again and repeat the steps above.

# Configuring the Table extraction

This condition extracts the value that appears in the specified location within the specified table and stores the value in the specified variable name.  The variable can be a variable that was defined in the previous steps or it can be created ad hoc, which means that when the step is executed, the variable is created with the name specified in the **Value** field.

:fa-arrow-right:**To configure the Table extraction:**

1. In the **Table** section, click **ADD**.\
   The condition/action configuration section is displayed:

   <Image align="center" src="https://files.readme.io/1de3b15-table1.png" />
2. In the **Table number** field, enter a number indicating the location of the table in the order of appearance. For example, `2` will extracts the contents from the second table.
3. Click **Add Action** to specify the exact location and value of the content that you want to extract.
4. In the **Row** field, enter a number indicating the location row within the table in the order of appearance.
5. In the **Column** field, enter a number indicating the location column within the table in the order of appearance.
6. In the **Action** field, select the **Store** option (x icon).
7. In the **Value** field, enter the name of the variable that will be created or that was defined in a previous step. The  value in the specified location of the table will be stored in this variable.\
   The following example will extract the value in the PDF that is located in the third row, second column of the first table and store it in a variable called `quoteTotal`.

   <Image align="center" src="https://files.readme.io/c2eeac1-table3.png" />
8. To specify additional extraction within the same table, click **Add Action** and repeat the steps above.
9. To add an additional table extraction, click the **ADD** button again and repeat the steps above.