# Parity Phase 4 — Final Goal (5 counter 0 DoD と artifact coverage 契約)

- **Date**: 2026-04-14
- **Author**: Claude (design)
- **親 spec**: `docs/superpowers/specs/2026-04-14-parity-burndown-roadmap.md` §5
- **実装 plan**: `docs/superpowers/plans/2026-04-14-parity-phase4-schema-cleanup.md`
- **Phase 0 契約**: `docs/superpowers/specs/2026-04-14-parity-oracle-contract-design.md`

---

## 1. 目的

Phase 4 完了時の **最終状態 (Final DoD)** を「5 つの counter がすべて 0」で定義し、測定方法と runtime の検出分類 (3 枠) の責務を確定させる。burn-down 完了以降の定常運用 (バグ検知 ≡ 失敗 gate) は、この契約に従って CI と人手レビューが同じ基準を参照できることを保証する。

本 spec は **docs 面の single source of truth**。runtime 側の具体値 (slug / token) は code に置き、docs からは「どこを truth source として見るか」を指示するのみ。

---

## 2. 5 counter 0 DoD (測定根拠)

Phase 4 完了時、以下の 5 つの field はすべて 0 でなければならない。測定は機械判定。

| # | counter | 参照 JSON | field path | 期待値 |
|---|---|---|---|---|
| 1 | baseline entries | `parity-baseline.json` | `entries.length` | `0` |
| 2 | reportable active files | `parity-check-status.json` | `summary.reportableActiveFiles` | `0` |
| 3 | baselined issues | `parity-check-status.json` | `summary.baselinedIssues` | `0` |
| 4 | advisory queue issues | `parity-check-status.json` | `summary.advisoryQueueIssues` | `0` |
| 5 | audit signal issues | `parity-check-status.json` | `summary.auditSignalIssues` | `0` |

さらに補助不変量として:

| 不変量 | 参照 | 期待値 |
|---|---|---|
| baseline schema | `parity-baseline.json` | `schemaVersion === 2` |
| snapshot diff — 変更 | `snapshot-diff-status.json` | `summary.changed === 0` |
| snapshot diff — 追加 | `snapshot-diff-status.json` | `summary.added === 0` |
| snapshot diff — 削除 | `snapshot-diff-status.json` | `summary.removed === 0` |
| artifact coverage shape | `parity-check-status.json` | `debug.artifactCoverage` が `{ registryEntries, matchedHits, bySlug, byToken }` を持つ |

### 測定

- `npm run check:parity` が `parity-baseline.json` / `parity-check-status.json` を書き出す
- `npm run check:snapshots:diff` が `snapshot-diff-status.json` を書き出す
- CI は 5 counter と補助不変量を JSON から直接読み、ひとつでも非 0 / shape 不一致なら fail

---

## 3. Schema v2 (baseline entry の最終形)

`schemaVersion = 2` の loader は v1 entry を排他的に拒否する (migration は Task 4.6 の一度きり)。

### entry fields

- **削除**: `reviewAfter` / `inconclusiveCategory` / `inconclusiveReason` / `usabilityReason`
- **追加**: `priority` (`high` / `medium` / `low`, default=`medium`) / `note` (optional, max 500 chars)
- root `schemaVersion = 2`

### `BASELINE_ELIGIBLE_TYPES` (v2, 7 種)

```
segment-missing, segment-extra, segment-shifted,
segment-untranslated, segment-token-gap,
section-structure-mismatch, segment-order-mismatch
```

(`segment-inconclusive` は v2 で baseline 対象外 — advisory-residual 枠で吸収する。runtime issue 側には残る)

### `TYPES_ARG_ALLOWLIST` (v2, 2 種)

```
section-structure-mismatch, segment-order-mismatch
```

### `isFrozenByBaseline` (v2)

`issue.baselined === true` のみ。`baselineExpired` / `reviewAfter` 参照はすべて撤去。

---

## 4. Runtime 検出 3 枠 (責務分離)

runtime (`check_source_parity.mjs` 経由) が検出する parity 差分は、以下 3 枠のいずれかに必ず分類される。どの枠が counter=0 にどう寄与するかも明記する。

### 4.1 actionable-baseline

- **定義**: 実コンテンツの parity bug (翻訳・構造・token 抜け)。baseline entry として登録され、修正対象。
- **DoD 時の状態**: Phase 4 完了時に **entries.length === 0**。したがって `summary.baselinedIssues === 0` が連動して満たされる。
- **測定**: `parity-baseline.json.entries[]` にすべてここから流入。

### 4.2 parity-artifact-registry

- **定義**: EN 側の不可解な残置物 (壊れたリンク、demo link など、翻訳でも normalizer でも直らないもの) を **slug-scope の static registry** で抑止する。runtime は該当 (slug, token) をマッチしたら issue を emit せず `coverage.record()` を叩く。
- **Truth source**: `scripts/lib/parity_artifact_registry.mjs` の `ARTIFACT_REGISTRY` 定数 (entry は `{ slugs, token, reason, expectedIssueType, addedAt, linkedIssue? }` の frozen record)。
- **DoD 時の状態**: baseline には登録しない。registry 抑止は `debug.artifactCoverage.matchedHits` に加算され、通過実績が可観測。
- **docs に slug / token を書かない**: 「追加・削除時は `ARTIFACT_REGISTRY` を更新する」とだけ docs に書く (本 spec 含む)。

### 4.3 advisory-residual

- **定義**: alignment が確信を持てず判断保留にした issue (`segment-inconclusive`)。baseline にも artifact registry にも該当しない、自動判定の限界ケース。
- **DoD 時の状態**: Phase 4 完了時に **全件解消** する方針 (翻訳 or alignment 改善 or artifact 昇格のいずれか)。`summary.advisoryQueueIssues === 0` で measure。
- **注意**: baseline entry schema には `inconclusiveReason` / `inconclusiveCategory` を持たない。runtime issue 側にのみ存在する (v2 spec)。

### 3 枠と counter の対応

```
actionable-baseline         → summary.baselinedIssues
parity-artifact-registry    → debug.artifactCoverage.matchedHits (baseline には流さない)
advisory-residual           → summary.advisoryQueueIssues
reportable / audit signal   → 上記の複合 (いずれか > 0 なら非 0)
```

---

## 5. `debug.artifactCoverage` 契約 (runtime aggregate)

artifact registry の抑止が **どの run で何件効いたか** を traceable にするための、`parity-check-status.json` 上の専用 debug field。

### shape (固定)

```
status.debug.artifactCoverage = {
  registryEntries: <number>,  // ARTIFACT_REGISTRY.length (静的)
  matchedHits:     <number>,  // 当該 run で registry 抑止が発火した延べ件数
  bySlug:          <object>,  // { [slug]: hitCount, ... }
  byToken:         <object>,  // { [token]: hitCount, ... }
}
```

### 生成主体

- `scripts/lib/parity_artifact_registry.mjs` の `createArtifactCoverage()` が runtime aggregator を返す (`record({ slug, token, reason })` / `snapshot()`)
- `scripts/lib/source_parity_align.mjs` の `alignSegments(enSections, jaSections, { slug, coverage })` が抑止時に `coverage.record()` を叩く
- `scripts/check_source_parity.mjs` が `status.debug.artifactCoverage = coverage.snapshot()` を書き出す (新 module は作らない)

### CI / 人が読むときの規範

- shape assertion (4 field の存在と型) は gate。`matchedHits` の絶対値は参考値。
- registry に新 entry を加えると `registryEntries` が増える。
- ある slug / token の `bySlug` / `byToken` が期待に反して 0 なら、**抑止対象が実在しない** (= registry entry が stale) か、runtime 側の配線不備を疑う。

---

## 6. `debug.maskCoverage` との分離 (Phase 0 契約再掲)

`debug.maskCoverage` は **glossary / invariant mask** 専用の runtime observability で、Phase 0 で導入済み。`debug.artifactCoverage` とは **別責務・別 field** として独立に存続する。

| field | 対象 | 生成 |
|---|---|---|
| `debug.maskCoverage` | glossary mask + invariant token mask の適用統計 | Phase 0 で整備済み (mask 層) |
| `debug.artifactCoverage` | EN-side artifact registry の抑止統計 | Phase 4 Task 4.2 で新設 (registry 層) |

artifact registry の抑止を mask 層に混ぜない。mask は segment text を書き換えるが、artifact registry は segment 判定結果を **間引く** 層であり、責務が異なる。

---

## 7. Intentional Divergence (turndown singleton 非侵襲)

EN / JA で意図的に構造が異なる page (例: EN の `<blockquote>` warning 風 callout を JA で `<div class="callout-note">` に書いている、といった kind-level のズレ) は、**HTML extractor の slug allow-list 限定 rule** で吸収する。

- **場所**: `scripts/lib/source_parity_segments_en.mjs` の `preprocessHtml(html, options)` / `extractSegmentsFromHtml(html, options)` が `{ slug, calloutAllowSlugs }` を受け取り、allow list に入る slug のときだけ EN 側 HTML を書き換える
- **turndown singleton は触らない**: turndown の global replacement rule を変更すると全 slug に副作用が及ぶため、必ず HTML extractor 層 (preprocess) に封じ込める
- **page-level exclusion (`source_sync_exclusions.mjs`) との違い**: exclusion は壊れた EN page を snapshot 同期から **丸ごと lock** するための別機能。artifact 抑止 / intentional divergence 正規化とは責務が異なる

### page-level exclusion

- `scripts/lib/source_sync_exclusions.mjs` の registry で壊れた EN page を隔離し、snapshot 上書きを抑止する (詳細は `docs/DOCS_DATE_TRACKING.md`)
- `source-sync-status.json.excludedPages` counter で可視化
- **artifact 抑止 (§4.2) や callout-normalization (§8) と混ぜない**: 対象も層も目的も異なる

---

## 8. callout-normalization (parity HTML extractor 限定正規化)

EN snapshot の warning-like な短い `<blockquote>` は、slug allow list に含まれる場合に限り `<div class="callout-note">` に書き換え、JA 側 callout と kind-level parity を保つ。

**allow list の single source of truth:** `scripts/lib/source_parity_segments_en.mjs` の `CALLOUT_NORMALIZATION_SLUGS` 定数。slug を追加 / 削除する際はこの定数を更新する (docs を先に書かない)。

- 値 (slug list) を本 spec に書かない。code 側と二重管理になると stale の発生源になる。
- 運用ドキュメント (`docs/PARITY_GUIDE.md` 等) からもこの定数を truth source として参照する。

---

## 9. Non-goals / 書かないこと

本 spec には以下を書かない。truth source は code に置く:

- `ARTIFACT_REGISTRY` の具体的な slug / token 値
- `CALLOUT_NORMALIZATION_SLUGS` の具体的な slug 値
- `BASELINE_ELIGIBLE_TYPES` の将来拡張案 (7 種固定)
- Phase 4 完了後の hypothetical な拡張機能

これらが必要になったら、先に code / plan を更新し、本 spec はあくまで契約 (何をどこで真とするか) のみを保持する。
