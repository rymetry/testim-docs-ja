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

この記事では、Testim 上で HeadSpin Grid を設定する方法を説明します。

## HeadSpin Grid を追加する

**HeadSpin Grid を追加するには:**

1. [グリッドの追加](/docs/integrations/grid-management#adding-a-grid) の手順に従い、**Grid Type** で **Testim HeadSpin Mobile** を選択します。
2. **Next** をクリックします。
3. 次のフィールドを入力します。

- **Name**: 実行時に使用する Grid 名
- **API Token**: HeadSpin 側で生成した API Token。詳細は後述します。

![HeadSpin Grid の Name と API Token を設定する画面](/images/grid-management/headspin-integration/29244fe-2023-01-29_17-51-47.gif)

## HeadSpin API Token を取得する

**HeadSpin API Token を取得するには:**

1. HeadSpin アカウントにログインします。
2. 画面右上でユーザー名をクリックします。

![HeadSpin の user menu を開いた状態](/images/grid-management/headspin-integration/689ab5c-2023-01-29_18-01-05.png)

3. **Settings** をクリックします。
4. **User Settings** の **API Token** セクションで、既存のトークンをコピーするか、**+New Token** ボタンをクリックして新しいトークンを作成します。
5. API Token をコピーし、Testim の API Token フィールドに貼り付けます。
