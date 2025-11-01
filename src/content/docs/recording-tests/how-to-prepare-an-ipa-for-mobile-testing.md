---
title: "モバイルテスト用IPAの準備方法"
description: "Xcodeを使用して、仮想デバイスおよび物理デバイス用のiOSアプリケーション(.appおよび.ipa)をビルドする方法について説明します。"
category: "テスト作成"
order: 8
updated: "2025-11-02"
keywords: ["IPA", "iOS", "Xcode", "ビルド", "仮想デバイス", "物理デバイス", "モバイルアプリ"]
sourceUrl: "https://help.testim.io/docs/how-to-prepare-an-ipa-for-mobile-testing"
---

仮想デバイスを使用してテストを記録する場合は、アプリが仮想デバイス用にコンパイルされていること(.app)を確認してください。逆に、物理デバイスを使用して記録する場合は、アプリが物理デバイスで動作するようにコンパイルされていること(.ipa)を確認してください。

## Xcodeを使用して仮想デバイス用の.ipaファイルをビルドする

**仮想デバイス用のIPAファイルを準備するには:**

1. Xcodeで、メニューの**Product > Clear Build Folder**をクリックして、アプリを準備する前にビルドフォルダーが空であることを確認します。

![ビルドフォルダーのクリア](/images/recording-tests/how-to-prepare-an-ipa-for-mobile-testing/2c46d36-clearbuildfolder.png)

2. Xcodeで、iOSシミュレーターを選択します。

![iOSシミュレーターの選択](/images/recording-tests/how-to-prepare-an-ipa-for-mobile-testing/2b1d1e6-iossimulator.png)

3. Xcodeで、メニューの**Product > Build**をクリックします。

![ビルド](/images/recording-tests/how-to-prepare-an-ipa-for-mobile-testing/f5925c0-build.png)

4. Xcodeで、**Product > Show Build Folder in Finder**に移動して、ビルドが作成されたファイルフォルダーを開きます。

![ビルドフォルダーを表示](/images/recording-tests/how-to-prepare-an-ipa-for-mobile-testing/def30a2-showbuildfolder.png)

5. Testimで、モバイルアプリライブラリに移動し、**New App**ボタンをクリックします。

![新規アプリボタン](/images/recording-tests/how-to-prepare-an-ipa-for-mobile-testing/905bb85-newappbutton.png)

6. コンピューター上のinternal-testing-app.appファイルを参照するか、ファイルをファイルアップロードダイアログボックスにドラッグアンドドロップします。

![アプリの参照](/images/recording-tests/how-to-prepare-an-ipa-for-mobile-testing/ed9fb9d-browseapp.png)

7. 新しいアプリがモバイルアプリライブラリに追加されます。

![アプリが作成されました](/images/recording-tests/how-to-prepare-an-ipa-for-mobile-testing/e5bcdda-appcreated.png)

8. 新しいアプリを右クリックし、**Rename Application**を選択します。

![右クリック](/images/recording-tests/how-to-prepare-an-ipa-for-mobile-testing/59e0a36-rightclick.png)

9. アプリ名に「virtual」という用語を追加して、このアプリビルドが仮想デバイスでの使用を目的としていることを示します。**OK**ボタンをクリックします。

![名前の変更](/images/recording-tests/how-to-prepare-an-ipa-for-mobile-testing/714c2d1-rename.png)

## Xcodeを使用して物理デバイス用の.ipaファイルをビルドする

**物理デバイスで使用する.ipaファイルを準備するには:**

1. Xcodeで、**Any iOS Device (arm64)**を選択します。

![arm64の選択](/images/recording-tests/how-to-prepare-an-ipa-for-mobile-testing/541a31f-arm.png)

2. メニューの**Product > Build For > Running**をクリックします。

![実行用にビルド](/images/recording-tests/how-to-prepare-an-ipa-for-mobile-testing/b3c5146-running.png)

3. ビルドが完了したら、メニューの**Product > Archive**をクリックします。

![アーカイブ](/images/recording-tests/how-to-prepare-an-ipa-for-mobile-testing/7e52090-archive.png)

4. Xcodeアーカイブフォルダーに移動します。新しいアプリビルドを選択し、**Distribute App**ボタンをクリックします。

![配布](/images/recording-tests/how-to-prepare-an-ipa-for-mobile-testing/08d8c31-distribute.png)

5. **Ad Hoc**を選択し、**Next**ボタンをクリックします。

![Ad Hoc](/images/recording-tests/how-to-prepare-an-ipa-for-mobile-testing/1d67af7-adhoc.png)

6. Ad Hoc配布オプションページで、何も変更せずに**Next**ボタンをクリックします。

![Ad Hocオプション](/images/recording-tests/how-to-prepare-an-ipa-for-mobile-testing/948e114-adhocoptions.png)

7. 再署名ページで、**Automatically manage signing**を選択し、**Next**ボタンをクリックします。

![再署名](/images/recording-tests/how-to-prepare-an-ipa-for-mobile-testing/a9a8835-resign.png)

8. アプリのコンテンツを確認し、**Export**ボタンをクリックして、IPAファイルをコンピューターに保存します。

![エクスポート](/images/recording-tests/how-to-prepare-an-ipa-for-mobile-testing/19e1f3b-export.png)

9. Testimで、モバイルアプリライブラリに移動し、**New App**ボタンをクリックします。

![新規アプリボタン](/images/recording-tests/how-to-prepare-an-ipa-for-mobile-testing/3e97a62-newappbutton.png)

10. コンピューター上のIPAファイルを参照するか、ファイルをファイルアップロードダイアログボックスにドラッグアンドドロップします。

![アプリの参照](/images/recording-tests/how-to-prepare-an-ipa-for-mobile-testing/db086fd-browseapp.png)

11. 新しいアプリがモバイルアプリライブラリに追加されます。

![アプリが作成されました](/images/recording-tests/how-to-prepare-an-ipa-for-mobile-testing/935ab92-appcreated.png)

12. 新しいアプリを右クリックし、**Rename Application**を選択します。

![右クリック](/images/recording-tests/how-to-prepare-an-ipa-for-mobile-testing/80c04ea-rightclick.png)

13. アプリ名に「physical」という用語を追加して、このアプリビルドが仮想デバイスでの使用を目的としていることを示します。**OK**ボタンをクリックします。

![物理デバイス用に名前変更](/images/recording-tests/how-to-prepare-an-ipa-for-mobile-testing/e6d95f4-physical.png)

---

最終更新: 約1か月前

