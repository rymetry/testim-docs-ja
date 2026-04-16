---
title: ローカルデバイスを使用したモバイルテストの記録
description: 物理デバイスまたは仮想デバイス（iOS/Android）を使用してローカル環境でモバイルテストを記録する方法について説明します。
category: テストの記録
order: 3006
updated: '2025-09-19'
sourceUrl: 'https://docs.tricentis.com/testim/content/recording-tests/recording-a-mobile-test/recording-a-local-mobile-test.htm'
keywords:
  - ローカルモバイルテスト
  - TMA
  - 物理デバイス
  - 仮想デバイス
  - iOS
  - Android
  - Tricentis Mobile Agent
---

モバイルテストは、物理デバイスおよび仮想デバイス（iOS/Android）の両方でローカル環境での記録と実行が可能です。記録自体は、Windows、Mac、または Linux コンピューターで Web ブラウザを使用して実行できます。モバイルテストを記録すると、Testim は各アクションをテストステップに変換し、Testim Visual Editor の画面に表示します。ただし、[テストの編集](/docs/editing-tests/editing-your-tests)により、テストに追加のステップを手動で追加することもできます。テストは[テストライブラリ](/docs/test-management/test-list)に追加され、いつでも実行できます。

:::warning{title="警告"}
マルチスクリーンデバイス（折りたたみ式/フリップ式電話など）は現在サポートされていません。
:::

## 開始する前に

開始する前に、以下の準備が必要です:

- **モバイルテストプロジェクト** - モバイルテストには、Web テストプロジェクトとは別のモバイルテストプロジェクトが必要です。既存のモバイルプロジェクトがない場合は、Tricentis サポートにお問い合わせください。

:::info{title="情報"}
各プロジェクトは単一のモバイルオペレーティングシステムに割り当てられます。異なるオペレーティングシステムでテストを作成/実行するには、別のプロジェクトが必要です。例えば、プロジェクトが Android 用に作成された場合、iOS デバイス用のテストを作成することはできません。
:::

- **Tricentis Mobile Agent** - Testim でモバイルテストを作成および実行するには、Tricentis Mobile Agent（TMA）をインストールする必要があります。このエージェントは、ワークステーションに接続された物理デバイス（携帯電話やタブレットなど）およびワークステーション上で実行されるシミュレーター/エミュレーターを管理します。TMA をインストールし、Testim に接続し、デバイスを構成する方法については、[Tricentis Mobile Agent の構成](/docs/recording-tests/recording-a-mobile-test/configure-tricentis-mobile-agent)を参照してください。

:::info{title="情報"}
ローカルモバイルテストを実行したい各ユーザーは、自分のコンピューターに Tricentis Mobile Agent をインストールして構成する必要があります。
:::

- **テストするアプリケーション** - Android 用: Java、Kotlin; iOS 用: Objective-C、Swift

## ステップ 1 - TMA に接続する

最初のステップとして、TMA を Testim に接続する必要があります。[Tricentis Mobile Agent の接続](/docs/recording-tests/recording-a-mobile-test/configure-tricentis-mobile-agent#tricentis-mobile-agent-を-testim-に接続する)セクションの手順に従ってください。

## ステップ 2 - デバイスを接続する

## 物理 Android デバイスの接続

Android デバイスを接続するには、以下の要件を満たす必要があります:

- Tricentis Mobile Agent がコンピューターにインストールされ、実行されている。
- デバイスが「デバッグモード」になっている - 以下を参照。
- 以下で説明されているすべてのステップを完了する。

**物理 Android デバイスを接続するには:**

1. 物理 Android デバイスをローカルコンピューターに接続します（例: USB ケーブルを使用して携帯電話を接続）。

:::info{title="情報"}
Android デバイスの場合、デバイスを「デバッグモード」で実行する必要があります - [開発者オプションと USB デバッグを有効にする](https://developer.android.com/studio/debug/dev-options#enable)。デバッグモードを有効にした後、設定 > 開発者オプションに移動し、USB デバッグオプションを有効にします。詳細については、[https://help.testim.io/docs/configure-tricentis-mobile-agent](/docs/recording-tests/recording-a-mobile-test/configure-tricentis-mobile-agent)の関連セクションを参照してください。
:::

Tricentis Mobile Agent がデバイスを認識すると、デバイスがリストに表示されます:

![TMA に接続されたデバイス](/images/recording-tests/recording-a-local-mobile-test/ec4cb63-4db538d-tma-connected-device.png)

## 物理 iOS デバイスの接続

iOS デバイスを接続するには、以下の要件を満たす必要があります:

- Tricentis Mobile Agent がコンピューターにインストールされ、実行されている。
- アクティブな Apple Developer アカウントを持っている。
- 以下で説明されているすべてのステップを完了する。

プロセスの詳細については、以下のビデオチュートリアルを参照してください - [https://www.youtube.com/watch?v=eQqh_PFc6qc&ab_channel=TricentisAcademy](https://www.youtube.com/watch?v=eQqh_PFc6qc&ab_channel=TricentisAcademy) **物理 iOS デバイスを接続するには:**

1. 物理 iOS デバイスをローカルコンピューターに接続します（例: USB ケーブルを使用して携帯電話を接続）。

2. iOS デバイスで、設定に移動し、以下のアクションを実行します:
   - **UI オートメーションを有効にする** - プライバシーとセキュリティ > 開発者設定に移動し、UI オートメーションを有効にするを有効にします。
   - **Web インスペクターを有効にする** - Safari > 詳細設定に移動し、Web インスペクターを有効にします。

3. コンピューター上の Testim で、Tricentis Mobile Agent アイコンをクリックし、TMA コンソールを開くリンクをクリックします。

![TMA コンソールを開く](/images/recording-tests/recording-a-local-mobile-test/5898953-image_12.png)

4. TMA コンソールで、デバイス管理に移動します。

5. **Upload iOS image**をクリックします。

![iOS イメージのアップロード](/images/recording-tests/recording-a-local-mobile-test/8752f3b-2023-01-17_20-29-06.png)

6. デバイスに適した iOS バージョンの iOS イメージを選択します（iOS イメージは[https://github.com/iGhibli/iOS-DeviceSupport/tree/master/DeviceSupport](https://github.com/iGhibli/iOS-DeviceSupport/tree/master/DeviceSupport)からダウンロードできます）。

7. **Upload**をクリックします。

8. Apple Developer アカウントのメンバーシップセクションから、Apple チーム ID を取得します。Apple チーム ID の取得方法については、[https://developer.apple.com/support/](https://developer.apple.com/support/)を参照してください。

9. TMA コンソールで、iOS artifacts に移動します。

10. **Insert Apple team ID**テキストフィールドに、Apple チーム ID を入力します。Apple チーム ID をクリアすると、既存の証明書署名リクエスト（CSR）、証明書、およびプロビジョニングプロファイルも削除されます。

![Apple チーム ID の挿入](/images/recording-tests/recording-a-local-mobile-test/8e15426-2023-01-17_20-38-47.png)

11. 証明書署名リクエスト（CSR）の下で、**Generate new CSR**をクリックし、CSR ファイルをダウンロードします。署名された証明書には有効期限があります。証明書の有効期限が切れた場合は、新しい CSR を作成する必要があります。そうしないと、テストを実行できません。新しい CSR を生成すると、以前の CSR の署名された証明書とプロビジョニングプロファイルが削除されます。

12. 証明書の下で、**Upload**をクリックします。この証明書は、Apple チーム ID と CSR の一致を確認します。証明書は、Tricentis Mobile Agent にアップロードする必要がある.p12 ファイルに保存されます。別の証明書をアップロードすると、既存のプロビジョニングプロファイルが削除されます。

13. プロビジョニングプロファイルの下で、**Upload**をクリックします。

14. エージェント設定に移動します。

15. デバッグモードが有効になっていること（左側のトグル）を確認します。

![デバッグモードの有効化](/images/recording-tests/recording-a-local-mobile-test/b70cd4f-2023-01-17_21-02-30.png)

16. Windows コンピューターを使用している場合は、[iTunes をインストール](https://support.apple.com/downloads/itunes)する必要があります。必ず App Store から iTunes をダウンロードしてください。iTunes のインストール後、コンピューターを再起動し、iOS デバイスを再接続してください。

この時点で、物理デバイスリストの下に iOS デバイスが接続されているのが表示されます。

![接続された iOS デバイス](/images/recording-tests/recording-a-local-mobile-test/1781fa5-image_13.png)

## 仮想 Android デバイスの接続

Android デバイスを接続するには、以下の要件を満たす必要があります:

- Tricentis Mobile Agent がコンピューターにインストールされ、実行されている。
- [Android Studio](https://developer.android.com/studio)などの Android シミュレーター/IDE。
- 以下で説明されているすべてのステップを完了する。

以下の手順では Android Studio を使用していますが、他のソフトウェアも使用できます。**仮想 Android デバイスを接続するには:**

1. Android Studio で、ケバブメニュー（3 つの縦の点）をクリックし、**Virtual Device Manager**をクリックします。

![Virtual Device Manager を開く](/images/recording-tests/recording-a-local-mobile-test/d90fde5-2023-01-18_12-34-52.png)

2. **Create Device**をクリックします。

3. モバイルプラットフォームの[システム要件](https://documentation.tricentis.com/tricentis_mobile_agent/content/user_manual/system_requirements.htm)を満たす希望のデバイス定義を選択します。

4. **Next**をクリックします。

![デバイスの選択](/images/recording-tests/recording-a-local-mobile-test/c1ef05f-2023-01-18_12-59-06.png)

5. オプションでデバイスのパフォーマンスを向上させるには、**Show Advanced Settings**をクリックします。

![詳細設定を表示](/images/recording-tests/recording-a-local-mobile-test/ad142e3-2023-01-18_13-07-10.png)

6. メモリとストレージのパラメーターまでスクロールし、RAM、VM ヒープ、および内部ストレージパラメーターの値を増やします。これにより、実行するコンピューターからより多くのリソースが必要になる場合があることに注意してください。

![メモリとストレージの設定](/images/recording-tests/recording-a-local-mobile-test/4c319fe-2023-01-18_13-12-41.png)

7. **Finish**をクリックします。

構成されたデバイスは、Device Manager 画面で使用可能になります。

8. デバイスを実行するには、Play アイコンをクリックします。

![デバイスの実行](/images/recording-tests/recording-a-local-mobile-test/3f29a39-2023-01-18_13-20-07.png)

デバイスは自動的に Testim の仮想デバイスリストに追加されます。

![仮想デバイスリスト](/images/recording-tests/recording-a-local-mobile-test/6157466-virtualdevice.png)

:::info{title="情報"}
デフォルトでは、仮想デバイスはデバッグモードに事前構成されています。
:::

## 仮想 iOS デバイスの接続

iOS デバイスを接続するには、以下の要件を満たす必要があります:

- Tricentis Mobile Agent がコンピューターにインストールされ、実行されている。
- [Xcode](https://developer.apple.com/xcode/)などの iOS シミュレーター/IDE。Xcode は Mac でのみサポートされています。
- 以下で説明されているすべてのステップを完了する。

:::info{title="情報"}
仮想 iOS デバイスオプションには、Apple Developer アカウントは必要ありません。
:::

以下の手順では Xcode を使用していますが、他のソフトウェアも使用できます。**仮想 iOS デバイスを接続するには:**

1. TMA がインストールされ、現在実行されていることを確認します。

2. Xcode がインストールされていることを確認します。インストールされていない場合は、[Mac App Store](https://apps.apple.com/us/app/xcode/id497799835?mt=12)からダウンロードしてください。

3. Xcode で、メインメニューから**Xcode > Open developer tool > Simulator**に移動します。

![Simulator を開く](/images/recording-tests/recording-a-local-mobile-test/f695d02-image_21.png)

Simulator ソフトウェアがシステムトレイで開きます。

4. Simulator アイコンを右クリックし、**Device**を選択し、リストから希望のデバイスを選択します。

![デバイスの選択](/images/recording-tests/recording-a-local-mobile-test/bae9199-image_22.png)

デバイスは自動的に Testim の仮想デバイスリストに追加されます。

![仮想デバイスリスト](/images/recording-tests/recording-a-local-mobile-test/36444cd-image_23.png)

## ステップ 3 - テストするアプリケーションを準備する

テストを作成する際、テストで使用するアプリを選択する必要があります。各テストには 1 つのアプリのみを含めることができます。アプリは次の 3 つの方法でテストに使用できます:

- **ローカルデバイスアプリ** - 接続されたデバイス（物理デバイスまたは仮想デバイス）上のアプリの 1 つを使用できます。これらのアプリは、デバイスが TMA に接続されている場合にテストで使用できます。

- **モバイルアプリライブラリ** - モバイルアプリライブラリの既存のアプリを使用できます。この場合、他のユーザーはローカルデバイスにアプリがインストールされていなくても、共通のアプリをテストに使用できます。[ローカルコンピューターからモバイルアプリを追加する](/docs/mobile-apps/mobile-apps#ローカルコンピューターからモバイルアプリを追加する)セクションの手順に従って、テストを記録する前にアプリを追加することもできます。モバイルアプリライブラリでアプリを管理する方法の詳細については、[モバイルアプリ](/docs/mobile-apps/mobile-apps)を参照してください。

- **アプリのアップロード** - テスト作成の一部として、アプリをアップロードできます。

:::info{title="アプリコンパイルの互換性（iOS のみ）"}
仮想デバイスを使用してテストを記録する場合は、アプリが仮想デバイス用にコンパイルされていること（.app）を確認してください。逆に、物理デバイスを使用して記録する場合は、アプリが物理デバイスで動作するようにコンパイルされていること（.ipa）を確認してください。詳細については、[モバイルテスト用 IPA の準備方法](/docs/recording-tests/recording-a-mobile-test/how-to-prepare-an-ipa-for-mobile-testing)を参照してください。
:::

## ステップ 4 - テストを記録する

モバイルデバイスでテストを記録して、後で自動的に実行できます。テスト中は、1 つのデバイスから 1 つのアプリケーションのみを記録できます。ただし、テストを再生する際には、記録に使用したデバイスとは別のデバイスで同じテストを実行できます。**モバイルテストを記録するには:**

1. Tricentis Mobile Agent インジケーターが緑色であることを確認して、物理デバイスまたは仮想デバイスが接続されていることを確認します。

2. ダッシュボード画面から**New Test**ボタンをクリックします。

![New Test ボタン](/images/recording-tests/recording-a-local-mobile-test/ec1bda0-image.png)

3. テストの記録を開始するには、アクションメニューの**Record**ボタンをクリックします。

![Record ボタン](/images/recording-tests/recording-a-local-mobile-test/202f05d-image_1.png)

4. **Local Devices**を選択し、リストに表示されている物理デバイスまたは仮想デバイスの 1 つを選択します。

![Local Devices の選択](/images/recording-tests/recording-a-local-mobile-test/9fa3145-image_3.png)

5. **Next**をクリックして続行します。

6. 以下のオプションを使用して、テストするアプリケーションを選択します:
   - **From library** - このオプションを選択して、モバイルアプリライブラリの既存のアプリの 1 つを使用し、リストから関連するアプリを選択します。

:::info{title="情報"}
各テストは 1 つのアプリケーションとのみ対話できます。モバイルアプリライブラリから選択したアプリがインストールされていないデバイスでテストを記録している場合、アプリは自動的にローカルデバイスにインストールされます。
:::

- **From device** - このオプションを選択して、接続されたデバイスの既存のアプリを使用し、リストから関連するアプリを選択します。

:::info{title="記録後のデバイス変更"}
記録後にデバイスを変更する場合、選択したアプリを追加の記録または再生を実行するためにデバイスにインストールする必要があります。
:::

- **Upload app** - このオプションを選択して、ローカルコンピューターから[モバイルアプリ](/docs/mobile-apps/mobile-apps)ライブラリに新しいアプリを追加します。サポートされるファイル形式は、Android デバイス向けの `.apk` ファイル（Java または Kotlin フレームワークベース）と iOS デバイス向けの `.ipa` ファイル（Objective C または Swift フレームワークベース）です。アップロードサイズは最大 150 MB までに制限されています（これを超えるファイルをアップロードしたい場合は、Tricentis サポートまでお問い合わせください）。

7. **Done**をクリックして終了します。

8. テスト対象のアプリケーションが開いた[AUT ミラーリングビューアー](/docs/recording-tests/recording-a-mobile-test/mobile-test-editor)が表示されます。ビューアーを使用すると、デバイスを表示してテスト対象のアプリケーションと対話できます。Testim はアクションを記録します。サポートされているアクションの詳細については、以下の[**サポートされているモバイルアクション**](#サポートされているモバイルアクション)セクションを参照してください。

:::info{title="情報"}
テストステップは、AUT ミラーリングビューアーでアクションを実行することによってのみ記録されます。デバイスで直接アクションを実行しても、テストステップは記録されません。
:::

![モバイルテストの記録](/images/recording-tests/recording-a-local-mobile-test/4ef00e8-mobiletestingv2.gif)

:::warning{title="重要なお知らせ"}
テストを記録する際は、安定性を向上させるために、テキスト要素を選択し、外枠、画像、アイコンを避けるようにしてください。

![要素の選択](/images/recording-tests/recording-a-local-mobile-test/4f44670-image_20.png)

:::

9. 記録を停止するには、**Stop Recording**ボタンをクリックするか、ビューアーウィンドウを閉じます。

![記録の停止](/images/recording-tests/recording-a-local-mobile-test/3e199cb-image_7.png)

10. プロパティペインで、以下の設定を構成します:

![テスト構成](/images/recording-tests/recording-a-local-mobile-test/4d9063d-testconfiguration.png)

- **Test name** - テストの名前を入力します。デフォルトでは、テスト名は「untitled test」です。
- **Description** - オプションで、テストの説明を入力します。
- **Configuration** - デフォルトでは、構成は VMG で使用可能な任意のデバイスと任意の OS バージョンを使用するように設定されています。別の構成を使用する場合は、[テスト構成の設定](/docs/recording-tests/recording-a-mobile-test/setting-the-test-configuration)を参照してください。
- **Test Data** - JavaScript でデータセットを定義するか、オブジェクトの JS 配列リテラルで複数の順序付きデータセットを定義することで、データ駆動テストを構成できます。[Visual Editor からのデータ駆動テストの構成](/docs/advanced-editing/data-driven-testing/configuring-a-data-driven-test-from-the-visual-editor)を参照してください。

11. **Save**をクリックしてテストを保存します。

:::warning{title="自動復旧"}
新しいテストを作成したり既存のテストに変更を加えたりするときは、必ずテストを保存してください。ただし、心配しないでください。テストを保存する前にブラウザを閉じた場合でも、テストはブラウザのキャッシュに保存されているため、作業を再開できます。詳細については、[保存されなかったテストの復旧](/docs/editing-tests/recovering-a-test-that-was-not-saved)を参照してください。
:::

12. 追加のテスト構成設定を構成する場合は、[テスト構成の設定](/docs/recording-tests/recording-a-mobile-test/setting-the-test-configuration)を参照してください。

### サポートされているモバイルアクション

テストの記録中に AUT ビューアーを使用する際、以下のアクションが現在サポートされています:

- **Tap** - モバイルデバイス画面上の要素をユーザーがタップするのをシミュレートします。このステップを作成するには、記録中に AUT ビューアー画面でマウスをクリックします。

- **Swipe Vertical** - ユーザーが画面を縦方向に指を押してドラッグするのをシミュレートします。このステップを作成するには、マウスをクリックし、カーソルを縦方向にドラッグし、マウスボタンを離します。

- **Swipe Horizonal** - ユーザーが画面を横方向に指を押してドラッグするのをシミュレートします。このステップを作成するには、マウスをクリックし、カーソルを横方向にドラッグし、マウスボタンを離します。

- **Set Custom Text** - ユーザーがアプリのテキストフィールドにテキストを入力するのをシミュレートします。テキスト要素にマウスをホバーすると、要素が赤色で強調表示されます。テキスト要素をクリックすると、Set Custom Text ウィンドウが開きます。フィールドに希望のテキストを入力し、**Send**ボタンをクリックします。

![カスタムテキストの設定](/images/recording-tests/recording-a-local-mobile-test/f316ba0-image_19.png)

## ステップ 5 - 追加のステップを追加してプロパティを編集する

記録中またはテスト保存後に、追加の事前定義されたステップを追加したり、一部またはすべてのステップのプロパティを編集したりできます。一般的なステッププロパティの詳細については、[ステップのプロパティの編集](/docs/editing-tests/editing-your-tests/editing-a-steps-properties)を参照してください。

## サポートされている事前定義済みモバイルアクション

テストの記録中または記録後にステップを手動で追加する際、以下のアクションが現在サポートされています:

- **[Validate email](/docs/advanced-editing/validations/email-validation)** - Testim は、永続的および一時的なメールアドレスを提供する組み込みのメールサービスを提供しています。Validate email ステップは、これらのメールアドレスを使用して、アプリのサインアップまたはログインフローをテストできます。

- **[Validate element visible](/docs/advanced-editing/validations/validate-element-visible)** - 要素の可視性検証により、要素が存在し、ページに表示されているかどうかを確認できます。要素に可変の画像またはテキストが含まれている場合でも、検証は機能します。この検証は、要素が存在し表示されていることを確認しますが、その特定のコンテンツはチェックしません。

- **[Validate element text](/docs/advanced-editing/validations/validate-element-text)** - 要素テキスト検証は、要素の存在に依存するという点で要素可視性検証に似ています。ただし、要素テキスト検証では、指定された要素に表示される必要がある特定のテキスト値も指定します。

- **[Wait for element visible](/docs/advanced-editing/wait-for#要素の表示を待つ（モバイル）)** - wait for element visible を使用して、要素がページに表示されるまで待機します。

- **[Wait for element text](/docs/advanced-editing/wait-for#要素の表示を待つ（モバイル）)** - wait for element text を使用して、テストを続行する前に特定のテキストが表示されることを確認します。

- **[Sleep](/docs/advanced-editing/wait-for#要素の表示を待つ（モバイル）)** - ステップ間で一定期間待機できるようにします。 - **[Add extract value step](/docs/advanced-editing/extract-text)** - アプリケーションから値を直接コピーして、後のステップで使用できるようにします。

- **Add set text step** - 選択したターゲット要素に指定されたテキストを追加します。

- **Code verification** - デバイスにキーストロークを送信します。これは通常、ワンタイムパスワードコード要素などのコード検証要素を入力するために使用されます。文字間に遅延を追加することも可能です。

- **[Generate email address](/docs/advanced-editing/validations/email-validation#テストの関連ステップで恒久的メールを使用する)** - テストを実行するたびに使用する新しいランダムなメールアドレスを生成します。例えば、毎回新しいユーザーでサインアップフローを複数回テストする場合などです。

- **[Add CLI action](/docs/advanced-editing/validations/add-cli-validations-and-actions)** - CLI 環境でカスタム Node.js スクリプトを実行します。

- **[Add API action](/docs/advanced-editing/api-testing#adding-an-api-action-step)** - API 呼び出しから返されるデータを取得する場合に使用します。このデータを使用して、返されることを確認できます。

:::info{title="情報"}
Add CLI action および/または Add API action ステップを使用してカスタムコードを実行する前に、[Testim CLI](/docs/running-tests/the-command-line-cli)を実行する必要があります。
:::

- **[Generate random value](/docs/editing-tests/generating-a-random-value)** - 動的データテスト用のランダム値を生成します。

- **[Generate date](/docs/editing-tests/generating-a-date)** - 事前定義されたプロパティに従って日付を生成します。

- **Reset app** - Android では、このステップはアプリケーションを閉じ、キャッシュをクリアしてから、アプリを再起動します。iOS では、このステップはアプリケーションを閉じて起動します（キャッシュはクリアしません）。このステップは通常、次回の実行前にアプリをリセットしてキャッシュをクリアするために使用されます。

- **Back** - Back ボタンステップを作成し、デバイスに back コマンドを送信します。Android でのみサポートされています。

- **Home** - Home ボタンステップを作成し、デバイスに home コマンドを送信します。

- **Scroll to element text** - 選択したテキスト要素に動的にスクロールします。

- **[Execute Driver Script Step (mobile)](/docs/advanced-editing/custom-action-step-mobile)** - Execute Driver Script step を使用すると、Appium 2.0 以降を使用してスクリプトを実行し、テストで拡張された機能と検証を行うことができます。
