# Scheduler’s notification via webhook

Allow getting the scheduler’s results via webhook

The Scheduler’s notification via webhook feature provides users the ability to add a URL as a webhook in the preference option for their scheduled runs notifications. Under the **Notification** section, there is a setting for when to trigger a notification (e.g., "On every failure") and the method by which the notification will be sent. One of these methods is a webhook. Outside Testim, the webhook maybe used to trigger a process, such as some form of reporting, etc.

### Webhook format

The webhook sends a JSON payload containing the following information:\
&#x9;•	status (failure | success) – refers to the overall scheduled run status, not individual test results.\
&#x9;•	projectId\
&#x9;•	executionId\
&#x9;•	schedulerName\
&#x9;•	executionUrl

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

For more information about scheduled runs, see [Scheduler](https://help.testim.io/docs/scheduler).

## Configuring the Scheduler Webhook Settings

:fa-arrow-right: **To configure the scheduler webhook settings:**

1. In the main navigation, click the **Runs** icon.

<Image align="center" src="https://files.readme.io/7bb277d5d38990749ee15c6e4fc59d1a2159da03f80d04f043d8bd0727932f93-runs.png" />

2. Click **Scheduled Runs** to open the **Scheduled Runs** tab.

<Image align="center" src="https://files.readme.io/6e0c331e7015088086e8c3fc326d5d8667e9bd8b9bb1877c4951e85151c201c2-scheduledruns.png" />

The **Scheduler List** page is shown.

<Image align="center" src="https://files.readme.io/3d5057de59c5dce8b8f66f92259c62984820efadb60d88e8a932f5dd0e750a83-schedulerlibrary.png" />

3. Click on the scheduler for which you would like to set a webhook.\
   The **Edit Schedule Runs** window opens.

<Image align="center" src="https://files.readme.io/f79c48d58ab8d4f2ba3c6277b21196027ee5fcfb729ddbd9f62ee7d3dee98c62-editscheduler.png" />

4. In the Notify on field, select one of the following options:
   1. On every failure
   2. On the first failure
   3. On every run
5. Under **Preference** select **Webhook**.

<Image align="center" src="https://files.readme.io/c10fa5c33dfa3df7f43519d1a8b126025a571d2c95054f52d782d48ef217a977-webhookfield.png" />

5. Enter a valid URL in the **Webhook** field that is shown. This is the URL where Testim will POST the run result.

<Image align="center" src="https://files.readme.io/bd200e6bcb5023dea0a893c75f2dff098e983997ca1c68842b59f2a2b9abceff-webhook2.png" />

6. Click **Save**.