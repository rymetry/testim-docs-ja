---
title: トラブルシューティング
description: Testim for Salesforce で起こりやすい接続・実行失敗などの問題と対処方法をまとめます。
category: Salesforceテスト
order: 16033
updated: '2025-12-10'
sourceUrl: 'https://docs.tricentis.com/testim/content/salesforce-testing/troubleshoot.htm'
keywords:
  - トラブルシューティング
  - Salesforce 接続
  - IP ホワイトリスト
  - Grid
  - ログイン履歴
  - 権限
  - ページ読み込み
  - IAM
  - Okta
---

## Salesforce 環境に接続できない

Salesforce 環境に接続するには、Salesforce 環境が以下の要件を満たしていることを確認してください:

- API アクセスをサポート - これには、Enterprise、Performance、Unlimited、および Developer Edition 組織が必要です。Professional Edition 組織は、アドオンとして API アクセスを追加できます。Salesforce Essentials Edition は API アクセスをサポートしていません。
- **管理 > ユーザー > プロファイル**で、Salesforce 環境に接続するために選択されたユーザーに対して REST API が有効になっています。

  ![プロファイル設定で REST API を有効化](/images/salesforce-utilities/troubleshoot/40062a4-profiles.png)

- Salesforce 環境に接続する Salesforce アカウントには、**Approve Uninstalled Connected Apps**（インストールされていない接続アプリを承認）権限が必要です。

- この権限が Sandbox で利用できない場合は、対象の Sandbox 環境で **Match Production Licenses to Sandbox Without a Refresh** ツールを実行してください。

- **設定 > セキュリティ > ネットワークアクセス**で以下の IP アドレスをホワイトリストに登録します。
  - 35.85.13.117
  - 44.228.217.52
  - 54.245.105.236
  - 54.214.4.125

  ![ネットワークアクセスで IP をホワイトリスト登録](/images/salesforce-utilities/troubleshoot/6f77e19-Picture1.png)

- ブロックされている追加の IP アドレスをホワイトリストに登録します。**設定 > ID > ログイン履歴**で、アプリケーション「Testim for Salesforce」に対してブロックされている「制限付き IP」アドレスをログイン履歴で確認してください。

  ![ログイン履歴で制限付き IP を確認](/images/salesforce-utilities/troubleshoot/32799d4-Picture2.png)

## Grid 上のスケジュール済みテスト実行が失敗する

テストがローカルでは正常に実行されているのに Grid では失敗する場合は、以下を確認してください:

- Azure Active Directory や Okta などの Identity and Access Management（IAM）サービスがテスト実行を妨げている可能性があります。**可能な解決策** - テストアカウントに対して IAM サービスを無効にすることをお勧めします。Grid でのテスト実行をエミュレートするために、シークレットモードでローカルでテストを実行してください。
- IP アドレスがブロックされている可能性があります。**可能な解決策** - **設定 > ID > ログイン履歴**で、アプリケーション「TTA for Salesforce」からの「制限付き IP」アドレスをログイン履歴で確認してください。
- ![ログイン履歴で制限付き IP を確認（TTA for Salesforce）](/images/salesforce-utilities/troubleshoot/bbf8513-image.png)

  Grid からの外部アクセスを妨げている可能性のある以下の制限を削除してください:
  - IP アドレス範囲（会社レベル） - **設定 > セキュリティ > ネットワークアクセス**

    ![会社レベルのネットワークアクセス制限](/images/salesforce-utilities/troubleshoot/622ae9f-Picture3.png)

  - IP アドレス範囲（プロファイルレベル） - **設定 > ユーザー > プロファイル > ログイン IP アドレス範囲**

    ![プロファイルレベルのログイン IP アドレス範囲](/images/salesforce-utilities/troubleshoot/d10a2bb-Picture4.png)

  - ログイン時間（プロファイルレベル） - **ユーザー > プロファイル > ログイン時間**

    ![プロファイルレベルのログイン時間制限](/images/salesforce-utilities/troubleshoot/e4526ac-Picture5.png)

:::note
IP アドレス制限が必要な場合は、ホワイトリストに登録する必要がある IP アドレスについて[サポート](https://www.testim.io/contact-us/)にお問い合わせください。
:::

## Grid 上のスケジュール済みテスト実行が確認コードの入力を求められて失敗する

確認コードはデバイスアクティベーションの一部であり、多要素認証とは異なります。

Salesforce にログインしてメールで送信されたコードの入力を求められる場合、デバイスアクティベーションが行われています。

デバイスアクティベーションは、次のいずれかに当てはまる場合に発生します:

- ネットワークアクセス設定で IP アドレスがホワイトリストに登録されていない
- ホワイトリストに登録された IP 範囲が 1600 万アドレスを超えている
- 組織が無料の Salesforce エディション（Developer Edition など）を使用している

有料組織のデバイスアクティベーションを停止するには、以下の手順を実行してください:

- **設定 > セキュリティ > ネットワークアクセス**に移動し、会社レベルの IP アドレス範囲を[Grid](/docs/testim-grid-ips)のすべての IP アドレスを含めるように更新します。
- **設定 > ユーザー > プロファイル > ログイン IP アドレス範囲**に移動し、プロファイルレベルの IP 範囲が 1600 万アドレスを超えないようにします。

## 最初のテストステップでテスト実行が失敗する

他の Chrome 拡張機能との競合がある場合、最初のテストステップでテスト実行が失敗することがあります。テスト実行を分離し、Tricentis Testim Extension のみを有効にすることをお勧めします。これを行うには、以下の手順に従ってください:

1. Tricentis Testim Extension をシークレットモードで実行するように構成します。

   ![Chrome 拡張機能のシークレットモード設定](/images/salesforce-utilities/troubleshoot/06d7fe3-troubleshoot_site_setting.png)

2. シークレットモードでテストを実行します。

   ![シークレットモードでのテスト実行](/images/salesforce-utilities/troubleshoot/909b048-troubleshoot_run_incognito_mode.png)

## Create ステップを使用して前のステップで作成したレコードが、Find ステップを使用して Salesforce で見つからない

**Create**ステップを使用して Salesforce でレコードを作成する場合、レコードが実際に Salesforce で作成され、**Find**ステップを使用して見つけられるようになるまでに時間遅延が発生する可能性があります。解決策は、レコードが見つかるまで、または設定された回数だけ再試行するまで（ループで）繰り返し検索する[カスタム条件](/docs/conditions#configuring-a-custom-condition)を含むステップを追加し、その後次のステップに進むことです。

カスタム条件を含む追加されるステップは、こちらのデモプロジェクトで共有ステップとして見つけることができます - [https://tta-crm.tricentis.com/#/project/WPZPXX3rnCpFZOSFPzYi/branch/master/test/FXeyB01zXmzQmAfs](https://tta-crm.tricentis.com/#/project/WPZPXX3rnCpFZOSFPzYi/branch/master/test/FXeyB01zXmzQmAfs)

この共有ステップをテストに追加するだけです。

デモテストでは、**Create**ステップの後に共有**Find**ステップが続きます。

![共有 Find ステップの例](/images/salesforce-utilities/troubleshoot/210f6e5-troubleshootfind.png)

**Find**ステップには、レコードが見つかるまで、または最大 4 回までステップを繰り返すカスタム条件が含まれています:

![Find ステップのカスタム条件設定](/images/salesforce-utilities/troubleshoot/f96d08f-customcondition.png)

これがカスタム条件のコードです（**カスタム**の横にある**編集**リンクをクリックして表示）:

![カスタム条件のコード例](/images/salesforce-utilities/troubleshoot/58bdc93-code.png)

カスタムコードは、レコードが見つかるまで、またはレコードの検索を 4 回試行するまで、この共有グループを繰り返すように設定されています。

Find Account 共有ステップには 2 つの内部ステップが含まれています（ステップをダブルクリックしてアクセス）:

- **Find ステップ** - レコードを見つけるための検索ステップ:

  ![Find ステップの例](/images/salesforce-utilities/troubleshoot/b20c5ec-find.png)

- **Sleep ステップ** - 次の反復を待機するスリープステップ。

  ![Sleep ステップの例](/images/salesforce-utilities/troubleshoot/46c1a28-sleep.png)

## Salesforce レコーダーを使用した自動化が Salesforce 選択リストから値を選択しない

Salesforce 選択リストの自動化は困難です。選択を記録する際は、空白スペースを避けて選択リスト内のテキストを選択する必要があります。

## テストがフィールドを見つけられないが、Salesforce ステップには存在する

これは以下の理由による可能性があります:

- テストを実行している Salesforce アカウントに、このフィールドを表示するための読み取り権限がない可能性があります。\
  **可能な解決策** - このアカウントのフィールド権限を表示するには、[権限検証](/docs/sfdc-step-permission-validation)テストステップを追加して権限を確認してください。
- テストを実行している Salesforce アカウントのページレイアウトが、このフィールドなしで構成されている可能性があります。\
  **可能な解決策** - ページレイアウトを検証するには、Salesforce で設定を確認してください。

## Salesforce テストが Grid で「要素が見つかりません」で失敗するが、ローカルではテストが成功する

これには 2 つの可能な理由があります:

1. Salesforce ページの読み込み時間が Grid とローカル実行で異なる場合があります。予期しない追加のページ読み込み時間により、このタイムアウトエラーが発生する可能性があります。\
   **可能な解決策** - 失敗するテストステップの前に、Salesforce ステップ[ページ読み込みを待機](/docs/sfdc-step-waitforpageload)を追加してください。このステップは、Salesforce ページの読み込みが完了するまでテスト実行を一時停止します。

2. ローカル記録またはローカル実行中にユーザーがブラウザウィンドウのサイズを変更した場合。\
   **可能な解決策** - ブラウザウィンドウのサイズを変更せず、Grid でテストが実行されるときと同じサイズのままにすることをお勧めします。

## 同時 Salesforce テスト実行が、ユーザーがログアウトされるため失敗する

Salesforce は、Sign-in with Salesforce（OAuth）ではなく、ユーザー名/パスワードで認証されたアカウントからの同時ログインのみを許可します。

**可能な解決策** - 同時テスト実行には、ユーザー名/パスワードで認証されたペルソナを使用してください。詳細については、[ペルソナの作成](/docs/create-a-persona-and-add-users)を参照してください。

## テストを記録する際にステップが欠落している

レコーダーには 2 つの操作モードがあります:

- **Salesforce モード** - このモードでは、レコーダーにクラウドアイコンで示され、レコーダーは Salesforce ステップを実行します。これにより、単一のステップ内で複数のアクションを実行できます。このモードを使用して作成されたステップには、クラウドアイコンが付いています。
- **Web モード** - これはレコーダーの通常モードで、レコーダーに打ち消し線付きクラウドアイコンで示されます。このモードでは、すべてのインタラクション（クリック、スクロール、テキスト追加など）が個別のステップで表されます。

**可能な解決策** - 記録されたステップがエディターに表示されない場合は、クラウドアイコンをクリックして Salesforce モードをオフにする必要があります。詳細については、[ステップの記録](/docs/create-a-salesforce-test#recording-steps)を参照してください。

## Salesforce ステップにフィールドが存在しない

これには 2 つの可能な理由があります:

- Salesforce ステップには、（Classic と Lightning の両方の）sObject のページレイアウトにあるフィールドのみが含まれます。Lightning アプリビルダーを使用してのみ追加されたフィールドは含まれません。Salesforce 管理者がページレイアウトからフィールドを除外したが、Lightning アプリビルダーを使用して[動的フォーム](https://help.salesforce.com/s/articleView?id=sf.dynamic_forms_overview.htm&type=5)を作成するときに追加した可能性があります。Salesforce ステップを使用するには、Salesforce セットアップでページレイアウトにフィールドを追加するか、テストを作成する際に Salesforce レコーダーを使用してください。
- Salesforce ステップには、Salesforce 環境の接続に使用される Salesforce アカウントが`読み取り`権限を持つフィールドのみが含まれます。ログイン中のアカウント内で目的のフィールドに必要な権限があるかどうかを確認するには、[権限検証](/docs/sfdc-step-permission-validation)テストステップを追加して権限を確認してください。欠落しているフィールドを表示するには、関連する`読み取り`権限を持つ別の Salesforce アカウントで Salesforce 環境を再接続する必要がある場合があります。
