# GitHub Actions Integration

![](https://files.readme.io/28e7267-Continuous-Deployment-con-GitHub-Actions.png "Continuous-Deployment-con-GitHub-Actions.png")

In order to integrate Testim with GitHub Actions, you need to create a new GitHub-Action workflow:

Follow these instructions: [https://docs.github.com/en/actions/quickstart](https://docs.github.com/en/actions/quickstart)

**YAML File**

```yaml
name: Testim E2E
on: [push]

jobs:
    run-testimio-cli:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v2
            - uses: actions/setup-node@v2
              with:
                node-version: '18.17.0'
            - run: npm install -g @testim/testim-cli
            - run: testim --token <TESTIM_TOKEN> --project <PROJECT_ID> --grid <GRID_NAME>
```

> 📘
>
> Best practice to work with sensitive data (e.g project token) is to use [encrypted secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)