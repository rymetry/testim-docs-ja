---
title: 'モバイルアプリ'
description: 'アップロードされたすべてのアプリのリストを含むモバイルアプリライブラリを管理します'
category: 'テスト管理'
order: 18
updated: '2025-11-11'
keywords:
  - testim
  - mobile-apps
  - test-management
  - モバイルアプリ
  - アプリライブラリ
  - APK
  - IPA
---

モバイルアプリライブラリには、アップロードされたすべてのアプリのリストが含まれています。モバイルアプリライブラリの各アプリには、次の情報が表示されます:

![](/images/test-management/mobile-apps/beee998-mobile-apps-library.png "mobile-apps-library.png")

* **App**: アプリケーションの名前
* **Identifier**: アップロード時にアプリファイルのメタデータから取得された一意のアプリ ID（パッケージ識別子/バンドル識別子）
* **Version**: アップロード時にアプリファイルのメタデータから取得されたアプリのバージョン
* **Uploaded**: アプリファイルがモバイルアプリライブラリに追加された日付
* **Size**: モバイルアプリのファイルサイズ

> 📘 注意:
>
> モバイルアプリライブラリのアプリは、異なるテストブランチ間で利用できます。

## ローカルコンピューターからモバイルアプリを追加する

次のフレームワークに基づくネイティブアプリをアップロードできます:

* Android デバイス - Java または Kotlin フレームワークベースの .apk ファイル
* iOS デバイス - Objective C または Swift フレームワークベースの .ipa ファイル

> 📘
>
> アップロードは 150 MB に制限されています（より大きなファイルをアップロードするには、Tricentis サポートにお問い合わせください）。

:fa-arrow-right: **ローカルコンピューターからアプリライブラリにモバイルアプリを追加するには:**

1. メインメニューから **Mobile Apps Tab** に移動します。

![](/images/test-management/mobile-apps/9c9184e-mobileappstab.png "mobileappstab.png")

2. **New App** ボタンをクリックします。

![](/images/test-management/mobile-apps/3531196-newapp.png "newapp.png")

3. **APK/IPA ファイル**を選択するか、ローカルコンピューターからアップロードウィンドウにファイルをドラッグアンドドロップします。一度にアップロードできるファイルは1つだけです。

![](/images/test-management/mobile-apps/ab59dec-addnewapp.png "addnewapp.png")

4. アプリが **Mobile Apps Library** に追加されます。

![](/images/test-management/mobile-apps/4b1abee-appadded.png "appadded.png")

> 📘 注意:
>
> デフォルトのアップロードサイズ制限は 150MB です。より大きなファイルをアップロードする必要がある場合は、Testim 管理者に連絡して、ファイルアップロードサイズ制限の引き上げについて相談してください。

## モバイルアプリライブラリからアプリをダウンロードする

モバイルアプリライブラリのアプリをローカルコンピューターにダウンロードできます。

:fa-arrow-right: **モバイルアプリライブラリからアプリをダウンロードするには:**

1. **Mobile Apps Library** に移動します。
2. モバイルアプリのリストからアプリを選択し、**Download File** ボタンをクリックします。

![](/images/test-management/mobile-apps/28abf33-download.png "download.png")

## モバイルアプリライブラリからアプリを削除する

モバイルアプリライブラリでアプリが不要になった場合は、削除できます。

:fa-arrow-right: **モバイルアプリライブラリからアプリを削除するには**:

1. **Mobile Apps Library** に移動します。
2. モバイルアプリのリストからアプリを選択し、**Delete** ボタンをクリックします。

![](/images/test-management/mobile-apps/ae5134d-delete.png "delete.png")

モバイルアプリがテストで使用されている場合、削除できません。アプリを削除する前に、すべてのテストからアプリケーションを削除するか、アプリケーションを使用するすべてのテストを削除する必要があります。

![](/images/test-management/mobile-apps/c14310b-cannotdelete.png "cannotdelete.png")

## モバイルアプリ ID をコピーする

モバイルアプリライブラリに含まれているモバイルアプリをグリッドでテストを実行するために使用したい場合で、このグリッドにアプリがまだインストールされていない場合は、CLI を通じてグリッドに提供するために **Mobile App ID** をコピーする必要があります。詳細については、[Running mobile tests through the CLI](https://help.testim.io/docs/running-tests-overview#running-mobile-tests-through-the-cli) を参照してください。

:fa-arrow-right: **モバイルアプリ ID をコピーするには**:

1. **Mobile Apps Library** に移動します。
2. モバイルアプリのリストからアプリを選択し、**Copy ID** ボタンをクリックします。

![](/images/test-management/mobile-apps/434c659-copyid.png "copyid.png")

その後、必要な場所にモバイルアプリ ID を貼り付けることができます。

![](/images/test-management/mobile-apps/e67232c-useid.png "useid.png")

## モバイルアプリライブラリを検索する

モバイルアプリライブラリで名前でモバイルアプリを検索できます。

:fa-arrow-right: **モバイルアプリライブラリでアプリを検索するには**:

1. **Mobile Apps Library** に移動します。
2. 検索ボックスに検索したいモバイルアプリの **Name**（名前）を入力します。モバイルアプリは、検索条件に一致するアプリのリストを自動的にフィルタリングします。

![](/images/test-management/mobile-apps/0a994e5-search.png "search.png")

## グリッドプロバイダーへのモバイルアプリの直接アップロード

Testim モバイルアプリライブラリにアップロードされたモバイルアプリは、グリッドプロバイダーのアプリストレージに手動でアップロードできます。これにより、テストを実行するときに Testim がアプリケーションをグリッドにロードするのを待つことなく、グリッドでアプリケーションを実行できます。

:fa-arrow-right: **モバイルアプリをグリッドプロバイダーに直接アップロードするには**:

1. **Mobile Apps Library** から1つ以上のアプリケーションをクリックします。

2. **Upload to Grid** ボタンをクリックします。

![](/images/test-management/mobile-apps/7a0a501-uploadtogridbutton.png)

3. 事前設定されたグリッドのリストから**グリッドを選択**し、**Upload** ボタンをクリックします。

![](/images/test-management/mobile-apps/5f8536c-selectgrid.png)

4. Testim は選択したグリッドにアプリをアップロードします。

![](/images/test-management/mobile-apps/78329a1-uploadtogridbutton.png)
