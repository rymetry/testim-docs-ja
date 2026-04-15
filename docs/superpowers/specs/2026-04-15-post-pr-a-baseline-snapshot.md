# Post-PR A Baseline Anchor Snapshot (2026-04-15)

PR #270 (Phase 4 PR A — pre-cutover mechanism infrastructure) merge 直後の基準値固定。Stage B1–B6 および PR Z の進捗比較の anchor として使う。

## 1. 役割

- mechanism 導入後 (artifact registry / URL normalizer / HTML extractor) の baseline / parity / snapshot の**新基準値**を固定する
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

| Field | 現状 (2026-04-15 post-PR A) | DoD 目標 | Δ |
|---|---:|---:|---|
| `parity-baseline.json.entries.length` | **1863** | 0 | −1863 要 |
| `parity-check-status.summary.reportableActiveFiles` | **0** | 0 | ✅ 達成 |
| `parity-check-status.summary.baselinedIssues` | **1863** | 0 | −1863 要 |
| `parity-check-status.summary.advisoryQueueIssues` | **6** | 0 | −6 要 |
| `parity-check-status.summary.auditSignalIssues` | **9** | 0 | −9 要 |
| `snapshot-diff-status.summary.changed` | **0** | 0 | ✅ 達成 |
| `snapshot-diff-status.summary.added` | **0** | 0 | ✅ 達成 |
| `snapshot-diff-status.summary.removed` | **0** | 0 | ✅ 達成 |

**観測事実:** snapshot-diff / reportableActiveFiles の 4 field は anchor 時点で DoD 満足。残る 4 field (baselined / advisoryQueue / auditSignal + 1 derived entries.length) を Stage B / PR Z で burn down する。

## 4. DoD 非含有 field (明示除外)

以下は DoD に含めない。PR Z 判定で評価しない:

- `baselineExpired` — schema v2 cutover で概念自体を削除
- `acknowledged` / `non-blocking` — baseline/advisory/audit と別概念 (必要なら別途定義)
- `audit manifest` — 派生物。一次判定は `auditSignalIssues` と snapshot-diff
- `debug.artifactCoverage` — checker が artifact を吸収した証跡 (非ゼロは正常動作)

## 5. Baseline byIssueType (post-regen)

`parity-baseline.json.entries` 1863 件の内訳 (DoD 対象):

| issueType | count | burn-down stage | 備考 |
|---|---:|---|---|
| segment-untranslated | 1571 | **B1** | 最優先。LLM pipeline で slug bundle 単位 burn-down |
| segment-missing | 106 | **B2** | EN 側 segment の JA 側欠落補完 |
| segment-extra | 86 | **B3** | JA 側余剰 segment 削除 or callout 統合 |
| section-structure-mismatch | 55 | **B4** | 見出し階層 / section 区切り是正 |
| segment-token-gap | 33 | **B5** | artifact registry / URL normalizer 追加 or content 修正 |
| segment-inconclusive | 11 | **B6** | alignment tie 解消 (wording / narrow rule / registry 昇格) |
| segment-order-mismatch | 1 | **B6** | 順序整合修正 |
| **合計** | **1863** | | |

### inconclusiveCategory 内訳 (segment-inconclusive 11 件)

| category | count | 備考 |
|---|---:|---|
| tokenless-near-tie | 6 | advisoryQueueIssues 側と同一 6 件を指す |
| heading-count-mismatch | 5 | |

## 6. 5-Bucket Residual Inventory (post-PR A)

| bucket | count | 備考 |
|---|---:|---|
| actionable | 1851 | Stage B1–B4 / B6 の burn-down 対象 |
| artifactCandidates | **0** | PR A Task 4.2 artifact registry で 7 件吸収済 |
| normalizerCandidates | 1 | `/v2.0/docs/scheduler#integrating-scheduler-with-slack` 1 件 (Task 4.3 narrow rule 追加 or content 修正 / Stage B5) |
| intentionalDivergenceCandidates | **0** | PR A Task 4.4 preprocessHtml で 3 件吸収済 (`administration/api-access`) |
| advisoryResidual | 11 | Stage B6 |
| **合計** | **1863** | |

PR A 効果: artifact 7 + intentional 3 = **10 件を mechanism で自動吸収**し baseline から orphan 化 (plan 予測と一致)。

## 7. Audit Signal Gap (⚠ Stage B plan 対象外)

`auditSignalIssues = 9` は DoD 対象だが、現行 Stage B1–B6 の scope に入っていない。以下 3 種:

| issueType | count | 備考 |
|---|---:|---|
| paragraph-count-mismatch | 6 | coarse heuristic。Stage B2 (missing) / B3 (extra) 消化で副次的に 0 化する可能性あり |
| step-count-mismatch | 2 | 同上 |
| table-shape-mismatch | 1 | 表構造不一致。個別対応 |

**判断:** Stage B2–B4 完了後に audit-signal 残 0 でなければ、**Stage B7 (audit-signal 残)** を bulk-remediation plan に追加する。PR Z 着手条件には含めない (entry criteria は issueType ベースに限定)。PR Z 完了時点の DoD `auditSignalIssues === 0` は PR Z スコープで解消する (必要なら Stage B7 を先に実施)。

## 8. Run metadata

- `checkedAt`: 2026-04-15T10:39:44.524Z
- `sourceSyncRunId`: 2026-04-15T10:38:17.001Z#fe94f10a
- `snapshotDiffRunId`: 2026-04-15T10:39:12.453Z#snapshot-diff-6681c397ef5f
- `sourceInventoryFingerprint`: sha256:a652fe329eced856807c7e223d5bbcd2ee33aa546683487d2e0b537eac55d2f9
- `totalFiles`: 288 (287 fetched + 1 source-side debt excluded)
- `baselinedFiles`: 228

## 9. 参照

- Phase 4 plan (Rev 7 / PR Z contract): [2026-04-14-parity-phase4-schema-cleanup.md](../plans/2026-04-14-parity-phase4-schema-cleanup.md)
- Bulk remediation plan (Rev 7 entry criteria): [2026-04-15-parity-bulk-remediation.md](../plans/2026-04-15-parity-bulk-remediation.md)
- Residual inventory (post-PR A): [2026-04-15-post-pr-a-residual-inventory.json](./2026-04-15-post-pr-a-residual-inventory.json) / [.md](./2026-04-15-post-pr-a-residual-inventory.md)
- PR A merge: [PR #270 / 683c7fd](https://github.com/rymetry/testim-docs-ja/pull/270)
