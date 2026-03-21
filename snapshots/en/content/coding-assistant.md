# Testim Copilot Coding Assistant

Testim's Copilot Coding Assistant helps you write, understand, or fix the JS code that is part of the following steps:

* [Add Custom Action](https://help.testim.io/docs/custom-code)
* [Add Custom Validation](https://help.testim.io/docs/custom-code)
* [Add Custom Wait For](https://help.testim.io/docs/wait-for#custom-wait-for-web)
* [Add Network validation](https://help.testim.io/docs/add-network-validation)
* [Add CLI Validation](https://help.testim.io/docs/add-cli-validations-and-actions)
* [Validate Download](https://help.testim.io/docs/validate-download)
* [Custom Condition](https://help.testim.io/docs/conditions#configuring-a-custom-condition)

The Copilot Coding Assistant uses OpenAI's Generative AI capabilities, which have been integrated and adapted for testing with Testim. You can interact with the assistant using chat prompts, but also with special commands, which are available by typing "/" (forward slash).

:fa-arrow-right:**To use Testim Copilot Coding Assistant:**

1. Create a custom step. See links above for instructions.

2. Click the **Write code with AI** button.

   <Image align="center" src="https://files.readme.io/cf577d9-writecodewithai.png" />

3. Acknowledge the notice.

   <Image align="center" src="https://files.readme.io/df40920-image_4.png" />

4. The coding assistant interacts with you through the chat pane. At the bottom of the chat pane you can enter your prompts.

   <Image align="center" src="https://files.readme.io/e2c25d1-codingassistant.png" />

5. Click "/" (forward slash).

6. Select one of the following commands:
   1. /generate- generates JS code for testing based on your prompt. See further instructions below.
   2. /explain- explains the selected code in the Editor. See further instructions below.
   3. /fix- suggests a fix to the selected code in the Editor. See further instructions below.
   4. /help- provides access to the coding assistant documentation.

7. Do one of the following:

   1. **For Generate command** - in the prompt, type a prompt that describes the code that you want to create and press **Enter** or click the **Send** button. The generated code will appear in the chat pane. To use this code, do one of the following:

      * **Paste code at cursor** - place the cursor where you want to add the code and then click the **Paste code at cursor** button to add the generated code to the function editor in the location of the cursor.

      <Image align="center" src="https://files.readme.io/088b93b-pastecodecursor.png" />

      * **Copy code** - click the **Copy code** button to copy the code and then paste it anywhere you want.

      <Image align="center" src="https://files.readme.io/5b54849-copy.png" />
   2. **For the Explain command** - in the function editor, select the part of the code that you would like to have explained and then do one of the following:

      1. Click the **Explain code with AI** icon on the floating menu.

         <Image align="center" src="https://files.readme.io/eaf33c5-explainfloating.png" />
      2. In the prompt, type `/explain`.
         The explanation is presented in the chat pane.

         <Image align="center" src="https://files.readme.io/f367d0f-explain.png" />
   3. **For the Fix command** - in the function editor, select the part of the code that you would like to have fixes and then do one of the following:

      1. Click the **Fix code with AI** icon on the floating window.

         <Image align="center" src="https://files.readme.io/9d99571-fixcodefloating.png" />
      2. In the prompt, type `/fix`.
         The fixed code suggestion is presented in the chat pane. To use this code, do one of the following:

         * **Paste code at cursor** - place the cursor where you want to add the code and then click the **Paste code at cursor** button to add the generated code to the function editor in the location of the cursor.
         * **Copy code** - click the **Copy code** button to copy the code and then paste it anywhere you want.

# Examples

Here are some examples of possible prompts that you can use:

<details>
  <summary> <b>generate code to validate page URL</b></summary>

  <Image align="center" src="https://files.readme.io/485092a-1.png" />

  The code is typically used in an [Add Custom Validation](https://help.testim.io/docs/custom-code) step to validate that the URL of the page matches a specified regular expression pattern.
</details>

<details>
  <summary> <b>generate code to validate checkbox checked </b></summary>

  <Image align="center" src="https://files.readme.io/95f3895-2.png" />

  This code is typically used in a [Custom Condition](https://help.testim.io/docs/conditions#configuring-a-custom-condition) to validate that a certain checkbox is selected/checked. For example, when using a Click step to select a checkbox, you may want to use this custom condition to verify if the checkbox is not already selected.
</details>

<details>
  <summary> <b>generate code to input text to rich text editor </b></summary>

  <Image align="center" src="https://files.readme.io/c28ca84-image.png" />

  This code is typically used in custom validation steps to be able to input text into a Rich Text Editor element. This is useful in cases where the Set text step cannot input text into a Rich Text Editor element. In this case, the code in the Custom validation step will input the text into the Rich Text Editor element during execution.
</details>

<details>
  <summary> <b>generate code to compare three parameter values </b></summary>

  <Image align="center" src="https://files.readme.io/417615e-image_1.png" />

  This code is typically used in a custom condition and custom validation step to check that certain parameters that were used in the test all share the same value.
</details>