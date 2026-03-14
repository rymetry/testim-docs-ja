---
title: Applitoolsテスト名のオーバーライド
description: Applitoolsに送信されるテスト名をテストデータを使用してオーバーライドする方法について説明します。言語別ベースラインの作成例を提供します。
category: 統合
order: 12018
updated: '2025-02-10'
sourceUrl: 'https://help.testim.io/docs/override-applitools-test-name'
keywords:
  - Testim
  - Applitools
  - Applitoolsテスト名
  - テスト名
  - オーバーライド
  - テストデータ
  - ベースライン
---

Applitoolsに送信されるテスト名をオーバーライドすることができます。これは、[テストデータ](/docs/data-driven-testing#using-test-data-in-your-tests)を使用して以下の方法で実行できます:

1. パラメータ*applitoolsTestName*が、Applitoolsにテスト名として送信されます
2. テストデータでこれをオーバーライドまたは変更できます。例:

```javascript
return [
  {applitoolsTestName: 'testName_english'},
  {applitoolsTestName: 'testName_spanish'}
  ];
```

3. この例では、各テストデータエントリに対して、Applitoolsに送信されるテスト名に言語が含まれ、Applitoolsで異なるベースラインが作成されます
