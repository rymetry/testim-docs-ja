# Shared Steps

Shared Steps are steps that are shared between multiple tests within a certain Project. Some of the step types are shared steps by default (i.e. you will not need to configure them as shared steps). The shared steps will be available for other users creating other tests.\
The following tables list which predefined steps are shareable without the need to group them with other steps:

### Validations

| Validations            | Documentation                                                                                                  |
| :--------------------- | :------------------------------------------------------------------------------------------------------------- |
| Add custom validation  | [Add custom validations and actions](https://help.testim.io/docs/custom-code)                                                          |
| Add CLI validation     | [Adding a CLI step](https://help.testim.io/docs/validate-download#adding-a-cli-step)                                                   |
| Validate download      | [Adding a Validate download validation step](https://help.testim.io/docs/validate-download#adding-a-validate-download-validation-step) |
| Validate email         | [Validate email](https://help.testim.io/docs/email-validation)                                                                         |
| Validate API           | [API Validation](https://help.testim.io/docs/api-testing#api-validation)                                                               |
| Add network validation | [Add network validation](https://help.testim.io/docs/add-network-validation)                                                           |

### Wait for

| Wait For            | Documentation                                                |
| :------------------ | :----------------------------------------------------------- |
| Add custom wait for | [Custom Wait for](https://help.testim.io/docs/wait-for#custom-wait-for)              |
| Add CLI wait for    | [Adding a CLI step](https://help.testim.io/docs/validate-download#adding-a-cli-step) |
| Wait for download   | [Wait for Download](https://help.testim.io/docs/wait-for#wait-for-download-web)      |

### Actions

| Actions           | Documentation                                                |
| :---------------- | :----------------------------------------------------------- |
| Add custom action | [Add custom validations and actions](https://help.testim.io/docs/custom-code)        |
| Add CLI action    | [Adding a CLI step](https://help.testim.io/docs/validate-download#adding-a-cli-step) |
| Add API action    | [API Action](https://help.testim.io/docs/api-testing#api-action)                     |

## Creating a New Shared Step

You can define a step as a Shared Step when adding it to a test. This applies to the steps that are shareable, as listed above.\
**:fa-arrow-right:To add a shared step:**

1. Hover over the (arrow symbol) where you want to add the step.
2. Click on the "M" (Testim predefined steps).
3. Select a relevant step from the list of Predefined steps.
4. In the **Add Step** dialog, select the **Shared step** checkbox.

   <Image align="center" width="50% " src="https://files.readme.io/3a14d05-image.png" />
5. If you want to place the Shared Step in a folder other than the **Root** folder, under **Select shared step folder**, click the field and select one of the existing folders or click the **Add Folder** icon and name the new folder. Click **Select** to finish.

   <Image align="center" src="https://files.readme.io/a69521b-addfolder.png" />

## Turning an Existing Step into a Shared Step

When a step ,that can be a shared step, is added as regular step, you always have the option to transform it into a Shared Step.

**:fa-arrow-right:To turn an existing step into a shared step:**

1. On a regular step that can be a shared step, click the Show Properties button.

   <Image align="center" src="https://files.readme.io/d887de9-showproperties.png" />
2. On the Properties pane, click the **Shared Step** link.

   <Image align="center" src="https://files.readme.io/54d39fb-shaedsteplink.png" />

## Reusing a Shared Step

When creating a test, you can access the list of previously created shared steps.\
**:fa-arrow-right:To reuse a shared step:**

1. Hover over the (arrow symbol) where you want to add the step.\
   The action options are displayed.
2. Click on the "M" (Testim predefined steps).\
   The Predefined steps menu opens.
3. Click on the **Shared Steps** tab.\
   The list of steps is displayed.
4. Click on a desired shared step to add it to the test.
5. Click the **Properties** (:fa-cog:) icon to modify its properties.

![](https://files.readme.io/574a179-sharedstep.gif "sharedstep.gif")