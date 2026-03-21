# Editing Tests

Learn how to edit an existing test - Add new steps, copy & paste, delete steps and modify steps.

After a test is created, you can edit it by adding or deleting new steps at any location within the test. You can also modify existing steps by editing the **Properties** panel.

## Adding/Removing Steps

You can add new steps to an existing test either at the end of the test, or at a specific location between steps. The new steps can be added in the following ways:

* By recording them in the AUT (Application Under Test)
* By manually creating them
* By copying & pasting them from somewhere else

## Record Additional Steps

You can add additional steps to the end of your test or between current steps by recording them in the AUT browser.

### Recording additional steps at the end

:fa-arrow-right: **To record additional steps at the end of your current test:**

1. Click on the **Toggle Recording** icon (in the top bar) to start recording.

<Image align="center" width="smart" src="https://files.readme.io/ee755a1-Screen_Shot_2021-03-13_at_8.31.14.png" />

The AUT browser opens with a message that your test is being recorded.

<Image align="center" width="smart" src="https://files.readme.io/934bfe8-Testim_Editing_Tests_002.png" />

2. Record the new steps in your test just as you would if you were recording a new test. See [Recording the test](https://help.testim.io/docs/how-to-record-a-test#step-4---recording-the-test) on the **How to Record a Test** page.
3. Click the **Stop Recording** button when you have completed recording your new steps.

<Image align="center" width="smart" src="https://files.readme.io/b363dcb-Testim_Editing_Tests_002a.png" />

You are redirected to the Editor, and the new steps are appended to the end of your test.

### Recording additional steps between existing steps

:fa-arrow-right: **To record additional steps between two currently existing steps:**

1. Hover over the **> (arrow symbol)** between the two steps.

![](https://files.readme.io/21b115d-Screen_Shot_2021-03-13_at_8.33.46.png "Screen Shot 2021-03-13 at 8.33.46.png")

The action options are displayed.

<Image align="center" width="smart" src="https://files.readme.io/7f67500-Testim_063a_r.png" />

2. Click on the **red circle** (Record actions here).\
   The AUT browser opens with a message that your test is being recorded.

<Image align="center" width="smart" src="https://files.readme.io/804671e-Testim_Editing_Tests_002.png" />

3. Record the new steps in your test just as you would if you were recording a new test. See [Recording the test](https://help.testim.io/docs/how-to-record-a-test#step-4---recording-the-test) on the **How to Record a Test** page.
4. Click the **Stop Recording** button when you have completed recording your new steps.

<Image align="center" width="smart" src="https://files.readme.io/b8334cb-Testim_Editing_Tests_002a.png" />

You are redirected to the Editor, and the new steps are inserted between the two steps you selected.

## Copy & Paste Steps

Any step, group of steps, or group step can be copied and pasted to any location in your test or another test.

### Copying a step

:fa-arrow-right: **To copy a step, group of steps, or group step to the clipboard:**

1. Select the step(s) you would like to copy by clicking and dragging around the step(s), or by holding down the CTRL/CMD key and clicking on each step you would like to copy. The selected steps are highlighted in blue.

<Image align="center" width="smart" src="https://files.readme.io/0a39c28-Screen_Shot_2021-03-13_at_8.35.15.png" />

Note: after you drag and drop a step in the editor, you will be able to undo, by clicking on the toast message.

![](https://files.readme.io/d49ea2e-Jun-22-2021_12-49-24.gif "Jun-22-2021 12-49-24.gif")

2. While the steps are selected, click the **Copy** icon (in the top bar).

<Image align="center" width="smart" src="https://files.readme.io/20492f6-Screen_Shot_2021-03-13_at_8.35.15.png" />

The step, group of steps, or group step is copied to the clipboard. To paste your copied step(s), see the procedure below.

### Cutting a Step

:fa-arrow-right: **To copy one or more steps or a group step:**

1. Select one or more steps by holding the CTRL/CMD key on your keyboard and clicking the steps in your test.

![](https://files.readme.io/6c1bb09-selectsteps.jpg "selectsteps.jpg")

2. Click the **Cut** button in the action menu or CTRL/CMD + X on the keyboard.

![](https://files.readme.io/77bcbbb-cut.jpg "cut.jpg")

> 📘 Note:
>
> You are only able to cut and paste a step within the same test.

### Pasting a step

:fa-arrow-right: **To paste a step, group of steps, or group step:**

1. After copying or cutting the desired step(s) to the clipboard, hover over the **> (arrow symbol)** between the two steps where you want to paste your steps.

![](https://files.readme.io/94b6988-Screen_Shot_2021-03-13_at_8.33.46.png "Screen Shot 2021-03-13 at 8.33.46.png")

The action options are displayed.

<Image align="center" width="smart" src="https://files.readme.io/86a1156-Testim_065a_r.png" />

2. Click on the **Paste copied steps** icon.

![](https://files.readme.io/3da2ad6-Testim_066.png "Testim 066.png")

The step(s) are moved from their original location and pasted into the Editor at the location you specified.

<Image align="center" width="smart" src="https://files.readme.io/340d1b6-Screen_Shot_2021-03-13_at_8.37.37.png" />

> 📘 Note:
>
> If you click the paste button in the action menu without selecting a location, the step will be pasted to the end of the test.

## Manually Create Additional Steps

There are many types of steps that can be manually created. For more information, see additional articles under **Editing Tests** and under **Advanced Editing**.

### Creating a step manually

:fa-arrow-right: **To manually create a step:**

1. Hover over the **> (arrow symbol)** where you want to add your step.

![](https://files.readme.io/0d951e6-Screen_Shot_2021-03-13_at_8.33.46.png "Screen Shot 2021-03-13 at 8.33.46.png")

The action options are displayed.

<Image align="center" width="smart" src="https://files.readme.io/64048e3-Testim_063a_r.png" />

2. Click on the **"M"** (Testim predefined steps) or the **folder** (Shared steps).\
   The *Predefined steps* menu or *Shared steps* menu opens.

<Image align="center" width="smart" src="https://files.readme.io/ab56d53-Testim_034_r.png" />

2. Choose one of the many options from the menus to create your desired step, and edit the step as described elsewhere in the documentation. For example, to add a custom action, see [Creating a Custom Action](https://help.testim.io/docs/custom-validations-and-actions#creating-a-custom-action).

## Deleting Steps

You have the option of deleting individual steps or multiple steps at once.

### Deleting an individual step

:fa-arrow-right: **To delete an individual step:**

1. Hover over the step and then click on the **Delete step** icon.

<Image align="center" width="smart" src="https://files.readme.io/2b05676-Testim_280a.png" />

2. Click **OK** in the Delete Step confirmation window that is shown.

<Image align="center" width="smart" src="https://files.readme.io/c733484-Testim_Editing_Tests_015a_r.png" />

The step is deleted.

### Deleting multiple steps

:fa-arrow-right: **To delete multiple steps:**

1. Select the steps that you would like to delete by clicking and dragging around the steps, or by holding down the CTRL/CMD key and clicking on each step you would like to delete. The selected steps are highlighted in blue.

<Image align="center" width="smart" src="https://files.readme.io/eeaf9d6-Testim_281.png" />

2. Use one of the following options to delete the selected steps:

* Press **Backspace** on your keyboard.
* Press **Delete** on your keyboard.
* Click the **Delete** icon in the top bar.

<Image align="center" width="smart" src="https://files.readme.io/43d0fde-Testim_281a.png" />

3. Click **OK** in the Delete Steps confirmation window that is shown.

<Image align="center" width="smart" src="https://files.readme.io/8ab7d5b-Testim_Editing_Tests_014a_r.png" />

The selected steps are deleted.