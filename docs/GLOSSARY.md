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
| Tricentis | |
| Tricentis Testim | |
| qTest | Tricentis のテスト管理プラットフォーム |
| qTest Manager | qTest のテスト管理コンポーネント |
| qTest Insights | qTest のインサイトコンポーネント |

## 拡張機能 / IDE

| 用語 | 備考 |
| --- | --- |
| Testim Extension | |
| Tricentis Testim Extension | |
| Testim Visual Editor | |
| Visual Editor | |

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
| Approve | UI ボタン名（qTest、watch: 一般単語） |

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

## キーボードキー名

> ⚠️ **Watch list (PR#267 review より):** `Enter` / `Tab` / `Approve` のような一般的な英単語は、`\b` word-boundary マッチで他文脈の未翻訳英文も mask する可能性がある。
> 実装上 `parity_glossary_mask.classifySegment` は `RESIDUE_MIN_WORDS=3` / `RESIDUE_MIN_LENGTH=15` の防護層で「全英文 segment」は検知され続けるが、**短い英文 segment (< 3 words) は mask されて検知漏れする**。
> 2026-10 Phase 4 audit で、これらのエントリが「意図した UI 文脈 (キー押下/ボタン ラベル) のみ」で mask されていることを `debug.maskCoverage` で確認すること。

| 用語 | 備考 |
| --- | --- |
| Enter | キー名 (watch: 一般単語) |
| Tab | キー名 (watch: 一般単語) |
| Page Up | キー名 (複合語で比較的安全) |
| Page Down | キー名 (複合語で比較的安全) |

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
| Java | プログラミング言語 |
| Kotlin | プログラミング言語 |
| Objective C | プログラミング言語 |
| Swift | プログラミング言語 |
| Ctrl/Cmd | キーボード修飾キーの表記（ctrl/cmd と小文字でも使用） |
| Quarantine | Testim のテスト隔離機能・ステータス |
