# Codeship integration

![](https://files.readme.io/1328260-codeship1.png "codeship1.png")

## Project configuration

In order to integrate Testim with [Codeship](http://codeship.com/), go to your Test Settings under the Project Settings in your Codeship project:

![](https://files.readme.io/4c258cb-codeship2.png "codeship2.png")

## Run with local Selenium Grid

When you want to run your tests on your current built app in CodeShip, you'll need to run with local Selenium Grid. Add these lines to the setup commands section:

```shell
nvm install <use latest version supported by Testim>
npm install -g webdriver-manager
npm install -g @testim/testim-cli
```

And these lines to the Test Commands section (with your values):

```shell
webdriver-manager update
nohup bash -c "webdriver-manager start 2>&1 &" sleep 5
testim --project "<PROJECT ID>" \
       --label "<LABEL>" \
       --grid "<Your grid name>" \
       --base-url "<YOUR LOCAL WEB APP URL, e.g. http://localhost:3000>"
       --token "<TOKEN>"
​
```

![](https://files.readme.io/2e37bfe-codeship3.png "codeship3.png")

​## Run with external Selenium Grid\
When your app is deployed on a publicly available server, you can run your tests on an external Selenium Grid. In that case, you don't need the local Selenium Server (webdriver-manager), so just add these lines to the setup commands section:

```shell
nvm install <use latest version supported by Testim>
npm install -g @testim/testim-cli
```

​And these lines to the Test Commands section (with your values):

```shell
testim --project "<PROJECT ID>" \
       --label "<LABEL>" \
       --grid "<Your grid name>" \
       --token "<TOKEN>"
```

**Note**:  For the grid name, read [here](https://help.testim.io/docs/grid-management) how to set up your grid.