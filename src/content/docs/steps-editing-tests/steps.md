---
title: 'ステップ'
description: 'Testimのステップの種類と使い方について説明します。手動ステップと自動記録ステップの違い、検証ステップ、待機ステップ、アクションステップの詳細を解説します。'
category: 'ステップとテスト編集'
order: 1
updated: '2025-09-13'
sourceUrl: 'https://help.testim.io/docs/steps'
keywords:
  - ステップ
  - テスト編集
  - 検証
  - アクション
  - 自動記録
---

ステップは、[グループ](/docs/groups)と共に、テストの基本的な構成要素です。ステップには、ほぼすべてのテスト要件を満たすために、さまざまなアクションと検証を実行できます。各ステップには特定のプロパティがあり、[ステップのプロパティパネル](/docs/editing-a-steps-properties)で確認できます。一部のステップは[共有ステップ](/docs/shareable-steps)として個別に共有できますが、他のステップは共有のために追加のステップとグループ化する必要があります。

## ステップの追加方法

ステップは2つの方法で追加できます：

- **手動ステップ** - ユーザーが矢印記号の上にマウスを移動し、事前定義ステップリストから関連するステップを選択することで、手動でステップを追加します。または、ビジュアルエディターまたはAUTブラウザから[キーボードショートカット](/docs/keyboard-shortcuts)のいずれかを使用して、手動でステップを追加することもできます。

- **自動記録ステップ** - ユーザーがテスト対象アプリケーションと対話する際に、テストの記録中にステップが自動的に追加されます。

## 手動ステップ

手動ステップには、検証ステップ、待機ステップ、アクションステップの3つのカテゴリがあります。

### 検証ステップ

| ステップ名 | 説明 |
|---------|------|
| Add custom validation | カスタム検証とアクションを追加 |
| Add CLI validation | CLIステップを追加 |
| Validate download | ダウンロード検証ステップを追加 |
| Validate email | メール検証 |
| Validate element visible | 要素が表示されているか検証 |
| Validate element not visible | 要素が表示されていないか検証 |
| Validate element text | 要素のテキストを検証 |
| Validate CSS property | CSSプロパティを検証 |
| Validate HTML attribute | HTML属性を検証 |
| Validate checkbox | チェックボックス/ラジオボタンを検証 |
| Validate radio button | チェックボックス/ラジオボタンを検証 |
| Validate API | API検証 |
| Validate element visualization | 要素のビジュアライゼーションを検証するステップを追加 |
| Validate viewport visualization | ビューポートまたはフルページのビジュアライゼーションを検証するステップを追加 |
| Validate full-page visualization | ビューポートまたはフルページのビジュアライゼーションを検証するステップを追加 |
| Validate page accessibility | ページアクセシビリティ検証 |
| Validate element accessibility | 要素アクセシビリティ検証 |
| Add network validation | ネットワーク検証を追加 |

### 待機ステップ

| ステップ名 | 説明 |
|---------|------|
| Add custom wait for | カスタム待機 |
| Add CLI wait for | CLIステップを追加 |
| Wait for element visible | 要素が表示されるまで待機 |
| Wait for element not visible | 要素が非表示になるまで待機 |
| Wait for element text | 要素のテキストを待機 |
| Wait for download | ダウンロードを待機 |
| Sleep | スリープ |
| Wait for element visualization | 要素のビジュアライゼーションを待機するステップを追加 |

### アクションステップ

| ステップ名 | 説明 |
|---------|------|
| Add hover action | ホバーステップ |
| Add extract value step | 値抽出ステップ |
| Generate email address | 一時的なメールアドレスを生成 |
| Set Cookie | Cookieを設定 |
| Get Cookie | Cookieを取得 |
| Add navigation action | ナビゲーション |
| Add custom action | カスタム検証とアクションを追加 |
| Add CLI action | CLIステップを追加 |
| Add API action | APIアクション |
| Refresh | ページを更新 |
| Generate random value | ランダム値を生成 |
| Generate date | 日付を生成 |

## 自動記録ステップ

テスト対象アプリケーション（AUT）での操作中に自動的に記録されるステップです。

| ステップ名 | トリガー条件 |
|---------|---------|
| Click | マウスクリック時 |
| Double click | ダブルクリック時 |
| Right click | 右クリック時 |
| Scroll (to element/on page) | スクロール操作時（[Scrollステップ](/docs/scroll)を参照） |
| Set text | フィールドにテキストを設定時 |
| File upload / File drop | ファイル選択またはフレームへのファイルドロップ時（[ファイルアップロードステップ検証](/docs/file-upload-step)を参照） |
| Press (Key press) | キーボードキー押下時（Enter、Tab、ESC、Page Up、Page Downなど） |
| Download validation | 記録中にファイルがダウンロードされた時。手動でも追加可能（[Validate download](/docs/validate-download)を参照） |
| Drag & Drop | AUT内でアーティファクトをドラッグ&ドロップ時（[Drag & Dropステップ](/docs/drag-drop-step)を参照） |
