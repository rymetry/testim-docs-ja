---
title: グループコンテキスト
description: グループコンテキスト機能を使って、同じグループステップを異なる要素やタブなど複数のコンテキストで再利用する方法を説明します。
category: 高度な編集
order: 5052
updated: '2025-09-22'
sourceUrl: 'https://docs.tricentis.com/testim/content/advanced-editing/group-context.htm'
keywords:
  - グループコンテキスト
  - 共有グループ
  - 再利用
  - コンテキスト
  - DOM
  - 繰り返し要素
  - テーブル行
  - タブ
  - Testim グループ
  - テスト設計
---

**グループコンテキスト**は、ステップの再設定を手作業で行わずに、グループを別の要素（コンテキスト）上で実行できる機能です。グループにコンテキストを設定すると、内部ステップのロケータが新しいコンテキストに合わせて自動的・動的に変換されます。\
例: ある目的地への予約フローをグループ化済みなら、別の目的地に対してもグループの詳細を修正せずに、そのまま流用できます。

:::note
グループと共有グループの基本は [グループ](/docs/editing-tests/groups) を参照してください。
:::

この機能が有効な例:

- 繰り返し要素 — ページ内で繰り返される類似要素に同一ステップを当てたい場合
- テーブル行 — 各行に同一ステップを当てたい場合
- タブやフレーム — あるタブで記録したグループを別タブで使いたい場合（第二タブ関連のステップをグループ化し、以下の手順でグループコンテキストを設定）

:::note
マルチタブ環境では、記録時に特定のタブ番号と URL が保存されます。再生時はこの 2 つから対象タブが決定されるため、URL が同じであれば実際のタブ番号が変わることがあります。
:::

## グループにコンテキストを設定する

カスタムコンテキストを割り当てる際は、DOM の最も大きい要素（例: Body）を選ぶことを推奨します（詳細は[DOM で最も大きい要素を選ぶ](/docs/advanced-editing/group-context#dom-で最も大きい要素を選ぶ)）。以下は共有グループを新しいコンテキストで再利用する前提の手順です（グループの作成は[こちら](/docs/editing-tests/groups#グループの作成)）。\
**設定手順:**

![グループコンテキストのスクリーンショット](/images/advanced-features/group-context/3d67f16-Jan-31-2021_08-33-20.gif)

1. 追加したい位置の **>（矢印）** にカーソルを合わせます。

![グループコンテキストのスクリーンショット](/images/advanced-features/group-context/8acff4c-Testim_115a.png)

アクションオプションが表示されます。

![グループコンテキストのスクリーンショット](/images/advanced-features/group-context/014defd-Testim_116a.png)

2. **フォルダー**（Shared steps）をクリックします。\
   共有ステップメニューが開きます。

![グループコンテキストのスクリーンショット](/images/advanced-features/group-context/ab52494-Testim_070_r.png)

3. 既存のグループステップのリストから、目的のグループを選択します。\
   グループがテストに追加されます。

![グループコンテキストのスクリーンショット](/images/advanced-features/group-context/b9e1760-Testim_117.png)

4. そのグループ左の **>（矢印）** にカーソルを合わせます。\
   アクションオプションが表示されます。
5. **Toggle Breakpoint** をクリックします。

![グループコンテキストのスクリーンショット](/images/advanced-features/group-context/c007533-Testim_118_r.png)

6. **Play Scenario** でブレークポイントまで実行します。

![グループコンテキストのスクリーンショット](/images/advanced-features/group-context/42c85ed-Testim_119a.png)

7. 追加したグループにカーソルを合わせ、**Show Properties**をクリックします。

![グループコンテキストのスクリーンショット](/images/advanced-features/group-context/cbec1d6-Testim_001a.png)

右側にプロパティパネルが開きます。

8. Context の **▼** をクリックし、**Custom** を選択します。

![グループコンテキストのスクリーンショット](/images/advanced-features/group-context/5c07e48-Testim_002a.png)

AUT ブラウザが開きます。

9. AUT 上で、グループを実行したい要素（コンテキスト）を選択します。DOM で最も大きい要素を選ぶことが重要です（詳細は前述のリンク参照）。

:::note
既定では「Context selection mode」に入り、繰り返し要素が強調表示されます。通常モードに戻すにはキーボードの Q を押します。
:::

10. 選択した要素は **Properties** の Context セクションにある **Target element** に表示されます。

![グループコンテキストのスクリーンショット](/images/advanced-features/group-context/2402cd0-Testim_003.png)

新しいコンテキストがグループに自動適用され、個々のステップを再割り当てする必要はありません。

11. **Toggle Breakpoint** をクリックしてブレークポイントを解除します。

:::note
Testim が、提供されたコンテキスト内で実行すべきステップと、外で実行すべきステップを自動判別します。
:::

### DOM で最も大きい要素を選ぶ

コンテキスト選択時は、DOM で最も大きい要素（例: Body）を選択すると、すべてのステップがコンテキストに含まれます。
**選び方:**

1. **Properties** パネル上で **Context** プロパティから **Custom** を選択した後、キーボードで **Q** キーを押し、コンテキスト選択モードに切り替えます。
2. 対象のブラウザタブで任意の要素を選びます。
3. **↑** を複数回押し、DOM の最上位（例: Body）まで移動します。
4. **Enter** で選択します。

![グループコンテキストのスクリーンショット](/images/advanced-features/group-context/268664d-groupcontext.gif)

### 試してみる

[こちら](https://app.testim.io/#/project/GYXR2qZC/branch/master/test/HGAvmbTcfT) のテストでは、1 つのグループステップを複数のコンテキストに適用しています。共有グループ “book” を使い、コンテキストを変更して別の目的地の予約を作成してみてください。
