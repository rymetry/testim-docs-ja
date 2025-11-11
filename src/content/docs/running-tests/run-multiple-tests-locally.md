---
title: 'ローカルで複数のテストを実行'
description: 'テスト実行セクション「Run Multiple Tests Locally」に関するドキュメント。'
category: 'テスト実行'
order: 9
updated: '2025-11-11'
keywords:
  - testim
  - run-multiple-tests-locally
  - running-tests
---

ローカルブラウザーで複数のテストを実行する

グリッドではなくローカルブラウザーで複数のテストを実行できます。 ローカルでは、Chrome ブラウザーでのみテストを実行できます。

:fa-arrow-right: **複数のテストを実行するには:**

1. **テストリスト > テスト** に移動します。

2. **テストライブラリ** で 2 つ以上のテストを選択します。

![](/images/running-tests/run-multiple-tests-locally/be99418-test-library.jpg "test-library.jpg")

> 📘
>
> CTRL/CMD キーを押しながら各テストをクリックすることで、複数のテストを選択できます。

3. 選択したテストを右クリックし、右クリック メニューから **再生** をクリックするか、アクションメニューから **再生** アイコンをクリックします。

![](/images/running-tests/run-multiple-tests-locally/3fc7106-run-tests.jpg "run-tests.jpg")

4. 希望するオプションを選択し、**OK** ボタンをクリックします。

   * **シークレットモードで実行** - テストを初めて実行するかのように実行する場合は、このオプションを選択します。 これは、リモート実行または CLI 経由でテストがどのように実行されるかをシミュレートしたい場合に適しています。 ([詳細](/docs/running-tests/run-in-incognito))
   * **ベース URL をオーバーライド** - ベース URL に関する現在のテスト構成をオーバーライドする場合は、このオプションを選択します。 このオプションを選択した後、新しいベース URL を入力します。

![](/images/running-tests/run-multiple-tests-locally/5b7669c-run-options.jpg "run-options.jpg")

Testim はマウスを制御し、選択したテストをローカルブラウザーで実行開始します。 テストが完了すると、実行結果画面が表示されます。

> 🚧
>
> テスト実行中はマウスまたはコンピューターを使用しないでください。

![](/images/running-tests/run-multiple-tests-locally/eaa0844-execution-runs.jpg "execution-runs.jpg")

## リアルタイムでチームのローカルテスト実行を追跡

テストリストを通じてローカルで実行されるテストは追跡され、実行タブから簡単に表示できます。

1. **実行 > 実行** に移動します。
2. **期間** を選択して、テストが実行されたときに基づいて実行結果をフィルタリングします。

![](/images/running-tests/run-multiple-tests-locally/991886d-runs-timeframe.jpg "runs-timeframe.jpg")

3. **詳細フィルタ** を選択して、以下を含む特定の条件で実行結果をフィルタリングします:

   * **実行のステータス** - 実行結果を現在のステータスでフィルタリングします
   * **ブラウザー** - 実行が実行されたブラウザーで実行結果をフィルタリングします
   * **ラベル** - 特定の [ラベル](/docs/test-management/labels) を含むテストの実行結果をフィルタリングします
   * **プラン** - 特定の [テスト計画](/docs/test-management/test-plans) 内のテストの実行結果をフィルタリングします

テストリストとその結果が「local-suite」としてマークされた結果を表示します。これはテストがローカルで実行されたことを示します。

![](/images/running-tests/run-multiple-tests-locally/b42f121-filtered-execution-runs.jpg "filtered-execution-runs.jpg")

4. 下部の **実行結果** の 1 つをダブルクリックして、詳細を表示します。

![](/images/running-tests/run-multiple-tests-locally/c36a25b-click-execution-run.jpg "click-execution-run.jpg")
