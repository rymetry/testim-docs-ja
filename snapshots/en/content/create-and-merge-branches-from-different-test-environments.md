# Create and merge branches from different test environments

Each Test Environment in Testim for Salesforce is configured with the following settings:

* The URL of the related Salesforce environment
* The branches that the Test Environment is available on.

<Image align="center" src="https://files.readme.io/5f39d87-branch.png" />

If you want to run your test on a different Test Environment, you will need to create a new branch and select a different Test Environment.

Tests are run on a single Test Environment for each branch. Several branches can have access to the same Test Environment.  All branches extend from one trunk or main branch, called the master. After creating your test on a branch, you can  merge it to the master branch.

# Creating a branch

:fa-arrow-right:**To create a new branch:**

<Image align="center" src="https://files.readme.io/8d71d98-newbranch.gif" />

1. In your Testim for Salesforce, select the **New Branch** icon.
2. In the **New branch name** field, enter a name for the branch.
3. In the **Salesforce environment** field, select a Salesforce environment from the drop down menu
4. Click **OK**.\
   You can see all branches under Salesforce > Environments. They're also available in the branch search drop-down at the top of the screen.

# Merging a Branch

:fa-arrow: :fa-arrow-right: **To merge a branch:**

<Image align="center" src="https://files.readme.io/2c34ad0-mergebranch.gif" />

1. In Testim for Salesforce, in the branch search dropdown, select the branch you want to merge.
2. Click the merge icon.\
   The Merge Branch dialog is displayed.
3. Review the changes before merging.
4. If you want to delete the branch after the merge, select the **Delete branch\<branch\_name> upon merge** checkbox.
5. Click **Merge**.