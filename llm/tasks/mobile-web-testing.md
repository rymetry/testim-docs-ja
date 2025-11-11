# 翻訳タスク (mobile-web-testing)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

Test your application on mobile device emulators

Does your application support mobile devices?\
Start using the Testim to make sure your (mobile web) application runs smoothly on different mobile platforms and devices.

## Getting started

If you do not have a mobile web project and you need one, please contact us.

## How to author a mobile web test

Authoring mobile-web tests works similarly to desktop-web tests. When you start a new test, you will get a default iPhone 6 config, which you can edit.

![](/images/miscellaneous/mobile-web-testing/f90da78-Aug-10-2020_12-12-32.gif "Aug-10-2020 12-12-32.gif")

After selecting the default configuration, you will continue to record your test as you've done with desktop web (clicking on the record button will open a Chrome in emulator mode) with the selected configuration.\
Behind the scene, we change the user-agent (vs. just resizing the screen).

## Run on different devices

Running on different devices will be done via the [CLI](https://help.testim.io/docs/the-command-line-cli).

> 📘
>
> All possible configurations are already configured on the configuration page. It is not possible to add additional configurations.

To run the test on another device, use the --test-config parameter by setting the resolution configuration to the mobile resolution you would like to test.

> 📘
>
> Running on different devices with different screen sizes may cause the tests to fail if you don't have the appropriate "scroll to element" steps. You'll need to add scrolls to your tests to support the different screen sizes. All in desktop-web, we recommend recording the smallest resolution possible, which should work on higher resolution configuration.

## Known Limitations

Currently mobile web tests require a separate project.\
The mobile web tests are based on Chromium Emulator. This means that only Chrome is supported for all Mobile Web projects in all configurations.
