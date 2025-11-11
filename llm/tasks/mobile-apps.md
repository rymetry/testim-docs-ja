# 翻訳タスク (mobile-apps)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

The Mobile Apps Library contains a list of all apps that have been uploaded. The following information is displayed for each app in the Mobile Apps Library:

![](/images/test-management/mobile-apps/beee998-mobile-apps-library.png "mobile-apps-library.png")

- **App**: Name of the application
- **Identifier**: unique app ID retrieved from the metadata of the app file during upload (package identifier/bundle identifier)
- **Version**: app version retrieved from the metadata of the app file during upload
- **Uploaded**: date the app file was added to the Mobile Apps Library
- **Size**: file size of the mobile app

> 📘 Note:
>
> Apps in the Mobile Apps Library are available across different test branches.

## Add Mobile App from Local Computer

It is possible to upload native apps based on the following frameworks:

- For Android devices - .apk files based on Java or Kotlin frameworks.
- For iOS devices - .ipa files based Objective C or Swift frameworks.

> 📘
>
> Upload is limited to 150 MB (to upload larger files, contact Tricentis support).

:fa-arrow-right: **To add a mobile app to the app library from your local computer:**

1. Navigate to **Mobile Apps Tab** from the main menu.

![](/images/test-management/mobile-apps/9c9184e-mobileappstab.png "mobileappstab.png")

2. Click **New App** button.

![](/images/test-management/mobile-apps/3531196-newapp.png "newapp.png")

3. Select an **APK/IPA file** or drag and drop the file from your local computer onto the upload window. Only one file can be uploaded each time.

![](/images/test-management/mobile-apps/ab59dec-addnewapp.png "addnewapp.png")

4. The app is added to the **Mobile Apps Library**.

![](/images/test-management/mobile-apps/4b1abee-appadded.png "appadded.png")

> 📘 Note:
>
> The default upload size limit is 150MB. If you need to upload larger files, please contact your Testim Administrator to discuss increasing your file upload size limit.

## Download an App from the Mobile Apps Library

You can download an app in the Mobile Apps Library to your local computer.

:fa-arrow-right: **To download an app from the Mobile Apps Library:**

1. Navigate to the **Mobile Apps Library**.
2. Select an app from the list of mobile apps and click the **Download File** button.

![](/images/test-management/mobile-apps/28abf33-download.png "download.png")

## Delete an App from the Mobile Apps Library

If an app is non longer needed in the Mobile Apps Library, it can be deleted.

:fa-arrow-right: **To delete an app from the Mobile Apps Library**:

1. Navigate to the **Mobile Apps Library**.
2. Select an app from the list of mobile apps and click the **Delete** button.

![](/images/test-management/mobile-apps/ae5134d-delete.png "delete.png")

If a mobile app is used in a test, it cannot be deleted. You must remove the application from all tests or delete all tests that use the application before the app can be deleted.

![](/images/test-management/mobile-apps/c14310b-cannotdelete.png "cannotdelete.png")

## Copy Mobile App ID

If you want to use a mobile app that is included in the Mobile App library to run tests on the grid and the app is not yet installed on this grid, you will need to copy the **Mobile App ID** in order to provide it to the grid through the CLI. For more information, see [Running mobile tests through the CLI](https://help.testim.io/docs/running-tests-overview#running-mobile-tests-through-the-cli)

:fa-arrow-right: **To copy the mobile app ID**:

1. Navigate to the **Mobile Apps Library**.
2. Select an app from the list of mobile apps and click the **Copy ID** button.

![](/images/test-management/mobile-apps/434c659-copyid.png "copyid.png")

You can then paste the mobile app ID wherever the reference is needed.

![](/images/test-management/mobile-apps/e67232c-useid.png "useid.png")

## Search the Mobile Apps Library

You can search for a mobile app by name in the Mobile Apps Library.

:fa-arrow-right: **To search for an app in the Mobile Apps Library**:

1. Navigate to the **Mobile Apps Library**.
2. Enter the **Name** of the mobile app you want to search for in the search box. The mobile apps will automatically filter the list of apps that match your search criteria.

![](/images/test-management/mobile-apps/0a994e5-search.png "search.png")

## Direct Upload of Mobile App to Grid Provider

Any mobile apps that have been uploaded to the Testim Mobile Apps Library can be manually uploaded to the Grid provider app storage. This allows you to run your application on the grid without having to wait until Testim loads the application to the Grid when running the test.

:fa-arrow-right: **To upload a mobile app directly to a grid provider**:

1. Click on one or more applications from the **Mobile Apps Library**.

2. Click the **Upload to Grid** button.

![](/images/test-management/mobile-apps/7a0a501-uploadtogridbutton.png)

3. **Select a grid** from the list of pre-configured grids and click the **Upload** button.

![](/images/test-management/mobile-apps/5f8536c-selectgrid.png)

4. Testim will upload your app to the selected grid.

![](/images/test-management/mobile-apps/78329a1-uploadtogridbutton.png)
