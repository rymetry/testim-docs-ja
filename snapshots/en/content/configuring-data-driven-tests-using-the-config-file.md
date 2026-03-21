# Configuring Data-driven Tests Using the Config File

Test Data can be passed to one or multiple tests by editing the [config file](https://help.testim.io/docs/configuration-file-run-hooks) and then running the test with the CLI, while adding a flag to use the config file in this run.  The configuration file is a common JS file containing all the required parameters to run your tests, while executing Configuration File Hooks. Through one of these hooks (e.g., `beforeSuite`), it is possible to add test data to the entire execution or to specified tests. This dataset can override the dataset that was defined in the visual editor.

> 📘
>
> The Config file code is processed by the CLI that runs the test on the Testim grid, so it is possible to run JS that is supported in Node and not on the browser.

The Config file option offers extensive versatility and granular control over the scope in which the data is used:

## Execution level - placing parameters in the `return` section

Placing the data parameters after the `return` section within the configuration hooks (`beforeSuite` hook or the `beforeTest` hook), will run the same data across all the tests included in the execution.

:fa-arrow-right: **To add test data to a config file to run at the execution level:**

1. Create a config file or edit an existing one.
2. Add the parameters and their values after the `return` section within the configuration hooks (`beforeSuite` hook or the `beforeTest` hook).

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

Here is an example of test data that is added to the `beforeTest` hook. This test data will be the same across all the tests included in the execution:

```javascript javasc
exports.config = {
  .....
  .....

  beforeTest: function (test) {
    console.log("beforeTest", test);
    
    return {
      "username": "David",
      "password": 123
    }
  }

  .....
  .....
};
```

<br />

## Test level - adding an `overrideTestData` object

Inside the `return` section, it is possible to add an `overrideTestData` object, which allows you to add the data to specified tests by test name, including specifying one parameter on one test and another parameter on another test within the same execution.

:fa-arrow-right: **To add test data to a config file to run at the test level:**

1. Create a config file or edit an existing one.
2. Add tests names and data sets (data sets should be in JSON format), by adding them to the `overrideTestData` under the `beforeSuite` hook. All other parts of the config file should remain/be included.\
   Here is an example of a beforeSuite hook in the configuration file :

```javascript
beforeSuite: function () {
    return {
       overrideTestData: {                 
          "Test 1": {user: "dave", password : "123"},
          "Test 2": {name: "ryan"}                    
        }
    }    
} //add comma here if there are more functions after beforeSuite
```

> 📘
>
> "Test 1" and "Test 2" are names of tests.

Here is the same example with 2 datasets for the first test :

```javascript
beforeSuite: function () {
    return {
       overrideTestData: {                 
          "Test 1": [{user: "michelle", password : "belle"},
                     {user: "paul", password : "walrus"}]
          "Test 2": {name: "john"}                    
        }
    }    
} //add comma here if there are more functions after beforeSuite
```

If the one of the data set parameters is missing from a consequent data set, for example, if the second data set did not include the password (i.e. did not include `password: walrus`), Testim will use the parameter data from the first data set (i.e. `belle`).

:fa-arrow-right: **To run a test using the config file:**\
After creating the config file, pass the config file to the Command Line (CLI) runner as a parameter, while making sure to indicate the path to the file if needed. When you run your test from [Testim CLI](https://help.testim.io/docs/the-command-line-cli), the test will run multiple times, in order, each time with a different Data Set.

```shell
testim -c "testimConfig.js"
```

```text
```

If the test already included data (e.g. that was specified in the visual editor), this data will override the original test data, if the Config file includes the override function naming the specific test.