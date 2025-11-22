---
title: 'Chrome ブラウザでマイクを使用する'
description: 'Chrome でテストを実行する際に、モックマイクを有効にして音声入力をシミュレートするための CLI フラグ設定方法を説明します。'
category: 'テスト実行'
order: 3
updated: '2025-09-22'
sourceUrl: 'https://help.testim.io/docs/allow-chrome-browser-to-use-microphone'
keywords:
  - Chrome
  - マイク
  - モックマイク
  - 音声入力
  - CLI
  - 実行フラグ
  - テスト実行
  - ブラウザ設定
  - Testim
---
テストの一部として、ブラウザにモックマイクを有効にすることが可能です。これを有効にするには、CLI コマンドの一部として追加のフラグを渡す必要があります。[CLI コマンド](/docs/the-command-line-cli)について詳しくは、こちらをお読みください。

マイクを有効にするには、*--chrome-extra-args* を値 *"use-fake-device-for-media-stream"* と共に使用してください。\
例：

```shell
testim --token "TOKEN" --project "PROJECT" --grid "Testim-Grid" --chrome-extra-args "use-fake-device-for-media-stream"
```

> 🚧 注意
>
> テストの一部としてマイクを有効にすることは、モックシナリオになります
