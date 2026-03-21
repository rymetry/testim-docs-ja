# Revisions

All your previous test versions are always available

Every time you make a change to a test and save it, the version of the test before the change is automatically stored. Each of these versions of the test is called a revision.\
Revisions gives you the power to always look back at your changes and revert back to an older revision.

## How are revisions created?

Revisions are created automatically. You don't have to do anything.\
In the following example there is a test called "login\_test", in which the step that sets the password was updated. After saving the test, the following dialog is displayed, prompting to optionally specify the purpose of the change:

![1707](https://files.readme.io/4bf97f1-change_message.PNG "change_message.PNG")

Click **OK**, and that's it! a new revision is created.

## Viewing the test revisions

:fa-arrow-right: **To see the all the revisions of a test:**

1. Click on the **Test Properties** (:fa-cog:).
2. Click **See old revision**.\
   A list of revisions is displayed, containing the change message, the name of the user who made the change, and date in which it was made:

![1920](https://files.readme.io/0930cee-revisions.gif "revisions.gif")

## Automated revisions following a Locator’s auto-improve process

Testim automatically creates a new revision after it replaces a degraded locator with an auto-improved locator. The new revision is labeled in the **Revision History** panel as “Testim auto improve”. For more information, see [Locators: Auto Improve](https://help.testim.io/docs/locators-auto-improve). You can also view which steps in a test have been auto-improved.

![2454](https://files.readme.io/4cf4abe-Testim_478a.png "Testim 478a.png")

:fa-arrow-right: **To view which steps have been auto-improved:**

1. Open a test that has been auto-improved.
2. Toggle the **Show improved steps** switch to the right.

![3807](https://files.readme.io/cadf2a8-Testim_585b.png "Testim 585b.png")

The steps that have been auto-improved are highlighted.

## Accessing a previous revision

To view a revision, simply hover the revision you want to view, and click **View**:

![1920](https://files.readme.io/55ba93b-revisions2.gif "revisions2.gif")

## Reverting to a previous revision

To revert to a previous revision, access the previous revision and click **Save**.

![1920](https://files.readme.io/a59b3e9-revisions3.gif "revisions3.gif")

## Tests with shared step

Shared steps (e.g. a group step, or one of the custom Javascript steps) may be changed in a different test. If you use a shared step that was changed in another test, you will also see this change in the revisions list.

![732](https://files.readme.io/0b89bb9-shared.PNG "shared.PNG")

> 📘
>
> If you're in a custom JavaScript step and want to revert to an old version, you'll need to step out and re-enter the step to view a previous version.

## Reverting changes with a shared step

If you choose to open an older revision of the test, it will also open the older revision of the shared steps that were being used in that revision. So, if a shared step was changed while saving previous revision, all of the instances of the folder will be affected too.

![1472](https://files.readme.io/61b8751-revert.PNG "revert.PNG")