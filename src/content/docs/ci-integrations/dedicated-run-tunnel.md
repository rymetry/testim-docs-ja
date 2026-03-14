---
title: 専用実行トンネル
description: 内部サーバーまたはlocalhostからTestimテストを実行するためのトンネル機能について説明します。設定方法と追加のユースケースを提供します。
category: 統合
order: 12016
updated: '2025-02-10'
sourceUrl: 'https://help.testim.io/docs/dedicated-run-tunnel'
keywords:
  - Dedicated Run Tunnel
  - トンネル
  - プロキシ
  - localhost
  - プライベートサーバー
  - 内部ネットワーク
  - 内部環境
  - ファイアウォール
  - Testim CLI
---

トンネルを使用すると、内部サーバー/localhostからアプリを実行し、外部ブラウザ(プロキシ)で表示できます。

場合によっては、Testimまたは外部プロバイダー(SauceLabsなど)が提供するリモートSelenium Gridサーバーを使用して、独自のプライベートまたは内部サーバーでテストを実行したい場合があります。

> 📘 これはProの機能です
>
> この機能は、プロフェッショナルプランのプロジェクトにのみ開かれています。プロフェッショナルプランの詳細については、[こちら](https://www.testim.io/pricing/)をクリックしてください。

## 前提条件

1. トンネル機能が有効になっている。
2. [Testim CLI](/docs/the-command-line-cli)

## 使用方法

1. アプリケーションサーバーを起動します。
2. CLIコマンドを実行するマシンが内部サーバー/localhostにアクセスできることを確認します。
3. パラメータ(`--tunnel` - デフォルトのアプリケーションポート80)を指定して[Testim CLI](/docs/the-command-line-cli)を実行します
4. ポート80以外のポートでアプリケーションを実行する場合は、パラメータ(`--tunnel-port \<APP PORT e.g. 80>`)を追加します

Testim CLIは、専用トンネルアドレスを指すようにアプリケーションのベースURLを自動的に調整することに注意してください。

## 追加のユースケース

テスト実行中、すべてのトラフィックはトンネルを開始するマシンを経由してルーティングされ、ホワイトリスト登録が実用的でない状況に対するソリューションを提供します。上記のように、テスト環境にアクセスできるマシンからCLIコマンドを開始することが重要です。さらに、このアプローチは、グリッドの地理的位置を管理し、コマンドをトリガーするマシンの場所に合わせるための回避策として機能します。

### トンネルを使用したTestim CLIの例

```shell
testim --tunnel --tunnel-port <APP PORT default 80> --label "<YOUR LABEL>" --token "<YOUR ACCESS TOKEN>" --project "<YOUR PROJECT ID>" --grid "<Your grid name>" --report-file test-results/testim-tests-report.xml
```

> 📘 必要に応じてHTTPSアドレスにトンネルを使用できます。これを設定するにはサポートにお問い合わせください。**HTTPSトンネルは、Testim提供のグリッドで実行する場合にのみ使用できます。**
> 📘 グリッド名については、[こちら](/docs/grid-management)でグリッドの設定方法をご確認ください。
> 📘 トンネルはスケジュールされた実行ではサポートされていません。
