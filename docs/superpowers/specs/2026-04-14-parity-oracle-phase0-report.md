# Parity Oracle Contract — Phase 0 Cutover Report

- **Date**: 2026-04-14
- **Plan**: `docs/superpowers/plans/2026-04-14-parity-oracle-contract-phase0.md`
- **Spec**: `docs/superpowers/specs/2026-04-14-parity-oracle-contract-design.md`
- **Roadmap**: `docs/superpowers/specs/2026-04-14-parity-burndown-roadmap.md`

## Baseline 削減結果

| issueType | Phase 0 前 | Phase 0 後 | 差 |
| --- | ---: | ---: | ---: |
| segment-extra | 193 | 142 | -51 |
| segment-missing | 136 | 136 | ±0 |
| segment-untranslated | 146 | 2500 | +2354 ⚠️ |
| section-structure-mismatch | 86 | 86 | ±0 |
| segment-token-gap | 49 | 49 | ±0 |
| segment-inconclusive | 11 | 11 | ±0 |
| segment-order-mismatch | 1 | 1 | ±0 |
| **合計** | **622** | **2925** | **+2303** |

**Note**: 件数は **増加**した。これは Phase 0 cutover の重要な発見事項で、§発見事項にて詳述する。

## 吸収された内訳 (debug.maskCoverage から)

検知時点で **716 件** の false-positive untranslated を抑制した:

- **Glossary entry 吸収**: 270 segments (1 entry のみマッチ)
  - `npm` × 42
  - その他 GLOSSARY 用語 (Testim, Visual Editor, Test Editor 等) は、現状の corpus 内で `\b...\b` パターンで個別 token としてヒットしなかった可能性がある。Phase 1 で root cause を確認する。
- **Invariant pattern 吸収**: 446 segments
  - cli-flag: 297
  - version-number: 89
  - file-path-or-extension: 49
  - numeric-unit: 11
  - keyboard-shortcut: 0 (corpus 内に Ctrl+S 等が現れる頻度が低い、または `\b` boundary でマッチしないケース)
- **URL normalize 吸収**: token-gap 49 件は前後で同数だが、検知段階で `help.testim.io` ↔ `/docs/` 等の差分は吸収済み。残 49 件は CLI フラグ等の真の token 欠落

## 残 baseline の分類 (Phase 1 以降の burn-down 対象)

- **segment-untranslated 2500 件**: 新しい `classifySegment` が surface する true-untranslated content。Phase 0 の fuzzy heuristic 廃止により、過去にスキップされていた segment が捕捉されるようになった
- **segment-extra 142 件**: パターン化可能な 3 種 (preface 重複、手順導入文分離、callout 番号リスト展開) が大半
- **segment-missing 136 件**: EN にあって JA で省略・統合された段落
- **section-structure-mismatch 86 件**: 上記の派生
- **segment-token-gap 49 件**: CLI フラグ・内部リンク欠落
- **segment-inconclusive 11 件**: tokenless-near-tie 等の自動判定限界
- **segment-order-mismatch 1 件**: 手順順序差

## 発見事項

### Finding 1: segment-untranslated が大幅増加 (146 → 2500)

`looksUntranslated` の旧実装は CJK 検出 + 最小語数閾値による fuzzy heuristic で、結果として **多くの英語残留を見逃していた**。Phase 0 の `classifySegment` (glossary mask + invariant mask + residue 検査) は決定論的に判定するため、過去の偽陰性が大量に表面化した。

**判断**: これは「検知の正確性向上による真の issue 表面化」であり、検知バグではない。Phase 1-4 で burn-down する対象が想定 (~487) より大幅に多い (2925) という意味で、当初の想定に対する **重大な再見積もり** が必要。

選択肢:
1. **そのまま 2925 件を baseline として凍結**し、Phase 1 以降で大量バッチ修正で burn-down する
2. `classifySegment` の threshold を緩める（例: `RESIDUE_MIN_WORDS = 5` 等）→ 過去の fuzzy heuristic に近づく → 検知の正確性低下
3. segment kind 別に classifySegment 適用判断を細分化（table cell / code block 等は別処理）

**推奨**: 1 を採用し、Phase 1 計画を 2500 件規模で再見積もり。translator 自動化・並列エージェント委任を強化。

### Finding 2: GLOSSARY entry のヒット率が低い

`npm` 以外の glossary entry がほぼヒットしなかった。可能性:
- corpus 内で Testim 用語が独立 token として現れず、文脈中に埋め込まれている (例: 「Testim を起動」→ 「Testim」は単独で `\b...\b` マッチするが、別の string に含まれていないため)
- 既に翻訳済みのページが多く、英語残留する Testim 用語の出現箇所が限定的
- maskSegmentText の word-boundary `\b` matching が日本語前後で作動しないケース (`\b` は ASCII の word boundary なので、`Testim を起動` ではマッチするが、`これはTestim` ではマッチしない可能性)

**判断**: Phase 1 で GLOSSARY マッチング率の root cause 調査を実施。必要なら maskSegmentText の boundary 処理を拡張。

### Finding 3: keyboard-shortcut pattern が 0 件ヒット

corpus 内に `Ctrl+S` 等が現れる頻度が低い、または `\b` boundary でマッチしないケースがある。Phase 1 で:
- corpus 全体を grep し、keyboard-shortcut が実際に何件あるかカウント
- INVARIANT_TOKENS regex の調整 or 例外パターンの追加

### Finding 4: 既存 INVARIANT_TOKENS spec の minor バグ

B.2 のレビューで指摘済み:
- `file-path-or-extension` regex: leading `\b` が `.testimrc` のような dot-leading file 名にマッチしない
- `numeric-unit` regex: `\b` after `%` が発火しないため `50%` 等にマッチしない

実害は小さい (corpus 内の出現が稀) が、Phase 1 で修正する。

## Phase 1 へのインプット

**重要**: 当初 Phase 1 ロードマップは 487 件想定だったが、実測 2925 件 (うち segment-untranslated 2500) のため、計画再策定が必要。

具体的タスク:
- Phase 1.0 (新規): GLOSSARY マッチング率 root cause 調査 + 必要なら maskSegmentText 拡張
- Phase 1.1 (preface 重複): 既存計画通り
- Phase 1.2 (手順導入文分離): 既存計画通り
- Phase 1.3 (callout 番号リスト展開): 既存計画通り
- Phase 1.4 (新規): segment-untranslated 2500 件のバッチ翻訳。並列 LLM agent + glossary reference 必須
- Phase 4 micro-exclusion 層: 残 baseline が >> 10 件は確定したため、必要性が高まる可能性

micro-exclusion 層の要否判断: 残 baseline 数だけでなく **issue 種別の偏り** で判断する。segment-untranslated 2500 が pattern 化可能なら blanket exclusion より個別翻訳。
