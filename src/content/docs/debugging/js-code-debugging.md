---
title: JS コードデバッグ
description: Chrome DevTools を使用してコードベースのステップ内の JavaScript コードをデバッグする方法。サポートされるステップとデバッグ手順。
category: デバッグ
order: 8005
updated: '2025-09-22'
sourceUrl: 'https://docs.tricentis.com/testim/content/debugging-tests/js-code-debugging.htm'
keywords:
  - JavaScript デバッグ
  - JS コード
  - Chrome DevTools
  - 開発者ツール
  - カスタムアクション
  - コードデバッグ
  - ブレークポイント
  - コンソール
  - デバッグモード
  - スクリプト実行
---

Chrome Developer Tools を使用してコードベースのステップ内の JS コードをデバッグします。

Testim の一部のステップ（以下のサポートされるステップのリストを参照）では、関数エディターに入力されるステップ内で JS コードを使用する機能が提供されています。テストが実行されると、このコードは Web ブラウザ上で実行される AUT（テスト対象アプリケーション）で実行されます。Testim では、標準の Chrome DevTools を使用して JS コードをデバッグできます。このプロセスの一環として、Chrome DevTools が AUT ブラウザウィンドウで開かれ、特にステップのコードを指し示します。そのため、ユーザーは Chrome DevTools が提供するデバッグ機能を活用できます。デバッグが完了すると、セッションはシームレスに Testim エディターにフォーカスを戻します。

## サポートされるステップ

- Add custom action（カスタムアクションの追加）
- Add custom validation（カスタム検証の追加）
- Add custom wait for（カスタム待機の追加）
- Validate email（メール検証）
- Add network validation（ネットワーク検証の追加）
- API validate（API 検証）
- API action（API アクション）

## サポートされるステップ内の JS コードのデバッグ

以下の手順は、既存のテストで以前に作成された Custom Action ステップ内の JS コードをデバッグする方法を示していますが、サポートされるすべてのステップに同じことが当てはまります。

**JS コードをデバッグするには:**

1. **Custom Action**ステップの直前にブレークポイントを挿入します。これは仮想ブレークポイントでもかまいません。例えば、「step over」後の仮想ブレークポイントです。\
   ![ブレークポイント挿入の例](/images/debugging/js-code-debugging/26e4913-pause.jpg)

2. デバッグモードでローカルでテストを実行します。\
   ![デバッグモードでのローカル実行ボタン](/images/debugging/js-code-debugging/3a7d8f6-runindebug.jpg)\

   テストが実行され、デバッグコントロールが表示されます。

3. テストがブレークポイントに達したら、デバッグコントロールメニューの**Step Into**ボタンをクリックします。\
   ![Step Into ボタン](/images/debugging/js-code-debugging/0be9e49-stepinto.jpg)\

   次の通知が表示されます。\
   ![Code Debugging 通知メッセージ](/images/debugging/js-code-debugging/18b8bde-codedebugging.jpg)

4. **Go To AUT**をクリックします。\
   ![Go To AUT ボタン](/images/debugging/js-code-debugging/775b444-gotoaut.jpg)\

   AUT が**Code Debugging**メッセージとともに表示されます。\
   ![AUT ウィンドウに表示される Code Debugging メッセージ](/images/debugging/js-code-debugging/aed5a6a-debugging.jpg)

5. AUT の Web ブラウザで、**Chrome Dev Tools（Win - 'Ctrl + Shift + I'と'F12'、ブラウザの右クリックから'Inspect'、Mac - 'Ctrl + Option + I'、ブラウザの右クリックから'Inspect'）** を開きます。
6. メッセージ自体で、**DEVTOOL IS OPEN**ボタンをクリックします。**Don't show again in this session**チェックボックスを選択したままにしておくと、このセッション中（つまり、同じテスト内の他のステップ）にこのステップを実行する必要がなくなります。\
   ![DEVTOOL IS OPEN メッセージ](/images/debugging/js-code-debugging/5fb0ee6-devtooldopen.jpg)\

   開発者ツールには、追加された JS コードの直前のコードレベルのブレークポイントが表示され、ステップからの JS コードの直前に「debugger」行が表示されます。

7. この時点で、Chrome Devtools のデバッグ機能を使用して JS コードをデバッグできます。
8. JS コードのデバッグが完了したら、AUT で**Result Script Execution**ボタンをクリックします。\
   ![Result Script Execution ボタン](/images/debugging/js-code-debugging/d025aa1-resumescriptexecution.jpg)\

   次のメッセージが表示されます。\
   ![スクリプト実行結果のメッセージ](/images/debugging/js-code-debugging/f4a1bde-message.jpg)

9. **Go back to the editor**リンクをクリックします。\
   フォーカスが Testim エディターに戻り、デバッグされたステップの後に仮想ブレークポイントが表示されます。この時点で、デバッグプロセスを続行するか、変更を加えたテストを保存できます。\
   ![仮想ブレークポイントの表示](/images/debugging/js-code-debugging/80326c6-virtual.jpg)
