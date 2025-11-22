---
title: 'サブスクリプションプラン'
description: 'Web、モバイル、Salesforce、Copilotの各プロダクトカテゴリのサブスクリプションプラン詳細と使用状況について説明します。並列化モデルの理解を提供します。'
category: '管理者設定'
order: 5
updated: '2025-09-18'
sourceUrl: 'https://help.testim.io/docs/subscription-plans'
keywords:
  - サブスクリプションプラン
  - 並列実行
  - Parallel Slots
  - 使用制限
  - Webプラン
  - モバイルプラン
  - Salesforceプラン
  - Copilotプラン
---

企業オーナーのみが利用できる **Subscription** 画面には、以下の各プロダクトカテゴリのソフトウェアサブスクリプションプランの詳細と現在の使用状況が表示されます:

- Web - Webアプリケーション用Testim。
- Mobile - モバイルアプリケーション用Testim。
- Salesforce - Salesforce用Testim。
- Copilot - Testimコーディングアシスタント Copilot。

プランは「実行モデル」から「並列化モデル」と呼ばれる新しいモデルに移行しました。並列化モデルでは、実行回数ではなく、並列実行の数がサブスクリプションにカウントされます。

# Plans画面へのアクセス

:fa-arrow-right:**Plans画面にアクセスするには:**

1. ユーザーアバターをクリックします。
2. **Company** の下で、企業名をクリックします。
3. **Plans** タブをクリックします。

# Webプラン

Webプラン画面には以下の情報が表示されます:

## 並列化モデル - プラン詳細

![Parallel SlotsやProjectsなどWebプランの詳細を表示する画面](/images/project-user-management/subscription-plans/7a353fc-parallelweb.png)

- **Parallel Slots** - プランに含まれる並列実行の数。
- **Projects** - プランに含まれるプロジェクトの数。
- **Expiration Date** - プランの有効期限日。

## 並列化モデル - 使用状況詳細

プランの現在の使用状況は画面の右上隅に表示されます。

![並列化モデルの使用状況ドーナツチャートとポップアップ](/images/project-user-management/subscription-plans/fad8303-parallelpopup.png)

この要素には、並列化使用レベルを示すドーナツチャートと、プランの合計数のうち現在の使用数を示す数値が含まれます。要素をクリックすると詳細が表示されます。

![並列化使用率の詳細を表示するポップオーバー](/images/project-user-management/subscription-plans/3893360-openpopover.png)

<br />

<br />

<br />

## Testim WebとTestim Salesforceの使用制限

すべてのユーザーに適切なパフォーマンスとリソース割り当てを確保するため、Testimは以下の使用制限を設けています:

- 最初の3つの並列テストは、月間合計1,000テスト実行時間に制限されます。
- 追加の並列テストは追加料金でライセンスできます。各追加並列テストは月間200テスト実行時間を提供します。

これらの使用制限の適用は、サービス品質を維持するためにTricentisの裁量で行われます。これらの制限に関してご質問がある場合、またはプランの変更についてサポートが必要な場合は、アカウント担当者にお問い合わせください。

> 📘
>
> テストエディタを通じて開始されるローカル実行は、これらの使用制限にカウントされません。

# 並列化クォータにカウントされるもの

<br />

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
     テストエディタ
    </strong>
    から実行をトリガー
   </td>
   <td style="text-align: left;">
    - ローカルブラウザを使用するWeb
    <br/>
    - TMAを使用するモバイル
    <br/>
    - VMGを使用するモバイル
   </td>
   <td style="text-align: left;">
    いいえ
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    <strong>
     グリッド上のテストエディタ(Testimおよびサードパーティ)
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
    <code>
     host=localhost/127.0.0.1
    </code>
    を指定して
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
    <code>
     host=localhost/127.0.0.1
    </code>
    を指定して
    <strong>
     グリッド上のテストエディタ
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
  <tr>
   <td style="text-align: left;">
    <strong>
     スケジューラ
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
 </tbody>
</table>
