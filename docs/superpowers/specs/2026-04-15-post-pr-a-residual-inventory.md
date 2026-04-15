# Parity Phase 4 Residual Inventory (5-bucket)

Task 4.1 で `parity-baseline.json` を 5 bucket に分離した実測結果。
Task 4.2 (artifact registry) / Task 4.3 (URL normalizer) / Task 4.4 (HTML extractor allow list) / Task 4.5 (翻訳修正) への入力分配に用いる。

本ファイルは機械生成 (`scripts/phase4/render_residual_inventory.mjs`)。末尾の「分配方針」節のみ手動追記。

## 1. 概要

- baseline entries 合計: **1863**

### issueType 別件数

| issueType | count |
| --- | --- |
| section-structure-mismatch | 55 |
| segment-extra | 86 |
| segment-inconclusive | 11 |
| segment-missing | 106 |
| segment-order-mismatch | 1 |
| segment-token-gap | 33 |
| segment-untranslated | 1571 |

### bucket 別件数

| bucket | count |
| --- | --- |
| actionable | 1851 |
| artifactCandidates | 0 |
| normalizerCandidates | 1 |
| intentionalDivergenceCandidates | 0 |
| advisoryResidual | 11 |

## 2. bucket 別 entry 一覧

### actionable (1851 件)

| slug | issueType | sectionPath | segmentKind | missingTokens | inconclusiveCategory | inconclusiveReason |
| --- | --- | --- | --- | --- | --- | --- |
| administration/copilot-license-management | segment-untranslated | Assigning seats to users | ordered-list-item |  |  |  |
| administration/copilot-license-management | segment-untranslated | Assigning seats to users | paragraph |  |  |  |
| administration/copilot-license-management | segment-untranslated | Viewing current Copilot license allocation | ordered-list-item |  |  |  |
| administration/copilot-license-management | segment-untranslated | Viewing current Copilot license allocation | ordered-list-item |  |  |  |
| administration/encrypted-credentials | segment-extra | Using Encrypted Credentials in Tests > Adding encrypted credentials to Param File > Making the Param File compatible with encrypted credentials | ordered-list-item |  |  |  |
| administration/encrypted-credentials | segment-missing | Using Encrypted Credentials in Tests > Adding encrypted credentials to Param File > Making the Param File compatible with encrypted credentials | ordered-list-item |  |  |  |
| administration/encrypted-credentials | segment-token-gap | Running test with encrypted credentials summary > Running tests with encrypted credentials in the Test Data | unordered-list-item | /tests/run |  |  |
| administration/encrypted-credentials | segment-untranslated |  | paragraph |  |  |  |
| administration/encrypted-credentials | segment-untranslated | Configuring the Encrypted Credentials > Creating an Encrypted Credential | ordered-list-item |  |  |  |
| administration/encrypted-credentials | segment-untranslated | Configuring the Encrypted Credentials > Creating an Encrypted Credential | paragraph |  |  |  |
| administration/encrypted-credentials | segment-untranslated | How encrypted credentials are used in test runs | paragraph |  |  |  |
| administration/encrypted-credentials | segment-untranslated | Running Tests with Encrypted Credentials > API Runs | callout-body |  |  |  |
| administration/encrypted-credentials | segment-untranslated | Running Tests with Encrypted Credentials > API Runs | ordered-list-item |  |  |  |
| administration/encrypted-credentials | segment-untranslated | Running Tests with Encrypted Credentials > API Runs | paragraph |  |  |  |
| administration/encrypted-credentials | segment-untranslated | Running Tests with Encrypted Credentials > API Runs | paragraph |  |  |  |
| administration/encrypted-credentials | segment-untranslated | Running Tests with Encrypted Credentials > API Runs | paragraph |  |  |  |
| administration/encrypted-credentials | segment-untranslated | Running Tests with Encrypted Credentials > CLI Runs | callout-body |  |  |  |
| administration/encrypted-credentials | segment-untranslated | Running Tests with Encrypted Credentials > CLI Runs | ordered-list-item |  |  |  |
| administration/encrypted-credentials | segment-untranslated | Running Tests with Encrypted Credentials > CLI Runs | paragraph |  |  |  |
| administration/encrypted-credentials | segment-untranslated | Running Tests with Encrypted Credentials > CLI Runs | paragraph |  |  |  |
| administration/encrypted-credentials | segment-untranslated | Running Tests with Encrypted Credentials > Scheduler Runs | paragraph |  |  |  |
| administration/encrypted-credentials | segment-untranslated | Running test with encrypted credentials summary | paragraph |  |  |  |
| administration/encrypted-credentials | segment-untranslated | Running test with encrypted credentials summary > Running tests with encrypted credentials in the Test Data | paragraph |  |  |  |
| administration/encrypted-credentials | segment-untranslated | Running test with encrypted credentials summary > Running tests with encrypted credentials in the Test Data | unordered-list-item |  |  |  |
| administration/encrypted-credentials | segment-untranslated | Running test with encrypted credentials summary > Running tests with encrypted credentials in the Test Data | unordered-list-item |  |  |  |
| administration/encrypted-credentials | segment-untranslated | Running test with encrypted credentials summary > Running tests with encrypted credentials in the Test Data | unordered-list-item |  |  |  |
| administration/encrypted-credentials | segment-untranslated | Using Encrypted Credentials in Tests | paragraph |  |  |  |
| administration/encrypted-credentials | segment-untranslated | Using Encrypted Credentials in Tests > Adding encrypted credentials to Config File | paragraph |  |  |  |
| administration/encrypted-credentials | segment-untranslated | Using Encrypted Credentials in Tests > Adding encrypted credentials to Config File > Encrypted credentials syntax | unordered-list-item |  |  |  |
| administration/encrypted-credentials | segment-untranslated | Using Encrypted Credentials in Tests > Adding encrypted credentials to Param File > Encrypted credentials syntax | unordered-list-item |  |  |  |
| administration/encrypted-credentials | segment-untranslated | Using Encrypted Credentials in Tests > Adding encrypted credentials to Param File > Making the Param File compatible with encrypted credentials | ordered-list-item |  |  |  |
| administration/encrypted-credentials | segment-untranslated | Using Encrypted Credentials in Tests > Adding encrypted credentials to Test Data | paragraph |  |  |  |
| administration/encrypted-credentials | segment-untranslated | Using Encrypted Credentials in Tests > Adding encrypted credentials to Test Data > Encrypted credentials syntax | unordered-list-item |  |  |  |
| administration/encrypted-credentials | segment-untranslated | Viewing Test Runs with Encrypted Credentials | paragraph |  |  |  |
| administration/project-and-user-management | segment-untranslated |  | paragraph |  |  |  |
| administration/project-and-user-management | segment-untranslated |  | unordered-list-item |  |  |  |
| administration/project-and-user-management | segment-untranslated | View Company Teammates > Changing/Adding Company Owner and Project Owners | ordered-list-item |  |  |  |
| administration/project-and-user-management | segment-untranslated | View Company Teammates > Remove Company Owner | ordered-list-item |  |  |  |
| administration/project-and-user-management | segment-untranslated | View Company Teammates > Removing Company Teammates | ordered-list-item |  |  |  |
| administration/project-settings | section-structure-mismatch | General Settings > Project Name |  |  |  |  |
| administration/project-settings | section-structure-mismatch | General Settings > Default Base URL |  |  |  |  |
| administration/project-settings | section-structure-mismatch | General Settings > Hidden Parameters |  |  |  |  |
| administration/project-settings | segment-missing | General Settings > Default Base URL | paragraph |  |  |  |
| administration/project-settings | segment-missing | General Settings > Hidden Parameters | paragraph |  |  |  |
| administration/project-settings | segment-missing | General Settings > Project Name | paragraph |  |  |  |
| administration/project-settings | segment-untranslated | General Settings > Allow auto-complete suggestions | ordered-list-item |  |  |  |
| administration/project-settings | segment-untranslated | General Settings > Default Base URL | ordered-list-item |  |  |  |
| administration/project-settings | segment-untranslated | General Settings > Default Base URL | ordered-list-item |  |  |  |
| administration/project-settings | segment-untranslated | General Settings > Default Test Configuration | ordered-list-item |  |  |  |
| administration/project-settings | segment-untranslated | General Settings > Hidden Parameters | ordered-list-item |  |  |  |

先頭 50 件のみ表示。全 1851 件は JSON を参照。

### artifactCandidates (0 件)

_該当なし_

### normalizerCandidates (1 件)

| slug | issueType | sectionPath | segmentKind | missingTokens | inconclusiveCategory | inconclusiveReason |
| --- | --- | --- | --- | --- | --- | --- |
| running-tests/scheduler | segment-token-gap | Creating a scheduled test run | unordered-list-item | https://help.testim.io/v2.0/docs/scheduler#integrating-scheduler-with-slack |  |  |

### intentionalDivergenceCandidates (0 件)

_該当なし_

### advisoryResidual (11 件)

| slug | issueType | sectionPath | segmentKind | missingTokens | inconclusiveCategory | inconclusiveReason |
| --- | --- | --- | --- | --- | --- | --- |
| advanced-editing/validations/add-network-validation | segment-inconclusive |  |  |  | tokenless-near-tie | Tokenless adjacent sections "Network Validation > Network Validation Examples > Validate all the image requests" and "Network Validation > Network Validation Examples > Validate a single request" cannot rule out a body swap (current=2.00, swap=2.00) |
| integrations/bug-tracker-settings/connecting-testim-to-jira | segment-inconclusive |  |  |  | heading-count-mismatch | Heading count mismatch: EN has 0 headings, JA has 2 |
| integrations/bug-tracker-settings/connecting-testim-to-slack | segment-inconclusive |  |  |  | heading-count-mismatch | Heading count mismatch: EN has 0 headings, JA has 2 |
| integrations/bug-tracker-settings/connecting-testim-to-trello | segment-inconclusive |  |  |  | heading-count-mismatch | Heading count mismatch: EN has 0 headings, JA has 2 |
| integrations/integrate-testim-to-your-ci/codeship-integration | segment-inconclusive |  |  |  | heading-count-mismatch | Heading count mismatch: EN has 2 headings, JA has 3 |
| integrations/sealights-integration | segment-inconclusive |  |  |  | heading-count-mismatch | Heading count mismatch: EN has 15 headings, JA has 8 |
| overview/changelog | segment-inconclusive |  |  |  | tokenless-near-tie | Tokenless adjacent sections "Archive > Exporting a Testim test as code for Playwright" and "Archive > Cloning tests" cannot rule out a body swap (current=2.81, swap=2.81) |
| running-tests/scheduler | segment-inconclusive |  |  |  | tokenless-near-tie | Tokenless adjacent sections "Modify your scheduled test suites > Activate or Pause" and "Modify your scheduled test suites > Edit" cannot rule out a body swap (current=1.34, swap=1.35) |
| running-tests/scheduler-mobile | segment-inconclusive |  |  |  | tokenless-near-tie | Tokenless adjacent sections "Modify your scheduled test suites > Activate or Pause" and "Modify your scheduled test suites > Edit" cannot rule out a body swap (current=1.34, swap=1.35) |
| salesforce-testing/changelog | segment-inconclusive |  |  |  | tokenless-near-tie | Tokenless adjacent sections "Switch between users with Login As step May 2023" and "Permission validation step May 2023" cannot rule out a body swap (current=1.18, swap=1.17) |
| test-management/revisions | segment-inconclusive |  |  |  | tokenless-near-tie | Tokenless adjacent sections "Accessing a previous revision" and "Reverting to a previous revision" cannot rule out a body swap (current=1.17, swap=1.17) |

## 3. summary counters

`parity-check-status.json` から転記 (未生成の場合 `n/a`)。

| counter | value |
| --- | --- |
| reportableActiveFiles | 0 |
| baselinedIssues | 1863 |
| advisoryQueueIssues | 6 |
| auditSignalIssues | 9 |

## 4. snapshotDiff

`snapshot-diff-status.json` から転記 (未生成の場合 `n/a`)。

| metric | value |
| --- | --- |
| changed | 0 |
| added | 0 |
| removed | 0 |
