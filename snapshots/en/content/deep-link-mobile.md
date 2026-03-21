# Deep link (mobile)

Add a deep link to a specific location inside an app

Deep link is a link that launches an app and opens a specific page, sending the user directly to a specific location inside an app, rather than a generic app homepage or mobile website. The deep link can open any application that is installed on the mobile device, including apps that are part of the mobile OS, as well as the mobile web browser. Deep links can include parameters. For example, a deep link that opens the phone app, while dialing a phone number that is passed as a parameter.

The **Deep Link** step can be used to test that the deep link works. The step will open the specified app at a specified location inside the app and will optionally pass a specified parameter.

In some cases opening another app after clicking  a deep link displays a notification, which requires the user's confirmation. In this case, you will need to record a step that taps the button to confirm this notice.

<Image align="center" src="https://files.readme.io/58d5cba-open.png" />

> 📘
>
> The Deep Link step is only available on [VMG](https://help.testim.io/docs/virtual-mobile-grid).

## Adding a Deep Link Step to your Test

:fa-arrow-right:**To add a Deep Link step:**

1. Hover over the  (arrow symbol) where you want to add the Deep Link step. The action options are displayed.
2. Click on the “M” (Testim predefined steps). The Predefined steps menu opens.
3. Expand the **Actions** menu and select the **Deep link** step.

<Image align="center" src="https://files.readme.io/213c463-deeplink.png" />

> 📘 Note:
>
> Alternatively, you can use the search box at the top of the menu to search for Deep link.

The following dialog is displayed:

<Image align="center" src="https://files.readme.io/fdd1fcc-deeplink2.png" />

4. In the **Value** field, enter the Deep link value as follows:
   1. **Syntax:** `schemeName://parameterValue`
   2. **schemeName** - the scheme name is the name of the app that the deep link will open. It can be one of the OS internal applications, such as `tel`, `sms`, `mailto`, `facetime`, etc. or the name of a regular mobile app.
   3. **parameter** - the value that will be passed to the app. For example, a mobile phone number.
   4. The value is a JS expression string, so make sure to add quotes.
   5. **Examples** - `'sms://12354'`,  `mailto://example@email.com`, `facetime://1-408-555-1212`
      > 📘
      >
      > 3rd party apps might support only URL-based schemes. For example: [https://byby.dev/ios-deep-linking](https://byby.dev/ios-deep-linking). Spotify, for example, supports only the following types of deep links: [https://open.spotify.com/artist/1rSGNXhhYuWoq9BEz5DZGO](https://open.spotify.com/artist/1rSGNXhhYuWoq9BEz5DZGO)
   6. **Adding a parameter to the deep link value** - it is possible to add a regular Testim parameter just like any JS expression. For example - `'sms://12354' + myParam`
5. Click **OK**.\
   The step is added.
6. In the step's **Properties** panel, optionally specify the following properties:
   1. **When this step fails** – Specify what to do if this step fails.
   2. **When to run step** – Specify conditions for when to run the step. For more information, see [Conditions](https://help.testim.io/docs/conditions).
   3. **Override timeout** – Allows you to override the default time lapse setting which causes Testim to register a fail for a test step, and specify a different time lapse value (in milliseconds). Failed steps will be retried until there is insufficient remaining time for a successful run.