# Parity Phase 2 Round 2 — Bulk Fixes Report

- **Date**: 2026-04-14
- **Branch**: `claude/parity-phase2-round2`
- **Base**: `main` (PR#267 merged)
- **Plan**: `docs/superpowers/plans/2026-04-14-parity-phase2-bulk-fixes.md`
- **Executed this round**: Phase 2.0 (glossary) + Phase 2.4 (residual structure) 部分適用
- **Dispatch mode**: 4 subagents (sonnet 4.6, isolated worktrees, background, automode)
- **Post-review state**: UI label 維持違反の 5 ファイルは revert、構造修正のみ残置

## Baseline delta (post-review)

| issueType | Phase 2 end (round 1) | Phase 2 Round 2 (post-review) | 差 |
| --- | ---: | ---: | ---: |
| segment-untranslated | 1606 | 1571 | **-35** |
| segment-extra | 91 | 87 | **-4** |
| segment-missing | 109 | 107 | **-2** |
| section-structure-mismatch | 61 | 56 | **-5** |
| segment-token-gap | 40 | 40 | 0 |
| segment-inconclusive | 11 | 11 | 0 |
| segment-order-mismatch | 1 | 1 | 0 |
| **total** | **1919** | **1873** | **-46** |

累計差 (Phase 1 終了時 2259 → Round 2 終了時 1873): **-386 / -17.1%**

## Review findings (反映済み)

**Review で指摘された 4 件 + 関連 regression の修正:**

1. **P1 `coding-assistant.md`**: `<details>/<summary>` を平文化 → `main` へ revert。
   EN snapshot の `<details>` は escape された artifact で、JA 側は original の
   折りたたみ構造を維持するのが `docs/WRITING_GUIDE.md §HTML 要素の取り扱い` の契約。
2. **P1 `hooks.md`**: `Before test handler` 等の UI label を本文から削除 → `main` へ revert。
   `Config File` / `Turbo Mode` / `View Screenshot` / `Baseline` 等の UI 語も paraphrase
   されていたため全体 revert。
3. **P2 `dashboard.md`**: `Assigned to me` / `Remote Execution Runs` / `Duplication Level` /
   `Auto Grouping` を日本語化 → `main` へ revert。
4. **P2 `azure-ad-sso-integration.md` + `okta-sso-integration.md` + `shared-configuration.md`**:
   Azure / Okta / Testim の literal UI label を paraphrase → `main` へ revert。

**副次的 revert:**
- `wait-for.md`: callout 2 分割の structure fix は良かったが、「Wait for element text (Mobile)」
  の warning callout に英語エラー文比率が高く新規 active `segment-untranslated` を誘発したため revert

**保持した subagent 修正:**
- `advanced-editing/parameters/parameters-for-groups.md` — preface 2 段落分割 + inline paragraph 化
- `salesforce-testing/salesforce-steps/sfdc-step-relatedlistaction.md` — 3 箇所の `<br />` 除去

## Glossary additions (Phase 2.0 scope)

追加 2 件:

- `Tricentis Mobile Agent` — configure-tricentis-mobile-agent Top slug
- `Virtual Mobile Grid` — virtual-mobile-grid Top slug

**繰越:**
- `TTM for Jira` — Phase 3 Task 3.6 で `ttm-for-jira-integration` の alignment
  先行修正とセットで追加 (Phase 3 plan に追記済み)

## Sub-phase summary

### Phase 2.0 (untranslated 翻訳)

今 round で純減した結果として残るのは glossary mask 効果のみ (-35 untranslated)。
subagent が実施した content translation は 5 ファイルすべて UI label 違反を含んでいたため revert。

| slug | 結果 |
| --- | --- |
| advanced-editing/hooks | revert (11 箇所 UI label 破壊) |
| test-management/shared-configuration | revert (CLI / Configuration Library 等の UI 語 paraphrase) |
| testops/insights/dashboard | revert (Assigned to me / Auto Grouping 等日本語化) |
| security/sso-integration/azure-ad-sso-integration | revert (Azure literal UI label paraphrase) |
| security/sso-integration/okta-sso-integration | revert (Okta literal UI label paraphrase) |

### Phase 2.4 (structure + extra)

| slug | structure | extra (non-callout) | missing | 結果 |
| --- | ---: | ---: | ---: | --- |
| advanced-editing/parameters/parameters-for-groups | 2 → 0 | 1 → 0 | 2 → 0 | ✅ 適用 |
| salesforce-testing/salesforce-steps/sfdc-step-relatedlistaction | 3 → 0 | 3 → 0 | 0 → 0 | ✅ 適用 |
| advanced-editing/coding-assistant | 1 | 4 | 0 | revert (details 平文化は contract 違反) |
| advanced-editing/wait-for | 2 | 0 | 2 | revert (English-heavy callout で新規 untranslated 誘発) |

### Phase 2.4 blocked (7 slugs、次 round scope)

以下 7 slug は subagent 側で「baseline orphan regression」を理由にスキップ。
`baseline 先行再生成 + 個別修正` lane を Phase 3 Round 1 / 2 で切る予定:

- `administration/project-settings`
- `administration/subscription-plans`
- `administration/secrets`
- `editing-tests/generating-a-random-value`
- `integrations/integrate-testim-to-your-ci/vsts-and-tfs-integration`
- `guides/keyboard-shortcuts`
- `running-tests/configuration-file-run-hooks`

## Lessons learned

1. **Subagent の content translation は UI label 維持契約を破壊しやすい**
   - `docs/WRITING_GUIDE.md` §5.1 / `docs/TRANSLATION_GUIDE.md` § Testim 機能名英語維持
     を prompt に明示し、subagent に「literal label は一字一句変更しない」を強く指示する必要
   - 今回のような「翻訳範囲が曖昧な段落」での paraphrase を controller 側で自動検出するには、
     *diff の中で既存 English UI label が消滅していたら regression* と判定する lint を作ると良い
2. **Glossary mask は segment alignment まで作用する**
   - Top slug への影響を事前シミュレーション (`npm run check:parity` full run diff) してから登録
3. **Subagent の `git commit` tool 不許可**
   - prompt に「commit できなければファイル差分を残して final report で path を渡す」と明記
4. **`<details>` は EN artifact よりも WRITING_GUIDE を優先**
   - EN snapshot が literal `<details>` 文字列でも、JA は折りたたみ構造を保つ (§HTML 要素の取り扱い)

## Deferred (次 round)

- **Phase 2 Round 3 / Phase 3 Round 0**: baseline 先行再生成 + Phase 2.4 blocked 7 slug の個別修正
- **Phase 3 Task 3.6**: `TTM for Jira` glossary + `ttm-for-jira-integration` alignment (plan 追記済み)
- **untranslated Top 残 ~1500 の段階翻訳** — subagent prompt 強化後に再挑戦
- **Phase 3**: callout-body 17 件
- **Phase 4**: inconclusive 11 / order-mismatch 1 / schema cleanup

## Gates (post-review)

- [x] `npm run check:parity --fail-on=actionable`: exit 0、active actionable = 0
- [x] `npm run lint:docs`: 0 error / 0 warning
- [x] `npm run test`: 1726 pass / 0 fail
- [x] baseline 再生成済み (1919 → 1873)
- [x] Review 指摘 4 件すべて revert or 部分修正で対応
- [x] Phase 2.0 / 2.4 対象 issueType すべて純減 (小幅)
