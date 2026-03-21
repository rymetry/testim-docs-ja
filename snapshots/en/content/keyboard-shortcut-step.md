# Keyboard Shortcut Step

The **Add Keyboard Shortcut** step sends the specified keyboard shortcut combination (e.g., CTL + C) to the AUT during execution. The step can be created manually, by selecting it from the list of **Predefined steps**. The step supports playback on both Windows and Mac and it automatically translates the command to the appropriate operating system. So, for example, a CTL + C shortcut, which is recorded on Windows, is automatically translated to cmd + C when executed on a Mac.

> 📘
>
> If the test's **Default Config** specifies a different OS than the one used to execute the test, the keyboard action will be sent in accordance to the OS of the test config used.

# Supported keyboard shortcuts

The following keyboard shortcuts are supported. Unsupported combinations will present the following error - “unsupported keyboard shortcut”

<Table align={["left","left","left"]}>
  <thead>
    <tr>
      <th>
        Keyboard Shortcut Combination
      </th>

      <th>
        Windows Example
      </th>

      <th>
        Mac Example
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        Alt/Ctrl modifier + char/number/special key
      </td>

      <td>
        ALT + X\
        CTRL + 1
      </td>

      <td>
        <kbd>⌥ Option</kbd> + <kbd>X</kbd>
      </td>
    </tr>

    <tr>
      <td>
        Modifier + function key
      </td>

      <td>
        Alt + F3\
        Ctrl + F10
      </td>

      <td>
        <kbd>⌥ Option</kbd> + <kbd>F3</kbd>\ <kbd>⌘ Command</kbd> + <kbd>F10</kbd>
      </td>
    </tr>

    <tr>
      <td>
        Modifier (\*2) + char/number/special key
      </td>

      <td>
        Alt + Ctrl + X\
        Ctrl + Shift + 1
      </td>

      <td>
        <kbd>⌥ Option</kbd> + <kbd>⌘ Command</kbd> + <kbd>X</kbd>\ <kbd>⌘ Command</kbd> + <kbd>⇧ Shift</kbd> + <kbd>1</kbd>
      </td>
    </tr>

    <tr>
      <td>
        Modifier (\*2) + function key
      </td>

      <td>
        Alt + Ctrl + F12\
        Ctrl + Shift + F7
      </td>

      <td>
        <kbd>⌥ Option</kbd> + <kbd>⌃ Control</kbd> + <kbd>F12</kbd>\ <kbd>⌘ Command</kbd> + <kbd>⇧ Shift</kbd> + <kbd>F7</kbd>
      </td>
    </tr>
  </tbody>
</Table>

# Manually adding the Add keyboard shortcut step

**To manually add an Add keyboard shortcut step:**

1. Hover over the + button where you want to add the new step and select Testim predefined steps.
2. Under **Actions** select the **Add keyboard shortcut** step.
3. In the step's **Properties panel**, under the **Keyboard Shortcut** section, do one of the following:
   1. If you are using Windows, place the cursor in the **Windows** field and press the shortcut keys (make sure all keys are pressed at once). The "translation" of the equivalent shortcut in Mac will appear in the Mac field. This translation will be used when the test is executed on a Mac machine.
   2. f you are using Mac, place the cursor in the **Mac** field and press the shortcut keys (make sure all keys are pressed at once). The "translation" of the equivalent shortcut in Windows will appear in the Windows field. This translation will be used when the test is executed on a Windows machine.
4. If you don't want the shortcut to be translated to the opposite OS shortcut combination, click the **Unsync Fields** button.

   <Image align="center" src="https://files.readme.io/7d37244-unlink.png" />