---
title: Applitools統合
description: AI駆動のビジュアルテストを有効にするためのApplitools Eyes統合方法について説明します。APIキーの作成と設定手順を提供します。
category: 統合
order: 12017
updated: '2025-02-10'
sourceUrl: 'https://help.testim.io/docs/applitools-integration'
keywords:
  - Testim
  - Applitools
  - Applitools Eyes
  - ビジュアルテスト
  - AIテスト
  - ビジュアル検証
  - 統合設定
---

AI駆動のビジュアルテストを有効にするためにApplitoolsと統合する方法。

Testimのビジュアル検証およびwait-forステップを使用するには、まず[Applitools](https://applitools.com/)が提供するApplitools EyesアプリとTestimアカウントを統合する必要があります。

> 📘 これはProの機能です
>
> この機能は、プロフェッショナルプランのプロジェクトにのみ開かれています。プロフェッショナルプランの詳細については、[こちら](https://www.testim.io/pricing/)をクリックしてください。

## 前提条件

- これは、プロフェッショナルプランのプロジェクトにのみ開かれているPro機能です。プロフェッショナルプランの詳細については、[こちら](https://www.testim.io/pricing/)をクリックしてください。
- Applitools EyesとTestimの両方で管理者権限が必要です。

## Applitools統合のセットアップ

Applitools EyesアカウントとTestimアカウント間で情報を交換する必要があるため、両方のコンソールを並行して開いておくことをお勧めします。

### ステップ1: Applitools EyesでAPIキーを作成する

:fa-arrow-right: **Applitools EyesでAPIキーを作成するには:**

1. 管理者アカウントを使用して**Applitools Eyes**コンソールにログインします。
2. Applitools Eyesホームページで、右上の**メインメニュー**をクリックします。

![Applitools Eyesのメインメニューを開く画面](/images/applitools-integration/applitools-integration/b92e716-Testim_243a.png)

メニューオプションが表示されます。

![Applitools Eyesのメインメニューに表示されるAdminメニュー](/images/applitools-integration/applitools-integration/528d244-Testim_244_r.png)

3. **Admin**をクリックします。\
   **Admin panel**が開きます。

![Applitools EyesのAdminパネル画面](/images/applitools-integration/applitools-integration/ef5d9c2-Testim_245.png)

4. **API keys**をクリックします。\
   **API keys**画面が開きます。

![Applitools EyesのAPI keys画面](/images/applitools-integration/applitools-integration/bd902b4-Testim_246.png)

5. **Add a new API key**ボタンをクリックします。

![Applitools EyesでAdd a new API keyボタンをクリックする画面](/images/applitools-integration/applitools-integration/4539ae9-Testim_246a.png)

**Add API key**オプションが表示されます。

![Applitools EyesでAPIキーのTeamやPermissionsなどを設定する画面](/images/applitools-integration/applitools-integration/c62aa9e-Testim_247_r.png)

6. オプションを以下のように入力します:
   - **Team**フィールドで、ドロップダウンリストからチームを選択します。
   - **User**フィールドで、適切なユーザーを選択します。
   - **Permissions**セクションで、**Execute**と**Merge**のスイッチを右に切り替えます。
   - **Expiry**フィールドで、オプションでAPIの有効期限を入力します。
   - **Purpose**フィールドで、オプションでこのAPIの目的を入力します。
7. **Add**ボタンをクリックします。\
   キーが作成され、**API keys**画面に表示されます。

![作成されたAPIキーがAPI keys一覧に表示された画面](/images/applitools-integration/applitools-integration/fbfd882-Testim_248.png)

8. 以下で使用するためにこのキーをコピーします。

### ステップ2: TestimでApplitools設定を構成する

1. 管理者アカウントを使用して**Testim**にログインします。
2. **Testim**で、左側のメニューの**Settings**アイコンをクリックします。

![Testimの左メニューでSettingsアイコンを選択する画面](/images/applitools-integration/applitools-integration/1ee8f1c-Testim_258a.png)

**Settings**ページが開きます。

3. **Integration**タブをクリックします。

![TestimのSettings画面でIntegrationタブを開く画面](/images/applitools-integration/applitools-integration/d8b3082-Testim_259a_r.png)

**Integrations**タブが開きます。

![TestimのIntegrations一覧でApplitools統合セクションが表示されている画面](/images/applitools-integration/applitools-integration/564e0cb-Testim_260.png)

4. Applitoolsセクションで、**login**をクリックします。

![TestimのApplitools統合セクションでloginボタンをクリックする画面](/images/applitools-integration/applitools-integration/6706450-Testim_261a_r.png)

**Applitools統合設定オプション**が表示されます。

![Applitools統合設定ダイアログでCloud URLやRun Keyなどを入力する画面](/images/applitools-integration/applitools-integration/968fe5b-Testim_262_r.png)

5. **Cloud URL**フィールドに、ApplitoolsアプリケーションのベースURL(例: [https://eyes.applitools.com/](https://eyes.applitools.com/))を入力します。
6. **Run Key**と**Merge Key**フィールドに、Applitoolsで以前に作成したキーを入力します。
7. **App Name**フィールドに、オプションでアプリの名前を入力します。\
   デフォルトのアプリ名はProject IDです。
8. **Connect**をクリックします。\
   成功アイコンが表示され、ApplitoolsがTestimと統合されます。ビジュアル検証およびwait-forステップの使用を開始できます。[Visual Validation](/docs/pixel-validation-and-pixel-wait-for)を参照してください。

![Applitools統合が成功しビジュアル検証ステップが有効になったことを示す画面](/images/applitools-integration/applitools-integration/446380f-Testim_265_r.png)

> 📘
>
> ビジュアル検証ステップを有効にするには、Testimからログアウトして再度ログインする必要がある場合があります。
