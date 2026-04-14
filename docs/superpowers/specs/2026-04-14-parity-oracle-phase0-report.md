# Parity Oracle Contract — Phase 0 Cutover Report

- **Date**: 2026-04-14
- **Plan**: `docs/superpowers/plans/2026-04-14-parity-oracle-contract-phase0.md`
- **Spec**: `docs/superpowers/specs/2026-04-14-parity-oracle-contract-design.md`
- **Roadmap**: `docs/superpowers/specs/2026-04-14-parity-burndown-roadmap.md`

> **本レポートは PR #265 レビュー反映後の最終状態を記述しています。**
> 初版 (commit `cb8dad7`) は初回 baseline regen 時の数値 (`2925` entries) を記載していましたが、
> その後の PR レビュー指摘で 2 件の重要 bug を修正したため、最終 baseline は **611 entries** です。
> §修正の経緯にて経緯を記述。

## Baseline 削減結果 (最終状態)

| issueType | Phase 0 前 | Phase 0 後 (最終) | 差 |
| --- | ---: | ---: | ---: |
| segment-extra | 193 | 193 | ±0 |
| segment-missing | 136 | 136 | ±0 |
| segment-untranslated | 146 | 135 | -11 |
| section-structure-mismatch | 86 | 86 | ±0 |
| segment-token-gap | 49 | 49 | ±0 |
| segment-inconclusive | 11 | 11 | ±0 |
| segment-order-mismatch | 1 | 1 | ±0 |
| **合計** | **622** | **611** | **-11** |

baseline の表面的な減少は 11 件にとどまるが、**本質的な改善は検知段階の mask coverage 増加** (270 → 2201 segments) にある。これは「false-positive untranslated を baseline に積む前に正しく抑制できるようになった」ことを意味し、Spec Invariant 1 (`baseline = 未解決 issue の凍結のみ`) が機能していることの裏返し。

## 吸収された内訳 (debug.maskCoverage から、最終状態)

検知時点で **2201 segments** で mask が発火し、合計数千 token の false-positive untranslated を抑制した:

- **Glossary entry 吸収**: 主要 entry (Top 10):
  - `Testim` × 1082
  - `CLI` × 387
  - `URL` × 344
  - `API` × 233
  - `JavaScript` × 152
  - `Tricentis` × 117
  - `HTML` × 98
  - `JSON` × 94
  - `CI` × 86
  - `Test Editor` × 57
- **Invariant pattern 吸収**:
  - `cli-flag`: 297
  - `version-number`: 89
  - `file-path-or-extension`: 15
  - `numeric-unit`: 11
  - `keyboard-shortcut`: 0 (corpus 内に該当 token が稀)
- **URL normalize 吸収**: token-gap 検知段階で `help.testim.io/docs/X` ↔ `/docs/X` および `https://docs.tricentis.com/testim/content/{category}/{slug}.htm` ↔ `/docs/{category}/{slug}` の差分を canonical 化。残 49 件は CLI フラグ・内部リンクの真の token 欠落

## 残 baseline の分類 (Phase 1 以降の burn-down 対象)

- **segment-extra 193 件**: パターン化可能な 3 種 (preface 重複、手順導入文分離、callout 番号リスト展開) が大半 — Phase 1.1-1.3 で機械的修正
- **segment-missing 136 件**: EN にあって JA で省略・統合された段落 — Phase 2.2 で翻訳復元
- **segment-untranslated 135 件**: glossary mask 後に残った真の翻訳抜け — Phase 2 で対応
- **section-structure-mismatch 86 件**: 上記の派生、自動解消されることが多い
- **segment-token-gap 49 件**: CLI フラグ・内部リンク欠落 — Phase 2.3 でピンポイント修正
- **segment-inconclusive 11 件**: tokenless-near-tie 等の自動判定限界 — Phase 4 で個別判断
- **segment-order-mismatch 1 件**: 手順順序差 — Phase 4

## 修正の経緯 (cutover → PR review fix)

Phase 0 cutover 時の初回 baseline regen で **2925 entries** (segment-untranslated 2500) が観測されたが、これは以下 2 件の bug によって false-positive untranslated が大量に baseline に積まれていた。PR #265 レビューで指摘され修正:

1. **Glossary mask が case-sensitive** (`scripts/lib/parity_glossary_mask.mjs`): `textNorm` は lowercased で渡るのに glossary regex は `g` flag のみだったため、`Testim` (Title Case) が `testim` (lowercased input) にマッチしなかった。`gi` flag に変更し、`Testim` を含む 9 entry が正しくマッチするようになった (+1931 segments)
2. **URL normalize の path 制約過剰** (`scripts/lib/parity_normalize.mjs`): `TRICENTIS_DOCS_RE` が `/Topics/Help/` プレフィックスを要求していたが、repo の実際の canonical URL は `https://docs.tricentis.com/testim/content/{category}/{slug}.htm` (Topics/Help なし)。regex を broaden し、`/index.htm` を directory root に変換するロジックも追加

修正後の最終 baseline 611 が「Phase 0 後の真の状態」。

## 発見事項

### Finding 1: keyboard-shortcut pattern が 0 件ヒット

corpus 内に `Ctrl+S` 等が現れる頻度が低い、または `\b` boundary でマッチしないケースがある。Phase 1 で:

- corpus 全体を grep し、keyboard-shortcut が実際に何件あるかカウント
- INVARIANT_TOKENS regex の調整 or 例外パターンの追加

### Finding 2: 既存 INVARIANT_TOKENS spec の minor バグ

B.2 のレビューで指摘済み:

- `file-path-or-extension` regex: leading `\b` が `.testimrc` のような dot-leading file 名にマッチしない
- `numeric-unit` regex: `\b` after `%` が発火しないため `50%` 等にマッチしない

実害は小さい (corpus 内の出現が稀) が、Phase 1 で修正する。

### Finding 3: H.2 で発見した classifySegment CJK 早期リターン bug

`textNorm` 小文字化で glossary がマッチしなくなる影響が、混在 JA-EN segment にも波及して false-positive を出していた。H.2 検証中に CJK 早期リターンを追加して修正 (`fix: classifySegment に CJK 早期リターンを追加`)。

ただし PR review で指摘された通り、CJK 早期リターンは混在文の救済にしか効かず、英語のみ table cell 等の根本対策にはならなかった。case-insensitive glossary fix で根本解決した後も、CJK 早期リターンは defensive layer として残している。

## Phase 1 へのインプット

baseline 611 件の内訳に基づき、Phase 1 ロードマップは当初想定 (487 件) に近い規模で実施可能。具体的タスク:

- **Phase 1.1 (preface 重複)**: 既存計画通り (45 件 / 27 slug)
- **Phase 1.2 (手順導入文分離)**: 既存計画通り (~25 件)
- **Phase 1.3 (callout 番号リスト展開)**: 既存計画通り (~80-100 件)
- **Phase 2.2 (segment-missing 翻訳復元)**: 既存計画通り (136 件 / 71 slug)
- **Phase 2 (segment-untranslated 残り 135 件)**: 当初想定範囲内 (~26 件想定 → 実測 135 件で 5 倍だが、依然手動レビュー可能規模)
- **Phase 4 micro-exclusion 層**: 残 baseline が ~611 で安定見込みのため、Phase 4 の判断時点で再評価

micro-exclusion 層の要否判断: 残 baseline 数だけでなく **issue 種別の偏り** で判断する。Phase 1-3 burn-down 後の残数次第。
