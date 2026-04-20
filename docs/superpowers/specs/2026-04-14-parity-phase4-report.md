# Parity Phase 4 — Final Cutover Report (PR Z)

**Generated:** 2026-04-20
**Branch:** `claude/pr-z-schema-v2-cutover`
**Plan reference:** `docs/superpowers/plans/2026-04-14-parity-phase4-schema-cleanup.md` (Rev 7)

---

## 完了条件 (all true)

- [x] `parity-baseline.json.entries.length = 0`
- [x] `parity-baseline.json.schemaVersion = 2`
- [x] `parity-check-status.summary.reportableActiveFiles = 0`
- [x] `parity-check-status.summary.baselinedIssues = 0`
- [x] `parity-check-status.summary.advisoryQueueIssues = 0`
- [x] `parity-check-status.summary.auditSignalIssues = 0`
- [x] `parity-check-status.debug.artifactCoverage` shape OK (`{ registryEntries, matchedHits, bySlug, byToken }`)
- [x] `parity-check-status.debug.baselineSchemaVersion = 2`
- [x] `snapshot-diff-status.summary.{changed, added, removed} = 0`
- [x] `npm run test` green (2150 pass / 0 fail / 1 skip)
- [x] `npm run lint` green (0 errors / 0 warnings in 288 files)
- [x] `npm run build` green (290 pages built)
- [x] `alignSegments()` call-site leak scan: 0 (全 runtime + test call が `{ slug }` option 付き)
- [x] deprecated field scope grep clean — baseline 側の `reviewAfter` / `baselineReviewAfter` / `baselineExpired` は全撤去 (en_source_patches / acknowledgements 側は別 schema として保持)

---

## 削減結果

| Metric | Phase 4 cutover 前 | Phase 4 完了後 (PR Z) |
|---|---|---|
| `parity-baseline.json.entries.length` | 14 (M2.5-C 開始時) | **0** |
| `parity-baseline.json.schemaVersion` | 1 | **2** |
| `reportableActiveFiles` | > 0 | **0** |
| `auditSignalIssues` | > 0 | **0** |
| `advisoryQueueIssues` | > 0 | **0** |
| `segment-inconclusive` (baselined) | 発生可能 | **baseline 対象外** |
| `snapshot-incomplete` / `source-unusable` (baselined) | 発生可能 | **baseline 対象外** |

---

## Schema migration (v1 → v2)

**削除 (entry fields):**
- `reviewAfter` — 期限管理を撤廃 (`priority` に置換)
- `inconclusiveReason` / `inconclusiveCategory` — runtime issue のみ保持
- `usabilityReason` — baseline 対象外になったため不要

**削除 (tagging / queue fields):**
- `baselineReviewAfter` — `tagIssuesWithBaseline()` から撤去
- `baselineExpired` / `baselineExpiringSoon` — 期限概念全廃
- `expiredBaselineEntries` / `expiringBaselineEntries30d` (summary counters) — 同

**追加 (entry fields):**
- `priority: 'high' | 'medium' | 'low'` — 必須、default `'medium'`
- `note: string | null` — 任意、max 500 chars

**追加 (status payload):**
- `debug.baselineSchemaVersion` — runtime が読んだ baseline schema を明示

**縮約 (`BASELINE_ELIGIBLE_TYPES`, 10 → 7):**
```
segment-missing, segment-extra, segment-shifted,
segment-untranslated, segment-token-gap,
section-structure-mismatch, segment-order-mismatch
```
除外: `segment-inconclusive`, `snapshot-incomplete`, `source-unusable`

**縮約 (`TYPES_ARG_ALLOWLIST`, 4 → 2):**
```
section-structure-mismatch, segment-order-mismatch
```

**契約 (schema v2):**
- `isFrozenByBaseline(issue) ≡ issue.baselined === true`
- `alignSegments()` は必ず `{ slug }` option 付きで呼ばれる (全 runtime / test call 移行済)
- `debug.artifactCoverage` は `{ registryEntries, matchedHits, bySlug, byToken }` (値は非ゼロ可)
- generator CLI は `--review-after` を reject (exit 1) — v2 では該当 field が存在しない

---

## 運用側の変更

**Baseline 運用:**
- 新規 issue を baseline に逃がす運用圧力は廃止 (`priority='high'` + 明示 PR paydown で代替)
- Phase 4 完了後は `entries.length === 0` 維持が DoD

**CI gate:**
- `reportableActiveFiles / baselinedIssues / advisoryQueueIssues / auditSignalIssues` 4 counter ＋ snapshot-diff 3 counter ＋ `baseline.entries.length` で機械判定
- 期限切れ concept が無いため "baseline refires gate" tests は撤去済

**Tooling:**
- `scripts/phase4/migrate_baseline_schema.mjs` — v1→v2 migration helper (export `migrateEntry` / `migrateBaseline`)
- `generate_parity_baseline.mjs` は v2 を出力 (`--regenerate` / `--slug` / `--types=section-structure-mismatch,segment-order-mismatch`)

---

## Checker simplification

Phase 4 で入った新機構 (既出):

- `parity_normalize`: `help.testim.io` ↔ `/docs` URL fragment 対称化
- `parity_artifact_registry`: slug-scope token + runtime coverage aggregator
- `preprocessHtml`: slug allow list 限定 `<blockquote>→<div class="callout-note">` (turndown 非侵襲)
- `alignSegments({ slug, coverage })` 化 + 全呼出移行

PR Z で追加された切り替え:

- baseline v2 validator / loader (期限関数削除 / priority/note 検証)
- generator v2 出力 + migration helper
- summary / advisory / detection_reports / status v2 対応

---

## 残タスク (本 PR の外)

1. **Phase A (`claude/upstream-recovery-phase-a`)** — PR Z 並列可 — `check_upstream_recovery.mjs` + test 拡張 + `reviewAfter` parity (sync_exclusions)
2. **Phase B (`claude/upstream-recovery-phase-b`)** — PR Z merge **後**必須 — detection_reports の `enPatchRecovery` / `sourceSyncRecovery` section + sticky PR comment + 2-mechanism lifecycle docs
3. **pull-requests.md cleanup** — 別 PR として分離 (seeded pin test との scope 混合回避)

詳細: `docs/superpowers/plans/2026-04-20-upstream-recovery-detection.md`
