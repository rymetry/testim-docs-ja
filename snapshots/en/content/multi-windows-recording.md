# Recording in multiple windows

Record scenario that involves new tabs, pop-up windows or new opened windows

Recording multiple pages is required when you need to create a test that contains links that open in a new tab or pop-up window. By default, when you create a new test, any action you make is recorded automatically if it derives from the initial recorded page.

**For example**: Let's say you want to create a test for your company's "Contact us" page.

![1412](https://files.readme.io/3335429-Screen_Shot_2021-08-26_at_9.38.12.png "Screen Shot 2021-08-26 at 9.38.12.png")

The page contains a form and also links to the company's social media pages: YouTube, Twitter, Linkedin & Facebook.

![1403](https://files.readme.io/06a6583-Untitled.png "Untitled.png")

​Any of those links are opened in a new tab. If you'd click them while "Contact us" page was recorded, any interaction you'd take in these tabs would have been recorded too.

![1236](https://files.readme.io/2bf79c2-Screen_Shot_2021-08-26_at_10.01.39.png "Screen Shot 2021-08-26 at 10.01.39.png")

## Custom steps (JavaScript)

When using custom actions with multiple tabs, by default, the step will run in the context of the first tab of the recording.\
If you need to run in the context of another tab, add an [HTML parameter](https://help.testim.io/docs/parameters-in-custom-javascript-steps) to that step.

You can use the custom step to open a new tab, see [here](https://app.testim.io/#/project/GYXR2qZC/branch/master/test/iKXZ6Ic8Xo) for an example.

> 🚧 Note
>
> Steps will run on the tab they were recorded on, for example, if the steps were recorded on tab# 2 and then the test is running these steps on tab# 3, it will try to run them on tab# 2).

## My new window is blocked. What can I do?

If your test involves opening of a new window ("pop-up") and it was blocked during running the test locally, the address bar will be marked Pop-ups blocked

![16](https://files.readme.io/c2a1040-XwfWobfXD_zcXU4tEwzxHPuK6dTTPG200fLzsZU7QcguWbIQzm4tk7sLDutpAUWFMAh18.png "XwfWobfXD_zcXU4tEwzxHPuK6dTTPG200fLzsZU7QcguWbIQzm4tk7sLDutpAUWFMA=h18.png")

You will probably notice this blockage the first time you run the test. The browser will detect an automatic click and will block the new tab/window. You will need to enable the popup in your browser only in the first run.\
​

## Allow pop-ups through the address bar (while the test is running)

:fa-arrow-right: **To allow pop-ups through the address bar:**

1. On your computer, open **Chrome**.
2. Find the page for which the pop-up has been blocked.
3. In the address bar, click **Pop-ups blocked**.
4. Click the **link** for the pop-up window you'd like to see.
5. To always see pop-ups for the site, select **Always show pop-ups from\[site]**

## Allow pop-ups through Chrome settings:

:fa-arrow-right: **To allow pop-ups through Chrome settings:**

1. On your computer, open Chrome.
2. At the top right, click **More**.
3. Click **Settings**.
4. At the bottom, click **Show advanced settings**.
5. Under "Privacy," click **Content settings**.
6. Under "Pop-ups," select an option: **Allow all sites to show pop-ups**

> 📘 Incognito mode
>
> If you run your tests in incognito mode, the browser will not remember that you have authorized Testim and will block the new tab/window in each run. If you have multiple tabs/windows, we recommend not running in incognito mode.\
> ​

## Reviewing multi-windows test results

When a test is executed on multiple windows or tabs, each step will have a numeric indication of the window/tab the step was executed in, for example, the following step was executed on the second tab:

![424](https://files.readme.io/76fe2d0-Screen_Shot_2021-08-26_at_10.03.37.png "Screen Shot 2021-08-26 at 10.03.37.png")

> 📘 In case of multi tab application, when a step is recorded, the specific tab (e.g., tab #3) is stored. When the step is played, as part of test run, the Testim application looks for the tab based on two parameters: tab number and tab URL. The decision to run on a specific tab is based on these two parameters – so, the actual playing can result in a different tab number (e.g. tab #2) if both tabs URLs are identical.

In order to see the screenshot of the step, you can click on the screenshot icon on the step. When a test fails, images of all tabs will be available :

![2842](https://files.readme.io/8da0203-Screen_Shot_2021-08-26_at_10.06.50.png "Screen Shot 2021-08-26 at 10.06.50.png")

## To conclude

Any interaction will be recorded even if it was taken in a new tab, a new window or a new modal.\
Needless to say, Testim also playbacks the scenario on the right window.