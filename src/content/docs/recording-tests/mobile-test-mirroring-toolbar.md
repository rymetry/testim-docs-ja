---
title: 'モバイルテストミラーリングツールバー'
description: 'AUTミラーリングウィンドウのツールバー機能について説明します。'
category: 'テストの記録'
order: 3011
updated: '2025-09-13'
sourceUrl: 'https://help.testim.io/docs/mobile-test-mirroring-toolbar'
keywords:
  - ミラーリングツールバー
  - DOM Locate
  - Vision Locate
  - モバイルテスト記録
---

Mirroring Toolbar は AUT Mirroring Window の上部にあり、一般的なアクションへのショートカットと、DOM Locate モードと Vision Locate モードを切り替える機能を提供します。

![ツールバー](/images/recording-tests/mobile-test-mirroring-toolbar/c16b38e-toolbarwithcallouts.png)

ツールバーには以下のボタンが含まれています:

- **Record/Pause** - クリックして記録を一時停止し、もう一度クリックして記録を再開します。
- **Home** - Home Button ステップを作成し、デバイスに home コマンドを送信します。
- **Back (Android のみ)** - Back Button ステップを作成し、デバイスに back コマンドを送信します。
- **Type Keys** - キー入力操作を実行します。
- **DOM/Vision Locate** - DOM モードと Vision Locate モードを切り替えます。DOM モード(デフォルトモード)は、DOM を使用して画面上の要素を見つけます。Vision Locate モードは、ビジュアル分析アルゴリズムを使用して画面をスキャンして要素を見つけます。Vision Locate は、DOM を介して要素が見つからない場合や、WebView 画面の場合に使用されます。詳細については、[Vision Locate](/docs/vision-locate) を参照してください。
