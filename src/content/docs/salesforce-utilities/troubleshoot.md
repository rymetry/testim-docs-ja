---
title: トラブルシューティング
description: Testim for Salesforceで起こりやすい接続・実行失敗などの問題と対処方法をまとめます。
category: Salesforceテスト
order: 16033
updated: '2025-12-10'
sourceUrl: 'https://help.testim.io/docs/troubleshoot'
keywords:
  - トラブルシューティング
  - Salesforce接続
  - IPホワイトリスト
  - Grid
  - ログイン履歴
  - 権限
  - ページ読み込み
  - IAM
  - Okta
---

## Salesforce環境に接続できない

Salesforce環境に接続するには、Salesforce環境が以下の要件を満たしていることを確認してください:

* APIアクセスをサポート - これには、Enterprise、Performance、Unlimited、およびDeveloper Edition組織が必要です。Professional Edition組織は、アドオンとしてAPIアクセスを追加できます。Salesforce Essentials EditionはAPIアクセスをサポートしていません。
* **管理 > ユーザー > プロファイル**で、Salesforce環境に接続するために選択されたユーザーに対してREST APIが有効になっています。

  ![プロファイル設定でREST APIを有効化](/images/salesforce-utilities/troubleshoot/40062a4-profiles.png)

* Salesforce環境に接続するために選択されたユーザーの権限は:

  * APIアクセス制御が有効になっている場合、「任意のAPIクライアントを使用」権限。

  * APIアクセス制御が有効になっていない場合、「インストールされていない接続アプリを承認」権限。

* **設定 > セキュリティ > ネットワークアクセス**で以下のIPアドレスをホワイトリストに登録します。
  * 35.85.13.117
  * 44.228.217.52
  * 54.245.105.236
  * 54.214.4.125

  ![ネットワークアクセスでIPをホワイトリスト登録](/images/salesforce-utilities/troubleshoot/6f77e19-Picture1.png)

* ブロックされている追加のIPアドレスをホワイトリストに登録します。**設定 > ID > ログイン履歴**で、アプリケーション「Testim for Salesforce」に対してブロックされている「制限付きIP」アドレスをログイン履歴で確認してください。

  ![ログイン履歴で制限付きIPを確認](/images/salesforce-utilities/troubleshoot/32799d4-Picture2.png)

## Grid上のスケジュール済みテスト実行が失敗する

テストがローカルでは正常に実行されているのにGridでは失敗する場合は、以下を確認してください:

* Azure Active DirectoryやOktaなどのIdentity and Access Management（IAM）サービスがテスト実行を妨げている可能性があります。**可能な解決策** - テストアカウントに対してIAMサービスを無効にすることをお勧めします。Gridでのテスト実行をエミュレートするために、シークレットモードでローカルでテストを実行してください。
* IPアドレスがブロックされている可能性があります。**可能な解決策** - **設定 > ID > ログイン履歴**で、アプリケーション「TTA for Salesforce」からの「制限付きIP」アドレスをログイン履歴で確認してください。

  ![ログイン履歴で制限付きIPを確認（TTA for Salesforce）](/images/salesforce-utilities/troubleshoot/bbf8513-image.png)

  Gridからの外部アクセスを妨げている可能性のある以下の制限を削除してください:

  * IPアドレス範囲（会社レベル） - **設定 > セキュリティ > ネットワークアクセス**

    ![会社レベルのネットワークアクセス制限](/images/salesforce-utilities/troubleshoot/622ae9f-Picture3.png)

  * IPアドレス範囲（プロファイルレベル） - **設定 > ユーザー > プロファイル > ログインIPアドレス範囲**

    ![プロファイルレベルのログインIPアドレス範囲](/images/salesforce-utilities/troubleshoot/d10a2bb-Picture4.png)

  * ログイン時間（プロファイルレベル） - **ユーザー > プロファイル > ログイン時間**

    ![プロファイルレベルのログイン時間制限](/images/salesforce-utilities/troubleshoot/e4526ac-Picture5.png)

::: note
IPアドレス制限が必要な場合は、ホワイトリストに登録する必要があるIPアドレスについて[サポート](https://www.testim.io/contact-us/)にお問い合わせください。
:::

## Grid上のスケジュール済みテスト実行が確認コードの入力を求められて失敗する

確認コードはデバイスアクティベーションの一部であり、多要素認証とは異なります。Salesforceにログインしてメールで送信されたコードの入力を求められる場合、デバイスアクティベーションが行われています。

デバイスアクティベーションは、次のいずれかに当てはまる場合に発生します:

* ネットワークアクセス設定でIPアドレスがホワイトリストに登録されていない
* ホワイトリストに登録されたIP範囲が1600万アドレスを超えている
* 組織が無料のSalesforceエディション（Developer Editionなど）を使用している

### 有料組織向けの解決策

デバイスアクティベーションを防止するには、以下の手順を実行してください:

1. **設定 > セキュリティ > ネットワークアクセス**に移動し、会社レベルのIPアドレス範囲をGridのすべてのアドレスを含めるように更新します。

2. **設定 > ユーザー > プロファイル > ログインIPアドレス範囲**に移動し、プロファイルレベルのIP範囲が1600万アドレスを超えないようにします。

## 最初のテストステップでテスト実行が失敗する

他のChrome拡張機能との競合がある場合、最初のテストステップでテスト実行が失敗することがあります。テスト実行を分離し、Tricentis Testim Extensionのみを有効にすることをお勧めします。これを行うには、以下の手順に従ってください:

1. Tricentis Testim Extensionをシークレットモードで実行するように構成します。

  ![Chrome拡張機能のシークレットモード設定](/images/salesforce-utilities/troubleshoot/06d7fe3-troubleshoot_site_setting.png)

2. シークレットモードでテストを実行します。

  ![シークレットモードでのテスト実行](/images/salesforce-utilities/troubleshoot/909b048-troubleshoot_run_incognito_mode.png)

## Createステップを使用して前のステップで作成したレコードが、Findステップを使用してSalesforceで見つからない

**Create**ステップを使用してSalesforceでレコードを作成する場合、レコードが実際にSalesforceで作成され、**Find**ステップを使用して見つけられるようになるまでに時間遅延が発生する可能性があります。解決策は、レコードが見つかるまで、または設定された回数だけ再試行するまで（ループで）繰り返し検索する[カスタム条件](/docs/conditions#configuring-a-custom-condition)を含むステップを追加し、その後次のステップに進むことです。

カスタム条件を含む追加されるステップは、こちらのデモプロジェクトで共有ステップとして見つけることができます - [https://tta-crm.tricentis.com/#/project/WPZPXX3rnCpFZOSFPzYi/branch/master/test/FXeyB01zXmzQmAfs](https://tta-crm.tricentis.com/#/project/WPZPXX3rnCpFZOSFPzYi/branch/master/test/FXeyB01zXmzQmAfs)

この共有ステップをテストに追加するだけです。

デモテストでは、**Create**ステップの後に共有**Find**ステップが続きます。

![共有Findステップの例](/images/salesforce-utilities/troubleshoot/210f6e5-troubleshootfind.png)

**Find**ステップには、レコードが見つかるまで、または最大4回までステップを繰り返すカスタム条件が含まれています:

![Findステップのカスタム条件設定](/images/salesforce-utilities/troubleshoot/f96d08f-customcondition.png)

これがカスタム条件のコードです（**カスタム**の横にある**編集**リンクをクリックして表示）:

![カスタム条件のコード例](/images/salesforce-utilities/troubleshoot/58bdc93-code.png)

カスタムコードは、レコードが見つかるまで、またはレコードの検索を4回試行するまで、この共有グループを繰り返すように設定されています。

Find Account共有ステップには2つの内部ステップが含まれています（ステップをダブルクリックしてアクセス）:

* **Findステップ** - レコードを見つけるための検索ステップ:

  ![Findステップの例](/images/salesforce-utilities/troubleshoot/b20c5ec-find.png)

* **Sleepステップ** - 次の反復を待機するスリープステップ。

  ![Sleepステップの例](/images/salesforce-utilities/troubleshoot/46c1a28-sleep.png)

## Salesforceレコーダーを使用した自動化がSalesforce選択リストから値を選択しない

Salesforce選択リストの自動化は困難です。選択を記録する際は、空白スペースを避けて選択リスト内のテキストを選択する必要があります。

## テストがフィールドを見つけられないが、Salesforceステップには存在する

これは以下の理由による可能性があります:

* テストを実行しているSalesforceアカウントに、このフィールドを表示するための読み取り権限がない可能性があります。\
  **可能な解決策** - このアカウントのフィールド権限を表示するには、[権限検証](/docs/sfdc-step-permission-validation)テストステップを追加して権限を確認してください。
* テストを実行しているSalesforceアカウントのページレイアウトが、このフィールドなしで構成されている可能性があります。\
  **可能な解決策** - ページレイアウトを検証するには、Salesforceで設定を確認してください。

## SalesforceテストがGridで「要素が見つかりません」で失敗するが、ローカルではテストが成功する

これには2つの可能な理由があります:

1. Salesforceページの読み込み時間がGridとローカル実行で異なる場合があります。予期しない追加のページ読み込み時間により、このタイムアウトエラーが発生する可能性があります。\
  **可能な解決策** - 失敗するテストステップの前に、Salesforceステップ[ページ読み込みを待機](/docs/sfdc-step-waitforpageload)を追加してください。このステップは、Salesforceページの読み込みが完了するまでテスト実行を一時停止します。

2. ローカル記録またはローカル実行中にユーザーがブラウザウィンドウのサイズを変更した場合。\
   **可能な解決策** - ブラウザウィンドウのサイズを変更せず、Gridでテストが実行されるときと同じサイズのままにすることをお勧めします。

## 同時Salesforceテスト実行が、ユーザーがログアウトされるため失敗する

Salesforceは、Sign-in with Salesforce（OAuth）ではなく、ユーザー名/パスワードで認証されたアカウントからの同時ログインのみを許可します。

**可能な解決策** - 同時テスト実行には、ユーザー名/パスワードで認証されたペルソナを使用してください。詳細については、[ペルソナの作成](/docs/create-a-persona-and-add-users)を参照してください。

## テストを記録する際にステップが欠落している

レコーダーには2つの操作モードがあります:

* **Salesforceモード** - このモードでは、レコーダーにクラウドアイコンで示され、レコーダーはSalesforceステップを実行します。これにより、単一のステップ内で複数のアクションを実行できます。このモードを使用して作成されたステップには、クラウドアイコンが付いています。
* **Webモード** - これはレコーダーの通常モードで、レコーダーに打ち消し線付きクラウドアイコンで示されます。このモードでは、すべてのインタラクション（クリック、スクロール、テキスト追加など）が個別のステップで表されます。

**可能な解決策** - 記録されたステップがエディターに表示されない場合は、クラウドアイコンをクリックしてSalesforceモードをオフにする必要があります。詳細については、[ステップの記録](/docs/create-a-salesforce-test#recording-steps)を参照してください。

## Salesforceステップにフィールドが存在しない

これには2つの可能な理由があります:

* Salesforceステップには、（ClassicとLightningの両方の）sObjectのページレイアウトにあるフィールドのみが含まれます。Lightningアプリビルダーを使用してのみ追加されたフィールドは含まれません。Salesforce管理者がページレイアウトからフィールドを除外したが、Lightningアプリビルダーを使用して[動的フォーム](https://help.salesforce.com/s/articleView?id=sf.dynamic_forms_overview.htm&type=5)を作成するときに追加した可能性があります。Salesforceステップを使用するには、Salesforceセットアップでページレイアウトにフィールドを追加するか、テストを作成する際にSalesforceレコーダーを使用してください。
* Salesforceステップには、Salesforce環境の接続に使用されるSalesforceアカウントが`読み取り`権限を持つフィールドのみが含まれます。ログイン中のアカウント内で目的のフィールドに必要な権限があるかどうかを確認するには、[権限検証](/docs/sfdc-step-permission-validation)テストステップを追加して権限を確認してください。欠落しているフィールドを表示するには、関連する`読み取り`権限を持つ別のSalesforceアカウントでSalesforce環境を再接続する必要がある場合があります。
