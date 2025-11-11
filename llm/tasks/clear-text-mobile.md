# 翻訳タスク (clear-text-mobile)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

選択済みの入力フィールドからテキストをクリアします。

## 制限事項

Appium 側の既知の制限により、稀に入力内容がすべてクリアされないことがあります。参考:

- [https://discuss.appium.io/t/flutter-i-cant-get-ios-element-clear-to-work-appium-2-5-1/42194/10](https://discuss.appium.io/t/flutter-i-cant-get-ios-element-clear-to-work-appium-2-5-1/42194/10)
- [https://discuss.appium.io/t/clear-elements-is-not-working/28832/9](https://discuss.appium.io/t/clear-elements-is-not-working/28832/9)
- [https://discuss.appium.io/t/appium-15-1-doesnt-clear-the-field-in-appium-ios/28842/3](https://discuss.appium.io/t/appium-15-1-doesnt-clear-the-field-in-appium-ios/28842/3)

Testim Mobile では回避策として [カスタムアクションステップ](/docs/advanced-features/custom-action-step-mobile) でバックスペースを送信します。例:\
`await DRIVER.sendKeys('\b\b\b\b\b\b\b');`

バックスペースの回数は任意です。[テストデータ](/docs/special-steps/reusable-test-data) に用意した入力文字列の長さ分を送るのが一般的です。
