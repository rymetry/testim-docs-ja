---
title: 'CLI前提条件'
description: 'Testim CLIを使用するために必要なシステム要件とコンポーネントについて説明します。Node.jsとTestim CLIの互換性情報を提供します。'
category: '設定'
order: 13002
updated: '2025-09-18'
sourceUrl: 'https://help.testim.io/docs/cli-prerequisites'
keywords:
  - CLI前提
  - Node.js
  - TLSサポート
  - システム要件
  - バージョンサポート
  - 環境設定
---

Testimはクラウドベースのアップデートを行うSaaS製品ですが、TestimのCLI機能を使用するには以下のコンポーネントが必要です:

- Testim CLI: Testim CLIを使用すると、ローカルまたはリモートでコマンドを実行できます。
- Node.js: Node.jsはCLIを実行するための基盤プラットフォームです。

以下がこれらのコンポーネントのシステム要件です:

<table class="md-table md-table-3cols">
 <thead>
  <tr>
   <th>
    コンポーネント
   </th>
   <th>
    要件
   </th>
   <th>
    備考
   </th>
  </tr>
 </thead>
 <tbody>
  <tr>
   <td>
    Testim CLI
   </td>
   <td>
    最新バージョン
   </td>
   <td>
    後方互換性 - 前2バージョンまでサポート
   </td>
  </tr>
  <tr>
   <td>
    Node.JS
   </td>
   <td>
    TLS/サポート対象バージョン
   </td>
   <td>
    後方互換性 - 前2バージョンまでサポート
    <br/>
    <br/>
    TLS/サポート対象バージョンについては
    <a href="https://github.com/nodejs/Release/blob/main/README.md">
     こちら
    </a>
    を参照してください
   </td>
  </tr>
 </tbody>
</table>
