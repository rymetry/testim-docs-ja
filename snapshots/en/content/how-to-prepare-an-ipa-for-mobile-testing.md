# How to Prepare an IPA for Mobile Testing

If you want to record a test using a virtual device, make sure that that the app was compiled for virtual devices (.app). And vice versa, if you want to record using a physical device, make sure that the app was compiled to work on physical devices (.ipa).

## Build .ipa files for Virtual Devices using XCode

:fa-arrow-right: **To prepare an IPA file for a virtual device:**

1. In Xcode click **Product > Clear Build Folder** in the menu to ensure the build folder is empty before preparing your app.

![](https://files.readme.io/2c46d36-clearbuildfolder.png "clearbuildfolder.png")

2. In Xcode select an **iOS simulator**.

![](https://files.readme.io/2b1d1e6-iossimulator.png "iossimulator.png")

3. In Xcode, click **Product > Build** in the menu

![](https://files.readme.io/f5925c0-build.png "build.png")

4. In Xcode, navigate to **Product > Show Build Folder in Finder**to open the file folder where the build was created.

![](https://files.readme.io/def30a2-showbuildfolder.png "showbuildfolder.png")

5. In Testim, navigate to the **Mobile Apps Library** and click the **New App** button.

![](https://files.readme.io/905bb85-newappbutton.png "newappbutton.png")

6. Browse for your **internal-testing-app.app** file on your computer, or drag and drop the file onto the file upload dialog box.

![](https://files.readme.io/ed9fb9d-browseapp.png "browseapp.png")

7. The new app is added to the **Mobile Apps Library**.

![](https://files.readme.io/e5bcdda-appcreated.png "appcreated.png")

8. Right click your new app and select **Rename Application**.

![](https://files.readme.io/59e0a36-rightclick.png "rightclick.png")

9. Append the app name with the term **"virtual"** to indicate this app build is meant for use on virtual devices. Click the **OK** button.

![](https://files.readme.io/714c2d1-rename.png "rename.png")

## Build .ipa Files for Physical Devices using Xcode

:fa-arrow-right: **To prepare an .ipa file for use on a physical device:**

1. In Xcode, select **Any iOS Device (arm64)**.

![](https://files.readme.io/541a31f-arm.png "arm.png")

2. Click **Product > Build For > Running** in the menu.

![](https://files.readme.io/b3c5146-running.png "running.png")

3. Once the build is complete, click **Product > Archive** in the menu.

![](https://files.readme.io/7e52090-archive.png "archive.png")

4. Navigate to the Xcode archive folder. Select your new app build and click the **Distribute App** button.

![](https://files.readme.io/08d8c31-distribute.png "distribute.png")

5. Select **Ad Hoc** and click the **Next** button.

![](https://files.readme.io/1d67af7-adhoc.png "adhoc.png")

6. On the **Ad Hoc distribution options** page, click the **Next** button without making any changes.

![](https://files.readme.io/948e114-adhocoptions.png "adhocoptions.png")

7. On the **Re-sign** page, select **Automatically manage signing** and click the **Next** button.

![](https://files.readme.io/a9a8835-resign.png "resign.png")

8. Review the app content and click the **Export** button and save the IPA file to your computer.

![](https://files.readme.io/19e1f3b-export.png "export.png")

9. In Testim, navigate to the Mobile Apps Library and click the New App button.

![](https://files.readme.io/3e97a62-newappbutton.png "newappbutton.png")

10. Browse for your IPA file on your computer, or drag and drop the file onto the file upload dialog box.

![](https://files.readme.io/db086fd-browseapp.png "browseapp.png")

11. The new app is added to the Mobile Apps Library.

![](https://files.readme.io/935ab92-appcreated.png "appcreated.png")

12. Right click your new app and select Rename Application.

![](https://files.readme.io/80c04ea-rightclick.png "rightclick.png")

13. Append the app name with the term "physical" to indicate this app build is meant for use on virtual devices. Click the OK button.

![](https://files.readme.io/e6d95f4-physical.png "physical.png")