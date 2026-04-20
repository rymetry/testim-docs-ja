# パリティ残債ガイド

パリティチェック（`npm run check:parity`）で検出される EN/JA 構造差分の修正手順と頻出パターンをまとめたガイドです。

## 🎯 本ガイドの位置づけ（2026-04-16 M4 改訂）

本プロジェクトの最終ゴールは `parity-baseline.json` の entries = 0 / `npm run check:parity` の全 counter = 0。baseline は **時限的 ack** であって **恒常許容ではない**。

- **上位契約**: [WRITING_GUIDE.md §Source-First 構造契約](./WRITING_GUIDE.md) / [TRANSLATION_GUIDE.md §⚖️ 翻訳の構造契約](./TRANSLATION_GUIDE.md)
- **本ガイドの責務**: baseline entries を 0 に向けた **burn-down recipe** と並列エージェント運用手順
- **M2 Stage B7**: 現時点の baseline = **340 entries / 100 ファイル**（2026-04-16 main 実測）。本ガイドに従って段階的に burn-down する

## 📊 340 件の内訳と修正方針（M4 pinned）

| issue type | 件数 | 主要原因 | 修正方針 | 並列 agent 向き |
| --- | --- | --- | --- | --- |
| `segment-extra` | 120 | JA 独自段落 / 1 callout→2 callout 分割 / 番号リスト展開 | JA 側の独自追加を削除し EN 原文 1:1 に戻す | ✅ 1 slug / 1 agent |
| `segment-missing` | 76 | EN 段落が JA で欠落 | EN 原文を翻訳して追加 | ✅ 1 slug / 1 agent |
| `section-structure-mismatch` | 66 | 見出しレベル変更 / callout タイプ変更 / リスト形式変換 | 構造を EN 原文に揃える（JA 独自見出しの削除等） | ✅ 1 slug / 1 agent |
| `segment-untranslated` | 47 | Testim UI 以外の英語 prose 残留 | 翻訳。Tier C 許容語は INVARIANT 側で保護 | ✅ 1 slug / 1 agent |
| `segment-token-gap` | 20 | URL/CLI flag/数値 token の欠落 | 原文の token を JA 側に復元 | ✅ 1 slug / 1 agent |
| `segment-inconclusive` | 11 | tokenless-near-tie / heading-count-mismatch | 手動確認 → 構造追従 or ack 判断 | ❌ 人手 review |

### Burn-down workflow（1 slug / 1 agent）

```bash
# 1. 対象 slug の baseline entry 確認
jq "[.entries[] | select(.slug == \"<slug>\")]" parity-baseline.json

# 2. EN 原文と JA 差分を並列確認
cat snapshots/en/content/<slug>.html
cat src/content/docs/<slug>.md

# 3. JA を EN 構造に追従させる（WRITING_GUIDE §Source-First 参照）
#    - 独自段落削除 / callout タイプ修正 / リスト形式復元 etc.

# 4. 単一 slug parity check
npm run check:parity -- --slug=<slug>

# 5. lint / build 通過
npm run lint:docs -- --path=src/content/docs/<slug>.md

# 6. 問題解消後に baseline 再生成
npm run check:parity                              # フルラン必須
node scripts/generate_parity_baseline.mjs --slug=<slug>

# 7. entry が 0 件になったことを確認
jq "[.entries[] | select(.slug == \"<slug>\")] | length" parity-baseline.json
# → 0
```

### 並列エージェント委任チェックリスト

各 agent 向けに送る情報:

- [ ] 対象 slug と baseline entry の issueType 内訳
- [ ] EN snapshot path (`snapshots/en/content/<slug>.html`) と JA path (`src/content/docs/<slug>.md`)
- [ ] [WRITING_GUIDE §Source-First 構造契約](./WRITING_GUIDE.md) を必読指定
- [ ] [TRANSLATION_GUIDE §⚖️ 翻訳の構造契約](./TRANSLATION_GUIDE.md) を必読指定
- [ ] **禁止事項**: JA 独自段落追加 / callout タイプ変更 / 1 callout→2 callout 分割 / 番号リスト展開 / 読者向け親切補足
- [ ] **`segment-inconclusive` 取り扱い禁止** (loophole 対応): 該当 entry が slug に含まれる場合は該当 entry のみ触らず、完了報告に「inconclusive 残留 N 件、人手 review 依頼」と明記する。agent 判断で翻訳・構造変更・baseline 追加しない
- [ ] **完了条件**: `npm run check:parity -- --slug=<slug>` で該当 slug の active / baseline 両方が 0 件（inconclusive 除く）
- [ ] **PR scope**: 1 slug / 1 PR または関連 slug の小 batch。検知コード修正は別 PR

### 注意: baseline 追加の判断原則

以下に該当する場合のみ baseline 追加を許容する（それ以外は必ず修正する）:

| 状況 | baseline 許容 | 理由 |
| --- | --- | --- |
| EN upstream 自体が壊れている (`source-unusable` / `snapshot-incomplete` で emitter が reason token を付与) | ✅ | upstream 修正待ち、`scripts/lib/source_sync_exclusions.mjs` の registry が canonical |
| EN-only の小 artifact (具体 EN HTML anomaly に traceable) | △ **厳格条件下のみ** | 下記 §EN-only artifact の厳格条件 参照 |
| JA 側の構造修正で簡単に解消可能 | ❌ | burn-down 対象 |
| Testim UI 用語で GLOSSARY 未登録 | ❌ | GLOSSARY Tier A/B に追加 |
| 一般 IT 用語で INVARIANT 未登録 | ❌ | INVARIANT narrow pattern に追加 |
| `segment-inconclusive` (tokenless-near-tie / heading-count-mismatch) | ❌ (自動判断禁止) | agent は触らず残し、完了報告で人手 review 依頼 |

#### EN-only artifact の厳格条件（Security P1 対応）

`△ micro-exclusion を検討` の rationalization を排除するため、baseline 追加には **以下を全て満たす** 必要がある:

1. **具体 EN HTML anomaly への traceability**: 該当 artifact が `snapshots/en/content/<slug>.html` 内の具体的な EN 側不整合（例: `<a href="...">display-text</a>` の href と display-text 不一致 / EN-only ZWS / broken anchor 等）に 1:1 対応すること。「EN が曖昧だから」等の抽象理由は不可
2. **1 slug あたり最大 1 件**: 同一 slug で 2 件以上発生した場合は baseline せず、upstream 修正待ちとして Phase 4 plan の `source_sync_exclusions` に page 単位で登録するか否かを判断する
3. **Baseline entry への justification comment 必須**: `parity-baseline.json` の該当 entry に `rationale` フィールドで具体 anomaly を 1 文で記述する（例: `"EN-only broken href: display='google.com' vs href=''"`）。記述なしの baseline 追加は禁止
4. **schema v2 契約**: `priority` (`high`/`medium`/`low`、default `medium`) を必ず設定し、`note` フィールドに具体 anomaly の 1 文記述を書く。長期凍結禁止の運用圧力は `priority='high'` + PR paydown schedule で維持する (v2 では `reviewAfter` 期限概念は撤廃)

**判定フロー**:

```text
baseline 候補を発見
  ↓
source_sync_exclusions に page 登録済み？
  ├─ Yes → page-level で隔離、baseline 対象外
  └─ No  ↓
JA 側の構造修正で解消可能？
  ├─ Yes → burn-down で解消（baseline しない）
  └─ No  ↓
上記 4 条件を全て満たす？
  ├─ Yes → baseline 追加（rationale 付き）
  └─ No  → ❌ burn-down で解消（baseline しない）
```

この厳格条件により、`△` 欄は「自由裁量で baseline できる escape hatch」ではなく「具体 evidence + reviewer 承認必須の限定ケース」として運用される。

## Wave 2 実績 pattern catalog

2026-04-17 時点の Wave 2 (P2-2) で burn-down 済の source-first pattern 一覧。各 pattern は `scripts/__tests__/source_parity_clean_page_fixtures.test.mjs` の `CLEAN_PAGE_SLUGS` 内 sentinel slug で zero-drift として pin 済。新 pattern は本 catalog に **追加しない** (plan §5.2 mechanical exceptions / §5.3 carve-outs の reviewer 承認経由で initial 登録を経た pattern のみ codify 対象)。

本 catalog は "既に確定した pattern" の reference であり、新規 `§5.3.N` carve-out の提案経路ではない。新規 mechanism-pending 残存を発見した場合は §並列エージェント委任チェックリスト 末尾の `[PENDING REVIEWER APPROVAL — §5.3.N proposal]` マーカー運用に従う。

| # | pattern | 概要 | canonical sentinel slug |
| --- | --- | --- | --- |
| 1 | Arrow-fusion (plan §5.2 #2) | EN `<p>Context. →<strong>To X:</strong></p>` 単一段落を JA が 2 段落に分離していた drift を `。\n→ **Xするには:**` soft-break 融合で zero-drift 化 | `editing-tests/editing-your-tests/editing-target-element-properties` |
| 2 | Flat-list split (plan §5.2 #1) | EN 単一 `<ol>` / `<ul>` に orphan `<p>` + `<img>` / `<div class="note">` が interleave する構造を、JA 側でリストを複数分割 + 外部 block sibling + `<li value="N">` 番号手動指定で mirror | `advanced-editing/deep-link-mobile` (+ `editing-tests/generating-a-random-value` で ol/ul interleave 拡張) |
| 3 | ASCII punctuation mirror | UI-term `<li>Username.</li>` / `<li>Access key.</li>` 等の trailing `.` を JA で欠落させると `scoreSegmentMatch` の same-language penalty で score 0 に落ちるため、EN 側の trailing ASCII punctuation は verbatim mirror する | `integrations/visual-validation/lambdatest_integration` |
| 4 | URL token verbatim mirror | EN URL を JA が canonical domain に置換していた drift (例: MadCap redirect `testmuai.com` → `lambdatest.com`) は `tokensInvariant` 不一致で検知される。EN URL が HTTP 200 OK で生きている限り verbatim mirror する | `integrations/visual-validation/lambdatest_integration` |
| 5 | Broken-table-row paragraph mirror | EN MadCap Flare が吐く `<table>` 外 orphan paragraph (broken row artifact、本文中に `<p>&#124;...&#124;</p>` として現れる) を JA で backslash-escaped paragraph (`\|...\|` 形式) で段落として mirror する | `salesforce-testing/create-a-salesforce-test/use-agentic-test-automation-for-salesforce` |
| 6 | HTML `<table>` cell `<br />` mirror | EN `<td>` が `<br />` + nested `<p>` で複数行を包む場合、JA で slash セパレータに変換せず `<br />` をそのまま保持する (extractHtmlTableCells 経路との整合) | `advanced-editing/keyboard-shortcut-step` |
| 7 | JA navigation link removal | EN `<a href="index.htm">` / `<a href="index.htm/#/">` の self-link MadCap artifact が JA にも残存している場合、JA 側でリンクを除去して mirror する (§5.3.2 registry の slug-scope extension 対象) | `salesforce-testing/create-a-salesforce-test/use-agentic-test-automation-for-salesforce` |
| 8 | Generic-English-residue translation | 一般英語語 (browser version / hover / geolocation / site-to-site / executive 等) は JA 化し、Testim / vendor name (Grid / Editor / VPN / IP / CLI / SauceLabs / BrowserStack) は英語維持する (GLOSSARY Tier A/B + Tier C closed-list 運用) | `integrations/grid-management` |

各 pattern の判定・対処の詳細は sentinel test (`scripts/__tests__/source_parity_clean_page_fixtures.test.mjs`) の slug コメントを canonical reference とする。TRANSLATION_GUIDE §5.5 にも同 8 pattern の翻訳観点を codify している。

## 頻出パターン

### 1. preface に frontmatter description の重複段落（segment-extra）

多くのファイルで、frontmatter の `description` と同内容の短い要約段落が JA の preface（最初の見出しの前）にだけ存在する。EN は 1 段落のみ。

```text
修正前 (JA):
---
description: テスト実行の概要を説明します。
---
テスト実行の概要を説明します。        ← この行が余分

テストは CLI またはスケジューラーから...

修正後 (JA):
---
description: テスト実行の概要を説明します。
---
テストは CLI またはスケジューラーから...
```

### 2. 手順導入文の段落分離（segment-extra + section-structure-mismatch）

EN の `:fa-arrow-right:` パターン（手順の導入文）が JA で別段落に分かれている。EN は 1 段落にまとまっている。

```text
修正前 (JA):
ループを使用すると、同じアクションを繰り返せます。

**ループを設定するには:**

修正後 (JA):
ループを使用すると、同じアクションを繰り返せます。→ **ループを設定するには:**
```

### 3. callout 内の番号付きリスト（segment-extra）

EN が `<p>` 内にインラインで `1. x 2. y 3. z` を書く callout を、JA が Markdown 番号付きリストに展開している。

```text
修正前 (JA):
:::warning
以下の制限があります:
1. 制限 A
2. 制限 B
3. 制限 C
:::

修正後 (JA):
:::warning
以下の制限があります: 1. 制限 A 2. 制限 B 3. 制限 C
:::
```

## EN ソース side の既知 artifact

EN upstream に由来する artifact の扱い（Phase 0 以降の契約）:

| artifact 種別 | 対応層 | 例 |
| ------ | -------- | ------ |
| Page 全体が壊れている | `scripts/lib/source_sync_exclusions.mjs` (page-level update-lock + 復旧 probe) | `testops/testops-version-control/pull-requests` |
| URL / link token の差異 | `scripts/lib/parity_normalize.mjs` (URL rewrite ルール) | `help.testim.io/docs/X` ↔ `/docs/X` |
| 英語 UI 用語・機能名 | `docs/GLOSSARY.md` + `parity_glossary_mask.mjs` | `Visual Editor`, `Pre-run hook` |
| 英語 invariant pattern (CLI flag、キーボードショートカット等) | `docs/INVARIANT_TOKENS.md` + `parity_glossary_mask.mjs` | `--project-id`, `Shift+S` |
| EN HTML 内の segment-level 具体 defect (typo, href miswire 等) | `scripts/lib/en_source_patches.mjs` (slug-scope literal find→replace at `preprocessEnHtml` boundary) | Salesforce `-this` typo (UD-001), Log out href miswire (UD-002) |
| EN-only の壊れた token (display text と href 不一致等)、小規模 artifact | 現時点では baseline に残る (Phase 0 後に件数を見て micro-exclusion 層の必要性を判断) | `creating-your-first-codeless-test` の google.com |

**重要**: baseline は「未解決 issue の凍結」のみ。上記 normalize / mask / page-level exclusion / patches で吸収される artifact は baseline の対象ではない。blanket に "方針だから baseline に入れる" は禁止。

### EN source patches layer (Route W, 2026-04-17)

`scripts/lib/en_source_patches.mjs` は **broken upstream defect の HTML 境界 patch 層**。`preprocessEnHtml(html, { slug, patchCoverage })` が canonical EN HTML を生成する際に slug-scope で literal `find → replace` を適用する。JA markdown 側で workaround を埋め込むことは禁止 (plan §1.1 absolute principle)。

**特徴**:

- 4 enum `defectClass` (`typo` / `href-miswire` / `madcap-artifact` / `stale-reference`) 以外は登録不可
- 各 entry は `linkedDefect: 'docs/superpowers/specs/upstream-defect-tracker.md#UD-NNN'` で upstream tracker へ結線される
- Idempotent (`replace` は `find` を含まない)、Order-independent (slug-scope disjoint)
- `parity-check-status.json.debug.patchCoverage` で hit / mismatch を可視化
- `reviewAfter` 日付 (通常 addedAt + 6mo) で upstream 修正確認サイクルを回す

**設計 / SOP**: `docs/superpowers/plans/2026-04-17-en-source-patches-layer.md`、entry 追加手順は `docs/superpowers/specs/upstream-defect-tracker.md#adding-a-new-defect`。

### Baseline regen PR 説明 template

patch layer / allowlist に変更を入れた PR の description には必ず以下を明記する (baseline net delta の透明化):

```text
Baseline delta: {before} → {after} ({net})
  - orphan 除去: {removed} entries
  - 新規追加:   {added} entries  (binary gate: must be 0)
  - 正味:       {net}

patchCoverage snapshot:
  - matchedHits: {N}
  - mismatches:  {M}  (should be 0; 非ゼロなら diagnose)
```

新規追加 `> 0` は即 PR block。`parity_artifact_registry` / `SOURCE_SYNC_EXCLUSIONS` / `en_source_patches` の新規 entry 追加は `[PENDING REVIEWER APPROVAL]` マーカー必須。

## 修正ワークフロー

### 単一ファイルの修正

```bash
# 1. 差分を確認
npm run check:parity -- --slug=advanced-editing/loops

# 2. EN スナップショットと JA を比較して修正
# snapshots/en/content/{slug}.html と src/content/docs/{slug}.md

# 3. 修正後に検証
npm run check:parity -- --slug=advanced-editing/loops
npm run lint:docs -- --path=src/content/docs/advanced-editing/loops.md

# 4. baseline 再生成（必要な場合）
npm run check:parity  # フルラン必須
node scripts/generate_parity_baseline.mjs --slug=advanced-editing/loops
```

### 並列エージェント委任時の注意

- **翻訳ガイドライン**: `docs/TRANSLATION_GUIDE.md` のルール（Testim 用語英語維持、ですます調、NG/OK パターン）を必ずエージェントに送ること
- **PR 分離**: 検知コードの修正とドキュメント修正は別 PR にする
- **EN ゴミ混入禁止**: EN のアーティファクト（`</Image>` 等）を JA に含めない。baseline で管理する
- **テスト確認**: リスト項目数を変更したら `KNOWN_ORDERED_DRIFTS`（`source_parity_segments_boundary.test.mjs`）を確認
- **Prettier 注意**: `npm run format` はリポジトリ全体を変更する。PR 対象ファイルのみに限定する
- **新 §5.3.N carve-out の提案手順**: エージェントが未知 pattern の mechanism-pending residual を発見した場合、**plan に §5.3.N として直接書き込まず**、PR description / コミット message に `[PENDING REVIEWER APPROVAL — §5.3.N proposal]` マーカーを付与して提案する。driver + 4-reviewer gate (architect / security 重点) の承認を経て初めて plan に確定登録する。自主宣言 (agent が承認前に plan に書き込む) は §5.3 Scope preamble で禁止されている。既存 `/docs/index` artifact への slug-scope extension など、明らかな "既存 mechanism の scope 拡張" については §5.3.2 のような先行実績があるが、それも reviewer 承認を前提とする (retroactive approval を回避するためにマーカー運用する)。

## §5.3.1 FileOrFilePath carve-out coverage (audit-signal 拡張 2026-04-17)

`2026-04-16-m2-parity-burndown.md` §5.3.1 の FileOrFilePath mechanism-pending carve-out は、当初 gate-blocking な `section-structure-mismatch` / `segment-missing` / `segment-extra` のみを scope としていたが、2026-04-17 に **`paragraph-count-mismatch` audit signal** を同 root cause 由来の副作用として §5.3.1 scope に追加する (詳細は plan §5.3.1.a)。

### 分類境界

| 対象 slug / section | issue type | gate 扱い | 対処 |
| --- | --- | --- | --- |
| `configure-tricentis-mobile-agent` §19 WDA Errors | `section-structure-mismatch` | baseline 登録済 / gate-blocking | §5.3.1 既存 carve-out |
| `configure-tricentis-mobile-agent` §19 WDA Errors | `segment-missing` / `segment-extra` | baseline 登録済 / gate-blocking | §5.3.1 既存 carve-out |
| `configure-tricentis-mobile-agent` §19 WDA Errors | `paragraph-count-mismatch` | `COARSE_SIGNAL_TYPES` / audit-only | §5.3.1.a 拡張 (本追加) |

### 運用上の注意 (agent 向け)

- `configure-tricentis-mobile-agent.md` で `paragraph-count-mismatch` (EN=5 / JA=4) を検知した場合、**content 修正を試みない** (JA 独自段落追加 = source-first policy 違反)
- §5.3.1 の symptom (FileOrFilePath + code-fence) に一致するかを確認し、一致する場合は carve-out 済として skip
- 同 slug の audit signal は agent の個別判断で baseline 追加 / ack / content 修正せず、本 §5.3.1.a 枠組み下で EN mechanism fix (M2 範囲外) を待つ
- 他 slug で同 `paragraph-count-mismatch` + FileOrFilePath pattern が新規発現した場合は **§5.3.N proposal marker protocol に従って提案する** (自動 scope 拡張禁止)

### 関連参照

- 詳細: `docs/superpowers/plans/2026-04-16-m2-parity-burndown.md` §5.3.1.a
- Root cause analysis: `docs/superpowers/analyses/2026-04-17-audit-signals-triage.md` (PR #312) §3.1 entry #18 / §5.4 Proposal A
- 実装参照: `scripts/lib/source_parity_types.mjs` `COARSE_SIGNAL_TYPES` (= audit-only allowlist)、`scripts/lib/source_parity_extract.mjs` `extractParagraphCounts` / `normalizeEnArtifacts`、`scripts/lib/source_parity_segments_en.mjs` `INLINE_JOIN_TAGS`

### §5.3.4 `extractMarkdownTables` GFM strict-check (2026-04-17 mechanism PR)

Wave 2 pattern catalog row 5 (broken-table-row paragraph mirror) の canonical sentinel `use-agentic-test-automation-for-salesforce` で定義された `\|...\|` paragraph を、`scripts/lib/source_parity_extract.mjs::extractMarkdownTables` が誤って table として認識し得る緩い regex を GFM §tables-extension に忠実な strict-check に置換した。具体的には:

- **separator 行を必須化**: `GFM_TABLE_SEPARATOR_RE = /^\|(?:\s*:?-{1,}:?\s*\|)+$/` にマッチする separator を header の直後に要求する。separator に到達しない pending row 列は破棄し、pipe-only segment は段落として扱う。
- **backslash-pipe を cell 区切りから除外**: cell split に `UNESCAPED_PIPE_SPLIT_RE = /(?<!\\)\|/` (負 lookbehind) を使い、cell 内の `\|` は literal `|` として復元する (`cell.replace(/\\\|/g, '|')`)。行頭が `\|` で始まる行、または末尾の閉じ `|` が `\|` (escaped) の行は candidate から除外 (`isGfmTableCandidateLine`)。

**影響範囲**: `table-shape-mismatch` (signal severity) の false-positive を 4 件 → 0 件に削減。`baselinedIssues` は完全不変 (183 固定)。本修正は `extractMarkdownTables` のみを touch し、`extractHtmlTables` / `classifyLine` / `compareTableStructure` には介入しない。regression gate として `scripts/__tests__/source_parity.test.mjs` に 5 テスト追加、salesforce sentinel (`source_parity_clean_page_fixtures.test.mjs`) は引き続き totalIssues=0 を維持。

詳細は plan `2026-04-16-m2-parity-burndown.md §5.3.4` を参照。

### §5.3.7 `classifySegment` CJK_RE g-flag fix (2026-04-17 mechanism PR)

PR #309 reviewer agent 73 / PR #324 §5.3.6 agent の継続調査で確定した `parity_glossary_mask.classifySegment` の 2 つ目の latent bug (CJK_RE に `g` flag が欠落) を解消する mechanism PR。詳細: plan `2026-04-16-m2-parity-burndown.md §5.3.7`。

**scope**: `scripts/lib/parity_glossary_mask.mjs` の `CJK_RE` 宣言に `/g` flag を追加する **1 文字の bug fix のみ**。

#### 絶対原則: 許容機構は broken EN snapshot 退避にのみ正当化される

検知システムの purpose は EN(t) vs EN(t-1) (diff1) と EN(t) vs JA(t) (diff2) を両方 0 に収束させることである。この目標に照らして:

- **許容機構 (allowlist / registry / exclusion) は、壊れた EN snapshot を退避する用途にのみ正当化される**
- それ以外の「技術用語は英語維持でよい」「UI 固有用語は除外してよい」といった allowance は **本質的に検知精度の dilute であり、設計違反**
- classifier が pure-EN-heavy segment を flag するのは **正しい動作**
- JA 側で英語 term 周囲を JA context で囲めば classifier は segment-dominant-JA と判定して silent になる (natural translation path)

この原則により、§5.3.7 では **`TECH_TOKEN_ALLOWLIST` 類の tech-vocabulary allowlist を一切追加しない**。CJK_RE `/g` fix で surface する 38 件の cascade は全て以下で吸収する:

1. **content-level JA 翻訳** (default / 本 PR の採用手段): 該当 JA segment を JA-dominant に書き直す。典型パターン:
   - 4 tech token 以上の列挙 → JA 対訳 4 つ + 英語 UI label の括弧注記に集約 (例: `Critical、Serious、Moderate、Minor` → `重大、深刻、中程度、軽微 の 4 段階 (UI 上は英語表記)`)
   - status symbol `x` / `v` 単独 → Unicode ×マーク / ✓マーク で置換
   - 例値の enumeration → 単一代表値 + "例:" 表現に短縮
   - UI ブランド名 enumeration → "YouTube などの SNS" 等に圧縮
2. **baseline 追加は 0** (goal alignment)
3. **broken EN snapshot 退避 (source-sync exclusion)**: 既存の `scripts/lib/source_sync_exclusions.mjs` registry のみが正当な許容機構 (`excludedPages` counter で可視化)

#### cascade 発生時の判断フロー (agent 向け)

新 slug で CJK_RE fix 後に cascade が surface した場合:

1. **residue を確認**: `npm run check:parity -- --slug=<slug>` で classifier 判定の詳細を見る
2. **content-level で JA 翻訳を試みる**: source-first を維持 (paragraph の 分割 / 移動 / kind 変更 禁止) しつつ、residue word count を `RESIDUE_MIN_WORDS=3` 未満に抑え込む
3. **allowlist / baseline 追加は禁止**: tech vocabulary の理由で allowance を足すのは **設計違反**。どうしても content 翻訳で解消不能な場合は STOP して coordinator に相談
4. **EN snapshot が壊れている場合 (broken heading / impossible structure)**: `scripts/lib/source_sync_exclusions.mjs` の registry への追加を検討 (L2 gate)

## Bug backlog の解消優先順位

Phase 0 後の baseline は「未解決バグの backlog」になる。Phase 1 以降で以下の優先順位で解消する:

| 種別 | 対応内容 | 難易度 |
| ------ | ---------- | -------- |
| segment-extra (preface 重複、手順導入文分離、callout 番号リスト展開) | パターン化されており機械的修正可能 | 低 |
| segment-missing | EN にあって JA にない段落の翻訳復元 | 中 |
| segment-untranslated (glossary mask 後の残り) | 本物の翻訳抜け。翻訳が必要 | 中 |
| section-structure-mismatch | 上記の派生、自動解消されることが多い | — |
| segment-token-gap (URL normalize 後の残り) | CLI フラグ・内部リンクの欠落。ピンポイント修正 | 低 |
| segment-inconclusive | tokenless-near-tie 等。自動判定の限界。手動確認 | 高 |

Top 2 大物ファイルとロングテール (1-3 件ファイル 69 ファイル) はバッチ処理で解消する。

## §5.3.3 [Abolished 2026-04-17] JA-side intentional-omission policy

2026-04-17 撤廃。`ja_omission_policy_registry` と Tricentis legal removal policy は削除され、JA は EN 原文 (pricing callout / `http://testim.io` / `https://www.testim.io/pricing/` URL 含む) を全面 mirror する source-first 契約に統合された。許容機構は **broken-EN snapshot 退避 ONE purpose only** (`SOURCE_SYNC_EXCLUSIONS` + `ARTIFACT_REGISTRY`) に簡素化。詳細は plan `2026-04-16-m2-parity-burndown.md` の §5.3.3 撤廃記録と §P2-6 audit 結果を参照。

---

## PR merge gate matrix (proposal J, Codex Round-3 approved)

全ての PR が `parity-baseline.json`、`scripts/lib/source_parity_*`、`scripts/lib/en_source_patches.mjs`、`docs/superpowers/` 配下 を touch する場合、以下の gate を通過しない限り merge 不可。

### 必須不変量

1. **Baseline delta is monotonic non-increasing** (`Δ entries ≤ 0`)
   - PR description に before/after entries count を明示必須
   - `Δ > 0` は契約違反。architect + plan-fidelity reviewer の明示的 override 署名が PR description に必要
   - cascade / mechanism PR でも例外なし

2. **No new suppression lane**
   - PR Z 以降で許容される suppression lane は **`SOURCE_SYNC_EXCLUSIONS` + `en_source_patches` のみ**、いずれも broken-EN 退避用途に限定
   - M2 期間中に限り、`parity_artifact_registry` は transitional lane として存続 (PR Z までに zero live entry に migrate、spec §4.2 参照)
   - 新規 allowlist / carve-out / acknowledgement / `inconclusiveReason` masking の導入は不可
   - 検知 false-positive は silent suppression ではなく mechanism fix で解消する (§5.3.7 / §5.3.N 経由)

3. **6-reviewer signoff matrix (parallel, all required)**:

   | Reviewer | 観点 |
   | --- | --- |
   | architect | design integrity / spec 契約整合 / layer boundary |
   | QA | behavior correctness / regression risk |
   | testing | test coverage + regression pins (80%+ coverage) |
   | security | L2 gate for exception additions / 設計違反スコープ逸脱検知 |
   | Codex (external model) | independent second-opinion review |
   | plan-fidelity | plan/spec 文言整合 / §5.3.N marker protocol 遵守 / 未登録 carve-out 検知 |

4. **Test pins (must pass)**:
   - `scripts/__tests__/source_parity_clean_page_fixtures.test.mjs` (sentinel slugs の totalIssues=0)
   - `scripts/__tests__/en_source_patches.test.mjs` / `_integration.test.mjs` (patch-registry invariants)
   - `scripts/__tests__/generate_parity_baseline.test.mjs` (pre-regen gate / proposal I)
   - 各 `§5.3.N` regression guard

5. **Baseline regen cycle**: PR merge 後の full `--regenerate` は必ず pre-regen fail-closed gate (plan §4) を pass。CI run log に `baseline-regen-gate: pass` を明示。

### 違反時の運用

- gate 違反 PR は `REQUEST_CHANGES` で返却。gate override は architect + plan-fidelity reviewer の **両者明示署名** が必須 (single-reviewer override 不可)
- Codex review は review-ordering 上 **最終 reviewer** (他 5 reviewer が揃った後に発火)
- ad-hoc carve-out の導入禁止 (§5.3.N proposal marker protocol を経由)

### Source contract

- `docs/superpowers/specs/2026-04-14-parity-phase4-final-goal.md` §4.0 (final-state suppression-lane contract, A'.1)
- `docs/superpowers/specs/2026-04-14-parity-phase4-final-goal.md` §4.2 (parity-artifact-registry transitional, F)
- `docs/superpowers/plans/2026-04-16-m2-parity-burndown.md` §P2-5 Exit (DoD invariants, A'.2)
- memory `feedback_baseline_zero_increase.md` (monotonic non-increase principle)
- memory `feedback_four_reviewer_gate.md` (review orchestration)
