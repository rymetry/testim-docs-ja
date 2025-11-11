# 翻訳タスク (best-practices-for-handling-logins)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

Find the way to reuse the login in all your tests

When your app requires a login, you need to consider the following:

- Tests should work locally and remotely.
- Enable different credentials for different users/environments.
- Deal with a situation where you are already logged in.

## Steps in creating a good login process

### Create a new test

1. Start a new test.
2. Record the steps of your login process.
3. Run the test to see if it works.
4. Save.

Typically, the steps in the login process will include:

1. Click sign in button
2. Enter username
3. Enter password
4. Click log in

If this is your first test, use this [guide](/docs/hello-world) to help you.

![1903](/images/miscellaneous/best-practices-for-handling-logins/546ac11-login_1.gif "login_1.gif")

### Run in Incognito mode

Running in incognito mode can be very useful when creating the login process.\
When you run in incognito mode, you start with a clean browser every time i.e. without cookies, without a local storage, and the browser does not remember you.

Learn here how to run in an incognito mode [here](/docs/running-tests/run-in-incognito).

### Group your steps

Grouping your login steps will allow reuse of these steps for the other tests.\
Learn how to group your login steps [here](/docs/groups/groups).

Note: Make sure you give your group a meaningful name.

![640](/images/miscellaneous/best-practices-for-handling-logins/4dfa1e2-Oct-20-2020_11-42-25.gif "Oct-20-2020 11-42-25.gif")

### Deal with a situation where you are already logged in

For this, we'll add a condition, which determines at run-time whether the step should be executed or not.\
E.g. the test should work when you're already logged and also when login is required.

These are a few options for common conditions in the login scenario:

1. Check if a login button is visible - use element condition.
2. Check the current URL if it matches a login page - use custom condition.

![640](/images/miscellaneous/best-practices-for-handling-logins/535c34a-Oct-20-2020_11-47-18.gif "Oct-20-2020 11-47-18.gif")

Learn about how to add [conditions](/docs/conditions/conditions).

### Add parameters

If we want to make this group more generic and allow for each reuse of the group to use different certificates, we would like to add parameters for the username and password.

1. Go to the group properties panel (select the group and open the property panel).
2. Add two JavaScript parameters - username, password
3. Set the values for this parameters
4. Enter the group steps.
5. Change the set username step, and set password step and put these parameters instead of the constants values.

![640](/images/miscellaneous/best-practices-for-handling-logins/cfbed43-Oct-20-2020_11-51-43.gif "Oct-20-2020 11-51-43.gif")

Learn more about adding [parameters to a group](/docs/parameters/parameters-for-groups).

Now, whenever you use this group, you can set up different credentials.

### Clean your test

When we create a test, some of the steps that we recorded as a manual user may not be relevant to the automatic test. For example, pressing "Tab" between text fields, clicking on a text field to input data. These steps can be deleted.

1. Clear unnecessary steps. [Learn more](/docs/steps-editing-tests/editing-your-tests) on how to delete steps.
2. Run again to make sure you have not deleted anything you need.
3. Save again.

Be careful, in some applications these steps are required because they do more than just focusing on the field.
