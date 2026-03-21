# Validating using custom code

Create a test step with custom code to meet any use case.

Testim enables you to have the flexibility to create actions and validations where you input your own custom JavaScript code. You have the option of running your code within the browser or outside of the browser in the context Node.js.

## When to run within the browser

One advantage of running your custom code within the browser is that you can interact with the DOM. You can also take advantage of Testim’s Smart Locators to identify items in your app. Additionally, API requests are most likely authenticated (cookies are passed automatically). See [Add custom validations and actions](https://help.testim.io/docs/custom-code).

## When to run outside of the browser (in Node.js)

One of the advantages of running your custom code outside of the browser is that there are no CORS limitations. Additionally, you can use any NPM package available. See [Validating using code in Node.js](https://help.testim.io/docs/validate-download).