---
title: テスト構成の設定
description: モバイルテストの構成パラメーターを設定し、デフォルト構成を上書きする方法について説明します。
category: テストの記録
order: 3007
updated: '2025-09-19'
sourceUrl: 'https://help.testim.io/docs/setting-the-test-configuration'
keywords:
  - テスト構成
  - モバイルテスト設定
  - Setup step
  - timeout 設定
  - hooks 設定
---

すべてのテストには、テストの Setup ステップのプロパティパネルからアクセスできる独自のデフォルト構成があります。テストのデフォルト構成で設定された構成パラメーターは、CLI またはスケジューラから異なるテスト構成でテストを実行しない限り適用されます。

デフォルトでは、すべての新しいテストに対して Untitled 構成が作成されます。このデフォルト構成には、VMG で利用可能な任意の OS バージョンを持つ任意のデバイスでテストを実行するルールが含まれています。これらの設定（Device Name と OS version 設定）は変更できませんが、以下で説明するように追加の設定を変更することは可能です。変更された構成はテスト自体に保存されます。つまり、他のテストで使用するために構成ライブラリ（[Configuration Library - Mobile](/docs/configuration-library-mobile) を参照）では利用できません。

:::info
CLI でテストを実行する場合、実行コマンドで新しいテスト構成を指定することにより、デフォルト構成を上書きできます。[Command line interface](/docs/the-command-line-cli) を参照してください。
:::

**デフォルトのテスト構成設定を上書きするには:**

1. Setup ステップの **Show Properties** アイコンをクリックします。

2. Properties パネルの **Configuration** の下にある **Edit** アイコンをクリックします。

![Edit 構成アイコン](/images/recording-tests/setting-the-test-configuration/e4593c6-editicon.jpg)

Edit Configuration パネルが表示されます。

![構成編集パネル](/images/recording-tests/setting-the-test-configuration/5192691-edittestconfiguration.png)

3. オプションで以下の設定を編集します:
   - **Step timeout (ms)** - Testim がテストステップに対して失敗を登録する時間経過をミリ秒単位で指定します。
   - **Step delay (ms)** - テストステップの実行間の遅延をミリ秒単位で指定します。
   - **Setup step timeout (ms)** - Testim がテストの Setup ステップに対して失敗を登録する時間経過をミリ秒単位で指定します。
   - **Before/After hooks** - [Hooks](/docs/hooks) で説明されているように、before/after フックを指定します。

4. 完了したら、ペインを閉じるか、Properties ペインに戻ります。
