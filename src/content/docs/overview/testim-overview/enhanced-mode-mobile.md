---
title: Enhanced Mode モバイルテスト
description: Testim の Enhanced Mode を使用したモバイルアプリケーションのテスト方法
category: 概要
order: 1006
updated: '2025-09-19'
sourceUrl: 'https://docs.tricentis.com/testim/content/overview/testim-overview/enhanced-mode-mobile.htm'
keywords:
  - Enhanced Mode
  - モバイルテスト
  - VMG
  - Appium
  - React Native
  - Flutter
  - ハイブリッドアプリ
  - クロスプラットフォーム
  - テスト安定性
  - 仮想モバイルグリッド
---

Testim の新しい Enhanced mode は、Appium ベースのテストと比較して、より安定、高速、多用途なテストを提供します。ゼロナレッジアプローチと統合 API により、新しい Enhanced mode は市場の他のツールよりもモバイルビューの構造をよく把握します。この追加の可視性により、クロスプラットフォーム（React Native、Flutter）やハイブリッドアプリなど、Appium などの他のプラットフォームでは不可能なテストフローが可能になります。Enhanced mode は、柔軟で高速かつ使いやすいクラウド内の仮想モバイルグリッドで、すべてのモバイルアプリケーション（ネイティブ、ハイブリッド、またはクロスプラットフォームフレームワーク）のテストをサポートします。

![モバイルテストのセットアップ](/images/overview/enhanced-mode-mobile/26cb526-mobile-test-setup.png)

:::note
Enhanced mode は現在 VMG（仮想モバイルグリッド）でのみ利用可能です。ローカルデバイス、物理デバイス、または別のグリッドでテストする場合は、Standard Appium モードを選択してください。
:::

## Enhanced mode の利点

- **より豊富なビュー階層** - スクリプトは「見る」ことができない要素とは相互作用できません。Enhanced mode は、React Native や Flutter アプリでも、市場のどのツールよりもモバイルビューの構造をよく把握する、より豊富なビュー階層を持っています。
- **高速スキャン** - ビュー階層全体を 500ms 未満でスキャンします。
- **ゼロナレッジ** - Appium では、テストを作成する際に使用する「Appium ドライバー」（例：ネイティブドライバー、ウェブビュードライバー、React Native ドライバー、Flutter ドライバー）を知る必要があります。Enhanced mode は統合 API を提供し、アプリの基盤となる技術に関する知識を必要としません。
- **クロスプラットフォームアプリケーションフレームワークの強化されたサポート** - React Native や Flutter を含む人気のクロスプラットフォームアプリケーションフレームワークの使用を可能にします。
- **ハイブリッドアプリのサポート** - 埋め込まれたウェブビューを持つアプリケーションの使用を可能にします。
- **テストの安定性向上** - すべてのモバイルアプリケーションのテストの安定性を向上させ、メンテナンスを削減し、テスト作成時間と労力を削減します。

## サポートされているフレームワーク

Enhanced mode は、ネイティブまたはハイブリッドを含む、ほとんどの主要なフレームワークをサポートしています。

- Webviews
- React-native
- Flutter
- Swift
- SwiftUI
- Objective-C

## Testim で Enhanced mode を使用する方法

- **テスト記録** - テストを記録する際、**Enhanced mode** がデフォルト/優先モバイルテスト方法として選択されます。**Standard Appium** 互換モードを選択することもできます。Enhanced mode を使用して記録されたテストは VMG でのみ実行されます。
- **テストスケジューリング** - Enhanced mode で記録されたテストは Enhanced mode で実行され、Enhanced mode で記録されていないテストは Enhanced mode で実行されません。
- **CLI 実行** - Enhanced mode で記録されたテストは Enhanced mode で実行され、Enhanced mode で記録されていないテストは Enhanced mode で実行されません。

## FAQ

### 以前に記録したテストに Enhanced mode を適用できますか？

いいえ。Enhanced mode の実行には、テストの記録中にいくつかのパラメーターを設定して記録する必要があります。Enhanced mode で記録されたテストは、Enhanced mode でのみ実行され、Enhanced mode で記録されていないテストは Enhanced mode で実行されません。

### テストに別のモード（Enhanced mode 以外）を選択できますか？

もちろんです。Appium 互換モードでテストを記録して実行できます。このモードは、他の Appium ベースのグリッドとのテストの互換性を保証し、ローカルデバイスでのローカル実行をサポートします。一方、このモードは Appium の機能に制限されています。つまり、特にハイブリッドアプリやウェブビューを使用している場合、すべてのテストフローを記録できない可能性があります。Appium 互換モードを使用している場合、既存のテストは引き続き機能することに注意してください。

### VMG 以外の他のグリッドで Enhanced mode を使用できますか？

現在、Enhanced mode には VMG の使用が必要であり、他のグリッドの使用はサポートされていません。

### Enhanced mode で記録されたテストを Appium 互換モードに移行できますか？

いいえ。これには、Enhanced mode でテストを再記録する必要があります。

### Enhanced mode を使用しているテストが失敗した場合はどうなりますか？

Appium 互換モードと同様に、問題をトラブルシューティングしてアプリを修正するか、アプリの変更によって失敗が発生した場合はテストを更新する必要があります。詳細については、[テストが失敗した理由](/docs/results/test-results/why-did-my-test-fail)を参照してください。
