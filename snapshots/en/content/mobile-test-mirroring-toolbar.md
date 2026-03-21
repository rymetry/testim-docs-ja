# Mobile Test Mirroring Toolbar

The Mirroring Toolbar is located at the top of the AUT Mirroring Window and provides shortcuts to common actions as well as the ability to switch between the *DOM Locate* and *Vision Locate* modes.

<Image align="center" src="https://files.readme.io/c16b38e-toolbarwithcallouts.png" />

The toolbar includes the following buttons:

* **Record/Pause** - click to pause the recording and click again to resume recording.
* **Home** - create a Home Button step, which sends a home command to the device.
* **Back (Android only)** - creates a Back Button step, sends a back command to the device.
* **Type Keys** -
* **DOM/Vision Locate** - toggles between the DOM and Vision Locate modes. The DOM mode (default mode) uses the DOM to locate an element on the screen. The Vision Locate mode scans the screen to find the elements using visual analysis algorithms. The Vision Locate is used when an element cannot be found through the DOM or in case of a WebView screen. For more information, see [Vision Locate](https://help.testim.io/docs/vision-locate).