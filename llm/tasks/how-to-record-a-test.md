# 翻訳タスク (how-to-record-a-test)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

Testim でテストを作成する際は、対象となる Web ページやアプリケーションを開き、テストの基準となるユーザージャーニーを記録します。各ステップのプロパティは後から編集でき、検証ステップを追加することも可能です。

:::info
テストはプロジェクト単位で管理されます。新しいテストを作成すると、開いているプロジェクトに自動的に保存されます。
:::

記録を開始すると、Testim が操作をテストステップに変換し、Visual Editor 画面に順番に表示します。記録したままでも同じ操作が再現できるかを確認できますし、Visual Editor で次のような調整も行えます。

- [ステップの削除・追加・並べ替え](doc:editing-your-tests)
- [条件付きステップの追加](doc:conditions)
- [検証の追加](doc:validation)
- [ステップのグループ化](doc:groups)

:::info
Testim は幅広い Web 技術に対応しており、網羅的なテストが実施できます。一方で、Web 技術の進化は速いため、最新技術への対応が間に合わない場合があります。現在サポート対象外の例としては Lit（[https://lit.dev/](https://lit.dev/)）があります。Testim では対応範囲の拡大に継続的に取り組んでいます。
:::

テストを記録する前に、Testim 拡張機能をインストールしておきましょう。詳しくは [Testim 拡張機能が必要な理由](doc:why-do-you-need-testim-extension) を参照してください。

## ステップ1: 新しいテストを作成する

### 新しいテストを作成する手順

1. **Test List > Tests** に移動します。
2. **Plus (+)** アイコンをクリックし、**New Test** を選択します。

![New Test の作成](/images/recording-tests/how-to-record-a-test/434e889-newtest.png)

ヘッダーバーに表示される **New Test** ボタンから作成することもできます。

![New Test ボタン](/images/recording-tests/how-to-record-a-test/fc58640-new-testtop.png)

新しいテストが Visual Editor で開きます。ここで記録、検証の追加、ステップ編集などを行います。

![デフォルトのテスト画面](/images/recording-tests/how-to-record-a-test/4d00e16-defaulttest.png)

## ステップ2: Base URL を設定する

Base URL は記録開始時に開く初期ページを指定します。詳細は [Base URL](doc:base-url) を参照してください。

:::info
複数ウィンドウを開く操作も記録できます。詳しくは [複数ウィンドウでの記録](doc:multi-windows-recording) を参照してください。
:::

Base URL の設定方法は次の 2 通りです。

- **既定の Base URL を設定する** — プロジェクト全体の既定値として設定すると、新しいテストに自動適用されます。
- **テストごとに Base URL を指定する** — 既定値がない場合は、各テストで手動入力します。既定値がある場合でも、必要に応じて上書きできます。

### 既定の Base URL を変更する

プロジェクトの初期設定で選んだ Base URL は、いつでも変更できます。変更後は新しいテストに自動適用されます。

#### プロジェクトの既定 Base URL を変更する手順

1. メインナビゲーションから **Settings > Project** を開きます。
2. **Default Base URL** の右にある **Edit** をクリックします。

![Default Base URL の編集](/images/recording-tests/how-to-record-a-test/364a461-editdefaulturl.png)

3. 新しい URL を入力し、**OK** をクリックします。

![新しい Base URL の入力](/images/recording-tests/how-to-record-a-test/44535fa-enternewdefaulturl.png)

変更後、すべての新規テストで新しい既定 URL が使用されます。

### 個別テストの Base URL を設定する

新しいテストを作成した直後は、プロジェクトの既定 URL が適用されています。個別のテストで別の URL を使いたい場合は手動で変更します。

#### 個別テストの Base URL を設定する手順

1. テスト作成直後に Visual Editor で **Step 1** または **Base URL** のリンクをクリックします。

![Step 1 の Base URL リンク](/images/recording-tests/how-to-record-a-test/860143c-firststepurl.png)

**Test Configuration** のプロパティパネルが表示されます。

![Test Configuration プロパティ](/images/recording-tests/how-to-record-a-test/2a49122-testconfigprops.png)

2. **Base URL** フィールドに新しい URL を入力します。

![Base URL の入力](/images/recording-tests/how-to-record-a-test/3a130b6-newbaseurl.png)

:::info
Base URL は入力と同時に保存されるため、保存操作は不要です。
:::

## ステップ3: テスト構成を設定する

テスト構成はテストを実行する環境を決定します。ローカルで実行する場合は自分の環境に合わせて設定し、Testim Grid で実行する場合はシミュレーションしたい環境を指定します。

:::info
CLI でテストを実行する際は、コマンドで別のテスト構成を指定して上書きできます。詳しくは [コマンドラインインターフェース](doc:the-command-line-cli) を参照してください。
:::

新しいテストを作成すると既定のテスト構成が自動適用されます。構成を変更する方法は次のとおりです。

- **Edit** — 現在のテストに対してのみ設定を変更します（構成プロファイル自体は変更されません）。
- **Choose Other** — 共有されている別の構成を選択して適用します。
- **Custom (create new)** — 新しいカスタム構成を作成し、現在のテストに適用します。

### 現在のテスト構成を編集する

#### テスト構成を編集する手順

1. テスト作成直後に Visual Editor で Base URL ステップにカーソルを合わせ、**歯車アイコン**をクリックします。

![歯車アイコン](/images/recording-tests/how-to-record-a-test/f4dc69b-firststepcog.png)

プロパティウィンドウが画面横に表示されます。

:::info
ステップを選択してヘッダーバーの歯車アイコンをクリックしても同じ画面を開けます。
:::

2. Configuration セクションまでスクロールし、**Edit** をクリックします。

![Edit Configuration ボタン](/images/recording-tests/how-to-record-a-test/40e44dd-editconfiguration.png)

**Edit Configuration** パネルが開きます。

![Edit Configuration パネル](/images/recording-tests/how-to-record-a-test/412214b-editconfigurationpanel.png)

3. 必要なパラメーターを編集します。変更内容は現在のテストに適用されます。

### ほかのテスト構成を選択する

共有されているテスト構成から選択して適用できます。

#### 別のテスト構成を適用する手順

1. Base URL ステップにカーソルを合わせ、**歯車アイコン**をクリックします。

![歯車アイコン](/images/recording-tests/how-to-record-a-test/adfe038-firststepcog.png)

プロパティウィンドウが表示されます。

:::info
ステップを選択してヘッダーバーの歯車アイコンをクリックしても同じ画面を開けます。
:::

2. Configuration セクションの **Choose Other** をクリックします。

![Choose Other](/images/recording-tests/how-to-record-a-test/e40f631-chooseother.png)

**Choose New Configuration** パネルに利用可能な構成と、現在適用されている構成が表示されます。

![利用可能な構成の一覧](/images/recording-tests/how-to-record-a-test/3c6499b-chooseconfigpanel.png)

3. 目的の構成にカーソルを合わせ、**Choose** をクリックします。

![Choose ボタン](/images/recording-tests/how-to-record-a-test/d207b3d-choose.png)

選択した構成が現在のテストに適用されます。

### カスタム構成を作成する

新しいカスタム構成を作成する手順は、[共有構成の作成](https://help.testim.io/docs/shared-configuration#create-a-shared-configuration) を参照してください。

## ステップ4: テストを記録する

記録を開始すると、Base URL を開いた新しいブラウザが表示されます。このブラウザは **AUT (Application Under Test)** と呼ばれ、ここで行った操作がテストステップとして記録されます。以下の操作は個別のステップとして認識されます。

- クリック
- ダブルクリック
- 右クリック
- スクロール
- テキストの入力
- ページのスクロール
- 要素までスクロール
- ドラッグ
- ウィンドウのサイズ変更

### 新しいテストを記録する手順

1. Visual Editor のヘッダーバーにある赤い **Record** ボタンをクリックします。

![Record ボタン](/images/recording-tests/how-to-record-a-test/1900e7d-recordbutton.png)

AUT ブラウザが Base URL を開きます。

2. AUT ブラウザでテストに含めたい操作を行います。
3. 記録が完了したら **Stop Test** ボタンをクリックします。

![記録の停止](/images/recording-tests/how-to-record-a-test/877fbf1-ezgif-5-a5e2c43308.gif)

テストが記録され、各操作が Visual Editor のステップとして表示されます。

![Visual Editor 上のステップ](/images/recording-tests/how-to-record-a-test/0913dee-testresults.png)

### 記録の一時停止と再開

記録中は一時停止してから再開できます。記録モードが有効な間に AUT ブラウザで行った操作だけがテストに含まれます。一時停止中の操作は記録されません。

:::tip
一時停止中にシナリオの準備をしておくと、再開後にスムーズに記録できます。
:::

#### 記録を一時停止して再開する手順

1. 記録中はヘッダーバーに **Pause** ボタンが表示されます。クリックして一時停止します。

![Pause ボタン](/images/recording-tests/how-to-record-a-test/d9d6630-pausebutton.png)

2. 一時停止中は赤い **Record** ボタンが表示されます。クリックすると記録を再開します。

![記録の再開](/images/recording-tests/how-to-record-a-test/3049c92-recordrestart.png)

3. AUT ブラウザに戻って操作を続けます。ヘッダーバーの **Go to app** ボタンをクリックすると、AUT ウィンドウに切り替えられます。

![Go to app ボタン](/images/recording-tests/how-to-record-a-test/d6208c5-gotoapp.png)

:::info
上記の手順では、記録中のシーケンスの末尾に操作が追加されます。途中に操作を挿入したい場合は、対象位置の **+** ボタンをクリックし、表示されるメニューから **Record action here** を選択します。
:::

## ステップ5: テストを保存する

新しいテストを作成したり既存のテストを編集したりした場合は、必ず保存します。変更が保存されていないと、次のメッセージが表示されます。

![未保存の通知](/images/recording-tests/how-to-record-a-test/8797dbc-notsaved.png)

:::warning
**オートリカバリー**: 新しいテストを作成したり既存テストを編集したりした際は、できるだけ早く保存してください。保存前にブラウザを閉じてしまっても、テストはブラウザのキャッシュに残り、作業を再開できる場合があります。詳細は [保存していないテストを復元する](doc:recovering-a-test-that-was-not-saved) を参照してください。
:::

### 新しいテストを保存する手順

1. Visual Editor で **Save** ボタンをクリックします。

![Save ボタン](/images/recording-tests/how-to-record-a-test/aaae293-savetest.png)

2. テストの **Name** と **Description** を入力し、**OK** をクリックします。

![テスト名の入力](/images/recording-tests/how-to-record-a-test/cfb76e2-testname.png)

テストが保存され、テストライブラリに追加されます。

![ライブラリへの追加](/images/recording-tests/how-to-record-a-test/6a4243b-testaddedtolibrary.png)

### 編集したテストを保存する

既存のテストを編集した場合（追加のステップを記録する、プロパティを調整する、検証を追加する など）は、変更内容を保存する必要があります。詳しくは [テストの編集](doc:editing-your-tests) を参照してください。

---

**更新日**: 本日
