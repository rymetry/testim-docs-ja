---
title: キーボードを隠す（モバイル）
description: モバイルテストで hideKeyboard が機能しないケースの理由と、カスタムアクションステップを使ってキーボードを安全に閉じる回避策を説明します。
category: 高度な編集
order: 5064
updated: '2025-09-22'
sourceUrl: 'https://docs.tricentis.com/testim/content/advanced-editing/deep-link-mobile/hide-keyboard-mobile.htm'
keywords:
  - キーボードを隠す
  - hideKeyboard
  - モバイルテスト
  - Appium
  - カスタムアクション
  - KEYCODE_BACK
  - KEYCODE_ENTER
  - 特殊ステップ
  - Testim
  - エラー回避
---

一部のサードパーティ環境では、`hideKeyboard` を呼ぶと「ソフトウェアキーボードを隠せない」エラーが返ることがあります。特定のキーボード挙動や端末状態が `Driver.hidekeyboard()` に適切に応答せず、Appium 側で予期しない遷移が発生するためです。回避策として、カスタムアクションを記録してください。作成方法は [カスタムアクションステップ（モバイル）](/docs/advanced-editing/custom-action-step-mobile) を参照。ユースケースに応じて、以下のキーコードを送信します。

- `KEYCODE_BACK (4)` – 戻る操作でキーボードを閉じる（フォーム送信はしない）
- `KEYCODE_ENTER (66)` – フィールド種別に応じて Done/Next をトリガー

以下は Back ボタン相当を送ってキーボードを閉じる例です。

```javascript
// Trigger Android KEYCODE_BACK to hide keyboard

await DRIVER.pressKeyCode(4);
```
