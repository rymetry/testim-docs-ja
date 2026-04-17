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
