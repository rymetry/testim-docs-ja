# Dependencies and ordering of tests

Different aspects of dependencies and ordering of tests

Before I begin to explain about dependencies between tests, I would like to emphasize why you do not want dependencies between tests.

Best practice is to make the tests as isolated as possible.\
Creating a dependency between tests will result:

* Reduce speed - This prevents you from running tests in parallel. E.g. Your test suite might complete in hours rather than minutes.
* Hiding bugs - Since not only the test points to the problem will fail, All the depended tests would also fail, hiding bugs that they might find.

After saying that, let's see what you can do.

### **Test Plans**

Test plans will serve you best when you need dependencies for setting up your environment before you start testing the application, and a teardown after you finish running the tests.

Read more about Test Plans and how to use it [here](https://help.testim.io/docs/test-plans).

### **Configuration file**

Use configuration files when:

1. You need to perform actions that need more permissions than when running in the browser (e.g. reset DB to some state).
2. You need to pass parameters to your tests which need to be calculated dynamically (e.g. create a new user).
3. Run actions before/after each test (as opposed to beforeAll/afterAll).

You can read more on Configuration Files [here](https://help.testim.io/docs/configuration-file-run-hooks).\
If you need to pass a parameter from the configuration file to your test you can read about it [here](https://help.testim.io/docs/parameters-for-tests).

### **Running Order**

Although we definitely prefer to endorse the best practice of isolated tests, we did leave a way to organize the execution order. So if you really want to run the tests in a certain order, and you do not want to run in parallel you can use one of the following methods:

1. **Test Suite** - you can create a Test suite where you can set the order in which you want to run the tests. Read more about Test suites [here](https://help.testim.io/docs/test-suites).
2. **Labels** - We sort the tests by name (lexicographic), so you can add prefix numbers to your tests to make Testim run in the order you want.\
   E.g. '1 - my test', '2 - my second test'\
   Try to leave gaps between the numbers in case you need to add future tests in the middle.\
   E.g. '100 - test1', '110 - test1' etc. to the test names.