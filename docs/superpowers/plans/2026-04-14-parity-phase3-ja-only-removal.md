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

Phase 3 は「削除できるものだけ純減し、source-first 契約上削除できないものは別 backlog に明文化する」で完了条件を満たす。17 件全件純減は要求しない。

- 17 callout-body entries 各々が、以下のいずれか 1 つに分類されて処理されている:
  - **分類 1 / 2 / 3 で content 側を修正**: baseline から純減 (content 編集 + 次 baseline 再生成で消える)
  - **「保留」で content を touch しない**: baseline には残す。**かつ** `docs/superpowers/specs/2026-04-14-parity-phase3-holds.md` (Round 2 で新設) に slug / sectionPath / jaSegmentIndex / jaSourceFingerprint / 保留理由 (`enHasCallout=true` 等) / 次 phase 受け皿 (例: `parity-turndown callout mapping 修正 phase`) を記録
- 17 件の内訳が `content 修正 (分類 1+2+3) 合計 + 保留合計 = 17` で一致している
- **「保留」枠は Round 2 で初めて明示される**ので、plan の固定数を埋めない。ただし Round 2 完了時に合計で 17 になることは DoD に含まれる
- 他 issueType (segment-untranslated / segment-missing / section-structure-mismatch / segment-extra の非 callout-body / segment-token-gap / segment-inconclusive / segment-order-mismatch) のカウントが Phase 2 Round 2 終了時点 (1873) から純増していない
- `npm run check:parity --fail-on=actionable` が exit 0
- `npm run lint:docs` が 0 error / 0 warning
- `npm run test` が pass
- `npm run build` が success
- `parity-baseline.json` が再生成され、差分が意図通り (content 修正した entry のみ純減、保留 entry は残存)
- 保留 list (`phase3-holds.md`) が PR に含まれ、各 entry の次 phase 受け皿 が明記されている

**重要な方針 (codex review 2026-04-15 反映):**

- **per-slug parity check だけでは DoD を判定できない**。ほとんどの slug に callout-body 以外の active issue も残っているため、`npm run check:parity -- --slug=<slug>` は「該当 slug の callout-body entry が 0」を確認する補助手段であり、entry 単位の差分を baseline comparison で検証する。
- **`administration/api-access` は対象 callout 未確定** (`docs/superpowers/specs/2026-04-14-parity-phase2-report.md#L169` で UX 保護宣言された `:::danger` と、baseline entry が指す callout が同一かは不明)。Round 1 で enumerate v1 が heading resolver 失敗により preface `:::tip` を誤対象化した経緯があるため、**plan では分類を固定しない**。Round 2 で enumerate v2 の fingerprint match により対象を確定し、`enHasCallout` 判定を踏まえて Task 3.3 codex review で分類を決定する。
- **Task 3.6 (TTM for Jira) は Task 3.4 (baseline 再生成 + PR) より前に実施する**。Task 3.6 自体が glossary mask の影響を全 slug に広げるため、Task 3.4 の baseline 再生成は Task 3.6 完了後に 1 回だけ行う。

---

## Task 3.1: 対象 callout の enumerate + 分類

**Files:**
- Create: `scripts/phase3/enumerate_ja_only_callouts.mjs`

> ⚠ **v1 (commit 17006a0 + post-mortem 反映) は Round 2 の編集対象確定には使えない。** Round 2 着手前に v2 へ更新必須。
>
> v1 の失敗モード: `sectionPath` の leaf heading が JA md 内に一致しない (例: `## API キーの管理（API keys management）` の日本語（English）併記パターンに対応していない) と whole-document fallback し、別 section の callout を誤対象化する。現 baseline では **17 entries 中 14 entries が fallback に該当**。v1 は unresolved entry を検出した時点で banner 警告を出力し exit 1 する状態に既に改修済み (commit TBD)。Round 2 は下記 v2 要件で作り直してから進める。

### v2 要件 (Round 2 必須)

- **要件 1:** `日本語（English）` heading pattern の解決。leaf heading が JA md 内にマッチしない場合、括弧内の英語部分 (`（...）` の中身) と、ハイフン / 空白 / 大文字小文字 を許容する fuzzy match で再試行する
- **要件 2:** `jaSourceFingerprint` による本照合を最優先 resolver とする。parity 内部の fingerprint アルゴリズムを replicate できない場合のみ、次善策として substring match (callout body 全文の prefix/exact/unique substring で対象確定) を許容する。ただし次善策を使う場合は以下を両方満たすこと:
  - **(a) 同一 section 内で他 callout と body が重複しない一意な match** であることを script が検証し、重複がある場合は unresolved 扱い
  - **(b) output 上で `resolver: substring-fallback` とマークし、`resolver: fingerprint-exact` と区別する**
- **要件 3:** `enHasCallout: bool` フィールドを各 entry に付与。対応する EN snapshot ファイルで該当 sectionPath 周辺に `<div class="note">` / `<div class="caution">` / `<div class="warning">` / `<div class="tip">` / `<div class="info">` / `<div class="danger">` のいずれかが存在するか grep で判定
- **要件 4:** unresolved entry を検出した場合、banner 警告 + exit 1。silent fallback 禁止。unresolved の原因:
  - `heading-not-found` (v1 から継承): sectionPath の leaf heading が JA md 内にマッチしない
  - `block-not-found`: section 特定できたが内部に callout が 0 件
  - `index-mismatch`: jaSegmentIndex が section 内 callout 数を超過
  - `file-not-found`: JA md ファイル自体が読めない (該当 slug の全 entry を unresolved 扱い)
  - `fingerprint-mismatch`: 要件 2 の resolver (fingerprint-exact または substring-fallback) で対象を一意に確定できない
  - `enhascallout-unknown`: EN snapshot の存在確認 or grep に失敗
- **要件 5:** baseline.entries から `issueType === 'segment-extra' && segmentKind === 'callout-body'` を抽出し、各 entry について `slug` / `sectionPath` / `jaSegmentIndex` / `jaSourceFingerprint` / `resolver` (`fingerprint-exact` または `substring-fallback`) / 行番号 / callout type / body preview / 2 行 context / `enHasCallout` を出力

実装ルール (v2):
- `RegExp#exec` は使わない (PreToolUse hook 回避)。`String.matchAll` / `RegExp#test` のみ使用
- UX_CARRYOVER マーカー (slug レベル) は「Phase 2 UX 保護 callout が別にあるかもしれない」情報のみで、**classification (分類1/2/3) を固定しない**。対象が fingerprint で確定してから分類を決める
- **v2 は既存の `scripts/phase3/enumerate_ja_only_callouts.mjs` を置き換える** (別ファイル新設禁止。Round 1 の v1 unsafe 状態を残さないため)

### 実行ステップ (Round 2)

- [ ] **Step 1: v2 スクリプト実装** — `scripts/phase3/enumerate_ja_only_callouts.mjs` を**上書き** (別ファイル新設禁止)
- [ ] **Step 2: v2 実行**

  ```bash
  node scripts/phase3/enumerate_ja_only_callouts.mjs > phase3-targets.md
  ```

  (`/tmp/` はセッションによっては PreToolUse hook で blocked なので worktree 内に保存)

  exit 0 であり、かつ unresolved entries 数 = 0、かつ `enHasCallout=true` 判定の entry は分類2 適用禁止フラグで区別されていること

- [ ] **Step 3: commit**

  ```bash
  git add scripts/phase3/enumerate_ja_only_callouts.mjs
  git commit -m "chore: Phase 3 enumerate v2 (jaSourceFingerprint + 日本語（English） heading 解決 + enHasCallout)"
  ```

**Task 3.1 DoD (v2):**

- enumerate v2 が exit 0 で 17 entry すべての対象 callout を特定している。resolver は以下のいずれか、かつ **output で明示されている**:
  - `resolver: fingerprint-exact` (要件 2 の一次解法)
  - `resolver: substring-fallback` (要件 2 の次善策; 同一 section 内で一意な match を script が検証済み)
- 各 entry に行番号、callout type、body preview、context、`resolver`、`enHasCallout` フィールドが出ている
- unresolved entry は 0 (heading-not-found / block-not-found / index-mismatch / fingerprint-mismatch / enhascallout-unknown のいずれも発生しない、または発生時は exit 1)
- UX_CARRYOVER マーカーがある slug では分類を plan 上で固定しておらず、Task 3.2 で対象 fingerprint 確定後に分類判断することになっている
- 既存の v1 ファイル (`scripts/phase3/enumerate_ja_only_callouts.mjs`) が v2 で上書き済み (v1 がファイルシステム上に残っていない)

---

## Task 3.2: 各 slug で EN 突き合わせ + 3 分類適用

**Files:**
- Modify: 13 slug の md ファイル (上記 target table)

**Context:** 各 slug の JA callout を EN snapshot と照合し、以下の 3 つに分類:

1. **純粋な JA 独自 callout** (EN に対応する情報が本文にも callout にもない) → 削除
2. **EN 本文に plain paragraph / list として同内容がある (EN 側が `<div class="note">` 等の callout ではない)** → callout を解除して本文に戻す (構造を EN に合わせる)
3. **情報保存が必須** (読者への重要注記) → 本文に段落として統合、callout は削除

**[2026-04-15 Round 1 revert 反映] 分類2 適用の前提:**

- 対象 slug の `snapshots/en/content/<slug>.html` を grep して `<div class="note">` / `<div class="caution">` / `<div class="warning">` / `<div class="tip">` / `<div class="info">` / `<div class="danger">` の**数と位置**を確認
- **EN 側に同一内容の callout div がある場合、分類2 は使えない** (source-first 契約上、両側とも callout で構造一致させるべき)。その場合の選択肢:
  - (a) **分類「保留」**: parity turndown が EN callout を plain paragraph として扱う既知 limitation 由来の mismatch なので、Phase 3 content 修正ではなく parity 側の `parity_turndown.mjs` 修正で解消する (別 phase)
  - (b) **JA callout type を EN と揃える** (例: JA `:::tip` → EN `:::note` 相当なら `:::note` に変換、ただし読者体験は劣化する)
- 真の 分類1 / 分類2 は「EN 側にこの位置の callout div が**ない**」ケースのみ

**[2026-04-15 Round 1 revert 反映] api-access の取り扱い — 対象未確定、分類固定しない:**

- baseline entry は `administration/api-access | sectionPath=API keys management | jaSegmentIndex=0`
- Round 1 の enumerate v1 は JA heading を解決できず whole-document fallback で preface の `:::tip` (Swagger link) を対象として扱ったが、これが正しい対象かは未確定
- Phase 2 Round 1 で UX 保護宣言した callout は `API キーの管理` section 内の `:::danger` (API キー削除警告、L71 付近) の可能性があり、baseline entry 対象と**別物**の可能性がある
- **対応:** Round 2 では enumerate v2 の `jaSourceFingerprint` 照合で対象 callout を**確定してから**分類を判断する。
  - 対象が preface `:::tip` と確定 → EN snapshot の対応位置を調べて分類 (EN 側が plain paragraph なら 分類2、callout div なら「保留」)
  - 対象が `:::danger` と確定 → Phase 2 UX 保護方針を引き続き尊重するかを改めて判断 (引き続き保護するなら baseline に残し続ける、 or 分類3 で本文統合)
- **Round 2 実行者へ: api-access の分類は plan で固定しない。enumerate v2 の fingerprint match 結果と EN snapshot 確認を経てから Task 3.3 codex review で決定すること。**

- [ ] **Step 1: 作業優先順 (entry 密度順)**

1. `administration/secrets` (3 entries)
2. `recording-tests/recording-a-mobile-test/recording-a-vmg-mobile-test` (3 entries)
3. 残り 11 slug (各 1 entry、順不同)

各 slug で以下を実行:

1. enumerate v2 出力から該当 entry の `sectionPath` / 確定済み `line range` / `body preview` / `enHasCallout` を読む
2. `snapshots/en/content/<slug>.html` を読み、同 section の EN 本文と照合
3. JA の callout 内容を確認
4. **分類判断フロー** (固定ではなく、下記を順に評価):
   - `enHasCallout=true` → **分類2 は適用禁止** (EN 側も callout のため source-first 違反)。「保留」(parity turndown phase 送り) または JA callout type を EN に揃える (b) を検討
   - `enHasCallout=false` かつ EN 本文に同内容の plain text が**ある** → 分類2
   - `enHasCallout=false` かつ EN 本文に同内容の情報が**ない** が読者保護に必要 → 分類3 (本文統合)
   - `enHasCallout=false` かつ EN 本文に同内容なし かつ JA 読者にも不要 → 分類1 (削除)
5. 分類に応じて修正:
   - **分類 1:** callout ブロック (`:::type` 行〜対応する `:::` 行) をまとめて削除、前後空行整理
   - **分類 2:** `:::type` と `:::` の行だけ削除、本文はそのまま段落 / リストとして残す
   - **分類 3:** callout を本文段落に統合 (bold や emphasis で警告性を残す、または `**注意:** ...` のような inline 形式に)
   - **保留:** content は touch せず、`docs/superpowers/specs/` に「parity turndown 側修正 phase へ送る entry リスト」を記録

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

- [ ] **Step 4: slug 単位で逐次 commit**

(commit 数は DoD に使わない。DoD は **entry 数** で集計する。1 slug に複数 entry がある場合 — 例: `administration/secrets` 3 entries — は 1 commit で済むが、entry 数としては 3 計上する。)

```bash
git add src/content/docs/<slug>.md
git commit -m "fix: Phase 3 JA 独自 callout を削除 (<slug>, 分類<番号>, N entry)"
```

- [ ] **Step 5: 保留 list (`phase3-holds.md`) への記録**

enumerate v2 の `enHasCallout=true` entry または 分類判断で「保留」となった entry は content を touch せず、以下の書式で `docs/superpowers/specs/2026-04-14-parity-phase3-holds.md` に追記する:

```markdown
# Phase 3 保留 entries (次 phase 受け皿)

| slug | sectionPath | jaSegmentIndex | jaSourceFingerprint | 理由 | 次 phase 受け皿 |
| --- | --- | ---: | --- | --- | --- |
| advanced-editing/auto-grouping2 | Reviewing auto-grouping suggestion | 0 | sha256:... | enHasCallout=true (EN 側に `<div class="note">`) | parity-turndown callout mapping 修正 phase |
| ... | ... | ... | ... | ... | ... |
```

全 slug 処理後に 1 回 commit:

```bash
git add docs/superpowers/specs/2026-04-14-parity-phase3-holds.md
git commit -m "docs: Phase 3 保留 entries の backlog 記録"
```

**DoD:** `(分類 1 / 2 / 3 で content 修正した entry 数) + (phase3-holds.md に記録した保留 entry 数) = 17` が成り立つこと。

補助表を report または `phase3-holds.md` に持たせ、少なくとも以下を集計する:
- 分類 1 件数
- 分類 2 件数
- 分類 3 件数
- 保留件数
- 合計 17 件

**Task 3.2 per-slug DoD:**
- 該当 slug の **content 修正対象 entry** (分類 1 / 2 / 3 に分類されたもの) が baseline 上で純減している
- 該当 slug の **保留 entry** (`enHasCallout=true` 等で content touch 不可と判断されたもの) は baseline に残して OK。ただし `phase3-holds.md` に当該 entry の slug / sectionPath / jaSegmentIndex / jaSourceFingerprint / 保留理由 / 次 phase 受け皿 を記録済み
- 該当 slug 内で (content 修正済み entry の数) + (保留 entry の数) = (enumerate v2 が該当 slug で出力した entry の総数) が成り立つ
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
- `administration/api-access` (UX-CARRYOVER; 対象 callout は enumerate v2 の fingerprint match で確定してから分類判断。plan で固定しない)
- `administration/secrets` (3 entries、Edit or Delete a Secret section、削除系の注意喚起が多いと推定)
- その他分類 3 または「保留」を適用した slug

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

**Important:** Task 3.2 / 3.3 / 3.6 / **3.5 (report)** がすべて完了した後で、baseline を**一度だけ**再生成し、report を含んだ状態で PR を作る。Task 3.5 は Task 3.4 より先に完了させること (実行順は `Execution Handoff` セクション参照)。

- [ ] **Step 1: フル parity**

  ```bash
  npm run check:parity 2>&1 | tail -20
  cp parity-check-status.json phase3-full-parity-status.pre-baseline.json
  ```

  (worktree 直下に保存。`/tmp/` は PreToolUse hook で blocked される可能性があるため。commit 対象外にするため `.gitignore` に `phase3-full-parity-status.*.json` が無ければ追加しておくか、作業後に削除する。)

- [ ] **Step 2: lint / test / build gate**

  ```bash
  npm run lint:docs
  npm run test
  npm run build
  ```

  3 つとも pass していること。

- [ ] **Step 3: baseline 再生成**

  ```bash
  node scripts/generate_parity_baseline.mjs --regenerate --rationale="Phase 3: JA 独自 callout 削除 + TTM for Jira glossary + ttm-for-jira-integration alignment"
  git add parity-baseline.json
  git commit -m "chore: Phase 3 完了後の baseline 再生成"
  ```

- [ ] **Step 4: 差分分解確認**

  Phase 2 Round 2 終了時点 (`total=1873`) との差分は単一要素ではなく、以下 3 要素の**合成**として検証する:

  - **要素 A (Task 3.2 の content 修正):** `segment-extra` の callout-body 相当分の純減数 = 分類 1+2+3 で修正した entry 数
  - **要素 B (Task 3.6 の alignment 修正):** `ttm-for-jira-integration` の non-untranslated active issues (`section-structure-mismatch` 3 件 + `segment-missing` 3 件 = 計 6 件) のうち、実際に解消した件数。残 ≤1 が DoD
  - **要素 C (Task 3.6 の glossary mask 副作用):** `TTM for Jira` 登録に伴う `segment-untranslated` の純減 (正の影響) と、他 slug に新規 active が発生していないこと (副作用の負の影響がない) を両方確認

  DoD として以下を**すべて**満たしていること:

  - 要素 A の純減数 = `phase3-holds.md` と report の分類別件数と一致
  - 保留 entry 数 = 17 − 要素 A 純減数 が baseline に残っていて OK (`phase3-holds.md` に記録済み)
  - 要素 B の純減数 ≥ 0 (alignment 修正で non-untranslated が増えていない)
  - 要素 C: ttm-for-jira-integration 以外の slug で新規 active なし
  - callout-body 以外の issueType が要素 A/B/C で説明できない純増をしていない (例: content 修正副作用で missing/structure が暴発していない)
  - 全体 total は `(要素 A 純減) + (要素 B 純減) + (要素 C 純減) = 1873 − 新 total` で分解して等式が成り立つ

  不一致があれば、要素ごとに切り分けて原因特定 (content 修正副作用 / glossary collateral / alignment 波及) してから次へ進む。

- [ ] **Step 5: PR 作成** (この時点で `phase3-report.md` と `phase3-holds.md` が commit 済みであることを確認)

  ```bash
  git log --oneline main..HEAD | grep -E "phase3-report|phase3-holds" || echo "MISSING: report または holds が未 commit"
  git push -u origin HEAD:claude/parity-phase3
  gh pr create --head claude/parity-phase3 --title "fix: Phase 3 JA 独自 callout 削除 + TTM for Jira glossary" --body "$(cat <<'EOF'
## Summary

- EN 原文にない JA 独自の callout を 3 分類 (純粋削除 / callout 解除 / 本文統合) に従って整理
- `enHasCallout=true` で content 修正対象にできない entry は hold として切り出し、次 phase の backlog (`phase3-holds.md`) に記録
- `administration/api-access` は enumerate v2 の fingerprint match と EN snapshot 確認に基づいて分類を決定
- `TTM for Jira` glossary 追加 + `ttm-for-jira-integration` alignment 修正 (Phase 2 Round 2 繰越)
- baseline 再生成 (content 修正した entry のみ純減、hold entry は残存)

Plan: docs/superpowers/plans/2026-04-14-parity-phase3-ja-only-removal.md
Report: docs/superpowers/specs/2026-04-14-parity-phase3-report.md
Holds: docs/superpowers/specs/2026-04-14-parity-phase3-holds.md

## Test plan

- [ ] npm run check:parity --fail-on=actionable exit 0
- [ ] npm run lint:docs 0 error / 0 warning
- [ ] npm run test pass
- [ ] npm run build success
- [ ] callout-body entry の純減数 = content 修正 entry 数
- [ ] hold entry 数 = phase3-holds.md 記録数 = baseline 残存数
- [ ] 他 issueType の純増なし
- [ ] details / 画像 / 他 callout / 製品名が触られていない
EOF
)"
  ```

**Task 3.4 DoD:**
- すべての gate が green
- baseline 再生成で content 修正対象 entry (分類 1+2+3) が純減、他 issueType 純増なし
- 保留 entry (17 − 純減数) が `phase3-holds.md` に記録されており、baseline 上にも残っている (両者の件数が一致)
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

## 分類別処理件数

- 分類 1 (純粋削除): ??? 件
- 分類 2 (callout 解除): ??? 件
- 分類 3 (本文統合): ??? 件
- 保留 (content 非修正): ??? 件
- 合計: 17 件

## Hold entries

| slug | sectionPath | jaSegmentIndex | jaSourceFingerprint | 理由 | 次 phase 受け皿 |
| --- | --- | ---: | --- | --- | --- |
| ... | ... | ... | ... | enHasCallout=true / parity limitation | parity-turndown callout mapping 修正 phase |

## api-access judgment

- enumerate v2 の fingerprint match 結果: (preface `:::tip` / `API keys management` `:::danger` / その他)
- EN snapshot 側の block 種別: (callout / plain paragraph)
- 最終判断: 分類 1 / 分類 2 / 分類 3 / 保留
- 理由: (Round 2 で記入)

## Task 3.6 TTM for Jira

- `TTM for Jira` を GLOSSARY に追加
- `ttm-for-jira-integration.md` の alignment 修正: ??? 件の active issue を解消

## Phase 4 へのインプット

- 残 baseline (全種類合計): ??? 件
- Phase 4 対象 (inconclusive, order-mismatch): ??? 件
- Phase 3 hold 経由で parity-turndown mapping 修正 phase に送る entries: ??? 件
- schema 簡素化の対象フィールド棚卸し済み
```

- [ ] **Step 2: commit** (push はしない — Task 3.4 Step 5 でまとめて push する)

  ```bash
  git add docs/superpowers/specs/2026-04-14-parity-phase3-report.md docs/superpowers/specs/2026-04-14-parity-phase3-holds.md
  git commit -m "docs: Phase 3 完了レポート + holds backlog"
  ```

**Task 3.5 は Task 3.4 (baseline regen + PR) より前に commit 完了させること。** そうしないと report/holds がローカル commit だけになり、PR 本文の参照が dead link になる。

---

## Execution Handoff

- **実行方式:** superpowers:subagent-driven-development, model=sonnet 4.6, isolated worktree, background, automode
- **Per-task execution order (codex review 2026-04-15 反映):**
  1. Task 3.1 (enumerate v2) — subagent
  2. Task 3.2 (13 slug の callout 修正 + holds list 作成) — subagent (必要に応じて複数 slug を並列、ただし baseline 更新はしない)
  3. Task 3.3 (codex review 分類 3 / 保留判断) — controller 主導
  4. Task 3.6 (TTM for Jira) — subagent
  5. **Task 3.5 (report + holds の commit)** — controller。**Task 3.4 より先に実施**。push はしない
  6. Task 3.4 (baseline 再生成 + gate + push + PR 作成) — controller。push 前に Step 5 で report/holds が commit 済みであることを確認
- 判断を伴う修正は codex review を挟むのが推奨。baseline 更新は Task 3.4 で 1 回だけ。
- push は Task 3.4 Step 5 で 1 回だけ。PR 本文が参照する report/holds が**同じ push に含まれている**こと。

---

## Round 1 Post-mortem (2026-04-15)

Round 1 実装 (PR #269 初版) は 13 slug / 17 callout すべてを revert した。

### 何が起きたか

1. **Group A (4 slug / 8 entries) + Group B (9 slug / 9 entries) すべてで誤分類**: subagent は EN snapshot に `<div class="note">` / `<div class="caution">` / `<div class="warning">` 等の callout div がある箇所でも 分類2 を適用し、JA 側 callout marker (`:::note` / `:::warning` / `:::info` / `:::tip` 等) を全削除。EN 側が callout なのに JA を plain paragraph に落としたため、source-first 構造契約違反。
2. **api-access の対象誤り**: enumerate スクリプトは JA heading (`## API キーの管理（API keys management）`) を EN sectionPath (`API keys management`) と match できず whole-doc fallback し、preface の `:::tip` を jaSegmentIndex=0 として出力。plan に書いた UX 保護対象 `:::danger` ではなく、無関係の `:::tip` を改変する結果になった。
3. **baseline 純増**: 再生成後 `segment-missing +10` / `segment-extra(total) +10` / `section-structure-mismatch +5` / `segment-token-gap +1` / `segment-order-mismatch +1`。updated plan の「対象 callout-body 17 件純減 + 他 issueType 純増なし」DoD 未達。`--fail-on=actionable` は pass しても完了条件としては不十分。

### 根本原因

- 分類2 の定義が曖昧 ("EN 本文にある情報を JA で callout 化" は EN 側の block 種別を規定していなかった)
- subagent への検証指示が「EN section に同内容がある」レベルで止まっており、「EN 側の block 種別 = paragraph / list / callout」の区別を要求していなかった
- enumerate スクリプトの JA heading resolver が EN 併記 heading (`日本語（English）`) パターンに対応せず、fingerprint match fallback も未実装

### 次 round 以降で必須の作業

1. **enumerate v2**: `jaSourceFingerprint` → JA md の body を fingerprint match (現在の heading text match だけでなく)。`日本語（English）` パターンは heading の括弧内英語を副キーとして拾う
2. **Pre-flight verification**: 各 entry で `snapshots/en/content/<slug>.html` の該当 section に callout div があるか grep → 結果を enumerate 出力に `enHasCallout: bool` として付与
3. **分類2 ガード**: `enHasCallout=true` の entry は分類2 適用禁止。分類「保留」(parity turndown 側の修正 phase に送り) に設定
4. **per-slug DoD の強化**: 個別 parity 差分を before/after で取り、他 issueType が純増した slug は即座に revert
5. **api-access 対象の再確定**: baseline の `administration/api-access | API keys management | jaSegmentIndex=0` が指す fingerprint を JA md の body と照合して正確な対象 callout を特定

### 現在の state

- revert 完了 (`git log main..HEAD` で `revert: Phase 3 Task 3.2 + 3.6 + ...` 単一 commit)
- `parity-baseline.json` は Phase 2 Round 2 end (1873 entries / 17 callout-body extras) に戻った
- 保持した成果物: この plan 自身の codex review 反映部分 (commit 1e9f454) + enumerate スクリプト v1 (commit 17006a0、次 round で v2 に更新予定)
