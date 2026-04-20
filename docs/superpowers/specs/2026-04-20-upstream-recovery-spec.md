# Upstream Recovery Detection — Spec (Phase A)

**Status:** implemented (Phase A landed 2026-04-20)
**Plan:** `docs/superpowers/plans/2026-04-20-upstream-recovery-detection.md`
**Entry point:** `scripts/check_upstream_recovery.mjs` / `npm run check:upstream-recovery`

---

## Purpose

`en_source_patches` (segment-level) と `source_sync_exclusions` (page-level) は
どちらも EN 上流欠陥を JA 側に mirror させず吸収する 2-mechanism。上流修正が入っても
registry に entry が残ったままだと "stale debt" になり、未 paydown のまま人目に触れずに
蓄積してしまう。

本 spec の `upstream-recovery-status.json` は、両 registry を横断して
**(A) 上流修正の自動検知** と **(B) 登録解除忘れの persistent reminder** を単一の
derived view にまとめるための JSON schema を定める。

## 設計原則

- **既存信号の integration + expansion のみ**。新 detector / issue type / workflow は追加しない
- **Non-blocking**: `check_upstream_recovery.mjs` は常に exit 0。consumer が JSON を読んで判断する
- **Fail-safe**: `source-sync-status.json` 不在時は `statusA: 'unknown'` (graceful degradation)
- **parity gate の挙動を変更しない**。`check_source_parity.mjs` / `scripts/lib/parity_*.mjs` は touch しない
- 将来 Pattern D (unified debt catalog) への bridge として設計 (plan Appendix B)

## Entry 状態遷移

```
  [registered] → [active] → [stale (upstream fixed)] → [removed (human action)]
                    ↑            │
                    └────────────┘  (upstream regresses — 稀)
```

- `active`: patch/exclusion の `find` or `expectedIssueType` が依然として EN に存在
- `stale`: EN から消えた (上流修正済)。このまま放置すると registry cruft → Axis B が警告
- `unknown`: snapshot fetch failure / source-sync-status.json 不在 等で判定不能 — fail-safe (表示のみ)

## JSON Schema

```jsonc
{
  "schemaVersion": 1,
  "generatedAt": "ISO-8601 UTC timestamp",
  "summary": {
    "totalEntries": 35,             // en_patches (34) + sync_exclusions (1)
    "activeEntries": 34,            // statusA === 'active'
    "staleEntries": 0,              // statusA === 'stale' (Axis A signal)
    "overdueEntries": 0,            // statusB === 'overdue' (Axis B signal)
    "unknownEntries": 1             // statusA === 'unknown'
  },
  "mechanisms": {
    "en_source_patches": [
      {
        "id": "UD-001A-dash-this-typo-plain",
        "mechanism": "en_source_patches",
        "slugs": ["salesforce-testing/.../sfdc-step-create", ...],
        "statusA": "active",        // 'active' | 'stale' | 'unknown'
        "statusB": "current",       // 'current' | 'overdue'
        "hits": 1,
        "addedAt": "2026-04-17",
        "reviewAfter": "2026-10-17",
        "daysUntilReview": 180
      }
    ],
    "source_sync_exclusions": [
      {
        "slug": "testops/testops-version-control/pull-requests",
        "mechanism": "source_sync_exclusions",
        "statusA": "unknown",       // local dev にて source-sync-status.json 不在
        "statusB": "current",
        "fetchStatus": "unknown",   // 'excluded-broken' | 'excluded-recovered' | 'unknown'
        "addedAt": "2026-04-09",
        "reviewAfter": "2026-10-09",
        "daysUntilReview": 172
      }
    ]
  }
}
```

## 判定ロジック

### Axis A (upstream 修正検知)

**en_source_patches:**
- 各 slug について snapshot を読み `preprocessEnHtml(raw, { slug, patchCoverage })` を呼ぶ
- `coverage.snapshot().byPatchIdStatus[id]` の `matched` が true → `active`
- `matched === false` かつ snapshot が読めた slug が 1 つ以上 → `stale`
- registered slug のどの snapshot も読めなかった → `unknown`

**source_sync_exclusions:**
- `source-sync-status.json.pages[].fetchStatus` を per-slug で lookup
- `fetchStatus === 'excluded-recovered'` → `stale`
- `fetchStatus === 'excluded-broken'` → `active`
- それ以外 (`unknown` / file 不在) → `unknown`

### Axis B (登録解除忘れ)

両 mechanism 共通:
- `reviewAfter` 文字列 (YYYY-MM-DD) を `new Date().getTime()` で比較
- 現在時刻が `reviewAfter` を過ぎていれば `overdue`、そうでなければ `current`
- `reviewAfter` が無い / 不正なら `current` (fail-safe)

## Graceful degradation

- `source-sync-status.json` 不在: sync_exclusions 全 entry が `statusA: 'unknown'` になる。
  `check_upstream_recovery.mjs` は exit 0 で続行。consumer (sticky PR comment / detection_reports)
  は unknown を stale と区別して扱う
- snapshot file 不在: 当該 slug に登録された patch は、他 slug で hit しなければ `stale` ではなく `unknown`
- `preprocessEnHtml` 例外: 該当 slug をスキップして警告を stderr に書き、run 全体は続行

## Consumer integration (Phase B)

詳細は `docs/superpowers/plans/2026-04-20-upstream-recovery-detection.md §Task 4` / Phase B。
要約:

- `scripts/lib/detection_reports.mjs` が `upstream-recovery-status.json` を読み、
  `sourceSyncHealth` family 内に `enPatchRecovery` / `sourceSyncRecovery` section を追加
- 既存 `scheduled-actionable.yml` が artifact upload list に `upstream-recovery-status.json` を追加
- PR-triggered workflow が sticky PR comment を hidden marker `<!-- upstream-recovery: sticky -->`
  で idempotent に upsert

Phase A の時点では JSON output が生成されるのみで、consumer 側の statement / UI は
Phase B で入る。

## テスト

- `scripts/__tests__/en_source_patches.test.mjs` — `byPatchIdStatus` が全 34 patch IDs を
  enumerate (hit 無しでも `{matched: false, hits: 0}`)
- `scripts/__tests__/en_source_patches_integration.test.mjs` — 全 34 patches の
  stale detection (non-gating warning mode)
- `scripts/__tests__/source_parity_source_side_debt.test.mjs` — `reviewAfter` shape pin
- `scripts/__tests__/check_upstream_recovery.test.mjs` — aggregator unit tests
  (status transitions / missing artifacts / Axis A × Axis B matrix)
