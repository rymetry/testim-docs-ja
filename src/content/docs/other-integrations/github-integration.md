---
title: 'GitHub統合'
description: 'TestimでGitHubブランチを管理し、Git Issuesでバグを報告する方法について説明します。ブランチの自動作成とマージ機能を提供します。'
category: 'その他の統合'
order: 1
updated: '2025-02-10'
keywords:
  - testim
  - github
  - バージョン管理
  - ブランチ管理
  - git-issues
---

TestimでGitHubブランチを管理し、Git Issuesでバグを公開します

GitHubで作成されたブランチは、Testimで自動的に作成されます(同じ名前)。\
GitHubでブランチをマージすると、Testimのテストも自動的にマージされます。\
Testimブランチの詳細については、[こちら](/docs/testops-version-control/version-control-branches)をご覧ください。

GitHub統合により、ブラウザから直接Git Issuesでバグを報告することもできます。関連するすべてのバグ情報が自動的に入力されます。\
バグのキャプチャの詳細については、[こちら](/docs/test-management/bug-reporting)をご覧ください。

### GitHub統合の設定

このプロセスは1回のみ必要です。

1. "**Settings**"に移動し、次に"**Integration**"タブに移動します。
2. GitHubリンクの"**login**"をクリックします。
3. "**Install**"ボタンをクリックします。
4. "**All repositories**"を選択するか、特定のリポジトリを選択します。
5. 再度"**Install**"をクリックします。

![1511](/images/other-integrations/github-integration/307ac62-gitHub2.gif "gitHub2.gif")

接続するリポジトリを定義し、必要なアクションを許可します。

**Create**: GitHubでブランチが作成されるたびに、Testimでもブランチが作成されます。

**Merge**: GitHubブランチがマージされるたびに、Testimはテストを自動的にマージします。

### 注記

1. Testimでブランチが作成される場合、ベースは常にMasterであり、GitHubで作成元となったブランチではありません。これはブランチのマージ時に影響する可能性があります。
2. マージはプルリクエストアクションでのみ実行され、TestimのMasterにマージされます。
3. リポジトリを選択するには、ユーザーがそれらへの管理者アクセス権を持っている必要があります。
