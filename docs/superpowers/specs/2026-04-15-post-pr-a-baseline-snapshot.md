# Post-PR A Baseline Anchor Snapshot (2026-04-15)

PR #270 (Phase 4 PR A — pre-cutover mechanism infrastructure) merge 直後の基準値固定。Stage B1–B6 および PR Z の進捗比較の anchor として使う。

### 改訂履歴

- **Rev 1 (2026-04-15, PR #271):** PR A merge 直後の値 (1863 entries) を anchor として固定。
- **Rev 2 (2026-04-15, 本 PR):** PR #272 (glossary curated +26 term) merge 後に再計測。1863 → **1756 entries** (−107, segment-untranslated を −112 / segment-extra を +5 の alignment shift)。auditSignalIssues / advisoryQueueIssues / snapshot-diff 3 counter は不変。

## 1. 役割

- mechanism 導入後 (artifact registry / URL normalizer / HTML extractor / curated glossary) の baseline / parity / snapshot の**新基準値**を固定する
- 後続 Stage B burn-down で「どこから何件減ったか」を決定論的に比較可能にする
- 翻訳修正や追加 mechanism 修正は混ぜない (chore PR のみ)

## 2. 実行フロー

```sh
npm run check:snapshots:fetch       # EN HTML 288 pages 取得
npm run check:snapshots:diff        # snapshot-diff-status.json 生成
npm run check:parity                # parity-check-status.json 生成
node scripts/generate_parity_baseline.mjs --regenerate   # parity-baseline.json 再生成
node scripts/phase4/classify_residual.mjs > docs/superpowers/specs/2026-04-15-post-pr-a-residual-inventory.json
node scripts/phase4/render_residual_inventory.mjs docs/superpowers/specs/2026-04-15-post-pr-a-residual-inventory.json > docs/superpowers/specs/2026-04-15-post-pr-a-residual-inventory.md
```

## 3. 機械判定 DoD との現状比較

Phase 4 plan Rev 7 §最終 DoD 基準。PR Z 完了時に全 8 assertion が true を要求。

| Field | 現状 (2026-04-15 post-PR #272) | DoD 目標 | Δ |
|---|---:|---:|---|
| `parity-baseline.json.entries.length` | **1756** | 0 | −1756 要 |
| `parity-check-status.summary.reportableActiveFiles` | **0** | 0 | ✅ 達成 |
| `parity-check-status.summary.baselinedIssues` | **1756** | 0 | −1756 要 |
| `parity-check-status.summary.advisoryQueueIssues` | **6** | 0 | −6 要 |
| `parity-check-status.summary.auditSignalIssues` | **9** | 0 | −9 要 |
| `snapshot-diff-status.summary.changed` | **0** | 0 | ✅ 達成 |
| `snapshot-diff-status.summary.added` | **0** | 0 | ✅ 達成 |
| `snapshot-diff-status.summary.removed` | **0** | 0 | ✅ 達成 |

**観測事実:** snapshot-diff / reportableActiveFiles の 4 field は anchor 時点で DoD 満足。残る 4 field (baselined / advisoryQueue / auditSignal + 1 derived entries.length) を Stage B / PR Z で burn down する。Rev 2 以降 advisoryQueue / auditSignal は不変で glossary curation の影響外。

## 4. DoD 非含有 field (明示除外)

以下は DoD に含めない。PR Z 判定で評価しない:

- `baselineExpired` — schema v2 cutover で概念自体を削除
- `acknowledged` / `non-blocking` — baseline/advisory/audit と別概念 (必要なら別途定義)
- `audit manifest` — 派生物。一次判定は `auditSignalIssues` と snapshot-diff
- `debug.artifactCoverage` — checker が artifact を吸収した証跡 (非ゼロは正常動作)

## 5. Baseline byIssueType (post-regen)

`parity-baseline.json.entries` 1756 件の内訳 (DoD 対象):

| issueType | count | burn-down stage | 備考 |
|---|---:|---|---|
| segment-untranslated | 1459 | **B1** | 最優先。LLM pipeline で slug bundle 単位 burn-down (Rev 1: 1571 → Rev 2: 1459, −112) |
| segment-missing | 106 | **B2** | EN 側 segment の JA 側欠落補完 |
| segment-extra | 91 | **B3** | JA 側余剰 segment 削除 or callout 統合 (Rev 1: 86 → Rev 2: 91, +5 glossary alignment shift) |
| section-structure-mismatch | 55 | **B4** | 見出し階層 / section 区切り是正 |
| segment-token-gap | 33 | **B5** | artifact registry / URL normalizer 追加 or content 修正 |
| segment-inconclusive | 11 | **B6** | alignment tie 解消 (wording / narrow rule / registry 昇格) |
| segment-order-mismatch | 1 | **B6** | 順序整合修正 |
| **合計** | **1756** | | |

### inconclusiveCategory 内訳 (segment-inconclusive 11 件)

| category | count | 備考 |
|---|---:|---|
| tokenless-near-tie | 6 | advisoryQueueIssues 側と同一 6 件を指す |
| heading-count-mismatch | 5 | |

## 6. 5-Bucket Residual Inventory (post-PR #272)

| bucket | count | 備考 |
|---|---:|---|
| actionable | 1744 | Stage B1–B4 / B6 の burn-down 対象 (Rev 1: 1851 → Rev 2: 1744, −107) |
| artifactCandidates | **0** | PR A Task 4.2 artifact registry で 7 件吸収済 |
| normalizerCandidates | 1 | `/v2.0/docs/scheduler#integrating-scheduler-with-slack` 1 件 (Task 4.3 narrow rule 追加 or content 修正 / Stage B5) |
| intentionalDivergenceCandidates | **0** | PR A Task 4.4 preprocessHtml で 3 件吸収済 (`administration/api-access`) |
| advisoryResidual | 11 | Stage B6 |
| **合計** | **1756** | |

累積 mechanism 効果:
- PR A (#270): artifact 7 + intentional 3 = **10 件を mechanism で自動吸収** (1873 → 1863)
- PR #272: glossary curated 26 term 追加で `segment-untranslated` を −112 (alignment shift +5 extra を差引いて net **−107**) (1863 → 1756)

## 7. Audit Signal Gap (Stage B1–B6 scope 外 / §10.5 B7 gate で処理)

`auditSignalIssues = 9` は Rev 7 DoD の測定対象 (`=== 0` 要求) だが、現行 Stage B1–B6 の直接 scope には入っていない。PR #272 glossary curation では不変。以下 3 種:

| issueType | count | 備考 |
|---|---:|---|
| paragraph-count-mismatch | 6 | coarse heuristic。Stage B2 (missing) / B3 (extra) 消化で副次的に 0 化する可能性あり |
| step-count-mismatch | 2 | 同上 |
| table-shape-mismatch | 1 | 表構造不一致。個別対応 |

**運用 (bulk-remediation plan §10.5 と整合):**

1. Stage B4 完了直後に `npm run check:parity` を再実行し `auditSignalIssues` を再計測する
2. 0 なら gate 通過、Stage B5 / B6 へ進む
3. 非ゼロなら **Stage B7 (audit-signal 残) を条件付き起票** し、完了してから Stage B5 / B6 / PR Z へ進む

PR Z は **final cutover 専用**に保つため、audit-signal の DoD 未達 (`auditSignalIssues > 0`) を抱えたまま PR Z へ入れない。PR Z entry criteria (bulk-remediation plan §10 必須条件 (b)) に `auditSignalIssues === 0` が含まれる。

## 8. Run metadata (Rev 2 / post-PR #272)

- `checkedAt`: 2026-04-15T12:07:18.705Z
- `sourceSyncRunId`: 2026-04-15T12:07:00.061Z (snapshot fetch re-run)
- `snapshotDiffRunId`: 2026-04-15 post-glossary diff (288 unchanged, 0 changed/added/removed)
- `totalFiles`: 288 (287 fetched + 1 source-side debt excluded)
- `baselinedFiles`: 222 (Rev 1: 228, −6 files fully resolved by glossary)

## 9. 参照

- Phase 4 plan (Rev 7 / PR Z contract): [2026-04-14-parity-phase4-schema-cleanup.md](../plans/2026-04-14-parity-phase4-schema-cleanup.md)
- Bulk remediation plan (Rev 7 entry criteria): [2026-04-15-parity-bulk-remediation.md](../plans/2026-04-15-parity-bulk-remediation.md)
- Residual inventory (post-PR #272): [2026-04-15-post-pr-a-residual-inventory.json](./2026-04-15-post-pr-a-residual-inventory.json) / [.md](./2026-04-15-post-pr-a-residual-inventory.md)
- PR A merge: [PR #270 / 683c7fd](https://github.com/rymetry/testim-docs-ja/pull/270)
- PR A anchor (Rev 1): [PR #271 / 0ced02d](https://github.com/rymetry/testim-docs-ja/pull/271)
- Glossary curation merge (Rev 2 trigger): [PR #272 / 18e22a6](https://github.com/rymetry/testim-docs-ja/pull/272)
