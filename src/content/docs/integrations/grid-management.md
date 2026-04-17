---
title: Grid Management
description: >-
  Grid を使ってリモートでテストを実行する方法、利用できる web/mobile
  Grid の種類、追加手順、実行方法を説明します。
category: 統合
order: 12022
updated: '2025-09-22'
sourceUrl: 'https://docs.tricentis.com/testim/content/integrations/grid-management/index.htm'
keywords:
  - Grid Management
  - Testim Grid
  - Virtual Mobile Grid
  - Tricentis Device Cloud
  - SauceLabs
  - BrowserStack
  - LambdaTest
  - HeadSpin
---

:::info{title="これはPRO機能です"}
この機能は Professional plan のプロジェクトでのみ利用できます。
:::

web テストをリモートで実行するには Selenium Grid が必要です。mobile テストを実行するには HeadSpin が必要です。

:::info
Testim Grid の browser 数や browser 種類を変更したい場合は、サポートチームに連絡してください。
:::

:::info
VPN などの制限付き環境を使うテストを実行する場合は、Grid から被テスト環境へアクセスできるように Testim-Grid IPs を許可リストへ追加する必要があります。完全な IP 一覧が必要な場合は、サポートチームに連絡してください。
:::

:::info
互換性を確保するため、Testim Grid 上のブラウザバージョンは十分な検証とテストを行ったうえで定期的に更新されます。更新は主に次の 2 条件で実施されます: 公式のメジャーバージョンリリースから 3 か月以内 重大なセキュリティ更新を含むバージョン
:::

## Web Testing Grids

web テストには次の Grid を使用できます。

- **Testim cloud grid**: Testim Cloud Grid は Testim のデフォルト提供で、契約プランに応じて自動的に利用できます。
- **Local grids**: Selenium Grid を所有している場合は、それを Testim と統合できます。
- **Third party grid**: Testim は SauceLabs、BrowserStack、LambdaTest などの third party grid と統合できます。
- **Private grid**: Private grid は、専用利用のために提供される専用 Testim Grid です。Testim Cloud Grid とは異なり、この構成は VPN の拠点間接続に対応しており、任意の IP アドレスで Grid を動かせるため、許可リスト登録が不要になります。専用リソースなので、位置情報やブラウザバージョンなど特定要件に対してより高い制御性を得られます。詳細は、担当のアカウントエグゼクティブまたは Testim サポートチームに問い合わせてください。

## Mobile Testing Grids

mobile テストには次の Grid を使用できます。

- **Virtual Mobile Grid**: Virtual Mobile Grid は、多数の iOS simulator と Android emulator によるテストを可能にします。
- **Third party grid**: Testim は SauceLabs、BrowserStack、HeadSpin などの third party grid と統合できます。
- **Tricentis Device Cloud (TDC)**: TDC では、サポート付きで Grid 上の実機 iOS / Android デバイスを利用できます。複数ユーザーで共有する共有デバイスと、自分専用の専用デバイスの両方を提供します。

## Adding a grid

**新しい Grid を追加するには:**

1. Testim の画面右上で、User Name のイニシャルが表示された丸いアイコンをクリックします。
2. **Account** の下にある **Grids** をクリックします。
3. **Add New Grid** をクリックします。
4. Grid type を選択します。\
   web 用に選択できるのは次のとおりです。
   - Custom Grid: 独自の Selenium Grid
   - Saucelabs
   - Browserstack
   - LambdaTest

   mobile 用に選択できるのは次のとおりです。

   - Virtual Mobile Grid
   - TDC
   - Saucelabs
   - Browserstack
   - Testim HeadSpin Mobile
5. 各 Grid に対応する項目を入力します。詳細は後続の各記事を参照してください。
6. **Add** をクリックします。\
   Grid の編集または削除を行うには、Grid 設定ボックスにカーソルを重ねて目的の操作をクリックします。

:::info
契約プランに **Testim grid** が含まれている場合、構成は自動的に表示されるはずです。表示されない場合はサポートへ連絡してください。
:::

![Add New Grid 画面で Grid type を選択している様子](/images/grid-management/grid-management/6e57e7a-addgrid.gif)

## Grid configurations

各 Grid の設定方法の詳細は、次の記事を参照してください。

- [Virtual Mobile Grid](/docs/integrations/grid-management/virtual-mobile-grid)
- [Tricentis Device Cloud (mobile)](/docs/integrations/grid-management/tricentis-device-cloud)
- [Custom Grid (web only)](/docs/integrations/grid-management/custom-grid)
- [SauceLabs integration (mobile and web)](/docs/integrations/grid-management/saucelabs-integration)
- [BrowserStack integration (mobile and web)](/docs/integrations/grid-management/browserstack-integration-1)
- [CLI での SauceLabs と BrowserStack のテスト capability (mobile と web)](/docs/integrations/grid-management/saucelabs-browserstack-options)
- [HeadSpin integration (mobile)](/docs/integrations/grid-management/headspin-integration)
- [LambdaTest integration (web only)](/docs/integrations/grid-management/browserstack-integration-copy)

## Grid で実行する方法

次のいずれかの方法で、テストをリモート実行できます。

[CLI](/docs/running-tests/the-command-line-cli) / [CI](/docs/integrations/integrate-testim-to-your-ci)

Grid 名を指定して `--grid` parameter を追加します。

[Scheduler](/docs/running-tests/scheduler)

**Grid** field で、どの Grid 上でテストを実行するかを選択します。

[Test Plan](/docs/test-management/test-plans)

**Grid** field で、どの Grid 上でテストを実行するかを選択します。

### editor からの実行 (web)

web テストは Test Editor から直接 Grid 上で実行できます。詳細は [リモート web テストを実行する](/docs/running-tests/running-tests-overview#リモート-web-テストを実行する) を参照してください。

### editor からの実行 (mobile)

mobile テストは Test Editor から直接 Grid 上で実行できます。詳細は [リモート mobile テストを実行する](/docs/running-tests/running-tests-overview#リモート-モバイル-テストを実行する) を参照してください。
