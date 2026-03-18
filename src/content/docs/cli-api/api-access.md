---
title: Testim REST API
description: >-
  Testim Automate REST
  APIを使用してブランチ管理、テスト実行、結果取得などを行う方法について説明します。APIキーの生成と管理手順を提供します。
category: 管理者機能
order: 14001
updated: '2025-09-18'
sourceUrl: 'https://help.testim.io/docs/api-access'
keywords:
  - REST API
  - APIアクセス
  - APIキー管理
  - 認証ヘッダー
  - 実行結果取得
  - ブランチ管理
---

Testim Automate の REST API を使用して、以下のアクションを実行できます:

- **ブランチ** - ブランチの作成、マージ、その他のブランチ管理関連機能を実行します。
- **テスト** - プロジェクトのすべてのテストのリストを取得します。
- **ユニーク ID の検索** - テスト、スイート、テストプランの名前を送信して、システム内のユニーク ID を取得します。
- **実行** - 指定したテスト、スイート、ラベル、またはテストプランの実行を開始します。
- **実行結果** - 実行結果を取得します。

:::tip
完全な API ドキュメントについては、[こちら](https://editor-next.swagger.io/?url=https://raw.githubusercontent.com/testimio/public-openapi/main/api.yaml)を参照してください。
:::

:::info{title="PRO機能"}
この機能は Professional plan のプロジェクトでのみ利用できます。
:::

## API アクセスの有効化

この API を使用する前に、以下の説明に従って API アクセスを設定する必要があります。

**API アクセスを有効にするには:**

1. **Settings --> API** に移動します。

![API 設定ページと Generate API Key ボタン](/images/cli-api/api-access/90025bb-Screen_Shot_2020-10-19_at_12.40.39.png)

2. **Generate API Key** をクリックします。
3. キーに名前を付けて **Generate** をクリックします。 API キーの値が表示されます。

![API キー生成後に表示されるキー値と Copy ボタン](/images/cli-api/api-access/eb6356a-Screen_Shot_2020-10-19_at_12.42.18.png)

4. API キーをコピーして **Done** をクリックします。[API キーの使用](/docs/api-access#using-the-api-key)セクションの説明に従って、 API 認証ヘッダーでキーを使用します。

![API キーをコピーして Done をクリックする画面](/images/cli-api/api-access/216e57f-Screen_Shot_2020-10-19_at_12.50.40.png)

:::note
API キーの値を表示できるのはこのときだけです。
:::

## API キーの管理

**Settings > API** 画面から、既存のキーを管理できます。**検索ボックス**にキー名を入力して、既存のキーを検索できます。

![既存 API キー一覧と検索ボックス](/images/cli-api/api-access/7728ff5-Screen_Shot_2020-10-19_at_12.52.14.png)

**追加のキーを生成するには:**

- **Generate New** をクリックして、上記の[API アクセスの有効化](/docs/api-access#enabling-api-access)セクションの手順に従います。

**API アクセスを取り消すには:**

1. リストから該当する API キーを選択します。
2. **Delete**（ゴミ箱）アイコンをクリックします。
3. **Revoke** をクリックして削除を確認します。

:::danger{title="警告"}
このアクションは元に戻せません。この API キーを復元することはできません。
:::

## API キーの使用

API 呼び出しを実行するには、各呼び出しでヘッダーに以下の形式で API キーを渡す必要があります:\
キー名 - Authorization\
キー値 - bearer の後に API キーを続ける

例:

```curl
curl -X 'GET' \
  'https://api.testim.io/branches' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer PAK-hdRIBXXXXXXXXXXX
```
