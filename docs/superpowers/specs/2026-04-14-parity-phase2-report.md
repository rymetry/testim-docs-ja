# Parity Phase 2 — Bulk Fixes Report

- **Date**: 2026-04-14
- **Plan**: `docs/superpowers/plans/2026-04-14-parity-phase2-bulk-fixes.md`
- **Roadmap**: `docs/superpowers/specs/2026-04-14-parity-burndown-roadmap.md`
- **Phase 1 Report**: `docs/superpowers/specs/2026-04-14-parity-phase1-report.md`
- **Execution method**: superpowers:subagent-driven-development (sonnet 4.6, isolated worktree, background, automode)
- **Branch / PR**: `claude/parity-phase2` → 1 統合 PR (予定)
- **Executed this round**: Phase 2.1 / 2.2 (partial) / 2.3
- **Deferred to next round**: Phase 2.0 (glossary + untranslated 実翻訳) / Phase 2.4 (residual structure)

---

## 削減結果

| 種別 | Phase 1 後 (2259) | Phase 2 後 (1909) | 差 |
| --- | ---: | ---: | ---: |
| segment-untranslated | 1903 | 1600 | **-303** |
| segment-missing | 127 | 107 | **-20** |
| segment-extra | 102 | 90 | **-12** |
| section-structure-mismatch | 66 | 60 | **-6** |
| segment-token-gap | 49 | 40 | **-9** |
| segment-inconclusive | 11 | 11 | 0 |
| segment-order-mismatch | 1 | 1 | 0 |
| **baseline total** | **2259** | **1909** | **-350** |

> 主要削減源は Phase 2.1 で実施した GLOSSARY/INVARIANT_TOKENS 拡張 (Testim step / property 名 50+ と `testim-step-name-with-parens` パターン)。これが Top 2 files 以外の 218 slug 全体に波及し、segment-untranslated を -303 まで押し下げた。

---

## Sub-phase 別

### Phase 2.1 — Top 2 files 複合修正 (subagent + GLOSSARY 拡張)

- **Target 実測**: `editing-tests/steps` 31 + `editing-a-steps-properties` 39 = 70 entries
- **Approach**: Phase 1 報告の「GLOSSARY 監査先行で数百件削減可能」推奨を採用。agent は 1 行ずつ翻訳せず、Testim UI / step / property 名を GLOSSARY.md に拡張して mask 吸収
- **修正**:
  - `docs/GLOSSARY.md` — 50+ Testim step name (例: `Validate element visible`, `Add custom action`) と property name (例: `When this step fails`, `Native events`) を追加
  - `docs/INVARIANT_TOKENS.md` — `testim-step-name-with-parens` パターン追加 (括弧/スラッシュを含むステップ名)
  - `src/content/docs/editing-tests/steps.md` — "Drag & Drop" 2 つ目の table を paragraph に変換 (EN 側 malformed `<p>` source artifact 対応)
  - `editing-a-steps-properties.md` は直接修正なし (全て GLOSSARY 追加で吸収)
- **結果**: 70 entries 中 64 を解消 (active: 0)、6 件は baseline frozen (false positive)
- **副作用**: GLOSSARY 拡張は他 slug にも波及し、全体で -303 segment-untranslated 削減に寄与
- **Commit**: `e132306`

### Phase 2.2 — segment-missing 翻訳復元 (partial、thrashing + rate limit)

**初回 dispatch (65 slug、144 entries):**
- 単一 agent が 90 分稼働するも、keyboard-shortcut-step の GLOSSARY 追加が他 gate を壊す revert ループに入り thrashing
- controller が TaskStop、clean な 3 slug (`validate-download`, `validate-element-attribute`, `qtest-integration`) のみ救出 + agent の GLOSSARY 追加 (qTest 群 / TMS / Quarantine など) を Phase 2.1 分と手動マージ
- **Commit**: `2dac4bb`

**再 dispatch (3 lane 並列、各 ~20 slug):**
- Lane B1 (21 slug): 4 slug 修正 (`api-access`, `api-testing`, `auto-grouping2`, `testrail-integration`)、17 skip、3 revert
- Lane B2 (20 slug、rate limit で途中終了): 2 slug 修正 (`project-settings` → active 3 件発生で revert、`validate-element-visible` のみ採用)
- Lane B3 (21 slug): 2 slug 修正 (`gitlab-integration`, `tag-remote-runs-failures`)、19 skip
- **Commit**: `0b9aea4`

**Phase 2.2 合計**: 10 slug 修正 (validate-download / validate-element-attribute / qtest-integration / api-access / api-testing / auto-grouping2 / testrail-integration / validate-element-visible / gitlab-integration / tag-remote-runs-failures)

**Skip 主要理由** (Phase 2.4 / Phase 4 送り候補):
- EN 側 artifact (ネスト構造、image caption、empty paragraph、malformed HTML)
- Cross-language マッチング限界 (Testim 英語用語が混在する JA 段落の誤検知)
- URL 方針不一致 (help.testim.io#fragment vs /docs/X#fragment の正規化非対称性)
- 構造 entangled (section-structure-mismatch と segment-missing が同一 section に密集)
- 修正で新規 active issue が発生するケース (callout 分離で個別 callout 内の Testim 用語が untranslated 扱い)

### Phase 2.3 — segment-token-gap 残件修正 (subagent)

- **Target 実測**: 29 slug (gap-only、Phase 2.2 overlap 除外)、31 entries
- **修正**: 6 slug / 7 entries
  - `guides/mobile-web-testing` — `--test-config` を backtick 化
  - `integrations/integrate-testim-to-your-ci/teamcity-integration` — `--reporters` / `--retries` を individual backtick 化
  - `test-management/labels` — `--label` を backtick 化
  - `test-management/dependencies-and-ordering-of-tests` — `/docs/` link を EN の index.htm 解決先に合わせて修正
  - `advanced-editing/parameters/exports-parameters` — `http://json.org/` を callout に補完
  - `integrations/integrate-testim-to-your-ci/gearset-integration` — Swagger URL を step 5 に補完
- **Skip 25 entries** (EN 側 artifact として記録):
  - "-variable" / "-this" (×5 Salesforce) / "step.This" — EN typo / sentence boundary artifact
  - `http://google.com` href (demo.testim.io に対する誤 href) — EN bug
  - `/docs/index` トークン (×6) — EN の index.htm self-referential unresolvable link
  - `help.testim.io#fragment` 正規化非対称性 (×3) — parity normalizer の systematic issue (仕組みレベルで修正要)
  - structure-mismatch を抱える slug (×6) — 独立修正不可
- **enumerate script**: `scripts/phase2/enumerate_token_gaps.mjs` (116 行、5 カテゴリ分類: cliFlag / internalLink / numericOrUnit / externalUrl / other)
- **Commit**: `8362561`

---

## 修正した slug 一覧 (14 ファイル + GLOSSARY/INVARIANT)

1. `docs/GLOSSARY.md` — Phase 2.1 (50+ Testim step/property) + Phase 2.2 (qTest 群、TMS、Quarantine など)
2. `docs/INVARIANT_TOKENS.md` — Phase 2.1 (testim-step-name-with-parens パターン)
3. `src/content/docs/editing-tests/steps.md` — Phase 2.1 (Drag & Drop table→paragraph)
4. `src/content/docs/advanced-editing/validations/validate-download.md` — Phase 2.2 (missing 3/4 復元)
5. `src/content/docs/advanced-editing/validations/validate-element-attribute.md` — Phase 2.2 (missing 復元)
6. `src/content/docs/integrations/test-management-integrations/qtest-integration.md` — Phase 2.2 (missing 復元)
7. `src/content/docs/administration/api-access.md` — Phase 2.2 (callout→paragraph で structure + missing + extra 解消)
8. `src/content/docs/advanced-editing/api-testing.md` — Phase 2.2 (merged :::note を EN に合わせて 2 分離)
9. `src/content/docs/advanced-editing/auto-grouping2.md` — Phase 2.2 (pricing URL 補完)
10. `src/content/docs/integrations/test-management-integrations/testrail-integration.md` — Phase 2.2 (missing + token-gap 解消)
11. `src/content/docs/advanced-editing/validations/validate-element-visible.md` — Phase 2.2 (missing 復元)
12. `src/content/docs/integrations/integrate-testim-to-your-ci/gitlab-integration.md` — Phase 2.2 (YAML ファイル段落分離)
13. `src/content/docs/results/tag-remote-runs-failures.md` — Phase 2.2 (「バグトラッカー」表記を token 一致化)
14. `src/content/docs/guides/mobile-web-testing.md` — Phase 2.3 (--test-config backtick)
15. `src/content/docs/integrations/integrate-testim-to-your-ci/teamcity-integration.md` — Phase 2.3 (CLI flag backtick)
16. `src/content/docs/test-management/labels.md` — Phase 2.3 (--label backtick)
17. `src/content/docs/test-management/dependencies-and-ordering-of-tests.md` — Phase 2.3 (internal link canonical)
18. `src/content/docs/advanced-editing/parameters/exports-parameters.md` — Phase 2.3 (json.org link 補完)
19. `src/content/docs/integrations/integrate-testim-to-your-ci/gearset-integration.md` — Phase 2.3 (Swagger URL 補完)

加えて: `scripts/phase2/enumerate_token_gaps.mjs` (Phase 2.3 enumerate)、`scripts/__tests__/fixtures/source-parity-goldens/*.json` (auto-updated)、`parity-baseline.json` (再生成)

---

## gate 状態 (Phase 2 完了時)

| gate | 状態 |
| --- | --- |
| npm run lint:docs | 0 error / 0 warning (288 files) ✅ |
| npm run test | 1722 pass / 0 fail ✅ |
| npm run check:parity | 完走、active issue 0 件 (baseline で凍結中) ✅ |
| npm run build | 290 pages built in 8.99s ✅ |
| parity-baseline.json | **1909 entries (Phase 1 比 -350)** ✅ |

---

## Sub-agent 実行の学び

1. **GLOSSARY 拡張は効果絶大だが副作用リスク**: Phase 2.1 agent は Top 2 向けに 50+ 用語を追加し、想定外に全体 -303 untranslated を達成。一方 Phase 2.2 初回 agent は keyboard-shortcut 修飾キーを GLOSSARY 追加して他 gate を壊し、revert ループに陥った。GLOSSARY 操作はリスク高いので controller が直接判断すべき領域
2. **小スコープ並列 + skip ルール明示が thrashing 抑制**: Phase 2.2 再 dispatch で「~20 slug / 2-3 min budget / 4 種類の skip trigger」を明示したところ、3 lane とも time budget 内で完走 (B2 は rate limit で外部要因停止)
3. **Isolated worktree は便利だが分岐点注意**: 各 subagent の worktree は現在の HEAD から分岐するため、先行 lane の commit が後続 lane に反映されない。controller が cherry-pick で統合する方式が現実的
4. **baseline covered 前提の残件理解**: 「127 件の segment-missing」のうち、多くが既に baseline で `reviewAfter` まで凍結中。実修正が必要なのは少数で、大半は EN 側 artifact / cross-language マッチング限界。Phase 2.4 では active 件数ではなく actionable delta で計画すべき
5. **Agent の JSONL transcript は読まない**: 途中プロセス観察は commit log と worktree の diff で十分

---

## Phase 3+ へのハンドオフ

- **Phase 2.0 (次 round)**: glossary 監査 + untranslated 実翻訳。Phase 2.1 agent の GLOSSARY 追加で既に -303 効果が出ているため、次は Top 20 slug の実翻訳を優先 (cookies 57、hooks 42、configure-tricentis-mobile-agent 42、ttm-for-jira 38 など)
- **Phase 2.4 (次 round)**: residual `segment-extra` (90) と `section-structure-mismatch` (60) の整理。callout-body 17 は Phase 3 対象
- **Phase 3**: JA 独自 callout (segment-extra callout-body) 17 件削除
- **Phase 4**: schema cleanup + inconclusive 11 件 + order-mismatch 1 件 + EN-side artifact の registry 化 (特に `/docs/index` 問題と `help.testim.io#fragment` 正規化修正)
- **parity checker 改善候補** (Phase 2.3 で浮上):
  1. EN token 由来の `help.testim.io#fragment` と JA `/docs/X#fragment` の正規化非対称性 (現状 3 entries 影響)
  2. EN 側 `index.htm` self-referential リンクの別扱い (現状 6 entries 影響)
  3. `/docs/` 経路指定の EN typo (dash / sentence-boundary) を EN-side artifact registry へ移す枠組み
