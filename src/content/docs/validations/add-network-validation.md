---
title: 'ネットワーク検証の追加'
description: '原文: https://help.testim.io/docs/add-network-validation'
category: '検証'
order: 14
updated: '2025-11-02'
keywords:
  - testim
  - add-network-validation
  - validations
---
ネットワークリクエストが期待どおりに実行されたかを検証する

*network validation* ステップでは、ネットワークリクエストを検証できます。プリセットの検証ステップで、オブジェクトの配列 `networkRequests`（下表）を受け取り、この配列に対して JavaScript を実行します。

:::note
これは Professional プランの機能です。詳しくは [pricing](https://www.testim.io/pricing/) を参照してください。
:::

:::info
このステップは Chrome または Edge Chromium でのみ実行できます。
:::

## Network Validation

*networkRequests* 配列に含まれるオブジェクトで、次の項目を検証できます：

> 📘 Request/Response Body
>
> It is also possible to capture the request and response body, see [Capturing Request and Response Body](doc:add-network-validation#capturing-request-and-response-body) for more details.

<Table align={["left","left"]}>
  <thead>
    <tr>
      <th>
        Object
      </th>

      <th>
        Property
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        url
      </td>

      <td>
        The request URL.
      </td>
    </tr>

    <tr>
      <td>
        source
      </td>

      <td>
        The page that generated the URL.
      </td>
    </tr>

    <tr>
      <td>
        method
      </td>

      <td>
        The request method. (e.g. GET, POST, PUT, etc.)
      </td>
    </tr>

    <tr>
      <td>
        startTime
      </td>

      <td>
        The Unix time (ms) when the request started loading.
      </td>
    </tr>

    <tr>
      <td>
        endTime
      </td>

      <td>
        The Unix time (ms) when the request finished loading.
      </td>
    </tr>

    <tr>
      <td>
        tabNumber
      </td>

      <td>
        The tab that was the source of the request.
      </td>
    </tr>

    <tr>
      <td>
        statusCode
      </td>

      <td>
        The response status code of the request.
      </td>
    </tr>

    <tr>
      <td>
        statusText
      </td>

      <td>
        The response status text, corresponding to the status code.
      </td>
    </tr>

    <tr>
      <td>
        isBlocked
      </td>

      <td>
        Indicates if the request was blocked.  

        * \*true\*\* = blocked  
        * \*false\*\* = not blocked
      </td>
    </tr>

    <tr>
      <td>
        blockReason
      </td>

      <td>
        The reason the request was blocked, if any. (e.g. ad blocker, request failure, origin, CORS, etc.)
      </td>
    </tr>

    <tr>
      <td>
        isDone
      </td>

      <td>
        Indicates if the request might still be pending.  

        * \*true\*\* = done  
        * \*false\*\* = pending
      </td>
    </tr>

    <tr>
      <td>
        type
      </td>

      <td>
        The type of data the response contains. (e.g. XHR, document, Image etc.) (from Chrome)
      </td>
    </tr>

    <tr>
      <td>
        responseSize
      </td>

      <td>
        The total size of the response (encoded, including the headers) in bytes.
      </td>
    </tr>

    <tr>
      <td>
        protocol
      </td>

      <td>
        The network protocol. (e.g. h2, http/1.1) (from Chrome)
      </td>
    </tr>
  </tbody>
</Table>

:fa-arrow-right: **To add an*Add network validation* step:**

1. Hover over the :fa-caret-right: **(arrow symbol)** where you want to add the step.

![](/images/validations/add-network-validation/a0847f8-Testim_308a.png "Testim 308a.png")

アクションのオプションが表示されます。

![](/images/validations/add-network-validation/138a257-Testim_283a_r.png "Testim 283a_r.png")

2. Click on the “**M**” (Testim predefined steps).\
   **Predefined steps** メニューが開きます。

![](/images/validations/add-network-validation/97d3be5-Testim_270_r2.png "Testim 270_r2.png")

3. Click on **Validations**.\
   **Validations** メニューが展開されます。

![](/images/validations/add-network-validation/82d4e6d-Testim_303_r.png "Testim 303_r.png")

4. Scroll down through the menu and select **Add network validation**.

> 📘
>
> メニュー上部の検索ボックスで検索することもできます。

**Add Step** ウィンドウが表示されます。

![](/images/validations/add-network-validation/d07a576-Testim_215_r.png "Testim 215_r.png")

5. In the **Name the new step** field, enter a (meaningful) name for this step.
6. If this is a shared step to be made available to reuse in this or other tests, keep the box next to **Shared step** selected (default), and choose a folder from the **Select shared step folder** list where you want this step stored. Otherwise, deselect the checkbox.\
   For more information about shared steps, see [Groups](/docs/groups/groups).
7. Click **Create Step**.\
   The **function** editor opens, and the **Properties** panel opens on the right-hand side.

![](/images/validations/add-network-validation/989f939-Testim_310.png "Testim 310.png")

8. In the **Properties** panel, in the **Description** field, optionally edit the description of this step. The default description is “Run network validation”.
9. Define the parameters you will need for your step as follows:\
   a. In the **Properties** panel, click the **+ PARAMS** button.\
   b. **JS parameter**: If you would like to add a JavaScript parameter, select **JS** from the dropdown list and type in the JavaScript parameter.\
   c. **HTML parameter**: If you would like to define an HTML element as a parameter, select **HTML** from the dropdown list. The browser opens, displaying the relevant webpage for this step. Do the following:
   * In the **AUT** window, hover your mouse on the relevant element and then click on it to select it. The selected element is shown in the **Target Element** box in the **Properties** pane. If you would like to view, replace or adjust the settings for the selected element, use the procedures described in [Editing Target Element Properties](/docs/steps-editing-tests/editing-target-element-properties).

  d. The selected element is automatically named “param” or “element” (depending on whether you chose a JS parameter or HTML element). To assign a relevant name to the parameter/element, click on the **edit** icon and enter the desired name.

![](/images/validations/add-network-validation/f5a215a-Testim_285a_r.png "Testim 285a_r.png")

10. Optionally fill in the following Properties:

* **When this step fails** – Specify what to do if this step fails.
* **When to run step** – Specify conditions for when to run the step. For more information, see [Conditions](/docs/conditions/conditions).
* **Override timeout** – Allows you to override the default time lapse setting which causes Testim to register a fail for a test step, and specify a different time lapse value (in milliseconds).

11. In the **function** text box, type in the desired JavaScript code. If you have defined parameters, you can refer to those parameters in your JavaScript code.

> 📘
>
> If you are using DOM selectors other than HTML parameters (e.g. jQuery), then empty arrays are truthy, so you need to use `$(<query>).length` instead of `$(<query>)`.

12. 左上の戻る矢印でエディターに戻ります。

![](/images/validations/add-network-validation/bc0ed89-Testim_311a.png "Testim 311a.png")

> 📘
>
> If you opened your AUT to define an HTML element as a parameter, click on the **Toggle Breakpoint** button to remove the breakpoint.

ステップが作成されます。

![](/images/validations/add-network-validation/969f2b6-Testim_312a.png "Testim 312a.png")

### Network Validation Examples

#### Validate all the image requests

![](/images/validations/add-network-validation/b4452ab-Testim_313.png "Testim 313.png")

**Example Code:**

```javascript
function validateRequestStatuscode(req){
  //Get status code
 const statusCode = req.statusCode.toString();
  //Check if we got an error
 const badReq = statusCode.startsWith('4')  || statusCode.startsWith('5');
  //If we got an error fail the step
  if(badReq){
    throw new Error(`assert failed for request "${req.url}" method: "${req.method}". Statusc code was ${req.statusCode}`); 
  }
}

console.table(networkRequests)
const imageCalls = networkRequests.filter(call => call.type == "Image");
imageCalls.forEach(validateRequestStatuscode)
```

#### Validate a single request

![](/images/validations/add-network-validation/7e9fc8d-Testim_314.png "Testim 314.png")

**Example Code:**

```javascript
if(networkRequests.length == 0){
 throw new Error('No requests were made during the time of the test') 
}

function validateRequestStatuscode(req){
  //Get status code
 const statusCode = req.statusCode.toString();
  //Check if we got an error
 const badReq = statusCode.startsWith('4')  || statusCode.startsWith('5');
  //If we got an error fail the step
  if(badReq){
    throw new Error(`assert failed for request "${req.url}" method: "${req.method}". Statusc code was ${req.statusCode}`); 
  }
  return true
}

//Filter the source of the request
function filterReqestsBySource(source,req){
  const reqSource = req.source
  if(source === reqSource) return true
  return false
}

//find a single request by it's url and check if they are all valid

const singleReq = networkRequests.find(item => item.url == 'http://demo.testim.io/bundle.css')

if(!singleReq){
 throw new Error('Request was not found') 
}

return validateRequestStatuscode(singleReq)
```

#### Validate all requests have passed

![](/images/validations/add-network-validation/3e299dd-Testim_315.png "Testim 315.png")

**Example Code:**

```javascript
function validateRequestStatuscode(req){
  //Get status code
 const statusCode = req.statusCode.toString();
  //Check if we got an error
 const badReq = statusCode.startsWith('4')  || statusCode.startsWith('5');
  //If we got an error fail the step
  if(badReq){
    throw new Error(`assert failed for request "${req.url}" method: "${req.method}". Statusc code was ${req.statusCode}`); 
  }
}


//Check all the requests and see if they are all valid 
networkRequests.forEach(validateRequestStatuscode)
return true
```

#### Validate max time of call

![](/images/validations/add-network-validation/9880f22-Testim_316.png "Testim 316.png")

**Example Code:**

```javascript
const callDur = networkRequests.map(call => call.endTime - call.startTime)

const isOverMax = callDur.some(time => time > maxTimeInMS)

if(isOverMax) throw new Error(`Some calls were over ${maxTimeInMS}MS`)
```

**Example Parameter:**

| Name        | Type       | Value                                                                                    |
| :---------- | :--------- | :--------------------------------------------------------------------------------------- |
| maxTimeInMS | JavaScript | \{the maximum number of milliseconds allowed for the network call before the step fails} |

# Capturing Request and Response Body

> 📘 Feature flag
>
> To enable this feature, please contact support.

As part of the network validation, in addition to the array of objects captured in the request/response, as described above, it is also possible to capture the request and/or response body and then use the **add network validation** step to perform validations on the body content. The body content itself will not be shown in the network logs, but will be added to the `networkRequests` array.

> 📘
>
> Enabling this option may affect the performance of your test.

:fa-arrow-right: **To enable the capture of the request and response body:**

1. In the **Setup Step**, click **Show Properties**.
2. Under **Network Capture Options**, select the **Capture request body** and/or **Capture response body** options.  

   ![](/images/validations/add-network-validation/f6815ea-network_capture_options.png)
3. Click **Save** to save the test.

## Adding the request/response body to the add network validation step

After enabling the **Network Capture Options** (Capturing Request/Response Body), in the\
**Add network validation** step, the parameter `networkRequests` will be available and will hold all of\
the requests that were made. Each request object has the following properties: `method`, `statusCode`, `resposeHeaders`, `requestBody` (this is the new property), `responseBody` (this is the new property), `headers`, and more. When adding the **Add network validation** step, it is possible to add the `requestBody` and/or `responseBody` properties, as shown below.

![](/images/validations/add-network-validation/557bd68-image.png)

> 📘
>
> Only fetch and XHR network request/response body will be captured.

### Test example

The following test example features the Request/Response Body in a network validation step:\
[https://app.testim.io/#/project/GYXR2qZC/branch/master/test/8PsdGWbxJx7NsZji](https://app.testim.io/#/project/GYXR2qZC/branch/master/test/8PsdGWbxJx7NsZji) and prints the\
body payload to the console.
