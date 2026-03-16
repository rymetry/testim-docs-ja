---
title: キーボードショートカットステップ
description: >-
  キーボードショートカットステップを使って Ctrl+C や Command+F などのショートカットをテスト中の AUT に送信し、Windows /
  Mac 両方で同じテストを再生する方法を説明します。
category: 高度な編集
order: 5061
updated: '2025-09-22'
sourceUrl: 'https://help.testim.io/docs/keyboard-shortcut-step'
keywords:
  - キーボードショートカット
  - ショートカットステップ
  - キーボード入力
  - Ctrl+C
  - Command
  - Mac
  - Windows
  - 特殊ステップ
  - Testim
  - ショートカット送信
---

実行時に指定したキーボードショートカット（例: Ctrl + C）をAUTへ送信します。定義済みステップから手動で追加できます。Windows/Macの両方で再生をサポートし、記録環境に応じてコマンドを自動変換します（Windowsで記録した Ctrl+C は、Macでは ⌘+C に変換）。

:::note
実行時のテスト構成で指定されたOSに合わせて送信されます（デフォルト構成が実行環境と異なる場合でも構成のOSが優先）。
:::

# サポートされるショートカット

以下の種類をサポートします。未対応の組み合わせは “unsupported keyboard shortcut” エラーになります。

<table class="md-table md-table-3cols">
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
    Alt/Ctrl 修飾キー + 文字/数字/記号キー
   </td>
   <td>
    ALT + X / CTRL + 1
   </td>
   <td>
    Option + X
   </td>
  </tr>
  <tr>
   <td>
    修飾キー + ファンクションキー
   </td>
   <td>
    Alt + F3 / Ctrl + F10
   </td>
   <td>
    Option + F3 / Command + F10
   </td>
  </tr>
  <tr>
   <td>
    修飾キー 2つ + 文字/数字/記号キー
   </td>
   <td>
    Alt + Ctrl + X / Ctrl + Shift + 1
   </td>
   <td>
    Option + Command + X / Command + Shift + 1
   </td>
  </tr>
  <tr>
   <td>
    修飾キー 2つ + ファンクションキー
   </td>
   <td>
    Alt + Ctrl + F12 / Ctrl + Shift + F7
   </td>
   <td>
    Option + Control + F12 / Command + Shift + F7
   </td>
  </tr>
 </tbody>
</table>

# 手動でショートカットステップを追加

**手順:**

1. 追加位置の + にカーソルを合わせ、Testim 定義済みステップを選択。
2. **Actions** 配下の **Add keyboard shortcut** を選択。
3. **Properties** の **Keyboard Shortcut** で次のいずれかを実行:
   1. Windows 利用時は **Windows** 欄でショートカットを入力すると、Mac への対応が **Mac** 欄に表示されます（Mac 実行時に使用）。
   2. Mac 利用時は **Mac** 欄でショートカットを入力すると、Windows への対応が **Windows** 欄に表示されます（Windows 実行時に使用）。
4. 変換を無効化したい場合は **Unsync Fields** をクリックします。

   ![キーボードショートカットステップのスクリーンショット](/images/special-steps/keyboard-shortcut-step/7d37244-unlink.png)
