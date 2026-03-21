# Bitbucket Integration

Manage your Bitbucket branches in Testim

Bitbucket is a web-based version control repository hosting service by Atlassian, for source code and development projects that use either Mercurial or Git revision control systems.\
Testim's Bitbucket integration allows you to automatically mirror in Testim the version control functions performed in Bitbucket, so your test versions match the versions managed in Bitbucket. Branches that are created in Bitbucket will be also automatically created in Testim, under the same name. Merging branches in Bitbucket will automatically merge the branches in Testim.\
Read more Testim branches [here](https://help.testim.io/docs/version-control-branches).    

### Setting Bitbucket integration

This process is required only once.\
:fa-arrow-right: **To enable the Bitbucket integration:**

1. In Testim, go to **Settings** > **Integration** tab.
2. Under Bitbucket,  click the "**login**" link.

![934](https://files.readme.io/6b41669-Screen_Shot_2020-12-31_at_11.48.08.png "Screen Shot 2020-12-31 at 11.48.08.png")

3. Click "**Grant Access**" button. 

![1099](https://files.readme.io/a509649-Screen_Shot_2020-12-31_at_11.36.31.png "Screen Shot 2020-12-31 at 11.36.31.png")

4. Select the repository to connect to. This operation requires  admin access to the repositories.

5. Select the checkboxes with the desired actions:

   * **Create**: Whenever a branch is created in Bitbucket, a branch will be also created in Testim.

   * **Merge**: Each time Bitbucket branches are merged, Testim will automatically merge your tests.

![970](https://files.readme.io/58d1cac-Screen_Shot_2020-12-31_at_11.49.03.png "Screen Shot 2020-12-31 at 11.49.03.png")

## Using Bitbucket with Testim

At this point the Testim project/repository will mirror your Bitbucket repository, so if you want to create a new branch or make a Pull Request and then merge, you should do it in Bitbucket only.

### New branch example

In the following example, we have created a new branch in Bitbucket called demo-bb-integration.

![936](https://files.readme.io/e44f3b2-create1.PNG "create1.PNG")

The same branch is automatically created in Testim (which is forked from the Master) and includes all the tests that were in the Master.

![604](https://files.readme.io/79fbdde-branchintestim.png "branchintestim.png")

> 📘 If you have created a branch in Bitbucket, in Testim the same branch will always be based on the Master branch. This means that if you want to mirror the branch structure on both sides, make sure the Pull Request is based on the Master branch and not another (non-master) branch.

### Pull Request and Merge

In the following example, we have made a change in one of the files in Bitbucket and initiated a Pull Request, which will be created in a new branch (pr-branch).

> 📘 Although in Bitbucket it is possible to merge without a Pull Request, only merges which are part of a Pull Request will be mirrored in Testim.

![1046](https://files.readme.io/dd5c4c5-pullrequest.PNG "pullrequest.PNG")

The same branch is automatically created in Testim.

![433](https://files.readme.io/4bf04a3-pr2.png "pr2.png")

After the branch is created in Testim, we can also update one of the tests to reflect the changes in the code. At this point we are ready to merge the pull request in Bitbucket.

![526](https://files.readme.io/edde410-pr3.PNG "pr3.PNG")

The same merge will also occur in Testim and tests that were part of `pr-branch` (with all the changes) will be merged into the Master branch in Testim.