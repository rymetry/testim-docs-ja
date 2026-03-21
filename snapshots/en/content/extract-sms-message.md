# Extract SMS message

Learn how to extract SMS message using the CLI action step and Twilio.

You can use the [CLI action step](https://help.testim.io/docs/add-cli-validations-and-actions) in conjunction with [Twilio](https://www.twilio.com/) to perform advanced validations of SMS messages receive time and content.

#### **Example code:**

```text
// Your Account Sid and Auth Token from twilio.com/console
const accountSid = "XXXXX";
const authToken = "XXXXX";
const fromNumber = "XXXXX";
const toNumber = "XXXXXX";
const checkPeriodInMin = 5;

const dateSentAfter = moment().subtract(checkPeriodInMin, "minutes");
console.debug("dateSentAfter", dateSentAfter);

const client = twilio(accountSid, authToken);

return client.messages
    .list({
        to: toNumber,
        from: fromNumber,
        dateSentAfter: dateSentAfter.format('YYYY-MM-DD')
    })
    .then(messages => {
        const relevantMessages = messages.filter(msg => dateSentAfter.isBefore(msg.dateSent));
        if (relevantMessages.length === 0) {
            return Promise.reject(new Error("Failed to find any message"));
        }
        if (relevantMessages.length > 1) {
            console.warn(`find more than one messages ${relevantMessages.length} took the first message`);
        }
        const firstMessages = relevantMessages[0];
        const message = firstMessages.body;
        exports.code = message.replace("Verification Code: ", "");
    });
```

#### **Parameters - Packages and JavaScript used in this example:**

1.name: twilio, type: Package, value: [twilio@3.25.0]()\
2.name: \_, type: Package, value: [moment@latest]()

**see screenshot:**

![259](https://files.readme.io/6842940-see_screenshot1.png "see screenshot1.png")