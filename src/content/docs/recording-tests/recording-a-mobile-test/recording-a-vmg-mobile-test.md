---
title: VMG を使用したモバイルテストの記録
description: >-
  Virtual Mobile Grid を使用してモバイルテストを記録する手順について説明します。Enhanced mode と Appium
  mode の両方に対応しています。
category: テストの記録
order: 3005
updated: '2025-09-19'
sourceUrl: 'https://docs.tricentis.com/testim/content/recording-tests/recording-a-mobile-test/recording-a-vmg-mobile-test.htm'
keywords:
  - VMG
  - Virtual Mobile Grid
  - モバイルテスト記録
  - Enhanced mode
  - Appium mode
  - iOS
  - Android
---

Virtual Mobile Grid は特別な統合を必要としません。有料ユーザーのライセンスに含まれています。ただし、Community ライセンスユーザーは、Company Owner または Project Owner として無料トライアルに登録できます。無料トライアルが開始されると、Virtual Mobile Grid は[Device Management](/docs/device-management/view-local-connected-mobile-devices)ですぐに利用可能になります。無料トライアル期間中は、さまざまな仮想デバイス（Android と iOS）が利用できます。

## モード

記録は以下のモードのいずれかで実行できます:

- **Enhanced mode（推奨）** - Testim の新しい Enhanced mode は、Appium ベースのテストと比較して、より安定した、高速で、より汎用性の高いテストを提供します。ゼロ知識アプローチと統一 API により、新しい Enhanced mode は、市場の他のツールよりもモバイルビューの構造をよく理解します。このモードは、すべてのモバイルアプリケーション（ネイティブ、ハイブリッド、またはクロスプラットフォームフレームワーク）でのテストをサポートします。このモードで記録されたテストは VMG 上でのみ実行できます。詳細については、[Enhanced Mode (Mobile)](/docs/overview/testim-overview/enhanced-mode-mobile) を参照してください。

- **Appium mode** - このモードは、他の Appium ベースのグリッドとのテストの互換性を保証し、ローカルデバイスでのローカル実行をサポートします。一方、このモードは Appium の機能に制限されており、特にハイブリッドアプリや WebView を使用している場合、すべてのテストフローを記録できない可能性があります。既存のテストは、Appium 互換モードを使用している場合でも引き続き動作します。

## 開始する前に

開始する前に、以下を確認してください:

- **モバイルテストプロジェクト** - モバイルテストには、Web テストプロジェクトとは別のモバイルテストプロジェクトが必要です。既存のモバイルプロジェクトがない場合は、Tricentis サポートにお問い合わせください。

:::warning{title="注意"}
各プロジェクトは単一のモバイルオペレーティングシステムに割り当てられます。異なるオペレーティングシステムでテストを作成/実行するには、別のプロジェクトが必要です。例えば、プロジェクトが Android 用に作成された場合、iOS デバイス用のテストを作成することはできません。
:::

- **Virtual Mobile Grid** - Virtual Mobile Grid は特別な統合を必要としません。有料ユーザーのライセンスに含まれています。ただし、Community ライセンスユーザーは、Company Owner または Project Owner として無料トライアルに登録できます。無料トライアル期間中は、さまざまな仮想デバイス（Android と iOS）が利用できます。詳細については、[Virtual Mobile Grid](/docs/integrations/grid-management/virtual-mobile-grid) を参照してください。

:::info
**無料トライアルの制限** 無料トライアルには以下の制限が適用されます: 並列化なし 実行時間は 10 分に制限 1 時間に 1 回のみ実行可能 追加機能が必要な場合は、Tricentis 担当者にお問い合わせください。
:::

- **アプリケーション要件** -
  - **Enhanced Mode** - 以下の要件が適用されます:
    - ネイティブアプリ - Android デバイスの場合は Java または Kotlin アプリ。iOS デバイスの場合は Objective C または Swift。
    - WebView を含むネイティブアプリ
    - React Native アプリ
    - Flutter アプリ
  - **Appium Mode** - このモードでは、ネイティブアプリのみがサポートされます。Android デバイスの場合は Java または Kotlin アプリ。iOS デバイスの場合は Objective C または Swift。

## モバイルテストの記録

モバイルデバイスでテストを記録して、後で手動または自動で実行できます。テスト中は、1 つのデバイスから 1 つのアプリケーションのみを記録できます。ただし、テストを再生する際には、記録に使用したデバイスとは別のデバイスで同じテストを実行できます。

:::info
**仮想/物理デバイスでの記録** Virtual Mobile Grid 上で提供される仮想デバイスなど、仮想デバイスで記録されたテストは、仮想デバイスでのみ実行できます。物理デバイスで記録されたテストは、物理デバイスでのみ実行できます。
:::

**モバイルテストを記録するには:**

1. Dashboard 画面から **New Test** ボタンをクリックします。

![新しいテスト](/images/recording-tests/recording-a-vmg-mobile-test/5302733-new_test.png)

2. アクションメニューの **Record** ボタンをクリックして、テストの記録を開始します。
3. Select a device ダイアログで、**Virtual Mobile Grid** が選択されていることを確認します。
4. 以下のいずれかを実行します:

5. [Enhanced Mode (Mobile)](/docs/overview/testim-overview/enhanced-mode-mobile) を使用するには、**Enhanced mode** タブを選択します。

![Enhanced mode タブ](/images/recording-tests/recording-a-vmg-mobile-test/ea12c91-enhancedmodetab.png)

6. Appium mode を使用するには、**Appium mode** タブを選択します。

![Appium mode タブ](/images/recording-tests/recording-a-vmg-mobile-test/92b7695-appiummodetab.png)

7. ドロップダウンメニューから目的の **Device** と **OS Version** を選択します。

8. 以下のいずれかの方法でテストするアプリケーションを選択します:

9. **ライブラリからアプリを使用する** - **From Library** をクリックし、目的のアプリケーションに移動して選択します。**Done** をクリックして完了します。

10. **アプリをアップロード** - **Upload App** をクリックし、指定された領域に .apk ファイルをドラッグするか、クリックしてファイルエクスプローラーを開いてファイルを見つけます。

:::info
**アプリコンパイルの互換性（iOS のみ）** 仮想デバイスを使用してテストを記録する場合は、アプリが仮想デバイス用にコンパイルされていること（.app）を確認してください。逆に、物理デバイスを使用して記録する場合は、アプリが物理デバイス用にコンパイルされていること（.ipa）を確認してください。詳細については、[How to Prepare a .ipa for Mobile Testing](/docs/recording-tests/recording-a-mobile-test/how-to-prepare-an-ipa-for-mobile-testing) を参照してください。
:::

:::info
Virtual Mobile Grid でテストを実行する場合、テストの開始には約 30 秒から 1 分かかる場合があります。これは、VMG が新しい仮想デバイスを pristine デバイスイメージから作成し、アプリをインストールするのに必要な時間です。
:::

:::warning{title="注意"}
各テストは単一のアプリケーションとのみ対話できます。
:::

11. **Done** をクリックします。

12. AUT (Application Under Test) Mirroring Viewer が開き、開かれたテスト対象アプリケーションが表示されます。ビューアを使用すると、デバイスを表示し、テスト対象アプリケーションと対話できます。その間、Testim はアクションを記録します。サポートされているモバイルアクションを参照してください。

![記録](/images/recording-tests/recording-a-vmg-mobile-test/90125a4-recording2.gif)

:::warning
テストを記録するときは、安定性を高めるために、テキスト要素を選択し、外側のフレーム、画像、アイコンを避けるようにしてください。
:::

![要素選択の例](/images/recording-tests/recording-a-vmg-mobile-test/b4b47b7-image_20.png)

9. 記録を停止するには、**Stop Recording** ボタンをクリックするか、Viewer ウィンドウを閉じます。

![記録停止](/images/recording-tests/recording-a-vmg-mobile-test/92a68f8-stoprecording.png)

10. Setup ステップの **Show Properties** ボタンをクリックします。

![プロパティ表示](/images/recording-tests/recording-a-vmg-mobile-test/ca97285-showproperties.png)

11. Properties ペインで、以下の設定を構成します:

![テスト構成](/images/recording-tests/recording-a-vmg-mobile-test/4d9063d-testconfiguration.png)

- **Test name** - テストの名前を入力します。デフォルトでは、テスト名は "untitled test" です。
- **Description** - オプションでテストの説明を入力します。
- **Configuration** - デフォルトでは、構成は VMG で利用可能な任意のデバイスと任意の OS バージョンを使用するように設定されています。別の構成を使用する場合は、[Setting the Test Configuration](/docs/recording-tests/recording-a-mobile-test/setting-the-test-configuration) を参照してください。
- **Test Data** - JavaScript でデータセットを定義するか、オブジェクトの JS Array リテラルで複数の順序付きデータセットを定義することにより、データ駆動型テストを構成できます。[Configuring a Data-driven Test From The Visual Editor](/docs/advanced-editing/data-driven-testing/configuring-a-data-driven-test-from-the-visual-editor) を参照してください。

12. **Save** をクリックしてテストを保存します。

:::warning
**自動リカバリ** 新しいテストを作成したり、既存のテストに変更を加えたりする場合は、必ずテストを保存してください。しかし、心配しないでください。テストを保存する前にブラウザを閉じても、ブラウザのキャッシュに保存されるため、作業を再開できるはずです。詳細については、[Recovering a test that was not saved](/docs/editing-tests/recovering-a-test-that-was-not-saved) を参照してください。
:::

13. 追加のテスト構成設定を構成する場合は、[Setting the Test Configuration](/docs/recording-tests/recording-a-mobile-test/setting-the-test-configuration) を参照してください。

## サポートされているモバイルアクション

テストの記録中に AUT Viewer を使用する際に、現在サポートされているアクションは以下のとおりです:

- **Tap** - ユーザーがモバイルデバイス画面上の要素をタップすることをシミュレートします。このステップを作成するには、記録中に AUT Viewer 画面でマウスをクリックします。
- **Swipe Vertical** - ユーザーが画面を垂直方向に押してドラッグすることをシミュレートします。このステップを作成するには、マウスをクリックし、カーソルを垂直方向にドラッグしてマウスボタンを離します。
- **Swipe Horizonal** - ユーザーが画面を水平方向に押してドラッグすることをシミュレートします。このステップを作成するには、マウスをクリックし、カーソルを水平方向にドラッグしてマウスボタンを離します。
- **Set Custom Text** - ユーザーがアプリのテキストフィールドにテキストを入力することをシミュレートします。テキスト要素の上にマウスを置くと、要素が赤色で強調表示されます。テキスト要素をクリックすると、Set Custom Text ウィンドウが開きます。フィールドに目的のテキストを入力し、Send ボタンをクリックします。

## 追加のステップの追加とプロパティの編集

記録中またはテストが保存された後、事前定義されたステップを追加したり、一部またはすべてのステップのプロパティを編集したりできます。\
一般的なステップのプロパティについて詳しく知るには、[Editing a Step's Properties](/docs/editing-tests/editing-your-tests/editing-a-steps-properties) を参照してください。

## サポートされている事前定義済みモバイルアクション

テストの記録中または記録後に手動でステップを追加する際に、現在サポートされているアクションは以下のとおりです:

- [Validate email](/docs/advanced-editing/validations/email-validation) - Testim は、永続的および一時的な電子メールアドレスを提供する組み込みの電子メールサービスを提供します。Validate email ステップは、これらの電子メールアドレスを使用して、アプリのサインアップまたはログインフローをテストできます。
- [Validate element visible](/docs/advanced-editing/validations/validate-element-visible) - 要素の可視性検証により、要素が存在し、ページに表示されているかどうかを確認できます。要素に可変の画像またはテキストが含まれている場合でも、検証は機能します。この検証は、要素が存在し表示されていることを確認しますが、その特定のコンテンツはチェックしません。
- [Validate element text](/docs/advanced-editing/validations/validate-element-text) - 要素テキスト検証は、特定の要素の存在に依存するという点で、要素可視性検証と似ています。ただし、要素テキスト検証では、指定された要素に表示される必要がある特定のテキスト値も指定します。
- [Wait for element visible](/docs/advanced-editing/wait-for#要素の表示を待つ（モバイル）) - 要素がページに表示されるまで待機するために使用します。
- [Wait for element text](/docs/advanced-editing/wait-for) - テストを続行する前に特定のテキストが表示されることを確認するために使用します。
- [Sleep](/docs/advanced-editing/wait-for) - ステップ間で一定時間待機できます。 - [Add extract value step](/docs/advanced-editing/extract-text) - アプリケーションから直接値をコピーして、後のステップで使用できます。
- **Add set text step** - 選択したターゲット要素に指定されたテキストを追加します。
- **Code verification** - デバイスにキーストロークを送信します。通常、ワンタイムパスワードコード要素などのコード検証要素を入力するために使用されます。文字間に遅延を追加することも可能です。
- [Generate email address](/docs/advanced-editing/validations/email-validation#テストの関連ステップで恒久的メールを使用する) - テストを実行するたびに使用する新しいランダムなメールアドレスを生成します。
- [Add CLI action](/docs/advanced-editing/validations/add-cli-validations-and-actions) - CLI 環境でカスタム Node.js スクリプトを実行します。
- [Add API action](/docs/advanced-editing/api-testing#adding-an-api-action-step) - API 呼び出しから返されるデータを取得する場合に使用します。

:::info
Add CLI action および/または Add API action ステップを使用してカスタムコードを実行する前に、[Testim CLI](/docs/running-tests/the-command-line-cli) を実行する必要があります。
:::

- [Generate random value](/docs/editing-tests/generating-a-random-value) - 動的データテストのランダム値を生成します。
- [Generate date](/docs/editing-tests/generating-a-date) - 事前定義されたプロパティに従って日付を生成します。
- **Reset app** - Android では、このステップはアプリケーションを閉じ、キャッシュをクリアしてから、アプリを再起動します。iOS では、このステップはアプリケーションを閉じて起動します（キャッシュはクリアしません）。通常、次回実行前にアプリをリセットしてキャッシュをクリアするために使用されます。
- **Back** - デバイスに戻るコマンドを送信します。Android のみでサポートされています。
- **Scroll to element text** - 選択したテキスト要素に動的にスクロールします。
- [Execute Driver Script Step (mobile)](/docs/advanced-editing/custom-action-step-mobile) - Execute Driver Script ステップを使用すると、拡張機能と検証のために Appium 2.0 以上を使用してスクリプトを実行できます。
