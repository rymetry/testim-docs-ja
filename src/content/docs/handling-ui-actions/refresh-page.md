---
title: ページ更新ステップ
description: Testimでページ更新ステップを追加し、ブラウザでページの最新バージョンを表示する方法を学びます。
category: 高度な編集
order: 5034
updated: '2025-09-15'
sourceUrl: 'https://help.testim.io/docs/refresh-page'
keywords:
  - testim
  - refresh-page
  - handling-ui-actions
  - ページ更新
  - リフレッシュ
  - ブラウザ更新
  - タブ更新
  - マルチタブテスト
  - テスト自動化
  - UI操作
---

テストに更新ステップを追加する

一部のWebページでは、ページの更新を表示するために更新が必要です。これは、WebページがサーバーUで更新されているが、ブラウザにまだ変更が表示されていない場合に発生します。

「更新」ステップは、ブラウザでページとその最新バージョンを表示するための新しいリクエストを送信します。このステップは、次のステップに進む前に、ブラウザがHTML、CSS、スクリプトのコンテンツのダウンロードを完了するまで待機します。

## 現在のブラウザタブに更新ステップを追加する

デフォルトでは、「更新」ステップは、テストが実行されている現在のタブを更新します。新しいタブ/ブラウザウィンドウ(例:マルチタブテスト)で「更新」を有効にする場合は、[次のセクション](#新しいブラウザタブに更新ステップを追加するマルチタブテスト)で説明されているように、代わりに「カスタム」ステップを使用する必要があります。

:fa-arrow-right: **現在のブラウザタブに更新ステップを追加するには:**

1. **テストリスト > テスト**に移動してテストを開きます。
2. 既存のステップ間の**矢印**または最後のステップの後の**+ボタン**にカーソルを合わせます。

![ステップ矢印](/images/handling-ui-actions/refresh-page/2fd7412-step-arrows.jpg)

3. **Testim定義済みステップ**ボタンを選択します。

![定義済みステップ](/images/handling-ui-actions/refresh-page/6b1e396-predefined-steps.jpg)

4. クイック検索で**更新**を検索するか、**アクション**セクションを展開して**更新**アクションを選択します。

![更新ステップ](/images/handling-ui-actions/refresh-page/38ff664-refresh-step.jpg)

新しい更新ステップが、選択した場所のテストに追加されます。

![更新ステップが追加された](/images/handling-ui-actions/refresh-page/0a5d62a-refresh-step-added.jpg)

## 新しいブラウザタブに更新ステップを追加する(マルチタブテスト)

新しいブラウザタブで現在のURLを開くステップを追加できます。これは、基本的に新しいタブで現在のページを更新することになります。

:fa-arrow-right: **新しいブラウザタブに更新ステップを追加するには:**

1. **テストリスト > テスト**に移動してテストを開きます。
2. 既存のステップ間の**矢印**または最後のステップの後の**+ボタン**にカーソルを合わせます。

![ステップ矢印](/images/handling-ui-actions/refresh-page/90cd426-step-arrows.jpg)

3. **Testim定義済みステップ**ボタンを選択します。

![定義済みステップ](/images/handling-ui-actions/refresh-page/634daca-predefined-steps.jpg)

4. クイック検索で**カスタム**を検索するか、**アクション**セクションを展開して**カスタムアクションを追加**を選択します。

![カスタムアクションを追加](/images/handling-ui-actions/refresh-page/b4a9625-add-custom-action.jpg)

5. 新しいステップの**名前**を入力します。
6. ステップを**共有ステップ**にするかどうかを指定します。これにより、現在のテストおよび他のテストで再利用できるステップになります。
7. 共有ステップを保存する場所を識別するために**共有ステップフォルダ**を選択します。
8. **ステップを作成**ボタンをクリックします。

![共有ステップ](/images/handling-ui-actions/refresh-page/bf7b3ed-shared-step.jpg)

9. JavaScriptエディターが開きます。エディターで、新しいタブでページを更新するJavaScriptコードを入力します。

10. Windowインターフェースのメソッドは、指定されたリソースを指定された名前の新しいブラウジングコンテキスト(ウィンドウまたはタブ)に読み込みます。

```javascript
var window = window.open(url, windowName, [windowFeatures]);
```

**例:**

```javascript
var win = window.open("d/1UhvH-KJl--mqvQVrzcmnOsE8VX3pvw/edit", "name");
win.location.reload();
```

11. **戻る矢印**をクリックしてテストに戻ります。

![JavaScriptエディターの戻る矢印](/images/handling-ui-actions/refresh-page/61a3a01-javascript-editor-back-arrow.jpg)

新しいカスタムアクションステップが、選択した場所のテストに追加されます。

![カスタムアクションステップが追加された](/images/handling-ui-actions/refresh-page/1c953fc-custom-action-step-added.jpg)

## 更新ステップを編集する

ステップが作成された後、ステッププロパティを編集することで、更新ステップの動作をさらにカスタマイズできます。

:fa-arrow-right: **既存の更新ステップを編集するには:**

1. テスト内の更新ステップにカーソルを合わせて、プロパティアイコンをクリックします。

![更新ステップにカーソルを合わせる](/images/handling-ui-actions/refresh-page/548bdd1-refresh-step-hover.jpg)

2. 希望する動作に基づいてプロパティを更新します。

   * **説明** - ステップの名前を変更します。
   * **このステップが失敗した場合** - ステップが失敗した場合に何をすべきかを指定します。
   * **ステップを実行するタイミング** - このステップをテストに含めるタイミングを指定します。条件には、要素/要素テキストの存在、またはカスタムJS関数が含まれる場合があります。
   * **タイムアウトを上書き** - タイムアウト後でも更新が発生するまで待機し続けます。
