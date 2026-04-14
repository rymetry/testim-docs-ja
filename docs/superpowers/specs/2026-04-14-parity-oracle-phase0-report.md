# Parity Oracle Contract — Phase 0 Cutover Report

- **Date**: 2026-04-14 (initial) / 2026-04-14 PR review 反映版
- **Plan**: `docs/superpowers/plans/2026-04-14-parity-oracle-contract-phase0.md`
- **Spec**: `docs/superpowers/specs/2026-04-14-parity-oracle-contract-design.md`
- **Roadmap**: `docs/superpowers/specs/2026-04-14-parity-burndown-roadmap.md`

> **本レポートは PR #265 の最終レビュー反映後の最終状態を記述しています。**
> 実装挙動が PR review を経て 3 段階で進化したため、baseline 件数も段階的に変化しました。
> §修正の経緯にて経緯を時系列で記述。

## Baseline 最終状態

| issueType | Phase 0 前 | Phase 0 後 (最終) | 差 |
| --- | ---: | ---: | ---: |
| segment-extra | 193 | 150 | -43 |
| segment-missing | 136 | 136 | ±0 |
| segment-untranslated | 146 | 1904 | +1758 ⚠️ |
| section-structure-mismatch | 86 | 86 | ±0 |
| segment-token-gap | 49 | 49 | ±0 |
| segment-inconclusive | 11 | 11 | ±0 |
| segment-order-mismatch | 1 | 1 | ±0 |
| **合計** | **622** | **2337** | **+1715** |

合計は **増加**した。これは Phase 0 cutover の重要な発見事項で、§発見事項にて詳述。

**本質的には: 旧 fuzzy heuristic が hide していた真の untranslated residue が 1758 件 surface した。** Spec Invariant 5 (Residue = バグ) に準拠した正確な検知の結果であり、検知バグではなく「過去の見逃しの可視化」。

## 吸収された内訳 (debug.maskCoverage から、最終状態)

検知段階で **2710 segments** で mask が発火し、false-positive untranslated を抑制した:

### Top Glossary entries (15)

| entry | 吸収件数 |
| --- | ---: |
| Testim | 1032 |
| Salesforce | 413 |
| CLI | 387 |
| URL | 344 |
| API | 233 |
| ID | 174 |
| JavaScript | 152 |
| Tricentis | 117 |
| HTML | 98 |
| iOS | 98 |
| JSON | 94 |
| CI | 86 |
| Settings | 84 |
| Android | 64 |
| Test Editor | 57 |

### Invariant pattern 吸収

- `cli-flag`: 297
- `version-number`: 89
- `file-path-or-extension`: 15
- `numeric-unit`: 11
- `keyboard-shortcut`: 0 (corpus 内に該当 token が稀)

### URL normalize

検知段階で以下の差分を canonical 化:
- `help.testim.io/docs/X` ↔ `/docs/X`
- `https://docs.tricentis.com/testim/content/{category}/{slug}.htm` ↔ `/docs/{category}/{slug}`
- `/index.htm` → directory root

残 49 件の token-gap は CLI フラグ・内部リンクの真の token 欠落。

## 残 baseline の分類 (Phase 1 以降の burn-down 対象)

| issueType | 件数 | Phase 1+ 対応 |
| --- | ---: | --- |
| segment-untranslated | **1904** | **最優先**。Phase 2 burn-down で大規模バッチ翻訳 + GLOSSARY 拡張 |
| segment-extra | 150 | Phase 1.1-1.3 パターン化可能な機械修正 (preface 重複、手順導入文分離、callout 番号リスト展開) |
| segment-missing | 136 | Phase 2.2 翻訳復元 |
| section-structure-mismatch | 86 | Phase 1 の派生、自動解消されることが多い |
| segment-token-gap | 49 | Phase 2.3 CLI フラグ・内部リンク欠落のピンポイント修正 |
| segment-inconclusive | 11 | Phase 4 個別判断 |
| segment-order-mismatch | 1 | Phase 4 |

## 修正の経緯 (cutover → PR review で 3 段階進化)

Phase 0 は PR #265 の review を経て、以下 3 段階で実装が進化した:

### 段階 1: 初回 cutover (commit `0641dc2` 付近)
- baseline: 2925 entries (segment-untranslated 2500)
- 2 件の bug が混入していた:
  - **Glossary mask が case-sensitive** (`g` flag only): `textNorm` lowercased input に対して Title Case glossary 項目がマッチしない
  - **URL normalize の path 制約過剰**: `TRICENTIS_DOCS_RE` が `/Topics/Help/` を要求していたが repo の canonical URL は `/testim/content/{category}/{slug}.htm`

### 段階 2: PR 初回 review 反映 (commit `d00afa7` / `f400cef`)
- baseline: 611 entries (segment-untranslated 135)
- 上記 2 件の bug を修正:
  - Glossary regex flag を `gi` に変更
  - `TRICENTIS_DOCS_RE` を broaden し `/index.htm` strip を追加
- Mask coverage: 270 → 2710 segments で劇的改善
- ただし依然として `classifySegment` に CJK 早期 return が残っており、Spec Invariant 5 (Residue = バグ) を違反 (混在 JA/EN セグメントの英語 prose 残留を見逃す)

### 段階 3: PR 再 review 反映 (commit `117c322` / `bca65c7`、**最終状態**)
- baseline: 2337 entries (segment-untranslated 1904)
- CJK 早期 return を削除し Spec Invariant 5 に完全準拠
- cascade で surface した true-untranslated residue への対応:
  - **clean_page_fixtures (3 page)**: GLOSSARY を 39 entry 拡張で 0 issue に復帰
  - **representative_summary (6 page)**: GLOSSARY 拡張では Phase 0 scope 外のため RESIDUAL_PAGES に移動、baseline で凍結

## 発見事項

### Finding 1: CJK 早期 return が 1758 件の untranslated residue を hide していた

Spec Invariant 5 (Residue = バグ) の契約上、CJK 文字混在を理由にした早期 return は false negative を大量生成していた。例:

```
Visual Editor で click the Save button  (CJK 1 文字で早期 return → 英語 prose を見逃す)
```

PR review で削除後、段階 2 で hide されていた 1758 件が baseline に表面化。Phase 1 の burn-down 対象となる。

### Finding 2: GLOSSARY 拡張が最も有効な issue 抑制策

初回 GLOSSARY (31 entry) での吸収 = 270 segments
PR review 後 GLOSSARY (70 entry) での吸収 = **2710 segments (10x 改善)**

特に以下のような Testim product/UI 名を GLOSSARY に追加することで大量の false-positive untranslated を抑制できた:
- 製品名: Testim, Salesforce, Tricentis
- UI ラベル: Settings, Test Editor, Account, Object, Log In
- 技術略語: CLI, URL, API, ID, CI/CD
- プラットフォーム: iOS, Android, JavaScript, JSON, HTML

**Phase 1.x で GLOSSARY 監査**を実施し、representative_summary で RESIDUAL 扱いにした 6 page の残留 UI 名を網羅的に追加する計画。

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

### 計画規模の修正

当初 Phase 1 ロードマップは 487 件想定だったが、実測 **2337 件 (うち segment-untranslated 1904)** のため、計画再策定が必要。

### Phase 1.0 (新規): GLOSSARY 監査
- representative_summary で RESIDUAL にした 6 page (custom-action-step-mobile, test-runs, faq, the-command-line-cli, network-logs, email-validation) を中心に、corpus 全体の頻出 English UI/feature 名を洗い出し
- GLOSSARY に追加し、baseline 縮小を測定
- 想定: 数百 entry 追加で segment-untranslated を 500-1000 件程度 burn-down 可能

### Phase 1.1-1.3: 既存計画 (パターン化可能な segment-extra)
- preface 重複 (既存 plan)
- 手順導入文分離 (既存 plan)
- callout 番号リスト展開 (既存 plan)

### Phase 2: segment-untranslated 1904 件 + segment-missing 136 件 のバッチ翻訳
- 並列 LLM agent + GLOSSARY reference で大規模翻訳
- GLOSSARY 監査 (Phase 1.0) 後の残件に対応

### Phase 4: micro-exclusion 層
- 残 baseline 数だけでなく issue 種別の偏りで判断する
- Phase 1-3 burn-down 後の残数次第。Phase 1.0 GLOSSARY 監査で大幅減なら不要

## 最終 gate 状態

| gate | 状態 |
| --- | --- |
| npm run test | 1722 pass / 0 fail |
| npm run lint | 0 error / 0 warning (288 files) |
| npm run build | success (290 pages) |
| npm run check:parity | 完走、active issue 0 件 |
| parity-check-status.json debug.maskCoverage | 2710 segments / 15+ glossary entries active |
| Spec Invariants 1-5 | 全て pin test で保証 |
