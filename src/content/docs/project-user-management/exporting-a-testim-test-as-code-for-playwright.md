---
title: TestimテストをPlaywrightコードとしてエクスポート
description: >-
  TestimテストをPlaywright用のコードに変換してエクスポートする方法について説明します。URLサフィックスを追加してコードビューアーで表示します。
category: 管理
order: 14008
updated: '2025-09-18'
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

TestimテストをPlaywright用に適応されたコードとしてエクスポートできます。エクスポートプロセスでは、エディタでテストを開いている時にURLにサフィックスを追加します。

:::note
技術的な違いにより、コードコメントで指示されているように、コードには追加の手動調整が必要になる場合があります。一部のステップはサポートされていない場合があります。
:::

**TestimテストをPlaywright用コードとしてエクスポートするには:**

1. エディタでテストを開きます。
2. ブラウザで、URLの末尾に以下のサフィックスを追加して **Enter** を押します。

   ```text
   ?embedMode=true&exportPuppeteer=true&exportSelenium=true&exportPlaywright=true
   ```

   テストのコードがコードビューアーに表示されます。**Playwright** タブが選択されていることを確認してください。

   ![Playwrightコードビューアーに表示されたエクスポート結果](/images/project-user-management/exporting-a-testim-test-as-code-for-playwright/5d19af1-playwright1.png)

3. **Copy code** をクリックして、表示されたコードをコピーします。
