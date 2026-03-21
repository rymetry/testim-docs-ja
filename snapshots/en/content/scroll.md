# Scroll Step

Understand how scroll step works

Scroll steps are automatically added to your tests each time you scroll on the page. In most cases the recorded scroll steps work seamlessly in your test. For the rare cases where scroll steps need adjustment, you have the ability to change the settings of each step to ensure the test functions exactly as you need it to.

**Scroll Step Types**:

* **Scroll to Element**: this scroll step is automatically recorded when you scroll and interact with a specific element on the page.
* **Scroll on Page**: this scroll step is automatically recorded when you scroll vertically or horizontally on the page using the mouse wheel or moving the browser scroll bars.
* **Mouse Wheel**: this scroll step is automatically recorded when you use the mouse wheel to interact with a page element, such as zooming on a map.

## Recording Scroll Steps

### How to Record a Scroll to Element Step

The Scroll to Element step will be **automatically recorded** when you scroll and interact with an element on the page.

:fa-arrow-right: **To record a Scroll to Element step:**

1. Navigate to your test and begin recording.

2. Scroll on the page using the mouse wheel or browser scroll bar.

3. Interact with a page element, such as clicking a button.

![600](https://files.readme.io/9aba7bf-scroll-to-element.gif "scroll-to-element.gif")

In the example above, Testim records a Scroll to Element step with the "Load More" button as the target element.

![236](https://files.readme.io/6a4ea3c-scroll-to-element-step2.jpg "scroll-to-element-step2.jpg")

### How to Record a Scroll on Page Step

The Scroll on Page step will be **automatically recorded** when a scroll is made on the page and there is no interaction with an element after scrolling.

:fa-arrow-right: **To record a Scroll on Page step:**

1. Navigate to your test and begin recording.

2. Scroll on the page using the mouse wheel or browser scroll bar.

![600](https://files.readme.io/2494302-scroll-on-page.gif "scroll-on-page.gif")

Testim records a Scroll on Page step with no target element.

![232](https://files.readme.io/7d9655b-scroll-on-page.jpg "scroll-on-page.jpg")

### How to Record a Mouse Wheel Step

Some applications implement advanced interactions using the mouse wheel (e.g., zooming in/out on a map). In these cases, the recorded step will be a mouse wheel step, instead of a scroll step.

> 🚧 Important
>
> To provide the best recording experience, by default Testim will record mouse wheel actions as Scroll to Element or Scroll on Page steps. If you need to record mouse wheel steps [contact your Testim administrator](https://www.testim.io/contact-us/) to request this feature.

:fa-arrow-right: **To record a Mouse Wheel step:**

1. Navigate to your test and begin recording.

2. Interact with an advanced page element using the mouse wheel.

![600](https://files.readme.io/19af227-mouse-wheel.gif "mouse-wheel.gif")

Testim records a Mouse Wheel step.

![231](https://files.readme.io/98a0f0a-mouse-wheel-step.jpg "mouse-wheel-step.jpg")

## Fine Tuning Scroll Steps

If your page layout changes or you notice the scroll step is not behaving as you expect, you can adjust the settings of scroll steps for better results.

### Adjusting a Scroll to Element Step

When a scroll to Element Step is recorded, Testim captures the location of the element on the page using scroll positioning as well as the element's hierarchical location in the DOM.

:fa-arrow-right: **To adjust a Scroll to Element Step:**

1. Click the **Show Properties** button on the step.

![238](https://files.readme.io/f564ce0-scroll-step-properties.jpg "scroll-step-properties.jpg")

2. Adjust the **Scroll Position** of the step by changing the X axis (horizontal) and Y axis (vertical) scroll values.

![330](https://files.readme.io/b1f9c02-scroll-to-element-step.jpg "scroll-to-element-step.jpg")

> 📘 Note:
>
> For Scroll to Element steps, Testim automatically set the Scroll Position is automatically to **Relative** positioning. Testim captures the X and Y axis location of the element, but only the Y axis is checked. This is because Testim only needs to know how far down from the top of the page the element is located.

3. Hover over the **Target Element** in the properties panel and make additional adjustments as needed.

   * **Reassign**: change the target element by re-recording the step.
   * **Improve**: recapture the details of the same target element by re-recording the step.
   * **View Locators**: update the target element's HTML references such as content, CSS classes, and parent/child objects in the DOM. This will improve Testim's ability to accurately locate the target element in the DOM.

![286](https://files.readme.io/44ac933-target-element-hover.jpg "target-element-hover.jpg")

### Adjusting a Scroll on Page Step

When a scroll on Page step is recorded, Testim captures the scroll position of the page.

:fa-arrow-right: **To adjust a Scroll on Page step:**

1. Click the **Show Properties** button on the Scroll on Page step.

![258](https://files.readme.io/ffd87c6-scroll-on-page-settings.jpg "scroll-on-page-settings.jpg")

2. Adjust the **Scroll Position** of the step by changing the X axis (horizontal) and Y axis (vertical) scroll values.

![286](https://files.readme.io/96ce8ad-scroll-on-page3.jpg "scroll-on-page3.jpg")

> 📘 Note:
>
> For Scroll on Page steps, the **Scroll Position** is automatically set to **Absolute** positioning and the X and Y axis checkboxes are disabled. Testim captures the horizontal and vertical scrolling in pixels as calculated from the top-left of the viewport.

### Adjusting a Mouse Wheel Step

When a Mouse Wheel step is recorded, Testim captures the target element and the wheel position change related to the target element.

:fa-arrow-right: **To adjust a Mouse Wheel step:**

1. Click the **Show Properties** button on the Mouse Wheel step.

![226](https://files.readme.io/2fd9ad2-mouse-wheel-properties.jpg "mouse-wheel-properties.jpg")

2. Adjust the **Wheel Position** of the step by changing the Y axis properties.

![298](https://files.readme.io/be66724-mouse-wheel-position.jpg "mouse-wheel-position.jpg")

> 📘 Note:
>
> The X axis value will always be 0 since mouse wheels do not scroll horizontally.

3. Hover over the **Target Element** in the properties panel and make additional adjustments as needed.

   * **Reassign**: change the target element by re-recording the step.
   * **Improve**: recapture the details of the same target element by re-recording the step.
   * **View Locators**: update the target element's HTML references such as content, CSS classes, and parent/child objects in the DOM. This will improve Testim's ability to accurately locate the target element in the DOM.

![286](https://files.readme.io/9d7fcdd-target-element-hover.jpg "target-element-hover.jpg")

### Using Dynamic Scroll

In most cases page elements are loaded into the DOM on the initial page load. In these cases Testim has no trouble completing the Scroll to Element steps of the test. In some cases, page elements are not loaded into the DOM until the user scrolls (e.g., lazy load images). By turning on **Dynamic Scroll**, Testim will imitate the scrolling of a user to force a page element to load into the DOM.

:fa-arrow-right: **To add Dynamic Scroll to your scroll step:**

1. Hover over the Scroll Step in your test and click the **Show Properties** icon.

2. Select **Dynamic scroll** in the properties panel.

![281](https://files.readme.io/da7a521-dynamic-scroll.jpg "dynamic-scroll.jpg")