---
title: Applitools 統合
description: AI 駆動のビジュアルテストを有効にするための Applitools Eyes 統合方法について説明します。API キーの作成と設定手順を提供します。
category: 統合
order: 12017
updated: '2025-02-10'
sourceUrl: 'https://help.testim.io/docs/applitools-integration'
keywords:
  - Testim
  - Applitools
  - Applitools Eyes
  - ビジュアルテスト
  - AI テスト
  - ビジュアル検証
  - 統合設定
---

AI 駆動のビジュアルテストを有効にするために Applitools と統合する方法。

Testim のビジュアル検証および wait-for ステップを使用するには、まず[Applitools](https://applitools.com/)が提供する Applitools Eyes アプリと Testim アカウントを統合する必要があります。

:::info{title="PRO機能"}
この機能は、Professional plan のプロジェクトでのみ利用できます。
:::

## 前提条件

- Professional plan のプロジェクトでのみ利用できる機能です。
- Applitools Eyes と Testim の両方で管理者権限が必要です。

## Applitools 統合のセットアップ

Applitools Eyes アカウントと Testim アカウント間で情報を交換する必要があるため、両方のコンソールを並行して開いておくことをお勧めします。

### ステップ 1: Applitools Eyes で API キーを作成する

**Applitools Eyes で API キーを作成するには:**

1. 管理者アカウントを使用して**Applitools Eyes**コンソールにログインします。
2. Applitools Eyes ホームページで、右上の**メインメニュー**をクリックします。

![Applitools Eyes のメインメニューを開く画面](/images/applitools-integration/applitools-integration/b92e716-Testim_243a.png)

メニューオプションが表示されます。

![Applitools Eyes のメインメニューに表示される Admin メニュー](/images/applitools-integration/applitools-integration/528d244-Testim_244_r.png)

3. **Admin**をクリックします。\
   **Admin panel**が開きます。

![Applitools Eyes の Admin パネル画面](/images/applitools-integration/applitools-integration/ef5d9c2-Testim_245.png)

4. **API keys**をクリックします。\
   **API keys**画面が開きます。

![Applitools Eyes の API keys 画面](/images/applitools-integration/applitools-integration/bd902b4-Testim_246.png)

5. **Add a new API key**ボタンをクリックします。

![Applitools Eyes で Add a new API key ボタンをクリックする画面](/images/applitools-integration/applitools-integration/4539ae9-Testim_246a.png)

**Add API key**オプションが表示されます。

![Applitools Eyes で API キーの Team や Permissions などを設定する画面](/images/applitools-integration/applitools-integration/c62aa9e-Testim_247_r.png)

6. オプションを以下のように入力します:
   - **Team**フィールドで、ドロップダウンリストからチームを選択します。
   - **User**フィールドで、適切なユーザーを選択します。
   - **Permissions**セクションで、**Execute**と**Merge**のスイッチを右に切り替えます。
   - **Expiry**フィールドで、オプションで API の有効期限を入力します。
   - **Purpose**フィールドで、オプションでこの API の目的を入力します。
7. **Add**ボタンをクリックします。\
   キーが作成され、**API keys**画面に表示されます。

![作成された API キーが API keys 一覧に表示された画面](/images/applitools-integration/applitools-integration/fbfd882-Testim_248.png)

8. 以下で使用するためにこのキーをコピーします。

### ステップ 2: Testim で Applitools 設定を構成する

1. 管理者アカウントを使用して**Testim**にログインします。
2. **Testim**で、左側のメニューの**Settings**アイコンをクリックします。

![Testim の左メニューで Settings アイコンを選択する画面](/images/applitools-integration/applitools-integration/1ee8f1c-Testim_258a.png)

**Settings**ページが開きます。

3. **Integration**タブをクリックします。

![Testim の Settings 画面で Integration タブを開く画面](/images/applitools-integration/applitools-integration/d8b3082-Testim_259a_r.png)

**Integrations**タブが開きます。

![Testim の Integrations 一覧で Applitools 統合セクションが表示されている画面](/images/applitools-integration/applitools-integration/564e0cb-Testim_260.png)

4. Applitools セクションで、**login**をクリックします。

![Testim の Applitools 統合セクションで login ボタンをクリックする画面](/images/applitools-integration/applitools-integration/6706450-Testim_261a_r.png)

**Applitools 統合設定オプション**が表示されます。

![Applitools 統合設定ダイアログで Cloud URL や Run Key などを入力する画面](/images/applitools-integration/applitools-integration/968fe5b-Testim_262_r.png)

5. **Cloud URL**フィールドに、Applitools アプリケーションのベース URL（例: [https://eyes.applitools.com/](https://eyes.applitools.com/)）を入力します。
6. **Run Key**と**Merge Key**フィールドに、Applitools で以前に作成したキーを入力します。
7. **App Name**フィールドに、オプションでアプリの名前を入力します。\
   デフォルトのアプリ名は Project ID です。
8. **Connect**をクリックします。\
   成功アイコンが表示され、Applitools が Testim と統合されます。ビジュアル検証および wait-for ステップの使用を開始できます。[Visual Validation](/docs/pixel-validation-and-pixel-wait-for)を参照してください。

![Applitools 統合が成功しビジュアル検証ステップが有効になったことを示す画面](/images/applitools-integration/applitools-integration/446380f-Testim_265_r.png)

:::info
ビジュアル検証ステップを有効にするには、Testim からログアウトして再度ログインが必要な場合があります。
:::
