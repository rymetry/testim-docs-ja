---
title: 'グループのパラメータ'
description: '原文: https://help.testim.io/docs/parameters-for-groups'
category: 'パラメータ'
order: 3
updated: '2025-11-02'
keywords:
  - testim
  - parameters-for-groups
  - parameters
---
グループへパラメータを渡して再利用性を高める方法

[グループ](/docs/groups/groups) にはパラメータ（テストステップへ値を渡すための変数）を含められます。ログインの例なら、ユーザー名やパスワードをパラメータ化して、registered_user／guest など異なる組み合わせを切り替えられます。\
グループが複数テストで共有されている場合、グループのパラメータは各テストで参照でき、テストごとに値だけを設定すれば再利用できます。\
グループへの追加方法は、[ステッププロパティパネルのパラメータ](/docs/parameters/parameters-in-custom-javascript-steps) と同様です。まず[グループを作成](/docs/groups/groups)し、パラメータを追加して、グループ内の対象ステップに割り当て、値を設定します。

## パラメータのスコープ

グループで定義したパラメータは、そのグループ内で有効です。共有グループなら、同じ共有グループを使う複数テストにまたがって参照できます。\
グループで作成したパラメータは「ローカルスコープ」とみなされ、同スコープまたはより狭いスコープの同名パラメータで上書き可能です（例: テストスコープの値はローカルスコープで上書き可能）。

> 🚧 共有パラメータ
>
> 共有グループ／共有ステップでは、パラメータ定義は共有されますが、値は共有されません。共有元からの削除は全使用箇所に波及し、元に戻せません。

## グループにパラメータを追加する

:fa-arrow-right: **グループにパラメータを追加するには:**

1. [グループ](/docs/groups/groups) の手順でグループを作成します（例: Login group）。
2. グループの**プロパティを表示**アイコン（:fa-cog:）をクリックします。
3. **Params** 横の **+** をクリックし、**JS** を選択します。

![](/images/parameters/parameters-for-groups/8e504bc-paramsjs.PNG "paramsjs.PNG")

4. **編集**アイコンからパラメータ名を設定します（"param" を置き換え）。

![](/images/parameters/parameters-for-groups/0d72468-edit.png "edit.png")

5. 名前の下の欄に値を入力します。文字列はクォートで囲みます（例: 'guest'）。この値はこのテスト内のみで有効です。

6. 追加のパラメータも同様に設定します。

![](/images/parameters/parameters-for-groups/4c19442-example.PNG "example.PNG")

7. **保存** → **OK** をクリックします。

## グループ内の各ステップに割り当てる

:fa-arrow-right: **グループ内ステップへパラメータを割り当てるには:**

1. グループステップをダブルクリックして内部のステップを表示します。

> 📘 注意
>
> 共有グループの場合、変更が関連テストに適用される旨の確認が表示されます。

2. パラメータを割り当てたいステップを選択し、**プロパティを表示**（:fa-cog:）をクリックします。例として **Set text** ステップに `username` を割り当てます。
3. **プロパティ**パネルの **Text to assign** を、静的値からパラメータ名（例: username）に変更します。

![](/images/parameters/parameters-for-groups/a5856f1-texttoassign.png "texttoassign.png")

4. 同様に他のステップへも割り当てます（例: パスワード）。
5. **保存** → **OK** をクリックします。

これで完了です。\
グループ本体を変更せずに、値だけを変えて他テストで再利用できます。

## パラメータ付きグループを再利用する

:fa-arrow-right: **再利用手順:**

1. [グループの再利用](/docs/groups/groups) の手順で別テストに追加します。関連ステップへの割り当ては維持され、値のみ未設定の状態です。

![](/images/parameters/parameters-for-groups/c3bace7-addinglogingroup.PNG "addinglogingroup.PNG")

2. グループの**プロパティを表示**（:fa-cog:）。パラメータは存在しますが値は未設定です。

![](/images/parameters/parameters-for-groups/5ccad01-notassigned.png "notassigned.png")

3. **Assign Now** ドロップダウンから **JS** を選択し、値を入力します（文字列はクォートで囲む）。
4. 他のパラメータも同様に設定します。
5. **保存** → **OK**。
