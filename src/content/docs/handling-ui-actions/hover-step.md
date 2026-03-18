---
title: ホバーステップ
description: Testim でホバーステップを記録し、マウスオーバーで表示されるメニューやツールチップの動作をテストする方法を学びます。
category: 高度な編集
order: 5036
updated: '2025-09-15'
sourceUrl: 'https://help.testim.io/docs/hover-step'
keywords:
  - testim
  - hover-step
  - handling-ui-actions
  - ホバー
  - マウスオーバー
  - ツールチップ
  - メニュー表示
  - テスト自動化
  - UI 操作
  - 要素操作
---

アプリをテストする際に「ホバー」ステップを記録する方法を学びます

ホバー操作を持つ要素の動作をテストするために、ホバーステップを追加します。例えば、ホバー時のみ開くメニュー、ツールチップ、または新しい要素の表示（ボタン、画像上の説明など）です。

:::warning{title="注意"}
ホバーステップの追加は（現在）自動的にキャプチャできないため、エディターで追加する必要があります。
:::

**テストにホバーステップを追加するには:**

1. **テストリスト > テスト**に移動してテストを開きます。
2. 既存のステップ間の**矢印**または最後のステップの後の**+ボタン**にカーソルを合わせます。

![ステップ矢印](/images/handling-ui-actions/hover-step/5e19132-step-arrows.jpg)

3. **Testim 定義済みステップ**ボタンを選択します。

![定義済みステップ](/images/handling-ui-actions/hover-step/ec705b4-predefined-steps.jpg)

4. クイック検索で**ホバー**を検索するか、**アクション**セクションを展開して**ホバーアクションを追加**を選択します。

![ホバーアクションを追加](/images/handling-ui-actions/hover-step/217c38b-add-hover-action.jpg)

5. Testim はテストの関連ページを開きます。ページ要素にマウスをホバーしてクリックします。

![ページ要素](/images/handling-ui-actions/hover-step/e7095e9-page-element.jpg)

:::warning{title="注意"}
「要素を選択するにはベース URL を開くか、関連するステップまでテストを実行してください」というメッセージが表示された場合、これはアプリケーション内からコンポーネントを選択できるように、最初にテストを実行する必要があることを意味します。
:::

新しいホバーステップが、選択した場所のテストに追加されます。

![ホバーステップが追加された](/images/handling-ui-actions/hover-step/a533136-hover-step-added.jpg)

## ホバーした要素への検証の追加

現在、Testim はホバーした要素への可視性検証の追加を完全にはサポートしていません。ステップ検証の詳細をご覧ください。

**ホバーした要素が表示されていることを検証するには:**

1. ステップにカーソルを合わせて、**プロパティ**アイコンを選択します。

![ホバーステッププロパティ](/images/handling-ui-actions/hover-step/ebce7b2-hover-step-properties.jpg)

2. プロパティパネルで**要素が表示されている必要があります**を選択します。

![要素が表示されている必要があります](/images/handling-ui-actions/hover-step/f63b275-element-must-be-visible.jpg)

:::warning{title="注意"}
パフォーマンスを向上させるには、アプリのコードと CSS を更新して、マウスアウト時に要素が表示されるようにしてください。
:::
