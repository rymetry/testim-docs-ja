# Visual Validation (element, viewport, full-page)

Validate visual details down to the pixel level

The visual validation and wait-for steps allow you to compare visual differences between your baseline and your current test run with precision. This functionality is provided as a service by [Applitools](https://applitools.com/), and requires integration with their Applitools Eyes app.

Before you begin, you first need to integrate the [Applitools Eyes](https://applitools.com/) app with Testim. For more information see [Applitools integration](https://help.testim.io/docs/applitools-integration).\
For more information, see the following resources:

* [https://applitools.com/docs/topics/test-manager/viewers/tm-baseline-viewer.html](https://applitools.com/docs/topics/test-manager/viewers/tm-baseline-viewer.html)
* [https://applitools.com/docs/topics/test-manager/viewers/tm-compare-baselines-viewer.html](https://applitools.com/docs/topics/test-manager/viewers/tm-compare-baselines-viewer.html)
* [https://applitools.com/docs/topics/test-manager/viewers/tm-compare-baselines-editor.html](https://applitools.com/docs/topics/test-manager/viewers/tm-compare-baselines-editor.html)

> 📘
>
> The RCA and Ultrafast Test Cloud (i.e. adding extra environments) features will be rejected by Applitools without appropriate licensing. Contact your Applitools representative for more information.

> 📘 This is a PRO feature
>
> This feature is only open to projects on our professional plan. To learn more about our professional plan, click [here](https://www.testim.io/pricing/).

You can perform the following visual validations:

* **Validate Element Visualization step** –  compares visual differences of a specific element between your baseline and your current test run. See - [Validate Element Visualization](https://help.testim.io/docs/validate-element-visualization)
* **Wait For Element Visualization step** - forces your test to pause and wait for the element to be visible on the page and then validates the element on a visual level. See - [Wait For Element Visualization](https://help.testim.io/docs/wait-for-element-visualization)
* **Viewport Visualization step** – compares the visual difference between your baseline and your current test run of your viewport. See - [Validate Viewport Visualization](https://help.testim.io/docs/validate-viewport-visualization)
* **Full-page Visualization step** – compares the visual difference between your baseline and your current test run of your full page. See - [Validate Full-page Visualization](https://help.testim.io/docs/validate-full-page-visualization)

> 📘
>
> If you change the configuration of your test, a new baseline will be created in Applitools but not in Testim. If you want a new baseline for each configuration, you need to create different tests for each one.

## Visual Validation Parameters

There are four visual validation parameters that you can modify within Testim:

* **Add Environment** – add one or more simulated environment configurations (including advanced environments) for your test to run on. This feature requires additional Applitools licensing for Ultrafast Test Cloud. Environments added on accounts without this feature license will be rejected by Applitools.
* **Match level** – Sometimes you will want to change the comparison method between your baseline and your test, especially when dealing with applications that consist of dynamic content. Testim supports the following Applitools Eyes match levels: Exact, Strict (default), Content, and Layout. For more information about these levels, see [Match Levels](https://applitools.com/docs/common/cmn-eyes-match-levels.html). In addition to editing the Match Level in Testim, in Applitools Eyes, you can mark a region of your element, viewport, or page, and define it with a different match level.
* **Enable RCA** – The Enable RCA (Root Cause Analysis) feature enables root cause analysis insights into the causes of visual mismatches. The system gathers information from the DOM in order to understand why there was a mismatch. The results can be viewed in Applitools Eyes. This feature requires additional Applitools licensing. RCA enabling in projects with accounts that don’t have this feature license will be rejected by Applitools.
* **Ignore displacement diffs** – Sometimes an element on a page shifts to a new location, but doesn’t change in any other way. The Ignore displacement diffs feature enables the system to ignore visual differences caused by this type of displacement. When implementing this feature, it is recommended to enable the feature on the step level and not on the configuration/test level.

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
        For more information on test configuration, see [Create a shared configuration](https://help.testim.io/docs/shared-configuration#section-create-a-shared-configuration). For more information about the CLI, see [Command line interface: Test Config](https://help.testim.io/docs/the-command-line-cli#section-test-config). For more information about the Scheduler, see [Scheduler](https://help.testim.io/docs/scheduler).
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

      <td />
    </tr>

    <tr>
      <td>
        Step level
      </td>

      <td>
        Applies to the test level and will override test-level visual validation parameters.
      </td>

      <td />
    </tr>
  </tbody>
</Table>

### Modifying visual validation settings in the test Configuration

:fa-arrow-right: **To modify visual validation settings in the test Configuration:**

1. In the left menu, navigate to **Runs > Configuration List**.

![](https://files.readme.io/212dd99-Testim_502b.png "Testim 502b.png")

The **Configuration Library** is shown.

2. Click the **+ Create New** button.

![](https://files.readme.io/3e415da-Testim_503a.png "Testim 503a.png")

3. Enter the basic configuration, as described in [Configuration List](https://help.testim.io/docs/shared-configuration#creating-and-modifying-test-configurations-in-the-configuration-library)
4. Click **Advanced** and enter advanced settings as explained in [Test Configuration](https://help.testim.io/docs/how-to-record-a-test#section-test-configuration-parameters).\
   The advanced configuration options are shown.

![](https://files.readme.io/938763b-Testim_602_r.png "Testim 602_r.png")

5. In the **Visual validation** section, click **Add Environment** and enter the desired environment settings
6. In the **Visual validation** section, modify the settings as follows:
   * **Match Level**- click the down arrow and choose one of the following Applitools Eyes options: *Exact*, *Strict*, *Content*, or *Layout*.
   * **Concurrency** - specify the maximum number of Eyes test that can be executed concurrently.
   * **Enable RCA** - the Enable RCA (Root Cause Analysis) feature enables root cause analysis insights into the causes of visual mismatches.
   * **Ignore displacement diffs** - enables the system to ignore visual differences caused by this type of displacement.
   * **Visual validation timeout** - modifies the time lapse (in milliseconds) which causes the test to register a fail for visual validation steps.
7. Click **Add**.\
   The configuration is created and added to the **Configuration Library**.

### Modifying test-level visual validation settings in the Editor

:fa-arrow-right: **To modify test-level visual validation settings in the Editor:**

1. Hover over the test’s setup step, and click the **Show Properties** (:fa-cog:) icon.

![](https://files.readme.io/3ee33fb-Testim_488a.png "Testim 488a.png")

The **Properties** panel opens on the right-hand side.

2. Click the **Edit Configuration** icon.

![](https://files.readme.io/b448b7a-Testim_489a_r.png "Testim 489a_r.png")

3. Under **Visual Validation** settings, click **Add Environment** and enter the desired environment settings.

![](https://files.readme.io/f26de2d-Testim_607a_r.png "Testim 607a_r.png")

4. In the **Visual validation** section, modify the settings as follows:
   * **Match Level**- click the down arrow and choose one of the following Applitools Eyes options: *Exact*, *Strict*, *Content*, or *Layout*.
   * **Concurrency** - specify the maximum number of Eyes test that can be executed concurrently.
   * **Enable RCA** - the Enable RCA (Root Cause Analysis) feature enables root cause analysis insights into the causes of visual mismatches.
   * **Ignore displacement diffs** - enables the system to ignore visual differences caused by this type of displacement.
   * **Visual validation timeout** - modifies the time lapse (in milliseconds) which causes the test to register a fail for visual validation steps.

### Modifying step-level visual validation settings

:fa-arrow-right: **To access step-level visual validation settings:**

1. Hover over the visual validation step for which you want to modify the settings, and click the **Show Properties** (:fa-cog:) icon.

![](https://files.readme.io/9ffa82b-Testim_493a.png "Testim 493a.png")

The **Properties** panel opens on the right-hand side.

2. Toggle the **Override test settings** switch to the right.

![](https://files.readme.io/cf1ef6d-Testim_608a_r.png "Testim 608a_r.png")

The **Override test settings** options are shown.

![](https://files.readme.io/36df0aa-Testim_609_r.png "Testim 609_r.png")

3. In the **Override test settings** section, click **Add Environment** and enter the desired environment settings.
4. In the **Override test settings** section, modify the remaining settings as follows:
   * **Match Level**- click the down arrow and choose one of the following Applitools Eyes options: *Exact*, *Strict*, *Content*, or *Layout*.
   * **Concurrency** - specify the maximum number of Eyes test that can be executed concurrently.
   * **Enable RCA** - the Enable RCA (Root Cause Analysis) feature enables root cause analysis insights into the causes of visual mismatches.
   * **Ignore displacement diffs** - enables the system to ignore visual differences caused by this type of displacement.

The visual validation parameters are modified for this step, and will override any test-level visual validation parameters currently set.