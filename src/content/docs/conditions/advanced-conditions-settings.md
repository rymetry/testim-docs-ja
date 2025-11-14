---
title: '拡張条件設定'
description: '条件やループの高度な設定方法を学びます。条件判定のリトライ時間や検証時間を調整して、より柔軟なテスト実行を実現します。'
category: '条件分岐'
order: 2
updated: '2025-09-13'
sourceUrl: 'https://help.testim.io/docs/advanced-conditions-settings'
keywords:
  - 拡張条件設定
  - 条件リトライ
  - 条件検証
  - タイムアウト設定
  - ループ条件
  - While element
  - 条件判定
  - 高度な設定
---
Testim の条件は、ステップの実行にもループの繰り返し（[Repeat Group Loops](/docs/loops)）にも適用できます。\
ステップやループに設定した条件が false の場合、既定ではステップはスキップ（またはループは即座に終了）されます。逆に条件が true の場合、既定では直ちにステップを実行（またはループを繰り返し）ます。下記の拡張オプションを使うと、true/false と判定する前に一定時間、条件チェックを継続するように設定できます。

> 📘 次の種類の条件に拡張設定を適用できます: Element、Element text、Custom\
> 次の種類のループに拡張設定を適用できます: While element、While element text is、For each item、Loop for、Custom

:fa-arrow-right: **拡張条件設定を構成するには:**

1. [Conditions](/docs/conditions) に従って条件を設定するか、[Repeat Group Loops](/docs/loops) に従ってループを設定します。
2. Properties パネルの **When to run step** セクション（ループの場合は **Repeat group** セクション）で **Settings**（:fa-cog:）をクリックします。右側に **Advanced** パネルが開きます。

![276](/images/conditions/advanced-conditions-settings/9e54f5e-WhenToRunStepCustom.png "WhenToRunStepCustom.png")

![293](/images/conditions/advanced-conditions-settings/2d936c1-Testim_Image_031.png "Testim Image 031.png")

以下の通り、拡張設定を構成します:

* **When a condition fails retry** — チェックをオンにし、ミリ秒単位の時間を指定すると、条件が false の場合でも次のステップへ進む前（またはループを終了する前）に、その時間の間リトライします。既定では最初の判定が false の場合、ステップは即座にスキップ（またはループは即座に停止）されます。次のステップに進む（またはループを抜ける）前に再試行させたい場合に使用します。
* **When a condition passes verify** — 既定では条件が true の場合、ステップ（またはループ内のグループステップ）は実行されます。このオプションをオンにしてミリ秒単位の時間を指定すると、true と確定して実行する前にもう一度判定を実施します。最初の判定が false の場合、このオプションをオンにしていても再試行は行われません。
