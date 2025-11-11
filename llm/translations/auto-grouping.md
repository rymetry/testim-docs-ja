グループを作成するとき、適用可能な他のテストにも自動的に反映します。

自動グループ化（auto-grouping）は、プロジェクト内のさまざまなテストを横断して再利用の機会を見つける機能です。グループの作成時に、Testim は他のテスト内でそのグループのステップ列と一致する箇所を特定し、それらのステップを新しいグループに自動置換します。自動グループ化が適用されたテストは新しいブランチに保存され、マスターブランチへマージする前に変更内容を確認できます。

自動グループ化の詳細は [Auto grouping](/docs/advanced-features/auto-grouping2) を参照してください。

:fa-arrow-right: **自動グループ化を有効にするには:**

1. 新しい [Group](/docs/groups/groups) を作成する際に、**Apply auto group on matching steps** を選択します。

![1689](/images/groups/auto-grouping/e63b692-auto-group1.png "auto-group1.png")

2. **Branch Name** フィールドに作成する新しいブランチ名を入力します。
3. **Confirm** をクリックします。\
   Testim が自動グループ化を適用したテスト件数を示すメッセージが表示されます。

![2426](/images/groups/auto-grouping/2a96564-Screen_Shot_2020-07-07_at_13.58.18.png "Screen Shot 2020-07-07 at 13.58.18.png")

> 📘 New branch
>
> 自動グループ化を使用すると、新しいブランチが自動的に作成されます。これは、新しいグループによって他ユーザーや他テストへ予期せぬ影響を与えないようにするためです。新しいグループによる変更に問題がなければブランチをマージし、問題があればブランチを削除してください。
