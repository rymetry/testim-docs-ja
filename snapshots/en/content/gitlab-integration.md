# GitLab integration

![](https://files.readme.io/6744632-gitlab-logo-gray-rgb.png "gitlab-logo-gray-rgb.png")

**YAML File**\
In order to integrate Testim with GitLab, you need to add these lines to your YAML file:

```yaml
image: node:16.13.0
stages:
  - e2e
testim:
  stage: e2e
  image: docker:git
  variables:
    TESTIM_DOCKER: testim/docker-cli
    TESTIM_TOKEN: <TESTIM_TOKEN>
    TESTIM_PROJECT: <TESTIM_PROJECT>
    TESTIM_LABEL: <TESTIM_LABEL>
    GRID_NAME: <GRID_NAME>
  services:
    - docker:stable-dind
  script:
    - docker pull $TESTIM_DOCKER
    - docker run --rm -v "$(pwd)":/opt/testim-runner $TESTIM_DOCKER --token $TESTIM_TOKEN --project $TESTIM_PROJECT --label "$TESTIM_LABEL" --grid $GRID_NAME -r /opt/testim-runner/testim-report.xml
  artifacts:
    paths:
      - testim-report.xml
    reports:
      junit: testim-report.xml
```

> 📘
>
> For the grid name, [read here](https://help.testim.io/docs/grid-management) how to set up your grid.

> 📘
>
> Testim supports all [LTS/supported versions](https://github.com/nodejs/Release/blob/main/README.md) of Node.js.