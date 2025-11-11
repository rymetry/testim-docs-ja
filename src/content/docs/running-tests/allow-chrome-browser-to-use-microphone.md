---
title: 'Chrome ブラウザでマイクを使用する'
description: 'テスト実行セクション「Chrome ブラウザでマイクを使用する」に関するドキュメント。'
category: 'テスト実行'
order: 3
updated: '2025-11-11'
keywords:
  - testim
  - allow-chrome-browser-to-use-microphone
  - running-tests
---
テストの一部として、ブラウザにモックマイクを有効にすることが可能です。これを有効にするには、CLI コマンドの一部として追加のフラグを渡す必要があります。[CLI コマンド](https://help.testim.io/docs/the-command-line-cli)について詳しくは、こちらをお読みください。

マイクを有効にするには、*--chrome-extra-args* を値 *"use-fake-device-for-media-stream"* と共に使用してください。\
例：

```shell
testim --token "TOKEN" --project "PROJECT" --grid "Testim-Grid" --chrome-extra-args "use-fake-device-for-media-stream"
```

> 🚧 注意
>
> テストの一部としてマイクを有効にすることは、モックシナリオになります
