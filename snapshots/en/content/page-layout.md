# Page Layout

A Page Layout in Salesforce is a framework that determines the presentation of fields, related lists, and custom links on object record pages. In Salesforce, the various page layouts are assigned to Profiles, which means that a user working on an object record, will only view the fields that are included in the Page Layout that has been assigned to their Profile.

By default, in Testim for Salesforce, when configuring one of the steps in the **Record Operations** category, such as the [Edit](https://help.testim.io/docs/sfdc-step-edit) step, the fields that are displayed in the step's pane are based on the Page Layout that is assigned in Salesforce to the user who configured the initial connection between Testim for Salesforce and the Salesforce platform.

The Page Layout feature allows you to select any of the available page layouts to be used as part of a Record Operations step, enabling greater control and accessibility to the various Salesforce object record fields. The feature is available on the following steps:

* [Edit](https://help.testim.io/docs/sfdc-step-edit)
* [Create](https://help.testim.io/docs/sfdc-step-create)
* [Validate](https://help.testim.io/docs/sfdc-step-validate)

> 🚧 Access to fields in runtime
>
> When running the test, if the logged-in user (which is the user defined in the Login step) DOES NOT have access to the selected Page Layout (i.e., the user does not have permissions to view/edit this field), the step will fail. However, if there is no action defined in this field (e.g., Input, Verify, etc.), Testim will not look for this field and the test will pass. So to add an action to a field, make sure that the logged-in user has access to it.

## Setting the Page Layout

:fa-arrow-right:**To set the page layout:**

1. When configuring the step, after selecting the **Object** and **Record Type**, in the **Page Layout** drop-down menu, select one of the following:
   1. **All field** - for Salesforce Dynamic Forms, this option will display all the possible fields for object record, even fields that are not part of a Page Layout.
   2. **Page Layouts** - under this option, select one of the available page layouts that have been configured in Salesforce.
2. Configure the fields as instructed in the related step instructions.

> 📘
>
> If before selecting the layout you have already configured a field (i.e., entered a value), but this field is not part of the Page Layout that you end up selecting, the test will fail with an error in this field.