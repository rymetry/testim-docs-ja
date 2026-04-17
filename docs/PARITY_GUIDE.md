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
4. **reviewAfter 期限 ≤ 3 ヶ月**: 長期凍結禁止。期限切れは `orphanBaselineEntries` として検知される

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
| EN-only の壊れた token (display text と href 不一致等)、小規模 artifact | 現時点では baseline に残る (Phase 0 後に件数を見て micro-exclusion 層の必要性を判断) | `creating-your-first-codeless-test` の google.com |

**重要**: baseline は「未解決 issue の凍結」のみ。上記 normalize / mask / page-level exclusion で吸収される artifact は baseline の対象ではない。blanket に "方針だから baseline に入れる" は禁止。

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

## Bug backlog の返済優先順位

Phase 0 後の baseline は「未解決バグの backlog」になる。Phase 1 以降で以下の優先順位で返済する:

| 種別 | 対応内容 | 難易度 |
| ------ | ---------- | -------- |
| segment-extra (preface 重複、手順導入文分離、callout 番号リスト展開) | パターン化されており機械的修正可能 | 低 |
| segment-missing | EN にあって JA にない段落の翻訳復元 | 中 |
| segment-untranslated (glossary mask 後の残り) | 本物の翻訳抜け。翻訳が必要 | 中 |
| section-structure-mismatch | 上記の派生、自動解消されることが多い | — |
| segment-token-gap (URL normalize 後の残り) | CLI フラグ・内部リンクの欠落。ピンポイント修正 | 低 |
| segment-inconclusive | tokenless-near-tie 等。自動判定の限界。手動確認 | 高 |

Top 2 大物ファイルとロングテール (1-3 件ファイル 69 ファイル) はバッチ処理で返済する。
