# Exporting a Parameter

Learn how to pass parameters between different steps in a test or between different tests

We have 3 types of exports parameters:

* **Local export**: Allows you to pass parameters between **steps** in the same **scope** (e.g., exporting parameters in a group allows you to pass parameters between steps in the same group).
* **Test export**: Allows you to pass parameters between **steps and groups** in the same **test.**
* **Global export**: Allows you to pass parameters between tests in the same execution (i.e., test plan, label, or test suite).

> 🚧 Global export
>
> Globally exported parameters will be available only in remote runs.

## Exporting a parameter

> 📘
>
> Since parameters are serialized between steps as JSON - only values that may be [serialized](http://json.org/) as [JSON](http://json.org/) may be safely used\*\*.

Let's see how to export parameters. We will add a local export parameter in a custom action and use it later in a custom validation in the same test.

* Start a new test.
* Add a new custom action and type the following in the editor:

```javascript
//For Local export:     
exports.bestTestingTool = "Testim";
//For Test  export:      
exportsTest.bestTestingTool = "Testim";
//For Global export:     
exportsGlobal.bestTestingTool = "Testim";
```

![](https://files.readme.io/1b18e5a-export_param1.gif "export_param1.gif")

3. Add a new custom validation and type the following in the editor:

```javascript
if (bestTestingTool !== "Testim") {
     throw new Error("choose Testim!");
}
```

![](https://files.readme.io/cb9a4de-add_custom_validation.png "add_custom_validation.png")

4. Run the test and see that it is successful.

> 📘
>
> When you need to use parameters inside a group in your test, also use exportsGlobal.

The export parameter will only be available for use after the step, so if you want to use it at the same step it was set, you can do the following:

```javascript
var local = "Testim";
console.log(local);
exports.bestTestingTool = local;
```

> 📘
>
> After running a test, the incoming parameters, and the ones exported in a step appear in its properties panel.

You can also use the export parameter in your JavaScript param.

1. Click on the last step and add a '**js Param**'.

![](https://files.readme.io/cc6cb99-image_19.png "image (19).png")

2. Change the name of the param to "WhoIsAwesome".
3. Change the value of the param in the text box to - bestTestingTool+" is awesome!"

![](https://files.readme.io/cbcab47-exports_params_2.gif "exports_params_2.gif")

4. In the editor change the previous code to:

```javascript
if (WhoIsAwesome !== "Testim is awesome!") {
  throw new Error("choose Testim!");
}
```

5. Run the test and see that it is successful.

**Note:**

* The exports variables support the following:

1. Primitive types - number, string, boolean, etc.
2. Arrays
3. JSON object

* Global export per step is limited to 2MB