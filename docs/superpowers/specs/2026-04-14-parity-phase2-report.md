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

| 種別 | Phase 1 後 (2259) | Phase 2 後 (1919) | 差 |
| --- | ---: | ---: | ---: |
| segment-untranslated | 1903 | 1606 | **-297** |
| segment-missing | 127 | 109 | **-18** |
| segment-extra | 102 | 91 | **-11** |
| section-structure-mismatch | 66 | 61 | **-5** |
| segment-token-gap | 49 | 40 | **-9** |
| segment-inconclusive | 11 | 11 | 0 |
| segment-order-mismatch | 1 | 1 | 0 |
| **baseline total** | **2259** | **1919** | **-340** |

> PR#267 **round 2 review** 反映後の最終値。初回 baseline 再生成時点 (1909) から **+10** は以下の意図的 divergence を受容:
> - **round 1**: `administration/api-access.md` の `:::danger` 復元 (+3) / `qtest-integration.md` の `<projectName>` backtick 化 (+1) — UX / rendering 保護
> - **round 2**: GLOSSARY から一般単語 5 件 (Approve / Enter / Tab / Page Up / Page Down) 削除で surface した 6 件の active entries (+6) — JA 文中の英語 UI ラベル (`**Approve**` / `**Tab Name**` 等) が legitimate な翻訳判断として baseline frozen
> - round 2 での surface は false-negative 解消の正当な代償 (覆い隠されていた短い 3-word 英文 segment 検知回復)

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
| parity-baseline.json | **1919 entries (Phase 1 比 -340)** ✅ |
| npm test regression coverage | GLOSSARY 一般語 false-negative 回帰テスト 4 件追加 (1726 pass) ✅ |

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
- **parity checker 改善候補** (Phase 2.3 / PR#267 review で浮上):
  1. EN token 由来の `help.testim.io#fragment` と JA `/docs/X#fragment` の正規化非対称性 (現状 3 entries 影響)
  2. EN 側 `index.htm` self-referential リンクの別扱い (現状 6 entries 影響、`EN_SIDE_ARTIFACT_TOKENS` に登録済み)
  3. `/docs/` 経路指定の EN typo (dash / sentence-boundary) を EN-side artifact registry へ移す枠組み (`scripts/phase2/lib/baseline.mjs` に雛形あり)
  4. EN `<blockquote>` ↔ JA `:::danger` callout を parity_turndown 側で吸収 (api-access.md の 3 entries が該当)
  5. GLOSSARY の common word (Enter / Tab / Approve) が word-boundary マッチで他文脈も mask するリスク。`RESIDUE_MIN_WORDS=3` 防護で全英文は検知継続だが、短い segment の false-negative を Phase 4 で `debug.maskCoverage` audit

---

## PR#267 Review 対応 (2026-04-14 追加、commit `b207f01`)

### P2 regression 修復 (rendering 壊れていた、要 pre-merge fix)

1. **`validate-download.md` line 698**: 1 行パイプ文字列 (`| expectedText | JavaScript | 'A Simple PDF File' |`) は Markdown table として不正 (header/separator 行なし) で表示が壊れていた。HTML `<table class="md-table md-table-3cols">` を復元
2. **`qtest-integration.md` line 36**: `https://<projectName>.qtestnet.com/` の `<projectName>` が MDX で HTML タグとして解釈され表示消失。URL 全体と placeholder を backtick で inline code 化
3. **`enumerate_token_gaps.mjs`**: `missingTokens[0]` のみ分類するロジックを全トークン分類に変更。複合 token-gap を持つ entry (例: `--chrome-extra-args` + `/docs/index` の `allow-chrome-browser-to-use-microphone`) を複数カテゴリに登録し、内部リンク欠落の誘導漏れを防止

### Review improvement (非 regression)

4. **`scripts/phase2/lib/baseline.mjs` 新設**: 共通ユーティリティを抽出。`loadBaseline()` / `REPO_ROOT` / `EN_SIDE_ARTIFACT_TOKENS` / `EN_SIDE_ARTIFACT_URLS` / `categorizeToken()`。Phase 2.0 / 2.4 の enumerate script で再利用可能 (Phase 1 retrospective の指摘事項も解消)
5. **`GLOSSARY.md` watch list 注記**: `Enter` / `Tab` / `Page Up` / `Page Down` / `Approve` の一般単語エントリに watch 注記追加 (**round 2 で削除済み**)
6. **`api-access.md` の `:::danger` 復元**: API キー削除の警告 callout を bold paragraph に downgrade していたのを revert。UX (視覚的警告) を優先し、parity 側は 3 件を意図的 baseline entry として受容
7. **EN-side typo の cliFlag 誤分類解消**: `-variable` / `-this` / `step.This` / `/docs/index` / `http://google.com` を `EN_SIDE_ARTIFACT_TOKENS` registry に登録し、enumerate script が `enSideArtifact` カテゴリに自動振り分け

---

## PR#267 Round 2 Review 対応 (2026-04-14 追加)

### P1 regression: GLOSSARY 一般語の silent false-negative (修復済み)

前回 review response で「`RESIDUE_MIN_WORDS=3` 防護で全英文 segment は検知継続」と説明したが、これは **誤り**。`RESIDUE_MIN_WORDS=3` は「3 語未満の残余英語は fully-masked 判定」という意味で、**長い英文の false-negative を防ぐガードではない**。具体例:

- `"Click Approve now"` (17 chars, 3 words) → `Approve` mask → residue `"Click now"` (9 chars, 2 words) → `isFullyMasked=true` → **silent false-negative**

対応:
- **`docs/GLOSSARY.md`**: `Approve` / `Enter` / `Tab` / `Page Up` / `Page Down` の 5 エントリを削除。「キーボードキー名」セクション自体もコメントアウト、登録禁止の方針を明文化
- **`scripts/__tests__/parity_glossary_mask.test.mjs`**: `"GLOSSARY common-word false-negative regression (PR#267 round 2 review)"` suite を追加 (4 tests):
  - `does not include common English words in GLOSSARY`: 5 語が glossary に登録されていないことを pin
  - `3-word all-English segment containing "Approve"/"Enter"/"Tab" is flagged`: 3-word full-English segment が `isFullyMasked=false` になることを検証
- **副作用**: 一般語を外したことで surface した 6 件の active entries (JA 文中の英語 UI ラベル `**Approve**` / `**Tab Name**` 等) を baseline で受容。これは false-negative 解消の正当な代償

### P2: `scripts/phase2/enumerate_missing_segments.mjs` 新設

Plan Task 2.2.1 で要求されていた enumerate script を実装。`parity-baseline.json` の現物から `segment-missing` entries を抽出、slug 別に降順出力、`--exclude-top2` オプション、同 slug の token-gap 併記 (統合修正判断用)。

```bash
node scripts/phase2/enumerate_missing_segments.mjs --exclude-top2
# 対象: 109 entries / 61 slugs
# segmentKind 内訳: paragraph 51 / ordered-list-item 22 / unordered-list-item 16 / callout-body 12 / table-cell 8
```

### P2: `enumerate_token_gaps.mjs` を baseline 計算ベースに refactor

`TARGET_SLUGS = new Set([...29 slugs])` の hardcode を削除し、baseline から動的に算出:

- `--scope=all`: 全 token-gap entries (40)
- `--scope=gap-only`: `segment-missing` を持たない slug のみ (Phase 2.3 元々の scope、25 entries)
- `--scope=overlap`: `segment-missing` と同 slug の entries (Phase 2.2 responsibility、15 entries)

rerun 時に 14 slug 分の token-gap を見落とす構造を解消。母集団が baseline から derive されるため、今後 slug が増減しても追随する。

### P3: report / PR 数値の統一 (1919 / -340)

round 1 時点の 1913 が report の一部と PR body に残っていた。全箇所を round 2 後の値 (1919、-340) に統一。accepted divergence は round 1 の +4 に加えて round 2 の +6 (legitimate 英語 UI ラベル) を加算して説明。
