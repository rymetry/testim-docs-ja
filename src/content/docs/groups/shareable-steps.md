---
title: 共有ステップ
description: プロジェクト内で複数のテスト間で共有できるステップについて説明します。検証、待機、アクションステップの共有方法と再利用方法を解説します。
category: テスト編集
order: 4009
updated: '2025-09-19'
sourceUrl: 'https://docs.tricentis.com/testim/content/editing-tests/shareable-steps.htm'
keywords:
  - 共有ステップ
  - Shared Steps
  - 検証
  - カスタムアクション
  - API 検証
  - CLI
  - 再利用
  - ステップ共有
---

共有ステップ（Shared Steps）は、特定のプロジェクト内で複数のテスト間にまたがって共有されるステップです。いくつかのステップタイプはデフォルトで共有ステップであり（明示的な設定は不要）、他のユーザーが作成するテストでも利用できます。\
以下の表は、他のステップとグループ化せずに単独で共有できる事前定義ステップを示します。

### Validations（検証）

<table class="md-table md-table-2cols">
 <thead>
  <tr>
   <th style="text-align: left;">
    Validations
   </th>
   <th style="text-align: left;">
    Documentation
   </th>
  </tr>
 </thead>
 <tbody>
  <tr>
   <td style="text-align: left;">
    Add custom validation
   </td>
   <td style="text-align: left;">
    <a href="/docs/custom-code">
     Add custom validations and actions
    </a>
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    Add CLI validation
   </td>
   <td style="text-align: left;">
    <a href="/docs/validate-download#前提条件">
     Adding a CLI step
    </a>
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    Validate download
   </td>
   <td style="text-align: left;">
    <a href="/docs/validate-download#前提条件">
     Adding a Validate download validation step
    </a>
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    Validate email
   </td>
   <td style="text-align: left;">
    <a href="/docs/email-validation">
     Validate email
    </a>
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    Validate API
   </td>
   <td style="text-align: left;">
    <a href="/docs/api-testing#実行後の結果の確認">
     API Validation
    </a>
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    Add network validation
   </td>
   <td style="text-align: left;">
    <a href="/docs/add-network-validation">
     Add network validation
    </a>
   </td>
  </tr>
 </tbody>
</table>

### Wait for（待機）

<table class="md-table md-table-2cols">
 <thead>
  <tr>
   <th style="text-align: left;">
    Wait For
   </th>
   <th style="text-align: left;">
    Documentation
   </th>
  </tr>
 </thead>
 <tbody>
  <tr>
   <td style="text-align: left;">
    Add custom wait for
   </td>
   <td style="text-align: left;">
    <a href="/docs/wait-for#要素の表示を待つ（モバイル）">
     Custom Wait for
    </a>
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    Add CLI wait for
   </td>
   <td style="text-align: left;">
    <a href="/docs/validate-download#前提条件">
     Adding a CLI step
    </a>
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    Wait for download
   </td>
   <td style="text-align: left;">
    <a href="/docs/wait-for#ダウンロード待機（web）">
     Wait for Download
    </a>
   </td>
  </tr>
 </tbody>
</table>

### Actions（アクション）

<table class="md-table md-table-2cols">
 <thead>
  <tr>
   <th style="text-align: left;">
    Actions
   </th>
   <th style="text-align: left;">
    Documentation
   </th>
  </tr>
 </thead>
 <tbody>
  <tr>
   <td style="text-align: left;">
    Add custom action
   </td>
   <td style="text-align: left;">
    <a href="/docs/custom-code">
     Add custom validations and actions
    </a>
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    Add CLI action
   </td>
   <td style="text-align: left;">
    <a href="/docs/validate-download#前提条件">
     Adding a CLI step
    </a>
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    Add API action
   </td>
   <td style="text-align: left;">
    <a href="/docs/api-testing#実行後の結果の確認">
     API Action
    </a>
   </td>
  </tr>
 </tbody>
</table>

## 新しい共有ステップの作成

上記の共有可能なステップについては、テストに追加する際に共有ステップとして指定できます。

**共有ステップを追加するには:**

1. ステップを追加したい位置の（矢印）にカーソルを合わせます。
2. "M"（Testim の事前定義ステップ）をクリックします。
3. Predefined steps の一覧から該当ステップを選択します。
4. **Add Step** ダイアログで **Shared step** チェックボックスをオンにします。

   ![共有ステップの設定](/images/groups/shareable-steps/3a14d05-image.png)

5. 共有ステップを **Root** フォルダー以外に配置したい場合は、**Select shared step folder** でフィールドをクリックし、既存フォルダーを選ぶか **Add Folder** をクリックして新しいフォルダー名を指定します。**Select** をクリックして確定します。

   ![フォルダーの追加](/images/groups/shareable-steps/a69521b-addfolder.png)

## 既存ステップを共有ステップに変更

共有可能な通常ステップは、後から共有ステップに変換できます。

**既存ステップを共有ステップにするには:**

1. 共有可能な通常ステップで **Show Properties** をクリックします。

   ![Show Properties ボタン](/images/groups/shareable-steps/d887de9-showproperties.png)

2. Properties ペインで **Shared Step** リンクをクリックします。

   ![Shared Step リンク](/images/groups/shareable-steps/54d39fb-shaedsteplink.png)

## 共有ステップの再利用

テスト作成時に、これまでに作成された共有ステップの一覧にアクセスできます。

![共有ステップの再利用](/images/groups/shareable-steps/574a179-sharedstep.gif)

**共有ステップを再利用するには:**

1. ステップを追加したい位置の（矢印）にカーソルを合わせます。\
   アクションのオプションが表示されます。
2. "M"（Testim の事前定義ステップ）をクリックします。\
   Predefined steps メニューが開きます。
3. **Shared Steps** タブをクリックします。\
   ステップの一覧が表示されます。
4. 目的の共有ステップをクリックしてテストに追加します。
5. **Properties**（歯車アイコン）をクリックしてプロパティを変更します。
