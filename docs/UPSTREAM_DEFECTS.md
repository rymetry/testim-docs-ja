<!-- markdownlint-disable MD038 MD060 -->

# Upstream Defect Tracker

- **Status**: Active (v2, 2026-04-20 — Reserved IDs table added, proposal B')
- **Owner**: Testim JA Docs parity subsystem
- **Related**: `scripts/python/src/testim_parity/_en_source_patches_data.json`, `docs/PARITY_GUIDE.md`

## Reserved IDs (proposal B', Codex Round-3 approved)

UD-NNN IDs are allocated **centrally** via updates to this table, not per-PR ad-hoc. Ad-hoc verbal reservation is banned to prevent semantic collisions like the PR C vs PR D concurrent UD-005 allocation.

| ID | Semantic family | Defect class | Status | Allocation PR |
| --- | --- | --- | --- | --- |
| UD-001 | Salesforce Verify list `-this` typo | `typo` | applied | (initial v1) |
| UD-002 | Salesforce Steps "Log out" href miswire | `href-miswire` | applied | (initial v1) |
| UD-003 | broken-table-row-as-paragraph (predefined-properties) | `madcap-artifact` | candidate | (initial v1) |
| UD-004 | legacy `help.testim.io` stale-reference (scheduler pages) | `stale-reference` | applied | (initial v1) |
| UD-005 | bare/bogus `index.htm` self-link href-miswire family | `href-miswire` | reserved | TBD (next index.htm family PR) |
| UD-006 | _(unallocated)_ | _TBD_ | reserved | TBD |
| UD-007 | _(unallocated)_ | _TBD_ | reserved | TBD |
| UD-008 | _(unallocated)_ | _TBD_ | reserved | TBD |
| UD-009 | `index.htm` self-link miswire in grid-management child pages | `href-miswire` | applied | M2 PR D |
| UD-010 | MadCap authoring-artifact family (ZWSP / escaped-detail fragment / broken-table-row variants) | `madcap-artifact` | applied | M2 UD-010 bundle (codeship broken h2 + parameters-for-groups broken step-5 + VSTS broken step-2/3 extension) |

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
- **Removal SOP**: Tricentis が該当 HTML を修正して MadCap rebuild、`docs.tricentis.com/testim` に反映されたら:
  1. `snapshots/en/content/salesforce-testing/salesforce-steps/sfdc-step-{create,edit,quickactions,relatedlistaction,validate}.html` を再取得
  2. `grep '-this action verifies'` が 0 hit になったことを確認
  3. `scripts/python/src/testim_parity/_en_source_patches_data.json` から UD-001A / UD-001B entry を削除
  4. `npm run generate:parity-baseline -- --regenerate --rationale="UD-001 upstream fix confirmed"` で baseline を再生成 (新規追加 0、既存 entry への影響無しを期待)

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
- **Removal SOP**:
  1. `snapshots/en/content/salesforce-testing/salesforce-steps.html` を再取得
  2. `grep '<a href="sfdc-step-launchapp.htm">Log out</a>'` が 0 hit になったことを確認
  3. `scripts/python/src/testim_parity/_en_source_patches_data.json` から UD-002 entry を削除
  4. baseline 再生成

### UD-003: broken-table-row-as-paragraph in predefined-properties-in-config-file-hooks

- **Patch IDs**: _none_ (candidate — not yet patched)
- **Defect class**: `madcap-artifact`
- **Added**: 2026-04-18
- **Review after**: 2026-10-18
- **Affected slugs** (1):
  - `running-tests/configuration-file-run-hooks/predefined-properties-in-config-file-hooks`
- **Defect**: EN HTML 内に `<p>| globalParameters | | |</p>` という段落が存在する。著者は markdown-table row を意図して書いたが、MadCap が raw paragraph として出力したため、`|` 区切り文字を含む単なる散文として render されている。Turndown 通過後も同形の段落として JA 側と compare されるため、JA は byte-identical な literal mirror で fingerprint 一致させる interim workaround を採っている。
- **Fix applied**: _none_ — `en_source_patches` entry は未登録。JA 側も broken form をそのまま mirror (source-first literal 忠誠)
- **Status**: `candidate (not yet patched)`
- **Planned mechanism**: M3 PR Z / C phase で `en_source_patches` に `UD-003-broken-table-row-as-paragraph` を登録し、EN HTML boundary で broken row を strip / normalize する。候補案:
  - Option A: `<p>| globalParameters | | |</p>` → 削除 (JA も同期削除)
  - Option B: 完全な markdown-table form に normalize し、header / body を復元する
- **Tricentis upstream report status**: _pending_ (担当: JA Docs subsystem, 報告 ticket TBD)
- **Removal SOP** (after patch applied and upstream fix confirmed):
  1. `snapshots/en/content/running-tests/configuration-file-run-hooks/predefined-properties-in-config-file-hooks.html` を再取得
  2. `grep '| globalParameters | | |'` が 0 hit になったことを確認
  3. `scripts/python/src/testim_parity/_en_source_patches_data.json` から UD-003 entry を削除
  4. baseline 再生成

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
  - 結果: baseline から URL token mismatch 由来の segment-extra/missing pair が消滅 (scheduler 5→1, scheduler-mobile 3→1 / 残 1 件ずつは segment-inconclusive tokenless-near-tie = P2-5 対象)
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
  - UD-005E: `and the <a href="index.htm">Params file</a>` → `and the <a href="../parameters/index.htm">Params file</a>` (preamble-disambiguated in preface paragraph)
  - UD-005F: `<a href="index.htm">params-file's parameters</a>` → `<a href="../parameters/index.htm">params-file's parameters</a>` (disambiguated by display text in list item)
- **JA side**: JA was already using the canonical `/docs/<category>/<basename>` and `/docs/advanced-editing/parameters` paths per WRITING_GUIDE §91-109. For UD-005F the JA list-item link `/docs/advanced-editing/parameters/json-parameters-file-parameters` was corrected to `/docs/advanced-editing/parameters` to match the EN `index.htm` self-reference semantics (as a companion content-fix).
- **Tricentis upstream report status**: _pending_ (担当: JA Docs subsystem, 報告 ticket TBD)
- **Removal SOP** (after upstream fix confirmed):
  1. `snapshots/en/content/advanced-editing/hooks.html`, `.../parameters.html`, `.../parameters/parameter-override-rules.html` を再取得
  2. `grep 'help.testim.io/docs/'` および `grep 'doc:https'` および `grep '"index\.htm"'` が 0 hit であることを確認
  3. `scripts/python/src/testim_parity/_en_source_patches_data.json` から UD-005A-F entry を削除
  4. baseline 再生成

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
- **Removal SOP**:
  1. `snapshots/en/content/editing-tests/search-within-a-test.html` を再取得
  2. `grep '-variable name'` が 0 hit になったことを確認
  3. `scripts/python/src/testim_parity/_en_source_patches_data.json` から UD-006 entry を削除
  4. baseline 再生成

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
- **Removal SOP**:
  1. `snapshots/en/content/guides/generate-random-data-with-js.html` を再取得
  2. `grep 'step\.This'` が 0 hit になったことを確認
  3. `scripts/python/src/testim_parity/_en_source_patches_data.json` から UD-007 entry を削除
  4. baseline 再生成

### UD-008: `index.htm` CLI self-link in running-tests/the-command-line-cli/allow-chrome-browser-to-use-microphone

- **Patch ID**: `UD-008-allow-chrome-microphone-cli-index-self-link`
- **Defect class**: `madcap-artifact`
- **Added**: 2026-04-18
- **Review after**: 2026-10-18
- **Affected slugs** (1):
  - `running-tests/the-command-line-cli/allow-chrome-browser-to-use-microphone`
- **Defect**: Same class as UD-005E/F — bare `<a href="index.htm">CLI command</a>` self-link to the parent CLI category index page. The parity extractor resolves `index.htm` to the non-existent slug `index`, emitting a bogus `/docs/index` invariant token that JA (once content is restored to include the CLI command link) does not have.
- **Fix applied**: `read here about the <a href="index.htm">CLI command</a>` → `read here about the <a href="../the-command-line-cli/index.htm">CLI command</a>`
- **JA side**: JA first paragraph was missing the sentence introducing the CLI command flag; restored as a companion content-fix so JA also emits `/docs/running-tests/the-command-line-cli`.
- **Tricentis upstream report status**: _pending_ (担当: JA Docs subsystem, 報告 ticket TBD)
- **Removal SOP**:
  1. `snapshots/en/content/running-tests/the-command-line-cli/allow-chrome-browser-to-use-microphone.html` を再取得
  2. `grep '<a href="index.htm">CLI command</a>'` が 0 hit になったことを確認
  3. `scripts/python/src/testim_parity/_en_source_patches_data.json` から UD-008 entry を削除
  4. baseline 再生成

### UD-009: `index.htm` self-link miswire in grid-management child pages

- **Patch IDs**: `UD-009-grid-management-index-self-link`
- **Defect class**: `href-miswire`
- **Added**: 2026-04-18
- **Applied**: 2026-04-18 (M2 PR D — Integrations area burn-down; renumbered from originally-proposed UD-005 due to ID collision with C's UD-005 mixed stale-reference/index.htm family in hooks & parameters)
- **Review after**: 2026-10-18
- **Affected slugs** (5):
  - `integrations/grid-management/browserstack-integration-1`
  - `integrations/grid-management/browserstack-integration-copy`
  - `integrations/grid-management/custom-grid`
  - `integrations/grid-management/headspin-integration`
  - `integrations/grid-management/saucelabs-integration`
- **Defect**: 5 つの grid-management 子ページの「Adding a grid」相互参照リンクが、親ページへのリンクとして `<a href="index.htm#adding-a-grid">Adding a grid</a>` を使用している。MadCap Flare の convention では `index.htm` は folder の TOC/index ページに解決されると期待されるが、実際の親 topic は 1 階層上の `integrations/grid-management.htm` に存在する。`integrations/grid-management/` フォルダ内には `index.htm` は存在しない (実測確認済)。
- **Observed symptom**: `normalizeUrlToken` が broken `index.htm` を `/docs/index` token に変換する一方、JA 側は WRITING_GUIDE §192 に従い正しい `/docs/integrations/grid-management#adding-a-grid` を維持しているため、parity gate で `segment-extra + segment-missing` のペアが発生 (baseline 10 entries, 5 slug × 2)。
- **JA side**: JA markdown は WRITING_GUIDE §91-109 / §192 に従い `/docs/integrations/grid-management#adding-a-grid` を canonical target とする。これは JA 独自構造ではなく、§192 で明示的に許容された URL localization。
- **Fix applied**:
  - `UD-009-grid-management-index-self-link`: `<a href="index.htm#adding-a-grid">Adding a grid</a>` → `<a href="../grid-management.htm#adding-a-grid">Adding a grid</a>` (5 slug 共通、literal 1-to-1)
  - `normalizeUrlToken` は patched relative `../grid-management.htm` を `/docs/integrations/grid-management` token に変換するため、JA 側 token と一致する。
- **Status**: `applied`
- **Tricentis upstream report status**: _pending_ (担当: JA Docs subsystem, 報告 ticket TBD — 5 ページ共通の MadCap authoring pattern)
- **Removal SOP** (after upstream fix confirmed):
  1. 5 slug の EN HTML snapshot を再取得
  2. `grep 'href="index.htm#adding-a-grid"'` が全 5 file で 0 hit を確認
  3. `scripts/python/src/testim_parity/_en_source_patches_data.json` から UD-009 entry を削除
  4. `npm run generate:parity-baseline -- --regenerate --rationale="UD-009 upstream fix confirmed"` で baseline を再生成 (新規追加 0、既存 entry への影響無しを期待)

### UD-010: MadCap authoring-artifact family (ZWSP + literal-markdown-prefix-in-paragraph)

- **Patch IDs**: `UD-010A-codeship-broken-h2-paragraph`, `UD-010B-parameters-for-groups-broken-step-paragraph`, `UD-010C-vsts-broken-step-paragraph-2`, `UD-010D-vsts-broken-step-paragraph-3`
- **Defect class**: `madcap-artifact`
- **Added**: 2026-04-20
- **Applied**: 2026-04-20 (M2 UD-010 bundle — codeship inconclusive + parameters-for-groups step-count audit-signal; extended same-day with UD-010C/D for VSTS/TFS integration step-count audit-signal)
- **Review after**: 2026-10-20
- **Affected slugs** (3):
  - `integrations/integrate-testim-to-your-ci/codeship-integration` (UD-010A)
  - `advanced-editing/parameters/parameters-for-groups` (UD-010B)
  - `integrations/integrate-testim-to-your-ci/vsts-and-tfs-integration` (UD-010C + UD-010D)
- **Defect**: MadCap Flare が structural element (`<h2>` heading, `<li value="N">` ordered-list-item) を誤って `<p>` 要素にシリアライズし、テキスト内容の先頭に zero-width space (U+200B) + markdown-style prefix (`## ` for heading / `N. ` for step number) を残す authoring-artifact。現在 3 ページで 4 variant が確認されている:
  - **UD-010A (codeship)**: 3 番目の section heading "Run with external Selenium Grid" が `<p>\u200b## Run with external Selenium Grid<br /> When your app...</p>` という単一の `<p>` に融合。同ページの他 2 つの h2 ("Project configuration" / "Run with local Selenium Grid") は正しく `<h2><a name="..."></a>Heading</h2>` 形状を取っているため、第 3 heading のみが MadCap 側の authoring defect。`extractHeadingSequence` は EN=2 / JA=3 とカウントし `segment-inconclusive [heading-count-mismatch]` として surface。
  - **UD-010B (parameters-for-groups)**: 「Adding Parameters to a Group」section の step 5 が `<li value="4">` と `<li value="5">` の間に orphan `<p>\u200b5. Enter a value in the field below...</p>` として挿入。この `<p>` は正規の `<li>` ではないが turndown が Markdown paragraph に変換し、`normalizeEnArtifacts` が ZWSP を strip した後の先頭行が `extractStepCounts` の `^\d+\.\s` regex にヒットするため EN step count が実際の `<li>` 個数 (6) より 1 多く (7) 算出される。JA は translator が正規の 6 step として構造化済み (値入力の説明文を step 4 の後の通常 paragraph に統合) のため step-count audit-signal (EN=7, JA=6) が section #2 で発火。
  - **UD-010C + UD-010D (vsts-and-tfs-integration)**: 「Now, just follow these steps:」section で `<li value="1">` ("Go to Build page") の後に `<img>` + `<p>\u200b2. Create a new build</p>` + `<img>` + `<p>\u200b3. Select your repository</p>` という interleave 構造が挿入されており、その後に続く本来の `<li value="2">`..`<li value="11">` (11 項目) と合わせて extractStepCounts が EN=13 とカウントする (normalizeEnArtifacts が ZWSP を strip するため 2 つの orphan `<p>` も step として算入される)。JA は translator が EN HTML の構造を mirror して `​2. 新しいビルドを作成します` / `​3. リポジトリを選択します` と ZWSP-prefixed paragraph を維持しているが、JA 側 `normalizeNumericPeriodSpacing` は ZWSP を strip しないため JA step count は 11 のみとなる。結果 step-count audit-signal (EN=13, JA=11) + paragraph-count audit-signal (EN=2, JA=4) が section #1 で発火。
- **Observed symptom**:
  - UD-010A: `segment-inconclusive` [heading-count-mismatch] EN=2 vs JA=3 for `codeship-integration` (previously baseline-covered)
  - UD-010B: `step-count-mismatch` audit-signal EN=7 vs JA=6 for `parameters-for-groups` section #2
  - UD-010C + UD-010D: `step-count-mismatch` audit-signal EN=13 vs JA=11 + `paragraph-count-mismatch` EN=2 vs JA=4 for `vsts-and-tfs-integration` section #1
- **JA side**: codeship + parameters-for-groups は EN 側 patch のみで parity 一致する (JA は既に正規構造)。vsts-and-tfs-integration は JA が EN の broken 構造 (`​2.` / `​3.` ZWSP-prefix paragraph) を mirror していたため、EN 側 patch に合わせて JA 側 2 orphan paragraph からも `​N. ` prefix を strip して plain paragraph に揃える (segment-level paragraph 比較で内容が一致するようにする)。codeship UD-010A 適用により EN 側に出現する `webdriver-manager` plain-text token が JA paragraph 「Selenium Server (webdriver-manager)」で residue word count を 3 に到達させ `segment-untranslated` を副次的に発火するため、`docs/GLOSSARY.md` Tier A 外部製品 / 第三者ツール に `webdriver-manager` (npm パッケージ名, Selenium WebDriver バイナリ取得 CLI) を追加する (一般的な CLI tool name retention policy 準拠)。
- **Fix applied**:
  - `UD-010A-codeship-broken-h2-paragraph`: broken `<p>\u200b## ...<br /> body...</p>` → `<h2><a name="run-with-external-selenium-grid"></a>Run with external Selenium Grid</h2><p>body...</p>`。sibling h2 と同じ `<a name="...">` anchor 形式を踏襲。
  - `UD-010B-parameters-for-groups-broken-step-paragraph`: `<p>\u200b5. Enter a value...</p>` → `<p>Enter a value...</p>`。先頭の `\u200b5. ` prefix を削除し、content は通常 paragraph として残す (extractStepCounts の `^\d+\.\s` regex にマッチしなくなる)。
  - `UD-010C-vsts-broken-step-paragraph-2`: `<p>\u200b2. Create a new build</p>` → `<p>Create a new build</p>`。
  - `UD-010D-vsts-broken-step-paragraph-3`: `<p>\u200b3. Select your repository</p>` → `<p>Select your repository</p>`。
  - JA 側 sync (UD-010C/D 連動): `src/content/docs/integrations/integrate-testim-to-your-ci/vsts-and-tfs-integration.md` の `​2. 新しいビルドを作成します` / `​3. リポジトリを選択します` を `新しいビルドを作成します` / `リポジトリを選択します` (先頭 `​N. ` prefix を strip) に修正。
  - GLOSSARY Tier A 追加: `webdriver-manager`。
- **Status**: `applied`
- **Tricentis upstream report status**: _pending_ (担当: JA Docs subsystem, 報告 ticket TBD — MadCap authoring tool での heading/step-item シリアライゼーション bug、同種 pattern が他ページにも潜在する可能性あり)
- **Removal SOP** (after upstream fix confirmed):
  1. 3 slug の EN HTML snapshot を再取得
  2. UD-010A: `grep '<p>\u200b## Run with external'` が 0 hit になったことを確認
  3. UD-010B: `grep '<p>\u200b5. Enter a value'` が 0 hit になったことを確認
  4. UD-010C/D: `grep -E '<p>\u200b[23]\. (Create|Select)'` が 0 hit になったことを確認
  5. `scripts/python/src/testim_parity/_en_source_patches_data.json` から UD-010A/B/C/D entry を削除
  6. JA 側 vsts-and-tfs-integration の orphan paragraph も `​N. ` prefix を再度付与するか、EN upstream が正規 `<li>` に戻れば JA も正規番号リストに統合するか、reviewer 判断
  7. `docs/GLOSSARY.md` から `webdriver-manager` entry を保持するか否か判断 (upstream 修正と独立した policy decision)
  8. `npm run generate:parity-baseline -- --regenerate --rationale="UD-010 upstream fix confirmed"` で baseline を再生成し、新規追加 0 を確認

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
  2. Upstream fix 未完了なら reviewAfter を 3-6 ヶ月延長し本ファイルに rationale 追記
  3. Upstream fix 完了なら Removal SOP を実行
- Phase B 以降は `npm run check:upstream-recovery` と `upstream-recovery-status.json` が自動 probe を毎 run 実行し、`sourceSyncHealth` managed issue + sticky PR comment で stale / overdue を surface する (`docs/PARITY_GUIDE.md §許容機構` 参照)

## Registry triage log

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
