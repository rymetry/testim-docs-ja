# Configuration File Parameters

Pass parameters to a test using the Configuration File beforeSuite / beforeTest hooks

The [Configuration File](https://help.testim.io/docs/configuration-file-run-hooks) is a common JS containing all the required parameters to run your test and/or test suite. It includes run hooks which can be used to setup the application backend and define parameters before/after a single test or all tests. Using the  **Configuration File**, you can pass parameters to test runs. The CLI command will pass the parameters to the tests that are included in the run.

## Parameter scope

The scope of the defined parameter covers all the tests in a single run (execution).

## Defining parameters in a Configuration File

Create a [Configuration File](https://help.testim.io/docs/configuration-file-run-hooks) that uses the beforeSuite/beforeTest functions inside the Configuration File to define  Suite/Test specific parameters. The following example defines the `user name` and `password` using `beforeSuite` and `beforeTest`.

```javascript
exports.config = {
  .....
  .....

  beforeSuite: function (suite) {
    console.log("beforeSuite", suite);

    return {
      "username": "David",
      "password": 123
    }
  },

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

## Test level - adding an `overrideTestData` object

Inside the `return` section, it is possible to add an `overrideTestData` object, which allows you to add the data parameters to specified tests by test name, including specifying one parameter on one test and another parameter on another test within the same execution.

:fa-arrow-right: **To add parameters to the Config File at the test level:**

1. Create a config file or edit an existing one.
2. Add tests names and data sets (data sets should be in JSON format), by adding them to the `overrideTestData` under the `beforeSuite` hook. All other parts of the config file should remain/be included.\
   Here is an example of a `beforeSuite` hook in the configuration file :

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

## Execution level - placing parameters in the `return` section

Placing the data parameters after the `return` section within the configuration hooks (`beforeSuite` hook or the `beforeTest` hook), will run the same data across all the tests included in the execution.

:fa-arrow-right: **To add parameters to a config file to run at the execution level:**

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

## Global exports parameters

In "afterSuite" function you can use exports global parameters exported in your run.\
Syntax: `suite.exportsGlobal.<param_name>`

## Using the parameters in the CLI

After defining the Config File, you can pass it to [Testim CLI](https://help.testim.io/docs/the-command-line-cli) as an argument:  **-c** followed by the file name.

```shell
testim -c "testimConfig.js"
```

At this stage the parameters can be used/called from within the relevant tests using the [Step Properties Panel Parameters](https://help.testim.io/docs/parameters-in-custom-javascript-steps).