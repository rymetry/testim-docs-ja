# Handling UI actions

Special instructions for handling certain UI actions

When creating a test, there will be steps that require interaction with the user interface (UI). Not all UI actions are created equal. Web pages are increasingly adding new capabilities that challenge most record/playback tools. Recording clicks and entering text into fields is easy, but other UI actions can be more difficult to track.

This section is devoted to making sure those more challenging UI actions like auto-scroll and drag and drop are properly recorded and represented in the visual test editor.

## Advanced UI Actions

Below are some of the more advanced UI actions you can add to your test.

<Table align={["left","left"]}>
  <thead>
    <tr>
      <th>
        Action
      </th>

      <th>
        Description
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        [Scroll](https://help.testim.io/docs/scroll)
      </td>

      <td>
        Add a step to your test when you want the test to scroll to a specific location or element of a page.
      </td>
    </tr>

    <tr>
      <td>
        [Auto Scroll](https://help.testim.io/docs/auto-scroll)
      </td>

      <td>
        Control if the test should automatically scroll to a page element if the element is initially outside the viewport.
      </td>
    </tr>

    <tr>
      <td>
        [Drag & Drop Step](https://help.testim.io/docs/drag-drop-step)
      </td>

      <td>
        Add a step to your test that records a “drag and drop” action, such as a user dragging an image to an upload section or adding an element to a workspace in a visual editor.
      </td>
    </tr>

    <tr>
      <td>
        [Hover Step](https://help.testim.io/docs/hover-step)
      </td>

      <td>
        Add a step to your test that records a hover action, such as a user hovering over a menu, tooltip, or button.
      </td>
    </tr>

    <tr>
      <td>
        [Navigation Step](https://help.testim.io/docs/navigation)
      </td>

      <td>
        Add a step to your test when you want the test to navigate to another page.
      </td>
    </tr>

    <tr>
      <td>
        [Refresh Page](https://help.testim.io/docs/refresh-page)
      </td>

      <td>
        Add a step to your test when you want the test to refresh the page.
      </td>
    </tr>
  </tbody>
</Table>