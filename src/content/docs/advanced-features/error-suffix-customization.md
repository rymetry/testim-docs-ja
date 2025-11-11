---
title: 'エラーサフィックスのカスタマイズ'
description: '原文: https://help.testim.io/docs/error-suffix-customization'
category: '高度な機能'
order: 9
updated: '2025-11-02'
keywords:
  - testim
  - error-suffix-customization
  - advanced-features
---
ステップのエラーメッセージをカスタマイズする

ステップのプロパティ設定で、失敗時に表示されるエラーメッセージへ任意の文字列（およびパラメータ）をサフィックスとして追加できます。

:fa-arrow-right: **エラーサフィックスを追加するには:**

1. **プロパティを表示**ボタンをクリックし、プロパティペインを開きます。\
   ![](/images/advanced-features/error-suffix-customization/3df46b7-showproperties.png)
2. **Error suffix** 欄に、失敗時に付加したい文字列やパラメータを入力します。例: 文字列のみ 'my custom error'、あるいは ‘my custom error’ + `Param1` のように組み合わせ。\
   ![](/images/advanced-features/error-suffix-customization/115d4d0-errorsuffix1.png)

ステップが失敗すると、システムのエラー文にサフィックスが連結され、次の形式で表示されます。

```
<testim error>. Details: <user error>
```

![](/images/advanced-features/error-suffix-customization/0253da5-errorsuffix2.png)
