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

Custom capabilities を使用すると、利用可能なすべての Grid に対して幅広い advanced test parameter を追加できます。これらは JSON オブジェクトのキーと値のペアとして記述します。例えば、デバイスのシステム言語やタイムゾーンを次のように指定できます。

```json
{
  "appium:language": "en",
  "appium:timeZone": "Europe/London"
}
```

この例では、システム言語を英語（English）、タイムゾーンを London にしてテスト自動化セッションを開始するよう driver へ指示しています。

## 利用可能な capabilities

多数のケイパビリティから選択できます。利用可否はテストを実行する Grid に依存するため、開始前に対象 Grid が何をサポートしているかを確認してください。\
Testim のテスト設定ですでに定義されている一部のケイパビリティは上書きできません。対象には次のものが含まれます。

- `platformName` / `platform`
- `app`/`bundleId`/`appPackage`
- `chromiumOptions.extensions`

## Custom capabilities を作成する

すべての Custom capabilities は **Runs** ページの **Custom capabilities** で作成および保存されます。新しい custom capability を作成するには、次の手順に従います。

1. **Custom capabilities** に移動し、**+** を選択します。
2. Monaco Code Editor で、テストへ追加したい capability 名の入力を開始します。エディターは利用可能なキーを自動提案して補完します。
3. キーを選択し、値を定義します。
4. **Save** を選択します。
5. custom capability に名前を付けます。

## テストに Custom capabilities を追加する

Custom capabilities を作成したら、次の手順でテストに追加します。

1. Test Library からテストを開きます。
2. 右上の **Show step properties** を選択します。
3. **Custom capabilities** リストから、先ほど作成した Custom capability を選択します。
4. 事前に Custom capability を作成していない場合は **Add new one** を選択します。**Custom capabilities** ページへ移動し、上記手順で新しい capabilities を作成できます。
5. テストを実行します。

## CLI で Custom capabilities を使う

command line interface (CLI) では、Custom capabilities 付きでテストを実行できます。次の 2 つのパラメーターのいずれかを使用します。

- `--custom-capabilities-name`: Testim 上で事前に作成した Custom capability を追加します。
- `--custom-capabilities-file`: ローカルで JSON ファイルとして作成した Custom capability を追加します。

この 2 つのパラメーターは同時には使用できません。

:::info
CLI を使って SauceLabs / BrowserStack Grid で capabilities を扱う方法の詳細は、[SauceLabs と BrowserStack の CLI 用テスト capabilities](/docs/integrations/grid-management/saucelabs-browserstack-options) を参照してください。
:::

## Custom capabilities を使ってテストを schedule する

Custom capability をテストへ追加したら、[テストをスケジュール](/docs/running-tests/scheduler-mobile) できます。\
scheduled test run で Custom capabilities を上書きすることもできます。手順は次のとおりです。

1. 通常どおりテストのスケジューリングを開始します。
2. scheduler 設定の **What to run on** で **Override custom capabilities** を選択します。
3. 新しい Custom capabilities を選択します。これらは、元の Custom capabilities を変更せず、この scheduled run にだけ追加されます。
4. **Save** を選択します。
