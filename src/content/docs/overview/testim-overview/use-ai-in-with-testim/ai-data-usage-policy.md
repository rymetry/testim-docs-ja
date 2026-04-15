---
title: AI データ使用ポリシー
description: Testim における生成 AI の使用とデータプライバシーに関するポリシー
category: 概要
order: 1005
updated: '2025-10-13'
sourceUrl: 'https://docs.tricentis.com/testim/content/overview/testim-overview/use-ai-in-with-testim/ai-data-usage-policy.htm'
keywords:
  - AI ポリシー
  - データ使用
  - プライバシー
  - セキュリティ
  - Azure OpenAI
  - データ保持
  - データ処理
  - オプトイン
  - オプトアウト
  - 利用規約
---

Testim AI ソリューションは、Microsoft Azure OpenAI Service の力を Testim 製品と統合しています。本サービスは、企業レベルのデータプライバシーとデータセキュリティのコンプライアンスを提供し、多管轄のコンプライアンスプログラムを維持しています。Testim Copilot は、データのプライバシーを損なうことなく、テストにおけるユーザーの生産性向上と高品質なソフトウェア提供の加速を目的として設計されています。
Tricentis は、製品における人工知能の責任ある信頼できる使用を確保することに注力しています。私たちは、透明性、プライバシーの遵守、人間の制御、公正な適用、および説明責任を含む、経済協力開発機構の AI 原則に導かれてきました。さらに、Azure OpenAI Service の行動規範を誠実に遵守しています。

## 影響を受けるコンポーネント

Testim は以下の機能を提供しています。

- [Testim ヘルプアシスタント](/docs/overview/testim-overview/help-ai-assistant) - 生成 AI 技術を使用して、ソフトウェアの使用方法についてユーザーを支援します。質問（プロンプトを使用）をして、関連するヘルプ情報を応答として受け取ることができます。

- [Testim Copilot コーディングアシスタント](/docs/advanced-editing/coding-assistant) - カスタム JS コードの記述を含むテストステップの一部である JS コードの記述、理解、または修正を支援します。

- [Agentic Test Automation for Salesforce](/docs/salesforce-testing/create-a-salesforce-test/use-agentic-test-automation-for-salesforce) - 生成 AI 技術と高度な Salesforce 事前構築済みステップを使用して、Salesforce 環境でテストを作成および実行します。

## 顧客データの使用

顧客データは Microsoft Azure OpenAI Service モデルのトレーニングには使用されません。Azure OpenAI Service の悪用や不適切な出力を監視・防止するため、入力および出力コンテンツは一時的に保存され、意味のある人間の監視が提供されます。Tricentis は、顧客の AI ソリューション利用状況に関するフィードバックやデータを含む、入力および出力コンテンツを使用・分析します。この情報は、ベンチマーク情報の提供、ソリューション改善、新しい機能・製品・サービスの開発に利用されます。また、Tricentis は、AI ソリューションの悪用や不適切な出力を監視・防止するため、意味のある人間の監視を提供しています。

## データ保持

ユーザープロンプト内のデータ（使用するツールに応じて、コードスニペット、追加のチャット履歴データ、または Salesforce メタデータが含まれる場合があります）は、最大 24 時間保存されます。プロンプトコンテンツはモデルトレーニングの目的には使用されません。プロンプトデータは他のデータから分離され、特定のチャットセッションを維持する目的のためにのみ保持されます。チャットセッション用の一意で疑似ランダムなセッション ID が保存されます。これは、チャットデータをプロンプトを送信したユーザー/会社の身元に直接追跡できないことを意味します。

## データ処理

ユーザープロンプトは、チャットセッションにのみ使用され、モデルトレーニングの目的やその他の目的には使用されません。追加の特殊なコンテキストがユーザープロンプトに追加され、API を通じて LLM に送信されます。
[データ処理補遺](https://www.tricentis.com/legal-information/data-processing-addendum)は、Copilot ソリューションを含むすべての Tricentis 製品およびサービスに適用されます。Tricentis は、グローバルなデータ保護法に従ってデータを処理および転送することに取り組んでいます。

## データの場所

すべてのデータは米国に保存および処理されます。

## オプトイン/アウト

### オプトイン

**ヘルプアシスタント** - ライセンスは不要で、すべてのユーザーが利用できます。

**Testim Copilot コーディングアシスタント** - 会社の登録と個別の承認が必要です。

- 会社のオーナーは、サービスに登録し、特定のユーザーに利用可能な席を割り当ててアクセスを提供する必要があります。
- ユーザーは個別に Testim Copilot インターフェースをアクティブ化できます。例えば、**AI でコードを記述** ボタンを選択します。
- 初回使用前に、ユーザーは法的通知で **Got It** をクリックして利用規約を承認する必要があります。

**Agentic Test Automation for Salesforce** - ユーザーは個別にオプトインできます。

- アクティブ化するには、ユーザーは **Agentic Test Automation** ボタンを選択し、利用規約を確認して承諾してツールの使用を開始できます。利用規約を承諾すると、ユーザーには 2 か月間の無料トライアルが付与されます。
- トライアルが終了すると、組織は AI クレジットを購入できます。AI クレジットは Tricentis ツール全体で使用され、クエリの計算難易度に応じて消費されます。**クレジット管理** を選択して、組織のクレジット購入についてお問い合わせください。

### オプトアウト

Testim Copilot コーディングアシスタントの場合、会社のオーナーは Copilot 席管理インターフェースを使用して、特定のユーザーをオプトアウトできます。

## 利用規約

Testim Copilot ソリューションの使用は、[Tricentis 一般利用規約](https://www.tricentis.com/legal-information/general-terms-of-use)および [Tricentis AI ソリューション製品固有の規約](https://www.tricentis.com/legal-information/ai-terms)の対象となります。AI ソリューションには、Tricentis が顧客に追加の規約を渡す必要があるサードパーティプロバイダーの技術が組み込まれている場合もあります。これらのサードパーティポリシーは[こちら](https://www.tricentis.com/legal-information/third-party-ai-policies)で入手できます。
