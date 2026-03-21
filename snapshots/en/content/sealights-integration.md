# Sealights Integration

Sealights is a quality intelligence platform that assesses and quantifies code coverage for individual tests. You can integrate Sealights with Testim, enabling you to create and run tests in Testim while using Sealights to perform test optimization. During the execution of the tests, Testim sends the list of tests that will be executed to Sealights and  Sealights returns its test optimization recommendations for tests that should be skipped in the application build. These tests are then automatically excluded for the execution in Testim.

> 📘
>
> Native mobile apps and Salesforce environments are currently not supported. However, mobile apps are supported for services that use the Web frameworks.

# Prerequisites

Before running a test in Testim with Sealights integration, you first need to:

* Create a Sealights account

* Setup and configure the Sealights Agents based on your AUT's (Application Under Test) framework - see, [Agents: Setup and configuration](https://documentation.tricentis.com/sealights/en/content/sealights/agents_setup_configuration.htm).

# Setting the Sealights integration

Before using the Sealights and Testim integration, you will need to connect Testim to Sealights through the Sealights Agent Token. This process is required only once.

> 📘
>
> Sealights integration is not available to free tier customers.

:fa-arrow-right:**To connect Testim to Sealights:**

1. In **Sealights**, go to **Settings > Agent Tokens** and click **Create new token**.

   <Image align="center" src="https://files.readme.io/d94ca5f4d01671008eae2aadc1dc16d713111a3dd4a0f1bd974a29e50fe532b0-sealights2.png" />
2. In the empty field, enter a name for the token and click **Create**.
3. Copy the newly created token by clicking the **Copy** button under **Actions**.

   <Image align="center" src="https://files.readme.io/9eb0aac459a4d36025501de9a1eef17bc3a2f6742447e6ac79bf41838b37db8f-sealights4.png" />
4. In Testim, go to **Settings > Integration > Test Optimization** tab.
5. Click **login**.

   <Image align="center" src="https://files.readme.io/9f2f531c6d15d5ce3df3f616d1e0ffd9e5befd2067a8e3fd47bcf9182f73a8f3-sealightsintegrationslogin.png" />
6. In the **Sealights Agent Token**,  paste the **Sealights Agent Token** that was obtained.\
   The **Sealights URL** field is populate automatically based on the **Sealights Agent Token**.
7. Click **Connect**.

# Running a Test with Sealights Integration

Tests with Sealights integration can be executed using the following methods:

* **CLI** - by adding a CLI option that includes either the Sealights `buildSessionId` or the Sealights `labId`.
* **Scheduler** - by entering the Sealights `labId` to the **Lab ID** field in the **Advanced** section.
* **API** (coming soon)

## Using the CLI to run tests with Sealights integration

When running a test with the Sealights Integration using the CLI, you need to add one of the following IDs from Sealights as options in the Testim CLI execution command:

* **Sealights buildSessionId** - this ID relates to the specific build that was executed. Typically this is related to a specific component in an application. This means that this option is recommended if you want to test a specific component.
* **Sealights labId** - typically multiple components that are hosted on the same environment may share the same LabId. So if you want to test multiple components, it is recommended to use the LabId instead of the buildSessionId.
* **Sealights test-stage** - typically your test stage name in Sealights is Testim Automation. If you want to use a different test stage name, this option is recommended.

When the tests are executed using the CLI, Sealights returns a list of tests in this command that should be skipped and these are automatically skipped.

> 📘
>
> If `labId` CLI option is not used, Testim will use the `bulidSessionId` value for both `labId` and `buildSessionId` options.

### buildSessionId option

#### Obtaining the buildSessionId from Sealights

For every component build that is being tested, you will have to obtain its Session ID from Sealights, by following the relevant instructions for the framework that you are using:

* [Using Node.js Agent - Generating a session ID](https://documentation.tricentis.com/sealights/en/content/sealights/using_node_js_agent___generating_a_session_id.htm)
* [Using Java Agents - Generating a session ID](https://documentation.tricentis.com/sealights/en/content/sealights/using_java_agents___generating_a_session_id.htm)
* [Using Python Agent - Generating a session ID](https://documentation.tricentis.com/sealights/en/content/sealights/using_python_agent___generating_a_session_id.htm)
* [Using Go Agent - Initializing agent and Generating a session ID](https://documentation.tricentis.com/sealights/en/content/sealights/using_go_agent___initializing_agent_and_generating_a_session_id.htm)
* [SeaLights .NET Core agent - Scanning the build binaries](https://documentation.tricentis.com/sealights/en/content/sealights/sealights__net_core_agent___scanning_the_build_binaries.htm)

#### Executing test(s) in Testing using the Sealights buildSessionId

In Testim, run the test(s) using the [Command line interface (CLI)](https://help.testim.io/docs/the-command-line-cli), while adding the following option to the execution:

* ```shell
  --sealights-build-session-id [sealights-suid-session-id]
  ```

### labId option

In Sealights, the `labId` is an identifier that you can assign to various components that share the same characteristics, such as components that are hosted on the same environment. You can assign a `labId` to the components when running them using the Sealights agent.

For example, in the following Sealights command, which uses the Node.js test listener agent, you can assign a `labId` as part of the command:

```shell
npx slnodejs run --tokenfile ./path/to/sltoken.txt --buildsessionidfile buildSessionId [--labid <Lab ID>] --workspacepath "." --useinitialcolor true -- /your/backend/server/command 
```

In Testim, this `labId` can be used as the CLI option when running a test with the Sealights Integration using the CLI.

#### Obtaining the labId from Sealights

In Sealights, once the `labId` has been assigned, you may find it in the following screen:

* In Sealights, go to **Cockpit > Live Agents Monitor** - this screen displays all the running processes that are instrumented in Sealights. Some of these processes will include an assigned labId as showed below:

  <Image align="center" src="https://files.readme.io/319a904886d6e56b97fd101bf997eddbc0f8be6a04c43dd49df3f83c09259b76-sealights6.png" />

#### Executing test(s) in Testing using the Sealights labId

In Testim, run the test(s) using the [Command line interface (CLI)](https://help.testim.io/docs/the-command-line-cli), while adding the following option to the execution:

* ```
  --sealights-lab-id [sealights-lab-id]
  ```

### test-stage option

Typically, the Sealights integration uses the test stage name Testim Automation. But you can override this and use a custom name.

We recommend that you always send `Testim` in the tag sections during any CLI run. This best practice identifies the origins of your tests.

If you want to use a custom test stage name, you can use the [Command line interface (CLI)](https://help.testim.io/docs/the-command-line-cli) while adding the following option to the execution:

* ```
  --sealights-test-stage [sealights-test-stage-name]
  ```

## Using the Scheduler to run tests with Sealights integration

You can run tests with Sealights by entering the Sealights `labId` to the **Lab ID** field in the **Advanced** section. When the tests are executed by the Scheduler, Sealights returns a list of tests in this batch that should be skipped and these are automatically skipped.

:fa-arrow-right:**To run tests with Scheduler and Sealights integration:**

1. In Sealights, obtain the Lab ID, by following the instructions in the [labId option](https://help.testim.io/docs/sealights-integration-copy#labid-option) section.
2. In Testim, configure the Scheduler, by following the instructions in the [Scheduler - Web](https://help.testim.io/docs/scheduler) section.
3. In the Scheduler configuration screen, click **Advanced**.
4. Under **Test Optimization Configuration**, in the **Lab ID** field, paste the Lab ID that you have obtained from Sealights.
5. Optionally, if you use custom Test stage name, enter it in the **Test stage name field**

   <Image align="center" src="https://files.readme.io/bc18e3067f7237605da4a0913aacbc0b5fdcd3f2dd5e39233a297a81dcf010f2-image_12.png" />
6. Configure addition settings as needed.

<br />

# Viewing Executed Test List and Skipped Tests

## Viewing the Executed Test List in the CLI

After executing the tests using the CLI, you can view the test list, which includes the test execution status and an indication of whether the test has been excluded/skipped.

In the example below we can see that only the Function 1 test was executed and the other tests were "excluded by Sealights". The execution summary at the bottom of the screen also indicates that 23 tests were skipped.

<Image align="center" src="https://files.readme.io/3a2008ccae733afc7b4e728b7f3fdfbd359716198d09d375d6645fff1de341e2-testlistwith_skipped.png" />

## Viewing the Executed List in the Testim UI

In the [Execution Runs Screen](https://help.testim.io/docs/execution-runs-screen), you can view the executed tests list. Under the Status column, you will see an indicator of tests that the test was excluded by Test Optimization.

<Image align="center" src="https://files.readme.io/86c65098a0456e26b975e9bd580d73048f87210c9aef8244484a6141a4305e9e-testlistui.png" />

Hovering over the **i** icon reveals a notice that the test was excluded by Sealights.

<Image align="center" src="https://files.readme.io/d4a8e26c6ba574869f2683415525f4433aeec6c0c33faca235d0a83c95ce23c9-excludedbysealights.png" />