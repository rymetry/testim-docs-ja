---
title: Bitbucket 統合
description: >-
  Bitbucket repository と Testim branch を自動で mirror する Bitbucket
  integration の有効化手順と、branch / Pull Request / merge の挙動を説明します。
category: 統合
order: 12032
updated: '2025-09-22'
sourceUrl: 'https://docs.tricentis.com/testim/content/integrations/bitbucket-integration.htm'
keywords:
  - Bitbucket
  - branch
  - Pull Request
  - merge
  - version control
---

Bitbucket は、Mercurial または Git のバージョン管理システムを使うソースコードおよび開発プロジェクト向けの、Atlassian 製 Web ベースのバージョン管理リポジトリホスティングサービスです。Testim の Bitbucket integration を使用すると、Bitbucket で行ったバージョン管理操作を Testim 側へ自動でミラーできます。その結果、Testim のテストバージョンを Bitbucket 側のバージョンと一致させられます。Bitbucket で作成したブランチは、同じ名前で Testim にも自動作成されます。Bitbucket でブランチをマージすると、Testim 側のブランチも自動でマージされます。Testim のブランチの詳細は [こちら](/docs/testops/testops-version-control/version-control-branches) を参照してください。

### Bitbucket integration を設定する

この手順は一度だけ実行すれば十分です。
**Bitbucket integration を有効にするには:**

1. Testim で **Settings** > **Integration** タブに移動します。
2. Bitbucket の下にある **login** リンクをクリックします。

![Bitbucket integration の login link を表示している Settings > Integration 画面](/images/grid-management/bitbucket-integration/6b41669-Screen_Shot_2020-12-31_at_11.48.08.png)

3. **Grant Access** ボタンをクリックします。

![Bitbucket 側で Grant Access button をクリックする画面](/images/grid-management/bitbucket-integration/a509649-Screen_Shot_2020-12-31_at_11.36.31.png)

4. 接続するリポジトリを選択します。この操作にはリポジトリに対する admin access が必要です。
5. 必要なアクションのチェックボックスを選択します。

- **Create**: Bitbucket でブランチが作成されるたびに、同じブランチが Testim にも作成されます。

- **Merge**: Bitbucket のブランチがマージされるたびに、Testim でもテストが自動でマージされます。

![Bitbucket integration で Create と Merge の checkbox を選択する画面](/images/grid-management/bitbucket-integration/58d1cac-Screen_Shot_2020-12-31_at_11.49.03.png)

## Bitbucket を Testim と一緒に使う

この時点で、Testim のプロジェクト / リポジトリは Bitbucket のリポジトリをミラーします。そのため、新しいブランチの作成や Pull Request の作成とマージは Bitbucket 側だけで行います。

### 新しいブランチの例

次の例では、Bitbucket で `demo-bb-integration` という新しいブランチを作成しています。

![Bitbucket で demo-bb-integration branch を作成した画面](/images/grid-management/bitbucket-integration/e44f3b2-create1.PNG)

同じブランチが Testim にも自動作成されます。このブランチは Master から fork され、Master に含まれていたすべてのテストを持ちます。

![Testim に同じ branch が自動作成された画面](/images/grid-management/bitbucket-integration/79fbdde-branchintestim.png)

:::info
Bitbucket でブランチを作成した場合、Testim の同名ブランチは常に Master ブランチを基準に作成されます。両側でブランチ構造をミラーしたい場合は、Pull Request の基準ブランチを別のブランチではなく Master ブランチにしてください。
:::

### Pull Request とマージ

次の例では、Bitbucket のあるファイルを変更し、新しいブランチ (`pr-branch`) 上で Pull Request を開始しています。

:::info
Bitbucket では Pull Request なしでマージすることもできますが、Testim にミラーされるのは Pull Request の一部として行われたマージのみです。
:::

![Bitbucket で Pull Request を作成した画面](/images/grid-management/bitbucket-integration/dd5c4c5-pullrequest.PNG)

同じブランチが Testim にも自動作成されます。

![Testim に pr-branch が自動作成された画面](/images/grid-management/bitbucket-integration/4bf04a3-pr2.png)

Testim 側にブランチが作成された後は、そのブランチでテストを更新し、コード変更を反映することもできます。準備ができたら、Bitbucket で Pull Request をマージします。

![Bitbucket で Pull Request を merge する直前の画面](/images/grid-management/bitbucket-integration/edde410-pr3.PNG)

同じマージが Testim にも反映され、`pr-branch` に含まれていたテストと変更内容が Testim の Master ブランチへマージされます。
