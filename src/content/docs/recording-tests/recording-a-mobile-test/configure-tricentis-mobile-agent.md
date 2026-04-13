---
title: Tricentis Mobile Agent の構成
description: Tricentis Mobile Agent（TMA）のインストール、接続、デバイス構成、およびトラブルシューティング方法について説明します。
category: テストの記録
order: 3008
updated: '2025-09-19'
sourceUrl: 'https://docs.tricentis.com/testim/content/recording-tests/recording-a-mobile-test/configure-tricentis-mobile-agent.htm'
keywords:
  - Tricentis Mobile Agent
  - TMA
  - インストール
  - デバイス構成
  - iOS
  - Android
  - トラブルシューティング
---

Tricentis Mobile Agent は、Testim テストをモバイルデバイスで実行するためのモバイル接続を管理する集中サービスです。Tricentis Mobile Agent は、Windows、Linux、および Mac オペレーティングシステムで実行できます。このソフトウェアは、ローカルの Android および iOS 物理デバイス、ならびにエミュレーターやシミュレーターを含む仮想デバイスでテストを実行するために使用できます。これにより、デバイスのセットアップと構成が簡素化され、テストをより早く開始できます。

:::info{title="情報"}
Tricentis Mobile Agent および iOS artifacts はローカルにインストールされ、このマシンのユーザーのみが使用できます（つまり、複数/リモートユーザー間で共有することはできません）。
:::

## 要件

開始する前に、[Tricentis Mobile Agent のシステム要件](https://documentation.tricentis.com/tricentis_mobile_agent/content/user_manual/system_requirements.htm)のリストを確認してください。

## ローカルコンピューターに Tricentis Mobile Agent をインストールする

Testim でモバイルテストを作成および実行する前に、Tricentis Mobile Agent をインストールする必要があります。

### Windows への Tricentis Mobile Agent のインストールと起動

**Windows に Tricentis Mobile Agent をインストールするには:**

1. Testim で、上部の Tricentis Mobile Agent アイコンをクリックします。

2. ドロップダウンメニューから**Download for Windows (x64)** を選択します。

3. ダウンロードアイコンをクリックします。

![Windows のダウンロード](/images/recording-tests/configure-tricentis-mobile-agent/ffb03c6-image.png)

4. ダウンロードしたファイルを開き、インストールウィザードの指示に従ってインストールを完了します。

5. Tricentis Mobile Agent を起動するには、Tricentis Mobile Agent のデスクトップショートカットを使用するか、Windows 検索バーで検索します。

6. システムトレイの Tricentis アイコンを右クリックして、エージェントのステータスを確認できます。

![TMA Windows コンソール](/images/recording-tests/configure-tricentis-mobile-agent/0a74d94-tmawindowsconsole.png)

### Mac への Tricentis Mobile Agent のインストールと起動

**Mac に Tricentis Mobile Agent をインストールするには:**

1. Testim で、上部の Tricentis Mobile Agent アイコンをクリックします。

2. ドロップダウンメニューから**Download for Mac (x64)** を選択します。

3. ダウンロードアイコンをクリックします。

![Mac のダウンロード](/images/recording-tests/configure-tricentis-mobile-agent/4add3ba-image.png)

4. ダウンロードしたファイルを開き、インストールウィザードの指示に従ってインストールを完了します。

5. Tricentis Mobile Agent を起動するには、アプリケーションフォルダーで Tricentis Mobile Agent をダブルクリックします。

6. メニューバーの Tricentis アイコンを右クリックして、エージェントのステータスを確認できます。

![TMA Mac コンソール](/images/recording-tests/configure-tricentis-mobile-agent/2608a2c-tmamacconsole.png)

### Linux への Tricentis Mobile Agent のインストールと起動

**Linux に Tricentis Mobile Agent をインストールするには:**

1. Testim で、上部の Tricentis Mobile Agent アイコンをクリックします。

2. ドロップダウンメニューから**Download for Linux (x64)** を選択します。

3. ダウンロードアイコンをクリックします。

![Linux のダウンロード](/images/recording-tests/configure-tricentis-mobile-agent/64e7a69-image.png)

1. インストールファイルを見つけて、次の手順を実行します:
   - 右クリックして**Properties > Permissions > Execute**を選択します。
   - **Allow executing file as program**を選択してウィンドウを閉じます。

2. インストールファイルを右クリックして、**Open in Terminal**を選択します。

3. ターミナルで、次の手順を実行します:
   - `./Tricentis_Mobile_Agent_1.0.0.sh`と入力し、Enter を押します。
   - インストールを続行することを確認するために`yes`と入力し、Enter を押します。
   - インストール先のパスを指定し、Enter を押します。これによりインストールが完了し、デスクトップショートカットが作成されます。

4. プロンプトが表示されたら、ターミナルで`y`キーを押してアプリケーションを起動します。または、新しく作成されたデスクトップショートカットからアプリケーションを起動します。

## Tricentis Mobile Agent を Testim に接続する

Tricentis Mobile Agent をインストールした後、Testim に接続する必要があります。→ **Tricentis Mobile Agent に接続するには:**

1. Tricentis Mobile Agent アイコンをクリックします。

2. **Retry Connecting**をクリックします。

![接続の再試行](/images/recording-tests/configure-tricentis-mobile-agent/c9c5dd1-image_1.png)

3. ソフトウェアを開くことの承認を求められます。**Open Tricentis Mobile Agent**をクリックします。

Tricentis Mobile Agent が接続されると、アイコンに緑色のインジケーターが表示され、エージェントステータスが準備完了と表示されます。TMA（Tricentis Mobile Agent）のバージョン（例: 1.0.0）も表示されることに注意してください。

![接続完了](/images/recording-tests/configure-tricentis-mobile-agent/b039acc-image_2.png)

## デバイスを構成する

Tricentis Mobile Agent を Testim に接続した後、デバイスを接続して構成できます。Tricentis Mobile Agent は、接続されているすべてのデバイスを検出し、デバイス管理の下にリスト表示します。接続されたデバイスを表示したり、設定を管理したり、iOS デバイスに iOS イメージをアップロードしたり、iOS デバイスから iOS イメージを削除したりできます。

### Android デバイスを準備する

Tricentis Mobile Agent を使用したテスト自動化のために Android デバイスを準備するには、次の手順に従ってください。→ **Android デバイスを準備するには:**

1. Android デバイスをコンピューターに接続し、電話データへのアクセスを許可します。

2. Android デバイスで開発者モードを有効にするには、**設定 > 電話について > ソフトウェア情報**に移動し、ビルド番号を 7 回タップします。開発者オプションが設定の下に表示されます。

3. USB デバッグを有効にするには、**設定 > 開発者オプション**に移動し、USB デバッグを有効にします。

4. テスト中に Android デバイスがスリープモードにならないようにするには、**Stay awake**を有効にします。

5. デバイスの USB ドライバーがコンピューターにインストールされていることを確認します。ドライバーのインストール方法については、この[Tricentis ナレッジベース記事](https://support-hub.tricentis.com/open?sys_kb_id=194a54eedb4f5c181ea7bb13f3961950&id=kb_article_view&number=KB0012723)を参照してください。

### iOS デバイスを準備する

#### 前提条件

Tricentis Mobile Agent で iOS デバイスを使用するには、以下の要件を満たす必要があります:

- Tricentis Mobile Agent がコンピューターにインストールされ、実行されている。
- アクティブな Apple Developer アカウントを持っている。
- デバイスがコンピューターに接続されている。

**iOS デバイスを準備するには:**

1. iOS デバイスをコンピューターに接続します。

2. iOS デバイスで、設定に移動し、以下のアクションを実行します:
   - **UI オートメーションを有効にする** - プライバシーとセキュリティ > 開発者設定に移動し、UI オートメーションを有効にするを有効にします。
   - **Web インスペクターを有効にする** - Safari > 詳細設定に移動し、Web インスペクターを有効にします。

#### iOS イメージをアップロードする

iOS デバイスを開発者モードで実行し、開発証明書を使用して WebDriverAgent（WDA）をインストールするには、iOS イメージが必要です。iOS イメージは、Xcode（iOS IDE）によって生成される zip フォルダーです。また、GitHub から iOS イメージをダウンロードすることもできます - [https://github.com/iGhibli/iOS-DeviceSupport/tree/master/DeviceSupport](https://github.com/iGhibli/iOS-DeviceSupport/tree/master/DeviceSupport)。→ **iOS イメージをアップロードするには:**

1. 関連する iOS イメージを[https://github.com/iGhibli/iOS-DeviceSupport/tree/master/DeviceSupport](https://github.com/iGhibli/iOS-DeviceSupport/tree/master/DeviceSupport)からダウンロードできます。

2. Tricentis Mobile Agent で、デバイス管理の下にある**Upload iOS image**をクリックします。

3. デバイスに適した iOS バージョンの iOS イメージを選択します。

4. **Upload**をクリックします。

#### Apple チーム ID を取得する

コンピューターに接続された iOS デバイスを自動化するには、Apple チーム ID が必要です。Apple チーム ID は、チームを一意に識別するために Apple によって生成される 10 文字の文字列です。Apple チーム ID は、[Apple Developer アカウント](https://idmsa.apple.com/IDMSWebAuth/signin?appIdKey=891bd3417a7776362562d2197f89480a8547b108fd934911bcbea0110d07f757&path=%2Faccount%2F&rv=1)から取得できます。Apple Developer アカウントのメンバーシップセクションから、Apple チーム ID を取得します。Apple チーム ID の取得方法については、[Apple オンラインヘルプ](https://developer.apple.com/support/)を参照してください。iOS デバイスを接続して構成したら、[Tricentis Mobile Agent で追加の構成手順](https://documentation.tricentis.com/tricentis_mobile_agent/content/user_manual/additional_configuration_ios.htm)を実行する必要があります。

#### Tricentis Mobile Agent iOS Artifacts を構成する

Tricentis Mobile Agent で iOS デバイスを使用するには、以下の追加の構成手順を実行する必要があります。→ **iOS artifacts を構成するには:**

1. Tricentis Mobile Agent で、**iOS artifacts**に移動します。

2. **Insert Apple team ID**テキストフィールドに、Apple チーム ID を入力します。Apple チーム ID をクリアすると、既存の証明書署名リクエスト（CSR）、証明書、およびプロビジョニングプロファイルも削除されます。

3. 証明書署名リクエスト（CSR）に移動し、**Generate new CSR**を選択し、CSR ファイルをダウンロードします。署名された証明書には有効期限があります。証明書の有効期限が切れた場合は、新しい CSR を作成する必要があります。そうしないと、テストを実行できません。新しい CSR を生成すると、以前の CSR の署名された証明書とプロビジョニングプロファイルが削除されます。

4. 証明書に移動し、**Upload certificate**を選択します。この証明書は、Apple チーム ID と CSR の一致を確認します。証明書は、Tricentis Mobile Agent にアップロードする必要がある.p12 ファイルに保存されます。別の証明書をアップロードすると、既存のプロビジョニングプロファイルが削除されます。

5. プロビジョニングプロファイルの下で、**Upload provisioning profile**を選択します。

アップロードした証明書とプロビジョニングプロファイルを確認するには、エージェント設定でデバッグモードを有効にします。

#### iTunes をインストールする

Windows オペレーティングシステムで iOS デバイスのテスト自動化を実行するには、[iTunes をインストール](https://support.apple.com/downloads/itunes)する必要があります。必ず App Store から iTunes をダウンロードしてください。iTunes のインストール後、次のいずれかのアクションを実行します:

- コンピューターを再起動します。
- iOS デバイスを再接続します。

#### iOS シミュレーターを有効にする

Mac で iOS シミュレーターを有効にするには、Xcode 内で利用可能なシミュレーターアプリを使用します。キーボードまたはマウスを使用して iOS シミュレーターを操作します。Tricentis Mobile Agent を使用して iOS シミュレーターをミラーリングするには、Apple Developer アカウントは必要ありません。→ **Tricentis Mobile Agent を使用したテスト自動化のために Mac で iOS シミュレーターを有効にするには:**

1. Mac に Tricentis Mobile Agent をインストールして起動します。

2. Mac App Store から[Xcode をインストール](https://apps.apple.com/us/genre/mac/id39?mt=12)します。

3. Xcode 内で使用可能な iOS シミュレーターを選択して起動するには、[Apple Simulator User Guide](https://developer.apple.com/library/archive/documentation/IDEs/Conceptual/iOS_Simulator_Guide/Introduction/Introduction.html#//apple_ref/doc/uid/TP40012848-CH1-SW1)の手順に従ってください。

Tricentis Mobile Agent が iOS シミュレーターを検出できない場合は、ターミナルで次のコマンドを実行し、Tricentis Mobile Agent を再起動してください:

コマンド: sudo xcode-select -s $(ls -td /Applications/Xcode* | head -1)/Contents/Developer

iOS シミュレーターで WDA を起動する際にエラーが発生した場合は、マシンで実行されているすべての Xcode シミュレーターをシャットダウンし、iOS シミュレーターを起動してから、Tricentis Mobile Agent を再起動してください。

## トラブルシューティング

このトピックでは、Tricentis Mobile Agent で発生する可能性のある問題の解決策について説明します。

### エージェントログをダウンロードする

サポートチームにサポートを依頼する際、Tricentis Mobile Agent ログの情報を提供するよう求められることがあります。→ **Tricentis Mobile Agent ログをダウンロードするには:**

1. Tricentis Mobile Agent の**Agent Settings**タブに移動します。

2. **Download Logs**ハイパーリンクをクリックします。

![ログのダウンロード](/images/recording-tests/configure-tricentis-mobile-agent/a705810-downloadlogs.png)

### iOS シミュレーターが検出されない

シミュレーターが検出されない場合は、次のコマンドを実行してから、Tricentis Mobile Agent を再起動してみてください:

コマンド: sudo xcode-select -s $(ls -td /Applications/Xcode* | head -1)/Contents/Developer

### WebDriverAgent（WDA）エラー

iOS シミュレーターで WDA を起動する際に次のようなエラーが発生した場合:

エラー例: 2021-07-18 02:22:22.461 ERROR 37497 qtp499764573-13 i.t.a.i.n Failed trying to start WDA on 2D3C1771-938B-43D7-A95C-5CCB834CE63E for unknown reason java.util.concurrent.ExecutionException: java.io.IOException: There was a problem connecting to the simulator with the udid of 2D3C1771-938B-43D7-A95C-5CCB834CE63E

マシンで実行されているすべての Xcode シミュレーターをシャットダウンするために、次のコマンドを実行してみてください:

コマンド: sudo xcrun simctl shutdown all

その後、テストを再度実行してみてください。Tricentis Mobile Agent が自動的にシミュレーターを起動します。

### Android デバイス接続の問題

Android デバイスを Tricentis Mobile Agent に接続する際に問題がある場合は、デバイスの開発者オプションに移動し、以下の設定を有効にしてください:

- 権限の監視を無効にする（オプション）
- USB 構成の選択で、MTP またはファイル転送を選択します。
- 下にスクロールして、ウィンドウアニメーションスケール、トランジションアニメーションスケール、およびアニメーター継続時間スケールのアニメーションをオフにします。
- USB ケーブルを Android デバイスに接続するときは、次の操作を実行してください:
  - デバイスデータへのアクセスを許可し、YES を選択します。
  - USB デバッグを許可し、OK を選択します。

ミラーリングまたは記録がまだ機能しない場合は、開発者オプションに移動し、信頼できるコンピューターをクリアし、プラグを抜いて再接続してください。

### Android デバイスでの UI Automator クラッシュ

UI Automator は、インストールされているすべてのアプリケーションで機能的な UI テストを行うための Android テストフレームワークです。Android デバイスの実行中に UI Automator に関連する問題が発生した場合は、使用している自動化ツールの電源制限を確認してください。Android デバイスのパフォーマンスを向上させるには、以下のアプリケーションで最適化を無効にしてください:

- テスト対象のアプリケーション
- Android System WebView（WebView を使用するアプリケーション用）
- Appium Settings
- Application Installer
- Automation Test
- Chrome（モバイルでの Web テスト用）
- io.appium.uiautomator2.server
- io.appium.uiautomator2.server.test
