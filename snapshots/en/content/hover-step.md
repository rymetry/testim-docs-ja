# Hover Step

Learn how to record "hover" step when testing your app

Add a hover-step to test the behavior of an element that has hover interaction. For example: a menu that opens only with a hover, a tooltip or appearance of new elements (button, explanation over images etc.).

> 📘 Note:
>
> Adding a hover step can not be (currently) captured automatically, and needs to be added in the Editor.

:fa-arrow-right: **To add a Hover step to your test:**

1. Navigate to **Test List > Tests** and open your test.
2. Hover the **arrow** in between existing steps or the **+ button** after the last step.

![736](https://files.readme.io/5e19132-step-arrows.jpg "step-arrows.jpg")

3. Select the **Testim Predefined Steps** button.

![563](https://files.readme.io/ec705b4-predefined-steps.jpg "predefined-steps.jpg")

4. Search for **Hover** in the quick search or expand the **Actions** section and select **Add hover action**.

![627](https://files.readme.io/217c38b-add-hover-action.jpg "add-hover-action.jpg")

5. Testim will open the relevant page for your test. Hover your mouse over the page element and click.

![1008](https://files.readme.io/e7095e9-page-element.jpg "page-element.jpg")

> 📘 Note:
>
> If you get the message "To choose an element Open base URL or Run test to relevant step" this means that you must to have your first run the test so you can select a component from within your application.

The new Hover step is added to your test at the location you selected.

![866](https://files.readme.io/a533136-hover-step-added.jpg "hover-step-added.jpg")

## Adding Validations to Hovered Element

Currently Testim doesn’t fully support adding visible validations to hovered elements. Read more about Step Validations.

:fa-arrow-right: **To validate a hovered element is visible:**

1. Hover over your step and select the **Properties** icon.

![264](https://files.readme.io/ebce7b2-hover-step-properties.jpg "hover-step-properties.jpg")

2. Select **Element must be visible** in the properties panel.

![321](https://files.readme.io/f63b275-element-must-be-visible.jpg "element-must-be-visible.jpg")

> 📘 Note:
>
> To improve performance, update your app code and CSS to ensure an element is visible on mouse out.