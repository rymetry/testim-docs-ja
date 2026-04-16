---
title: UI 操作の処理
description: スクロール、ドラッグ&ドロップ、ホバーなど、特定の UI 操作を処理するための特別な手順について説明します。
category: 高度な編集
order: 5030
updated: '2025-09-19'
sourceUrl: 'https://docs.tricentis.com/testim/content/advanced-editing/handling-ui-actions/index.htm'
keywords:
  - UI 操作
  - ユーザーインターフェース
  - スクロール
  - ドラッグアンドドロップ
  - ホバー
  - ナビゲーション
  - ページ更新
  - テスト記録
  - Web テスト
  - 自動化テスト
---

テストを作成する際には、ユーザーインターフェース（UI）との対話を必要とするステップが登場します。すべての UI 操作が同じ難度で作成できるわけではありません。Web ページは新しい機能を次々と追加しており、ほとんどの記録・再生ツールにとって課題となっています。クリックの記録やフィールドへの文字入力は簡単ですが、ほかの UI 操作はもっと追跡が難しい場合があります。本セクションでは、自動スクロールやドラッグアンドドロップなどの難しい UI 操作が、ビジュアル Test Editor 上でも適切に記録・表現されるようにするための方法を解説します。

## 高度な UI 操作

以下は、テストに追加できるより高度な UI 操作の一部です。

<table class="md-table md-table-2cols">
 <thead>
  <tr>
   <th style="text-align: left;">
    操作
   </th>
   <th style="text-align: left;">
    説明
   </th>
  </tr>
 </thead>
 <tbody>
  <tr>
   <td style="text-align: left;">
    <a href="/docs/advanced-editing/handling-ui-actions/scroll">
     スクロール
    </a>
   </td>
   <td style="text-align: left;">
    テストでページの特定の場所または要素にスクロールさせたい場合に、ステップを追加します。
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    <a href="/docs/advanced-editing/handling-ui-actions/auto-scroll">
     自動スクロール
    </a>
   </td>
   <td style="text-align: left;">
    要素が最初にビューポートの外側にある場合、テストが自動的にページ要素にスクロールするかどうかを制御します。
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    <a href="/docs/advanced-editing/handling-ui-actions/drag-drop-step">
     ドラッグ&amp;ドロップステップ
    </a>
   </td>
   <td style="text-align: left;">
    ユーザーが画像をアップロードセクションにドラッグしたり、Visual Editor のワークスペースに要素を追加したりするなど、「ドラッグ&amp;ドロップ」アクションを記録するステップを追加します。
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    <a href="/docs/advanced-editing/handling-ui-actions/hover-step">
     ホバーステップ
    </a>
   </td>
   <td style="text-align: left;">
    ユーザーがメニュー、ツールチップ、またはボタンにカーソルを合わせるなど、ホバーアクションを記録するステップを追加します。
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    <a href="/docs/advanced-editing/handling-ui-actions/navigation">
     ナビゲーションステップ
    </a>
   </td>
   <td style="text-align: left;">
    テストで別のページに移動させたい場合にステップを追加します。
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    <a href="/docs/advanced-editing/handling-ui-actions/refresh-page">
     ページの更新
    </a>
   </td>
   <td style="text-align: left;">
    テストでページを更新させたい場合にステップを追加します。
   </td>
  </tr>
 </tbody>
</table>
