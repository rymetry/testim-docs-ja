---
title: 'Salesforceテストの開始'
description: 'Salesforce環境の接続から、テストの作成・保存・実行までを一連で体験できるチュートリアルです。'
category: 'Salesforceテスト'
order: 2
updated: '2025-12-02'
sourceUrl: 'https://help.testim.io/docs/salesforce-testing-getting-started'
keywords:
   - Salesforceテスト
   - チュートリアル
   - Salesforce環境接続
   - ペルソナ
   - ログイン
   - アプリ起動
   - レコード作成
   - 検証
   - ログアウト
   - Testim for Salesforce
---
## Testim for Salesforceへようこそ

このチュートリアルでは、Testim for Salesforceでテストを作成する方法を学びます。チュートリアルの一環として、Salesforce環境の接続、新しいテストの作成と記録、そして最後に実行する方法を学びます。このチュートリアルでは、プロセスのすべてのオプションを網羅するのではなく、最初から最後までのプロセスを説明する特定のシナリオを扱います。

> 📘
>
> この画面には、ブラウザのツールバーにあるTestimアイコンをクリックするか、[https://app.testim.io/](https://app.testim.io/)にアクセスすることで、いつでもアクセスできます。

それでは、最初のテストを作成しましょう！

### チュートリアルのユースケース
Testim for Salesforceのテストは、Salesforceアプリケーションとのやり取りを記録し、これらのやり取りを自動的にステップに変換するレコーダーを使用するか、テストにステップを手動で追加することで作成されます。また、これら2つの方法を組み合わせることもできます。手動ステップには「Salesforceステップ」を含めることができます。これらのステップはSalesforce専用に設計されており、テスト作成プロセスを簡素化し、より深い統合とスマートな機能を可能にする方法でSalesforceオブジェクトを利用します。ただし、デプロイメントに広範なカスタマイズが含まれている場合、Salesforceステップが完全に機能しない可能性があります。このような場合は、通常の動作モードでレコーダーを使用することをお勧めします。レコーダーの使用方法については、[Salesforceテストの作成](/docs/create-a-salesforce-test)を参照してください。このチュートリアルでは、手動ステップに焦点を当てています。

このチュートリアルでは、Salesforceへのログイン、Salesアプリの起動、特定の名前のアカウントの作成、そして指定された名前のアカウントが存在することを検証するテストを扱います。

### 前提条件

はじめにチュートリアルを実行するには、Salesesモジュールへのアクセスとアカウントを作成する権限を持つSalesforce認証情報が必要です。

## ステップ1 - Salesforce環境への接続

Testim for Salesforceテストを作成する前に、Salesforce環境をTestim for Salesforceに接続する必要があります。Salesforce環境がすでに接続されている場合は、次のステップにスキップできます。

:fa-arrow-right: **Salesforce環境を接続するには**:

1. Testim for Salesforceアカウントで、**Settings > Salesforce > Environments**に移動し、**Connect a salesforce environment**を選択します。\
   ![スクリーンショット](/images/salesforce-testing/salesforce-testing-getting-started/681f2b6-connect.png)
2. **Select Type**フィールドで、Salesforce環境のタイプを選択します:
   * **Production** - 本番環境は、エンドユーザーが使用するライブ環境です。
   * **Sandbox** - サンドボックス環境は、より小規模な開発またはテスト環境です。
3. **Environment Name**フィールドに、環境の名前を入力します
4. 次のいずれかを実行します:
   1. 既存のブランチを使用する場合は、**Select Existing Branch**の下で、ドロップダウンメニューから目的のブランチを選択します。
   2. 新しいブランチを作成する場合は、**Create New Branch**フィールドにブランチの名前を入力します。
5. **Connect**をクリックします。\
   Salesforceログイン画面が表示されます。\
   ![スクリーンショット](/images/salesforce-testing/salesforce-testing-getting-started/43f1fac-salesforcelogin.png)
6. Salesforceアカウントにログインします。
7. **Allow**を選択して、Testim for SalesforceがID URLサービスにアクセスし、API経由でユーザーデータを管理し、いつでもリクエストを実行できるようにします。

## テストの作成

:fa-arrow-right: **新しいテストを作成するには:**

1. **New Test**をクリックします。

   ![スクリーンショット](/images/salesforce-testing/salesforce-testing-getting-started/d3dd794-newtest.png)

   エディターで新しいテストが開きます。ここでテストステップを追加します。
2. 最初のステップはセットアップステップで、基本的なテスト構成を設定します。**Setup**ステップで、**Show properties**ボタンをクリックします。

   ![スクリーンショット](/images/salesforce-testing/salesforce-testing-getting-started/9dc1f8d-showproperties.png)

   **Properties**ペインが表示されます。

   ![スクリーンショット](/images/salesforce-testing/salesforce-testing-getting-started/03e8e96-propeties_pane.png)
3. **Base URL**にSalesforce環境のURLが含まれていることを確認します。
4. 最初のステップの後、マウスを**+**ボタンの上に移動し、**+**（ステップを追加）ボタンをクリックします。
5. **Salesforce steps**タブの下で、**Log in**ステップをクリックします。このステップは、選択されたペルソナ/ユーザーを使用してSalesforce環境にログインします。

   ![スクリーンショット](/images/salesforce-testing/salesforce-testing-getting-started/398d8d3-login.png)

   Log inステップが追加され、**Object**ペインが表示されます。

   ![スクリーンショット](/images/salesforce-testing/salesforce-testing-getting-started/1fbf0ad-loginand_object.png)
6. **Select login persona**の下で、ドロップダウンメニューをクリックし、テスト全体で使用する関連ペルソナを選択します。環境を接続すると、システムはデフォルトの管理者ペルソナを作成します。ただし、追加のペルソナが作成されている場合もあります。追加のペルソナを作成する場合は、[ペルソナの作成とユーザーの追加](/docs/create-a-persona-and-add-users)の手順に従ってください。
7. **+**ボタンをクリックして、別のステップを追加します。
8. **Salesforce steps**タブの下で、**Launch app**ステップをクリックします。このステップは、環境内で選択されたアプリを起動します。
9. ステップの**Object**ペインで、**Select App**の下で、**Sales**オプションを選択します。

   ![スクリーンショット](/images/salesforce-testing/salesforce-testing-getting-started/0dbd17f-salesapp.png)
10. **+**ボタンをクリックして、別のステップを追加します。
11. **Salesforce steps**タブの下で、**Record Operations**をクリックし、次に**Create**ステップをクリックします。このステップは、**Object**と**Record**を作成します。
12. ステップの**Object**ペインで、**Select the Object**の下で、**Account**を選択します。
13. **Select Record Type**フィールドが表示される場合（環境の構成に依存）、利用可能なオプションのいずれかを選択します。\
    **Customer Account**フォームがペインに表示されます。

    ![スクリーンショット](/images/salesforce-testing/salesforce-testing-getting-started/d6e7105-createv2.png)
14. 必須フィールドはアスタリスク（\*）でマークされています。この場合、`Account Name`フィールドが必須です。デプロイメントは、他のフィールドを必須として構成されている場合があります。各必須フィールドについて、**Action**の下で**Input**を選択し、**Value**フィールドをクリックして値を選択するか文字列を入力します。
15. **+**ボタンをクリックして、別のステップを追加します。
16. **Salesforce steps**タブの下で、**Record Operations**をクリックし、次に**Validate**ステップをクリックします。このステップは、指定された値でレコードが作成されたことを検証します。この場合、Account Name値を検証します。
17. **Account Name**フィールドの**Action**列の下で、**Verify**オプションを選択します。
18. **Value**列の下で、テストに合格させたい場合は**Create**ステップで使用したものと同じ文字列を入力し、テストに失敗させたい場合は別の値を入力します。
19. **+**ボタンをクリックして、別のステップを追加します。
20. **Log out**ステップをクリックします。このステップは、Salesforceアプリケーションからログアウトします。
21. **Save**をクリックします。

    **Save Test**ウィンドウが表示されます。

![スクリーンショット](/images/salesforce-testing/salesforce-testing-getting-started/9c85234-Image_007.png)

> 🚧
>
> 新しいテストを作成したり既存のテストを変更したりする場合は、必ずテストを保存してください。最初にテストを保存せずにブラウザを閉じると、作業内容が失われます。

22. **Name**フィールドに「Create account」と入力し、**OK**をクリックします。\
    テストが保存されます。\
    おめでとうございます、最初のテストを作成しました！

## テストの実行

:fa-arrow-right: **ローカルでテストを実行するには:**

1. エディター画面で、**Run**ボタンをクリックします。

   ![スクリーンショット](/images/salesforce-testing/salesforce-testing-getting-started/334dca8-runbutton.png)

新しいブラウザが開き、Salesforce環境でテストステップが実行されます。テストが完了すると、ポップアップウィンドウにテストが成功したかどうかが表示されます。

![スクリーンショット](/images/salesforce-testing/salesforce-testing-getting-started/9f21ed2-Image_017.png)

2. **Go back to the Editor**リンクをクリックして、エディターに戻り結果を表示します。

## テスト結果の表示

テストエディター画面で、テスト結果を表示できます。全体的なテスト結果は画面の上部に表示されます。さらに、各ステップの上部にある色付きのアイコンは、そのステップが成功したかどうかを示します。

![スクリーンショット](/images/salesforce-testing/salesforce-testing-getting-started/f932812-Run_without_errors.png)

特定のステップのスクリーンショットやコンソールログの結果を表示したい場合は、ステップの「View Screenshot」ボタンをクリックします。

![スクリーンショット](/images/salesforce-testing/salesforce-testing-getting-started/f583aef-viewscreenshot.png)

このステップのサイドバイサイドスクリーンショット比較が表示されます。左側には比較のベースラインが表示され、右側には実行中に撮影された実際のスクリーンショットが表示されます。

![スクリーンショット](/images/salesforce-testing/salesforce-testing-getting-started/940cc27-screenshot.png)

テストが失敗した場合、失敗の原因に関する詳細情報が表示されます。（次の例では、検証は「No name」を期待するように設定されており、受信した値は「Acme」でした）。**See error**リンクをクリックすると、失敗の詳細を確認できます。

![スクリーンショット](/images/salesforce-testing/salesforce-testing-getting-started/424d937-failedtest.png)
