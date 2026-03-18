---
title: ブランチ読み取り専用状態
description: ブランチを読み取り専用に設定することで直接変更を禁止し、すべての変更をフォーク経由のプルリクエストで行うよう制御できます。
category: TestOps
order: 15010
updated: '2025-11-02'
sourceUrl: 'https://help.testim.io/docs/read-only'
keywords:
  - 読み取り専用ブランチ
  - TestOpsバージョン管理
  - ブランチ保護
  - 直接変更防止
  - マスターブランチ
  - プルリクエスト
  - 自動改善
  - ブランチロック
  - 変更制御
  - 権限管理
---

ブランチへの直接書き込みを許可しない（ブランチとマージを使用する場合のみ）

Testim には、ブランチへの直接書き込みを許可しないようにブランチをロックする機能があります。\
ブランチに書き込むには、すべてのユーザーがまず別のブランチにフォークしてから、ブランチへのマージを実行する必要があります。ブランチへのマージは[プルリクエスト](/docs/pull-requests)を通じて実行できます。

:::note{title="これはPRO機能です"}
この機能は、 Professional plan のプロジェクトでのみ利用できます。
:::

:::note
**プロジェクトオーナー**または**会社オーナー**のみが、ブランチを読み取り専用に構成できます。
:::

## ブランチ読み取り専用モードの有効化

ブランチ読み取り専用モードは、**Settings -> General** 画面の **Pull Requests** 設定の下にあり、プロジェクトごとに構成されます。これを有効にするには、**Protect branch from changes** トグルをオンに切り替えます。ブランチは「 read-only 」とラベル付けされます。

![プロジェクト設定](/images/testops-version-control/read-only/77cbaf9-project_settings.png)

## 読み取り専用としてのブランチの動作

ブランチを読み取り専用に有効にすると、現在のアクティビティが影響を受けます。

### Testim エディター

* ブランチの下で直接テストに保存を実行すると、別のブランチへのフォークを実行し、新しいブランチに変更を保存するように求められます

![読み取り専用エディター](/images/testops-version-control/read-only/ef453c8-Screen_Shot_2021-01-18_at_6.21.37.png)

### テストリスト

#### テスト

次のアクションが無効になります:

* 新しいテストを作成
* テストを削除
* テストを複製
* 新しいフォルダーを作成
* 別のフォルダーに移動
* フォルダーを削除
* テストのステータスを変更
* 名前を変更

![テストリスト制限](/images/testops-version-control/read-only/a5dab70-Untitled_2.png)

#### スイート

次のアクションが無効になります:

* スイートを作成
* スイートをコピー
* スイートを削除
* スイートを編集

![スイート制限](/images/testops-version-control/read-only/1f237b2-Untitled_3.png)

### 読み取り専用ブランチでの自動改善機能

デフォルトでは、自動改善機能は読み取り専用として設定されていないブランチでのみ実行されます。ただし、ブランチが master ブランチの場合、**Allow Auto-Improve on master** をオンに設定することで、 master 読み取り専用ブランチに自動改善機能を適用できます。詳細については、[読み取り専用ブランチでの自動改善の許可](/docs/locators-auto-improve#allowing-auto-improve-on-a-master-read-only-branch)を参照してください。

![自動改善設定](/images/testops-version-control/read-only/05bf593-autoimprove.png)
