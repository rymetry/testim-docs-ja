---
title: '複数ブラウザでテストを実行'
description: 'テスト実行セクション「Running tests on multiple browsers」に関するドキュメント。'
category: 'テスト実行'
order: 8
updated: '2025-11-11'
keywords:
  - testim
  - running-tests-on-multiple-browsers
  - running-tests
---
テストは異なるブラウザで並行して実行でき、実行時間を短縮し、複数の構成を確認できます。Chrome でのみローカルで実行することもでき、Testim のグリッド、Sauce Labs や Browserstack などの 3 番目のパーティグリッド、または独自の内部 Selenium ベースグリッドなど、サポートされているグリッドで Chrome およびその他のブラウザで実行できます。

ブラウザを実行しているオペレーティングシステムは、使用しているグリッドに依存します。

**テストを実行できるブラウザと OS は？**

| ブラウザ       | Testim グリッド | Selenium グリッド  | 3 番目パーティグリッド |
| :------------ | :------------ | :---------------- | :---------------- |
| Chrome        | はい - Linux   | はい - 複数 OS    | はい - 複数 OS    |
| Firefox       | はい - Linux   | はい - 複数 OS    | はい - 複数 OS    |
| Safari        | はい - macOS   | はい - macOS      | はい - macOS      |
| Edge Chromium | はい - Windows | はい - Windows    | はい - Windows    |

## テストを複数のブラウザで実行する方法は？

テストを複数のブラウザで実行するには、Testim Editor を使用する代わりに、CLI または [スケジューラー](/docs/running-tests/scheduler) を使用してテストを実行する必要があります。この記事では、CLI を使用した実行に焦点を当てます。その方法をご覧ください。

## 構成リスト

まず、実行する構成を定義する必要があります。これには、ブラウザタイプ、オペレーティングシステム、解像度が含まれます。

* 「**実行**」に移動してから、「**構成リスト**」タブに移動します。

このリストには使用可能なすべての構成が含まれています。このリストから 1 つを使用するか、新しい構成を作成できます。

#### 新しい構成を作成する

* 「**新規作成**」をクリックします。
* 構成の名前を追加します
* ブラウザ、オペレーティングシステム、解像度を選択します。
* 「**OK**」をクリックします

![](/images/running-tests/running-tests-on-multiple-browsers/1dfe42b-multiplebrowsers.gif)

## CLI でテストを実行する

このセクションでは、複数のブラウザで実行するために CLI に追加する必要があるものだけに焦点を当てます。[CLI](/docs/running-tests/the-command-line-cli) の使用方法について詳しくは、こちらをお読みください。

* 基本的な CLI は Testim 設定ページで見つけることができます。
* --test-config `<name>` を使用して、実行する構成を CLI に追加します。
* 実行するグリッドのグリッドパラメータを更新してください。グリッドの設定方法については、[こちら](/docs/grid-management/grid-management) をお読みください。

#### Chrome、Edge Chromium、Safari、Firefox

```shell
--test-config "My configuration"
```

<br />

## スケジューラーでテストを実行する

1. **実行** --> **スケジュール実行** --> 編集/新規スケジューラーを追加する場合は、スケジューラーを選択します
2. **何で実行する** の下で、**デフォルト構成をオーバーライド** を選択します。

![](/images/running-tests/running-tests-on-multiple-browsers/5b362d1-scheduler1.png)

3. スケジューラーに実行させたい構成を選択するか、新しい構成を作成します。
4. 新しい構成の場合、スケジューラーに実行させたいブラウザを選択できます。

![](/images/running-tests/running-tests-on-multiple-browsers/1dd5c56-scheduler2.png)

5. **追加** をクリック
6. スケジューラーを保存します。
