---
title: エラーサフィックスのカスタマイズ
description: エラーサフィックス機能でステップ失敗時のメッセージ末尾に任意の文字列やパラメータを追加する方法を説明します。
category: 高度な編集
order: 5057
updated: '2025-09-22'
sourceUrl: 'https://help.testim.io/docs/error-suffix-customization'
keywords:
  - エラーサフィックス
  - エラーメッセージ
  - ステップ失敗
  - 詳細情報
  - デバッグ
  - カスタムメッセージ
  - テスト結果
  - Testim
  - プロパティ設定
  - トラブルシューティング
---

ステップのエラーメッセージをカスタマイズする

ステップのプロパティ設定で、失敗時に表示されるエラーメッセージへ任意の文字列（およびパラメータ）をサフィックスとして追加できます。

**エラーサフィックスを追加するには:**

1. **プロパティを表示**ボタンをクリックし、プロパティペインを開きます。\
   ![エラーサフィックス設定のスクリーンショット](/images/advanced-features/error-suffix-customization/3df46b7-showproperties.png)
2. **Error suffix** 欄に、失敗時に付加したい文字列やパラメータを入力します。例: 文字列のみ 'my custom error'、あるいは ‘my custom error’ + `Param1` のように組み合わせ。\
   ![エラーサフィックス設定のスクリーンショット](/images/advanced-features/error-suffix-customization/115d4d0-errorsuffix1.png)

ステップが失敗すると、システムのエラー文にサフィックスが連結され、次の形式で表示されます。

```text
<testim error>. Details: <user error>
```

![エラーサフィックス設定のスクリーンショット](/images/advanced-features/error-suffix-customization/0253da5-errorsuffix2.png)
