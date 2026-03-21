# JSON Parameters File Parameters

Pass parameters to a test using JSON Parameters File

Using a **JSON Parameters File**, you can pass parameters to test runs. This method allows you to define dynamic values inside your test which vary by your test environment. For example, you can set different login credentials (username and password) when you test locally and when testing in your CI. The JSON Parameters File, which defines parameters, is created and then when running the test you can add an argument to the command that calls the JSON Parameters Files. The CLI command will pass the parameters to the tests that are included in the run.

## Parameter scope

The scope of the defined parameter covers all the tests in a single run (execution).

## Defining parameters in a JSON Parameters File

Create a JSON File in which you define the desired parameters like the following example:

```json
{
  "username": "david",
  "password": "123"
}
```

## Using the parameters in the CLI

After defining the JSON Parameters File, you can pass it to [Testim CLI](https://help.testim.io/docs/the-command-line-cli) as an argument:  **--params-file** followed by the file name.

> 📘
>
> The string path that is set in the `params-file` path must be a relative path, and not a full path.

```shell
testim --label "<YOUR LABEL>" --token "<YOUR ACCESS TOKEN>" --project "<YOUR PROJECT ID>" --grid "<Your grid name>" 
--params-file <PARAM FILE NAME e.g. params-file.json>
```

## Using a parameters file in JavaScript (JS) format

In addition to using JSON format for your parameters file, you can also use a JavaScript file to export parameter values. This method provides dynamic parameter management within the test configuration.

To do this, create a JS file (for example, param-file.js) with the following syntax:

```javascript
module.exports = {
    username: "admin"
};
```

This syntax exports your parameters explicitly for use in JavaScript files. When running your tests, specify the JS file as the parameter file by using the following command:

```javascript
testim --label "<YOUR LABEL>" --token "<YOUR ACCESS TOKEN>" --project "<YOUR PROJECT ID>" --grid "<Your grid name>" 
--params-file <PARAM FILE NAME e.g. params-file.js>
```

At this stage, you can use the parameters from within the relevant tests using the [Step Properties Panel Parameters](https://help.testim.io/docs/parameters-in-custom-javascript-steps).