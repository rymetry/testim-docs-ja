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
| TTM for Jira | Tricentis Test Management for Jira 略称 |
| Tricentis Test Management for Jira | 正式名称 |
| Test in TTM for Jira | Testim Properties の TTM 連携セクション |
| Create & map TTM for Jira tests | テスト一括マッピングボタン |
| Folder Path in TTM for Jira | TTM フォルダーパス設定セクション |
| My test cases | TTM for Jira のデフォルトフォルダー名 |
| My Test Cases | TTM for Jira のデフォルトフォルダー名（大文字） |
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
| Auto Grouping | 自動グルーピング機能 |
| Configuration Library | テスト設定ライブラリ画面 |
| Configuration List | テスト設定リスト画面 |
| Custom capabilities | Grid のカスタムケイパビリティ機能 |
| Custom capability | Grid のカスタムケイパビリティ（単数形） |
| Grid Type | グリッドタイプ設定 |
| Validate download | ダウンロード検証ステップ |
| Validate Email | メール検証ステップ |
| Visual validation | ビジュアル検証機能 |
| Vision Locate | モバイルテスト用要素認識機能 |
| Play Scenario | シナリオ再生機能 |
| Validate API | API 検証ステップ |
| API Action | API アクションステップ種別 |
| Add API validation | API 検証追加 UI 操作 |
| Add API action | API アクション追加 UI 操作 |
| Run on a grid | グリッド上で実行する UI オプション |
| Pull Request | プルリクエスト機能（単独使用） |
| Pull Requests | プルリクエスト機能（複数形） |
| Ultrafast Test Cloud | Tricentis Ultrafast Test Cloud |
| Root Cause Analysis | テスト失敗の根本原因分析機能 |
| Suite Runs | スイート実行ビュー |
| Step Log | ステップログ UI 要素 |
| Merge Branch | ブランチマージ UI 操作 |
| Test Properties | テストプロパティパネル |
| Override default configurations | デフォルト設定の上書きオプション |
| Click event type | クリックイベントタイププロパティ |
| Apply to click steps | クリックステップへの適用オプション |
| Key Value | キー・バリューデータ構造 |
| App Registration | アプリ登録（Azure AD 文脈） |
| Verification Code | 認証コード（MFA 文脈） |
| Choose Other | 別の選択肢 UI アクション |
| New name | 名前変更ダイアログフィールド |
| Add After All | Hook 設定の全体後フック追加 |
| Net Total | 金額合計フィールド |
| Download for | ダウンロード対象選択 |
| Additional content | 追加コンテンツセクション |
| Device Management | デバイス管理画面 |
| Apps Library | アプリライブラリ画面 |
| Mobile Configuration | モバイル設定 |
| Scheduled Runs | スケジュール実行画面 |
| Application name | アプリケーション名フィールド |
| Change app | アプリ変更リンク |
| Start A Trial | トライアル開始ボタン |
| Duplication Level | 重複レベルラベル |
| Override application | アプリケーション上書きオプション |
| Generate API Key | API キー生成ボタン |
| Generate Key | キー生成ボタン |
| New Secret | 新規シークレット作成ボタン |
| Edit Secret | シークレット編集操作 |
| Share step | 共有ステップチェックボックス（Properties パネル） |
| From Device | デバイスからの記録オプション |
| Run additional code | 追加コード実行オプション |
| Default Configuration | デフォルト設定 |
| Runs Configuration | 実行設定画面パス |
| Mobile Devices | モバイルデバイスセクション |
| Grid Configuration | グリッド設定 |
| Test Configuration | テスト設定 |
| Suite Configuration | スイート設定 |
| Select a folder | フォルダ選択ダイアログ |
| Resolved Duplicate | 解決済み重複ステータス |
| Pending Duplicates | 保留中重複ステータス |
| New Duplicates | 新規重複ステータス |
| Form Data | フォームデータ形式 |
| Assertion | API ステップの検証セクション |
| Add New Config | 新規設定追加ボタン |
| Login URL | ログイン URL フィールド |
| Cloud Grid | Testim Cloud Grid |
| Local grid | ローカルグリッド |
| Third party grid | サードパーティグリッド |
| Retry all | 全再試行リンク |
| Grant Access | アクセス許可ボタン |
| New Branch | 新規ブランチ作成 |
| WebDriverAgent | Apple WebDriverAgent |
| Apple Team ID | Apple 開発者チーム ID |
| User Details | ユーザー詳細セクション |
| One-Time Password Authenticator | ワンタイムパスワード認証 |
| Open in Terminal | ターミナルで開くメニュー |
| Salesforce Auto Login | Salesforce 自動ログインステップ |
| Salesforce Auto Login step | Salesforce 自動ログインステップ名 |
| Create the same Testim folder path | TTM フォルダーパスオプション |
| Create all test cases in My test cases folder | TTM 一括テストケース作成オプション |
| Mark as default | デフォルト設定マークボタン |

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
| As Another User | Salesforce のログイン方法（別ユーザーとしてログイン） |
| Salesforce Flows | Salesforce フロー自動化ステップ |
| Related List Action | Salesforce 関連リストアクションステップ |
| Quote Line Editor | Salesforce 見積明細エディターステップ |
| Quick Actions | Salesforce クイックアクション |
| Verify Picklist Options | Salesforce ピックリスト検証ステップ |
| Document Validation | Salesforce ドキュメント検証ステップ |
| Apex Action | Salesforce Apex アクションステップ |

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
| Show Properties | プロパティ表示ボタン/アイコン |
| Show step properties | ステッププロパティ表示ボタン |
| Predefined steps | Testim の定義済みステップメニュー |
| Toggle Breakpoint | ブレークポイント切替ボタン |
| Filter Test | テストフィルター機能 |
| Create Step | ステップ作成ボタン |
| Text to assign | Set text ステップの入力フィールド |
| Name the new step | 新規ステップ名入力フィールド |
| What to run on | テスト実行先選択プロパティ |
| Assigned to me | 自分に割り当てフィルター |
| Native click event | ネイティブクリックイベントプロパティ |
| Step delay | ステップ遅延プロパティ |
| Verify not visible | 要素非表示検証プロパティ |
| Add Environment | 環境追加ボタン |
| Group Name | グループ名プロパティ |
| Paste code at cursor | カーソル位置にコード貼り付けボタン |
| Add Action | アクション追加メニュー |
| Tab Name | タブ名フィールド |
| Create New | 新規作成ボタン |
| Add custom action | カスタムアクション追加 UI 操作 |
| Run additional code on request results | API ステップの追加コード実行オプション |
| Send via web page | API ステップの送信コンテキストチェックボックス |
| Setup step | テスト Setup ステップ（単数、小文字） |
| Setup Step | テスト Setup ステップ（単数、大文字） |
| Test Configuration Properties | テスト設定プロパティパネル |
| Cookie Info | Set Cookie ステップのフィールドグループ |
| Cookie value | Cookie 値フィールド |
| External or Internal Contact | メール検証の連絡先タイプ選択 |
| Add custom validation | カスタム検証追加 UI 操作 |
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
| Step delay | プロパティ名（ms 単位ステップ遅延） |
| Group Name | プロパティ名（グループ名） |
| Tab Name | プロパティ名（タブ名） |
| Text to assign | Set text ステップのプロパティ名 |
| Ignore displacement diffs | ビジュアル検証プロパティ |
| Include Evaluating | ビジュアル検証プロパティ |
| Match Level | ビジュアル検証プロパティ |
| Element text | 要素テキストプロパティ |
| Native click event | クリックイベントプロパティ |
| Verify not visible | 要素非表示検証プロパティ |
| What to run on | テスト実行先選択プロパティ |
| Assigned to me | フィルタープロパティ |
| After test handler | テスト後フックハンドラー名 |
| After each step handler | 各ステップ後フックハンドラー名 |
| Before test handler | テスト前フックハンドラー名 |
| Before each step handler | 各ステップ前フックハンドラー名 |
| After suite handler | スイート後フックハンドラー名 |
| Before suite handler | スイート前フックハンドラー名 |
| Before Test | Testim Config Hook 名（プロパティ文脈） |
| After Test | Testim Config Hook 名（プロパティ文脈） |
| Before Step | Testim Config Hook 名 |
| After Step | Testim Config Hook 名 |
| Before each step | Testim Hook タイプ名 |
| After each step | Testim Hook タイプ名 |
| Before test | Testim Hook タイプ名 |
| After test | Testim Hook タイプ名 |
| Before suite | Testim Hook タイプ名 |
| After suite | Testim Hook タイプ名 |

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

## エージェント追加用語 (2026-04-16 parity burn-down)

並列エージェント (8 並列) による per-folder parity burn-down で検出された追加用語。
内訳: Testim UI ラベル / Salesforce UI / Tricentis UI / 技術用語 / 一般 IT loanword 等。
重複登録は parser 側で de-dup される。

| 用語 | 備考 |
| --- | --- |
| テスト構成 | CLI テスト構成の日本語アンカーラベル |
| .apk | Android アプリファイル拡張子 |
| .app | iOS シミュレーター向けアプリファイル拡張子 |
| .doc | Word ファイル拡張子（旧） |
| .docx | Word ファイル拡張子 |
| .ipa | iOS アプリファイル拡張子 |
| /explain | Coding Assistant スラッシュコマンド |
| /fix | Coding Assistant スラッシュコマンド |
| /generate | Coding Assistant スラッシュコマンド |
| /help | Coding Assistant スラッシュコマンド |
| + Params | Params 追加ボタン |
| a simple pdf file | PDF サンプル文字列（小文字） |
| A simple PDF file | PDF サンプル文字列 |
| Accessibility report | エラーパネルリンクラベル |
| Accessibility validation | プロパティデフォルト値 |
| Accessibility violations were found | エラーメッセージ断片 |
| Accounts | アカウント設定セクション |
| Accounts Dashboard | アカウントダッシュボード画面名 |
| Action | Testim for Salesforce / Document Validation の UI フィールド名 |
| action options | 編集メニュー名（小文字） |
| Action options | 編集メニュー名 |
| Active | テストステータス値（アクティブ） |
| Add After All | Test Plans のティアダウンテスト追加チェックボックス |
| Add an API action step | Testim のステップ種別名 |
| Add API action | Add API action ステップ完全表記 |
| Add API Action | Add API Action ステップ（大文字バリアント） |
| Add API action | Testim の API アクションステップ名 |
| Add API validation | API 検証ステップ追加アクション |
| Add Before All | Test Plans のセットアップテスト追加チェックボックス |
| Add CLI Validation | Add CLI Validation ステップ完全表記 |
| Add Custom Action | Add Custom Action ステップ完全表記 |
| Add custom action | Custom Action 追加メニュー |
| Add Custom Action | Testim UI のステップ種別名 |
| Add Custom Validation | Add Custom Validation ステップ完全表記 |
| Add Custom Validation | Testim UI のステップ種別名 |
| add custom validation and actions | Add Custom Validation and Actions の小文字バリアント |
| Add Custom Validation and Actions | Testim UI のステップ種別グループ名 |
| add custom validations and actions | 参照リンクラベル（小文字） |
| Add custom validations and actions | 参照リンクラベル |
| Add Custom Validations and Actions | Add Custom Validation and Actions の複数形 |
| add custom validations and actions | Add Custom Validations and Actions の小文字バリアント |
| Add Custom Wait For | Add Custom Wait For ステップ完全表記 |
| Add Custom Wait For | Testim UI のステップ種別名 |
| Add Environment | ビジュアル検証オプション |
| Add Folder | Testim UI のボタン名 |
| Add keyboard shortcut | キーボードショートカットステップ |
| Add network validation | ネットワーク検証ステップ |
| Add Network validation | Add Network validation ステップ完全表記 |
| Add New Config | Shared Configuration の新規作成ボタン |
| Add Step | Add Step ウィンドウ |
| Add to Slack | Slack 連携追加ボタン |
| adding a cli step | Adding a CLI Step の小文字バリアント |
| Adding a CLI Step | Testim ドキュメントのリンクテキスト |
| adding a custom action step | リンクテキスト lowercase |
| Adding a Custom Action Step | Testim ドキュメントのリンクテキスト |
| adding a custom validation step | リンクテキスト lowercase |
| Adding a Custom Validation Step | Testim ドキュメントのリンクテキスト |
| adding a custom wait for step | リンクテキスト lowercase |
| Adding a Custom Wait for Step | Adding a Custom Wait For Step のバリアント (lowercase for) |
| Adding a Custom Wait For Step | Testim ドキュメントのリンクテキスト |
| Adding a step | Testim ドキュメントのリンクテキスト (generic) |
| adding a step | Testim リンクテキストの generic placeholder |
| adding a validate custom step | リンクテキスト lowercase |
| Adding a Validate Custom Step | Testim ドキュメントのリンクテキスト |
| adding a validate download validation step | Adding a Validate Download Validation Step の小文字バリアント |
| Adding a Validate Download Validation Step | Testim ドキュメントのリンクテキスト |
| additional content settings | Chrome 設定セクション（小文字） |
| Additional content settings | Chrome 設定セクション |
| Additional Discount | CPQ Quote Line Editor のフィールド名 |
| advanced | プロジェクト設定タブ（小文字） |
| Advanced | プロジェクト設定タブ |
| Advanced | Testim Properties の Advanced セクション名 |
| Advanced filters | Test Library の高度なフィルターアイコン |
| Advanced JS Editor | Monaco ベースの JS エディター機能 |
| advanced text validation | 検証機能見出し（小文字） |
| Advanced text validation | 検証機能見出し |
| After all | Test Plans の「After all」段階ラベル |
| After step | After step Hook |
| After suite | After suite Hook |
| After test | After test Hook |
| After test handler | Testim Runs Configuration の設定項目 |
| all | コマンド引数 (simctl shutdown all) |
| All impact level | アクセシビリティトグルラベル（単数形） |
| All impact levels | アクセシビリティトグルラベル |
| allow access to file urls | Chrome 権限設定ラベル（小文字） |
| Allow access to file URLs | Chrome 権限設定ラベル |
| Allow Access to File URLs | Chrome 権限設定ラベル（Title Case） |
| Allow all sites to show pop-ups | Chrome 設定オプション |
| Allow API request retry | API リトライオプション |
| Allow executing file as program | Ubuntu のファイルマネージャー権限オプション |
| Always show pop-ups | Chrome オプション名 |
| Always show pop-ups from [site] | Chrome のポップアップ許可オプション |
| Android | Google モバイル OS 名 |
| Any device | Mobile Configuration のデフォルトデバイス値 |
| Any iOS Device | Xcode デバイス選択オプション |
| Any version | Mobile Configuration のデフォルト OS バージョン値 |
| Apex | APEX の混合大文字バリアント |
| APEX | APEX プログラミング言語 |
| Apex | APEX（小文字バリアント） |
| APEX | Salesforce のサーバーサイド言語 |
| APEX Action | APEX アクションの短縮表記 |
| APEX Action | Apex Action の大文字バリアント |
| Apex Action | Testim for Salesforce のステップ名 |
| APEX Action Example | APEX アクション例のセクション名 |
| APEX Action Result Log | APEX アクション結果ログ UI |
| api | API（小文字） |
| API | API |
| api call | API 呼び出し（小文字） |
| API call | API 呼び出し |
| API Call | API 呼び出しアクション |
| api request | API リクエスト用語（小文字） |
| API request | API リクエスト用語 |
| App | モバイルアプリ列短縮形 |
| app name (mobile) | CSV 列名（モバイルアプリ名） |
| App Name (mobile) | Test Library のアプリ名列（モバイル） |
| App Store | Apple のアプリストア |
| app version (mobile) | CSV 列名（モバイルアプリバージョン） |
| App Version (mobile) | Test Library のアプリバージョン列（モバイル） |
| Appium 2.0 | Appium のバージョン |
| appium 2.0 | Appium 2.0 の小文字バリアント |
| Apple | Apple 社名 (iOS/macOS 文脈) |
| apple | Apple の小文字バリアント |
| Apple Developer | Apple の開発者プログラム名 |
| Apple Simulator User Guide | Apple のドキュメント名 |
| Apple Team ID | Apple が発行する iOS 開発チーム ID |
| Application Name | Testim Mobile UI のラベル |
| application under test | AUT の完全表記（小文字） |
| application/json | HTTP application/json content type |
| applications | macOS のアプリケーションディレクトリ名 |
| applitools eyes | 製品名（小文字） |
| Applitools Eyes | Applitools のビジュアル検証アプリ |
| Applitools Eyes | 製品名（compound 形） |
| applitools eyes match level | Applitools Eyes マッチレベル仕様（小文字） |
| Applitools Eyes match level | Applitools Eyes マッチレベル仕様 |
| Apply | フィルター適用ボタン |
| Apply Auto Group on Matching Steps | Testim UI のチェックボックスラベル |
| Apply to click steps | プロジェクト設定のクリックステップ適用オプション |
| Approve Uninstalled Connected Apps | Salesforce の権限名 |
| Approved | Pull Request の承認済みステータス |
| ARM64 | Apple Silicon アーキテクチャ |
| As Another User | Log In As Another User の短縮フォーム |
| ask where | Chrome 保存設定トグル短縮（小文字） |
| Ask where | Chrome 保存設定トグル短縮 |
| ask where to save each file before downloading | Chrome 保存設定トグル（小文字） |
| Ask where to save each file before downloading | Chrome 保存設定トグル |
| Ask where to save each file before downloading | Chrome ダウンロード設定トグル |
| Assertion response | Assertion 結果フィールド |
| Assigned to me | Dashboard の自分に割り当て（小文字バリアント） |
| Assigned to Me | Dashboard の自分に割り当てタブ |
| Atlassian | Jira / Bitbucket を提供する企業 |
| Audit log | 監査ログ画面名（小文字バリアント） |
| Audit Log | 監査ログ画面名 |
| AUT Viewer | Testim Mobile UI の画面名 |
| author | CSV 列名（作成者） |
| Auto Complete | Testim のオートコンプリート機能 |
| Auto Grouping | Auto Grouping 機能 |
| Auto Grouping | Auto Grouping 画面/ペイン名 |
| Auto Improved | Auto Improve の改善済みフィルター値 |
| Auto Improved Locators | Testim UI のセクション名 (Locators auto improve) |
| Auto record your steps | Testim Editor のポップアップラベル |
| Auto-grouping | 自動グルーピング機能 |
| auto-grouping | Auto-grouping の小文字バリアント |
| Auto-Grouping | Auto-Grouping ペイン名 |
| Auto-grouping | Testim のオートグルーピング機能 |
| auto-grouping suggestion | 自動グルーピング候補（小文字バリアント） |
| Auto-grouping suggestion | 自動グルーピング候補 |
| Auto-Login | 自動ログインステップの短縮表記 |
| Automatically Manage Signing | Xcode の署名オプション |
| AutoRABIT | Salesforce DevOps / CI / CD プラットフォーム (大文字表記) |
| AutoRabit | Salesforce DevOps / CI / CD プラットフォーム |
| axe core | アクセシビリティライブラリ名（小文字） |
| Axe Core | アクセシビリティライブラリ名（短縮） |
| axe-core | アクセシビリティライブラリ名（小文字ハイフン） |
| Azure Pipeline | Azure DevOps のパイプライン機能 |
| Azure Pipelines | Azure DevOps のパイプライン機能 (複数形) |
| Back | Testim UI ボタン名 (Back button ステップ) |
| back arrow | 戻る矢印アイコン |
| Back button | Testim のモバイルステップ名 |
| Bamboo | Atlassian の CI / CD プラットフォーム |
| Base URL | Base URL ドキュメント名 |
| Base URL | Testim Configuration の Base URL 設定 |
| BASE_URL | Testim 組み込み Base URL パラメーター |
| Bearer | HTTP Authorization Bearer スキーム |
| before & after hooks | Before & after hooks ドキュメント名（小文字） |
| Before & after hooks | Before & after hooks ドキュメント名 |
| before all | Test Plans の「before all」段階ラベル（小文字） |
| Before all | Test Plans の「Before all」段階ラベル |
| Before step | Before step Hook |
| Before suite | Before suite Hook |
| Before test | Before test Hook |
| Before/After hooks | Mobile Configuration の前後フック設定セクション |
| beforeSuite | Config Hook 名（再掲） |
| Bitbucket | Atlassian の Git リポジトリホスティングサービス |
| bluebird | bluebird パッケージ名 |
| Branch | ブランチ選択フィールド |
| Branch | Reports のブランチフィルターセクション |
| Branch Name | ブランチ名入力フィールド |
| browse for file | 自動記録ステップ（小文字） |
| Browse for file | 自動記録ステップ |
| browser cookie | ブラウザ Cookie 表記バリアント |
| Browsers | Reports のブラウザフィルターセクション |
| BrowserStack Select Device Using Regex | BrowserStack の正規表現デバイス選択ドキュメント名 |
| Build .ipa | Testim ドキュメントの節タイトル断片 |
| Build .ipa Files for Physical Devices using Xcode | Testim ドキュメントのセクションリンク |
| Build .ipa files for Virtual Devices using XCode | Testim ドキュメントのセクションリンク |
| Build for | Xcode メニュー項目名 |
| By Filter | Quote Line Editor の選択方式 |
| Call | Salesforce の Quick Action 名 |
| Callout URL | AutoRABIT などで外部 API を呼び出す URL 機能名 |
| Capture request body | キャプチャーオプション |
| Capture Request Body | キャプチャーオプション（大文字） |
| Capture response body | キャプチャーオプション |
| Capture Response Body | キャプチャーオプション（大文字） |
| Cases | Salesforce オブジェクトタイプ（複数形） |
| Change App | Testim Mobile UI のリンクテキスト |
| Change Mobile App Used for the Test | Testim Mobile の操作名 |
| Check available devices | Mobile Configuration の利用可能デバイス確認ボタン |
| Check available devices button | Mobile Configuration の利用可能デバイス確認ボタン名 |
| Check here for more details | アクセシビリティリンクラベル |
| checkable | HTML 属性名 |
| checkbox | チェックボックス要素 |
| Checkbox | UI コンポーネント名 |
| checked | 選択済みステータス |
| Choose a grid | Mobile Configuration のグリッド選択フィールド |
| Choose New Configuration | Testim UI のパネル名 |
| Choose Other | Testim UI のボタン名 |
| Choose Other | Testim UI の構成切替ボタン |
| Circle CI | CI / CD プラットフォーム (2 語表記) |
| CircleCI | CI / CD プラットフォーム |
| Classic | Salesforce の UI 実行モード名 |
| className | HTML 属性名（camelCase） |
| classname | HTML 属性名（className の小文字） |
| Clear all | 選択解除ボタン |
| Clear Build Folder | Xcode メニュー項目名 |
| Clear Text | モバイル Clear Text ステップ |
| cli action | CLI アクション（小文字） |
| CLI action | CLI アクション |
| CLI action | CLI アクションステップ短縮 |
| cli action step | CLI アクションステップ（小文字） |
| CLI action step | CLI アクションステップ |
| cli step | CLI ステップ（小文字） |
| CLI step | CLI ステップ |
| cli validation | CLI 検証（小文字） |
| CLI validation | CLI 検証 |
| CLI wait for | CLI wait for ステップ |
| Click event type | Click Properties のクリックイベントタイプ設定 |
| Click here | ハイパーリンクアクション表現 |
| clickable | HTML 属性名 |
| Clone Test | テストクローン実行ボタン |
| Close PR | プルリクエストクローズボタン |
| Code | Testim UI の Code フィールド名 |
| Code Step | Testim のモバイルカスタムコードステップ |
| coded | Email 検証モード名（小文字） |
| Coded | Email 検証モード名 |
| coded email validation | Email 検証モード名 |
| Coded email validation | Email 検証モード名 |
| Coded Email Validation | Email 検証モード名（Title Case） |
| coded option | Email 検証モード（小文字） |
| Coded option | Email 検証モード |
| codeless | Email 検証モード名（小文字） |
| Codeless | Email 検証モード名 |
| codeless option | Email 検証モード（小文字） |
| Codeless option | Email 検証モード |
| Codeship | CI / CD プラットフォーム |
| collname | サンプルパラメーター名（小文字） |
| collName | サンプルパラメーター名 |
| Column | Related List Action の UI フィールド名 |
| command line interface | CLI ドキュメント/リンクラベル（小文字） |
| Command Line Interface | CLI ドキュメント/リンクラベル |
| command line interface | Command Line Interface の小文字バリアント |
| Command Line Interface | Testim の CLI 機能名 (compound) |
| command line interface: test config | CLI ドキュメントセクション名（小文字） |
| Command line interface: Test Config | CLI テスト構成ドキュメント名 |
| Command Line Interface: Test Config | CLI ドキュメントセクション名 |
| Command Prompt | ターミナル名（短縮） |
| Comment | Pull Request のコメント入力フィールド |
| Comments | Pull Request のコメント列ヘッダー |
| Common Operations | Testim for Salesforce のステップカテゴリ |
| Community | Testim のライセンス種別名 |
| Company-level Report | 会社レベルレポート名 |
| Conditions | 条件セクション名 |
| Conditions | Testim Properties の Conditions セクション名 |
| Config File | 設定ファイル（再掲） |
| configuration | 設定タブ名（小文字） |
| Configuration File & Run Hooks | Configuration File セクション名 |
| Configuration file | Configuration File 短縮表記 |
| configuration file | Configuration File（小文字バリアント） |
| Configuration Library | 構成ライブラリ画面名 |
| configuration list | プロジェクト設定セクション（小文字） |
| Configuration List | 設定リスト画面 |
| Configuration List | 構成リストメニュー名 |
| Configuration List | プロジェクト設定セクション |
| Configuration Name | Mobile Configuration の構成名入力フィールド |
| Configuration Type | Mobile Configuration の構成タイプ選択 |
| Configure Price Quote | Salesforce CPQ の正式名称 (CPQ 展開形) |
| Configuring a Data-driven Test | データ駆動テスト設定ページタイトル |
| Connected App | Salesforce 個別 App 表記 |
| Connected Apps | Salesforce Connected Apps セクション |
| Contact | Salesforce オブジェクトタイプ |
| Contacts | Salesforce オブジェクトタイプ（複数形） |
| contains | Mobile Configuration 演算子オプション値 |
| Content | Document Validation の条件セクション名 |
| Content-Type | HTTP Content-Type ヘッダー |
| contents | Xcode パッケージ内ディレクトリ名 |
| Cookie | Testim ドキュメント・ブラウザ技術用語 |
| Cookie Info | Cookie 情報フィールドセクション |
| Cookie name | Cookie 名フィールド |
| Cookie name | Testim のステップパラメーター名 |
| Cookie value | Cookie 値フィールド |
| Cookies | Cookie 複数形 |
| Copado | Salesforce CI/CD 製品 |
| Copado | Salesforce DevOps / CI / CD プラットフォーム |
| Copy code | Coding Assistant のコピーボタン |
| Copy of | クローン時に自動付与されるプレフィックス |
| CPQ | Configure Price Quote の略称 |
| CPQ Quote Line Editor | Salesforce CPQ のステップ名 |
| Create | Create ボタン |
| Create | Testim for Salesforce のステップ名 / レコード作成アクション |
| create a shared configuration | リンクラベル（小文字） |
| Create a shared configuration | リンクラベル |
| Create New | 構成ライブラリの新規作成ボタン |
| Create new Cookie | Set Cookie のラジオボタン |
| Create Shared Group | 共有グループ作成ボタン |
| Create Step | ステップ作成アクション |
| Create Suite | テストスイート新規作成ボタン |
| CRM | Customer Relationship Management の略称 |
| CSR | 証明書署名リクエスト (Certificate Signing Request) |
| CSS Property Validation | 検証フォーム名 |
| CSV | Comma-Separated Values ファイル形式（小文字バリアント：csv） |
| csv | CSV 小文字バリアント |
| ctrl + 'v' | ショートカット表記（小文字） |
| Ctrl + 'V' | ショートカット表記 |
| CTRL/CMD | キーボードキー名（複合） |
| Current Branch | 現ブランチオプション |
| Custom 条件 | Custom 条件の JA 表記 (compound) |
| Custom | Reports の日付範囲カスタム値 |
| Custom | Testim の実行条件 (When to run step) の種別名 |
| Custom Action (mobile) | Custom Action モバイル版ステップ名 |
| Custom Action Properties | Custom Action プロパティパネル |
| Custom condition | Custom Condition ステップ（小文字バリアント） |
| Custom Condition | Custom Condition ステップ完全表記 |
| Custom JavaScript | Custom JavaScript ステップ |
| Custom JS | Custom JS ステップ短縮 |
| custom JS step | カスタム JS ステップ短縮 |
| Custom Step | Testim のステップ種別 (Custom 条件内) |
| Data Manipulation Language | DML の完全表記 |
| Data-driven test | データ駆動テスト |
| Data-driven tests | データ駆動テスト（複数形） |
| dbname | サンプルパラメーター名（小文字） |
| dbName | サンプルパラメーター名 |
| Debug Mode | Android のデバッグモード |
| Deep Link | Deep Link モバイルステップ |
| default behavior | Chrome 設定項目名（小文字） |
| Default behavior | Chrome 設定項目名 |
| Default Configuration | デフォルト設定セクション |
| Default Configuration setting | デフォルト設定 |
| delete | HTTP メソッド（小文字） |
| DELETE | HTTP メソッド |
| Delete branch x upon merge | Branching のマージ後ブランチ削除チェックボックス |
| Delete step | Testim Editor の削除確認ウィンドウ名 |
| Delete steps | Testim Editor の複数削除確認ウィンドウ名 |
| demo.testim.io | Testim ドキュメント内で用いる例示ホスト名 |
| department | PowerPoint サンプル文字列（小文字） |
| Department | PowerPoint サンプル文字列 |
| Deploy All | Copado のデプロイ実行ボタン |
| Deque | アクセシビリティベンダー名 |
| Deque Axe Core | アクセシビリティライブラリ名 |
| Deque Axe-Core | アクセシビリティライブラリ名（ハイフン） |
| description | プロパティ名（小文字バリアント） |
| Description | プロパティ名 |
| Description | ステップ説明プロパティ |
| Description | 汎用 UI フィールドラベル |
| description | CSV 列名（説明） |
| developer | Xcode パッケージ内ディレクトリ名 |
| Developer Edition | Salesforce のエディション名 |
| Developer Options | Android の開発者オプション |
| developer.apple.com | Apple 開発者ドキュメントドメイン |
| Device and Mobile Application Information | Testim Mobile UI のセクション名 |
| Device Management | Testim Mobile の Device Management UI |
| Device Manager | Virtual Device Manager の短縮 |
| Device Name | Mobile Configuration のデバイス名プロパティ |
| Device Name | Testim Test Configuration の項目 |
| Devices | Mobile Configuration のデバイスセクション |
| devicesupport | ios-devicesupport のサブパス |
| DeviceSupport | Xcode DeviceSupport パス |
| DML | Data Manipulation Language の略称 |
| doc | Word ファイル拡張子（ピリオドなし） |
| Document Validation | Testim for Salesforce のステップ名 |
| docx | Word ファイル拡張子（ピリオドなし） |
| dom | ドキュメントオブジェクトモデル（小文字） |
| DOM | ドキュメントオブジェクトモデル |
| dom selector | DOM セレクター用語（小文字） |
| DOM selector | DOM セレクター |
| DOM selector | DOM セレクター用語 |
| DOM Selector | DOM セレクター（Title Case） |
| Domain | Cookie ドメインフィールド |
| Download for Linux | Testim UI のダウンロードオプション |
| Download for Mac | Testim UI のダウンロードオプション |
| Download for Windows | Testim UI のダウンロードオプション |
| download pdf files instead of automatically opening them in chrome | Chrome PDF 設定トグル（小文字） |
| Download PDF files instead of automatically opening them in Chrome | Chrome PDF 設定トグル |
| download pdfs | Chrome 設定オプション短縮（小文字） |
| Download PDFs | Chrome 設定オプション短縮 |
| download pdfs option | Chrome 設定オプション（小文字） |
| Download PDFs option | Chrome 設定オプション |
| Download the response info | レスポンス情報ダウンロードボタン |
| Download wait for | Download wait for ステップ |
| Draft | テストステータス値（作業中） |
| Drag and Drop | Drag & Drop ステップ表記バリアント |
| Drag-and-drop | ドラッグアンドドロップ（小文字バリアント） |
| Drag-and-Drop | ドラッグアンドドロップ |
| Drop Target | Drag & Drop のドロップターゲット |
| Duplication level - Ascending | ソートオプション |
| Duplication Level - Descending (default) | ソートオプション |
| Duplication Level | Dashboard の重複レベル指標 |
| Duplication level reduction | Auto Grouping 画面項目 |
| duplication level scoring | 重複レベルスコアセクション |
| Duplication level scoring | 重複レベルスコアセクション（大文字バリアント） |
| dynamic allocation | Mobile Configuration の動的割り当て（小文字表記） |
| Dynamic Allocation | Mobile Configuration の動的割り当てオプション |
| Dynamic URL Parameters | Copado URL Callout ステップのパラメーター項目 |
| E2E | End-to-End の略称 |
| Edit | Testim UI の編集アイコン / ボタンラベル |
| Edit Config | Mobile Configuration 編集画面名 |
| Edit Configuration | テスト構成編集画面名 |
| Edit Name | 構成名変更ダイアログ名 |
| Edit test config | Test List のテスト構成編集メニュー項目 |
| Edited | 編集済みラベル |
| editing | ドキュメントセクション動詞（小文字） |
| Editing | ドキュメントセクション動詞 |
| editing a step's properties | Editing a Step's Properties の小文字バリアント |
| Editing a Step's Properties | Testim ドキュメントのリンクテキスト |
| editing properties | ドキュメントセクションリンク（小文字） |
| Editing properties | ドキュメントセクションリンク |
| editing target | ドキュメントセクションリンク（短縮） |
| editing target element properties | ドキュメントセクション名（小文字） |
| Editing Target Element Properties | ドキュメントセクション名 |
| Editor | Editor 画面短縮表記 |
| Editor | Testim Editor の短縮表記 |
| Element 条件 | Element 条件の JA 表記 (compound) |
| element | HTML 要素識別子 |
| Element | Testim の実行条件 (When to run step) の種別名 |
| Element Accessibility Validation | 検証ステップ名 |
| element attribute validation | 検証フォーム名（小文字） |
| Element attribute validation | 検証フォーム名 |
| Element Attribute Validation | 検証フォーム名 |
| Element Highlighting | Testim Mobile UI のアクション名 |
| element properties | ドキュメントセクションリンク |
| Element text 条件 | Element text 条件の JA 表記 (compound) |
| Element text | Testim の実行条件 (When to run step) の種別名 |
| element text validation | 検証フォーム名（小文字） |
| Element text validation | 検証ステップ |
| Element Text Validation | 検証フォーム名 |
| Element visible | 検証ステップ（短縮形） |
| Element visible validation | 検証フォーム名 |
| Element Visible Validation | 検証フォーム名（大文字） |
| element visualization | ビジュアル検証種類名（小文字） |
| Element visualization | ビジュアル検証種類名 |
| Element Visualization | ビジュアル検証種類名（大文字） |
| email address | Email アドレスフィールド |
| Email Address | Email アドレスフィールド（大文字） |
| Email address | Email アドレスフィールド（Title Case） |
| Email Address field | Email アドレスフィールドラベル |
| email filters | Email 検証設定セクション名 |
| Email Filters | Email 検証設定セクション名（大文字） |
| Email filters | Email 検証設定セクション名（Title Case） |
| email text extraction | Email 検証抽出セクション名（小文字） |
| Email text extraction | Email 検証抽出セクション名 |
| email validation | Email 検証機能名 |
| Email Validation | Email 検証機能名（Title Case） |
| emailaddress | Email アドレスパラメーター名（小文字） |
| emailAddress | Email アドレスパラメーター名 |
| Enable RCA | ビジュアル検証オプション |
| enabled | HTML 属性値 |
| Enterprise plan | Enterprise プラン |
| equals | Mobile Configuration 演算子オプション値 |
| ERROR | ログレベル識別子 (大文字) |
| error | ログレベル識別子 |
| Essentials Edition | Salesforce のエディション名 |
| Evaluate as an expression | Testim UI のチェックボックスラベル |
| Evaluate as expression | Evaluate as an expression の省略形 |
| Evaluating | テストステータス値（評価中） |
| Exact Match | Verify Picklist Options のオプション名 |
| example test | PDF/Excel サンプル文字列（小文字） |
| Example test | PDF/Excel サンプル文字列 |
| Exclude specific rule IDs | プロパティ名 |
| Execute | Ubuntu のファイルマネージャー権限オプション |
| Execute APEX | Testim for Salesforce のステップ名 |
| Execute APEX Action | Testim for Salesforce のステップ名 |
| execute driver script step | Execute Driver Script Step の小文字バリアント |
| Execute Driver Script Step | Testim Mobile のステップ種別名 |
| Execute Shell | Jenkins ビルドステップ名 |
| Execute Windows batch command | Jenkins ビルドステップ名 |
| Execution | 実行ラベル |
| Execution Run Details | リモート実行の詳細ビュー名 |
| ExecutionException | Java 例外クラス名 |
| Expect | Related List Action の UI セクション名 |
| expected body | Email 検証フィルター条件（小文字） |
| Expected body | Email 検証フィルター条件 |
| expected status | 検証設定セクション名（小文字） |
| Expected status | 検証設定セクション名 |
| Expected Status | 検証設定セクション名（Title Case） |
| expected subject | Email 検証フィルター条件（小文字） |
| Expected subject | Email 検証フィルター条件 |
| expectedvalue | サンプル変数名（小文字） |
| expectedValue | サンプル変数名 |
| Expires (Max-Age) | Cookie 有効期限フィールド |
| Explain | Coding Assistant の Explain コマンド |
| explain code | Coding Assistant のコマンド説明 |
| Explain code with AI | Coding Assistant のコード解説アイコン |
| Export to CSV | Test Library の CSV エクスポートアイコン |
| External or Internal Contact | Related List Action のレコードタイプ例 |
| Extract SMS | Extract SMS ステップ |
| extract sms message | 関連ステップ（小文字） |
| Extract SMS message | 関連ステップ（リンクテキスト） |
| Extract Value | Extract Value ステップ名 |
| Extract Value Step | Extract Value ステップ完全表記 |
| Fail test from impact level | プロパティ名 |
| failed | ログメッセージの一部 |
| Fallback Locators | Testim のロケーター種別名 |
| false | JavaScript 真偽値 (ブール値リテラル) |
| false | JavaScript 真偽値 |
| falsy | JavaScript 真偽値概念 |
| falsy | JavaScript の偽値判定用語 |
| fdssdf dfdf | サンプル値 |
| Field | Mobile Configuration のフィールド選択 |
| file drop | 自動記録ステップ（小文字） |
| File drop | 自動記録ステップ |
| File Drop | Testim のステップ種別名 |
| file upload / file drop | ファイル操作ステップの and-or グループ表記 |
| file upload | 自動記録ステップ（小文字） |
| File upload | 自動記録ステップ |
| File Upload | Testim のステップ種別名 |
| Filter (Where) | Related List Action の UI セクション名 |
| FILTER & SORT STEPS DUPLICATIONS | 自動グルーピングフィルター画面名（表記バリアント） |
| FILTER &amp; SORT STEPS DUPLICATIONS | 自動グルーピングフィルター画面名 |
| Filter Configuration | Configuration Library のフィルターペイン |
| Filter Remote Runs | Insights Dashboard のリモート実行フィルターペイン |
| Filter Test | Test Library のフィルターペイン名（単数形バリアント） |
| Filter Tests | Test Library のフィルターペイン名 |
| Find | Testim for Salesforce のステップ名 / 検索アクション |
| Fix | Coding Assistant の Fix コマンド |
| fix code | Coding Assistant のコマンド説明 |
| Fix code with AI | Coding Assistant のコード修正アイコン |
| Flaky tests | 不安定テスト機能ドキュメント名 |
| Flow Screen Completion | Testim for Salesforce のステップ名 |
| for | 汎用英語単語 (ログ内) |
| For each item | Testim のループ種別 |
| Form Data | API Body form-data モード |
| Freestyle project | Jenkins のプロジェクトタイプ名 |
| full-page visualization | ビジュアル検証種類名（小文字） |
| Full-page Visualization | ビジュアル検証種類名 |
| function | カスタムアクションの関数エディターラベル |
| Gearset | Salesforce CI/CD 製品 |
| Gearset | Salesforce DevOps プラットフォーム |
| General | 一般設定セクション名 |
| Generate | Coding Assistant の Generate コマンド |
| Generate API Key | API キー生成ボタン |
| generate code | Coding Assistant のコマンド説明 |
| Generate Date | Testim のステップ種別名 |
| Generate Email | アクションステップ短縮名 |
| Generate Email Address | アクションステップ |
| generate email address step | ステップ名参照（小文字） |
| Generate Email Address step | ステップ名参照 |
| Generate New CSR | Testim UI のボタンラベル (iOS アーティファクト) |
| get | HTTP メソッド（小文字） |
| GET | HTTP メソッド |
| Get cookie | Get cookie ステップ（小文字バリアント） |
| Get Cookie | Get Cookie ステップ名（再掲） |
| Get Cookie data | Get Cookie の機能 |
| Get Cookie step | Get Cookie ステップ完全表記 |
| Git | 分散バージョン管理システム |
| GitHub | コード共有プラットフォーム |
| GitHub | Git リポジトリホスティングサービス |
| GitHub Action | GitHub Action (単数形) |
| GitHub Actions | GitHub の CI / CD 機能名 |
| github.com | GitHub のドメイン名 |
| GitLab | DevOps プラットフォーム / Git リポジトリホスティングサービス |
| Global | Testim のパラメータースコープ種別 |
| Go to App | Testim UI のボタン名 |
| Google Authenticator | Google の MFA 認証アプリ |
| Google Chrome | Google のブラウザ |
| Got It | UI ボタン名 |
| Grant Access | OAuth 認可画面の Grant Access ボタン |
| greater than | Mobile Configuration 演算子オプション値 |
| Grid management | グリッド管理ドキュメント名（小文字） |
| Grid Management | グリッド管理ドキュメント名 |
| Group Context | グループコンテキスト機能 |
| Group Name | グループ名フィルター |
| Group Name | Quote Line Editor のフィールド名 (2-word compound) |
| Groups | Shared Steps ライブラリのステップカテゴリ |
| head | Unix コマンド名 |
| hello, john | サンプル値（小文字） |
| Hello, John | サンプル値 |
| help.testim.io | Testim のドキュメントドメイン |
| Hidden parameter | 非公開パラメーター（単数形） |
| hidden parameters | 非公開パラメーター（小文字バリアント） |
| Hidden parameters | 非公開パラメーター（小文字バリアント） |
| High Sierra | macOS の短縮表記 |
| Home | Testim UI ボタン名 (Home button ステップ) |
| Home button | Testim のモバイルステップ名 |
| Hook | Hook 単数形 |
| Hooks | Hooks ドキュメント/機能名 |
| Hooks | Hooks（再掲） |
| How to Prepare a .ipa for Mobile Testing | Testim ドキュメントのリンクテキスト |
| How to Prepare an IPA for Mobile Testing | Testim ドキュメントのリンクテキスト |
| href | HTML 属性名 |
| html | マークアップ言語名 |
| HTML | マークアップ言語名（大文字） |
| html element | HTML 要素 |
| HTML element | HTML 要素（Title Case） |
| html parameter | パラメータータイプ（小文字） |
| HTML parameter | パラメータータイプ |
| http | URL スキーム識別子 |
| HttpOnly | Cookie 属性 |
| HTTPS | Hypertext Transfer Protocol Secure |
| https | URL スキーム識別子 |
| i.t.a.i.n | Testim Mobile のログソース識別子 |
| IAM | Identity and Access Management の略称 |
| IDE | 統合開発環境の略称 |
| ide | IDE の小文字バリアント |
| Identity and Access Management | IAM の完全表記 |
| ighibli | GitHub ユーザー名 (ios-devicesupport owner) |
| ignore displacement diffs | ビジュアル検証オプション |
| Ignore Displacement Diffs | ビジュアル検証オプション（大文字） |
| Ignore Displacement Diffs | Testim Test Configuration の設定項目名 |
| Ignore displacement diffs | ビジュアル検証オプション（Title Case） |
| Improve | Testim のロケーター改善アクション名 |
| Include Evaluating | Dashboard の Evaluating テストを含めるオプション |
| Index | Testim のロケーター属性名 |
| IndexOnlyXPath | Testim のロケーター名 |
| innerText | JavaScript DOM プロパティ名 |
| input | HTML input 要素名 |
| Input | HTML input 要素名（Title Case） |
| Insert Apple Team ID | Testim UI のテキストフィールド名 |
| Insights | Insights 画面名 |
| Internet cookie | Internet Cookie 表記バリアント |
| IOException | Java 例外クラス名 |
| iOS | Apple モバイル OS 名 |
| ios | iOS の小文字バリアント |
| IOS | iOS の大文字表記 |
| ios image | iOS Image の小文字バリアント |
| iOS image | iOS Image の小文字バリアント |
| iOS Image | Testim Mobile の iOS イメージ概念 |
| iOS Images | iOS Image の複数形 |
| iOS images | iOS Images の小文字バリアント |
| ios-devicesupport | GitHub の iOS 開発ツールリポジトリ名 |
| item a | Word サンプル文字列（小文字） |
| Item A | Word サンプル文字列 |
| iTunes | Apple の iTunes ソフトウェア |
| Java | プログラミング言語 Java |
| java | Java の小文字バリアント (ログや変数) |
| java | Java の小文字バリアント |
| java.io.ioexception | Java 例外クラス名 |
| java.util.concurrent.executionexception | Java 例外クラス名 |
| javascript | パラメータータイプ値（小文字） |
| JavaScript | パラメータータイプ値 |
| javascript parameter | パラメータータイプ（フル小文字） |
| JavaScript parameter | パラメータータイプ（フル） |
| Jenkins | オープンソース CI / CD サーバー |
| john | サンプル値（小文字） |
| John | サンプル値 |
| jquery | jQuery ライブラリ（小文字） |
| jQuery | jQuery ライブラリ |
| js | JavaScript 短縮（小文字） |
| JS | JavaScript 短縮 |
| JS Editor | JS Editor パネル |
| js expression | JavaScript 式（小文字） |
| JS expression | JavaScript 式 |
| js parameter | パラメータータイプ（小文字） |
| JS parameter | パラメータータイプ |
| jszip | ライブラリ名（小文字バリアント） |
| JSZip | ライブラリ名（npm パッケージ） |
| Jump to the next conflict | Branching の次の競合にジャンプボタン |
| JUnit | Java 向けテストフレームワーク名 |
| JUnitXMLReporter | JUnit XML レポーター |
| jurisdiction name | PDF サンプル文字列（小文字） |
| Jurisdiction name | PDF サンプル文字列 |
| Key Value | Document Validation の抽出モード名 (2-word compound) |
| Key-Value | API Header 入力モード |
| Kind | Test Library の Kind 列ヘッダー |
| Kotlin | プログラミング言語 Kotlin |
| kotlin | Kotlin の小文字バリアント |
| label | ラベルフィルター入力キーワード |
| Label | Test Library の Label 列 / フィルター |
| label:failed | ラベル検索サンプル |
| label:Failed | ラベル検索サンプル |
| label:sanity | ラベル検索サンプル |
| Labels | ラベルドキュメント名 |
| labels | CSV 列名（ラベル） |
| Last 24 Hours | 日付範囲フィルター値 |
| Last 3 Days | 日付範囲フィルター値 |
| Last 3 Months | 日付範囲フィルター値 |
| Last 30 Days | 日付範囲フィルター値 |
| Last 7 Days | 日付範囲フィルター値 |
| last run status | CSV 列名（最終実行ステータス） |
| Last Runs | Test Library の最終実行列 |
| Lead | Salesforce オブジェクトタイプ |
| less than | Mobile Configuration 演算子オプション値 |
| Lightning | Salesforce の UI 実行モード名 |
| list of possible attributes | 属性一覧リンクラベル |
| List of possible attributes | 属性一覧リンクラベル（Title Case） |
| lit | LIT の小文字バリアント |
| LIT | web framework 名 (Testim 未対応例) |
| lit.dev | LIT の公式ドメイン |
| Local | Testim のパラメータースコープ種別 |
| Local | Variable scope オプション |
| location | PowerPoint サンプル文字列（小文字） |
| Location | PowerPoint サンプル文字列 |
| Locator auto improved | ロケーター自動改善フィルター値 |
| Locator auto improved | Testim の Locators 自動改善通知メッセージ |
| Locator Highlighting | Testim Mobile UI のアクション名 |
| Locators: Auto Improve | Auto Improve ドキュメント名 |
| Locators: Auto Improve | Testim ドキュメントのリンクテキスト |
| Log a Call | Salesforce の Quick Action 名 |
| LOG IN | ログインボタン等の UI ラベル (大文字表記) |
| Log in | ログインボタン等の UI ラベル (Element text 条件値) |
| Log in as another user | Log In As Another User の小文字バリアント |
| Log In As Another User | Testim for Salesforce のステップ名 |
| Log in with username and password | Testim for Salesforce のペルソナ認証方式 |
| Log Screenshots | Testim for Salesforce の設定オプション名 |
| login | Testim ドキュメント内のサンプル用 login 表記 (小文字) |
| loginButton | Testim ドキュメント内のサンプル変数名 |
| Loop for | Testim のループ種別 |
| ls | Unix コマンド名 |
| Machine learning | Testim のモバイルロケーター種別 |
| Machine learning mode | Testim のモバイルロケーター種別 (compound) |
| macOS High Sierra | OS バージョン表記 |
| macOS Mojave | OS バージョン表記 |
| macOS Sierra | OS バージョン表記 |
| master | Git ブランチ名 (ios-devicesupport) |
| Master branch | Master ブランチ完全表記 |
| match level | ビジュアル検証マッチレベルプロパティ名 |
| Match Level | ビジュアル検証マッチレベルプロパティ名（大文字） |
| Match level | ビジュアル検証マッチレベルプロパティ名（Title Case） |
| match levels | マッチレベルドキュメントセクション参照（小文字） |
| Match levels | マッチレベルドキュメントセクション参照 |
| Match Production Licenses to Sandbox Without a Refresh | Salesforce の管理ツール名 |
| Max Steps | 最大ステップ数入力フィールド |
| MB | メガバイト単位 |
| mb | MB の小文字バリアント |
| Mercurial | 分散バージョン管理システム |
| Merge Branch | Branching のマージ実行ボタン |
| Merge cherry-pick | Branching のチェリーピックマージ機能 |
| method | HTTP メソッドフィールド名（小文字） |
| Method | HTTP メソッドフィールド名 |
| MFA | Multi-Factor Authentication 略称 |
| MFA | Multi-Factor Authentication の略称 |
| Microsoft Authenticator | Microsoft の MFA 認証アプリ |
| Microsoft Teams | Microsoft のチームコラボレーションサービス |
| Min. Steps | 最小ステップ数入力フィールド |
| Mirroring Toolbar | Testim Mobile の UI 領域名 |
| Mirroring Window | Testim Mobile の UI 領域名 |
| Mobile Grid | モバイル実行グリッド |
| Mobile Native | モバイルネイティブテストタイプ |
| Mobile Test Action Panel | Testim Mobile UI のパネル名 |
| Mobile Test Editor | Testim Mobile UI 名 |
| Mobile Test Library | Test Library 画面のモバイルバリアント名 |
| Mobile Test Steps | Testim Mobile UI のセクション名 |
| Mobile Web | モバイル Web テストタイプ |
| Mock-network | ネットワークモックオプション |
| Mojave | macOS の短縮表記 |
| mongodb | mongodb パッケージ名 |
| Move Down | Test Suite のテスト順序下移動ボタン |
| Move To | Test Library のテスト移動ダイアログ名 |
| Move Up | Test Suite のテスト順序上移動ボタン |
| ms excel | Microsoft Excel（小文字） |
| MS Excel | Microsoft Excel |
| ms powerpoint | Microsoft PowerPoint（小文字） |
| MS PowerPoint | Microsoft PowerPoint |
| ms word | Microsoft Word（小文字） |
| MS Word | Microsoft Word |
| Multi-Factor Authentication | MFA 完全表記 |
| multipart/form-data | HTTP multipart content type |
| Multiple Options | 検証パラメーター見出し |
| my custom error | Testim ドキュメントのサンプル文字列 |
| my second test | 実行順序サンプルテスト名 |
| my test | 実行順序サンプルテスト名 |
| myCookie | Get Cookie の既定変数名 |
| myproject | サンプルパラメーター値 |
| mysql | mysql パッケージ名 |
| mysql2 | mysql2 パッケージ名 |
| name | パラメーター設定キー |
| name | CSV 列名（名前） |
| Name the new step | ステップ名入力フィールド |
| Name the new step | Testim ステップ名フィールドラベル |
| Native click event | クリックイベントタイプ：ネイティブ |
| Navigation step | Testim のステップ種別名 |
| Net Total | CPQ Quote Line Editor のフィールド名 |
| Network Capture Options | 設定セクション名 |
| network validation | 検証ステップカテゴリ名（小文字バリアント） |
| Network Validation | デフォルトステップ名 |
| Network Validation | 検証ステップカテゴリ名 |
| Never run step | Testim の実行条件種別 (skip) |
| New Branch | 新規ブランチオプション |
| New Branch Name | ブランチ作成フィールド名 |
| New Config | 新規構成作成ボタン |
| New Event | Salesforce の Quick Action 名 |
| New Folder | 新規フォルダー作成ボタン |
| New name | 名前変更ダイアログの新名称フィールド |
| New Plan | Test Plans の新規作成ボタン |
| new regexp | 正規表現コンストラクタ（小文字） |
| new RegExp | 正規表現コンストラクタ |
| New Suite | テストスイート新規作成ボタン |
| New Task | Salesforce の Quick Action 名 |
| New Test | Testim UI のメニュー項目名 |
| Next | UI ナビゲーションボタン（再掲） |
| Non-native click event | クリックイベントタイプ：非ネイティブ |
| not equal validation | 検証モード名 |
| Not Equal Validation | 検証モード名（Title Case） |
| npm package variable | CLI ステップ変数（小文字） |
| NPM package variable | CLI ステップ変数 |
| number | Testim ドキュメントのサンプル変数名 |
| Number of matches - Ascending | ソートオプション |
| Number of matches - Descending | ソートオプション |
| Number of steps - Ascending | ソートオプション |
| Number of steps - Descending | ソートオプション |
| Number of Steps | ステップ数フィルター |
| OAuth | OAuth 認証プロトコル |
| Objective C | プログラミング言語 Objective C |
| objective c | Objective C の小文字バリアント |
| on | 汎用英語単語 (ログ内) |
| Open AUT | Testim UI のリンク名 |
| Open Base URL | Testim UI のリンク名 |
| Open Developer Tool | Xcode メニュー項目名 |
| Open in Terminal | Ubuntu のファイルマネージャーメニュー |
| Open Link to Relevant Step | Testim UI のリンク名 |
| Open Pull Request | プルリクエスト作成ボタン |
| Open Test | テストを開くアイコン |
| OpenAPI | API 仕様フォーマット名 |
| Operand | Mobile Configuration のオペランド入力フィールド |
| Operator | Mobile Configuration の演算子選択フィールド |
| Operator | Related List Action の UI フィールド名 |
| Opportunities | Salesforce オブジェクトタイプ（複数形） |
| Opportunity | Salesforce オブジェクトタイプ |
| OS | オペレーティングシステムの略称 |
| os command prompt | ターミナル名（小文字バリアント） |
| OS Command Prompt | ターミナル名 |
| OS X El Capitan | OS バージョン表記 |
| OS X Mavericks | OS バージョン表記 |
| OS X Mountain Lion | OS バージョン表記 |
| OS X Snow Leopard | OS バージョン表記 |
| OS X Yosemite | OS バージョン表記 |
| Override Application | Mobile Test Plans のアプリ上書きチェックボックス |
| Override Base URL | Test Plans のベース URL 上書きチェックボックス |
| Override default configurations | Test Plans の構成上書きチェックボックス |
| Override timeout | プロパティ名（再掲） |
| override timeout | Override timeout の小文字バリアント |
| Override timeout | Testim の Properties ボタン名 (Custom 条件) |
| overrideTestData | Config File プロパティ名 |
| Owner | Test Library の Owner 列 |
| p12 | 証明書ファイル拡張子 |
| package | パラメータータイプ値（小文字） |
| Package | パラメータータイプ値 |
| package parameter | パラメータータイプ名 |
| Package parameter | パラメータータイプ名（先頭大文字） |
| Package Parameter | パラメータータイプ名（Title Case） |
| package variable | CLI ステップ変数（短縮） |
| Package variable | CLI ステップ変数（Title Case） |
| packagevariable | 変数既定名 |
| PackageVariable | 変数既定名（camelCase） |
| Page accessibility validation | プロパティデフォルト値 |
| Page Accessibility Validation | 検証ステップ名 |
| param | 変数既定名 |
| Param | 変数既定名（Title Case） |
| param1 | Testim ドキュメントのサンプルパラメーター名 |
| Parameter Name | パラメーター名フィールド |
| Parameters | パラメーター機能ドキュメント名 |
| params | パラメーター追加ボタン |
| Params | パラメーター追加ボタン（Title Case） |
| password | 例示 Cookie 名 |
| Paste code at cursor | Coding Assistant の貼り付けボタン |
| Paste copied steps | Testim Editor のペーストアイコン名 |
| Path | Cookie パスフィールド |
| path | CSV 列名（パス） |
| pdf documents | Chrome 設定項目名（小文字） |
| PDF documents | Chrome 設定項目名 |
| Perform callout and continue with deployment | Copado URL Callout ステップの Type オプション値 |
| Perform callout and pause step | Copado URL Callout ステップの Type オプション値 |
| Permissions | Ubuntu のファイルマネージャーメニュー |
| Personal Access Token | 個人アクセストークン認証方式 |
| Physical Device | Testim Mobile のデバイス種別 |
| Plan | プラン分類ラベル |
| Plans List | Test Plans リスト画面 |
| Play Scenario | シナリオ再生ボタン |
| Play Scenario | Testim Editor のシナリオ実行ボタン名 |
| Plus | + アイコンの UI ラベル名 |
| Pop-ups | Chrome 設定の英語ラベル |
| pop-ups | Pop-ups の小文字バリアント |
| post | HTTP メソッド（小文字） |
| POST | HTTP メソッド |
| post api | API 呼び出しメソッド |
| post api call | POST API 呼び出し（小文字） |
| POST API call | POST API 呼び出し |
| PR | Pull Request 略称 |
| Predefined steps | 定義済みステップメニュー名 |
| Predefined steps | Testim の組み込みステップカテゴリ |
| preprod.com | Testim ドキュメント内で用いる例示ホスト名 |
| privacy and security | Chrome 設定セクション（小文字） |
| Privacy and security | Chrome 設定セクション |
| pro機能 | PRO 機能ラベル（日本語混在） |
| PRO | Pro 機能表記 |
| pro feature | PRO 機能ラベル（小文字） |
| PRO feature | PRO 機能ラベル |
| Product | Xcode メニュー名 |
| Product Code | Salesforce のフィールド名 |
| Professional Edition | Salesforce のエディション名 |
| Professional plan | Professional プラン |
| professional plan | Testim プランタイプ（小文字） |
| Professional plan | Testim プランタイプ |
| Project duplication level | Auto Grouping 画面項目 |
| PROMISE | javascript 構文キーワード（大文字強調） |
| promise | Promise パッケージ名（小文字） |
| Promise | Promise パッケージ名 |
| Properties panel | Properties パネル |
| Properties Panel | Properties パネル（大文字バリアント） |
| Properties Panel | Testim UI 要素名 |
| Protect branch from changes | ブランチ保護トグル |
| Publish JUnit test result report | Jenkins ポストビルドアクションの型名 |
| Pull Request is disabled for this project | プルリクエスト無効化時の表示メッセージ |
| Pull Request is disabled for this project. | プルリクエスト無効化時のメッセージ全文 |
| Pull Requests | Dashboard の Pull Requests パネル名 |
| put | HTTP メソッド（小文字） |
| PUT | HTTP メソッド |
| qTest Test Management | Tricentis の qTest テスト管理プラットフォーム正式名 |
| qtp499764573-13 | ログのスレッド識別子サンプル |
| query | サンプルパラメーター名/値 |
| Quick Action | Salesforce の UI アクション名 |
| Quick Actions | Salesforce の UI アクション名（複数形） |
| Quote Line Editor | Salesforce CPQ のエディタ名 |
| radio | ラジオボタン要素 |
| radio button | UI コンポーネント名（小文字） |
| Radio button | UI コンポーネント名 |
| Re-Submit | プルリクエスト再送信ボタン |
| ReactRoot | Testim のロケーター名 |
| read-only | ブランチ読み取り専用ラベル |
| reason | ログメッセージの一部 |
| Reassign | 要素再割り当てボタン |
| Recent Activity | Dashboard の最近のアクティビティパネル |
| Record | Testim Editor の記録開始ボタン |
| Record action here | Record actions here の単数形 |
| Record Actions | Testim Editor の記録アクションラベル |
| Record actions here | Testim Editor のアクション記録挿入コマンド |
| Recovering a Test That Was Not Saved | Testim ドキュメントのリンクテキスト |
| regex | 正規表現 |
| regex option | 検証オプション |
| Regex option | 検証オプション（Title Case） |
| RegExp | 正規表現クラス |
| regexp | 正規表現（RegExp） |
| reject | JavaScript Promise 動詞 |
| Related | Salesforce の関連タブ名 |
| Related List Action | Testim for Salesforce のステップ名 |
| Release Manager | Copado の Release Manager アプリ機能名 |
| Remote Execution Runs | Dashboard のリモート実行パネル |
| Remote run | リモート実行ラベル |
| Remote Test Runs | Dashboard のリモート実行タブ名 |
| Remote Test Runs | Dashboard のリモート実行パネル名 |
| repeat group loops | Repeat Group Loops の小文字バリアント |
| Repeat Group Loops | Testim のループ種別名 |
| Replace owner | Test Owner 置換ボタン |
| Replace with Clone | Testim UI のリンクテキスト |
| Reports | Insights 内 Reports タブ / レポート画面 |
| request body | ネットワーク検証プロパティ（小文字） |
| Request Body | ネットワーク検証プロパティ |
| Request Body | API プロパティ |
| Request Changes | プルリクエスト変更リクエストアクション |
| Request Headers | API プロパティ（再掲） |
| Request Method | API プロパティ |
| Request URL | API プロパティ |
| requestBody | ネットワークプロパティ（camelCase） |
| resolve | JavaScript Promise 動詞 |
| Resolve all | Branching の全競合一括解決ボタン |
| response body | ネットワーク検証プロパティ（小文字） |
| Response Body | ネットワーク検証プロパティ |
| Response Body | API レスポンスプロパティ |
| Response Headers | API レスポンスプロパティ（再掲） |
| Response Status | API レスポンスステータス |
| responseBody | ネットワークプロパティ（camelCase） |
| resposeheaders | ネットワークプロパティ（既存 camelCase typo 維持） |
| REST API | REST API の表記 (2-word compound) |
| Resubmit | プルリクエスト再送信ボタン（ハイフンなし） |
| Result Labels | Reports の結果ラベルフィルター |
| Resume URL | Copado のレジューム URL 機能 |
| Return to current page after Log Out | Log In As Another User のオプション |
| Reusable test data | 再利用可能テストデータ |
| Reusable Test Data | 再利用可能テストデータ（大文字バリアント） |
| reuse | プログラミング概念 (通常英語維持、JA 文内) |
| Review required | プルリクエストレビュー必須ステータス |
| Revision History | テストのリビジョン履歴パネル名 |
| rich text editor | リッチテキストエディター要素（小文字バリアント） |
| Rich Text Editor | リッチテキストエディター要素 |
| Root | フォルダー階層の root |
| Root Cause Analysis | 機能名 |
| Root Cause Analysis | Testim の分析機能名 |
| rule-descriptions | axe-core ドキュメント参照 |
| Rules | Mobile Configuration のルールセクション |
| run action | デフォルトステップ名（小文字） |
| Run action | アクションステップ |
| Run action | デフォルトステップ名（小文字混在） |
| Run Action | デフォルトステップ名 |
| Run action | Custom Action の既定 Description |
| Run additional code on request | API Assertion 後処理コードオプション短縮 |
| Run additional code on request results | API Assertion 後処理コードオプション |
| Run API Action | アクションステップ |
| run cli action | デフォルトステップ名（小文字） |
| Run CLI Action | デフォルトステップ名 |
| run cli validation | デフォルトステップ名（小文字） |
| Run CLI Validation | デフォルトステップ名 |
| Run Hooks | Run Hooks セクション |
| run hooks | Run Hooks（小文字バリアント） |
| Run in Incognito mode | Run Test Locally のシークレットモード実行オプション |
| Run locally | テストローカル実行ラベル |
| run network validation | デフォルトステップ名（小文字） |
| Run Network Validation | デフォルトステップ名 |
| Run only specific tags | プロパティ名 |
| Run shared action | 共有アクションの既定 Description |
| Run Shared API Validation | 共有 API 検証実行ウィンドウ |
| Run test | テスト実行ボタン（小文字バリアント） |
| Run Test Locally | テストをローカル実行するダイアログ名 |
| run test to relevant step | Run Test to Relevant Step の小文字バリアント |
| Run Test to Relevant Step | Testim UI のリンク名 / ボタン名 |
| run validation | デフォルトステップ名（小文字） |
| Run validation | デフォルトステップ名（小文字混在） |
| Run Validation | デフォルトステップ名 |
| Run Validation | デフォルトステップ名（Title Case） |
| Running | Xcode Build for > Running |
| Running Tests | テスト実行ドキュメント名 |
| runs | メインメニュー項目（小文字） |
| Runs | メインメニュー項目 |
| Runs | Runs 画面名 / ナビゲーション項目 |
| Salesforce | クラウド CRM プラットフォーム |
| Salesforce APEX Action | Salesforce APEX アクションステップ名 |
| Salesforce Auto-Login | Salesforce 自動ログインステップ名 |
| Salesforce CPQ | Salesforce の CPQ 製品名 |
| Salesforce Flows | Testim for Salesforce のステップ分類 |
| Salesforce Object Query Language | SOQL の完全表記 |
| Salesforce Object Search Language | SOSL の完全表記 |
| Sample_Test | Test Owner ドキュメントの例示テスト名 |
| Sandbox | Salesforce の環境タイプ |
| Sauce Labs | クラウドブラウザ / デバイスグリッド（スペース区切り表記） |
| Sauce Labs Platform Configurator | Sauce Labs プラットフォームコンフィギュレーターツール名 |
| SauceLabs Test Configuration Options | SauceLabs のテスト構成オプションドキュメント名 |
| Sause Labs | SauceLabs の誤字バリアント（原文保持） |
| Sause Labs Platform Configurator | Sause Labs プラットフォームコンフィギュレーターツール名 |
| save view | Dashboard のビュー保存ボタン |
| save view | Dashboard のフィルタ設定保存オプション |
| save view | Dashboard のビュー保存ボタン（小文字バリアント） |
| saving a filtered view | フィルタービュー保存ドキュメント名（小文字） |
| Saving a Filtered View | フィルタービュー保存ドキュメント名 |
| Scheduler | スケジューラードキュメント/機能名 |
| Scheduler | Reports の実行タイプフィルター値（スケジューラー） |
| Scroll | Testim のアクションステップ名 |
| Scroll on page | Scroll ステップの variant |
| Scroll to | Scroll ステップの variant |
| Scroll to Element | スクロールステップのバリアント |
| SDK | ソフトウェア開発キット略称 |
| Search library | Test Library の検索テキストボックスラベル |
| Secure | Cookie 属性 |
| See All Tests Using This Group | Testim UI のリンクテキスト |
| See all tests using this shared step | Testim UI のリンクテキスト |
| See old revision | Revision History パネルの旧リビジョン表示ボタン |
| Select a Device | Testim Mobile UI のダイアログ名 |
| Select folder | Select Shared Folder の短縮形 |
| Select original | 元の選択に戻すボタン |
| Select Shared Folder | Testim Shared Steps UI のダイアログ名 |
| Select shared step | 共有ステップフォルダー選択 |
| Select shared step folder | 共有ステップフォルダー選択フィールド |
| Send SMS | Send SMS ステップ |
| Send via web page | Testim の API アクションステップのプロパティ名 |
| sequelize | sequelize パッケージ名 |
| session | Cookie 有効期限オプション（小文字） |
| Session | Cookie 有効期限オプション |
| Set condition | Testim の Set condition ウィンドウ名 |
| Set cookie | Set cookie ステップ（小文字バリアント） |
| Set Cookie | Set Cookie ステップ名（再掲） |
| Set Cookie step | Set Cookie ステップ完全表記 |
| Set geolocation | Set geolocation ステップ |
| Set Geolocation | Set Geolocation ステップ |
| Set password | Set Text ステップの例示ステップ名 |
| Set Text | ステップ名 |
| Set text | ステップ名（sentence case） |
| Set username | Set Text ステップの例示ステップ名 |
| Setting the Test Configuration | テスト構成設定ドキュメント名 |
| setting the test configuration | Setting the Test Configuration の小文字バリアント |
| Setting the Test Configuration | Testim ドキュメントのリンクテキスト |
| Settings | プロジェクト設定画面名 |
| Settings | UI ナビゲーション要素 |
| setup | Setup の小文字バリアント |
| setup step | セットアップステップ |
| Setup step | Setup ステップ |
| Setup Step | Setup ステップ（大文字バリアント） |
| Setup step | Test Editor のセットアップステップ（小文字バリアント） |
| Setup step | セットアップステップ（Title Case） |
| Setup Step in the Test Editor | Test Editor のセットアップステップ |
| Setup step timeout | 構成設定のセットアップステップタイムアウト項目 |
| Setup Step Timeout | Testim Test Configuration の設定項目名 |
| Share step | Share step プロパティ |
| Shared group | 共有グループ |
| Shared group name | 共有グループ名フィールド |
| Shared step | 共有ステップチェックボックス |
| Shared Step | 共有ステップ（再掲） |
| Shared Step | Shared Steps の単数形 |
| Show all | 全項目表示ボタン |
| Show All Tests | Auto Improve 画面：すべてのテスト表示トグル |
| Show Build Folder in Finder | Xcode メニュー項目名 |
| Show Flaky Tests | フィルター：不安定テストのみ表示トグル |
| show hidden steps | Shared Steps の非表示ステップ表示オプション |
| Show improved steps | Revision History パネルの改善ステップ表示トグル |
| Show only flaky tests | Auto Improve 画面：不安定テストのみ表示トグル |
| Show properties | プロパティ表示アイコン（小文字バリアント） |
| Show Properties | プロパティ表示アイコン |
| Show properties | Test Editor のプロパティ表示アイコン |
| Show Properties | Testim UI のボタン名 |
| Show Properties | Testim UI アクション名 |
| Show Properties | Testim UI の歯車アイコンラベル |
| Show step properties | ステッププロパティ表示ボタン |
| shutdown | Unix/simctl サブコマンド名 |
| Sierra | macOS の短縮表記 |
| Sign in with Salesforce | Sign-in with Salesforce のハイフンなしバリアント |
| Sign-in with Salesforce | Testim for Salesforce のペルソナ認証方式 |
| simctl | Xcode Simulator CLI |
| Simulator | 汎用シミュレーター用語 (iOS Simulator など) |
| simulator | Simulator の小文字バリアント |
| Simulator | Xcode のシミュレーター名 |
| site settings | Chrome 設定セクション（小文字） |
| Site settings | Chrome 設定セクション |
| smart locators | Testim AI 機能（小文字） |
| Smart Locators | Testim AI 機能 |
| Smart locators | Testim AI 機能（sentence case） |
| SMS | Short Message Service |
| sObject | Salesforce オブジェクト型の表記 |
| SObject | sObject の大文字バリアント |
| SOQL | Salesforce Object Query Language の略称 |
| SOSL | Salesforce Object Search Language の略称 |
| staging.com | Testim ドキュメント内で用いる例示ホスト名 |
| start | 汎用コマンド/動詞 |
| static allocation | Mobile Configuration の静的割り当て（小文字表記） |
| Static Allocation | Mobile Configuration の静的割り当てオプション |
| status | CSV 列名（ステータス） |
| Status | Test Library の Status 列 |
| Status Code | API ステータスコードフィールド |
| Status code | API Assertion 対象 |
| status code | HTTP ステータスコードフィールド |
| statusCode | HTTP ステータスコード（camelCase 小文字） |
| statusCode | HTTP ステータスコードフィールド（camelCase） |
| StatusCode | HTTP ステータスコード（camelCase） |
| Stay on current page after Log In As | Log In As Another User のオプション |
| Step (Mobile) | Testim のモバイルステップ一般 |
| Step delay | 構成設定のステップ遅延項目 |
| Step Delay | 構成列ヘッダー（ステップ遅延） |
| Step Delay | Testim Test Configuration の設定項目名 |
| Step Description | Testim UI の Description フィールド名 |
| Step failed | エラーメッセージ断片 |
| Step Failed | エラーメッセージ断片（大文字） |
| Step name | Step name プロパティ（再掲） |
| Step Parameters | Testim Properties のステップパラメーターセクション |
| Step timeout | 構成設定のステップタイムアウト項目 |
| Step Timeout | 構成列ヘッダー（タイムアウト） |
| Store | Document Validation / Related List Action の UI アクション名 |
| Submit | Pull Request の送信ボタン |
| sudo | Unix コマンド名 |
| Suggested owners | Test Owner 提案リスト |
| Suite | Reports の実行タイプフィルター値（スイート） |
| Suite | Testim のパラメータースコープ種別 |
| Suite | Variable scope オプション |
| Suite Name | スイート名フィルター |
| Suite Runs | Dashboard / Runs のスイート実行タブ |
| Suite Runs | Runs の Suite Runs タブ名 |
| SuperSecretPassword | 例示パスワード |
| SuperSecretPassword! | 例示パスワード（感嘆符付き） |
| Swagger | OpenAPI ベース API ドキュメントツール名 |
| Swift | プログラミング言語 Swift |
| swift | Swift の小文字バリアント |
| Tab Name | Related List Action のフィールド名 (2-word compound) |
| Tag Owner | Test Owner 所有者タグ付けアクション |
| target checkbox | チェックボックスターゲットプロパティ名（小文字） |
| Target checkbox | チェックボックスターゲットプロパティ名 |
| target checkbox/radio button | 対象要素フィールド名（小文字） |
| Target checkbox/radio button | 対象要素フィールド名 |
| target checkbox/radio button | チェックボックス/ラジオボタンプロパティ名（小文字） |
| Target checkbox/radio button | チェックボックス/ラジオボタンプロパティ名 |
| Target Element | Testim UI のターゲット要素表示ラベル |
| Target Project | プルリクエストのターゲットプロジェクトフィールド |
| target radio button | ラジオボタンターゲットプロパティ名（小文字） |
| Target radio button | ラジオボタンターゲットプロパティ名 |
| Task | Salesforce の Quick Action 名 / オブジェクト名 |
| td | ls のオプション |
| Team productivity | チーム生産性レポート名 |
| TeamCity | JetBrains の CI / CD プラットフォーム |
| Teams | Microsoft Teams 通知サービス |
| Terms of Service | UI 固定テキスト |
| test | サンプル値 |
| test configuration | プロジェクト設定セクション（小文字） |
| Test Configuration | テスト設定画面 |
| Test Configuration | プロジェクト設定セクション |
| Test Configuration Hooks Run Parameters | Test Configuration Hooks パラメーター |
| Test Configuration Parameters | テスト構成パラメータードキュメントセクション名 |
| Test Configuration Properties | Test Configuration プロパティパネル |
| Test Data | テストデータ機能（再掲） |
| Test Data property | Test Data プロパティ |
| Test in TTM for Jira | Testim UI の設定名 |
| Test Library | Test Library 画面名 |
| Test List | Test List ペイン |
| Test list | Test Plans の Test list 段階ラベル |
| Test List | Testim UI の Test List 画面 |
| Test Lists | テストリスト（複数形バリアント） |
| Test Name | テスト名フィルター |
| Test Overview | Dashboard のテスト概要セクション |
| Test owner | テストオーナー |
| Test Owner | テスト所有者ドキュメント名 |
| Test Plan Demo | Test Plans の名前例 |
| Test Run Details | テスト実行の詳細ビュー名 |
| Test runs | テスト実行結果画面（複数形バリアント） |
| Test runs | Test runs ドキュメント名 |
| Test Status | テストステータスドキュメント名 |
| Test Statuses | テストステータス一覧ドキュメント名 |
| test1 | 実行順序サンプルテスト名 |
| Testim Iterator | Testim 組み込みイテレーター |
| testim weekly report | Reports の週次サマリーメール件名（小文字） |
| Testim weekly report | Reports のメール件名 |
| Testim weekly report | Reports の週次サマリーメール件名 |
| Testim's Activity | Reports の Testim 活動セクション見出し |
| TestOps | TestOps 機能群名 |
| TestOps Dashboard | TestOps ダッシュボード画面名 |
| TestRail | Gurock の Web ベーステスト管理ツール |
| Tests Run Results | Reports のテスト実行結果セクション |
| Tests to be cloned | クローン対象テストリストセクション |
| text | Testim ドキュメントの text フィールド名 |
| text to assign | プロパティ名（小文字） |
| Text to assign | プロパティ名 |
| Text to assign | Set Text ステップの入力フィールド名 |
| Text to Assign | Testim UI のフィールドラベル |
| text to assign | Text to Assign の小文字バリアント |
| The number of duplicate steps | Auto Grouping 画面項目 |
| The number tests and groups | Auto Grouping 画面項目 |
| Threshold level | Testim UI のしきい値設定項目 |
| Title | Pull Request のタイトルフィールド |
| to enable the feature | プルリクエスト有効化リンクの補足文言 |
| toaddress | 宛先メールアドレスパラメーター名（小文字） |
| toAddress | 宛先メールアドレスパラメーター名 |
| Today | 日付範囲フィルター値 |
| Toggle breakpoint | ブレークポイント切り替えボタン（小文字バリアント） |
| Toggle Breakpoint | ブレークポイント切替ボタン |
| Toggle Breakpoint | ブレークポイント切り替えボタン |
| Toggle Breakpoint | Testim Editor のブレークポイント切替ボタン名 |
| tomsmith | 例示 Cookie 値 |
| Trello | Atlassian のプロジェクト管理ツール |
| Tricentis | Tricentis 会社名 |
| Tricentis Support | Tricentis のサポートチャネル |
| Tricentis Test Automation for Salesforce | Testim for Salesforce の正式名称 |
| Tricentis Test Management for Jira | TTM for Jira の完全名称 |
| tricentis-mobile-agent | Tricentis Mobile Agent CLI |
| true | JavaScript 真偽値 (ブール値リテラル) |
| true | JavaScript 真偽値 |
| truthy | JavaScript 真偽値概念 |
| truthy | JavaScript の真値判定用語 |
| trying | ログメッセージの一部 |
| TTA for Salesforce | Tricentis Test Automation for Salesforce 製品名 |
| TTM for Jira | Tricentis Test Management for Jira の略称 |
| Turn on/off Element Highlighting | Testim Mobile UI のアクション名 |
| turn on/off element highlighting | Turn on/off Element Highlighting の小文字バリアント |
| turn on/off locator highlighting | Testim Mobile UI のアクション名 |
| Twilio | Twilio SMS プラットフォーム（第三者ツール） |
| type | パラメーター設定キー |
| UDID | デバイスの一意識別子 |
| udid | UDID の小文字バリアント |
| UI Automator | Android 自動化フレームワーク名 |
| ui element | UI 要素（小文字） |
| UI element | UI 要素 |
| Ultrafast Test Cloud | Applitools の追加環境機能名（3-word compound） |
| unchecked | 未選択ステータス |
| unknown | 汎用英語単語 (ログ内) |
| Untitled | Testim Test Configuration のデフォルト名 |
| Updated | Test Library の Updated 列 |
| Upload App | Testim UI のアップロードボタン (モバイル) |
| Upload App | Testim UI のアップロードオプション |
| upload app | Upload App の小文字バリアント |
| Upload Certificate | Testim UI のボタンラベル (iOS アーティファクト) |
| Upload File | ファイルアップロードボタン（再掲） |
| Upload Provisioning Profile | Testim UI のボタンラベル (iOS アーティファクト) |
| URL Callout | Copado / AutoRABIT の URL Callout ステップ機能名 |
| URL Callout | Testim ステップ名 |
| usb | USB の小文字バリアント |
| USB | USB 接続種別 |
| USB Debugging | Android の開発者オプション |
| Use cookie parameter | Set Cookie のラジオボタン |
| user | Testim ドキュメントのサンプル prefix 文字列 |
| username | サンプルパラメーター名 |
| username | 例示 Cookie 名 |
| Username | サンプルパラメーター名（Title Case） |
| users | サンプルパラメーター値 |
| Validate API | Validate API ステップ（再掲） |
| Validate checkbox | 検証ステップ |
| Validate checkbox/radio button | 検証ステップ |
| Validate Checkbox/Radio Button | 検証ステップ（大文字） |
| Validate CSS property | 検証ステップ |
| Validate download | 検証ステップ |
| Validate Download | 検証ステップ（大文字バリアント） |
| Validate Download | Validate Download ステップ完全表記 |
| Validate element attribute | 検証ステップ |
| Validate Element Attribute | 検証ステップ（大文字バリアント） |
| Validate email | 検証ステップ（小文字バリアント） |
| Validate Email | 検証ステップ |
| Validate Email | Testim のモバイルステップ名 |
| Validate email | Validate Email の小文字バリアント |
| Validate email inbox | Email 検証機能 |
| Validate Email Step | Email 検証ステップ名 |
| Validate HTML attribute | 検証ステップ |
| Validate radio | 検証ステップ |
| validating using code in node.js | 参照リンクラベル（小文字） |
| Validating using code in Node.js | 参照リンクラベル |
| validation email | Email 検証 UI ラベル（小文字） |
| Validation Email | Email 検証 UI ラベル |
| Validations | Shared Steps ライブラリのステップカテゴリ |
| value | パラメーター設定キー |
| Value | Testim / Salesforce の UI フィールド名 |
| Variable name | Variable name プロパティ |
| Variable scope | Variable scope プロパティ |
| Verification Code | Salesforce の MFA フィールド名 |
| verification email inbox address | Email 検証設定セクション名 |
| Verification email inbox address | Email 検証設定セクション名（Title Case） |
| Verify | Document Validation / Related List Action の UI アクション名 |
| verify email filters | Email 検証ボタン（小文字） |
| Verify email filters | Email 検証ボタン |
| Verify email filters | Email 検証ボタンラベル |
| Verify Not Visible | Testim for Salesforce のステップアクション名 |
| Verify Picklist Options | Testim for Salesforce のステップ名 |
| View Device | Testim Mobile UI のボタン名 |
| View in Editor | テスト/スイートをエディターで開くアクション |
| View Locators | Testim UI の Locators パネル名 |
| view locators | View Locators の小文字バリアント |
| View Results | Copado / 各 UI の結果表示ボタン |
| View Sent Request | 送信リクエスト表示ボタン |
| View Source | Version Control の比較ビュー：ソース表示 |
| View Source/View Target | Version Control の比較ビュー切り替えボタン |
| View Target | Version Control の比較ビュー：ターゲット表示 |
| viewport visualization | ビジュアル検証種類名（小文字） |
| Viewport Visualization | ビジュアル検証種類名 |
| Virtual Device | Testim Mobile のデバイス種別 |
| Virtual Device Manager | Testim Mobile UI の名称 |
| Vision | Vision Locate の短縮形 (UI 表示) |
| Vision Locate | Testim のモバイルロケーター種別 |
| Vision locate | Vision Locate の小文字バリアント |
| Vision Locate Fallback | Testim のロケーター種別名 |
| Visual Studio | Microsoft の IDE |
| Visual Validation | パラメーターセクション名（短縮） |
| Visual Validation Parameters | パラメーターセクション名 |
| wait for | 待機ステップメニュー名（小文字） |
| Wait For | 待機ステップメニュー名 |
| wait for element visualization | 待機ステップ（小文字バリアント） |
| Wait for element visualization | 待機ステップ |
| WDA | WebDriverAgent の略称 |
| web | Web 技術の総称 (Testim ドキュメント文脈) |
| web cookie | Web Cookie 表記バリアント |
| Web Test Library | Test Library 画面の Web バリアント名 |
| WebDriverAgent | Appium/Testim Mobile で使用する iOS エージェント |
| Webhook | Webhook API 概念 |
| weekly report | Reports のメール件名識別子（小文字） |
| Weekly Report | Reports のメール件名識別子 |
| What to run on | Test Plans の実行対象セクション |
| When a condition fails retry | Testim の Advanced 条件設定オプション |
| When a condition passes verify | Testim の Advanced 条件設定オプション |
| When this step fails | プロパティ名（再掲） |
| when to run | When to run step の短縮表記 |
| When to run step | プロパティ名（再掲） |
| When to run step | Testim Properties の実行条件セクション |
| Where Can You Improve? | Reports の改善ポイント質問見出し |
| Where to Run | Test Plans の実行先フィールド |
| While | Testim のループ種別 |
| while is | Testim のループ種別 (compound, 小文字) |
| While is | Testim のループ種別 (compound) |
| Windows 10 | OS バージョン表記 |
| Windows 11 | OS バージョン表記 |
| Windows 7 | OS バージョン表記 |
| Windows 8 | OS バージョン表記 |
| Windows XP | OS バージョン表記 |
| with Parameters | 検証パラメーター見出し |
| Write code with AI | Coding Assistant のコード生成ボタン |
| www.google.com | Testim ドキュメント内で用いる例示ホスト名 |
| Xcode | Apple の IDE 名 |
| xcode | Xcode の小文字バリアント |
| Xcode IDE | Xcode の完全表記 |
| xcode-select | Xcode 開発者ディレクトリ切替コマンド |
| xcrun | Xcode ユーティリティコマンド |
| yellow-cat-cartoon-style-clipart | 画像サンプルファイル名（小文字） |
| Yellow-cat-cartoon-style-clipart | 画像サンプルファイル名 |
| Yesterday | 日付範囲フィルター値 |
| Your Team's Activity | Reports のチーム活動セクション見出し |
| zip | ZIP の小文字バリアント |
| ZIP | ZIP ファイル形式名 |
