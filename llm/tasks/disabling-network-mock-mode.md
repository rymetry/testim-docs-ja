# 翻訳タスク (disabling-network-mock-mode)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

You can disable the network mock mode for tests that have been previously marked as enabled.

## Disabling mock network mode through the UI

To disable mock network mode through the UI:\
In the **Properties** pane, under mock network toggle the **Run test on mock network** setting.

![264](/images/mock-network-responses/disabling-network-mock-mode/26999eb-mock9.png "mock9.png")

## Disabling mock network mode through the CLI

## Disable mock mode for the entire CLI run

If you want to cancel the mock mode for the entire CLI run, you do so by passing `--disable-mock-network` flag.  The mock mode will be disabled even if some of the tests have mock toggle on.

```shell
> testim --disable-mock-network
```

 Example:

```shell
testim <your CLI options> <your CLI parameters> --mock-network-pattern
```
