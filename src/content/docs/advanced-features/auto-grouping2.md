---
title: 自動グルーピング
description: Auto grouping 機能でプロジェクト内の重複ステップ列を検出し、共有グループに置き換えてテストの重複を削減する方法を説明します。
category: 高度な編集
order: 5053
updated: '2025-09-22'
sourceUrl: 'https://help.testim.io/docs/auto-grouping2'
keywords:
  - 自動グルーピング
  - auto grouping
  - 共有グループ
  - 重複ステップ
  - DRY 原則
  - テスト保守
  - 重複レベル
  - テストアーキテクチャ
  - グループ化
  - Testim
---

テスト内の重複ステップ列を検出し、再利用可能なグループへまとめます。

:::note{title="PRO機能"}
Professional plan で利用可能です。詳細は[こちら](https://www.testim.io/automation-testing-pricing/)。  
自動グルーピングは master ブランチでのみ動作します（状態は毎週末に更新されます）。  
また、本機能は Web / Mobile Web プロジェクトで利用できます。
:::

Auto grouping は、プロジェクト全体のテストから同じステップ列を検出し、共有グループに置き換えることで重複を削減する機能です。テストもコードと同じように DRY（Don't Repeat Yourself）原則を守ることで、メンテナンスが容易になります。グループ内のステップを 1 箇所変更すると、そのグループを使用しているすべてのテストに変更が反映されます。

Auto Grouping 画面には、他のテストやグループと重複しているステップ列の候補が一覧表示されます。どの候補を共有グループに変換するかを確認し、採用した候補は新しいブランチ上で保存されます。ブランチ内の変更をレビューしてから master ブランチへマージできます。

### 重複レベルスコア（Duplication level scoring）

重複レベルスコアは、プロジェクト内にどれだけ重複したステップが残っているかを 0 〜 100 の数値で表します。スコアが高いほど重複が多い状態です。自動グルーピングの候補を適用していくと、このスコアを下げて重複を減らせます。

スコアは次の 3 色で表示されます。

* **Green** – 重複が少なく、良好な状態
* **Yellow** – 中程度の重複あり。自動グルーピングの適用を推奨
* **Red** – 重複が多い状態。自動グルーピングの適用が強く推奨されます

## 自動グルーピング候補の確認（Reviewing auto-grouping suggestion）

**自動グルーピング候補を確認するには:**

1. メインメニューで **Auto-grouping** をクリックします。\
   画面右側の **Auto Grouping** ペイン（黒いペイン）に候補一覧が表示されます。ここには次の情報が含まれます。
   * **Project duplication level** – プロジェクト全体の重複レベル（0 〜 100）。まだグループ化されていない重複ステップの量を示します。重複レベルを下げるには、一覧の候補を採用していきます。
   * **The number of duplicate steps** – 他のテストで見つかった同一ステップ列の数。
   * **Duplication level reduction** – 候補を採用したときに重複レベルがどれだけ下がるか（例: 現在 14% で 1% と表示されている場合、採用後は 13% になる）。
   * **The number tests and groups** – 同じステップ列が見つかったテスト／グループの数。  

![自動グルーピングのスクリーンショット](/images/advanced-features/auto-grouping2/1839b7d-Screen_Shot_2021-02-28_at_9.51.19.png)

:::note
重複レベルの計算は、毎週日曜日に実行されるオフライン処理に基づく推定値です。すべての最新変更をリアルタイムに反映しているわけではありません。
:::

2. 任意の候補をクリックすると、その候補に含まれるテスト／グループの詳細が **Test List** ペインに表示されます。

![自動グルーピングのスクリーンショット](/images/advanced-features/auto-grouping2/79c9465-Screen_Shot_2021-02-28_at_9.52.04.png)

3. 対象のテスト／グループをクリックすると、重複しているステップ列がハイライト表示されます。

![自動グルーピングのスクリーンショット](/images/advanced-features/auto-grouping2/eb1a270-Screen_Shot_2021-02-23_at_6.14.45.png)

4. テスト全体のコンテキストの中で重複ステップ列を確認したい場合は、**Open Test** アイコンをクリックします。エディター画面が新しいタブで開き、重複ステップ列がハイライトされます。

![自動グルーピングのスクリーンショット](/images/advanced-features/auto-grouping2/bdbe859-Screen_Shot_2020-10-27_at_11.58.10.png)

## 自動グルーピング候補の編集（Editing the auto-grouping suggestion）

**自動グルーピング候補を編集するには:**

1. **Auto-Grouping** ペインで任意の候補を選択し、**Edit** アイコンをクリックします。

![自動グルーピングのスクリーンショット](/images/advanced-features/auto-grouping2/e52ddfd-Dec-06-2020_11-38-33.gif)

2. 候補に含めるステップを次のように編集します。
   * グループに含めたい／含めたくないステップを選択・解除して調整します。

![自動グルーピングのスクリーンショット](/images/advanced-features/auto-grouping2/ca23e3b-Dec-06-2020_11-41-28.gif)

* **Clear all** をクリックすると選択をすべてクリアし、改めて含めたいステップだけを選択できます。

:::note
グループには最低でも 3 ステップ以上含める必要があります。
:::

いつでも **Select original** をクリックすれば、元の提案内容に戻せます。\
候補を編集すると、新しいグループ候補には **Edited** ラベルが付き、テスト一覧も編集内容に応じて更新されます。

![自動グルーピングのスクリーンショット](/images/advanced-features/auto-grouping2/52cf745-Screen_Shot_2020-12-06_at_11.45.31.png)

## 自動グルーピング候補のフィルタリング（Filtering auto-grouping suggestions）

自動グルーピング候補が多い場合は、条件で絞り込むことができます。

**候補をフィルタリングするには:**

1. **Auto Grouping** ペイン（黒いペイン）でフィルターアイコンをクリックします。

![自動グルーピングのスクリーンショット](/images/advanced-features/auto-grouping2/de78d7f-filter.png)

**FILTER & SORT STEPS DUPLICATIONS** 画面が表示され、次のフィルターオプションを利用できます。

* **Test owner** – 選択したテストオーナーのテストのみ表示
* **Test Name** – 選択したテストのみ表示
* **Suite Name** – 選択したスイートに含まれるテストのみ表示
* **Group Name** – 選択したグループを含むテストのみ表示

![自動グルーピングのスクリーンショット](/images/advanced-features/auto-grouping2/282da88-Feb-28-2021_10-23-47.gif)

2. いずれかのフィルター項目をクリックします。\
   対象の一覧が表示されます。

![自動グルーピングのスクリーンショット](/images/advanced-features/auto-grouping2/4b25c4d-testname.PNG)

3. **Show all** をクリックしてすべての候補を表示し、必要な項目を選択します。
4. **Number of Steps** で、重複ステップ数の範囲を指定したい場合は **Min. Steps** と **Max Steps** を入力します。
5. **Apply** をクリックしてフィルターを適用します。

## 自動グルーピング候補のソート（Sorting auto-grouping suggestions）

同じ画面で候補の並び順も変更できます。

ソートオプション:

* **Duplication Level - Descending (default)** – 重複レベルの削減効果が大きい候補から表示
* **Duplication level - Ascending** – 重複レベルの削減効果が小さい候補から表示
* **Number of steps - Ascending** – 重複ステップ数が少ない候補から表示
* **Number of steps - Descending** – 重複ステップ数が多い候補から表示
* **Number of matches - Ascending** – 影響を受けるテスト／共有ステップ数が少ない候補から表示
* **Number of matches - Descending** – 影響を受けるテスト／共有ステップ数が多い候補から表示

![自動グルーピングのスクリーンショット](/images/advanced-features/auto-grouping2/dde76be-Screen_Shot_2021-02-28_at_10.17.23.png)

## 候補から共有グループを作成する（Creating the shared group based on the suggestion）

**候補から共有グループを作成するには:**

1. **Test List** ペインで、自動グルーピングを適用したいテスト／グループを選択または解除します。
2. **Create Shared Group** をクリックします。
3. **Shared group name** フィールドに共有グループ名を入力します。
4. **Branch** で次のいずれかを選択します。
   * **New Branch** – 新しいブランチを作成し、ブランチ名を入力します。
   * **Current Branch** – master 以外のブランチで作業している場合、そのブランチに新しい共有グループ入りのテストを保存します。

![自動グルーピングのスクリーンショット](/images/advanced-features/auto-grouping2/5ac239d-Screen_Shot_2020-10-27_at_12.11.32.png)

5. **Next** をクリックします。
6. グループがパラメーターを使用している場合、自動グルーピング機能はグループ用に新しいパラメーターを作成します。この場合、追加のステップとしてパラメーター名を入力する画面が表示されます。

![自動グルーピングのスクリーンショット](/images/advanced-features/auto-grouping2/cc757a0-Screen_Shot_2020-10-29_at_18.53.28.png)

7. **Create** をクリックします。\
   自動グルーピングが完了すると、完了メッセージが表示され、続けて次のグループ候補を処理できます。

![自動グルーピングのスクリーンショット](/images/advanced-features/auto-grouping2/0a5c88f-Screen_Shot_2020-10-28_at_13.33.39.png)
