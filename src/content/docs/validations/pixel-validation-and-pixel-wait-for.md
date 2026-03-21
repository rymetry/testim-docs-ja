---
title: ビジュアル検証（要素・ビューポート・全ページ）
description: ピクセルレベルでの画像比較による検証ステップ。スクリーンショットを比較して UI の見た目を検証し、レイアウト崩れやデザイン変更を検出します。
category: 高度な編集
order: 5014
updated: '2025-09-19'
sourceUrl: 'https://help.testim.io/docs/pixel-validation-and-pixel-wait-for'
keywords:
  - ピクセル検証
  - ビジュアル検証
  - 画像比較
  - スクリーンショット
  - UI 検証
  - レイアウト
  - 見た目検証
  - Testim
  - ピクセル比較
  - ビジュアルテスト
---

ピクセルレベルでビジュアル差分を検証する

ビジュアル検証／待機ステップでは、ベースラインと現在の実行結果の視覚的差分を精度高く比較できます。本機能は [Applitools](https://applitools.com/) のサービスを利用しており、Applitools Eyes との連携が必要です。

開始前に、[Applitools Eyes](https://applitools.com/) と Testim を連携してください。詳しくは [Applitools integration](/docs/applitools-integration) を参照。\
関連情報：

- [https://applitools.com/docs/test-manager/viewers/tm-baseline-viewer.html](https://applitools.com/docs/test-manager/viewers/tm-baseline-viewer.html)
- [https://applitools.com/docs/test-manager/viewers/tm-compare-baselines-viewer.html](https://applitools.com/docs/test-manager/viewers/tm-compare-baselines-viewer.html)
- [https://applitools.com/docs/test-manager/viewers/tm-compare-baselines-editor.html](https://applitools.com/docs/test-manager/viewers/tm-compare-baselines-editor.html)

:::note
RCA や Ultrafast Test Cloud（追加環境）は適切なライセンスがないと Applitools 側で拒否されます。詳細は Applitools 担当者にお問い合わせください。
:::

:::note
これは Professional plan の機能です。
:::

次のビジュアル検証を実行できます：

- **Validate Element Visualization** — 特定要素の視覚差分を比較。参照 - [Validate Element Visualization](/docs/validate-element-visualization)
- **Wait For Element Visualization** — 要素が可視になるまで待機し、その後視覚的に検証。参照 - [Wait For Element Visualization](/docs/wait-for-element-visualization)
- **Viewport Visualization** — ビューポートの視覚差分を比較。参照 - [Validate Viewport Visualization](/docs/validate-viewport-visualization)
- **Full-page Visualization** — ページ全体の視覚差分を比較。参照 - [Validate Full-page Visualization](/docs/validate-full-page-visualization)

:::info
テスト構成を変更すると Applitools 側では新しいベースラインが作られますが、Testim 側のベースラインは変わりません。構成ごとにベースラインを分けたい場合はテストを分けて作成してください。
:::

## ビジュアル検証パラメーター

Testim 内で変更できるビジュアル検証パラメーターは 4 つあります：

- **Add Environment** – テストを実行する 1 つ以上のシミュレートされた環境設定（高度な環境を含む）を追加します。この機能には Ultrafast Test Cloud 用の追加 Applitools ライセンスが必要です。この機能ライセンスのないアカウントで追加された環境は Applitools によって拒否されます。
- **Match level** – ベースラインとテスト間の比較方法を変更したい場合があります。特に動的コンテンツを含むアプリケーションを扱う際に有用です。Testim は次の Applitools Eyes マッチレベルをサポートしています：Exact、Strict（デフォルト）、Content、Layout。これらのレベルの詳細については [Match Levels](https://applitools.com/docs/cmn-eyes-match-levels.html) を参照してください。Testim でマッチレベルを編集するだけでなく、Applitools Eyes で要素、ビューポート、またはページの領域をマークし、異なるマッチレベルを定義することもできます。
- **Enable RCA** – Enable RCA（Root Cause Analysis）機能は、ビジュアル差異の原因に関する根本原因分析の洞察を提供します。システムは DOM から情報を収集し、なぜ差異が生じたかを理解します。結果は Applitools Eyes で確認できます。この機能には追加の Applitools ライセンスが必要です。この機能ライセンスを持たないアカウントのプロジェクトで RCA を有効にすると、Applitools によって拒否されます。
- **Ignore displacement diffs** – ページ上の要素が新しい位置に移動しても、他の点では変化しない場合があります。Ignore displacement diffs 機能は、このタイプの位置移動によって引き起こされるビジュアル差異を無視するようシステムを設定します。この機能を実装する際は、構成／テストレベルではなくステップレベルで有効にすることをお勧めします。

これらのビジュアル検証パラメーターは次の場所で変更できます：

<table class="md-table md-table-3cols">
 <thead>
  <tr>
   <th>
    変更場所
   </th>
   <th>
    適用対象
   </th>
   <th>
    追加情報
   </th>
  </tr>
 </thead>
 <tbody>
  <tr>
   <td>
    Configuration Library
   </td>
   <td>
    その設定が指定されたテスト内のすべてのビジュアル検証ステップ（CLI や Scheduler 経由で実行されるテストを含む）
   </td>
   <td>
    テスト設定の詳細は
    <a href="/docs/shared-configuration">
     Create a shared configuration
    </a>
    を参照。CLI の詳細は
    <a href="/docs/the-command-line-cli">
     Command line interface: Test Config
    </a>
    を参照。Scheduler の詳細は
    <a href="/docs/scheduler">
     Scheduler
    </a>
    を参照。
   </td>
  </tr>
  <tr>
   <td>
    テストエディター内のセットアップステップ
   </td>
   <td>
    テスト内の各ステップに適用。ただし次の場合を除く：
    <br/>
    • テストが異なる設定で CLI またはスケジューラから実行される場合、または
    <br/>
    • ステップレベルでビジュアル検証パラメーターがオーバーライドされている特定ステップの場合。
   </td>
   <td>
   </td>
  </tr>
  <tr>
   <td>
    ステップレベル
   </td>
   <td>
    テストレベルに適用され、テストレベルのビジュアル検証パラメーターを上書きします。
   </td>
   <td>
   </td>
  </tr>
 </tbody>
</table>

### テスト設定でビジュアル検証設定を変更する

**テスト設定でビジュアル検証設定を変更するには：**

1. 左メニューで **Runs > Configuration List** に移動します。

![左メニューの Runs > Configuration List へのナビゲーション](/images/validations/pixel-validation-and-pixel-wait-for/212dd99-Testim_502b.png)

**Configuration Library** が表示されます。

2. **+ Create New** ボタンをクリックします。

![Configuration Library の+ Create New ボタン](/images/validations/pixel-validation-and-pixel-wait-for/3e415da-Testim_503a.png)

3. [Configuration List](/docs/shared-configuration#creating-and-modifying-test-configurations-in-the-configuration-library) に記載されている基本設定を入力します。
4. **Advanced** をクリックし、[Test Configuration](/docs/how-to-record-a-test) に説明されている詳細設定を入力します。\
   詳細設定が表示されます。

![Visual validation の詳細設定画面](/images/validations/pixel-validation-and-pixel-wait-for/938763b-Testim_602_r.png)

5. **Visual validation** セクションで **Add Environment** をクリックし、希望する環境設定を入力します。
6. **Visual validation** セクションで次のように設定を変更します：
   - **Match Level** - 下矢印をクリックし、次の Applitools Eyes オプションから選択します：_Exact_、_Strict_、_Content_、または _Layout_。
   - **Concurrency** - 同時実行可能な Eyes テストの最大数を指定します。
   - **Enable RCA** - Enable RCA（Root Cause Analysis）機能は、ビジュアル差異の原因に関する根本原因分析の洞察を提供します。
   - **Ignore displacement diffs** - このタイプの位置移動によるビジュアル差異を無視するようシステムを設定します。
   - **Visual validation timeout** - ビジュアル検証ステップが失敗と判定されるまでの時間（ミリ秒）を変更します。
7. **Add** をクリックします。\
   構成が作成され **Configuration Library** に追加されます。

### エディターでテストレベルのビジュアル検証設定を変更する

**エディターでテストレベルのビジュアル検証設定を変更するには：**

1. テストのセットアップステップにカーソルを合わせ、**Show Properties** アイコンをクリックします。

![テストのセットアップステップの Show Properties アイコン](/images/validations/pixel-validation-and-pixel-wait-for/3ee33fb-Testim_488a.png)

右側に **Properties** パネルが表示されます。

2. **Edit Configuration** アイコンをクリックします。

![Properties パネルの Edit Configuration アイコン](/images/validations/pixel-validation-and-pixel-wait-for/b448b7a-Testim_489a_r.png)

3. **Visual Validation** 設定の下で **Add Environment** をクリックし、希望する環境設定を入力します。

![Visual Validation 設定の Add Environment](/images/validations/pixel-validation-and-pixel-wait-for/f26de2d-Testim_607a_r.png)

4. **Visual validation** セクションで次のように設定を変更します：
   - **Match Level** - 下矢印をクリックし、次の Applitools Eyes オプションから選択します：_Exact_、_Strict_、_Content_、または _Layout_。
   - **Concurrency** - 同時実行可能な Eyes テストの最大数を指定します。
   - **Enable RCA** - Enable RCA（Root Cause Analysis）機能は、ビジュアル差異の原因に関する根本原因分析の洞察を提供します。
   - **Ignore displacement diffs** - このタイプの位置移動によるビジュアル差異を無視するようシステムを設定します。
   - **Visual validation timeout** - ビジュアル検証ステップが失敗と判定されるまでの時間（ミリ秒）を変更します。

### ステップレベルのビジュアル検証設定を変更する

**ステップレベルのビジュアル検証設定にアクセスするには：**

1. 設定を変更したいビジュアル検証ステップにカーソルを合わせ、**Show Properties** アイコンをクリックします。

![ビジュアル検証ステップの Show Properties アイコン](/images/validations/pixel-validation-and-pixel-wait-for/9ffa82b-Testim_493a.png)

右側に **Properties** パネルが表示されます。

2. **Override test settings** スイッチを右に切り替えます。

![Properties パネルの Override test settings スイッチ](/images/validations/pixel-validation-and-pixel-wait-for/cf1ef6d-Testim_608a_r.png)

**Override test settings** オプションが表示されます。

![Override test settings オプション画面](/images/validations/pixel-validation-and-pixel-wait-for/36df0aa-Testim_609_r.png)

3. **Override test settings** セクションで **Add Environment** をクリックし、希望する環境設定を入力します。
4. **Override test settings** セクションで残りの設定を次のように変更します：
   - **Match Level** - 下矢印をクリックし、次の Applitools Eyes オプションから選択します：_Exact_、_Strict_、_Content_、または _Layout_。
   - **Concurrency** - 同時実行可能な Eyes テストの最大数を指定します。
   - **Enable RCA** - Enable RCA（Root Cause Analysis）機能は、ビジュアル差異の原因に関する根本原因分析の洞察を提供します。
   - **Ignore displacement diffs** - このタイプの位置移動によるビジュアル差異を無視するようシステムを設定します。

このステップのビジュアル検証パラメーターが変更され、現在設定されているテストレベルのビジュアル検証パラメーターを上書きします。
