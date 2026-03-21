# Browserstack integration

Run tests you create with Testim on Browserstack

This article will review how to set your BrowserStack on Testim and how to run your tests.

## How to add a Browserstack grid

:fa-arrow-right: **To add a Browserstack Grid:**

1. Follow the instructions in the [Adding a grid](https://help.testim.io/docs/grid-management#adding-a-grid) section, while selecting the **Browserstack** option as the **Grid Type**.
2. Click **Next**.
3. Update the following fields:

* **Name**: The grid name to use at run time.
* **Host**: Browserstack host name. 
* **Port**: Browserstack port
* **Username**: Browserstack user name. 
* **Password/access key**: Browserstack access key to connect or password. 

![](https://files.readme.io/be4fb2b-Jul-24-2021_08-13-41.gif "Jul-24-2021 08-13-41.gif")

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

![](https://files.readme.io/0ca9bb7-Jul-21-2021_13-11-22.gif "Jul-21-2021 13-11-22.gif")

To pass more options to the test run , see the [Saucelabs & BrowserStack Options](https://help.testim.io/docs/saucelabs-browserstack-options).

> 📘
>
> Grid parameter replaces the old host and port parameters.