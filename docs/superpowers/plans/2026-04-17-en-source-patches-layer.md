# Plan: EN Source Patches Layer (Route W, v4)

- **Status**: Draft v4 (addresses Codex round-1 / 2 / 3)
- **Date**: 2026-04-17
- **Supersedes**: v1, v2, v3、literal mirror、X/Y tokenizer 改修案

## 0. Prerequisite

本計画は **Tricentis legal abolition branch (`claude/m2-tricentis-legal-abolition`)** が main に merge 済みであることを前提とする。

- 2026-04-17 14:00 JST 時点: branch push 完了、Vercel rate limit 解除待ちで merge 未実施
- 未 merge の場合は:
  - `scripts/check_source_parity.mjs:53` で `ja_omission_policy_registry` の import 継続
  - `scripts/check_source_parity.mjs:386` で `createOmissionCoverage` 初期化継続
  - `scripts/check_source_parity.mjs:752` で status JSON に `omissionCoverage` emit 継続
  - `scripts/lib/source_parity_align.mjs:44, 720` で `NOOP_OMISSION_COVERAGE` 経由の suppress logic 継続
- 本 branch は **Tricentis abolition merge 後に main から切る**。rebase 時は両 branch の conflict を解決、abolition コードベースが base line として安定後に patch layer を載せる
- 例外対応: rate limit が長期化し abolition merge が遅延した場合は、本 branch を abolition branch 上に直接スタックして PR をチェーン化する。そのケースは §3.2 補足

## 1. Context

### 1.1 User Goal (再確認、不変)
- EN 原文構造のまま JA 作成、JA 独自構造禁止
- baseline = 0
- 許容条件 = broken-EN 処理の ONE purpose
- Testim UI 用語は英語維持

### 1.2 既存 canonical EN 処理 boundary

**`preprocessEnHtml(html)`** (`scripts/lib/turndown.mjs:403`) が唯一共有される EN HTML 正規化 API。以下が全 caller 一覧 (grep 確定):

| Caller | Line | 対象 HTML |
|---|---|---|
| `scripts/check_source_parity.mjs:431` | 431 | rawEnHtml → canonical (主 parity 入口) |
| `scripts/check_source_parity.mjs:444` | 444 | `convertEnHtmlToMd(rawEnHtml)` 内部で再呼び出し (raw を受ける現状) |
| `scripts/check_source_parity.mjs:465` | 465 | `extractSegmentsFromHtml(rawEnHtml, ...)` 内部で再呼び出し (raw を受ける現状) |
| `scripts/lib/source_parity_segments_en.mjs:680` | 680 | `extractSegmentsFromHtml` 内で `preprocessEnHtml(html)` slug-less |
| `scripts/lib/source_parity_segments_en.mjs:674` | 674 | `extractSegmentsFromHtml` の import 点 |
| `scripts/lib/source_parity_source_usability.mjs:183` | 183 | source usability 判定で slug-less 再呼び出し |
| `scripts/lib/turndown.mjs:419` (`convertEnHtmlToMd`) | 419 | 内部で preprocessEnHtml → turndown |
| `scripts/__tests__/turndown.test.mjs` 多数 | - | unit test |

Codex round-3 指摘通り、現 `check_source_parity.mjs` は `rawEnHtml` を downstream (`convertEnHtmlToMd` :444、`extractSegmentsFromHtml` :465) に渡しており、これら内部の `preprocessEnHtml` が raw を再処理している。v4 では **outer layer で canonical 化 + downstream に canonical HTML を渡す** 設計にする (§2 詳述)。

### 1.3 既存 mechanism 層 (Tricentis abolition merge 後の想定)

| Layer | Scope | Runtime 接続 | 状態 |
|---|---|---|---|
| `SOURCE_SYNC_EXCLUSIONS` | page-level | `snapshot_update.mjs` | 維持 (source acquisition control) |
| `parity_artifact_registry` | runtime token (slug-scope) | `source_parity_align.mjs` 内 coverage | 維持 (future: patch へ migrate) |
| `ja_omission_policy_registry` | JA-side intentional omission | **abolition PR merge 後に撤廃** | prerequisite (§0) |
| **`en_source_patches` (本計画)** | EN HTML segment-level | `preprocessEnHtml` 内 | **本計画で新設** |

**注**: abolition PR が未 merge のまま本 plan を実装開始する場合は `ja_omission_policy_registry` と本 patch layer は **runtime で共存**する (互いに独立、同時 run で各 coverage を snapshot に emit する)。移行期間中の両立性は §2.7 で扱う。

### 1.4 Defect inventory (実測)

**Defect UD-001** (`-this` typo、2 HTML variants)

grep `-- '-this action verifies' snapshots/en/content/salesforce-testing/salesforce-steps/*.html` 結果:
- **Variant A (plain-leading)**: `<p>Verify -this action verifies`
  - `sfdc-step-create.html:31`
  - `sfdc-step-validate.html:34`
- **Variant B (strong-leading)**: `</strong> -this action verifies`
  - `sfdc-step-edit.html:37`
  - `sfdc-step-quickactions.html:55`
  - `sfdc-step-relatedlistaction.html:70`

**Defect UD-002** (`Log out` href miswire)
- `snapshots/en/content/salesforce-testing/salesforce-steps.html:18`: `<a href="sfdc-step-launchapp.htm">Log out</a>`

**Baseline entries 数** (`parity-baseline.json` 実測、2026-04-17 checkout baseline=143):
| slug | entries | UD 起因 |
|---|---|---|
| `salesforce-testing/salesforce-steps` | 2 | UD-002 × 2 (segment-extra + segment-missing) |
| `salesforce-steps/sfdc-step-create` | 3 | UD-001A + cascade |
| `salesforce-steps/sfdc-step-edit` | 3 | UD-001B + cascade |
| `salesforce-steps/sfdc-step-quickactions` | 1 | UD-001B direct |
| `salesforce-steps/sfdc-step-relatedlistaction` | 1 | UD-001B direct |
| `salesforce-steps/sfdc-step-validate` | 3 | UD-001A + cascade |

Direct defect elimination (必ず消える): **5 (UD-001) + 2 (UD-002) = 7**
Cascade (段落/構造 alignment で連鎖): 最大 **+6 (sfdc-step-create, edit, validate の structure/extra 2 × 3)**
**Δ acceptance range**: **-13 ≤ Δ ≤ -7**。新規追加 0 は binary gate。

#### 1.4.1 Inventory addendum (post-initial defects)

初版の UD-001 / UD-002 以降に追加された defect。scope / defectClass / gates #6-8 の適用範囲を明示するため、以降の PR 作成時は本 sub-section に entry を追記する。

**Defect UD-003** (`madcap-artifact`、PR #337 で registered candidate、applied 未実施)
- `<p>| globalParameters      |             |      |</p>` (broken-table-row-as-paragraph)
- affected: `running-tests/configuration-file-run-hooks/predefined-properties-in-config-file-hooks`
- JA 側は byte-identical mirror で interim 対応済、baseline 追加無し
- C phase (M3 PR Z 候補) で `en_source_patches` に昇格予定

**Defect UD-004** (`stale-reference`、PR #338 で UD-004A + UD-004C applied、UD-004B retired as N/A)
- affected: `running-tests/scheduler` (UD-004A + UD-004C), `running-tests/scheduler-mobile` (UD-004C)
- UD-004A: `<a href="https://help.testim.io/docs/high-speed-mode">Turbo mode</a>` → `<a href="../testops/turbo-mode.htm">Turbo mode</a>` (feature rename: high-speed → turbo、legacy domain strip)
- UD-004C: `<a href="https://help.testim.io/v2.0/docs/scheduler#integrating-scheduler-with-slack">below</a>` → `<a href="scheduler.htm#integrating-scheduler-with-slack">below</a>` (legacy v2.0 anchor → self-link canonical)
- UD-004B retired: EN grep で scheduler-mobile に high-speed-mode 参照が無いことを確認済
- **Per-slug overlap**: UD-004A + UD-004C は `running-tests/scheduler` を共有する最初のケース。test invariant (§2.4 order-independence) は "no two patches share a slug" ではなく "per-slug find-disjointness (find-to-find + find-to-replace substring free)" で保証される (`scripts/__tests__/en_source_patches.test.mjs`)。literal split/join replacement の commutativity には後者で十分 — slug-disjointness は overly-strict。
- **Δ PR #338**: -6 (scheduler 5→1 / scheduler-mobile 3→1)、新規追加 0。Gates #6 (`mismatches = 0`)、#7 (`matchedHits ≥ 3`) 適用。**Gate #8 (-13 ≤ Δ ≤ -7) は UD-001/002 Bundle 1 固有の acceptance range であり、本 UD-004 promotion には適用しない** (per-defect acceptance range は各 PR で個別に宣言する)。

## 2. Architecture

### 2.1 Design choice: canonical HTML を outer layer で生成し downstream に伝播

二択 (両立可能、どちらかを選ぶ):

| Option | 概要 | Pros | Cons |
|---|---|---|---|
| **(I) Outer-canonicalize + canonical forward** | `check_source_parity.mjs:431` で `enHtml = preprocessEnHtml(rawEnHtml, { slug, patchCoverage })` し、`:444` `:465` も **`enHtml` を渡す** | 全 downstream consumer が自動的に canonical 受け取り、内部 preprocessEnHtml 再呼び出しは idempotent no-op | `convertEnHtmlToMd` の signature 変更不要、`extractSegmentsFromHtml` も不要、call site 2 箇所の引数変更のみ |
| **(II) Thread slug through APIs** | `extractSegmentsFromHtml(html, { slug, patchCoverage, ... })` と `convertEnHtmlToMd(html, { slug, patchCoverage })` に signature 追加、内部の `preprocessEnHtml(html)` を `preprocessEnHtml(html, { slug, patchCoverage })` に差し替え | API 呼び出し箇所が何も canonical を気にしなくてもよい | 2 API の signature 変更、内部 double-counting 対策要 (outer でも patch されうる) |

**v4 採用: Option I**。理由:
- call-site 変更が 2 箇所 (`:444` と `:465`) で済む
- signature 変更なし (既存 test 影響小)
- canonical HTML を 1 度生成 → 全 downstream で使い回しは冪等 (preprocessEnHtml は既に idempotent、patches は find→replace で idempotent)
- 「double-count」は理論上なし: 内部 preprocessEnHtml は slug を受け取らないので patches を呼ばない → coverage には outer での 1 回だけ計上

### 2.2 Call-site 変更一覧 (MVP で確定)

| File:Line | Before | After |
|---|---|---|
| `scripts/check_source_parity.mjs:431` | `enHtml = preprocessEnHtml(rawEnHtml)` | `enHtml = preprocessEnHtml(rawEnHtml, { slug: fileSlug, patchCoverage })` |
| `scripts/check_source_parity.mjs:444` | `enBody = convertEnHtmlToMd(rawEnHtml)` | `enBody = convertEnHtmlToMd(enHtml)` ← canonical HTML を渡す |
| `scripts/check_source_parity.mjs:465` | `enSegments = extractSegmentsFromHtml(rawEnHtml, {...})` | `enSegments = extractSegmentsFromHtml(enHtml, {...})` ← canonical HTML を渡す |
| `scripts/check_source_parity.mjs` 新規 | — | `const patchCoverage = createEnSourcePatchCoverage()` を run 単位で生成 |
| `scripts/check_source_parity.mjs` 新規 | — | `debug.patchCoverage = patchCoverage.snapshot()` |
| `scripts/lib/turndown.mjs` `preprocessEnHtml` | `function preprocessEnHtml(html)` | `function preprocessEnHtml(html, options = {})` optional `slug`, `patchCoverage` |
| `scripts/lib/source_parity_source_usability.mjs:183` | `preprocessEnHtml(rawEnHtml)` | 変更なし (caller が raw の関数、usability は raw signal 用途) ── **要検証** |
| `scripts/lib/source_parity_segments_en.mjs:680` | `preprocessEnHtml(html)` | **変更なし** — outer で既に canonicalized、内部再呼び出しは idempotent no-op |
| `scripts/lib/turndown.mjs:419` (`convertEnHtmlToMd`) | 内部で `preprocessEnHtml(html)` | **変更なし** — 同上 |
| テスト | `preprocessEnHtml(html)` (slug 未指定) | **変更なし** (既存挙動維持) |

**要検証項目** (Phase 3 実装時):
- `source_parity_source_usability.mjs:183` で preprocessEnHtml を raw に対して呼ぶのは「usability 判定 (shallow / escaped-details residue 等) の前処理」であり、patch 適用後の HTML ではなく raw を観察したい可能性がある。実装時に raw 渡しが正しいか確認し、v4 の Option I 整合性を確定する。不整合なら patch は usability には適用しない方針を明文化

### 2.3 Patch module (frozen JS)

`scripts/lib/en_source_patches.mjs` (既存 `parity_artifact_registry.mjs` convention 踏襲):

```js
export const EN_SOURCE_PATCHES = Object.freeze([
  Object.freeze({
    id: 'UD-001A-dash-this-typo-plain',
    slugs: Object.freeze([
      'salesforce-testing/salesforce-steps/sfdc-step-create',
      'salesforce-testing/salesforce-steps/sfdc-step-validate',
    ]),
    defectClass: 'typo',
    find: '<p>Verify -this action verifies',
    replace: '<p>Verify - this action verifies',
    rationale:
      'MadCap authoring typo: missing space between "-" and "this" in ' +
      'Verify list item intro (plain-leading variant).',
    linkedDefect: 'docs/superpowers/specs/upstream-defect-tracker.md#UD-001',
    addedAt: '2026-04-17',
    reviewAfter: '2026-10-17',
  }),
  Object.freeze({
    id: 'UD-001B-dash-this-typo-strong',
    slugs: Object.freeze([
      'salesforce-testing/salesforce-steps/sfdc-step-edit',
      'salesforce-testing/salesforce-steps/sfdc-step-quickactions',
      'salesforce-testing/salesforce-steps/sfdc-step-relatedlistaction',
    ]),
    defectClass: 'typo',
    find: '</strong> -this action verifies',
    replace: '</strong> - this action verifies',
    rationale: '... (strong-leading variant) ...',
    linkedDefect: 'docs/superpowers/specs/upstream-defect-tracker.md#UD-001',
    addedAt: '2026-04-17',
    reviewAfter: '2026-10-17',
  }),
  Object.freeze({
    id: 'UD-002-logout-href-miswire',
    slugs: Object.freeze(['salesforce-testing/salesforce-steps']),
    defectClass: 'href-miswire',
    find: '<a href="sfdc-step-launchapp.htm">Log out</a>',
    replace: '<a href="sfdc-step-logout.htm">Log out</a>',
    rationale:
      'Upstream MadCap href miswire: Log out list entry links to launchapp.htm.',
    linkedDefect: 'docs/superpowers/specs/upstream-defect-tracker.md#UD-002',
    addedAt: '2026-04-17',
    reviewAfter: '2026-10-17',
  }),
]);
```

`defectClass` enum: `typo` | `href-miswire` | `madcap-artifact` | `stale-reference` の 4 種のみ (machine-checkable、reviewer gate 強制)。

### 2.4 Applier + coverage

`parity_artifact_registry.mjs::createArtifactCoverage` 同 pattern。

```js
export function applyEnSourcePatches(html, slug, coverage) {
  let current = html;
  for (const patch of EN_SOURCE_PATCHES) {
    if (!patch.slugs.includes(slug)) continue;
    const occurrences = countOccurrences(current, patch.find);
    if (occurrences === 0) {
      coverage.recordMismatch({ slug, patchId: patch.id, reason: 'find-not-found' });
      continue;
    }
    current = current.split(patch.find).join(patch.replace);
    coverage.recordHit({ slug, patchId: patch.id, hits: occurrences });
  }
  return current;
}
```

**Properties (test で保証)**:
- Idempotent: `apply(apply(h,s,c), s, NOOP) === apply(h,s,c)`
- Order-independent: 全 patch × 全 slug で permutation 比較
- slug 非該当: no-op, 0 coverage
- find 未出現: mismatch 記録 + skip (fail-open)

Coverage snapshot:
```json
{
  "registryEntries": 3,
  "matchedHits": 6,
  "byPatchId": { "UD-001A-...": 2, "UD-001B-...": 3, "UD-002-...": 1 },
  "bySlug": { "...": 1, ... },
  "mismatches": []
}
```

`parity-check-status.json.debug.patchCoverage` に emit。`artifactCoverage` / `omissionCoverage` と並列配置。

### 2.5 `preprocessEnHtml` 拡張

```js
// turndown.mjs:403
export function preprocessEnHtml(html, options = {}) {
  if (typeof html !== 'string') {
    throw new TypeError(`preprocessEnHtml expected string, got ${typeof html}`);
  }
  const { slug, patchCoverage } = options;

  // 既存 normalization 群 (escaped-details 復元、callout-normalize 等) そのまま維持
  let current = /* ...既存処理... */;

  // patches は最後に適用 (他 normalization で HTML shape が変わった後に find する)
  if (typeof slug === 'string' && slug.length > 0) {
    current = applyEnSourcePatches(current, slug, patchCoverage ?? NOOP_PATCH_COVERAGE);
  }

  return current;
}
```

**注**: patches の find パターンは **preprocessEnHtml 内の他 normalization 後** に適用される → `find` 文字列は normalize 後の HTML を基準に定義する。実装時 Phase 1/2 の test fixture で normalize 後の実 HTML を grep し find を確定する。

### 2.6 Baseline orphan 処理 (per issue type)

`scripts/lib/source_parity_baseline.mjs:460-503` の `buildBaselineKey` は issue type ごとに key shape が異なる:

| issue type | key 構成要素 |
|---|---|
| structure mismatches (`STRUCTURE_MISMATCH_TYPES`) | `slug + type + sectionIndex + structureCategory + structureFingerprint` (line 460-472) |
| source-unusable (`SOURCE_UNUSABLE_TYPES`) | `slug + type + reason` (474) |
| `segment-inconclusive` | `slug + type + category` (478) |
| JA-owned (`JA_OWNED_TYPES`, e.g., `segment-extra`) | `slug + type + sectionPath + segmentKind + ja + jaSegmentIndex + jaSourceFingerprint` (481-485) |
| `segment-token-gap` | `slug + type + sectionPath + segmentKind + en + enSegmentIndex + enSourceFingerprint + tokens` (487-492) |
| `segment-shifted` | `slug + type + sectionPath + segmentKind + en + enIdx + enfp + jafp` (494-499) |
| default EN-owned (e.g., `segment-missing`) | `slug + type + sectionPath + segmentKind + en + enSegmentIndex + enSourceFingerprint` (501-503) |

**UD-001 patch 適用後の entry 挙動**:
| 対象 entry | Key 成分 | patch 後 | 予想 |
|---|---|---|---|
| `segment-token-gap` (5 slugs direct) | `enfp + tokens=[-this]` | EN segment text が `- this` に変わる → `enfp` 変化、かつ canonical には `-this` token 消滅で tokens も変化 | **orphan、新 entry 不発生**。net -5 (direct) |
| `segment-extra` (sfdc-step-create/edit/validate) | `jafp` 基準 (JA 不変) | JA 変えない → `jafp` 維持 | key は有効だが current run で issue 消滅 (alignment で消化) → **orphan として自動 cleanup** |
| `section-structure-mismatch` (sfdc-step-create/edit/validate) | `structureFingerprint` | 構造 fingerprint が実際に変わるかは empirical (list item text change が structure に影響するか次第) | 2 ケース分岐: (a) structure fp 変化で orphan + new 検出停止 → net -1、(b) structure fp 同じで issue が残る → **cascade 残存を認識し follow-up で content 側対応** |

**UD-002 patch 適用後の entry 挙動**:
| 対象 entry | Key 成分 | patch 後 | 予想 |
|---|---|---|---|
| `segment-missing` (Log out 相当) | 既定 EN-owned key `enfp` | EN segment text (`launchapp` → `logout`) 変化 → `enfp` 変化 | orphan、JA 側 `logout` と alignment 成立 → 新 entry 不発生。net -1 |
| `segment-extra` (JA `[ログアウト]` 項目) | `jafp` (JA 不変) | JA 変えない → `jafp` 維持 | alignment 成立で current run で issue 消滅 → **orphan cleanup** net -1 |

**Orphan cleanup 機構**: `generate_parity_baseline.mjs --apply` の full regen は、既存 baseline entry で current run に対応する issue が無いものを除外して書き出す (既存実装、`source_parity_baseline.mjs` 内の reconciliation logic)。**新 entry 追加 0 が Phase 4 の binary gate**。

### 2.7 `ja_omission_policy_registry` との共存 (abolition merge 遅延時のみ)

万一 abolition PR が本 plan 実装開始時点で未 merge の場合、両 coverage が並列で動作する:
- `omissionCoverage` (既存、`check_source_parity.mjs:386`)
- `patchCoverage` (新規、本 plan)

両 coverage は独立に snapshot され、`debug` object に共存可能。`alignSegments` 内の `NOOP_OMISSION_COVERAGE` 経路は patches と直交 (別 issue type に作用) なので conflict なし。

但し本 plan の binary gate「`SOURCE_SYNC_EXCLUSIONS` / `parity_artifact_registry` / `en_source_patches` のみ」は ja_omission の存在中は **厳密には成立しない**。`ja_omission_policy_registry` が居る間の acceptance は「新規 ja_omission 追加 0」で妥協する。abolition merge 後に §1.3 layer inventory が完全に正。

## 3. MVP Scope

### 3.1 In scope
1. `scripts/lib/en_source_patches.mjs` 新設 (frozen registry + applier + coverage)
2. `scripts/__tests__/en_source_patches.test.mjs` (schema、idempotency、order-indep、fail-open、coverage shape)
3. `scripts/lib/turndown.mjs` `preprocessEnHtml` signature 拡張 (`options = {}`、slug / patchCoverage)
4. `scripts/check_source_parity.mjs` 更新:
   - :431 `preprocessEnHtml(rawEnHtml, { slug, patchCoverage })`
   - :444 `convertEnHtmlToMd(enHtml)` ← canonical 渡し
   - :465 `extractSegmentsFromHtml(enHtml, {...})` ← canonical 渡し
   - run 単位 `patchCoverage` 生成 + `debug.patchCoverage` 合流
5. Patch data: UD-001A / UD-001B / UD-002 の 3 entries
6. Bundle 1 worker commit (`41f7f65`) cherry-pick/rebase + HTML コメント 6 箇所全削除
7. `salesforce-steps.md` の `[ログアウト]` → `sfdc-step-logout` 維持 (worker が既に fix)
8. `node scripts/generate_parity_baseline.mjs --apply` full regen
9. `docs/superpowers/specs/upstream-defect-tracker.md` 初版 (UD-001 / UD-002 記録 + Tricentis 上流報告追跡 + removal 条件)
10. Documentation sync:
    - `docs/WRITING_GUIDE.md`
    - `docs/PARITY_GUIDE.md` (PR 説明 template: orphan 除去 / 新規追加 / net delta)
    - `scripts/README.md`
    - plan link
    - memory `feedback_baseline_zero_increase.md` 精密化
11. Plan 本体 commit (`docs/superpowers/plans/2026-04-17-en-source-patches-layer.md`)

### 3.2 Out of scope / future
- `parity_artifact_registry` 2 entries の patch migration (M3 PR Z)
- `scripts/lib/source_parity.mjs` barrel に patch layer export 追加 (不要、direct import のみ)
- Snapshot 取得時 patch 焼き込み (明示的に拒否)
- abolition PR 遅延時のスタック PR 運用 (§0 補足): この plan 単体の PR は abolition PR merge を待つ。遅延 48h 超過時のみ stack 運用を検討 (最終判断は coordinator)

## 4. Implementation Phases

### Phase 1: Module + schema tests
- `en_source_patches.mjs` skeleton、3 entries、`countOccurrences`
- `en_source_patches.test.mjs`: schema、defectClass enum、exports
- **Acceptance**: `npm test -- en_source_patches` PASS

### Phase 2: Applier + coverage tests
- `applyEnSourcePatches` / `createEnSourcePatchCoverage` / `NOOP_PATCH_COVERAGE`
- Test: idempotency、order-indep、slug 非該当 no-op、find 未出現 mismatch、hits 集計
- **Acceptance**: applier test suite PASS

### Phase 3: `preprocessEnHtml` 拡張 + call-site 伝播
- `preprocessEnHtml(html, options = {})` backward-compatible 実装
- `check_source_parity.mjs:431, 444, 465` 更新
- `source_parity_source_usability.mjs:183` の raw 渡し妥当性検証 (patch 影響なしを確認)
- Regression: 空 registry (or patches 登録済 + 非該当 slug のみ) で 288 pages の `parity-check-status.json` fileSummary byte-identical
- **Acceptance**: regression PASS、既存 `turndown.test.mjs` PASS

### Phase 4: UD patch 登録 + Bundle 1 rework + baseline regen
- 3 patches 投入
- Bundle 1 HTML コメント 6 箇所削除 (cherry-pick/rebase from `claude/m2-tier-b-wave3-salesforce-steps-bundle`)
- Per-slug parity check で UD 解消確認 (6 slug 各々)
- `patchCoverage.matchedHits ≥ 6`、`mismatches.length === 0` 確認
- `node scripts/generate_parity_baseline.mjs --apply` full regen
- Net baseline delta 計測、**-13 ≤ Δ ≤ -7** 範囲内、新規追加 0
- **Acceptance**: 上記 + Bundle 1 JA markdown に `<!-- parity:` コメント 0

### Phase 5: Docs + upstream tracker
- `upstream-defect-tracker.md` 初版 (UD-001 / UD-002 + Tricentis 報告 status)
- `WRITING_GUIDE` / `PARITY_GUIDE` / `scripts/README.md` / plan / memory 同期
- PR 説明 template 明文化
- **Acceptance**: `npm run lint && npm run test && npm run build` PASS、doc references resolve

## 5. Acceptance Criteria (binary gates)

1. [ ] `npm run lint` 0 error / 0 warning
2. [ ] `npm run test` 全 PASS
3. [ ] `npm run build` 290 pages 成功
4. [ ] `npm run check:parity` → `reportableActiveFiles: 0`
5. [ ] Phase 3 regression: 非該当 slug で全 288 page の `parity-check-status.json` fileSummary 同一
6. [ ] Phase 4 `patchCoverage.mismatches.length === 0`
7. [ ] Phase 4 `patchCoverage.matchedHits ≥ 6`
8. [ ] Phase 4 baseline net delta **-13 ≤ Δ ≤ -7** (UD-attributable only; Bundle 1 non-UD content fixes may contribute additional negative delta, expected combined total up to -17)
9. [ ] Phase 4 baseline **新規追加 0 件** (orphan 置換は許容)
10. [ ] Bundle 1 JA markdown に `<!-- parity:` コメント 0
11. [ ] `salesforce-steps.md` の `[ログアウト]` link が `/docs/salesforce-testing/salesforce-steps/sfdc-step-logout`
12. [ ] `parity_artifact_registry` 新規追加 0
13. [ ] `SOURCE_SYNC_EXCLUSIONS` 新規追加 0
14. [ ] `scripts/lib/source_parity.mjs` barrel 変更なし
15. [ ] PR 説明に「orphan 除去 / 新規追加 / net delta」記載
16. [ ] `upstream-defect-tracker.md` に UD-001 / UD-002 登録
17. [ ] abolition PR merge 済、または §2.7 共存条件下で `ja_omission_policy_registry` の新規 entry 0

## 6. Verification Sequence

```bash
# Phase 1
npm test -- scripts/__tests__/en_source_patches.test.mjs
# Phase 2
npm test -- scripts/__tests__/en_source_patches.test.mjs -t applier
# Phase 3 regression
npm run check:parity
# (Phase 4 patches + rework 後)
npm run check:parity
cat parity-check-status.json | jq '.debug.patchCoverage'
# Phase 4 full regen
node scripts/generate_parity_baseline.mjs --apply
# Final
npm run lint && npm run test && npm run build
# Orphan 検証 (Phase 4 後)
git diff parity-baseline.json | head -200
# 想定: - 行 ≥ 7 (orphan 除去) / + 行 0 (新規追加なし)
```

## 7. Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Tricentis abolition PR 遅延で本 plan base が stale | merge conflict、build 破綻 | §0 prerequisite 明示、遅延 48h 超は stack 運用で対応 |
| Patch が JA-easing lane 化 | 原則違反再発 | `defectClass` enum 4 種、reviewer gate で `linkedDefect` 強制、aesthetic reject |
| `find` が unrelated 箇所 match | 意図外 HTML 改変 | find に十分 context、Phase 4 で `patchCoverage.byPatchId` hit 数 ≤ 期待回数 を assert |
| Upstream 修正時 patch stale | detection 漏れ | `mismatches` を status JSON に構造化、`reviewAfter` 超過は CI 警告 (follow-up) |
| Baseline orphan 大量発生 | diff noise | Phase 4 で full regen、PR 説明 template、新規 0 gate |
| Idempotency 壊れ | 無限ループ相当 | test で `apply ∘ apply = apply` を全 patch × 全 target slug で assert |
| Patch 数増加で maintenance 負荷 | 原則劣化 | upstream tracker で Tricentis 報告追跡、6 ヶ月超過 review、removal SOP |
| `preprocessEnHtml` signature 変更で既存 caller 破損 | build 失敗 | `options = {}` optional default、既存 `preprocessEnHtml(html)` 互換 |
| `source_parity_source_usability.mjs` が raw 渡し必要な場合 | option I 前提壊れ | Phase 3 で検証、必要なら usability だけ raw を保持する path を明記 |
| Cascade (`section-structure-mismatch`) 消えない | floor 達成不可 | acceptance は range -13 ≤ Δ ≤ -7、cascade が構造 fingerprint を変えない場合は follow-up wave |

## 8. Alternatives Considered

| 案 | 却下 |
|---|---|
| Worker HTML コメント (α) | Covert 4th lane |
| Literal mirror | Case 2 公開品質放棄 |
| Tactical global regex | CLI 用語衝突、whack-a-mole |
| Tokenizer code-mark (X) | recall 劣化 |
| Structure-only (Y) | goal 矛盾 |
| Snapshot 焼き込み patch | upstream 検知機構破壊 |

## 9. Rollback Plan

1. `EN_SOURCE_PATCHES = Object.freeze([])` で全 patch no-op
2. Bundle 1 rework git revert (最終手段)
3. `parity-baseline.json` を `git checkout main -- parity-baseline.json`
4. `SOURCE_EN_PATCHES_DISABLED=1` env で applier が raw return

## 10. Traceability

- Plan: `docs/superpowers/plans/2026-04-17-en-source-patches-layer.md`
- Upstream tracker: `docs/superpowers/specs/upstream-defect-tracker.md`
- Memory: `feedback_baseline_zero_increase.md` 精密化
- PR template: PARITY_GUIDE §patch 運用
- M2 plan ref: `docs/superpowers/plans/2026-04-16-m2-parity-burndown.md`
- Tricentis abolition branch: `claude/m2-tricentis-legal-abolition` (prerequisite)
