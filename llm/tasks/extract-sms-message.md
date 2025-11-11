# 翻訳タスク (extract-sms-message)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

CLIアクションステップとTwilioを使用してSMSメッセージを抽出する方法を学びます。

[CLIアクションステップ](/docs/validations/add-cli-validations-and-actions)を[Twilio](https://www.twilio.com/)と組み合わせて使用することで、SMSメッセージの受信時刻とコンテンツの高度な検証を実行できます。

#### **コード例:**

```javascript
// twilio.com/consoleからのアカウントSidと認証トークン
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
