---
title: 共有構成
description: 複数/すべてのテストで同じテスト構成を使用します
category: テスト管理
order: 9010
updated: '2025-09-15'
sourceUrl: 'https://help.testim.io/docs/shared-configuration'
keywords:
  - 共有構成
  - テスト構成
  - 構成ライブラリ
  - テスト環境設定
  - ブラウザ構成
  - CLI 実行設定
---

複数/すべてのテストで同じテスト構成を使用します

**Configuration List** ページには、ローカルで実行する場合でも CLI で実行する場合でも、作成されテストに使用できるすべてのテスト構成が表示されます。テストの構成は、テストを実行するために使用されるシステム仕様を決定します。テストをローカルで実行する場合、構成はローカル環境と一致する必要があります。Testim Grid でテストを実行する場合、Testim は指定した環境をシミュレートします。CLI でテストを実行するときに `--test-config` フラグを使用してテスト構成を含めることができます。詳細については、[Test Config](/docs/the-command-line-cli) を参照してください。このリストのテスト構成は、*Configuration Library* または *Test Editor* の Setup ステップで作成および変更できます。

## 既存の構成を表示する

Web プロジェクト内では、すべての構成セットが構成ライブラリに保存されます。各構成には次の情報が表示されます:

* **Name** - 構成を識別するために付けられた名前
* **OS**- 構成に使用されるオペレーティングシステム
* **Resolution**- 構成に使用される画面解像度
* **Browser**- 構成に使用されるブラウザ
* **Step Timeout** - テストがタイムアウトするミリ秒単位の時間
* **Step Delay** - Testim がテストの各ステップ間で自動的に一時停止する時間

![Configuration Library に Web テスト構成の一覧が表示された画面](/images/test-management/shared-configuration/6d34e75-webconfiglibrary.png)

* **Configuration Library** – 構成ライブラリで新しい構成を作成できます。この構成は、その構成で設定されたテストで実行されるすべてのステップに適用されます（CLI またはスケジューラー経由で実行されるテストを含む）。テスト構成の詳細については、[Setting the Test Configuration](/docs/how-to-record-a-test) を参照してください。CLI の詳細については、[Command line interface: Test Config](/docs/the-command-line-cli) を参照してください。スケジューラーの詳細については、[Scheduler](/docs/scheduler) を参照してください。
* **Setup Step in the Test Editor** – すべてのテストには、テストの Setup ステップのプロパティパネルからアクセスできる独自のデフォルト構成があります。テストのデフォルト構成で設定された構成パラメーターは、テストが異なる構成で CLI またはスケジューラーから実行されない限り適用されます。

:::note
テストが CLI で実行される場合、実行コマンドで新しいテスト構成を指定することでデフォルト構成を上書きできます。[Command line interface](/docs/the-command-line-cli) を参照してください。
:::

:::warning
テスト構成に対応しないシステムでテストをローカルで実行すると、テストは利用可能な構成で実行され、警告メッセージが表示されます。
:::

## 構成ライブラリでテスト構成を作成および変更する

**Configuration Library** では、新しいテスト構成を作成できます。また、現在の構成をクローン、変更、名前変更、削除できます。

### 新しいテスト構成を作成する

**新しいテスト構成を作成するには:**

1. 左側のメニューで、**Runs > Configuration List** に移動します。

![左側メニューから Runs > Configuration List を開き Configuration Library を表示している画面](/images/test-management/shared-configuration/bde6165-Testim_502b.png)

**Configuration Library** が表示されます。

2. **+ Create New** ボタンをクリックします。

![Configuration Library で+ Create New ボタンをクリックする画面](/images/test-management/shared-configuration/bc7aa0f-Testim_503a.png)

**Add New Config** 設定が表示されます。

![Add New Config ダイアログでブラウザや OS など基本設定を入力する画面](/images/test-management/shared-configuration/b2d6d80-Testim_504_r.png)

3. 基本オプションを次のように入力します:

* **Name** フィールドに、この新しい構成の名前を入力します。
* **Browser** セクションで、ドロップダウン矢印をクリックして、希望するブラウザを選択します。
* **OS** セクションで、ドロップダウン矢印をクリックして、希望するオペレーティングシステムを選択します。
* **Resolution** セクションで、ドロップダウン矢印をクリックして、希望する解像度を選択します。

4. **Advanced** をクリックします。\
   詳細構成オプションが表示されます。\
   ![テスト構成の詳細設定セクションで Native Events の動作を設定する画面](/images/test-management/shared-configuration/eac30c0-advancednative.jpg)

5. **General** セクションで、**Step timeout**、**Step delay**、**Setup step timeout** の設定を必要に応じて変更します。詳細については、[Test Configuration Parameters](/docs/how-to-record-a-test) を参照してください。

6. **Native Events** セクションでは、このテスト構成のみのクリックステップの処理方法のデフォルト設定を別の設定で上書きできます。デフォルトでは、プロジェクトレベルで、クリックステップはネイティブまたは非ネイティブイベントを使用するように構成されています。「クリックステップ」は合格したのに、クリックが実際には実行されなかったためにテストが失敗することがあります。考えられる解決策は、テストのクリックステップを反対の構成で構成することです（つまり、ネイティブの代わりに非ネイティブ、またはその逆）。すべてのクリックステップの構成を個別に変更する代わりに、デフォルトのネイティブ/非ネイティブ構成を上書きするテスト構成を作成し、この構成でテストを実行して、反対の設定が問題を解決したかどうかを確認できます。デフォルトの Native events 設定を上書きするには、**Apply to click steps** チェックボックスを選択します。

7. **Click event type** では、現在のデフォルト設定が表示されます。このテスト構成のデフォルト設定を上書きするには、ドロップダウンメニューをクリックして、他の値を選択します（例: **Native click event** だった場合は、**Non-native click event** を選択します）。

   ![Before と After hooks の設定を編集するテスト構成詳細画面](/images/test-management/shared-configuration/93bbedb-3845ef1-image_1.png)

   ネイティブオーバーライドでテストを実行した後、テスト実行サマリーにネイティブまたは非ネイティブオーバーライドが適用されたかどうかの表示が表示されます。以下の例では、**Native click event** オプションが選択されています。

   ![新しいテスト構成の内容を確認し Change ボタンで保存する画面](/images/test-management/shared-configuration/1a9eceb-028f074-image.png)

8. **Before/After hooks** セクションで、必要に応じて設定を変更します。詳細については、[Before & after hooks](/docs/configuration-file-run-hooks) を参照してください。

9. **Add** をクリックします。\
   構成が作成され、**Configuration Library** に追加されます。

### テスト構成のクローン作成

**テスト構成をクローンするには:**

1. 左側のメニューで、**Runs > Configuration List** に移動します。

![Configuration Library で構成リストを表示し編集対象の行を選択している画面](/images/test-management/shared-configuration/9a234a1-Testim_502b.png)

**Configuration Library** が表示されます。

2. クローンしたいテスト構成の行をクリックします。\
   コンテキストツールが表示されます。

![選択したテスト構成の行にコンテキストツールが表示されている画面](/images/test-management/shared-configuration/b2ffc88-Testim_590a.png)

3. **Clone** アイコンをクリックします。

![テスト構成のコンテキストツールバーに表示された Rename アイコン](/images/test-management/shared-configuration/c9eac99-Testim_590b.png)

:::note
または、行を右クリックして、**Clone** を選択することもできます。
:::

**Clone Configuration** オプションが表示されます。

![Edit Name ダイアログで構成の新しい名前を入力する画面](/images/test-management/shared-configuration/53958a2-Testim_591_r.png)

4. **Name** フィールドに、クローンされた構成の名前を入力します。
5. **Clone** をクリックします。\
   構成がクローンされ、**Configuration Library** に表示されます。

### テスト構成の変更

**テスト構成を変更するには:**

1. 左側のメニューで、**Runs > Configuration List** に移動します。

![Runs > Configuration List から構成一覧を開いた Configuration Library 画面](/images/test-management/shared-configuration/15c8c6f-Testim_502b.png)

**Configuration Library** が表示されます。

2. 変更したいテスト構成の行をダブルクリックします。\
   **Edit Config** 設定が表示されます。

![Edit Config 画面でブラウザや解像度など構成詳細を編集する画面](/images/test-management/shared-configuration/7ef3c8f-editconfig.jpg)

3. 基本オプションを次のように変更します:

* **Name** フィールドに、この新しい構成の名前を入力します。
* **Browser** セクションで、ドロップダウン矢印をクリックして、希望するブラウザを選択します。
* **OS** セクションで、ドロップダウン矢印をクリックして、希望するオペレーティングシステムを選択します。
* **Resolution** セクションで、希望する解像度を選択します。

4. **Advanced** をクリックします。\
   詳細構成オプションが表示されます。

![Edit Config 画面で Native Events やその他の詳細オプションを変更する画面](/images/test-management/shared-configuration/6780665-editconfig2.jpg)

5. **General** セクションで、**Step timeout**、**Step delay**、**Setup step timeout** の設定を必要に応じて変更します。詳細については、[Test Configuration Parameters](/docs/how-to-record-a-test) を参照してください。
6. **Native Events** セクションでは、このテスト構成のみのクリックステップの処理方法のデフォルト設定を別の設定で上書きできます。デフォルトでは、プロジェクトレベルで、クリックステップはデフォルトでネイティブまたは非ネイティブイベントを使用するように構成されています。「クリックステップ」は合格したのに、クリックが実際には実行されなかったためにテストが失敗することがあります。考えられる解決策は、テストのクリックステップを反対の構成で構成することです（つまり、ネイティブの代わりに非ネイティブ、またはその逆）。すべてのクリックステップの構成を個別に変更する代わりに、デフォルトのネイティブ/非ネイティブ構成を上書きするテスト構成を作成し、この構成でテストを実行して、反対の設定が問題を解決したかどうかを確認できます。デフォルトの Native events 設定を上書きするには、**Apply to click steps** チェックボックスを選択します。
7. **Click event type** では、現在のデフォルト設定が表示されます。このテスト構成のデフォルト設定を上書きするには、ドロップダウンメニューをクリックして、他の値を選択します（例: **Native click event** だった場合は、**Non-native click event** を選択します）。
8. **Before/After hooks** セクションで、必要に応じて設定を変更します。詳細については、[Before & after hooks](/docs/configuration-file-run-hooks) を参照してください。
9. **Change** をクリックします。\
   構成が変更されます。

### テスト構成の名前変更

**テスト構成の名前を変更するには:**

1. 左側のメニューで、**Runs > Configuration List** に移動します。

![Configuration Library から名前変更したい構成の行を選択する画面](/images/test-management/shared-configuration/efa52dd-Testim_502b.png)

**Configuration Library** が表示されます。

2. 名前を変更したいテスト構成の行をクリックします。\
   コンテキストツールが表示されます。

![選択された構成行にコンテキストツールが表示されている Configuration Library 画面](/images/test-management/shared-configuration/815c253-Testim_590a.png)

3. **Rename** アイコンをクリックします。

![コンテキストツールバーの Rename アイコンを強調表示した画面](/images/test-management/shared-configuration/cd437c4-Testim_590d.png)

:::note
または、行を右クリックして、**Rename** を選択することもできます。
:::

**Edit Name** 設定が表示されます。

![Edit Name 設定で構成の新しい名前を入力するダイアログ](/images/test-management/shared-configuration/3519685-Testim_593_r.png)

4. **New name** フィールドに、この構成の新しい名前を入力します。
5. **OK** をクリックします。\
   構成の名前が変更されます。

### テスト構成の削除

**テスト構成を削除するには:**

1. 左側のメニューで、**Runs > Configuration List** に移動します。

![Configuration Library から削除したい構成の行を選択している画面](/images/test-management/shared-configuration/3dcbaab-Testim_502b.png)

**Configuration Library** が表示されます。

2. 削除したいテスト構成の行をクリックします。\
   コンテキストツールが表示されます。

![選択された構成に対して Delete アイコンを使用できる状態を示すコンテキストツールバー](/images/test-management/shared-configuration/2917eb3-Testim_590a.png)

3. **Delete** アイコンをクリックします。

![コンテキストツールバーの Delete アイコンを強調表示した画面](/images/test-management/shared-configuration/ee65ecc-Testim_590c.png)

:::note
または、行を右クリックして、**Delete** を選択することもできます。
:::

確認ダイアログが表示されます。

![構成削除の確認内容が表示された Delete 確認ダイアログ](/images/test-management/shared-configuration/ac8e414-Testim_592_r.png)

4. **Delete** をクリックします。\
   構成が **Configuration Library** から削除されます。

## 構成ライブラリのフィルタリング

構成ライブラリにフィルターを適用して、特定の条件を満たすアイテムのみを表示できます。

**構成ライブラリをフィルタリングするには:**

1. Runs > Configuration List に移動します。
2. アクションメニューの **Advanced Filters** ボタンをクリックします。

![Configuration Library のアクションメニューで Advanced Filters ボタンをクリックする画面](/images/test-management/shared-configuration/8b46862-configadvancedfilters.png)

3. **Filter Configuration** パネルから希望するフィルターを選択し、**Apply** ボタンをクリックします。

![Filter Configuration パネルで条件を設定し Apply ボタンをクリックする画面](/images/test-management/shared-configuration/cd53734-configapplyfilters.png)

スケジュール実行のリストがフィルター選択に基づいてフィルタリングされます。このフィルタリングされたビューの保存の詳細については、[Saving a Filtered View](/docs/saving-a-filtered-view) を参照してください。

## テストエディターでテスト構成を作成および変更する

**Test Editor** で変更されたテスト構成は、構成に名前が含まれていてテストが保存されている場合、**Configuration Library** に追加されます。新しく追加されたテスト構成は、将来のテストに使用できます。

**テスト内でテスト構成を変更するには:**

1. テストの **Setup** ステップ（最初のステップ）にカーソルを合わせ、**Show properties**  アイコンをクリックします。

![Test Editor の Setup ステップにカーソルを合わせて Show properties アイコンをクリックする画面](/images/test-management/shared-configuration/9bdfe00-Testim_594a.png)

右側に **Properties** パネルが開きます。

![右側に表示された Properties パネルで Configuration セクションが開いている画面](/images/test-management/shared-configuration/db2fc84-Testim_595_r.png)

2. **Configuration** セクションで、**Edit Configuration** アイコンをクリックします。

![Configuration セクションの Edit Configuration アイコンをクリックする画面](/images/test-management/shared-configuration/21b9d84-Testim_596a_r.png)

**Edit Configuration** 設定が表示されます。

![Edit Configuration ウィンドウでブラウザや OS などテスト構成を詳細に設定する画面](/images/test-management/shared-configuration/9ebae2c-editconfig3.jpg)

3. オプションを次のように変更します:

* **Name** フィールドに、この構成の名前を入力します。（名前を入力しない場合、テスト構成は **Configuration Library** に保存されません。）
* **Browser** セクションで、ドロップダウン矢印をクリックして、希望するブラウザを選択します。
* **OS** セクションで、ドロップダウン矢印をクリックして、希望するオペレーティングシステムを選択します。
* **Resolution** セクションで、希望する解像度を選択します。
* **Step timeout**、**Step delay**、**Setup step timeout** の設定を必要に応じて変更します。詳細については、[Test Configuration Parameters](/docs/how-to-record-a-test) を参照してください。
* **Native Events** セクションでは、このテスト構成のみのクリックステップの処理方法のデフォルト設定を別の設定で上書きできます。デフォルトでは、プロジェクトレベルで、クリックステップはデフォルトでネイティブまたは非ネイティブイベントを使用するように構成されています。「クリックステップ」は合格したのに、クリックが実際には実行されなかったためにテストが失敗することがあります。考えられる解決策は、テストのクリックステップを反対の構成で構成することです（つまり、ネイティブの代わりに非ネイティブ、またはその逆）。すべてのクリックステップの構成を個別に変更する代わりに、デフォルトのネイティブ/非ネイティブ構成を上書きするテスト構成を作成し、この構成でテストを実行して、反対の設定が問題を解決したかどうかを確認できます。デフォルトの Native events 設定を上書きするには、**Apply to click steps** チェックボックスを選択します。**Click event type** では、現在のデフォルト設定が表示されます。このテスト構成のデフォルト設定を上書きするには、ドロップダウンメニューをクリックして、他の値を選択します（例: **Native click event** だった場合は、**Non-native click event** を選択します）。
* **Before/After hooks** セクションで、必要に応じて設定を変更します。詳細については、[Before & after hooks](/docs/configuration-file-run-hooks) を参照してください。

4. 戻る矢印をクリックして、**Edit Configuration** 設定を閉じます。

![Edit Configuration 画面から戻る矢印を押してテストエディターに戻る操作画面](/images/test-management/shared-configuration/8e94901-Testim_600a_r.png)

5. **Save** をクリックします。

![テストエディターで構成変更後に Save ボタンをクリックする画面](/images/test-management/shared-configuration/d7f9a8b-Testim_594b.png)

**Change Message** ウィンドウが開きます。

![Change Message ウィンドウで今回の変更内容を Message 欄に入力する画面](/images/test-management/shared-configuration/990d848-Testim_601_r.png)

6. **Message** フィールドに、必要に応じて、このバージョンで行われた変更の説明を入力します。
7. **OK** をクリックします。\
   テストが保存されます。**Configuration** 設定の **Name** フィールドに名前を入力した場合、構成は **Configuration Library** に一覧表示されます。
