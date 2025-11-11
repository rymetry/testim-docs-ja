# 翻訳タスク (tricentis-device-cloud)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

Testim Mobile is better together with Tricentis Device Cloud (TDC), which gives you access to real iOS and Android devices on our grid with our support. Get insights into your mobile app usability and performance, too, with analytics powered by machine learning.

TDC offers shared devices, which are shared among users, as well as dedicated private devices, which are only available to you. The Tricentis Device Cloud does not require any special integration and it includes a free trial that you can enroll to as a Company Owner or Project Owner. Once the free trial is started, its shared resources are immediately available under [Device Management](https://help.testim.io/docs/view-local-connected-mobile-devices).  During the free trial period, shared trial devices (Android and iOS) will be available for you to use.

## How to Start a Free Tricentis Device Cloud Trial

As the Company Owner or Project Owner, you can start a free trial of Tricentis Device Cloud. If you want to skip the free trial and move directly to the paid version, [contact us](https://www.testim.io/contact-us/).

:fa-arrow-right: **To start a free trial of Tricentis Device Cloud:**

1. Go to the **Device Management > Real Devices Cloud** tab.
2. Click **Start A Trial**.

![](/images/grid-management/tricentis-device-cloud/c299505-image_4.png)

After a few seconds your trial is **activated** and the following notice is displayed.

![](/images/grid-management/tricentis-device-cloud/0012b7c-trialactive.png)

2. Navigate to the **Device Management** link in the main navigation menu.\
   On the **Tricentis Device Cloud Shared** screen, you will see the devices available for you during the trial period.

![](/images/grid-management/tricentis-device-cloud/b81b106-image_3.png)

## How to Run Tests on Tricentis Device Cloud

Before running a test on Tricentis Device Cloud, make sure you have created a mobile configuration that is compatible with TDC:

[Configuration Library - Mobile](/docs/test-management/configuration-library-mobile)

![](/images/grid-management/tricentis-device-cloud/6773dc8-config.png)

You can run your tests remotely using one of the following methods:

[CLI](/docs/running-tests/the-command-line-cli) / [CI](/docs/ci-integrations/integrate-testim-to-your-ci)

Add --grid parameter with the grid name.

[Scheduler](https://help.testim.io/docs/scheduler-mobile)

Use Grid field to choose on which grid to run your tests.

[Test Plan](https://help.testim.io/docs/test-plans-mobile)

Use Grid field to choose on which grid to run your tests.
