# Issue #225 Phase 6A — Exact Gate Promotion Design

- **Date**: 2026-04-06
- **Issue**: #225
- **Phase**: 6A（Phase 6 を 6A / 6B に分割した前半）
- **Status**: 設計（user 承認済、writing-plans 移行待ち）
- **Predecessor**: Phase 5 — Exact Diff Engine PoC + Go/No-Go（Go 判定済、shadow mode で runtime 接続済）
- **Successor**: Phase 6B — Tokenless near-tie review queue / LLM triage layer（独立 spec、別 PR）

---

## 1. Scope

Phase 6A の責務は **Phase 5 の exact diff engine を deterministic に本番 gate に昇格させること** に限定する。

含む:

- `check_source_parity.mjs` の shadow tagging（`phase: 'segment-shadow'`）を解除し、`segment-*` issue を `summarizeParityResults` の actionable 集計に乗せる
- 既存 drift（Phase 5 shadow が出している 1,035 件 / 241 ファイル）を **frozen baseline** で凍結する仕組みを新設する
- baseline は **`parity-acknowledgements.json` とは独立した `parity-baseline.json`** で管理する
- baseline match は **page-level snapshotFingerprint** で一括 invalidate する
- `segment-inconclusive` の `inconclusiveReason` を構造化 enum (`inconclusiveCategory`) として持ち、baseline 同定キーとして使う
- Phase 5 の Go 条件（mutation recall / cascade / precision baseline）を回帰させない
- 新たに **「frozen baseline が新規 mutation を吸収しないこと」** を CI で常時検証する

含まない（Non-goals）:

- baseline の paydown（件数削減）— cutover 後の継続運用課題で、6A の完了条件には入れない
- Phase 7 reporting の 4 family 集計対応 — Phase 7 で実装。6A は `parity-check-status.json` に `baselined*` 系フィールドを追加するところまで
- Tokenless free-form section の review queue / LLM triage 導線追加 — Phase 6B
- `paragraph-count-mismatch` 等の coarse signal の audit 降格 — Phase 8
- workflow split（`ci.yml` / `scheduled-actionable.yml` / `deep-audit.yml` の役割再編）— Phase 8
- 既存 acknowledgements の見直し / 削除 — 触らない
- legacy `parity-allowlist.json` 関連 — Phase 3 で完了済み
- `inconclusiveCategory` の queue 化 / triage automation 導線追加 — Phase 6B
- 新 severity（`review-required` 等）の導入 — 必要なら Phase 6B / Phase 7 で再検討
- Phase 5 alignment アルゴリズム本体の変更（weighted LCS / scoreSegmentMatch 等）— alignment は据え置き、Phase 6A は wrapper / 集計層のみ改修

---

## 2. Background — Phase 5 完了時点の状態

| 項目 | 値 |
|------|---|
| 対象ファイル数 | 288 |
| 現 gate active actionable | 0 |
| 現 acknowledged-only | 41（すべて legacy `*-count-mismatch` 系） |
| Phase 5 shadow 出力 | **1,035 件 / 241 ファイル** |
| - segment-missing | 227 |
| - segment-extra | 492 |
| - segment-untranslated | 170 |
| - segment-token-gap | 131 |
| - segment-inconclusive | 15 |

`scripts/check_source_parity.mjs` は Phase 5 で `alignSegments()` を直接呼び、`alignmentInconclusive` 時は legacy `compareSnapshotStructure()` にフォールバックする runtime wiring を完了している。発行された `segment-*` issue は `phase: 'segment-shadow'` でタグ付けされ、`summarizeParityResults` の `shadowIssues / shadowFiles / shadowIssuesByType` に隔離集計される。これが現状の "shadow mode"。

`NON_ACKNOWLEDGEABLE_TYPES` には既に `segment-missing` / `segment-untranslated` / `segment-token-gap` / `segment-inconclusive` が含まれているので、tagging を外しただけでは 1,035 件中 543 件以上が ack 不能の hard fail となる。これが Phase 6A で frozen baseline 機構が必要な理由。

Phase 5 の Go 条件は `__tests__/source_parity_recall.test.mjs` に固定されている:

| 条件 | 閾値 | Phase 5 実績 |
|------|------|-----------|
| diff=1 mutation の recall（strict, conclusive exact diff） | 100% | 9/9 strict mutation type で 100% |
| cascade（diff=1 mutation あたりの新規 diff 数） | ≤ 6 | 最大 2 |
| precision baseline（1 ページあたりの baseline diff 数） | ≤ 60 | 最大 35 |

Phase 6A はこの 3 条件を**そのまま回帰させてはならない**。

---

## 3. Gate Policy

### 3.1 segment-* issues の昇格

`segment-missing` / `segment-extra` / `segment-shifted` / `segment-untranslated` / `segment-token-gap` / `segment-inconclusive` の 6 つを `actionable` severity で primary gate に昇格させる。実装上は:

1. `check_source_parity.mjs` の `parityDiffsToIssues()` 経由で発行される `segment-*` issue から `phase: 'segment-shadow'` タグを外す
2. `summarizeParityResults()` の shadow 隔離分岐（`if (isShadow) { ...; continue; }`）を削除し、shadow 集計フィールドは backward compat の dual emit として残す
3. `failOn` 判定は既存ロジック（`activeActionableFiles > 0` で fail）をそのまま使う
4. baseline match した issue は `baselined: true` でタグ付けされ、active 集計から除外される（§5.3）

### 3.2 NON_ACKNOWLEDGEABLE_TYPES は据え置き

`segment-missing` / `segment-untranslated` / `segment-token-gap` / `segment-inconclusive` の 4 つは引き続き ack 不能。`segment-extra` / `segment-shifted` のみ ack 可能（Phase 5 の設計どおり）。

ack 不能でも frozen baseline には載る。ack と baseline は別レイヤ。

### 3.3 segment-inconclusive 運用ポリシー

`segment-inconclusive` は **「差分なし」ではなく「安全に clean と言えない」状態**として扱う。

- severity: `actionable`（変更なし）
- ack: 不可（`NON_ACKNOWLEDGEABLE_TYPES` に残す）
- frozen baseline: 対象（既存 15 件は cutover 時に baseline 化）
- 新規発生: fail
- baseline 同定キー: `slug + issueType + inconclusiveCategory`（free text の `inconclusiveReason` は同定キーに使わない）

理由: 「測れない」を ack 経路で吸収すると「Phase 6A で gate を強くする」目的そのものが崩れる。frozen baseline はあくまで cutover 時点の凍結であり、ack のような human-reviewed exemption ではない。

### 3.4 inconclusiveCategory 構造化

`alignSegments()` の inconclusive 返却を以下の enum に分類する:

| inconclusiveCategory | 発火条件 | 想定 fix |
|----------------------|---------|---------|
| `heading-count-mismatch` | EN / JA の heading 数が一致しない | 翻訳追従、または `<pre><code>` 等で構造抽出不能なケース |
| `align-exception` | `alignSegments` 内部で例外スロー | アルゴリズム改修または extractor 修正 |
| `tokenless-near-tie` | tokenless free-form section で current/swap が near-tie | Phase 6B の review queue / triage |

`inconclusiveReason` は free text の説明として残すが、baseline 同定キーには **使わない**（文言変更で baseline が壊れるため）。

### 3.5 dual emit と削除予定

Phase 6A 後も backward compat のため `summarizeParityResults` は `shadowIssues` / `shadowFiles` / `shadowIssuesByType` を **0 値で emit し続ける**。Phase 7 で reporting / issue sync を 4 family に再編する際にこれらのフィールドを削除する。

`README.md` と `source_parity_summary.mjs` 内コメントに以下を明記する:

> `shadowIssues` / `shadowFiles` / `shadowIssuesByType` は Phase 5 → Phase 6A cutover の dual emit として残置されている。Phase 7 (`detection_reports.mjs` 4 family 化) で削除予定。

---

## 4. Frozen Baseline Mechanism

### 4.1 設計原則

- **責務分離**: ack は「人がレビューして了承した例外」、baseline は「cutover 時点の既存 debt の凍結」。生成方法・寿命・意味がすべて違うため別ファイルに格納する
- **Conservative invalidation**: EN snapshot に 1 文字でも変更が入ったら、そのページの baseline 全エントリを一括 invalidate する。誤って新しい欠落を baseline で隠す事故を構造的に防ぐ
- **Deterministic generation**: 同一入力で同一出力。CI で bit-identical を検証する
- **Issue 構造を保持**: Phase 7 reporting / issue sync が drilldown できるよう、issueType / sectionPath / segmentKind / index / inconclusiveCategory を構造化フィールドで保持する

### 4.2 ファイル: `parity-baseline.json`

リポジトリルートに新設。`parity-acknowledgements.json` とは独立。

```json
{
  "schemaVersion": 1,
  "generatedAt": "2026-04-06T03:00:00Z",
  "generatedFromRunId": "2026-04-06T03:00:00Z#abcd1234",
  "rationale": "Phase 6A cutover frozen baseline — existing drift at exact gate promotion. Regenerated at PR2 cutover. New issues fail; baselined issues do not.",
  "entries": [
    {
      "slug": "salesforce-testing/troubleshoot-salesforce-tests",
      "issueType": "segment-missing",
      "sectionPath": "Fields are not present in a Salesforce Step",
      "segmentKind": "unordered-list-item",
      "enSegmentIndex": 0,
      "snapshotFingerprint": "sha256:...",
      "inconclusiveCategory": null,
      "inconclusiveReason": null,
      "reviewAfter": "2026-10-06"
    },
    {
      "slug": "test-management/test-plans-mobile",
      "issueType": "segment-extra",
      "sectionPath": "Create a New Mobile Test Plan",
      "segmentKind": "unordered-list-item",
      "jaSegmentIndex": 2,
      "snapshotFingerprint": "sha256:...",
      "inconclusiveCategory": null,
      "inconclusiveReason": null,
      "reviewAfter": "2026-10-06"
    },
    {
      "slug": "testops/testops-version-control/pull-requests",
      "issueType": "segment-inconclusive",
      "sectionPath": null,
      "segmentKind": null,
      "enSegmentIndex": null,
      "snapshotFingerprint": "sha256:f4cfe4f1ac274727f926a657495e48f5437e610f77f560d7353fa5a4cec3278e",
      "inconclusiveCategory": "heading-count-mismatch",
      "inconclusiveReason": "Heading count mismatch: EN has 0 headings, JA has 5",
      "reviewAfter": "2026-10-06"
    }
  ]
}
```

### 4.3 Lookup key

| issueType | lookup key |
|-----------|-----------|
| `segment-missing` | `slug + issueType + sectionPath + segmentKind + enSegmentIndex + enSourceFingerprint` |
| `segment-token-gap` | `slug + issueType + sectionPath + segmentKind + enSegmentIndex + enSourceFingerprint + missingTokens` |
| `segment-shifted` | `slug + issueType + sectionPath + segmentKind + enSegmentIndex + enSourceFingerprint + jaSourceFingerprint` |
| `segment-extra` / `segment-untranslated` | `slug + issueType + sectionPath + segmentKind + jaSegmentIndex + jaSourceFingerprint` |
| `segment-inconclusive` | `slug + issueType + inconclusiveCategory` |

owner-side fingerprint を key に含める理由は、**同じ index に載った別 drift を baseline が誤吸収しないため**。とくに `segment-token-gap` は `missingTokens` まで含めないと、同じ EN segment 上の別 token drop を既存 baseline と誤同定する。

`segment-extra` / `segment-untranslated` は EN side の index を持てないため、明示的な例外として `jaSegmentIndex + jaSourceFingerprint` を使う。曖昧な fallback ではなく、issueType による分岐として実装する。

`segment-shifted` は matched-but-moved の状態を表すので EN / JA 両方の fingerprint を key に含める。EN anchor は `enSegmentIndex` のままだが、destination JA 側が変わった shift は別エントリとして扱う。

`segment-inconclusive` は section / segment 単位ではなくページ全体の状態を表す issue なので、`inconclusiveCategory` のみで同定する。

**Schema validation rule**:
- `segment-missing`: `enSegmentIndex` + `enSourceFingerprint` 必須
- `segment-token-gap`: `enSegmentIndex` + `enSourceFingerprint` + `missingTokens` 必須
- `segment-shifted`: `enSegmentIndex` + `enSourceFingerprint` + `jaSourceFingerprint` 必須
- `segment-extra` / `segment-untranslated`: `jaSegmentIndex` + `jaSourceFingerprint` 必須
- `segment-inconclusive`: `enSegmentIndex` / `jaSegmentIndex` / `sectionPath` / `segmentKind` すべて null、`inconclusiveCategory` 必須
- `validateBaseline` がこれを enforce する

### 4.4 Invalidation rule

**Page-level snapshotFingerprint 一括 invalidate**:

1. baseline lookup でエントリ候補が見つかった場合、`baselineEntry.snapshotFingerprint === currentPageSnapshotFingerprint` をチェック
2. 一致しない場合、そのページの **すべての** baseline エントリを invalidate（このページの全エントリが lookup 対象外になる）
3. invalidate されたエントリに対応する issue は新規発生として gate に乗る
4. invalidate された slug は `parity-check-status.json` の `baselineInvalidatedSlugs` フィールドに記録される（rollback playbook の Path 2 で使う）

**Conservative である理由**:
- snapshot 変更があったページでは alignment 結果が変わる可能性が高い
- segment-level fingerprint で精密に invalidate する設計（質問 3 の選択肢 B）は alignment shift を考慮した stable ID 設計が必要で、Phase 6A scope 外
- 「false negative > false positive」の優先順位に従い、conservative 寄りに倒す

### 4.5 reviewAfter

- 各エントリにデフォルト 6 ヶ月後の `reviewAfter` を付与する（cutover 時点で `2026-10-06`）
- 期限切れエントリも gate には影響しない（baseline match は維持される）
- ただし `parity-check-status.json` に `expiredBaselineEntries` 件数として可視化される
- Phase 7 reporting で「期限切れ baseline の reduction」を CI metric として追跡できるようにする

**注意**: reviewAfter 期限切れで自動的に hard fail させる挙動は **入れない**。期限切れは「人が見直すべきタイミングのリマインダ」であり、cutover 時の baseline を後から強制的に剥がすと CI が予期せず爆発する。reduction はあくまで意図的な PR で行う。

### 4.6 Generation script

`scripts/generate_parity_baseline.mjs` を新設。

CLI:

```bash
# Full regeneration (cutover 時のみ)
node scripts/generate_parity_baseline.mjs --regenerate

# Partial regeneration (rollback playbook Path 2)
node scripts/generate_parity_baseline.mjs --slug=overview/testim-overview
node scripts/generate_parity_baseline.mjs --slug=overview/testim-overview,overview/account-settings
```

挙動:

- `--regenerate`: 既存 `parity-baseline.json` を完全上書き。runId / generatedAt 更新
- `--slug=<csv>`: 指定 slug のエントリのみ削除 → 再生成 → 既存 baseline にマージ。他の slug のエントリは触らない
- どちらも入力は最新の **full** `npm run check:parity` 実行結果（`parity-check-status.json`）に依存。`--slug` / `--section` 付きの partial status は generator が拒否する
- 出力は **deterministic**: `parity-check-status.json` の `summary.checkedAt` を `generatedAt` / `generatedFromRunId` の seed に使い、entry 順序は `slug → issueType → sectionPath → segmentKind → index → fingerprint/token signature` で安定ソート、JSON は 2-space indent + LF 終端
- 同じ入力で 2 回実行して bit-identical を CI で検証する（exit criteria C5）

`package.json` に追加:

```json
{
  "scripts": {
    "generate:parity-baseline": "node scripts/generate_parity_baseline.mjs"
  }
}
```

### 4.7 baseline 対象外の issue type

baseline には以下を載せない:

- `source-page-missing-local` / `local-page-orphan` / `missing-fresh-snapshot` / `sidebar-missing-file` — page coverage gate types。repo-local の構造的問題で、cutover 時点でそもそも 0 件のはず。万一あれば Phase 6A 着手前に解消する
- `source-fetch-error` — error severity の運用問題
- `paragraph-count-mismatch` / `bullet-count-mismatch` / `step-count-mismatch` 等の coarse signal — 既存 ack で管理されており、Phase 8 で audit 降格予定
- `untranslated` / `legacy-callout` / `jsx-callout` / `h1-in-body` 等の lint 系 — repo-local チェック

baseline 対象は §3.1 の 6 segment-* type のみ。

### 4.8 schema validation

`scripts/lib/source_parity_baseline.mjs` を新設し、以下の純粋関数を提供:

- `validateBaseline(parsed)` — schemaVersion, entries 配列、各 entry の必須フィールドを検証。`parity-acknowledgements.json` の `validateAcknowledgements` と同じパターン
- `loadBaselineFile(filePath)` — JSON 読込 + validate
- `buildBaselineKey(issue)` — issue から lookup key を生成
- `buildBaselineKeyFromEntry(entry)` — baseline entry から lookup key を生成
- `tagIssuesWithBaseline(slug, issues, baselineEntries, snapshotFingerprint)` — 各 issue に `baselined: true` をタグ付けし、invalidate 情報を返す

すべて純粋関数。filesystem I/O は呼び出し側（`check_source_parity.mjs`）が行う。

---

## 5. Implementation Plan — PR Structure

cutover 安全性のため **PR1 (infra) → PR2 (cutover)** の 2 PR 直列で進める。

### 5.1 Cutover window 運用ルール

- **PR2 期間中は EN snapshot 更新禁止**（PR1 land 後 〜 PR2 merge まで）。PR2 description に明示
- **PR1 の `parity-baseline.json` は preview baseline**。`rationale` フィールドに「preview — regenerated at PR2 cutover」と明記
- **PR2 の baseline 再生成は固定手順**:
  1. `git rebase main`
  2. `npm run check:parity`
  3. `node scripts/generate_parity_baseline.mjs --regenerate`
  4. gate flip コミット
  5. `npm run check:parity -- --fail-on=actionable` が exit 0 を確認
  - これらを 1 セットとして実行する。途中で snapshot が変わっていたら最初からやり直す

### 5.2 PR1 — Infra (shadow 維持)

**Goal**: baseline 機構を完全に追加するが gate flip はしない。Reviewer は schema / validation / generation / match logic のみに集中できる。CI exit code は変化しない。

**Commit 構成**:

1. **`feat: alignSegments returns structured inconclusiveCategory`**
   - `scripts/lib/source_parity_align.mjs`: inconclusive 返却に `inconclusiveCategory` enum を追加
   - 既存の `inconclusiveReason` (free text) は説明用として残す
   - `__tests__/source_parity_align.test.mjs`: category 分類のテストを追加
   - 影響範囲: `source_parity_align_runtime.test.mjs` の expected shape も更新

2. **`feat: parity baseline schema and validation`**
   - `scripts/lib/source_parity_baseline.mjs` 新設（純粋関数のみ）
     - `validateBaseline`
     - `loadBaselineFile`
     - `buildBaselineKey`
     - `buildBaselineKeyFromEntry`
     - `tagIssuesWithBaseline`
   - `scripts/__tests__/source_parity_baseline.test.mjs` 新設
     - schema validation の正常系 / 異常系
     - lookup key の `segment-extra` / `segment-inconclusive` 例外
     - page-level fingerprint invalidation
     - run-to-run determinism (C5 の前段)

3. **`feat: integrate parity baseline into check_source_parity (shadow mode)`**
   - `check_source_parity.mjs`:
     - `parity-baseline.json` を `loadBaselineFile` で読込
     - `tagIssuesWithBaseline` で各 file の issue に `baselined` フラグを付与
     - `parity-check-status.json` summary に `baselinedIssues / baselinedFiles / baselinedByType / baselinedByInconclusiveCategory / expiredBaselineEntries / baselineInvalidatedSlugs` を追加
     - **gate exit code は変えない**（shadow tagging も触らない）
   - `summarizeParityResults`: baseline 集計フィールドを追加
   - `__tests__/check_source_parity.test.mjs`: baseline 統合のテストを追加

4. **`feat: generate_parity_baseline script`**
   - `scripts/generate_parity_baseline.mjs` 新設
     - `--regenerate` / `--slug=<csv>` 両モード
     - deterministic 出力（安定ソート、bit-identical）
   - `package.json` に `generate:parity-baseline` script 追加
   - `scripts/__tests__/generate_parity_baseline.test.mjs` 新設
     - full regeneration の deterministic 性
     - partial regeneration のマージ挙動
     - 既存 entry を保全すること
     - 入力 → 出力の bit-identical 検証

5. **`chore: initial parity baseline (preview) for Phase 6A`**
   - PR1 ブランチで `npm run check:parity && node scripts/generate_parity_baseline.mjs --regenerate` を実行
   - `parity-baseline.json` の初版を commit
   - `rationale` フィールドに「preview — regenerated at PR2 cutover」と記載

6. **`docs: README — Phase 6A baseline mechanism in shadow mode`**
   - `scripts/README.md`: Phase 6A 進行中の状態を反映
     - frozen baseline 機構の説明
     - lookup key rule
     - invalidation rule
     - generation script の使い方
   - Phase 5 / Phase 6 のステータスを更新

**PR1 acceptance**:
- `npm run check:parity -- --fail-on=actionable` が exit 0（shadow のままなので gate exit code 不変）
- 全 test が green
- baseline 生成 → 再実行で bit-identical
- preview baseline ファイルが commit されている
- README が更新されている

### 5.3 PR2 — Cutover (gate flip)

**Goal**: shadow tagging を外し、segment-* を primary gate に乗せる。baseline は PR2 ブランチ上で **再生成**してから flip する。

**Commit 構成**:

1. **`chore: regenerate parity baseline at Phase 6A cutover`**
   - PR2 ブランチで §5.1 の固定手順に沿って `parity-baseline.json` を再生成
   - PR1 の preview baseline からの diff を含む（rationale を "PR2 cutover regeneration" に更新）

2. **`feat: Phase 6A — promote segment-* to primary gate`**
   - `scripts/lib/source_parity.mjs` (or wherever `parityDiffsToIssues` lives): `phase: 'segment-shadow'` タグ付けを削除
   - `scripts/lib/source_parity_summary.mjs`:
     - `if (isShadow) { ...; continue; }` 分岐を削除
     - `shadowIssues` / `shadowFiles` / `shadowIssuesByType` は backward compat の dual emit で 0 値出力を維持
     - 「Phase 7 で削除予定」コメント追加
   - `check_source_parity.mjs`:
     - shadow accounting 関連の CLI 出力を削除
     - baseline 集計を CLI summary に表示
   - 既存テスト全部が green であること
   - `__tests__/source_parity_baseline_recall.test.mjs` 新設（exit criteria C4）

3. **`docs: Phase 5 retired, Phase 6A done, dual emit deprecation note`**
   - `scripts/README.md`: Phase 5 を retired、Phase 6A を完了に更新
   - dual emit の Phase 7 削除予定を明記
   - `docs/OPS_DESIGN.md`: Phase 6A rollback playbook を追加（§7）

**PR2 acceptance**: §6 の Exit Criteria 全条件を満たす

---

## 6. Exit Criteria

PR2 を merge してよい条件。すべて measurable / CI で機械的に判定可能。

| ID | 条件 | 検証方法 |
|----|------|---------|
| **C1** | gate が green | `npm run check:parity -- --fail-on=actionable` が exit 0、かつ `parity-check-status.json` 上で `severity in {actionable, error}` かつ `baselined !== true` かつ `(acknowledged !== true OR ackExpired === true)` の issue が **issue-level で 0 件** |
| **C2** | Phase 5 mutation recall 保持 | `node --test scripts/__tests__/source_parity_recall.test.mjs` が pass（9/9 strict mutation type 100%） |
| **C3** | Phase 5 cascade ≤ 6 保持 | C2 と同テストの cascade assertion |
| **C4** | **frozen baseline が新規 mutation を吸収しない** | `node --test scripts/__tests__/source_parity_baseline_recall.test.mjs` が pass。新テスト: baselined page に diff=1 mutation を適用 → 1 件の new issue が baseline lookup を通過し active として検出される。`mutation_corpus` の 9 strict mutation type 全部に対して検証する |
| **C5** | baseline 生成の run-to-run determinism | `node --test scripts/__tests__/source_parity_baseline.test.mjs` が pass。同一入力で `generate_parity_baseline.mjs --regenerate` を 2 回実行して bit-identical な JSON が出ることを assertion |
| **C6** | 単一ページ gate latency ≤ 10s | `time node scripts/check_source_parity.mjs --slug=overview/testim-overview` が 10s 以下。representative 3 観測値（light / heavy / full run）を PR2 description に記録するのが推奨。light は preface のみのページ、heavy は cutover 時点で baseline 件数 top のページ。full run は閾値を持たない参考値 |
| **C7** | docs 更新済 | `scripts/README.md` で Phase 5 retired / Phase 6A done、`docs/OPS_DESIGN.md` に Phase 6A rollback playbook、dual emit Phase 7 削除 TODO がコード/README に記録されていること |

**優先度**:
- 必須: C1, C2, C3, C4, C5
- あるべき: C6
- 運用完了条件: C7

C4 が最重要。これが ない と frozen baseline が単なる suppression に化けていないことを証明できない。codex が警告した failure mode に対する直接の guard。

---

## 7. Rollback Playbook

PR2 後に問題が発生した場合の対応手順。`docs/OPS_DESIGN.md` に Phase 6A 専用 section として追加する。

### 7.1 判断フロー

```
PR2 merge 後に問題発生
        │
        ├── false negative の疑いがある?
        │      └── Yes → Path 1 (revert) 即時実行
        │
        ├── root cause 即特定可能?
        │      ├── No → Path 1 (revert)
        │      └── Yes
        │            ├── snapshot 変更が起点?
        │            │      ├── Yes → Path 2 (translate-first / rebaseline)
        │            │      └── No
        │            │            ├── 1 commit で fix forward 可能?
        │            │            │      ├── Yes → forward-fix PR
        │            │            │      └── No → Path 1 (revert)
```

**重要**: false negative 疑いは最優先で revert する。false positive は forward-fix で時間をかけて直せるが、false negative は gate の信頼性そのものを破壊するため。

### 7.2 Path 1 — Full revert

**Trigger**:
- false negative の疑い（baseline match logic が新しい bug を吸収している懸念）
- root cause が same-day で特定できない
- 明らかな baseline 機構のバグ
- C4 (baseline-recall) テストが過去に false negative を見逃していた疑い

**手順**:

1. main に取り込まれた PR2 の commit SHA を特定し、通常の squash merge なら `git revert <PR2 commit SHA on main>` で revert PR を起こす（merge commit を使っている場合のみ `git revert -m 1 <merge commit SHA>`）
2. revert PR で `npm run check:parity -- --fail-on=actionable` が exit 0（shadow mode に戻る）であることを確認
3. fast-track で merge（reviewer 1 名 + CI green）
4. main 復旧確認後、separate issue で root cause investigation を起票
5. 修正 + 再 cutover は新しい PR2′ として再実施。再生成 → flip 手順は §5.1 と同じ
6. **再 cutover の前提**: 検出された failure pattern を unit / integration test に追加し、C4 もしくは C5 もしくは新規 test として regression guard を仕込む。テスト追加なしの再 cutover は禁止

revert すると gate は Phase 5 の shadow mode に戻る。PR1 の infra（baseline schema, generation script, alignment 改修）は残るので、`generate_parity_baseline.mjs` 等は引き続き使える。

### 7.3 Path 2 — Translate-first, rebaseline as last resort

**Trigger**:
- main の CI が baseline invalidation に起因して red
- root cause が特定の slug 群への snapshot 変更（PR2 後の snapshot update PR が起点）
- false negative の疑いがない（純粋な page-level invalidation の動作）

**手順**:

1. **どの slug が invalidate されたかを確認**: `parity-check-status.json` の `baselineInvalidatedSlugs` から抽出
2. **第一選択肢: 翻訳追従**
   - JA 翻訳を新しい EN snapshot に追従させる通常の翻訳 PR を出す
   - baseline には触らない
   - 翻訳完了後は新しい snapshot fingerprint で gate が自然に green に戻る
3. **第二選択肢（justification 必須）: rebaseline**
   - 翻訳追従が現実的でない / 時間がかかる / 既知 debt として残す合理的な理由がある場合のみ
   - `node scripts/generate_parity_baseline.mjs --slug=<slug>[,<slug>...]` で部分再生成
   - 再生成 diff を含む PR を起こす
   - **PR description で必ず justification を記載**:
     - なぜ翻訳追従でなく rebaseline を選んだか
     - 想定される paydown のタイミング
     - reviewAfter を継承するか延長するか（延長する場合は理由）
   - reviewer は justification の妥当性を確認する責務がある

**重要**: rebaseline を「snapshot 変更時の自動的な逃げ道」にしてはならない。原則は常に **翻訳追従が第一**。rebaseline は justification がある例外的ケースに限る。

### 7.4 PR1 で必要な追加項目

Path 2 を成立させるために PR1 段階で以下を実装しておく:

- `parity-check-status.json` に `baselineInvalidatedSlugs` フィールド（snapshot fingerprint mismatch で invalidate されたエントリの slug 集合）
- `generate_parity_baseline.mjs --slug=<csv>` の部分再生成 mode
- `docs/OPS_DESIGN.md` に Phase 6A rollback section（§7 の内容）

### 7.5 ロールバック後の再 cutover

Path 1 で revert した後、再 cutover する際は:

1. root cause investigation issue の close 条件を満たしていること
2. C4 テストに今回の failure pattern を追加していること
3. PR2′ ブランチで §5.1 の固定手順を再実行
4. `parity-baseline.json` は再生成 → cutover

---

## 8. Phase 6B との関係

Phase 6B は **独立 spec / 独立 PR sequence** で進める。Phase 6A の merge 後に Phase 6B の brainstorm を別途実施する。

Phase 6B が Phase 6A から引き継ぐもの:

- `inconclusiveCategory` の `tokenless-near-tie` 件数（Phase 6B の review queue 対象を直接ターゲット化できる）
- frozen baseline 機構（Phase 6B で advisory signal を追加する際にも使える）
- Phase 5 / Phase 6A の Go 条件と test（regression 防止）

Phase 6B が触る予定のもの（**Phase 6A では触らない**）:

- tokenless-near-tie の review queue surfacing と構造化 metadata の整備
- LLM / workflow が安全に消費できる queue key / scope metadata の提供
- review queue は **gate に入れない**（advisory に留める）

Phase 6B は gate 拡張ではなく triage 導線の整備であり、Phase 6A の deterministic cutover とは review 基準も rollback 基準も異なる。

---

## 9. 影響を受けるファイル一覧

### 新規

- `scripts/lib/source_parity_baseline.mjs`
- `scripts/generate_parity_baseline.mjs`
- `scripts/__tests__/source_parity_baseline.test.mjs`
- `scripts/__tests__/source_parity_baseline_recall.test.mjs`
- `scripts/__tests__/generate_parity_baseline.test.mjs`
- `parity-baseline.json` (PR1 で preview, PR2 で cutover 版に上書き)
- `docs/superpowers/specs/2026-04-06-issue-225-phase-6a-design.md` (this file)

### 変更

- `scripts/lib/source_parity_align.mjs` — `inconclusiveCategory` 構造化返却
- `scripts/lib/source_parity.mjs` — `parityDiffsToIssues` の shadow tagging 削除（PR2）
- `scripts/lib/source_parity_summary.mjs` — shadow 隔離分岐削除 + dual emit（PR2）+ baseline 集計フィールド追加（PR1）
- `scripts/lib/source_parity_acknowledgements.mjs` — 触らない
- `scripts/lib/source_parity_types.mjs` — 触らない
- `scripts/check_source_parity.mjs` — baseline 統合（PR1）+ shadow CLI 出力削除（PR2）
- `scripts/__tests__/source_parity_align.test.mjs` — `inconclusiveCategory` テスト追加
- `scripts/__tests__/source_parity_align_runtime.test.mjs` — expected shape 更新
- `scripts/__tests__/check_source_parity.test.mjs` — baseline 統合テスト追加
- `scripts/__tests__/source_parity_recall.test.mjs` — 触らない（C2 / C3 で回帰検証に使う）
- `scripts/README.md` — Phase 6A 完了状態へ更新
- `docs/OPS_DESIGN.md` — Phase 6A rollback playbook section 追加
- `package.json` — `generate:parity-baseline` script 追加

### 触らない（明示）

- `parity-acknowledgements.json` — 既存 41 entries はそのまま
- `scripts/lib/source_parity_page_coverage.mjs`
- `scripts/lib/source_parity_segments_*.mjs`
- `.github/workflows/*` — Phase 8 で workflow split する際に触る
- `scripts/lib/detection_reports.mjs` — Phase 7 で 4 family 化する際に触る
- `.github/scripts/sync-detection-issues.cjs` — Phase 7

---

## 10. リスクと緩和

| リスク | 影響 | 緩和 |
|-------|------|-----|
| baseline match logic が false negative を生む | 新規 bug が gate を通過する。最も危険 | C4 テスト (`source_parity_baseline_recall.test.mjs`) で `mutation_corpus` の 9 strict mutation type 全部に対して検証。Path 1 trigger の最優先項目 |
| PR1 land と PR2 land の間に EN snapshot が変わる | preview baseline と cutover baseline が乖離 | PR2 で再生成（§5.1 固定手順）。Cutover window 中の snapshot 更新禁止を PR description に明記 |
| PR2 review 中に誰かが snapshot 更新 PR を merge | PR2 baseline がさらに古くなり、再生成の手間が増える | Cutover window アナウンス。PR2 の rebase + 再生成を merge 直前にもう一度実行する手順を固定 |
| baseline ファイルが大きすぎて PR2 review しづらい | reviewer が diff を一読できない | PR2 description に件数 / type 分布 / inconclusiveCategory 分布のサマリを記載。generation script の出力を貼る |
| `inconclusiveCategory` の分類が曖昧 / 漏れがある | category enum で baseline match できないエントリが出る | `alignSegments` の inconclusive 返却に必ず category を付与する unit test。fallback `unknown-category` は明示的に避ける（テストで禁止）。新しい inconclusive 発生条件が見つかったら必ず enum を拡張してから cutover する |
| `segment-shifted` の baseline match が JA 並び順変更で false negative | EN anchor は同じだが JA 側の並び順が変わって新しい shifted が出ても baseline で吸収される | EN anchor のみで同定する設計を `validateBaseline` と test で固定。C4 test に「shifted の JA 側並び替えで新規 shift が検出されること」を含める |
| dual emit が Phase 7 で削除されないまま残留 | コード負債 | `source_parity_summary.mjs` 内コメントと README で削除予定を明記。Phase 7 の planning で必ず参照する |
| reviewAfter 期限切れで CI が予期せず爆発 | 6 ヶ月後に無関係な PR が落ちる | 期限切れは hard fail させない。`expiredBaselineEntries` で可視化のみ。reduction は意図的な PR で行う |
| Path 2 の rebaseline が安易に使われる | baseline が無限に膨らむ | rebaseline PR には justification 必須を OPS_DESIGN に明記。reviewer に責務を持たせる |
| C5 (determinism) が CI 環境差で破れる | bit-identical 検証が flaky | JSON serializer は明示的に 2-space indent + LF 終端 + 安定ソート。`Map` / `Set` のイテレーション順依存を禁止 |

---

## 11. Open questions（spec 完成後に解消する必要のあるもの）

なし。質問 1〜6 のすべての論点は user 確認済。

---

## 12. References

- Issue #225 本文（design plan v5）
- `scripts/README.md` Phase 5 セクション（L370-L432）
- `scripts/__tests__/source_parity_recall.test.mjs`
- `scripts/lib/source_parity_summary.mjs` Phase 5 shadow accounting コメント
- `scripts/lib/source_parity_acknowledgements.mjs` `NON_ACKNOWLEDGEABLE_TYPES`
- `scripts/lib/source_parity_types.mjs` `ISSUE_SEVERITY`
- `scripts/check_source_parity.mjs` Phase 5 runtime wiring
- codex Phase 6 提案（このセッションの初回 user message）
