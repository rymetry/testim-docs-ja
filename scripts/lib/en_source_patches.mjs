// scripts/lib/en_source_patches.mjs
/**
 * EN source-boundary patches (HTML-level) + runtime coverage aggregator.
 *
 * Route W (Plan v4, 2026-04-17): broken EN snapshot fragments are repaired at
 * `preprocessEnHtml` boundary so alignSegments / turndown / extractor all see
 * a single canonical HTML. Each patch is a literal `find → replace` against
 * the pre-turndown HTML (`preprocessEnHtml` output), scoped to a slug allow-list.
 *
 * Contract:
 *   - registry は凍結された配列。entry 単位で `slugs[]`、`defectClass`、
 *     literal `find`、literal `replace`、`rationale`、`linkedDefect` を持つ。
 *     グロブ / regex は使わない (literal find + String.prototype.split/join).
 *   - `applyEnSourcePatches(html, slug, coverage)` は副作用ゼロ (引数を mutate
 *     しない、new string を返す)。coverage のみ stateful (aggregator pattern).
 *   - `createEnSourcePatchCoverage()` は run 単位で 1 個生成し、hit / mismatch
 *     を record する stateful aggregator。`NOOP_PATCH_COVERAGE` は test 用
 *     default。
 *   - `defectClass` は 4 enum のみ: `typo` | `href-miswire` | `madcap-artifact`
 *     | `stale-reference` (reviewer gate / machine-check 用)。
 *
 * Plan: docs/superpowers/plans/2026-04-17-en-source-patches-layer.md
 * Upstream tracker: docs/superpowers/specs/upstream-defect-tracker.md
 *
 * @module en_source_patches
 */

/**
 * Defect class enum。machine-checkable な 4 種のみ。
 * aesthetic な差分や JA-easing lane の再発を防ぐため、これら以外は reject。
 */
export const DEFECT_CLASSES = Object.freeze([
  'typo',
  'href-miswire',
  'madcap-artifact',
  'stale-reference',
]);

/**
 * 凍結 registry。初期 entries は UD-001 (dash-this typo, 2 variants) と
 * UD-002 (Log out href miswire) のみ。
 *
 * 各 entry の `find` は preprocessEnHtml (escaped-details 復元 + callout
 * normalize 等) を通った後の HTML を基準とする。turndown 処理前に literal
 * string replace で適用される (idempotent / order-independent).
 */
export const EN_SOURCE_PATCHES = Object.freeze([
  Object.freeze({
    id: 'UD-001A-dash-this-typo-plain',
    slugs: Object.freeze([
      'salesforce-testing/salesforce-steps/sfdc-step-create',
      'salesforce-testing/salesforce-steps/sfdc-step-validate',
    ]),
    defectClass: 'typo',
    find: '<p>Verify -this action verifies',
    replace: '<p>Verify - this action verifies',
    rationale:
      'MadCap authoring typo: missing space between "-" and "this" in ' +
      'Verify list item intro (plain-leading variant). Upstream report pending.',
    linkedDefect: 'docs/superpowers/specs/upstream-defect-tracker.md#UD-001',
    addedAt: '2026-04-17',
    reviewAfter: '2026-10-17',
  }),
  Object.freeze({
    id: 'UD-001B-dash-this-typo-strong',
    slugs: Object.freeze([
      'salesforce-testing/salesforce-steps/sfdc-step-edit',
      'salesforce-testing/salesforce-steps/sfdc-step-quickactions',
      'salesforce-testing/salesforce-steps/sfdc-step-relatedlistaction',
    ]),
    defectClass: 'typo',
    find: '</strong> -this action verifies',
    replace: '</strong> - this action verifies',
    rationale:
      'MadCap authoring typo: missing space between "-" and "this" in ' +
      'Verify list item intro (strong-leading variant). Upstream report pending.',
    linkedDefect: 'docs/superpowers/specs/upstream-defect-tracker.md#UD-001',
    addedAt: '2026-04-17',
    reviewAfter: '2026-10-17',
  }),
  Object.freeze({
    id: 'UD-002-logout-href-miswire',
    slugs: Object.freeze(['salesforce-testing/salesforce-steps']),
    defectClass: 'href-miswire',
    find: '<a href="sfdc-step-launchapp.htm">Log out</a>',
    replace: '<a href="sfdc-step-logout.htm">Log out</a>',
    rationale:
      'Upstream MadCap href miswire: Log out list entry links to launchapp.htm ' +
      'instead of logout.htm. JA content already points to correct sfdc-step-logout.',
    linkedDefect: 'docs/superpowers/specs/upstream-defect-tracker.md#UD-002',
    addedAt: '2026-04-17',
    reviewAfter: '2026-10-17',
  }),
  Object.freeze({
    id: 'UD-004A-scheduler-high-speed-mode',
    slugs: Object.freeze(['running-tests/scheduler']),
    defectClass: 'stale-reference',
    find: '<a href="https://help.testim.io/docs/high-speed-mode">Turbo mode</a>',
    replace: '<a href="../testops/turbo-mode.htm">Turbo mode</a>',
    rationale:
      'Upstream EN uses legacy help.testim.io domain + pre-rename "high-speed-mode" slug. ' +
      'Feature was renamed to turbo-mode and canonical URL moved to docs.tricentis.com/testim. ' +
      'JA content already uses modern /docs/testops/turbo-mode per WRITING_GUIDE §91-109/§192; ' +
      'normalizeUrlToken converts the patched relative .htm path to the same /docs/testops/turbo-mode token.',
    linkedDefect: 'docs/superpowers/specs/upstream-defect-tracker.md#UD-004',
    addedAt: '2026-04-18',
    reviewAfter: '2026-10-18',
  }),
  Object.freeze({
    id: 'UD-004C-scheduler-slack-integration-anchor',
    slugs: Object.freeze([
      'running-tests/scheduler',
      'running-tests/scheduler-mobile',
    ]),
    defectClass: 'stale-reference',
    find:
      '<a href="https://help.testim.io/v2.0/docs/scheduler#integrating-scheduler-with-slack">below</a>',
    replace: '<a href="scheduler.htm#integrating-scheduler-with-slack">below</a>',
    rationale:
      'Upstream EN uses legacy help.testim.io/v2.0 URL for a self-/sibling-link to the Scheduler ' +
      'page Slack integration section. JA uses a JA-local anchor (#スケジューラーを-slack-と統合する) ' +
      'per WRITING_GUIDE §192; normalizeUrlToken strips fragments from /docs/ URLs, so the patched ' +
      'scheduler.htm → resolves to /docs/running-tests/scheduler which matches JA.',
    linkedDefect: 'docs/superpowers/specs/upstream-defect-tracker.md#UD-004',
    addedAt: '2026-04-18',
    reviewAfter: '2026-10-18',
  }),
  Object.freeze({
    id: 'UD-005A-hooks-config-file-legacy-display-text',
    slugs: Object.freeze(['advanced-editing/hooks']),
    defectClass: 'stale-reference',
    find:
      '<a href="../running-tests/configuration-file-run-hooks/index.htm">https://help.testim.io/docs/configuration-file-run-hooks</a>',
    replace:
      '<a href="../running-tests/configuration-file-run-hooks/index.htm">https://help.testim.io/docs/running-tests/configuration-file-run-hooks</a>',
    rationale:
      'Upstream EN anchor display-text uses a legacy flat help.testim.io/docs/<basename> URL ' +
      '(pre-category-reorg). The href target is correct (running-tests/configuration-file-run-hooks), ' +
      'but the display-text URL emits a stale /docs/configuration-file-run-hooks invariant token that ' +
      'no longer exists in JA (JA uses canonical /docs/running-tests/configuration-file-run-hooks per ' +
      'WRITING_GUIDE §91-109). Patch aligns display-text with modern canonical path so normalizeUrlToken ' +
      'emits the same token from both sides.',
    linkedDefect: 'docs/superpowers/specs/upstream-defect-tracker.md#UD-005',
    addedAt: '2026-04-18',
    reviewAfter: '2026-10-18',
  }),
  Object.freeze({
    id: 'UD-005B-hooks-config-file-parameters-legacy-display-text',
    slugs: Object.freeze(['advanced-editing/hooks']),
    defectClass: 'stale-reference',
    find:
      '<a href="parameters/configuration-file-parameters.htm#defining-parameters-in-a-configuration-file">https://help.testim.io/docs/configuration-file-parameters#defining-parameters-in-a-configuration-file</a>',
    replace:
      '<a href="parameters/configuration-file-parameters.htm#defining-parameters-in-a-configuration-file">https://help.testim.io/docs/advanced-editing/parameters/configuration-file-parameters</a>',
    rationale:
      'Upstream EN anchor display-text uses a legacy flat help.testim.io/docs/<basename> URL ' +
      '(pre-category-reorg). The href target is correct (advanced-editing/parameters/configuration-file-parameters), ' +
      'but the display-text URL emits a stale /docs/configuration-file-parameters#... invariant token that ' +
      'no longer exists in JA. Patch aligns display-text with the modern canonical path WITHOUT the ' +
      'fragment — extractInvariantTokens strips fragments from /docs/ URLs whereas normalizeUrlForParity ' +
      '(applied to raw https://...#frag URLs) retains them, so preserving the fragment would introduce ' +
      'an asymmetric token pair. The href-derived token (already fragment-stripped during extraction) ' +
      'carries the same /docs/ path, so fragment loss is harmless for parity gating.',
    linkedDefect: 'docs/superpowers/specs/upstream-defect-tracker.md#UD-005',
    addedAt: '2026-04-18',
    reviewAfter: '2026-10-18',
  }),
  Object.freeze({
    id: 'UD-005C-parameters-loops-legacy-display-text',
    slugs: Object.freeze(['advanced-editing/parameters']),
    defectClass: 'stale-reference',
    find:
      '<a href="../loops.htm#using-the-loop-iterator-parameter">https://help.testim.io/docs/loops#using-the-loop-iterator-parameter</a>',
    replace:
      '<a href="../loops.htm#using-the-loop-iterator-parameter">https://help.testim.io/docs/advanced-editing/loops</a>',
    rationale:
      'Upstream EN anchor display-text uses a legacy flat help.testim.io/docs/<basename> URL ' +
      '(pre-category-reorg). The href target is correct (advanced-editing/loops), but the display-text ' +
      'URL emits a stale /docs/loops#using-the-loop-iterator-parameter invariant token that no longer ' +
      'exists in JA. Patch aligns display-text with modern canonical path WITHOUT the fragment (see ' +
      'UD-005B rationale for the fragment-asymmetry explanation).',
    linkedDefect: 'docs/superpowers/specs/upstream-defect-tracker.md#UD-005',
    addedAt: '2026-04-18',
    reviewAfter: '2026-10-18',
  }),
  Object.freeze({
    id: 'UD-005D-parameter-override-rules-exports-doc-prefix',
    slugs: Object.freeze(['advanced-editing/parameters/parameter-override-rules']),
    defectClass: 'stale-reference',
    find:
      '<a href="doc:https://help.testim.io/docs/exports-parameters">Exports Parameters</a>',
    replace: '<a href="exports-parameters.htm">Exports Parameters</a>',
    rationale:
      'Upstream EN anchor uses a malformed href "doc:https://help.testim.io/docs/exports-parameters" ' +
      '(stray "doc:" prefix from MadCap tooling + legacy flat help.testim.io/docs/<basename> path). ' +
      'Patch rewrites to the correct relative .htm path (exports-parameters.htm is a sibling of ' +
      'parameter-override-rules.htm in the parameters folder), which normalizeUrlToken resolves to ' +
      '/docs/advanced-editing/parameters/exports-parameters matching JA.',
    linkedDefect: 'docs/superpowers/specs/upstream-defect-tracker.md#UD-005',
    addedAt: '2026-04-18',
    reviewAfter: '2026-10-18',
  }),
  Object.freeze({
    id: 'UD-005E-parameter-override-rules-params-file-index-preface',
    slugs: Object.freeze(['advanced-editing/parameters/parameter-override-rules']),
    defectClass: 'madcap-artifact',
    find: 'and the <a href="index.htm">Params file</a>',
    replace: 'and the <a href="../parameters/index.htm">Params file</a>',
    rationale:
      'Upstream EN uses a bare "index.htm" relative self-link for the parent Parameters category ' +
      'index page. The parity extractor normalizes "index.htm" to the literal slug "index" (not ' +
      'present in docs), producing a bogus /docs/index invariant token. Patch prepends the explicit ' +
      '../parameters/ directory hop so normalizeUrlToken resolves to /docs/advanced-editing/parameters ' +
      'matching JA. Literal find is anchored with "and the" preamble to disambiguate from the identical ' +
      'href in the list item below (patched by UD-005F).',
    linkedDefect: 'docs/superpowers/specs/upstream-defect-tracker.md#UD-005',
    addedAt: '2026-04-18',
    reviewAfter: '2026-10-18',
  }),
  Object.freeze({
    id: 'UD-005F-parameter-override-rules-params-file-index-listitem',
    slugs: Object.freeze(['advanced-editing/parameters/parameter-override-rules']),
    defectClass: 'madcap-artifact',
    find: '<a href="index.htm">params-file\'s parameters</a>',
    replace: '<a href="../parameters/index.htm">params-file\'s parameters</a>',
    rationale:
      'Same defect class as UD-005E (bare "index.htm" → bogus /docs/index token) in the "Before the ' +
      'test begins:" list item. Display text "params-file\'s parameters" disambiguates the occurrence ' +
      'from the preface paragraph. After patch, normalizeUrlToken emits /docs/advanced-editing/parameters ' +
      'matching JA.',
    linkedDefect: 'docs/superpowers/specs/upstream-defect-tracker.md#UD-005',
    addedAt: '2026-04-18',
    reviewAfter: '2026-10-18',
  }),
  Object.freeze({
    id: 'UD-006-search-within-a-test-email-variable-typo',
    slugs: Object.freeze(['editing-tests/search-within-a-test']),
    defectClass: 'typo',
    find: '<p>Generate email address -variable name</p>',
    replace: '<p>Generate email address - variable name</p>',
    rationale:
      'Upstream MadCap authoring typo: missing space between "-" and "variable" in the Search ' +
      'limitations list item "Generate email address -variable name". Adjacent list items use the ' +
      'correct "- variable name" form (e.g. "Extract value - variable name" at index 0). Without the ' +
      'space, extractInvariantTokens flag regex emits a bogus "-variable" token that JA (which uses ' +
      'em-dash "— 変数名") does not have. Patch adds the missing space to match the adjacent items.',
    linkedDefect: 'docs/superpowers/specs/upstream-defect-tracker.md#UD-006',
    addedAt: '2026-04-18',
    reviewAfter: '2026-10-18',
  }),
  Object.freeze({
    id: 'UD-008-allow-chrome-microphone-cli-index-self-link',
    slugs: Object.freeze(['running-tests/the-command-line-cli/allow-chrome-browser-to-use-microphone']),
    defectClass: 'madcap-artifact',
    find: 'read here about the <a href="index.htm">CLI command</a>',
    replace:
      'read here about the <a href="../the-command-line-cli/index.htm">CLI command</a>',
    rationale:
      'Same defect class as UD-005E/F (bare "index.htm" self-link → bogus /docs/index token). ' +
      'Page links to the parent CLI category index via a bare "index.htm"; extractInvariantTokens ' +
      'resolves it to the non-existent slug "index". Patch prepends the ../the-command-line-cli/ ' +
      'directory hop so normalizeUrlToken resolves to /docs/running-tests/the-command-line-cli, ' +
      'matching JA once JA content is restored to include the CLI command link.',
    linkedDefect: 'docs/superpowers/specs/upstream-defect-tracker.md#UD-008',
    addedAt: '2026-04-18',
    reviewAfter: '2026-10-18',
  }),
  Object.freeze({
    id: 'UD-007-generate-random-data-step-this-typo',
    slugs: Object.freeze(['guides/generate-random-data-with-js']),
    defectClass: 'typo',
    find: 'to your JS step.This will create',
    replace: 'to your JS step. This will create',
    rationale:
      'Upstream MadCap authoring typo: missing space after the period in "to your JS step.This will ' +
      'create the variable...". Without the space, extractInvariantTokens dotRe regex emits a bogus ' +
      '"step.This" dotted-path token that JA (natural prose with a proper sentence break) does not ' +
      'have. Patch inserts the missing space.',
    linkedDefect: 'docs/superpowers/specs/upstream-defect-tracker.md#UD-007',
    addedAt: '2026-04-18',
    reviewAfter: '2026-10-18',
  }),
  Object.freeze({
    id: 'UD-009-grid-management-index-self-link',
    slugs: Object.freeze([
      'integrations/grid-management/browserstack-integration-1',
      'integrations/grid-management/browserstack-integration-copy',
      'integrations/grid-management/custom-grid',
      'integrations/grid-management/headspin-integration',
      'integrations/grid-management/saucelabs-integration',
    ]),
    defectClass: 'href-miswire',
    find: '<a href="index.htm#adding-a-grid">Adding a grid</a>',
    replace: '<a href="../grid-management.htm#adding-a-grid">Adding a grid</a>',
    rationale:
      'Upstream MadCap href miswire: 5 grid-management child pages link to a non-existent ' +
      '`index.htm` inside the `integrations/grid-management/` folder for the "Adding a grid" ' +
      'cross-reference. MadCap convention would expect `index.htm` to resolve to the folder\'s ' +
      'TOC page, but the actual parent topic lives at `integrations/grid-management.htm` ' +
      'one level up. normalizeUrlToken converts the broken `index.htm` → `/docs/index` token ' +
      'while JA content correctly references `/docs/integrations/grid-management#adding-a-grid` ' +
      'per WRITING_GUIDE §192, causing segment-extra + segment-missing pairs in the parity gate. ' +
      'Patched relative path `../grid-management.htm` normalizes to the same ' +
      '`/docs/integrations/grid-management` token as JA.',
    linkedDefect: 'docs/superpowers/specs/upstream-defect-tracker.md#UD-009',
    addedAt: '2026-04-18',
    reviewAfter: '2026-10-18',
  }),
  Object.freeze({
    id: 'UD-010A-codeship-broken-h2-paragraph',
    slugs: Object.freeze([
      'integrations/integrate-testim-to-your-ci/codeship-integration',
    ]),
    defectClass: 'madcap-artifact',
    find:
      '<p>\u200b## Run with external Selenium Grid<br /> When your app is deployed on a publicly ' +
      'available server, you can run your tests on an external Selenium Grid. In that case, you ' +
      "don't need the local Selenium Server (webdriver-manager), so just add these lines to the " +
      'setup commands section:</p>',
    replace:
      '<h2><a name="run-with-external-selenium-grid"></a>Run with external Selenium Grid</h2>' +
      '<p>When your app is deployed on a publicly available server, you can run your tests on ' +
      "an external Selenium Grid. In that case, you don't need the local Selenium Server " +
      '(webdriver-manager), so just add these lines to the setup commands section:</p>',
    rationale:
      'Upstream MadCap authoring artifact: the third section heading ("Run with external Selenium Grid") ' +
      'was serialized into a single <p> element whose text content begins with a zero-width space (U+200B) ' +
      'followed by a literal markdown-style "## " prefix and then fused with the following body paragraph ' +
      'via a <br /> line break, instead of the expected <h2><a name="..."></a>Heading</h2> + separate <p>. ' +
      'Adjacent sections on the same page ("Project configuration" / "Run with local Selenium Grid") use ' +
      'the correct <h2>-with-anchor shape, so the broken third heading is clearly a MadCap source-side ' +
      'serialization defect. Symptom: `extractHeadingSequence` counts EN=2 while JA has 3 H2 headings, ' +
      'surfacing as a `segment-inconclusive` [heading-count-mismatch] entry for the slug. Patch rewrites ' +
      'the broken <p> to a canonical <h2> + <p> pair matching sibling heading anchors; parity counts ' +
      'converge to 3 on both sides.',
    linkedDefect: 'docs/superpowers/specs/upstream-defect-tracker.md#UD-010',
    addedAt: '2026-04-20',
    reviewAfter: '2026-10-20',
  }),
  Object.freeze({
    id: 'UD-010B-parameters-for-groups-broken-step-paragraph',
    slugs: Object.freeze(['advanced-editing/parameters/parameters-for-groups']),
    defectClass: 'madcap-artifact',
    find:
      "<p>\u200b5. Enter a value in the field below the parameter name. If the value is a constant " +
      "string value use ' ' around it. For example, 'guest'. This value will be available in this " +
      'test only (i.e., the value will not be shared across tests.</p>',
    replace:
      "<p>Enter a value in the field below the parameter name. If the value is a constant string " +
      "value use ' ' around it. For example, 'guest'. This value will be available in this test " +
      'only (i.e., the value will not be shared across tests.</p>',
    rationale:
      'Upstream MadCap authoring artifact: step 5 of the "Adding Parameters to a Group" ordered list ' +
      'was serialized as an orphan <p> element interleaved between <li value="4"> and <li value="5"> ' +
      '(where the list item with value="5" carries different content — "Repeat steps 4-5 to add ' +
      'additional parameters"). The orphan <p> begins with a zero-width space (U+200B) followed by ' +
      'a literal "5. " step-number prefix, which turndown converts to a Markdown paragraph whose ' +
      'first line matches `extractStepCounts` "^\\d+\\.\\s" regex, inflating the EN step count from ' +
      '6 (the correct <li value> count) to 7. JA is already correctly structured as 6 numbered steps ' +
      'with the translated value-entry guidance folded into a prose paragraph between steps, so the ' +
      'symptom surfaces as a `step-count-mismatch` audit signal (EN=7, JA=6) for section #2. Patch ' +
      'strips the leading "\u200b5. " prefix so the content remains as prose (matching JA) but is no ' +
      'longer counted as a numbered step by extractStepCounts.',
    linkedDefect: 'docs/superpowers/specs/upstream-defect-tracker.md#UD-010',
    addedAt: '2026-04-20',
    reviewAfter: '2026-10-20',
  }),
  Object.freeze({
    id: 'UD-010C-vsts-broken-step-paragraph-2',
    slugs: Object.freeze([
      'integrations/integrate-testim-to-your-ci/vsts-and-tfs-integration',
    ]),
    defectClass: 'madcap-artifact',
    find: '<p>\u200b2. Create a new build</p>',
    replace: '<p>Create a new build</p>',
    rationale:
      'Upstream MadCap authoring artifact (2nd "broken step" variant in the VSTS/TFS integration ' +
      'page): an orphan <p> begins with a zero-width space (U+200B) followed by a literal "2. " ' +
      'step-number prefix. Unlike UD-010B (parameters-for-groups), this ZWSP-step <p> sits inside ' +
      'a sequence of <img> + <p> + <img> siblings between <li value="1"> ("Go to Build page") and ' +
      'the next real <li> items — the authoring intent appears to have been to present "Create a ' +
      'new build" and "Select your repository" as sub-labels under step 1, not as top-level list ' +
      'items. But turndown still maps them to Markdown paragraphs whose first line matches ' +
      '`extractStepCounts` "^\\d+\\.\\s" regex after normalizeEnArtifacts strips the ZWSP, inflating ' +
      'the EN total step count from 11 (actual <li value> count) to 13. JA mirrors the EN structure ' +
      'but normalizeNumericPeriodSpacing does not strip ZWSP, so JA counts 11. This patch strips the ' +
      'leading "\u200b2. " prefix in EN so both sides converge to 11 after normalization. JA content ' +
      'is updated in the same PR to remove the matching "​2. " prefix so segment-level comparison ' +
      'lines up (plain paragraph = plain paragraph).',
    linkedDefect: 'docs/superpowers/specs/upstream-defect-tracker.md#UD-010',
    addedAt: '2026-04-20',
    reviewAfter: '2026-10-20',
  }),
  Object.freeze({
    id: 'UD-010D-vsts-broken-step-paragraph-3',
    slugs: Object.freeze([
      'integrations/integrate-testim-to-your-ci/vsts-and-tfs-integration',
    ]),
    defectClass: 'madcap-artifact',
    find: '<p>\u200b3. Select your repository</p>',
    replace: '<p>Select your repository</p>',
    rationale:
      'Paired with UD-010C — same defect pattern (ZWSP + "N. " step-number prefix on an orphan <p>), ' +
      'just the adjacent occurrence for "Select your repository" (step-sub-label 3). Without this ' +
      'patch, UD-010C alone would still leave a 1-step EN=12 / JA=11 mismatch. Both patches together ' +
      'bring step-count to 11/11. Rationale, impact, and JA-side sync strategy are identical to UD-010C.',
    linkedDefect: 'docs/superpowers/specs/upstream-defect-tracker.md#UD-010',
    addedAt: '2026-04-20',
    reviewAfter: '2026-10-20',
  }),
  Object.freeze({
    id: 'UD-012-ddt-visual-editor-index-section-cross-ref',
    slugs: Object.freeze([
      'advanced-editing/data-driven-testing/configuring-a-data-driven-test-from-the-visual-editor',
    ]),
    defectClass: 'madcap-artifact',
    find:
      '<a href="index.htm#section-data-driven-tests-using-data-from-an-external-source">' +
      'Data Driven tests using data from an external source</a>',
    replace:
      '<a href="configuring-data-driven-tests-using-data-from-an-external-source.htm">' +
      'Data Driven tests using data from an external source</a>',
    rationale:
      'Upstream MadCap cross-reference artifact: the EN callout "As part of this method..." links to ' +
      '`index.htm#section-data-driven-tests-using-data-from-an-external-source`, a MadCap TOC-stitched ' +
      'anchor on the non-existent category-index page. The intended target is the sibling page ' +
      '`configuring-data-driven-tests-using-data-from-an-external-source.htm` (which JA correctly ' +
      'references as `/docs/advanced-editing/data-driven-testing/configuring-data-driven-tests-using-data-from-an-external-source`). ' +
      'Without this patch, normalizeUrlToken emits `/docs/index` for EN vs the full canonical slug ' +
      'for JA, leaving token-overlap at 0 so the callout-body LCS pair fails (segment-missing + ' +
      'segment-extra). Same defect class as UD-005E/F/008/009 (bare `index.htm` self-reference).',
    linkedDefect: 'docs/superpowers/specs/upstream-defect-tracker.md#UD-012',
    addedAt: '2026-04-20',
    reviewAfter: '2026-10-20',
  }),
  Object.freeze({
    id: 'UD-013-hidden-parameters-index-parent-link',
    slugs: Object.freeze(['advanced-editing/parameters/hidden-parameters']),
    defectClass: 'madcap-artifact',
    find: 'When you use <a href="index.htm">parameters</a> in your tests',
    replace: 'When you use <a href="../parameters/index.htm">parameters</a> in your tests',
    rationale:
      'Upstream MadCap artifact: the preface paragraph links to the bare `index.htm` for the parent ' +
      'Parameters category, producing a bogus `/docs/index` invariant token. JA content correctly ' +
      'links to `/docs/advanced-editing/parameters`. Patch prepends the explicit `../parameters/` ' +
      'hop so normalizeUrlToken resolves to the same canonical `/docs/advanced-editing/parameters` ' +
      'path as JA. Same defect class as UD-005E/F (parameter-override-rules) on the sibling preface.',
    linkedDefect: 'docs/superpowers/specs/upstream-defect-tracker.md#UD-013',
    addedAt: '2026-04-20',
    reviewAfter: '2026-10-20',
  }),
  Object.freeze({
    id: 'UD-014-auto-grouping-index-parent-link',
    slugs: Object.freeze(['editing-tests/groups/auto-grouping']),
    defectClass: 'madcap-artifact',
    find: 'When creating a new <a href="index.htm">Group</a>',
    replace: 'When creating a new <a href="../groups/index.htm">Group</a>',
    rationale:
      'Upstream MadCap artifact: the first ordered-list-item links to the bare `index.htm` for the ' +
      'parent Groups category, producing a bogus `/docs/index` invariant token. JA content correctly ' +
      'links to `/docs/editing-tests/groups`. Patch prepends the explicit `../groups/` hop so ' +
      'normalizeUrlToken resolves to the same canonical `/docs/editing-tests/groups` path as JA. ' +
      'Same defect class as UD-005E/F/008/013.',
    linkedDefect: 'docs/superpowers/specs/upstream-defect-tracker.md#UD-014',
    addedAt: '2026-04-20',
    reviewAfter: '2026-10-20',
  }),
  Object.freeze({
    id: 'UD-015-config-file-run-hooks-empty-zwsp-paragraph',
    slugs: Object.freeze(['running-tests/configuration-file-run-hooks']),
    defectClass: 'madcap-artifact',
    find: '<p>\u200b</p>',
    replace: '',
    rationale:
      'Upstream MadCap authoring artifact: a stray `<p>\u200b</p>` element (zero-width space only) ' +
      'sits immediately after the "grid name" callout in the preface. The turndown-extracted segment ' +
      'survives as an empty paragraph, inflating EN preface body structure to [paragraph, ' +
      'callout-body, paragraph] vs JA [paragraph, callout-body]. The ZWSP has no user-visible content ' +
      'and is an authoring residue (same ZWSP pattern as UD-010A/B/C/D and UD-011). Patch strips it ' +
      'so EN body structure collapses to [paragraph, callout-body] matching JA. No information loss.',
    linkedDefect: 'docs/superpowers/specs/upstream-defect-tracker.md#UD-015',
    addedAt: '2026-04-20',
    reviewAfter: '2026-10-20',
  }),
  Object.freeze({
    id: 'UD-016A-subscription-plans-host-localhost-cli-span',
    slugs: Object.freeze(['administration/subscription-plans']),
    defectClass: 'madcap-artifact',
    find:
      '<span class="FileOrFilePath">host=localhost/127.0.0.1</span></p>\r\n' +
      '                                                    </td>\r\n' +
      '                                                    <td class="TableStyle-Table_new-BodyE-Column2-Body1">\r\n' +
      '                                                        <p class="tableBody">Web</p>',
    replace:
      '<code>host=localhost/127.0.0.1</code></p>\r\n' +
      '                                                    </td>\r\n' +
      '                                                    <td class="TableStyle-Table_new-BodyE-Column2-Body1">\r\n' +
      '                                                        <p class="tableBody">Web</p>',
    rationale:
      'Upstream MadCap artifact: the "Triggering an execution from the CLI with host=localhost/127.0.0.1" ' +
      'row (6,1) wraps the inline file/path literal in `<span class="FileOrFilePath">`, which is a ' +
      'MadCap-specific semantic span. The HTML-table extractor (extractHtmlTables) only converts ' +
      '`<code>` to backticks when building cell tokens; FileOrFilePath falls through as plain text, so ' +
      'the cell-level invariant tokenizer matches `127.0.0` via the three-segment dotted-identifier ' +
      'regex (`\\bv?\\d+\\.\\d+\\.\\d+\\b` greedy stop at the final `.`). JA correctly wraps ' +
      '`host=localhost/127.0.0.1` in markdown backticks (semantically identical to `<code>`), which ' +
      'the tokenizer extracts as a single invariant token. Patch rewrites `<span class="FileOrFilePath">` ' +
      'around this specific literal to `<code>` so both sides emit the same token. The surrounding ' +
      '</td>…<td class="…-Column2-Body1"><p…>Web</p> anchor scopes the literal to row 6,1 only (row ' +
      '7,1 uses Column2-Body2). Same defect class as UD-005 family (MadCap-specific markup that ' +
      'survives turndown without code-equivalent semantics).',
    linkedDefect: 'docs/superpowers/specs/upstream-defect-tracker.md#UD-016',
    addedAt: '2026-04-20',
    reviewAfter: '2026-10-20',
  }),
  Object.freeze({
    id: 'UD-016B-subscription-plans-host-localhost-grid-span',
    slugs: Object.freeze(['administration/subscription-plans']),
    defectClass: 'madcap-artifact',
    find:
      '<span class="FileOrFilePath">host=localhost/127.0.0.1</span></p>\r\n' +
      '                                                    </td>\r\n' +
      '                                                    <td class="TableStyle-Table_new-BodyE-Column2-Body2">\r\n' +
      '                                                        <p class="tableBody">Web</p>',
    replace:
      '<code>host=localhost/127.0.0.1</code></p>\r\n' +
      '                                                    </td>\r\n' +
      '                                                    <td class="TableStyle-Table_new-BodyE-Column2-Body2">\r\n' +
      '                                                        <p class="tableBody">Web</p>',
    rationale:
      'Upstream MadCap artifact: the "Triggering an execution from Test Editor on Grid with ' +
      'host=localhost/127.0.0.1" row (7,1) wraps the inline file/path literal in ' +
      '`<span class="FileOrFilePath">`. Same defect class and mechanism as UD-016A, but scoped to ' +
      'row 7,1 via the Column2-Body2 anchor (alternating table-row body class). Patch rewrites the ' +
      'span to `<code>` so the HTML-table extractor wraps it in backticks matching JA.',
    linkedDefect: 'docs/superpowers/specs/upstream-defect-tracker.md#UD-016',
    addedAt: '2026-04-20',
    reviewAfter: '2026-10-20',
  }),
  Object.freeze({
    id: 'UD-017-api-testing-assertion-br-br-paragraph-inflation',
    slugs: Object.freeze(['advanced-editing/api-testing']),
    defectClass: 'madcap-artifact',
    find:
      'Run additional code on request results code won’t be executed. <br /><br /> Do the following:</p>',
    replace:
      'Run additional code on request results code won’t be executed. Do the following:</p>',
    rationale:
      'Upstream MadCap authoring artifact: a single `<p>` element in the "Adding a Validate API Step" ' +
      'section concatenates the Assertion-section description and the "Do the following:" list-intro ' +
      'using an inline `<br /><br />` pair. Turndown converts `<br /><br />` inside a paragraph into a ' +
      'hard-break + blank-line sequence, which the markdown paragraph-count extractor reads as two ' +
      'paragraph-starts (inflating EN=9 vs JA=8). The alignSegments extractor already collapses the pair ' +
      'into one segment (so EN/JA segment structures match), and JA authors this as one logical ' +
      'paragraph ending with "設定手順:". Patch removes the redundant inline `<br /><br />` (purely ' +
      'visual spacing, no semantic boundary) so paragraph-count and segment-count both agree at one ' +
      'paragraph, matching JA. Same defect class as other MadCap authoring-artifact patches ' +
      '(UD-010/UD-011/UD-015).',
    linkedDefect: 'docs/superpowers/specs/upstream-defect-tracker.md#UD-017',
    addedAt: '2026-04-20',
    reviewAfter: '2026-10-20',
  }),
  Object.freeze({
    id: 'UD-003-predefined-properties-broken-global-parameters-row',
    slugs: Object.freeze([
      'running-tests/configuration-file-run-hooks/predefined-properties-in-config-file-hooks',
    ]),
    defectClass: 'madcap-artifact',
    find: '<p>| globalParameters      |             |      |</p>',
    replace: '',
    rationale:
      'Upstream MadCap authoring artifact: a broken table row ' +
      '`<p>| globalParameters | | |</p>` sits immediately after the After Test ' +
      'Predefined Properties `</table>` close. The author intended another ' +
      'table row, but MadCap serialized it as a raw paragraph whose first ' +
      'character is the pipe separator. Turndown re-emits the same text as ' +
      'a paragraph line `| globalParameters | | |`; the coarse ' +
      '`extractParagraphCounts` heuristic treats pipe-leading lines as ' +
      'markdown-table (EN=0 paragraphs for the section), while the JA mirror ' +
      'backtick-wraps the leading pipe to preserve source-first fidelity ' +
      '(`` `|` globalParameters | | | ``) and IS counted as a paragraph ' +
      '(JA=1), producing a paragraph-count-mismatch signal. alignSegments ' +
      'also extracts the EN `<p>` as a segment-paragraph that has no ' +
      'semantically meaningful JA counterpart. Patch strips the broken ' +
      'paragraph at the HTML boundary (upstream-defect-tracker.md UD-003 ' +
      'Option A). JA side drops the mirror line so both bodies converge to ' +
      '"section ends at `</table>`". Same defect class as UD-015/UD-017 ' +
      '(MadCap authoring residue with no user-visible content).',
    linkedDefect: 'docs/superpowers/specs/upstream-defect-tracker.md#UD-003',
    addedAt: '2026-04-20',
    reviewAfter: '2026-10-20',
  }),
  Object.freeze({
    id: 'UD-018A-sealights-build-session-id-list-wrapped-codesnippet',
    slugs: Object.freeze(['integrations/sealights-integration']),
    defectClass: 'madcap-artifact',
    find:
      '<li>\r\n                                                <div class="codeSnippet">' +
      '<a class="codeSnippetCopyButton" role="button" href="javascript:void(0);">Copy</a>\r\n' +
      '                                                    <div class="codeSnippetBody">' +
      '<pre><code>--sealights-build-session-id [sealights-suid-session-id]</code></pre>\r\n' +
      '                                                    </div>\r\n' +
      '                                                </div>\r\n' +
      '                                            </li>',
    replace:
      '<li><code>--sealights-build-session-id [sealights-suid-session-id]</code></li>',
    rationale:
      'Upstream MadCap authoring pattern: a single one-line CLI flag is wrapped as the sole content ' +
      'of a <li> inside a <ul>, but rendered via the full <div class="codeSnippet"><div ' +
      'class="codeSnippetBody"><pre><code>FLAG</code></pre></div></div> codeSnippet scaffolding ' +
      '(Copy button + pre+code block). Turndown serializes this as `*   ```\\n    FLAG\\n    ```` — ' +
      'the coarse `extractBulletCounts` heuristic skips the line because `FENCE_LINE_RE` matches the ' +
      'bullet-led ` ``` ` opening (FENCE_LINE_RE = /^\\s*(?:(?:[-*+]\\s+|\\d+\\.\\s+))?```/), giving ' +
      'EN=0 bullets in the section while JA uses an inline-code bullet `- `--sealights-...`` that is ' +
      'correctly counted (JA=1). alignSegments already treats both sides as unordered-list-item with ' +
      'matching text (so segment checks pass / actionable=0), but the coarse bullet count emits an ' +
      'audit signal. Patch normalizes the list-wrapped codeSnippet scaffolding into a minimal <li>' +
      '<code>FLAG</code></li>, which turndown serializes as `* `FLAG`` — a real bullet that the ' +
      'coarse counter recognizes, matching JA exactly. Same defect class as UD-015/UD-017 ' +
      '(MadCap authoring residue that inflates coarse counts while segment alignment already works).',
    linkedDefect: 'docs/superpowers/specs/upstream-defect-tracker.md#UD-018',
    addedAt: '2026-04-20',
    reviewAfter: '2026-10-20',
  }),
  Object.freeze({
    id: 'UD-018B-sealights-lab-id-list-wrapped-codesnippet',
    slugs: Object.freeze(['integrations/sealights-integration']),
    defectClass: 'madcap-artifact',
    find:
      '<li>\r\n                                                <div class="codeSnippet">' +
      '<a class="codeSnippetCopyButton" role="button" href="javascript:void(0);">Copy</a>\r\n' +
      '                                                    <div class="codeSnippetBody">' +
      '<pre><code>--sealights-lab-id [sealights-lab-id]</code></pre>\r\n' +
      '                                                    </div>\r\n' +
      '                                                </div>\r\n' +
      '                                            </li>',
    replace:
      '<li><code>--sealights-lab-id [sealights-lab-id]</code></li>',
    rationale:
      'Paired with UD-018A (same defect pattern on the sibling labId section). See UD-018A for the ' +
      'full rationale: list-wrapped codeSnippet scaffolding trips the coarse bullet-count heuristic ' +
      'via FENCE_LINE_RE matching the bullet-led triple-backtick opening, while JA uses a real ' +
      'inline-code bullet. Patch collapses to minimal <li><code>FLAG</code></li>.',
    linkedDefect: 'docs/superpowers/specs/upstream-defect-tracker.md#UD-018',
    addedAt: '2026-04-20',
    reviewAfter: '2026-10-20',
  }),
  Object.freeze({
    id: 'UD-018C-sealights-test-stage-list-wrapped-codesnippet',
    slugs: Object.freeze(['integrations/sealights-integration']),
    defectClass: 'madcap-artifact',
    find:
      '<li>\r\n                                                <div class="codeSnippet">' +
      '<a class="codeSnippetCopyButton" role="button" href="javascript:void(0);">Copy</a>\r\n' +
      '                                                    <div class="codeSnippetBody">' +
      '<pre><code>--sealights-test-stage [sealights-test-stage-name]</code></pre>\r\n' +
      '                                                    </div>\r\n' +
      '                                                </div>\r\n' +
      '                                            </li>',
    replace:
      '<li><code>--sealights-test-stage [sealights-test-stage-name]</code></li>',
    rationale:
      'Paired with UD-018A/B (same defect pattern on the sibling test-stage section). See UD-018A ' +
      'for the full rationale: list-wrapped codeSnippet scaffolding trips the coarse bullet-count ' +
      'heuristic via FENCE_LINE_RE matching the bullet-led triple-backtick opening, while JA uses ' +
      'a real inline-code bullet. Patch collapses to minimal <li><code>FLAG</code></li>.',
    linkedDefect: 'docs/superpowers/specs/upstream-defect-tracker.md#UD-018',
    addedAt: '2026-04-20',
    reviewAfter: '2026-10-20',
  }),
  Object.freeze({
    id: 'UD-019-create-salesforce-test-image-only-li-inflates-step-count',
    slugs: Object.freeze(['salesforce-testing/create-a-salesforce-test']),
    defectClass: 'madcap-artifact',
    find:
      '<li value="5">\r\n' +
      '                                                <p>\r\n' +
      '                                                    <img src="images/1a9ac07-afterlogin.png" class="ScreenshotFullsize" />\r\n' +
      '                                                </p>\r\n' +
      '                                            </li>',
    replace:
      '<img src="images/1a9ac07-afterlogin.png" class="ScreenshotFullsize" />',
    rationale:
      'Upstream MadCap authoring artifact: inside the "Recording Steps" <ol>, the 5th <li value="5"> ' +
      'wraps a single <img src="images/1a9ac07-afterlogin.png"> (post-login screenshot) with no text ' +
      'content. Adjacent list items all carry translatable prose; the screenshot is purely illustrative ' +
      'for step 4. The sibling image 90023bd-salesforcesteps.png (after step 6 in EN) is already rendered ' +
      'OUTSIDE any <li> as a direct child of <ol>, proving the intended shape for image-only screenshots ' +
      'in this list. Turndown emits the image-only <li> as "5. ![](...)" which extractStepCounts counts ' +
      'as a step (EN total=14) while extractSegmentsFromHtml drops it (empty inline text) — so EN reports ' +
      '7 ordered-list-items for step counting but only 6 for segment alignment, an asymmetric extractor ' +
      'outcome. JA content correctly renders the screenshot as a standalone image between numbered steps ' +
      '(6 items matching sibling image placement), surfacing as a 2x `step-count-mismatch` audit signal ' +
      '(top-level EN=14/JA=13, §7 EN=7/JA=6). Patch lifts the <img> out of the <li> to match the ' +
      'sibling 90023bd pattern; extractStepCounts drops to 6 for §7 (13 total), extractSegments emits an ' +
      '"image" segment between ordered-list-item indexes 3 and 4 aligning with JA.',
    linkedDefect: 'docs/superpowers/specs/upstream-defect-tracker.md#UD-019',
    addedAt: '2026-04-20',
    reviewAfter: '2026-10-20',
  }),
  Object.freeze({
    id: 'UD-020-troubleshoot-grid-image-only-li-inflates-bullet-count',
    slugs: Object.freeze(['salesforce-testing/troubleshoot']),
    defectClass: 'madcap-artifact',
    find:
      '                                            <li>\r\n' +
      '                                                <p>\r\n' +
      '                                                    <img src="images/bbf8513-image.png" class="ScreenshotFullsize" />\r\n' +
      '                                                </p>\r\n' +
      '                                            </li>\r\n' +
      '                                        </ul>',
    replace:
      '                                        </ul>\r\n' +
      '                                        <p>\r\n' +
      '                                            <img src="images/bbf8513-image.png" class="ScreenshotFullsize" />\r\n' +
      '                                        </p>',
    rationale:
      'Upstream MadCap authoring artifact: in the "Scheduled test executions on the Grid are failing" ' +
      'section, the first <ul> has a third <li><p><img src="images/bbf8513-image.png"/></p></li> that ' +
      'wraps only an illustrative screenshot (Login History restricted-IP image) — no prose. Same shape ' +
      'and defect class as UD-019 (image-only <li> in an otherwise prose-bearing list). ' +
      'extractSegmentsFromHtml correctly drops this <li> (walkListChildren emits nothing when ' +
      'collectInlineText returns empty; <img> maps to a single space that trims away). But ' +
      'extractBulletCounts (markdown-level `^[-*+]\\s` regex) counts the turndown output ' +
      '"*   ![](images/bbf8513-image.png)" as a bullet, yielding EN=6 vs JA=5 bullet-count-mismatch. ' +
      'JA content correctly renders the screenshot as a standalone image between the bullet list and ' +
      'the next paragraph (semantic role: illustration of the preceding two bullets, not itself a list ' +
      'entry). Patch lifts the <img> out of the <li> to a sibling <p> after the closing </ul>, mirroring ' +
      'JA shape. After the patch, EN markdown has 5 bullets + standalone image, aligning with JA. No ' +
      'information loss: the image is preserved one DOM node later.',
    linkedDefect: 'docs/superpowers/specs/upstream-defect-tracker.md#UD-020',
    addedAt: '2026-04-20',
    reviewAfter: '2026-10-20',
  }),
  Object.freeze({
    id: 'UD-021-validate-download-pdf-broken-row-as-code',
    slugs: Object.freeze(['advanced-editing/validations/validate-download']),
    defectClass: 'madcap-artifact',
    find: "<p>| expectedText       | JavaScript | 'A Simple PDF File'  |</p>",
    replace:
      "<p><code>| expectedText       | JavaScript | 'A Simple PDF File'  |</code></p>",
    rationale:
      'Upstream MadCap authoring artifact: the "PDF files" example-parameters table in the Validate ' +
      'download page has a broken third-row rendered as a stray `<p>|...|</p>` plain-text line after a ' +
      'proper `<table>` element (rows 1-2 are structured, row 3 leaked out as raw markdown pipe syntax ' +
      'in HTML). Turndown fuses the pipe paragraph into the preceding markdown table so `classifyLine` ' +
      'treats it as `markdown-table` (not counted), while JA authors the same broken-row in ' +
      'backtick-wrapped inline-code form (`\\`|...|\\``) which `classifyLine` correctly classifies as a ' +
      'paragraph-start. Result: EN=5 paragraphs vs JA=6 paragraph-count-mismatch signal. Patch wraps ' +
      'the broken-row `<p>` content in `<code>` so turndown emits matching backtick-inline-code ' +
      'markdown (`\\`|...|\\``), aligning paragraph-counts on both sides. Segment alignment remains ' +
      'intact because backticks are stripped from textNorm on both sides (symmetric), preserving the ' +
      'paragraph textNorm match. Same defect class as UD-015/UD-017 (MadCap authoring artifacts that ' +
      'survive turndown asymmetrically).',
    linkedDefect: 'docs/superpowers/specs/upstream-defect-tracker.md#UD-021',
    addedAt: '2026-04-20',
    reviewAfter: '2026-10-20',
  }),
  Object.freeze({
    id: 'UD-022-jenkins-docker-trailing-zwsp-paragraph',
    slugs: Object.freeze([
      'integrations/integrate-testim-to-your-ci/jenkins-integration-using-docker',
    ]),
    defectClass: 'madcap-artifact',
    find: '<p>\u200B \u200B</p>',
    replace: '',
    rationale:
      'Upstream MadCap authoring artifact: a trailing `<p>\u200B \u200B</p>` element (two ZWSPs with ' +
      'a space between) sits at the end of the "Now, just follow these steps:" section after the ' +
      'final ordered-list item + screenshot. `normalizeEnArtifacts` strips ZWSPs per line; the residue ' +
      'for this line is a single space which matches `^[\\s]*$` so the paragraph-count extractor drops ' +
      'it. But `extractSegmentsFromHtml` still emits a `paragraph ""` segment for this `<p>`, creating ' +
      'an asymmetry: EN paragraph-count=1 vs JA paragraph-count=2 (JA authors the residue as ' +
      '`\u200B \u200B` prose at the end, which the paragraph-count classifier counts because ' +
      '`^[\u200B...]+$` does not match due to the embedded space). Patch strips the stray `<p>` so ' +
      'neither counter nor segment extractor sees it on the EN side. JA content also removes the ' +
      'trailing `\u200B \u200B` line (pure authoring residue, no user-visible content). Same pattern ' +
      'as UD-015 (config-file-run-hooks ZWSP-only paragraph) — pure authoring-tool residue with ' +
      'no information loss.',
    linkedDefect: 'docs/superpowers/specs/upstream-defect-tracker.md#UD-022',
    addedAt: '2026-04-20',
    reviewAfter: '2026-10-20',
  }),
]);

/**
 * Literal occurrence count (non-overlapping). regex metacharacters に依存しない。
 *
 * @param {string} haystack
 * @param {string} needle
 * @returns {number}
 */
export function countOccurrences(haystack, needle) {
  if (typeof haystack !== 'string' || typeof needle !== 'string' || needle.length === 0) {
    return 0;
  }
  // split().length - 1 は literal で idempotent / regex-free.
  return haystack.split(needle).length - 1;
}

/**
 * registry の shallow copy を返す (テスト / reviewer gate から全件参照したいとき)。
 *
 * @returns {ReadonlyArray<object>}
 */
export function registryEntries() {
  return EN_SOURCE_PATCHES.slice();
}

/**
 * 指定 slug に適用される全 patch を `find → replace` で literal 置換する。
 *
 * - slug 非該当 entry は skip (no-op、coverage 記録しない)
 * - find が 0 回 hit: mismatch として coverage.recordMismatch (fail-open: raw を返す)
 * - find が 1 回以上 hit: String.split/join で全件置換 → coverage.recordHit
 * - Idempotent: 2 回 apply しても 1 回と同じ (replace に find を含まない前提)
 * - Order-independent: patch の順序を変えても結果同じ (slugs 別 or 非重複 find)
 *
 * @param {string} html - 入力 HTML (preprocessEnHtml の他 normalize 後)
 * @param {string} slug - 対象 slug (file path → slug、例: salesforce-testing/salesforce-steps)
 * @param {object} [coverage] - run 単位 aggregator。省略時は NOOP_PATCH_COVERAGE.
 * @returns {string} patch 適用後の HTML
 */
export function applyEnSourcePatches(html, slug, coverage = NOOP_PATCH_COVERAGE) {
  if (typeof html !== 'string') {
    throw new TypeError(`applyEnSourcePatches expected html string, got ${typeof html}`);
  }
  if (typeof slug !== 'string' || slug.length === 0) {
    // slug が null/空 の場合は apply しない (outer で slug を必須にする契約)。
    return html;
  }

  let current = html;
  for (const patch of EN_SOURCE_PATCHES) {
    if (!patch.slugs.includes(slug)) continue;
    const hits = countOccurrences(current, patch.find);
    if (hits === 0) {
      coverage.recordMismatch({
        slug,
        patchId: patch.id,
        reason: 'find-not-found',
      });
      // Operational signal: emit a non-blocking warning to surface when
      // upstream EN HTML has changed shape (e.g., the defect was fixed
      // upstream or the surrounding markup was reflowed). Do NOT throw —
      // continue with the next patch. Coverage is the authoritative record;
      // this warning is for human log-scan visibility.
      console.warn(
        `[en_source_patches] find-not-found for patch=${patch.id} slug=${slug} (upstream may have fixed the defect or HTML shape changed)`,
      );
      continue;
    }
    // literal string replace (no regex escape needed)
    current = current.split(patch.find).join(patch.replace);
    coverage.recordHit({
      slug,
      patchId: patch.id,
      hits,
    });
  }
  return current;
}

/**
 * runtime coverage aggregator。run 単位で 1 個生成し、patch hit / mismatch を
 * record する。`snapshot()` で集計結果を返す。
 *
 * @returns {{
 *   recordHit: (hit: {slug: string, patchId: string, hits: number}) => void,
 *   recordMismatch: (mm: {slug: string, patchId: string, reason: string}) => void,
 *   snapshot: () => {
 *     registryEntries: number,
 *     matchedHits: number,
 *     byPatchId: Record<string, number>,
 *     bySlug: Record<string, number>,
 *     mismatches: Array<{slug: string, patchId: string, reason: string}>,
 *   },
 * }}
 */
export function createEnSourcePatchCoverage() {
  const hits = [];
  const mismatches = [];
  return {
    recordHit({ slug, patchId, hits: count }) {
      hits.push({ slug, patchId, hits: count });
    },
    recordMismatch({ slug, patchId, reason }) {
      mismatches.push({ slug, patchId, reason });
    },
    snapshot() {
      const byPatchId = {};
      const bySlug = {};
      let matchedHits = 0;
      for (const h of hits) {
        matchedHits += h.hits;
        byPatchId[h.patchId] = (byPatchId[h.patchId] ?? 0) + h.hits;
        bySlug[h.slug] = (bySlug[h.slug] ?? 0) + h.hits;
      }
      return {
        registryEntries: EN_SOURCE_PATCHES.length,
        matchedHits,
        byPatchId,
        bySlug,
        mismatches: mismatches.slice(),
      };
    },
  };
}

/**
 * coverage を集計したくない呼び出し側が使う no-op aggregator。
 * snapshot() は常に空カウンタ + registry 件数だけを返す。
 */
export const NOOP_PATCH_COVERAGE = Object.freeze({
  recordHit() {},
  recordMismatch() {},
  snapshot: () => ({
    registryEntries: EN_SOURCE_PATCHES.length,
    matchedHits: 0,
    byPatchId: {},
    bySlug: {},
    mismatches: [],
  }),
});
