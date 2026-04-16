# Testim Docs JA 用語集（GLOSSARY）

本ファイルは **翻訳者と検知系 (`scripts/lib/parity_glossary_mask.mjs`) が参照する canonical な用語集** です。ここに登録された用語は英語のまま維持され、`segment-untranslated` 検知から除外されます。

登録基準:
- Testim / Tricentis の固有名詞（製品名・機能名・画面名）
- 広く通用する英語 UI ラベルで、日本語化すると逆に混乱を招くもの
- CLI コマンド名・設定キー名

登録手順:
1. 以下のカテゴリ配下に行を追加する
2. `scripts/lib/parity_glossary_mask.mjs` は起動時に本ファイルをパースするため、再起動で反映される
3. 登録後に `npm run check:parity` で影響を確認する

---

## 製品名 / 会社名

| 用語 | 備考 |
| --- | --- |
| Testim | |
| Testim Automate | |
| Testim Grid | |
| Testim-Grid | CLI でのハイフン付きグリッド指定名 |
| Testim Mobile | Testim のモバイルテスト製品 |
| Testim Copilot | Testim の AI アシスタント製品 (Help / Coding 両方を含む) |
| Testim Startup Promotion | Testim の旧 startup 向け無償プログラム名 (廃止済み) |
| Tricentis | |
| Tricentis Testim | |
| Tricentis Test Management | Tricentis のテスト管理製品 (TTM for Jira 等を含む) |
| Tricentis Device Cloud | Tricentis のモバイルデバイスクラウド |
| qTest | Tricentis のテスト管理プラットフォーム |
| qTest Manager | qTest のテスト管理コンポーネント |
| qTest Insights | qTest のインサイトコンポーネント |
| Azure OpenAI Service | Microsoft Azure の OpenAI サービス (AI 基盤) |
| Microsoft Azure OpenAI Service | Microsoft Azure OpenAI Service の完全表記 (4-word compound) |
| Testim AI | Testim の AI 機能群総称 (Testim AI ソリューション等の compound) |
| Testim Labs | Testim の先行アクセス機能プログラム |

## 拡張機能 / IDE

| 用語 | 備考 |
| --- | --- |
| Testim Extension | |
| Tricentis Testim Extension | |
| Testim Visual Editor | |
| Visual Editor | |
| Tricentis Mobile Agent | モバイルテスト用エージェント |
| Virtual Mobile Grid | Testim のモバイル実行グリッド |

## 機能 / 技術名

| 用語 | 備考 |
| --- | --- |
| Visual AI | |
| Smart Locators | |
| Branching | |
| Hooks | |
| Agentic Test Automation | |
| Shared Steps | |
| Groups | |
| Validations | |
| CodeBot | |
| Coding Assistant | |
| Mobile Apps Library | モバイルアプリ管理画面 |
| Mobile App ID | モバイルアプリの識別子 |
| Mobile Apps Tab | モバイルアプリタブ |
| Upload to Grid | グリッドへのアップロード機能 |
| Move to Folder | 共有ステップの移動 UI アクション |
| Enhanced mode | Testim モバイル機能名（VMG 上での高度モバイルテスト実行モード） |
| Smart Locator | Smart Locators の単数形バリアント |
| Hidden Parameters | Testim の非公開パラメーター管理機能 |
| Test Plans | Scheduler の機能名 (テストプランニング) |
| Execute Driver Script | Testim Mobile のステップ名 |
| Custom Action | カスタムアクションステップ種別 |
| Code Debugging | コードデバッグ機能 |
| Test Flow View | テストフロー可視化機能 (Testim Labs) |
| Shared Step | 共有ステップ (Shared Steps の単数形) |
| Go To AUT | AUT への移動機能 |
| Result Script Execution | テスト結果スクリプト実行 |
| Auto-improve | テストロケータの自動改善機能 |
| Test Library | テストライブラリ画面 |
| Suite Library | スイートライブラリ画面 |
| Test Plans Library | テストプランライブラリ画面 |
| REST API | REST API 種別表記 |
| Configuring a Data-driven Test From The Visual Editor | Visual Editor データ駆動テスト設定ページリンクテキスト |

## Testim for Salesforce

| 用語 | 備考 |
| --- | --- |
| Salesforce | サードパーティプラットフォーム（Testim for Salesforce 文脈） |
| Testim for Salesforce | 製品名 |
| Salesforce Steps | Testim for Salesforce のステップカテゴリタブ |
| Log In | Testim for Salesforce のステップ名 |
| Log Out | Testim for Salesforce のステップ名 |
| Launch App | Testim for Salesforce のステップ名 |
| Record Operations | Testim for Salesforce のステップカテゴリ |
| Select Login Persona | Testim for Salesforce の UI ラベル |
| Connect a Salesforce Environment | Testim UI の操作名 |
| Select Existing Branch | Testim UI の操作名 |
| Create New Branch | Testim UI の操作名 |
| Select Type | Testim for Salesforce の UI ラベル |
| Select Record Type | Testim for Salesforce の UI ラベル |
| Account Name | Salesforce フィールド名 |
| Account | Salesforce オブジェクトタイプ |
| Create Account | Salesforce のレコード操作名 |
| Object | Salesforce / Testim の概念用語 |
| Settings | UI ナビゲーション要素 |
| Environments | UI ナビゲーション要素 |
| Go Back to the Editor | Testim の UI リンク |
| See Error | Testim の UI リンク |

## 外部製品 / 第三者ツール

Testim が統合 / 連携する第三者製品。JA 文中でも英語のまま維持する。

| 用語 | 備考 |
| --- | --- |
| Appium | モバイル自動化フレームワーク |
| Standard Appium | Testim Mobile の Appium 互換モード名 |
| Applitools | ビジュアルテスト製品 |
| Jira | Atlassian のプロジェクト管理ツール |
| Xray | Jira のテスト管理プラグイン |
| BrowserStack | クラウドブラウザ / デバイスグリッド |
| SauceLabs | クラウドブラウザ / デバイスグリッド |
| OneLogin | SSO / ID プロバイダー |
| Okta | SSO / ID プロバイダー |
| Azure DevOps | Microsoft の DevOps プラットフォーム |
| Selenium | Web 自動化フレームワーク |
| Sealights | テストインパクト分析製品 |
| Chrome DevTools | Chrome ブラウザの開発者ツール |
| Wikipedia | オンライン百科事典 |
| Microsoft | ソフトウェア企業 |
| Slack | 通知 / メッセージングサービス |
| LambdaTest | クラウドブラウザ / デバイスグリッド |
| LambdaTest Grid | LambdaTest のグリッドサービス |
| Azure AD | Microsoft Azure Active Directory 略称 |
| Azure Active Directory | Microsoft のクラウド ID 管理サービス |
| Azure AD Seamless SSO | Azure AD シームレスシングルサインオン |
| AWS | Amazon Web Services クラウドプラットフォーム |
| Xcode | Apple の開発ツール |
| Android Studio | Google の Android 開発ツール |
| GitHub | Git ホスティング / CI プロバイダー |
| GitHub Issues | GitHub の課題管理機能 |
| GitHub Actions | GitHub の CI/CD 機能 |
| Git Issues | Git Issues (bug 報告先) |
| Bitbucket | Atlassian の Git / Mercurial ホスティング |
| Jenkins | オープンソース CI サーバー |
| Jenkins Pipeline | Jenkins のパイプライン機能 |
| CircleCI | CI プロバイダー |
| Codeship | CloudBees の CI プロバイダー |
| Gearset | Salesforce DevOps プラットフォーム |
| Copado | Salesforce DevOps プラットフォーム |
| AutoRABIT | Salesforce DevOps / CI プラットフォーム |
| TestRail | Gurock のテスト管理プラットフォーム |
| HeadSpin | モバイル / IoT テストグリッドプロバイダー |
| VSTS | Visual Studio Team Services (旧称) |
| TFS | Team Foundation Server |
| Azure Pipelines | Azure DevOps のパイプライン機能 |
| Mercurial | 分散バージョン管理システム |
| Atlassian | Jira / Bitbucket の提供企業 |
| Trello | Atlassian のカンバンボード |
| Sealights | テストインパクト分析製品（再掲バリアント） |
| LambdaTest Automation | LambdaTest の自動化プラットフォーム |
| Appium | モバイル自動化フレームワーク（再掲バリアント） |
| TTM for Jira | Tricentis Test Management for Jira |
| Tricentis Test Management for Jira | TTM for Jira の完全表記 |
| TDC | Tricentis Device Cloud 略称 |
| qTest API | qTest の API |

## 画面 / UI 領域

| 用語 | 備考 |
| --- | --- |
| Test Editor | |
| Project Settings | |
| Test Suite | |
| Test List | |
| Dashboard | |
| Run View | |
| Step Properties | |
| Bearer Token | qTest API トークン |
| Test Execution | qTest の UI 画面名（単数形） |
| Test Executions | qTest の UI 画面名 |
| Execution History | qTest の UI 画面名 |
| Test Log Details | qTest の UI 要素名 |
| Result URL | qTest の UI フィールド名 |
| Console Logs URL | qTest の UI フィールド名 |
| Network Logs URL | qTest の UI フィールド名 |
| Go to location | デバッグパネルのブレークポイント位置移動ボタン |
| Filter entries by log text | コンソールログのフィルターフィールド |
| Delete all breakpoints | ブレークポイント一括削除ボタン |
| Start A New Test | テスト作成開始ボタン |
| Your app URL | AUT URL 入力フィールドラベル |
| Login To Start | Testim Extension のログインボタン |
| Create Automated Test | Testim Extension の自動テスト作成ボタン |
| Open in new tab | コンテキストメニュー項目 |
| Local Devices | ローカルデバイスセクション (デバイス管理) |
| Device UDID | デバイス UDID フィールド |
| Scheduler | テストスケジューラー画面 |
| Start recording at this position | Test Editor の記録位置指定ボタン |
| Space & Beyond | Testim チュートリアルのデモアプリ名 |
| Demo App | デモアプリケーション |
| OS Version | デバイスプロパティフィールド |
| I'm not a robot | CAPTCHA チャレンジテキスト |
| Base URL | テスト対象のベース URL 設定 |
| Create Test | テスト作成ボタン |
| DEVTOOL IS OPEN | Chrome DevTools 起動確認メッセージ |
| Don't show again in this session | セッション中非表示チェックボックス |
| Mirroring Viewer | AUT Mirroring Viewer (モバイルテスト画面) |
| Next | UI ナビゲーションボタン |
| Done | UI 完了ボタン |
| Stop Recording | テスト記録停止ボタン |
| Encrypted Credentials | 暗号化された認証情報管理機能 |
| User Access Key | 暗号化認証情報のアクセスキータブ/フラグ |
| Secrets Manager | シークレット管理機能 |
| Config File | テストデータのファイル種別 |
| Param File | テストデータのファイル種別 |
| Test Data | テストデータ機能 |
| Protect branches from changes | Project Settings のブランチ保護トグル |
| Require approving reviewer | Project Settings のレビュー必須トグル |
| Allow self approval | Project Settings の自己承認許可トグル |
| Pull Request Settings | Project Settings のプルリクエスト設定セクション |
| General Settings | Project Settings の一般設定セクション |
| Copilot License Management | Copilot ライセンス管理ページ |
| Execution Runs | 実行結果一覧画面 |
| Execution Details Screen | 実行詳細画面 |
| Execution Test List | 実行内テストリスト |
| Counted Runs | テスト実行統計タブ |
| Local Editor Runs | エディター実行統計タブ |
| Advanced Filters | 高度なフィルター UI |
| Filter by Run Date | 実行日フィルター操作 |
| Export Execution List | 実行リストエクスポートボタン |
| Reset filters | フィルターリセットボタン |
| Abort Run | 実行中断ボタン |
| Rerun with same params | 同一パラメーター再実行ボタン |
| Tag failure type | 失敗タイプタグ付けアクション |
| Test History | テスト履歴オプション |
| Force users to login via IDP | SSO 設定の IDP 強制ログインチェックボックス |
| Enable SSO | SSO 有効化トグル |
| Service Provider Entity ID | SSO 設定の SP エンティティ ID フィールド |
| Assign Seats | ライセンスシート割り当てボタン |
| Add Project Owner | プロジェクトオーナー追加アクション |
| Remove Project Owner | プロジェクトオーナー削除アクション |
| Delete User | ユーザー削除ボタン |
| Add Company Owner | カンパニーオーナー追加アクション |
| Remove Company Owner | カンパニーオーナー削除アクション |
| Tag Test Failure | テスト失敗タグ付けリンク/ボタン |
| Create Issue | 課題作成ボタン |
| Link to Issue | 課題リンクフィールド |
| Show Section | セクション表示ボタン |
| CSV Download | CSV ダウンロードボタン |
| Copilot User Licenses | Copilot ライセンス管理セクション |
| Assign Copilot Seats to Teammates | Copilot シート割り当てダイアログ |
| Go to Secrets Manager | シークレットマネージャーへのナビゲーションアクション |
| Project Name | Project Settings のプロジェクト名セクション |
| Default Test Configuration | Project Settings のデフォルトテスト設定セクション |
| Allow Auto-improve on Master | master ブランチの Auto-improve 許可トグル |
| All Branches | ブランチ選択の全ブランチオプション |
| Filter Test Runs | テスト実行フィルターペイン名 |
| Device Info | 実行結果のデバイス情報列ヘッダー |
| Bug in App | 失敗タイプタグ（アプリケーションのバグ） |
| Test Runs | テスト実行結果ビュー |
| Teammates | Testim のチームメイト概念 |
| Company | Testim の組織（カンパニー）概念 |
| Suite List | テストスイートリスト UI 要素 |
| Plans List | テストプランリスト UI 要素 |
| Before Suite | Testim Config Hook 名 |
| Before Test | Testim Config Hook 名 |
| After Suite | Testim Config Hook 名 |
| Include Full Network in HAR | HAR 記録設定オプション |
| User Assignment Required | Azure AD のユーザー割り当て必須オプション |
| View IDP Metadata | Okta の IDP メタデータ表示アクション |
| Assign to Users | Okta / Azure AD のユーザー割り当てアクション |
| More Actions | OneLogin のアクションドロップダウン |
| Webhook | 通知メカニズム |
| Project Owner | Testim プロジェクトオーナーロール |
| Company Owner | Testim カンパニーオーナーロール |
| New Credentials | 暗号化認証情報作成ボタン |
| Add default values | Encrypted Credentials フォームフィールドラベル |
| All Users | ユーザー選択オプション（権限付与画面） |
| View Profile | ユーザープロファイル表示リンク |
| User Profile | ユーザープロファイル画面名 |
| Run test | テスト実行ボタンラベル |
| Enter a new name for this project | プロジェクト名編集ダイアログフィールドラベル |
| Allow auto-complete suggestions | Project Settings の自動補完トグル |
| Add hidden params | Hidden Parameters 追加リンク |
| The params you want to hide | Hidden Parameters ダイアログフィールドラベル |
| Remove From Project | プロジェクトからの削除確認ダイアログ |
| Success Rate | 統計パネルの成功率ラベル |
| Executions Passed | 統計パネルの合格実行数ラベル |
| Average Duration | 統計パネルの平均時間ラベル |
| Tests Passed | 統計パネルの合格テスト数ラベル |
| Filter by Date | 日付フィルターラベル |
| Search Execution List | 実行検索機能名 |
| Remote run | 実行名規則テーブル値 |
| Local suite | 実行名規則テーブル値 |
| Information Icon | 情報アイコン UI 要素 |
| Extension Version | デバッグ情報項目 |
| CLI Version | デバッグ情報項目 |
| Grid Name | デバッグ情報項目 |
| Test Owner | テスト所有者ラベル / フィルター |
| Result labels | テーブル列ヘッダー |
| Avr. duration | 統計パネル略称ラベル |
| Select All | フィルター全選択オプション |
| Failure Type | 失敗タイプ列ヘッダー |
| Failed with retries | テスト実行ステータス値 |
| Run locally | テスト実行方法ラベル |
| Run on grid | テスト実行方法ラベル |
| Element not visible | テスト失敗タイプ #1 |
| Element not Found | テスト失敗タイプ #2 |
| Tab not Found | テスト失敗タイプ #3 |
| Frame not Found | テスト失敗タイプ #4 |
| JavaScript Error | テスト失敗タイプ #5 |
| Could not get Browser | テスト失敗タイプ #6 |
| Browser Type is not Supported | テスト失敗タイプ #7 |
| Page is not Available | テスト失敗タイプ #8 |
| Failed to Set Text | テスト失敗タイプ #9 |
| Failed to Click | テスト失敗タイプ #10 |
| Concurrency Limit Reached | テスト失敗タイプ #11 |
| Test is Too Long | テスト失敗タイプ #12 |
| API Step Failed | テスト失敗タイプ #13 |
| Could not resize to view-port size | テスト警告タイプ #1 |
| Environment issue | 失敗タイプタグ値 |
| Invalid test data | 失敗タイプタグ値 |
| Test design | 失敗タイプタグ値 |
| Publish Bug | バグレポート公開画面名 |
| View Screenshot | スクリーンショット表示ボタン |
| Network Log | ネットワークログタブ名 |
| Errors Only | エラーのみフィルター |
| Response Headers | HTTP レスポンスヘッダーセクション |
| Request Headers | HTTP リクエストヘッダーセクション |
| View network log | ネットワークログ表示メニュー |
| Network Activity | ネットワークアクティビティ画面 |
| Ext. version | テスト情報パネル項目 |
| Run mode | テスト情報パネル項目 |
| Run config. | テスト情報パネル項目 |
| Zoom level | テスト情報パネル項目 |
| X-User-Access-Key | Encrypted Credentials HTTP ヘッダー名 |
| Timeout | テスト実行ステータス値 |
| Passed | テスト実行ステータス値 |
| Failed | テスト実行ステータス値 |
| Status | Webhook JSON ペイロードフィールド |
| projectId | Webhook JSON ペイロードフィールド |
| executionId | Webhook JSON ペイロードフィールド |
| schedulerName | Webhook JSON ペイロードフィールド |
| executionUrl | Webhook JSON ペイロードフィールド |
| Custom Grid | ユーザー所有のカスタム Selenium Grid オプション |
| Cloud Grid | Testim Cloud Grid (デフォルト提供) |
| Testim Cloud Grid | Testim 提供のクラウドグリッド |
| Local grid | ローカル Grid 実行オプション |
| Remote Grid | リモート Grid 実行オプション |
| Add New Grid | Grid 追加ダイアログのボタン |
| Grid Type | Grid 設定画面の種別フィールド |
| Sign in | Grid 設定画面のログインボタン |
| Grant Access | Grid アクセス付与ボタン |
| My Settings | TestRail のユーザー設定画面 |
| API Keys | API キー管理タブ |
| API Key | API キーラベル |
| API Token | API トークンラベル |
| Generate Key | API キー生成ボタン |
| Start A Trial | トライアル開始ボタン |
| Start a Trial | トライアル開始ボタン (小文字バリアント) |
| Run on a grid | テスト実行オプション |
| Custom capabilities | Grid 追加のカスタムケイパビリティ機能 |
| Custom Capabilities | Custom capabilities の Title Case バリアント |
| Custom Host | カスタムホスト設定 |
| Custom Port | カスタムポート設定 |
| URL Callout | Copado / CI コール機能のステップ名 |
| URL Callout ステップ | Copado の URL Callout ステップ |
| Execute Shell Command | Jenkins のシェルコマンド実行ステップ |
| Jenkins Execute Shell Command | Jenkins シェルコマンド実行ステップ (複合表記) |
| Add New Config | Grid 設定画面の新規設定ボタン |
| Create & Map | TTM for Jira 一括マッピングボタン |
| Create & map TTM for Jira tests | TTM for Jira 一括作成ボタン |
| Retry all | 失敗再実行リンク |
| Test Properties | テストプロパティパネル |
| Test in TTM for Jira | プロパティセクション名 (TTM for Jira) |
| Folder Path in TTM for Jira | TTM for Jira フォルダーパス設定 |
| Create the same Testim folder path | TTM for Jira フォルダーパスオプション |
| My test cases | TTM for Jira 単一フォルダー名 |
| My Test Cases | TTM for Jira 単一フォルダー名 (Title Case) |
| Test Execution | 既出 - qTest の UI 画面名 |
| Test Library | テストライブラリ画面 |
| Password/access key | Grid 認証パスワード / アクセスキーフィールド |
| access key | BrowserStack アクセスキーフィールド |
| user name | BrowserStack 設定の user name ラベル |
| host name | BrowserStack 設定の host name ラベル |
| Bug in App | 既出 - 失敗タイプタグ |
| Create & map | 一括マッピングボタン (小文字バリアント) |
| Create and map | 一括マッピングアクション |
| Test Execution tab | qTest / TTM for Jira 実行タブ名 |
| Test Runs tab | qTest の実行タブ名 |
| Testim.io | Testim 旧称 / テスト実行名プレフィックス |
| W3C format | W3C 準拠の capabilities format |
| JSON object | JSON オブジェクト形式 |
| base url | Testim のベース URL 設定 |
| revision control | 版管理（revision control system）|
| revision control system | 版管理システム (Bitbucket context) |
| source code | ソースコード (generic) |
| bug tracker | バグトラッカー機能 |
| bug / issue tracking system | バグ/課題トラッキングシステム |
| mobile configuration | モバイルテスト設定 |
| Mobile Configuration | モバイル設定 (Title Case) |
| Device Management | モバイルデバイス管理画面 |
| Apps Library | モバイルアプリライブラリ |
| Mobile Apps | モバイルアプリ画面 |
| virtual device | モバイル仮想デバイス |
| iOS application | iOS アプリケーション |
| Android application | Android アプリケーション |
| Community license | Community 版ライセンス |
| trial license | トライアルライセンス |
| advanced test parameter | 高度なテストパラメーター |
| third party grid | 第三者グリッド (SauceLabs / BrowserStack / LambdaTest 等) |
| Third party grid | 第三者グリッド (Title Case) |
| Third Party Grid | 第三者グリッド (Title Case) |
| project / repository | プロジェクト / リポジトリ |
| Pull Request | Git プルリクエスト |
| pull request | Git プルリクエスト (小文字) |
| Options arrow | テスト実行ボタンの options arrow |
| options arrow | テスト実行ボタンの options arrow |
| scheduled test run | スケジュールされたテスト実行 |
| scheduler | スケジューラー機能 |
| Scheduler | 既出 - テストスケジューラー画面 |
| What to run on | scheduler の実行先設定 |
| Override custom capabilities | scheduler の custom capabilities 上書き |
| command line interface | CLI の完全表記 |
| grid parameter | --grid パラメーター |
| host / port parameter | 旧来の host / port パラメーター |
| API action | API アクションステップ (generic) |
| REST API | REST API |
| Testim REST API | Testim の REST API |
| CI job | CI ジョブ |
| CI jobs | CI ジョブ (複数形) |
| test plan | テストプラン |
| test plans | テストプラン (複数形) |
| test suite | テストスイート |
| test suites | テストスイート (複数形) |
| test label | テストラベル |
| test labels | テストラベル (複数形) |
| Publish Bug | 既出 - バグレポート公開画面 |
| branch name | ブランチ名 |
| execution name | 実行名 |
| integration | 統合機能 generic term |
| admin access | 管理者アクセス |
| trial | トライアル期間 |
| Master | 既出 - Git / Testim ブランチ名 |
| Mobile Apps Library | モバイルアプリライブラリ (既出) |
| Setup Step | テストのセットアップステップ |
| Setup step | テストのセットアップステップ (lowercase step) |
| Show Properties | プロパティ表示ボタン |
| Application name | アプリ名プロパティ |
| Change app | アプリ変更リンク |
| change app | アプリ変更リンク (lowercase) |
| Library option | From Library オプション |
| From Library | app 選択オプション |
| From Device | app 選択オプション |
| drop-down menu | ドロップダウンメニュー |
| drop down menu | ドロップダウンメニュー (no hyphen) |
| command example | CLI コマンド例 |
| command prompt | コマンドプロンプト |
| Copy ID | ID コピーボタン |
| app-id | CLI フラグ名 |
| Scheduled Runs | スケジュール済み実行画面 |
| Override application | アプリケーション上書きチェックボックス |
| Select from library | ライブラリから選択ボタン |
| Virtual Mobile Grid trial | VMG トライアル |
| trial period | トライアル期間 |
| CLI command | CLI コマンド |
| CLI commands | CLI コマンド (複数形) |
| admin access | 管理者アクセス (既出) |
| HTTPS tunnel | HTTPS トンネル |
| options arrow | options arrow (既出) |
| time zone | タイムゾーン |
| revision control | 版管理 |
| parallel run | 並列実行 |
| parallel runs | 並列実行 (複数形) |
| mobile app | モバイルアプリ (固有 noun phrase) |
| mobile apps | モバイルアプリ (複数形) |
| virtual device | 仮想デバイス (noun phrase) |
| virtual devices | 仮想デバイス (複数形) |
| iOS simulator | iOS シミュレータ |
| Android emulator | Android エミュレータ |
| iOS application | iOS アプリケーション (既出) |
| Android application | Android アプリケーション (既出) |
| source code | ソースコード (既出) |
| revision control system | 版管理システム (既出) |
| bug tracker | バグトラッカー (既出) |
| bug / issue tracking system | バグ/課題トラッキングシステム (既出) |
| mobile configuration | モバイルテスト設定 (既出) |
| Mobile Configuration | モバイル設定 (既出) |
| Device Management | モバイルデバイス管理 (既出) |
| Apps Library | モバイルアプリライブラリ (既出) |
| Mobile Apps | モバイルアプリ画面 (既出) |
| Community license | Community 版ライセンス (既出) |
| trial license | トライアルライセンス (既出) |
| advanced test parameter | 高度なテストパラメーター (既出) |
| third party grid | 第三者グリッド (既出) |
| Third party grid | 第三者グリッド (既出) |
| Third Party Grid | 第三者グリッド (既出) |
| project / repository | プロジェクト / リポジトリ (既出) |
| Pull Request | Git プルリクエスト (既出) |
| pull request | Git プルリクエスト (既出) |
| scheduled test run | スケジュールされたテスト実行 (既出) |
| What to run on | scheduler 実行先設定 (既出) |
| Override custom capabilities | scheduler の custom capabilities 上書き (既出) |
| command line interface | CLI 完全表記 (既出) |
| grid parameter | --grid パラメーター (既出) |
| host / port parameter | 旧来の host / port パラメーター (既出) |
| API action | API アクションステップ (既出) |
| REST API | REST API (既出) |
| Testim REST API | Testim の REST API (既出) |
| CI job | CI ジョブ (既出) |
| CI jobs | CI ジョブ (複数形, 既出) |
| Publish Bug | 既出 - バグレポート公開画面 |
| branch name | ブランチ名 (既出) |
| execution name | 実行名 (既出) |
| Test Execution tab | qTest / TTM for Jira 実行タブ名 (既出) |
| Test Runs tab | qTest の実行タブ名 (既出) |
| BUILD_NUMBER | CI 環境変数プレースホルダー |
| report-file | Testim CI --report-file フラグ |
| Release Manager | Copado Release Manager |
| Copado Release Manager | Copado の Release Manager モジュール名 |
| Perform callout and continue with deployment | Copado URL Callout ステップの Type 値 |
| Perform callout and pause step | Copado URL Callout ステップの Type 値 (pause) |
| Deploy All | Copado Deploy All ボタン |
| Dynamic URL Parameters | Copado URL Callout のオプション |
| Resume URL | Copado pause step の Resume URL |
| Continuous Integration | CI の完全表記 |
| View Results | Copado の View Results ボタン |
| Runs > Configuration | Testim Configuration リスト |
| After test handler | Testim Config Hook 項目 |
| Content-Type | HTTP Content-Type ヘッダー |
| application/json | MIME type |
| Test Plan | Testim Test Plan |
| Test Label | Testim Test Label |
| JSON payload | JSON ペイロード |
| Add API action | Testim API action ステップ (既出) |
| Send via web page | プロパティ名 (既出) |
| shared step | Testim 共有ステップ |
| shared steps | Testim 共有ステップ (複数形) |
| Grids | Testim Grids セクション (top-right profile) |
| Access key | LambdaTest / Grid アクセスキー |
| Project token | LambdaTest プロジェクトトークン |
| Project Token | LambdaTest プロジェクトトークン (Title Case) |
| SmartUI | LambdaTest SmartUI 製品名 |
| LambdaTest SmartUI | LambdaTest SmartUI 製品名 |
| Smart UI | LambdaTest Smart UI バリアント表記 |
| Visual testing | Testim 設定メニュー項目 (Visual testing) |
| visual testing provider | ビジュアルテストプロバイダー |
| Integrate LambdaTest SmartUI | LambdaTest SmartUI 統合セクション見出し |
| Visual testing tab | Testim 設定 visual testing タブ |
| Add a new API key | Applitools Eyes の API key 追加ボタン |
| Run Key | Applitools Run Key フィールド |
| Merge Key | Applitools Merge Key フィールド |
| App Name | Applitools App Name フィールド (既出) |
| Applitools Eyes | Applitools のビジュアルテスト製品 |
| Cloud URL | Applitools Cloud URL フィールド |
| Admin panel | Applitools Eyes の Admin 画面 |
| API keys | Applitools API keys セクション (複数形) |
| Expiry | Applitools API key Expiry フィールド |
| Purpose | Applitools API key Purpose フィールド |
| Permissions | Applitools API key Permissions セクション |
| Visual Validation | 検証機能ページ名 |
| Execute | Applitools Permissions Execute |
| Merge | Applitools Permissions Merge |
| wait-for | Testim wait-for ステップ統合プレフィックス |
| Test run and results | TestRail のタブ名 |
| Save settings | TestRail API key 保存ボタン |
| ApiKey | Testim 設定フィールド名 (TestRail) |
| Suite\\Test name | TestRail 実行名テンプレート |
| Report from Testim.io | TestRail 実行名プレフィックス |
| tms-field-file | TestRail CLI フラグ |
| executed_by | TestRail カスタムパラメーター |

## SSO / 認証連携 UI ラベル

SSO プロバイダー（Azure AD / Okta / OneLogin）の設定画面 UI ラベル。JA 文中でも英語のまま維持する。

| 用語 | 備考 |
| --- | --- |
| Enterprise application | Azure AD のエンタープライズアプリケーション画面 |
| Single sign-on | Azure AD / SSO 設定画面名 |
| Basic SAML Configuration | Azure AD の SAML 基本設定セクション |
| User Attributes & Claims | Azure AD のユーザー属性・クレーム設定 |
| SAML Signing Certificate | Azure AD の SAML 署名証明書セクション |
| Federation Metadata XML | Azure AD のフェデレーションメタデータファイル |
| Upload metadata file | Azure AD のメタデータアップロードアクション |
| Users and groups | Azure AD のユーザー/グループ管理画面 |
| Identifier (Entity ID) | SAML エンティティ ID フィールド |
| Reply URL | SAML 応答 URL フィールド |
| Sign on URL | SAML サインオン URL フィールド |
| Application ID | SAML アプリケーション ID フィールド |
| Assertion Consumer Service URL | SAML ACS URL フィールド |
| Service Provider Metadata | SAML SP メタデータダウンロードリンク |
| Service Provider Details | SAML SP 詳細セクション |
| Identity Provider | SAML ID プロバイダーセクション |
| Create App Integration | Okta のアプリ統合作成ボタン |
| Upload Logo | Okta のロゴアップロードボタン |
| Audience URI | Okta の Audience URI フィールド |
| SAML Test Connector | OneLogin の SAML テストコネクター |
| Display Name | OneLogin の表示名フィールド |
| Create your own application | Azure AD のカスタムアプリ作成オプション |
| Add Users/Group | Azure AD のユーザー/グループ追加ボタン |
| ACS (Consumer) URL Validator | OneLogin の ACS URL バリデーターフィールド |
| ACS Consumer URL | OneLogin の ACS Consumer URL フィールド |
| Identity Provider (IDP) Metadata | IDP メタデータセクション（SAML 設定） |
| Application Username | Okta のアプリケーションユーザー名フィールド |
| Include in SAML Assertion | OneLogin の SAML アサーション含有チェックボックス |
| Source Attribute | SAML ソース属性フィールド |
| FirstName | SAML/SSO フィールド識別子（連結表記） |
| First Name | SAML/SSO 表示名フィールド |
| LastName | SAML/SSO フィールド識別子（連結表記） |
| Last Name | SAML/SSO 表示名フィールド |
| ProfilePicture | SAML/SSO フィールド識別子（連結表記） |
| Profile Picture | SAML/SSO 表示名フィールド |
| User Attribute & Claims | Azure AD のユーザー属性・クレーム設定（単数形） |
| Azure Portal Admin | Azure ポータル管理者ログインコンテキスト |
| Okta Admin | Okta 管理者アカウントコンテキスト |
| Testim SSO | SSO コネクタアプリケーション名の例 |
| App Name | Okta のアプリ名フィールド |
| Configure SAML | Okta の SAML 設定画面名 |
| Name ID format | Okta の Name ID format フィールド |
| Add Another | Okta の属性追加ボタン |
| SAML Signing Certificates | Okta の SAML 署名証明書セクション（複数形） |
| New Application | Azure AD の新規アプリケーション作成メニュー |
| Upload File | メタデータアップロードボタン（SSO 設定共通） |
| Logout URL | OneLogin の Logout URL フィールド |
| Single Logout URL | OneLogin の Single Logout URL フィールド |
| User Info | OneLogin のユーザー情報画面名 |
| Add App | OneLogin のアプリ追加ボタン |

## Testim ステップ名（検証・待機・アクション）

Testim UI に表示されるステップ名は英語のまま維持する。

| 用語 | 備考 |
| --- | --- |
| Add custom validation | 検証ステップ |
| Add network validation | 検証ステップ |
| Validate CSS property | 検証ステップ |
| Validate HTML attribute | 検証ステップ |
| Add API action | アクションステップ |
| Validate API | 検証ステップ |
| Validate element visible | 検証ステップ |
| Validate element not visible | 検証ステップ |
| Validate element text | 検証ステップ |
| Validate radio button | 検証ステップ |
| Validate element visualization | 検証ステップ |
| Validate viewport visualization | 検証ステップ |
| Validate full-page visualization | 検証ステップ |
| Validate page accessibility | 検証ステップ |
| Validate element accessibility | 検証ステップ |
| Add custom wait for | 待機ステップ |
| Wait for element visible | 待機ステップ |
| Wait for element not visible | 待機ステップ |
| Wait for element text | 待機ステップ |
| Wait for download | 待機ステップ |
| Wait for element visualization | 待機ステップ |
| Add hover action | アクションステップ |
| Add extract value step | アクションステップ |
| Generate email address | アクションステップ |
| Add navigation action | アクションステップ |
| Add custom action | アクションステップ |
| Generate random value | アクションステップ |
| Generate date | アクションステップ |
| Get Cookie | アクションステップ |
| Set Cookie | アクションステップ |
| Drag & Drop | 自動記録ステップ |
| Set Custom Text | テキスト設定ステップ |
| Set Text | テキスト設定ステップ（基本形） |
| Download validation | 自動記録ステップ |
| Recorded steps and validations | ステップ分類ラベル |
| Recorded Steps and validations | ステップ分類ラベル（大文字バリアント） |

## Testim プロパティ名

ステッププロパティパネルに表示されるプロパティ名は英語のまま維持する。

| 用語 | 備考 |
| --- | --- |
| Element must be visible | プロパティ名 |
| When this step fails | プロパティ名 |
| When to run step | プロパティ名 |
| Allow API request retry | プロパティ名 |
| Pre-step delay | プロパティ名（ms 単位） |
| Replace with a clone | プロパティ名 |
| See old revisions | プロパティ名 |
| Send via web page | プロパティ名 |
| Native events | プロパティ名 |
| Variable scope | プロパティ名 |
| Variable name | プロパティ名 |
| Error Suffix | プロパティ名 |
| Override timeout | プロパティ名 |
| Target Element | プロパティ名 |
| Cookie name | プロパティ名 |
| Date format | プロパティ名 |
| Extract Mode | プロパティ名 |
| Sleep duration | プロパティ名 |
| String type | プロパティ名 |
| Time difference | プロパティ名 |
| URL to assign | プロパティ名 |
| Use UTC | プロパティ名 |
| Add Prefix | プロパティ名 |
| Add Suffix | プロパティ名 |
| Attribute name | プロパティ名 |
| Property name | プロパティ名 |
| Expected value | プロパティ名 |
| Expected status | プロパティ名 |
| Always Run | When to run step のオプション |
| Never (skip) | When to run step のオプション |
| Mark error & stop | When this step fails のオプション |
| Mark error & continue | When this step fails のオプション |
| Mark warning & continue | When this step fails のオプション |
| Shared step name | プロパティ名（共有ステップ版） |
| Step name | プロパティ名（非共有ステップ版） |
| Test Name | テスト名入力フィールドラベル（2-word compound） |
| Test Description | テスト説明入力フィールドラベル（2-word compound） |

<!--
## キーボードキー名 / 一般単語 UI ラベル (登録禁止)

`Enter` / `Tab` / `Page Up` / `Page Down` / `Approve` のような一般的な英単語の
GLOSSARY 登録は禁止する (PR#267 round 2 review で false-negative を確認)。

理由:
- `parity_glossary_mask.maskSegmentText` は `\b word \b` で case-insensitive マッチ
- `classifySegment` は residue が < 15 chars または < 3 words なら
  `isFullyMasked=true` に落とすが、これは「長い英文は検知継続」という意味では
  なく、**「短い英文は mask されれば silent pass」という意味**
- 具体例: "Click Approve now" (17 chars, 3 words) に `Approve` mask を適用
  → residue "Click now" (9 chars, 2 words) → `isFullyMasked=true`
  → **silent false-negative** (本来 flag すべき全英文 segment が検知漏れ)

UI ラベルやキー名を英語維持したい場合は、代わりに以下を使う:
- `docs/INVARIANT_TOKENS.md` に文脈付き regex を追加
  (例: "keyboard-shortcut" パターンは `Ctrl+Enter` / `Shift+Tab` のような
   修飾子結合のみマッチし、裸の `Enter` / `Tab` は mask しない)
- 翻訳時に key 名を **太字** + 日本語補足 (例: "**Enter** キーを押します") と
  して記述し、classifier の CJK 比率でマスク不要にする

この方針は `scripts/__tests__/parity_glossary_mask.test.mjs` の
`"GLOSSARY common-word false-negative regression"` suite で pin されている。
-->

## 一般的な技術用語（英語維持）

| 用語 | 備考 |
| --- | --- |
| CLI | Command Line Interface |
| CI | Continuous Integration |
| CI/CD | |
| API | |
| URL | |
| TMS | テスト管理システムの略称（Test Management System） |
| URI | |
| ID | 識別子 |
| JSON | |
| YAML | |
| XML | |
| HTML | |
| CSS | |
| JavaScript | |
| TypeScript | |
| npm | |
| Node.js | |
| Android | モバイルプラットフォーム |
| iOS | モバイルプラットフォーム |
| macOS | デスクトップ OS |
| Linux | OS |
| Firefox | ブラウザ |
| Safari | ブラウザ |
| Edge Legacy | Microsoft Edge Legacy (旧 EdgeHTML 版、サポート終了済み) |
| Internet Explorer | Microsoft 旧ブラウザ (サポート終了済み) |
| Java | プログラミング言語 |
| Kotlin | プログラミング言語 |
| Objective C | プログラミング言語 |
| Objective-C | プログラミング言語（ハイフン表記バリアント） |
| Swift | プログラミング言語 |
| SwiftUI | Apple の UI フレームワーク |
| React Native | クロスプラットフォームモバイル FW |
| Flutter | クロスプラットフォームモバイル FW |
| Webviews | モバイルアプリ内埋め込み Web ビュー（複数形） |
| WebView | モバイルアプリ内埋め込み Web ビュー（単数形） |
| AUT | Application Under Test（Testim 固有略語） |
| Application Under Test | AUT の完全表記 |
| JS | JavaScript の略称 |
| Chrome | Google Chrome ブラウザ |
| Chromium | オープンソースブラウザエンジン |
| iPhone | Apple のモバイルデバイス |
| Windows | Microsoft OS |
| VMG | Virtual Mobile Grid の略 |
| SSO | Single Sign-On |
| SAML | 認証連携プロトコル |
| Ctrl/Cmd | キーボード修飾キーの表記（ctrl/cmd と小文字でも使用） |
| Quarantine | Testim のテスト隔離機能・ステータス |
| HAR | HTTP Archive フォーマット |
| Mac | macOS の略称 / プラットフォーム名 |
| TLS | Transport Layer Security |
| AES-256 | 暗号化規格 |
| SSE-S3 | AWS サーバーサイド暗号化 |
| DOM | Document Object Model |
| XHR | XMLHttpRequest の略 |
| CORS | Cross-Origin Resource Sharing |
| TMA | Tricentis Mobile Agent の略称 |
| PDF | Portable Document Format |
| MacBook Pro | Apple ノートブックデバイス名 |
| buildSessionId | Sealights 統合パラメーター名 |
| labId | Sealights 統合パラメーター名 |
| beforeSuite | Testim Config Hook 名 (JS) |
| afterSuite | Testim Config Hook 名 (JS) |
| beforeTest | Testim Config Hook 名 (JS) |
| afterTest | Testim Config Hook 名 (JS) |
| allLabels | Config Hook 事前定義パラメーター名 |
| baseUrl | Config ファイルプロパティ名 |
| user.email | SSO フィールドマッピング識別子 |
| user.userprincipalname | Azure AD フィールドマッピング識別子 |
| user.mail | Azure AD フィールドマッピング識別子 |
| Edge | Microsoft Edge ブラウザ名 |
| IE | Internet Explorer 略称 |
| VPN | Virtual Private Network 略称 |
| IP | Internet Protocol / アドレス略称 |
| Geolocation | 地理位置情報技術用語 |
| Send via webpage | Testim プロパティオプション（1 語表記バリアント） |
| Master | Git / Testim ブランチ名 |
| module.exports | JS エクスポート構文 |
| HTTP | Hypertext Transfer Protocol |
| visibility | CSS プロパティ名 |
| UTC | Coordinated Universal Time タイムゾーン略称 |
| CSV | Comma-Separated Values ファイル形式 |
