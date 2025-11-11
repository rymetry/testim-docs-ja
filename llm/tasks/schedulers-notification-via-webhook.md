# 翻訳タスク (schedulers-notification-via-webhook)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

Allow getting the scheduler’s results via webhook

The Scheduler’s notification via webhook feature provides users the ability to add a URL as a webhook in the preference option for their scheduled runs notifications. Under the **Notification** section, there is a setting for when to trigger a notification (e.g., "On every failure") and the method by which the notification will be sent. One of these methods is a webhook. Outside Testim, the webhook maybe used to trigger a process, such as some form of reporting, etc.

### Webhook format

The webhook sends a JSON payload containing the following information:\
&#x9;• status (failure | success) – refers to the overall scheduled run status, not individual test results.\
&#x9;• projectId\
&#x9;• executionId\
&#x9;• schedulerName\
&#x9;• executionUrl

> 📘
>
> The information included in the webhook cannot be modified.

The following is an example of a webhook JSON payload:

```json
{
  "status": "failure",
  "projectId": "AMaVXxXxXxXxrVrBrnSD",
  "executionId": "Tv9O8XxXxUOfkoqT",
  "schedulerName": "Webhook",
  "executionUrl": "https://app.testim.io/#/project/AMaVXxXxXxrVrBrnSD/runs/suites/Tv9O8kPLGUOfkoqT",
  "results": {
    "passed": [],
    "failed": [
      {
        "_id": "Bo6tVDoxhrntvlY9",
        "testId": "vwE96nZBQK4L2w2X",
        "name": "TestName",
        "reason": "Assertion failed",
        "link": "https://app.testim.io/#/project/AMXxXxXxCgrVrBrnSD/branch/master/test/vwE96nZBQK4L2w2X?result-id=Bo6tVDoxhrntvlY9"
      }
    ],
    "failed evaluating": [],
    "evaluating": [],
    "skipped": []
  }
}
```

For more information about scheduled runs, see [Scheduler](/docs/running-tests/scheduler).

## Configuring the Scheduler Webhook Settings

:fa-arrow-right: **To configure the scheduler webhook settings:**

1. In the main navigation, click the **Runs** icon.

![](/images/running-tests/schedulers-notification-via-webhook/7bb277d-runs.png)

2. Click **Scheduled Runs** to open the **Scheduled Runs** tab.

![](/images/running-tests/schedulers-notification-via-webhook/6e0c331-scheduledruns.png)

The **Scheduler List** page is shown.

![](/images/running-tests/schedulers-notification-via-webhook/3d5057d-schedulerlibrary.png)

3. Click on the scheduler for which you would like to set a webhook.\
   The **Edit Schedule Runs** window opens.

![](/images/running-tests/schedulers-notification-via-webhook/f79c48d-editscheduler.png)

4. In the Notify on field, select one of the following options:
   1. On every failure
   2. On the first failure
   3. On every run
5. Under **Preference** select **Webhook**.

![](/images/running-tests/schedulers-notification-via-webhook/c10fa5c-webhookfield.png)

5. Enter a valid URL in the **Webhook** field that is shown. This is the URL where Testim will POST the run result.

![](/images/running-tests/schedulers-notification-via-webhook/bd200e6-webhook2.png)

6. Click **Save**.
