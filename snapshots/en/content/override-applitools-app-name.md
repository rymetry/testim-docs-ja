# Override Applitools' app name

It is possible to override the app name being sent to Applitools. This can be done using the [test data](https://help.testim.io/docs/data-driven-testing#using-test-data-in-your-tests) in the following way:

1. The parameter *applitoolsAppName* is the one being sent to Applitools as the app name
2. You can either override it or change it in the test data, for example:

```javascript
return [
  {applitoolsAppName: 'appName_english'},
  {applitoolsAppName: 'appName_spanish'},
  ];
```

It is also possible to override the app name at the project level. The app name by default is the *projectId*, to override it go to Settings -> Integration --> under the Appltiools integration, add the application name

![1739](https://files.readme.io/f97a73d-Group_45.jpg "Group 45.jpg")