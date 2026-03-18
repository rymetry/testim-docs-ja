---
title: SMS メッセージの抽出
description: CLIアクションステップとTwilioを使用してSMSメッセージを抽出し、受信時刻とコンテンツの検証を行う方法を学びます。
category: 高度な編集
order: 5038
updated: '2025-09-15'
sourceUrl: 'https://help.testim.io/docs/extract-sms-message'
keywords:
  - testim
  - extract-sms-message
  - handling-ui-actions
  - SMS
  - Twilio
  - SMSメッセージ
  - メッセージ検証
  - CLIアクション
  - テスト自動化
  - 二要素認証
---

CLIアクションステップとTwilioを使用してSMSメッセージを抽出する方法を学びます。

[CLIアクションステップ](/docs/add-cli-validations-and-actions)を[Twilio](https://www.twilio.com/)と組み合わせて使用することで、SMSメッセージの受信時刻とコンテンツの高度な検証を実行できます。

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

## Parameters - この例で使用するパッケージと JavaScript

| name | type | value |
|------|------|-------|
| twilio | Package | twilio@3.25.0 |
| _ | Package | moment@latest |

![設定画面のスクリーンショット](/images/handling-ui-actions/extract-sms-message/6842940-see_screenshot1.png)
