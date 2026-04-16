---
title: グループ
description: 複数のステップをグループにまとめて再利用する方法を学びます。グループの作成、プロパティ設定、他のテストでの再利用、変更方法について解説します。
category: テスト編集
order: 4006
updated: '2025-09-19'
sourceUrl: 'https://docs.tricentis.com/testim/content/editing-tests/groups/index.htm'
keywords:
  - グループ
  - 共有グループ
  - ステップのグループ化
  - 再利用
  - グループプロパティ
  - クローン
  - テスト整理
  - パラメーター
  - ブランチ
  - グループ管理
---

「再利用（Reuse）」はプログラミングにおける基本原則の 1 つです。同じ 20 行のコードを何度もコピーペーストするのではなく、メソッド内に 1 度だけ記述し、必要なときに呼び出します。この原則は自動テストでも同様に機能します。ステップをグループ化し、プロジェクト内の他のテストから呼び出せるようにすることで、テスト全体を整理できます。テスト間でグループを共有しない場合でも、Visual Editor 上に表示されるステップ数を減らすことで、テストの見通しが良くなります。グループの共有に加えて、他のステップとグループ化せずに共有できるステップもあります。詳しくは [Shareable Steps](/docs/editing-tests/shareable-steps) を参照してください。

## グループの作成

**グループを作成するには:**

1. ステップを複数選択します。Windows では **Ctrl**、macOS では **Command** キーを押しながら左クリックする、または対象ステップを囲むように領域選択します。
2. ステップが選択されている状態で **Add Group** をクリックします。

![グループ作成ボタン](/images/groups/groups/9bdc970-Screen_Shot_2021-04-07_at_8.14.41.png)

3. **Group Name** フィールドにグループ名を入力します。
4. このグループをプロジェクト内の他のテストでも使用可能にする場合は、**Shared Group** チェックボックスをオンにします。
5. 自動グループ化を有効にする場合は、**Apply auto group on matching steps** をオンにし、[Auto-grouping](/docs/editing-tests/groups/auto-grouping) の手順に従います。
6. **Confirm** をクリックします。\
   ステップは 1 つのグループステップにまとめられます。グループがテスト間で共有されている場合は **Shared** インジケーターが表示されます。

![共有グループインジケーター](/images/groups/groups/86a6a5f-Screen_Shot_2021-04-07_at_8.16.06.png)

7. グループ内の個々のステップを表示するには、グループをダブルクリックします。

![グループ内のステップ表示](/images/groups/groups/053d9d4-Screen_Shot_2021-12-13_at_11.27.08.png)

## グループプロパティの指定（任意）

グループステップ上で **Show Properties** をクリックすると、**Group Properties** ペインが開きます。

<table class="md-table md-table-3cols">
 <thead>
  <tr>
   <th>
    Property
   </th>
   <th>
    Description
   </th>
   <th>
    Comment
   </th>
  </tr>
 </thead>
 <tbody>
  <tr>
   <td>
    Shared step name
   </td>
   <td>
    グループの名前。
   </td>
   <td>
    名前を変更すると、すべてのインスタンスが更新されます。
   </td>
  </tr>
  <tr>
   <td>
    Description
   </td>
   <td>
    グループの説明。
   </td>
   <td>
    インスタンスごとに異なる説明を設定できます。
   </td>
  </tr>
  <tr>
   <td>
    Replace with clone
   </td>
   <td>
    他のインスタンスに影響を与えずに変更できるコピー（クローン）を作成します。
   </td>
   <td>
   </td>
  </tr>
  <tr>
   <td>
    Params
   </td>
   <td>
    参照:
    <a href="/docs/advanced-editing/parameters/parameters-for-groups">
     Parameters for groups
    </a>
   </td>
   <td>
    名前を変更すると、すべてのインスタンスが更新されます。
   </td>
  </tr>
  <tr>
   <td>
    When this step fails
   </td>
   <td>
    グループステップが失敗した場合の動作。
   </td>
   <td>
    名前を変更すると、すべてのインスタンスが更新されます。
   </td>
  </tr>
  <tr>
   <td>
    When to run step
   </td>
   <td>
    このグループステップを実行する条件を指定するブレークポイントを作成します。条件の詳細は
    <a href="/docs/editing-tests/conditions">
     Conditions
    </a>
    を参照してください。
   </td>
   <td>
    名前を変更すると、すべてのインスタンスが更新されます。
   </td>
  </tr>
  <tr>
   <td>
    Repeat group
   </td>
   <td>
    条件に基づくループを作成します。詳細は
    <a href="/docs/advanced-editing/loops">
     Loops
    </a>
    を参照してください。
   </td>
   <td>
    名前を変更すると、すべてのインスタンスが更新されます。
   </td>
  </tr>
  <tr>
   <td>
    Context
   </td>
   <td>
    ページ内や複数ページにまたがって、グループ全体を異なる要素に割り当てます。詳しくは
    <a href="/docs/advanced-editing/group-context">
     Group context
    </a>
    を参照してください。
   </td>
   <td>
    インスタンスごとに値を変えられます。
   </td>
  </tr>
 </tbody>
</table>

## グループの再利用

同一テスト内でグループを再利用できます。共有グループであれば、プロジェクト内の他のテストでも再利用できます。

**同一テスト内でグループを再利用するには:**

1. 2 つのステップの間にある **>（矢印）** にカーソルを合わせます。

![ステップ間の矢印アイコン](/images/groups/groups/d67e999-Screen_Shot_2021-04-07_at_8.23.10.png)

アクションのオプションが表示されます。

![アクションオプション](/images/groups/groups/e8714ed-Untitled.png)

2. **フォルダー**（Shared steps）をクリックします。\
   Shared steps メニューが開きます。

![Shared steps メニュー](/images/groups/groups/f27f1ea-Testim_070.png)

3. グループ名をクリックして新しいステップとして追加します。\
   グループがエディターにステップとして追加されます。

:::note
検索ボックスを使ってグループを検索することもできます。
:::

![グループの検索と追加](/images/groups/groups/ed12ece-Jan-29-2021_05-44-08.gif)

4. ステップがパラメーターの受け渡しを前提としている場合は、[Parameters](/docs/advanced-editing/parameters) セクションを参照し、パラメーター値を編集して割り当てるのを忘れないでください。各ステップは独自のパラメーターを受け渡します（例: 「login」を、あるテストでは「David」、別のテストでは「John」というパラメーターで呼び出す）。

:::note
グループのコピー / 切り取り / 貼り付けも可能です。詳しくは [Editing Tests](/docs/editing-tests/editing-your-tests) を参照してください。
:::

**別のテストでグループを再利用するには:**

1. もう一方のテストで、2 つのステップ間の **>（矢印）**、または最後のステップの後ろにある **+（プラス）** にカーソルを合わせます。

![ステップ追加位置](/images/groups/groups/dd8aa04-Testim_076b.png)

アクションのオプションが表示されます。

![アクションメニュー](/images/groups/groups/f510425-Testim_072a.png)

2. **フォルダー**（Shared steps）をクリックします。\
   Shared steps メニューが開きます。

![共有ステップ一覧](/images/groups/groups/caf4176-Testim_070.png)

3. グループ名をクリックして新しいステップとして追加します。\
   グループがエディターにステップとして追加されます。

:::note
検索ボックスを使ってグループを検索することもできます。
:::

## グループの編集

既存のグループを編集できます。共有グループであれば、そのグループを使用しているすべてのテストに変更が適用されます。

:::note
共有グループだが、他のテストには変更を反映させたくない場合は、**Replace with clone** を使用し、そのクローンだけを編集します。
:::

**グループを編集するには:**

1. 次のいずれかの方法でグループ詳細に移動します。

- グループを含むテスト内で、グループステップをダブルクリック。
- 共有グループの場合は、**Test List > Shared Steps** でグループにカーソルを合わせ **See all tests using this shared step** をクリック。リストからテストを開き、そのテスト内でグループステップをダブルクリック。

2. グループ詳細画面で、以下の操作でテストを変更できます。

- **既存ステップの先頭/末尾に手順を追加して録画** — 新しいステップを追加するには、最後のステップの状態（新規ステップを追加する直前）で AUT を開いておく必要があります。手順:
  - 追加直前の最後のステップにブレークポイントを設定
  - テストを再実行
  - テストを停止
  - **Group Details** に入り、下図のように新しいステップを録画

![グループへの録画追加](/images/groups/groups/5ebf6b1-record.gif)

- **既存ステップの途中に手順を追加して録画** — 直前の最後のステップの状態で AUT を開き、下図のように追加入力を録画します。

![ステップ途中への追加録画](/images/groups/groups/0265592-Jan-31-2021_05-55-41.gif)

- **手順の並べ替え / 削除** — ステップをドラッグして順序を変更できます。削除は選択後に DELETE を押します。

![ステップの並べ替えと削除](/images/groups/groups/58446f7-MyVideo_9.gif)

:::tip
編集後は、**Properties** ペインでグループ名を更新し、新しい機能が分かる名前にすることをおすすめします。
:::

3. テストに戻るには、Back ボタン、または左上のテスト名をクリックします。

## 再利用（共有）の解除

グループの共有（再利用）設定を、グループ自体を削除せずに解除できます。既存のテストからは削除されず、再利用ライブラリへの追加だけが不可になります。\
**再利用を解除するには:**

1. **Test Lists > Shared Steps** に移動
2. グループを選択
3. 上部メニューまたはコンテキストメニューの **Hide** をクリック\
   選択した共有ステップが共有ライブラリから非表示になります。既にテストに追加済みのステップには影響しません。

![共有ステップの非表示設定](/images/groups/groups/35bff41-Untitled.png)

## 共有グループの特定のインスタンスのみをクローンで置き換える

共有グループを 1 か所で変更すると、同一ブランチ内のすべてのインスタンスが更新されます。インスタンスごとに異なるパラメーターを渡すことはできますが、特定のインスタンス（特定のテスト）でのみ変更が必要な場合は、グループをクローン化します。

**グループをクローンするには:**

1. クローンしたい共有グループを編集します。
2. **Properties** パネルで **Replace with a clone** をクリックします。

![クローンへの置き換え](/images/groups/groups/4195e49-replaceclone.png)

3. 新しいグループ名を入力します。

![新しいグループ名の入力](/images/groups/groups/96ed6f2-replaceclone2.PNG)

4. 新しいステップを共有として定義するかどうかを選択します。
5. **Confirm** をクリックします。\
   グループとそのすべてのステップがクローンされます。共有ステップや入れ子のステップは共有のまま維持されます。
