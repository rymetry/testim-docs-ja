/**
 * Source-Side Debt Exclusion Registry (Issue #255)。
 *
 * EN upstream 側が broken で parity comparator の前提を満たさない page を
 * 明示的に管理する registry。自動除外は一切しない — 人間が upstream broken と
 * 確認した slug だけ registry に追加する (false-negative 回避)。
 *
 * registry に登録されたページは:
 *   - snapshot_update は fetch するが snapshot file を上書きしない
 *   - fetch 結果に対して `detectSourceUsability` で recovery probe を実行する
 *   - `source-sync-status.json` で `fetchStatus: 'excluded-broken'` /
 *     `'excluded-recovered'` として可視化される
 *   - freshness 計算からは除外される (= debt だけ残っても fresh のまま)
 *
 * 復旧候補 (`excluded-recovered`) になっても自動で registry から削除しない。
 * 人間が確認して registry entry を削除するのが運用。
 *
 * 新規 entry 追加の手順:
 *   1. upstream が broken であることを人間が目視確認する
 *   2. `SOURCE_SYNC_EXCLUSIONS` に entry を追加する
 *   3. `expectedIssueType` / `expectedReason` は detectSourceUsability の
 *      出力と合致させる (recovery probe が出す issue と mismatch したとき
 *      "excluded-recovered" に落ちるように)
 *
 * @module source_sync_exclusions
 */

/**
 * Registry of known source-side debt pages.
 *
 * Shape:
 *   slug → {
 *     reason: 'broken-upstream-source',   // fixed token for downstream match
 *     note: string,                        // human description of symptom
 *     expectedIssueType: string,           // detectSourceUsability().type
 *     expectedReason: string,              // detectSourceUsability().usabilitySignals.reason
 *     addedAt: 'YYYY-MM-DD',
 *     linkedIssue: number,                 // upstream / parent issue number
 *   }
 *
 * @type {Readonly<Record<string, Readonly<{
 *   reason: string,
 *   note: string,
 *   expectedIssueType: string,
 *   expectedReason: string,
 *   addedAt: string,
 *   linkedIssue: number,
 * }>>>}
 */
export const SOURCE_SYNC_EXCLUSIONS = Object.freeze({
  'testops/testops-version-control/pull-requests': Object.freeze({
    reason: 'broken-upstream-source',
    note:
      'EN live HTML collapses the full article body into a single <code> block ' +
      'inside <div class="codeSnippet">. The MadCap Flare extractor produces 0 ' +
      'body segments, so the parity comparator cannot align sections. Issue #247 ' +
      'originally fixed this by writing a hand-authored snapshot, but every snapshot ' +
      'fetch reverts that fix. Registered here so snapshot_update stops overwriting ' +
      'the frozen reference file.',
    expectedIssueType: 'snapshot-incomplete',
    expectedReason: 'extractor-empty',
    addedAt: '2026-04-09',
    linkedIssue: 247,
  }),
});

/**
 * Return true if the slug is registered as source-side debt.
 *
 * @param {string | null | undefined} slug
 * @returns {boolean}
 */
export function isSourceSideDebt(slug) {
  if (typeof slug !== 'string' || slug.length === 0) return false;
  return Object.prototype.hasOwnProperty.call(SOURCE_SYNC_EXCLUSIONS, slug);
}

/**
 * Return a shallow copy of the registry entry for a slug, or null if the
 * slug is not registered. The returned object is a fresh copy — mutating
 * it does not affect the registry.
 *
 * @param {string | null | undefined} slug
 * @returns {{
 *   reason: string,
 *   note: string,
 *   expectedIssueType: string,
 *   expectedReason: string,
 *   addedAt: string,
 *   linkedIssue: number,
 * } | null}
 */
export function getExclusion(slug) {
  if (typeof slug !== 'string' || slug.length === 0) return null;
  const entry = SOURCE_SYNC_EXCLUSIONS[slug];
  if (!entry) return null;
  return { ...entry };
}

/**
 * Return all registered source-side debt slugs as a fresh sorted array.
 * Callers can mutate the returned array without affecting the registry.
 *
 * @returns {string[]}
 */
export function listSourceSideDebtSlugs() {
  return Object.keys(SOURCE_SYNC_EXCLUSIONS).sort();
}
