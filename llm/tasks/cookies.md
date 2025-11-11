# 翻訳タスク (cookies)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

ブラウザクッキーの取得と設定

> 📘 Cookie とは、Web サイトから送信されブラウザに保存される小さなデータです。用途は多岐に渡りますが、テスト自動化ではログインフロー全体を踏まずに Cookie を直接設定して認証を高速化する、といった使い方が可能です。

Testim では複数の方法で Cookie の設定（set）と取得（get）が可能です。Cookie を「設定」すると、属性値がブラウザに書き込まれます。「取得」すると、ブラウザ内の Cookie 値を取り出して変数に代入できます。\
Cookie を扱う代表的な方法:

- Cookie ステップ — Cookie 用の専用ステップを利用します。
  - Set Cookie — テストで使用する Cookie を定義する新規ステップ。*HttpOnly* や *Secure* Cookie の作成はこのステップ推奨。
  - Get Cookie — AUT のブラウザから Cookie を取得してパラメータに保存。以降のステップ（Set Cookie を含む）で参照可能。
- Setup ステップの「Test Data」— 特定のテストでページ読込前に Cookie を読み込ませたい場合に使用。Cookie のドメイン追加はこの Test Data で行うのが推奨。
- カスタムJSステップ — テスト開始時でなくても良い場合に、任意の箇所で set/get を行う。
- 設定ファイル＆実行フック — CLI 実行時に設定ファイル経由で Cookie を設定。スイート全体で必要な場合に有効。注: CLI から Cookie を「取得」することはできません。

## Cookie を設定する

Cookie の値は、手入力または Get Cookie で取得したパラメータから設定できます。

### Set Cookie ステップで設定

**Set Cookie** ステップは、テストのUIから直接 Cookie を設定します。属性を手入力するか、**Get Cookie** で取得したパラメータを利用します。

:fa-arrow-right: **To set a cookie by entering its attributes:**

1. Hover over the :fa-caret-right: **(arrow symbol)** where you want to add the step.

![3845](/images/advanced-features/cookies/9a4e48a-Testim_201a.png "Testim 201a.png")

The action options are displayed.

![300](/images/advanced-features/cookies/d3b6f5e-Testim_202a_r.png "Testim 202a_r.png")

2. Click on the “**M**” (Testim predefined steps).\
   The **Predefined steps** menu opens.

![300](/images/advanced-features/cookies/42edd22-Testim_203_r.png "Testim 203_r.png")

3. Click on **Actions**.\
   The Actions menu expands.

![300](/images/advanced-features/cookies/bab0fb0-Testim_204_r.png "Testim 204_r.png")

4. Scroll down through the menu and select **Set Cookie**.

> 📘 Alternatively, you can use the search box at the top of the menu to search for **Set Cookie**.

The **Set Cookie** screen is shown.

![300](/images/advanced-features/cookies/fd880f8-Testim_205_r.png "Testim 205_r.png")

5. Ensure the **Create new Cookie** radio button is selected (default).
6. Enter your desired values in the first four **Cookie Info** fields.

- **Cookie name** – the name of the cookie. This parameter is required.
- **Cookie value** – the value you wish to assign to the cookie. This parameter is required.
- **Domain** – the host to which the cookie will be sent. The default Domain (blank) is the Base URL your test is running on. This parameter is optional.
- **Path** – the path that must exist in the request URL. The default Path (blank) is the root directory. This parameter is optional.

> 📘 Strings must be surrounded by single or double quotes.

7. In the **Expires (Max-Age)** field, select from the dropdown your desired expiration time for your cookie (default = session).
8. Select the **HttpOnly** checkbox if you want your cookie set to HttpOnly.
9. Select the **Secure** checkbox if you want your cookie set to Secure.
10. Click the **back arrow** to return to the main **Editor** window.

![300](/images/advanced-features/cookies/55825e1-Testim_206a_r.png "Testim 206a_r.png")

When you run your test your cookie will be set.

:fa-arrow-right: **To set a cookie using a cookie parameter:**

1. Hover over the :fa-caret-right: **(arrow symbol)** where you want to add the step.

![3845](/images/advanced-features/cookies/81c33b1-Testim_201a.png "Testim 201a.png")

The action options are displayed.

![300](/images/advanced-features/cookies/8a64224-Testim_202a_r.png "Testim 202a_r.png")

2. Click on the “**M**” (Testim predefined steps).\
   The **Predefined step**s menu opens.

![300](/images/advanced-features/cookies/9634744-Testim_203_r.png "Testim 203_r.png")

3. Click on **Actions**.\
   The Actions menu expands.

![300](/images/advanced-features/cookies/0e28a9c-Testim_204_r.png "Testim 204_r.png")

4. Scroll down through the menu and select **Set Cookie**.

> 📘 Alternatively, you can use the search box at the top of the menu to search for **Set Cookie**.

The **Set Cookie** screen is shown.

![300](/images/advanced-features/cookies/fc68884-Testim_205_r.png "Testim 205_r.png")

5. Select the **Use cookie parameter** radio button.\
   The **Parameter Name** field is shown.

![3849](/images/advanced-features/cookies/3d4b48c-Testim_218.png "Testim 218.png")

6. In the **Parameter Name** field, enter the name of a previously created cookie parameter/variable. For more information, see [Getting Cookies using the Get Cookie step](doc:cookies#getting-cookies-using-the-get-cookie-step).
7. Click the **back arrow** to return to the main **Editor** window.

![3851](/images/advanced-features/cookies/98be8c7-Testim_219a.png "Testim 219a.png")

When you run your test, your cookie will be set with the current value of the cookie parameter you entered in this step.

### Setting Cookies using the Setup step – “Test Data” property

Set your cookies in the **Test Data** property of the Setup step if you need your cookies for a particular test, or if you need to have the cookies loaded before your page loads.

:fa-arrow-right: **To set cookies in the Test Data property:**

1. Hover over the **Setup** step (the first step in your test), and click on the **Show Properties** (:fa-cog:) icon.

![3843](/images/advanced-features/cookies/9335a8c-Testim_210a.png "Testim 210a.png")

The **Test Configuration Properties** panel opens on the right-hand side.

![200](/images/advanced-features/cookies/3866fe4-Testim_211_r2.png "Testim 211_r2.png")

> 📘 Alternatively, you can double-click the **Setup** step, or click the **Show step properties** icon in the top right corner of the screen.

2. Scroll down through the options, and click **Test Data**.\
   A JavaScript editor opens.

![3851](/images/advanced-features/cookies/f222a38-Testim_212.png "Testim 212.png")

3. In the editor enter the code for setting your cookies.

```javascript
return {
 "cookies":[{
    "name": "username",
    "value": "tomsmith",
    "domain": "http://google.com"
  },{
    "name": "password",
    "value": "SuperSecretPassword!"
  }]
};
```

> 📘 **name** = cookie name\
> **value** = cookie value\
> **domain** = cookie domain (optional)

Click the **back arrow** to return to the main **Editor** window.

![3830](/images/advanced-features/cookies/2dea826-Testim_213a.png "Testim 213a.png")

When you run your test the cookies will be loaded before your page loads.

### Setting Cookies using a custom JS (JavaScript) step

Set your cookies in a **Custom JavaScript** step if you need your cookies for a particular test, but don’t necessarily need them at the start of the test.

:fa-arrow-right: **To set cookies using JavaScript in a “custom action” step:**

1. Hover over the :fa-caret-right: **(arrow symbol)** where you want to add the cookies.

![3845](/images/advanced-features/cookies/57fdc2c-Testim_201a.png "Testim 201a.png")

The action options are displayed.

![300](/images/advanced-features/cookies/abbdb56-Testim_202a_r.png "Testim 202a_r.png")

2. Click on the “**M**” (Testim predefined steps).\
   The **Predefined steps** menu opens.

![300](/images/advanced-features/cookies/2042807-Testim_203_r.png "Testim 203_r.png")

3. Click on **Actions**.\
   The Actions menu expands.

![300](/images/advanced-features/cookies/bf34029-Testim_204_r.png "Testim 204_r.png")

4. Scroll down through the menu and select **Add custom action**.\
   The **Add Step** window opens.

![300](/images/advanced-features/cookies/f0ba274-Testim_215_r.png "Testim 215_r.png")

> 📘 Alternatively, you can use the search box at the top of the menu to search for **Add custom action**.

5. In the **Name the new step** field, enter a (meaningful) name for this step.
6. If this is a shared step (to be made available to reuse in this and other tests), keep the box next to **Shared step** selected, and select a folder in which to save the step. (This is the default.) Otherwise, deselect it.
7. Click **Create Step**.\
   The **JS Editor** opens, and the **Custom Action Properties** panel opens on the right-hand side.

![3851](/images/advanced-features/cookies/17ff9b7-Testim_216.png "Testim 216.png")

8. In the **editor**, enter code to set your cookies, using the following as an example.

```javascript
document.cookie = "password=SuperSecretPassword!";
document.cookie = "username=tomsmith";
```

9. Optionally fill in the properties in the **Custom Action Properties** panel.

- **Step name** – The name of the step. (Default is the name you entered in Step 5.)
- **Description** – The description of the step. (Default = *Run action*)
- **Share step** – Allows you to set this step as a shared step.
- **+ Params** – Add JavaScript or HTML parameters. For more information see [Parameters in custom JavaScript steps](/docs/parameters/parameters-in-custom-javascript-steps).
- **When this step fails** – Specify what to do if the step fails.
- **When to run step** – Specify conditions for when to run the step. For more info, see [Conditions](/docs/conditions/conditions).
- **Override timeout** – Allows you to override the default time lapse setting which causes Testim to register a fail for a test step, and specify a different time lapse value (in milliseconds)

When you run your test, the cookies will be set at the location where you added the Custom Action step.

### Setting Cookies using a Configuration File

You can set your cookies by using a configuration file when working through your CLI. A configuration file is a JavaScript file containing all the required parameters to run your test suite and run hooks which can be used to set up the application backend. This option is useful when you need the cookies for your entire test suite.

:fa-arrow-right: **To set cookies using a configuration file:**

1. Create a JavaScript configuration file. See [Configuration file & run hooks](/docs/configuration-file/configuration-file-run-hooks).
2. Add code to the beforeSuite section in order to set the cookies. Use the following code as a model.

```javascript
beforeSuite: function (suite) {   
  return {
    "cookies":[
        {
      "name": "username",
      "value": "tomsmith",
    },
        {
      "name": "password",
      "value": "SuperSecretPassword!"
    }]
  };
}
```

## Getting Cookies

Testim enables you to “get” cookies by assigning the value of a cookie to a variable. You can then use the cookie attributes in your test.

### Getting Cookies using the Get Cookie step

The **Get Cookie** step allows you to get cookies directly from the UI within the context of a test by storing the value of a cookie in a variable.

:fa-arrow-right: **To get a cookie using the Get Cookie step:**

![894](/images/advanced-features/cookies/c7b7428-Jan-31-2021_06-34-55.gif "Jan-31-2021 06-34-55.gif")

1. Hover over the :fa-caret-right: **(arrow symbol)** where you want to add the step.

![3851](/images/advanced-features/cookies/182e01a-Testim_207a.png "Testim 207a.png")

The action options are displayed.

![300](/images/advanced-features/cookies/42c6ecf-Testim_202a_r.png "Testim 202a_r.png")

2. Click on the “**M**” (Testim predefined steps).\
   The **Predefined steps** menu opens.

![300](/images/advanced-features/cookies/f95fa58-Testim_203_r.png "Testim 203_r.png")

3. Click on **Actions**.\
   The Actions menu expands.

![300](/images/advanced-features/cookies/ab4f1d0-Testim_204_r.png "Testim 204_r.png")

4. Scroll down through the menu and select **Get Cookie**.

> 📘 Alternatively, you can use the search box at the top of the menu to search for **Get Cookie**.

A “Get Cookie” step is added in the **Editor**.\
5\. Hover over the newly created step, and click on the **Show Properties** (:fa-cog:) icon.

![3851](/images/advanced-features/cookies/06fb384-Testim_208a.png "Testim 208a.png")

The **Properties** panel opens on the right-hand side.

![300](/images/advanced-features/cookies/e8f327d-Testim_209_r.png "Testim 209_r.png")

6. Fill in the properties as described below.

- **Description** – The description of the step. (Default = *Get Cookie*)
- **Cookie name** – The name of the cookie you are getting. (Strings must be surrounded by single or double quotes.)
- **Variable name** – The name of the variable in which you wish to store the cookie data. (Default = *myCookie*)
- **Variable scope** – The scope in which the variable can be passed:
  - **Local**: allows you to pass parameters between steps in the same scope.
  - **Test**: allows you to pass parameters between steps and groups in the same test.
  - **Suite**: allows you to pass parameters between tests in the same test suite.
- **When this step fails** – Specify what to do if the step fails.
- **When to run step** – Specify conditions for when to run the step. For more info, see [Conditions](/docs/conditions/conditions).
- **Override timeout** – Allows you to override the default time lapse setting which causes Testim to register a fail for a test step, and specify a different time lapse value (in milliseconds)

When the test is run, the specified cookie will be stored in the variable.

### Getting Cookies using a custom JS (JavaScript) step

You can get cookies without having to use the Get Cookie step by adding a “custom action” step, and entering your code in the JavaScript editor.

:fa-arrow-right: **To get a cookie using JavaScript in a “custom action” step:**

1. Hover over the :fa-caret-right: **(arrow symbol)** where you want to add the step.

![3851](/images/advanced-features/cookies/9e6579b-Testim_220a.png "Testim 220a.png")

The action options are displayed.

![300](/images/advanced-features/cookies/4daa9d3-Testim_202a_r.png "Testim 202a_r.png")

2. Click on the “**M**” (Testim predefined steps).\
   The **Predefined steps** menu opens.

![300](/images/advanced-features/cookies/ab3aebb-Testim_203_r.png "Testim 203_r.png")

3. Click on **Actions**.\
   The Actions menu expands.

![300](/images/advanced-features/cookies/9030d32-Testim_204_r.png "Testim 204_r.png")

4. Scroll down through the menu and select **Add custom action**.\
   The **Add Step** window opens.

![300](/images/advanced-features/cookies/295c84e-Testim_215_r.png "Testim 215_r.png")

> 📘 Alternatively, you can use the search box at the top of the menu to search for **Add custom action**.

5. In the **Name the new step** field, enter a (meaningful) name for this step.
6. If this is a shared step (to be made available to reuse in this and other tests), keep the box next to **Shared step** selected, and select a folder in which to save the step. (This is the default.) Otherwise, deselect it.
7. Click **Create Step**.\
   The **JS Editor** opens, and the **Custom Action Properties** panel opens on the right-hand side.

![3851](/images/advanced-features/cookies/895c71a-Testim_221.png "Testim 221.png")

8. In the **editor**, enter code to get your cookies. The following example gets and prints the value of the cookies named *username* and *password*.

```javascript
//create an array of the site cookies
let cookieArray = document.cookie.split("; ");
var name = "username=";
for(var i = 0; i <cookieArray.length; i++) {
    var c = cookieArray[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      console.log("username = " + c.substring(name.length, c.length));
    }
}

var name = "password=";
for(var i = 0; i <cookieArray.length; i++) {
    var c = cookieArray[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      console.log("password = " + c.substring(name.length, c.length));
    }
}
```

9. Optionally fill in the properties in the **Custom Action Properties** panel.

- **Step name** – The name of the step. (Default is the name you entered in Step 5.)
- **Description** – The description of the step. (Default = *Run action*)
- **Share step** – Allows you to set this step as a shared step.
- **+ Params** – Add JavaScript or HTML parameters. For more information see [Parameters in custom JavaScript steps](/docs/parameters/parameters-in-custom-javascript-steps).
- **When this step fails** – Specify what to do if the step fails.
- **When to run step** – Specify conditions for when to run the step. For more info, see [Conditions](/docs/conditions/conditions).
- **Override timeou**t – Allows you to override the default time lapse setting which causes Testim to register a fail for a test step, and specify a different time lapse value (in milliseconds)

When you run your test, the Get Cookies function will run as part of the Custom Action step that you have added.
