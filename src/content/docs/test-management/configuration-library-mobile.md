---
title: 構成ライブラリ - モバイル
description: テストを実行するために使用されるシステム仕様を決定するモバイル構成を管理します
category: テスト管理
order: 9011
updated: '2025-09-15'
sourceUrl: 'https://help.testim.io/docs/configuration-library-mobile'
keywords:
  - モバイル構成
  - 構成ライブラリ
  - モバイルデバイス選択
  - モバイルグリッド
  - モバイルテスト環境
  - モバイル構成ルール
---

モバイル構成は、テストを実行するために使用されるシステム仕様を決定します。テストをローカルで実行する場合、構成はローカル環境と一致する必要があります。テストをリモート（グリッド）環境で実行する場合は、テスト実行中に使用/シミュレートされるモバイルデバイスの属性を指定する関連するモバイル構成を選択する必要があります。

## 既存の構成を表示する

モバイルプロジェクト内では、すべてのモバイル構成が構成ライブラリに保存されます。各構成には次の情報が表示されます:

* **Name** - 構成を識別するために付けられた名前
* **Grid** - 構成に使用されるグリッド
* **Type** - 使用される構成タイプ（static/dynamic）
* **Rules** - 構成に設定されたルール:
  * 静的割り当て構成の場合 - 選択されたデバイスの数
  * 動的割り当て構成の場合 - 設定されたデバイス選択ルール
* **Step Timeout** - Testim がテストステップの失敗を登録する原因となる時間経過
* **Step Delay** - テストステップの実行間の遅延

![モバイル構成の一覧と Name や Grid などの列が表示された構成ライブラリ画面](/images/test-management/configuration-library-mobile/9b3c88f-image_12.png)

## 特定の構成で利用可能なデバイスを確認する

構成の詳細を開かずに、モバイル構成に割り当てられている特定のデバイスを表示できます。

:fa-arrow-right: **保存されたモバイル構成で利用可能なデバイスを表示するには:**

1. 構成ライブラリで特定のモバイル構成を選択します。アクションメニューから **Check available devices button**（利用可能なデバイスを確認）ボタンをクリックします。\
   ![選択したモバイル構成に対して Check available devices ボタンをクリックする画面](/images/test-management/configuration-library-mobile/73aa8b5-image_9.png)

2. Testim は、その構成に割り当てられたデバイスのリストを表示します。\
   ![構成に割り当てられた利用可能なモバイルデバイスの一覧を表示するダイアログ](/images/test-management/configuration-library-mobile/31e58f9-image_10.png)

## 新しい構成を追加する

:fa-arrow-right: **新しい構成を追加するには:**

1. **Runs > Configuration Library** に移動し、**Create New** ボタンをクリックします。\
   ![Runs メニューの Configuration Library で Create New ボタンをクリックする画面](/images/test-management/configuration-library-mobile/f184ba9-image_11.png)
2. **Configuration Name** フィールドに、構成の名前を入力します。
3. **Choose a grid** で、ドロップダウンメニューからグリッドを選択します。希望するグリッドが表示されない場合は、Testim にグリッドを追加する必要がある場合があります。詳細については、[Grid management](/docs/grid-management) を参照してください。
4. **Configuration Type**（構成タイプ）を選択します:
   * **static allocation**（静的割り当て） - 下部に表示される（選択したグリッドからの）利用可能なデバイスのリストから手動で選択します。\
     ![Static allocation で利用可能なモバイルデバイス一覧からデバイスを選択する画面](/images/test-management/configuration-library-mobile/1436e57-image_13.png)

* **dynamic allocation**（動的割り当て） - 以下の Rules セクションで定義されたルール条件に基づいて、構成で使用される選択したグリッドアカウントからモバイルデバイスを Testim が動的に選択できるようにするルールを作成します。このオプションを選択したら、以下の**ステップ 6**にスキップします。\
  ![dynamic allocation を選択しルールベースでデバイスを割り当てる設定画面](/images/test-management/configuration-library-mobile/669b391-image_14.png)

5. **Static Allocation** オプションを選択した場合、**Devices** セクションで、テストで使用したい特定のデバイスのチェックボックスを選択します。このデバイスのリストから、Testim は、選択されたデバイスのプールからグリッドプロバイダーによって最初に利用可能にされたデバイスを選択します。

:::warning{title="注意"}
複数のデバイスを選択した場合でも、Testim はテスト実行中に使用される 1 つのデバイスのみを選択します。このデバイスは、選択されたデバイスのプールからグリッドプロバイダーによって最初に利用可能にされたデバイスです。
:::

:::note
BrowserStack と SauceLabs では、1 つのデバイスしか選択できません。
:::

6. **Dynamic Allocation** オプションを選択した場合、**Rules** で、次の操作を行って条件に一致するデバイスを動的に選択するルールを定義します:
   1. **Field** で、デバイスをフィルタリングする条件を選択します。例えば、**OS Version** を選択して、オペレーティングシステムのバージョンでフィルタリングします。条件のリストは、その特定のプロバイダーによって提供される機能に基づいて、異なるグリッドプロバイダーでは若干異なる場合があります。
   2. **Operator** で、デバイスをフィルタリングするために使用される演算子を選択します。例えば、「greater than」を選択して、OS バージョンがオペランドの値より大きいデバイス（例: 10 より大きい）を選択します。場合によっては、利用可能な場合に正規表現オプションを選択することで正規表現フィルターを適用できます。
   3. **Operand** で、ルールのオペランド値を入力します。正規表現ルールの場合は、正規表現を入力します。\
      現在ルールに一致する選択したグリッドからのデバイスのリストは、以下の **Devices** セクションに表示されます。動的割り当て構成でテストを実行する場合、Testim はルール条件を満たすデバイスのセットから最初に利用可能なデバイスを検索し、そのデバイスをテストに使用します。グリッドプロバイダーがグリッド上のデバイスを更新すると、デバイスは引き続きルールを満たすかどうかに基づいて、構成で自動的に利用可能または利用不可になります。

:::warning{title="注意"}
SauceLabs 固有のルールの詳細については、[SauceLabs Test Configuration Options](https://docs.saucelabs.com/dev/test-configuration-options/index.html) および [Sause Labs Platform Configurator](https://saucelabs.com/products/platform-configurator) を参照してください。

BrowserStack 固有のルールの詳細については、[BrowserStack Select Device Using Regex](https://www.browserstack.com/docs/app-automate/appium/dynamic-device-allocation) を参照してください。
:::

:::note
ルールが複数のデバイスに一致する場合でも、Testim はテスト実行中に使用される 1 つのデバイスのみを選択します。このデバイスは、ルール条件を満たすデバイスのセットから最初に利用可能なデバイスです。
:::

7. 下部近くの **Advanced** リンクをクリックして、構成に追加の詳細パラメーターを定義します。**Back** ボタンをクリックして、メイン構成設定に戻ります。

8. **General** セクションで、必要に応じて次の設定を変更します:
   1. Step timeout - Testim がテストステップの失敗を登録する原因となるミリ秒単位の時間経過
   2. Step delay - テストステップの実行間のミリ秒単位の遅延
   3. Setup step timeout - テストの Setup ステップを実行する前のミリ秒単位の遅延

9. **Before/After hooks** セクションで、必要に応じて設定を変更します。詳細については、[Hooks](/docs/hooks) を参照してください。\
   ![Before/After hooks やタイムアウトなど詳細設定を編集する Edit Config 画面](/images/test-management/configuration-library-mobile/9afddd9-image_16.png)

10. **Add** ボタンをクリックして、新しいモバイル構成を作成します。\
    ![新しいモバイル構成の内容を確認して Add ボタンで保存する画面](/images/test-management/configuration-library-mobile/1e95b69-image_15.png)

## モバイル構成を使用してテストを実行する

すべてのテストには、テストの Setup ステップの **Properties** パネルからアクセスできる独自のデフォルト構成があります。デフォルトでは、**Device Name** 設定は「Any device」、**OS Version** 設定は「Any version」になります。この設定に従って、Testim は選択したグリッド上で最初に利用可能なデバイスを選択します。テストのデフォルト構成で設定された構成パラメーターは、テストが異なるテスト構成で実行されない限り適用されます。

:::note
テストが CLI で実行される場合、実行コマンドで新しいテスト構成を指定することでデフォルト構成を上書きできます。[Command Line Interface](/docs/the-command-line-cli#test-config) を参照してください。
:::

## テスト構成のクローン作成、名前変更、変更、削除

### テスト構成のクローン作成

:fa-arrow-right: **テスト構成をクローンするには:**

1. 左側のメニューで、**Runs > Configuration List** に移動します。\
   **Configuration Library** が表示されます。
2. クローンしたいテスト構成の行をクリックします。\
   コンテキストツールが表示されます。
3. **Clone** アイコンをクリックします。

![Configuration Library でテスト構成を選択し Clone アイコンをクリックする画面](/images/test-management/configuration-library-mobile/1e505f5-image.png)

:::note
または、行を右クリックして、**Clone** を選択することもできます。
:::

4. **Name** フィールドに、クローンされた構成の名前を入力します。
5. **Clone** をクリックします。\
   構成がクローンされ、**Configuration Library** に表示されます。

### テスト構成の名前変更

:fa-arrow-right: **テスト構成の名前を変更するには:**

1. メインメニューで、**Runs > Configuration List** に移動します。

**Configuration Library** が表示されます。

2. 名前を変更したいテスト構成の行をクリックします。\
   コンテキストツールが表示されます。
3. **Rename** アイコンをクリックします。

:::note
または、行を右クリックして、**Rename** を選択することもできます。
:::

**Edit Name** 設定が表示されます。

![Edit Name ダイアログでテスト構成の新しい名前を入力する画面](/images/test-management/configuration-library-mobile/b9a1933-image_1.png)

4. **New name** フィールドに、この構成の新しい名前を入力します。
5. **OK** をクリックします。\
   構成の名前が変更されます。

### テスト構成の変更

:fa-arrow-right: **テスト構成を変更するには:**

1. メインメニューで、**Runs > Configuration List** に移動します。

**Configuration Library** が表示されます。

2. 変更したいテスト構成の行をダブルクリックします。\
   **Edit Config** 設定が表示されます。

![既存のテスト構成をダブルクリックして Edit Config 画面を開いた状態](/images/test-management/configuration-library-mobile/4dabcb0-image_3.png)

3. 上記の**新しい構成を追加する**セクションの手順に基づいて、基本設定と詳細設定を変更します。
4. **Change** をクリックします。\
   構成が変更されます。

### テスト構成の削除

:fa-arrow-right: **テスト構成を削除するには:**

1. 左側のメニューで、**Runs > Configuration List** に移動します。

**Configuration Library** が表示されます。

2. 削除したいテスト構成の行をクリックします。\
   コンテキストツールが表示されます。
3. **Delete** アイコンをクリックします。\
   ![Configuration Library で Delete アイコンをクリックしてテスト構成の削除を実行する画面](/images/test-management/configuration-library-mobile/138a8ac-image_2.png)

:::note
または、行を右クリックして、**Delete** を選択することもできます。
:::

確認ダイアログが表示されます。

4. **Delete** をクリックします。\
   構成が **Configuration Library** から削除されます。
