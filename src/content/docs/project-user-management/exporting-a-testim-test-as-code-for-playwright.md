---
title: Testim テストを Playwright コードとしてエクスポート
description: >-
  Testim テストを Playwright 用のコードに変換してエクスポートする方法について説明します。URL サフィックスを追加してコードビューアーで表示します。
category: 管理者機能
order: 14008
updated: '2025-09-19'
sourceUrl: 'https://help.testim.io/docs/exporting-a-testim-test-as-code-for-playwright'
keywords:
  - Playwright
  - コードエクスポート
  - embedMode
  - Puppeteer
  - Selenium
  - コードビューア
  - テストコード
  - エクスポートサフィックス
---

Testim テストを Playwright 用に適応されたコードとしてエクスポートできます。エクスポートプロセスでは、エディターでテストを開いている時に URL にサフィックスを追加します。

:::note
技術的な違いにより、コードコメントで指示されているように、コードには追加の手動調整が必要になる場合があります。一部のステップはサポートされていない場合があります。
:::

**Testim テストを Playwright 用コードとしてエクスポートするには:**

1. エディターでテストを開きます。
2. ブラウザで、URL の末尾に以下のサフィックスを追加して **Enter** を押します。

   ```text
   ?embedMode=true&exportPuppeteer=true&exportSelenium=true&exportPlaywright=true
   ```

   テストのコードがコードビューアーに表示されます。**Playwright** タブが選択されていることを確認してください。

   ![Playwright コードビューアーに表示されたエクスポート結果](/images/project-user-management/exporting-a-testim-test-as-code-for-playwright/5d19af1-playwright1.png)

3. **Copy code** をクリックして、表示されたコードをコピーします。
