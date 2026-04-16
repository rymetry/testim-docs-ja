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

Testim Mobile は Tricentis Device Cloud (TDC) と組み合わせることで、サポート付きで Grid 上の実機 iOS / Android デバイスを利用できます。さらに、機械学習を活用した分析により、mobile app の使いやすさやパフォーマンスに関するインサイトも得られます。TDC では、複数ユーザーで共有するデバイスと、自分専用の専有デバイスの両方が提供されます。Tricentis Device Cloud は特別な連携設定を必要としません。

## Tricentis Device Cloud でテストを実行する

Tricentis Device Cloud でテストを実行する前に、TDC と互換性のある mobile configuration を事前に作成しておく必要があります。

[Configuration Library - Mobile](/docs/test-management/configuration-library-mobile)

![TDC 用 mobile configuration の設定例](/images/grid-management/tricentis-device-cloud/6773dc8-config.png)

次のいずれかの方法で、テストをリモート実行できます。

[CLI](/docs/running-tests/the-command-line-cli) / [CI](/docs/integrations/integrate-testim-to-your-ci)

Grid 名を指定して `--grid` パラメーターを追加します。

[Scheduler](/docs/running-tests/scheduler-mobile)

**Grid** フィールドで、どの Grid 上でテストを実行するかを選択します。

[Test Plan](/docs/test-management/test-plans-mobile)

**Grid** フィールドで、どの Grid 上でテストを実行するかを選択します。
