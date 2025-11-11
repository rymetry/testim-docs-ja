---
title: 'テキストのクリア（モバイル）'
description: '原文: https://help.testim.io/docs/clear-text-mobile'
category: '特殊ステップ'
order: 8
updated: '2025-11-02'
keywords:
  - testim
  - clear-text-mobile
  - special-steps
---
選択済みの入力フィールドからテキストをクリアします。

## 制限事項

Appium 側の既知の制限により、稀に入力内容がすべてクリアされないことがあります。参考:

* [https://discuss.appium.io/t/flutter-i-cant-get-ios-element-clear-to-work-appium-2-5-1/42194/10](https://discuss.appium.io/t/flutter-i-cant-get-ios-element-clear-to-work-appium-2-5-1/42194/10)
* [https://discuss.appium.io/t/clear-elements-is-not-working/28832/9](https://discuss.appium.io/t/clear-elements-is-not-working/28832/9)
* [https://discuss.appium.io/t/appium-15-1-doesnt-clear-the-field-in-appium-ios/28842/3](https://discuss.appium.io/t/appium-15-1-doesnt-clear-the-field-in-appium-ios/28842/3)

Testim Mobile では回避策として [カスタムアクションステップ](/docs/advanced-features/custom-action-step-mobile) でバックスペースを送信します。例:\
`await DRIVER.sendKeys('\b\b\b\b\b\b\b');`

バックスペースの回数は任意です。[テストデータ](/docs/special-steps/reusable-test-data) に用意した入力文字列の長さ分を送るのが一般的です。
