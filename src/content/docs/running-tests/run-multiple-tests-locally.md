---
title: ローカルで複数のテストを実行
description: >-
  テストライブラリから複数のテストを選択し、Chrome のローカルブラウザでまとめて実行する方法と、シークレットモードやベース URL
  のオーバーライドなどのオプションを説明します。
category: テスト実行
order: 6009
updated: '2025-09-22'
sourceUrl: 'https://docs.tricentis.com/testim/content/running-tests/run-multiple-tests-locally.htm'
keywords:
  - ローカル実行
  - 複数テスト
  - Chrome
  - シークレットモード
  - ベース URL
  - テストリスト
  - 実行結果
  - Testim
---

ローカルブラウザで複数のテストを実行する

グリッドではなくローカルブラウザで複数のテストを実行できます。 ローカルでは、Chrome ブラウザでのみテストを実行できます。

**複数のテストを実行するには:**

1. **テストリスト > テスト** に移動します。

2. **テストライブラリ** で 2 つ以上のテストを選択します。

![テストライブラリで複数テストを選択する画面](/images/running-tests/run-multiple-tests-locally/be99418-test-library.jpg)

:::note
CTRL/CMD キーを押しながら各テストをクリックすることで、複数のテストを選択できます。
:::

3. 選択したテストを右クリックし、右クリック メニューから **再生** をクリックするか、アクションメニューから **再生** アイコンをクリックします。

![複数テストの再生メニュー](/images/running-tests/run-multiple-tests-locally/3fc7106-run-tests.jpg)

4. 希望するオプションを選択し、**OK** ボタンをクリックします。
   - **シークレットモードで実行** - テストを初めて実行するかのように実行する場合は、このオプションを選択します。 これは、リモート実行または CLI 経由でテストがどのように実行されるかをシミュレートしたい場合に適しています。 （[詳細](/docs/running-tests/run-in-incognito)）
   - **ベース URL をオーバーライド** - ベース URL に関する現在のテスト構成をオーバーライドする場合は、このオプションを選択します。 このオプションを選択した後、新しいベース URL を入力します。

![ローカル実行オプションの選択画面](/images/running-tests/run-multiple-tests-locally/5b7669c-run-options.jpg)

Testim はマウスを制御し、選択したテストをローカルブラウザで実行開始します。 テストが完了すると、実行結果画面が表示されます。

:::warning
テスト実行中はマウスまたはコンピューターを使用しないでください。
:::

![ローカル実行結果一覧画面](/images/running-tests/run-multiple-tests-locally/eaa0844-execution-runs.jpg)

## リアルタイムでチームのローカルテスト実行を追跡

テストリストを通じてローカルで実行されるテストは追跡され、実行タブから簡単に表示できます。

1. **実行 > 実行** に移動します。
2. **期間** を選択して、テストが実行されたときに基づいて実行結果をフィルタリングします。

![実行結果の期間フィルタ設定画面](/images/running-tests/run-multiple-tests-locally/991886d-runs-timeframe.jpg)

3. **詳細フィルタ** を選択して、以下を含む特定の条件で実行結果をフィルタリングします:
   - **実行のステータス** - 実行結果を現在のステータスでフィルタリングします
   - **ブラウザ** - 実行が実行されたブラウザで実行結果をフィルタリングします
   - **ラベル** - 特定の [ラベル](/docs/test-management/labels) を含むテストの実行結果をフィルタリングします
   - **プラン** - 特定の [テスト計画](/docs/test-management/test-plans) 内のテストの実行結果をフィルタリングします

テストリストとその結果が「local-suite」としてマークされた結果を表示します。これはテストがローカルで実行されたことを示します。

![フィルタ適用後のローカル実行結果一覧](/images/running-tests/run-multiple-tests-locally/b42f121-filtered-execution-runs.jpg)

4. 下部の **実行結果** の 1 つをダブルクリックして、詳細を表示します。

![実行結果詳細を開く操作のスクリーンショット](/images/running-tests/run-multiple-tests-locally/c36a25b-click-execution-run.jpg)
