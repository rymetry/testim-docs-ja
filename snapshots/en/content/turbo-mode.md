# Turbo Mode

Run Testim tests efficiently at scale, while improving their performance.

Reach better performance,  accelerate tests’ run time by 30% on average and avoid saving unnecessary data.

> 📘 This is a pro feature
>
> This feature is only open to projects on our professional plan. To learn more about our professional plan, click [here](https://www.testim.io/pricing/).

> 📘
>
> ‘Turbo' mode is applicable on either Chrome or Edge Chromium only.

## Running in turbo-mode

Running your tests in turbo-mode  can be done either by CLI run or scheduled run. The tests will run in extension mode only (Chrome and Edge Chromium).

When running in turbo-mode  the following settings will apply:

* Step delays will be ignored
* Test artifacts will only be saved for failed runs and for successful runs they won't be collected:

  * Screenshots

  * Network log

  * Console log

  * DOM data

  * Run parameters

  * Accessibility step report

  * BASEURL

  > 📘
  >
  > There are cases (such as browser crashes) where the data might not be saved, even for failed runs.

### Running in turbo-mode  via CLI

In order to run in turbo-mode , use  *--turbo-mode* in the CLI command, to read more about CLI runs, see [here](https://help.testim.io/docs/the-command-line-cli).\
For example:

```shell
testim  --token "<YOUR ACCESS TOKEN>" --project "<YOUR PROJECT ID>" --grid "<Your grid name>" --turbo-mode
```

### Running in turbo-mode  via scheduler

In order to transform a scheduled run into turbo-mode , select the scheduled run you would like to transform --> go into edit mode --> turn on the turbo-mode toggle.

![](https://files.readme.io/4dc96a6-Oct-26-2021_12-46-54.gif "Oct-26-2021 12-46-54.gif")

## turbo-mode  tests results

* Test artifacts, as mentioned above, will be available only for failed tests
* Under executions - turbo-mode  indication will appear

![](https://files.readme.io/47fe6d2-Screen_Shot_2021-10-27_at_6.23.57.png "Screen Shot 2021-10-27 at 6.23.57.png")

* Under test runs - each test that ran in turbo-mode  will have an indication

![](https://files.readme.io/2c63b5a-Screen_Shot_2021-10-27_at_6.25.47.png "Screen Shot 2021-10-27 at 6.25.47.png")

* Editor - each result will have an indication on the top left (next to the test status)

![](https://files.readme.io/1c24db7-Screen_Shot_2021-10-27_at_6.27.52.png "Screen Shot 2021-10-27 at 6.27.52.png")