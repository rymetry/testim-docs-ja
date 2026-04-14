# Parity Phase 2 Round 2 — Bulk Fixes Report

- **Date**: 2026-04-14
- **Branch**: `claude/parity-phase2-round2`
- **Base**: `main` (PR#267 merged)
- **Plan**: `docs/superpowers/plans/2026-04-14-parity-phase2-bulk-fixes.md`
- **Executed this round**: Phase 2.0 (glossary + untranslated) + Phase 2.4 (residual structure)
- **Dispatch mode**: 4 subagents (sonnet 4.6, isolated worktrees, background, automode)

## Baseline delta (after regen)

| issueType | Phase 2 end (round 1) | Phase 2 Round 2 | 差 |
| --- | ---: | ---: | ---: |
| segment-untranslated | 1606 | 1510 | **-96** |
| segment-extra | 91 | 83 | **-8** |
| segment-missing | 109 | 105 | **-4** |
| section-structure-mismatch | 61 | 53 | **-8** |
| segment-token-gap | 40 | 40 | 0 |
| segment-inconclusive | 11 | 11 | 0 |
| segment-order-mismatch | 1 | 1 | 0 |
| **total** | **1919** | **1803** | **-116** |

累計差 (Phase 1 終了時 2259 → Round 2 終了時 1803): **-456 / -20.2%**

## Glossary additions (Phase 2.0 scope)

追加 2 件:

- `Tricentis Mobile Agent` — configure-tricentis-mobile-agent Top slug のモバイルエージェント名
- `Virtual Mobile Grid` — virtual-mobile-grid Top slug のモバイル実行グリッド

### 検討後見送った追加

- `TTM for Jira` — `integrations/test-management-integrations/ttm-for-jira-integration` に 4 件の
  `segment-extra` regression を誘発するため除外。TTM ラベルを mask すると既存の
  segment alignment が変わり、preface / bulk-create section / callout の
  JA segment が EN にない扱いになる。Top slug への影響を事前検証した上で、
  後 round で再検討する。
- `Configuration Library` / `Configuration List` / `Default Configuration` /
  `Test Configuration` / `Setup Step` など — shared-configuration 等に
  similar regression を誘発。本 round では保留。

**教訓:** glossary 追加は Top slug の segment-extra 発生を事前シミュレーションしてから
反映する。単純な UI label の英語維持目的では **false-negative risk** (`Approve` /
`Enter` / `Tab` 系、PR#267 round 2 review 参照) に加えて **segment alignment regression**
も起きうる。

## Sub-phase summary

### Phase 2.0 (untranslated 翻訳、5 slugs)

| slug | 追加前 untranslated | 追加後 untranslated | 差 |
| --- | ---: | ---: | ---: |
| advanced-editing/hooks | 42 | 30 | -12 |
| test-management/shared-configuration | 29 | 24 | -5 |
| testops/insights/dashboard | 25 | 19 | -6 |
| security/sso-integration/azure-ad-sso-integration | 20 | 1 | -19 |
| security/sso-integration/okta-sso-integration | 18 | 0 | -18 |
| **Phase 2.0 合計** | **134** | **74** | **-60** |

**Dispatch lane:**
- P2.0-A: hooks / shared-configuration / dashboard (subagent worktree `agent-a1753390`、
  API 500 error で異常終了するも 2 commit + 1 uncommitted file を回収)
- P2.0-B: recording-a-local-mobile-test / email-validation / azure-ad-sso / okta-sso
  (subagent worktree `agent-ab764cde`、4 slug 中 SSO 2 slug を実翻訳、前 2 slug は
  baseline-covered のため変更なし)

### Phase 2.4 (structure + extra + opportunistic translate、4 slugs)

| slug | structure | extra (non-callout) | missing | untranslated |
| --- | ---: | ---: | ---: | ---: |
| advanced-editing/coding-assistant | 1 → 0 | 4 → 0 | 0 → 0 | 7 → 7 |
| advanced-editing/wait-for | 2 → 0 | 0 → 0 | 2 → 0 | 8 → 7 |
| advanced-editing/parameters/parameters-for-groups | 2 → 0 | 1 → 0 | 2 → 0 | 3 → 3 |
| salesforce-testing/salesforce-steps/sfdc-step-relatedlistaction | 3 → 0 | 3 → 0 | 0 → 0 | 13 → 13 |
| **Phase 2.4 合計** | **8 → 0** | **8 → 0** | **4 → 0** | **31 → 30** |

**修正内容:**
- `coding-assistant`: `<details>/<summary>` を flat paragraph に展開し EN の inline
  `<details>` 表記に整合
- `wait-for`: 単一 callout を 2 分割し EN の 2 note block に整合
- `parameters-for-groups`: preface 段落を EN の 2 段落構造に分割 + inline paragraph 化
- `sfdc-step-relatedlistaction`: 3 箇所の standalone `<br />` 除去 (EN にない)

### Phase 2.4 blocked (7 slugs、次 round scope)

以下 7 slug は subagent が「baseline orphan regression」を理由に修正を見送り。
現行 baseline の fingerprint マッチが部分的失効すると、baseline でカバーされていた
untranslated が active 扱いに昇格するため、**baseline 先行再生成 + 個別修正** が必要。

- `administration/project-settings` (3 structure)
- `administration/subscription-plans` (3 extra + 1 structure)
- `administration/secrets` (2 extra + 1 structure + 3 callout-body extras は Phase 3)
- `editing-tests/generating-a-random-value` (7 extra + 1 structure)
- `integrations/integrate-testim-to-your-ci/vsts-and-tfs-integration` (2 extra + 2 structure)
- `guides/keyboard-shortcuts` (4 extra table-cell + 1 structure)
- `running-tests/configuration-file-run-hooks` (2 extra + 2 structure)

## Dispatch outcome summary

| lane | slugs | commits | result |
| --- | --- | ---: | --- |
| P2.0-A | 3 (hooks, shared-cfg, dashboard) | 2 commit + 1 uncommitted | ⚠️ API 500 error、controller 側で uncommitted 回収 |
| P2.0-B | 4 (recording-local, email-val, 2×SSO) | 2 staged (commit block) | ✅ 2 slug で -37 untranslated、2 slug は baseline-only |
| P2.4-A | 5 (admin×3, sfdc, generate-random) | 1 staged (commit block) | ⚠️ 1/5 fixed、4 blocked by baseline orphan risk |
| P2.4-B | 6 (adv-editing×3, integrations, guides, run-hooks) | 3 uncommitted (commit block) | ⚠️ 3/6 fixed、3 blocked by baseline orphan risk |

**学び:**
1. subagent 側で `git commit` が tool sandbox で block されるケースがあり、controller が
   worktree から手動で回収する必要がある → 次 round では subagent prompt に
   「commit 不能ならファイル差分をそのまま残して final report で path を渡す」と明記
2. `glossary` 追加は Top slug への regression を事前確認しないと、baseline を増やす
   結果になる。追加候補を決めたら **per-slug full parity diff** で検証する
3. Phase 2.4 の未処理 7 slug は **baseline 先行再生成 lane** を次 round で切る

## Deferred

- **次 round (Phase 2 Round 3)**: Phase 2.4 blocked 7 slug (baseline 先行再生成 + 個別修正)
- **次 round**: untranslated Top 残 ~1500 を段階的に焼却 (lane を追加する)
- **Phase 3**: callout-body 17 件
- **Phase 4**: inconclusive 11 件、order-mismatch 1 件、schema cleanup

## Gates (本 PR 直前)

- [x] `npm run check:parity`: 288/288 ファイル、active actionable=0、signal-only 9 件
- [x] `npm run lint:docs`: 0 error / 0 warning
- [x] `npm run test`: 1726 pass / 0 fail
- [x] `npm run build`: 290 pages built, 8.82s
- [x] baseline 再生成: 1919 → 1803 (-116)
- [x] Phase 2.0/2.4 対象 issueType がすべて純減
- [x] `callout-body` 17 件は据え置き (Phase 3 送り)

## Next actions

1. PR 作成 → review → merge
2. Phase 2 Round 3 plan ("baseline 先行再生成 + Phase 2.4 blocked 7 slug 修正" + "Phase 2.0 untranslated 第 2 波") を起草
3. Phase 3 scope (callout-body extra 17 件) の設計
