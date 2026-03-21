# Validate checkbox/radio button

Validate whether a checkbox or radio button is checked or unchecked

The checkbox and radio button validations allow you to check the state (checked or unchecked) of a checkbox or radio button. When you run your test, the validation step will either pass or fail depending on whether or not the validation condition was met.

> 📘 Checkbox and radio button validations can be used only on native checkboxes or radio input elements. Custom checkbox and radio button implementations that don’t use an underlying input are not supported.

## Adding a Validate checkbox/radio button step

:fa-arrow-right: **To add a Validate checkbox or Validate radio button step:**

1. Hover over the :fa-caret-right: **(arrow symbol)** where you want to add the validation.

![3659](https://files.readme.io/0d8957c-Testim_130a.png "Testim 130a.png")

The action options are displayed.

<Image width="smart" src="https://files.readme.io/d0c62d2-Testim_131a_r.png" />

2. Click on the **Toggle Breakpoint** button.

<Image width="smart" src="https://files.readme.io/d6e78f5-Testim_132_r.png" />

3. Click on the **Play Scenario** button to run the test until the breakpoint.

![3665](https://files.readme.io/784405c-Testim_133a.png "Testim 133a.png")

4. Hover over the :fa-caret-right: **(arrow symbol)** again and click on the **“M”** (Testim predefined steps).\
   The **Predefined steps** menu opens.

<Image width="smart" src="https://files.readme.io/9c03152-Testim_134_r.png" />

5. Click on **Validations**.\
   The Validations menu expands.

<Image width="smart" src="https://files.readme.io/7b3d72a-Testim_135_r.png" />

6. Scroll down through the menu and select **Validate checkbox** or **Validate radio button**.

> 📘 Alternatively, you can use the search box at the top of the menu to search for **Validate checkbox** or **Validate radio button**.

7. In the AUT window, identify the relevant checkbox or radio button that you wish to validate, and click on it to select it.\
   The step is created, and a thumbnail of the selected element is shown in the step.

![3654](https://files.readme.io/e16e50e-Testim_136.png "Testim 136.png")

8. Hover over the step you just created and click on the **Show Properties** (:fa-cog:) icon.

![3633](https://files.readme.io/ee0c7a1-Testim_137a.png "Testim 137a.png")

The **Properties panel** opens on the right-hand side.\
9\. In the **Expected status** section, click either **Checked** (default) or **Unchecked**, depending on which status you want to validate.

<Image width="smart" src="https://files.readme.io/5ed3749-Testim_138a_r.png" />

10. Click on the **Toggle Breakpoint** button after the Validation step to remove the breakpoint.

## Modifying a Validate checkbox/radio button step

If you want to change the checkbox/radio button you selected, you don’t need to delete and re-record the step. Instead, you can reassign the checkbox/radio button with a different checkbox/radio button.

:fa-arrow-right: **To reassign the selected checkbox/radio button in a Validation step:**

1. Hover over the position to the left of the step for which you want to reassign the checkbox/radio button and click on the **Toggle Breakpoint** button.
2. Click on the **Play Scenario** button to run the test until the breakpoint.
3. Hover over the step for which you want to reassign the checkbox/radio button and click on the **Show Properties** (:fa-cog:) icon.

![3667](https://files.readme.io/d39aec2-Testim_139a.png "Testim 139a.png")

The Properties panel opens on the right-hand side.\
4\. Hover over the **Target checkbox/radio button** thumbnail to show options, and click **Reassign**.

<Image width="smart" src="https://files.readme.io/db9dd10-Testim_141a_r.png" />

5. In the AUT window, identify the new checkbox/radio button that you would like to select and click on it.\
   The selected checkbox/radio button is shown in the Target box in the Properties panel.
6. Click on the same **Toggle Breakpoint** button to the left of the step for which you reassigned the checkbox/radio button to remove the breakpoint.