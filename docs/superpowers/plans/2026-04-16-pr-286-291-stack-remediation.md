# PR #286–#291 Stack Remediation — M1 Task Breakdown

**Date:** 2026-04-16
**Status:** Rev 2.1 Draft（実装着手前。本 plan 自体が deliverable）
**Revision log:**
- Rev 1 (2026-04-16 初版): 22 task M1 breakdown
- Rev 2 (2026-04-16 同日 reviewer gate 反映): 4 reviewer (architect/qa/testing/ai) からの persists 11 件 (P1–P11) を反映。主変更は (a) T0 追加（policy-pointer stub + G6 INVARIANT 登録手順の M1 前倒し、R2 silent-drop 予防）、(b) T3 に inventory guard test 追加、(c) T5 に 6 ケース目（exit code）明示、(d) D8/T5/T20 の検証コマンド mechanical 修正、(e) D11（80% coverage）追加、(f) §10.2 commit 1 を 1a/1b に分割、(g) Q1/Q2 canonical 値を pin (snapshot=288 / PR #291 head baseline=345/103 slugs)。ゴール (source-first / 全 counter → 0) は不変、M1 scope も 23 task に 1 件のみ追加で逸脱なし
- Rev 2.1 (2026-04-16 同日 Rev 2 gate 反映): Rev 2 gate で 8/11 closed、1 HIGH + 3 minor が発生。Rev 2.1 で: (a) D11 regex が node:test 出力書式と不整合 → awk 版に置換 + `loadInvariantPatterns` shallow check 追加、(b) §3.1 family_tag 凡例に "governance / 再発防止" + 既存未列挙タグ 3 件 (設計確認 / maintainability-risk / scope-shrinkage) を追加、(c) §10.2 step 3 最終 regen の意図を "idempotent 検証 regen" と明示（Arch-3 clarification）、(d) T12 に fixture content-correctness assert を追加（fragility-1）、(e) T13 に numeric re-pin threshold を明示（fragility-2）。ゴール不変
**Parent plan:** [docs/superpowers/plans/2026-04-15-parity-bulk-remediation.md](./2026-04-15-parity-bulk-remediation.md) §10–§12（PR Z 着手 entry criteria）
**Phase 4 plan:** [docs/superpowers/plans/2026-04-14-parity-phase4-schema-cleanup.md](./2026-04-14-parity-phase4-schema-cleanup.md) Rev 7（atomic cutover の最終 DoD）
**Source review run:** `.takt/runs/20260416-085247-en-ja-phase1-4-pr-286-291-d/reports/integrated-report.md` §6.3 M1
**This run:** `.takt/runs/20260416-100807-resume-20260416-085247-en-ja-p/`

## 1. Context

PR #286–#291 は Phase 4 PR Z 前段の bulk burn-down stack。3 連続の reviewers iteration（前回 run iter 1/2 + 本 run iter 1）で同一 20 件の persists を発生させており、policy「堂々巡りの検出」に従い、本 run では PR head に追加 commit を積む前段として **plan 文書化** を成果物とする。

| 項目 | 値 |
|------|----|
| PR stack | #286 (`654e69e6`) / #287 (`8809dd85`) / #288 (`3a2db009`) / #289 (`1f7dc251`) / #290 (`c0bd94f9`) / #291 (`dcd423ce`)（HEAD 据え置き、本 plan 起票時点） |
| main HEAD | `6d88b27`（PR #285 merge）据え置き |
| 入力 finding 数 | 20 件（architect 5 / qa 8 / testing 7 = 重複排除 20）+ 非ブロッキング 3 件（N-286-1/2/3）+ ガイド改訂候補 6 項目 |
| 制約 | ガイド本文の before/after patch は本 plan に書かない（前回 run から継続）。本 plan は「何を変えるか」の指示書 |

### 1.1 plan の責任分界

| 含む | 含まない |
|------|----------|
| 各 task の対象ファイル・行番号・変更の方向性・検証方法・依存・見積 | 具体的な前後 diff、SQL 変換テーブル、ガイド本文の改訂前後比較 |
| stack 全体の DoD と PR Z entry criteria への接続 | PR Z 自身の implementation（Phase 4 plan が所掌） |
| ガイド改訂候補の参照と要点列挙 | ガイド本文の言い回し（M4 の別 plan で扱う） |

## 2. Scope と Milestone 構造

| Milestone | 範囲 | 主要 deliverable | 依存 |
|-----------|------|------------------|------|
| **M1** | 本 PR stack 内（PR #291 head に追加 commit、または PR #286 head へ巻き戻し commit）。20 件 finding + 非ブロッキング 3 件を解消 | reviewers 4 系（architect / qa / testing / ai）が APPROVE に転じる stack | — |
| **M2** | Phase 4 PR Z 前の別 PR 群。ARTIFACT_REGISTRY 拡充 / URL normalizer narrow rule / preprocessHtml EN blockquote 正規化 / Stage B7 起票・burn-down / B1–B6 完了確認 | PR Z entry criteria 全充足 | M1 |
| **M3** | Phase 4 PR Z（atomic cutover） | Phase 4 DoD 達成（baseline `entries === 0` / 4 counter = 0） | M2 |
| **M4** | ガイド改訂（別 PR、M3 と並行 or 後続） | WRITING_GUIDE / TRANSLATION_GUIDE / PARITY_GUIDE / OPS_DESIGN / GLOSSARY / INVARIANT_TOKENS / scripts/README の整合 | M1（構造決定）/ M2（artifact 運用）/ M3（schema v2） |
| **M5** | upstream（Tricentis MadCap） | export artifact 修正要請（T1 ブロッカー） | 並行（ローカルは artifact registry で吸収継続） |

本 plan の Task は M1 + M4 の準備のみを直接列挙する。M2/M3/M5 は既存の Phase 4 plan / parity-bulk-remediation plan が所掌。

## 3. Task 一覧（M1: 23 task — T0 (Rev 2 で追加 / policy stub + G6 前倒し) + T1–T22。うち非ブロッキング 3 件 = T17 / T18 / T19。§3.2 main 表に内包済、別カウントしない）

各 task は `T#` で識別。`finding_id` は前回 reviewers と本 run reviewers の両方で参照される識別子。

### 3.1 凡例

| 列 | 意味 |
|----|------|
| family_tag | 同種指摘の集約タグ（regression / test-coverage / code-quality / abstraction-mixed / error-handling / ドキュメント / 保守性 / test-fragility / test-contract / doc-drift / test-fixture / 凝集度 / security / **governance / 再発防止**（Rev 2 で追加、T0 で使用）/ **設計確認**（T20 で使用）/ **maintainability-risk**（T21 で使用）/ **scope-shrinkage**（T22 で使用）） |
| 影響 PR | 触る PR head（PR #291 head に積む / PR #286 head に積む / 任意） |
| 検証 | 完了判定に必要な機械実行可能なコマンド・grep・jq |
| 見積 | 1 = 軽微 / 2 = 中 / 3 = 大（review 負荷込み） |

### 3.2 Task 表

| T# | finding_id | family_tag | 対象ファイル | 行 / 場所 | 変更の方向性 | 検証 | 依存 | 見積 |
|----|------------|------------|-------------|----------|-------------|------|------|------|
| T0 | Rev 2 reviewer gate P1 + P2（architect / ai consensus） | governance / 再発防止 | `docs/GLOSSARY.md` (header) / `docs/INVARIANT_TOKENS.md` (header) / `.github/pull_request_template.md` (存在しなければ新規) | 各 GLOSSARY/INVARIANT ファイル冒頭、PR template 末尾 | (a) GLOSSARY / INVARIANT 両ヘッダに `> **Policy status (in revision):** See \`docs/superpowers/plans/2026-04-16-pr-286-291-stack-remediation.md\` §4 G2/G5/G6. 本 PR stack 内の用語削除・pattern 分割は本 plan 範囲として正当化される。` 相当の pointer stub 1 段落追加。(b) PR template に `INVARIANT_TOKENS.md 変更を含む PR は \`grep '^## ' docs/INVARIANT_TOKENS.md\` 出力 diff を PR 本文に記載（silent drop 予防 / 本 plan R2 / G6）` 1 行追加 | `grep -l 'Policy status (in revision)' docs/GLOSSARY.md docs/INVARIANT_TOKENS.md \| wc -l` = 2 / `grep -c "grep '\^## ' docs/INVARIANT_TOKENS.md" .github/pull_request_template.md` ≥ 1 | — | 1 |
| T1 | AI-001 / QA-NEW-invariant-patterns-silent-drop | regression | `docs/INVARIANT_TOKENS.md` | `^## ` 列挙の末尾、PR #287 tip `8809dd8` で存在した位置 | PR #288 で silent drop した 5 pattern (`inline-js-throw-return` / `table-header-pattern` / `common-it-loanword` / `technical-concept-term` / `sfdc-ui-name-with-parens`) を PR #291 head 上で復元 | `git show pr291-tip:docs/INVARIANT_TOKENS.md \| grep -cE '^## (inline-js-throw-return\|table-header-pattern\|common-it-loanword\|technical-concept-term\|sfdc-ui-name-with-parens)$'` = 5（BRE では `(...)` `|` が literal 扱いになるため `-E` 必須） | — | 1 |
| T2 | （T1 の副作用） | regression | `parity-baseline.json` | repo root | T1 適用後に `node scripts/generate_parity_baseline.mjs --regenerate` で再生成。PR body に delta（issueType ベース）を追記 | `git diff main..pr291-tip -- parity-baseline.json \| wc -l` が再生成後に変化 / `jq '.entries \| length' parity-baseline.json` 取得 | T1 | 1 |
| T3 | ARCH-001 / Rev 2 reviewer gate P7（testing） | test-coverage | `scripts/__tests__/parity_glossary_mask.test.mjs` | 既存 `describe('maskSegmentText — invariant pattern match')` ブロック + 新 `describe('INVARIANT_TOKENS inventory guard')` ブロック | (a) T1 で復元する 5 pattern + PR #286/#287 の他新 pattern それぞれに「example が mask される」「想定外文脈で誤 mask しない」最低 2 ケース追加。(b) P7 inventory guard: `loadInvariantPatterns()` で取得した ID 集合が frozen canonical set (`inline-js-throw-return` / `table-header-pattern` / `common-it-loanword` / `technical-concept-term` / `sfdc-ui-name-with-parens` + 他現存 pattern) を `⊇` で含むことを 1 assert で検査。pattern 削除時に silent ではなく test 失敗で検知する（R2 予防の test 層） | `npm run test -- parity_glossary_mask.test.mjs` green / `grep -cE 'inline-js-throw-return\|table-header-pattern\|common-it-loanword\|technical-concept-term\|sfdc-ui-name-with-parens' scripts/__tests__/parity_glossary_mask.test.mjs` ≥ 5 / `grep -c 'INVARIANT_TOKENS inventory guard' scripts/__tests__/parity_glossary_mask.test.mjs` ≥ 1 | T1 | 2 |
| T4 | ARCH-002 / AI-004 / QA-NEW-glossary-compound-false-negative / B-291-2 | regression / test-coverage | `docs/GLOSSARY.md` + `scripts/__tests__/parity_glossary_mask.test.mjs:238-282` | GLOSSARY 該当 6 行（`browser version` / `major version` / `Add action` / `Add validation` / `Mark error` / `Mark warning`） | (a) 4 一般語 (`browser version` / `major version` / `Add action` / `Add validation`) を **削除** または **artifact registry へ移管**。`Mark error` / `Mark warning` は Testim UI ラベル該当時のみ INVARIANT 文脈限定 regex として再定義可。(b) 4 語英文 regression (`Click Add action button` / `Please Add validation now` / `Select browser version carefully` / `Choose major version now`) で `isFullyMasked === false` を assert | `npm run test -- parity_glossary_mask.test.mjs` green / `grep -iE '^\| (browser version\|major version\|add action\|add validation)' docs/GLOSSARY.md` = 0 hit / 4 語英文 regression が新 describe 内に存在 | T1 / T3 | 2 |
| T5 | ARCH-003 / TEST-NEW-find_untranslated-MISSING-TEST / QA-NEW-find-untranslated-no-tests / AI-002 / Rev 2 reviewer gate P3 + P8（qa / testing） | test-coverage | `scripts/__tests__/find_untranslated.test.mjs`（新規。対象 `scripts/find_untranslated.mjs` は PR #291 head `dcd423ce` 上に存在済、main には未存在のため本 stack merge 時に同時入庫する前提） | — | 最低 **6 ケース**: (1) frontmatter 境界 skip / (2) ブロック境界（heading / fence / callout / image） / (3) `--slug=<existing>` filter / (4) baseline 0 件 warning / (5) classifySegment 統合（fully-masked 除外） / (6) P8: `--slug=<non-existent>` で exit code 2（T8 の fail-fast 契約を test 先行で pin） | `node --test scripts/__tests__/find_untranslated.test.mjs` green / `npm run test` 全体 green / `grep -cE '^\s*(describe\|it\|test)\(' scripts/__tests__/find_untranslated.test.mjs` ≥ 6（P3: `^test(` は node:test の describe/it 規約と不整合だったため ERE alternation に修正） | T11（先行で T11 が `find_untranslated.mjs` を 3 関数に分割していると test 設計が容易） | 3 |
| T6 | ARCH-004 | code-quality | `scripts/find_untranslated.mjs` | L26 / L41 / L78 の説明コメント 3 行 | What/How を自然言語で言い換えた 3 行を **削除**。Why のコメントが必要な箇所のみ短く残す（policy「コメントは Why のみ」） | `git diff main..pr291-tip -- scripts/find_untranslated.mjs` で 3 行削除確認 / `grep -nE '^\s*//' scripts/find_untranslated.mjs` 残存コメントが Why 系のみ | — | 1 |
| T7 | ARCH-007 | 設計（責務分離） | `scripts/find_untranslated.mjs` | L37-91 の 55 行ループ | `splitMarkdownBlocks(markdown)` / `findUntranslatedBlocks(blocks, opts)` / `printFindings(findings)` の 3 関数に抽出。トップループは順次呼出のみに縮小（30 行以内、ネスト ≤2） | `wc -l scripts/find_untranslated.mjs` で 1 関数 30 行以内 / `npm run lint` green / `node --test scripts/__tests__/find_untranslated.test.mjs` green | T5（test 先行で挙動 pin） | 2 |
| T8 | QA-NEW-find-untranslated-exit-code | error-handling | `scripts/find_untranslated.mjs` | L42-45（`if (!fs.existsSync(filePath)) { console.error('SKIP: ...'); continue; }`） | `--slug` 明示指定時のみ、対象ファイル不在で `process.exit(2)` で fail-fast。baseline モード（`--slug` なし）は現状の SKIP+continue を維持し silent CI 失敗の温床にしない | `node scripts/find_untranslated.mjs --slug=does-not-exist; echo $?` = 2 / baseline モードは 0 件出力で `echo $?` = 0 / test に該当ケース追加 | T5 / T7 | 1 |
| T9 | QA-NEW-find-untranslated-undocumented / AI-002 | ドキュメント | `package.json` / `scripts/README.md` | `package.json` `scripts` セクション、`scripts/README.md` 診断系章 | (a) `"check:untranslated": "node scripts/find_untranslated.mjs"` を `package.json scripts` に追加。(b) `scripts/README.md` 診断系章に用途 / 使用例 / 引数仕様 / exit code を 2-3 行追記。(c) 本 plan §10「次のアクション」に位置づけ参照を追記 | `jq -r '.scripts."check:untranslated"' package.json` が文字列 / `grep -c 'find_untranslated' scripts/README.md` ≥ 1 | T7 / T8 | 1 |
| T10 | QA-NEW-find-untranslated-redundant-cond | 保守性 | `scripts/find_untranslated.mjs` | L72 付近 `if (!cls.isFullyMasked && cls.residue.length > 0)` | 第 2 条件が冗長（契約上 `isFullyMasked === false ⇒ residue.length > 0`、`scripts/lib/parity_glossary_mask.mjs:187-195` 参照）のため `if (!cls.isFullyMasked)` に縮約 | `grep -n 'cls.isFullyMasked' scripts/find_untranslated.mjs` で第 2 条件消失 / 既存 test 全 green | T5 | 1 |
| T11 | AI-003 / TEST-NEW-representative_summary-L103 / QA-NEW-residual-not-promoted | test-contract | `scripts/__tests__/source_parity_representative_summary.test.mjs` | L92-109 / L116-158 / 冒頭 doc comment L8-32 | 削除 4 slug の現状を実測再評価し、(a) 実 resolved 3 slug を `RESOLVED_PAGES` に昇格 / (b) 未解消の `running-tests/the-command-line-cli` を `RESIDUAL_PAGES` に戻す / (c) 冒頭 doc comment L8-32 を実体に同期 | `node --test scripts/__tests__/source_parity_representative_summary.test.mjs` green / RESOLVED 件数と RESIDUAL 件数が doc comment と一致 | T2（baseline 再生成後の状態を見る） | 2 |
| T12 | ARCH-005 / AI-005 / QA-NEW-test-pin-recurrence / Rev 2.1 QA+testing fragility-1（MEDIUM, non-blocking） | test-fragility | `scripts/__tests__/source_parity_align_runtime.test.mjs` | L20 / L200 / L224 / L258 / L271 / L280 の `editing-tests/generating-a-random-value` 単独 pin | 合成 fixture (`scripts/__tests__/fixtures/parity_align_runtime_synthetic.{en,ja}.md`) 新規追加 → pin を合成 fixture に置換。合成化が困難な場合は pin を 2 ページ以上に増やし 1 ページ破綻時の fallback を確保。**fragility-1 対策: fixture は空ファイルで通過させない content-correctness assert を最低 1 ケース追加**（例: `extractSegmentsFromMarkdown(fixture).length >= 3` / fixture の EN 版と JA 版で section heading 数が一致する assert 等） | `ls scripts/__tests__/fixtures/parity_align_runtime_synthetic.*.md` で 2 ファイル / `grep -c 'segments.length' scripts/__tests__/source_parity_align_runtime.test.mjs` ≥ 1（fixture shape assert が存在） / pin 文字列が fixture path or 2 slug 以上を参照 / `node --test scripts/__tests__/source_parity_align_runtime.test.mjs` green | T2 | 3 |
| T13 | TEST-NEW-align_runtime-PIN-FRAGILITY / TEST-NEW-align_runtime-DOCSTRING-L20 / Rev 2.1 testing fragility-2（MEDIUM, non-blocking） | doc-drift | `scripts/__tests__/source_parity_align_runtime.test.mjs` | docstring L17-23 | swap 履歴（`shared-configuration` → `generating-a-random-value` → 合成 fixture or 複数 pin）と再 pin 判定基準を docstring に追記。**fragility-2 対策: 再 pin 閾値を numeric に pin**（例: `pin 対象 slug の baseline entry 数 drift が ≥3 件/週、または pin 対象 slug 削除により test fail が 1 回以上発生、の 2 条件のいずれかが真なら fixture 化へ再 swap を検討`） | `grep -A 10 'pin' scripts/__tests__/source_parity_align_runtime.test.mjs \| head -30` に判定基準が文字列で存在 / `grep -cE '(drift.*≥ ?[0-9]\|週 [0-9]\|件)' scripts/__tests__/source_parity_align_runtime.test.mjs` ≥ 1（numeric threshold が docstring にエンコードされている） | T12 | 1 |
| T14 | TEST-NEW-representative_summary-DOCSTRING-L19 | doc-drift | `scripts/__tests__/source_parity_representative_summary.test.mjs` | docstring L19-26 | T11 適用後の RESOLVED 3 件 + RESIDUAL 1 件の構成に doc comment を同期 | docstring の RESOLVED/RESIDUAL 列挙が L92-158 の実コードと一致 | T11 | 1 |
| T15 | TEST-NEW-representative_summary-NEW-SURFACE-TYPES | test-coverage | `scripts/__tests__/source_parity_representative_summary.test.mjs` | L103-109 `requiredBaselinedTypes` | 既存の `segment-untranslated` 単一 pin に加えて、`section-structure-mismatch` / `segment-extra` の代表 1-2 件を `requiredBaselinedTypes` に追加（PR #287/#288 で副作用増加した surface） | `grep -c 'section-structure-mismatch\|segment-extra' scripts/__tests__/source_parity_representative_summary.test.mjs` ≥ 2 / test green | T2 / T11 | 2 |
| T16 | TEST-NEW-recall-report-FIXTURE-CHANGE | doc-drift | PR #287 body / 本 plan §10 | `recall-report.json:129` の `maxBaselineDiffsPerPage` 32→5 変化の根拠を 1-2 行追記 | PR #287 body 末尾に `maxBaselineDiffsPerPage 32→5` の根拠 1 行 / 本 plan §10 で参照 | — | 1 |
| T17 | ARCH-006 / N-286-3（非ブロッキング） | security | `scripts/find_untranslated.mjs` | path 構築箇所（L37 付近 `path.join(DOCS_DIR, slug + '.md')`） | `path.resolve()` + `DOCS_DIR` 接頭辞検証で `--slug=../../etc/passwd` 等の trust boundary 超過を fail-fast。trust boundary 内 CLI のため blocking ではないが、原則遵守として実施 | `node scripts/find_untranslated.mjs --slug=../../foo` が exit code 非 0 / test 1 ケース追加 | T5 / T7 / T8 | 1 |
| T18 | ARCH-008 / N-286-1（非ブロッキング） | 凝集度 | `docs/GLOSSARY.md` ヘッダ | 「Testim 固有名詞」「Testim UI label」「許容される一般 IT 用語」の 3 セクション分離。本 plan では分離 **方針** のみ確定し、本文の章立て改訂は M4 ガイド改訂 plan に委譲 | `grep -c '^## ' docs/GLOSSARY.md` でセクション数増加 / 本 plan §6 と M4 plan の対応関係明記 | T4（一般語整理後に分離） | 2 |
| T19 | ARCH-009 / N-286-2（非ブロッキング） | 凝集度 | `docs/INVARIANT_TOKENS.md` `common-it-loanword` / `technical-concept-term` | 広 alternation を文脈限定 pattern に分割。具体的な分割案は M4 ガイド改訂 plan で確定するが、本 plan では「分割する」方針と分割後の最低 pattern 数（≥3）を明示 | `grep -cE '^## (common-it-loanword\|technical-concept-term)$' docs/INVARIANT_TOKENS.md` の総行数 ≥ 3（BRE では `(...)` `|` が literal 扱いのため `-E` 必須） / 各 pattern の regex が単一語 alternation のみで構成 | T1 / T3 | 2 |
| T20 | B-288-3 / Rev 2 reviewer gate P5（qa） | 設計確認 | `src/content/docs/advanced-editing/custom-code-1.md` / `custom-code.md` | 同時編集が source-first 整合かを EN 原文 (`snapshots/en/content/advanced-editing/custom-code-1.html` / `custom-code.html`) と突合し、PR #288 body に根拠 1-2 行追記。整合 NG なら片方の編集を revert | `npm run check:parity -- --slug=advanced-editing/custom-code-1` で green / `npm run check:parity -- --slug=advanced-editing/custom-code` で green / PR #288 body に確認結果 1 行（P5: 旧 `diff <(turndown ...)` は turndown が CLI 非提供のため project の parity check へ置換） | — | 2 |
| T21 | AI-NEW-GLOSSARY-explosion | maintainability-risk | `docs/GLOSSARY.md` + 新規 lint script `scripts/check_glossary_duplicates.mjs` | main 498 行 → PR #291 head 2781 行（5.6x）に同一 key 重複多数（`Configuration Library` 4 回 / `Setup step` vs `Setup Step` / `Add Custom Action` vs `Add custom action` 等） | (a) 重複行を merge して 1 entry にまとめる（大文字小文字の揺れは正規化）。(b) 重複検出 lint script を新規追加し `npm run lint:glossary` で CI gate 化。本 plan §4 G5（M4 ガイド改訂）の 3 セクション分離と整合 | `node scripts/check_glossary_duplicates.mjs; echo $?` = 0 / `wc -l docs/GLOSSARY.md` が 2781 → 重複削減後の値（compound 一般語削除 T4 と整合） / `package.json scripts.lint:glossary` 存在 | T4 / T18 | 2 |
| T22 | AI-NEW-gather-plan-section-shrinkage | scope-shrinkage | 本 plan 自体の構造 | §1–§12 の必須 7 セクション | 本 plan 起票時点で「依存関係図」「リスクと緩和策」が単行省略されていないか自己点検。本 plan §5（依存関係グラフ）は 23 task (Rev 2 以降) 全てに edge を含み、§7（リスク）は R1–R11 で regression / scope-bleed / merge-conflict / baseline-stale / fixture-fragility / scope-creep / upstream-block / review-bypass / numerical-drift の主要 type を網羅 | (a) 本 plan §5 のグラフに T0–T22 の全 node が登場 / (b) §7 のリスク表に R1–R11 が列挙 / (c) §3 header の「23 task」表記が §3.2 表の T# 行数と一致（`grep -cE '^\| T[0-9]+ \|' docs/superpowers/plans/2026-04-16-pr-286-291-stack-remediation.md` = 23）/ (d) §8 footer の「合計 23 task」が §3.2 表の T# 行数と一致 / (e) §3.3 の非ブロッキング 3 件が main 表 T17/T18/T19 と同一エントリであることを脚注で明記 / (f) Rev 2 以降は §6.2 DoD D1–D11（D11 は P9 coverage gate） | — | 1 |

### 3.3 非ブロッキング sub-task のスコープ確認

| 識別子 | 元レビュー | 本 plan での扱い（main 表 §3.2 に内包済 — 別カウントしない） |
|--------|----------|-----------------|
| N-286-1（GLOSSARY 3 セクション分離） | architect non-blocking | T18（M1 で方針確定 / 本文改訂は M4） |
| N-286-2（INVARIANT 広 alternation 分割） | architect non-blocking | T19（M1 で方針確定 / 本文改訂は M4） |
| N-286-3（`--slug` path 境界検証） | architect / security non-blocking | T17（M1 で実装） |

## 4. ガイド改訂候補（M4 への申し送り）

本 plan では実装しない。M4 用に「何を変えるか」のみ列挙する。

| G# | 対象ガイド | 改訂趣旨 | 連動 task |
|----|-----------|---------|----------|
| G1 | `docs/WRITING_GUIDE.md` | callout mapping 表の刷新（JA 独自 callout 廃止方針 / 原文 callout の `:::` 表現対応表） | M1 後の 構造決定が確定後 |
| G2 | `docs/TRANSLATION_GUIDE.md` §5.3 | terminology 表に「許容される一般 IT 用語」セクションを新設し GLOSSARY との責任分界を明文化 | T18（GLOSSARY 分離方針）と整合 |
| G3 | `docs/PARITY_GUIDE.md` § 既知 artifact | M2 の ARTIFACT_REGISTRY 拡充内容と同期、artifact 登録基準と意図的差異 vs upstream 修正待ちの判定フロー追記 | M2 完了後 |
| G4 | `docs/OPS_DESIGN.md` Rollback Playbook | Phase 4 PR Z atomic cutover の rollback 手順（schema v1 ↔ v2、baseline 再生成、CI workflow 切り戻し）を追記 | M3 着手前 |
| G5 | `docs/GLOSSARY.md` ヘッダ | T18 の 3 セクション分離を実装（章立て改訂、各セクションの基準、追加 PR 時の reviewer 必須項目） | T18 |
| ~~G6~~（Rev 2 で T0 として M1 前倒し済） | `docs/INVARIANT_TOKENS.md` 登録手順 / PR template | ~~T1 の silent drop 再発防止のため、追加 / 削除時の PR body 必須項目（`grep '^## '` 出力 diff 添付）を登録手順 §3-4 として追記~~ → **Rev 2: PR template 版は T0 で実装済。M4 では INVARIANT_TOKENS.md §3-4 の本文文言整備（registration procedure prose）のみを追加作業として残す** | T0（M1） |
| G7 | `scripts/README.md` 診断系章 | T9 で追記する `find_untranslated.mjs` の説明と整合させつつ、診断系全体の章立て（`generate_untranslated_placeholders.mjs` / `find_untranslated.mjs` / `check_snapshots.mjs` / `snapshot_diff.mjs`）を整理 | T9 完了後 |

## 5. 依存関係グラフ

`A → B`: A 完了が B の前提条件（ファイル変更の意味的依存。並列実行可否を示す）。

```
T0 ── （Rev 2 追加 / policy stub + G6 前倒し / 他 task の strict prerequisite ではないが commit 0 として先行）
T1 ──┬──> T3 ──┬──> T19
     │         └──> T18 ──> G2 / G5
     ├──> T2 ──┬──> T11 ──> T14
     │         ├──> T15
     │         └──> T12 ──> T13
     │
T4 ──┴──> （T1, T3 と並行）
T5 ──┬──> T7 ──┬──> T8 ──> T9 ──> G7
     │         └──> T10
     │         └──> T17
T6 ── （T5/T7 と独立、並行可）
T16 ── （独立、PR #287 body 編集のみ）
T20 ── （独立、PR #288 body 編集のみ）
T21 ── T4 ──> T18 完了後に GLOSSARY 重複検出 lint 追加
T22 ── （本 plan 自身の自己点検、即時）
G1, G3, G4 ── M2/M3 待ち（M1 完了後に M4 plan で実装）
G6 ── Rev 2 で T0 として M1 前倒し済
```

**並列実行ライン**:

| ライン | task |
|-------|------|
| ライン A（INVARIANT / GLOSSARY 系） | T1 → T2 → T3 → T4（T4 は GLOSSARY 単独で T1 と並行可） |
| ライン B（find_untranslated 系） | T6 → T5 → T7 → T8 / T10 / T17 → T9 |
| ライン C（test contract / fixture 系） | T11 → T14、T15、T12 → T13（T2 後に開始） |
| ライン D（独立 PR body 編集） | T16、T20（いつでも） |
| ライン E（非ブロッキング / 凝集度） | T18 → G5、T19（T1/T3 後）、T21（T4/T18 後）|
| ライン F（plan 自己点検） | T22（本 plan 起票と同時に自動成立） |
| ライン G（Rev 2: governance 前倒し） | T0（commit 0 として 他 commit 前に単独着手） |

## 6. 検証基準

### 6.1 Task 単位 DoD

各 task は §3.2 の「検証」列のコマンド・grep・jq が all green であること。

### 6.2 Stack 全体 DoD（M1 完了条件）

| # | 条件 | 機械検証 |
|---|------|---------|
| D1 | 4 reviewers (architect / qa / testing / ai) の `persists` がすべて 0 件 | 次回 reviewers iteration の各 review.md の persists 件数 |
| D2 | `npm run test` が全ファイル green | exit code 0 |
| D3 | `npm run lint` が green | exit code 0 |
| D4 | `npm run build` が green（`astro check` + build） | exit code 0 |
| D5 | `node scripts/generate_parity_baseline.mjs --regenerate` で baseline 再生成、issueType 内訳を PR body に反映 | `git diff` で `parity-baseline.json` 更新確認 |
| D6 | `find_untranslated.mjs` が orphan 状態を脱している（test + README + npm script + plan 言及） | `jq` / `grep` で 4 全部 |
| D7 | 4 一般語（`browser version` / `major version` / `Add action` / `Add validation`）が GLOSSARY から削除済 OR artifact registry 移管済 | `grep -iE` 0 hit |
| D8 | 5 INVARIANT pattern が PR #291 head に存在（Rev 2 P6: T1 と同じ ERE alternation に統一） | `grep -cE '^## (inline-js-throw-return\|table-header-pattern\|common-it-loanword\|technical-concept-term\|sfdc-ui-name-with-parens)$' docs/INVARIANT_TOKENS.md` = 5 |
| D9 | `RESOLVED_PAGES` / `RESIDUAL_PAGES` と doc comment が一致 | 直読 + 手動 review |
| D10 | test pin が合成 fixture or 複数 pin に置換済 | `ls fixtures/` + grep |
| D11 | Rev 2 P9（testing gate）: M1 で新規/変更した test file が 80%+ coverage 達成。最低 T5 (`find_untranslated.test.mjs`) と T3 拡充分（Rev 2.1 P6-new: Rev 2 初版の grep regex は node:test 出力書式と不整合だったため awk 版に置換） | `node --test --experimental-test-coverage scripts/__tests__/find_untranslated.test.mjs 2>&1 \| awk -F'\\\|' '/all files/ && ($2+0) >= 80 {ok=1} END {exit !ok}'; echo $?` = 0 / 同じ awk コマンドを `scripts/__tests__/parity_glossary_mask.test.mjs` に対しても実行し exit 0。**補助検証**: `grep -c 'loadInvariantPatterns' scripts/__tests__/parity_glossary_mask.test.mjs` ≥ 1（T3 inventory guard が ID set を実ロードしている shallow check 防止 / Rev 2.1 testing LOW） |
| D12 | Rev 2 P10: snapshot/baseline canonical 値が PR body に pin 済（Q1/Q2 解決反映） | PR body に `Snapshots: 288 unchanged / 288 total` および `PR #291 head baseline: 345 entries / 103 slugs (user-facing 1731/219 は issue #284 body stale)` 相当の文字列存在 |

### 6.3 Stack 完了から PR Z 着手 (M3) までの gate

M1 完了後、`docs/superpowers/plans/2026-04-15-parity-bulk-remediation.md` §10 の PR Z entry criteria を再確認:

- (a) 7 issueType の数値条件（`segment-untranslated` = 0 / `segment-missing` = 0 / `segment-extra` = 0 / `section-structure-mismatch` = 0 / `segment-token-gap` = 0 / `segment-order-mismatch` = 0 / `segment-inconclusive` ≤ 3）
- (b) `auditSignalIssues` = 0（M2 で Stage B7 burn-down）
- (c) `advisoryQueueIssues` ≤ 3

これらは M2 で対応。本 plan の M1 完了は M2 着手の前提条件。

## 7. リスクと緩和策

| # | リスク | 発生条件 | 緩和策 | 関連 task |
|---|--------|---------|--------|----------|
| R1 | regression: GLOSSARY/INVARIANT の false-negative 恒常化 | T4 / T19 を未実施で PR Z マージ | M1 で T4（compound 一般語削減 + regression test）と T19（widely scoped pattern 分割方針）を必須化、M4 G2/G5/G6 で運用ルール明文化 | T4 / T19 / G2 / G5 / G6 |
| R2 | scope-bleed: stack merge による pattern silent drop 再発 | 今後の rebase / merge で `INVARIANT_TOKENS.md` に conflict 発生 | T1 で復元後、G6 で PR body template に `git show <pr-tip>:docs/INVARIANT_TOKENS.md \| grep '^## '` 出力を必須化 | T1 / G6 |
| R3 | test-fragility: test pin swap の堂々巡り継続 | 現 pin の baseline drift が解消する毎に pin 差替（過去 4 iteration の繰り返し） | T12 で合成 fixture 化または `segment-untranslated` 保有 slug 自動選択ヘルパー導入。合成化困難なら pin を 2 つ以上に増やし fallback 確保 | T12 / T13 |
| R4 | test-contract: RESIDUAL / RESOLVED_PAGES の drift 拡大 | 新たな解消が RESIDUAL 削除のみで RESOLVED 昇格されない | T11 で doc comment と実体の整合、T14 で docstring 同期、T15 で新 surface type を契約 pin | T11 / T14 / T15 |
| R5 | merge-conflict: 本 plan が前提とする PR head OID 据え置きが崩れる | 本 plan 適用前に rebase or 新 commit が他経路で積まれる | 本 plan §1 で記載した OID を再確認し、変動があれば task の対象行番号を再検証してから着手 | 全 task 着手前の checkpoint |
| R6 | baseline-stale: T2 の baseline 再生成タイミング不整合 | T1 と T2 を分けて commit したことで baseline が一時的に inconsistency | T1 と T2 を 1 commit にまとめる。または T1 commit 後の CI で baseline regen を必須化 | T1 / T2 |
| R7 | scope-creep: T7 の 3 関数抽出が test 設計の前に走り、test が脆弱化 | T7 を T5 より先に commit | 依存グラフ §5 ライン B の順序（T6 → T5 → T7）を厳守 | T5 / T7 |
| R8 | snapshot 数値整合の未解決持ち越し（Open Q1） | M2 着手時に snapshot 288 vs 284 の根拠が未確定 | M1 完了後、M2 起票時に `scripts/check_snapshots.mjs` / `snapshot_diff.mjs` の除外ロジックを追跡し、ユーザー意図を確定 | M2 起票時の checkpoint |
| R9 | upstream-block: T1 の 5 pattern 復元後に false-positive が新規発生 | INVARIANT 復元と同時に既存 content が `isFullyMasked` 化 | T1 commit 後の `npm run check:parity` 全体実行で baseline 増減を確認、increase ≥ 5 件で T1 を保留し pattern を文脈限定 regex に再設計 | T1 着手後の checkpoint |
| R10 | review-bypass: 非ブロッキング 3 件（T17/T18/T19）の skip | M1 を blocking 解消だけで close し非ブロッキング先送り | 本 plan §3.3 で T17–T19 を「M1 必須 task」として列挙し、stack 全体 DoD §6.2 D6/D7 に紐付け | T17 / T18 / T19 |
| R11 | numerical-drift: 本 plan 自身の数値整合崩れ（task 数 / 行番号 / OID 等の表記が §3.2 main 表と乖離） | task 追加・削除時に §3 header / §8 footer / §3.3 / 依存グラフ / R 表番号を同期し忘れる | T22 の検証 (c)/(d)/(e) で `grep -cE '^\| T[0-9]+ \|'` の機械検証を必須化、task 増減時は同 commit 内で全箇所を更新 | T22 / 全 task 編集時 checkpoint |

## 8. 見積サマリ

| ライン | task | 見積合計 | 並列実行で短縮可能か |
|-------|------|---------|--------------------|
| ライン A（INVARIANT / GLOSSARY） | T1 / T2 / T3 / T4 | 6 | T4 のみ並列可（T1 と独立） |
| ライン B（find_untranslated） | T5 / T6 / T7 / T8 / T9 / T10 / T17 | 10 | T6 / T16 / T20 と独立並列可 |
| ライン C（test contract / fixture） | T11 / T12 / T13 / T14 / T15 | 9 | T2 完了後に並列着手可 |
| ライン D（PR body 編集） | T16 / T20 | 3 | 完全独立 |
| ライン E（非ブロッキング） | T18 / T19 / T21 | 6 | T4 / T1 完了後に並列可 |
| ライン F（plan 自己点検） | T22 | 1 | 本 plan 起票時に成立 |
| ライン G（Rev 2 追加 / governance 前倒し） | T0 | 1 | commit 1 前に単独 commit 0 として着手 |
| **合計** | 23 task（M1 のみ。T0 は Rev 2 で追加。T17/T18/T19 は §3.3 の非ブロッキングと同一エントリで重複カウントしない） | **36** | 並列で実時間 ~13-16 |

ガイド改訂候補（G1–G7）は M4 の別 plan で見積。

## 9. PR 配分案

| 案 | 説明 | メリット | デメリット |
|----|------|---------|----------|
| **案 A: 単一 fixup commit を PR #291 head に積む** | T1〜T20 を 1 commit にまとめて PR #291 head に push | review が 1 stack で完結、merge 順を変えなくて良い | commit が肥大化、revert 粒度が荒い |
| **案 B: 7 commit に分割して PR #291 head に積む（Rev 2 で 5 → 7 に増量: commit 0 for T0 + commit 1 を 1a/1b に split）** | (0) T0 policy stub + G6 前倒し、(1a) T1/T2/T3 INVARIANT 復元 + test + baseline regen、(1b) T4/T19 GLOSSARY 一般語削除 + INVARIANT 分割、(2) T5/T6/T7/T8/T10/T17 find_untranslated 設計、(3) T9 ドキュメント、(4) T11/T12/T13/T14/T15 test contract/fixture、(5) T16/T18/T20/T21/T22 PR body/凝集度/lint/self-check の 7 commit | 論理単位 review / 1a 後 `npm run test` green を確認してから 1b へ（R9 false-positive 早期検出）/ revert 粒度が適切 | PR #291 が大きくなる / commit history が複雑 |
| **案 C: 各 PR head にそれぞれ巻き戻し commit を積む** | T1 → PR #287/#288 head、T4 → PR #291 head、T5-T10/T17 → PR #286 head、…等 | 元 PR の責任分界が保たれる | stack rebase の調整が必要、CI workflow 多重起動 |

**推奨**: **案 B**。M1 完了後の reviewers iteration で 4 reviewers 全 APPROVE を得るために、論理単位 review が最も向く。案 C は merge 後に「どの PR が何を解消したか」が明確になるが、stack rebase 調整コストが大きい。

## 10. 次のアクション

### 10.1 即時（本 plan 確定後の最初の作業）

1. **本 plan 自体の review**: 4 reviewers + ai-review で本 plan 文書の網羅性 / 実行可能性 / スコープ規律を再評価（本 run の supervise step 相当）。**Rev 1 review 済 (2026-04-16) → Rev 2 発行 (P1–P11 反映) → Rev 2 再 review が次 gate**
2. **PR head OID の再確認**: §1 表の 6 PR head OID が `gh pr list --json` 出力と一致するかを着手前に再確認。変動があれば §3.2 の行番号を再検証。
3. **Rev 2 P10: Q1/Q2 canonical 数値 pin（commit 1a 前に完了）**: `find snapshots/en/content -name '*.html' \| wc -l` / `jq '.entries \| length' parity-baseline.json` / `jq '[.entries[] \| .slug] \| unique \| length' parity-baseline.json` を main と PR #291 head (`dcd423ce`) で実行。Rev 2 初期測定値: (a) main snapshots = 288、main baseline entries = 1297 / unique slugs = 188、(b) PR #291 head baseline entries = 345 / unique slugs = 103、(c) user-facing "1731 件 / 219 ファイル" は issue #284 body stale（PR #272/#285 merge 後 CI 自動更新未反映）。これらを §6.2 D5/D12 に pin し PR body にも記載
4. **ユーザー判断 gate**:
   - Q8: plan ファイル名 `2026-04-16-pr-286-291-stack-remediation.md` で確定して良いか（本 plan 起票時点で採用）
   - Q9: 本 run 内で PR #291 head へ追加 commit を積むか、別 run に委譲するか
   - 案 A/B/C のどれを採用するか（Rev 2 では案 B = 7 commit を推奨）

### 10.2 M1 着手フェーズ（Q9 で実施判断後）

1. 案 B 採用前提で **7 commit** を順に作成（Rev 2: commit 0 追加 + commit 1 を 1a/1b に split）:
   - **commit 0（Rev 2 P1+P2: policy stub + G6 前倒し）**: T0 のみ。commit message prefix `docs(governance):`。先行 commit として他 commit の正当性根拠を establish
   - **commit 1a（INVARIANT 復元 + 基盤 test + baseline regen）**: T1 / T2 / T3。**commit 1a 確定後に `npm run test` green を必ず確認**（R9 false-positive 早期検出 gate）
   - **commit 1b（GLOSSARY 一般語削除 + INVARIANT 分割）**: T4 / T19。1a green 確認後に着手
   - **commit 2（find_untranslated 設計）**: T6 / T5 / T7 / T8 / T10 / T17
   - **commit 3（find_untranslated ドキュメント）**: T9
   - **commit 4（test contract / fixture）**: T11 / T12 / T13 / T14 / T15
   - **commit 5（PR body / 凝集度方針 / GLOSSARY 重複検出 / self-check）**: T16 / T18 / T20 / T21 / T22
2. 各 commit 後に `npm run lint && npm run test && npm run build` を実行（commit 1a 後は **必須 gate**、他は green 維持確認）
3. 7 commit 全部完了後に `node scripts/generate_parity_baseline.mjs --regenerate` で baseline **最終再生成（Rev 2.1 Arch-3 clarification: T2 で commit 1a に含まれる regen が実質的 canonical 生成。ここでの最終 regen は「commit 1a 以降に累積した 3 以上の commit が baseline に実効変化を与えていないこと」の idempotent 検証 regen であり、diff が発生したら各 commit に漏れがあった証左として個別調査。2 回目 regen は副次的 delta の原則発生しない）**
4. PR #291 description 更新: §6.2 stack 全体 DoD の D1–D12 チェックリスト埋め（D11 = 80% coverage / D12 = Q1/Q2 pin）

### 10.3 M1 完了後

1. 4 reviewers + ai-review iteration を再起動し全 APPROVE を確認
2. PR stack を順次 merge（#286 → #287 → #288 → #289 → #290 → #291、ただし `npm run check:parity` で各 merge 後 baseline 再生成）
3. M2 起票（Stage B7 / ARTIFACT_REGISTRY / URL normalizer / preprocessHtml）
4. M4 起票（G1–G7 のガイド改訂、本 plan §4 を入力に別 plan 文書化）

### 10.4 参照履歴

| 文書 | 役割 |
|------|------|
| `.takt/runs/20260416-085247-en-ja-phase1-4-pr-286-291-d/reports/integrated-report.md` | 前回 run の最終 §6.3 M1 列挙の出典 |
| `.takt/runs/20260416-085247-en-ja-phase1-4-pr-286-291-d/reports/architect-review.md` 等 | 各 finding_id の一次根拠 |
| `.takt/runs/20260416-100807-resume-20260416-085247-en-ja-p/reports/architect-review.md` 等 | 本 run iter 1 の persists 確認（5/8/7） |
| `docs/superpowers/plans/2026-04-15-parity-bulk-remediation.md` §10 | M2/M3 に渡す entry criteria |
| `docs/superpowers/plans/2026-04-14-parity-phase4-schema-cleanup.md` Rev 7 | M3（PR Z）の最終 DoD |
| `recall-report.json:129` | T16 で根拠を追記する fixture 変更箇所 |

## 11. Open Questions

| # | 項目 | 解消候補ステップ |
|---|------|------------------|
| Q1 | snapshot 288 vs 284 の数値整合性（filesystem / runtime / ユーザー意図） | **Rev 2 で解決: filesystem 実測 = 288（`find snapshots/en/content -name '*.html' \| wc -l` = 288、main / PR #291 head 両方で一致）**。"284" は過去 runtime 報告の stale 値。canonical 値を §6.2 D12 に pin。M2 `check_snapshots.mjs` 側は continuation として追跡 |
| Q2 | ベースライン 1731 vs 1297 の stale report（issue #284 body） | **Rev 2 で解決: main baseline = 1297 / 188 slugs、PR #291 head baseline = 345 / 103 slugs（PR stack による burn-down 結果）、"1731 件 / 219 ファイル" は issue #284 body の stale snapshot**。canonical 値を §6.2 D5/D12 に pin。issue #284 body は M1 完了後に再生成（M2 の continuation） |
| Q3 | PR #286–#291 追加 GLOSSARY term の false-negative リスク定量化 | T4 の regression test 追加時に sampling |
| Q4 | INVARIANT `common-it-loanword` / `technical-concept-term` の regex 適正化 | T19 で分割 / G2 で運用ルール明文化 |
| Q5 | `custom-code-1.md` / `custom-code.md` の関係（source-first 整合） | T20 で EN 原文と突合 |
| Q6 | `test-management/shared-configuration.md` の test pin 復帰タイミング | T12 の合成 fixture 化で消滅 |
| Q7 | Stage B7 起票状況 | M2 で起票 |
| Q8 | plan ファイル名（本 plan 採用名で良いか） | 本 plan 起票時点で `2026-04-16-pr-286-291-stack-remediation.md` を採用、ユーザー異議があれば改名 |
| Q9 | 本 run 内で PR #291 head へ追加 commit を積むか、別 run に委譲するか | §10.1 の即時アクションで判断 |

## 12. Non-goals

- PR Z 自体の implementation（M3 / Phase 4 plan 所掌）
- ガイド本文の改訂（M4 / G1–G7 の別 plan 所掌）
- 翻訳品質の general review（別 audit task）
- mechanism 層の追加変更（M2 / Phase 4 PR A 後継 PR 所掌）
- Phase 5（定常運用 check gate 追加）の設計（PR Z merge 後の別 plan）
- upstream（Tricentis MadCap）への修正要請の文面作成（M5 / 別トラック）

## 13. Execution log (2026-04-16)

本 run で case B (7 commit) を PR #291 head へ積んだ記録。branch: `pr291-remediation` → push 時 `claude/phase4-round5-glossary` へ reconcile。

| commit | 含む | baseline delta | test state |
|--------|------|---------------|-----------|
| 0 (governance) | T0 policy stubs + PR template + plan Rev 2.1 取り込み | — | pre-run: 1900 tests pass |
| 1a (INVARIANT restore) | T1 + T2 + T3 | 345→340 entries / 103→100 slugs | full test gate: 1900 pass |
| 1b (GLOSSARY compound) | T4 + T19 | 未再生成（最終 regen で吸収） | 41 parity_glossary_mask tests pass |
| 2 (find_untranslated) | T5 + T6 + T7 + T8 + T10 + T17 | — | 13 new find_untranslated tests pass |
| 3 (docs) | T9 | — | N/A |
| 4 (test contract) | T11 + T12 + T13 + T14 + T15 | — | 21 representative summary + 12 align_runtime tests pass |
| 5 (self-check) | T16 + T18 + T20 + T21 + T22 | 最終 regen 予定 | plan self-check 4 項目 pass |

### T16 audit trail (recall-report.json:129 maxBaselineDiffsPerPage 32→5)

本 PR #291 head には `recall-report.json` が存在しない（PR #287 固有成果物）。根拠記録は本 plan §13 で言及し、PR #287 body 編集は別 PR-body-only 作業に委譲（M2 起票時の checkpoint）。

### T20 audit trail (custom-code-1.md / custom-code.md)

実パス: `src/content/docs/advanced-editing/validations/custom-code.md` と `custom-code-1.md`。EN 原文 snapshot は両方存在（`snapshots/en/content/advanced-editing/validations/custom-code.html` / `custom-code-1.html`）。

`npm run check:parity -- --slug=advanced-editing/validations/custom-code` → active 0 / baseline 1 件 (segment-untranslated) で gate pass。
`npm run check:parity -- --slug=advanced-editing/validations/custom-code-1` → active 0 / baseline 0 件 で clean green。

結論: 両ページは source-first 整合（各々 EN 原文に対応）。同時編集は正当化され、PR #288 revert は不要。

### T21 audit trail (check_glossary_duplicates.mjs 現況)

`npm run lint:glossary` 初回実行で **589 duplicate group** 検出。compound general 削除 (T4) と section 分離 (T18/M4) の前段として lint gate を先行導入。実際の重複 merge は M4 G5 のスコープ（本 M1 では npm script alias 提供のみ）。

