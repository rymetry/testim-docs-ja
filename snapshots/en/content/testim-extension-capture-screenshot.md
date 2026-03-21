# Testim Extension - Capture Screenshot

The Testim Extension Capture Screenshot feature can be used to capture a screenshot of a web page, add annotations (e.g. arrows, texts, etc.), and send it as a bug/issue to your bug tracking system, such as Jira, Slack, Trello, and Github.\
To submit the bug to your bug tracker you must first connect Testim to your bug tracking system – To learn more see \<add ref to Bug Tracker Settings page>.\
The Capture Screenshot feature requires downloading the Testim Extension. To download the Testim Extension – [click here](https://chrome.google.com/webstore/detail/testim-editor/pebeiooilphfmbohdbhbomomkkoghoia).

## Capturing the screenshot and annotating it

:fa-arrow-right: To capture the screenshot and annotate it:

1. On your web browser, navigate to the web page that you want to capture and click the **Testim Extension** icon.
2. If you are not logged in to Testim, click **Login** To **Start**. If you were already logged in, proceed to step 5.
3. Complete the login process in the new tab that opens and return to the previous tab.
4. Click the **Testim Extension** icon again.\
   The extension menu opens.

![425](https://files.readme.io/9919332-Testim_extension.PNG "Testim extension.PNG")

5. Click **Capture Screenshot**.\
   The screen will be frozen, and the annotation toolbar appears.

![620](https://files.readme.io/92260ba-annotation_toolbar.PNG "annotation toolbar.PNG")

6. Use the following annotation tools to annotate the screenshot (from top to bottom):

* **Add arrow** – select this option and then click and drag to draw an arrow, which can be used to point on something on the screen. You can use the color selector to change color.
* **Add text** – select this option and then click anywhere on the screen to add a text box. Then type your text, while replacing the placeholder text. You can use the color selector to change color.
* **Add rectangle** – select this option and then click and drag anywhere on the screen to create a rectangle, which can be used to mark something on the screen. You can use the color selector to change color.
* **Color selector** – select this option to select a different color for all the annotation elements.
* **Discard** – select this option to discard this screenshot/bug report.

7. At this point you can submit the bug to your bug tracker by following the instructions below.

## Submitting the bug to your bug tracker

:fa-arrow-right: **To submit the annotated bug to your bug tracker:**

1. Make sure you have connected Testim to your bug tracker. To learn more - \<add ref>
2. After annotating the screenshot, on the annotation tools toolbar, click Publish.

![620](https://files.readme.io/a636079-publishbutton.png "publishbutton.png")

3. Depending on the bug tracker system that you connected to, you will see a different form to fill out with the bug information. Fill out the form based on the description below and then click Publish.

![3107](https://files.readme.io/403ffb7-trelloformwithcallouts.PNG "trelloformwithcallouts.PNG")

The form includes the following elements:

* **Switch between bug tracker systems** – click to the cog icon to open the Bug Tracking Settings dialog. To learn more see - \<link to Bug Tracking Settings>
* **Testim automated test** – an automated test with a single step is automatically created in Testim and the link to this test is included in the issue/bug report. Click to access the test in Testim.
* **Screenshot** – the screenshot that was captured is included in the issue/but report.
* **Location in Trello** – specify the exact location in Trello in which the issue/bug will be reported.
* **Issue details** – In the Summary field, edit the title for the issue/bug. The Description field includes details on how to reproduce the issue/bug. You can edit and add more details.