---
title: 'モバイルテスト入門'
description: 'TestimのVirtual Mobile GridとEnhanced Modeを使ってモバイルアプリのテストを記録し、デバイス選択から実行、結果確認までの一連の流れと注意点を学べるチュートリアルです。'
category: 'はじめに'
order: 3
updated: 'about 2 months ago'
keywords:
  - モバイルテスト
  - Virtual Mobile Grid
  - Enhanced Mode
  - モバイル記録
  - テスト結果
  - デバイステスト
  - iOS
  - Android
  - 仮想デバイス
  - AUT Viewer
---

このチュートリアルでは、[Virtual Mobile Grid](/docs/virtual-mobile-grid)を使ってモバイルアプリのテストを行う方法を学びます。新しいテストの作成、**Virtual Mobile Grid** からのデバイス選択、テスト対象アプリの指定、テストの記録、そして実行までの手順を順番に確認します。テストは[Enhanced モード](/docs/enhanced-mode-mobile)で記録します。Appium ベースのテストと比べて安定性・速度・柔軟性が向上します。このチュートリアルはすべてのオプションを網羅するものではなく、最初から最後までの一連の流れを具体的なシナリオで紹介します。

:::warning
マルチスクリーン端末（フォルダブル端末やフリップ端末など）には現在対応していません。
:::

## 始める前に

以下を準備しておきましょう。

- **モバイルテスト用プロジェクト** — モバイルテストは Web テスト用プロジェクトとは別のプロジェクトが必要です。まだモバイルプロジェクトがない場合は Tricentis サポートに連絡してください。

:::info
各プロジェクトには単一のモバイル OS が割り当てられます。異なる OS でテストを作成・実行するには別のプロジェクトが必要です。たとえば Android 用に作成されたプロジェクトでは iOS 端末向けテストを作成できません。
:::

- **Virtual Mobile Grid（VMG）** — VMG の利用に特別な統合作業は不要です。有償ライセンスには VMG が含まれます。Community ライセンスの場合は、会社オーナーまたはプロジェクトオーナーが無料トライアルに申し込めます。トライアル期間中は複数の仮想デバイス（Android / iOS）が利用可能です。詳細は[Virtual Mobile Grid](/docs/virtual-mobile-grid)を参照してください。

:::info
**無料トライアルの制限**

- 並列実行は不可
- 実行時間は最大 10 分
- 実行は 1 時間に 1 回まで

追加の機能が必要な場合は Tricentis の担当者にお問い合わせください。
:::

- **アプリケーション要件** — この入門ガイドでは[Enhanced Mode (Mobile)](/docs/enhanced-mode-mobile)のみを使用するため、次の要件を満たす必要があります。
  - ネイティブアプリ: Android は Java または Kotlin、iOS は Objective-C または Swift
  - WebView を含むネイティブアプリ
  - React Native アプリ
  - Flutter アプリ

## モバイルテストの記録

モバイルデバイスでテストを記録しておけば、後で手動または自動で再実行できます。記録時に対象とできるアプリは 1 つのデバイス上の単一アプリに限られますが、再生時には記録したデバイス以外のデバイスでも同じテストを実行できます。

:::info
Enhanced モードは VMG でのみ利用できます。

- Enhanced モードで記録したテストは VMG の仮想デバイスでのみ実行できます。
- Appium 互換モードで記録したテストはローカルデバイス、外部グリッド、VMG を含む物理／仮想デバイスで実行できます。
:::

### モバイルテストを記録する手順

1. ダッシュボード画面で **New Test** をクリックします。
2. アクションメニューの **Record** をクリックして記録を開始します。
3. テストで使用するデバイスを選択します。このチュートリアルでは Virtual Mobile Grid の仮想デバイスを使用します。**Virtual Mobile Grid** を選択し、**Device** でデバイス、**OS Version** で OS バージョンを選び、**Next** をクリックします。
4. テスト対象の **Application** を選択します。このチュートリアルでは **Demo App** カテゴリから Wikipedia アプリを使用します。**Demo App** をクリックし、目的のアプリを選択して **Done** をクリックします。

:::info
VMG でテストを実行する場合、テストの起動には 30 秒から 1 分ほどかかることがあります。VMG がクリーンなデバイスイメージから仮想デバイスを作成し、アプリをインストールするための時間です。
:::

![VMG でのテスト起動](/images/getting-started/creating-your-first-mobile-test-in-testim-visual-editor/5d1fd00-gettingstedvid.gif)

:::info
各テストで操作できるアプリは 1 つだけです。
:::

5. **AUT (Application Under Test) Mirroring Viewer** が表示され、テスト対象のアプリが開きます。Viewer でデバイス画面を確認しながら操作すると、その内容が Testim に記録されます。

![AUT Viewer](/images/getting-started/creating-your-first-mobile-test-in-testim-visual-editor/8429769-gettingstartedwithoutblue.gif)

:::warning
テストを記録する際は、外枠や画像・アイコンではなく、できるだけテキスト要素を選択すると安定性が高まります。
:::

![操作対象の強調表示例](/images/getting-started/creating-your-first-mobile-test-in-testim-visual-editor/b4b47b7-image_20.png)

6. 記録を停止するには **Stop Recording** ボタンをクリックするか、Viewer ウィンドウを閉じます。

![Stop Recording ボタン](/images/getting-started/creating-your-first-mobile-test-in-testim-visual-editor/92a68f8-stoprecording.png)

7. **Setup** ステップをクリックし、**Test Name** と **Test Description** を入力します。

![Setup ステップ](/images/getting-started/creating-your-first-mobile-test-in-testim-visual-editor/9bad4a3-setupstep.png)

8. **Save** をクリックしてテストを保存します。

### サポートされているモバイルアクション

テストを記録している間に AUT Viewer で使用できるアクションは次のとおりです。

- **Tap** — モバイル端末の画面上で要素をタップする操作を再現します。記録中に AUT Viewer の画面でクリックするとこのステップが作成されます。
- **Swipe Vertical** — 画面を縦方向にドラッグする操作を再現します。マウスをクリックし、縦方向にドラッグしてから離します。
- **Swipe Horizontal** — 画面を横方向にドラッグする操作を再現します。マウスをクリックし、横方向にドラッグしてから離します。
- **Set Custom Text** — アプリ内のテキストフィールドへ文字を入力する操作を再現します。テキスト要素にカーソルを合わせると赤枠でハイライトされます。クリックすると **Set Custom Text** ウィンドウが開くので、入力したいテキストを入力し **Send** をクリックします。

![Set Custom Text の例](/images/getting-started/creating-your-first-mobile-test-in-testim-visual-editor/d9a3899-image_19.png)

## モバイルテストの実行

テストを作成したら、Testim が記録済みのステップを自動で再現してくれます。

:::info
**Enhanced モードでの実行**

Enhanced モードで記録したテストは Enhanced モードでのみ実行できます。Appium モードで実行したい場合は、Appium 互換モードで再度記録してください。
:::

### Testim エディタでモバイルテストを実行する

### テストエディタでモバイルテストを実行する手順

1. **Test List** に移動し、実行したいテストを選択します。

![Test List](/images/getting-started/creating-your-first-mobile-test-in-testim-visual-editor/5cf3463-test-list.png)

2. アクションメニューの **Run** ボタンをクリックします。

   ![Run ボタン](/images/getting-started/creating-your-first-mobile-test-in-testim-visual-editor/2222b37-runtest4.png)

3. テストを実行するデバイスを選択します。Enhanced モードで記録したテストは VMG 上のデバイスでのみ実行できます。
4. **Done** をクリックします。

デバイスビューアが開き、テストのアクションが実行されます。完了するとポップアップにテストの成功可否が表示されます。

![実行中のデバイスビューア](/images/getting-started/creating-your-first-mobile-test-in-testim-visual-editor/2278ec8-runtest2.png)

## テスト結果の確認

Testim エディタ画面ではテスト結果を確認できます。テストの上部に合否（Passed / Failed）が表示され、各ステップ上部のカラーアイコンで結果がわかります。

![テスト結果の概要](/images/getting-started/creating-your-first-mobile-test-in-testim-visual-editor/8103c68-runtest3.png)

特定のアクションの詳細を確認するには、そのステップをダブルクリックします。該当アクションの結果画面が表示されます。

テストが失敗した場合は、失敗の原因に関する詳細情報が表示されます。

![失敗時の結果例](/images/getting-started/creating-your-first-mobile-test-in-testim-visual-editor/3cdb29d-Test_failed.png)
