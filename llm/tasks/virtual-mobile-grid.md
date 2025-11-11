# 翻訳タスク (virtual-mobile-grid)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

The Virtual Mobile Grid (VMG) enables testing across a wide variety of iOS simulators and Android emulators. Enjoy a cloud based grid which allows you to:

- Simplify connectivity and configuration and improve quality through the use of a range of available virtual devices.
- Scale testability through the use of parallel runs across different devices.

The Virtual Mobile Grid can be used to record tests as well as to run them. It is connected to your [Mobile Apps Library](/docs/test-management/mobile-apps).  This means that if the test that you are running uses a mobile app, this app needs to be added to the Mobile Apps Library before running the test on the Virtual Mobile Grid.  

The Virtual Mobile Grid does not require any special integration. It is included in the license for paying customers. However, for Community license, it is possible to enroll in a free trial as a Company Owner or Project Owner. Once the free trial is started, the Virtual Mobile Grid is immediately available under [Device Management](https://help.testim.io/docs/view-local-connected-mobile-devices).  During the free trial period, a variety of virtual devices (Android and iOS) will be available for you to use.

> 🚧 Test Compatibility
>
> Only iOS applications that were compiled to work with virtual devices can be executed on the "Virtual Mobile Grid".

> 📘 OS Compatibility
>
> Virtual mobile grid supports x86\_64 Android builds only.

## How to Start a Free Virtual Mobile Grid Trial

If you are using a Community license, as the Company Owner or Project Owner, you can start a free trial of Virtual Mobile Grid. The trial duration is 14 days. During the trial period you will be able to run a single execution at a time for all projects (iOS and Android). If you want to skip the free trial and move directly to the paid version, [contact us](https://www.testim.io/contact-us/).

:fa-arrow-right: **To start a free trial of Virtual Mobile Grid:**

1. Go to the **Device Management** screen and on the click the **Virtual Mobile Grid** tab, click **Start A Trial**.

![](/images/grid-management/virtual-mobile-grid/52a46cf-image.png)

After a few seconds your trial is **activated** and the following notice is displayed.

![](/images/grid-management/virtual-mobile-grid/6ab7015-image_1.png)

On the **Virtual Mobile Grid** screen, you will see the devices available for you during the trial period.

## How to Run Tests on Virtual Mobile Grid

Before running a test on Virtual Mobile Grid, make sure you have done the following:

- **Mobile Configuration:**  make sure you have created a mobile configuration that is compatible with Virtual Mobile Grid: [Configuration Library - Mobile](/docs/test-management/configuration-library-mobile). This configuration can be used to run tests through the CLI/CI, Scheduler, or a Test Plan.

![](/images/grid-management/virtual-mobile-grid/07dd385-image_2.png)

- **Apps Library** - make sure that you have added the app under test to the Apps Library: [Mobile Apps](/docs/test-management/mobile-apps). If the test has already been recorded with an app that was selected using the ***"From Device"*** option, in the **Setup step** of the test, in the **Properties** pane, click the **change app** link and select the From Library option.

### Running the test remotely

Using the configuration that is configured with the Virtual Mobile Grid, you can run your tests remotely using one of the following methods:

> 📘
>
> Make sure you have the relevant mobile app in your [Mobile Apps Library](/docs/test-management/mobile-apps).

[CLI](/docs/running-tests/the-command-line-cli) / [CI](/docs/ci-integrations/integrate-testim-to-your-ci)

Add --grid parameter with the grid name.

[Scheduler](https://help.testim.io/docs/scheduler-mobile)

Use **Grid** field to choose on which grid to run your tests.

[Test Plan](https://help.testim.io/docs/test-plans-mobile)

Use **Grid** field to choose on which grid to run your tests.

[Remote Run through the Editor](https://help.testim.io/docs/running-tests-overview#running-a-remote-mobile-test)

Under the **Run on a grid** option, select **Virtual Mobile Grid** and the relevant configuration.

![](/images/grid-management/virtual-mobile-grid/81f27e0-image_3.png)

### Changing the app when recorded from device

If the test has already been recorded with an app that was selected using the ***"From Device"*** option, do the following:

#### From the Editor

:fa-arrow-right: **To change the app from the Editor:**

1. In  the **Setup Step** click **Show Properties**.
2. In the **Properties** pane, under **Application name**, click the **Change app** link.
3. Select the From **Library option** and then select the relevant app from the list.
4. Click **Done**.

![](/images/grid-management/virtual-mobile-grid/87bb169-changeappgif.gif)

#### From the CLI

When running the test through the CLI, it is possible to override the default app Id, which was used in the recording of the test, with an app Id of the app in the Mobile Apps Library.

:fa-arrow-right: **To override the default app ID:**

1. Go to **Settings > CLI**.
2. In the **Grid** drop-down menu, select **Virtual Mobile Grid**.
3. Copy the command example to your command prompt.
4. Go to **Mobile Apps Library**.
5. Select the relevant app and then click the **Copy ID** button.
6. In the command prompt add the `--app-id` flag followed by the copied ID.
7. Run the CLI command.

#### From the scheduler

:fa-arrow-right: **To override the default app in the scheduler:**

1. Go to **Runs > Scheduled Runs**
2. Open the relevant scheduler.
3. Under **What to run on**, select the **Override application** checkbox.
4. Under **Select from library**, select the relevant application.
5. Click **Save**.

#### From the test plan

:fa-arrow-right: **To override the default app in the scheduler:**

1. Go to **Test List > Plans**
2. Open the relevant test plan.
3. Under **What to run on**, select the **Override application** checkbox.
4. Under **Select from library**, select the relevant application.
5. Click **Save**.
