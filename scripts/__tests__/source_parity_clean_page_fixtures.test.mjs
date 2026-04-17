/**
 * Confirmed zero-drift ページの false-positive sentinel。
 *
 * 対象ページ (plan 作成時に実測で確定):
 *   - settings/cli-prerequisites
 *     (enSegments=10, jaSegments=10, structureIssues=0, totalIssues=0)
 *   - salesforce-testing/salesforce-testing-getting-started
 *     (enSegments=79, jaSegments=79, structureIssues=0, totalIssues=0)
 *
 * 両ページとも EN/JA が完全整合している clean page で、
 * parity-baseline.json / parity-acknowledgements.json のどちらにも
 * エントリが無い。comparator が正しく動いている限り、structure issue は
 * 0 件かつ segment-* diff も 0 件のはず。
 *
 * pin する契約:
 *   1. section-structure-mismatch / segment-order-mismatch が 0 件
 *      (false positive の主たるガード)
 *   2. 総 issue 数も 0 件 (clean page なので drift が無い — より強い不変条件)
 *   3. alignment が inconclusive にならない (健全ページで解析不能になる
 *      のは regress のサイン)
 *
 * 当初検討された `advanced-editing/custom-action-step-mobile` と
 * `results/test-runs` は両方とも実測で structure issue が 0 件ではない
 * ため本 fixture からは除外。前者は Task 3 (representative summary) で
 * 「baseline 吸収済み structure mismatch ページ」として扱う。
 */
import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

let alignSegments;
let parityDiffsToIssues;
let extractSegmentsFromHtml;
let extractSegmentsFromMarkdown;
let createOmissionCoverage;

before(async () => {
  ({
    alignSegments,
    parityDiffsToIssues,
    extractSegmentsFromHtml,
    extractSegmentsFromMarkdown,
  } = await import('../lib/source_parity.mjs'));
  ({ createOmissionCoverage } = await import('../lib/ja_omission_policy_registry.mjs'));
});

const ROOT = join(import.meta.dirname, '../../');
const SNAPSHOTS_DIR = join(ROOT, 'snapshots/en/content');
const JA_CONTENT_DIR = join(ROOT, 'src/content/docs');

// ---------------------------------------------------------------------------
// ヘルパ: JA md の frontmatter を除去し本文だけを返す。
// ---------------------------------------------------------------------------
function extractJaBody(mdContent) {
  const withoutFm = mdContent.replace(/^---[\s\S]*?---\n/m, '');
  return withoutFm.trim();
}

// ---------------------------------------------------------------------------
// ヘルパ: Task 1 と同じ shape を返す。alignment を含めていないと
// `const { alignment } = runStructureComparator(slug)` で TypeError になる。
// ---------------------------------------------------------------------------
function runStructureComparator(slug) {
  const rawEnHtml = readFileSync(join(SNAPSHOTS_DIR, `${slug}.html`), 'utf8');
  const jaMd = readFileSync(join(JA_CONTENT_DIR, `${slug}.md`), 'utf8');
  const jaBody = extractJaBody(jaMd);
  const enSegments = extractSegmentsFromHtml(rawEnHtml);
  const jaSegments = extractSegmentsFromMarkdown(jaBody);
  // §5.3.3: `overview/testim-overview` のような JA-side intentional-omission
  // policy 対象 slug は registry による runtime 抑止後に 0 drift になる。
  // unregistered slug では consume() が常に false を返す no-op になるため、
  // clean sentinel 全体に omissionCoverage を渡しても副作用は無い。
  const omissionCoverage = createOmissionCoverage();
  const alignment = alignSegments(enSegments, jaSegments, { slug, omissionCoverage });
  const issues = parityDiffsToIssues(alignment.diffs);
  const structureIssues = issues.filter(
    (i) => i.type === 'section-structure-mismatch' || i.type === 'segment-order-mismatch',
  );
  return { alignment, issues, structureIssues, omissionCoverage };
}

// ---------------------------------------------------------------------------
// plan 作成時に実測で zero-drift を確定した 2 ページ + Phase H.1 で追加した
// structure variety 別の clean sentinel。配列の順序と要素は Phase H.1 の
// 実測 (`npm run check:parity` 下で 0 diffs を確認) で固定してある。
// ---------------------------------------------------------------------------
const CLEAN_PAGE_SLUGS = Object.freeze([
  'settings/cli-prerequisites',
  'salesforce-testing/salesforce-testing-getting-started',
  // Phase H.1 追加 (structure variety 別) — 全て実測で zero-drift 確認済み
  //
  // callout-heavy: callout-body が 4 件ある中サイズページ。:::note / :::warning
  //   を含む JA→EN の structure 追従がこのページで pin される。
  'test-management/shared-steps-library/managing-shared-steps-and-folders',
  // callout-heavy: callout-body が 3 件の長文ページ。mobile-apps セクションの
  //   代表 zero-drift sentinel。
  'mobile-apps/mobile-apps',
  // M2 P2-1 pilot 追加 — flat ol 分割 (source-first mechanical exception
  //   per plan §5.2) + classifier URL-before-mask fix の regression pin。
  //   EN の single <ol> with <li value="1"..value="15"> + img/note sibling
  //   構造を JA が複数 ol + ol 外部 block sibling + 番号手動指定で追従して
  //   zero-drift になる pattern。Tier A bulk で同 pattern の slug が増える
  //   前に sentinel として固定する (testing gate Sev 6)。
  'advanced-editing/deep-link-mobile',
  // M2 P2-2 Wave 1 追加 — arrow-fusion pattern (plan §5.2 #2 / Wave 2 briefing
  //   pattern 1) の高密度 slug。EN `<p>Context. →<strong>To X:</strong></p>`
  //   の single paragraph に対し JA が context paragraph と `**Xするには:**`
  //   paragraph を分離していた drift を `→ **Xするには:**` soft-break で
  //   融合して zero-drift 化。6 section に同 pattern が集中しており、Wave 2
  //   以降の同 pattern slug 展開前の regression pin として固定。
  'salesforce-testing/salesforce-steps/sfdc-document-validation',
  // M2 P2-2 Wave 1 追加 — HTML `<table>` 内 table-cell drift を content-level
  //   で解消した sentinel。EN `<td>` が `<br />` + nested `<p>` で複数行を
  //   包む構造に対し、JA が ` / ` セパレータを挿入していた pattern (4 件) と、
  //   EN 英語の shortcut 分類語を JA が untranslated のまま残していた pattern
  //   (2 件) を、JA 側の `<br />` 採用 + 分類語翻訳で 0 drift にした。HTML
  //   table block の extractHtmlTableCells 経路を pin する regression fixture。
  'advanced-editing/keyboard-shortcut-step',
  // M2 P2-2 Wave 1 追加 — interleaved ol/ul + orphan <p> pattern の sentinel。
  //   EN の MadCap 出力で `<ol>` / `<ul>` の間に `<p>` 段落が interleave
  //   される broken-ish structure (例: property list の `<p>Description</p>`
  //   が `<ul>` の兄弟として並ぶ) を JA が <ol>/<ul> 内に nest させていた
  //   drift を、EN 構造に忠実に content-level で分割 (12 section) して
  //   zero-drift 化。arrow-fusion 2 section と併せて 14 entry を消化。
  //   `<ol>` flat split は §5.2 #1 既存 exception と同質だが、`<ul>` と
  //   orphan `<p>` の interleave までをカバーする extension として sentinel
  //   登録 (新 mechanical exception ではなく content-level mirroring の範囲)。
  'editing-tests/generating-a-random-value',
  // M2 P2-2 Wave 2 追加 — arrow-fusion pattern P1 の 4-section 集中型 sentinel。
  //   Wave 2 briefing pattern 1 の pure P1 (`<br />` なし) のみで成立する
  //   slug で、EN `<p>Context. → <strong>To X:</strong></p>` 単一段落を
  //   JA が context 段落 + `**Xするには:**` 段落に分離していた drift を
  //   `。\n→ **Xするには:**` soft-break 融合で 4 section × 2 entry = 8 entry
  //   を消化。同 pattern の regression を Tier A bulk 以降で広く検知するため
  //   pin する (mobile variant `editing-target-element-properties-mobile`
  //   は元々 0-drift のため追加不要)。
  'editing-tests/editing-your-tests/editing-target-element-properties',
  // M2 P2-2 Wave 2 追加 — 複合 sentinel (flat-ol-split §5.2 #1 + callout-bullet-to-paragraph
  //   + callout-to-blockquote)。Setting up TTM for Jira Integration セクションで EN の
  //   `<ol>` に orphan `<p>modules.</p>` が挟まる flat-ol-split pattern、Bulk Create
  //   セクションで EN callout 内 single `<p>` を JA が bullet split していた drift、
  //   Upon Testim test run execution end セクションで EN `<blockquote>` (paragraph kind に
  //   展開) に JA `:::warning` が合致しないため `> ` blockquote に置換。9 entry を
  //   content-level で一括解消、新 mechanical exception ではなく既存 §5.2 #1 + source-
  //   first callout 修正の組み合わせ。
  'integrations/test-management-integrations/ttm-for-jira-integration',
  // M2 P2-2 Wave 4 追加 — sibling `ttm-for-jira-integration` (Wave 2) と同じ
  //   複合 pattern (flat-ol-split §5.2 #1 + callout-to-blockquote) の sentinel。
  //   Setting up Xray integration セクションで EN `<ol>` 内 `<li value="1">` が
  //   `various integration<br />` + orphan `<p>modules.</p>` に分岐する
  //   MadCap broken-`<br />` artifact を、JA 側で ol item 1 の末尾を
  //   「様々な統合」で止めて空行 + orphan paragraph「モジュールがあります。」
  //   を挟み、`2.` で ol を継続する形に分割して mirror (sibling
  //   ttm-for-jira と同じ handling)。Running a test セクションで EN
  //   `<blockquote><p>Changing these statuses...</p></blockquote>` (warning-like
  //   lead word が無く allow list 非対象なので paragraph kind に展開される) に
  //   JA `:::warning` callout-body が合致しない drift を `> ...` blockquote に
  //   置換して kind 一致させた。5 entry (section-structure-mismatch ×2,
  //   segment-missing ×2, segment-extra ×1) → 0 を content-level で解消、
  //   新 mechanical exception / carve-out なし。
  'integrations/test-management-integrations/xray-integration',
  // M2 P2-2 Wave 2 追加 — 初の純 content-level segment-untranslated sentinel。
  //   arrow-fusion / ol-split / table 等の構造 pattern は不使用、generic-
  //   English-residue (browser version, shared/dedicated device, hover,
  //   geolocation, site-to-site, executive 等) のみが drift 原因だった
  //   slug。Testim UI / vendor name (Grid, Editor, VPN, IP, CLI, SauceLabs,
  //   BrowserStack 等) は英語維持、generic 語のみ JA 化で 7 entry を解消。
  //   後続の Tier A bulk で同 pattern の slug が多発する前の regression pin。
  'integrations/grid-management',
  // M2 P2-2 Wave 2 追加 — ASCII-only UI-term punctuation mirror + EN token URL
  //   verbatim mirror の複合 sentinel。EN `<li>Username.</li>` / `<li>Access key.</li>`
  //   / `<li>Project token.</li>` の trailing `.` を JA が欠落していた drift を
  //   復元 (scoreSegmentMatch の same-language penalty が ASCII-only term で
  //   score 0 に落ちる挙動を回避)。また EN `https://www.testmuai.com/...`
  //   (MadCap redirect domain, curl で 200 OK verified) を JA が canonical
  //   `lambdatest.com` に置換していた drift を verbatim mirror に restore
  //   (tokensInvariant 合致)。8 entry 解消、新 mechanical exception なし、
  //   content-level source-first mirror のみ。
  'integrations/visual-validation/lambdatest_integration',
  // M2 P2-2 Wave 2 追加 — §5.3.2 `/docs/index` artifact registry extension +
  //   EN broken-table-row paragraph mirror + JA navigation link removal の複合
  //   sentinel。EN MadCap Flare の `<table>` 外 orphan `<p>|...|High|</p>` を
  //   JA も backslash-escaped paragraph (`\| ... \| 高 \|`) で mirror し、EN
  //   `<a href="index.htm[/#/]">` self-link artifact を JA link 除去で mirror
  //   (tokensInvariant の `/docs/index` disjoint を解消)。7 entry を content-
  //   level で解消 + 2 entry を §5.3.2 runtime suppress (PR #304 registry 拡張
  //   で有効化、PARITY_GUIDE marker protocol 参照)。
  'salesforce-testing/create-a-salesforce-test/use-agentic-test-automation-for-salesforce',
  // M2 P2-2 Wave 3 追加 — CALLOUT_NORMALIZATION_SLUGS allow list 非対象 slug で
  //   EN `<blockquote>` が paragraph kind に展開される pattern の sentinel。JA
  //   `:::danger` callout-body と EN paragraph の kind-level mismatch を、JA を
  //   plain markdown `> ...` blockquote に戻して mirror (allow list に追加する
  //   のではなく JA 側を EN の paragraph 取り扱いに追従させる方針)。併せて
  //   (1) JA-only stray `<br />` paragraph の削除 (EN extractor は `<br />` を
  //   segment emit しない事実への追従)、(2) EN `<span class="FileOrFilePath">module.exports=</span>`
  //   の dotRe token (`module.exports`) と JA backtick token (`module.exports=`)
  //   の mismatch を解消するため JA を `` `module.exports`= `` と分割して backtick
  //   範囲を調整。FileOrFilePath span に trailing 記号 (`=`) が張り付く token
  //   整合 pattern は Wave 2 未出で、本 sentinel で pin する。6 entry
  //   (section-structure-mismatch ×1, segment-missing ×2, segment-extra ×3) → 0。
  'administration/secrets',
  // M2 P2-2 Wave 3 追加 — `<!-- -->` sibling-break + EN URL path mirror + Excel
  //   glossary 登録の複合 sentinel。EN は `<p>intro</p>` の後に single-`<li>` を
  //   持つ `<ul>` が 2 連続する構造で、同種 segment が collapse されて
  //   `paragraph → unordered-list` の 2 block に畳まれる。JA は list 間の
  //   `<!-- -->` HTML comment が `paragraph` segment として emit されて
  //   `paragraph → ul → paragraph → ul` に崩れていた section-structure-mismatch
  //   を、コメント行を削除して block 列を EN に追従させた (collapse 仕様は
  //   `source_parity_structure.mjs` `collapseBodyToBlocks`)。併せて JA が EN の
  //   `../data-driven-testing/index.htm#section-...` (anchor は EN 側でも heading
  //   に解決しない MadCap artifact) を smart-resolve で別 sub-page URL に差し
  //   替えていた drift を、`extractInvariantTokens` が fragment を落として
  //   `/docs/advanced-editing/data-driven-testing` に正規化する挙動に合わせて
  //   JA も同 path-only URL に restore し tokensInvariant disjoint を解消
  //   (broken anchor を verbatim mirror すると `lint_docs` が
  //   `link-fragment-missing` を warn するため anchor は削除、path だけを mirror)。
  //   さらに Microsoft Excel (19 ファイル使用) が GLOSSARY 未登録で
  //   `segment-untranslated` を誘発していたため、Tier A 外部製品 section に
  //   `Excel` を追加して mask 対象化。6 entry を content-level + glossary 登録
  //   で解消、新 mechanical exception なし。
  'advanced-editing/parameters/passing-parameters-from-excel-file',
  // M2 P2-2 Wave 3 追加 — broken-table-row paragraph mirror (inline-code 版) +
  //   classifier a./b./c. 回避 pattern の複合 sentinel。EN PDF テーブル外
  //   orphan `<p>| expectedText | JavaScript | 'A Simple PDF File' |</p>`
  //   (table tbody 内にあるべき 3 行目が `</tbody>` 外に漏れた MadCap 出力)
  //   を、JA は inline-code `` `| ... |` `` で mirror する。salesforce Wave 2
  //   の `\|` backslash escape は JA 側の CJK 混在前提だったが、本 slug では
  //   変数名のみで CJK を含められないため same-language penalty を避ける
  //   代わりに inline-code で textNorm 一致 (SCORE_TEXTNORM_MATCH=500) を
  //   成立させる新派生 pattern (既存 broken-table-row と同じ mechanism pattern
  //   の変種)。さらに Adding section で EN の a./b./c. 付き sub-step 段落
  //   (`a. In the Properties panel... b. JS parameter... c. Package parameter...`)
  //   を JA が `a./b./c.` prefix 付きで訳すと classifier (RESIDUE_MIN_WORDS=3)
  //   が 3 個の isolated English letter を residue として検知し segment-
  //   untranslated が false-positive 発火する既知制約を、EN enumeration marker
  //   を削除して mirror する content-level 回避で解消 (EN 側の a./b./c. は
  //   meta-enumeration で Testim UI term ではなく、段落 segment kind は保持
  //   される — 構造 mismatch は起こらない)。6 entry を content-level で解消。
  //   sibling `validate-element-text` (6 entry) も同じ a./b./c. classifier
  //   pattern を共有する可能性があり Wave 4 で再利用予定。
  'advanced-editing/validations/validate-download',
  // M2 P2-2 Wave 3 Batch 2 追加 — flat-ol-split §5.2 #1 の EN `<ol>` 内
  //   orphan paragraph variant の sentinel。EN MadCap 出力で単一 `<ol>` の
  //   内部に `<li value="1">` (item A) + orphan `<p>​2. ...</p>` + orphan
  //   `<p>​3. ...</p>` + `<li value="2">..<li value="11">` が interleave し、
  //   EN extractor は orphan `<p>` を `paragraph` segment、`<li>` を
  //   `ordered-list-item` segment として分離 emit するため、structure
  //   comparator は EN を `ol → p → p → ol → p → ol → p → ol → p` と解釈
  //   する。JA は当初 orphan paragraphs も `<li>` として render していた
  //   ため JA 側が `ol → p → ol → p → ol` となり kind-multiset が不一致。
  //   修正方針: JA の該当 2 項目を ZWSP (`\u200b`) prefix 付き "2. ..."
  //   / "3. ..." 段落に変換し、後続 ol を EN の `<li value="N">` (2〜11)
  //   に揃えて renumber、さらに EN 末尾の `<p>​ ​<br /> ​</p>` 空段落を
  //   JA でも単独 `\u200b` 行として mirror。ZWSP prefix はブラウザ表示
  //   上は不可視だが、markdown parser (`2.` prefix の自動 ol 認識) を
  //   回避し、`extractSegmentsFromMarkdown` でも textNorm が
  //   `"2. 新しいビルドを作成します"` になるため EN の
  //   `textNorm="2. create a new build"` と scoreSegmentMatch が成立する
  //   (CJK 混在 + 数字 prefix 一致で same-language penalty を回避)。
  //   deep-link-mobile §5.2 #1 と同じ mechanical exception pattern の拡張
  //   であり、新 carve-out 不要。6 entry (section-structure-mismatch ×1,
  //   segment-missing ×3, segment-extra ×2) → 0。
  'integrations/integrate-testim-to-your-ci/vsts-and-tfs-integration',
  // M2 P2-2 Wave 3 Batch 2 追加 — sibling (#308 validate-download) の 2 pattern
  //   を再検証した結果、本 slug では EN 側に a./b./c. enumeration も broken-
  //   table-row paragraph も実在せず、代わりに MadCap 出力の orphan
  //   `<p>&lt;/Image&gt;</p>` artifact paragraph (3 箇所のうち 2 箇所は
  //   stand-alone paragraph、残り 1 箇所は次段落と結合) が Parameter only
  //   section の block structure を EN=14 / JA=12 に崩していた
  //   (section-structure-mismatch + segment-missing×2 paragraph)。JA は
  //   `</Image>` を emit していなかったため、sibling の broken-table-row と
  //   同じ inline-code mirror 技法 (`` `</Image>` ``) を適用して
  //   SCORE_TEXTNORM_MATCH=500 で一致させる (素の `</Image>` だと Astro /
  //   MDX 系 parser が component 扱いして build warning を出し得るため
  //   inline-code で safe escape するのが sibling と同じ戦略)。併せて JA が
  //   EN の `../data-driven-testing/index.htm#section-...` anchor を smart-
  //   resolve で別 sub-page URL に展開していた 2 箇所を、`extractInvariant
  //   Tokens` が fragment を落として `/docs/advanced-editing/data-driven-
  //   testing` に正規化する挙動に合わせて path-only URL に restore
  //   (sibling `passing-parameters-from-excel-file` と同じ invariant token
  //   disjoint 解消 pattern)。6 entry を content-level で解消、新 mechanical
  //   exception なし。#308 の sibling hint は 2 pattern のうち a./b./c. は
  //   non-applicable だったが、broken-table-row の inline-code mirror 技法
  //   自体は同じ mechanism (textNorm 一致で SCORE_TEXTNORM_MATCH を稼ぐ) で
  //   `</Image>` MadCap artifact にも転用できた。
  'advanced-editing/validations/validate-element-text',
  // M2 P2-2 Wave 3 Batch 2 追加 — segment-token-gap (bold wrapping) +
  //   classifier residue word-count (>=3) pattern の複合 sentinel。
  //   (1) EN `<p>...: <strong>--sauce-options ...</strong></p>` の bold 内
  //   CLI flag を JA も bold 維持したまま、flagRe `(?:^|\s)(--?[a-zA-Z]...)`
  //   の `(?:^|\s)` 前提を満たすよう `**` と `--` の間に inline code fence
  //   ``**`--sauce-options`** `` を挟んで token 抽出を復活させる (同 pattern
  //   を SauceLabs/Browserstack web セクションの `--sauce-options` /
  //   `--browserstack-options` へも適用)。bold は WRITING_GUIDE の Testim UI
  //   見出し強調として EN と mirror される必要があり、inline code で飾り直す
  //   のは source-first を維持したままの書式調整。
  //   (2) JA heading `## capability の override rule (mobile)` と EN `<h2>
  //   Override rules for a capability (mobile)</h2>` の見出し文字列を mirror
  //   (`## Override rules for a capability (mobile)`)。同様に JA
  //   `## BrowserStack` を EN `<h2>Browserstack</h2>` に mirror。callout /
  //   uli を EN section index と同位置に置くため見出し文字列を揃える。
  //   (3) `classifier RESIDUE_MIN_WORDS=3` 制約により、JA prose に残る
  //   standalone camelCase 識別子 (`platformVersion`, `osVersion`,
  //   `capabilities`) と汎用語 (`build`, `project`, `capabilities`) が
  //   同一 segment 内で 3 個以上残ると segment-untranslated が誤発火する。
  //   本 slug では (a) Override rules callout-body で `platformVersion` ×2
  //   + `osVersion` ×1 が 3 語 fail を誘発 → GLOSSARY Tier C に
  //   W3C/Appium spec 識別子として `platformVersion` / `osVersion` を登録
  //   して mask 対象化 (chore(glossary) as per hint)、(b) preface uli と
  //   Browserstack uli でそれぞれ `build`/`project` と `capabilities` ×2
  //   が 3 語に達していた箇所を、inline-code fence + `と` 日本語接続 /
  //   `capabilities` の一つを削って 2 語に減らす content-level 回避で解消。
  //   6 entry (segment-token-gap ×3, segment-untranslated ×3) → 0。新
  //   mechanical exception / §5.3.N carve-out なし、§5.4 許容範囲内の
  //   Tier C 追加 2 件のみ。Wave 2 sibling `integrations/grid-management`
  //   (generic-English-residue pattern 8) の同一 folder 派生 sentinel。
  'integrations/grid-management/saucelabs-browserstack-options',
  // M2 Wave 3 Tier 2 追加 — §5.3.3 `ja_omission_policy_registry` (PR #318) の
  //   runtime 抑止に依存する初の sentinel。
  //   (a) Tricentis policy omission scenario: `docs/WRITING_GUIDE.md
  //   §「原文から意図的に除外するコンテンツ」` で規定された Tricentis 削除
  //   依頼ポリシー (commits `bf40dad`, `e5d9f88`) により、EN 原文に存在する
  //   "At Testim, we are developers and testers too..." 段落 (`http://testim.io`
  //   リンク含む) と pricing callout (`https://www.testim.io/pricing/`) を
  //   JA 側で意図的に除外している。この JA-side intentional-omission は content
  //   修正 (段落/callout 再追加) で drift を消すと legal/policy 違反となるため
  //   runtime 抑止以外の経路が無く、§5.3.3 registry が唯一の解決策。
  //   (b) §5.3.3 registry 4 entry が 5 drift を抑止:
  //     - `tricentis-pricing-changelog-callout-removal` (quota=2) →
  //       segment-missing callout-body ×2
  //     - `tricentis-changelog-callout-offset-remnant` (quota=1) →
  //       segment-extra callout-body ×1
  //     - `tricentis-testim-io-url-removal` (quota=1) →
  //       segment-token-gap paragraph `http://testim.io` ×1
  //     - `tricentis-callout-removal-structure-derivative` (quota=1) →
  //       section-structure-mismatch ×1
  //   いずれも `slugs: ['overview/testim-overview']` の per-slug scope で
  //   quota 計 5 (全ページ cap)。
  //   (c) 5→0 baseline delta: 既存 baseline (generate 時刻
  //   2026-04-17T05:33:56.126Z) は本 slug 5 entry (structure ×1, missing ×2,
  //   extra ×1, token-gap ×1) を保持していたが、§5.3.3 merge (PR #318) 後は
  //   alignSegments が registry と照合して 5 entry 全てを drop するため、本
  //   PR で `node scripts/generate_parity_baseline.mjs --slug=overview/testim-overview`
  //   を実行し baseline から 5 entry を除去 (rationale: "M2 Wave 3 Tier 2 —
  //   testim-overview baseline cleanup post §5.3.3 mechanism merge (5 entries
  //   policy-suppressed)")。他 slug は byte-identical。
  //   (d) Regression gate: 本 sentinel は `runStructureComparator` に
  //   `createOmissionCoverage()` を渡すため、registry が消滅 (または quota が
  //   減る) と `overview/testim-overview` の drift が再発して `issues.length === 0`
  //   で fail する。逆に言えば registry 抑止が正しく機能している限りは clean
  //   sentinel の invariant (structureIssues=0, issues=0, not inconclusive) を
  //   維持できる。§5.3.3 regression を検知する唯一の clean-page gate。
  //   (`ja_omission_policy_registry.test.mjs` は registry 単体契約を pin するが
  //   本 sentinel は EN snapshot + JA content の end-to-end 経路を pin する。)
  'overview/testim-overview',
  // M2 P2-2 Wave 3 Batch 2 追加 — §5.3.2 `/docs/index` registry slug-scope
  //   extension (PR #317 で承認 merge 済み) + URL token restore + GLOSSARY
  //   `?`-less alias 追加 + JA nav link 除去 の複合 sentinel。EN の preface
  //   冒頭段落が `<a href="index.htm#selecting-a-branch">Selecting a Branch</a>`
  //   (MadCap self-link artifact で `/docs/index` token 化) を持つ一方で JA が
  //   `/docs/testops/insights#ブランチの選択` (無効 anchor) にリンクしていた
  //   ため tokensInvariant disjoint で hard non-match (score=0) になり segment-
  //   missing + segment-extra pair が発生していた drift を、JA 側のリンクを
  //   除去して plain text mention に戻し、§5.3.2 registry に `testops/insights/reports`
  //   を追加 (PR #317 で main に merge 済み) して `/docs/index` token の
  //   token-gap を runtime suppress することで解消 (Wave 2 `use-agentic-
  //   test-automation-for-salesforce` と同 pattern)。また Testim's Activity
  //   セクションで JA が `https://help.testim.io/docs/smart-locators`
  //   (legacy host、redirect 先と URL path 不一致) にリンクしていた drift を、
  //   EN の `../../salesforce-testing/core-concepts.htm#smart-locators` が
  //   `normalizeUrlToken` で `/docs/salesforce-testing/core-concepts` token 化
  //   される点に合わせて JA link 先を `/docs/salesforce-testing/core-concepts`
  //   に restore し token 一致させた (arrow-fusion / verbatim mirror)。
  //   さらに preface 4 項目 list の `**Where Can You Improve?**` が glossary
  //   登録済み (`?` 付き) にもかかわらず `\bWhere Can You Improve\?\b` の
  //   trailing `\b` が後続 `**` (non-word) と penalty 0 を生み mask が当たら
  //   ない既知制約 (classifier RESIDUE_MIN_WORDS=3 発火) を、GLOSSARY に
  //   `?` 抜き alias `Where Can You Improve` を追加して `\bWhere Can You
  //   Improve\b` が `e` (word) → `?` (non-word) で成立する形で mask を張り
  //   解消。5 entry (segment-missing ×2, segment-extra ×2, segment-
  //   untranslated ×1) を content-level fixes + 既存 mechanism (§5.3.2
  //   registry) slug-scope extension で 0 化。
  'testops/insights/reports',
]);

for (const slug of CLEAN_PAGE_SLUGS) {
  describe(`source_parity_clean_page_fixtures: ${slug}`, () => {
    it('alignment が inconclusive にならない (健全 page の最低保証)', () => {
      const { alignment } = runStructureComparator(slug);
      assert.equal(
        alignment.inconclusive ?? false,
        false,
        `${slug}: alignment.inconclusive === true になった`,
      );
    });

    it('section-structure-mismatch / segment-order-mismatch が 0 件 (false positive sentinel)', () => {
      const { structureIssues } = runStructureComparator(slug);
      assert.equal(
        structureIssues.length,
        0,
        `${slug}: structure issue が ${structureIssues.length} 件検出された — ` +
          `plan 前提 (zero-drift clean page) が崩れている。` +
          `最初の issue: ${JSON.stringify(structureIssues[0] ?? null)}`,
      );
    });

    it('総 issue 数も 0 件 (clean page の強い不変条件)', () => {
      const { issues } = runStructureComparator(slug);
      assert.equal(
        issues.length,
        0,
        `${slug}: 総 issue 数が ${issues.length} 件 — ` +
          `plan 前提では EN/JA が完全整合しており 0 件のはず。` +
          `最初の issue: ${JSON.stringify(issues[0] ?? null)}`,
      );
    });
  });
}
