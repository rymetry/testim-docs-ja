# Dedicated run tunnel

Tunnels let you run your app from an internal server/localhost and view it in an external browser (proxy).

In some cases you would want to run tests on your own private or internal servers, using a remote selenium grid server, either supplied by Testim or by an external provider such as SauceLabs.

> 📘 This is a pro feature
>
> This feature is only open to projects on our professional plan. To learn more about our professional plan, click [here](https://www.testim.io/pricing/).

## Prerequisites

1. Tunnel feature enabled.
2. [Testim CLI](https://help.testim.io/docs/the-command-line-cli)

## How to use it

1. Run your application server.
2. Make sure the machine running the CLI command has access to the internal server/localhost.
3. Run [Testim CLI](https://help.testim.io/docs/the-command-line-cli) with parameter (`--tunnel` - default application port 80)
4. If you run your application under different port than port 80, add parameter (`--tunnel-port \<APP PORT e.g. 80>`)

Note that Testim CLI will adjust your application base URL to point to the dedicated tunnel address.

# Additional use cases

During test execution, all traffic is routed through the machine, that initiates the tunnel, providing a solution for situations where whitelisting may not be practical. As specified above, it is crucial to initiate the CLI command from a machine with access to the tested environment. Furthermore, this approach acts as a workaround for managing the geolocation of the grid, aligning it with the location of the machine that triggers the command.

#### Example using Testim CLI with a tunnel

```shell
testim --tunnel --tunnel-port <APP PORT default 80> --label "<YOUR LABEL>" --token "<YOUR ACCESS TOKEN>" --project "<YOUR PROJECT ID>" --grid "<Your grid name>" --report-file test-results/testim-tests-report.xml
```

> 📘
>
> You can use tunnel for HTTPS address if needed, please contact support to set this up. **HTTPS tunnel is only available when running on a Testim-provided grid.**

> 📘
>
> For the grid name, read [here](https://help.testim.io/docs/grid-management) how to set up your grid.

> 📘
>
> Tunnel is not supported for Scheduled runs.