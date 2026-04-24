---
title: フック（Hooks）
description: >-
  テストやステップの前後に共有ステップ／共有グループを実行するフック（Before/After test、Before/After each step
  など）の設定方法と代表的なユースケースを説明します。
category: 高度な編集
order: 5056
updated: '2025-09-23'
sourceUrl: 'https://docs.tricentis.com/testim/content/advanced-editing/hooks.htm'
keywords:
  - フック
  - Before test
  - After test
  - Before each step
  - After each step
  - Test Configuration
  - Config file
  - 実行フック
  - 前処理
  - 後処理
---

フックは、各ステップの前後やテストの前後に、既存の[共有ステップ](/docs/editing-tests/shareable-steps)や[共有グループ](/docs/editing-tests/groups)を実行する仕組みです。設定後は通常どおりテストを実行でき、フックは他のステップ同様に実行されます。実行後、結果の可視化も可能です。

## よくある用途

### Before test の例

テスト開始前に特定の処理を実行します。

- 変数の初期化: 各テストで使用する変数を事前に初期化する処理。
- テスト環境の準備: DB 接続の確立、必要なディレクトリの作成、サーバー起動など、テスト実行前に環境を整える処理。
- 前のテストのクリーンアップ: 前回テストの残骸を削除し、毎回クリーンな状態からテストを開始するための処理。
- 複数テストで共通のセットアップ: 複数テストで共通して必要な前処理をまとめ、重複したロジックを減らすための処理。

### After test の例

テスト終了後に特定の処理を実行します。

- テスト環境のクリーンアップ: DB 接続のクローズ、一時ファイルの削除、サーバー停止など、テスト後のクリーンアップ処理。
- 結果の検証: ファイル内容や DB の状態を確認するなど、テスト結果が期待どおりか追加で検証する処理。
- 元の状態への復元: 次のテストをクリーンな状態で開始できるよう、環境を元の状態に戻す処理。
- 複数テストで共通の後処理: 複数テストで共通して必要なクリーンアップ処理をまとめ、重複したロジックを減らすための処理。

### Before/After each step の例

Before/After each step フックは、テスト内の「各ステップの直前・直後」にロジックを挿入したい場合に使用します。

- デバッグ用途: 各ステップの前後でログを出力し、アプリケーションの状態やパラメーターの値を確認する。
- 中間結果の検証: ステップ実行後に変数の値などをチェックし、中間状態が期待どおりか検証する。
- ステップ間で共有するセットアップ: 複数ステップで共通して必要な前処理をまとめ、重複したロジックを減らす。
- 進捗のモニタリング: 各ステップの結果を計測・記録し、テストの進行状況を監視する。

:::note
関連ステップが条件でスキップされる設定でも、Before/After step フックは実行されます。
:::

## Before/After フックの作成 {#creating-before-after-hooks}

フックはテスト設定の構成（Test Configuration）と／または設定ファイル（Config File）で作成します。新規／既存の構成で設定可能な方法:

- プロパティパネルから作成 — テスト内で選択した構成を編集
- 構成リストから作成 — 構成一覧画面で新規作成／編集し、対象テストに適用
- 既定構成から作成 — テストのデフォルト構成を編集（既存編集／新規作成）

:::note
フックのコピー／切り取り＆貼り付けはできません。
:::

上記の 3 つの方法（プロパティパネル／構成リスト／既定構成）から、どの種類のフックを設定できるかを表にまとめると次のとおりです。

<table class="md-table md-table-4cols">
 <thead>
  <tr>
   <th style="text-align: left;">
    Hook の種類
   </th>
   <th style="text-align: left;">
    Test Configuration
   </th>
   <th style="text-align: left;">
    Config File
   </th>
   <th style="text-align: left;">
    コメント
   </th>
  </tr>
 </thead>
 <tbody>
  <tr>
   <td style="text-align: left;">
    Before each step
   </td>
   <td style="text-align: left;">
    V
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    After each step
   </td>
   <td style="text-align: left;">
    V
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    Before test
   </td>
   <td style="text-align: left;">
    V
   </td>
   <td style="text-align: left;">
    V
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    After test
   </td>
   <td style="text-align: left;">
    V
   </td>
   <td style="text-align: left;">
    V
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    Before suite
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
    V
   </td>
   <td style="text-align: left;">
    エディター画面には表示されません
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    After suite
   </td>
   <td style="text-align: left;">
   </td>
   <td style="text-align: left;">
    V
   </td>
   <td style="text-align: left;">
    エディター画面には表示されません
   </td>
  </tr>
 </tbody>
</table>

## テスト構成からフックを作成する {#creating-hooks-via-the-test-configuration}

Test Configuration Hooks は、プロパティパネル／構成リスト画面／テストの既定構成から作成できます。

### プロパティパネルからフックを作成する {#creating-hooks-via-the-properties-panel}

テストの**プロパティパネル**から作成できるフック:

- **Before test handler** – テスト実行前に実行されるフック
- **Before each step handler** – テスト内の各ステップ実行前に実行されるフック
- **After each step handler** – 各ステップ実行後に実行されるフック
- **After test handler** – テスト実行後に実行されるフック

**プロパティパネルからフックを作成する手順:**

1. 対象テストを開き、**Show Test Properties** ボタンをクリックします。

![フック設定のスクリーンショット](/images/advanced-features/hooks/8c42f76-2023-01-03_14-15-34.png)

2. **Properties** パネルの **Configuration** セクションで **Edit** ボタンをクリックします。

![フック設定のスクリーンショット](/images/advanced-features/hooks/c4e3ae5-2023-01-03_14-33-45.png)

**Edit Configuration** ペインが表示されます。

3. **Before/After Hooks** セクションで作成したいフックタイプにチェックを入れます。  
   例:
   _Before test handler – テスト前に実行  
   _ Before each step handler – 各ステップ前に実行  
   _After each step handler – 各ステップ後に実行  
   _ After test handler – テスト後に実行

![フック設定のスクリーンショット](/images/advanced-features/hooks/b9e4709-2023-01-03_14-51-20.png)

4. ドロップダウンから、フックとして実行したい共有ステップまたは共有グループを選択します。

![フック設定のスクリーンショット](/images/advanced-features/hooks/bd656ae-2023-01-03_14-58-41.png)

5. **After each step handler** または **After test handler** を選択した場合、**Run on** オプションで実行条件を選びます。
- **Always** – 常に実行
- **Success** – ステップ／テストが成功した場合のみ実行
- **Failure** – ステップ／テストが失敗した場合のみ実行

![フック設定のスクリーンショット](/images/advanced-features/hooks/7e42513-2023-01-04_14-36-47small.png)

6. **Save** をクリックしてテストを保存します。  
   これで、選択したテストにフックが追加されます。

![フック設定のスクリーンショット](/images/advanced-features/hooks/603e29d-propertiespanel.gif)

### Configuration List 画面からフックを作成する {#creating-hooks-via-the-configuration-list-screen}

**Configuration List** 画面からは、次のフックを作成できます。

- Before test handler – テスト前に実行
- Before each step handler – 各ステップ前に実行
- After each step handler – 各ステップ後に実行
- After test handler – テスト後に実行

**Configuration List からフックを作成するには:**

1. メニューから **Runs > Configuration List** を開きます。
2. **Create New** をクリックします。

![フック設定のスクリーンショット](/images/advanced-features/hooks/fea2a3f-2023-01-03_15-30-30.png)

3. **Add New Configuration** 画面で **Advanced** をクリックします。

![フック設定のスクリーンショット](/images/advanced-features/hooks/50907d5-2023-01-03_15-48-32.png)

4. **Before/After Hooks** セクションで作成したいフックタイプにチェックを入れます。
- Before test handler – テスト前に実行
- Before each step handler – 各ステップ前に実行
- After each step handler – 各ステップ後に実行
- After test handler – テスト後に実行

![フック設定のスクリーンショット](/images/advanced-features/hooks/b5ea260-2023-01-03_15-49-37.png)

5. ドロップダウンから、フックとして実行したい共有ステップまたは共有グループを選択します。
6. **After each step handler** または **After test handler** を選択した場合、**Run on** で実行条件を選びます。
- **Always** – 常に実行
- **Success** – ステップ／テストが成功した場合のみ実行
- **Failure** – ステップ／テストが失敗した場合のみ実行
7. **Add** をクリックします。  
   これで、作成したフック構成が関連テストで利用可能になります。

![フック設定のスクリーンショット](/images/advanced-features/hooks/0cbe19a-configlist.gif)

### Default Configuration 設定からフックを作成する {#creating-hooks-via-the-default-configuration-setting}

**Default Configuration からフックを作成するには:**

1. テストの **Default Configuration** 設定で **Edit** ボタンをクリックします。

![フック設定のスクリーンショット](/images/advanced-features/hooks/54cf195-2023-01-04_13-02-27.png)

2. 新しい構成を作成するには、ドロップダウン内の新規作成オプションを選びます。このオプションは画面上で「カスタム」（新規作成）の項目として表示されます。

![フック設定のスクリーンショット](/images/advanced-features/hooks/c6f2e2e-2023-01-04_13-05-48.png)

**Change Default Configuration** ダイアログが表示されます。

3. **Before/After Hooks** セクションで作成したいフックタイプにチェックを入れます。

- Before test handler – テスト前に実行
- Before each step handler – 各ステップ前に実行
- After each step handler – 各ステップ後に実行
- After test handler – テスト後に実行

![フック設定のスクリーンショット](/images/advanced-features/hooks/4bfbda7-2023-01-04_13-29-01.png)

4. ドロップダウンから、フックとして実行したい共有ステップまたは共有グループを選択します。
5. **After each step handler** または **After test handler** を選択した場合、**Run on** で次のいずれかを選びます。
- Always – 常に実行
- Success – ステップ／テストが成功した場合のみ実行
- Failure – ステップ／テストが失敗した場合のみ実行
6. **Change** をクリックして保存します。  
   これで、そのテストは新しいデフォルト構成（フック設定を含む）を使用するようになります。

![フック設定のスクリーンショット](/images/advanced-features/hooks/c475584-defaultconfig.gif)

## Test Configuration Hooks の実行パラメーター {#test-configuration-hooks-run-parameters}

一部の Test Configuration Hooks には、テスト実行時の情報を取得するための追加パラメーターが用意されています。これらはステップ／テスト側から参照できるため、カスタムステップ内でログ出力やカスタム検証に利用できます。

- **After each step handler parameters** – After each step フックで利用できるオブジェクトとパラメーター:
- `_stepData`
- `testName` – テスト名
- `name` – ステップ名
- `_stepInternalData`
- `hookType` – フック種別（例: `afterStep`）
- `path` – ステップの URL
- `stepId` – ステップ ID
- `projectId` – プロジェクト ID
- `branch` – ブランチ名
- `testId` – テスト ID
- `testResultId` – テスト結果 ID
- `type` – ステップ種別（例: `action-code-step`）
- `failureReason` – 失敗理由（失敗時）
- `errorType` – エラータイプ（エラーがある場合）

- **After test handler parameters** – After test フックで利用できるオブジェクトとパラメーター:
- `_stepData`
- `testName` – テスト名
- `_stepInternalData`
- `hookType` – フック種別（例: `afterTest`）
- `projectId` – プロジェクト ID
- `branch` – ブランチ名
- `testId` – テスト ID
- `testResultId` – テスト結果 ID
- `failureReason` – 失敗理由（失敗時）
- `errorType` – エラータイプ（エラーがある場合）

## Config File でフックを作成する {#creating-hooks-via-the-config-file}

Config File は、テスト／テストスイートの実行に必要なパラメーターと run hooks を定義する CommonJS 形式のファイルです。バックエンドのセットアップや、単一テスト／すべてのテストの前後で実行したい処理をまとめて定義できます。Config File で設定できるフックタイプは次のとおりです。

- **Before test** – テスト実行前に実行
- **After test** – テスト実行後に実行
- **Before Suite** – スイート実行前に実行
- **After Suite** – スイート実行後に実行

Config File 経由での Before/After フック設定の詳細手順は、以下のガイドを参照してください。Config file の概要: [Configuration File (Run Hooks)](/docs/running-tests/configuration-file-run-hooks)。フック経由で Config file パラメーターを追加する方法: [設定ファイルでの定義](/docs/advanced-editing/parameters/configuration-file-parameters#defining-parameters-in-a-configuration-file)

## フックの可視化（Hooks Visualizations）

Hooks を含むテストを実行すると、エディター上でさまざまなビジュアル表示が行われます。

:::note
Turbo Mode でテストを実行している場合、不要なデータ保存を避けるためフックの表示は制限されます。Turbo Mode では、フックが可視化されるのは失敗した実行のみです。
:::

## Before/After each step フックの可視化 {#viewing-before-after-each-step-hooks}

Before/After each step フックが設定されているステップには、実行後にステップ上へ「Hook」ボタンが表示されます（ステップにカーソルを合わせたときに表示）。

![フック設定のスクリーンショット](/images/advanced-features/hooks/1946c2e-2023-01-08_19-27-53.png)

Hook ボタンをクリックすると、そのステップに紐づいている共有ステップ／共有グループが展開され、フックとして実行されたステップが前後に表示されます。

![フック設定のスクリーンショット](/images/advanced-features/hooks/da1ff7a-2023-01-09_14-42-53.png)

:::note
再度 Hook ボタンをクリックすると、フック表示を閉じることができます。
:::

複数のステップに対してフックをまとめて確認したい場合は、対象ステップを複数選択し、エディターツールバーの **Hook** ボタンをクリックします。

![フック設定のスクリーンショット](/images/advanced-features/hooks/a8cac90-2023-01-10_11-58-24.png)

フックとして設定されているステップが共有グループの場合、そのステップをダブルクリックすると共有グループの中身（内部ステップ）が表示されます。

![フック設定のスクリーンショット](/images/advanced-features/hooks/4be982c-2023-01-09_16-20-49.png)

:::note
共有グループをフックとして使用している場合、Before/After each step フックはグループ単位ではなく「グループ内部のステップ」に対して表示されます。
:::

テストステップとフックステップの関係は、円と点線の矢印で示されます。これにより、どのフックがどのステップの前後に実行されたかが視覚的に分かります。

![フック設定のスクリーンショット](/images/advanced-features/hooks/fde7478-hooks_with_callouts.png)

フックステップ自体は、フックアイコン付きのグレーのボックスとして表示され、通常のステップより太い枠線で区別されます。共有ステップと同様に、フックステップをダブルクリックすることで詳細を確認できます。右上の数字は、その共有ステップを利用しているテスト数を示します（フックは共有ステップとして管理されています）。

:::note
フックステップ自体はビュー専用で、直接編集することはできません。ただし、通常の共有ステップと同様に、別のテストに追加してから編集することは可能です。
:::

:::note
Hook ステップの **View Screenshot** をクリックしてサイドバイサイド表示を見る場合、Baseline（基準画像）は表示されず、結果側のみが表示されます。
:::

## Before/After test フックの可視化 {#viewing-before-after-test-hooks}

Before/After test フックはテストごとに 1 回、テストの開始前／終了後に実行されます。実行後、最初のステップ（Setup ステップ）にカーソルを合わせると「Hook」ボタンが表示されます。

![フック設定のスクリーンショット](/images/advanced-features/hooks/26263ab-2023-01-09_14-19-57.png)

Hook ボタンをクリックすると、テスト前後に実行された共有ステップ／共有グループが Setup ステップの前後に展開されます。

![フック設定のスクリーンショット](/images/advanced-features/hooks/fefda67-2023-01-09_14-42-53.png)

テスト本体のステップと Before/After test フックの関係は、円と点線の矢印で示されます。

![フック設定のスクリーンショット](/images/advanced-features/hooks/2be214f-hookscallouts2.png)

フックステップは、フックアイコン付きのグレーのボックスとして太い枠線で表示されます。ダブルクリックすると詳細を確認でき、右上の数字はその共有ステップを使用しているテスト数を示します。Setup ステップの右側に矢印が表示されている場合は After test フックも存在し、矢印をクリックするとテスト末尾のフック表示に切り替わります。

:::note
フックステップ自体はその場で編集できませんが、別のテストに追加して共有ステップとして編集することは可能です。
:::

:::note
Hook ステップのスクリーンショットをサイドバイサイド表示した場合、Baseline 側は表示されず、結果側のみ表示されます。
:::

## 成功／失敗条件により実行されなかったフックの確認 {#viewing-hooks-that-did-not-run-due-to-success-failure-conditions}

フック作成時に、ステップ／グループが成功した場合のみ／失敗した場合のみ実行するように条件を設定できます。この条件により実行されなかったフックは、青いドットでマークされます。

![フック設定のスクリーンショット](/images/advanced-features/hooks/b8ecffe-2023-01-10_13-37-28.png)

実行されなかったフックステップには、青い「info」アイコンが付き、関連する接続矢印も青で表示されます。

![フック設定のスクリーンショット](/images/advanced-features/hooks/b53a405-2023-01-10_13-43-21.png)

マウスを info アイコンに乗せると、そのフックが実行されなかった理由（成功条件／失敗条件など）が表示されます。

![フック設定のスクリーンショット](/images/advanced-features/hooks/bd7554b-2023-01-10_13-46-41.png)

## フックに関連するエラーの確認 {#viewing-errors-related-to-hooks}

テスト実行後にエラーが発生した場合、そのエラーがフックステップに起因することがあります。フックステップでエラーが発生した場合、関連ステップの左側（before each step / before test のフックエラー）または右側（after each step / after test のフックエラー）に赤いドットが表示されます。

![フック設定のスクリーンショット](/images/advanced-features/hooks/2e6d6d0-2023-01-10_13-59-44.png)

Hook ボタンをクリックすると、該当するフックステップが表示されます。

![フック設定のスクリーンショット](/images/advanced-features/hooks/da8c532-2023-01-10_12-24-18.png)

グループ内にあるフックステップのエラーでも、1 クリックで直接そのエラー箇所まで辿ることができます。  
**エラー箇所を直接表示するには:**

1. **See Error** リンクをクリックします。

![フック設定のスクリーンショット](/images/advanced-features/hooks/4a6b5dd-2023-01-10_12-23-08.png)

エラーを含む共有グループ／共有ステップが表示され、その中で問題のあるステップがハイライトされます。

![フック設定のスクリーンショット](/images/advanced-features/hooks/9f90f12-2023-01-10_12-24-18.png)
