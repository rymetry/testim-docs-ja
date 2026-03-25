---
title: Applitools テスト名のオーバーライド
description: Applitools に送信されるテスト名をテストデータを使用してオーバーライドする方法について説明します。言語別ベースラインの作成例を提供します。
category: 統合
order: 12018
updated: '2025-09-19'
sourceUrl: 'https://docs.tricentis.com/testim/content/integrations/applitools-integration/override-applitools-test-name.htm'
keywords:
  - Testim
  - Applitools
  - Applitools テスト名
  - テスト名
  - オーバーライド
  - テストデータ
  - ベースライン
---

Applitools に送信されるテスト名をオーバーライドすることができます。これは、[テストデータ](/docs/data-driven-testing#using-test-data-in-your-tests)を使用して以下の方法で実行できます:

1. パラメーター*applitoolsTestName*が、Applitools にテスト名として送信されます
2. テストデータでこれをオーバーライドまたは変更できます。例:

```javascript
return [{ applitoolsTestName: 'testName_english' }, { applitoolsTestName: 'testName_spanish' }];
```

3. この例では、各テストデータエントリに対して、Applitools に送信されるテスト名に言語が含まれ、Applitools で異なるベースラインが作成されます
