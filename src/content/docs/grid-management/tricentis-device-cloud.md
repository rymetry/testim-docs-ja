---
title: Tricentis Device Cloud
description: >-
  Tricentis Device Cloud の無料 trial 開始手順と、TDC 対応 mobile
  configuration を使って CLI、CI、Scheduler、Test Plan から実行する方法を説明します。
category: 統合
order: 12023
updated: '2025-09-22'
sourceUrl: 'https://help.testim.io/docs/tricentis-device-cloud'
keywords:
  - Tricentis Device Cloud
  - TDC
  - Tricentis
  - Device Management
  - Real Devices Cloud
  - mobile configuration
---

Testim Mobile は Tricentis Device Cloud (TDC) と組み合わせることで、サポート付きで Grid 上の実機 iOS / Android device を利用できます。さらに、machine learning を活用した analytics により、mobile app の usability や performance に関する insight も得られます。

TDC では、複数ユーザーで共有する shared device と、自分専用の dedicated private device の両方が提供されます。Tricentis Device Cloud は特別な integration を必要とせず、Company Owner または Project Owner として申し込める無料 trial も含まれています。trial を開始すると、その shared resource はすぐに [Device Management](/docs/view-local-connected-mobile-devices) で利用できるようになります。trial 期間中は、Android と iOS の shared trial device を使用できます。

## 無料の Tricentis Device Cloud trial を開始する

Company Owner または Project Owner は、Tricentis Device Cloud の無料 trial を開始できます。無料 trial をスキップして有償版へ進みたい場合は、[contact us](https://www.testim.io/contact-us/) を参照してください。

**無料の Tricentis Device Cloud trial を開始するには:**

1. **Device Management > Real Devices Cloud** tab に移動します。
2. **Start A Trial** をクリックします。

![Real Devices Cloud tab で Start A Trial をクリックする画面](/images/grid-management/tricentis-device-cloud/c299505-image_4.png)

数秒後に trial が **activated** され、次の通知が表示されます。

![Tricentis Device Cloud trial が有効化された通知](/images/grid-management/tricentis-device-cloud/0012b7c-trialactive.png)

3. メイン navigation menu の **Device Management** link へ移動します。\
   **Tricentis Device Cloud Shared** 画面で、trial 期間中に利用できる device を確認できます。

![Tricentis Device Cloud Shared 画面に trial device 一覧が表示されている様子](/images/grid-management/tricentis-device-cloud/b81b106-image_3.png)

## Tricentis Device Cloud でテストを実行する

Tricentis Device Cloud でテストを実行する前に、TDC と互換性のある mobile configuration を作成しておく必要があります。

[Configuration Library - Mobile](/docs/configuration-library-mobile)

![TDC 用 mobile configuration の設定例](/images/grid-management/tricentis-device-cloud/6773dc8-config.png)

次のいずれかの方法で、テストをリモート実行できます。

[CLI](/docs/the-command-line-cli) / [CI](/docs/integrate-testim-to-your-ci)

Grid 名を指定して `--grid` parameter を追加します。

[Scheduler](/docs/scheduler-mobile)

**Grid** field で、どの Grid 上でテストを実行するかを選択します。

[Test Plan](/docs/test-plans-mobile)

**Grid** field で、どの Grid 上でテストを実行するかを選択します。
