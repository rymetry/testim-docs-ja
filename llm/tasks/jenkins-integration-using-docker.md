# 翻訳タスク (jenkins-integration-using-docker)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

![](/images/ci-integrations/jenkins-integration-using-docker/d69aa0d-Jenkins1.png "Jenkins1.png")

**Using docker is the best way for you to use the Testim CLI, that way we make sure you are always up-to-date with the latest npm package and the required node.js version.**

In order to integrate your tests with Jenkins using our docker container, first you need to install the [docker engine](https://docs.docker.com/engine/installation/) on the Jenkins machine or one of its slave machines.

## Now, just follow these steps

1. Create a New item in Jenkins:\
   ​

![](/images/ci-integrations/jenkins-integration-using-docker/a2e99b5-Jenkins2.PNG "Jenkins2.PNG")

2. Enter job name (e.g. "Testim Tests"), and choose "Freestyle project" and click "OK":

![](/images/ci-integrations/jenkins-integration-using-docker/1525473-Jenkins3.PNG "Jenkins3.PNG")

3. Add "Execute Shell" step:

![](/images/ci-integrations/jenkins-integration-using-docker/0fcc8b2-Jenkins4.PNG "Jenkins4.PNG")

4. Set the command with the appropriate parameters, as described in the CLI page. Here is the script template, that pulls and uses our docker file, and the run the CLI command itself:

```shell
TESTIM_DOCKER=testimio/docker-cli
TESTIM_TOKEN="<YOUR ACCESS TOKEN>"
TESTIM_PROJECT="<YOUR TESTIM PROJECT ID>"
TESTIM_LABEL="<YOUR LABEL>"
SELENIUM_GRID_NAME="<YOUR SELENIUM GRID NAME>"

echo "Pulling latest version"
docker pull ${TESTIM_DOCKER}

echo "Run testim-cli"
docker run --rm -v "${WORKSPACE}":/opt/testim-runner \
  ${TESTIM_DOCKER} \
  --token ${TESTIM_TOKEN} \
  --project "${TESTIM_PROJECT}" \
  --label "${TESTIM_LABEL}" \
  --grid ${SELENIUM_GRID_NAME} \
  -r /opt/testim-runner/testim-sanity-$BUILD_NUMBER-report.xml
echo "Testim finished"\
```

![](/images/ci-integrations/jenkins-integration-using-docker/f0d35e2-Jenkins5.PNG "Jenkins5.PNG")

​**Note**:  For the grid name, read [here](/docs/grid-management/grid-management) how to set up your grid.

5. In order for Jenkins to store, analyze and show the results, we generate a standard JUnitXMLReporter XML file. For Jenkins to use the file you need to add a post-build action of type "Publish JUnit test result report":

![](/images/ci-integrations/jenkins-integration-using-docker/8c119e0-Jenkins6.PNG "Jenkins6.PNG")

6. Set the xml file value, according to the "report-file" parameter in section 4:

![](/images/ci-integrations/jenkins-integration-using-docker/d2241d4-Jenkins7.PNG "Jenkins7.PNG")

​

​
