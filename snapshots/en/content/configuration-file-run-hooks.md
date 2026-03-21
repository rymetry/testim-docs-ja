# Configuration File

Learn about the configuration file

The configuration file is a common JS containing all the required parameters to run your test and/or test suite. It includes run hooks which can be used to setup the application backend and define parameters before/after a single test or all tests.

The configuration file needs to export all properties in a JSON named ***config***.

Here is an example of a configuration file:

```javascript
exports.config = {

    project: "<your project ID>",
    token: "<Your token>",
    
    // Specify which label you would like to run. All tests with the 
    // specified label will be executed
    label: "sanity",
    
    // Your Selenium grid
    grid: "<Your grid name>",
    
    // Override the base URL defined in the test in order to run it again on a different envinronment.
    baseUrl: 'http://staging.example.com',

    // =====
    // Hooks
    // =====
    // Testim provides several hooks you can use to interfere the test 
    // process in order to enhance it and build services around it.
   
    // Hook that gets executed before the suite starts
    beforeSuite: function (suite) {
        console.log("beforeSuite", suite);
    },
    
    // Function to be executed before a test starts.
    beforeTest: function (test) {
        console.log("beforeTest", test);
    },
    
    // Function to be executed after a test ends.
    afterTest: function (test) {
        console.log("afterTest", test);
    },
    
    // Hook that gets executed after the suite has ended
    afterSuite: function (suite) {
        console.log("afterSuite", suite);
    }
};
```

> 📘
>
> For the grid name, read [Grid Management](https://help.testim.io/docs/grid-management) how to set up your grid.

​

# Syntax

The configuration file includes the following elements:

* **CLI Flags** - these flags provide instructions for running the tests. The CLI Flags in the Config file support all the properties described in the [CLI flags](https://help.testim.io/docs/the-command-line-cli).\
  The name structure of the property is slightly different - replace the hyphen(-) with a capital letter.\
  For example: `--base-url` => `baseUrl`.

> 📘
>
> When you need to send more than one value to a parameter, use an array.\
> For example: `label: ["a" , "b"]`

* **Config Hooks** - hooks that can be used to setup the application backend and define parameters before/after a single test or all tests. See more details below.

# Config Hooks

The Configuration File includes run hooks that can be used to setup the application backend and define parameters before/after a single test or all tests. Through the Config File it is possible to set the following hook types:

* Before test - will run before the test
* After test - will run after the test
* Before Suite - will run before the suite
* After Suite - will run after the suite

For more about hooks, see [Hooks](https://help.testim.io/docs/hooks#creating-hooks-via-the-test-configuration).

Here is an example of test data that is added to the `beforeSuite` hook. This test data will be the same across all the tests included in the execution:

```javascript javascript
exports.config = {
 
  beforeSuite: function (suite) {
    console.log("beforeSuite", suite);
    return {
      "username": "David",
      "password": 123
    }
  },
  };
```

## Predefined properties in Config Hooks

The various config hooks include predefined properties that can be used to gather additional information about the test/suite. For example, you can print the value of the `projectId` property when using the Before Suite hook. For more information, see [Predefined properties in config file hooks](https://help.testim.io/docs/predefined-properties-in-config-file-hooks).

### Using the beforeTest hook to get a list of labels in runtime

As part of the `beforeTest` hook in the config file, it is possible to define a parameter and populate it with a list of labels that were defined for the test.\
In the following example, we defined a parameter called `labels`. This parameter will contain the list of labels that were included in the specific test, by using the `allLabels` predefined parameter. The parameter can then be used anywhere where parameters are used. For example, in a **Custom Step** you can include code that defines that if the test was tagged with label `Games`, the step should be skipped.

To learn more about using parameters, see [Configuration File Parameters](https://help.testim.io/docs/configuration-file-parameters)

<br />

```javascript
beforeTest: function(test) {
    return {
        labels: test.allLabels
    }
}
```

### Using the beforeTest hook to update the base-url variable

As part of the `beforeTest` hook in the config file, it is possible to get the base-url of a test and to update the base-url variable with an updated value.\
In the following example, we get the current test base URL and then update the test base URL with a different value.\
To learn more about using parameters, see [Configuration File Parameters](https://help.testim.io/docs/configuration-file-parameters)

```javascript
exports.config = {
    // Function to be executed before a test starts.
    async beforeTest(test) {
        const baseUrl = test.config.baseUrl; // Get the current test base URL.
        const randomAddress = await getRandomAddress();
        test.config.baseUrl = `${baseUrl}${randomAddress}`; // Update the test base URL using a manipulation on the existing base URL.
    }
};
```

## Global exports parameters

In "afterSuite" function you can use exports global parameters exported in your run.\
**Syntax**: suite.exportsGlobal.\<param\_name>\
Read more about exports global parameters [here](https://help.testim.io/docs/exports-parameters).

<br />

```javascript
exports.config = {
    // Function to be executed before a test starts.
    async beforeTest(test) {
        const baseUrl = test.config.baseUrl; // Get the current test base URL.
        const randomAddress = await getRandomAddress();
        test.config.baseUrl = `${baseUrl}${randomAddress}`; // Update the test base URL using a manipulation on the existing base URL.
    }
};
```

<br />

# Running a Test Using the Config File

1. Create your configuration file (e.g. testimConfig.js)
2. Pass it to the [Command Line (CLI) runner](https://help.testim.io/docs/the-command-line-cli) as a parameter:
3. Make sure to indicate the path to the file if needed.

```shell
testim -c "testimConfig.js"
```

4. If you want to override one of the values in the configuration file, simply pass it explicitly to the CLI, like this:

```shell
testim -c "testimConfig.js" --label "nightly"
```