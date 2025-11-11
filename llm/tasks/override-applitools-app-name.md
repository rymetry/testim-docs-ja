# 翻訳タスク (override-applitools-app-name)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

It is possible to override the app name being sent to Applitools. This can be done using the [test data](https://help.testim.io/docs/data-driven-testing#using-test-data-in-your-tests) in the following way:

1. The parameter *applitoolsAppName* is the one being sent to Applitools as the app name
2. You can either override it or change it in the test data, for example:

```javascript
return [
  {applitoolsAppName: 'appName_english'},
  {applitoolsAppName: 'appName_spanish'},
  ];
```

It is also possible to override the app name at the project level. The app name by default is the *projectId*, to override it go to Settings -> Integration --> under the Appltiools integration, add the application name

![1739](/images/applitools-integration/override-applitools-app-name/f97a73d-Group_45.jpg "Group 45.jpg")
