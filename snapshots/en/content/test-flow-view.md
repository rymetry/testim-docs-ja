# Test Flow View

> 📘 This is Testim's Labs feature
>
> If you have joined Testim Labs, make sure this feature has been enabled in **Settings > Labs**. To learn more about Testim Labs and how to join, see [here](https://help.testim.io/docs/testim-labs)

**Test Flow View** offers a graphic flow-based visualization of your tests.\
By using Test Flow View you can:

* Understand how your tests are built
* Evaluate their size
* Identify  common patterns and duplicates (common patterns of shared steps at the beginning of the tests will be united)
* Gain direct access to specific test steps

To access the test flow view, go to **Test list-->Tests** and select the graph view on the top right corner.

![3352](https://files.readme.io/a73e9a6-Screen_Shot_2021-02-18_at_9.15.43.png "Screen Shot 2021-02-18 at 9.15.43.png")

* The project is represented at the beginning by a square icon
* Each shared step is represented by a hexagon icon
* Regular step is represented by a circle
* At the beginning of the flow, all tests that start with the same sequence of shared steps will be united together, until there is a split in the flow

![3196](https://files.readme.io/0b73a63-Screen_Shot_2021-02-18_at_9.16.54.png "Screen Shot 2021-02-18 at 9.16.54.png")

## Test Flow View Controls

* **Pane** - drag the graph to see different parts of your project
* **Zoom in/out** - use your scroll wheel to see zoom in/out
* **Details** - hover over a step to view the test name

![3182](https://files.readme.io/f4a5230-Untitled.png "Untitled.png")

* **Step access** - click a step (circle) to open that step in a new tab, with that step selected and the property panel for this step open

![1316](https://files.readme.io/23a5cbe-Oct-29-2020_11-05-58.gif "Oct-29-2020 11-05-58.gif")

* **Shared step access** - click a shared step (hexagon) to open your tests library in a new tab, filtered to only include the tests that use this shared step

![898](https://files.readme.io/72371e7-Feb-18-2021_09-27-55.gif "Feb-18-2021 09-27-55.gif")