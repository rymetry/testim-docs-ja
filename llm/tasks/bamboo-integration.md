# 翻訳タスク (bamboo-integration)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

![780](/images/ci-integrations/bamboo-integration/1c8410c-Bamboo0.png "Bamboo0.png")

In order to integrate your tests with Bamboo, first you need to have Node.js (version >= 6.0.0) installed on the Bamboo server or one of its agent machines.

## Now, just follow these steps

### 1. Create a New plan in Bamboo

![661](/images/ci-integrations/bamboo-integration/0faedb6-Bamboo2.png "Bamboo2.png")

1.1. Enter plan name (e.g. "Testim Tests"), choose repository host "None" and click "Configurate plan":

![1016](/images/ci-integrations/bamboo-integration/fa42a83-Bamboo3.png "Bamboo3.png")

 1.2. Select "Yes please!" checkbox under "Enable this plan?" section:

![643](/images/ci-integrations/bamboo-integration/73d02b0-Bamboo4.png "Bamboo4.png")

### 2. Add install Testim CLI task

​\
2.1. Click on "Add task":\
2.2. Choose "npm" task:

![903](/images/ci-integrations/bamboo-integration/71b903a-Bamboo5.png "Bamboo5.png")

2.3. Enter task description (e.g "Install Testim CLI")\
2.4. Choose existing Node.Js executable or add new with Node.Js path

![552](/images/ci-integrations/bamboo-integration/2348387-Bamboo6.png "Bamboo6.png")

2.5. Insert Command:

```javascript
install -g @testim/testim-cli
```

  2.6. Click "Save":

![611](/images/ci-integrations/bamboo-integration/663eab3-Bamboo7.png "Bamboo7.png")

### 3. Add run Testim CLI task

​\
3.1. Click on "Add task":\
3.2. Choose "Command" task:

![879](/images/ci-integrations/bamboo-integration/e6c0d23-Bamboo8.png "​Bamboo8.png")

3.3. Enter task description (e.g "Run Testim CLI")\
3.4. Choose existing "Testim CLI" executable or add a new "Testim CLI" executable:

![555](/images/ci-integrations/bamboo-integration/5d5f0ba-Bamboo9.png "​Bamboo9.png")

3.5. Insert argument:

```shell
--label "<YOUR LABEL>" --token "<YOUR ACCESS TOKEN>" --project "<YOUR PROJECT ID>"  --grid "<Your grid name>" --report-file ${bamboo.build.working.directory}/testim-tests-${bamboo.buildNumber}-report.xml
```

**Note**:  For the grid name, read [here](/docs/grid-management/grid-management) how to set up your grid.

3.6. Click "Save":

![620](/images/ci-integrations/bamboo-integration/9ae3664-Bamboo10.png "​Bamboo10.png")

### 4. Add collect test results task

4.1. Click on "Add task":\
4.2. Choose "JUnit Parser" task:

![885](/images/ci-integrations/bamboo-integration/7736c24-Bamboo11.png "​Bamboo11.png")

4.3. Enter task description (e.g "Collect Testim Results")\
4.4. Insert "Specify custom results directories":

```shell
**/testim-tests-*-report.xml
```

4.5. Click "Save":

![607](/images/ci-integrations/bamboo-integration/88541f8-Bamboo12.png "​Bamboo12.png")

### 5. Click on "Create"​

![1006](/images/ci-integrations/bamboo-integration/8e543c5-Bamboo13.png "​Bamboo13.png")

![1304](/images/ci-integrations/bamboo-integration/f4235cf-Bamboo14.png "​Bamboo14.png")

### 6. Run Plan

6.1. Click on Run button

![451](/images/ci-integrations/bamboo-integration/cde9d6d-Bamboo15.png "Bamboo15.png")

6.2. Wait until plan finished\
6.2. Check Tests results

![488](/images/ci-integrations/bamboo-integration/6f346c1-Bamboo16.png "Bamboo16.png")
