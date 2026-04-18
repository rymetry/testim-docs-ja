# Upstream Defect Tracker

- **Status**: Active (v2, 2026-04-20 — Reserved IDs table added, proposal B')
- **Owner**: Testim JA Docs parity subsystem
- **Related**: `scripts/lib/en_source_patches.mjs`, `docs/superpowers/plans/2026-04-17-en-source-patches-layer.md`

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
| UD-009 | _(unallocated)_ | _TBD_ | reserved | TBD |
| UD-010 | MadCap authoring-artifact family (ZWSP / escaped-detail fragment / broken-table-row variants) | `madcap-artifact` | reserved | TBD (next MadCap artifact family PR) |

### Allocation protocol

Adding a new UD-NNN:

1. Pick the **lowest available reserved slot** from the table above that matches the new defect's semantic family.
2. Update the `Status` column (`reserved` → `candidate` or `applied`) and `Allocation PR` column to the PR that claims the ID.
3. Add the detailed entry in the "Registry (active defects)" section below.
4. The `defectClass` enum value in `en_source_patches` registry must match the table's `Defect class` column.

### Rationale (why central reservation)

Prior to v2, PR C and PR D both attempted to allocate `UD-005` concurrently for different semantic classes (PR D: `grid-management` index.htm self-link, PR C: different slug). Codex Round-2 recommended centralizing allocation through this table to prevent repeat collisions and to keep `grep UD-NNN` on the codebase returning a semantically coherent class.

### Scope of B' (intentionally narrow)

Already-merged IDs (`UD-001`..`UD-004`) are **not renumbered**. Codex Round-3 explicitly flagged that renumbering `UD-004 → UD-009` would churn `en_source_patches.mjs`, tracker, tests, and plan docs without corresponding benefit. The table above simply **reserves future IDs** and establishes allocation protocol going forward.

## Purpose

MadCap Flare で生成された EN HTML snapshot に含まれる **broken upstream defect** を集中管理する。各 defect は:

1. `en_source_patches` registry (`scripts/lib/en_source_patches.mjs`) の `id` と 1:1 で対応する anchor を持つ
2. Tricentis への上流報告 status を記録する
3. Upstream 修正確認時の patch removal 条件 (SOP) を持つ

JA 翻訳は原文構造準拠を崩さないため、JA markdown 側で workaround を埋め込むことは禁止 (plan §1.1 / absolute principle 4)。broken-EN は必ず EN HTML boundary (`preprocessEnHtml`) で slug-scope literal patch として処理する。

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
- **Fix applied**: preprocessEnHtml 内で `-this action verifies` → `- this action verifies` に置換
- **Tricentis upstream report status**: _pending_ (担当: JA Docs subsystem, 報告 ticket TBD)
- **Removal SOP**: Tricentis が該当 HTML を修正して MadCap rebuild、`docs.tricentis.com/testim` に反映されたら:
  1. `snapshots/en/content/salesforce-testing/salesforce-steps/sfdc-step-{create,edit,quickactions,relatedlistaction,validate}.html` を再取得
  2. `grep '-this action verifies'` が 0 hit になったことを確認
  3. `scripts/lib/en_source_patches.mjs` から UD-001A / UD-001B entry を削除
  4. `node scripts/generate_parity_baseline.mjs --regenerate --rationale="UD-001 upstream fix confirmed"` で baseline を再生成 (新規追加 0、既存 entry への影響無しを期待)

### UD-002: Salesforce Steps "Log out" href miswire

- **Patch ID**: `UD-002-logout-href-miswire`
- **Defect class**: `href-miswire`
- **Added**: 2026-04-17
- **Review after**: 2026-10-17
- **Affected slugs** (1):
  - `salesforce-testing/salesforce-steps`
- **Defect**: parent index page の共通操作リスト "Log out" エントリのリンクターゲットが誤って `sfdc-step-launchapp.htm` を指している。本来は `sfdc-step-logout.htm` (別の子ページが正しく存在する)。
- **Fix applied**: preprocessEnHtml 内で `<a href="sfdc-step-launchapp.htm">Log out</a>` → `<a href="sfdc-step-logout.htm">Log out</a>` に置換
- **JA side**: JA markdown は既に `sfdc-step-logout` への正しいリンクを保持 (UX 上正しい)。patch により EN/JA 両側で同じ `/docs/salesforce-testing/salesforce-steps/sfdc-step-logout` token が emit され、parity alignment 成立。
- **Tricentis upstream report status**: _pending_ (担当: JA Docs subsystem, 報告 ticket TBD)
- **Removal SOP**:
  1. `snapshots/en/content/salesforce-testing/salesforce-steps.html` を再取得
  2. `grep '<a href="sfdc-step-launchapp.htm">Log out</a>'` が 0 hit になったことを確認
  3. `scripts/lib/en_source_patches.mjs` から UD-002 entry を削除
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
  3. `scripts/lib/en_source_patches.mjs` から UD-003 entry を削除
  4. baseline 再生成

### UD-004: legacy `help.testim.io` vs modern path mismatch in scheduler pages

- **Patch IDs**: `UD-004A-scheduler-high-speed-mode`, `UD-004C-scheduler-slack-integration-anchor`
- **Defect class**: `stale-reference`
- **Added**: 2026-04-18
- **Rescoped**: 2026-04-18 (PR #337 rework — URL-localization takes precedence over raw mirror)
- **Applied**: 2026-04-18 (Category B PR — UD-004A + UD-004C promoted from candidate to applied; UD-004B retired as N/A)
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
- **Status**: `applied (UD-004A + UD-004C)`
- **Tricentis upstream report status**: _pending_ (担当: JA Docs subsystem, 報告 ticket TBD)
- **Removal SOP** (after upstream fix confirmed):
  1. `snapshots/en/content/running-tests/scheduler.html` と `scheduler-mobile.html` を再取得
  2. `grep 'help.testim.io'` が 0 hit になったことを確認
  3. `scripts/lib/en_source_patches.mjs` から UD-004A / UD-004C entry を削除
  4. baseline 再生成 (既存 entry は tokenless-near-tie のみ残存するはず)

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
  3. `scripts/lib/en_source_patches.mjs` から UD-005A-F entry を削除
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
  3. `scripts/lib/en_source_patches.mjs` から UD-006 entry を削除
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
  3. `scripts/lib/en_source_patches.mjs` から UD-007 entry を削除
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
  3. `scripts/lib/en_source_patches.mjs` から UD-008 entry を削除
  4. baseline 再生成

## Adding a new defect

新しい broken-EN defect を見つけた際のチェックリスト:

1. **Classification**: 4 enum (`typo` / `href-miswire` / `madcap-artifact` / `stale-reference`) のどれに当てはまるか判断。該当なしの場合は新規 class 追加を plan 改定として提案する (独自に追加しない)
2. **Reproducibility**: EN HTML snapshot を grep して literal match で `find` 文字列を確定する。preprocessEnHtml の他 normalize (`normalizeEscapedCallouts` / `normalizeEscapedFaqDetails` / `unescapeDetails`) を通った後の HTML 形で書く
3. **Idempotency check**: `replace` が `find` を部分文字列として含まない (test で自動検証)
4. **Slug scope**: 影響する slug を列挙し、`slugs: Object.freeze([...])` に登録
5. **Linked defect anchor**: 本ファイルに `## UD-NNN: <summary>` セクションを追加し、`linkedDefect: 'docs/superpowers/specs/upstream-defect-tracker.md#UD-NNN'` で refer
6. **Tests**: `scripts/__tests__/en_source_patches.test.mjs` に application test と mismatch test を追加
7. **Baseline regen**: `node scripts/generate_parity_baseline.mjs --regenerate --rationale="add UD-NNN patch"`、新規追加 0 を確認
8. **Upstream report**: Tricentis への報告 ticket 起票、本ファイルの "Tricentis upstream report status" を更新

## Review cadence

- 各 entry は `reviewAfter` 日付を持つ (通常 addedAt + 6 ヶ月)
- `reviewAfter` 超過した場合:
  1. Tricentis への報告 status 再確認
  2. Upstream fix 未完了なら reviewAfter を 3-6 ヶ月延長し本ファイルに rationale 追記
  3. Upstream fix 完了なら Removal SOP を実行
- CI warning 化は follow-up (`parity-check-status.json.debug.patchCoverage` に `reviewAfter` を乗せて gate へ引き込む案あり)

## Related docs

- `docs/superpowers/plans/2026-04-17-en-source-patches-layer.md` — 設計計画 (v4 Codex APPROVED)
- `docs/PARITY_GUIDE.md` — parity 一般ガイド、本 tracker への参照を追加
- `scripts/README.md` — scripts/ commands と entry_points
