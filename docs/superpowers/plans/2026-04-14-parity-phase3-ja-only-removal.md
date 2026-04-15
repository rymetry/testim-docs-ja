# Parity Phase 3 — JA 独自 callout の削除 Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development with careful quality gate. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `segment-extra` かつ `segmentKind = callout-body` の **17 件 (13 slug、Phase 2 Round 2 post-review baseline 1873 基準)** — JA が読者のために独自追加した callout を削除する。翻訳ニュアンスが重要な callout は「情報を本文に統合 + callout 削除」で構造契約を守りながら情報保存する。加えて、Phase 2 Round 2 からの繰越として `TTM for Jira` glossary 追加 + `ttm-for-jira-integration` alignment 修正を同 PR に含める。

**Architecture:** 1 PR で統合。並列エージェント委任可能だが、**単純削除ではなく情報保存を伴う判断が必要**なため、個別レビュー必須。

**Tech Stack:** 既存パイプライン + 翻訳者 / LLM レビュー。

**Prerequisite:** Phase 2 Round 2 がマージ済み、baseline が 1873 で最新の状態。

**Current target slugs (post-review baseline, 2026-04-15 実測):**

| slug | callout-body extras | 他 active issues (他 issueType) |
| --- | ---: | --- |
| `administration/secrets` | 3 | structure=1, segment-extra(non-callout)=2, missing=2, untranslated=9 |
| `recording-tests/recording-a-mobile-test/recording-a-vmg-mobile-test` | 3 | structure=1, segment-extra(non-callout)=0, token-gap=1, untranslated=26 |
| `administration/api-access` | 1 | structure=1, missing=1 |
| `advanced-editing/auto-grouping2` | 1 | (要 enumerate で確認) |
| `advanced-editing/data-driven-testing/configuring-a-data-driven-test-from-the-visual-editor` | 1 | (要 enumerate で確認) |
| `advanced-editing/extract-text` | 1 | (要 enumerate で確認) |
| `advanced-editing/validations/wait-for-element-visualization` | 1 | (要 enumerate で確認) |
| `editing-tests/conditions/advanced-conditions-settings` | 1 | (要 enumerate で確認) |
| `getting-started/creating-your-first-mobile-test-in-testim-visual-editor` | 1 | (要 enumerate で確認) |
| `integrations/test-management-integrations/xray-integration` | 1 | (要 enumerate で確認) |
| `overview/testim-overview` | 1 | (要 enumerate で確認) |
| `recording-tests/recording-a-mobile-test` | 1 | (要 enumerate で確認) |
| `salesforce-testing/salesforce-steps/sfdc-step-salesforce-flows` | 1 | (要 enumerate で確認) |

**File ownership map:**
- `src/content/docs/**/*.md` — 13 slug (上記) + `integrations/test-management-integrations/ttm-for-jira-integration.md` (Task 3.6)
- `scripts/phase3/enumerate_ja_only_callouts.mjs` — 対象 enumerate (新規)
- `docs/superpowers/specs/2026-04-14-parity-phase3-report.md` — 完了レポート (新規)
- `docs/GLOSSARY.md` — `TTM for Jira` 追加 (Task 3.6)
- `parity-baseline.json` — Task 3.4 で 1 回だけ再生成

**Worktree:** `worktree-phase3-ja-only`

**Entry-level DoD (グローバル):**

- 対象 callout-body entry (17 件) がすべて baseline から純減している
- 他 issueType (segment-untranslated / segment-missing / section-structure-mismatch / segment-extra の非 callout-body / segment-token-gap / segment-inconclusive / segment-order-mismatch) のカウントが Phase 2 Round 2 終了時点 (1873) から純増していない
- `npm run check:parity --fail-on=actionable` が exit 0
- `npm run lint:docs` が 0 error / 0 warning
- `npm run test` が pass
- `npm run build` が success
- `parity-baseline.json` が再生成され、差分が意図通り

**重要な方針 (codex review 2026-04-15 反映):**

- **per-slug parity check だけでは DoD を判定できない**。ほとんどの slug に callout-body 以外の active issue も残っているため、`npm run check:parity -- --slug=<slug>` は「該当 slug の callout-body entry が 0」を確認する補助手段であり、entry 単位の差分を baseline comparison で検証する。
- **`administration/api-access` の `:::danger` は Phase 2 で UX 優先の intentional divergence として保持された経緯がある** (`docs/superpowers/specs/2026-04-14-parity-phase2-report.md#L169`)。Phase 3 ではこの方針を部分的に改め、**分類 3 (本文統合) を必ず適用** して警告情報を bold paragraph などで本文に残しつつ callout 構造だけ解除する。UX を毀損しない範囲で parity 構造契約に寄せる。
- **Task 3.6 (TTM for Jira) は Task 3.4 (baseline 再生成 + PR) より前に実施する**。Task 3.6 自体が glossary mask の影響を全 slug に広げるため、Task 3.4 の baseline 再生成は Task 3.6 完了後に 1 回だけ行う。

---

## Task 3.1: 対象 callout の enumerate + 分類

**Files:**
- Create: `scripts/phase3/enumerate_ja_only_callouts.mjs`

- [ ] **Step 1: enumerate スクリプト作成 (決定的出力)**

要件:
- baseline.entries から `issueType === 'segment-extra' && segmentKind === 'callout-body'` を抽出
- entry ごとに以下を出力:
  - `slug`
  - `sectionPath`
  - `jaSegmentIndex`
  - `jaSourceFingerprint`
  - JA md ファイルで該当 callout の**行番号** (callout ブロックの `:::type` 開始行と `:::` 終了行)
  - callout の **type** (`note` / `warning` / `caution` / `tip` / `info` / `danger`)
  - callout 本文の**全文 preview** (行制限しない。ただし 400 文字で clip)
  - 直前 2 行 / 直後 2 行の本文 (context; source の sectionPath 位置推定用)
- `sectionPath` を使って md 上の該当 section を search し、section 内の callout だけを対象にする
- section 内に callout が複数ある場合は `jaSegmentIndex` の index 順で番号を振る
- `administration/api-access` entry には「**UX 保護のため分類 3 必須**」のマーカーを付与

実装方針:
- callout ブロックの検出は `lines` 配列を先頭から走査し、`/^:::(note|warning|caution|tip|info|danger)\b/` で開始行を検出、`/^:::\s*$/` で終了行を検出する。`String.matchAll` か `RegExp#test` を使い、`RegExp#exec` は使わない (security hook 回避)。
- section 範囲の検出は、`sectionPath` の leaf heading を同等以上の heading が現れるまでの範囲として取り出す。

- [ ] **Step 2: enumerate 実行**

```bash
node scripts/phase3/enumerate_ja_only_callouts.mjs > /tmp/phase3-targets.md
wc -l /tmp/phase3-targets.md
head -80 /tmp/phase3-targets.md
```

- [ ] **Step 3: commit**

```bash
git add scripts/phase3/enumerate_ja_only_callouts.mjs
git commit -m "chore: Phase 3 JA 独自 callout 候補列挙スクリプト"
```

**Task 3.1 DoD:**
- `scripts/phase3/enumerate_ja_only_callouts.mjs` が exit 0 で 17 entry すべてを出力
- 各 entry に行番号、callout type、body preview、context が出ている
- `administration/api-access` entry に `[UX-PROTECTED: 分類3必須]` マーカーが付いている

---

## Task 3.2: 各 slug で EN 突き合わせ + 3 分類適用

**Files:**
- Modify: 13 slug の md ファイル (上記 target table)

**Context:** 各 slug の JA callout を EN snapshot と照合し、以下の 3 つに分類:

1. **純粋な JA 独自 callout** (EN に対応する情報が本文にもない) → 削除
2. **EN 本文にある情報を JA で callout 化** → callout を解除して本文に戻す (構造を EN に合わせる)
3. **情報保存が必須** (読者への重要注記) → 本文に段落として統合、callout は削除

**api-access 特別扱い:** `administration/api-access` の `:::danger` (API キー削除警告) は Phase 2 Round 1 で UX 優先の intentional divergence として保持した経緯がある。Phase 3 では**分類 3 を必ず適用** し、警告本文を bold 段落または強調句として本文に残す。警告情報自体を消さない。

- [ ] **Step 1: 作業優先順 (entry 密度順)**

1. `administration/secrets` (3 entries)
2. `recording-tests/recording-a-mobile-test/recording-a-vmg-mobile-test` (3 entries)
3. 残り 11 slug (各 1 entry、順不同)

各 slug で以下を実行:

1. `/tmp/phase3-targets.md` から該当 entry の `sectionPath` / `line range` / `body preview` を読む
2. `snapshots/en/content/<slug>.html` を読み、同 section の EN 本文と照合
3. JA の callout 内容を確認
4. 3 分類のいずれかに決定 (api-access は必ず分類 3)
5. 分類に応じて修正:
   - **分類 1:** callout ブロック (`:::type` 行〜対応する `:::` 行) をまとめて削除、前後空行整理
   - **分類 2:** `:::type` と `:::` の行だけ削除、本文はそのまま段落 / リストとして残す
   - **分類 3:** callout を本文段落に統合 (bold や emphasis で警告性を残す、または `**注意:** ...` のような inline 形式に)

**編集ルール:**
- UI label / 製品名 / CLI flag / URL / path は英語維持 (`docs/TRANSLATION_GUIDE.md` § Testim 機能名英語維持)
- 画像 / 表 / リストの前後関係 (構造契約) を変えない
- 削除した callout 以外の callout を触らない (特に `recording-a-vmg-mobile-test` は total callout 数が多い)
- `<details>` / `<summary>` は削除しない (`docs/WRITING_GUIDE.md` § HTML 要素の取り扱い)

- [ ] **Step 2: 修正後の検証 (補助)**

```bash
npm run check:parity -- --slug=<slug> 2>&1 | tail -10
```

**注:** per-slug check の exit code は他 issueType がある限り非 0 になり得る。判定は entry レベルで行う (Step 3)。

- [ ] **Step 3: Entry-level DoD 確認 (slug 単位)**

修正後の JA md と baseline を比較するヘルパー:

```bash
node -e "const fs=require('node:fs');const b=JSON.parse(fs.readFileSync('./parity-baseline.json','utf8'));const slug=process.argv[1];const a=b.entries.filter(e=>e.slug===slug);const t={};for(const e of a)t[e.issueType]=(t[e.issueType]||0)+1;console.log(slug,t);" <slug>
```

修正後にフル parity を走らせ、新旧 baseline 差分を取って以下を確認:

- 対象 callout-body entry が該当 slug から消えている
- 他 issueType の count が該当 slug で増えていない

- [ ] **Step 4: 逐次 commit**

```bash
git add src/content/docs/<slug>.md
git commit -m "fix: Phase 3 JA 独自 callout を削除 (<slug>, 分類<番号>)"
```

**Task 3.2 per-slug DoD:**
- 該当 slug の `segment-extra` かつ `segmentKind='callout-body'` が 0 件
- 他 issueType の純増なし
- 画像 / 表 / 他 callout / `<details>` が触られていない
- UI label / 製品名 / URL / path が英語維持

---

## Task 3.3: 分類判断に迷うケースの review

**Files:**
- Modify: review で判断した slug

**Context:** 分類 2 / 3 (情報保存を伴う削除) の判断は翻訳品質に影響するので、codex review を挟むのが推奨。

- [ ] **Step 1: 分類 3 (情報統合) を適用した slug を codex にレビュー依頼**

各 commit 前に以下で review:

```bash
# codex skill 経由
# "Phase 3 Task 3.3: JA 独自 callout を本文に統合した修正を review してください。情報欠落がないか、翻訳品質が維持されているかを確認"
```

**優先レビュー対象:**
- `administration/api-access` (UX-PROTECTED 分類 3 必須)
- `administration/secrets` (3 entries、Edit or Delete a Secret section、削除系の注意喚起が多いと推定)
- その他分類 3 を適用した slug

- [ ] **Step 2: codex 指摘を反映した修正を commit**

---

## Task 3.6: TTM for Jira glossary 追加 (Phase 2 Round 2 からの繰越)

**Background:** Phase 2 Round 2 (PR#268) で `TTM for Jira` を `docs/GLOSSARY.md` に追加しようとしたが、`integrations/test-management-integrations/ttm-for-jira-integration` で 4 件の `segment-extra` (preface / Setting up section / Bulk Create unordered-list ×2 / callout-body) を誘発するため見送った。

原因: glossary mask は segment の fingerprint と alignment 両方に作用する。`ttm-for-jira-integration` は "TTM for Jira" が文中に散りばめられており、mask 後の segment text が EN / JA で異なる alignment を生むため、baseline に含まれない extras が新規発生した。

**Strategy (Plan B):** `ttm-for-jira-integration` の JA 側 alignment を EN に合わせて先に直し、その後 glossary に追加する。**Task 3.4 の baseline 再生成より前に完了させる** (再生成を 2 回走らせない)。

**Order:** Task 3.2 / 3.3 完了後、Task 3.4 の前に実施。

- [ ] **Step 1: `ttm-for-jira-integration.md` の alignment 修正**
  - 対象: 3 section-structure-mismatch + 3 segment-missing (現 baseline 実測) + 非 callout 由来の JA segment
  - `snapshots/en/content/integrations/test-management-integrations/ttm-for-jira-integration.html` と突き合わせ
  - 特に問題が出た section:
    - `Setting up TTM for Jira Integration`
    - `Bulk Create & Map Test Cases to TTM for Jira`
    - `Running a test and viewing the Testim test results in TTM for Jira > Upon Testim test run execution end`
  - 作業中 UI label (TTM for Jira / Manually Map a test in Testim to TTM for Jira / Unmap a Test Already Mapped to TTM for Jira 等) は英語維持
- [ ] **Step 2: per-slug parity 確認**

  ```bash
  npm run check:parity -- --slug=integrations/test-management-integrations/ttm-for-jira-integration
  ```

  `ttm-for-jira-integration` の active non-callout issues が 0 に近づいていること (baseline-covered は許容)

- [ ] **Step 3: `docs/GLOSSARY.md` に追加**

  ```markdown
  | TTM for Jira | Tricentis Test Management for Jira |
  ```

- [ ] **Step 4: 影響再確認 (full parity、baseline 再生成はまだしない)**

  ```bash
  npm run check:parity
  ```

  `ttm-for-jira-integration` 以外の slug で新規 active 発生がないこと

- [ ] **Step 5: commit (baseline 再生成は Task 3.4 でまとめて実施)**

  ```bash
  git add docs/GLOSSARY.md src/content/docs/integrations/test-management-integrations/ttm-for-jira-integration.md
  git commit -m "feat: Phase 3 Task 3.6 TTM for Jira glossary + alignment 修正"
  ```

**Task 3.6 DoD:**
- `TTM for Jira` が GLOSSARY に登録済み
- `ttm-for-jira-integration` の non-callout active issues が 0 近く (許容: baseline-covered)
- 他 slug で新規 active 発生なし
- この時点では `parity-baseline.json` を更新しない

---

## Task 3.4: baseline 再生成 + gate + PR 作成 (最後に 1 回だけ)

**Important:** Task 3.2 / 3.3 / 3.6 がすべて完了した後で、baseline を**一度だけ**再生成する。

- [ ] **Step 1: フル parity**

  ```bash
  npm run check:parity 2>&1 | tail -20
  cp parity-check-status.json /tmp/phase3-full-parity-status.pre-baseline.json
  ```

- [ ] **Step 2: lint / test / build gate**

  ```bash
  npm run lint:docs
  npm run test
  npm run build
  ```

  3 つとも pass していること。

- [ ] **Step 3: baseline 再生成**

  ```bash
  node scripts/generate_parity_baseline.mjs --rationale="Phase 3: JA 独自 callout 削除 + TTM for Jira glossary + ttm-for-jira-integration alignment"
  git add parity-baseline.json
  git commit -m "chore: Phase 3 完了後の baseline 再生成"
  ```

- [ ] **Step 4: Entry-level 差分確認**

  Phase 2 Round 2 終了時点 (`total=1873`) との差分:
  - `segment-extra` の callout-body 相当分が純減 (目安 -17 前後)
  - 他 issueType で純増がない
  - 全体 total が純減

- [ ] **Step 5: PR 作成**

  ```bash
  git push -u origin worktree-phase3-ja-only
  gh pr create --title "fix: Phase 3 JA 独自 callout 削除 + TTM for Jira glossary" --body "$(cat <<'EOF'
## Summary

- EN 原文にない JA 独自の callout を 3 分類 (純粋削除 / callout 解除 / 本文統合) に従って整理
- `administration/api-access` の `:::danger` は UX 保護のため分類 3 (本文統合) を適用
- `TTM for Jira` glossary 追加 + `ttm-for-jira-integration` alignment 修正 (Phase 2 Round 2 繰越)
- baseline 再生成 (Phase 2 Round 2 → Phase 3 完了)

Plan: docs/superpowers/plans/2026-04-14-parity-phase3-ja-only-removal.md
Report: docs/superpowers/specs/2026-04-14-parity-phase3-report.md

## Test plan

- [ ] npm run check:parity --fail-on=actionable exit 0
- [ ] npm run lint:docs 0 error / 0 warning
- [ ] npm run test pass
- [ ] npm run build success
- [ ] baseline の callout-body entry 純減を確認
- [ ] <details> / 画像 / 他 callout / 製品名が触られていない
EOF
)"
  ```

**Task 3.4 DoD:**
- すべての gate が green
- baseline 再生成で Phase 3 対象 entry が純減、他 issueType 純増なし
- PR 作成済み

---

## Task 3.5: Phase 3 完了レポート

**Files:**
- Create: `docs/superpowers/specs/2026-04-14-parity-phase3-report.md`

- [ ] **Step 1: レポート作成**

```markdown
# Parity Phase 3 — JA 独自 callout 削除 Report

- Date: 2026-04-15
- Plan: `docs/superpowers/plans/2026-04-14-parity-phase3-ja-only-removal.md`
- Base: Phase 2 Round 2 post-review baseline = 1873

## 削減結果

| issueType | Phase 2 Round 2 | Phase 3 完了 | 差 |
| --- | ---: | ---: | ---: |
| segment-extra (callout-body) | 17 | (実測) | (実測) |
| segment-extra total | 87 | (実測) | (実測) |
| section-structure-mismatch | 56 | (実測) | (実測) |
| segment-missing | 107 | (実測) | (実測) |
| segment-untranslated | 1571 | (実測) | (実測) |
| segment-token-gap | 40 | (実測) | (実測) |
| segment-inconclusive | 11 | (実測) | (実測) |
| segment-order-mismatch | 1 | (実測) | (実測) |
| **total** | **1873** | (実測) | (実測) |

## 分類別修正件数

- 分類 1 (純粋削除): ??? 件
- 分類 2 (callout 解除): ??? 件
- 分類 3 (本文統合): ??? 件 (うち `administration/api-access` は UX 保護のため必須適用)

## Task 3.6 TTM for Jira

- `TTM for Jira` を GLOSSARY に追加
- `ttm-for-jira-integration.md` の alignment 修正: ??? 件の active issue を解消

## Phase 4 へのインプット

- 残 baseline (全種類合計): ??? 件
- Phase 4 対象 (inconclusive, order-mismatch): ??? 件
- schema 簡素化の対象フィールド棚卸し済み
```

- [ ] **Step 2: commit**

  ```bash
  git add docs/superpowers/specs/2026-04-14-parity-phase3-report.md
  git commit -m "docs: Phase 3 完了レポート"
  ```

---

## Execution Handoff

- **実行方式:** superpowers:subagent-driven-development, model=sonnet 4.6, isolated worktree, background, automode
- **Per-task execution order (codex review 2026-04-15 反映):**
  1. Task 3.1 (enumerate) — subagent
  2. Task 3.2 (13 slug の callout 修正) — subagent (必要に応じて複数 slug を並列、ただし baseline 更新はしない)
  3. Task 3.3 (codex review 分類 3) — controller 主導
  4. Task 3.6 (TTM for Jira) — subagent
  5. Task 3.4 (baseline 再生成 + gate + PR) — controller
  6. Task 3.5 (report) — controller
- 判断を伴う修正は codex review を挟むのが推奨。baseline 更新は Task 3.4 で 1 回だけ。
