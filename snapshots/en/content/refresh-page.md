# Refresh Page Step

Adding a refresh step to your test

Some web pages require you to refresh in order to view updates to the page. This happens when the web page is updated on the server, but the browser doesn't show the change yet.

The "Refresh" step sends a new request to view the page and its latest version in the browser. The step will wait for the browser to finish downloading the HTML, CSS and scripts contents before moving on to the next step.

## Add a Refresh Step to the Current Browser Tab

By default, the "Refresh" step will refresh the current tab the test is running on. If you want to enable "Refresh" on a new tab/browser window (e.g. multi-tab test), you will need to use the a "Custom" step instead, as explained in [the next section](#add-a-refresh-step-to-a-new-browser-tab-multi-tab-test).

:fa-arrow-right: **To add a Refresh Step to the current browser tab:**

1. Navigate to **Test List > Tests** and open your test.
2. Hover the **arrow** in between existing steps or the **+ button** after the last step.

![736](https://files.readme.io/2fd7412-step-arrows.jpg "step-arrows.jpg")

3. Select the **Testim Predefined Steps** button.

![563](https://files.readme.io/6b1e396-predefined-steps.jpg "predefined-steps.jpg")

4. Search for **Refresh** in the quick search or expand the **Actions** section and select the **Refresh** action.

![646](https://files.readme.io/38ff664-refresh-step.jpg "refresh-step.jpg")

The new Refresh step is added to your test at the location you selected.

![1033](https://files.readme.io/0a5d62a-refresh-step-added.jpg "refresh-step-added.jpg")

## Add a Refresh Step to a New Browser Tab (Multi-Tab Test)

You can add a step that opens the current URL in a new browser tab, essentially refreshing the current page in a new tab.

:fa-arrow-right: **To add a Refresh Step in a new browser tab:**

1. Navigate to **Test List > Tests** and open your test.
2. Hover the **arrow** in between existing steps or the **+ button** after the last step.

![736](https://files.readme.io/90cd426-step-arrows.jpg "step-arrows.jpg")

3. Select the **Testim Predefined Steps** button.

![563](https://files.readme.io/634daca-predefined-steps.jpg "predefined-steps.jpg")

4. Search for **Custom** in the quick search or expand the **Actions** section and select **Add Custom Action**.

![640](https://files.readme.io/b4a9625-add-custom-action.jpg "add-custom-action.jpg")

5. Insert a **Name** for your new step.
6. Indicate if want the step to be a **Shared Step**, which will make the step available to be reused in the current test and other tests.
7. Select the **Shared Step Folder** to identify the location where the shared step should be stored.
8. Click the **Create Step** button.

![727](https://files.readme.io/bf7b3ed-shared-step.jpg "shared-step.jpg")

9. A JavaScript editor will open. In the editor enter a JavaScript code for refreshing the page on a new tab.

10. The Window interface's method loads the specified resource into the new browsing context (window, or tab) with the specified name.

```javascript
var window = window.open(url, windowName, [windowFeatures]);
```

**Example:**

```javascript
var win = window.open("d/1UhvH-KJl--mqvQVrzcmnOsE8VX3pvw/edit", "name");
win.location.reload();
```

11. Click the **Back Arrow** to return to your test.

![830](https://files.readme.io/61a3a01-javascript-editor-back-arrow.jpg "javascript-editor-back-arrow.jpg")

The new custom action step is added to your test at the location you selected.

![864](https://files.readme.io/1c953fc-custom-action-step-added.jpg "custom-action-step-added.jpg")

## Edit a Refresh Step

You can further customize how a Refresh Step should behave be editing the step properties after the step has been created.

:fa-arrow-right: **To edit an existing Refresh Step:**

1. Hover over the Refresh Step in your test and click the Properties icon.

![275](https://files.readme.io/548bdd1-refresh-step-hover.jpg "refresh-step-hover.jpg")

2. Update the properties based on your desired behavior.

   * **Description** - change the name of the step.
   * **When this step fails** - specify what should happen if the step has failed.
   * **When to run step** - specify when this step should be included in the test. Conditions may include the existence of an element/element text, or a custom JS function.
   * **Override timeout** - keep waiting until the refresh occurs even after timeout.