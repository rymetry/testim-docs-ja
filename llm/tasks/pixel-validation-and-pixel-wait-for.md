# 翻訳タスク (pixel-validation-and-pixel-wait-for)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

ピクセルレベルでビジュアル差分を検証する

ビジュアル検証／待機ステップでは、ベースラインと現在の実行結果の視覚的差分を精度高く比較できます。本機能は [Applitools](https://applitools.com/) のサービスを利用しており、Applitools Eyes との連携が必要です。

開始前に、[Applitools Eyes](https://applitools.com/) と Testim を連携してください。詳しくは [Applitools integration](/docs/applitools-integration/applitools-integration) を参照。\
関連情報：

- [https://applitools.com/docs/topics/test-manager/viewers/tm-baseline-viewer.html](https://applitools.com/docs/topics/test-manager/viewers/tm-baseline-viewer.html)
- [https://applitools.com/docs/topics/test-manager/viewers/tm-compare-baselines-viewer.html](https://applitools.com/docs/topics/test-manager/viewers/tm-compare-baselines-viewer.html)
- [https://applitools.com/docs/topics/test-manager/viewers/tm-compare-baselines-editor.html](https://applitools.com/docs/topics/test-manager/viewers/tm-compare-baselines-editor.html)

:::note
RCA や Ultrafast Test Cloud（追加環境）は適切なライセンスがないと Applitools 側で拒否されます。詳細は Applitools 担当者にお問い合わせください。
:::

:::note
これは Professional プランの機能です。詳しくは [pricing](https://www.testim.io/pricing/) を参照してください。
:::

次のビジュアル検証を実行できます：

- **Validate Element Visualization** — 特定要素の視覚差分を比較。参照 - [Validate Element Visualization](/docs/visual-validations/validate-element-visualization)
- **Wait For Element Visualization** — 要素が可視になるまで待機し、その後視覚的に検証。参照 - [Wait For Element Visualization](/docs/visual-validations/wait-for-element-visualization)
- **Viewport Visualization** — ビューポートの視覚差分を比較。参照 - [Validate Viewport Visualization](/docs/visual-validations/validate-viewport-visualization)
- **Full-page Visualization** — ページ全体の視覚差分を比較。参照 - [Validate Full-page Visualization](/docs/visual-validations/validate-full-page-visualization)

:::info
テスト構成を変更すると Applitools 側では新しいベースラインが作られますが、Testim 側のベースラインは変わりません。構成ごとにベースラインを分けたい場合はテストを分けて作成してください。
:::

## Visual Validation Parameters

There are four visual validation parameters that you can modify within Testim:

- **Add Environment** – add one or more simulated environment configurations (including advanced environments) for your test to run on. This feature requires additional Applitools licensing for Ultrafast Test Cloud. Environments added on accounts without this feature license will be rejected by Applitools.
- **Match level** – Sometimes you will want to change the comparison method between your baseline and your test, especially when dealing with applications that consist of dynamic content. Testim supports the following Applitools Eyes match levels: Exact, Strict (default), Content, and Layout. For more information about these levels, see [Match Levels](https://applitools.com/docs/common/cmn-eyes-match-levels.html). In addition to editing the Match Level in Testim, in Applitools Eyes, you can mark a region of your element, viewport, or page, and define it with a different match level.
- **Enable RCA** – The Enable RCA (Root Cause Analysis) feature enables root cause analysis insights into the causes of visual mismatches. The system gathers information from the DOM in order to understand why there was a mismatch. The results can be viewed in Applitools Eyes. This feature requires additional Applitools licensing. RCA enabling in projects with accounts that don’t have this feature license will be rejected by Applitools.
- **Ignore displacement diffs** – Sometimes an element on a page shifts to a new location, but doesn’t change in any other way. The Ignore displacement diffs feature enables the system to ignore visual differences caused by this type of displacement. When implementing this feature, it is recommended to enable the feature on the step level and not on the configuration/test level.

These visual validation parameters can be modified in the following places:

<Table align={["left","left","left"]}>
  <thead>
    <tr>
      <th>
        Modified in
      </th>

      <th>
        Applies to
      </th>

      <th>
        Additional information
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        Configuration Library
      </td>

      <td>
        Applies to all visual validation steps run in a test that is set with that configuration (including tests run via CLI or Scheduler).
      </td>

      <td>
        For more information on test configuration, see [Create a shared configuration](doc:shared-configuration#section-create-a-shared-configuration). For more information about the CLI, see [Command line interface: Test Config](doc:the-command-line-cli#section-test-config). For more information about the Scheduler, see [Scheduler](/docs/running-tests/scheduler).
      </td>
    </tr>

    <tr>
      <td>
        Setup Step in the Test Editor
      </td>

      <td>
        Applies to each step within the test unless:  

        * the test is run from the CLI or a scheduler with a different configuration, or  
        * the visual validation parameters are overridden on the step level for a specific step.
      </td>

      <td>

      </td>
    </tr>

    <tr>
      <td>
        Step level
      </td>

      <td>
        Applies to the test level and will override test-level visual validation parameters.
      </td>

      <td>

      </td>
    </tr>
  </tbody>
</Table>

### Modifying visual validation settings in the test Configuration

:fa-arrow-right: **To modify visual validation settings in the test Configuration:**

1. In the left menu, navigate to **Runs > Configuration List**.

![](/images/validations/pixel-validation-and-pixel-wait-for/212dd99-Testim_502b.png "Testim 502b.png")

The **Configuration Library** is shown.

2. Click the **+ Create New** button.

![](/images/validations/pixel-validation-and-pixel-wait-for/3e415da-Testim_503a.png "Testim 503a.png")

3. Enter the basic configuration, as described in [Configuration List](https://help.testim.io/docs/shared-configuration#creating-and-modifying-test-configurations-in-the-configuration-library)
4. Click **Advanced** and enter advanced settings as explained in [Test Configuration](https://help.testim.io/docs/how-to-record-a-test#section-test-configuration-parameters).\
   詳細設定が表示されます。

![](/images/validations/pixel-validation-and-pixel-wait-for/938763b-Testim_602_r.png "Testim 602_r.png")

5. In the **Visual validation** section, click **Add Environment** and enter the desired environment settings
6. In the **Visual validation** section, modify the settings as follows:
   - **Match Level**- click the down arrow and choose one of the following Applitools Eyes options: *Exact*, *Strict*, *Content*, or *Layout*.
   - **Concurrency** - specify the maximum number of Eyes test that can be executed concurrently.
   - **Enable RCA** - the Enable RCA (Root Cause Analysis) feature enables root cause analysis insights into the causes of visual mismatches.
   - **Ignore displacement diffs** - enables the system to ignore visual differences caused by this type of displacement.
   - **Visual validation timeout** - modifies the time lapse (in milliseconds) which causes the test to register a fail for visual validation steps.
7. Click **Add**.\
   構成が作成され **Configuration Library** に追加されます。

### Modifying test-level visual validation settings in the Editor

:fa-arrow-right: **To modify test-level visual validation settings in the Editor:**

1. Hover over the test’s setup step, and click the **Show Properties** (:fa-cog:) icon.

![](/images/validations/pixel-validation-and-pixel-wait-for/3ee33fb-Testim_488a.png "Testim 488a.png")

右側に **Properties** パネルが表示されます。

2. Click the **Edit Configuration** icon.

![](/images/validations/pixel-validation-and-pixel-wait-for/b448b7a-Testim_489a_r.png "Testim 489a_r.png")

3. Under **Visual Validation** settings, click **Add Environment** and enter the desired environment settings.

![](/images/validations/pixel-validation-and-pixel-wait-for/f26de2d-Testim_607a_r.png "Testim 607a_r.png")

4. In the **Visual validation** section, modify the settings as follows:
   - **Match Level**- click the down arrow and choose one of the following Applitools Eyes options: *Exact*, *Strict*, *Content*, or *Layout*.
   - **Concurrency** - specify the maximum number of Eyes test that can be executed concurrently.
   - **Enable RCA** - the Enable RCA (Root Cause Analysis) feature enables root cause analysis insights into the causes of visual mismatches.
   - **Ignore displacement diffs** - enables the system to ignore visual differences caused by this type of displacement.
   - **Visual validation timeout** - modifies the time lapse (in milliseconds) which causes the test to register a fail for visual validation steps.

### Modifying step-level visual validation settings

:fa-arrow-right: **To access step-level visual validation settings:**

1. Hover over the visual validation step for which you want to modify the settings, and click the **Show Properties** (:fa-cog:) icon.

![](/images/validations/pixel-validation-and-pixel-wait-for/9ffa82b-Testim_493a.png "Testim 493a.png")

右側に **Properties** パネルが表示されます。

2. Toggle the **Override test settings** switch to the right.

![](/images/validations/pixel-validation-and-pixel-wait-for/cf1ef6d-Testim_608a_r.png "Testim 608a_r.png")

The **Override test settings** options are shown.

![](/images/validations/pixel-validation-and-pixel-wait-for/36df0aa-Testim_609_r.png "Testim 609_r.png")

3. In the **Override test settings** section, click **Add Environment** and enter the desired environment settings.
4. In the **Override test settings** section, modify the remaining settings as follows:
   - **Match Level**- click the down arrow and choose one of the following Applitools Eyes options: *Exact*, *Strict*, *Content*, or *Layout*.
   - **Concurrency** - specify the maximum number of Eyes test that can be executed concurrently.
   - **Enable RCA** - the Enable RCA (Root Cause Analysis) feature enables root cause analysis insights into the causes of visual mismatches.
   - **Ignore displacement diffs** - enables the system to ignore visual differences caused by this type of displacement.

The visual validation parameters are modified for this step, and will override any test-level visual validation parameters currently set.
