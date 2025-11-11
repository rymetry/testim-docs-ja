# 翻訳タスク (api-access)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

Testim Automate features a REST API that can be used to perform the following actions:

- **Branches** - create branches, merge branches, and perform other branch management-related functions.
- **Tests** - retrieve a list of all tests for a project.
- **Search for unique ID** - send the name of a test, suite, test plan to receive its unique ID in the system.  
- **Runs** - initiate a run of a specified test, suite, label, or test plan.
- **Executions** - get execution results.

> 👍
>
> To see the full API docs, see [here](https://editor-next.swagger.io/?url=https://raw.githubusercontent.com/testimio/public-openapi/main/api.yaml).

> 📘 This is a pro feature
>
> This feature is only open to projects on our professional plan. To learn more about our professional plan, click [here](https://www.testim.io/pricing/).

# Enabling API access

Before using this API, you will need to configure the API access, as described below.\
:fa-arrow-right: **To enable API access:**

1. Go to **Settings --> API**.

![](/images/cli-api/api-access/90025bb-Screen_Shot_2020-10-19_at_12.40.39.png "Screen Shot 2020-10-19 at 12.40.39.png")

2. Click **Generate API Key**.
3. Name your key and click **Generate**.  The API key value is displayed.

![](/images/cli-api/api-access/eb6356a-Screen_Shot_2020-10-19_at_12.42.18.png "Screen Shot 2020-10-19 at 12.42.18.png")

4. Copy your API key and click **Done**. Use the key in the API Authorization header, as described in the [Using the API Key](doc:api-access#using-the-api-key) section.

![](/images/cli-api/api-access/216e57f-Screen_Shot_2020-10-19_at_12.50.40.png "Screen Shot 2020-10-19 at 12.50.40.png")

> 📘
>
> This is the only time you can view the API key value.

# API keys management

From the **Settings > API** screen you can manage the existing keys. You can search for an existing key, by typing its name in the **search box**.

![](/images/cli-api/api-access/7728ff5-Screen_Shot_2020-10-19_at_12.52.14.png "Screen Shot 2020-10-19 at 12.52.14.png")

:fa-arrow-right: **To generate additional keys:**

- Click **Generate New** and follow the instructions in the above [Enabling API access](https://help.testim.io/docs/api-access#enabling-api-access) section.

:fa-arrow-right: **To revoke API access:**

1. Select the relevant API key from the list.
2. Click the **Delete** (trash) icon.
3. Click **Revoke** to confirm the deletion.

> ❗️ Warning
>
> This action cannot be undone, you will not be able to recover this API key.

# Using the API key

In order to perform the API calls, for each call, you need to pass in the header the API key in the following format:\
Key name - Authorization\
Key value - bearer followed by the API key

For example:

```curl
curl -X 'GET' \
  'https://api.testim.io/branches' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer PAK-hdRIBXXXXXXXXXXX
```
