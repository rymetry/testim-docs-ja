---
title: Salesforce 向け Agentic Test Automation の使用
description: >-
  Agentic Test
  Automation で AI エージェントにプロンプトを与え、Salesforce 向けのテストを生成・実行する手順とプロンプト例を紹介します。
category: Salesforceテスト
order: 16008
updated: '2025-12-02'
sourceUrl: 'https://docs.tricentis.com/testim/content/salesforce-testing/create-a-salesforce-test/use-agentic-test-automation-for-salesforce.htm'
keywords:
  - Agentic Test Automation
  - Agentic Test Automation
  - AI エージェント
  - プロンプト
  - Salesforce テスト
  - テスト生成
  - テスト実行
  - 手動レビュー
  - Testim for Salesforce
  - テスト作成
---

[ステップを手動で追加または記録する](/docs/salesforce-testing/create-a-salesforce-test)ことに加えて、Agentic Test Automation の支援を受けて Salesforce 向けのテストを作成できます。このツールを使用すると、特別にトレーニングされた AI エージェントと協力して、Salesforce 環境向けのユニークなテストを生成および実行できます。

## 前提条件

- Testim Extension をダウンロードしてインストールする - [なぜ Testim Extension が必要ですか？](/docs/recording-tests/how-to-record-a-test/why-do-you-need-testim-extension)
- [Salesforce テスト環境を Testim/TTA for Salesforce に接続する](/docs/salesforce-testing/create-and-manage-test-environments)。

## Agentic Test Automation で新しい Salesforce テストを作成する

**新しいテストを作成するには:**

1. Testim for Salesforce アカウント内のどこからでも、画面上部の**Agentic Test Automation**を選択します。
2. このサービスを初めて使用する場合は、**Terms of Service**の一番下までスクロールして、**Got it**を選択してオプトインします。
3. これで、エージェントへのプロンプトを開始できます。テストしたい内容の説明をエージェントに与えます。それが簡単なものでも複雑なものでも構いません。これを行う方法の例については、[プロンプトの作成方法](/docs/salesforce-testing/create-a-salesforce-test/use-agentic-test-automation-for-salesforce#プロンプトの作成方法)をご覧ください。

![Agentic Test Automation のプロンプト入力画面](/images/salesforce-testing/use-agentic-test-automation-for-salesforce/ff3b908-Salesforce_AgenticeAITesting_Screenshot.png)

4. エージェントが作業している間、時々テストステップを追加する確認を求めます。エージェントが提供する情報を確認し、ステップを追加するかどうかを確認します。
5. エージェントがテストの作成を完了すると、テストを実行するかどうかを尋ねられます。この時点で、停止して通常どおりに[テストを手動でレビュー、編集、実行](/docs/salesforce-testing/create-a-salesforce-test)できます。または、このリクエストを確認して、エージェントにテストを実行させることができます。
6. エージェントがテストを実行する場合、テストを検証し、見つかった問題を解決します。テスト実行が完了すると、エージェントは作成したテストの概要を提供し、これをアーティファクトとしてテストに追加できます。

## プロンプトの作成方法

エージェントにシンプルでハイレベルなプロンプトを与えることも、組織向けにカスタマイズされた詳細なプロンプトを作成することもできます。詳細を提供すればするほど、エージェントはテストをより適切に調整できますが、シンプルなプロンプトはトークンの消費が少なくて済みます。プロンプトがどのようなものになるかについて詳しく知るには、以下の表でいくつかのプロンプト例を確認してください:

<table class="md-table md-table-3cols">
 <thead>
  <tr>
   <th style="text-align: left;">
    ユースケース
   </th>
   <th style="text-align: left;">
    プロンプト
   </th>
   <th style="text-align: left;">
    複雑さ
   </th>
  </tr>
 </thead>
 <tbody>
  <tr>
   <td style="text-align: left;">
    アカウント管理のテスト
   </td>
   <td style="text-align: left;">
    <code>
     Create a new Account.
    </code>
   </td>
   <td style="text-align: left;">
    低
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    カスタム認証情報を使用したアカウント管理のテスト
   </td>
   <td style="text-align: left;">
    <code>
     Create an account with the following data: Account name: Account123, Parent account: Account123_Root UAN: 111, Do not delete the account Account 123.
    </code>
   </td>
   <td style="text-align: left;">
    中
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    アカウントと連絡先管理のテスト
   </td>
   <td style="text-align: left;">
    <code>
     Create a new Account and add a new Contact for that Account.
    </code>
   </td>
   <td style="text-align: left;">
    低
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    商談管理のテスト
   </td>
   <td style="text-align: left;">
    <code>
     Create an Account and an Opportunity, progress the Opportunity through all stages.
    </code>
   </td>
   <td style="text-align: left;">
    中
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    アクティビティ管理のテスト（検証なし）
   </td>
   <td style="text-align: left;">
    <code>
     Create a new Lead and log a Call and set a Task for 7 days time, do not validate either task.
    </code>
   </td>
   <td style="text-align: left;">
    中
   </td>
  </tr>
 </tbody>
</table>

<table class="md-table md-table-3cols">
 <tbody>
  <tr>
   <td style="text-align: left;">
    リード変換のテスト（検証あり）
   </td>
   <td style="text-align: left;">
    <code>
     Create a new Lead, work through all stages to converting to an Opportunity with a new Account and Contact. Validate that a new Opportunity, Account and Contact are created, and the fields are correct from the Lead.
    </code>
   </td>
   <td style="text-align: left;">
    高
   </td>
  </tr>
 </tbody>
</table>
