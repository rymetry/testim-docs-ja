---
title: マッピングファイルの作成
description: ネットワークモック用のマッピングファイルの作成方法を説明します。リクエストとレスポンスのマッピング、パススルー認証の設定方法を学びます。
category: テスト実行
order: 6015
updated: '2025-11-11'
sourceUrl: 'https://help.testim.io/docs/creating-a-mapping-file'
keywords:
  - マッピングファイル
  - ネットワークモック
  - モックレスポンス
  - パススルー認証
  - HTTPリクエスト
  - リダイレクト設定
  - JSON設定
  - ログインリクエスト
---

マッピングファイルは、リクエストとレスポンスの配列を含むエントリの配列を含むJSONファイルです。各リクエストは、単一のレスポンスに複数回マッピングできます。JSONは、HARファイルにあるようなエントリを持つ必要があります。以下の要素が必須です:

* リクエスト内のURL
* レスポンス内のステータスまたはリダイレクトURL
* **GET**呼び出しを**マッピングしない**場合は、**リクエスト**の一部としてメソッドタイプを指定

URLには、ワイルドカードとして\*を使用できます。これは、パターンにマッチするすべてのリクエストがキャッチされ、ファイル内のレスポンスにマッピングされることを意味します。\
マッピングファイルはローカルに保存する必要があります。

## マッピングファイルの有用な例

### レスポンスにJSONオブジェクトを含むマッピングファイル

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

### メソッドを指定したマッピングファイル(GET以外のマッピング用)

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

### レスポンスにリダイレクトURLを含むマッピングファイル

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

### レスポンスにテキストを含むマッピングファイル

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

## ログイン用のパススルー認証を有効にするマッピングファイルの作成

テストにサーバーへの認証情報の受け渡しを含むログインプロセスが含まれている場合、モックネットワーク上でテストを実行すると、ログインリクエストがタイムアウトするため、正しく動作しない可能性があります。この問題を解決するには、ログインリクエストとパススルー認証プロパティを有効にしたマッピングファイルを作成する必要があります。

次の例は、ログインリクエストのパススルー認証を有効にします:

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

URLをログインURLに置き換えてください。

## マッピングファイルのアップロード

**マッピングファイルをアップロードするには:**

1. **テストプロパティ**ペインで、**カスタムマッピングファイルをアップロード**をクリックします。

![マッピングファイルのアップロード設定画面](/images/mock-network-responses/creating-a-mapping-file/7858343-mock8.png)

2. 保存したカスタムマッピングファイルを見つけて、**開く**をクリックしてアップロードします。
3. **保存**をクリックして、アクティベートを保存します。

![アップロード後のマッピングファイル設定画面](/images/mock-network-responses/creating-a-mapping-file/cbd045e-mock7.PNG)
