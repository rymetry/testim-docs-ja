# Mocking network traffic using a HAR file

The mock network responses can be based on a HAR file. The HAR file is a JSON-formatted archive file format for logging of a web browser's interaction with a site. All the HTTP calls and responses are recorded in this file. Each request is processed by its order in the HAR file. Multiple instances of the same call can result in different responses. For example, the first call may return X, while the second call may return Y. Testim will automatically use the relevant data in the HAR file as the test run is being executed.
There are two options for creating a HAR file:

* **Option 1 – Using Testim to create the HAR file** – in this option you will have to create your test \<add link> and then run it once (with the "Include full network in HAR" setting). When running the test in Testim, a HAR file is created. Testim will use this HAR file to create mock network responses in subsequent runs of the same test. When running the test again, for which you want the mock network responses, you will need to specify that you want to use the HAR file that was recorded by Testim.
* **Option 2 – Creating your own HAR** – using Chrome dev tools you can create your own HAR file and save it in a location that is accessible via URL. When running the test, for which you want the mock network responses, you will need to specify that you want to use your own HAR file and its location.

> 🚧 Tests that include a login process
>
> If your test includes a login process, which involves passing credentials to a server, it may not work properly when running the test on the mock network, as the login request will be timed out. To solve this issue, you should enable Pass-through Authentication when sending the login request. To do so, you will have to add a mapping file with the login request and the enabled Pass-through authentication property. For detailed instructions see **[Uploading the mapping file](https://help.testim.io/docs/creating-a-mapping-file#section-uploading-the-mapping-file)**.

## Option 1 - Using Testim to create the HAR file

:fa-arrow-right:**To create a HAR file in Testim:**

1. After saving your test (See [How to Record a Test](https://help.testim.io/docs/how-to-record-a-test)), click the Properties (:fa-cog:) icon. The **Test Properties** pane is displayed:

![258](https://files.readme.io/ba55bd3-mock1.PNG "mock1.PNG")

2. In **Mock Network** property, click the arrow to open menu options.
3. Click **Record New HAR**. The test will run locally and the HAR file will be created automatically.

![264](https://files.readme.io/1192e87-mock5.png "mock5.png")

4. When the process finishes, click **Save**.

![436](https://files.readme.io/4d5a0c7-mock4.PNG "mock4.PNG")

## Option 2 - Creating your own custom HAR file

:fa-arrow-right:**To create your own HAR file:**

1. Open Google Chrome.
2. In Chrome, go to the webpage that you want to use in your test.
3. Select the **Chrome menu > More Tools > Developer Tools**
4. Select the **Networks** tab.
5. Within the **Networks** tab, select **Preserve log** option.

![715](https://files.readme.io/99eaa6e-preserve_log.png "preserve_log.png")

6. Record the log by selecting the red circle at the top left of the **Networks** tab.
7. Refresh the page and allow Chrome to record browser-website interaction.
8. Once the page is loaded, select the **Console** tab and right-click in the console box. A menu is displayed.
9. Select **Save as** and name the file.

![559](https://files.readme.io/8624d01-consolesave.png "consolesave.png")

10. Go back to the **Networks** tab and right click on any item in the **Name** column.
11. Select **"Save HAR with content"**.

<Image width="smart" src="https://files.readme.io/64ef4f1-saveallhar.png" />

The log and HAR file will be saved.

## Uploading your custom HAR file.

:fa-arrow-right:**To upload your custom HAR file:**

1. In the **Test Properties** pane, click **Upload Custom HAR**.

![254](https://files.readme.io/fc7237d-mock3.png "mock3.png")

2. Locate the custom HAR file that you saved and click **Open** to upload it.

## Running your test using the HAR file

:fa-arrow-right:**To run your test using the HAR file:**

1. In the Testim Visual Editor, go to the **Test List** screen and click a test for which you have recorded anew HAR or uploaded a custom HAR.
2. In the Test Editor screen, a **Mock Network** icon will be displayed next to the **Play** button, indicating that the Mock network is available.

![274](https://files.readme.io/7a3343e-mock6.png "mock6.png")

3. Click the **Play** button to run the test using the mock network.
4. Click **Save**.