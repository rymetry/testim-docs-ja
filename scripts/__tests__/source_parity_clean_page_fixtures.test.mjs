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

before(async () => {
  ({
    alignSegments,
    parityDiffsToIssues,
    extractSegmentsFromHtml,
    extractSegmentsFromMarkdown,
  } = await import('../lib/source_parity.mjs'));
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
  const alignment = alignSegments(enSegments, jaSegments, { slug });
  const issues = parityDiffsToIssues(alignment.diffs);
  const structureIssues = issues.filter(
    (i) => i.type === 'section-structure-mismatch' || i.type === 'segment-order-mismatch',
  );
  return { alignment, issues, structureIssues };
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
