# Configuring Data-driven Tests Using Data From an External Source

Test data from external sources (e.g CSV, DB etc.) can be passed to one or multiple tests using the [config file](https://help.testim.io/docs/configuration-file-run-hooks) and then running the test using the CLI, while adding a flag to use the config file in this run.

:fa-arrow-right: **To add external test data to a config file:**

1. Create a config file or edit an existing one.
2. Install the npm package csvtojson in order to use this functionality. See more details here: [https://www.npmjs.com/package/csvtojson](https://www.npmjs.com/package/csvtojson). The csvtojson npm package should be included in the Config file as shown below (`const csvtojson = require("csvtojson"`)
3. Add a JavaScript function that loads data from an external source into JSON objects in the beginning of the config file (`loadCsvFile(path)`).

```javascript
// JS function that loads data from CSV into Json objects
const csvtojson = require("csvtojson");
function loadCsvFile(path) {
    return new Promise((resolve) => {
        return csvtojson()
            .fromFile(path)
            .then(resolve, err => {
                console.error("failed to read csv file", err.message);
                resolve([]);
            });
    });
}
```

4. Use `overrideTestData` in the `beforeSuite` to pass test names and their data sets as shown below.

```javascript
beforeSuite: function () {
    return Promise.all([loadCsvFile('./data.csv'),
	loadCsvFile('./data2.csv'), loadCsvFile('./data3.csv')])
        .then(([jsonObj, jsonObj2, jsonObj3]) => {
            return {
                BEFORE_SUITE: "BEFORE_SUITE",
                overrideTestData: {
                "Test 3": jsonObj,
                "Test 4": jsonObj2,                        
                "Test 5": jsonObj3,                         
                // You can also pass static datasets to tests 
                "Test 6": {name: "ryan"}                    
            }
        }
    });
} //add comma here if there are more functions after beforeSuite
```

> 📘 Test data provided in the beforeSuite() hook in the config file overrides test data provided in the UI.

> 📘 In the CSV file the first row (header row) will contain the data keys and will be used as parameter names, and each row afterward will contain a dataset of values.