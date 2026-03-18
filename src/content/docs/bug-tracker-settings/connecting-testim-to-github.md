---
title: TestimとGitHubの連携
description: Testim から GitHub Issues に bug を報告するための接続手順を説明します。
category: 統合
order: 12037
updated: '2025-09-18'
sourceUrl: 'https://help.testim.io/docs/connecting-testim-to-github'
keywords:
  - Testim
  - GitHub連携
  - GitHub Issues
  - バグトラッカー
  - バグ報告
  - issue作成
  - 接続設定
  - 不具合管理
---

## TestimとGitHubの連携

GitHub integration を使うと、Testim から直接 GitHub Issues に bug を報告できます。bug に関する情報は自動的に入力されます。

### TestimをGitHubに接続する

1. `Settings > Bug Tracker` に移動します。
2. **Github** ロゴをクリックします。
3. **Log in** をクリックします。

次の画面が表示されます。

![GitHub の Log in リンク](/images/bug-tracker-settings/connecting-testim-to-github/d04116b-github1.png)

次の notice が表示されます。

![GitHub の notice 画面](/images/bug-tracker-settings/connecting-testim-to-github/7aa9766-github2.PNG)

4. 画面上部の **Sign in** をクリックし、GitHub アカウントにログインします。
5. ログイン後、**Configure** をクリックします。

![GitHub の Configure 画面](/images/bug-tracker-settings/connecting-testim-to-github/b8b4322-github3.png)

6. 対象のアカウントをクリックし、Testim.io をどこにインストールするか指定します。

![インストール先アカウントの選択](/images/bug-tracker-settings/connecting-testim-to-github/85799b1-github4.PNG)

7. **Install** をクリックします。

![GitHub App の Install](/images/bug-tracker-settings/connecting-testim-to-github/66d3537-github5.PNG)

この時点で、Testim Visual Editor の `Settings > CLI` 画面が開きます。

8. `Settings > Bug Tracker` に戻り、**Github** をクリックします。
9. `"You are logged in"` メッセージが表示されることを確認します。

![GitHub 接続完了メッセージ](/images/bug-tracker-settings/connecting-testim-to-github/c4190f2-github6.PNG)
