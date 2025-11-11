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

<Table align={["left","left","left"]}>
  <thead>
    <tr>
      <th>
        ショートカットの種類
      </th>

      <th>
        Windows 例
      </th>

      <th>
        Mac 例
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        Alt/Ctrl modifier + char/number/special key
      </td>

      <td>
        ALT + X\
        CTRL + 1 
      </td>

      <td>
        <kbd>⌥ Option</kbd> + <kbd>X</kbd>
      </td>
    </tr>

    <tr>
      <td>
        Modifier + function key
      </td>

      <td>
        Alt + F3\
        Ctrl + F10
      </td>

      <td>
        <kbd>⌥ Option</kbd> + <kbd>F3</kbd>\ <kbd>⌘ Command</kbd> + <kbd>F10</kbd>
      </td>
    </tr>

    <tr>
      <td>
        Modifier (\*2) + char/number/special key
      </td>

      <td>
        Alt + Ctrl + X\
        Ctrl + Shift + 1
      </td>

      <td>
        <kbd>⌥ Option</kbd> + <kbd>⌘ Command</kbd> + <kbd>X</kbd>\ <kbd>⌘ Command</kbd> + <kbd>⇧ Shift</kbd> + <kbd>1</kbd>
      </td>
    </tr>

    <tr>
      <td>
        Modifier (\*2) + function key
      </td>

      <td>
        Alt + Ctrl + F12\
        Ctrl + Shift + F7
      </td>

      <td>
        <kbd>⌥ Option</kbd> + <kbd>⌃ Control</kbd> + <kbd>F12</kbd>\ <kbd>⌘ Command</kbd> + <kbd>⇧ Shift</kbd> + <kbd>F7</kbd>
      </td>
    </tr>
  </tbody>
</Table>

# 手動でショートカットステップを追加

**手順:**

1. 追加位置の + にカーソルを合わせ、Testim 定義済みステップを選択。
2. **Actions** 配下の **Add keyboard shortcut** を選択。
3. **Properties** の **Keyboard Shortcut** で次のいずれかを実行:
   1. Windows 利用時は **Windows** 欄でショートカットを入力すると、Mac への対応が **Mac** 欄に表示されます（Mac 実行時に使用）。
   2. Mac 利用時は **Mac** 欄でショートカットを入力すると、Windows への対応が **Windows** 欄に表示されます（Windows 実行時に使用）。
4. 変換を無効化したい場合は **Unsync Fields** をクリックします。

   ![](/images/special-steps/keyboard-shortcut-step/7d37244-unlink.png)
