---
title: Bitbucket 統合
description: >-
  Bitbucket repository と Testim branch を自動で mirror する Bitbucket
  integration の有効化手順と、branch / Pull Request / merge の挙動を説明します。
category: 統合
order: 12032
updated: '2025-09-22'
sourceUrl: 'https://help.testim.io/docs/bitbucket-integration'
keywords:
  - Bitbucket
  - branch
  - Pull Request
  - merge
  - version control
---

Bitbucket branch を Testim 上で管理できます。

Bitbucket は、Mercurial または Git revision control system を使う source code と development project のための Atlassian 製 web ベース version control repository hosting service です。Testim の Bitbucket integration を使用すると、Bitbucket で行った version control 操作を Testim 側へ自動で mirror できます。その結果、Testim の test version を Bitbucket 側の version と一致させられます。Bitbucket で作成した branch は、同じ名前で Testim にも自動作成されます。Bitbucket で branch を merge すると、Testim 側の branch も自動で merge されます。Testim branch の詳細は [こちら](/docs/version-control-branches) を参照してください。

## Bitbucket integration を設定する

この手順は一度だけ実行すれば十分です。

:fa-arrow-right: **Bitbucket integration を有効にするには:**

1. Testim で **Settings** > **Integration** tab に移動します。
2. Bitbucket の下にある **login** link をクリックします。

![Bitbucket integration の login link を表示している Settings > Integration 画面](/images/grid-management/bitbucket-integration/6b41669-Screen_Shot_2020-12-31_at_11.48.08.png)

3. **Grant Access** button をクリックします。

![Bitbucket 側で Grant Access button をクリックする画面](/images/grid-management/bitbucket-integration/a509649-Screen_Shot_2020-12-31_at_11.36.31.png)

4. 接続する repository を選択します。この操作には repository に対する admin access が必要です。
5. 必要な action の checkbox を選択します。
   - **Create**: Bitbucket で branch が作成されるたびに、同じ branch が Testim にも作成されます。
   - **Merge**: Bitbucket branch が merge されるたびに、Testim でも test が自動で merge されます。

![Bitbucket integration で Create と Merge の checkbox を選択する画面](/images/grid-management/bitbucket-integration/58d1cac-Screen_Shot_2020-12-31_at_11.49.03.png)

## Bitbucket を Testim と一緒に使う

この時点で、Testim project / repository は Bitbucket repository を mirror します。そのため、新しい branch の作成や Pull Request の作成と merge は Bitbucket 側だけで行います。

### 新しい branch の例

次の例では、Bitbucket で `demo-bb-integration` という新しい branch を作成しています。

![Bitbucket で demo-bb-integration branch を作成した画面](/images/grid-management/bitbucket-integration/e44f3b2-create1.PNG)

同じ branch が Testim にも自動作成されます。この branch は Master から fork され、Master に含まれていたすべての test を持ちます。

![Testim に同じ branch が自動作成された画面](/images/grid-management/bitbucket-integration/79fbdde-branchintestim.png)

:::info
Bitbucket で branch を作成した場合、Testim の同名 branch は常に Master branch を基準に作成されます。両側で branch 構造を mirror したい場合は、Pull Request の基準 branch を別 branch ではなく Master branch にしてください。
:::

### Pull Request と merge

次の例では、Bitbucket である file を変更し、新しい branch (`pr-branch`) 上で Pull Request を開始しています。

:::info
Bitbucket では Pull Request なしで merge することもできますが、Testim に mirror されるのは Pull Request の一部として行われた merge のみです。
:::

![Bitbucket で Pull Request を作成した画面](/images/grid-management/bitbucket-integration/dd5c4c5-pullrequest.PNG)

同じ branch が Testim にも自動作成されます。

![Testim に pr-branch が自動作成された画面](/images/grid-management/bitbucket-integration/4bf04a3-pr2.png)

Testim 側に branch が作成された後は、その branch で test を更新し、code 変更を反映することもできます。準備ができたら、Bitbucket で Pull Request を merge します。

![Bitbucket で Pull Request を merge する直前の画面](/images/grid-management/bitbucket-integration/edde410-pr3.PNG)

同じ merge が Testim にも反映され、`pr-branch` に含まれていた test と変更内容が Testim の Master branch に merge されます。
