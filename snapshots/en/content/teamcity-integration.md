# TeamCity integration

![455](https://files.readme.io/6a3c92e-4pro3hwiQxCVNwY6QQXg_teamcity-logo.png "4pro3hwiQxCVNwY6QQXg_teamcity-logo.png")

In order to integrate your tests with TeamCity, first you need to have node.js (12.13+ ,14.15+ and 16.13+) installed on the TeamCity machine or one of its slave machines.

## Now, just follow these steps:

1. Create a New Build Step in your project:

![1242](https://files.readme.io/6bdc599-irViLY05QOSHdya5bXqR_06-add-build-step.png "irViLY05QOSHdya5bXqR_06-add-build-step.png")

2. Choose "Command Line" runner type:

![887](https://files.readme.io/6e50ad2-gUJV3NuQS3mxZyjN9mM9_08-new-build-step-type.png "gUJV3NuQS3mxZyjN9mM9_08-new-build-step-type.png")

3. Set the Custom Script with the appropriate parameters, as described in the [CLI page](https://help.testim.io/docs/the-command-line-cli).\
   Here is the basic script template, containing the first part that makes sure you have the latest npm package, and the CLI command itself:

```shell
set -x
mkdir -p "%system.teamcity.build.workingDir%/.npm-packages"
prefix=%system.teamcity.build.workingDir%/.npm-packages
NPM_PACKAGES="%system.teamcity.build.workingDir%/.npm-packages"
export PATH="$PATH:$NPM_PACKAGES/bin"
export NODE_PATH="$NODE_PATH:$NPM_PACKAGES/lib/node_modules"
npm config set prefix %system.teamcity.build.workingDir%/.npm-packages
npm install -g @testim/testim-cli
set +x
%system.teamcity.build.workingDir%/.npm-packages/bin/testim \
 --label "<YOUR LABEL>" \
 --token "<YOUR ACCESS TOKEN>" \
 --project "<YOUR PROJECT ID>" \
 --grid "<Your grid name>" \
 --reporters teamcity,console
```

![1010](https://files.readme.io/8360a86-xkywkbTDRDiv6XSRI8zk_09-new-build-step-form-full.png "xkywkbTDRDiv6XSRI8zk_09-new-build-step-form-full.png")

In order for TeamCity to store, analyze and show the results, Testim generates a unique TeamCity report format which is automatically recognized:

![1042](https://files.readme.io/947a4f9-byvxlS1TKuodnownVWwg_10-build-results.png "byvxlS1TKuodnownVWwg_10-build-results.png")

**Note:**

1. You can see its progress test-by-test as they are executed!
2. For the grid name, read [here](https://help.testim.io/docs/grid-management) how to set up your grid.
3. When using the arguments  **--reporters teamcity, console --retries** combined, even if a test passed on a retry, teamcity will record both the failed and passed executions and the build will be marked as failure even though the suite might pass.