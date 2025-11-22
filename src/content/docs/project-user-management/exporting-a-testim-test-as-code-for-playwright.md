---
title: 'TestimテストをPlaywrightコードとしてエクスポート'
description: 'TestimテストをPlaywright用のコードに変換してエクスポートする方法について説明します。URLサフィックスを追加してコードビューアーで表示します。'
category: 'project-user-management'
order: 7
updated: '2025-11-11'
keywords:
  - testim
  - playwright
  - エクスポート
  - コード変換
---

TestimテストをPlaywright用に適応されたコードとしてエクスポートできます。エクスポートプロセスでは、エディタでテストを開いている時にURLにサフィックスを追加します。

> 📘
>
> 技術的な違いにより、コードコメントで指示されているように、コードには追加の手動調整が必要になる場合があります。一部のステップはサポートされていない場合があります。

:fa-arrow-right:**TestimテストをPlaywright用コードとしてエクスポートするには:**

1. エディタでテストを開きます。
2. ブラウザで、URLの末尾に以下のサフィックスを追加して **Enter** を押します。

   ```
   ?embedMode=true&exportPuppeteer=true&exportSelenium=true&exportPlaywright=true
   ```

テストのコードがコードビューアーに表示されます。**Playwright** タブが選択されていることを確認してください。

![](/images/project-user-management/exporting-a-testim-test-as-code-for-playwright/5d19af1-playwright1.png)

3. **Copy code** をクリックして、表示されたコードをコピーします。
