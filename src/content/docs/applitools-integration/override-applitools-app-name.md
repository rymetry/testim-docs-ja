---
title: Applitoolsアプリ名のオーバーライド
description: Applitoolsに送信されるアプリ名をテストデータまたはプロジェクト設定でオーバーライドする方法について説明します。
category: 統合
order: 12019
updated: '2025-02-10'
sourceUrl: 'https://help.testim.io/docs/override-applitools-app-name'
keywords:
  - Testim
  - Applitools
  - Applitoolsアプリ名
  - アプリ名
  - アプリケーション名
  - オーバーライド
  - プロジェクト設定
---

Applitoolsに送信されるアプリ名をオーバーライドすることができます。これは、[テストデータ](/docs/data-driven-testing#using-test-data-in-your-tests)を使用して以下の方法で実行できます:

1. パラメータ*applitoolsAppName*が、Applitoolsにアプリ名として送信されます
2. テストデータでこれをオーバーライドまたは変更できます。例:

```javascript
return [
  {applitoolsAppName: 'appName_english'},
  {applitoolsAppName: 'appName_spanish'},
  ];
```

プロジェクトレベルでアプリ名をオーバーライドすることもできます。デフォルトのアプリ名は*projectId*です。オーバーライドするには、Settings -> Integration --> Applitools統合の下に、アプリケーション名を追加します

![Applitools統合設定画面でアプリ名を指定するフィールド](/images/applitools-integration/override-applitools-app-name/f97a73d-Group_45.jpg)
