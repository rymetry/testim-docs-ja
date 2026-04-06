# Issue #225 Phase 6B — Tokenless Prose Advisory / Semantic Layer Design

- **Date**: 2026-04-06
- **Issue**: #225
- **Phase**: 6B（Phase 6 を 6A / 6B に分割した後半）
- **Status**: 設計ドラフト — 実装着手前に brainstorming による open question 解消が必要
- **Predecessor**: Phase 6A — exact gate promotion + frozen baseline
- **Successor**: Phase 7 — reporting / issue sync 4 family 化
- **Relationship to gate**: **advisory only** — CI exit code は変えない

---

## 1. Scope

Phase 6B の責務は、Phase 6A exact gate が検出できない **tokenless prose-only の section body swap** を別系統の **advisory signal** として surface することに限定する。**primary gate には決して入れない**。

含む:

- 新 issue type `suspected-section-swap` を導入（non-gate, advisory）
- cross-lingual semantic similarity provider の interface を定義
- deterministic な stub provider（テスト / CI 用）を実装
- `tokenless-near-tie` baseline エントリを最初の検出ターゲットにする
- `parity-check-status.json` の summary に advisory 集計フィールドを追加（`advisoryIssues` / `advisoryFiles` / `advisoriesByType`）
- CLI に `--include-advisory` フラグを追加（default off — 既存運用を壊さない）
- advisory 用の precision / recall benchmark を `source_parity_advisory_recall.test.mjs` として追加
- mutation corpus に `tokenless-section-body-swap` mutation を追加
- reviewer workflow を `docs/OPS_DESIGN.md` に記載

含まない（Non-goals）:

- **primary gate 統合** — advisory は CI exit code に一切影響しない
- LLM ベースの verification（expensive, Phase 6C 以降）
- 本番環境での embedding provider 選定 — interface のみ固定、実プロバイダは Phase 6B-2 で別 PR
- 一般目的の semantic alignment engine（existing exact engine の置き換え）
- Phase 6A baseline の paydown（別タスク）
- Phase 7 reporting 4 family 化（Phase 7 で別途）
- 新 severity `advisory` の導入 — 既存 `signal` severity 内に留める（severity 軸の増殖を避ける、Phase 6A で却下した B 案と同じ理由）
- embedding cache の persistent storage（メモリ内キャッシュのみで開始、disk cache は後続）
- Issue #225 non-goals（自然な日本語品質評価、LLM 意味評価、UI レンダリング、セマンティック対訳妥当性の完全保証）

---

## 2. Background — なぜ Phase 6A では足りないか

Phase 6A の exact gate は `alignSegments` の weighted LCS 実装で section-anchored に diff を出すが、以下のケースで false negative または `segment-inconclusive` に落ちる:

1. **Tokenless prose-only section body swap**
   - 隣接する 2 section が共に tokenless free-form prose
   - JA 側で body が swap されている（section A の見出しに section B の body が付いている）
   - invariant token がないので `findBodySwapEvidence()` が発火しない
   - `detectAmbiguousAdjacentTokenlessSwap()` が near-tie の場合のみ `inconclusive` に落とす
   - near-tie でなく clean に見えると silently pass する = **false negative**

2. **Phase 6A baseline の `tokenless-near-tie` エントリ**
   - 現状 7 件（`segment-inconclusive` / `inconclusiveCategory: tokenless-near-tie`）
   - これらは「swap されているかもしれない」と alignment が諦めたページ
   - 人間が確認するまでどちらか分からない
   - Phase 6B の最優先ターゲット

3. **Cross-language segment-move**
   - `source_parity_recall.test.mjs` の strict-recall set から除外
   - `segment-move` mutation に対する現状 recall は `1/8`（informational）
   - README 393 行目の「tokenless cross-language の head/tail 段落削除」注記

Phase 5 README L391 が明示している:

> **tokenless free-form section swap**: Phase 5 の exact gate では `segment-shifted` を出さない。長さシグナルだけで swap を推定すると正常翻訳を false inconclusive にしやすいため、`inconclusive` に落とすのは current/swap が **ほぼ区別できない near-tie** の場合に限定する。つまり tokenless prose-only swap は基本的に Phase 5 の exact scope 外であり、本格対応は semantic signal（translation memory / embeddings）が入る Phase 6+ の課題。

Phase 6B はこの「Phase 6+ の課題」の最初のイテレーション。

---

## 3. Advisory Signal Policy

### 3.1 `suspected-section-swap` の定義

新 issue type `suspected-section-swap` を追加する。

| 属性 | 値 |
|------|---|
| `type` | `suspected-section-swap` |
| `severity` | `signal`（既存 severity を流用、新 severity は作らない） |
| `phase` | `advisory`（新 phase tag、gate 集計から明示的に除外） |
| gate exit code 影響 | **なし** — `failOn=actionable` も `failOn=any` も advisory をカウントしない |
| acknowledgeable | false（`NON_ACKNOWLEDGEABLE_TYPES` に追加） |
| baseline 対象 | false（`BASELINE_ELIGIBLE_TYPES` に追加しない） |
| 出力 | `parity-check-status.json` の `files[].issues` 配列内 + `summary.advisoryIssues` 等 |
| CLI 表示 | default off、`--include-advisory` フラグで ON |

**Phase 6A との差異**: Phase 6A の `segment-*` は `severity: actionable` で gate を通り、baseline で凍結される。Phase 6B の `suspected-section-swap` は `severity: signal` + `phase: advisory` で gate も baseline も経由しない。完全に別レイヤ。

### 3.2 なぜ新 severity を作らないか

Phase 6A の質問 2 で議論した論点:

> 新 severity 追加は Phase 7 を巻き込む。reporting 4 family、issue sync、CLI summary、JSON schema、CI exit code 評価ロジック、ack validation など全部追従。

同じ理由が Phase 6B にも当てはまる。`signal` severity は既に「gate を fail させない非ブロッキング指標」として定義されているので、advisory を `signal` に載せれば severity 軸を増やさずに済む。`phase: 'advisory'` tag で signal 集計からも分離する。

Phase 6A の `phase: 'segment-shadow'` → `phase: 'advisory'` と同じパターン。

### 3.3 advisory の意味論

- advisory signal は **「人が見直すべきページ」** を伝える
- 自動的に CI を fail させない
- reviewer は advisory を見て:
  - 正しい翻訳 → 何もしない、または false positive として報告
  - swap 検出が正しい → 翻訳修正 PR を出す
  - 判断不能 → LLM / 手動比較 / Phase 6C で再評価
- advisory は issue tracker に自動起票しない（Phase 7 reporting 方針に合わせて再検討）

---

## 4. Semantic Detection Architecture

### 4.1 コンポーネント

```
┌─────────────────────────────────────────────────────────────┐
│                  check_source_parity.mjs                     │
│  (既存 — alignment → baseline tagging → exit code)            │
└──────────────────────────┬──────────────────────────────────┘
                           │ if --include-advisory
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              advisory_section_swap.mjs (新設)                │
│  - 対象ページ絞り込み (tokenless-near-tie 優先)                 │
│  - 各 section の body vector を生成                            │
│  - cross-lingual 類似度行列を計算                              │
│  - linear assignment vs heading-order 比較                    │
│  - suspected-section-swap advisory を emit                   │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│        SemanticProvider interface (新設)                     │
│  - async embed(texts: string[], language: 'en'|'ja'): number[][]│
│  - name: string                                             │
│  - version: string                                          │
└──────────────┬──────────────────────────────────────────────┘
               │
      ┌────────┴────────┐
      │                 │
      ▼                 ▼
┌──────────────┐  ┌──────────────────────┐
│ StubProvider │  │ Real provider (TBD)   │
│ (deterministic) │ (Phase 6B-2)          │
└──────────────┘  └──────────────────────┘
```

### 4.2 SemanticProvider interface

```javascript
/**
 * @typedef {object} SemanticProvider
 * @property {string} name        stable identifier, e.g. 'stub-deterministic-v1'
 * @property {string} version     semver, used for cache invalidation
 * @property {number} dimension   embedding vector length
 * @property {(texts: string[], language?: 'en' | 'ja') => Promise<number[][]>} embed
 *   Batch embed. Returns `texts.length` vectors. Language hint may be ignored
 *   by multilingual models but is passed through for providers that require it.
 */
```

**設計原則**:
- I/O は provider 内に隔離（stub は pure、real provider は async / network）
- provider の `name + version` が cache key の一部になる
- 複数 provider を同時に使う想定はしない（設定で切り替え）
- Phase 6B-1 では `StubProvider` のみ ship、`RealProvider` は Phase 6B-2

### 4.3 Stub provider

`scripts/lib/semantic_providers/stub_deterministic.mjs`:

- SHA-256 ベースの疑似 embedding
- 同じ入力 → 同じ出力（deterministic）
- network / 外部依存なし
- **重要**: stub は real の代替ではない。**stub で benchmark が pass しても real provider で pass する保証はない**。stub は pipeline の配管テスト専用。
- 疑似類似度は text length overlap / character n-gram overlap などの軽量シグナルで計算

**アルゴリズム候補（brainstorming で確定）**:
1. **Character trigram cosine**: 各 text を char trigram の sparse vector 化、cosine。cross-lingual ではないので stub としては弱いが deterministic。
2. **Byte hash projection**: SHA-256 を dimension 個の float に projection。意味的意義なし、pipeline テスト専用。
3. **Mixed**: trigram + byte hash 結合。

stub の目的は「advisory detector のコードパスを end-to-end 検証する」ことなので意味論的精度は無用。**(2) byte hash projection** を推奨：deterministic かつ依存なし。

### 4.4 Advisory detector algorithm

`scripts/lib/advisory_section_swap.mjs`:

```
Input: enSegments, jaSegments (Phase 6A extractors の出力), provider

1. section 分割 (Phase 6A と同じ splitIntoSections)
2. 各 section の body vector を計算:
   - section 内の non-heading segment の text を concatenate
   - provider.embed([en_body_0, en_body_1, ..., ja_body_0, ja_body_1, ...])
   - en_vec[i], ja_vec[i] を得る
3. 類似度行列を計算:
   - sim[i][j] = cosine(en_vec[i], ja_vec[j])
4. Assignment:
   - linear_score = sum(sim[i][i]) for i in sections  // heading order
   - best_assignment = Hungarian algorithm on sim matrix
   - best_score = sum(sim[i][best[i]])
5. Swap detection:
   - delta = best_score - linear_score
   - if delta > DELTA_THRESHOLD and best != linear:
       for each (i, j) where best[i] != i:
         emit suspected-section-swap advisory with evidence
```

**閾値候補（brainstorming 確定が必要）**:
- `DELTA_THRESHOLD`: best と linear の差が 0.15 以上か（実値は real provider で測定）
- `MIN_BODY_LENGTH`: body が短すぎる section は無視（例: < 50 chars）
- `MIN_SECTIONS`: 1 section しかないページは advisory 対象外

**Fallback**: Hungarian 実装を入れる代わりに、2-section swap だけ扱う simpler version（最初のイテレーションで十分）。3 以上の permutation は希。

### 4.5 対象ページの絞り込み

default では **tokenless-near-tie baseline エントリを持つページのみ** advisory 対象にする。全ページ走査は:
- embedding コストが線形に増える
- false positive のリスクが上がる
- 現状 7 ページなら 7 * (embedding count) で済む

CLI フラグで拡張可能:
- `--include-advisory` (default: near-tie pages のみ)
- `--advisory-scope=all`（全ページ、遅い、将来）
- `--advisory-scope=slug=...`（特定 slug、debug 用）

### 4.6 出力フォーマット

`parity-check-status.json` の `files[].issues` に以下を追加:

```json
{
  "type": "suspected-section-swap",
  "severity": "signal",
  "phase": "advisory",
  "provider": "stub-deterministic-v1",
  "detail": "[Setup / Usage] 両 section の body が入れ替わっている可能性",
  "sectionPath": "Setup",
  "swappedWith": "Usage",
  "sectionIndex": 1,
  "swappedSectionIndex": 2,
  "confidence": "medium",
  "evidence": {
    "linearScore": 0.42,
    "swapScore": 0.81,
    "delta": 0.39,
    "deltaThreshold": 0.15
  }
}
```

`summary` に:

```json
{
  "advisoryIssues": 3,
  "advisoryFiles": 2,
  "advisoriesByType": { "suspected-section-swap": 3 },
  "advisoryProvider": "stub-deterministic-v1"
}
```

---

## 5. Implementation Plan — Phased Approach

Phase 6B は 3 本の PR に分割する。各 PR は独立 spec + 独立 review + 独立 rollback。

### Phase 6B-1 — Infrastructure (stub provider)

**Goal**: advisory channel と detector を全部接続するが、実 provider は stub のみ。CI exit code は一切変わらない。

**Deliverables**:
1. `suspected-section-swap` issue type を `ISSUE_SEVERITY` に追加（`signal`）
2. `NON_ACKNOWLEDGEABLE_TYPES` に `suspected-section-swap` を追加
3. `summarizeParityResults` に advisory accounting を追加（`advisoryIssues` / `advisoryFiles` / `advisoriesByType`）
4. `SemanticProvider` interface + `StubProvider` 実装
5. `advisory_section_swap.mjs` detector 実装（Hungarian or 2-swap simple version）
6. `check_source_parity.mjs` に `--include-advisory` フラグと detector 呼び出し
7. CLI に `[Phase 6B advisory]` 出力セクション
8. `source_parity_advisory.test.mjs` 単体テスト
9. `mutation_corpus.mjs` に `tokenless-section-body-swap` mutation 追加
10. `source_parity_advisory_recall.test.mjs` benchmark（stub provider で動作、数値 Go 条件はなし）
11. `scripts/README.md` に Phase 6B-1 セクション追加

**Exit criteria (Phase 6B-1)**:
- 全テスト pass
- `npm run check:parity` (flag なし) → 出力・exit code が変わらない
- `npm run check:parity -- --include-advisory` → advisory 出力が出る
- `tokenless-near-tie` page 7 件で advisory detector が動作（stub なので結果は意味なし）
- advisory issue は gate exit code を変えない
- Phase 6A の recall benchmark が回帰しない

**Not gated by precision/recall**: stub provider の結果は意味がないので、精度は Phase 6B-2 で測る。

### Phase 6B-2 — Real provider integration

**Goal**: 実際に意味のある cross-lingual embedding を使って precision / recall を測定する。

**Deliverables**:
1. Real `SemanticProvider` 実装（**which provider を決める必要あり** — open question §6）
2. Embedding cache（content-hash based、in-memory で開始、disk は後続）
3. 閾値 tuning（`DELTA_THRESHOLD` などの実測）
4. Real benchmark 実行と結果の report（`advisory-benchmark-report.json`）
5. 7 件の `tokenless-near-tie` page を手動で ground truth 化
6. precision / recall の測定値を spec に記録

**Exit criteria (Phase 6B-2)**:
- Real provider で benchmark が動く
- 既知の section swap を **少なくとも 1 件** 検出（hard gate ではない、informational）
- false positive rate < 10% on un-mutated pages
- provider の cost / latency を記録

**Informational targets (not gate)**:
- recall on synthetic swap mutations ≥ 50%
- precision on un-mutated pages ≥ 90%

数値は hard gate ではない。Phase 6B はあくまで advisory で、advisory signal の品質を gate で強制するのは筋が違う。

### Phase 6B-3 — Rollout and reviewer workflow

**Goal**: 現状の `tokenless-near-tie` baseline エントリを人間がレビューできる状態にする。

**Deliverables**:
1. `docs/OPS_DESIGN.md` に advisory reviewer workflow section 追加
2. 7 件の `tokenless-near-tie` page を実データで triage
3. false positive だった場合は detector の誤発火原因を調査
4. true positive だった場合は翻訳修正 PR を起こす
5. 学びを Phase 6C / Phase 7 の brainstorming ネタとして記録

**Exit criteria (Phase 6B-3)**:
- 7 件の tokenless-near-tie を個別に処理完了（修正 or false positive として記録）
- reviewer workflow が documented
- Phase 6A baseline から `tokenless-near-tie` エントリを削減（自然消化 or explicit rebaseline）

---

## 6. Open Questions

以下は brainstorming で確定が必要。Phase 6B-1 着手前に解消する。

### Q1. Real embedding provider の選定

選択肢:
- **A. OpenAI `text-embedding-3-small`** — 1536 次元、安価（$0.02/1M tokens）、高品質、要 API key
- **B. Voyage AI `voyage-multilingual-2`** — 1024 次元、EN/JA を含む多言語、要 API key
- **C. Cohere `embed-multilingual-v3`** — 1024 次元、要 API key
- **D. Local sentence-transformers (paraphrase-multilingual-mpnet-base-v2)** — 要 Python + heavy deps
- **E. local onnx モデル** — 軽量、要 onnxruntime-node + モデルファイル

**推奨: A (OpenAI)** — install 不要、すでに多くのプロジェクトで実績、monthly cost が minimal（7 page * 10 sections = 70 embed calls / run）。

### Q2. Embedding cache の方針

選択肢:
- **A. In-memory のみ** — シンプル、再実行時に毎回 embed
- **B. Disk cache（gitignored）** — `.cache/semantic-embeddings/<provider>-<version>/<hash>.json`、再実行高速化
- **C. Disk cache（committed）** — benchmark を CI で安定化

**推奨: A → B 段階的** — Phase 6B-1 は in-memory のみ、Phase 6B-2 で disk cache を導入。

### Q3. Advisory scope の default

選択肢:
- **A. `tokenless-near-tie` baseline エントリのあるページのみ** — 7 page、高速、focused
- **B. 全ページ** — full precision/recall 測定だが遅い
- **C. sampling** — ランダム 10% で監視

**推奨: A** — PoC として狭く始めて、Phase 6B-3 の知見で拡大判断。

### Q4. Hungarian vs 2-swap simple

選択肢:
- **A. 完全な Hungarian algorithm** — N sections の任意 permutation 検出
- **B. 2-swap simple** — 隣接 2 section の swap のみ検出（Phase 6A の `detectAmbiguousAdjacentTokenlessSwap` と対応）
- **C. Top-k mismatch** — 最も ambiguous な 1 pair だけ flag

**推奨: B** — Phase 6A が隣接 swap だけに注目しているので整合的、実装シンプル、false positive も少ない。3-permutation swap は稀。Phase 6C で Hungarian に拡張可能。

### Q5. Advisory 結果の persistence

選択肢:
- **A. parity-check-status.json に同居** — 既存 pipeline に統合、reporting は Phase 7 で再編
- **B. 別ファイル `parity-advisory-status.json`** — 明示的分離
- **C. 両方**

**推奨: A** — Phase 6A で summary にフィールドを拡張するパターンを既に使っているので同じ方式が自然。Phase 7 で reporting 4 family 化する際に advisory を独立 family に切り出す。

### Q6. Reviewer workflow の自動化度

選択肢:
- **A. 完全手動** — reviewer が CLI 出力を見て判断
- **B. GitHub Issue 自動起票** — `sync-detection-issues.cjs` に advisory family を追加
- **C. Slack 通知**

**推奨: A → B 段階的** — Phase 6B-1 / 6B-2 は手動、Phase 7 reporting と同期して B に拡張。

### Q7. CI での取り扱い

選択肢:
- **A. CI で advisory を実行しない** — PR CI は exact gate のみ
- **B. CI で実行するが fail させない** — advisory 件数を PR comment として post
- **C. 専用 workflow** — `advisory-check.yml` を scheduled で回す

**推奨: C** — scheduled で回して advisory-only の issue tracker を更新。PR CI は高速のまま維持。

---

## 7. Risks and Mitigations

| リスク | 影響 | 緩和 |
|-------|------|-----|
| stub provider の結果が意味なく reviewer が真に受ける | false positive 量産 | Phase 6B-1 では `--include-advisory` default off、CLI 出力に `[stub — not meaningful]` 注記 |
| real provider の cost が膨らむ | unexpected charges | provider cost estimation を Phase 6B-2 spec に明記、月次 budget 上限を設定 |
| advisory detector が exact gate を regression させる | CI 壊れる | advisory は完全に別コードパス、既存 recall test を回帰防止 |
| Hungarian implementation のバグ | false positive / negative | 2-swap simple で開始、Phase 6C で拡張 |
| 7 件の tokenless-near-tie の ground truth が曖昧 | benchmark が信頼できない | 手動 triage で case-by-case に判定、結果を documented |
| Phase 6A baseline paydown と衝突 | baseline entries が変動 | Phase 6B は baseline を触らない、paydown は別タスク |
| embedding provider vendor lock-in | 切り替えコスト | SemanticProvider interface で抽象化、切り替え可能な設計 |

---

## 8. Non-goals — 明示再掲

- Phase 6A の gate logic への変更
- `segment-inconclusive` severity の変更
- Phase 6A baseline の paydown
- LLM 検証 (Phase 6C 以降)
- Phase 7 reporting 4 family 統合
- production embedding provider の確定選定（interface のみ固定）
- 新 severity `advisory` の導入
- Disk-persistent cache（Phase 6B-2 以降）
- 一般目的の semantic alignment 置き換え
- Issue #225 non-goals（自然な日本語品質評価、UI レンダリング、完全保証）

---

## 9. References

- Phase 6A design: `docs/superpowers/specs/2026-04-06-issue-225-phase-6a-design.md`
- Phase 5 README L391 — tokenless prose-only swap を Phase 6+ の課題と明記
- `scripts/lib/source_parity_align.mjs` — `detectAmbiguousAdjacentTokenlessSwap()`
- `scripts/lib/mutation_corpus.mjs` — mutation corpus（`section-body-swap` / `segment-move`）
- `scripts/__tests__/source_parity_recall.test.mjs` — `segment-move` を informational として報告
- Issue #225 design plan v5 §21 non-goals — LLM による意味評価の本格導入は Issue 全体の non-goal

---

## 10. Status

**この spec は draft です。** Phase 6B-1 着手前に `superpowers:brainstorming` で §6 の open question をすべて解消してください。解消後は本 spec の該当箇所を更新してから実装に入る。

Phase 6A PR1 merge 時点（2026-04-06）の tokenless-near-tie count は **7 件** で、これが Phase 6B-3 triage の初期対象。この数は Phase 6A 運用中に変動する可能性があるので、Phase 6B-1 着手時に最新値を再確認する。
