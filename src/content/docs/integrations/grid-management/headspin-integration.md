---
title: HeadSpin Integration
description: >-
  Testim で HeadSpin Grid を追加し、HeadSpin API Token を取得して設定する方法を説明します。
category: 統合
order: 12031
updated: '2025-09-22'
sourceUrl: 'https://docs.tricentis.com/testim/content/integrations/grid-management/headspin-integration.htm'
keywords:
  - HeadSpin
  - API Token
  - Grid
  - mobile
  - Testim HeadSpin Mobile
---

Testim で作成した mobile テストを HeadSpin 上で実行できます。

この記事では、Testim 上で HeadSpin Grid を設定する方法を説明します。

## HeadSpin Grid を追加する

**HeadSpin Grid を追加するには:**

1. [Adding a grid](/docs/integrations/grid-management#adding-a-grid) の手順に従い、**Grid Type** で **Testim HeadSpin Mobile** を選択します。
2. **Next** をクリックします。
3. 次の field を入力します。

- **Name**: 実行時に使用する Grid 名
- **API Token**: HeadSpin 側で生成した API Token。詳細は後述します。

![HeadSpin Grid の Name と API Token を設定する画面](/images/grid-management/headspin-integration/29244fe-2023-01-29_17-51-47.gif)

## HeadSpin API Token を取得する

**HeadSpin API Token を取得するには:**

1. HeadSpin account に login します。
2. 画面右上で user name をクリックします。

![HeadSpin の user menu を開いた状態](/images/grid-management/headspin-integration/689ab5c-2023-01-29_18-01-05.png)

3. **Settings** をクリックします。
4. **User Settings** の **API Token** section で、既存 token をコピーするか、**+New Token** button をクリックして新規 token を作成します。
5. API Token をコピーし、Testim の API Token field に貼り付けます。
