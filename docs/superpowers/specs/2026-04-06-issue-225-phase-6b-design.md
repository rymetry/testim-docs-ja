# Issue #225 Phase 6B — Tokenless Near-Tie Review Queue Design

- **Date**: 2026-04-06
- **Issue**: #225
- **Phase**: 6B（Phase 6 の後半、provider-free re-scope）
- **Status**: 設計更新済み — 実装着手可
- **Predecessor**: Phase 6A — exact gate promotion + frozen baseline
- **Relationship to gate**: advisory / review queue only — CI exit code は変えない

---

## 1. Scope

Phase 6B の責務は、Phase 6A が `segment-inconclusive` として検出し、
`inconclusiveCategory: tokenless-near-tie` で baseline 化されたページを、
**LLM / 人手 review 用の queue として見やすく surfacing すること**に限定する。

含む:

- `tokenless-near-tie` issue を review queue として導出する純粋関数の追加
- `parity-check-status.json` に review queue を同居させる
- summary に queue 件数を追加する
- `check_source_parity.mjs` に `--include-advisory` フラグを追加し、CLI に review queue を表示する
- queue を workflow が安全に読めるよう、stable `queueKey` と `advisoryQueueScope` を追加する
- `docs/OPS_DESIGN.md` と `scripts/README.md` に LLM / 手動 triage 手順を追加する
- 現在の 7 件を manual triage するための運用土台を作る

含まない:

- 新しい semantic detector
- `SemanticProvider` interface
- stub / real embedding provider
- `suspected-section-swap` などの新 issue type
- mutation corpus 拡張や advisory benchmark
- detection report / issue sync への自動統合
- gate への統合

---

## 2. Why This Re-scope

当初の 6B は「semantic advisory / provider integration」を想定していたが、
運用前提として **外部 provider を使わない** ことが確定した。

この前提では:

- stub detector の結果は correctness review に使えない
- new detector / provider interface / benchmark を増やしても運用価値が薄い
- 一方で `tokenless-near-tie` 7 件は現実の review 対象として残る

したがって Phase 6B は、
**検知器を増やす phase ではなく、既知の曖昧ケースを review queue 化する phase**
に再定義する。

---

## 3. Data Model

### 3.1 Review queue entry

`parity-check-status.json` に top-level `advisoryQueue` を追加する。

```json
{
  "slug": "running-tests/scheduler",
  "file": "src/content/docs/running-tests/scheduler.md",
  "sourceUrl": "https://docs.tricentis.com/...",
  "category": "running-tests",
  "blocking": false,
  "issueCount": 1,
  "issues": [
    {
      "type": "segment-inconclusive",
      "queueKey": "running-tests/scheduler|segment-inconclusive|category=tokenless-near-tie|pair=Modify your scheduled test suites > Activate or Pause=>Modify your scheduled test suites > Edit",
      "severity": "actionable",
      "inconclusiveCategory": "tokenless-near-tie",
      "inconclusiveReason": "Tokenless adjacent sections ...",
      "detail": "alignment inconclusive [tokenless-near-tie]: ...",
      "leftSectionPath": "Modify your scheduled test suites > Activate or Pause",
      "rightSectionPath": "Modify your scheduled test suites > Edit",
      "currentScore": 1.34,
      "swapScore": 1.35,
      "baselined": true,
      "baselineReviewAfter": "2026-10-06",
      "baselineExpired": false
    }
  ]
}
```

### 3.2 Summary fields

`summary` に以下を追加する。

```json
{
  "advisoryQueueIssues": 7,
  "advisoryQueueFiles": 7,
  "advisoryQueueComplete": true,
  "advisoryQueueScopeType": "full",
  "advisoryQueueByCategory": {
    "tokenless-near-tie": 7
  }
}
```

top-level には次も追加する:

```json
{
  "advisoryQueueScope": {
    "type": "full",
    "isComplete": true,
    "filters": {
      "slug": null,
      "section": null
    },
    "checkedFiles": 288,
    "totalFiles": 288
  }
}
```

これらは **derived metadata** であり、既存 issue accounting を置き換えない。

---

## 4. Queue Derivation Rules

review queue に入るのは、次を満たす issue のみ:

- `type === 'segment-inconclusive'`
- `inconclusiveCategory === 'tokenless-near-tie'`

補足:

- `baselined === true` の場合は `blocking: false`
- baseline されていない場合は `blocking: true`
- 他の `segment-inconclusive`（`heading-count-mismatch`, `align-exception`）は queue に入れない

この phase では **新しい判断を加えない**。Phase 6A が既に出した情報を絞って並べるだけにする。

---

## 5. CLI Policy

### 5.1 Default behavior

`npm run check:parity` の通常出力・exit code は変えない。

### 5.2 `--include-advisory`

`--include-advisory` が指定された場合のみ、CLI summary に
`[Phase 6B review queue]` セクションを追加する。

表示内容:

- queue 件数
- full run か partial run か
- slug ごとの state (`blocking review` / `baselined review`)
- `detail`
- `baselineReviewAfter` / `baselineExpired`

このフラグは **表示だけ** を増やす。検査ロジックや exit code には影響しない。

---

## 6. Reviewer Workflow

Phase 6B の reviewer / LLM worker は queue を見て、ページごとに以下を判断する。

1. 実際に tokenless prose swap の疑いが強い
2. ただの曖昧ケースで、翻訳としては問題ない
3. 追加の人手比較が必要

結果の反映:

- true positive: 通常の翻訳修正 PR を出す
- false positive / harmless ambiguity: 理由を記録し、必要なら baseline rationale を更新
- 保留: queue に残して後続 review

翻訳・PR 化の自動化自体は **Issue #175** の責務であり、6B はその前段の LLM/manual queue を提供するだけに留める。

---

## 7. Exit Criteria

- `npm run check:parity` の exit code が変わらない
- `npm run check:parity -- --include-advisory` で queue が表示される
- `parity-check-status.json` に `advisoryQueue` と summary fields が出力される
- Phase 6A recall / baseline-recall テストが回帰しない
- semantic provider, detector, benchmark を導入していない

---

## 8. Risks and Rollback

| リスク | 対処 |
|-------|------|
| review queue が「新 detector」と誤解される | docs / CLI で「derived from existing issues only」と明記 |
| queue を自動 triage したくなる | 自動化は #175 または別 Issue に切り出す |
| queue が stale になる | baseline cleanup を明示 PR で行う |

rollback は単純:

- `check_source_parity.mjs` の queue 出力を削除
- `source_parity_advisory_queue.mjs` を revert
- docs の 6B 記述を戻す

gate path には触れていないため、Phase 6A rollback playbook は不要。

---

## 9. Future Work

semantic detection を再検討するなら、**別 Issue / 別 Phase** として扱う。
その場合でも、この 6B review queue は人手 triage の土台として再利用できる。
