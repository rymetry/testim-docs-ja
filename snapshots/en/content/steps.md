# Steps

Steps, along with [Groups](https://help.testim.io/docs/groups) are the fundamental components of a test. Steps can perform a variety of actions and validations to meet almost any testing requirement. Each step features specific properties, which are visible in the [step’s property panel](https://help.testim.io/docs/editing-a-steps-properties). Some steps can be shared individually as [shared steps](https://help.testim.io/docs/shareable-steps), while other steps require grouping with additional steps for sharing.

Steps can be added in two ways:

* **[Manual steps](https://help.testim.io/docs/steps#manual-steps)** - the steps are added manually by the user, by hovering the mouse over the arrow symbol and selecting the relevant step from the Predefined Steps list. Alternatively it is possible to add steps manually by using one of the [Keyboard shortcuts](https://help.testim.io/docs/keyboard-shortcuts) either from the visual editor or from the AUT browser.
* **[Automatically recorded steps](https://help.testim.io/docs/steps#automatic-steps)** - the steps are added automatically during the recording of a test as the user interacts with the application under test.

# Manual Steps

### Validation Steps

| Validation Steps                 | Documentation                                                                                                                                                                                                  |
| :------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Add custom validation            | [Add custom validations and actions](https://help.testim.io/docs/custom-code)                                                                                                                                                          |
| Add CLI validation               | [Adding a CLI step](https://help.testim.io/docs/validate-download#adding-a-cli-step)                                                                                                                                                   |
| Validate download                | [Adding a Validate download validation step](https://help.testim.io/docs/validate-download#adding-a-validate-download-validation-step)                                                                                                 |
| Validate email                   | [Validate email](https://help.testim.io/docs/email-validation)                                                                                                                                                                         |
| Validate element visible         | [Validate element visible](https://help.testim.io/docs/validate-element-visible)                                                                                                                                                       |
| Validate element not visible     | [Validate element not visible](https://help.testim.io/docs/validate-element-not-visible)                                                                                                                                               |
| Validate element text            | [Validate element text](https://help.testim.io/docs/validate-element-text)                                                                                                                                                             |
| Validate CSS property            | [Validate CSS property](https://help.testim.io/docs/css-property-validation)                                                                                                                                                           |
| Validate HTML attribute          | [Validate HTML attribute](https://help.testim.io/docs/html-attribute-validation)                                                                                                                                                       |
| Validate checkbox                | [Validate checkbox/radio button](https://help.testim.io/docs/checkbox-and-radio-button-validation)                                                                                                                                     |
| Validate radio button            | [Validate checkbox/radio button](https://help.testim.io/docs/checkbox-and-radio-button-validation)                                                                                                                                     |
| Validate API                     | [API Validation](https://help.testim.io/docs/api-testing#api-validation)                                                                                                                                                               |
| Validate element visualization   | [Adding a Validate element visualization step](https://help.testim.io/docs/pixel-validation-and-pixel-wait-for#adding-a-validate-element-visualization-step)                                                                           |
| Validate viewport visualization  | [Adding a Validate viewport visualization or Validate full-page visualization step](https://help.testim.io/docs/pixel-validation-and-pixel-wait-for#adding-a-validate-viewport-visualization-or-validate-full-page-visualization-step) |
| Validate full-page visualization | [Adding a Validate viewport visualization or Validate full-page visualization step](https://help.testim.io/docs/pixel-validation-and-pixel-wait-for#adding-a-validate-viewport-visualization-or-validate-full-page-visualization-step) |
| Validate page accessibility      | [Page Accessibility Validation](https://help.testim.io/docs/accessibility-validations)                                                                                                                                                 |
| Validate element accessibility   | [Element Accessibility Validation](https://help.testim.io/docs/element-accessibility-validation)                                                                                                                                       |
| Add network validation           | [Add network validation](https://help.testim.io/docs/add-network-validation)                                                                                                                                                           |

### Wait For Steps

| Wait For Steps                 | Documentation                                                                                                                        |
| :----------------------------- | :----------------------------------------------------------------------------------------------------------------------------------- |
| Add custom wait for            | [Custom Wait for](https://help.testim.io/docs/wait-for#custom-wait-for)                                                                                      |
| Add CLI wait for               | [Adding a CLI step](https://help.testim.io/docs/validate-download#adding-a-cli-step)                                                                         |
| Wait for element visible       | [Wait for element visible](https://help.testim.io/docs/wait-for#wait-for-element-visible)                                                                    |
| Wait for element not visible   | [Wait for element not visible](https://help.testim.io/docs/wait-for#wait-for-element-not-visible)                                                            |
| Wait for element text          | [Wait for element text](https://help.testim.io/docs/wait-for#wait-for-element-text)                                                                          |
| Wait for download              | [Wait for Download](wait-for#wait-for-download-web)                                                                                  |
| Sleep                          | [Sleep](https://help.testim.io/docs/wait-for#sleep)                                                                                                          |
| Wait for element visualization | [Adding a Wait for element visualization step](https://help.testim.io/docs/pixel-validation-and-pixel-wait-for#adding-a-wait-for-element-visualization-step) |

### Action Steps

| Action Steps           | Documentation                                                                                     |
| :--------------------- | :------------------------------------------------------------------------------------------------ |
| Add hover action       | [Hover step](https://help.testim.io/docs/hover-step#how-to-add-a-hover-state)                                             |
| Add extract value step | [Extract value step](https://help.testim.io/docs/extract-text)                                                            |
| Generate email address | [Generating a temporary email address](https://help.testim.io/docs/email-validation#generating-a-temporary-email-address) |
| Set Cookie             | [Setting Cookies](https://help.testim.io/docs/cookies#setting-cookies)                                                    |
| Get Cookie             | [Getting Cookies](https://help.testim.io/docs/cookies#getting-cookies)                                                    |
| Add navigation action  | [Navigation](https://help.testim.io/docs/navigation)                                                                      |
| Add custom action      | [Add custom validations and actions](https://help.testim.io/docs/custom-code)                                             |
| Add CLI action         | [Adding a CLI step](https://help.testim.io/docs/validate-download#adding-a-cli-step)                                      |
| Add API action         | [API Action](https://help.testim.io/docs/api-testing#api-action)                                                          |
| Refresh                | [Refresh page](https://help.testim.io/docs/refresh-page)                                                                  |
| Generate random value  | [Generating a random value](https://help.testim.io/docs/generating-a-random-value)                                        |
| Generate date          | [Generating a Date](https://help.testim.io/docs/generating-a-date)                                                        |

# Automatically Recorded Steps

| Step Name                   | Description                                                                                                              |
| :-------------------------- | :----------------------------------------------------------------------------------------------------------------------- |
| Click                       | upon mouse click                                                                                                         |
| Double click                | upon  double mouse click                                                                                                 |
| Right click                 | upon right mouse click                                                                                                   |
| Scroll (to element/on page) | upon scroll activity (See [Scroll Step](https://help.testim.io/docs/scroll))                                                                     |
| Set text                    | upon setting text to a field                                                                                             |
| File upload / File drop     | upon file section or file drop in frame (See [File upload step validation](https://help.testim.io/docs/file-upload-step))                        |
| Press (Key press)           | upon keyboard key press (Enter, Tab, ESC, Page Up, Page Down etc.)                                                       |
| Download validation         | when a file is downloaded during recording. Also, can be added manually (See [Validate download](https://help.testim.io/docs/validate-download)) |
| Drag & Drop                 | upon dragging and dropping artifacts in AUT (See [Drag & Drop Step](https://help.testim.io/docs/drag-drop-step))                                 |