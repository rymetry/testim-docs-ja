# Running tests on multiple browsers

Tests can run on different browsers in parallel to speed execution and confirm multiple configurations. They can run locally on only Chrome, or on Chrome and other browsers in supported grids including Testim's grid, 3rd party grids like Sauce Labs and Browserstack, or on your own internal Selenium-based grid.

The operating system running the browser will depend on the grid you are running.

**On what browsers and OS you can run your tests?**

| Browser       | Testim Grid   | Selenium Grid     | 3rd Party Grid    |
| :------------ | :------------ | :---------------- | :---------------- |
| Chrome        | Yes - Linux   | Yes - multiple OS | Yes - multiple OS |
| Firefox       | Yes - Linux   | Yes - multiple OS | Yes - multiple OS |
| Safari        | Yes - macOS   | Yes - macOS       | Yes - macOS       |
| Edge Chromium | Yes - Windows | Yes - Windows     | Yes - Windows     |

## How to run your tests on multiple browsers?

To run your tests on multiple browsers, you will need to run them using CLI or using [Scheduler](https://help.testim.io/docs/scheduler) instead of using the Testim Editor. In this article we will focus on running using CLI, see how it's done.

## Configuration List

First you need to define the configuration you want to run on. This will include: browser type, operating system and resolution.

* Navigate to "**Runs**", and then to "**Configuration List**" tab.

This list includes all available configurations, you can use one from this list or create a new one.

#### Create new configuration

* Click on "**Create New**".
* Add a name for your configuration
* Choose browser, operating system and resolution.
* Click "**OK**"

![](https://files.readme.io/1dfe42b-multiplebrowsers.gif "multiplebrowsers.gif")

## Running tests in CLI

In this section, we will focus only on what you need to add to the CLI to run on different browsers. You can read here about how to use [CLI](https://help.testim.io/docs/the-command-line-cli).

* The basic CLI can be found on Testim setting page.
* Add to the CLI the configuration you want to run on using --test-config `<name>`.
* Update the grid parameter of the grid you want to run. Read [here](https://help.testim.io/docs/grid-management) how to set up your grid.

#### Chrome, Edge Chromium, Safari, Firefox

```shell
--test-config "My configuration"
```

<br />

## Running tests in Scheduler

1. Under **Runs** --> **Scheduled runs** --> Select the scheduler you would like to edit/add new scheduler
2. Under **What to run on**, select **Override default config**.

<Image align="center" src="https://files.readme.io/5b362d1-scheduler1.png" />

3. Either select which config you would like the scheduler to run, or create a new config.
4. For new config, you can select which browser you would like the scheduler to run on.

<Image align="center" src="https://files.readme.io/1dd5c56-scheduler2.png" />

5. Click **ADD**
6. Save the scheduler.