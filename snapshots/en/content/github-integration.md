# GitHub integration

Manage your GitHub branches in Testim and publish bugs with Git Issues

Branches created in GitHub will automatically be created (same name) in Testim.\
Merging branches in GitHub will automatically merge in tests in Testim.\
Read more Testim branches [here](https://help.testim.io/docs/version-control-branches).    

GitHub integration also allows you to report bugs in Git Issues straight from your browser. All the relevant bug info will automatically be populated.\
Read more about capture bugs [here](https://help.testim.io/docs/bug-reporting) . 

### Setting GitHub integration

This process is required only once.

1. Navigate to "**Settings**", and then to "**Integration**" tab.
2. Click "**login**" to GitHub link.
3. Click "**Install**" button. 
4. Choose "**All repositories**" or select a specific repository. 
5. Click "**Install**" again.

![1511](https://files.readme.io/307ac62-gitHub2.gif "gitHub2.gif")

Define the repository to connect to and allow the desired actions.

**Create**: Whenever a branch is created in GitHub, a branch will also be created at Testim.

**Merge**: Each time GitHub branches are merged, Testim will automatically merge your tests.

### Note:

1. When a branch is created in Testim, the base will always be the Master and not the branch from which created in GitHub. This can affect when branch merges. 
2. Merge will be performed on pull requests action only and be merged to Master in Testim. 
3. To select repositories the user should have admin access to them.