---
title: 'ペルソナの作成'
description: 'ペルソナ（ユーザータイプ）を作成し、Salesforceユーザーの認証情報を関連付ける方法を説明します。'
category: 'Salesforceテスト'
order: 6
updated: '2025-12-02'
sourceUrl: 'https://help.testim.io/docs/create-a-persona-and-add-users'
keywords:
   - ペルソナ
   - Salesforceユーザー
   - 認証情報
   - Sign in with Salesforce
   - ユーザー名とパスワード
   - MFA
   - Personas
   - 設定
   - 環境切り替え
   - Testim for Salesforce
---
Testim for Salesforceのペルソナは、管理者、営業、顧客などのユーザータイプです。ペルソナは、テストを実行する際にSalesforce環境にアクセスするために使用されます。ペルソナを作成した後、接続されたSalesforce環境の既存のSalesforceユーザーの認証情報と関連付けます。これにより、テストを書き直すことなく、さまざまな環境（Dev、QA、本番など）間を切り替えることができます。

このプロセスは、Salesforce環境をTestim for Salesforceに接続していることを前提としています。詳細については、[Salesforce環境の接続](/docs/create-and-manage-test-environments)を参照してください。

> 📘
>
> デフォルトでは、Salesforce環境を接続した後、システムはこの環境に管理者ペルソナを作成し、環境へのログインに使用された認証情報を使用します。

# ペルソナの作成とSalesforceユーザーとの関連付け

ペルソナを作成した後、次のいずれかの方法でSalesforceユーザーを関連付けることができます:

* **Sign in with Salesforce** - Salesforceサインイン画面のポップアップが表示されます。
* **Log in with username and password** - Testim for Salesforceでログイン認証情報を設定します。

:fa-arrow-right: **Testim for Salesforceペルソナを作成するには:**

1. Testim for Salesforceで、**Settings** > **Salesforce** > **Personas**に移動し、**Add Persona**ボタンをクリックします。

   ![スクリーンショット](/images/salesforce-testing/create-a-persona-and-add-users/29532af-addpersona4.png)
2. ペルソナ名を入力し、**Add**をクリックします。\
   ![スクリーンショット](/images/salesforce-testing/create-a-persona-and-add-users/1019250-addpersona2.png)\
   ペルソナがリストに追加されます。\
   ![スクリーンショット](/images/salesforce-testing/create-a-persona-and-add-users/cbf8b38-persona5.png)
3. ペルソナのリストから、関連するペルソナの隣にある**+**ボタンをクリックします。\
   ![スクリーンショット](/images/salesforce-testing/create-a-persona-and-add-users/7e2cd64-persona6.png)
4. 次のいずれかを選択します:
   1. **Sign in with Salesforce** - この方法では、Salesforceにサインインし、Testim for Salesforceは認証後にSalesforceからトークンを受け取ります。Salesforceサインイン画面のポップアップが表示されます。関連するSalesforceアカウントにログインしてペルソナと関連付け、**Allow**をクリックしてアクセスを許可します。\
      ![スクリーンショット](/images/salesforce-testing/create-a-persona-and-add-users/37d29b1-login.png)
   2. **Log in with username and password** - 以下の手順に従って、Testim for Salesforceでログイン認証情報を設定します。\
      ![スクリーンショット](/images/salesforce-testing/create-a-persona-and-add-users/7277fad-addcredentials.png)
5. **Salesforce user**フィールドで、ドロップダウンメニューから関連するユーザーを選択します。
6. **Salesforce Password**フィールドに、関連するパスワードを入力します。
7. ログインにMFAが必要な場合は、MFA認証キーを入力します。MFAキーの見つけ方については、[Salesforce用MFAの設定](/docs/setting-mfa-for-salesforce)を参照してください。
8. **Save**をクリックします。\
   認証情報は、ペルソナ名の行と関連する環境列の下のテーブルに表示されます。テストを実行する際、設定されたすべてのペルソナを含むテストの関連環境を選択できます。
