# Auto complete

The Auto Complete feature can help you expedite the test recording process, by using pre-recorded steps that were saved as shared groups. While recording a test, Testim will suggest a sequence of next steps based on existing shared groups. After clicking the desired suggestion, Testim will automatically perform the steps and save them in your test. You may resume the manual recording after the automated steps are performed.

> 📘 This is a PRO feature
>
> This feature is only open to projects on our professional plan. To learn more about our professional plan, click [here](https://www.testim.io/pricing/).

## Using the auto-complete feature

:fa-arrow-right: **To use auto-complete:**

1. Click **Record** to start recording your test. While recording the test, if there are relevant shared groups that can be used as next steps,  you will see a pop-up that says **Auto record your steps**  above the steps counter with a list of suggestions. These suggestions are shared groups you already have implemented in your project. The most relevant suggestion will appear at the top.
2. Hover your mouse above a suggestion name to see how many steps it contains.

![2033](https://files.readme.io/1f8c6ad-Untitled.png "Untitled.png")

3. Click on the desired suggestion to enable it. If the group includes parameters, you will be asked to name these parameters and provide their values before proceeding. You can click **Cancel** and continue recording manually or select another suggestion.

![2037](https://files.readme.io/479add8-Screen_Shot_2020-12-31_at_11.15.02.png "Screen Shot 2020-12-31 at 11.15.02.png")

The shared group step/s will be played-back in the AUT and you will see a progress bar showing the percentage the steps that have been recorded. Each recorded step will be indicated below the progress bar. After completion, the group will be added to the test.

![640](https://files.readme.io/91cda42-Dec-31-2020_12-04-09.gif "Dec-31-2020 12-04-09.gif")

4. After the suggestion is played back you may resume recording additional steps manually by clicking the **Record** button (with the steps counter).

> 📘 During the playback of the suggestion (shared group) do not to click/update anything in the AUT. Any interactions will not be recorded during playback.

## Auto complete settings

To turn off the suggestions entirely, go to Settings --> Project --> General, and turn off "Allow auto-complete suggestion"

![487](https://files.readme.io/7775a80-Picture13.png "Picture13.png")