# Hide keyboard (mobile)

With certain third-party providers, calling the `hideKeyboard` action may return an error that the software keyboard can't be hidden. This is because the action is causing unexpected navigation in Appium, as certain keyboard behaviors and device states don't respond properly to the `Driver.hidekeyboard()` call.

As a workaround, you can record a custom action. For more information about how to create a custom action, see [Custom Action Step (mobile)](https://help.testim.io/docs/custom-action-step-mobile).

Your custom action can activate either of the following keycodes, depending on your use case:

* `KEYCODE_BACK (4)` – dismiss the keyboard without submitting a form with the keycode for the Back button or gesture
* `KEYCODE_ENTER (66)` – trigger Done or Next depending on the field type with the keycode for the Enter button

The following example illustrates the use of the `pressKeyCode` Appium method to close the keyboard by simulating the Back button.

```Text JavaScript
// Trigger Android KEYCODE_BACK to hide keyboard

await DRIVER.pressKeyCode(4);
```