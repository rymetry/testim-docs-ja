# Parameters

Explore all your options for using parameters

Parameters are variables that can be used to pass information into a test step, a test or a Suite of tests. Parameters can be used  to test different scenarios without knowing the information ahead of time. The parameters can be defined in different ways and each method offers a different scope, where the parameters are available and can be used.

## How to define parameters

* [Step Properties Panel Parameters](https://help.testim.io/docs/parameters-in-custom-javascript-steps) - Some step types include the ability to define a parameter in PARAMS field, located in the Properties panel.
* [Groups Parameters](https://help.testim.io/docs/parameters-for-groups) - You can define parameters in a group and then reuse it inside the group across other tests.
* [Export (out) parameters](https://help.testim.io/docs/exports-parameters) - A parameter which is defined inside a Custom/CLI/Network/Download validation/action steps through the step's function editor. The parameter can be used later in other steps, either in the same group, test, or execution, depended on the defined scope of the export.
* [JSON Parameters File Parameters](https://help.testim.io/docs/json-parameters-file-parameters) - You can define parameters in a JSON Parameters File and then pass the parameters to test runs.
* [Configuration File Parameters](https://help.testim.io/docs/configuration-file-parameters) - You can define parameters in a Configuration File and then pass the parameters to test runs.
* [Test Data](https://help.testim.io/docs/configuring-a-data-driven-test-from-the-visual-editor) - You can define parameters in the test data and then use them in the various steps.
* **Value Generation Steps** - in the [Generate Date](https://help.testim.io/docs/generating-a-date#adding-a-generate-date-step),  [Generate Email Address](https://help.testim.io/docs/email-validation#generating-a-temporary-email-address), [Extract Value](https://help.testim.io/docs/extract-text), and [Generate Random Value](https://help.testim.io/docs/generating-a-random-value) steps a parameter for the date/email/etc. is defined. The parameter is defined by default (e.g., `dateValue` for the Generate Date step), but can be modified  by entering the name of the parameter in the **Variable Name** field, located in the Properties Panel.

## Predefined (out of the box) parameters

The `BASE_URL`, `TESTIM_ITERATOR`, and `networkRequests` are out-of-the-box parameters, which, unlike other parameters in Testim, do not need to be defined as a parameter, but rather used immediately.

### Base URL Parameter

The parameter will be populated with the value of the base URL of the test run, which may be the original base URL of the test or an overriding value. The Base URL parameter can be used wherever parameter usage is supported.

> 📘
>
> Single quote marks will be added before and after the URL (e.g., 'BASE\_URL + '/Extension''). Delete these single quote marks (e.g. BASE\_URL + '/Extension'),

The Base URL parameter can be used as a dynamic base URL for data-driven testing that can be modified automatically based on the data provided to the test run. For example, you want to run the same test across a variety of different websites. In this case, you will use the base URL parameter to input dynamic URLs to the test runs.

For more information, see [Base URL](https://help.testim.io/docs/base-url).

### Testim Iterator Parameter

TESTIM\_ITERATOR is an out-of-the-box parameter that is available only in group loops and allows you to keep track of and use the value of the current loop iteration. Each time a loop is run, the value of TESTIM\_ITERATOR increases by one. The following are some examples of how you can use TESTIM\_ITERATOR.

> 📘
>
> The scope of this parameter is limited to the group loop only.

For more information, see [https://help.testim.io/docs/loops#using-the-loop-iterator-parameter](https://help.testim.io/docs/loops#using-the-loop-iterator-parameter)

### Network Requests Parameter

`networkRequests` is an array that collects of all the test run’s network requests as objects, to be validated/used. This parameter is available ONLY within the network validation step. For more information, see [Add network validation](https://help.testim.io/docs/add-network-validation).

## How to use parameters

Parameters that were defined are referred in Testim by using the parameter name **without quotations**.

<Image alt="The myParam is the defined parameter" align="center" src="https://files.readme.io/3f139cf-image.png">
  The myParam is the defined parameter
</Image>

Parameters that were defined can be used in the following places:

* **Any text input field in the Properties Panel** - any text input field in the Properties Panel. For example, the "Expected Value" input field in the Text Validation step, the "Expected value" input field in the "When to run step" section (under the Element Text option). The following input fields DO NOT support the use of parameters:
  * Variable Name
  * Description
  * Date Format
* **Expression field in the Param section of the Properties Panel** - after defining a parameter in the Properties Panel, an expression field is displayed, where you can set a value for the parameter. In this expression field you can set the value by using ANOTHER parameter, which was already defined.
* **Any Function Editor panel** - in some steps (e.g. custom validation step) or in custom conditions there is a Function editor panel. The defined parameters can be used in this editor. For more information, see [Advanced JS Editor](https://help.testim.io/docs/advanced-js-editor)
* **[API Step](https://help.testim.io/docs/api-testing#using-parameters)** - The API Step includes the following text sections that support using the defined parameters:
  * Request URL - in this section the parameter is referred using double or triple brackets (e.g, \{\{\{param}}}).
  * Header - in this section the parameter is referred using double or triple brackets (e.g, \{\{\{param}}}).
  * Body - in this section the parameter is referred using double or triple brackets (e.g, \{\{\{param}}}).
  * Assertion
  * Function editor

## How to hide parameters

Sometimes the information in a parameter may be sensitive. In this can you can hide the value of the parameter by following the instructions in the [Hidden parameters](https://help.testim.io/docs/hidden-parameters) doc.