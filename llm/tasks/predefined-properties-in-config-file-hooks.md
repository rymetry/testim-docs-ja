# 翻訳タスク (predefined-properties-in-config-file-hooks)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

以下では、各種設定フックで利用できる事前定義プロパティを紹介します。これらは実行の「info」に含まれる情報で、テスト／スイートに関する追加情報を取得するのに利用できます。例えば、Before Suite フックで `projectId` の値を出力できます。

## Before Suite の事前定義プロパティ

| プロパティ名 | 説明 | 用途 |
| :------------ | :---------- | :--- |
| projectId     |             |      |
| executionId   |             |      |

## After Suite の事前定義プロパティ

| プロパティ名    | 説明 | 用途 |
| :--------------- | :---------- | :--- |
| testId           |             |      |
| status           |             |      |
| name             |             |      |
| resultId         |             |      |
| istestContainer  |             |      |
| testStatus       |             |      |
| testCreatorName  |             |      |
| testCreatorEmail |             |      |
| testOwnerName    |             |      |
| testOwnerEmail   |             |      |
| testLables       |             |      |
| testSuites       |             |      |
| config           |             |      |
| workerId         |             |      |
| startTime        |             |      |
| sessionId        |             |      |
| duration         |             |      |
| failureReason    |             |      |
| failurePath      |             |      |
| success          |             |      |
| resultUrl        |             |      |
| total            |             |      |
| passed           |             |      |
| skipped          |             |      |

## Before Test の事前定義プロパティ

| プロパティ名         | 説明 | 用途 |
| :-------------------- | :---------- | :--- |
| testId                |             |      |
| isTestsContainer      |             |      |
| parallel              |             |      |
| browser               |             |      |
| gitBranch             |             |      |
| gitCommit             |             |      |
| gitRepoUrl            |             |      |
| runnerVersion         |             |      |
| gridHost              |             |      |
| testimBranch          |             |      |
| canaryMode            |             |      |
| source                |             |      |
| testPlans             |             |      |
| testLabels            |             |      |
| testNames             |             |      |
| testIds               |             |      |
| testConfigs           |             |      |
| testConfigIds         |             |      |
| port                  |             |      |
| browserTimeout        |             |      |
| timeout               |             |      |
| newBrowserWaitTimeout |             |      |
| tunnel                |             |      |
| tunnelPort            |             |      |
| tunnelHostHeader      |             |      |
| runnerMode            |             |      |
| gridId                |             |      |
| gridName              |             |      |
| retentionDays         |             |      |
| sessionType           |             |      |
| companyId             |             |      |
| testData              |             |      |
| isBeforeTestPlan      |             |      |
| isAfterTestPlan       |             |      |
| testDataTotal         |             |      |
| testDataIndex         |             |      |
| baseUrl               |             |      |
| testConfig            |             |      |
| resolution            |             |      |
| id                    |             |      |
| name                  |             |      |
| browser               |             |      |
| os                    |             |      |
| isMobileWeb           |             |      |
| isMobile              |             |      |
| workerId              |             |      |
| exportsGlobal         |             |      |

## After Test の事前定義プロパティ

| プロパティ名         | 説明 | 用途 |
| :-------------------- | :---------- | :--- |
| testId                |             |      |
| status                |             |      |
| name                  |             |      |
| resultId              |             |      |
| isTestsContainer      |             |      |
| config                |             |      |
| parallel              |             |      |
| browser               |             |      |
| gitBranch             |             |      |
| gitCommit             |             |      |
| gitRepoUrl            |             |      |
| runnerVersion         |             |      |
| gridHost              |             |      |
| testimBranch          |             |      |
| canaryMode            |             |      |
| source                |             |      |
| testPlans             |             |      |
| testLabels            |             |      |
| testNames             |             |      |
| testIds               |             |      |
| testConfigs           |             |      |
| testConfigIds         |             |      |
| port                  |             |      |
| browserTimeout        |             |      |
| timeout               |             |      |
| newBrowserWaitTimeout |             |      |
| tunnel                |             |      |
| tunnelPort            |             |      |
| tunnelHostHeader      |             |      |
| runnerMode            |             |      |
| gridId                |             |      |
| gridName              |             |      |
| retentionDays         |             |      |
| sessionType           |             |      |
| companyId             |             |      |
| testData              |             |      |
| isBeforeTestPlan      |             |      |
| isAfterTestPlan       |             |      |
| testDataTotal         |             |      |
| testDataIndex         |             |      |
| baseUrl               |             |      |
| testConfig            |             |      |
| resolution            |             |      |
| id                    |             |      |
| name                  |             |      |
| browser               |             |      |
| os                    |             |      |
| isMobileWeb           |             |      |
| isMobile              |             |      |
| gridInfo              |             |      |
| host                  |             |      |
| port                  |             |      |
| protocol              |             |      |
| accessToken           |             |      |
| slotId                |             |      |
| gridId                |             |      |
| user                  |             |      |
| key                   |             |      |
| type                  |             |      |
| name                  |             |      |
| arn                   |             |      |
| workerId              |             |      |
| startTime             |             |      |
| sessionId             |             |      |
| duration              |             |      |
| failureReason         |             |      |
| success               |             |      |
| globalParameters      |             |      |
