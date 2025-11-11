# 翻訳タスク (creating-a-mapping-file)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

The Mapping file is a JSON file that includes an array of entries, which includes an array of requests and responses. Each request can be mapped multiple times to a single response. The JSON should have entries like the ones found in a HAR file. The following elements are mandatory:

- URL in the request
- Status in the response OR RedirectUrl
- In case of **NOT** mapping a **GET** call, specify the method type as part of the **request**

For the URL you can use \* as wildcards, which means any request that matches the pattern will be caught and mapped to the response in the file.\
The mapping file should be saved locally.

## Mapping file useful examples

### Mapping file with a JSON object in response

```json
{
  "entries": [
    {
      "request": {
        "url": "*/urlRequestYouWantToMock/*?=yourQueryParam"
      },
      "response": {
        "status": 200,
        "headers": [{
          "name": "Content-Type",
          "value": "application/json; charset=utf-8"
        }],
        "content": {
          "text": "{\"mock\": \"network\"}"
        }
      }
    }
  ]
}
```

### Mapping file with a method specified (for non GET mappings)

```json
{
  "entries": [
    {
      "request": {
        "method": "POST",
        "url": "*/urlRequestYouWantToMock/*?=yourQueryParam"
      },
      "response": {
        "status": 200,
        "headers": [{
          "name": "Content-Type",
          "value": "application/json; charset=utf-8"
        }],
        "content": {
          "text": "{\"mock\": \"network\"}"
        }
      }
    }
  ]
}
```

### Mapping file with a redirectUrl in response

```json
{
    "entries": [
      {
        "request": {
          "url": "*/urlRequestYouWantToMock/*?=yourQueryParam"
        },
        "response": {
            "redirectUrl" : "https://www.google.com"
          }
      }
    ]
  }
```

### Mapping file with a text in the response

```json
{
    "entries": [
      {
        "request": {
          "url": "*/urlRequestYouWantToMock/*?=yourQueryParam"
        },
        "response": {
            "status" : 200,
            "headers": [{
                "name": "Content-Type",
                "value": "text/html; charset=UTF-8"
              }],
              "content": {
                "text": "mock network"
              }
            
          }
      }
    ]
  }
```

## Creating a mapping file that enables pass-through authentication for login

If your test includes a login process, which involves passing credentials to a server, it may not work properly when running the test on the mock network, as the login request will be timed out. To solve this issue, you should create a mapping file that includes the login request and the enabled Pass-through authentication property.

The following example enables the pass-through authentication for the login request:  

```json
{
"entries": [
    
      {
          "request": {
          "url": "https://your_app_domain/login/*"
        },
            "response": {
            "passthrough":true
        }
      }
    ]
}
```

Replace the URL with your login URL.

## Uploading the Mapping File

:fa-arrow-right:**To upload your mapping file:**

1. In the **Test Properties** pane, click **Upload Custom Mapping File**.  

![](/images/mock-network-responses/creating-a-mapping-file/7858343-mock8.png "mock8.png")

2. Locate the custom Mapping file that you saved and click **Open** to upload it.
3. Click **Save** to save the activate.

![](/images/mock-network-responses/creating-a-mapping-file/cbd045e-mock7.PNG "mock7.PNG")
