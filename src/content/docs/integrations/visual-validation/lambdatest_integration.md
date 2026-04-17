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

LambdaTest SmartUI は、Web アプリの UI をデバイス横断でテストし、テキストの重なり、画像の破損、不正な間隔などの視覚的な差分やレイアウトの問題を検出する[ビジュアル検証](/docs/advanced-editing/validations/pixel-validation-and-pixel-wait-for)ツールです。LambdaTest を Testim と統合することで、ビジュアル回帰の検出を自動化できます。

## 開始前の準備

LambdaTest と Testim を統合する前に、以下を確認してください:

- LambdaTest と Testim の両方で管理者権限があること
- Testim プロジェクトが [Professional plan](https://www.testim.io/pricing/) であること

また、LambdaTest から以下の認証情報が必要です:

- Username.
- Access key.
- Project token.

これらの認証情報の取得方法については、[LambdaTest のガイド](https://www.testmuai.com/support/docs/hyperexecute-how-to-get-my-username-and-access-key/)を参照してください。

## LambdaTest SmartUI の統合

LambdaTest を最初のビジュアルテストプロバイダーとして使用開始するか、別のプロバイダーから LambdaTest に切り替えることができます。

どちらの場合も、以下の手順に従ってください:

1. **Settings > Integration > Visual testing** に移動します。
2. **LambdaTest** ペインで **login** を選択します。
3. LambdaTest から取得した **Username**、**Access key**、**Project Token** を入力します。
4. **Connect** を選択します。

LambdaTest SmartUI が[ビジュアルテストプロバイダー](/docs/advanced-editing/validations/pixel-validation-and-pixel-wait-for)として使用されるようになりました。ベースラインの作成または再利用の準備が完了しています:

- **初めてビジュアルテストプロバイダーを統合した場合**: テストを設計して実行し、リグレッション検出用のベースラインを確立してください。
- **プロバイダーを切り替えた場合**: 初回の切り替え時に、Testim は新しいベースラインを記録するためにテストを自動的に再実行します。再度プロバイダーを切り替える場合は、既存のベースラインが再利用されます。
