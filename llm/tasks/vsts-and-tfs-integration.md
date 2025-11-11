# 翻訳タスク (vsts-and-tfs-integration)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

​

![404](/images/ci-integrations/vsts-and-tfs-integration/d30e448-tfs1.png "tfs1.png")

​In order to integrate your tests with VSTS/TFS, first you need to have docker installed on the VSTS/TFS agent.

### Now, just follow these steps

1. Go to Build page

![600](/images/ci-integrations/vsts-and-tfs-integration/e8e8d07-tfs2.png "tfs2.png")

​2. Create a new build

![591](/images/ci-integrations/vsts-and-tfs-integration/c4affba-tfs3.png "tfs3.png")

​3. Select your repository

![961](/images/ci-integrations/vsts-and-tfs-integration/3f92a44-tfs4.png "tfs4.png")

4. Select empty job

![961](/images/ci-integrations/vsts-and-tfs-integration/a3f06a9-tfs5.png "tfs5.png")

5. Add task

![429](/images/ci-integrations/vsts-and-tfs-integration/6175fc6-tfs6.png "tfs6.png")

6. Add Docker task

![758](/images/ci-integrations/vsts-and-tfs-integration/c4e0e7a-tfs7.png "tfs7.png")

7. Select Action: Run a Docker command

![759](/images/ci-integrations/vsts-and-tfs-integration/93a38c4-tfs8.png "tfs8.png")

8. Set the Command with the appropriate parameters, as described in the [CLI page](/docs/running-tests/the-command-line-cli). Here is the basic command template.

```shell
run --rm -v $(Build.BinariesDirectory):/opt/testim-runner testim/docker-cli --token <TOKEN> --project <PROJECT-ID> --grid <GRID-NAME> --report-file /opt/testim-runner/testim-sanity-$(Build.BuildId)-report.xml
```

![708](/images/ci-integrations/vsts-and-tfs-integration/76b5b0e-tfs9.png "tfs9.png")

​ **Note**:  For the grid name, read [here](/docs/grid-management/grid-management) how to set up your grid.

9. In order for VSTS/TFS to store, analyze and show the results, we generate a standard JUnitXMLReporter XML file.\
   For VSTS/TFS to use the file you need to add a Publish Test Results task

![753](/images/ci-integrations/vsts-and-tfs-integration/a99d051-tfs10.png "tfs10.png")

10. Select Test result format: JUnit

![659](/images/ci-integrations/vsts-and-tfs-integration/c8ae6c1-tfs11.png "tfs11.png")

11. Set the Test results files value, according to the "report-file" parameter in section 8 and set the

![654](/images/ci-integrations/vsts-and-tfs-integration/83f530c-tfs12.png "tfs12.png")

12. Set the Search folder **$(Build.BinariesDirectory)**

![654](/images/ci-integrations/vsts-and-tfs-integration/254a96d-tfs13.png "tfs13.png")

13. Save the build settings

![221](/images/ci-integrations/vsts-and-tfs-integration/5d80b20-tfs14.png "tfs14.png")

​

​\
​
