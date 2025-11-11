# 翻訳タスク (testrail-integration)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

Show Tests run results in your TestRail project

TestRail integration allows you to link a test in TestRail to a test in Testim. The test run results will automatically be shown in TestRails giving you full visibility to both your manual test results as well as your automated tests in a single view.

> 📘
>
> Disconnecting the integration will lose all links.

### Setting TestRail integration

This process is required only once.

1. Navigate to "Settings", and then to "Integration" tab.
2. Click "login" to TestRail link.

![](/images/test-management-integrations/testrail-integration/cbf1548-Untitled.png "Untitled.png")

3. Open TestRail, copy the domain from the URL (make sure you are logged in) and paste it into the URL field. The URL structure should be https://&lt;projectName&gt;.testrail.io/, where projectName is available in TestRail URL. For example, the projectName in the account below is ranhadar1

![](/images/test-management-integrations/testrail-integration/ea0ada5-image-20210523-052818.png "image-20210523-052818.png")

4. Enter your TestRail username.
5. Log into TestRail as Admin user, navigate to "My Settings" and then to "API Keys" tab. Click "Generate Key", enter any key name, copy the generated string and click "Save settings". Paste this key into the ApiKey field.

![](/images/test-management-integrations/testrail-integration/b291ef8-TR.gif "TR.gif")

6. Click "Connect"

![](/images/test-management-integrations/testrail-integration/25995c4-Integrate.gif "Integrate.gif")

7. Choose the TestRail projects to connect to.

![](/images/test-management-integrations/testrail-integration/1e8d54a-Screen_Shot_2021-10-14_at_12.54.26.png "Screen Shot 2021-10-14 at 12.54.26.png")

At this point Testim is associated to a project in TestRail, but not mapped to a specific test.

> 📘 Important Note
>
> You may connect one TMS (Test Management System) at a time. So, if your Testim system is already connected to another TMS, you will need to disconnect this TMS first and only then connect TestRail. Note that by disconnecting the TMS, you will remove the connections between the tests. So, if you want to connect to the previous TMS again you will have to recreate the connections as well.

### Connecting a test in Testim to a TestRail test

1. Open the test you would like to connect to a TestRail test
2. In the setup steps' properties panel, choose the TestRail project and test to connect to
3. save the test

After running the test, the result will be presented in the relevant TestRail project under the "**Test run and results**" tab.

![](/images/test-management-integrations/testrail-integration/7ad9ed6-Oct-14-2021_13-09-56.gif "Oct-14-2021 13-09-56.gif")

### Pass custom parameters to TestRail for a specific run

As part of a [CLI run](https://help.testim.io/docs/the-command-line-cli), you are able to add any custom parameters that can be consumed by TestRail, for example:

- version
- executed_by

The JSON should be as followed:

```json
{
"executed_by": "rannn505",
"version" : "v1"
}
```

In order to pass these parameters use the *--tms-field-file* flag as part of your CLI command. The flag should be followed by a JSON file path that will contain the parameters and their values.\
For example:

```shell
--tms-field-file [tms-field-file.json]
```

### Note

1. Testim runs names will always follow this convention:\
   "Report from [Testim.io](http://testim.io/) - *Suite\\Test name*"
2. Only remote runs results will be shown in TestRail (local runs will not be shown).
3. Suite runs will be presented as one run in TestRail, click the certain run in order to see the results of all tests in the suite.
4. Mandatory custom fields in TestRail are not supported. Making a custom field on TestRail mandatory may cause the integration to stop working.
