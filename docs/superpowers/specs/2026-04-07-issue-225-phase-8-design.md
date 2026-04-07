# Issue #225 Phase 8 — Coarse Signal Audit Demotion + Workflow Split Hardening

- **Date**: 2026-04-07
- **Issue**: #225
- **Phase**: 8
- **Status**: 設計確定（user + codex 承認済）— 実装着手可
- **Predecessors**:
  - Phase 6A — exact diff engine cutover + frozen baseline
  - Phase 6B — tokenless near-tie review queue
  - Phase 7 — 4-family detection reporting refactor (`source-sync-health` / `snapshot-diff` / `parity-regression` / `parity-followup`)
- **Source of truth for current state**: `scripts/README.md`, `docs/OPS_DESIGN.md`, 現行コード（`scripts/lib/source_parity_*.mjs` / `scripts/lib/detection_reports.mjs` / `.github/workflows/*.yml`）
- **Out of date**: Phase 6A spec の "shadow dual emit" 前提の記述は Phase 7 で既に消えている。本 spec では Phase 7 後の実装を基準にする

---

## 1. Scope

Phase 8 の責務は次の 2 点に限定する。

### 1.1 Coarse signal の audit 降格

Phase 5 の exact diff engine が Phase 6A で primary gate に乗ったことで、`compareSnapshotStructure` が出していた **coarse counting signal** は重複した noise に近づいた。これらは:

- 段落・箇条書き・ステップ・セクション・heading の **count 比較**
- table の shape / cell 内 English residual / cell 空白 / cell token 差分

Phase 8 では、上記 9 種を `parity-regression` family の閾値判定と `gate exit code` から外し、**`parity-check-status.json` 内の専用 audit channel と `deep-audit` workflow からのみ閲覧可能** にする。`segment-*` (Phase 5) と `image-mismatch` / `codeblock-mismatch` / `image-order-mismatch` / `callout-nesting-mismatch` などの actionable mismatch は **触らない**。

### 1.2 Workflow split の安全装置

Phase 7 で `scheduled-actionable.yml` (full scope, 3 日に 1 回) と `deep-audit.yml` (`workflow_dispatch`, section 指定可) が概念的に分離された。しかし両 workflow が同じ `parity-check-status.json` schema を生成し、`sync-detection-issues.cjs` が partial run の結果でも managed issue を上書きできてしまう構造的な穴が残っている。Phase 8 では:

- `parity-check-status.json.summary.runScope` を新設（full / slug / section の区別と `isComplete` フラグ）
- `runScope` を `docs-actionable-report.json` の top-level に伝播
- `sync-detection-issues.cjs` に `runScope.isComplete !== true` で **early no-op + warning** のガードを追加
- `scheduled-actionable.yml` / `deep-audit.yml` に責務固定のコメントを追加

---

## 2. Non-Goals (明示)

- `actionable` severity の issue type を新たに追加・削除しない
- `parityFollowup` / `snapshotDiff` / `sourceSyncHealth` の閾値・body・schema を変更しない
- `auditManifest` の構造を変更しない（`entries[].signals[]` への parity cross-reference は維持する）
- `parity-acknowledgements.json` の既存 entries を動かさない
- `parity-baseline.json` / 4 segment baseline machinery を触らない
- 新しい `severity` 値を導入しない
- coarse signal の **削除**（type 自体は残す。emitter も残す。出力経路だけが audit-only に変わる）
- `failOn=any` の意味自体は変更しない（後述の「新カウンタを追加して exit code をそちらに切り替える」設計で吸収する）

---

## 3. Design Decisions

### 3.1 `COARSE_SIGNAL_TYPES` (allowlist)

`signal` severity 全体ではなく **明示的 allowlist** で 9 種を指定する。

```text
paragraph-count-mismatch
bullet-count-mismatch
step-count-mismatch
section-count-mismatch
heading-mismatch
table-shape-mismatch
table-cell-english-residual
table-cell-empty-mismatch
table-cell-token-mismatch
```

**降格しない signal** (allowlist に入れない理由):

| 型 | 残す理由 |
|---|---|
| `missing-snapshot` | EN snapshot が無い page を検出する gate signal。降格すると新規ページが silently green になる |
| `source-snapshot-missing` | sourceUrl があるのに snapshot が無いケース。同上 |
| `content-root-missing` | 現状 emitter が無い（型定義のみ残置）。Phase 8 では触らずに保留 |

allowlist は `scripts/lib/source_parity_types.mjs` に `COARSE_SIGNAL_TYPES` として `Object.freeze(new Set([...]))` で公開する。`severity ベースで全部弾く` 実装はしない。

### 3.2 新カウンタ命名

`activeFiles` / `activeActionableFiles` / `activeErrorFiles` の意味は **変更しない**。既存の summary・テスト・downstream 消費者がこの値を読んでいるため、再定義は副作用が読めない。

代わりに次を summary に追加する:

```text
reportableActiveFiles               // coarse signal を除いた active file 数
reportableActiveActionableFiles     // 同上 actionable severity 限定
auditSignalIssues                   // coarse signal の総 issue 数
auditSignalFiles                    // coarse signal を 1 件以上含む file 数
auditSignalsByType                  // coarse signal の type 別件数
```

`gateActive*` ではなく `reportableActive*` を採用する理由は、`parityRegression` の `shouldOpenIssue` 判定もこの値を使うため（gate 専用名は意味が狭すぎる）。

### 3.3 `isReportableParityIssue` の restrictive 化

`scripts/lib/source_parity_issue_state.mjs` の `isReportableParityIssue` を coarse signal を弾く方向に restrictive 化する。新規 predicate `isCoarseAuditSignal(issue)` を追加し、

```text
isReportableParityIssue(issue):
  if isCoarseAuditSignal(issue): return false      // ← 追加
  if severity not in {actionable, signal}: return false
  if isFrozenByBaseline(issue): return false
  return isActiveParityIssue(issue)
```

`isCoarseAuditSignal` は `COARSE_SIGNAL_TYPES.has(issue.type)` のみで判定する。`severity` や `acknowledged` は見ない。**expired ack / expired baseline 付き coarse signal も `isReportableParityIssue` を通過しない** ことが Phase 8 の意図。

### 3.4 Gate exit code の切り替え

`scripts/check_source_parity.mjs` の `failOn` 判定を新カウンタに切り替える。

| `failOn` モード | 旧判定 | 新判定 |
|---|---|---|
| `actionable` | `activeActionableFiles + activeErrorFiles > 0` | `reportableActiveActionableFiles + activeErrorFiles > 0` |
| `any` (default) | `activeFiles > 0` | `reportableActiveFiles + activeErrorFiles > 0` |

`activeErrorFiles` は `source-fetch-error` 等の真のエラーを引き続き fail させるため、**全モード**でそのまま使う。

### 3.5 `parityRegression` 経路の自動降格

`detection_reports.mjs` の `buildParityEntries(files, isReportableParityIssue)` は同じ predicate を共有しているため、§3.3 の変更だけで `parityRegression.topEntries` / `body` / `summary.issuesByType` から coarse signal が自動的に消える。`shouldOpenIssue` も自動的に `false` に倒れる（coarse-only file の場合）。

### 3.6 `auditManifest` の保護

`auditManifest` は snapshot-driven のまま。Phase 8 で:
- coarse signal を `entries[].signals[]` に追加で流すこと
- `signals[]` の既存 cross-reference を消すこと

の **どちらもしない**。守るべき性質は「parity-only file (snapshot 変更が無いのに parity issue だけ出る file) が新しい manifest entry を作らない」こと。これは現状でも守られているが、Phase 8 で test に固定する。

### 3.7 `runScope` の伝播経路

```text
check_source_parity.mjs
  └─ summary.runScope = { type, isComplete, filters }
       │
       ▼
parity-check-status.json
       │
       ▼
generate_detection_reports.mjs
  └─ loadDetectionInputs() → buildActionableReport(snapshot, parity, manifest, { sourceSync })
       │
       ▼
detection_reports.mjs::buildActionableReport
  └─ report.runScope = parity.summary?.runScope ?? null   // ← 追加
       │
       ▼
docs-actionable-report.json (top-level runScope)
       │
       ▼
.github/scripts/sync-detection-issues.cjs
  └─ if (report.runScope?.isComplete !== true) {
       core.warning('Skipping issue sync — partial run');
       return;
     }
```

`runScope.type`:
- `'full'` — `--slug` も `--section` も指定なし（schedule 実行時の正規パターン）
- `'slug'` — `--slug=<value>` 指定
- `'section'` — `--section=<value>` 指定

`runScope.isComplete`:
- `'full'` の場合のみ `true`
- それ以外は `false`

`isComplete === false` の場合、`sync-detection-issues.cjs` は managed issue を一切触らずに早期 return する。この guard は workflow が間違って partial run の output を sync ステップに渡しても managed issue を上書きしないための **構造的な防壁** であり、workflow YAML の comment や CODEOWNERS だけに依存しない。

---

## 4. Implementation Plan — PR Structure

### 4.1 PR1 — Coarse signal demotion

**Goal**: §1.1 を実装する。`runScope` には触らない。

**Commit 構成**:

1. `docs: Phase 8 design spec` — この spec doc 自体
2. `feat: COARSE_SIGNAL_TYPES allowlist + isCoarseAuditSignal predicate` (test-first)
3. `feat: reportableActive counters in summary` (test-first, `activeFiles` 等は触らない)
4. `feat: parityRegression excludes coarse signals` (test-first)
   - `isReportableParityIssue` の restrictive 化
   - 既存 `detection_reports.mjs` への自動波及を test で確認
5. `feat: gate exit code uses reportableActive counters` (test-first)
   - **expired ack 付き coarse signal でも fail しない**
   - **expired baseline 付き coarse signal でも fail しない**
6. `feat: --include-audit-signals CLI flag` — `[Phase 8 audit signals]` セクション表示
7. `docs: README — Phase 8 audit demotion`

**先に書くテスト** (codex 5 補正点を反映):

| # | 場所 | 主張 |
|---|---|---|
| T1 | `source_parity_issue_state.test.mjs` (新規 or 既存に追加) | `isCoarseAuditSignal('paragraph-count-mismatch') === true`, `isCoarseAuditSignal('missing-snapshot') === false` |
| T2 | `source_parity.test.mjs` 拡張 | summary に `reportableActive*` / `auditSignal*` が入る。`activeFiles` の旧定義は値が変わらない |
| T3 | `detection_reports.test.mjs` 拡張 | `parityRegression.shouldOpenIssue === false` for `paragraph-count-mismatch`-only file |
| T4 | `detection_reports.test.mjs` 拡張 | mixed file (`image-mismatch` + `paragraph-count-mismatch`) で body に `image-mismatch` のみ。`paragraph-count-mismatch` の detail は出ない |
| T5 | `detection_reports.test.mjs` 拡張 | parity-only file (snapshot 変更なし、coarse signal あり) が `auditManifest` に新 entry を作らない。`entries[].signals[]` の既存 cross-reference は維持 |
| T6 | `detection_reports.test.mjs` + `sync_detection_issues.test.mjs` 拡張 | `buildIssueSpecs(report).length === 4`（4 family のまま）。coarse-only run で `parityRegression.shouldOpenIssue === false` |
| T7 | `check_source_parity.test.mjs` 拡張 | `failOn=actionable` で actionable-only file が依然 fail |
| T8 | `check_source_parity.test.mjs` 拡張 | `failOn=any` で coarse-only file が exit 0 |
| T8b | `check_source_parity.test.mjs` 拡張 | `failOn=any` / default で error-only file が exit 1 |
| T9 | `check_source_parity.test.mjs` 拡張 | **expired ack 付き coarse signal でも `parityRegression` 不発火 + exit 0** |
| T10 | `check_source_parity.test.mjs` 拡張 | **expired baseline 付き coarse signal でも `parityRegression` 不発火 + exit 0** |
| T11 | `detection_reports.test.mjs` 拡張 | `docs-update-summary.md` (renderSummaryMarkdown) で coarse signal が `## Parity` の active count には含まれず、新セクション `## Audit Signals` 側にだけ出る |
| T12 | `source_parity_align_runtime.test.mjs` / `source_parity_recall.test.mjs` | Phase 5/6A の既存 mutation recall が回帰しない（C2/C3 と同等） |

### 4.2 PR2 — runScope propagation + sync no-op guard + workflow

**Goal**: §1.2 を実装する。

**Commit 構成**:

1. `feat: parity-check-status runScope` (test-first)
2. `feat: propagate runScope through actionable report` (test-first)
3. `feat: sync-detection-issues no-op on partial run` (test-first)
4. `chore: workflow split contract comments`
5. `docs: OPS_DESIGN — Phase 8 workflow split contract`

**先に書くテスト**:

| # | 場所 | 主張 |
|---|---|---|
| U1 | `check_source_parity.test.mjs` | full run で `summary.runScope === { type: 'full', isComplete: true, filters: { slug: null, section: null } }` |
| U2 | 同上 | `--slug=...` 指定で `runScope.type === 'slug'` / `isComplete === false` / `filters.slug` 一致 |
| U3 | 同上 | `--section=...` 指定で `runScope.type === 'section'` / `isComplete === false` / `filters.section` 一致 |
| U4 | `detection_reports.test.mjs` | `buildActionableReport` が `runScope` を top-level に複写する |
| U5 | `sync_detection_issues.test.mjs` | `report.runScope.isComplete === false` で no-op + warning。`github.rest.issues.*` を呼ばない |
| U6 | 同上 | `report.runScope` 欠如時(legacy) は **既存挙動どおり sync する**(後方互換) |
| U7 | 同上 | `report.runScope.isComplete === true` で正常 sync |

---

## 5. Exit Criteria

Phase 8 を merge してよい条件。

| ID | 条件 | 検証 |
|---|---|---|
| **D1** | Phase 5/6A mutation recall 回帰なし | `node --test scripts/__tests__/source_parity_recall.test.mjs` pass |
| **D2** | Phase 6A baseline recall 回帰なし | `node --test scripts/__tests__/source_parity_baseline_recall.test.mjs` pass |
| **D3** | coarse signal が `parityRegression.shouldOpenIssue` を発火させない | T3 / T4 / T6 pass |
| **D4** | coarse signal が `auditManifest` に新 entry を生まない | T5 pass |
| **D5** | family count 4 のまま | T6 pass (`buildIssueSpecs(report).length === 4`) |
| **D6** | 既存 `activeFiles` の値が変わらない | T2 pass |
| **D7** | gate exit code が actionable で fail し coarse-only で pass | T7 / T8 pass |
| **D8** | expired ack/baseline 付き coarse signal も `parityRegression` 不発火 + exit 0 | T9 / T10 pass |
| **D9** | partial run が managed issue を上書きしない | U5 pass |
| **D10** | 後方互換: `runScope` 欠如時は従来どおり sync | U6 pass |
| **D11** | docs 更新済 | `scripts/README.md` Phase 8 セクション、`docs/OPS_DESIGN.md` workflow split contract セクション |

---

## 6. Risks and Mitigations

| リスク | 影響 | 緩和 |
|---|---|---|
| `isCoarseAuditSignal` の allowlist が将来の新 issue type を取りこぼす | 新しい signal が誤って `parityRegression` に乗る | allowlist は `source_parity_types.mjs` に集約。新 type 追加時の review checklist に「audit-only か gate-eligible か」を追加 |
| `reportableActiveFiles` を読み忘れた downstream が古い `activeFiles` を gate 判定に使い続ける | 意図せず coarse signal で fail | grep で `activeFiles` の使用箇所を全洗い、新カウンタへの切り替えは `check_source_parity.mjs` の exit code 判定と `detection_reports.mjs` の `parityRegression.shouldOpenIssue` 経路だけに限定 |
| `runScope` が actionable report から漏れる経路 | sync guard が空回りして partial run が通る | `buildActionableReport` の test (U4) で top-level 存在を assert |
| `runScope` 欠如時 (legacy) に sync を止めると既存 CI が壊れる | scheduled-actionable の green が崩れる | U6 で legacy 後方互換を test 化。欠如 = 従来挙動と決めて runtime で fail-open |
| coarse signal を audit に落としたことを reviewer が見落とし、PR 中で advisory に戻す | Phase 7 境界が崩れる | spec doc (本ファイル) と `scripts/README.md` の Phase 8 セクションで boundary を明示 |
| `failOn=any` の挙動が変わることに気付かない consumer | 知らないうちに gate が緩む | spec doc + README に変更を明記。CI workflow は元々 `continue-on-error: true` で呼んでいるため表面化リスクは低い |

---

## 7. Out-of-scope (Phase 9 以降の検討)

- coarse signal の完全削除 (型 / emitter / acknowledgements 撤去)
- `parity-acknowledgements.json` の既存 41 entries の paydown
- `auditManifest` の per-signal review queue 化
- `runScope` を `--slug` partial run の場合に部分 sync する経路（current scope では full run のみ sync）

---

## 8. References

- Issue #225 本文
- `docs/superpowers/specs/2026-04-06-issue-225-phase-6a-design.md` (前段の cutover spec)
- `docs/superpowers/specs/2026-04-06-issue-225-phase-6b-design.md` (review queue spec)
- `scripts/README.md` Phase 5–7 セクション
- `docs/OPS_DESIGN.md` 「CI の役割」「定期運用（3日ごと）」セクション
- `scripts/lib/source_parity_types.mjs` `ISSUE_SEVERITY` テーブル
- `scripts/lib/source_parity_issue_state.mjs` 共有 predicate
- `scripts/lib/detection_reports.mjs` 4-family builder
- `.github/scripts/sync-detection-issues.cjs` managed issue sync
- `.github/workflows/scheduled-actionable.yml` / `deep-audit.yml`
- codex Phase 8 注意点 (このセッションの初回 user message + その後の 2 回のフィードバック)
