# Parameter override rules

This document explains the different override rules that occur when using parameters

There are various ways we can use parameters within [Testim.io.](http://testim.io) to name a few we have - [Data-Driven Testing](https://help.testim.io/docs/data-driven-testing), [Groups](https://help.testim.io/docs/groups), [Exports Parameters](doc:https://help.testim.io/docs/exports-parameters), [Configuration Files and Run Hooks](https://help.testim.io/docs/configuration-file-run-hooks) and the [Params file](https://help.testim.io/docs/parameters-for-tests). Each override touches the test in different times, usually for different purposes. Let's review them.

## The overriding Rules

Just like in most programming languages, where you define a variable, and the override is performed later, the variable comprises the last value assigned to it. Similarly, you can override a value in Testim.

#### Before the test begins:

* [Config-file's parameters](https://help.testim.io/docs/configuration-file-run-hooks) overrides [params-file's parameters](parameters-for-tests). Within the config-file, the `beforeTest` overrides the `beforeSuite`
* [Params-file's parameters](https://help.testim.io/docs/configuration-file-run-hooks) overrides [default Test Data/run data](https://help.testim.io/docs/data-driven-testing).

Note: All parameters sent to a test have **Local level** visibility (the entire test though is considered to be a single big group).

#### During test run

The three visibility scopes are:

* Local - the variables reside in a group, and are not accessible when the group is completed
* Test - the variables reside in the test throughout the duration of the test.
* Test Suite - the variables reside across multiple test executions and are passed from test to test.

#### Overriding rules

The more more local the parameter scope is, the parameter is more likely to be used, because it is considered "stronger" or "more important". If a variable is Local (most specific), it will always be used:\
e.g.

```javascript
exports.x = "local"
exportsTest.x = "test"
exportsGlobal.x = "global"
...
console.log(x); // prints "local"
```

> 📘 Parameter Scopes
>
> Parameters created in groups are considered as "local scope". Parameters can be overridden by the same scope or a “smaller” scope. For example, a "test scope" parameter can be overridden by either another test scope or local scope parameter with the same name.

#### Usage

**Data driven testing parameters:**

Mostly used to create default set of values, which will be overridden by the config file or the hooks.

Note: you can provide a set of parameters (array of objects) and then run the same test several times.

**Params file:**\
Similar to Data driven, but are not for a specific test. Those will be passed to all tests. E.g. common credentials

**Config files:**\
Used to dynamically load a suite of parameters. You can run custom JS code, which is executed in node.js, thus giving you the ability to load and run any NPM package. Common cases are loading from DBs or CSV files. You can find [code examples here](https://help.testim.io/docs/data-driven-testing).

Notes:

1. `beforeTest` and `beforeSuite` do NOT support returning a set of parameters (an array). If you pass an array, it will be treated as an object (i.e. in this context, `return ["x", "y" "z"]` is ALMOST equivalent to `return {1: "x", 2: "y", ;3:"z"})`.
2. If you use the same parameters in both the `beforeSuite` and the `overrideTestData`, the `beforeSuite` value will be used

To override test data in `beforeSuite`, use the following format:

```javascript
beforeSuite() {    
  return {
       y: 5,
       overrideTestData: {
           "testname1": [{x: 6}, {x:7}] , // runs testname1 twice
           "testname2": {y:7}          // y will be 5 because the beforeSuite object wins
    }
}
```