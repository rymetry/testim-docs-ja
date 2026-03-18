---
title: ドラッグ&ドロップステップ
description: ドラッグ&ドロップステップの記録と変更方法。ドロップターゲットの変更やネイティブイベントの使用方法を説明します。
category: 高度な編集
order: 5032
updated: '2025-09-15'
sourceUrl: 'https://help.testim.io/docs/drag-drop-step'
keywords:
  - ドラッグアンドドロップ
  - UI操作
  - ドラッグ&ドロップ
  - ドロップターゲット
  - ネイティブイベント
  - テスト記録
  - 要素操作
  - Webテスト
  - 自動化テスト
  - Chrome拡張
---

テストでドラッグ&ドロップステップを記録および変更する方法を学びます

ドラッグ&ドロップの操作は、テスト記録時に自動的に記録されます。

**テストにドラッグ&ドロップステップを追加するには:**

1. 新しいテストを作成し、アクションメニューの**記録**ボタンをクリックします。

![記録ボタン](/images/handling-ui-actions/drag-drop-step/99455e3-record-button.jpg)

2. アプリまたはページに移動し、ドラッグ&ドロップ機能を使用します。

:::note
要素はタブ/フレーム間でドラッグ&ドロップできません。
:::

![ドラッグ&ドロップの実行](/images/handling-ui-actions/drag-drop-step/33256cf-dd1.gif)

Testim はドラッグ&ドロップステップを自動的にテストに追加します。

![ドラッグステップが追加された](/images/handling-ui-actions/drag-drop-step/62957a2-drag-step-added.jpg)

## 「ドロップ」ターゲットの変更

デフォルトでは、ドラッグ&ドロップステップを含むテストを実行すると、ドラッグされた要素は元の記録と同じページ位置にドロップされます。ただし、ドラッグ&ドロップステップが作成されたら、任意のページ位置に要素をドロップするようにステップを更新できます。

**ドロップターゲットを変更するには:**

1. **ドラッグ**テストステップを選択します。

![ドラッグステップの選択](/images/handling-ui-actions/drag-drop-step/6709e58-drag-step-added.jpg)

2. アクションメニューで**ステッププロパティを表示**をクリックします。

![ステッププロパティを表示](/images/handling-ui-actions/drag-drop-step/37573df-show-step-properties-gear-icon.jpg)

3. **指定した要素にドロップ**を選択します。

![指定した要素にドロップ](/images/handling-ui-actions/drag-drop-step/5630460-drop-specified-element.jpg)

4. **ドラッグステップを変更**することを確認します。

![ドラッグステップを変更](/images/handling-ui-actions/drag-drop-step/08d55e3-change-drag-step.jpg)

5. Testim がページ/アプリに移動するよう指示します。テストで要素をドロップしたい**ページ上の場所をクリック**します。

![ページ要素の選択](/images/handling-ui-actions/drag-drop-step/dd0132c-page-element.jpg)

6. Testim は、新しく定義された場所に要素をドロップするようにドラッグ&ドロップテストステップを更新します。

![ドラッグされた要素が更新された](/images/handling-ui-actions/drag-drop-step/1fa8fad-dragged-element-updated.jpg)

7. ドロップ場所を再度変更するには、**ステッププロパティ**に移動し、現在の**要素にドロップ**設定にカーソルを合わせて、**再割り当て**リンクをクリックします。

![再割り当てリンク](/images/handling-ui-actions/drag-drop-step/00c87cf-reassign-link.jpg)

<br />

## ネイティブイベントの使用

**ネイティブイベント**セクションでは、このテスト構成に限り、ドラッグ&ドロップステップの処理方法のデフォルト設定を別の設定で上書きできます。デフォルトでは、プロジェクトレベルでドラッグ&ドロップステップはネイティブイベントまたは非ネイティブイベントのいずれかを使用するように構成されています。

**ネイティブイベント**実行を有効または無効にするには、次の手順に従います:

1. テストケースを開き、編集したいドラッグ&ドロップステップに移動します。
2. そのステップの**プロパティを表示**アイコンをクリックします。
3. **プロパティ**メニューで、**ネイティブイベント**チェックボックスを選択して有効にします。

   ![ネイティブイベントの設定](/images/handling-ui-actions/drag-drop-step/dbac9aa-image.png)
4. 無効にするには、チェックボックスの選択を解除します。

:::note
このソリューションは Chrome 拡張機能を通じて**ネイティブイベント**を活用するため、 Chrome および Edge ブラウザでのみ利用可能です。

この機能は Firefox と Safari ではサポートされておらず、これらのブラウザの Selenium モードでは機能しないことに注意してください。
:::
