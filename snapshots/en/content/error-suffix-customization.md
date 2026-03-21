# Error Suffix Customization

Customize the error message of a step

As part of the step's properties configuration, you can add a custom message as a suffix to the error message that is displayed when the step fails. The suffix can include a string as well as parameters.

:fa-arrow-right: **To add an error suffix:**

1. Click the **Show Properties** button to open the step's Properties Pane.\
   ![](https://files.readme.io/3df46b7-showproperties.png)
2. In the **Error suffix** field, enter the string and/parameters that will be displayed if the step has failed. For example, just a string - 'my custom error', or combining a string with a parameter - ‘my custom error’ + `Param1`.\
   ![](https://files.readme.io/115d4d0-errorsuffix1.png)

When the step fails, the error will be displayed combining the system error with the custom error suffix as follows:

```
<testim error>. Details: <user error>
```

<Image align="center" src="https://files.readme.io/0253da5-errorsuffix2.png" />