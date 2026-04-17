// scripts/lib/parity_artifact_registry.mjs
/**
 * EN-side artifact registry (slug-scope, token) + runtime coverage aggregator.
 *
 * Phase 4 で alignSegments の `segment-token-gap` 抑止に使う slug-scope token
 * registry。「EN ページ固有の artifact (self-index link, demo placeholder link
 * 等) を、JA 側で修復不能なまま検出に上げ続けない」という Phase 2 の観測結果を
 * runtime 側へ持ち込むための静的データと、その抑止 hit を集計する coverage
 * aggregator を提供する。
 *
 * 契約:
 *   - registry は凍結された配列。entry 単位で `slugs[]` と `token` を持ち、
 *     `(slug, token)` の直接照合で抑止を判定する。グロブ / regex は使わない。
 *   - `isArtifactExcluded({ slug, token })` は副作用ゼロの純粋関数。
 *   - `createArtifactCoverage()` は run 単位で 1 個だけ生成し、抑止 hit を
 *     record する stateful aggregator。`snapshot()` で per-slug / per-token
 *     カウンタと registry entry 数を返す。`NOOP_COVERAGE` は test / 呼び出し
 *     側で coverage 集計が不要なときのデフォルト。
 *
 * Spec: docs/superpowers/specs/2026-04-14-parity-phase4-final-goal.md
 *
 * @module parity_artifact_registry
 */

/**
 * 初期 entries。Task 4.1 inventory (2026-04-15) に基づく。
 * inventory: docs/superpowers/specs/2026-04-14-parity-phase4-residual-inventory.json
 */
export const ARTIFACT_REGISTRY = Object.freeze([
  Object.freeze({
    slugs: Object.freeze([
      'editing-tests/conditions/advanced-conditions-settings',
      'integrations/visual-validation/visual_validation_index',
      'recording-tests/recording-a-mobile-test/recording-a-local-mobile-test',
      'salesforce-testing/create-a-salesforce-test/use-agentic-test-automation-for-salesforce',
      'salesforce-testing/salesforce-steps/sfdc-step-login',
      'testops/insights/dashboard',
    ]),
    token: '/docs/index',
    reason: 'en-side-self-index-link-artifact',
    note: 'EN ページ内 self-link (/docs/index) の artifact',
    expectedIssueType: 'segment-token-gap',
    addedAt: '2026-04-15',
    linkedIssue: null,
  }),
  Object.freeze({
    slugs: Object.freeze(['getting-started/creating-your-first-codeless-test']),
    token: 'http://google.com',
    reason: 'en-side-demo-link-artifact',
    note: 'EN 側 demo.testim.io の例示用 <a href="http://google.com">',
    expectedIssueType: 'segment-token-gap',
    addedAt: '2026-04-15',
    linkedIssue: null,
  }),
]);

/**
 * 指定した (slug, token) が registry に登録された artifact と一致するか。
 * 純粋関数 — 入力を mutate しない。
 *
 * @param {{slug: string, token: string}} params
 * @returns {boolean}
 */
export function isArtifactExcluded({ slug, token }) {
  for (const entry of ARTIFACT_REGISTRY) {
    if (!entry.slugs.includes(slug)) continue;
    if (entry.token === token) return true;
  }
  return false;
}

/**
 * registry の shallow copy を返す。呼び出し側で mutate しても registry 本体は
 * 影響を受けない (配列コピーのみ。entry 自体は Object.freeze 済み)。
 *
 * @returns {ReadonlyArray<object>}
 */
export function registryEntries() {
  return ARTIFACT_REGISTRY.slice();
}

/**
 * runtime coverage aggregator。run 単位で 1 個生成し、artifact 抑止が発火した
 * ときに record する。snapshot() で以下を返す:
 *   - registryEntries: registry の entry 数
 *   - matchedHits:     record 呼び出し回数 (= 抑止発火回数)
 *   - bySlug:          { [slug]: count }
 *   - byToken:         { [token]: count }
 *
 * @returns {{
 *   record: (hit: {slug: string, token: string, reason?: string|null}) => void,
 *   snapshot: () => {
 *     registryEntries: number,
 *     matchedHits: number,
 *     bySlug: Record<string, number>,
 *     byToken: Record<string, number>,
 *   },
 * }}
 */
export function createArtifactCoverage() {
  const hits = [];
  return {
    record({ slug, token, reason }) {
      hits.push({ slug, token, reason: reason ?? null });
    },
    snapshot() {
      const bySlug = {};
      const byToken = {};
      for (const h of hits) {
        bySlug[h.slug] = (bySlug[h.slug] ?? 0) + 1;
        byToken[h.token] = (byToken[h.token] ?? 0) + 1;
      }
      return {
        registryEntries: ARTIFACT_REGISTRY.length,
        matchedHits: hits.length,
        bySlug,
        byToken,
      };
    },
  };
}

/**
 * coverage を集計したくない呼び出し側が使う no-op aggregator。
 * snapshot() は常に空カウンタ + registry 件数だけを返す。
 */
export const NOOP_COVERAGE = Object.freeze({
  record() {},
  snapshot: () => ({
    registryEntries: ARTIFACT_REGISTRY.length,
    matchedHits: 0,
    bySlug: {},
    byToken: {},
  }),
});
