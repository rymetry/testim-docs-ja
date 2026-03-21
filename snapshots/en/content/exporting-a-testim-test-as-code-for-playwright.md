# Exporting a Testim test as code for Playwright

You can export a Testim test as code that is adapted for Playwright. The export process involves adding a suffix to the URL of the test when it is open on the Editor.

> 📘
>
> Due to the technological differences, the code may require some additional manual adjustments, as instructed in the code comments. Some of the steps may not be supported.

:fa-arrow-right:**To export a Testim test as code for Playwright:**

1. Open the test in the Editor.
2. On the browser, add the following suffix to the end of the URL and press **Enter**.
   ```
   ?embedMode=true&exportPuppeteer=true&exportSelenium=true&exportPlaywright=true
   ```

The test's code is displayed in a code viewer. Make sure the **Playwright** tab is selected.

<Image align="center" src="https://files.readme.io/5d19af1194424f103422403fef7ce0cc708c0c062dd842330871f6e525c963ad-playwright1.png" />

3. Click **Copy code** to copy the displayed code.