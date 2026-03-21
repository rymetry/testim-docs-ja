# Plans

The **Subscription** screen, which is available for Company Owners only, displays the plan details and the current usage of your software subscription plans for each of the following product categories:

* Web - Testim for web applications.
* Mobile - Testim for mobile applications.
* Salesforce - Testim for Salesforce.
* Copilot - Testim Copilot coding assistant.

The plans have transitioned from a "Runs model" to a new model called "Parallelization model". In the Parallelization model runs are not counted towards your subscription, but rather the amount of parallel executions.

# Accessing the Plans screen

:fa-arrow-right:**To access the Plans screen:**

1. Click on your user avatar.
2. Under **Company**, click your company name.
3. Click the **Plans** tab.

# Web Plans

The Web plans screen displays the following information:

## Parallelization Model - Plan Details

<Image align="center" src="https://files.readme.io/7a353fc-parallelweb.png" />

* **Parallel Slots** - the number of parallel executions included in the plan.
* **Projects** - the number of projects included in the plan.
* **Expiration Date** - the date in which the plan will expire.

## Parallel Model - Usage Details

The current usage of the plan is displayed at the top-right corner of the screen.

<Image align="center" src="https://files.readme.io/fad8303385614f3107c1bd017f7d3c21771d2887830a4517453f2005da72a0be-parallelpopup.png" />

The element includes a doughnut chart indicating the parallelization usage level and the number indicating the current usage out of the total in your plan. Click the element to view more details.

<Image align="center" src="https://files.readme.io/389336058d8942cb18b586dbf56dfa0f6e68bba41325c3010e33826a342f631a-openpopover.png" />

<br />

<br />

<br />

## Usage Limits for Testim Web and Testim Salesforce

To ensure adequate performance and resource allocation for all users, Testim has established the following use limits:

* The first three (3) parallel tests are limited to a total of 1,000 monthly test run hours.
* Additional parallel tests may be licensed for added fees and provide 200 monthly test run hours per each additional parallel test.

Enforcement of these use limits is at the discretion of Tricentis to maintain service quality. Should you have any questions regarding these limits or need assistance with modifying your plan, please contact your account representative.

> 📘
>
> Local runs that are initiated through the Test Editor test do not count against these usage limits.

# What is Counted Towards the Parallelism Quota

<br />

| Execution Type                                                                                                                                                                                  | Project Type                                                                  | Counted Towards Parallelism Quota |
| :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------- | :-------------------------------- |
| Triggering an execution from the **Test Editor**                                                                                                                                                | - Web using Local Browser <br /> - Mobile using TMA <br /> - Mobile using VMG | No                                |
| Triggering an execution from the **Test Editor on Grid (Testim and 3rd Party)**                                                                                                                 | Web & Mobile                                                                  | Yes                               |
| Triggering an execution from the **CLI**                                                                                                                                                        | Web & Mobile                                                                  | Yes                               |
| Triggering an execution from the **CLI** with a `-use-local-chrome-driver` flag                                                                                                                 | Web                                                                           | No                                |
| Triggering an execution from the **CLI** with `host=localhost/127.0.0.1`                                                                                                                        | Web                                                                           | Yes                               |
| Triggering an execution from **Test Editor on Grid** with `host=localhost/127.0.0.1`                                                                                                            | Web                                                                           | Yes                               |
| Triggering an execution via the **Public API**                                                                                                                                                  | Web & Mobile                                                                  | Yes                               |
| Triggering an execution form the following screens: **Tests List / Tests Plan / Test Suite**. Note - Triggering a test from any of these pages will cause the test to run on the local browser. | Web & Mobile                                                                  | No                                |
| Triggering an execution from the **Scheduler**                                                                                                                                                  | Web & Mobile                                                                  | Yes                               |