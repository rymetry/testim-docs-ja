---
title: Virtual Mobile Grid
description: >-
  Virtual Mobile Grid の trial 開始手順、実行前の前提条件、CLI、CI、Scheduler、Test
  Plan、Test Editor からの実行方法、および app の差し替え方法を説明します。
category: 統合
order: 12024
updated: '2025-09-22'
sourceUrl: 'https://docs.tricentis.com/testim/content/integrations/grid-management/virtual-mobile-grid.htm'
keywords:
  - Virtual Mobile Grid
  - VMG
  - Mobile Apps Library
  - Device Management
  - mobile configuration
  - app-id
---

Virtual Mobile Grid (VMG) は、多数の iOS simulator と Android emulator を対象にテストできるクラウドベースの Grid です。以下が可能になります：

- 利用可能な virtual device を使って接続と設定を簡素化し、品質を向上できます。
- 異なる device で parallel run を行い、テスト実行をスケールできます。

Virtual Mobile Grid はテストの記録にも実行にも使用できます。また、[Mobile Apps Library](/docs/mobile-apps/mobile-apps) と接続されています。つまり、mobile app を使うテストを Virtual Mobile Grid で実行する前に、その app を Mobile Apps Library へ追加しておく必要があります。

Virtual Mobile Grid に特別な integration は不要です。有償 customer には license に含まれています。Community license でも、Company Owner または Project Owner であれば無料 trial に登録できます。trial を開始すると、Virtual Mobile Grid はすぐに [Device Management](/docs/device-management/view-local-connected-mobile-devices) で利用可能になります。trial 期間中は Android と iOS のさまざまな virtual device を使用できます。

:::warning{title="テスト互換性"}
Virtual Mobile Grid で実行できるのは、virtual device で動作するように compile された iOS application のみです。
:::

:::info{title="OS 互換性"}
Virtual Mobile Grid は x86_64 Android build のみをサポートします。
:::

## 無料の Virtual Mobile Grid trial を開始する

Community license を利用している場合、Company Owner または Project Owner として Virtual Mobile Grid の無料トライアルを開始できます。トライアル期間は 14 日間です。トライアル中は、全プロジェクトを通して iOS / Android それぞれ 1 実行ずつ実行できます。無料トライアルをスキップして直接有償版へ進みたい場合は、[お問い合わせ](https://www.testim.io/contact-us/) を参照してください。→ **無料の Virtual Mobile Grid トライアルを開始するには:**

1. **Device Management** 画面へ移動し、**Virtual Mobile Grid** tab を開いて **Start A Trial** をクリックします。

![Device Management で Virtual Mobile Grid trial を開始する画面](/images/grid-management/virtual-mobile-grid/52a46cf-image.png)

数秒後に trial が **activated** され、次の通知が表示されます。

![Virtual Mobile Grid trial が有効化された通知](/images/grid-management/virtual-mobile-grid/6ab7015-image_1.png)

**Virtual Mobile Grid** 画面では、trial 期間中に利用できる device を確認できます。

## Virtual Mobile Grid でテストを実行する

Virtual Mobile Grid でテストを実行する前に、次を確認してください。

- **Mobile Configuration**: Virtual Mobile Grid と互換性のあるモバイル設定を作成しておきます。[Configuration Library - Mobile](/docs/test-management/configuration-library-mobile) を参照してください。この設定は CLI / CI、Scheduler、Test Plan からの実行に使用できます。

![Virtual Mobile Grid 向け mobile configuration の設定例](/images/grid-management/virtual-mobile-grid/07dd385-image_2.png)

- **Apps Library**: テスト対象アプリを Apps Library に追加しておきます。[Mobile Apps](/docs/mobile-apps/mobile-apps) を参照してください。すでに **_"From Device"_** オプションで選択したアプリを使ってテストを記録済みの場合は、テストの **Setup Step** の **Properties** ペインで **change app** リンクをクリックし、From Library オプションを選択します。

### テストをリモート実行する

Virtual Mobile Grid 用に設定した構成を使うことで、次のいずれかの方法でテストをリモート実行できます。

:::info
[Mobile Apps Library](/docs/mobile-apps/mobile-apps) に対象の mobile app があることを確認してください。
:::

[CLI](/docs/running-tests/the-command-line-cli) / [CI](/docs/integrations/integrate-testim-to-your-ci)

Grid 名を指定して `--grid` parameter を追加します。

[Scheduler](/docs/running-tests/scheduler-mobile)

**Grid** フィールドで、どの Grid 上でテストを実行するかを選択します。

[Test Plan](/docs/test-management/test-plans-mobile)

**Grid** フィールドで、どの Grid 上でテストを実行するかを選択します。

[エディターからのリモート実行](/docs/running-tests/running-tests-overview#リモート-モバイル-テストを実行する)

**Run on a grid** オプションで **Virtual Mobile Grid** と該当する構成を選択します。

![Remote Run through the Editor で Virtual Mobile Grid を選択している画面](/images/grid-management/virtual-mobile-grid/81f27e0-image_3.png)

### From Device で記録した app を変更する

**_"From Device"_** オプションで選択したアプリを使ってテストを記録済みの場合は、次の方法でアプリを差し替えます。

#### Editor から変更する

**Editor から app を変更するには:**

1. **Setup Step** で **Show Properties** をクリックします。
2. **Properties** ペインの **Application name** の下にある **Change app** リンクをクリックします。
3. From **Library option** を選択し、一覧から該当する app を選びます。
4. **Done** をクリックします。

![Setup Step の Properties から app を差し替える画面](/images/grid-management/virtual-mobile-grid/87bb169-changeappgif.gif)

#### CLI から変更する

CLI でテストを実行する場合は、テスト記録時に使われた既定のアプリ ID を、Mobile Apps Library にある別のアプリ ID で上書きできます。→ **既定のアプリ ID を上書きするには:**

1. **Settings > CLI** へ移動します。
2. **Grid** drop-down menu で **Virtual Mobile Grid** を選択します。
3. command example を command prompt へコピーします。
4. **Mobile Apps Library** へ移動します。
5. 対象の app を選択し、**Copy ID** button をクリックします。
6. command prompt で、コピーした ID を続けて `--app-id` flag を追加します。
7. CLI command を実行します。

#### scheduler から変更する

**scheduler で既定の app を上書きするには:**

1. **Runs > Scheduled Runs** へ移動します。
2. 対象の scheduler を開きます。
3. **What to run on** で **Override application** checkbox を選択します。
4. **Select from library** で対象 application を選択します。
5. **Save** をクリックします。

#### test plan から変更する

**test plan で既定の app を上書きするには:**

1. **Test List > Plans** へ移動します。
2. 対象の test plan を開きます。
3. **What to run on** で **Override application** checkbox を選択します。
4. **Select from library** で対象 application を選択します。
5. **Save** をクリックします。
