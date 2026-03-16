---
title: Salesforce 自動ログインステップ
description: >-
  Salesforce
  環境（本番・サンドボックス）にユーザー名とパスワードで自動ログインし、毎回ログイン手順を記録せずにテストを開始できる専用ステップについて説明します。
category: 高度な編集
order: 5058
updated: '2025-09-22'
sourceUrl: 'https://help.testim.io/docs/salesforce-auto-login-step'
keywords:
  - Salesforce 自動ログイン
  - Salesforce ログイン
  - MFA
  - 多要素認証
  - テストデータ
  - 接続情報
  - 特殊ステップ
  - Testim
  - 自動ログインステップ
  - 認証エラー対策
---

Salesforce 環境（本番/サンドボックス）にログイン・ログアウトの記録無しで認証できるステップです。ログインステップを追加し、接続先の情報を入力するだけで、すぐにテストの記録を開始できます。

:::note
Salesforce 側で二要素認証（2FA/MFA）が有効な場合、テストを実行するマシンのIPを許可リストに追加するよう組織のSalesforce管理者へ依頼してください。
:::

:::note{title="共有ステップのコピー"}
ログインステップが共有ステップの場合、「SF environment」の値を編集すると、使用中のすべてのインスタンスに反映されます。共有でないステップを同一テスト内でコピーした場合は、そのコピーに対する編集は他のコピーへ影響しません。
:::

### MFA 認証

2022年2月1日以降、Salesforce はログイン時の多要素認証（MFA）を必須化しました。Testim では、Salesforce 自動ログイン実行時にMFAを行うソフトウェア型オーセンティケータを実装しています。有効化手順は [Setting up MFA](/docs/salesforce-auto-login-step#setting-up-mfa) を参照してください。

## Salesforce 自動ログインステップを追加する

**追加手順:**

1. 追加したい位置の **（矢印）** にカーソルを合わせます。

![Salesforce 自動ログインステップのスクリーンショット](/images/special-steps/salesforce-auto-login-step/3e1c90c-Testim_512a.png)

アクションオプションが表示されます。

![Salesforce 自動ログインステップのスクリーンショット](/images/special-steps/salesforce-auto-login-step/9b114f6-Testim_566.png)

2. “**M**”（Testim predefined steps）をクリックします。\
   **Predefined steps** メニューが開きます。

![Salesforce 自動ログインステップのスクリーンショット](/images/special-steps/salesforce-auto-login-step/c70c927-Testim_544_r.png)

3. **Salesforce** をクリックします。\
   **Salesforce** メニューが展開されます。

![Salesforce 自動ログインステップのスクリーンショット](/images/special-steps/salesforce-auto-login-step/cedf632-Testim_545_r.png)

4. メニューをスクロールし、**Salesforce auto-login** を選択します。

:::note
メニュー上部の検索ボックスで **Salesforce auto-login** と入力して検索することもできます。
:::

**Add Step** ウィンドウが表示されます。

![Salesforce 自動ログインステップのスクリーンショット](/images/special-steps/salesforce-auto-login-step/9bcc036-2d49d61-Testim_567_r.png)

5. **Name** にわかりやすいステップ名を入力します。
6. 他テストでも再利用したい場合は **Shared step** をオンのまま、保存先フォルダを選択します（詳細は[グループ](/docs/groups)）。
7. **Create Step** をクリックします。
8. 追加されたステップにカーソルを合わせ、**Show Properties**アイコンをクリックします。ステップが **Editor** に追加され、右側に **Properties** パネルが表示されます。

![Salesforce 自動ログインステップのスクリーンショット](/images/special-steps/salesforce-auto-login-step/2c50d67-newproperties.png)

9. **Login URL** に環境のログインURLを入力します。
10. **Username** と **Password** に認証情報を入力します。
11. MFA を使う場合は [Setting up MFA](/docs/salesforce-auto-login-step#setting-up-mfa) に従います。\
    これで設定は完了です。

### パラメータの使用

テスト／スイート／設定ファイル／他ステップで定義したパラメータを用いて接続情報を渡せます。

:::note
MFA のシークレットキーはパラメータとして扱えません。
:::

**接続情報にパラメータを使う:**

1. 次のいずれかの方法でパラメータを定義します。
   * **テストデータにパラメータを追加** – テストの最初のステップである **Setup** ステップに **Test Data** を追加してパラメータを定義します。詳細な手順は [Configuring a data driven test from the visual editor](/docs/data-driven-testing#section-configuring-a-data-driven-test-from-the-visual-editor) を参照してください。
   * **設定ファイルにパラメータを追加** – [Configuration file](/docs/configuration-file-run-hooks) にパラメータを追加します。詳細は [Configuring Data Driven Tests using the Config file](/docs/data-driven-testing#section-configuring-data-driven-tests-using-the-config-file) を参照してください。
   * **カスタムステップにパラメータを追加** – カスタムステップを作成してパラメータを追加します。詳細は [Parameters in custom JavaScript steps](/docs/parameters-in-custom-javascript-steps) を参照してください。\
     その後、エクスポート機能を使ってパラメータを *Salesforce auto-login* ステップ、またはテストレベルに渡します。詳細は [Exports Parameters](/docs/exports-parameters) を参照してください。
2. *Salesforce auto-login* ステップの **URL**、**Username**、**Password** フィールドに、定義したパラメータを設定します。

## MFA のセットアップ

Salesforce 側でシークレットキーを取得し、Testim のプロパティパネルにある Secret Key に登録します。\
**手順:**

1. Salesforce にログインし、**Setup > Users > Users** に移動して MFA を設定したいユーザーを選択します。

![Salesforce 自動ログインステップのスクリーンショット](/images/special-steps/salesforce-auto-login-step/bc293ae-image.png)

2. 既に **App Registration: One-Time Password Authenticator** に Google Authenticator や Microsoft Authenticator などのサードパーティ認証アプリが登録されている場合、シークレットキーを取得するために一度切断してから再接続する必要があります。  
   * **User Details** の **App Registration - One-Time Password Authenticator** 設定で **Disconnect** をクリックします。
   * まだサードパーティ認証アプリを登録していない場合は、この手順はスキップして次へ進みます。

![Salesforce 自動ログインステップのスクリーンショット](/images/special-steps/salesforce-auto-login-step/e1f92f2-image_1.png)

3. 同じく **User Details** の **App Registration - One-Time Password Authenticator** 設定で **Connect** をクリックします。

![Salesforce 自動ログインステップのスクリーンショット](/images/special-steps/salesforce-auto-login-step/167397d-image_2.png)

4. ユーザー名とパスワードで Salesforce にログインし、MFA の選択画面が表示されたら **Choose another verification method** を選択します。

![Salesforce 自動ログインステップのスクリーンショット](/images/special-steps/salesforce-auto-login-step/3eff270-pasted_image_0.png)

5. **Choose a verification method** 画面で **Use verification codes from an authenticator app** を選択し、**Continue** をクリックします。

![Salesforce 自動ログインステップのスクリーンショット](/images/special-steps/salesforce-auto-login-step/522b354-pasted_image_0_1.png)

6. **Connect an authenticator app** 画面で **I cant scan the QR code** をクリックします。

![Salesforce 自動ログインステップのスクリーンショット](/images/special-steps/salesforce-auto-login-step/71f0334-pasted_image_0_2.png)

7. シークレットキーが表示されるので、これをコピーします。

![Salesforce 自動ログインステップのスクリーンショット](/images/special-steps/salesforce-auto-login-step/7022745-pasted_image_0_4.png)

8. Salesforce Auto-Login ステップの追加時（[Salesforce 自動ログインステップを追加する](/docs/salesforce-auto-login-step#salesforce-自動ログインステップを追加する) を参照）、ステップの **Properties Panel** 内にある **Login with MFA** セクションで **ADD KEY** ボタンをクリックします。

![Salesforce 自動ログインステップのスクリーンショット](/images/special-steps/salesforce-auto-login-step/79bffd0-image_3.png)

9. Salesforce からコピーしたシークレットキーを **Your Key** フィールドに貼り付け、**Add** をクリックします。

![Salesforce 自動ログインステップのスクリーンショット](/images/special-steps/salesforce-auto-login-step/33e9456-image_4.png)

検証コードが表示されます。

![Salesforce 自動ログインステップのスクリーンショット](/images/special-steps/salesforce-auto-login-step/76d0fe8-image_5.png)

10. Salesforce に戻り、表示された検証コードを **Verification Code** フィールドに入力して **Connect** をクリックします。  

![Salesforce 自動ログインステップのスクリーンショット](/images/special-steps/salesforce-auto-login-step/d783a5c-verification_code.png)
