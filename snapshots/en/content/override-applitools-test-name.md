# Override Applitools' test name

It is possible to override the test name being sent to Applitools. This can be done using the [test data](https://help.testim.io/docs/data-driven-testing#using-test-data-in-your-tests) in the following way:

1. The parameter *applitoolsTestName* is the one being sent to Applitools as the test name
2. You can either override it or change it in the test data, for example:

```javascript
return [
  {applitoolsTestName: 'testName_english'},
  {applitoolsTestName: 'testName_spanish'}
  ];
```

3. In this example for every test data entry, the test name sent to Applitools will contain the language and will create a different baseline in Applitools