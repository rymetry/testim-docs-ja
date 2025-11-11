# 翻訳タスク (jenkins-integration)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

![](/images/ci-integrations/jenkins-integration/74d3ef8-tCyedoSJRGO8AAGv6sqs_jenkins-logo.png "tCyedoSJRGO8AAGv6sqs_jenkins-logo.png")

In order to integrate your tests with Jenkins, first, you need to have\
node.js (any of the LTS/supported versions of Node.js.) installed on the Jenkins machine or one of its worker machines.

## Now, just follow these steps

1. Create a New item in Jenkins:

![](/images/ci-integrations/jenkins-integration/56a9e41-96INjt2YRViRwuogwLgW_jenkins_new_item.PNG "96INjt2YRViRwuogwLgW_jenkins_new_item.PNG")

2. Enter job name (e.g. "Testim Tests"), and choose "Freestyle project" and click "OK":

![](/images/ci-integrations/jenkins-integration/ba919cf-QCXXOsSWT4uYJqaRhEHR_jenkins_freestyle_job.PNG "QCXXOsSWT4uYJqaRhEHR_jenkins_freestyle_job.PNG")

3. Add execute step

### Linux

3. Add "Execute Shell" step:

![](/images/ci-integrations/jenkins-integration/5253260-ms0qPoJ5RymCKMlPFKTp_jenkins_execute_shell.PNG "ms0qPoJ5RymCKMlPFKTp_jenkins_execute_shell.PNG")

4. Set the command with the appropriate parameters, as described in the [CLI page](/docs/running-tests/the-command-line-cli).\
   Here is the basic script template, containing the first part that makes sure you have the latest npm package, and the CLI command itself (no sudo required)

```shell
mkdir -p "${WORKSPACE}/.npm-packages"
prefix=${WORKSPACE}/.npm-packages
NPM_PACKAGES="${WORKSPACE}/.npm-packages"
export PATH="$PATH:$NPM_PACKAGES/bin"
export NODE_PATH="$NODE_PATH:$NPM_PACKAGES/lib/node_modules"
npm config set prefix ${WORKSPACE}/.npm-packages
npm install -g @testim/testim-cli

testim --label "<YOUR LABEL>" \
--token "<YOUR ACCESS TOKEN>" \
--project "<YOUR PROJECT ID>" \
--grid "<Your grid name>"  \
--report-file test-results/testim-tests-$BUILD_NUMBER-report.xml
```

<Image title="File1488700845402.png" alt={899} align="center" src="/images/ci-integrations/jenkins-integration/ff81d47-File1488700845402.png">
  Jenkins Execute Shell Command
</Image>

**Note:** For the grid name, read [here](/docs/grid-management/grid-management) how to set up your grid.

### Windows

3. Add "Execute Windows batch command" step:

![](/images/ci-integrations/jenkins-integration/20a3651-File1488700749415.png "File1488700749415.png")

4. Set the command with the appropriate parameters, as described in the [CLI page](/docs/running-tests/the-command-line-cli).\
   Here is the basic script template, containing the first part that makes sure you have the latest npm package, and the CLI command itself:

```shell Batch
npm install -g @testim/testim-cli

testim --label "<YOUR LABEL>" ^
--token "<YOUR ACCESS TOKEN>" ^
--project "<YOUR PROJECT ID>" ^
--grid "<Your grid name>"  ^
--report-file test-results/testim-tests-$BUILD_NUMBER-report.xml
```

<Image title="jenkins.png" alt={1402} align="center" src="/images/ci-integrations/jenkins-integration/05fb4d0-jenkins.png">
  Jenkins Execute Windows Batch Command
</Image>

\--

5. In order for Jenkins to store, analyze and show the results, we generate a standard JUnitXMLReporter XML file. For Jenkins to use the file you need to add a post-build action of type "Publish JUnit test result report":

![](/images/ci-integrations/jenkins-integration/0d9aac5-0h9FTPrwROu7qb7ae7hC_jenkins_post_build_action.PNG "0h9FTPrwROu7qb7ae7hC_jenkins_post_build_action.PNG")

5. Set the xml file value, according to the "report-file" parameter in section 4:

![](/images/ci-integrations/jenkins-integration/3a10b08-AP4V4UjQj6mBgoCdhmoQ_jenkins_post_build_action_details.PNG "AP4V4UjQj6mBgoCdhmoQ_jenkins_post_build_action_details.PNG")
