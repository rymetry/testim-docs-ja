---
title: 'Applitoolsテスト名のオーバーライド'
description: 'Applitoolsに送信されるテスト名をテストデータを使用してオーバーライドする方法について説明します。言語別ベースラインの作成例を提供します。'
category: 'Applitools統合'
order: 1
updated: '2025-02-10'
keywords:
  - testim
  - applitools
  - テスト名
  - オーバーライド
  - テストデータ
---

Applitoolsに送信されるテスト名をオーバーライドすることができます。これは、[テストデータ](https://help.testim.io/docs/data-driven-testing#using-test-data-in-your-tests)を使用して以下の方法で実行できます:

1. パラメータ*applitoolsTestName*が、Applitoolsにテスト名として送信されます
2. テストデータでこれをオーバーライドまたは変更できます。例:

```javascript
return [
  {applitoolsTestName: 'testName_english'},
  {applitoolsTestName: 'testName_spanish'}
  ];
```

3. この例では、各テストデータエントリに対して、Applitoolsに送信されるテスト名に言語が含まれ、Applitoolsで異なるベースラインが作成されます
