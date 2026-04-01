---
title: LambdaTest SmartUI 統合
description: LambdaTest SmartUI を使用したビジュアル検証の統合方法について説明します。必要な認証情報と設定手順を提供します。
category: 統合
order: 12016
updated: '2025-09-19'
sourceUrl: 'https://docs.tricentis.com/testim/content/integrations/visual-validation/lambdatest_integration.htm'
keywords:
  - LambdaTest
  - SmartUI
  - ビジュアル検証
  - ビジュアルテスト
  - UI テスト
  - 統合設定
---

LambdaTest SmartUI は、Web アプリの UI をデバイス横断でテストし、視覚的な差分やレイアウトの問題を検出するビジュアル検証ツールです。

## 開始前の準備

前提条件:

- LambdaTest と Testim の両方で管理者権限が必要です
- Testim プロジェクトが Professional plan である必要があります

LambdaTest から以下の認証情報を取得してください:

- Username
- Access key
- Project token

:::note
これらの認証情報の取得方法については、[LambdaTest のガイド](https://www.lambdatest.com/support/docs/hyperexecute-how-to-get-my-username-and-access-key/)を参照してください。
:::

## LambdaTest SmartUI の統合

1. **Settings > Integration > Visual testing** に移動します。
2. LambdaTest ペインで **login** を選択します。
3. LambdaTest から取得した **Username**、**Access key**、**Project Token** を入力します。
4. **Connect** を選択します。

統合が完了すると、LambdaTest SmartUI がビジュアルテストプロバイダーとして有効になります。

- **初回統合の場合**: テストを設計して実行し、リグレッション検出用のベースラインを確立してください。
- **プロバイダーの切り替え時**: Testim は新しいベースラインを作成するためにテストを自動的に再実行します。
- **再度切り替える場合**: 既存のベースラインが再利用されます。
