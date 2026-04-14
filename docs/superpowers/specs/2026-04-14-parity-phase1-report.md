# Parity Phase 1 — 頻出パターン Burn-down Report

- **Date**: 2026-04-14
- **Plan**: `docs/superpowers/plans/2026-04-14-parity-phase1-pattern-burndown.md`
- **Roadmap**: `docs/superpowers/specs/2026-04-14-parity-burndown-roadmap.md`
- **Phase 0 Report**: `docs/superpowers/specs/2026-04-14-parity-oracle-phase0-report.md`
- **Execution method**: superpowers:subagent-driven-development (implementer + spec reviewer + code quality reviewer の 2 段レビュー、sonnet4.6 model)
- **PR**: 1 PR (#266) に 3 sub-phase を集約。plan の「3 並列 worktree / 3 PR」想定とは異なり、単一 worktree (`giggly-moseying-flamingo`) で sub-phase を順次実行。ユーザ判断により Phase 1.2 / 1.3 も同 worktree 継続 (baseline 再生成競合回避と運用簡素化のため)

---

## 削減結果

| 種別 | Phase 0 後 (2337) | Phase 1 後 (2259) | 差 |
| --- | ---: | ---: | ---: |
| segment-extra (preface) | 35 | 23 | **-12** |
| segment-extra (section: paragraph) | 20 | 25 | +5 |
| segment-extra (section: unordered-list-item) | 47 | 28 | **-19** |
| segment-extra (section: ordered-list-item) | 14 | 11 | **-3** |
| segment-extra (section: callout-body) | 17 | 17 | 0 |
| segment-extra (section: table-cell) | 13 | 17 | +4 |
| segment-extra (section: details-summary) | 4 | 4 | 0 |
| **segment-extra 合計** | **150** | **102** | **-48** |
| section-structure-mismatch | 86 | 66 | **-20** |
| segment-missing | 136 | 127 | -9 |
| segment-untranslated | 1904 | 1903 | -1 |
| segment-token-gap | 49 | 49 | 0 |
| segment-inconclusive | 11 | 11 | 0 |
| segment-order-mismatch | 1 | 1 | 0 |
| **baseline total** | **2337** | **2259** | **-78** |

> 注: section paragraph と table-cell の僅増は、preface / list 修正で構造境界が変わったことによる再分類 (同一 slug 内でカウント先が `paragraph` / `table-cell` に移動)。正味では segment-extra -48 と section-structure-mismatch -20 が達成された。

---

## Sub-phase 別

### Phase 1.1 — preface 重複削除

- **Target 実測:** preface segment-extra 35 件 / 22 slug (enumerate 実測: HIT 1 / REVIEW 21 / MISS 0)
- **Scope 調整:** controller 判断で preface 領域の「EN 1 段落 → JA 2+ 段落分離」の結合も Phase 1.1 に吸収 (当初は Phase 1.2 予定)。理由: 実測で preface 領域に両パターンが混在するため境界を引くメリットが少ない
- **修正:** 8 slug / 8 修正
  - 削除 (JA-only preface echo): `administration/project-settings`、`overview/testim-overview`
  - 結合 (EN 1 段落 → JA 2+ 段落): `debugging-tests/debugging-controls`、`editing-tests/generating-a-date`、`editing-tests/search-within-a-test`、`advanced-editing/wait-for`、`running-tests/configuration-file-run-hooks`、`editing-tests/generating-a-random-value`
- **enumerate script:** `scripts/phase1/enumerate_preface_duplicates.mjs` (190 lines)
- **Commits:** `de4544b` (enumerate) → `c9e5947` (baseline) — 計 7 commits
- **削減 (自 phase):** preface segment-extra 35 → 28 (-7)、他 phase での派生影響込みで Phase 1 全体では 35 → 23 (-12)

### Phase 1.2 — section-internal 手順導入文の段落結合

- **Target 実測:** section-internal paragraph segment-extra 20 件
- **Scope:** section-internal 限定 (preface 領域は Phase 1.1 で吸収済)
- **修正:** 1 slug (`administration/project-settings`) / 3 merges (Project Name / Default Base URL / Hidden Parameters セクション)
- **形式:** `前段落平叙文 → **XXXするには:**` (`→` 全角矢印 + 半角スペース)
- **enumerate script:** `scripts/phase1/enumerate_step_intro_split.mjs` (178 lines、cleanup 後)
- **Commits:** `8c46d5d` (enumerate) → `28e5e01` (cleanup) — 計 4 commits
- **削減 (自 phase):** section paragraph segment-extra 20 → 17 (-3)、cascading なし
- **CANDIDATE 実測:** 1 slug (3 points) のみ。NON-CANDIDATE 15 slug / 17 entries — 大半は `するには:` の前段落が heading / image / list / HTML table で prose でないため結合不可

### Phase 1.3 — callout 内番号リスト inline 化

- **Target 実測:** ul-item 47 + ol-item 14 + callout-body 17 = 78 件理論 scope
- **Scope:** `:::{type}` callout 内の list item を EN snapshot と突き合わせ、EN inline のものを JA 側でも inline 化
- **修正:** 14 slug / 16 callout
  - salesforce-steps、managing-tests-and-folders (note×2)、creating-your-first-mobile-test (info×2)、grid-management、recording-a-vmg-mobile-test、recording-a-mobile-test、debug-console-errors-access-dom、scheduler-mobile、saving-a-filtered-view、shared-steps-library、test-plans、extract-text、wait-for、conditions (ordered)
- **Data integrity fix:** `managing-tests-and-folders` の 2 番目 note callout で inline 化時に翻訳内容の欠落 (「とフォルダー」欠落 + 条件句混入) が発生。spec reviewer で検出し、`da10ddd` で回復
- **enumerate script:** `scripts/phase1/enumerate_callout_list_expansion.mjs` (315 lines、EN snapshot HTML 解析込み)
- **Commits:** `d0bcea2` (enumerate) → `e81e6fc` (data integrity fix 後 baseline) — 計 6 commits
- **削減 (自 phase):** ul-item 58→28 (-30)、ol-item 14→11 (-3)、callout-body 22→17 (-5)、segment-extra total 140→102 (-38)、structure-mismatch 81→66 (-15)

---

## 残件と Phase 2 へのインプット

### segment-extra 残 102 件の内訳 (Phase 1 後)

| segmentKind | 件数 | Phase 2+ の扱い |
| --- | ---: | --- |
| unordered-list-item | 28 | NO-CALLOUT-LIST (callout 外) 29 slug — Phase 2 手動修正対象 |
| paragraph | 25 | `するには:` 以外の prose pattern 分離、Phase 2 個別対応 |
| table-cell | 17 | テーブル行差異、Phase 2 手動修正 |
| callout-body | 17 | JA-only 追加 callout、Phase 3 (JA 独自 callout 削除) 対象 |
| ordered-list-item | 11 | 番号付きリスト差異、Phase 2 手動修正 |
| details-summary | 4 | `<details>` 内タイトル差異、Phase 2 手動修正 |

### Phase 1 で REVIEW 除外 (手動判定で非対象と判定)

**Phase 1.1 (14 slug、gap fix 後):** callout-body / table-cell / list item の構造差異で単純削除不可、EN 対応コンテンツの位置ずれ、sfdc-step-* など。具体的には `advanced-editing/cookies`、`advanced-editing/parameters/passing-parameters-from-excel-file`、`advanced-editing/validations/pixel-validation-and-pixel-wait-for`、`advanced-editing/validations/wait-for-element-visualization`、`editing-tests/conditions/advanced-conditions-settings`、`guides/keyboard-shortcuts`、`integrations/grid-management` (Phase 1.3 で別 callout に触れたが preface は保留)、`recording-tests/recording-a-mobile-test` (同上)、`salesforce-testing/create-a-salesforce-test/use-agentic-test-automation-for-salesforce`、`sfdc-step-create`、`sfdc-step-edit`、`sfdc-step-relatedlistaction`、`sfdc-step-validate`、`testops/insights/reports` — いずれも Phase 2 以降で個別対応

**Phase 1.2 (15 slug / 17 entries):** `するには:` の前段落が prose 以外 (heading / image / HTML table / list / callout)。別パターンとして Phase 2 で扱うか、仕様上正となる構造

**Phase 1.3 (29 slug):** NO-CALLOUT-LIST — list items が callout 外で、EN も list 構造のため正。Phase 2 の翻訳内容レベル差異調整対象

### Sub-agent 遂行で得られた改善機会 (Phase 2 planning に反映推奨)

1. **enumerate script の共通化:** Phase 1.1/1.2/1.3 で `__dirname` / REPO_ROOT / baseline load / extractBodyParagraphs / isHeading・isCallout helpers が重複。Phase 2 前に `scripts/phase1/lib/baseline-utils.mjs` への抽出を推奨 (code quality reviewer 指摘)
2. **EN snapshot HTML パーサの堅牢化:** Phase 1.3 の `calloutDivRe` は lazy match で実用上は問題ないが、入れ子 `<div>` があれば誤動作する可能性。今後 Phase 2 で HTML 深堀りする際は DOM parser (例: `node-html-parser`) への置換を検討
3. **Inline 化時の data integrity 確認:** Phase 1.3 で 1 件の翻訳欠落/条件句混入が発生。構造変換時の JA 内容保持を確実にするため、spec reviewer で必ず EN snapshot と 1:1 比較する workflow を維持 (今回もこれで catch)

---

## gate 状態 (Phase 1 完了時)

| gate | 状態 |
| --- | --- |
| npm run lint:docs | 0 error / 0 warning (288 files) ✅ |
| npm run test | 1722 pass / 0 fail ✅ |
| npm run check:parity | 完走、active issue 0 件 (baseline で凍結中) ✅ |
| parity-baseline.json | 2259 entries (Phase 0 比 -78) ✅ |

---

## 修正した slug 一覧 (21 ファイル)

Phase 0 マージ (`514fb3c`) 後に修正された content ファイル:

1. `administration/project-settings.md` — Phase 1.1 (preface 削除) + Phase 1.2 (3 merges)
2. `advanced-editing/extract-text.md` — Phase 1.3 callout inline
3. `advanced-editing/wait-for.md` — Phase 1.1 preface 結合 + Phase 1.3 callout inline
4. `debugging-tests/debugging-controls.md` — Phase 1.1 preface 結合
5. `editing-tests/conditions.md` — Phase 1.3 callout inline (ordered list)
6. `editing-tests/generating-a-date.md` — Phase 1.1 preface 結合
7. `editing-tests/generating-a-random-value.md` — Phase 1.1 preface 結合 (gap fix)
8. `editing-tests/search-within-a-test.md` — Phase 1.1 preface 結合
9. `getting-started/creating-your-first-mobile-test-in-testim-visual-editor.md` — Phase 1.3 callout inline ×2
10. `integrations/grid-management.md` — Phase 1.3 callout inline
11. `overview/testim-overview.md` — Phase 1.1 preface 削除 (gap fix)
12. `recording-tests/recording-a-mobile-test.md` — Phase 1.3 callout inline
13. `recording-tests/recording-a-mobile-test/recording-a-vmg-mobile-test.md` — Phase 1.3 callout inline
14. `results/test-results/debug-console-errors-access-dom.md` — Phase 1.3 callout inline
15. `running-tests/configuration-file-run-hooks.md` — Phase 1.1 preface 結合
16. `running-tests/scheduler-mobile.md` — Phase 1.3 callout inline
17. `salesforce-testing/salesforce-steps.md` — Phase 1.3 callout inline
18. `test-management/saving-a-filtered-view.md` — Phase 1.3 callout inline
19. `test-management/shared-steps-library.md` — Phase 1.3 callout inline
20. `test-management/test-list/managing-tests-and-folders.md` — Phase 1.3 callout inline ×2 + data integrity fix
21. `test-management/test-plans.md` — Phase 1.3 callout inline

---

## 次 Phase へのハンドオフ

- **Phase 2 (手動修正)** に即移行可能。Phase 0 で 1904 件 surface した segment-untranslated の大規模バッチ翻訳 + segment-missing 136 → 127 の翻訳復元が最優先
- **Phase 2.1 GLOSSARY 監査** (新規、Phase 0 report で提案) を Phase 2.2 (untranslated バッチ翻訳) の前に先行実施することで、数百件の削減が期待できる
- **Phase 3 (JA 独自 callout 削除)** は Phase 1.3 の NO-CALLOUT-LIST 29 slug と callout-body 17 件の整理で実施
- **Phase 4 (schema 簡素化)** は Phase 1-3 完了後、残 baseline の構成で要否判断
