---
title: GitHub 統合
description: Testim で GitHub ブランチを管理し、 Git Issues でバグを報告する方法について説明します。ブランチの自動作成とマージ機能を提供します。
category: 統合
order: 12020
updated: '2025-02-10'
sourceUrl: 'https://help.testim.io/docs/github-integration'
keywords:
  - Testim
  - GitHub
  - GitHub統合
  - バージョン管理
  - ブランチ管理
  - Git Issues
  - バグ報告
---

Testim で GitHub ブランチを管理し、 Git Issues でバグを公開します

GitHub で作成されたブランチは、 Testim で自動的に作成されます（同じ名前）。\
GitHub でブランチをマージすると、 Testim のテストも自動的にマージされます。\
Testim ブランチの詳細については、[こちら](/docs/version-control-branches)をご覧ください。

GitHub 統合により、ブラウザから直接 Git Issues でバグを報告することもできます。関連するすべてのバグ情報が自動的に入力されます。\
バグのキャプチャの詳細については、[こちら](/docs/bug-reporting)をご覧ください。

### GitHub 統合の設定

このプロセスは 1 回のみ必要です。

1. "**Settings**"に移動し、次に"**Integration**"タブに移動します。
2. GitHub リンクの"**login**"をクリックします。
3. "**Install**"ボタンをクリックします。
4. "**All repositories**"を選択するか、特定のリポジトリを選択します。
5. 再度"**Install**"をクリックします。

![GitHub アプリのインストール画面でリポジトリを選択する様子](/images/other-integrations/github-integration/307ac62-gitHub2.gif)

接続するリポジトリを定義し、必要なアクションを許可します。

**Create**: GitHub でブランチが作成されるたびに、 Testim でもブランチが作成されます。

**Merge**: GitHub ブランチがマージされるたびに、 Testim はテストを自動的にマージします。

### 注記

1. Testim でブランチが作成される場合、ベースは常に Master であり、 GitHub で作成元となったブランチではありません。これはブランチのマージ時に影響する可能性があります。
2. マージはプルリクエストアクションでのみ実行され、 Testim の Master にマージされます。
3. リポジトリを選択するには、ユーザーがそれらへの管理者アクセス権を持っている必要があります。
