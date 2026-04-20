---
title: ステップ
description: >-
  Testim のステップの種類と使い方について説明します。手動ステップと自動記録ステップの違い、検証ステップ、待機ステップ、アクションステップの詳細を解説します。
category: テスト編集
order: 4001
updated: '2025-09-19'
sourceUrl: 'https://docs.tricentis.com/testim/content/editing-tests/steps.htm'
keywords:
  - ステップ
  - テスト編集
  - 検証
  - アクション
  - 自動記録
---

ステップは、[グループ](/docs/editing-tests/groups)と共に、テストの基本的な構成要素です。ステップには、ほぼすべてのテスト要件を満たすために、さまざまなアクションと検証を実行できます。各ステップには特定のプロパティがあり、[ステップのプロパティパネル](/docs/editing-tests/editing-your-tests/editing-a-steps-properties)で確認できます。一部のステップは[共有ステップ](/docs/editing-tests/shareable-steps)として個別に共有できますが、他のステップは共有のために追加のステップとグループ化する必要があります。ステップは 2 つの方法で追加できます：

- **[手動ステップ](#手動ステップ)** - ユーザーが矢印記号の上にマウスを移動し、事前定義ステップリストから関連するステップを選択することで、手動でステップを追加します。または、Visual Editor または AUT ブラウザから[キーボードショートカット](/docs/guides/keyboard-shortcuts)のいずれかを使用して、手動でステップを追加することもできます。
- **[自動記録ステップ](#自動記録ステップ)** - ユーザーがテスト対象アプリケーションと対話する際に、テストの記録中にステップが自動的に追加されます。

## 手動ステップ

### 検証ステップ

<table class="md-table md-table-2cols">
 <thead>
  <tr>
   <th>
    ステップ名
   </th>
   <th>
    説明
   </th>
  </tr>
 </thead>
 <tbody>
  <tr>
   <td>
    Add custom validation
   </td>
   <td>
    <a href="/docs/advanced-editing/validations/custom-code">カスタム検証とアクションを追加</a>
   </td>
  </tr>
  <tr>
   <td>
    Add CLI validation
   </td>
   <td>
    <a href="/docs/advanced-editing/validations/validate-download#前提条件">CLI ステップを追加</a>
   </td>
  </tr>
  <tr>
   <td>
    Validate download
   </td>
   <td>
    <a href="/docs/advanced-editing/validations/validate-download#validate-download-ステップの追加">ダウンロード検証ステップを追加</a>
   </td>
  </tr>
  <tr>
   <td>
    Validate email
   </td>
   <td>
    <a href="/docs/advanced-editing/validations/email-validation">メール検証</a>
   </td>
  </tr>
  <tr>
   <td>
    Validate element visible
   </td>
   <td>
    <a href="/docs/advanced-editing/validations/validate-element-visible">要素が表示されているか検証</a>
   </td>
  </tr>
  <tr>
   <td>
    Validate element not visible
   </td>
   <td>
    <a href="/docs/advanced-editing/validations/validate-element-not-visible">要素が表示されていないか検証</a>
   </td>
  </tr>
  <tr>
   <td>
    Validate element text
   </td>
   <td>
    <a href="/docs/advanced-editing/validations/validate-element-text">要素のテキストを検証</a>
   </td>
  </tr>
  <tr>
   <td>
    Validate CSS property
   </td>
   <td>
    <a href="/docs/advanced-editing/validations/css-property-validation">CSS プロパティを検証</a>
   </td>
  </tr>
  <tr>
   <td>
    Validate HTML attribute
   </td>
   <td>
    <a href="/docs/advanced-editing/validations/html-attribute-validation">HTML 属性を検証</a>
   </td>
  </tr>
  <tr>
   <td>
    Validate checkbox
   </td>
   <td>
    <a href="/docs/advanced-editing/validations/checkbox-and-radio-button-validation">チェックボックス/ラジオボタンを検証</a>
   </td>
  </tr>
  <tr>
   <td>
    Validate radio button
   </td>
   <td>
    <a href="/docs/advanced-editing/validations/checkbox-and-radio-button-validation">チェックボックス/ラジオボタンを検証</a>
   </td>
  </tr>
  <tr>
   <td>
    Validate API
   </td>
   <td>
    <a href="/docs/advanced-editing/api-testing#validate-api-ステップの追加">API 検証</a>
   </td>
  </tr>
  <tr>
   <td>
    Validate element visualization
   </td>
   <td>
    <a href="/docs/advanced-editing/validations/pixel-validation-and-pixel-wait-for#ビジュアル検証パラメーター">要素のビジュアライゼーションを検証するステップを追加</a>
   </td>
  </tr>
  <tr>
   <td>
    Validate viewport visualization
   </td>
   <td>
    <a href="/docs/advanced-editing/validations/pixel-validation-and-pixel-wait-for#ビジュアル検証パラメーター">ビューポートまたはフルページのビジュアライゼーションを検証するステップを追加</a>
   </td>
  </tr>
  <tr>
   <td>
    Validate full-page visualization
   </td>
   <td>
    <a href="/docs/advanced-editing/validations/pixel-validation-and-pixel-wait-for#ビジュアル検証パラメーター">ビューポートまたはフルページのビジュアライゼーションを検証するステップを追加</a>
   </td>
  </tr>
  <tr>
   <td>
    Validate page accessibility
   </td>
   <td>
    <a href="/docs/advanced-editing/validations/accessibility-validations">ページアクセシビリティ検証</a>
   </td>
  </tr>
  <tr>
   <td>
    Validate element accessibility
   </td>
   <td>
    <a href="/docs/advanced-editing/validations/element-accessibility-validation">要素アクセシビリティ検証</a>
   </td>
  </tr>
  <tr>
   <td>
    Add network validation
   </td>
   <td>
    <a href="/docs/advanced-editing/validations/add-network-validation">ネットワーク検証を追加</a>
   </td>
  </tr>
 </tbody>
</table>

### 待機ステップ

<table class="md-table md-table-2cols">
 <thead>
  <tr>
   <th>
    ステップ名
   </th>
   <th>
    説明
   </th>
  </tr>
 </thead>
 <tbody>
  <tr>
   <td>
    Add custom wait for
   </td>
   <td>
    <a href="/docs/advanced-editing/wait-for#カスタム待機（web）">カスタム待機</a>
   </td>
  </tr>
  <tr>
   <td>
    Add CLI wait for
   </td>
   <td>
    <a href="/docs/advanced-editing/validations/validate-download#前提条件">CLI ステップを追加</a>
   </td>
  </tr>
  <tr>
   <td>
    Wait for element visible
   </td>
   <td>
    <a href="/docs/advanced-editing/wait-for#要素の表示を待つ（web）">要素が表示されるまで待機</a>
   </td>
  </tr>
  <tr>
   <td>
    Wait for element not visible
   </td>
   <td>
    <a href="/docs/advanced-editing/wait-for#要素の非表示を待つ（web）">要素が非表示になるまで待機</a>
   </td>
  </tr>
  <tr>
   <td>
    Wait for element text
   </td>
   <td>
    <a href="/docs/advanced-editing/wait-for#要素テキストの表示を待つ（web）">要素のテキストを待機</a>
   </td>
  </tr>
  <tr>
   <td>
    Wait for download
   </td>
   <td>
    <a href="/docs/advanced-editing/wait-for#ダウンロード待機（web）">ダウンロードを待機</a>
   </td>
  </tr>
  <tr>
   <td>
    Sleep
   </td>
   <td>
    <a href="/docs/advanced-editing/wait-for#スリープ（web）">スリープ</a>
   </td>
  </tr>
  <tr>
   <td>
    Wait for element visualization
   </td>
   <td>
    <a href="/docs/advanced-editing/validations/pixel-validation-and-pixel-wait-for#ビジュアル検証パラメーター">要素のビジュアライゼーションを待機するステップを追加</a>
   </td>
  </tr>
 </tbody>
</table>

### アクションステップ

<table class="md-table md-table-2cols">
 <thead>
  <tr>
   <th>
    ステップ名
   </th>
   <th>
    説明
   </th>
  </tr>
 </thead>
 <tbody>
  <tr>
   <td>
    Add hover action
   </td>
   <td>
    <a href="/docs/advanced-editing/handling-ui-actions/hover-step#ホバーした要素への検証の追加">ホバーステップ</a>
   </td>
  </tr>
  <tr>
   <td>
    Add extract value step
   </td>
   <td>
    <a href="/docs/advanced-editing/extract-text">値抽出ステップ</a>
   </td>
  </tr>
  <tr>
   <td>
    Generate email address
   </td>
   <td>
    <a href="/docs/advanced-editing/validations/email-validation#generate-email-address-ステップの追加">一時的なメールアドレスを生成</a>
   </td>
  </tr>
  <tr>
   <td>
    Set Cookie
   </td>
   <td>
    <a href="/docs/advanced-editing/cookies#cookie-を設定する">Cookie を設定</a>
   </td>
  </tr>
  <tr>
   <td>
    Get Cookie
   </td>
   <td>
    <a href="/docs/advanced-editing/cookies#cookie-を取得する">Cookie を取得</a>
   </td>
  </tr>
  <tr>
   <td>
    Add navigation action
   </td>
   <td>
    <a href="/docs/advanced-editing/handling-ui-actions/navigation">ナビゲーション</a>
   </td>
  </tr>
  <tr>
   <td>
    Add custom action
   </td>
   <td>
    <a href="/docs/advanced-editing/validations/custom-code">カスタム検証とアクションを追加</a>
   </td>
  </tr>
  <tr>
   <td>
    Add CLI action
   </td>
   <td>
    <a href="/docs/advanced-editing/validations/validate-download#前提条件">CLI ステップを追加</a>
   </td>
  </tr>
  <tr>
   <td>
    Add API action
   </td>
   <td>
    <a href="/docs/advanced-editing/api-testing#adding-an-api-action-step">API アクション</a>
   </td>
  </tr>
  <tr>
   <td>
    Refresh
   </td>
   <td>
    <a href="/docs/advanced-editing/handling-ui-actions/refresh-page">ページを更新</a>
   </td>
  </tr>
  <tr>
   <td>
    Generate random value
   </td>
   <td>
    <a href="/docs/editing-tests/generating-a-random-value">ランダム値を生成</a>
   </td>
  </tr>
  <tr>
   <td>
    Generate date
   </td>
   <td>
    <a href="/docs/editing-tests/generating-a-date">日付を生成</a>
   </td>
  </tr>
 </tbody>
</table>

## 自動記録ステップ

<table class="md-table md-table-2cols">
 <thead>
  <tr>
   <th>
    ステップ名
   </th>
   <th>
    トリガー条件
   </th>
  </tr>
 </thead>
 <tbody>
  <tr>
   <td>
    Click
   </td>
   <td>
    マウスクリック時
   </td>
  </tr>
  <tr>
   <td>
    Double click
   </td>
   <td>
    ダブルクリック時
   </td>
  </tr>
  <tr>
   <td>
    Right click
   </td>
   <td>
    右クリック時
   </td>
  </tr>
  <tr>
   <td>
    Scroll (to element/on page)
   </td>
   <td>
    スクロール操作時（
    <a href="/docs/advanced-editing/handling-ui-actions/scroll">
     Scroll ステップ
    </a>
    を参照）
   </td>
  </tr>
  <tr>
   <td>
    Set text
   </td>
   <td>
    フィールドにテキストを設定時
   </td>
  </tr>
  <tr>
   <td>
    File upload / File drop
   </td>
   <td>
    ファイル選択またはフレームへのファイルドロップ時（
    <a href="/docs/advanced-editing/validations/file-upload-step">
     ファイルアップロードステップ検証
    </a>
    を参照）
   </td>
  </tr>
  <tr>
   <td>
    Press (Key press)
   </td>
   <td>
    キーボードキー押下時（エンターキー、タブキー、エスケープキー、ページアップキー、ページダウンキーなど）
   </td>
  </tr>
  <tr>
   <td>
    Download validation
   </td>
   <td>
    記録中にファイルがダウンロードされた時。手動でも追加可能（
    <a href="/docs/advanced-editing/validations/validate-download">
     Validate download
    </a>
    を参照）
   </td>
  </tr>
 </tbody>
</table>

\| Drag & Drop \| AUT 内でアーティファクトをドラッグ&amp;ドロップ時（[Drag & Drop ステップ](/docs/advanced-editing/handling-ui-actions/drag-drop-step)を参照） \|
