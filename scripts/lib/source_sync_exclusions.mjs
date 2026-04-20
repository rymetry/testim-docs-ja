/**
 * Source-Side Debt Exclusion Registry。
 *
 * EN upstream 側が broken で parity comparator の前提を満たさない page を
 * 明示的に管理する registry。自動除外は一切しない — 人間が upstream broken と
 * 確認した slug だけ registry に追加する (false-negative 回避)。
 *
 * registry に登録されたページは:
 *   - snapshot_update は fetch するが snapshot file を上書きしない
 *   - fetch 結果に対して EN-only recovery probe を実行する
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
 *   3. `expectedIssueType` / `expectedReason` は EN-only recovery probe の
 *      判定に使用される。detector が理解する reason
 *      (`extractor-empty` / `shallow-snapshot` / `escaped-details-residue`)
 *      のみ recovery 判定対象で、それ以外や extractor 例外は fail-close
 *      で `excluded-broken` に倒す
 *
 * @module source_sync_exclusions
 */

/**
 * 既知の source-side debt page を保持する registry。
 *
 * Shape:
 *   slug → {
 *     reason: 'broken-upstream-source',
 *     note: string,
 *     expectedIssueType: string,
 *     expectedReason: string,
 *     addedAt: 'YYYY-MM-DD',
 *     reviewAfter: 'YYYY-MM-DD',   // Phase A: 6-month cadence, parity with en_source_patches
 *     linkedIssue: number,
 *   }
 *
 * `reviewAfter` は `en_source_patches.mjs` と同じ 6 ヶ月 cadence で上流修復の再確認を
 * 促す field。期限超過は `check_patch_review_cadence.mjs` が両 registry 横断で
 * surface する (non-blocking warning)。
 *
 * @type {Readonly<Record<string, Readonly<{
 *   reason: string,
 *   note: string,
 *   expectedIssueType: string,
 *   expectedReason: string,
 *   addedAt: string,
 *   reviewAfter: string,
 *   linkedIssue: number,
 * }>>>}
 */
export const SOURCE_SYNC_EXCLUSIONS = Object.freeze({
  'testops/testops-version-control/pull-requests': Object.freeze({
    reason: 'broken-upstream-source',
    note:
      'EN live HTML collapses the full article body into a single <code> block ' +
      'inside <div class="codeSnippet">. The MadCap Flare extractor produces 0 ' +
      'body segments, so the parity comparator cannot align sections. A hand-authored ' +
      'snapshot can keep parity checks stable, but every snapshot fetch would overwrite ' +
      'that fix. Registered here so snapshot_update stops overwriting ' +
      'the frozen reference file.',
    expectedIssueType: 'snapshot-incomplete',
    expectedReason: 'extractor-empty',
    addedAt: '2026-04-09',
    reviewAfter: '2026-10-09',
    linkedIssue: 247,
  }),
});

/**
 * slug が source-side debt として登録されていれば true を返す。
 *
 * @param {string | null | undefined} slug
 * @returns {boolean}
 */
export function isSourceSideDebt(slug) {
  if (typeof slug !== 'string' || slug.length === 0) return false;
  return Object.prototype.hasOwnProperty.call(SOURCE_SYNC_EXCLUSIONS, slug);
}

/**
 * slug の registry entry を shallow copy で返す。
 * 未登録なら null。返り値を変更しても registry 本体には影響しない。
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
 * 登録済み source-side debt slug をソート済み配列で返す。
 * 返り値を変更しても registry 本体には影響しない。
 *
 * @returns {string[]}
 */
export function listSourceSideDebtSlugs() {
  return Object.keys(SOURCE_SYNC_EXCLUSIONS).sort();
}
