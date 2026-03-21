---
title: 変更履歴
description: Testim for Salesforce の主な機能追加・改善の履歴（スクリーンショット、Login As、権限検証、SSO、CI 統合など）をまとめます。
category: Salesforceテスト
order: 16004
updated: '2025-12-02'
sourceUrl: 'https://help.testim.io/docs/changelog'
keywords:
  - 変更履歴
  - Salesforce テスト
  - スクリーンショット
  - Login As
  - 権限検証
  - Salesforce SSO
  - CI 統合
  - Copado
  - Gearset
  - Document Validation
---

## スクリーンショットのログ記録 2023 年 3 月

Testim for Salesforce の最新バージョンでは、各テストステップのスクリーンショットをキャプチャし、Salesforce ログに保存できるようになり、デバッグに役立ちます。これを行うには、Log screenshots オプションを有効にするだけです。

## Login As ステップでのユーザー間切り替え 2023 年 5 月

管理者ユーザーは、単一のテストケース内でユーザー間を切り替えることができるようになりました。これを行うには、Salesforce アカウントにサインインした後、Log In As Salesforce ステップを使用します。

## 権限検証ステップ 2023 年 5 月

Salesforce 環境をさらに保護するために、このテストステップを使用して、各オブジェクトとそのフィールドの読み取りおよび書き込み権限を検証し、期待される権限と一致することを確認できるようになりました。

## Sign-in with Salesforce 2023 年 5 月

ペルソナを作成する際に、Salesforce シングルサインオン（SSO）を使用できるようになりました。Sign-in with Salesforce で作成されたペルソナは、MFA ログイン認証ステップに従う必要がありません。また、新しい Salesforce 環境を接続する際に、この方法を使用して管理者ペルソナを自動的に作成するようになりました。

## Tricentis Test Management for Jira 統合 2023 年 6 月

Testim for Salesforce のテストを Tricentis Test Management for Jira のテストケースにリンクできるようになりました。Tricentis Test Automation for Salesforce でテストを実行すると、テスト結果が Tricentis Test Management for Jira の実行結果に自動的に表示されます。詳細については、Tricentis Test Management for Jira 統合を参照してください。

## デモプロジェクトの提供 2023 年 6 月

事前に接続された Salesforce サンドボックスとサンプルの Salesforce テストケースを含むデモプロジェクトが利用可能になり、すぐに製品の探索と学習を開始できます。

## CI 統合 2023 年 6 月

Testim for Salesforce の最新バージョンは、Copado 統合と Gearset 統合をサポートしています。これらの CI ツールを使用して、Salesforce への変更をデプロイできます。Testim for Salesforce と統合することで、本番環境に変更をデプロイする前に何も壊れていないことを確認できます。

- Copado 統合: URL Callout ステップを追加し、Tricentis Test Automation for Salesforce REST API への単一の Webhook 呼び出しを使用して、Copado からのテストを自動化できるようになりました。
- Gearset 統合: Gearset に Webhook を追加し、Tricentis Test Automation for Salesforce REST API への単一の Webhook 呼び出しを使用して、Gearset の CI またはデプロイメントジョブからのテストを自動化できるようになりました。

## CPQ Quote Line Editor ステップ 2023 年 7 月

Salesforce CPQ アプリケーションは、販売見積もりを生成する際に製品構成と価格ルールを維持します。テーブル内の値を変更、保存、検証することで、新しいノーコードテストステップで CPQ Quote Line Editor のこれらのビジネスルールを検証できるようになりました。

## AI テストクリエーター 2023 年 7 月

接続された Salesforce 環境からのデータを使用して、一連のテストが自動的に作成されます。これは、Salesforce 環境の現在のレコードを調べ、一意の値が必要な場所を特定することで行われます。

## SOC 2 Type 1 および ISO 27001 認証取得 2023 年 8 月

データセキュリティ、コンプライアンス、顧客信頼への当社のコミットメントを示しています。

## 会社所有者がプロジェクトをクローンする機能 2023 年 11 月

開発チームやコンサルタント会社は、通常、新しいプロジェクトやクライアントエンゲージメントごとに再現する必要がある基本的なテストとテスト構成のセットを持っています。これらのテスト資産の再現にかかる時間を節約するため、会社所有者がプロジェクトページでプロジェクトクローンにアクセスできるようになりました。

## Document Validation ステップ 2023 年 12 月

Document Validation テストステップは、ドキュメントの内容を検証および保存するための包括的なノーコードソリューションを提供します。これには、特定のテキストの存在または不在のチェック、キー値ペアの検証、テーブルの内容の正確性の確保が含まれます。
