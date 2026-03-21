# Drag & Drop Step

Learn how to record and modify Drag & Drop steps in your tests

Drag & Drop interactions are automatically recorded when recording a test.

:fa-arrow-right: **To add a Drag & Drop step to your test:**

1. Create a new test and click the **Record** button on the action menu.

![](https://files.readme.io/99455e3-record-button.jpg "record-button.jpg")

2. Navigate to your app or page and use the drag & drop function.

> 📘
>
> Elements cannot be dragged and dropped between tabs/frames.

![](https://files.readme.io/33256cf-dd1.gif "d\&d1.gif")

Testim will automatically add the drag & drop step to your test.

![](https://files.readme.io/62957a2-drag-step-added.jpg "drag-step-added.jpg")

## Modify the "Drop" Target

By default, when you run a test with a drag & drop step, the dragged element will be dropped at the same page location as the original recording. However, once a drag & drop step is created, you can update the step to have the element dropped at any page location.

:fa-arrow-right: **To modify the drop target:**

1. Select the **Drag** test step.

![](https://files.readme.io/6709e58-drag-step-added.jpg "drag-step-added.jpg")

2. Click **Show Step Properties** in the action menu.

![](https://files.readme.io/37573df-show-step-properties-gear-icon.jpg "show-step-properties-gear-icon.jpg")

3. Select **Drop on specified Element**.

![](https://files.readme.io/5630460-drop-specified-element.jpg "drop-specified-element.jpg")

4. Confirm you want to **Change Drag Step**.

![](https://files.readme.io/08d55e3-change-drag-step.jpg "change-drag-step.jpg")

5. Testim will instruct you to navigate to your page/app. **Click on the page location** where you would like the element to be dropped in the test.

![](https://files.readme.io/dd0132c-page-element.jpg "page-element.jpg")

6. Testim will update the drag & drop test step to drop the element at the newly defined location.

![](https://files.readme.io/1fa8fad-dragged-element-updated.jpg "dragged-element-updated.jpg")

7. To modify the drop location again, navigate to the **Step Properties**, hover over the current **Dropped on element** setting, and click the **Reassign** link.

![](https://files.readme.io/00c87cf-reassign-link.jpg "reassign-link.jpg")

<br />

## Use Native events

In the **Native Events** section, you can overwrite the default setting of how a Drag and Drop step will be handled with another setting just for this test configuration. By default, at the project level, the Drag and Drop steps are configured to use either native or non-native events.

To enable or disable the **Native Events** execution, follow these steps:

1. Open your test case and navigate to the drag & drop step you want to edit.
2. Click the **Show properties** icon for that step.
3. In the **Properties** menu, select the **Native events** checkbox to enable it.

   ![](https://files.readme.io/dbac9aacb128114426ba61dd72d1c2f624c5efd26ccbffaf03a4acff99568b49-image.png)
4. To disable it, unselect the checkbox.

> 📘
>
> As this solution leverages **Native events** through a Chrome extension, it is available only on Chrome and Edge browsers.
>
> Please note that this functionality isn't supported on Firefox and Safari, and it does not function in Selenium mode for these browsers.