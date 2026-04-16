---
title: ターゲット要素のプロパティ編集
description: ターゲット要素の編集方法を学びます。要素のハイライト、再割り当て、改善、Smart Locators の表示方法を解説します。
category: テスト編集
order: 4003
updated: '2025-09-19'
sourceUrl: 'https://docs.tricentis.com/testim/content/editing-tests/editing-your-tests/editing-target-element-properties.htm'
keywords:
  - ターゲット要素
  - Smart Locators
  - 要素の再割り当て
  - ロケーター
  - プロパティ編集
  - ハイライト
  - 改善
  - DOM
  - セレクタ
  - 自動改善
---

ターゲット要素とは、AUT（テスト対象アプリケーション）ブラウザでこのステップのメイン要素として選択された要素です。ターゲット要素は編集可能です。要素自体は、プロパティパネルにサムネイル画像として表示されます。\
サムネイルの上にマウスを移動すると、以下のオプションが表示されます：**Highlight**、**Reassign**、**Improve**、**View locators**

- **Highlight** - Highlight をクリックすると、AUT ブラウザが開き、ターゲット要素がピンク色で一時的にハイライトされます。これは、AUT ブラウザでターゲット要素が何であるかを視覚的に確認できるため便利です。

- **Reassign** - このオプションを使用すると、ターゲット要素を AUT の別のターゲット要素に置き換えることができます。この場合、システムはステップのターゲット要素のすべてのロケーターを削除して上書きします。このオプションは、完全に異なる要素をターゲットとして選択する場合に関連します。例えば、ターゲット要素が「login」と表示される青いボタンでしたが、現在このボタンが存在しなくなった場合、Reassign 機能を使用して新しいターゲット要素を選択する必要があります。[ターゲット要素の再割り当て](#ターゲット要素の再割り当て)を参照してください。

- **Improve** - ターゲット要素がまだ存在するが、その周辺の DOM が変更された場合、Improve 機能を使用できます。この場合、システムはターゲット要素の既存のロケーターと新しく収集されたロケーターを比較し、ステップのターゲット要素を見つけやすくするためにロケーターを更新（上書きではなく）します。システムは、どのセレクタが更新され、どのセレクタがそのまま残り、どのセレクタが存在しなくなったかを調べて、ターゲット要素のセレクタを更新します。例えば、ターゲット要素が「login」と表示される青いボタンでしたが、同じボタンが緑色に変わり「LOG-In」と表示されるようになった場合、Improve 機能を使用する必要があります。[ターゲット要素の改善](#ターゲット要素の改善)を参照してください。

- **View locators** - 記録中に要素が選択されると（クリック、ホバー、入力など）、Testim のアルゴリズムは要素に関連する数百の属性を分析します。次に、属性に重みを割り当てて要素を一意に識別します。これらの属性は**ロケーター**として知られています。Testim の Smart Locators は、各テスト実行で学習します。一部の属性が変更された場合、Smart Locator は他の属性を使用して要素を識別します。このように、要素が変更されても機能している場合、Testim の Smart Locators はそれを見つけ、テストが失敗するのを防ぎます。

このオプションを使用すると、Smart Locator が要素をどのように識別しているかを確認できます。ロケーターの表示の詳細については、[Smart Locators の表示](#smart-locatorsの表示)を参照してください。

## ターゲット要素のハイライト

ターゲット要素に変更を加える前に、AUT ブラウザで要素をハイライトして、現在のターゲット要素がどれであるかを視覚的に確認できます。

**ターゲット要素をハイライトするには：**

1. ターゲット要素をハイライトしたいステップの上にマウスを移動し、**Show Properties** ボタンをクリックします。

   ![プロパティボタン](/images/steps-editing-tests/editing-target-element-properties/0663ede-properties.png)

   プロパティパネルが右側に開きます。

   ![プロパティパネル](/images/steps-editing-tests/editing-target-element-properties/ff0143d-propertiespanel.png)

2. ターゲット要素のサムネイルの上にマウスを移動し、**Highlight** リンクをクリックします。

   ![ハイライトリンク](/images/steps-editing-tests/editing-target-element-properties/c8bbca9-highlight.png)

   Testim は AUT ブラウザウィンドウでターゲット要素をハイライトします。

   ![ハイライトされたターゲット要素](/images/steps-editing-tests/editing-target-element-properties/7f1dc09-targetelementhighlighted.png)

## ターゲット要素の再割り当て

このオプションを使用すると、ターゲット要素を AUT の別のターゲット要素に置き換えることができます。この場合、システムはステップのターゲット要素のすべてのロケーターを削除して上書きします。このオプションは、完全に異なる要素をターゲットとして選択する場合に関連します。例えば、ターゲット要素が「login」と表示される青いボタンでしたが、現在このボタンが存在しなくなった場合、Reassign 機能を使用して新しいターゲット要素を選択する必要があります。

**「click」ステップでターゲット要素を再割り当てするには：**

1. 再割り当てしたいステップの上にマウスを移動し、**Show Properties** ボタンをクリックします。

   ![プロパティボタン](/images/steps-editing-tests/editing-target-element-properties/b363245-properties.png)

   ![プロパティパネル](/images/steps-editing-tests/editing-target-element-properties/a45b094-propertiespanel.png)

   プロパティパネルが右側に開きます。

   ![Reassign リンク](/images/steps-editing-tests/editing-target-element-properties/8fadf6c-reassign.png)

2. ターゲット要素のサムネイルの上にマウスを移動し、**Reassign** リンクをクリックします。

3. AUT ブラウザウィンドウで Base URL がまだ開いていない場合、Testim は通知を表示します。通知の **Open base URL** リンクをクリックし、ターゲット要素の再割り当てを再試行してください。

   ![Base URL を開く](/images/steps-editing-tests/editing-target-element-properties/f1464de-baseurl.png)

4. Testim はスタンバイモードになります。AUT ブラウザで、新しいターゲット要素の上にマウスを移動し、クリックして選択します。

   ![再割り当て対象の選択](/images/steps-editing-tests/editing-target-element-properties/e90a2a1-selectreassignment.png)

   プロパティパネルの Target element ボックスでターゲット要素が更新されます。

   ![更新されたターゲット](/images/steps-editing-tests/editing-target-element-properties/5fac23e-updatedtarget.png)

## ターゲット要素の改善

ターゲット要素がまだ存在するが、その周辺の DOM が変更された場合、Improve 機能を使用できます。この場合、システムはターゲット要素の既存のロケーターと新しく収集されたロケーターを比較し、ステップのターゲット要素を見つけやすくするためにロケーターを更新（上書きではなく）します。システムは、どのセレクタが更新され、どのセレクタがそのまま残り、どのセレクタが存在しなくなったかを調べて、ターゲット要素のセレクタを更新します。例えば、ターゲット要素が「login」と表示される青いボタンでしたが、同じボタンが緑色に変わり「LOG-In」と表示されるようになった場合、Improve 機能を使用する必要があります。

**「click」ステップでターゲット要素を改善するには：**

1. 再割り当てしたいステップの上にマウスを移動し、**Show Properties** ボタンをクリックします。

   ![プロパティボタン](/images/steps-editing-tests/editing-target-element-properties/4934439-properties.png)

   ![プロパティパネル](/images/steps-editing-tests/editing-target-element-properties/a45b094-propertiespanel.png)

   プロパティパネルが右側に開きます。

   ![クリック可能な要素](/images/steps-editing-tests/editing-target-element-properties/765e00b-small-clicklogin.png)

2. ターゲット要素のサムネイルの上にマウスを移動し、**Improve** リンクをクリックします。

3. AUT ブラウザウィンドウで Base URL がまだ開いていない場合、Testim は通知を表示します。通知の **Open base URL** リンクまたは **Run test to relevant step** をクリックし、ターゲット要素の改善を試みてください。

   ![Base URL を開く](/images/steps-editing-tests/editing-target-element-properties/f1464de-baseurl.png)

   ![改善された要素](/images/steps-editing-tests/editing-target-element-properties/543c4f1-small-improve.png)

   ![改善対象のボタン](/images/steps-editing-tests/editing-target-element-properties/43cfd47-small-login.png)

4. Testim はスタンバイモードになります。AUT ブラウザで、ターゲット要素の上にマウスを移動し、クリックして選択します。

   プロパティパネルの Target element ボックスでターゲット要素が更新されます。

## Smart Locators の表示

Smart Locators は、Testim がページ上の各要素を一意に識別する方法です。Testim は DOM 全体を検査し、ターゲット要素を識別するのに最も有用な属性を決定します。これらの属性には、ターゲット要素自体の側面と親要素が含まれます。ロケーターパネルで、ターゲット要素を見つけるために使用される属性を表示できます。また、ターゲット要素とその親要素を視覚的に識別することもできます。

:::warning
Smart Locators の属性を編集することは一般的に推奨されません。ロケーターを編集する前に、サポートにご相談ください。また、Smart Locators を編集すると、手動編集を上書きしないように、今後 Auto Improved Locators などの機能が適用されなくなることに注意してください。
:::

ステップのターゲット要素のロケーターを表示するには：

1. Smart Locators を表示したいステップの上にマウスを移動し、**Show Properties** ボタンをクリックします。

   ![プロパティボタン](/images/steps-editing-tests/editing-target-element-properties/4934439-properties.png)

   ![プロパティパネル](/images/steps-editing-tests/editing-target-element-properties/2aaf0e7-propertiespanel.png)

   プロパティパネルが右側に開きます。

2. ターゲット要素のサムネイルの上にマウスを移動し、**View locators** リンクをクリックします。

   ![View locators リンク](/images/steps-editing-tests/editing-target-element-properties/e93f68d-viewlocators.png)

   ロケーターパネルが開き、Testim の AI によって決定されたターゲット要素と関連する親要素が表示されます。

   ![ロケーターパネル全体](/images/steps-editing-tests/editing-target-element-properties/dcaeb9b-Testim_Editing_Tests_029a.png)

3. 要素の横にある下矢印をクリックすると、Smart Locators と AI が割り当てた重みが表示されます。

   要素を定義する属性/セレクタのリストが表示されます。チェックマークは、ロケーターがアクティブであることを示します。各属性の横にある塗りつぶされた星の数は、AI がその属性に割り当てた相対的な重みを表します。重みが高いほど、AI はそれを考慮します。

:::note
異なるロケーターを選択/選択解除したり、コンテンツを編集したりできます。Testim のアルゴリズムがこれらの評価を自動的に決定していることに注意してください。アプリケーションが予期しない動作をする場合、要素を識別するために特定の属性を手動で選択することで安定性を向上させることができます。ただし、このような変更を行う前に、Testim サポートに相談することをお勧めします。
:::

   ![ロケーターパネル](/images/steps-editing-tests/editing-target-element-properties/827a8f3-Testim_Editing_Tests_030_r.png)

   ![ロケーターパネルの別表示](/images/steps-editing-tests/editing-target-element-properties/c693307-Testim_Editing_Tests_034a_r.png)

   テストを実行した後、ロケーターパネルを開くと、星の重み付けに加えて、実行結果に基づくパーセンテージスコアが表示されます。

   ![実行後のロケーター](/images/steps-editing-tests/editing-target-element-properties/1f09ed4-Testim_Editing_Tests_033_r.png)

4. 要素を表示している間、表示したい要素の上にマウスを移動し、ターゲットアイコンをクリックすることで、要素を視覚的に識別できます。

   選択した要素が一時的にハイライトされた状態で AUT ブラウザが開きます。

   ![ハイライトされたターゲット要素](/images/steps-editing-tests/editing-target-element-properties/d6ba2d1-targetelementhighlighted.png)

### カラーコーディングの理解

Smart Locators は、要素/セレクタの一意性を理解するのに役立つカラーコーディングも使用しています。

**カラーコーディングを表示するには：**

1. テストを実行します。
2. ステップを選択し、ロケーターパネルを開きます（上記参照）。
3. 目的のロケーターのドロップダウン矢印をクリックします。

   ![閉じたロケーター](/images/steps-editing-tests/editing-target-element-properties/a889052-closed.png)

   ロケーターの関連要素/セレクタがカラーコーディング結果とともに表示されます。

   ![開いたロケーター](/images/steps-editing-tests/editing-target-element-properties/6061882-open.png)

   ![2 色のロケーター](/images/steps-editing-tests/editing-target-element-properties/bdf07d5-twocolors.png)

   色は異なるロケーター間で異なり、色付け（赤、青、紫など）自体に意味はありませんが、以下のロジックが適用されます：

- **ロケーター内の同じ色** - ロケーター内で同じ色を共有する要素/セレクタは、ページ内でこのセレクタに対して一意であることを示します。

- **複数の並列色** - 複数の並列色は、ページ内の追加要素でセレクタが見つかったことを示し、信頼度が低くなる可能性があります。並列色の数は、出現回数を示します。例えば、以下にマークされた要素には 2 つの色があり、ページ上に同じセレクタを持つ 2 つの要素があることを示しています。

- **ロケーター内の異なる色** - ロケーターで使用されている色とは異なる色を含む要素は、記録中にキャプチャされた要素/セレクタから変更されたことを示します。以下の例では、Index 要素の色が異なっていますが、その重みが非常に低かったため、ロケーターの全体的な信頼度レベルに実質的な影響はありませんでした。

  ![インデックス要素](/images/steps-editing-tests/editing-target-element-properties/3c99754-index.png)

- **ロケーターの色** - すべての要素とその重みを考慮した後、システムはロケーターの最上位の色を決定します（通常、ほとんどの要素は同じ色を共有します）。この色は、以下に示すようにロケーターレベルで表示されます。

  ![ロケーターのトップカラー](/images/steps-editing-tests/editing-target-element-properties/5313ab5-top.png)

### Auto Improved Locators

Testim が元のロケーターを自動改善されたロケーターに置き換えた場合、ロケーターパネルの上部に「Locator auto improved」メッセージが表示されます。詳細については、[Locators: Auto Improve](/docs/test-management/locators-auto-improve)を参照してください。

![自動改善されたロケーター](/images/steps-editing-tests/editing-target-element-properties/2f1a2ef-autoimprove.png)
