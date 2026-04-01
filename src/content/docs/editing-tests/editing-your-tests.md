---
title: テストの編集
description: 既存テストの編集方法を学びます。新しいステップの追加、コピー&ペースト、ステップの削除、ステップの変更方法を解説します。
category: テスト編集
order: 4002
updated: '2025-09-19'
sourceUrl: 'https://docs.tricentis.com/testim/content/editing-tests/editing-your-tests/index.htm'
keywords:
  - テスト編集
  - ステップ追加
  - コピー&ペースト
  - ステップ削除
  - プロパティ編集
---

テストを作成した後、テスト内の任意の場所に新しいステップを追加したり、削除したりして編集できます。また、プロパティパネルを編集することで既存のステップを変更することもできます。

## ステップの追加/削除

既存のテストに新しいステップを追加する方法は、テストの最後に追加する方法と、ステップ間の特定の場所に追加する方法があります。新しいステップは以下の方法で追加できます：

- **AUT（テスト対象アプリケーション）で記録する**
- **手動で作成する**
- **他の場所からコピー&ペーストする**

## 追加ステップの記録

AUT ブラウザでステップを記録することで、テストの最後または現在のステップ間に追加ステップを追加できます。

### テストの最後に追加ステップを記録する

現在のテストの最後に追加ステップを記録するには：

1. **Toggle Recording アイコン**（上部バー）をクリックして記録を開始します。

   ![記録開始時の画面](/images/steps-editing-tests/editing-your-tests/ee755a1-Screen_Shot_2021-03-13_at_8.31.14.png)

   AUT ブラウザが開き、テストが記録中であることを示すメッセージが表示されます。

   ![記録中の AUT ブラウザ](/images/steps-editing-tests/editing-your-tests/934bfe8-Testim_Editing_Tests_002.png)

2. 新しいテストを記録する場合と同じように、テストに新しいステップを記録します。[テストの記録](/docs/how-to-record-a-test#テスト構成のパラメーター)を参照してください。

3. 新しいステップの記録が完了したら、**Stop Recording** ボタンをクリックします。

   ![Stop Recording ボタン](/images/steps-editing-tests/editing-your-tests/b363dcb-Testim_Editing_Tests_002a.png)

   エディターにリダイレクトされ、新しいステップがテストの最後に追加されます。

### 既存ステップ間に追加ステップを記録する

現在存在する 2 つのステップの間に追加ステップを記録するには：

1. 2 つのステップの間にある **>**（矢印記号）の上にマウスを移動します。

   ![ステップ間の矢印](/images/steps-editing-tests/editing-your-tests/21b115d-Screen_Shot_2021-03-13_at_8.33.46.png)

   アクションオプションが表示されます。

   ![アクションオプション](/images/steps-editing-tests/editing-your-tests/7f67500-Testim_063a_r.png)

2. **赤い円**（Record actions here）をクリックします。

   AUT ブラウザが開き、テストが記録中であることを示すメッセージが表示されます。

   ![記録中の AUT ブラウザ](/images/steps-editing-tests/editing-your-tests/804671e-Testim_Editing_Tests_002.png)

3. 新しいテストを記録する場合と同じように、テストに新しいステップを記録します。[テストの記録](/docs/how-to-record-a-test#テスト構成のパラメーター)を参照してください。

4. 新しいステップの記録が完了したら、**Stop Recording** ボタンをクリックします。

   ![Stop Recording ボタン](/images/steps-editing-tests/editing-your-tests/b8334cb-Testim_Editing_Tests_002a.png)

   エディターにリダイレクトされ、新しいステップが選択した 2 つのステップの間に挿入されます。

## ステップのコピー&ペースト

任意のステップ、ステップのグループ、またはグループステップを、テストまたは別のテスト内の任意の場所にコピー&ペーストできます。

### ステップのコピー

ステップ、ステップのグループ、またはグループステップをクリップボードにコピーするには：

1. コピーしたいステップを選択します。ステップの周りをクリック&ドラッグするか、**CTRL/CMD** キーを押しながら各ステップをクリックします。選択されたステップは青色でハイライトされます。

   ![コピー対象の選択](/images/steps-editing-tests/editing-your-tests/0a39c28-Screen_Shot_2021-03-13_at_8.35.15.png)

   エディターでステップをドラッグ&ドロップした後、トーストメッセージをクリックすることで元に戻すことができます。

   ![ステップのドラッグ&ドロップ](/images/steps-editing-tests/editing-your-tests/d49ea2e-Jun-22-2021_12-49-24.gif)

2. ステップが選択された状態で、**Copy アイコン**（上部バー）をクリックします。

   ![Copy アイコン](/images/steps-editing-tests/editing-your-tests/20492f6-Screen_Shot_2021-03-13_at_8.35.15.png)

   ステップ、ステップのグループ、またはグループステップがクリップボードにコピーされます。コピーしたステップをペーストするには、以下の手順を参照してください。

### ステップのカット

1 つまたは複数のステップ、またはグループステップをカットするには：

1. キーボードの **CTRL/CMD** キーを押しながら、テスト内のステップをクリックして、1 つまたは複数のステップを選択します。

   ![ステップの選択](/images/steps-editing-tests/editing-your-tests/6c1bb09-selectsteps.jpg)

2. アクションメニューの **Cut** ボタン、またはキーボードの **CTRL/CMD + X** をクリックします。

   ![カットボタン](/images/steps-editing-tests/editing-your-tests/77bcbbb-cut.jpg)

:::note
ステップのカット&ペーストは、同じテスト内でのみ可能です。
:::

### ステップのペースト

ステップ、ステップのグループ、またはグループステップをペーストするには：

1. 目的のステップをクリップボードにコピーまたはカットした後、ステップをペーストしたい 2 つのステップの間にある **>**（矢印記号）の上にマウスを移動します。

   ![ペースト位置の矢印](/images/steps-editing-tests/editing-your-tests/94b6988-Screen_Shot_2021-03-13_at_8.33.46.png)

   アクションオプションが表示されます。

   ![Paste 用アクションオプション](/images/steps-editing-tests/editing-your-tests/86a1156-Testim_065a_r.png)

2. **Paste copied steps アイコン**をクリックします。

   ![ペーストアイコン](/images/steps-editing-tests/editing-your-tests/3da2ad6-Testim_066.png)

   ステップが元の場所から移動され、指定した場所のエディターにペーストされます。

   ![Paste 後の配置](/images/steps-editing-tests/editing-your-tests/340d1b6-Screen_Shot_2021-03-13_at_8.37.37.png)

:::note
場所を選択せずにアクションメニューのペーストボタンをクリックした場合、ステップはテストの最後にペーストされます。
:::

## 手動での追加ステップ作成

手動で作成できるステップには多くの種類があります。詳細については、「テストの編集」および「高度な編集」セクションの他の記事を参照してください。

### 手動でステップを作成する

手動でステップを作成するには：

1. ステップを追加したい場所の **>**（矢印記号）の上にマウスを移動します。

   ![メニューを開くための矢印](/images/steps-editing-tests/editing-your-tests/0d951e6-Screen_Shot_2021-03-13_at_8.33.46.png)

   アクションオプションが表示されます。

   ![アクションオプション](/images/steps-editing-tests/editing-your-tests/64048e3-Testim_063a_r.png)

2. **"M"**（Testim 事前定義ステップ）または**フォルダー**（共有ステップ）をクリックします。

   事前定義ステップメニューまたは共有ステップメニューが開きます。

   ![事前定義ステップメニュー](/images/steps-editing-tests/editing-your-tests/ab56d53-Testim_034_r.png)

3. メニューから多数のオプションの中から 1 つを選択して目的のステップを作成し、ドキュメントの他の箇所で説明されているようにステップを編集します。例えば、カスタムアクションを追加する場合は、[カスタムアクションの作成](/docs/custom-code#add-custom-validation-add-custom-action-ステップの追加)を参照してください。

## ステップの削除

個別のステップを削除するか、複数のステップを一度に削除するオプションがあります。

### 個別ステップの削除

個別のステップを削除するには：

1. ステップの上にマウスを移動し、**Delete step アイコン**をクリックします。

   ![削除アイコン](/images/steps-editing-tests/editing-your-tests/2b05676-Testim_280a.png)

2. 表示される「Delete Step」確認ウィンドウで **OK** をクリックします。

   ![Delete Step 確認](/images/steps-editing-tests/editing-your-tests/c733484-Testim_Editing_Tests_015a_r.png)

   ステップが削除されます。

### 複数ステップの削除

複数のステップを削除するには：

1. 削除したいステップを選択します。ステップの周りをクリック&ドラッグするか、**CTRL/CMD** キーを押しながら各ステップをクリックします。選択されたステップは青色でハイライトされます。

   ![複数ステップ選択](/images/steps-editing-tests/editing-your-tests/eeaf9d6-Testim_281.png)

2. 以下のいずれかのオプションを使用して、選択したステップを削除します：
   - キーボードの **Backspace** を押す
   - キーボードの **Delete** を押す
   - 上部バーの **Delete** アイコンをクリックする

   ![Delete 操作](/images/steps-editing-tests/editing-your-tests/43d0fde-Testim_281a.png)

3. 表示される「Delete Steps」確認ウィンドウで **OK** をクリックします。

   ![Delete Steps 確認](/images/steps-editing-tests/editing-your-tests/8ab7d5b-Testim_Editing_Tests_014a_r.png)

   選択したステップが削除されます。
