# Clear text (mobile)

Clears the text of a previously selected input.

## Limitations

This step has a known but rare limitation on Appium's side. Sometimes not all text will be cleared from the target input, and many issues were filed over the years:

* [https://discuss.appium.io/t/flutter-i-cant-get-ios-element-clear-to-work-appium-2-5-1/42194/10](https://discuss.appium.io/t/flutter-i-cant-get-ios-element-clear-to-work-appium-2-5-1/42194/10)
* [https://discuss.appium.io/t/clear-elements-is-not-working/28832/9](https://discuss.appium.io/t/clear-elements-is-not-working/28832/9)
* [https://discuss.appium.io/t/appium-15-1-doesnt-clear-the-field-in-appium-ios/28842/3](https://discuss.appium.io/t/appium-15-1-doesnt-clear-the-field-in-appium-ios/28842/3)

Fortunately, there is a workaround on Testim Mobile, and that is to use our [Custom Action Step](https://help.testim.io/docs/custom-action-step-mobile)  - you would need to send backspace keys, such as:\
`await DRIVER.sendKeys('\b\b\b\b\b\b\b');`

The number of backspace characters can equal any length, and the most common use case would be the length of a string meant for the input in your [Test data](https://help.testim.io/docs/reusable-test-data) object.