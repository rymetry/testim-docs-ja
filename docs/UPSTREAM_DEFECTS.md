<!-- markdownlint-disable MD038 MD060 -->

# Upstream Defect Tracker

- **Status**: Active（2026-11-16 更新、有効な補正25件）
- **Owner**: Testim JA Docs parity subsystem
- **Related**: `scripts/python/src/testim_parity/_en_source_patches_data.json`, `docs/PARITY_GUIDE.md`

## Reserved IDs (proposal B', Codex Round-3 approved)

UD-NNN IDs are allocated **centrally** via updates to this table, not per-PR ad-hoc. Ad-hoc verbal reservation is banned to prevent semantic collisions like the PR C vs PR D concurrent UD-005 allocation.

| ID | Semantic family | Defect class | Status | Allocation PR |
| --- | --- | --- | --- | --- |
| UD-001 | Salesforce Verify list `-this` typo | `typo` | applied | (initial v1) |
| UD-002 | Salesforce Steps "Log out" href miswire | `href-miswire` | applied | (initial v1) |
| UD-003 | broken-table-row-as-paragraph (predefined-properties) | `madcap-artifact` | applied | 2026-04-20 登録 |
| UD-004 | legacy `help.testim.io` stale-reference (scheduler pages) | `stale-reference` | recovered / archived | 2026-04-25 整理 |
| UD-005 | hooks / parameters の旧参照と index リンク | `stale-reference` (A–D), `madcap-artifact` (E–F) | applied (A–D) / recovered / archived (E–F, absorbed by extractor) | 2026-04-18 登録 |
| UD-006 | Search limitations の `-variable` 誤記 | `typo` | applied | 2026-04-18 登録 |
| UD-007 | Random data の `step.This` 誤記 | `typo` | applied | 2026-04-18 登録 |
| UD-008 | Chrome マイク設定の CLI index 自己リンク | `madcap-artifact` | recovered / archived (absorbed by extractor) | 2026-04-18 登録 |
| UD-009 | `index.htm` self-link miswire in grid-management child pages | `href-miswire` | recovered / archived (absorbed by extractor) | M2 PR D |
| UD-010 | MadCap authoring-artifact family (ZWSP / escaped-detail fragment / broken-table-row variants) | `madcap-artifact` | applied (A) / recovered / archived (B–D, absorbed by HTML comparison path) | M2 UD-010 bundle (codeship broken h2 + parameters-for-groups broken step-5 + VSTS broken step-2/3 extension) |
| UD-012 | データ駆動テストのセクション相互参照 | `madcap-artifact` | applied | 2026-04-20 登録 |
| UD-013 | Hidden parameters の親ページへのリンク | `madcap-artifact` | recovered / archived (absorbed by extractor) | 2026-04-20 登録 |
| UD-014 | Auto grouping の親ページへのリンク | `madcap-artifact` | recovered / archived (absorbed by extractor) | 2026-04-20 登録 |
| UD-015 | Run hooks の ZWSP だけを含む空段落 | `madcap-artifact` | recovered / archived (absorbed by extractor) | 2026-04-20 登録 |
| UD-016 | Subscription plans の localhost トークンのマークアップ | `madcap-artifact` | recovered / archived (absorbed by HTML comparison path) | 2026-04-20 登録 |
| UD-017 | API assertion の段落内改行による余分な段落 | `madcap-artifact` | recovered / archived (absorbed by HTML comparison path) | 2026-04-20 登録 |
| UD-018 | SeaLights のリスト内 CLI コードスニペット | `madcap-artifact` | recovered / archived (absorbed by JA source-form edit) | 2026-04-20 登録 |
| UD-019 | Salesforce 記録手順の画像だけのリスト項目 | `madcap-artifact` | recovered / archived (absorbed by JA source-form edit) | 2026-04-20 登録 |
| UD-020 | Salesforce トラブルシューティングの画像だけのリスト項目 | `madcap-artifact` | recovered / archived (absorbed by JA source-form edit) | 2026-04-20 登録 |
| UD-021 | Validate download の壊れた PDF 表行 | `madcap-artifact` | recovered / archived (absorbed by HTML comparison path) | 2026-04-20 登録 |
| UD-022 | Jenkins Docker の末尾にある ZWSP 段落 | `madcap-artifact` | recovered / archived (absorbed by extractor) | 2026-04-20 登録 |
| UD-023 | Running tests overview の表セルにある壊れた画像マークアップ | `madcap-artifact` | applied | 2026-11-15 登録 |
| UD-024 | Agentic Test Automation for Salesforce の壊れた `index.htm/#/` リンク | `href-miswire` | applied | 2026-11-13 登録 |
| UD-025 | Local mobile test の補足アクションへの `index.htm#supported-mobile-actions` miswire | `href-miswire` | applied | 2026-11-13 登録 |
| UD-026 | TestRail ドメイン URL の placeholder の二重エスケープ | `madcap-artifact` | applied | 2026-11-15 登録 |
| UD-027 | Data-driven config file の空のコードスニペット | `madcap-artifact` | applied | 2026-11-15 登録 |

UD-011 に対応する有効なレジストリ項目はない。今回の確認では、この ID の割当・再利用は行わない。

### Allocation protocol

Adding a new UD-NNN:

1. Pick the **lowest available reserved slot** from the table above that matches the new defect's semantic family.
2. Update the `Status` column (`reserved` → `candidate` or `applied`) and `Allocation PR` column to the PR that claims the ID.
3. Add the detailed entry in the "Registry (active defects)" section below.
4. The `defectClass` enum value in `en_source_patches` registry must match the table's `Defect class` column.

### Rationale (why central reservation)

Prior to v2, PR C and PR D both attempted to allocate `UD-005` concurrently for different semantic classes (PR D: `grid-management` index.htm self-link, PR C: different slug). Codex Round-2 recommended centralizing allocation through this table to prevent repeat collisions and to keep `grep UD-NNN` on the codebase returning a semantically coherent class.

### Scope of B' (intentionally narrow)

Already-merged IDs (`UD-001`..`UD-004`) are **not renumbered**. Codex Round-3 explicitly flagged that renumbering `UD-004 → UD-009` would churn the patch registry, tracker, tests, and SYSTEM_SPEC without corresponding benefit. The table above simply **reserves future IDs** and establishes allocation protocol going forward.

## Purpose

MadCap Flare で生成された EN HTML snapshot に含まれる **broken upstream defect** を集中管理する。各 defect は:

1. `en_source_patches` registry (`scripts/python/src/testim_parity/_en_source_patches_data.json`) の `id` と 1:1 で対応する anchor を持つ
2. Tricentis への上流報告 status を記録する
3. Upstream 修正確認時の patch removal 条件 (SOP) を持つ

JA 翻訳は原文構造準拠を崩さないため、JA markdown 側で workaround を埋め込むことは禁止 (plan §1.1 / absolute principle 4)。broken-EN は必ず EN HTML boundary (`preprocess_en_html`) で slug-scope literal patch として処理する。

## Defect classes

`en_source_patches` の `defectClass` enum (4 種) に対応:

| Class | 意味 | 例 |
|---|---|---|
| `typo` | 単純な文字列タイポ / スペース欠落 | `-this` vs `- this` |
| `href-miswire` | リンクターゲットが別ページを指す | Log out → launchapp |
| `madcap-artifact` | MadCap authoring tool 由来の構造残骸 | escaped `&lt;details&gt;` fragment |
| `stale-reference` | 古いバージョンへの参照が残存 | 旧 UI label / 旧 URL slug |

## Registry (active defects)

### UD-001: `-this` typo in Salesforce Verify list item

- **Patch IDs**: `UD-001A-dash-this-typo-plain`, `UD-001B-dash-this-typo-strong`
- **Defect class**: `typo`
- **Added**: 2026-04-17
- **Review after**: 2026-10-17
- **Affected slugs** (5):
  - `salesforce-testing/salesforce-steps/sfdc-step-create` (variant A, plain-leading)
  - `salesforce-testing/salesforce-steps/sfdc-step-validate` (variant A)
  - `salesforce-testing/salesforce-steps/sfdc-step-edit` (variant B, strong-leading)
  - `salesforce-testing/salesforce-steps/sfdc-step-quickactions` (variant B)
  - `salesforce-testing/salesforce-steps/sfdc-step-relatedlistaction` (variant B)
- **Defect**: MadCap authoring typo in Verify list item intro:
  - Variant A (plain): `<p>Verify -this action verifies ...`
  - Variant B (strong): `<p><strong>Verify</strong> -this action verifies ...`
  - 本来は `Verify - this action verifies ...` と半角スペースが入るべき箇所
- **Fix applied**: `preprocess_en_html` 内で `-this action verifies` → `- this action verifies` に置換
- **Tricentis upstream report status**: _pending_ (担当: JA Docs subsystem, 報告 ticket TBD)
- **Removal SOP**: [共通の削除確認手順](#共通の削除確認手順)に従い、原文の目視確認、対象ページの parity、回帰テストの期待値、台帳のアーカイブ、レジストリ変更時のレビューを実施する。
  1. `snapshots/en/content/salesforce-testing/salesforce-steps/sfdc-step-{create,edit,quickactions,relatedlistaction,validate}.html` を再取得
  2. 5ページすべてで Verify リストの導入文に欠けていた空白が補われたことを確認する。plain と strong の両形式を個別に調べる。

### UD-002: Salesforce Steps "Log out" href miswire

- **Patch ID**: `UD-002-logout-href-miswire`
- **Defect class**: `href-miswire`
- **Added**: 2026-04-17
- **Review after**: 2026-10-17
- **Affected slugs** (1):
  - `salesforce-testing/salesforce-steps`
- **Defect**: parent index page の共通操作リスト "Log out" エントリのリンクターゲットが誤って `sfdc-step-launchapp.htm` を指している。本来は `sfdc-step-logout.htm` (別の子ページが正しく存在する)。
- **Fix applied**: `preprocess_en_html` 内で `<a href="sfdc-step-launchapp.htm">Log out</a>` → `<a href="sfdc-step-logout.htm">Log out</a>` に置換
- **JA side**: JA markdown は既に `sfdc-step-logout` への正しいリンクを保持 (UX 上正しい)。patch により EN/JA 両側で同じ `/docs/salesforce-testing/salesforce-steps/sfdc-step-logout` token が emit され、parity alignment 成立。
- **Tricentis upstream report status**: _pending_ (担当: JA Docs subsystem, 報告 ticket TBD)
- **Removal SOP**: [共通の削除確認手順](#共通の削除確認手順)に従い、原文の目視確認、対象ページの parity、回帰テストの期待値、台帳のアーカイブ、レジストリ変更時のレビューを実施する。
  1. `snapshots/en/content/salesforce-testing/salesforce-steps.html` を再取得
  2. Log out のリンクが正しい logout ページを指していることを確認する。古い launch-app リンクの文字列が消えただけでは回復と判断しない。

### UD-003: broken-table-row-as-paragraph in predefined-properties-in-config-file-hooks

- **Patch IDs**: `UD-003-predefined-properties-broken-global-parameters-row`
- **Defect class**: `madcap-artifact`
- **Added / review after**: 2026-04-20 / 2026-10-20
- **Affected slugs** (1):
  - `running-tests/configuration-file-run-hooks/predefined-properties-in-config-file-hooks`
- **Defect**: EN HTML 内に `<p>| globalParameters | | |</p>` という段落が存在する。著者は markdown-table row を意図して書いたが、MadCap が raw paragraph として出力したため、`|` 区切り文字を含む単なる散文として render されている。補正適用前は Turndown 通過後も同形の段落として JA 側と compare されるため、JA は byte-identical な literal mirror で fingerprint を一致させる暫定対処を採っていた。
- **Fix applied**: 以前の候補案のうち Option A（HTML 境界で空の壊れた行を削除し、JA の対応行も削除する方式）が実装済み。`en_source_patches` は登録済みであり、「未適用」という旧記述を訂正した。
- **検討履歴**: 当初は Option A の削除と、Option B の markdown-table 形式への正規化による header / body の復元を検討していた。現在の実装は Option A。
- **Status**: `applied`。2026-10-23 に取得した公式 HTML にも対象の欠陥が残っている。
- **Tricentis upstream report status**: _pending_ (担当: JA Docs subsystem, 報告 ticket TBD)。チケット参照の記録なし。
- **Removal SOP**: [共通の削除確認手順](#共通の削除確認手順)に従う。
  1. `snapshots/en/content/running-tests/configuration-file-run-hooks/predefined-properties-in-config-file-hooks.html` を再取得
  2. 上流で当該行が実際に削除または修復されたことを確認する。文字列が一致しないだけでは回復と判断しない。

### UD-004: legacy `help.testim.io` vs modern path mismatch in scheduler pages

- **Patch IDs**: `UD-004A-scheduler-high-speed-mode`, `UD-004C-scheduler-slack-integration-anchor` (archived)
- **Defect class**: `stale-reference`
- **Added**: 2026-04-18
- **Rescoped**: 2026-04-18 (PR #337 rework — URL-localization takes precedence over raw mirror)
- **Applied**: 2026-04-18 (Category B PR — UD-004A + UD-004C promoted from candidate to applied; UD-004B retired as N/A)
- **Recovered/archived**: 2026-04-25 (Issue #368 completion cleanup)
- **Review after**: 2026-10-18
- **Affected slugs** (2):
  - `running-tests/scheduler` (UD-004A + UD-004C)
  - `running-tests/scheduler-mobile` (UD-004C only)
- **Defect**: EN HTML 内のリンクが legacy domain `https://help.testim.io/...` を指しているが、該当コンテンツは `docs.tricentis.com/testim` の modern canonical URL (例: `/docs/testops/turbo-mode` 等) に移行済み。さらに `high-speed-mode` → `turbo-mode` の feature rename も絡む。観測された legacy URL と modern canonical の対応:
  - EN `https://help.testim.io/docs/high-speed-mode` ↔ modern `/docs/testops/turbo-mode` (feature rename: high-speed → turbo)
  - EN `https://help.testim.io/v2.0/docs/scheduler#integrating-scheduler-with-slack` ↔ modern `/docs/running-tests/scheduler#スケジューラーを-slack-と統合する` (JA-local anchor per WRITING_GUIDE §91-109)
- **JA side**: JA markdown は WRITING_GUIDE §91-109 (path-based `/docs/{folder}/{slug}`) および §192 (URL-localization `help.testim.io/docs/X` ↔ `/docs/X` を唯一の許容差分として列挙) に従い modern canonical / JA-local anchor を保持する。これは raw-mirror rationale より優先される (JA 独自構造の追加ではなく、§192 の明示的許容)。
- **Fix applied**:
  - `UD-004A-scheduler-high-speed-mode`: `<a href="https://help.testim.io/docs/high-speed-mode">Turbo mode</a>` → `<a href="../testops/turbo-mode.htm">Turbo mode</a>` (scheduler のみ — scheduler-mobile に high-speed-mode 参照なし)
  - `UD-004C-scheduler-slack-integration-anchor`: `<a href="https://help.testim.io/v2.0/docs/scheduler#integrating-scheduler-with-slack">below</a>` → `<a href="scheduler.htm#integrating-scheduler-with-slack">below</a>` (scheduler + scheduler-mobile 両方に適用)
  - `UD-004B`: **N/A retired** — scheduler-mobile には high-speed-mode legacy URL 参照が存在しないため、当初 plan 時の推測上の patch は不要 (EN HTML grep で確認済)
  - 当初の補正適用時の結果（2026-04-25 の recovery cleanup より前の履歴）: baseline から URL token mismatch 由来の segment-extra/missing pair が消滅 (scheduler 5→1, scheduler-mobile 3→1 / 残 1 件ずつは segment-inconclusive tokenless-near-tie = P2-5 対象)
- **Status**: `recovered / archived` — live and refreshed local snapshots no longer contain either legacy `help.testim.io` pattern; entries removed from `_en_source_patches_data.json`.
- **Tricentis upstream report status**: _pending_ (担当: JA Docs subsystem, 報告 ticket TBD)
- **Removal SOP** (after upstream fix confirmed):
  1. `snapshots/en/content/running-tests/scheduler.html` と `scheduler-mobile.html` を再取得済み
  2. `grep 'help.testim.io'` が 0 hit であることを確認済み
  3. `scripts/python/src/testim_parity/_en_source_patches_data.json` から UD-004A / UD-004C entry を削除済み
  4. baseline 新規 entry 追加なし。`npm run check:parity -- --json` で 5-counter 0 を確認する

### UD-005: legacy `help.testim.io/docs/<basename>` display-text / `index.htm` self-link in hooks & parameters pages

- **Patch IDs**: `UD-005A-hooks-config-file-legacy-display-text`, `UD-005B-hooks-config-file-parameters-legacy-display-text`, `UD-005C-parameters-loops-legacy-display-text`, `UD-005D-parameter-override-rules-exports-doc-prefix`, `UD-005E-parameter-override-rules-params-file-index-preface`, `UD-005F-parameter-override-rules-params-file-index-listitem`
- **Defect class**: `stale-reference` (A/B/C/D), `madcap-artifact` (E/F)
- **Added**: 2026-04-18
- **Review after**: 2026-10-18
- **Affected slugs** (3):
  - `advanced-editing/hooks` (A + B)
  - `advanced-editing/parameters` (C)
  - `advanced-editing/parameters/parameter-override-rules` (D + E + F)
- **Defect**: Two related families of broken upstream EN markup that emit stale invariant tokens:
  1. **Legacy display-text** (A/B/C): `<a href="...correct.htm">https://help.testim.io/docs/<basename></a>` — href target uses the modern category path (correct), but the display-text URL is a legacy pre-category-reorg flat path `help.testim.io/docs/<basename>` which normalizes to `/docs/<basename>` and emits a stale invariant token. JA (following WRITING_GUIDE §91-109) uses only the canonical `/docs/<category>/<basename>` path, so EN's stale token is reported as missing from JA.
  2. **Malformed `doc:` prefix + legacy flat path** (D): `<a href="doc:https://help.testim.io/docs/exports-parameters">...` has a stray `doc:` prefix (MadCap authoring artifact) plus a legacy flat path. Rewritten to the correct relative `exports-parameters.htm` sibling.
  3. **Bare `index.htm` self-link** (E/F): `<a href="index.htm">...` in the Parameter override rules page references the parent Parameters category index. The parity extractor `normalizeUrlToken` treats `index.htm` as slug `index` (no such doc), emitting a bogus `/docs/index` token. Rewritten to `../parameters/index.htm` so normalizeUrlToken resolves to `/docs/advanced-editing/parameters`.
- **Fix applied**:
  - UD-005A: `"...configuration-file-run-hooks/index.htm">https://help.testim.io/docs/configuration-file-run-hooks</a>"` → display-text rewritten to `https://help.testim.io/docs/running-tests/configuration-file-run-hooks`
  - UD-005B: analogous fix for `configuration-file-parameters` display-text in the same paragraph (fragment stripped — `normalizeUrlForParity` retains fragments on `https://...#frag` URLs whereas `extractInvariantTokens` strips them on `/docs/...` paths, so preserving the fragment would introduce an asymmetric token that JA — which has the fragment-stripped href-derived form — would not match)
  - UD-005C: analogous fix for `loops` display-text on `advanced-editing/parameters` (fragment stripped, same rationale as UD-005B)
  - UD-005D: `doc:https://help.testim.io/docs/exports-parameters` → `exports-parameters.htm` (sibling path)
  - UD-005E (archived: absorbed by extractor): `and the <a href="index.htm">Params file</a>` → `and the <a href="../parameters/index.htm">Params file</a>` (preamble-disambiguated in preface paragraph)
  - UD-005F (archived: absorbed by extractor): `<a href="index.htm">params-file's parameters</a>` → `<a href="../parameters/index.htm">params-file's parameters</a>` (disambiguated by display text in list item)
- **JA side**: JA was already using the canonical `/docs/<category>/<basename>` and `/docs/advanced-editing/parameters` paths per WRITING_GUIDE §91-109. For the (now archived) UD-005F case the JA list-item link `/docs/advanced-editing/parameters/json-parameters-file-parameters` was corrected to `/docs/advanced-editing/parameters` to match the EN `index.htm` self-reference semantics (a JA content fix made while that patch existed; it is no longer tied to an active patch).
- **E/F の状態**: `recovered / archived`。理由: absorbed by extractor（`preprocess_en_html` の bare `index.htm` 書き換え規則が親カテゴリ index に解決するため、E/F の補正はレジストリから削除済み）。A–D は active。
- **Tricentis upstream report status**: _pending_ (担当: JA Docs subsystem, 報告 ticket TBD)
- **Removal SOP**: [共通の削除確認手順](#共通の削除確認手順)に従い、原文の目視確認、対象ページの parity、回帰テストの期待値、台帳のアーカイブ、レジストリ変更時のレビューを実施する。
  1. `snapshots/en/content/advanced-editing/hooks.html`, `.../parameters.html`, `.../parameters/parameter-override-rules.html` を再取得
  2. A–F の各補正について表示テキストとリンク先を確認し、補正・ページ単位で回復を判断する。無関係な旧 URL や index リンクの有無だけで一括削除しない。

### UD-006: `-variable` typo in editing-tests/search-within-a-test Search limitations list

- **Patch ID**: `UD-006-search-within-a-test-email-variable-typo`
- **Defect class**: `typo`
- **Added**: 2026-04-18
- **Review after**: 2026-10-18
- **Affected slugs** (1):
  - `editing-tests/search-within-a-test`
- **Defect**: MadCap authoring typo in the Search limitations list item `"Generate email address -variable name"` — missing space between `-` and `variable`. Adjacent list items use the correct `- variable name` form (e.g. `"Extract value - variable name"`, `"Get cookie - cookie name & variable name"`). The parity extractor flag regex emits a spurious `-variable` token because of the absent leading whitespace; JA (which uses the em-dash form `"— 変数名"`) has no corresponding token.
- **Fix applied**: `<p>Generate email address -variable name</p>` → `<p>Generate email address - variable name</p>`
- **Tricentis upstream report status**: _pending_ (担当: JA Docs subsystem, 報告 ticket TBD)
- **Removal SOP**: [共通の削除確認手順](#共通の削除確認手順)に従い、原文の目視確認、対象ページの parity、回帰テストの期待値、台帳のアーカイブ、レジストリ変更時のレビューを実施する。
  1. `snapshots/en/content/editing-tests/search-within-a-test.html` を再取得
  2. variable の前に欠けていた空白が修復され、誤ったフラグトークンが生じないことを確認する。

### UD-007: `step.This` typo in guides/generate-random-data-with-js

- **Patch ID**: `UD-007-generate-random-data-step-this-typo`
- **Defect class**: `typo`
- **Added**: 2026-04-18
- **Review after**: 2026-10-18
- **Affected slugs** (1):
  - `guides/generate-random-data-with-js`
- **Defect**: MadCap authoring typo — missing space after period in `"to your JS step.This will create the variable..."` in the "How to assign Random Data to a step?" list item. The parity extractor dotted-path regex emits a spurious `step.This` dotted-path token because of the absent space; JA uses a natural Japanese sentence break and has no corresponding token.
- **Fix applied**: `to your JS step.This will create` → `to your JS step. This will create`
- **Tricentis upstream report status**: _pending_ (担当: JA Docs subsystem, 報告 ticket TBD)
- **Removal SOP**: [共通の削除確認手順](#共通の削除確認手順)に従い、原文の目視確認、対象ページの parity、回帰テストの期待値、台帳のアーカイブ、レジストリ変更時のレビューを実施する。
  1. `snapshots/en/content/guides/generate-random-data-with-js.html` を再取得
  2. step と This の文境界が修復され、両方の文が保持されていることを確認する。

### UD-008: Chrome マイク設定の CLI index 自己リンク

- **補正 ID**: `UD-008-allow-chrome-microphone-cli-index-self-link`
- **欠陥分類**: `madcap-artifact`
- **登録日 / 確認期限**: 2026-04-18 / 2026-10-18
- **対象 slug**:
  - `running-tests/the-command-line-cli/allow-chrome-browser-to-use-microphone`
- **欠陥 / 補正内容**: 単独の `<a href="index.htm">CLI command</a>` が親 CLI カテゴリ index を指す。補正では `../the-command-line-cli/index.htm` を指定していた。
- **JA 側の履歴**: 登録当時、JA の冒頭段落には CLI command への導入文が欠けていたため、補正と同時に復元した（現在の JA は復元済み）。
- **状態**: `recovered / archived`。理由: absorbed by extractor（`preprocess_en_html` の bare `index.htm` 書き換え規則が親カテゴリ index に解決するため、補正はレジストリから削除済み）。
- **Tricentis への報告状況**: _pending_。チケット参照の記録なし。
- **削除手順**: 不要（抽出器が吸収したため削除済み）。

### UD-009: grid-management 子ページの `index.htm` リンク

- **補正 ID**: `UD-009-grid-management-index-self-link`（削除済み）
- **欠陥分類**: `href-miswire`
- **登録日 / 確認期限**: 2026-04-18 / 2026-10-18
- **対象 slug**:
  - `integrations/grid-management/browserstack-integration`
  - `integrations/grid-management/lambdatest-integration`
  - `integrations/grid-management/custom-grid`
  - `integrations/grid-management/headspin-integration`
  - `integrations/grid-management/saucelabs-integration`
- **欠陥 / 補正内容**: 5つの子ページの「Adding a grid」リンクが `<a href="index.htm#adding-a-grid">` を使用している。この `index.htm` は同じフォルダの `integrations/grid-management/index.htm`、つまり Grid management のカテゴリページ（`docs/SIDEBAR_URLS.md` 参照）で、`adding-a-grid` アンカーは親スナップショット `integrations/grid-management.html` に存在する。上流の誤配線ではなく、チェッカーが basename だけでリンクを解決していたために `/docs/index` と読んでいた。以前の「存在しない index.htm」という説明は誤りだった。
- **状態**: `recovered / archived`。理由: absorbed by extractor（`preprocess_en_html` の bare `index.htm` 書き換え規則が `../grid-management/index.htm#adding-a-grid` に解決し、JA の `/docs/integrations/grid-management#adding-a-grid` と同じ token になるため、補正はレジストリから削除済み。2026-11-13 に補正を外して `npm run check:parity` が 0 件であることを確認）。
- **JA 側**: JA は WRITING_GUIDE §192 に従い `/docs/integrations/grid-management#adding-a-grid` を維持している。
- **Tricentis への報告状況**: 不要（上流の欠陥ではない）。
- **削除手順**: 不要（抽出器が吸収したため削除済み）。

### UD-010: MadCap authoring-artifact family (ZWSP + literal-markdown-prefix-in-paragraph)

- **Patch IDs**: `UD-010A-codeship-broken-h2-paragraph`（有効）。`UD-010B`, `UD-010C`, `UD-010D` は削除済み（下記の archive 注記）
- **Defect class**: `madcap-artifact`
- **Added**: 2026-04-20
- **Applied**: 2026-04-20 (M2 UD-010 bundle)
- **Review after**: 2026-10-20
- **Affected slugs** (1):
  - `integrations/integrate-testim-to-your-ci/codeship-integration` (UD-010A)
- **Defect**: MadCap Flare が structural element (`<h2>` heading, `<li value="N">` ordered-list-item) を誤って `<p>` 要素にシリアライズし、テキスト内容の先頭に zero-width space (U+200B) + markdown-style prefix (`## ` for heading / `N. ` for step number) を残す authoring-artifact。
  - **UD-010A (codeship)**: 3 番目の section heading "Run with external Selenium Grid" が `<p>\u200b## Run with external Selenium Grid<br /> When your app...</p>` という単一の `<p>` に融合。同ページの他 2 つの h2 ("Project configuration" / "Run with local Selenium Grid") は正しく `<h2><a name="..."></a>Heading</h2>` 形状を取っているため、第 3 heading のみが MadCap 側の authoring defect。補正なしでは EN の見出し数が 2、JA が 3 になり `heading-count-mismatch` を報告する。
- **JA side**: JA は既に正規構造 (h2 3 つ)。UD-010A 適用により EN 側に出現する `webdriver-manager` plain-text token が JA paragraph 「Selenium Server (webdriver-manager)」で residue word count を 3 に到達させ `segment-untranslated` を副次的に発火するため、`docs/GLOSSARY.md` Tier A 外部製品 / 第三者ツール に `webdriver-manager` (npm パッケージ名, Selenium WebDriver バイナリ取得 CLI) を追加する (一般的な CLI tool name retention policy 準拠)。
- **Fix applied**:
  - `UD-010A-codeship-broken-h2-paragraph`: broken `<p>\u200b## ...<br /> body...</p>` → `<h2><a name="run-with-external-selenium-grid"></a>Run with external Selenium Grid</h2><p>body...</p>`。sibling h2 と同じ `<a name="...">` anchor 形式を踏襲。
  - GLOSSARY Tier A 追加: `webdriver-manager`。
- **Status**: `applied`（UD-010A）
- **Archived (UD-010B / UD-010C / UD-010D)**: `recovered / archived`。理由: absorbed by HTML comparison path（旧経路は EN を Markdown 化して行頭の `N. ` を手順として数えていたため、孤立した `<p>\u200bN. ...</p>` が手順に算入された。現在の経路は `<li>` 要素を数えるため誤読が起きず、補正はレジストリから削除済み）。上流の欠陥自体はライブページに残っており、孤立した段落は今も「5. 」などの文字列を表示する。JA は EN の構造に従い、該当箇所を手順の外の通常段落として置いている。
  - `parameters-for-groups`: step 4 と step 5 の `<li>` の間にある孤立した `<p>5. Enter a value in the field below...</p>`（旧 UD-010B）。JA は同じ位置に通常段落を持つ。
  - `vsts-and-tfs-integration`: `<li value="1">` の後に画像と交互に並ぶ孤立した `<p>2. Create a new build</p>` / `<p>3. Select your repository</p>`（旧 UD-010C / UD-010D）。JA は同じ位置に `N. ` なしの通常段落を持つ。
- **Tricentis upstream report status**: _pending_ (担当: JA Docs subsystem, 報告 ticket TBD — MadCap authoring tool での heading/step-item シリアライゼーション bug、同種 pattern が他ページにも潜在する可能性あり)
- **Removal SOP**: [共通の削除確認手順](#共通の削除確認手順)に従い、原文の目視確認、対象ページの parity、回帰テストの期待値、台帳のアーカイブ、レジストリ変更時のレビューを実施する。
  1. `codeship-integration` の EN HTML snapshot を再取得
  2. 見出し・段落の修正内容を確認する。
  3. `docs/GLOSSARY.md` から `webdriver-manager` entry を保持するか否か判断 (upstream 修正と独立した policy decision)

### UD-012: データ駆動テストのセクション相互参照

- **補正 ID**: `UD-012-ddt-visual-editor-index-section-cross-ref`
- **欠陥分類**: `madcap-artifact`
- **登録日 / 確認期限**: 2026-04-20 / 2026-10-20
- **対象 slug**:
  - `advanced-editing/data-driven-testing/configuring-a-data-driven-test-from-the-visual-editor`
- **欠陥 / 補正内容**: Visual Editor ページの外部データ参照先が旧 index.htm のフラグメントを指している。補正では configuring-data-driven-tests-using-data-from-an-external-source.htm を参照先にする。
- **状態**: `applied`。2026-10-23 に取得した公式 HTML で、対象範囲の全補正が引き続き一致する。
- **Tricentis への報告状況**: _pending_。チケット参照の記録なし。
- **削除手順**: [共通の削除確認手順](#共通の削除確認手順)に従い、本文・トークン・リンク・画像を保持したまま上流の修正を確認する。

### UD-013: Hidden parameters の親ページへのリンク

- **補正 ID**: `UD-013-hidden-parameters-index-parent-link`
- **欠陥分類**: `madcap-artifact`
- **登録日 / 確認期限**: 2026-04-20 / 2026-10-20
- **対象 slug**:
  - `advanced-editing/parameters/hidden-parameters`
- **欠陥 / 補正内容**: parameters リンクが単独の index.htm を使用している。補正では ../parameters/index.htm を指定し、意図した親 Parameters ページに解決する。
- **状態**: `recovered / archived`。理由: absorbed by extractor（`preprocess_en_html` の bare `index.htm` 書き換え規則が親カテゴリ index に解決するため、補正はレジストリから削除済み）。
- **Tricentis への報告状況**: _pending_。チケット参照の記録なし。
- **削除手順**: 不要（抽出器が吸収したため削除済み）。

### UD-014: Auto grouping の親ページへのリンク

- **補正 ID**: `UD-014-auto-grouping-index-parent-link`
- **欠陥分類**: `madcap-artifact`
- **登録日 / 確認期限**: 2026-04-20 / 2026-10-20
- **対象 slug**:
  - `editing-tests/groups/auto-grouping`
- **欠陥 / 補正内容**: Group リンクが単独の index.htm を使用している。補正では ../groups/index.htm を指定し、意図した親 Groups ページに解決する。
- **状態**: `recovered / archived`。理由: absorbed by extractor（`preprocess_en_html` の bare `index.htm` 書き換え規則が親カテゴリ index に解決するため、補正はレジストリから削除済み）。
- **Tricentis への報告状況**: _pending_。チケット参照の記録なし。
- **削除手順**: 不要（抽出器が吸収したため削除済み）。

### UD-015: Run hooks の ZWSP だけを含む空段落

- **補正 ID**: `UD-015-config-file-run-hooks-empty-zwsp-paragraph`
- **欠陥分類**: `madcap-artifact`
- **登録日 / 確認期限**: 2026-04-20 / 2026-10-20
- **対象 slug**:
  - `running-tests/configuration-file-run-hooks`
- **欠陥 / 補正内容**: grid-name の callout の後に U+200B だけを含む空段落がある。補正では、この編集時の残骸を削除する。
- **状態**: `recovered / archived`。理由: absorbed by extractor（`extract_segments_from_html` が空段落を無視するため、補正はレジストリから削除済み）。
- **Tricentis への報告状況**: _pending_。チケット参照の記録なし。
- **削除手順**: 不要（抽出器が吸収したため削除済み）。

### UD-016: Subscription plans の localhost トークンのマークアップ

- **補正 ID**: `UD-016A-subscription-plans-host-localhost-cli-span`, `UD-016B-subscription-plans-host-localhost-grid-span`
- **欠陥分類**: `madcap-artifact`
- **登録日 / 確認期限**: 2026-04-20 / 2026-10-20
- **対象 slug**:
  - `administration/subscription-plans`
- **欠陥 / 補正内容**: 2つの表セルで host=localhost/127.0.0.1 が FileOrFilePath の span に囲まれている。補正では code マークアップを使い、URL に似た文字列をリテラルトークンとして保持する。CLI と Grid のセルは CRLF を含む前後の文脈で区別する。
- **状態**: `recovered / archived`。理由: absorbed by HTML comparison path（DOM 構造比較 `compare_html_structure` が表セル内の `span.FileOrFilePath` を `<code>` と同じく扱い、セグメント比較も描画済み HTML 同士で行うため、補正はレジストリから削除済み）。JA の変更なし。
- **Tricentis への報告状況**: _pending_。チケット参照の記録なし。
- **削除手順**: 不要（HTML 比較経路が吸収したため削除済み）。

### UD-017: API assertion の段落内改行による余分な段落

- **補正 ID**: `UD-017-api-testing-assertion-br-br-paragraph-inflation`
- **欠陥分類**: `madcap-artifact`
- **登録日 / 確認期限**: 2026-04-20 / 2026-10-20
- **対象 slug**:
  - `advanced-editing/api-testing`
- **欠陥 / 補正内容**: assertion の1段落内にある二重の br が、Markdown 抽出時に余分な段落を生む。補正では本文をすべて保持し、余分な表示上の改行を取り除く。
- **状態**: `recovered / archived`。理由: absorbed by HTML comparison path（EN の二重 `<br />` は 1 つの `<p>` 内に留まり、描画済み JA と DOM 上で比較されるため、補正はレジストリから削除済み）。EN は連続する 2 つの `<br />`、JA は同じ段落内の同じ位置（`設定手順:` の前）に行末 `\` の hard break 1 つを置いており、同一ではないが、段落を分けずに改行位置を保っている。
- **Tricentis への報告状況**: _pending_。チケット参照の記録なし。
- **削除手順**: 不要（HTML 比較経路が吸収したため削除済み）。

### UD-018: SeaLights のリスト内 CLI コードスニペット

- **補正 ID**: `UD-018A-sealights-build-session-id-list-wrapped-codesnippet`, `UD-018B-sealights-lab-id-list-wrapped-codesnippet`, `UD-018C-sealights-test-stage-list-wrapped-codesnippet`
- **欠陥分類**: `madcap-artifact`
- **登録日 / 確認期限**: 2026-04-20 / 2026-10-20
- **対象 slug**:
  - `integrations/sealights-integration`
- **欠陥 / 補正内容**: 単一フラグのリスト項目3つが codeSnippet の全体構造を使用している。補正では各フラグをインラインコードのリスト項目として保持し、リストとセグメントの件数を整合させる。
- **状態**: `recovered / archived`。理由: absorbed by JA source-form edit（JA の 3 か所をインラインコードの箇条書きから、リスト項目内のフェンス付きコードブロックに変更し、EN の `<li>` 内 codeSnippet と同じ構造にしたため、補正はレジストリから削除済み）。
- **Tricentis への報告状況**: _pending_。チケット参照の記録なし。
- **削除手順**: 不要（JA の構造修正で吸収したため削除済み）。

### UD-019: Salesforce 記録手順の画像だけのリスト項目

- **補正 ID**: `UD-019-create-salesforce-test-image-only-li-inflates-step-count`
- **欠陥分類**: `madcap-artifact`
- **登録日 / 確認期限**: 2026-04-20 / 2026-10-20
- **対象 slug**:
  - `salesforce-testing/create-a-salesforce-test`
- **欠陥 / 補正内容**: 記録手順の step 5 はログイン後のスクリーンショットだけを含む。補正では画像を消さずにリスト項目の外へ移し、前後の独立したスクリーンショットと同じ構造にする。
- **状態**: `recovered / archived`。理由: absorbed by JA source-form edit（JA のスクリーンショット行を EN の画像だけの `<li value="5">` に合わせて手順 5 とし、後続を 6・7 に振り直したため、補正はレジストリから削除済み）。
- **Tricentis への報告状況**: _pending_。チケット参照の記録なし。
- **削除手順**: 不要（JA の構造修正で吸収したため削除済み）。

### UD-020: Salesforce トラブルシューティングの画像だけのリスト項目

- **補正 ID**: `UD-020-troubleshoot-grid-image-only-li-inflates-bullet-count`
- **欠陥分類**: `madcap-artifact`
- **登録日 / 確認期限**: 2026-04-20 / 2026-10-20
- **対象 slug**:
  - `salesforce-testing/troubleshoot`
- **欠陥 / 補正内容**: Grid のトラブルシューティング一覧にスクリーンショットだけの項目がある。補正では画像をリスト直後の段落に保持する。
- **状態**: `recovered / archived`。理由: absorbed by JA source-form edit（JA の画像を EN の画像だけの `<li>` に合わせて箇条書き項目にしたため、補正はレジストリから削除済み）。
- **Tricentis への報告状況**: _pending_。チケット参照の記録なし。
- **削除手順**: 不要（JA の構造修正で吸収したため削除済み）。

### UD-021: Validate download の壊れた PDF 表行

- **補正 ID**: `UD-021-validate-download-pdf-broken-row-as-code`
- **欠陥分類**: `madcap-artifact`
- **登録日 / 確認期限**: 2026-04-20 / 2026-10-20
- **対象 slug**:
  - `advanced-editing/validations/validate-download`
- **欠陥 / 補正内容**: expectedText の PDF 例の行が、表の後にパイプ区切りの未整形段落 `<p>|…|</p>` として残っている。
- **状態**: `recovered / archived`。理由: absorbed by HTML comparison path（旧経路は EN を Markdown 化する際に、この段落を直前の表へ融合させていた。現在の経路は `<table>` 要素と `<p>` 要素を別々に数えるため融合が起きず、補正はレジストリから削除済み）。上流の欠陥自体はライブページに残っている。JA は EN と同じ構造（2 行の表と、その後のインラインコードの段落）を持つ。
- **Tricentis への報告状況**: _pending_。チケット参照の記録なし。
- **削除手順**: 不要（HTML 比較経路が吸収したため削除済み）。

### UD-022: Jenkins Docker の末尾にある ZWSP 段落

- **補正 ID**: `UD-022-jenkins-docker-trailing-zwsp-paragraph`
- **欠陥分類**: `madcap-artifact`
- **登録日 / 確認期限**: 2026-04-20 / 2026-10-20
- **対象 slug**:
  - `integrations/integrate-testim-to-your-ci/jenkins-integration-using-docker`
- **欠陥 / 補正内容**: 末尾の段落は U+200B 2文字と空白1文字を含む。補正では、この本文ではない編集時の残骸を削除する。
- **状態**: `recovered / archived`。理由: absorbed by extractor（`extract_segments_from_html` が空段落を無視するため、補正はレジストリから削除済み）。
- **Tricentis への報告状況**: _pending_。チケット参照の記録なし。
- **削除手順**: 不要（抽出器が吸収したため削除済み）。

### UD-023: Running tests overview の表セルにある壊れた画像マークアップ

- **補正 ID**: `UD-023-running-tests-overview-broken-image-anchor-<画像名>` の 9 件（`obwoaogsvcsoy09mlx2q`, `xqzcvrixxh7klhttxcvv`, `zkherwmreutdvdcaxxmw`, `tasdwyoeqgku3dgbb4yl`, `etuuumjl8mnaf6yi8swg`, `aliqt4hzl7exfzihlyhr`, `butca7hm2m9ynmildilk`, `jjslea2li1v9c3dfg9yn`, `tt27za73qdynpxbl58o8`）
- **欠陥分類**: `madcap-artifact`
- **登録日 / 確認期限**: 2026-11-15 / 2027-05-15
- **対象 slug**:
  - `running-tests/running-tests-overview`
- **欠陥 / 補正内容**: 「How are test runs counted towards a Test Runs model plan」表の 9 セルで、Markdown の画像記法が `!<a href="URL">alt</a>` に変換されており、公式ページでは画像ではなく「!test」などの文字列が表示される。補正では各セルを `<img src="URL" alt="alt" />` に戻す（URL ごとに 1 件、9 件の URL はすべて異なる）。
- **JA 側**: JA は既に各セルに `![alt](URL)` の画像を持つ。
- **状態**: `applied`。
- **Tricentis への報告状況**: _pending_。チケット参照の記録なし。
- **削除手順**: [共通の削除確認手順](#共通の削除確認手順)に従い、本文・トークン・リンク・画像を保持したまま上流の修正を確認する。

### UD-024: Agentic Test Automation for Salesforce の壊れた `index.htm/#/` リンク

- **補正 ID**: `UD-024-agentic-salesforce-manual-steps-malformed-index-link`
- **欠陥分類**: `href-miswire`
- **登録日 / 確認期限**: 2026-11-13 / 2027-05-13
- **対象 slug**:
  - `salesforce-testing/create-a-salesforce-test/use-agentic-test-automation-for-salesforce`
- **欠陥 / 補正内容**: 「manually adding or recording steps」のリンクが `index.htm/#/` という壊れた href を持つ。補正では `index.htm` に直し、後段の bare `index.htm` 書き換え規則が親カテゴリ index に解決する。
- **状態**: `applied`。
- **Tricentis への報告状況**: _pending_。チケット参照の記録なし。
- **削除手順**: [共通の削除確認手順](#共通の削除確認手順)に従い、本文・トークン・リンク・画像を保持したまま上流の修正を確認する。

### UD-025: Local mobile test のページ内リンクが親ページを指す miswire

- **補正 ID**: `UD-025-local-mobile-test-supported-actions-index-miswire`
- **欠陥分類**: `href-miswire`
- **登録日 / 確認期限**: 2026-11-13 / 2027-05-13
- **対象 slug**:
  - `recording-tests/recording-a-mobile-test/recording-a-local-mobile-test`
- **欠陥 / 補正内容**: 手順 8 の「Supported Mobile Actions」リンクが `index.htm#supported-mobile-actions` で親カテゴリページに解決されるが、該当セクションはこのページ自身にある (親ページに anchor なし)。補正では `#supported-mobile-actions` のページ内リンクにする。
- **JA 側**: JA は既にページ内リンク `#サポートされているモバイルアクション` を保持している。
- **状態**: `applied`。
- **Tricentis への報告状況**: _pending_。チケット参照の記録なし。
- **削除手順**: [共通の削除確認手順](#共通の削除確認手順)に従い、本文・トークン・リンク・画像を保持したまま上流の修正を確認する。

### UD-026: TestRail ドメイン URL の placeholder の二重エスケープ

- **補正 ID**: `UD-026-testrail-domain-placeholder-double-escaped`
- **欠陥分類**: `madcap-artifact`
- **登録日 / 確認期限**: 2026-11-15 / 2027-05-15
- **対象 slug**:
  - `integrations/test-management-integrations/testrail-integration`
- **欠陥 / 補正内容**: 「Setting TestRail integration」手順 3 の URL 構造 `https://&amp;lt;projectName&amp;gt;.testrail.io/` が二重にエスケープされており、公式ページでは `&lt;projectName&gt;` がそのまま表示される。補正ではエスケープを 1 段にして `https://<projectName>.testrail.io/` と読めるようにする。
- **JA 側**: JA は `https://&lt;projectName&gt;.testrail.io/` と書き、`<projectName>` と正しく表示される（変更なし）。
- **状態**: `applied`。
- **Tricentis への報告状況**: _pending_。チケット参照の記録なし。
- **削除手順**: [共通の削除確認手順](#共通の削除確認手順)に従い、本文・トークン・リンク・画像を保持したまま上流の修正を確認する。

### UD-027: Data-driven config file の空のコードスニペット

- **補正 ID**: `UD-027-config-file-empty-code-snippet`
- **欠陥分類**: `madcap-artifact`
- **登録日 / 確認期限**: 2026-11-15 / 2027-05-15
- **対象 slug**:
  - `advanced-editing/data-driven-testing/configuring-data-driven-tests-using-the-config-file`
- **欠陥 / 補正内容**: 「Test level - adding an overrideTestData object」の `testim -c "testimConfig.js"` の例の直後に、中身のない codeSnippet（`<pre><code></code></pre>`）があり、公式ページに空のコード枠が表示される。補正ではこの空のスニペットを削除する。
- **JA 側**: JA に空のコードブロックはない（変更なし）。
- **状態**: `applied`。
- **Tricentis への報告状況**: _pending_。チケット参照の記録なし。
- **削除手順**: [共通の削除確認手順](#共通の削除確認手順)に従い、本文・トークン・リンク・画像を保持したまま上流の修正を確認する。

## 共通の削除確認手順

1. `npm run check:snapshots:fetch -- --slug=<slug>` で対象の全 slug を再取得する。
2. HTML は CRLF を保持して読み込む (`read_bytes().decode("utf-8")`)。複数ページを対象とする補正も各 slug を個別に調べ、欠陥の実態と置換内容の意味を目視確認する。文字列が一致しないだけでは回復の証拠にならない。
3. 欠陥が実際に修復された場合だけ、回復した補正または slug の範囲を削除する。関連する回帰テストの固定期待値を更新し、対応する台帳項目をアーカイブする。
4. 対象ページの parity と必要な全体チェックを実行する。baseline の件数は0を維持し、acknowledgement や suppression を追加しない。新たな差異を隠すために baseline を再生成しない。
5. セクション単位の補正整理 PR とし、`PARITY_GUIDE.md` のレジストリ変更時のレビューを通す。欠陥が残る場合は補正を維持し、確認記録に証拠を残す。

## Adding a new defect

新しい broken-EN defect を見つけた際のチェックリスト:

1. **Classification**: 4 enum (`typo` / `href-miswire` / `madcap-artifact` / `stale-reference`) のどれに当てはまるか判断。該当なしの場合は新規 class 追加を plan 改定として提案する (独自に追加しない)
2. **Reproducibility**: EN HTML snapshot を grep して literal match で `find` 文字列を確定する。`preprocess_en_html` の normalize (`normalize_escaped_callouts` / `normalize_escaped_faq_details` / `unescape_details`) を通った後の HTML 形で書く
3. **Idempotency check**: `replace` が `find` を部分文字列として含まない (test で自動検証)
4. **Slug scope**: 影響する slug を列挙し、`slugs` array に登録
5. **Linked defect anchor**: 本ファイルに `## UD-NNN: <summary>` セクションを追加し、`linkedDefect: 'docs/UPSTREAM_DEFECTS.md#UD-NNN'` で refer
6. **Tests**: `scripts/python/tests/test_en_source_patches.py` に application test と mismatch test を追加
7. **Baseline regen**: `npm run generate:parity-baseline -- --regenerate --rationale="add UD-NNN patch"`、新規追加 0 を確認
8. **Upstream report**: Tricentis への報告 ticket 起票、本ファイルの "Tricentis upstream report status" を更新

## Review cadence

- 各 entry は `reviewAfter` 日付を持つ (通常 addedAt + 6 ヶ月)
- `reviewAfter` 超過した場合:
  1. Tricentis への報告 status 再確認
  2. Upstream fix 未完了なら、ライブの上流ページで欠陥が残っていることを再検証した場合に限り更新する。`lastVerifiedAt` に検証日を記録し、`reviewAfter` は `lastVerifiedAt`（未記録なら `addedAt`）から最大 184 日後まで。`lastVerifiedAt` は `addedAt` 以降かつ今日以前で、未知の key は拒否される（いずれも validator が強制）。検証できない entry、欠陥が解消した entry は更新せず削除手順に回す。checker 都合で存在する patch は対象外。検証記録は下記 Registry triage log に残す
  3. Upstream fix 完了なら[共通の削除確認手順](#共通の削除確認手順)を実行する。overdue は実際の負債解消まで残す
- Phase B 以降は `npm run check:upstream-recovery` と `upstream-recovery-status.json` が自動 probe を毎 run 実行し、`sourceSyncHealth` managed issue + sticky PR comment で stale / overdue を surface する (`docs/PARITY_GUIDE.md §許容機構` 参照)

## Registry triage log

### 2026-11-15 — HTML 比較経路への移行に伴う補正の整理

- 削除: UD-016A, UD-016B, UD-017（HTML 比較経路が吸収）、UD-018A, UD-018B, UD-018C, UD-019, UD-020（JA の構造修正で吸収）。いずれも checker が EN と JA を別の方法で読んでいたために必要だった補正で、上流の欠陥自体は残っている。
- 追加: UD-023 の 9 件（`running-tests/running-tests-overview` の表セルにある `!<a href>` 画像マークアップ）、UD-026（TestRail URL placeholder の二重エスケープ）、UD-027（config file の空のコードスニペット）。UD-011 は既存の判断どおり再利用しない。
- 結果: 有効な補正は 26 − 8 + 9 + 2 = 29 件。

### 2026-11-16 — DOM 比較経路が不要にした補正の整理

- 削除: UD-010B, UD-010C, UD-010D, UD-021。旧経路が行頭の `N. ` を手順として数えたこと、および孤立した `<p>|…|</p>` を直前の表に融合させたことが原因で必要だった補正。DOM 比較は `<li>` と `<table>` の要素を数えるため誤読が起きない。上流の欠陥自体はライブページに残っており、JA は EN の構造に従っている。UD-010A は引き続き必要。
- 結果: 有効な補正は 29 − 4 = 25 件。

### 2026-11-13 — 検証済み補正の更新

- 確認内容: `npm run check:snapshots:fetch` で全288ページのライブ EN ページを取得し（エラー0、コミット済みスナップショットとの差分なし）、`npm run check:upstream-recovery` で各補正の `find` がライブページに一致することを確認した。
- 結果: 上流は未修正。対象16件はすべて `statusA: active`（stale 0）。
- 更新対象: UD-001A, UD-001B, UD-002, UD-003, UD-005A, UD-005B, UD-005C, UD-005D, UD-006, UD-007, UD-010A, UD-010B, UD-010C, UD-010D, UD-012, UD-021。
- 設定値: `lastVerifiedAt` を 2026-11-13、`reviewAfter` を 2027-05-13（181 日後、上限 184 日以内）に更新した。
- 対象外: UD-016A/B, UD-017, UD-018A/B/C, UD-019, UD-020 は更新せず、期限超過のまま削除手順に回す。UD-024, UD-025 は今週追加分。

### 2026-10-23 — issue #449 の期限超過補正の再確認

- 公式ソースの取得: 全32ページが HTTP 200。すべて `d99f9bb3` のコミット済みスナップショットとバイト単位で一致した。
- 全32件の補正が引き続き active: 対象の補正／ページ39組すべてが一致し、39 hits、mismatches は0。UD-001A/B と UD-009 に部分的な回復も見つからなかった。
- 判断: 全補正と元の `reviewAfter` を維持する。回復レポートは active=32、stale=0、overdue=32、unknown=0。Issue #449 は引き続き対応が必要。
- 上流への報告チケットの証拠は記録されておらず、今回の確認ではベンダーへの報告を送っていない。
- 古い割当・状態の記述を訂正し、欠落していた UD-012～UD-022 の詳細を補完した。権威ある運用・パリティガイドと矛盾する期限延長の案内を修正した。
- 証拠、セクション別の `priority=high` 対応計画、Issue 照合の条件: [2026-10-23 の確認記録](./UPSTREAM_REVIEW_2026-10-23.md)。

上流 defect の probe 結果を時系列で記録する。Phase A/B の `upstream-recovery-status.json` + 手動 triage から得られた事実のみ記載。

### 2026-04-25 — upstream recovery cleanup

- **`source_sync_exclusions` 判定**: `testops/testops-version-control/pull-requests` は `fetchStatus: 'excluded-recovered'` / `statusA: 'stale'` を確認。登録時の破損パターン (MadCap が本文全体を単一 `<code>` ブロックに畳み込み、extractor が 0 segments を返す) は現行 upstream で再現しない。
- **`source_sync_exclusions` action**: `testim_parity.sync_exclusions` から entry を削除。page-level freeze 機構は維持するが、現在 active source-side debt は 0 件。
- **`en_source_patches` 判定**: `check_upstream_recovery` の CRLF-preserving read 修正後、UD-016 / UD-018 / UD-019 / UD-020 は active と再判定。UD-004A / UD-004C のみ stale と確定。
- **`en_source_patches` action**: UD-004A / UD-004C を `_en_source_patches_data.json` から削除し、UD-004 は recovered/archived 状態に更新。
- **確認**: cleanup 後の `npm run check:upstream-recovery` は `total=32 active=32 stale=0 overdue=0 unknown=0` を期待値とする。

## Related docs

- `docs/PARITY_GUIDE.md` — パリティ維持ガイド、本 tracker への参照あり
- `docs/SYSTEM_SPEC.md` — プロジェクト仕様サマリ
- `scripts/README.md` — scripts/ commands と entry_points
