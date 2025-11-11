---
title: 'トラブルシューティング - モックネットワークレスポンス'
description: 'ネットワークモック使用時のトラブルシューティングガイド。モックリクエストの問題やHARデータの記録時の問題解決方法を説明します。'
category: 'ネットワークモック'
order: 6
updated: '2025-11-11'
keywords:
  - testim
  - mock-network-responses-troubleshooting
  - mock-network-responses
  - トラブルシューティング
---
<Table align={["left","left","left"]}>
  <thead>
    <tr>
      <th style={{ textAlign: "left" }}>
        問題
      </th>

      <th style={{ textAlign: "left" }}>
        考えられる原因
      </th>

      <th style={{ textAlign: "left" }}>
        解決策
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td style={{ textAlign: "left" }}>
        モックされたリクエストが'undefined'として返される
      </td>

      <td style={{ textAlign: "left" }}>
        一部の開発・テスト拡張機能は、Testimと同じメカニズムに依存してネットワークリクエストをインターセプトします。これらを有効にすると、HAR記録に干渉し、一般的に予期しない結果を引き起こす可能性があります。たとえば、Tampermonkey拡張機能はこの問題を引き起こすことが知られています。
      </td>

      <td style={{ textAlign: "left" }}>
        1. ネットワークに干渉する可能性のあるサードパーティ拡張機能を無効にしていることを確認してください。

        2. HARデータを記録する際は、シークレットモードで作業してください(他の拡張機能もシークレットモードで実行されていない限り)。
      </td>
    </tr>

    <tr>
      <td style={{ textAlign: "left" }}>
        HARデータでモックされたテストを実行すると、ページ自体がページ上で行われた後続のAJAXリクエストの1つの内容を表示し、そのリクエストが全くモックされていない
      </td>

      <td style={{ textAlign: "left" }}>
        これは、Testimがページを読み込むためにブラウザが行った最初のリクエスト(ページのHTMLを取得するリクエスト)を記録しないが、テストを実行する際にはそれをリッスンしてモックするために発生します。
      </td>

      <td style={{ textAlign: "left" }}>
        ページのURL(ベースURL)と一致するパススルーエントリを使用することが正しい選択です。
      </td>
    </tr>
  </tbody>
</Table>
