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
| Validate download | 検証ステップ（ダウンロードファイル内容検証） |
| Validate email | 検証ステップ（メール検証） |
| Validate element attribute | 検証ステップ |
| Add network validation | 検証ステップ |
| Apex action | Salesforce Apex アクションステップ |
| Custom wait for | 待機ステップ（カスタム待機） |
| Add custom action | アクションステップ |
| Page accessibility validation | アクセシビリティ検証ステップ |
| Visual validation | ビジュアル検証ステップ |
| Predefined steps | Testim 定義済みステップメニュー |
| Name the new step | ステップ追加ダイアログのフィールドラベル |
| Create Step | ステップ作成ボタン |
| Back arrow | エディターの戻るボタン |
| Show Properties | プロパティパネル表示アイコン |
| Text to assign | Set Text ステップのテキスト入力フィールド |
| Run additional code on request results | API ステップの追加コード実行トグル |
| View Sent Request | API ステップの送信リクエスト表示ボタン |
| Upload Data File | データファイルアップロードボタン |
| Configuration List | テスト構成一覧画面 |
| Configuration File | テスト構成ファイル |
| Test Configuration Properties | Test Configuration プロパティパネル |
| Default Configuration | 既定のテスト構成 |
| Add new configuration | テスト構成追加ダイアログ |
| Change default configuration | 既定構成変更ダイアログ |
| Add Environment | Salesforce 環境追加ボタン |
| Before each step | Testim フック種別 |
| After each step | Testim フック種別 |
| Before test | Testim フック種別 |
| After test | Testim フック種別 |
| Before each step handler | Testim フック名 |
| After each step handler | Testim フック名 |
| Before test handler | Testim フック名 |
| After test handler | Testim フック名 |
| Run on | フック実行条件ドロップダウンラベル |
| Paste code at cursor | コードエディター挿入アクション |
| Context Selection Mode | Testim のロケーター設定モード |
| Turbo Mode | Testim Mobile のターボモード |
| Duplication Level | 重複検出レベル設定 |
| Number of matches | マッチ数 |
| Number of steps | ステップ数 |
| Match level | マッチレベル設定 |
| Enable RCA | RCA (Root Cause Analysis) 有効化トグル |
| Ignore Displacement Diffs | ビジュアル検証の変位差分無視オプション |
| Ignore Displacement diffs | ビジュアル検証オプション（小文字バリアント） |
| Ultrafast Test Cloud | Applitools Ultrafast Test Cloud |
| App Registration | Salesforce のアプリ登録セクション |
| One-Time Password Authenticator | Salesforce の MFA 認証アプリ項目 |
| Verification Code | MFA 認証コードフィールド |
| Monaco Editor | Testim のコードエディター名 |
| Fail test from impact level | アクセシビリティ検証の失敗基準設定 |
| Run only specific tags | アクセシビリティ検証のタグ絞り込みフィールド |
| Exclude specific rule IDs | アクセシビリティ検証の除外ルール設定 |
| Accessibility violations were found | アクセシビリティ違反検出メッセージ |
| Setting up MFA | Salesforce MFA 設定ガイドリンクテキスト |
| Using Parameters | Testim ドキュメントのセクションリンクテキスト |
| Exports Parameters | Testim ドキュメントのセクションリンクテキスト |
| Configuring a Data Driven Test from the Visual Editor | データ駆動テスト設定ページリンクテキスト（単語境界バリアント） |
| Configuring Data Driven Tests using the Config file | データ駆動テスト（Config）設定ページリンクテキスト |
| Allow access to file URLs | Chrome 拡張機能の権限名 |
| Download PDF files instead of automatically opening them in Chrome | Chrome PDF 設定トグル名 |
| Download PDFs | Chrome PDF 設定オプション |
| Privacy and security | Chrome 設定セクション名 |
| Site Settings | Chrome 設定セクション名 |
| Site settings | Chrome 設定セクション名（小文字バリアント） |
| Additional content settings | Chrome 設定セクション名 |
| PDF documents | Chrome 設定項目 |
| Default behavior | Chrome PDF デフォルト動作セクション |
| Ask where to save each file before downloading | Chrome ダウンロード設定トグル |
| Run Shared API Validation | Validate API ステップエディターウィンドウ名 |
| Run API Action | API アクションステップ実行名 |
| Run Action | アクションステップ実行名 |
| Run Download Validation | Validate download ステップ既定説明文 |
| Run download validation | Validate download ステップ既定説明文（小文字） |
| Accessibility Validation | アクセシビリティ検証ステップ既定名 |
| DevTools Network | Chrome DevTools のネットワークパネル |
| Key-Value | API ステップのヘッダー入力モード |
| Form Data | API ステップのフォームデータエントリタイプ |
| Upload File | ファイルアップロードボタン |
| File Drop | ファイルアップロード記録ステップ名 |
| Browse for file | ファイルアップロード記録ステップ名 |
| File drop | 小文字バリアント |
| Element Attribute Validation | Validate Element Attribute フォーム名 |
| Attribute name | Validate Element Attribute の属性名フィールド |
| Expected value | 検証ステップの期待値フィールド |
| Property name | Validate CSS property のプロパティ名フィールド |
| List of possible attributes | モバイル要素属性リンクテキスト |
| Toggle breakpoint | ステップブレークポイントトグル |
| Convert to file | テストデータファイル変換ボタン |
| Reusable file | 再利用可能テストデータファイルオプション |
| Scheduled Runs | スケジュール実行画面 |
| Scheduled runs | 小文字バリアント |
| All impact levels | アクセシビリティ違反の影響レベルトグル |
| All impact level | トグル（単数形バリアント） |
| Check here for more details | アクセシビリティ検証結果の詳細リンク |
| To choose an element open base URL or run test to relevant step | Wait for 要素選択時のメッセージ |
| To choose an element open app or run test to relevant step | Wait for 要素選択時のメッセージ（モバイル） |
| Delay time in milliseconds | Wait for 遅延時間入力フィールド |
| Add hidden parameter | Hidden Parameters 追加ボタン |
| Params | ステッププロパティパネルのパラメーターセクション |
| Show test properties | テストプロパティ表示アイコン |
| Show step properties | ステッププロパティ表示アイコン |
| Custom (create new) | 構成ドロップダウンの新規作成オプション |
| My custom error | エラーサフィックスのサンプル文字列 |
| Context selection mode | ロケーターコンテキスト選択モード |
| Set username | Test Data コードのサンプル識別子 |
| Set Username | Test Data コードのサンプル識別子（大文字） |
| Getting Cookies using the Get Cookie step | Cookie ページ内のセクションリンクテキスト |
| Create new Cookie | Cookie 作成ラジオボタン |
| Use cookie parameter | Cookie パラメーター利用ラジオボタン |
| Expires (Max-Age) | Cookie 有効期限フィールド |
| Parameter Name | ステッププロパティのパラメーター名フィールド |
| Test Data | Setup ステップのテストデータプロパティ |
| test data | 小文字バリアント |
| Parameters in custom JavaScript steps | ドキュメントリンクテキスト |
| Validate Element Attribute | Validate Element Attribute ステップ名（大文字バリアント） |
| validate element attribute | 小文字バリアント |
| Network Capture Options | ネットワークキャプチャオプションセクション |
| Capture request body | ネットワーク検証オプション |
| Capture response body | ネットワーク検証オプション |
| Editing target element properties | ドキュメントリンクテキスト |
| Target element | Target Element の小文字バリアント |
| Duplicate steps | auto-grouping 画面のラベル |
| Filter & sort steps duplications | auto-grouping フィルターダイアログ名 |
| Filter and sort steps duplications | 小文字バリアント |
| Min. steps | auto-grouping フィルター min ステップ数フィールド |
| Max steps | auto-grouping フィルター max ステップ数フィールド |
| Select original | auto-grouping 元候補へ戻すボタン |
| Create shared group | auto-grouping 共有グループ作成ボタン |
| Shared group name | 共有グループ名入力フィールド |
| Number of steps | 重複ステップ数設定ラベル |
| Edited | auto-grouping 候補編集ラベル |
| The number of duplicate steps | auto-grouping 重複数説明テキスト |
| The number tests and groups | auto-grouping テスト数説明テキスト |
| Reviewing auto-grouping suggestion | auto-grouping ドキュメント内セクション見出し |
| Editing the auto-grouping suggestion | auto-grouping ドキュメント内セクション見出し |
| Filtering auto-grouping suggestions | auto-grouping ドキュメント内セクション見出し |
| Sorting auto-grouping suggestions | auto-grouping ドキュメント内セクション見出し |
| Creating the shared group based on the suggestion | auto-grouping ドキュメント内セクション見出し |
| auto grouping | 機能名（スペース表記バリアント） |
| Auto grouping | 機能名（スペース表記） |
| Auto-grouping | 機能名（ハイフン表記） |
| auto-grouping | 小文字バリアント |
| Don't repeat yourself | DRY 原則の英略表現 |
| Email filters | Validate Email のフィルタセクション |
| Email text extraction | Validate Email のテキスト抽出セクション |
| Expected subject | Validate Email の件名期待値フィールド |
| Expected body | Validate Email の本文期待値フィールド |
| Verification email inbox address | Validate Email の受信箱アドレスセクション |
| Verify email filters | Validate Email のフィルタ検証ボタン |
| Coded | Validate Email の Coded オプション |
| Codeless | Validate Email の Codeless オプション |
| Validate Email | Validate Email ステップ名（大文字バリアント） |
| validation email | 小文字バリアント |
| validate email | 小文字バリアント |
| Validation Email | Validate Email の別表記 |
| Generate Email Address | Generate Email Address ステップ |
| generate email address | 小文字バリアント |
| Add API action | アクションステップ（大文字バリアント） |
| Run API action | API アクション実行名 |
| Add API validation | Validate API ステップ別名 |
| Add custom validation | 検証ステップ |
| Add custom action | アクションステップ |
| Add Step | ステップ追加ダイアログ名 |
| Run validation | 検証ステップ既定説明 |
| Run action | アクションステップ既定説明 |
| Run network validation | Network Validation 既定説明 |
| Network capture options | 小文字バリアント |
| Element text | Element Text 検証概念 |
| Element Text Validation | Validate Element Text ステップ名 |
| Element text validation | 小文字バリアント |
| Advanced text validation | 高度なテキスト検証セクション見出し |
| Not Equal Validation | Validate Element Text ドキュメント内セクション見出し |
| Unsupported keyboard shortcut | Keyboard Shortcut ステップのエラーメッセージ |
| Download PDFs option | Chrome 設定のダウンロードオプション |
| Download the response info | API ステップ結果画面のダウンロードアクション |
| Assertion response | API ステップのアサーション結果ラベル |
| Adding an API Action Step | ドキュメント見出し |
| Including a File and/or Text field with an API Call Using Form Data | ドキュメント見出し |
| Cancel a File Upload in Progress | ドキュメント見出し |
| Replace a File Attachment | ドキュメント見出し |
| Exclude or Delete an Entry from the Body Section | ドキュメント見出し |
| Setup step | Testim の Setup ステップ |
| Setup | Setup ステップ名 |
| Validate download step | Validate download ステップ名（バリアント） |
| DOM | Document Object Model（小文字文脈バリアント用） |
| mobile web | モバイル Web プロジェクト種別 |
| JS parameter | JavaScript パラメータードロップダウン選択肢 |
| HTML parameter | HTML パラメータードロップダウン選択肢 |
| Package parameter | パッケージパラメータードロップダウン選択肢 |
| packageVariable | パラメーター既定名 |
| HttpOnly | Cookie 属性フラグ |
| httpOnly | 小文字バリアント |
| Cookie name | Cookie 名プロパティ |
| Cookie value | Cookie 値プロパティ |
| Cookie info | Cookie 情報セクション |
| Config File | 設定ファイル（英語維持） |
| Config file | 小文字バリアント |
| Run Hooks | 実行フック（英語維持） |
| run hooks | 完全小文字バリアント |
| Jurisdiction Name | CSV サンプルのヘッダー名 |
| Example Test | Excel サンプルのシート名 |
| Example Code | サンプルコードセクション見出し |
| Example Parameters | サンプルパラメーターセクション見出し |
| A Simple PDF File | PDF サンプルテキスト |
| Item A | Word サンプルテキスト |
| yellow-cat-cartoon-style-clipart | 画像サンプル名 |
| JSZip | JS パッケージ名 |
| Docxtemplater | JS パッケージ名 |
| XLSX | JS パッケージ名 |
| custom JavaScript | カスタム JS ステップ型（スペース区切り） |
| Custom JavaScript | 大文字バリアント |
| Keyboard Shortcut | キーボードショートカット |
| Add keyboard shortcut | キーボードショートカット追加アクション |
| Match Level | ビジュアル検証マッチレベル |
| Match levels | Applitools ドキュメントリンクテキスト |
| Root Cause Analysis | RCA 完全表記 |
| root cause analysis | 小文字バリアント |
| Applitools Eyes | Applitools ビジュアル検証製品 |
| applitools eyes | 小文字バリアント |
| Create a shared configuration | テスト設定ドキュメントリンクテキスト |
| Command Line Interface | CLI 完全表記 |
| Command line interface: test config | CLI ドキュメントリンクテキスト |
| exportsGlobal | JS API 名 |
| exportsTest | JS API 名 |
| networkRequests | ネットワーク検証の入力配列名 |
| requestBody | ネットワーク検証のリクエストボディプロパティ |
| responseBody | ネットワーク検証のレスポンスボディプロパティ |
| resposeHeaders | ネットワーク検証のヘッダープロパティ（タイポ含む既存 API） |
| statusCode | HTTP ステータスコード JS プロパティ |
| toAddress | メールアドレスパラメーター名（キャメルケース） |
| emailAddress | メールアドレスパラメーター名 |
| User Details | Salesforce Setup ユーザー詳細画面 |
| App Registration: One-Time Password Authenticator | Salesforce MFA 登録セクション |
| App Registration - One-Time Password Authenticator | ハイフン区切りバリアント |
| Google Authenticator | MFA 認証アプリ |
| Microsoft Authenticator | MFA 認証アプリ |
| Disconnect | Salesforce MFA 切断ボタン |
| Connect | Salesforce MFA 接続ボタン |
| Choose another verification method | MFA 別検証方法選択リンク |
| Choose a verification method | MFA 検証方法選択画面 |
| Use verification codes from an authenticator app | MFA コード利用オプション |
| Connect an authenticator app | MFA 認証アプリ接続画面 |
| I cant scan the QR code | MFA QR コード不可リンク |
| Continue | MFA 続行ボタン |
| Properties Panel | プロパティパネル（スペース区切り） |
| Login with MFA | Salesforce 自動ログインステップの MFA セクション |
| ADD KEY | MFA キー追加ボタン |
| Add key | 小文字バリアント |
| Your Key | MFA キー入力フィールド |
| Your key | 小文字バリアント |
| Secret Key | MFA シークレットキーフィールド |
| Salesforce Auto-Login | Salesforce 自動ログインステップ名 |
| salesforce auto-login | 小文字バリアント |
| Command Prompt | OS コマンドプロンプト |
| command prompt | 小文字バリアント |
| Add CLI validation | CLI 検証ステップ |
| Add CLI action | CLI アクションステップ |
| add CLI validation | 小文字バリアント |
| add CLI action | 小文字バリアント |
| Run CLI validation | CLI 検証既定説明 |
| Run CLI action | CLI アクション既定説明 |
| Extract SMS message | ドキュメント内リンクテキスト |
| extract SMS message | 小文字バリアント |
| Validate full page visualization | ビジュアル検証ステップ |
| Validate using custom code | カスタムコードで検証 |
| Visual validation (element, viewport, full-page) | ビジュアル検証ステップ種別一覧 |
| Add CLI validations and actions | CLI 検証／アクションステップ |
| File upload step validation | ファイルアップロード検証 |
| MonBoDB validation | MongoDB 検証ステップ（タイポ含む UI 名） |
| MonboDB validation | 別表記 |
| monbodb validation | 完全小文字バリアント |
| My SQL validation | MySQL 検証ステップ |
| my SQL validation | 小文字バリアント |
| Write Code with AI | Coding Assistant ボタン |
| Write code with AI | 小文字バリアント |
| Explain Code with AI | Coding Assistant アイコン |
| Explain code with AI | 小文字バリアント |
| Fix Code with AI | Coding Assistant アイコン |
| Fix code with AI | 小文字バリアント |
| Copy code | Coding Assistant コピー機能 |
| Copy Code | 大文字バリアント |
| Deep link | Deep Link ステップ小文字バリアント |
| SchemeName | Deep Link スキーマ名プレースホルダー |
| schemeName | 小文字バリアント |
| parameterValue | Deep Link パラメーター値プレースホルダー |
| Actions | アクションメニュー |
| New Regexp | RegExp 構文 |
| new RegExp | 小文字バリアント |
| RegExp | JavaScript 正規表現オブジェクト |
| Regex | 正規表現 |
| regex | 小文字バリアント |
| SMS | Short Message Service |
| sms | 小文字バリアント |
| tel | URL スキーマ名 |
| mailto | URL スキーマ名 |
| facetime | URL スキーマ名 |
| Step log | ステップログセクション |
| step log | 小文字バリアント |
| APEX params | APEX パラメーターセクション |
| APEX Params | 大文字バリアント |
| APEX | Salesforce APEX プログラミング言語 |
| apex | 小文字バリアント |
| My Personal Information | Salesforce 個人情報セクション |
| my personal information | 小文字バリアント |
| Run Salesforce APEX Action | Salesforce APEX アクション既定説明 |
| Run Salesforce apex action | 小文字バリアント |
| myspecialfield | Salesforce APEX サンプルフィールド名 |
| mySpecialField | 大文字バリアント |
| accountName | Salesforce フィールド名（キャメルケース） |
| hello, john | Validate Element Text サンプルパラメーター値 |
| Hello, John | 大文字バリアント |
| john | Element Text サンプル値 |
| item a | サンプル値 |
| jurisdiction name | CSV サンプル値（小文字） |
| example test | Excel サンプル値（小文字） |
| department | PowerPoint サンプル値（小文字） |
| location | PowerPoint サンプル値（小文字） |
| Users | Salesforce の Users メニュー項目 |
| users | 小文字バリアント |
| Promise | JavaScript Promise オブジェクト |
| promise | 小文字バリアント |
| param1 | パラメーター名サンプル |
| param2 | パラメーター名サンプル |
| packageVariable | パラメーター既定名（既存登録済み） |
| FromString | CSV parse メソッド名 |
| fromString | JS メソッド名 |
| fromstring | 小文字バリアント |
| filebuffer | Validate download の fileBuffer 変数 |
| fileBuffer | 正式キャメルケース |

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
