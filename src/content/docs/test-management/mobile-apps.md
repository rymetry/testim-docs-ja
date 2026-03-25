---
title: Mobile Apps
description: Mobile Apps Library にアップロードしたアプリの追加、ダウンロード、削除、ID コピー、検索、Upload to Grid の手順を説明します。
category: モバイルアプリ
order: 10001
updated: '2025-09-22'
sourceUrl: 'https://docs.tricentis.com/testim/content/mobile-apps/mobile-apps.htm'
keywords:
  - モバイルアプリ
  - アプリライブラリ
  - APK アップロード
  - IPA アップロード
  - モバイルアプリ管理
  - Mobile App ID
---

Mobile Apps Library には、アップロードされたすべてのアプリのリストが含まれています。Mobile Apps Library の各アプリには、次の情報が表示されます:

![モバイルアプリライブラリの一覧画面](/images/test-management/mobile-apps/beee998-mobile-apps-library.png)

- **App**: アプリケーションの名前
- **Identifier**: アップロード時にアプリファイルのメタデータから取得された一意のアプリ ID（パッケージ識別子/バンドル識別子）
- **Version**: アップロード時にアプリファイルのメタデータから取得されたアプリのバージョン
- **Uploaded**: アプリファイルが Mobile Apps Library に追加された日付
- **Size**: モバイルアプリのファイルサイズ

:::note
Mobile Apps Library のアプリは、異なるテストブランチ間で利用できます。
:::

## ローカルコンピューターからモバイルアプリを追加する

次のフレームワークに基づくネイティブアプリをアップロードできます:

- Android デバイス - Java または Kotlin フレームワークベースの .apk ファイル
- iOS デバイス - Objective C または Swift フレームワークベースの .ipa ファイル

:::note
アップロードは 150 MB に制限されています（より大きなファイルをアップロードするには、Tricentis サポートにお問い合わせください）。
:::

**ローカルコンピューターから Mobile Apps Library にモバイルアプリを追加するには:**

1. メインメニューから **Mobile Apps Tab** に移動します。

![Mobile Apps タブが選択されたメインメニュー](/images/test-management/mobile-apps/9c9184e-mobileappstab.png)

2. **New App** ボタンをクリックします。

![New App ボタンが表示されたモバイルアプリライブラリ](/images/test-management/mobile-apps/3531196-newapp.png)

3. **APK/IPA ファイル**を選択するか、ローカルコンピューターからアップロードウィンドウにファイルをドラッグアンドドロップします。一度にアップロードできるファイルは 1 つだけです。

![APK/IPA ファイルを選択する新規モバイルアプリ追加ダイアログ](/images/test-management/mobile-apps/ab59dec-addnewapp.png)

4. アプリが **Mobile Apps Library** に追加されます。

![アップロード後にモバイルアプリライブラリへ追加されたアプリ](/images/test-management/mobile-apps/4b1abee-appadded.png)

:::note
デフォルトのアップロードサイズ制限は 150MB です。より大きなファイルをアップロードする必要がある場合は、Testim 管理者に連絡して、ファイルアップロードサイズ制限の引き上げについて相談してください。
:::

## Mobile Apps Library からアプリをダウンロードする

Mobile Apps Library のアプリをローカルコンピューターにダウンロードできます。

**Mobile Apps Library からアプリをダウンロードするには:**

1. **Mobile Apps Library** に移動します。
2. モバイルアプリのリストからアプリを選択し、**Download File** ボタンをクリックします。

![選択したモバイルアプリの Download File ボタン](/images/test-management/mobile-apps/28abf33-download.png)

## Mobile Apps Library からアプリを削除する

Mobile Apps Library でアプリが不要になった場合は、削除できます。

**Mobile Apps Library からアプリを削除するには**:

1. **Mobile Apps Library** に移動します。
2. モバイルアプリのリストからアプリを選択し、**Delete** ボタンをクリックします。

![選択したモバイルアプリの Delete ボタン](/images/test-management/mobile-apps/ae5134d-delete.png)

モバイルアプリがテストで使用されている場合、削除できません。アプリを削除する前に、すべてのテストからアプリケーションを削除するか、アプリケーションを使用するすべてのテストを削除する必要があります。

![テストで使用中のためモバイルアプリを削除できないことを示すメッセージ](/images/test-management/mobile-apps/c14310b-cannotdelete.png)

## Mobile App ID をコピーする

Mobile Apps Library に含まれているモバイルアプリをグリッドでテストを実行するために使用したい場合で、このグリッドにアプリがまだインストールされていない場合は、CLI を通じてグリッドに提供するために **Mobile App ID** をコピーする必要があります。詳細については、[Running mobile tests through the CLI](/docs/running-tests-overview#running-mobile-tests-through-the-cli) を参照してください。

**Mobile App ID をコピーするには**:

1. **Mobile Apps Library** に移動します。
2. モバイルアプリのリストからアプリを選択し、**Copy ID** ボタンをクリックします。

![モバイルアプリの Mobile App ID をコピーする Copy ID ボタン](/images/test-management/mobile-apps/434c659-copyid.png)

その後、必要な場所に Mobile App ID を貼り付けることができます。

![CLI 設定画面でコピーした Mobile App ID を使用する例](/images/test-management/mobile-apps/e67232c-useid.png)

## Mobile Apps Library を検索する

Mobile Apps Library で名前でモバイルアプリを検索できます。

**Mobile Apps Library でアプリを検索するには**:

1. **Mobile Apps Library** に移動します。
2. 検索ボックスに検索したいモバイルアプリの **Name**（名前）を入力します。モバイルアプリは、検索条件に一致するアプリのリストを自動的にフィルタリングします。

![名前でモバイルアプリを検索しているモバイルアプリライブラリ](/images/test-management/mobile-apps/0a994e5-search.png)

## グリッドプロバイダーへのモバイルアプリの直接アップロード

Testim Mobile Apps Library にアップロードされたモバイルアプリは、グリッドプロバイダーのアプリストレージに手動でアップロードできます。これにより、テストを実行するときに Testim がアプリケーションをグリッドにロードするのを待つことなく、グリッドでアプリケーションを実行できます。

**モバイルアプリをグリッドプロバイダーに直接アップロードするには**:

1. **Mobile Apps Library** から 1 つ以上のアプリケーションをクリックします。

2. **Upload to Grid** ボタンをクリックします。

![選択したアプリに対して Upload to Grid ボタンを押す画面](/images/test-management/mobile-apps/7a0a501-uploadtogridbutton.png)

3. 事前設定されたグリッドのリストから**グリッドを選択**し、**Upload** ボタンをクリックします。

![グリッドのリストからアップロード先を選択するダイアログ](/images/test-management/mobile-apps/5f8536c-selectgrid.png)

4. Testim は選択したグリッドにアプリをアップロードします。

![選択したグリッドへのモバイルアプリのアップロード完了画面](/images/test-management/mobile-apps/78329a1-uploadtogridbutton.png)
