# Grid management

Configure your grid to run tests remotely (inc. Sauce labs, Browserstack, LanbdaTest, HeadSpin and others.)

> 📘 This is a pro feature
>
> This feature is only open to projects on our professional plan. To learn more about our professional plan, click [here](https://www.testim.io/pricing/).

To run web tests remotely, you will need a Selenium grid and to run a mobile test, you will need HeadSpin.

> 📘
>
> To make changes to your Testim grid's browser count or type, please contact our support team.

> 📘
>
> In case you are running tests that use a restricted environment (via VPN), you will need to whitelist Testim-Grid IPs so the grid would have access to the tested environment. For the full IPs list, please contact our support team.

> 📘
>
> We regularly update browser versions on the Testim grid following thorough validations and testing to ensure compatibility with Testim.\
> The update is driven by two main triggers:
>
> * No more than 3 months after official major version release
> * Versions that address critical security updates

## Web Testing Grids

The following grids can be used for web testing:

* **Testim cloud grid** - The Testim Cloud Grid is the default offering from Testim, and it is automatically accessible based on your plan.
* **Local grids** - If you have a selenium grid, we can integrate with it.
* **Third party grid** - Testim can integrate with third party grids including Saucelabs, Browserstack and LambdaTest.
* **Private grid** - The private grid is a dedicated Testim grid exclusively provided for your use. Unlike the Testim Cloud grid, this configuration supports VPN SITE-TO-SITE implementation, enabling the grid to operate under your preferred IP address, thus eliminating the necessity for whitelisting. As a dedicated resource for your exclusive use, the private grid provides heightened control for specific needs such as geolocation or browser versions. For further details, please contact your Account Executive or the Testim support team.

## Mobile Testing Grids

The following grids can be used for mobile testing:

* **Virtual Mobile Grid** - The Virtual Mobile Grid enables testing across a wide variety of iOS simulators and Android emulators.
* **Third party grid** - Testim can integrate with third party grids including Saucelabs, Browserstack, and HeadSpin.
* **Tricentis Device Cloud (TDC)** - TDC gives you access to real iOS and Android devices on our grid with our support. TDC offers shared devices, which are shared among users, as well as dedicated private devices, which are only available to you.

## Adding a grid

:fa-arrow-right: **To add a new grid:**

1. In Testim, on the top right-hand of the screen, click the round circle with the User Name initials.
2. Under **Account**, click Grids.
3. Click **Add New Grid**.
4. Choose a grid type:\
   For web select:
   * Custom Grid - your own Selenium grid
   * Saucelabs
   * Browserstack
   * LambdaTest\
     For mobile select:
   * Virtual Mobile Grid
   * TDC
   * Saucelabs
   * Browserstack
   * Testim HeadSpin Mobile
5. Update the relevant fields (below you'll find details about the different options).
6. Click **Add**.\
   To edit / delete a grid, hover the grid setup box and click the desired option.

> 📘
>
> If your plan includes a **Testim grid**, your configuration should appear automatically. If it does not, please contact our support.

<Image align="center" src="https://files.readme.io/6e57e7a-addgrid.gif" />

## Grid configurations

The following articles provide more details on how to configure the various grids:

* [Virtual Mobile Grid](https://help.testim.io/docs/virtual-mobile-grid)
* [Tricentis Device Cloud (mobile)](https://help.testim.io/docs/tricentis-device-cloud)
* [Custom Grid (web only)](https://help.testim.io/docs/custom-grid)
* [Saucelabs integration (mobile and web)](https://help.testim.io/docs/saucelabs-integration)
* [Browserstack integration (mobile and web)](https://help.testim.io/docs/browserstack-integration-1)
* [Extended run parameters for Saucelabs & BrowserStack (mobile and web)](https://help.testim.io/docs/saucelabs-browserstack-options)
* [HeadSpin integration (mobile)](https://help.testim.io/docs/headspin-integration)
* [LambdaTest integration (web only)](https://help.testim.io/docs/browserstack-integration-copy)

## How to run on the grid

You can run your tests remotely using one of the following methods:

[CLI](https://help.testim.io/docs/the-command-line-cli)/ [CI](https://help.testim.io/docs/integrate-testim-to-your-ci)\
Add `--grid` parameter with the grid name.

[Scheduler](https://help.testim.io/docs/scheduler)\
Use Grid field to choose on which grid to run your tests.

[Test Plan](https://help.testim.io/docs/test-plans)\
Use Grid field to choose on which grid to run your tests.

### Running from the editor (Web)

You can run your web test on the grid directly from the test editor. To learn more, see [Running a remote web test](https://help.testim.io/docs/running-tests-overview#running-a-remote-web-test).

### Running from the editor (Mobile)

You can run your mobile test on the grid directly from the test editor. To learn more, see [Running a remote mobile test](https://help.testim.io/docs/running-tests-overview#running-a-remote-mobile-test)