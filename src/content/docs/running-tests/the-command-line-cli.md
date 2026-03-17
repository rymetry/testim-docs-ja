---
title: コマンドライン インターフェース (CLI)
description: >-
  Testim CLI のインストール方法と、プロジェクト
  ID・トークン・グリッド・ラベル・スイート・テスト計画などのパラメータを指定してローカルおよびリモートでテストを実行し、CI と統合する手順を説明します。
category: テスト実行
order: 6002
updated: '2025-09-22'
sourceUrl: 'https://help.testim.io/docs/the-command-line-cli'
keywords:
  - CLI
  - コマンドライン
  - テスト実行
  - CI 連携
  - グリッド実行
  - ラベル実行
  - スイート実行
  - テスト計画
  - 実行パラメータ
  - Testim
---

コマンドラインからすべてのテストを実行し、CI と統合します。

## 前提条件

CLI 経由での実行には Node.js がインストールされている必要があります。Testim は [LTS/サポート対象](https://github.com/nodejs/Release/blob/main/README.md) の Node.js のすべてのバージョンをサポートしています。

## CLI インストール

Testim パッケージをインストールします。

```shell
npm install -g @testim/testim-cli
```

以上です！

### 基本的な CLI コマンド

Web とモバイルの基本的な CLI コマンド例は、**設定 > CLI** タブに表示され、トークンとプロジェクト ID が含まれています。

**基本的な CLI コマンドを表示するには:**

1. **設定 > CLI** タブに移動します。
2. **CI** をクリックしてテストをリモート実行するか、**ローカル** をクリックしてテストをローカル実行します（マシンのローカルブラウザーが開きます）(Web のみ)
3. **CI プラットフォーム** で、希望する CI プラットフォームを選択します (オプション)
4. **グリッド** で、テストを実行するグリッドを選択します。Web テスト用には Selenium グリッドが表示され、モバイルテスト用には以下のグリッドが表示されます:\
   [仮想モバイルグリッド](/docs/virtual-mobile-grid)\
   [Tricentis Device Cloud](/docs/tricentis-device-cloud)\
   [Testim Headspin Mobile](/docs/headspin-integration)\
   [Browserstack](/docs/browserstack-integration-1)\
   [LambdaTest](/docs/browserstack-integration-copy)\
   基本的な CLI コマンドは **例** の下部に表示されます。

![設定画面に表示される基本的な CLI コマンド例](/images/running-tests/the-command-line-cli/af52b8a-cli_command.png)

基本コマンドには以下の要素が含まれています:\
`--token`: 認証トークン\
`--project`: プロジェクト ID\
`--grid`: テストを実行するグリッドの名前。Web テスト用には Selenium グリッドが表示され、モバイルテスト用には Appium グリッドが表示されます。

5. CLI をコピーし、編集して必要に応じてパラメータを追加します。 特定のテスト、ラベル、構成など、以下のセクションで説明されているように実行できます。

### その他の一般的なパラメータ

最も一般的なオプションを含む基本コマンドの例は次のとおりです (使用可能なすべてのオプションの詳細な説明については、以下を参照):

`--project`: 上記を参照\
`--token`: 上記を参照\
`--label:` これを使用して、指定したラベルを含む特定のテストを実行します\
`--grid`: 上記を参照\
`--report-file`: テスト結果を保存する場所を指定します (CI サーバーがそれを読みます)

```shell
testim --label "<YOUR LABEL>" --token "<YOUR ACCESS TOKEN>" --project "<YOUR PROJECT ID>" --grid "<Your grid name>" --report-file test-results/testim-tests-report.xml
```

:::note{title="Web のみの注記"}
グリッドで実行する代わりに、**--use-local-chrome-driver** を使用することができます。このようにして、クリーンでエクステンション フリーの Chrome ブラウザーで実行を確認できます。`--use-local-chrome-driver` が `--headless` と組み合わせて使用される場合、`--mode selenium` フラグも追加する必要があります。
:::

## すべての CLI パラメータ

### プロジェクト

`--project` プロジェクト ID。\
別のプロジェクトを選択するには、企業画面に移動し (参照 [プロジェクトとユーザー管理](/docs/project-and-user-management))、関連するプロジェクトを選択し、**設定 > CLI** タブに移動し、基本的な CLI コマンド例からプロジェクト ID を抽出します。

```shell
--project AOL-12323-a4b2-4762-df380
```

### アクセストークン

`--token` アクセストークン。アクセストークンは、**設定 > CLI** タブ画面に表示されている基本的な CLI コマンド例から取得できます。

```shell
--token aaaaa-1234-1234-bbbb-1234qwer1234qwer
```

#### ラベル

`--label` または `-l` 指定されたラベルを含むすべてのテストを実行します。

:::note{title="注記"}
指定されたラベルがテストを指していない場合、エラーが返されます。
:::

`--label` 引数をさらに追加することで、複数のラベルを実行することもできます。

```shell
-l sanity -l custom-label2
```

#### テスト名

`--name` または `-n`、実行するテストの名前。

:::note
`--name` 引数をさらに追加することで、複数のテストを名前で実行できます。
:::

```shell
--name "login_to_app"
```

#### テスト ID

`--testId` または `-t` または `--test-id`、実行するテストの ID。コマンドの後に、テストの ID を入力します。

:::note
`--testId` 引数をさらに追加することで、複数のテストを ID で実行できます。
:::

```shell
--testId "5e1c62b2-7c30-635b-6441-dd804126118b"
```

#### グリッド名

`--grid`、使用する Selenium グリッド名。"Testim-Grid"/ローカル selenium グリッド/ Saucelabs / Browserstack を使用できます。

`--grid` `<grid-name>`
注: グリッドを構成する方法については、[こちら](/docs/grid-management) をお読みください。

#### ホスト

`-h` または `--host <host-name>`、selenium グリッドを含むホスト名または IP。このコマンドは `--grid` コマンドをオーバーライドします。

```shell
--host seleniumhost
```

#### グリッド ID

#### レポートファイル

`--report-file` または `-r`、レポートを出力する場所 (デフォルトでは出力ストリームに)。ファイルは JUnitXMLReporter 形式です。これは Testim の結果を CI ディスプレイと統合するために使用されます。通常は、CI の構築設定でそのファイルを参照するように設定する必要があるため、CLI パラメータ値と構築設定が同じ場所に設定されていることを確認してください。

```shell
-r ~/report.xml
```

レポートファイルのクラス名をオーバーライドするには、このパラメータを追加します。

`--override-report-file-classname com.someName`

#### ベース URL (Web のみ)

`--base-url`、ブラウザが開いた後の開始 URL

```shell
--base-url staging.example.com
```

#### テスト構成

`test-config` は、このテスト実行の全テストに対して定義されている構成をオーバーライドする構成パラメータ (例: ブラウザー、オペレーティング システム、解像度、デバイス名、OS バージョン、ビジュアル検証パラメータなど) を指定します。モバイル テストでは、テストはテスト構成で構成されているデバイスプールの最初の利用可能なデバイスで実行されます。\
詳細は [構成ライブラリ - Web](/docs/shared-configuration) および [構成ライブラリ - モバイル](/docs/configuration-library-mobile) をお読みください。

```shell
--test-config "1280x1024_SXGA_chrome" --test-config "1366x768_WXGA_firefox"
```

#### パラメータ ファイル

`--params-file` テスト実行にパラメータを渡すために使用できる JSON パラメータ ファイルを使用します。このメソッドにより、テスト環境によって異なるテスト内に動的な値を定義できます。たとえば、ローカルでテストする場合と CI でテストする場合に異なるログイン認証情報 (ユーザー名とパスワード) を設定できます。JSON パラメータ ファイルを定義した後、それを Testim CLI に引数として渡すことができます: `--params-file` の後にファイル名を指定します。詳細は [JSON パラメータファイル](/docs/json-parameters-file-parameters) をお読みください。

:::note
`params-file` パスで設定されている文字列パスは相対パスである必要があり、完全なパスではありません。
:::

```shell
--params-file [params-file.json]
```

#### テストスイート (名前で)

`--suite`、実行するテストスイート名。複数のスイートを実行できます。

```shell
--suite "suite_name" --suite "suite_name2"
```

#### テストスイート (ID で)

`suite-id`、実行するテストスイート ID を指定します。複数のスイートを実行できます。

```shell
--suite-id "suite1ID" --suite-id "suite2ID"
```

#### テスト計画 (名前で)

`--test-plan`、実行するテスト計画名を指定します。複数の計画を実行できます。テスト計画でグリッド、テストリスト、構成などを定義するため、それを CLI からオーバーライドすることはできません。したがって、`--test-plan` を使用する場合は、これらのフラグを使用することはできません: `--testId`、`--label`、`--name`、`--browser`、`--test-config`、`--test-config-id` または `--suite`。

```shell
--test-plan "Test Plan Demo"
```

#### 実行名

`--override-execution-name`、Testim スイート実行での実行の名前。

```shell
--override-execution-name "Dev Sanity"
```

#### クラス名

`--override-report-file-classname` JUnitXML レポート ファイルのクラス名は、デフォルトで Testim.io です。スイート名をクラス名に含めるには、値を指定せずに以下のパラメータを追加します。クラス名を特定の名前でオーバーライドする場合は、パラメータに追加します。

```shell
--override-report-file-classname
--override-report-file-classname "Regression"
```

#### 結果ラベル

`--result-label`、結果ラベル オプションにより、リモート実行にテキスト ラベルを追加できます。これらのラベルは実行ページに表示されます。

```shell
--result-label "V1.40"
```

#### テストタイムアウト

`--timeout`、タイムアウトが経過したときにテスト実行を中止するタイムアウト期間 (ミリ秒)。デフォルトは 10 分に設定されています。最大は 3 時間です。

```shell
--timeout 120000
```

#### ブランチ

`--branch`、特定のブランチで実行する場合 (名前別)。

```shell
--branch <branch-name>
```

:::note
アーカイブされたブランチで実行すると、CLI は失敗します。
:::

#### 並列

`--parallel`、並列で実行する必要があるテストの数。

```shell
--parallel <parallel-count>
```

#### 構成ファイル (Web のみ)

`--config-file` または `-c`、外部構成ファイルからすべての構成オプションを指定します。\
シェルでアクセス可能なパスに構成ファイルを配置し、コマンドでファイルへのパスを指定します。

```shell
--config-file [config-file.js]
```

構成ファイルについては [こちら](/docs/configuration-file-run-hooks) をお読みください。

#### 失敗したテストの再試行

`--retries`、このフラグを使用すると、失敗したテストは、テストが成功するか最大再試行回数に達するまで繰り返し実行されます。その場合、テストは失敗します。

テストが 1 回以上の再試行後に成功した場合、UI では以下のように示されます:

```shell
--retries <max_num_of_retries>
```

再試行のみで成功したテストは、testim ライブラリの下で簡単にフィルタリングできます。詳細については、[不安定なテスト](/docs/flaky-tests) をお読みください。

#### TestRail レポートを無効にする (Web のみ)

`--suppress-tms-reporting` TestRail へのスイート実行結果の送信を抑止します。

```shell
--suppress-tms-reporting
```

#### 専用実行トンネル (Web のみ)

`--tunnel` `--tunnel-port`、トンネルを使用して、内部サーバー/localhost からアプリを実行し、外部ブラウザーで表示できます。\
\--tunnel  #デフォルト アプリケーション ポート 80

```shell
testim --tunnel --tunnel-port <APP PORT default 80>
```

詳細については、[この記事](/docs/dedicated-run-tunnel) をご確認ください。

#### 失敗したテストの再実行

`--rerun-failed-by-run-id`、失敗したテストの再実行オプションでは、スイート実行で失敗したすべてのテストを再実行できます。\
スイートのページからスイート実行 ID をコピーします:

CLI に --rerun-failed-by-run-id フラグをスイートの実行 ID で追加します:

```shell
--rerun-failed-by-run-id <run-id>
```

#### タイムアウト再試行を無効にする

`--disable-timeout-retry`、デフォルトでは、テストが「テストがタイムアウトに達した」ため失敗した場合、Testim は 1 回再実行しようとし、失敗する前に最大 3 回実行します。このデフォルト動作は、この CLI フラグを使用してテストを実行するときに無効にできます。

```Text shell
--disable-timeout-retry
```

<br />

#### データ保持を設定

`--set-retention` パラメータ --set-retention \[1 ～ 10 の整数] を CLI 実行に追加すると、この実行のすべてのテスト結果は、パラメータで指定された日数後に削除対象としてマークされます (保持期間)。

:::note
弊社のプランには、デフォルトで 30 日間の保持が含まれています。より長い保持時間が必要な場合は、サポートにお問い合わせください。
:::

```shell
--set-retention <number-between-1-10>
```

#### CLI 実行を中止

ターミナルで Ctrl+C ショートカットを使用して CLI 実行を中止することができます。実行は実行リストの下で「中止」ステータスを持つようになります。

![CLI 実行が中止されたことを示す実行結果画面](/images/running-tests/the-command-line-cli/a78e858-Screen_Shot_2020-10-15_at_11.49.37.png)

CLI は複数回 CTRL+C キーを押すか、ターミナル ウィンドウを閉じることで強制的に終了することもできます (いわゆる、不正な中止)。\
これにより実行は停止しますが、ステータスはエディターで「実行中」のままになります。実行ステータスは 90 分後に「タイムアウト」に変わります。

#### Chrome 追加引数を追加する (Web のみ)

Chrome 追加引数を追加するには、*--chrome-extra-args* を使用します。これは必要なフラグをコンマで区切った文字列を受け取ります (フラグ間に スペースはありません)。たとえば:

```shell
testim --token "TOKEN" --project "PROJECT" --grid "Testim-Grid" --chrome-extra-args "enable-heavy-ad-intervention,heavy-ad-privacy-mitigations"
```

#### カスタム エクステンションで CLI コマンドを実行

*--install-custom-extension* を使用して、特定のエクステンションがインストールされた Chrome ブラウザーで CLI コマンドを実行できます。たとえば:

```shell
testim --token "<YOUR ACCESS TOKEN>" --project "<YOUR PROJECT ID>" --use-local-chrome-driver --install-custom-extension <chrome extension zipped file url or local path>
```

#### intersect-with フラグ

`intersect-with` フラグを使用して、指定されたテストのサブセット (テスト計画、テストスイート、ラベルなど) を実行でき、指定されたラベルまたはスイートと交差します。テスト計画を実行する場合、交差は計画本体のテスト上で実行されます (前述のテストまたは後述のテストではありません)。\
以下の `intersect-with` フラグを使用できます:

```shell
--intersect-with-label <labelName>
--intersect-with-suite <suiteName>
--intersect-with-suite-id <suiteId>
```

次のコマンド例は、"test" というラベルと交差する場合に実行する "SuiteName" というスイートを指定しています:

```shell
testim --token "7jdSDFGbsdfrGsdrgsdrg" --project "EIPPYFgkS7oTesyRCnlj" --suite "SuiteName" --grid "Testim-Grid" --intersect-with-label "test"
```

次のコマンド例は、"test1" というスイートと交差する場合に実行する "test" というラベルを持つテストを指定しています:

```shell
testim --token "7jyBS1mzOb5f6wOGE3o8ybE2tSRuWAY5rZteT1jwd4FAAJ2mPn" --project "EIPPYFgkS7oCnlOfNtOj" --label "test" --grid "Testim-Grid" --intersect-with-suite "test1"
```

`intersect-with` フラグは、元の実行コマンドに含まれていたすべてのテストから、Testim が指定されたラベルまたはスイートと一般的な (つまり、交差する) テストのみを実行することを定義しています。

**例えば:**\
ラベル A - テストが含まれています: 1,2,3,4\
ラベル B - テストが含まれています: 5,6,7\
ラベル C - テストが含まれています: 3,4,5\
ラベル D - テストが含まれています: 8,9

テスト計画 P はラベル A と B を含んでいます。\
したがって、テスト計画 P を --intersect-with-label C で実行する場合 ==> テスト 3,4,5 が実行されます\
テスト計画 P を --intersect-with-label D で実行する場合 ==> テストは実行されません。

複数の交差フラグを追加することが可能です。\
たとえば、テスト計画 P を --intersect-with-label C --intersect-with-label A で実行する場合\
Testim は元の実行コマンド内のテストを確認してから、交差フラグを 1 つずつ計算します。

:::note
交差はフラグ間ではなく、フラグと要求されたテスト間で実行されます。したがって、--intersect-with-label A と --intersect-with-label B がある場合、Testim は要求されたテストと交差する A または B のすべてのテストを実行します。
:::

#### intersect-with-operand

文字列を受け入れます。値は `AND` \| `OR` のいずれかの値です。デフォルト (このパラメータが定義されていない場合)、`OR` が使用されます。これは `--intersect-with-label` フラグでのみ機能します。

### Sealights 統合

[Sealights 統合](/docs/sealights-integration) を使用して CLI でテストを実行するときは、Sealights の次の ID のいずれかを Testim CLI 実行コマンドのオプションとして追加する必要があります:

* **Sealights buildSessionId** - この ID は、実行された特定のビルドに関連しています。通常、これはアプリケーション内の特定のコンポーネントに関連しています。つまり、特定のコンポーネントをテストする場合、このオプションを使用することをお勧めします。
* **Sealights labId** - 通常、同じ環境でホストされている複数のコンポーネントが同じ LabId を共有できます。複数のコンポーネントをテストする場合、buildSessionId ではなく LabId を使用することをお勧めします。

#### **Sealights buildSessionId**

`--sealights-build-session-id`、実行された特定のビルドに関連する ID を使用して Sealights 統合でテストを実行します。`buildSessionId` を取得するには、[buildSessionID オプション セクション](/docs/sealights-integration#buildsessionid-option) の指示に従います。

```shell
--sealights-build-session-id [sealights-suid-session-id]
```

#### **Sealights labId**

`--sealights-lab-id`、ラボ ID を使用して Sealights 統合でテストを実行します。`labId` を取得するには、[labId オプション セクション](/docs/sealights-integration#labid-option) の指示に従います。

```shell
--sealights-lab-id [sealights-lab-id]
```

<br />

### モバイル専用フラグ

#### デバイス名

`--device-name`、特定のデバイス モデルを選択してテストを実行します。フラグを使用しない場合、Testim は最初に利用可能なデバイス モデルを選択します。

```shell
--device-name "Samsung S22"
```

#### デバイス UDID

`--device-udid`、一意のデバイス ID に基づいて特定のデバイスを選択してテストを実行します。フラグを使用しない場合、Testim は最初に利用可能なデバイスを選択します。

```shell
--device-udid "udid123456"
```

#### OS バージョン

`--os-version`、特定のオペレーティング システム バージョンを選択してテストを実行します。フラグを使用しない場合、Testim は最初に利用可能なデバイスを選択します。

```shell
--os-version "9"
```

#### アプリ ID

`--app-id`、モバイル アプリ ライブラリのモバイル アプリの特定のアプリ ID を選択してテストを実行します。これは、記録中に使用された現在のアプリをオーバーライドする場合に使用されます。アプリ ID を取得するには、[モバイル アプリ] 画面に移動し、リストされているアプリの 1 つを右クリックして、**ID をコピー** を選択します。

![モバイルアプリ画面でアプリ ID をコピーする操作](/images/running-tests/the-command-line-cli/097f1f4-2023-02-06_13-00-18.png)

```shell
--app-id "appID123"
```
