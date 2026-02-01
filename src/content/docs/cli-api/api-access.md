---
title: 'Testim REST APIアクセス'
description: 'Testim Automate REST APIを使用してブランチ管理、テスト実行、結果取得などを行う方法について説明します。APIキーの生成と管理手順を提供します。'
category: '管理者設定'
order: 3
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

Testim AutomateのREST APIを使用して、以下のアクションを実行できます:

- **ブランチ** - ブランチの作成、マージ、その他のブランチ管理関連機能を実行します。
- **テスト** - プロジェクトのすべてのテストのリストを取得します。
- **ユニークIDの検索** - テスト、スイート、テストプランの名前を送信して、システム内のユニークIDを取得します。
- **実行** - 指定したテスト、スイート、ラベル、またはテストプランの実行を開始します。
- **実行結果** - 実行結果を取得します。

> 👍
> 完全なAPIドキュメントについては、[こちら](https://editor-next.swagger.io/?url=https://raw.githubusercontent.com/testimio/public-openapi/main/api.yaml)を参照してください。
> 📘 これはプロ機能です
> この機能はプロフェッショナルプランのプロジェクトのみ利用可能です。プロフェッショナルプランの詳細については、[こちら](https://www.testim.io/pricing/)をクリックしてください。

# APIアクセスの有効化

このAPIを使用する前に、以下の説明に従ってAPIアクセスを設定する必要があります。\
:fa-arrow-right: **APIアクセスを有効にするには:**

1. **Settings --> API** に移動します。

![API設定ページとGenerate API Keyボタン](/images/cli-api/api-access/90025bb-Screen_Shot_2020-10-19_at_12.40.39.png)

2. **Generate API Key** をクリックします。
3. キーに名前を付けて **Generate** をクリックします。APIキーの値が表示されます。

![APIキー生成後に表示されるキー値とCopyボタン](/images/cli-api/api-access/eb6356a-Screen_Shot_2020-10-19_at_12.42.18.png)

4. APIキーをコピーして **Done** をクリックします。[APIキーの使用](doc:api-access#using-the-api-key)セクションの説明に従って、API認証ヘッダーでキーを使用します。

![APIキーをコピーしてDoneをクリックする画面](/images/cli-api/api-access/216e57f-Screen_Shot_2020-10-19_at_12.50.40.png)

> 📘
> APIキーの値を表示できるのはこのときだけです。

# APIキーの管理

**Settings > API** 画面から、既存のキーを管理できます。**検索ボックス**にキー名を入力して、既存のキーを検索できます。

![既存APIキー一覧と検索ボックス](/images/cli-api/api-access/7728ff5-Screen_Shot_2020-10-19_at_12.52.14.png)

:fa-arrow-right: **追加のキーを生成するには:**

- **Generate New** をクリックして、上記の[APIアクセスの有効化](/docs/api-access#enabling-api-access)セクションの手順に従います。

:fa-arrow-right: **APIアクセスを取り消すには:**

1. リストから該当するAPIキーを選択します。
2. **Delete**(ゴミ箱)アイコンをクリックします。
3. **Revoke** をクリックして削除を確認します。

> ❗️ 警告
>
> このアクションは元に戻せません。このAPIキーを復元することはできません。

# APIキーの使用

API呼び出しを実行するには、各呼び出しでヘッダーに以下の形式でAPIキーを渡す必要があります:\
キー名 - Authorization\
キー値 - bearer の後にAPIキーを続ける

例:

```curl
curl -X 'GET' \
  'https://api.testim.io/branches' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer PAK-hdRIBXXXXXXXXXXX
```
