---
title: 'API テスト'
description: '原文: https://help.testim.io/docs/api-testing'
category: '高度な機能'
order: 2
updated: '2025-11-02'
keywords:
  - testim
  - api-testing
  - advanced-features
---
UI テストからサーバーAPIを呼び出し、検証やデータ取得を簡単に行います。

API テストは、テスト内でAPI呼び出し（HTTPリクエスト）を行います。これにより、他ステップで使うデータの取得や、バックエンドとフロントエンドの値の整合を確認する検証が可能です。APIリクエストはヘッダー（認証情報を含む）とボディを持つ完全なHTTPリクエストです。\
API ステップには **Add API action** と **Validate API** の2種類があります。

* Add API action — API 応答からデータを取得したい場合に使用（返ってくることの確認にも利用可）
* Validate API — API 応答の検証に使用（主にバックエンドのデータ検証）

> 📘 プロ機能
>
> Professional プランで利用可能です。詳細は[こちら](https://www.testim.io/pricing/)。

# Validate API ステップの追加

API 検証ステップで応答を検証します。ヘッダー／ボディ／ステータスコードで検証可能です。検証全般は[こちら](/docs/validation)を参照。\
:fa-arrow-right: **“Add API validation” を追加するには:**

![](/images/advanced-features/api-testing/eb15a7d-validatestep.gif)

1. Hover over the :fa-caret-right: (arrow symbol) (or + symbol after the final step) where you want to add the Add API validation step.
2. Click the **“M”** (Testim predefined steps).\
   The **Predefined steps** menu opens.
3. Click on Validations.\
   The **Validations** menu expands
4. Scroll down through the menu and select Validate API:

> 📘
>
> Alternatively, you can use the search box at the top of the menu to search for *Validate API*.

The **Add Step** window is shown

![](/images/advanced-features/api-testing/d92c26a-Picture1.png)

5. In the **Name the new step** field, enter a name for this step.
6. If this is a shared step to be made available to reuse in this or other tests, keep the box next to Shared step selected (default), and choose a folder from the **Select shared step** folder list where you want this step stored. Otherwise, deselect the checkbox.\
   For more information about shared steps, see [Groups](/docs/groups/groups)
7. Click **Create Step**.\
   The **Run Shared API Validation** window opens.

![](/images/advanced-features/api-testing/0442a1d-run_sharred_api_validation.png)

8. In the **URL** field, select the desired HTTP Request method and enter the root-endpoint and path. You can add parameters to the URL. For more information, see [Using Parameters](doc:api-testing#using-parameters-in-the-sent-http-request) section below.
9. In the **Header** section, enter the header Key-Value pairs that need to be sent with your API. Select the Key-Value (default) option to enter the header in separate key and value fields. Select the Raw option to enter the values in their raw format (e.g. when copying from the browser's devtools network panel).\
   You can test different requests using different headers. Select the checkboxes to the left of the headers you wish to test. Requests with checked headers are all performed, one after the other. To delete a header, select the X to the right of the header.

![](/images/advanced-features/api-testing/0277227-header.png)

10. Click the **Authorization** tab to configure the Authorization header. Select one of the following authorization options:
    * **None** – select this option if you do not want to send authorization parameters or if you want to use an authorization type other than Basic or Bearer. In this case you will have to manually enter the Authorization parameters under the Header tab.
    * **Basic** – select this option if the endpoint uses Basic Authorization. Enter the username and the password.
    * **Bearer** - select this option if the endpoint uses Bearer Authorization. Enter the Token.

> 📘
>
> Authorization types entered under the **Authorization** tab (other than None) override authorizations manually entered in the **Header** tab

![](/images/advanced-features/api-testing/e0ec5a9-authorization.png)

11. In the **Body** section, in the drop-down menu, select the data format you want to send and enter the Body of your call in the box below. For example, use the Text option for entering free text (e.g. sending a key and a value). Options are: Text, JSON, JavaScript, XML, and HTML. You can add parameters to the Body. For more information, see  [Using Parameters](doc:api-testing#using-parameters-in-the-sent-http-request) section below.  

![](/images/advanced-features/api-testing/ba2e285-body.png)

In the **Assertion** section, you can optionally assert on the header, body, or status code response without manually entering code. The Assertion is run before the code in Run additional code on request results (see below). The response for the assertion can be Passed (TRUE) or Failed (FALSE). If the Assertion fails, the step and test will fail and the Run additional code on request results code won’t be executed. <br/>\
Do the following:

* In the drop-down menu, select the element on which you will perform the assertion, options include Status code, Header, Body (JSON), or Body (Text). <br/>
* In the second field, select an operator. <br/>
* In the third field (value), enter the value you are checking. The value can be a parameter without curly brackets. <br/>
* Repeat the steps above to add additional assertions. To enable/disable the assertion select/deselect the checkbox.<br/>

![](/images/advanced-features/api-testing/9c95b25-assertions.png)

13. Select the **Run additional code on request** results switch if you want to run code that will perform additional validations that are not possible through the assertion or add additional functionality to the validation. For example, throwing an error message following a failed validation. You can add parameters to the code. For more information, see Using Parameters section below.

![](/images/advanced-features/api-testing/a99b5db-run_additional_code.png)

14. Click **Show step properties**.

![](/images/advanced-features/api-testing/bc9b3fc-showstepproperties.png)

15. In the **Properties** panel, in the **Send via web page** checkbox:

    * **Deselect the checkbox** - if you want to send the API call outside the browser context so that browser-restrictions do not apply to it. For example, if your API doesn't support CORS.
    * **Select the checkbox** - if you need the API to also send browser information such as cookies. (They are sent automatically.)

      ![](/images/advanced-features/api-testing/3cf1b19-properties.png)
16. In the **Allow API request retry** field:
    1. **Select the checkbox** - select this checkbox if you want to retry the sending of the request only if the request itself has failed (i.e., returned a failed status code).
    2. **Deselect the checkbox** - even if the status code is error, Testim will still run the step with its validations and the addition code (i.e., without trying to resend the request). For example, this is useful when the assertion is set as an error code, and so there is no need to retry sending the request.
17. In the **Params** field, add the relevant parameters, as described in  [Using Parameters](doc:api-testing#using-parameters-in-the-sent-http-request) section below.

> 📘
>
> If you're running via a webpage, and the page has not finished loading, this step can fail. If the previous step requires loading, add a [wait for](/docs/advanced-features/wait-for) before the API step to verify that the page has finished loading.

## Checking the request outside of the context of the AUT

If you want to check your request for a quick response outside of the context of the AUT (without running the test), in the **URL** field, click the **Send** button. Assertions and code in the **Run additional code on request results** window will not be executed. Only local parameters with static values, which are defined in the **Properties** panel will be sent. Non-static values will be sent as empty strings.\
The available step parameters are listed below the **URL** field. You can click **Edit** to modify the parameter in the **Properties** panel.

![](/images/advanced-features/api-testing/b763cb7-image_13.png)

> 📘
>
> This request will not be counted against your account quota.\
> The response is temporary, which means that upon exiting the step, the response will be cleared.

# Adding an API Action Step

Use an API validation step to perform additional actions, while using the API response. For example, the returned data can be used for calculations, or to save it for later use in the test (export parameter). It is possible to use the data from the *header*, *body*, or \_status \_code response.\
:fa-arrow-right:**To add an “Add API action” step:**

![](/images/advanced-features/api-testing/437b054-apiaciton.gif)

1. Hover over the :fa-caret-right: (arrow symbol) (or + symbol after the final step) where you want to add the Add API action step.
2. Click the “M” (Testim predefined steps).\
   The **Predefined steps** menu opens.
3. Click on **Actions**.\
   The **Actions** menu expands.
4. Scroll down through the menu and select **Add API action**.

> 📘
>
> Alternatively, you can use the search box at the top of the menu to search for **Add API action**.

The **Add Step** window is shown.

![](/images/advanced-features/api-testing/01b1c12-Picture1.png)

5. Follow **steps 5-13** as described in the [Adding a Validate API Step](doc:api-testing#adding-a-validate-api-step) section above.
6. Select the **Run additional code on request results** switch if you want to run code that will use the returned data from the API call for cases other than validation (e.g. to extract parameters, close DB connections, etc.). You can run any JavaScript code, and use the data returned from the API call, including the *status code*, *response headers*, and *response body*. If the response body content type is XML/JSON, the parameter type will be an Object, otherwise the parameter type is String.

![](/images/advanced-features/api-testing/5d3302a-image_2.png)

7. Follow **steps 14-16** as described in the [Adding a Validate API Step](doc:api-testing#adding-a-validate-api-step) section above.

> 📘
>
> If you're running via a webpage, and the page has not finished loading, this step can fail. If the previous step requires loading, add a wait for before the API step to verify that the page has finished loading.

# Including a File and/or Text field with an API Call Using Form Data

When adding an API Action or Validate API step to a test, you have the ability to include a file attachment with the API call and/or a text field that can hold a key:value pair.

:fa-arrow-right: **To include a file attachment in an API call:**

1. Navigate to your test and add a Validate API or API Action step as described above.
2. In the **Body** section of step, select the **Form Data** entry type.

![](/images/advanced-features/api-testing/f021f36-api-testing-1.jpg)

3. Select the **File** entry type.

![](/images/advanced-features/api-testing/aa68d56-api-testing-2.jpg)

Testim automatically updates the header **Content-Type** to “multipart/form-data.”

![](/images/advanced-features/api-testing/c433a90-api-testing-3.jpg)

> 📘 Note:
>
> Sending a file as part of an API call only works with the **Post** HTTP Request method.

4. Enter the **Key** name for the filename.

![](/images/advanced-features/api-testing/b5a918f-api-testing-4.jpg)

5. Click the **Upload File** button and attach a file from your computer.

![](/images/advanced-features/api-testing/09a8669-api-testing-5.jpg)

> 📘 Note:
>
> If you do not provide the Key name or file attachment for the file entry, the API call will exclude this entry when running the test.

Testim will save the file to the testing server and when the test runs, the test will automatically link to the file and upload the file as part of the test.

> 📘 Note:
>
> Testim limits the file upload size to 25MB. If you try to upload a file larger than 25MB Testim will display a validation message and prevent you from attaching the file.

:fa-arrow-right: **To include a text field in an API call:**

1. Navigate to your test and add a Validate API or API Action step as described above.
2. In the **Body** section of step, select the **Form Data** entry type.
3. Select the **Text** entry type.
4. Enter the **Key** name for the text field.
5. Enter the **Value** of the text field.

![](/images/advanced-features/api-testing/428ba6a-Picture1.png)

The key:value pair of the form is saved. When the test runs, the test will send the key:value pair along with the API call.

## Cancel a File Upload in Progress

You have the ability to cancel a file upload while the upload is in progress.

:fa-arrow-right: **To Cancel a file upload in progress:**

1. Click the **“X”** next to the entry with the file upload in progress.

![](/images/advanced-features/api-testing/e72c0ab-api-testing-6.jpg)

Testim will cancel the file upload and allow you reupload a different file.

![](/images/advanced-features/api-testing/e25b412-api-testing-7.jpg)

## Replace a File Attachment

You have the ability to replace the file attachment for an existing entry.

:fa-arrow-right: **To Replace the File Attachment of an existing file entry:**

1. Click the **“X”** next to the previously attached file entry.

![](/images/advanced-features/api-testing/0428c1c-api-testing-8.jpg)

2. Click the **Upload File** button and attach a file from your computer to upload a new file.

![](/images/advanced-features/api-testing/0c81dc9-api-testing-5.jpg)

## Exclude or Delete an Entry from the Body Section

You have the ability to exclude or delete a Body entry from the API call.

:fa-arrow-right: **To exclude an entry from the API call:**

1. Click the **check box** to the left of the entry you want to exclude from the test.

![](/images/advanced-features/api-testing/de72f68-api-testing-10.jpg)

Testim will exclude this entry from the test, but the entry will not be deleted and can be included again at any time.

:fa-arrow-right: **To delete an entry from the API call:**

1. Click the **“X”** to the right of the Body entry you want to delete.

![](/images/advanced-features/api-testing/e7fea88-api-testing-9.jpg)

Testim will remove this entry.

# Using Parameters

You can use parameters in the API step as you would in any other step that uses code. You can use parameters in the sent HTTP request, in the HTTP response, and/or as part of the Assertion. Parameter can be either in-param, as dependency injection, or out-param via the exports/exportsGlobal. You can also access any other variables in the test's scope.\
Read more about parameters options [here](/docs/parameters/parameters).

> 📘
>
> Arrays are supported in the following format: `array.0.name`

> 📘
>
> Complex expressions are **NOT** supported within the API step sections.

## Using parameters in the sent HTTP request

Parameters can be used in the header, body, and URL. Since those sections are cumbersome to write in JS, we made it easy for you. In these sections you will need to add double\\triple curly brackets around the parameters.

### Adding parameters to the Body

You can use triple brackets if you do not want the parameters to be encoded. e.g, \{\{\{param}}}.

![](/images/advanced-features/api-testing/59f09c0-Picture2.png)

### Adding parameters to the URL

If you want to send the API call to an API that uses the same URL as the test's base URL, instead of writing the entire URL you can use the Base URL parameter, by writing \{\{\{BASE\_URL}}} in the URL field, followed by the rest of the URL. You can use triple brackets if you do not want the parameters to be encoded. e.g, \{\{\{param}}}.

![](/images/advanced-features/api-testing/753553d-image_5.png)

### Adding parameters to the Header

You can use triple brackets if you do not want the parameters to be encoded. e.g, \{\{\{param}}}.

![](/images/advanced-features/api-testing/82b5c47-image_3.png)

## Using parameters in the HTTP response

Parameters added in the Properties panel will be automatically added to the function's signature.

![](/images/advanced-features/api-testing/eb87221-image_9.png)

## Using parameters in the Assertion

Parameters can be added to the assertion without the need to add curly brackets.

![](/images/advanced-features/api-testing/bb8290c-image_8.png)

![](/images/advanced-features/api-testing/7004c0f-Screen_Shot_2022-03-09_at_15.08.34.png)

# Viewing the result after the run

After running the step, you'll see the response returned from the API call in the Response tab, along with additional info, such as response status code, call duration, and the size of the binary files. You can also view the sent request and download the response info.

![](/images/advanced-features/api-testing/a311eec-image_10.png)

The following features are available in the **Response** tab:

* **View Sent Request** – When you click this button a window opens showing the full request that was sent. Parameters are converted to static values. From this window you can **download** a JSON file of the response or **copy** the information shown to your clipboard.

![](/images/advanced-features/api-testing/e6c16b6-image_11.png)

* **Download the response info** – When you click on the download button (arrow to the right of View Sent Request) a JSON file with the entire response is downloaded to your local device.
* **Assertion response** – if you have configured assertions, you will see the one of the following indications next to the assertion:
  * **Passed** – this indicates that the assertion was TRUE.
  * **Failed** – this indicates that the assertion was FALSE. In this case the step will fail, which in turn will fail the test.

![](/images/advanced-features/api-testing/639898e-image_12.png)

**Usage examples** - [click here](https://app.testim.io/#/project/GYXR2qZC/branch/master/automate/tests/97auidmCzzUtZuoQ)

**Troubleshooting** - [click here](doc:why-did-my-test-fail#13-api-step-failed)
