# Validate email

Validate sign-up and login flows

Testim offers a built-in email service which provides permanent and temporary email addresses. The *Validate email* step can be used to validate that an email was sent to these email addresses. This step is typically used to test your app sign-up or login flows.

> 📘 This is a pro feature
>
> This is a pro feature only open to projects on our professional plan. To learn more about our professional plan, click [here](https://www.testim.io/pricing/).

The *Validate email* step is a predefined validation step that receives your Testim inbox content of a specified Testim email address as an array of all of the messages within that mailbox, contained in a parameter named *messages* with the following fields:

| Field name       | Return type                                                                                                                                                               |
| :--------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| attachments      | [AttachmentCollection](http://ews-javascript-api.github.io/api/classes/complexproperties_attachmentcollection.attachmentcollection.html)                                  |
| from             | [EmailAddress](http://ews-javascript-api.github.io/api/classes/complexproperties_emailaddress.emailaddress.html)                                                          |
| to               | [EmailAddressCollection](http://ews-javascript-api.github.io/api/classes/complexproperties_emailaddresscollection.emailaddresscollection.html)                            |
| subject          | string                                                                                                                                                                    |
| date (time sent) | Date                                                                                                                                                                      |
| received\_date   | Date                                                                                                                                                                      |
| message\_id      | string                                                                                                                                                                    |
| headers          | [InternetMessageHeaderCollection](http://ews-javascript-api.github.io/api/classes/complexproperties_internetmessageheadercollection.internetmessageheadercollection.html) |
| html             |                                                                                                                                                                           |
| text             | string                                                                                                                                                                    |
| mail\_from       | [EmailAddress](http://ews-javascript-api.github.io/api/classes/complexproperties_emailaddress.emailaddress.html)                                                          |
| rcpt\_to         | [EmailAddressCollection](http://ews-javascript-api.github.io/api/classes/complexproperties_emailaddresscollection.emailaddresscollection.html)                            |
| size             | number                                                                                                                                                                    |
| projectId        | string                                                                                                                                                                    |
| email            | string                                                                                                                                                                    |
| expire\_at       | string                                                                                                                                                                    |
| created\_at      | string                                                                                                                                                                    |
| updated\_at      | string                                                                                                                                                                    |

The email validation can use one of two types of emails to receive the emails that will be validated:

* **Permanent email** - Testim offers a permanent email address that you can use for many purposes, including testing login flows and password reset flows. As part of the test, you will be able to validate that emails are sent to the email address, by adding this email address to the **Validate Email** step. This step will validate that the email was received in the permanent email address, for example, by fetching a link from the email and exporting it.
* **Temporary email** - There are times you may need to generate a new random email address every time you run a test, for example to test a sign-up flow multiple times with a new user each time. Using the **Generate email address** step, a new email address is generated with every run. You will configure the **Generate email address** step to save the temporary email address as a parameter. And then you will be able to validate that emails are sent to the temporary email address, by adding this parameter to the **Validate Email** step. The **Validate Email** step will validate that the email was received in the temporary email address, for example, by fetching a link from the email and exporting it.

As a preliminary step to validating emails, create a **permanent email** or use the **Generate email address step** to generate a temporary email address as follows.

> 📘
>
> Testim generates email addresses exclusively through its own email service and does not have the ability to utilize third-party email services for creating permanent or temporary email addresses.

# Option A - Creating a permanent email address

The process assumes that you have an existing or new test that will include the **Validate email** step.

:fa-arrow-right: **To create a permanent email:**

1. On the left menu, click on the **Settings** icon.

![](https://files.readme.io/87c09ff-settings.png)

2. Click the **Email Service** tab.

![](https://files.readme.io/a11da76-emailservice.png)

3. Click the **Generate Email Address** button.

![](https://files.readme.io/16ade5a-213f19a-Testim_293a.png)

4. A random email address is generated and shown on the page. Hover your mouse over the email address and click **Copy**, to copy the email address or **Inbox** to view the email's inbox.

![](https://files.readme.io/b1096f1-caa2097-Testim_295_r.png)

## Using the permanent email in the relevant steps of the test

This email address can be used as an input in the test. For example, a test that validates the sign up process, in which the user enters an email and password and then receives an email with a link that should be clicked in order to confirm/validate the email. In this example, the permanent email address will be used in the sign up step, where the user enters the email address.

In the example below, the permanent email address was entered to the **Text to assign** field of the **Set text** step, where the user enters the email address into the email field.

![](https://files.readme.io/ee9773d-signupflow.png)

# Option B - Generating a temporary email address

The process assumes that you have an existing or new test that will include the **Generate email address** and the  **Validate email** steps.

## Adding the Generate Email Address step

In this step we will add the step that will generate the temporary email address and save the address as a variable to be used in other steps.

:fa-arrow-right: **To generate a temporary email address:**

1. Hover over the :fa-caret-right: **(arrow symbol)** where you want to add the step.

![](https://files.readme.io/856a8f8-Testim_298a.png "Testim 298a.png")

The **action options** are displayed.

![](https://files.readme.io/fd77ed2-Testim_283a_r.png "Testim 283a_r.png")

2. Click on the “**M**” (Testim predefined steps).\
   The **Predefined steps** menu opens.

![](https://files.readme.io/0ab4994-Testim_270_r2.png "Testim 270_r2.png")

3. Click on **Actions**.\
   The **Actions** menu expands.

![](https://files.readme.io/4502efd-Testim_299_r.png "Testim 299_r.png")

4. Scroll down through the menu and select **Generate email address**.

> 📘
>
> Alternatively, you can use the search box at the top of the menu to search for **Generate email address**.

A “Generate email address” step is added in the **Editor**.

5. Hover over the newly created step, and click on the **Show Properties** (:fa-cog:) icon.

![](https://files.readme.io/fb10c5b-Testim_300a.png "Testim 300a.png")

The **Properties** panel opens on the right-hand side.

![](https://files.readme.io/4952255-Testim_301_r.png "Testim 301_r.png")

6. In the **Variable name** field, enter name for the variable that will hold the temporary email address. For example, use the value `emailAddress`.
7. In the **Variable scope** field, specify the scope in which the variable can be passed:
   1. **Local**: Allows you to pass the *emailAddress* parameter between steps in the same scope. *This is the default*.
   2. **Test**: Allows you to pass the *emailAddress* parameter between steps and groups in the same test.
   3. **Suite**: Allows you to pass the *emailAddress* parameter between tests in the same test suite.
8. Set additional settings in the step and parameters as needed.
9. Copy the parameter name in the **variable name** field. (e.g. the name `emailAddress`)-  This parameter will be used in the **Email Validation** step.

# Sending emails to the appropriate Testim inbox in advance

At this point the permanent or temporary inboxes are empty from emails. To test that emails are being received in the new inbox, you may want to point the email service to send emails to the newly created inbox.

## Finding the email address of the inbox

### Permanent email address option

:fa-arrow-right: **To find the permanent email address:**

1. Go to **Settings > Email Service**.\
   The permanent email addresses are displayed.\
   ![](https://files.readme.io/3b33312-emailaddresses.png)
2. Hover over the relevant email and click **Copy**.\
   ![](https://files.readme.io/bb1c588-emailaddresses2.png)

### Temporary email address option

In case of the temporary email address option, by using the **Generate email address** step, a new email address is generated with every run. You will configure the **Generate email address** step to save the temporary email address as a parameter. For example, in the following  **Generate email address** step, the parameter the holds the temporary email address is called `tempEmail`. This parameter, which holds the temporary email address, can be used to send the email address to the email service, by for example, using an API step in Testim.

![](https://files.readme.io/a0c8558-tempEmail.png)

It is also possible to view and copy the temporary email address from the Email Service screen.

:fa-arrow-right: **To find the temporary email address:**

1. Go to **Settings > Email Service**.\
   The temporary email addresses are marked with "Temporary" in the title.\
   ![](https://files.readme.io/f061421-image_1.png)
2. Hover over the relevant email and click **Copy**.\
   ![](https://files.readme.io/18ef3a0-image_2.png)

## Using a Run API Action step

The Run API Action step can be used to send the temporary/permanent email address information to an email service and to invoke the service to send an email to this email address.

The following test example includes a **Generate email address** step, which will generate a temporary email address and store this email address as a parameter called `emailAddress`.

![](https://files.readme.io/a86cebf-image.png)

![](https://files.readme.io/5973c2a-image_1.png)

Following the **Generate email address** step, there is an **Run API Action** step. This step sends a POST API call to the email service and uses the parameter `emailAddress` that was defined in the **Generate email address** step as an input to populate the destination email address, which is defined in the `toAddress` parameter in the code.

![](https://files.readme.io/e2ae339-image_2.png)

## Sending emails through any email service

You can also send emails to the permanent/temporary email addresses directly through the email services.

# Creating a Validate Email Step

As part of this test we want to check that the email (e.g., signup confirmation) was sent to the permanent  or temporary email, by adding a **Validate email step**.

There are two ways to configure the Validate email step:

* **Coded** - using a JavaScript code it is possible, for example, to check if the email inbox includes the relevant email and also the code can export the links from this email.
* **Codeless**- this involves configuring settings from the UI that enable the step to identify the relevant email based on a variety of possible conditions and export links or texts from the email.

## Creating a Validation Email Step using the Coded Option

:fa-arrow-right: **To create the validate email step:**

1. Hover over the :fa-caret-right: **(arrow symbol)** where you want to add the step.

![](https://files.readme.io/e4b6b3d-Testim_302a.png "Testim 302a.png")

The **action options** are displayed.

![](https://files.readme.io/cbc623c-Testim_283a_r.png "Testim 283a_r.png")

2. Click on the “**M**” (Testim predefined steps).\
   The **Predefined steps** menu opens.

![](https://files.readme.io/408099e-Testim_270_r2.png "Testim 270_r2.png")

3. Click on **Validations**.\
   The **Validations** menu expands.

![](https://files.readme.io/056be62-Testim_303_r.png "Testim 303_r.png")

4. Scroll down through the menu and select **Validate email**.

> 📘
>
> Alternatively, you can use the search box at the top of the menu to search for **Validate email**.

The **Add Step** window is shown.

![](https://files.readme.io/667ffe5-Testim_215_r.png "Testim 215_r.png")

5. In the **Name the new step** field, enter a (meaningful) name for this step.

6. If this is a shared step to be made available to reuse in this or other tests, keep the box next to **Shared step** selected (default), and choose a folder from the **Select shared step folder** list where you want this step stored. Otherwise, deselect the checkbox.\
   For more information about shared steps, see [Groups](https://help.testim.io/docs/groups).

7. Click **Create Step**.

8. Click the **Coded** tab.\
   ![](https://files.readme.io/fa0a6bb-coded.png)\
   The **function** editor opens, and the **Properties** panel opens on the right-hand side.

9. Do one of the following:\
   **For the permanent email option** - copy the permanent email address and paste it into the **Email address** field. This email address should be surrounded by single or double quotes.

![](https://files.readme.io/9489320-emailaddressfield.png)

**For the temporary email option** -

Enter the name of the **Variable name** parameter, which you defined in the **Generate email address** step,  into the **Email address** field.\
![](https://files.readme.io/3bfe619-image.png)

> 🚧 The **Email address** field is mandatory.

10. Set additional settings in the step and parameters as needed.
11. In the **function** text box, type in the desired JavaScript code. If you have defined parameters, you can refer to those parameters in your JavaScript code. See the [Email validation examples](https://help.testim.io/docs/email-validation#email-validation-examples) section below to learn about different ways to validate the email. The code will typically use value entered into the Email address field as a parameter in the code.

> 📘
>
> If you are using DOM selectors other than HTML parameters (e.g. jQuery), then empty arrays are truthy, so you need to use `$(<query>).length` instead of `$(<query>)`.

12. Click the back arrow to return to the main Editor window.

![](https://files.readme.io/b4b8e1e-back.png)

> 📘
>
> If you opened your AUT to define an HTML element as a parameter, click on the **Toggle Breakpoint** button to remove the breakpoint.

The step is created.

### Coded email validation examples

#### Validate sign-up subject line

You can use the *Validate email* step to validate the contents of the subject line of an email generated by your app that was sent to a Testim-generated email address.

![](https://files.readme.io/120320e-Testim_306.png "Testim 306.png")

**Example Code:**

```javascript
// Check if messages variable is falsy or if messages[0] is falsy
if (messages && messages[0] ){
  // If either condition is true, throw an error
  return messages[0].subject === "Thank you for signing up";
}
return false;
```

#### Validate links in body

You can use the *Validate email* step to look for hyperlinks in the body of an email, and return the text component and link component of each link found.

![](https://files.readme.io/df541fc-Testim_307.png "Testim 307.png")

**Example Code:**

```javascript
if (!messages && !messages[0]){
  throw new Error("Failed to find message in inbox ");
}
// Define a function named getLinks which takes an HTML string as input
function getLinks(html) {
  // Create a DOMParser object to parse HTML strings
   var parser = new DOMParser();
  // Parse the HTML string into a DOM document
   var doc = parser.parseFromString(html, "text/html");
  // Find all anchor elements in the document 
  var linksElements =  Array.from(doc.querySelectorAll("a"));
  // Map over the array of anchor elements and extract their text and href attributes
  return linksElements.map(linkElement => ({
// Return an object with text and link properties
    text:linkElement.innerText,
    link:linkElement.getAttribute("href")
  }));
}
// Call the getLinks function with the HTML content of the first message
var emailLinks = getLinks(messages[0].html);
//Exports the first link in the array to the next test steps
exportsTest.emailLink = emailLinks[0];  
```

## Creating a Validate Email Step using the Codeless Option

:fa-arrow-right: **To create the validate email step:**

1. Hover over the :fa-caret-right: **(arrow symbol)** where you want to add the step.

![](https://files.readme.io/e4b6b3d-Testim_302a.png "Testim 302a.png")

The **action options** are displayed.

![](https://files.readme.io/cbc623c-Testim_283a_r.png "Testim 283a_r.png")

2. Click on the “**M**” (Testim predefined steps).\
   The **Predefined steps** menu opens.

![](https://files.readme.io/408099e-Testim_270_r2.png "Testim 270_r2.png")

3. Click on **Validations**.\
   The **Validations** menu expands.

![](https://files.readme.io/056be62-Testim_303_r.png "Testim 303_r.png")

4. Scroll down through the menu and select **Validate email**.

> 📘
>
> Alternatively, you can use the search box at the top of the menu to search for **Validate email**.

The **Add Step** window is shown.

![](https://files.readme.io/667ffe5-Testim_215_r.png "Testim 215_r.png")

5. In the **Name the new step** field, enter a (meaningful) name for this step.

6. If this is a shared step to be made available to reuse in this or other tests, keep the box next to **Shared step** selected (default), and choose a folder from the **Select shared step folder** list where you want this step stored. Otherwise, deselect the checkbox.\
   For more information about shared steps, see [Groups](https://help.testim.io/docs/groups).

7. Click **Create Step**.\
   ![](https://files.readme.io/873ab96-codeless_screen.png)

8. Under **Email Filters**, specify the conditions to identifying the email in the inbox by selecting the checkboxes of the condition types that you want to enable. Emails that match all of these conditions (i.e., AND condition) will be validated and the step will pass, if non of emails in the inbox matches these conditions, the step will fail. All conditions are optional, but at least one condition should be active:
   1. **Time range** -  specify the time range in minutes of the emails received in the inbox. For example, enter 30 to scan the email that were received in the last 30 minutes.
   2. **Expected subject** - type the text or part of the text that should be in the subject of the email to match. This can be a partial match. The text field may contain parameters that are within scope, such as `{{param1}}` for instance.
   3. **Expected body** - type the text or part of the text that should be in the body of the email to match. This can be a partial match. The text field may contain parameters that are within scope, such as `{{param1}}` for instance.

9. Under **Email text extraction**, specify what should be optionally extracted from the body of the emails that were matched by the email filters, this can be either texts from the email or links from the email. For example, if the email contains a code, similar to SMS code, you can use this feature to extract this code. The extracted texts and links will appear in the step result after its execution. All links are extracted automatically regardless of the extraction settings:

   1. Select the checkbox to enable.
   2. Select one of the following:
      1. **Location**- select this option if you want to configure conditions for extraction based on the location of the extracted texts.
      2. **Regex** - select this option if you want to enter a regular expression as the condition that will define which texts will be extracted from the email.
         > 📘
         >
         > Entries in this section are case sensitive.
   3. If you have selected the **Location** option, select one of the following:

      1. **Extraction between** - select to extract the text/links that is between the text in the first field and the text in the second field. Type the strings in the first and second fields to define the beginning (after which the text will be extracted) and the end (before which the text will be extracted).
      2. **Extraction from** - select to extract the text/links that is from the text in the field until the end of the email. Type the strings in the field to define the beginning (after which the text will be extracted).
      3. **Extraction until** - select to extract the text/links that is from the beginning of the email until the text in the field. Type the strings in the first field to define the end (before which the text will be extracted).

         The text fields may contain parameters that are within scope, such as `{{param1}}` for instance.
   4. If you have selected the **Regex** option, enter the regex condition for text extraction in the filed. To see usage examples of regex conditions, [click here](https://www.sitepoint.com/demystifying-regex-with-practical-examples/).

10. If you want to verify the email filter and the extraction:
    1. Under **Verification email inbox address** section, click the field and select one of the permanent email addresses.
    2. Click **Verify Email Filters**.\
       When looking at test run, after drilling down the step, the following pane is displayed on the right. The pane displays information about emails that were captured in the specified inbox, including information about the sender, the extracted texts, and the links that were captured.\
       ![](https://files.readme.io/74073d1-verify.png)

11. Do one of the following:\
    **For the permanent email option** - copy the permanent email address and paste it into the **Email address** field. This email address should be surrounded by single or double quotes.\
    ![](https://files.readme.io/55551bf-image_3.png)\
    **For the temporary email option** -\
    Enter the name of the **Variable name** parameter, which you defined in the **Generate email address** step,  into the **Email address** field.\
    ![](https://files.readme.io/d50b959-image_4.png)

12. Set additional settings in the step and parameters as needed.

13. Close the pane, click back to view the test, and click **Save** to save the changes.

14. Set additional settings in the step and parameters as needed.

The step is created.

### Export parameters

After the step is created, it provides three export parameter that can be used in other steps that are located after the email validation step:

* `emailData` - includes all the parameters in the filtered email
* `emailExtractedText` - includes the optional extracted text
* `emailExtractedLinks` - includes the optional array of extracted links.\
  `emailExtractedLinks` is an array; to access an entry within the array, use `emailExtractedLinks[n]`, where `0` represents the first entry.