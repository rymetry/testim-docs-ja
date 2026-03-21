# Validate CSS property

Validate any CSS property of an element

The CSS property validation allows you to validate any CSS property of an element (e.g. color, background-color, font-family, etc.).

## Adding a Validate CSS property step

:fa-arrow-right: **To add a Validate CSS property step:**

1. Hover over the :fa-caret-right: **(arrow symbol)** where you want to add the validation.

![](https://files.readme.io/cd930ed-Testim_142a.png "Testim 142a.png")

The **action options** are displayed.

<Image align="center" width="smart" src="https://files.readme.io/ed11e56-Testim_143a_r.png" />

2. Click on the **Toggle Breakpoint** button.

<Image align="center" width="smart" src="https://files.readme.io/c4168b0-Testim_144_r.png" />

3. Click on the **Play Scenario** button to run the test until the breakpoint.

![](https://files.readme.io/87450ab-Testim_145a.png "Testim 145a.png")

4. Hover over the :fa-caret-right: **(arrow symbol)** again and click on the **“M”** (Testim predefined steps).\
   The **Predefined steps** menu opens.

<Image align="center" width="smart" src="https://files.readme.io/b552e53-Testim_134_r.png" />

5. Click on **Validations**.\
   The **Validations** menu expands.

<Image align="center" width="smart" src="https://files.readme.io/dc8c30a-Testim_135_r.png" />

6. Scroll down through the menu and select **Validate CSS property**.

> 📘
>
> Alternatively, you can use the search box at the top of the menu to search for **Validate CSS property**.

7. In the **AUT** window, identify the relevant element for which you wish to validate a CSS property, and click on it to select it.\
   The **CSS Property Validation** form is shown.

<Image align="center" width="smart" src="https://files.readme.io/1399203-cssvalidation2.png" />

8. In the **Property name** field, enter a valid CSS property for the element.
9. In the **Expected value** field, enter the value you wish to validate for the property. Values can be one of the following:
   1. **Hardcoded value** - to use a hardcoded value, place the value between quotes (e.g., 'x')
   2. **Parameter value** - to use a parameter, enter the name of the defined parameter without quotes.
10. Click **OK**.\
    The step is created, and a thumbnail of the selected element is shown in the step.

![](https://files.readme.io/efe9aec-Testim_147.png "Testim 147.png")

11. Click on the **Toggle Breakpoint** button after the validation step to remove the breakpoint.

## Modifying a Validate CSS property step

If you want to change the element you selected, you don’t need to delete and re-record the step. Instead, you can reassign the element with a different element. Additionally, you can modify the property name and/or expected value of the original element you selected without selecting a new element.\
:fa-arrow-right: **To reassign the selected element in a Validation step:**

1. Hover over the position to the left of the step for which you want to reassign the element and click on the **Toggle Breakpoint** button.
2. Click on the **Play Scenario** button to run the test until the breakpoint.
3. Hover over the step for which you want to reassign the element and click on the **Show Properties** (:fa-cog:) icon.

![](https://files.readme.io/00517ed-Testim_148a.png "Testim 148a.png")

The **Properties** panel opens on the right-hand side.

4. Hover over the **Target element** thumbnail to show options, and click **Reassign**.

<Image align="center" width="smart" src="https://files.readme.io/d15fcbd-Testim_150a_r.png" />

5. In the **AUT** window, identify the new element that you would like to select and click on it.\
   The selected element is shown in the **Target element** box in the **Properties** panel.
6. In the **Properties** panel **Property name** field enter the property name for the new element.
7. In the **Properties** panel **Expected value** field enter the expected value of the new property.

> 📘
>
> When modifying the value of the **Property name** and **Expected value** in the **Properties** panel, make sure they are enclosed in single quotes: e.g. ‘background’ and ‘#ffea64’.

8. Click on the same **Toggle Breakpoint** button to the left of the step for which you reassigned the element to remove the breakpoint.
9. If you want to modify the property name and/or expected value of the *original* element you selected (without choosing a new element), follow Steps 3, 6, and 7 above.