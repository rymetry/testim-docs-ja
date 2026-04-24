---
title: ターボモード
description: Testim テストを大規模に効率的に実行し、パフォーマンスを向上させます。
category: TestOps
order: 15016
updated: '2025-11-02'
sourceUrl: 'https://docs.tricentis.com/testim/content/testops/turbo-mode.htm'
keywords:
  - ターボモード
  - パフォーマンス向上
  - 実行時間短縮
  - CLI 実行
  - スケジュール実行
  - Chrome
  - Edge Chromium
  - PRO機能
---

パフォーマンスを向上させ、テストの実行時間を平均 30% 短縮し、不要なデータの保存を回避します。

:::note{title="これはPRO機能です"}
この機能は、[Professional plan](https://www.testim.io/pricing/) のプロジェクトでのみ利用できます。
:::

:::note
「Turbo」モードは、Chrome または Edge Chromium のみで適用されます。
:::

## ターボモードでの実行

ターボモードでのテストの実行は、CLI 実行またはスケジュール実行で行うことができます。テストは拡張モードでのみ実行されます（Chrome と Edge Chromium）。ターボモードで実行する場合、次の設定が適用されます:

- ステップ遅延は無視されます
- テストアーティファクトは失敗した実行に対してのみ保存され、成功した実行では収集されません:
- スクリーンショット
- ネットワークログ
- コンソールログ
- DOM データ
- 実行パラメーター
- アクセシビリティステップレポート
- BASEURL

:::note
ブラウザのクラッシュなど、失敗した実行でもデータが保存されない場合があります。
:::

### CLI 経由でのターボモード実行

ターボモードで実行するには、CLI コマンドで `--turbo-mode` を使用します。CLI 実行の詳細については、[コマンドライン CLI](/docs/running-tests/the-command-line-cli) を参照してください。\
例:

```shell
testim  --token "<YOUR ACCESS TOKEN>" --project "<YOUR PROJECT ID>" --grid "<Your grid name>" --turbo-mode
```

### スケジューラー経由でのターボモード実行

スケジュールされた実行をターボモードに変換するには、変換したいスケジュールされた実行を選択 --> 編集モードに入る --> ターボモードトグルをオンにします。

![ターボモード実行アニメーション](/images/insights/turbo-mode/4dc96a6-Oct-26-2021_12-46-54.gif)

## ターボモードテスト結果

- 上記のように、テストアーティファクトは失敗したテストに対してのみ利用可能です
- 実行の下 - ターボモード表示が表示されます

![ターボモード実行結果 1](/images/insights/turbo-mode/47fe6d2-Screen_Shot_2021-10-27_at_6.23.57.png)

- テスト実行の下 - ターボモードで実行された各テストには表示があります

![ターボモード実行結果 2](/images/insights/turbo-mode/2c63b5a-Screen_Shot_2021-10-27_at_6.25.47.png)

- エディター - 各結果の左上（テストステータスの隣）に表示があります

![ターボモードテスト結果リスト](/images/insights/turbo-mode/1c24db7-Screen_Shot_2021-10-27_at_6.27.52.png)
