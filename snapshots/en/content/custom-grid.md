# Custom Grid

Run tests on your own selenium grid

This article will explain how to setup your own Selenium grid on Testim.

## How to add a Custom Grid

:fa-arrow-right: **To add a Custom Grid:**

1. Follow the instructions in the [Adding a grid](https://help.testim.io/docs/grid-management#adding-a-grid) section, while selecting the **Custom Grid** option as the **Grid Type**.
2. Click **Next**.
3. In the **Name** field, enter the name of your selenium grid.
4. In the **Host** field, enter the Selenium grid host name (domain) or IP.
5. In the **Port** field, enter the Selenium grid port.

> 📘 Even when running locally, Testim needs to connect to your browser to show and save test results. Please make sure your network can access [https://services.testim.io/](https://services.testim.io/).

![1280](https://files.readme.io/caabeca-2023-03-19_17-44-02.gif "2023-03-19_17-44-02.gif")

## How to run on the grid

You can run your tests remotely using one of the following methods:

[CLI](https://help.testim.io/docs/the-command-line-cli) / [CI](https://help.testim.io/docs/integrate-testim-to-your-ci)

Add --grid parameter with the grid name. 

[Scheduler](https://help.testim.io/docs/scheduler)

Use Grid field to choose on which grid to run your tests. 

[Test Plan](https://help.testim.io/docs/test-plans)

Use Grid field to choose on which grid to run your tests. 

### From the editor

You can run your test on the grid directly from the test editor. 

* Click on the options arrow next to the "**Run**" button
* Click on "**Run on a grid**".

To change the configuration/grid/base url for that run click on "**Edit**". 

![928](https://files.readme.io/0ca9bb7-Jul-21-2021_13-11-22.gif "Jul-21-2021 13-11-22.gif")