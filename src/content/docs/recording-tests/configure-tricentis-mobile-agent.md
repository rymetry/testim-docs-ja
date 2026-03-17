---
title: Tricentis Mobile Agentの構成
description: Tricentis Mobile Agent(TMA)のインストール、接続、デバイス構成、およびトラブルシューティング方法について説明します。
category: テストの記録
order: 3008
updated: '2025-09-13'
sourceUrl: 'https://help.testim.io/docs/configure-tricentis-mobile-agent'
keywords:
  - Tricentis Mobile Agent
  - TMA
  - インストール
  - デバイス構成
  - iOS
  - Android
  - トラブルシューティング
---

# Tricentis Mobile Agentの構成

Tricentis Mobile Agentは、Testimテストをモバイルデバイスで実行するためのモバイル接続を管理する集中サービスです。Tricentis Mobile Agentは、Windows、Linux、およびMacオペレーティングシステムで実行できます。このソフトウェアは、ローカルのAndroidおよびiOS物理デバイス、ならびにエミュレーターやシミュレーターを含む仮想デバイスでテストを実行するために使用できます。これにより、デバイスのセットアップと構成が簡素化され、テストをより早く開始できます。

:::info{title="情報"}
Tricentis Mobile AgentおよびiOS artifactsはローカルにインストールされ、このマシンのユーザーのみが使用できます(つまり、複数/リモートユーザー間で共有することはできません)。
:::

## 要件

開始する前に、[Tricentis Mobile Agentのシステム要件](https://documentation.tricentis.com/tricentis_mobile_agent/content/user_manual/system_requirements.htm)のリストを確認してください。

## ローカルコンピューターにTricentis Mobile Agentをインストールする

Testimでモバイルテストを作成および実行する前に、Tricentis Mobile Agentをインストールする必要があります。

### WindowsへのTricentis Mobile Agentのインストールと起動

**WindowsにTricentis Mobile Agentをインストールするには:**

1. Testimで、上部のTricentis Mobile Agentアイコンをクリックします。

2. ドロップダウンメニューから**Download for Windows (x64)**を選択します。

3. ダウンロードアイコンをクリックします。

![Windowsのダウンロード](/images/recording-tests/configure-tricentis-mobile-agent/ffb03c6-image.png)

4. ダウンロードしたファイルを開き、インストールウィザードの指示に従ってインストールを完了します。

5. Tricentis Mobile Agentを起動するには、Tricentis Mobile Agentのデスクトップショートカットを使用するか、Windows検索バーで検索します。

6. システムトレイのTricentisアイコンを右クリックして、エージェントのステータスを確認できます。

![TMA Windowsコンソール](/images/recording-tests/configure-tricentis-mobile-agent/0a74d94-tmawindowsconsole.png)

### MacへのTricentis Mobile Agentのインストールと起動

**MacにTricentis Mobile Agentをインストールするには:**

1. Testimで、上部のTricentis Mobile Agentアイコンをクリックします。

2. ドロップダウンメニューから**Download for Mac (x64)**を選択します。

3. ダウンロードアイコンをクリックします。

![Macのダウンロード](/images/recording-tests/configure-tricentis-mobile-agent/4add3ba-image.png)

4. ダウンロードしたファイルを開き、インストールウィザードの指示に従ってインストールを完了します。

5. Tricentis Mobile Agentを起動するには、アプリケーションフォルダーでTricentis Mobile Agentをダブルクリックします。

6. メニューバーのTricentisアイコンを右クリックして、エージェントのステータスを確認できます。

![TMA Macコンソール](/images/recording-tests/configure-tricentis-mobile-agent/2608a2c-tmamacconsole.png)

### LinuxへのTricentis Mobile Agentのインストールと起動

**LinuxにTricentis Mobile Agentをインストールするには:**

1. Testimで、上部のTricentis Mobile Agentアイコンをクリックします。

2. ドロップダウンメニューから**Download for Linux (x64)**を選択します。

3. ダウンロードアイコンをクリックします。

![Linuxのダウンロード](/images/recording-tests/configure-tricentis-mobile-agent/64e7a69-image.png)

2. インストールファイルを見つけて、次の手順を実行します:
   - 右クリックして**Properties > Permissions > Execute**を選択します。
   - **Allow executing file as program**を選択してウィンドウを閉じます。

3. インストールファイルを右クリックして、**Open in Terminal**を選択します。

4. ターミナルで、次の手順を実行します:
   - `./Tricentis_Mobile_Agent_1.0.0.sh`と入力し、Enterを押します。
   - インストールを続行することを確認するために`yes`と入力し、Enterを押します。
   - インストール先のパスを指定し、Enterを押します。これによりインストールが完了し、デスクトップショートカットが作成されます。

5. プロンプトが表示されたら、ターミナルで`y`キーを押してアプリケーションを起動します。または、新しく作成されたデスクトップショートカットからアプリケーションを起動します。

## Tricentis Mobile AgentをTestimに接続する

Tricentis Mobile Agentをインストールした後、Testimに接続する必要があります。

**Tricentis Mobile Agentに接続するには:**

1. Tricentis Mobile Agentアイコンをクリックします。

2. **Retry Connecting**をクリックします。

![接続の再試行](/images/recording-tests/configure-tricentis-mobile-agent/c9c5dd1-image_1.png)

3. ソフトウェアを開くことの承認を求められます。**Open Tricentis Mobile Agent**をクリックします。

Tricentis Mobile Agentが接続されると、アイコンに緑色のインジケーターが表示され、エージェントステータスが準備完了と表示されます。TMA(Tricentis Mobile Agent)のバージョン(例: 1.0.0)も表示されることに注意してください。

![接続完了](/images/recording-tests/configure-tricentis-mobile-agent/b039acc-image_2.png)

## デバイスを構成する

Tricentis Mobile AgentをTestimに接続した後、デバイスを接続して構成できます。Tricentis Mobile Agentは、接続されているすべてのデバイスを検出し、デバイス管理の下にリスト表示します。接続されたデバイスを表示したり、設定を管理したり、iOSデバイスにiOSイメージをアップロードしたり、iOSデバイスからiOSイメージを削除したりできます。

### Androidデバイスを準備する

Tricentis Mobile Agentを使用したテスト自動化のためにAndroidデバイスを準備するには、次の手順に従ってください。

**Androidデバイスを準備するには:**

1. Androidデバイスをコンピューターに接続し、電話データへのアクセスを許可します。

2. Androidデバイスで開発者モードを有効にするには、**設定 > 電話について > ソフトウェア情報**に移動し、ビルド番号を7回タップします。開発者オプションが設定の下に表示されます。

3. USBデバッグを有効にするには、**設定 > 開発者オプション**に移動し、USBデバッグを有効にします。

4. テスト中にAndroidデバイスがスリープモードにならないようにするには、**Stay awake**を有効にします。

5. デバイスのUSBドライバーがコンピューターにインストールされていることを確認します。ドライバーのインストール方法については、この[Tricentisナレッジベース記事](https://support-hub.tricentis.com/open?sys_kb_id=194a54eedb4f5c181ea7bb13f3961950&id=kb_article_view&number=KB0012723)を参照してください。

### iOSデバイスを準備する

#### 前提条件

Tricentis Mobile AgentでiOSデバイスを使用するには、以下の要件を満たす必要があります:

- Tricentis Mobile Agentがコンピューターにインストールされ、実行されている。
- アクティブなApple Developerアカウントを持っている。
- デバイスがコンピューターに接続されている。

**iOSデバイスを準備するには:**

1. iOSデバイスをコンピューターに接続します。

2. iOSデバイスで、設定に移動し、以下のアクションを実行します:
   - **UIオートメーションを有効にする** - プライバシーとセキュリティ > 開発者設定に移動し、UIオートメーションを有効にするを有効にします。
   - **Webインスペクターを有効にする** - Safari > 詳細設定に移動し、Webインスペクターを有効にします。

#### iOSイメージをアップロードする

iOSデバイスを開発者モードで実行し、開発証明書を使用してWebDriverAgent(WDA)をインストールするには、iOSイメージが必要です。iOSイメージは、Xcode(iOS IDE)によって生成されるzipフォルダーです。また、GitHubからiOSイメージをダウンロードすることもできます - [https://github.com/iGhibli/iOS-DeviceSupport/tree/master/DeviceSupport](https://github.com/iGhibli/iOS-DeviceSupport/tree/master/DeviceSupport)。

**iOSイメージをアップロードするには:**

1. 関連するiOSイメージを[https://github.com/iGhibli/iOS-DeviceSupport/tree/master/DeviceSupport](https://github.com/iGhibli/iOS-DeviceSupport/tree/master/DeviceSupport)からダウンロードできます。

2. Tricentis Mobile Agentで、デバイス管理の下にある**Upload iOS image**をクリックします。

3. デバイスに適したiOSバージョンのiOSイメージを選択します。

4. **Upload**をクリックします。

#### AppleチームIDを取得する

コンピューターに接続されたiOSデバイスを自動化するには、AppleチームIDが必要です。AppleチームIDは、チームを一意に識別するためにAppleによって生成される10文字の文字列です。AppleチームIDは、[Apple Developerアカウント](https://idmsa.apple.com/IDMSWebAuth/signin?appIdKey=891bd3417a7776362562d2197f89480a8547b108fd934911bcbea0110d07f757&path=%2Faccount%2F&rv=1)から取得できます。

Apple Developerアカウントのメンバーシップセクションから、AppleチームIDを取得します。AppleチームIDの取得方法については、[Appleオンラインヘルプ](https://developer.apple.com/support/)を参照してください。

iOSデバイスを接続して構成したら、[Tricentis Mobile Agentで追加の構成手順](https://documentation.tricentis.com/tricentis_mobile_agent/content/user_manual/additional_configuration_ios.htm)を実行する必要があります。

#### Tricentis Mobile Agent iOS Artifactsを構成する

Tricentis Mobile AgentでiOSデバイスを使用するには、以下の追加の構成手順を実行する必要があります。

**iOS artifactsを構成するには:**

1. Tricentis Mobile Agentで、**iOS artifacts**に移動します。

2. **Insert Apple team ID**テキストフィールドに、AppleチームIDを入力します。AppleチームIDをクリアすると、既存の証明書署名リクエスト(CSR)、証明書、およびプロビジョニングプロファイルも削除されます。

3. 証明書署名リクエスト(CSR)に移動し、**Generate new CSR**を選択し、CSRファイルをダウンロードします。署名された証明書には有効期限があります。証明書の有効期限が切れた場合は、新しいCSRを作成する必要があります。そうしないと、テストを実行できません。新しいCSRを生成すると、以前のCSRの署名された証明書とプロビジョニングプロファイルが削除されます。

4. 証明書に移動し、**Upload certificate**を選択します。この証明書は、AppleチームIDとCSRの一致を確認します。証明書は、Tricentis Mobile Agentにアップロードする必要がある.p12ファイルに保存されます。別の証明書をアップロードすると、既存のプロビジョニングプロファイルが削除されます。

5. プロビジョニングプロファイルの下で、**Upload provisioning profile**を選択します。

アップロードした証明書とプロビジョニングプロファイルを確認するには、エージェント設定でデバッグモードを有効にします。

#### iTunesをインストールする

WindowsオペレーティングシステムでiOSデバイスのテスト自動化を実行するには、[iTunesをインストール](https://support.apple.com/downloads/itunes)する必要があります。必ずApp StoreからiTunesをダウンロードしてください。

iTunesのインストール後、次のいずれかのアクションを実行します:

- コンピューターを再起動します。
- iOSデバイスを再接続します。

#### iOSシミュレーターを有効にする

MacでiOSシミュレーターを有効にするには、Xcode内で利用可能なシミュレーターアプリを使用します。キーボードまたはマウスを使用してiOSシミュレーターを操作します。Tricentis Mobile Agentを使用してiOSシミュレーターをミラーリングするには、Apple Developerアカウントは必要ありません。

**Tricentis Mobile Agentを使用したテスト自動化のためにMacでiOSシミュレーターを有効にするには:**

1. MacにTricentis Mobile Agentをインストールして起動します。

2. Mac App Storeから[Xcodeをインストール](https://apps.apple.com/us/genre/mac/id39?mt=12)します。

3. Xcode内で使用可能なiOSシミュレーターを選択して起動するには、[Apple Simulator User Guide](https://developer.apple.com/library/archive/documentation/IDEs/Conceptual/iOS_Simulator_Guide/Introduction/Introduction.html#//apple_ref/doc/uid/TP40012848-CH1-SW1)の手順に従ってください。

Tricentis Mobile AgentがiOSシミュレーターを検出できない場合は、ターミナルで次のコマンドを実行し、Tricentis Mobile Agentを再起動してください:

```bash
sudo xcode-select -s $(ls -td /Applications/Xcode* | head -1)/Contents/Developer
```

iOSシミュレーターでWDAを起動する際にエラーが発生した場合は、マシンで実行されているすべてのXcodeシミュレーターをシャットダウンし、iOSシミュレーターを起動してから、Tricentis Mobile Agentを再起動してください。

## トラブルシューティング

このトピックでは、Tricentis Mobile Agentで発生する可能性のある問題の解決策について説明します。

### エージェントログをダウンロードする

サポートチームにサポートを依頼する際、Tricentis Mobile Agentログの情報を提供するよう求められることがあります。

**Tricentis Mobile Agentログをダウンロードするには:**

1. Tricentis Mobile Agentの**Agent Settings**タブに移動します。

2. **Download Logs**ハイパーリンクをクリックします。

![ログのダウンロード](/images/recording-tests/configure-tricentis-mobile-agent/a705810-downloadlogs.png)

### iOSシミュレーターが検出されない

シミュレーターが検出されない場合は、次のコマンドを実行してから、Tricentis Mobile Agentを再起動してみてください:

```bash
sudo xcode-select -s $(ls -td /Applications/Xcode* | head -1)/Contents/Developer
```

### WebDriverAgent(WDA)エラー

iOSシミュレーターでWDAを起動する際に次のようなエラーが発生した場合:

```text
2021-07-18 02:22:22.461 ERROR 37497 qtp499764573-13 i.t.a.i.n Failed trying to start WDA on 2D3C1771-938B-43D7-A95C-5CCB834CE63E for unknown reason java.util.concurrent.ExecutionException: java.io.IOException: There was a problem connecting to the simulator with the udid of 2D3C1771-938B-43D7-A95C-5CCB834CE63E
```

次のコマンドを実行して、マシンで実行されているすべてのXCodeシミュレーターをシャットダウンしてみてください:

```bash
sudo xcrun simctl shutdown all
```

その後、テストを再度実行してみてください。Tricentis Mobile Agentが自動的にシミュレーターを起動します。

### Androidデバイス接続の問題

AndroidデバイスをTricentis Mobile Agentに接続する際に問題がある場合は、デバイスの開発者オプションに移動し、以下の設定を有効にしてください:

- 権限の監視を無効にする(オプション)
- USB構成の選択で、MTPまたはファイル転送を選択します。
- 下にスクロールして、ウィンドウアニメーションスケール、トランジションアニメーションスケール、およびアニメーター継続時間スケールのアニメーションをオフにします。
- USBケーブルをAndroidデバイスに接続するときは、次の操作を実行してください:
  - デバイスデータへのアクセスを許可し、YESを選択します。
  - USBデバッグを許可し、OKを選択します。

ミラーリングまたは記録がまだ機能しない場合は、開発者オプションに移動し、信頼できるコンピューターをクリアし、プラグを抜いて再接続してください。

### AndroidデバイスでのUI Automatorクラッシュ

UI Automatorは、インストールされているすべてのアプリケーションで機能的なUIテストを行うためのAndroidテストフレームワークです。Androidデバイスの実行中にUI Automatorに関連する問題が発生した場合は、使用している自動化ツールの電源制限を確認してください。

Androidデバイスのパフォーマンスを向上させるには、以下のアプリケーションで最適化を無効にしてください:

- テスト対象のアプリケーション
- Android System WebView(WebViewを使用するアプリケーション用)
- Appium Settings
- Application Installer
- Automation Test
- Chrome(モバイルでのWebテスト用)
- io.appium.uiautomator2.server
- io.appium.uiautomator2.server.test
