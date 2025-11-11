# 翻訳タスク (cli-prerequisites)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

Testim is a SaaS offering, so all software updates are cloud-based. However, to use Testim's CLI capabilities you will need the following components:

- Testim CLI: The Testim CLI allows you to run commands locally or remotely.
- Node.js: Node.js is the underlying platform for running the CLI.

 Here are the system requirements for these components:

<Table align={["left","left","left"]}>
  <thead>
    <tr>
      <th>
        Component
      </th>

      <th>
        Requirement
      </th>

      <th>
        Comment
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        Testim CLI
      </td>

      <td>
        Latest version
      </td>

      <td>
        Backward compatibility - previous two versions 
      </td>
    </tr>

    <tr>
      <td>
        Node.JS
      </td>

      <td>
        TLS/Supported version
      </td>

      <td>
        Backward compatibility - previous two versions  

        For TLS/Supported versions see [link](https://github.com/nodejs/Release/blob/main/README.md)
      </td>
    </tr>
  </tbody>
</Table>
