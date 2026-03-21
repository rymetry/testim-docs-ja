---
title: テストステータス
description: どのテストに作業が必要かを管理するためにテストにステータスを追加します
category: TestOps
order: 15003
updated: '2025-11-02'
sourceUrl: 'https://help.testim.io/docs/test-status'
keywords:
  - テストステータス
  - TestOps 管理
  - Draft
  - Evaluating
  - Active
  - Quarantine
  - CI 連携
  - 不安定なテスト
  - テスト品質管理
  - スケジューラー実行
---

どのテストに作業が必要かを管理するためにテストにステータスを追加します

テストにステータスを追加して、どのテストに作業が必要かを管理できます。ステータスは、テストライブラリリストおよびテストエディターの列の 1 つとして表示されます。

デフォルトでは、すべてのステータスは「Draft」とラベル付けされています。この機能を有効にすると、Testim は過去 30 日間に実行されたテストを自動的に識別し、「Active」とラベル付けします。その他のステータスはすべて以下に説明するように手動で適用されます。

テストのステータスを手動で管理することで、以下のメリットを享受できます:

- 不安定/失敗するテストを CI/スイートから削除せずに手動で隔離できます。
- CI に接続されていない（アクティブでない）テストを簡単に確認できます。
- CI を失敗させることなく、段階的にテストを CI に追加できます。
- ステータスでテストをフィルタリングすることで、プロジェクトの可視性が向上します。

:::note{title="これはPRO機能です"}
この機能は、Professional plan のプロジェクトでのみ利用できます。
:::

:::warning{title="注意"}
この機能を使用するには、CLI のバージョンを最低 v3.135.0 にアップグレードする必要があります。CLI のインストールについては[コマンドライン CLI](/docs/the-command-line-cli#cli-installation)をお読みください。
:::

## テストステータス

各テストは以下のいずれかのステータスを持つことができます:

<table class="md-table md-table-4cols">
 <thead>
  <tr>
   <th style="text-align: left;">
    ステータス
   </th>
   <th style="text-align: left;">
    定義
   </th>
   <th style="text-align: left;">
    CI/スケジューラーの一部として実行
   </th>
   <th style="text-align: left;">
    スケジューラー/CI の失敗
   </th>
  </tr>
 </thead>
 <tbody>
  <tr>
   <td style="text-align: left;">
    Draft
   </td>
   <td style="text-align: left;">
    テストはまだ作業中
   </td>
   <td style="text-align: left;">
    はい*
   </td>
   <td style="text-align: left;">
    はい
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    Evaluating
   </td>
   <td style="text-align: left;">
    テストは準備完了だが、安定性を検証する必要がある
   </td>
   <td style="text-align: left;">
    はい
   </td>
   <td style="text-align: left;">
    いいえ
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    Active
   </td>
   <td style="text-align: left;">
    テストは準備完了で安定している
   </td>
   <td style="text-align: left;">
    はい
   </td>
   <td style="text-align: left;">
    はい
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    Quarantine
   </td>
   <td style="text-align: left;">
    テストは安定したテストの定義に適合しておらず、修正待ち
   </td>
   <td style="text-align: left;">
    いいえ
   </td>
   <td style="text-align: left;">
    いいえ
   </td>
  </tr>
 </tbody>
</table>

\*ベストプラクティスは、テストが準備完了してから CI/スケジューラーに追加することであり、Draft ステータスでは追加しないことです。

## テストステータスの表示

テストのステータスは以下の画面に表示されます：\
**テストライブラリ画面** - Test Lists -> Tests

![テストライブラリのテストステータス](/images/testops-management/test-status/ebf3e27-teststatuses1.png)

### テストエディター

![テストエディターのテストステータス](/images/testops-management/test-status/a56ee9d-teststatuses2.png)

## ステータスでテストをフィルタリング

**ステータスでテストをフィルタリングするには:**

1. **Test List --> Tests** に移動します。
2. **Filter** ボタンをクリックします。

![Filter ボタン](/images/testops-management/test-status/615dd27-filter.png)

3. **Filter Test** ペインで、関連するステータスのチェックボックスを選択します。

![ステータスフィルター](/images/testops-management/test-status/ac7f5bd-teststatuses3.png)

## テストのステータスを変更

ステータスは手動で変更できます。テストステータスへのすべての変更は[リビジョン履歴](/docs/revisions)に表示されます。

**テストライブラリからテストステータスを変更するには:**

1. Test List --> Tests に移動します。
2. **Status** 列で、関連するステータスを選択します。

![ステータス変更](/images/testops-management/test-status/3eaae69-Jan-28-2021_09-43-29.gif)

\*_注意:_ 編集したいすべてのテストを選択してから、トップメニューからステータス変更をクリックすることで、テストステータスを一括編集することも可能です。

:::note
テストステータスの一部として、不安定なテストを表示し、そのステータスをどのように管理するかを決定するオプションも追加しました。不安定なテストの詳細については、[不安定なテスト](/docs/flaky-tests)をご覧ください。
:::

**Testim のエディターからテストステータスを変更するには:**

1. エディターでテストを開きます。
2. 左上隅からステータスを変更します。

![エディターでステータス変更](/images/testops-management/test-status/65da094-Screen_Shot_2021-01-10_at_7.41.32.png)

:::note
ステータスを変更すると、テストはリビジョンとして保存されます。それをマスターにマージし直したい場合は、3 way マージコンフリクトとして解決する必要があります。詳細については[バージョン管理（ブランチ）](/docs/version-control-branches)をご覧ください。
:::

## テストステータスの使用

### テスト実行時

テストを実行した後、ステータスは以下のように反映されます:

- 実行される **Draft テスト**は以前と同様に表示されます。これらのテストのステータスを Active に変更することをお勧めします。
- **Evaluating テスト**はテスト実行に表示されますが、失敗した場合、失敗が無視されたことを示すインジケーターが表示されます。

![Evaluating テストの実行結果](/images/testops-management/test-status/2effede-Screen_Shot_2021-01-28_at_8.56.41.png)

- **Active テスト**は以前と同様に表示されます。
- **Quarantine テスト**は実行されません（テスト実行には表示されません）。

### スイート実行時

スイート実行では、ステータスは以下のように反映されます:

- 実行される **Draft テスト**は以前と同様に表示されます。これらのテストのステータスを Active に変更することをお勧めします。
- **Evaluating テスト**はテスト実行に表示されますが、失敗した場合、CI を失敗させなかったことを示すインジケーターが表示されます。
- **Active テスト**は以前と同様に表示されます。
- **Quarantine テスト**は実行されません（スイート実行には隔離インジケーター付きで表示されます）。

![スイート実行時の Quarantine テスト](/images/testops-management/test-status/87013d7-Screen_Shot_2021-01-10_at_8.02.34.png)

### CLI 実行

- **失敗した Evaluating テスト**は、CLI 実行サマリーに FAILED-EVALUATING として表示されます。
- **失敗した Evaluating テスト**は、実行 XML レポートに新しいステータス「failure-evaluating」として追加されます。CLI XML レポートの詳細については、[コマンドライン CLI](/docs/the-command-line-cli#the-common-parameters)をご覧ください。
- **Quarantine テスト**は、実行 XML に「Skipped」フラグ付きで追加されます。

:::note
Quarantine テストは、隔離を解除する "--run-quarantined-tests" フラグを指定して CLI で実行できます。
:::
