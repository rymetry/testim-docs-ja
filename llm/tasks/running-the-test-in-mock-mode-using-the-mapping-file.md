# 翻訳タスク (running-the-test-in-mock-mode-using-the-mapping-file)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

After recording a new HAR and/or uploading a custom HAR and/or a Mapping File, the mock network mode for the test will be automatically enabled.

![264](/images/mock-network-responses/running-the-test-in-mock-mode-using-the-mapping-file/26999eb-mock9.png "mock9.png")

You can run the test in Mock Network mode locally using the UI or remotely through the CLI.

## Running the test locally through the UI

:fa-arrow-right:**To run your test locally:**

1. In the Testim Visual Editor, go to the **Test List** screen and click a test for which you have recorded a new HAR or uploaded a custom HAR.
2. In the Test Editor screen, a **Mock Network** icon will be displayed next to the **Play** button, indicating that the Mock network is available.

![274](/images/mock-network-responses/running-the-test-in-mock-mode-using-the-mapping-file/173c389-mock6.png "mock6.png")

3. Click the **Play** button to run the test using the mock network.  

## Running the test locally through the CLI

If a test is in a mock mode in the editor, its default run mode will be mock also through the CLI, no further flag needed

### Running the test using the mapping file only

If you already uploaded a mapping file through the editor, this file will also be used in the CLI run. It is also possible to override the mapping file for the entire run by providing the path to the created mapping file. This option is only supported for remote runs.

```shell
> testim --override-map-file </path/to/mapping/file.json>
```

In that case, the hierarchy to mock a request will be

- CLI mapping file
- Test mapping file
- HAR file
- Perform actual call

Example:

```shell
testim <your CLI options> <your CLI parameters> --override-map-file <documents/mappingFile.json>
```
