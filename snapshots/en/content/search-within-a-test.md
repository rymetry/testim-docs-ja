# Search Within a Test

Learn how to use the search feature to find objects within a test

The search feature allows you to search for objects within a test. The search is conducted by entering free text (at least three characters) into the search field within the test itself. The search is **NOT** case sensitive.

The search is conducted in the following test objects (see limitations list at the bottom):

* **Step description** - the text that was inputted in the step's **Description** field and/or the **Text to assign** field.
* **JS Code** -  any part of the JS Code that is part of a step. For example, any part of the JS Code in a  [Add custom validations and actions](https://help.testim.io/docs/custom-code) step.
* **Parameters** - the name and/or the value of a JS or HTML parameter inside a step.
* **Base URL** - any part of the base URL.
* **URL** - any part of a URL inside a [Navigation Step](https://help.testim.io/docs/navigation) or [Add an API Action Step](https://help.testim.io/docs/api-testing#adding-an-api-action-step)
* **Test Data** - any part of the Test Data in a step.
* **Condition** -  the any part of the Java Script condition defined in the **When to run step** attribute of the step when the **Custom** option is selected. See [Conditions](https://help.testim.io/docs/conditions)
* **Loop** -  the any part of the Java Script condition defined in the **When to run step** attribute of the step when the **Loop for** option is selected.

## Using the search

:fa-arrow-right: **To search within a test:**

1. In the test, click the **Search** button.\
   ![](https://files.readme.io/e200c02-searchbutton.png)
2. Type your search query. The search is NOT case sensitive. The search query should include at lease three characters.\
   The search results appear in the **Search Results** pane. Each result represents a step that includes one or more elements that matched (fully or partly) the search query. The string that matches the search is highlighted in yellow. For more information see [Understanding the search results](https://help.testim.io/docs/search-within-a-test#understanding-the-search-results) section.\
   ![](https://files.readme.io/f945272-searchresults.JPG)
3. Click any on the search results to open the step.

## Understanding the search results

The search results are grouped into categories according to the object type. Next to each category the number of occurrences is displayed. Unless explained otherwise, clicking on the result will navigate to the step where the result was found.

* **Step Description** - the first line of the result displays the value of the step's **Description** field and/or the **Text to assign** field that included a match with the search string . The matching string is highlighted in yellow. The second line includes the category name followed by the name of the step (which in this case is the value in the **Text to assign** field)
* **JS Code** - the first line of the result displays number of occurrences that were found. The second line includes the category name followed by the name of the step. Click the result to enter the JS code editor inside the step.
* **Parameters** - the first line of the result displays the name and the value of the parameter. The matching string is highlighted in yellow. The second line includes the category name followed by the name of the step. Multiple matches will be displayed separately in different results.
* **Base URL** - the first line of the result displays the Base URL value. The matching string is highlighted in yellow. The second line includes the category name followed by the name of the step.
* **URL** - the first line of the result displays the Base URL value. The matching string is highlighted in yellow. The second line includes the category name followed by the name of the step.
* **Test Data** - the first line of the result displays number of occurrences that were found. The second line includes the category name followed by the name of the step.
* **Condition** - the first line of the result displays number of occurrences that were found. The second line includes the category name followed by the name of the step. Click the result to enter the JS code editor inside the step.
* **Loop** - the first line of the result displays number of occurrences that were found. The second line includes the category name followed by the name of the step. Click the result to enter the JS code editor inside the step.

### Search limitations

The values that CANNOT be found by using the search feature:

* Extract value - variable name
* Sleep - sleep duration
* Generate email address -variable name
* Set cookie - everything except description
* Get cookie - cookie name & variable name
* Run dev-kit - function name
* API - everything except URL and function
* Generate random value - everything except description
* Generate date - everything except description