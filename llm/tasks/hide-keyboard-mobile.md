# 翻訳タスク (hide-keyboard-mobile)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

一部のサードパーティ環境では、`hideKeyboard` を呼ぶと「ソフトウェアキーボードを隠せない」エラーが返ることがあります。特定のキーボード挙動や端末状態が `Driver.hidekeyboard()` に適切に応答せず、Appium 側で予期しない遷移が発生するためです。

回避策として、カスタムアクションを記録してください。作成方法は [カスタムアクションステップ（モバイル）](https://help.testim.io/docs/custom-action-step-mobile) を参照。

ユースケースに応じて、以下のキーコードを送信します。

- `KEYCODE_BACK (4)` – 戻る操作でキーボードを閉じる（フォーム送信はしない）
- `KEYCODE_ENTER (66)` – フィールド種別に応じて Done/Next をトリガー

以下は Back ボタン相当を送ってキーボードを閉じる例です。

```Text JavaScript
// Trigger Android KEYCODE_BACK to hide keyboard

await DRIVER.pressKeyCode(4);
```
