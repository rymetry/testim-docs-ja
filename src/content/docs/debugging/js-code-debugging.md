---
title: 'JSコードデバッグ'
description: 'Chrome DevToolsを使用してコードベースのステップ内のJavaScriptコードをデバッグする方法。サポートされるステップとデバッグ手順。'
category: 'デバッグ'
order: 5
updated: '2025-11-11'
keywords:
  - testim
  - js-code-debugging
  - debugging
  - JavaScriptデバッグ
  - Chrome DevTools
---

Chrome Developer Toolsを使用してコードベースのステップ内のJSコードをデバッグします。

Testimの一部のステップ（以下のサポートされるステップのリストを参照）では、関数エディターに入力されるステップ内でJSコードを使用する機能が提供されています。テストが実行されると、このコードはWebブラウザ上で実行されるAUT（テスト対象アプリケーション）で実行されます。Testimでは、標準のChrome DevToolsを使用してJSコードをデバッグできます。このプロセスの一環として、Chrome DevToolsがAUTブラウザウィンドウで開かれ、特にステップのコードを指し示します。そのため、ユーザーはChrome DevToolsが提供するデバッグ機能を活用できます。デバッグが完了すると、セッションはシームレスにTestimエディターにフォーカスを戻します。

## サポートされるステップ

* Add custom action（カスタムアクションの追加）
* Add custom validation（カスタム検証の追加）
* Add custom wait for（カスタム待機の追加）
* Validate email（メール検証）
* Add network validation（ネットワーク検証の追加）
* API validate（API検証）
* API action（APIアクション）

## サポートされるステップ内のJSコードのデバッグ

以下の手順は、既存のテストで以前に作成されたCustom Actionステップ内のJSコードをデバッグする方法を示していますが、サポートされるすべてのステップに同じことが当てはまります。

:fa-arrow-right: **JSコードをデバッグするには:**

1. **Custom Action**ステップの直前にブレークポイントを挿入します。これは仮想ブレークポイントでもかまいません。たとえば、「step over」後の仮想ブレークポイントです。\
   ![](/images/debugging/js-code-debugging/26e4913-pause.jpg)
2. デバッグモードでローカルでテストを実行します。\
   ![](/images/debugging/js-code-debugging/3a7d8f6-runindebug.jpg)\
   テストが実行され、デバッグコントロールが表示されます。
3. テストがブレークポイントに達したら、デバッグコントロールメニューの**Step Into**ボタンをクリックします。\
   ![](/images/debugging/js-code-debugging/0be9e49-stepinto.jpg)\
   次の通知が表示されます。\
   ![](/images/debugging/js-code-debugging/18b8bde-codedebugging.jpg)
4. **Go To AUT**をクリックします。\
   ![](/images/debugging/js-code-debugging/775b444-gotoaut.jpg)\
   AUTが**Code Debugging**メッセージとともに表示されます。\
   ![](/images/debugging/js-code-debugging/aed5a6a-debugging.jpg)
5. AUTのWebブラウザで、**Chrome Dev Tools（Win - 'Ctrl + Shift + I'と'F12'、ブラウザの右クリックから'Inspect'、Mac - 'Ctrl + Option + I'、ブラウザの右クリックから'Inspect'）**を開きます。
6. メッセージ自体で、**DEVTOOL IS OPEN**ボタンをクリックします。**Don't show again in this session**チェックボックスを選択したままにしておくと、このセッション中（つまり、同じテスト内の他のステップ）にこのステップを実行する必要がなくなります。\
   ![](/images/debugging/js-code-debugging/5fb0ee6-devtooldopen.jpg)\
   開発者ツールには、追加されたJSコードの直前のコードレベルのブレークポイントが表示され、ステップからのJSコードの直前に「debugger」行が表示されます。
7. この時点で、Chrome Devtoolsのデバッグ機能を使用してJSコードをデバッグできます。
8. JSコードのデバッグが完了したら、AUTで**Result Script Execution**ボタンをクリックします。\
   ![](/images/debugging/js-code-debugging/d025aa1-resumescriptexecution.jpg)\
   次のメッセージが表示されます。\
   ![](/images/debugging/js-code-debugging/f4a1bde-message.jpg)
9. **Go back to the editor**リンクをクリックします。\
   フォーカスがTestimエディターに戻り、デバッグされたステップの後に仮想ブレークポイントが表示されます。この時点で、デバッグプロセスを続行するか、変更を加えたテストを保存できます。\
   ![](/images/debugging/js-code-debugging/80326c6-virtual.jpg)
