# Core Concepts

***What is a Salesforce test?***

A Salesforce test comprises a variety of test steps that mimic user interactions and flows. Steps can be created manually, by adding a step and/or by recording on-screen actions. A test case can have a combination of test steps created in the above two ways.

***Is it connected to my test environment?***

Before creating a test, you need to connect your Test Environment to Testim for Salesforce so the pre-defined steps include your records and fields. This makes it easy to rapidly create tests with pre-populated steps.

> 📘
>
> Designing and testing of your tests in the Test Editor requires the Chrome browser, and installing the Chrome extension.

***Where can the test run?***

When you have designed and successfully tested a test running on your local system, the test is ready to run on the Cloud (i.e., on a grid). Tests are automatically grouped into test suites that can run in parallel on our hosted grid as well as third party grids and self-managed private grids.

***How can I run a test?***

You can run your tests in a number of ways including manually, at a scheduled time, or most commonly, at the completion of a Continuous Integration (CI) server task.

***Where can I see the test results***

Finally, check your test results. Test reports include summary data of successes and failures, as well as details about test failures.

## Key Concepts

#### Test steps

Test steps consist of common operations such as log in, log out, or launch apps, and record operations such as create, edit, and delete records. The fields in the steps are extracted and pre-populated from the records in your Salesforce environment.

#### Test recorder

Use the Test Recorder when a Salesforce pre-built step is not available. Within your Salesforce test, you can switch to the Recorder to record your actions as test steps. The test recorder is Salesforce-aware. It identifies and captures the fields and values that you enter and select to validate.

#### Running locally

After you have written your test, run it locally to verify that it works. If it doesn't, you can troubleshoot by looking at comparison screenshots, HTML DOM data, and console logs to identify the problem. If you are working in code, you can use your IDE debugger. If you are working in the visual editor, you can use Testim for Salesforce's debugging tools.

#### Running on a grid

To run your tests in parallel, you can use test grid. This allows you to test multiple browsers and configurations and run entire test suites faster.

#### Test results

Regardless of how you created your test (in code or codeless) or how you edited it (in your IDE or in the visual editor), all results are available in the Testim for Salesforce reports. You can add labels to your test results to help sort them. You can see individual test runs and test results and how they trend over time. You can see managerial reports that show how many tests have run and how they are performing.