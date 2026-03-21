# Validate HTML attribute (Web)

Validate any HTML attribute in your app

The HTML attribute validation allows you to validate the value of any HTML attribute of an element (e.g. *href*, *src*, *alt*, *title*, etc.). It is also possible to validate a "disabled" attribute, as explained below.

## Adding a Validate HTML attribute step

:fa-arrow-right: **To add a Validate HTML attribute step:**

1. Hover over the :fa-caret-right: **(arrow symbol)** where you want to add the validation.

![](https://files.readme.io/a0c5a27-Testim_233a.png "Testim 233a.png")

The **action options** are displayed.

![](https://files.readme.io/9ad04c9-Testim_234a_r.png "Testim 234a_r.png")

2. Click on the **Toggle breakpoint** button.

![](https://files.readme.io/3040109-Testim_235_r.png "Testim 235_r.png")

3. Click on the **Run test** button, to run the test until the breakpoint.

![](https://files.readme.io/c3f0d75-Testim_236a.png "Testim 236a.png")

4. Hover over the :fa-caret-right: **(arrow symbol)** again and click on the “**M**” (Testim predefined steps).\
   The **Predefined steps** menu opens.

![](https://files.readme.io/0bd37d9-Testim_237_r.png "Testim 237_r.png")

5. Click on **Validations**.\
   The **Validations** menu expands.

![](https://files.readme.io/e3e4f2e-Testim_238_r.png "Testim 238_r.png")

6. Scroll down through the menu and select **Validate HTML attribute**.

> 📘
>
> Alternatively, you can use the search box at the top of the menu to search for **Validate HTML attribute**.

7. In the **AUT** window, identify the relevant element for which you wish to validate an HTML attribute, and click on it to select it.\
   The **HTML Attribute Validation** form is shown.

![](https://files.readme.io/4a3f8b9-Testim_239_r.png "Testim 239_r.png")

8. In the **Attribute name** field, enter a valid HTML attribute that you wish to validate (e.g. *href*, *src*, *alt*, *title*, etc.).
9. In the **Expected value** field, enter the value you wish to validate for the attribute (e.g. *[https://www.testim.io](https://www.testim.io)*).

> 📘
>
> For the expected value you can use regex. For example, 'href' that starts with https will have the following regex:/^https/

10. Click **OK**.\
    The “Validate HTML attribute” step is added in the **Editor**, and a thumbnail of the selected element is shown in the step.
11. Click on the **Toggle Breakpoint** button after the validation step to remove the breakpoint.

### Validating a "disabled" attribute

It is also possible to validate a "disabled" HTML attribute.

:fa-arrow-right: **To validate a disabled attribute:**

1. Perform steps 1-6 above.

2. In the **AUT** window, identify the relevant element for which you wish to validate the "disabled" HTML attribute, and click on it to select it.\
   The **HTML Attribute Validation** form is shown.

3. In the **Attribute name** field, enter the value 'disabled'.

4. In the **Expected value** field, do not enter any value.
   <Image align="center" src="https://files.readme.io/a78b8f5-image.png" />

5. Click **OK**.\
   The “Validate HTML attribute” step is added in the **Editor**, and a thumbnail of the selected element is shown in the step.
   <Image align="center" src="https://files.readme.io/a1bbe4a-image_1.png" />

6. Click on the **Toggle Breakpoint** button after the validation step to remove the breakpoint.

## Modifying a Validate HTML attribute step

If you want to change the element you selected, you don’t need to delete and re-record the step. Instead, you can reassign the element with a different element. Alternatively, you can modify the attribute name and/or expected value of the original element you selected without selecting a new element.

:fa-arrow-right: **To reassign the selected element in a Validation step:**

1. Hover over the position to the left of the step for which you want to reassign the element and click on the **Toggle breakpoint** button.
2. Click on the **Run test** button to run the test until the breakpoint.
3. Hover over the step for which you want to reassign the element and click on the **Show Properties** (:fa-cog:) icon.

![](https://files.readme.io/330255f-Testim_240a.png "Testim 240a.png")

The **Properties** panel opens on the right-hand side.

4. Hover over the **Target element** thumbnail to show options, and click **Reassign**.

![](https://files.readme.io/1272545-Testim_241a_r.png "Testim 241a_r.png")

5. In the **AUT** window, identify the new element that you would like to select and click on it.\
   The selected element is shown in the **Target element** box in the **Properties** panel.
6. In the **Properties** panel **Attribute name** field enter the attribute name for the new element.
7. In the **Properties** panel **Expected value** field enter the expected value of the new attribute.

> 📘
>
> When modifying the value of the **Attribute name** and **Expected value** in the **Properties** panel, make sure they are enclosed in single quotes: e.g. ‘href’ and ‘[https://www.testim.io’](https://www.testim.io’).

8. Click on the same **Toggle Breakpoint** button to the left of the step for which you reassigned the element to remove the breakpoint.

:fa-arrow-right: **To modify the properties of the*original* element:**

1. Hover over the step for which you want to reassign the element and click on the **Show Properties** (:fa-cog:) icon.

![](https://files.readme.io/8f90779-Testim_242a.png "Testim 242a.png")

The **Properties** panel opens on the right-hand side.

![](https://files.readme.io/aa817ce-Testim_241_r.png "Testim 241_r.png")

2. In the **Properties** panel **Attribute name** field enter the new attribute name for the element.
3. In the **Properties** panel **Expected value** field enter the new expected value of the attribute.

> 📘
>
> When modifying the value of the **Attribute name** and **Expected value** in the **Properties** panel, make sure they are enclosed in single quotes: e.g. ‘href’ and ‘[https://www.testim.io’](https://www.testim.io’).