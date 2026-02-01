---
title: '変更履歴'
description: 'Testim for Salesforceの主な機能追加・改善の履歴（スクリーンショット、Login As、権限検証、SSO、CI統合など）をまとめます。'
category: 'Salesforceテスト'
order: 4
updated: '2025-12-02'
sourceUrl: 'https://help.testim.io/docs/changelog'
keywords:
  - 変更履歴
  - Salesforceテスト
  - スクリーンショット
  - Login As
  - 権限検証
  - Salesforce SSO
  - CI統合
  - Copado
  - Gearset
  - Document Validation
---
## スクリーンショットのログ記録 2023年3月

Testim for Salesforceの最新バージョンでは、各テストステップのスクリーンショットをキャプチャし、Salesforceログに保存できるようになり、デバッグに役立ちます。これを行うには、Log screenshotsオプションを有効にするだけです。

## Login Asステップでのユーザー間切り替え 2023年5月

管理者ユーザーは、単一のテストケース内でユーザー間を切り替えることができるようになりました。これを行うには、Salesforceアカウントにサインインした後、Log In As Salesforceステップを使用します。

## 権限検証ステップ 2023年5月

Salesforce環境をさらに保護するために、このテストステップを使用して、各オブジェクトとそのフィールドの読み取りおよび書き込み権限を検証し、期待される権限と一致することを確認できるようになりました。

## Sign-in with Salesforce 2023年5月

ペルソナを作成する際に、Salesforceシングルサインオン（SSO）を使用できるようになりました。Sign-in with Salesforceで作成されたペルソナは、MFAログイン認証ステップに従う必要がありません。また、新しいSalesforce環境を接続する際に、この方法を使用して管理者ペルソナを自動的に作成するようになりました。

## Tricentis Test Management for Jira統合 2023年6月

Testim for SalesforceのテストをTricentis Test Management for Jiraのテストケースにリンクできるようになりました。Tricentis Test Automation for Salesforceでテストを実行すると、テスト結果がTricentis Test Management for Jiraの実行結果に自動的に表示されます。詳細については、Tricentis Test Management for Jira統合を参照してください。

## デモプロジェクトの提供 2023年6月

事前に接続されたSalesforceサンドボックスとサンプルのSalesforceテストケースを含むデモプロジェクトが利用可能になり、すぐに製品の探索と学習を開始できます。

## CI統合 2023年6月

Testim for Salesforceの最新バージョンは、Copado統合とGearset統合をサポートしています。これらのCIツールを使用して、Salesforceへの変更をデプロイできます。Testim for Salesforceと統合することで、本番環境に変更をデプロイする前に何も壊れていないことを確認できます。

* Copado統合: URL Calloutステップを追加し、Tricentis Test Automation for Salesforce REST APIへの単一のWebhook呼び出しを使用して、Copadoからのテストを自動化できるようになりました。
* Gearset統合: GearsetにWebhookを追加し、Tricentis Test Automation for Salesforce REST APIへの単一のWebhook呼び出しを使用して、GearsetのCIまたはデプロイメントジョブからのテストを自動化できるようになりました。

## CPQ Quote Line Editorステップ 2023年7月

Salesforce CPQアプリケーションは、販売見積もりを生成する際に製品構成と価格ルールを維持します。テーブル内の値を変更、保存、検証することで、新しいノーコードテストステップでCPQ Quote Line Editorのこれらのビジネスルールを検証できるようになりました。

## AIテストクリエーター 2023年7月

接続されたSalesforce環境からのデータを使用して、一連のテストが自動的に作成されます。これは、Salesforce環境の現在のレコードを調べ、一意の値が必要な場所を特定することで行われます。

## SOC 2 Type 1およびISO 27001認証取得 2023年8月

データセキュリティ、コンプライアンス、顧客信頼への当社のコミットメントを示しています。

## 会社所有者がプロジェクトをクローンする機能 2023年11月

開発チームやコンサルタント会社は、通常、新しいプロジェクトやクライアントエンゲージメントごとに再現する必要がある基本的なテストとテスト構成のセットを持っています。これらのテスト資産の再現にかかる時間を節約するため、会社所有者がプロジェクトページでプロジェクトクローンにアクセスできるようになりました。

## Document Validationステップ 2023年12月

Document Validationテストステップは、ドキュメントの内容を検証および保存するための包括的なノーコードソリューションを提供します。これには、特定のテキストの存在または不在のチェック、キー値ペアの検証、テーブルの内容の正確性の確保が含まれます。
