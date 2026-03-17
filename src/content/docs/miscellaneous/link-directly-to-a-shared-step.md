---
title: Shared Step に直接リンク
description: 'Shared Steps ライブラリから Shared Step やグループに直接アクセスする方法を説明する Labs 機能です。'
category: Testim Labs
order: 20003
updated: '2025-11-02'
sourceUrl: 'https://help.testim.io/docs/link-directly-to-a-shared-step'
keywords:
  - Shared Steps
  - ダイレクトリンク
  - Shared Steps ライブラリ
  - アクセス性向上
  - Labs機能
---

:::info{title="Testim Labs 機能"}
Testim Labs に参加している場合は、**Settings > Labs** でこの機能が有効になっていることを確認してください。Testim Labs と参加方法の詳細については、[Testim Labs について](/docs/testim-labs)を参照してください。
:::

Shared Step に直接リンク機能は、[Shared Steps ライブラリ](/docs/shared-steps-library)から直接 Shared Step/グループへのアクセスを提供します。Shared Steps ライブラリでテストにアクセスすると、リクエストされたテストが Shared Step/グループが選択された状態で表示されます。

## Shared Step/グループに直接アクセスする

**Shared Step/グループにアクセスするには:**

1. メインナビゲーションで、**Test List** アイコンをクリックします。

![メインナビゲーションのTest Listアイコンをクリックする手順を示す画面](/images/miscellaneous/link-directly-to-a-shared-step/10c510a-Testim_432a.png)

2. **Shared Steps** をクリックして Shared Steps タブを開きます。

![Shared Stepsボタンをクリックして共有ステップタブを開く手順を示す画面](/images/miscellaneous/link-directly-to-a-shared-step/d701b25-Testim_432b.png)

3. 表示したい Shared Step/グループの右側にある**下矢印**をクリックします。

:::note
「used by」アイコンにはゼロより大きい数字が含まれている必要があります。Shared Step/グループを使用しているテストがゼロの場合、表示・編集する前にテストに追加する必要があります。
:::

![共有ステップの右側にある下矢印をクリックして展開する手順を示す画面。「used by」アイコンの数値がゼロより大きいことが必要](/images/miscellaneous/link-directly-to-a-shared-step/0dde977-Testim_433a.png)

アイテムが展開され、Shared Step/グループを含むすべてのテストのリストが表示されます。

![共有ステップが展開され、それを含むすべてのテストのリストが表示されている画面](/images/miscellaneous/link-directly-to-a-shared-step/ad912d7-Testim_434.png)

4. Shared Step/グループを表示したいテストをダブルクリックします。

:::tip
または、テストを右クリックして **Open in new tab** を選択することもできます。
:::

テストが開き、Shared Step/グループが選択されます。

![テストが開かれ、共有ステップが選択された状態の画面](/images/miscellaneous/link-directly-to-a-shared-step/fc31f7c-Testim_435.png)

:::note
開いたテストに Shared Step/グループの複数の出現が含まれている場合、最初の出現のみが選択されます。
:::

![Shared Stepsライブラリから直接Shared Stepにアクセスする一連の手順を示すGIFアニメーション](/images/miscellaneous/link-directly-to-a-shared-step/3107af4-Jul-26-2021_12-46-44.gif)
