# Circle CI integration

![368](https://files.readme.io/3eecb4e-circleci.png "circleci.png")

#### YAML File

In order to integrate Testim with [Circle CI](https://circleci.com/), using Circle CI's local Selenium Grid, you need to add these lines to your circle.yaml file:

**YAML**

```yaml
version: 2
jobs:
  build:
    environment:
      CIRCLE_TEST_REPORTS: /tmp/circleci-test-results
    docker:
    - image: testim/docker-cli
    steps:
      - run: mkdir -p $CIRCLE_TEST_REPORTS/testim/
      - run: testim --project "<PROJECT ID>" --label "<LABEL>" --grid "<Your grid name>" --token "<TOKEN>" --report-file $CIRCLE_TEST_REPORTS/testim/results.xml
      - store_artifacts:
          path: /tmp/circleci-test-results
      - store_test_results:
          path: /tmp/circleci-test-results
```

**Note**: For the grid name, read [here](https://help.testim.io/docs/grid-management) how to set up your grid.