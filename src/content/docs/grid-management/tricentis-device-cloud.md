---
title: Tricentis Device Cloud
description: >-
  Tricentis Device Cloud の無料 trial 開始手順と、TDC 対応 mobile
  configuration を使って CLI、CI、Scheduler、Test Plan から実行する方法を説明します。
category: 統合
order: 12023
updated: '2025-09-22'
sourceUrl: 'https://docs.tricentis.com/testim/content/integrations/grid-management/tricentis-device-cloud.htm'
keywords:
  - Tricentis Device Cloud
  - TDC
  - Tricentis
  - Device Management
  - Real Devices Cloud
  - mobile configuration
---

Testim Mobile は Tricentis Device Cloud (TDC) と組み合わせることで、サポート付きで Grid 上の実機 iOS / Android device を利用できます。さらに、machine learning を活用した analytics により、mobile app の usability や performance に関する insight も得られます。TDC では、複数ユーザーで共有する shared device と、自分専用の dedicated private device の両方が提供されます。Tricentis Device Cloud は特別な integration を必要としません。

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
