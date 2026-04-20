---
title: サブスクリプションプラン
description: >-
  Web、モバイル、Salesforce、Copilot の各プロダクトカテゴリのサブスクリプションプラン詳細と使用状況について説明します。並列化モデルの理解を提供します。
category: 管理者機能
order: 14007
updated: '2025-09-23'
sourceUrl: 'https://docs.tricentis.com/testim/content/administration/subscription-plans/index.htm'
keywords:
  - サブスクリプションプラン
  - 並列実行
  - Parallel Slots
  - 使用制限
  - Web プラン
  - モバイルプラン
  - Salesforce プラン
  - Copilot プラン
---

企業オーナーのみが利用できる **Subscription** 画面には、以下の各プロダクトカテゴリのソフトウェアサブスクリプションプランの詳細と現在の使用状況が表示されます:

- Web - Web アプリケーション用 Testim。
- Mobile - モバイルアプリケーション用 Testim。
- Salesforce - Salesforce 用 Testim。
- Copilot - Testim コーディングアシスタント Copilot。

プランは「実行モデル」から「並列化モデル」と呼ばれる新しいモデルに移行しました。並列化モデルでは、実行回数ではなく、並列実行の数がサブスクリプションにカウントされます。

## Plans 画面へのアクセス

**Plans 画面にアクセスするには:**

1. ユーザーアバターをクリックします。
2. **Company** の下で、企業名をクリックします。
3. **Plans** タブをクリックします。

## Web プラン

Web プラン画面には以下の情報が表示されます:

## 並列化モデル - プラン詳細

![Parallel Slots や Projects など Web プランの詳細を表示する画面](/images/project-user-management/subscription-plans/7a353fc-parallelweb.png)

- **Parallel Slots** - プランに含まれる並列実行の数。
- **Projects** - プランに含まれるプロジェクトの数。
- **Expiration Date** - プランの有効期限日。

## 並列化モデル - 使用状況詳細

プランの現在の使用状況は画面の右上隅に表示されます。

![並列化モデルの使用状況ドーナツチャートとポップアップ](/images/project-user-management/subscription-plans/fad8303-parallelpopup.png)

この要素には、並列化使用レベルを示すドーナツチャートと、プランの合計数のうち現在の使用数を示す数値が含まれます。要素をクリックすると詳細が表示されます。

![並列化使用率の詳細を表示するポップオーバー](/images/project-user-management/subscription-plans/3893360-openpopover.png)

## Testim Web と Testim Salesforce の使用制限

すべてのユーザーに適切なパフォーマンスとリソース割り当てを確保するため、Testim は以下の使用制限を設けています:

- 最初の 3 つの並列テストは、月間合計 1,000 テスト実行時間に制限されます。
- 追加の並列テストは追加料金でライセンスできます。各追加並列テストは月間 200 テスト実行時間を提供します。

これらの使用制限の適用は、サービス品質を維持するために Tricentis の裁量で行われます。これらの制限に関してご質問がある場合、またはプランの変更についてサポートが必要な場合は、アカウント担当者にお問い合わせください。

:::note
Test Editorを通じて開始されるローカル実行は、これらの使用制限にカウントされません。
:::

## 並列化クォータにカウントされるもの

<table class="md-table md-table-3cols">
 <thead>
  <tr>
   <th style="text-align: left;">
    実行タイプ
   </th>
   <th style="text-align: left;">
    プロジェクトタイプ
   </th>
   <th style="text-align: left;">
    並列化クォータにカウント
   </th>
  </tr>
 </thead>
 <tbody>
  <tr>
   <td style="text-align: left;">
    <strong>
     Test Editor
    </strong>
    から実行をトリガー
   </td>
   <td style="text-align: left;">
    ローカルブラウザを使用する Web
    <br/>
    TMA を使用するモバイル
    <br/>
    VMG を使用するモバイル
   </td>
   <td style="text-align: left;">
    いいえ
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    <strong>
     グリッド上のTest Editor（Testim およびサードパーティ）
    </strong>
    から実行をトリガー
   </td>
   <td style="text-align: left;">
    Web &amp; モバイル
   </td>
   <td style="text-align: left;">
    はい
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    <strong>
     CLI
    </strong>
    から実行をトリガー
   </td>
   <td style="text-align: left;">
    Web &amp; モバイル
   </td>
   <td style="text-align: left;">
    はい
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    <code>
     -use-local-chrome-driver
    </code>
    フラグを指定して
    <strong>
     CLI
    </strong>
    から実行をトリガー
   </td>
   <td style="text-align: left;">
    Web
   </td>
   <td style="text-align: left;">
    いいえ
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    `host=localhost/127.0.0.1` を指定して
    <strong>
     CLI
    </strong>
    から実行をトリガー
   </td>
   <td style="text-align: left;">
    Web
   </td>
   <td style="text-align: left;">
    はい
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    `host=localhost/127.0.0.1` を指定して
    <strong>
     グリッド上のTest Editor
    </strong>
    から実行をトリガー
   </td>
   <td style="text-align: left;">
    Web
   </td>
   <td style="text-align: left;">
    はい
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    <strong>
     Public API
    </strong>
    経由で実行をトリガー
   </td>
   <td style="text-align: left;">
    Web &amp; モバイル
   </td>
   <td style="text-align: left;">
    はい
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    以下の画面から実行をトリガー:
    <strong>
     テストリスト / テストプラン / テストスイート
    </strong>
    。注 - これらのページのいずれかからテストをトリガーすると、テストはローカルブラウザで実行されます。
   </td>
   <td style="text-align: left;">
    Web &amp; モバイル
   </td>
   <td style="text-align: left;">
    いいえ
   </td>
  </tr>
 </tbody>
</table>

\| **スケジューラ** から実行をトリガー \| Web &amp; モバイル \| はい \|
