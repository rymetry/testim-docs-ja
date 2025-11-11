# 翻訳タスク (base-url)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

Learn how to run your test in different environments with different base URLs

Have you ever wondered how to run the same test with different URLs?\
Did you want to run your suite in different environments - test, staging and possibly production and did not know what would be the best way to do it?\
You came to the right place.

## What is a base URL?

The base URL in Testim is the first page in the website on which the test begins. Typically this is the root of the website's address, which typically points to the website's homepage by naming the **Host**. For example, [http://demo.testim.io](http://demo.testim.io) or [http://www.google.com](http://www.google.com). The base URL is defined in the **Setup Step** of the test, which is the first step.  Additional steps in the test may include clicks on links from the first/homepage to internal pages of the same website. The URL for these pages will include the same base URL followed by a **Relative Path**. For example, [http://demo.testim.io/signup](http://demo.testim.io/signup).

![](/images/running-tests/base-url/b1cff8e-baseurl.jpg)

## Overriding the Base URL when running the test

Typically, you record your tests on the development/test environment and then you want to run your tests on other environments as well. This means that the base URL and all relative URL (after clicking on the links) should change during the test run. When running remote runs using the following methods you can specify a different base URL as part of the configuration.

If you are running the test through the Test Editor, you can specify it under the Run on a grid section.

![](/images/running-tests/base-url/3bcd12f-runongrid.jpg)

In addition, here's a list of components you can use to send a different base URL while running the test:

- [CLI](/docs/running-tests/the-command-line-cli)
- [Scheduler](/docs/running-tests/scheduler)
- [Configuration File](/docs/configuration-file/configuration-file-run-hooks)
- [Test plan](/docs/test-management/test-plans)

When the base URL is overridden by a different base URL during the test run. The overriding base URL is displayed at the top (see image below). Notice that this URL is different than the one displayed in the Setup Step.

![](/images/running-tests/base-url/2907735-fb0b21d-base-url-setup.jpg)

### Overriding the base URL in the Setup Step

There are 4 situations:

- **The original base URL does not include a path and the override URL includes a path** - in this case the new base URL will completely override the original base URL.
- **The original base URL does not include a path and the override URL also does not include a path** - in this case the new base URL will completely override the original base URL.
- **The original base URL includes a path and the override URL does not include a path** - in this case the Base URL in the test execution will be a combination of the two - **New Base URL + Original Path**. For example, the original base URL is [http://staging.com/login](http://staging.com/login). If when running the test we override the base URL with following URL - [http://preprod.com](http://preprod.com), then the new Base URL will only override the host part of the URL - [http://preprod.com/login](http://preprod.com/login).
- **The original base URL includes a path and the override URL also includes a path** - in this case the new base URL will completely override the original base URL.

### Overriding the base URL in a Navigation Step

If the test also includes a Navigation Step, and the URL in **the navigation step has the same host as the one in Setup Step**, which we are overriding (see image below). In that case, Testim **will replace original navigation step host part only** with the host of the new overriding base URL, even if the overriding base URL includes a different path. For example:

- Setup step - [https://demo.testim.io](https://demo.testim.io)
- Navigation step - [https://demo.testim.io/checkout](https://demo.testim.io/checkout)
- Overriding base URL - [https://www.google.com/doodles](https://www.google.com/doodles)
- Resulting navigation step - [https://www.google.com/checkout](https://www.google.com/checkout)

![](/images/running-tests/base-url/6e073c9-image.png)

> 📘 If the URL in navigation step is a parameter
>
> In case the URL in the navigation step is not hardcoded, but rather a parameter (e.g. `url`=`<https://demo.testim.io/checkout>`), and the host (demo.testim.io) matches the original host in the Setup Step, the same behavior applies.

## Using the Base URL Out-of-the-box Parameter

The Base URL is also an out-of-the-box parameter, which, unlike other parameters in Testim, does not need to be defined as a parameter, but rather used immediately. The parameter is called -  `BASE_URL`. The parameter will be populated with the value of the base URL of the test run, which may be the original base URL of the test or an overriding value.

The Base URL parameter can be used as a dynamic base URL for data-driven testing that can be modified automatically based on the data provided to the test run. For example, you want to run the same test across a variety of different websites. In this case, you will use the base URL parameter to input dynamic URLs to the test runs.

For more information about data-driven tests, see [Data-driven testing](/docs/data-driven-testing/data-driven-testing)

> 📘
>
> The Base URL parameter can be used wherever parameter usage is supported. For more information, see [Parameters](/docs/parameters/parameters).

### Using the Base URL parameter in a Custom Action/Validation Step

In every custom action/validation, you can use the base URL value of the test run using the "BASE\_URL" parameter.  

 **To add the Base URL parameter to a Custom Action Step:**

1. Hover over the **+** or **Arrow** icon where you want to add a new **Custom Action Step** and click the **Testim predefined steps** button.\
   ![](/images/running-tests/base-url/45c6324-2023-06-13_17-20-26.jpg)
2. Click on the **Actions** menu.
3. Click **Add Custom Action**.
4. In the **Name** the new step field, enter a (meaningful) name for this step.\
   ![](/images/running-tests/base-url/e352510-2023-06-13_17-23-03.jpg)
5. Click **Create Step**.\
   The function editor opens, and the **Properties** panel opens on the right-hand side.
6. In the function editor, enter the function using the base URL parameter. In the following example, we will use the parameter to print the value into the console log:

```javascript
console.log("Base URL:" + BASE_URL)
```

After running the test the Base URL parameter value is displayed in the log:

![](/images/running-tests/base-url/09475a3-2023-06-13_17-28-39.jpg)

### Using the Base URL parameter in a Navigation Step

The Base URL can be used in a navigation step to dynamically navigate to a URL that includes the Base URL of the run followed by a specified path.

:fa-arrow-right: **To add the Base URL parameter to a Navigation Step:**

1. Hover over the **+** or **Arrow** icon where you want to add a new Navigation Step and click the **Testim predefined steps** button.

![](/images/running-tests/base-url/0fa605c-predefined.jpg "predefined.jpg")

2. Search for **Add navigation action** and click it.

![](/images/running-tests/base-url/10e28bf-nav-step.jpg "nav-step.jpg")

3. Input the URL using the **BASE\_URL** parameter, followed by remaining URL path.

![](/images/running-tests/base-url/0017136-nav-url.jpg "nav-url.jpg")

> 📘
>
> Single quote marks will be added before and after the URL (e.g., 'BASE\_URL + \'/Extension\''). Delete these single quote marks (e.g. BASE\_URL + \'/Extension\')

Testim will save the Navigation Step with your dynamic URL.

![](/images/running-tests/base-url/d14049f-base-url.jpg "base-url.jpg")

When the test runs the navigation step will navigate to the URL that includes the Base URL of the test run followed by the specified path.
