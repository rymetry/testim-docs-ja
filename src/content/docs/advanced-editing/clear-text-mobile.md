---
title: テキストのクリア（モバイル）
description: >-
  モバイルテストで Clear Text
  ステップを使って入力フィールドの文字列を削除し、必要に応じてカスタムアクションでバックスペースを送信する回避策を説明します。
category: 高度な編集
order: 5065
updated: '2025-09-22'
sourceUrl: 'https://docs.tricentis.com/testim/content/advanced-editing/clear-text-mobile.htm'
keywords:
  - Clear Text
  - テキストクリア
  - モバイルテスト
  - 入力フィールド
  - Appium
  - バックスペース
  - カスタムアクション
  - 特殊ステップ
  - Testim
  - 入力リセット
---

選択済みの入力フィールドからテキストをクリアします。

## 制限事項

Appium 側の既知の制限により、稀に入力内容がすべてクリアされないことがあります。参考:

- [https://discuss.appium.io/t/flutter-i-cant-get-ios-element-clear-to-work-appium-2-5-1/42194/10](https://discuss.appium.io/t/flutter-i-cant-get-ios-element-clear-to-work-appium-2-5-1/42194/10)
- [https://discuss.appium.io/t/clear-elements-is-not-working/28832/9](https://discuss.appium.io/t/clear-elements-is-not-working/28832/9)
- [https://discuss.appium.io/t/appium-15-1-doesnt-clear-the-field-in-appium-ios/28842/3](https://discuss.appium.io/t/appium-15-1-doesnt-clear-the-field-in-appium-ios/28842/3)

Testim Mobile では回避策として [カスタムアクションステップ](/docs/advanced-editing/custom-action-step-mobile) を使い、バックスペースキーを送信します。例:

await DRIVER.sendKeys('bbbbbbb');

バックスペースの回数は任意の長さで指定できます。一般的な使用例としては、[テストデータ](/docs/advanced-editing/reusable-test-data) オブジェクト内で入力用に用意した文字列の長さと同じ回数を送信します。
