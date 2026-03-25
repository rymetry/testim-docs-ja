---
title: Custom Test Capabilities
description: >-
  すべての Grid で利用できる advanced test parameter を Custom capabilities として作成、
  テストへ追加し、CLI や Scheduler で利用する方法を説明します。
category: 統合
order: 12029
updated: '2025-11-21'
sourceUrl: 'https://docs.tricentis.com/testim/content/integrations/grid-management/custom-capabilities.htm'
keywords:
  - Custom capabilities
  - Grid
  - BrowserStack
  - SauceLabs
  - Appium
  - CLI
  - Scheduler
---

すべての Grid で advanced test configuration（capabilities）を追加する方法を説明します。

Custom capabilities を使用すると、利用可能なすべての Grid に対して幅広い advanced test parameter を追加できます。これらは JSON object の key-value pair として記述します。

例えば、device の system language や time zone を次のように指定できます。

```json
{
  "appium:language": "en",
  "appium:timeZone": "Europe/London"
}
```

この例では、system language を English、time zone を London にして test automation session を開始するよう driver へ指示しています。

## 利用可能な capabilities

多数の capability から選択できます。利用可否はテストを実行する Grid に依存するため、開始前に対象 Grid が何をサポートしているかを確認してください。

Testim の test configuration で既に定義されている一部 capability は上書きできません。対象には次のものが含まれます。

- `platformName` / `platform`
- `app`/`bundleId`/`appPackage`
- `chromiumOptions.extensions`

## Custom capabilities を作成する

すべての Custom capabilities は **Runs** page の **Custom capabilities** で作成および保存されます。新しい Custom capability を作成するには、次の手順に従います。

1. **Custom capabilities** に移動し、**+** を選択します。
2. Monaco Code Editor で、テストへ追加したい capability 名の入力を開始します。editor は利用可能な key を自動提案して補完します。
3. key を選択し、value を定義します。
4. **Save** を選択します。
5. Custom capability に名前を付けます。

## テストに Custom capabilities を追加する

Custom capabilities を作成したら、次の手順でテストに追加します。

1. test library から test を開きます。
2. 右上の **Show step properties** を選択します。
3. **Custom capabilities** list から、先ほど作成した Custom capability を選択します。
4. 事前に Custom capability を作成していない場合は **Add new one** を選択します。**Custom capabilities** page へ移動し、上記手順で新しい capability を作成できます。
5. test を実行します。

## CLI で Custom capabilities を使う

command line interface (CLI) では、Custom capabilities 付きでテストを実行できます。次の 2 つの parameter のいずれかを使用します。

- `--custom-capabilities-name`: Testim 上で事前に作成した Custom capability を追加します。
- `--custom-capabilities-file`: local で JSON file として作成した Custom capability を追加します。

この 2 つの parameter は同時には使用できません。

:::info
CLI を使って SauceLabs / BrowserStack Grid で capability を扱う方法の詳細は、[Test capabilities for SauceLabs & BrowserStack in CLI](/docs/saucelabs-browserstack-options) を参照してください。
:::

## Custom capabilities を使ってテストを schedule する

Custom capability をテストへ追加したら、[テストを schedule](/docs/scheduler-mobile) できます。

scheduled test run で Custom capabilities を上書きすることもできます。手順は次のとおりです。

1. 通常どおり test の scheduling を開始します。
2. scheduler 設定の **What to run on** で **Override custom capabilities** を選択します。
3. 新しい Custom capabilities を選択します。これらは、元の Custom capabilities を変更せず、この scheduled run にだけ追加されます。
4. **Save** を選択します。
