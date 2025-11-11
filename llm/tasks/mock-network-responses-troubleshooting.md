# 翻訳タスク (mock-network-responses-troubleshooting)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

<Table align={["left","left","left"]}>
  <thead>
    <tr>
      <th style={{ textAlign: "left" }}>
        Issue
      </th>

      <th style={{ textAlign: "left" }}>
        Possible Cause
      </th>

      <th style={{ textAlign: "left" }}>
        Solution
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td style={{ textAlign: "left" }}>
        Mocked requests return as ‘undefined’
      </td>

      <td style={{ textAlign: "left" }}>
        Some development and testing extensions rely on the same mechanism to intercept network requests as Testim. Having them enabled will interfere with HAR recording, and in general, can cause unexpected results. For example, the Tampermonkey extension is known to cause this issue.
      </td>

      <td style={{ textAlign: "left" }}>
        1. Make sure you disabled  3rd party extensions that might interfere with your network. 

        2. Work in incognito mode (as long those other extensions don’t also run in incognito) while recording HAR data.
      </td>
    </tr>

    <tr>
      <td style={{ textAlign: "left" }}>
        When running a test mocked with HAR data, the page itself shows the contents of one of the subsequent AJAX requests made on the page, and that request isn’t being mocked at all
      </td>

      <td style={{ textAlign: "left" }}>
        This happens because Testim doesn’t record the initial request made by the browser in order to load the page (the request fetching the page’s HTML) but does listen and mock it when running the test.
      </td>

      <td style={{ textAlign: "left" }}>
        Using a passthrough entry matching the url of page (the base url) would be the correct choice.
      </td>
    </tr>
  </tbody>
</Table>
