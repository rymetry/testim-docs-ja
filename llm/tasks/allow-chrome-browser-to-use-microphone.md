# 翻訳タスク (allow-chrome-browser-to-use-microphone)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

It is possible to enable the browser to a mock microphone as part of the test. To Allow it, you need to pass as part of the CLI command an extra flag, read here about the [CLI command](https://help.testim.io/docs/the-command-line-cli).

To enable the microphone use *--chrome-extra-args* with the value *"use-fake-device-for-media-stream"*\
For example:

```shell
testim --token "TOKEN" --project "PROJECT" --grid "Testim-Grid" --chrome-extra-args "use-fake-device-for-media-stream"
```

> 🚧 Note
>
> Allowing the microphone as part of your test will be a mock scenario
