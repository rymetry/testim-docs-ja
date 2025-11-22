---
title: 'スケジューラーの Webhook 経由での通知'
description: 'スケジュール実行の結果を Webhook で外部システムへ送信し、JSON ペイロードを利用してレポート生成やアラートなどの処理をトリガーする方法を説明します。'
category: 'テスト実行'
order: 7
updated: '2025-09-22'
sourceUrl: 'https://help.testim.io/docs/schedulers-notification-via-webhook'
keywords:
  - Webhook
  - スケジューラー
  - スケジュール実行
  - 通知
  - JSON ペイロード
  - 実行結果
  - 自動化
  - テスト実行
  - Testim
---
Webhook 経由でスケジューラーの結果を取得できるようにします

Webhook 経由でのスケジューラー通知機能は、スケジュール実行通知の設定オプションで URL を Webhook として追加する機能をユーザーに提供します。**通知** セクションには、通知をトリガーする時期（例：「すべての失敗時」）と通知を送信する方法の設定があります。これらの方法の 1 つは Webhook です。Testim の外部では、Webhook を使用して、レポートなどの形式のプロセスをトリガーできます。

### Webhook フォーマット

Webhook は、次の情報を含む JSON ペイロードを送信します：
- status (failure | success) – 個々のテスト結果ではなく、全体的なスケジュール実行ステータスを指します。
- projectId
- executionId
- schedulerName
- executionUrl

> 📘
>
> Webhook に含まれている情報は変更できません。

以下は、Webhook JSON ペイロードの例です：

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

スケジュール実行の詳細については、[スケジューラー](/docs/scheduler) を参照してください。

## スケジューラー Webhook 設定を構成する

:fa-arrow-right: **スケジューラー Webhook 設定を構成するには：**

1. メインナビゲーションで **実行** アイコンをクリックします。

![実行タブのナビゲーションアイコン](/images/running-tests/schedulers-notification-via-webhook/7bb277d-runs.png)

2. **スケジュール実行** をクリックして **スケジュール実行** タブを開きます。

![スケジュール実行タブのスクリーンショット](/images/running-tests/schedulers-notification-via-webhook/6e0c331-scheduledruns.png)

**スケジューラーリスト** ページが表示されます。

![スケジューラーリストページの画面](/images/running-tests/schedulers-notification-via-webhook/3d5057d-schedulerlibrary.png)

3. Webhook を設定したいスケジューラーをクリックします。
   **スケジュール実行を編集** ウィンドウが開きます。

![スケジュール実行を編集するウィンドウ](/images/running-tests/schedulers-notification-via-webhook/f79c48d-editscheduler.png)

4. 「通知する」フィールドで、次のいずれかのオプションを選択します：
   1. すべての失敗時
   2. 最初の失敗時
   3. すべての実行時
5. **設定** の下で **Webhook** を選択します。

![通知設定で Webhook を選択する画面](/images/running-tests/schedulers-notification-via-webhook/c10fa5c-webhookfield.png)

5. 表示される **Webhook** フィールドに有効な URL を入力します。これは Testim が実行結果を POST する URL です。

![Webhook URL 入力フィールドのスクリーンショット](/images/running-tests/schedulers-notification-via-webhook/bd200e6-webhook2.png)

6. **保存** をクリックします。
