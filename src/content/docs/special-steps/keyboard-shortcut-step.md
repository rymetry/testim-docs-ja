---
title: 'キーボードショートカットステップ'
description: '原文: https://help.testim.io/docs/keyboard-shortcut-step'
category: '特殊ステップ'
order: 4
updated: '2025-11-02'
keywords:
  - testim
  - keyboard-shortcut-step
  - special-steps
---
実行時に指定したキーボードショートカット（例: Ctrl + C）をAUTへ送信します。定義済みステップから手動で追加できます。Windows/Macの両方で再生をサポートし、記録環境に応じてコマンドを自動変換します（Windowsで記録した Ctrl+C は、Macでは ⌘+C に変換）。

> 📘
>
> 実行時のテスト構成で指定されたOSに合わせて送信されます（デフォルト構成が実行環境と異なる場合でも構成のOSが優先）。

# サポートされるショートカット

以下の種類をサポートします。未対応の組み合わせは “unsupported keyboard shortcut” エラーになります。

| ショートカットの種類 | Windows 例 | Mac 例 |
|------------------|-----------|--------|
| Alt/Ctrl modifier + char/number/special key | ALT + X<br/>CTRL + 1 | <kbd>⌥ Option</kbd> + <kbd>X</kbd> |
| Modifier + function key | Alt + F3<br/>Ctrl + F10 | <kbd>⌥ Option</kbd> + <kbd>F3</kbd><br/><kbd>⌘ Command</kbd> + <kbd>F10</kbd> |
| Modifier (×2) + char/number/special key | Alt + Ctrl + X<br/>Ctrl + Shift + 1 | <kbd>⌥ Option</kbd> + <kbd>⌘ Command</kbd> + <kbd>X</kbd><br/><kbd>⌘ Command</kbd> + <kbd>⇧ Shift</kbd> + <kbd>1</kbd> |
| Modifier (×2) + function key | Alt + Ctrl + F12<br/>Ctrl + Shift + F7 | <kbd>⌥ Option</kbd> + <kbd>⌃ Control</kbd> + <kbd>F12</kbd><br/><kbd>⌘ Command</kbd> + <kbd>⇧ Shift</kbd> + <kbd>F7</kbd> |

# 手動でショートカットステップを追加

**手順:**

1. 追加位置の + にカーソルを合わせ、Testim 定義済みステップを選択。
2. **Actions** 配下の **Add keyboard shortcut** を選択。
3. **Properties** の **Keyboard Shortcut** で次のいずれかを実行:
   1. Windows 利用時は **Windows** 欄でショートカットを入力すると、Mac への対応が **Mac** 欄に表示されます（Mac 実行時に使用）。
   2. Mac 利用時は **Mac** 欄でショートカットを入力すると、Windows への対応が **Windows** 欄に表示されます（Windows 実行時に使用）。
4. 変換を無効化したい場合は **Unsync Fields** をクリックします。

   ![](/images/special-steps/keyboard-shortcut-step/7d37244-unlink.png)
