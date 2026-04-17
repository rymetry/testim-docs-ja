// scripts/lib/ja_omission_policy_registry.mjs
/**
 * JA-side intentional-omission policy registry + runtime coverage aggregator.
 *
 * `docs/WRITING_GUIDE.md` §「原文から意図的に除外するコンテンツ」で規定された
 * Tricentis 削除依頼 policy により、EN 原文にある特定 segment を JA 側で
 * 意図的に削除している。そのため alignSegments は以下 4 種の "本来期待される"
 * drift を出す:
 *
 *   - `segment-missing`            (EN callout / paragraph が JA に無い)
 *   - `segment-extra`              (JA の placeholder callout が EN に無い)
 *   - `segment-token-gap`          (削除 segment 内の URL token が JA に無い)
 *   - `section-structure-mismatch` (上記の派生として kind-multiset が一致しない)
 *
 * これらは content 修正で解消不可能 (re-add は policy 違反)。既存 mechanism は
 * EN-side artifact (`parity_artifact_registry`) や EN-broken page
 * (`source_sync_exclusions`) を対象としており、「JA 側の意図的除外」は
 * covered されていなかった。本 registry が §5.3.3 として両者の gap を埋める。
 *
 * ## 契約
 *
 *   - registry は凍結された配列。entry 単位で `slugs[]`, `issueTypes[]`,
 *     `segmentKinds`, optional `missingToken`, `quota` を持つ。
 *   - glob / regex は使わない。entry 側が許容する具体的条件を列挙する。
 *   - `matchPolicy({ slug, issueType, segmentKind, missingTokens })` は副作用
 *     ゼロの純粋関数。マッチしたときは entry 参照を返し、それ以外は null。
 *   - `createOmissionCoverage()` は run 単位で 1 個だけ生成する stateful
 *     aggregator。`consume({slug, issueType, segmentKind, missingTokens})` は
 *     registry 照合 + quota 減算 + hit 記録を 1 つの atomic 動作で行い、
 *     quota 残があれば `true`、尽きたか match しなければ `false` を返す。
 *   - quota は aggregator の内部 state (`_remaining` map) としてのみ減算する。
 *     `ARTIFACT_REGISTRY` 本体は Object.freeze 済で不変を保つ。
 *   - `NOOP_OMISSION_COVERAGE` は test / 呼び出し側で aggregator を差し込め
 *     ないときのデフォルト。`consume()` は常に `false` を返す。
 *
 * ## 曖昧性の解消 (disambiguator design — quota-based)
 *
 * `overview/testim-overview` では 1 slug 内で
 * `callout-body segment-missing` が 2 件出る。3 種の候補から quota-based を
 * 採用した:
 *
 *   - (a) **quota-based** (採用): `{slug, issueType, segmentKind}` の組で
 *     最大 N 件まで抑止する。登録データは最小で、ハッシュ計算も EN 側 segment
 *     内容の安定性も要求しない。initial scope では 1 slug × 2 quota で十分。
 *   - (b) fingerprint-based: entry に `enSegmentFingerprint` を持たせ exact
 *     match する。EN 側 raw text が変わると sha-256 が変化してしまうため、
 *     WRITING_GUIDE 除外は「EN 文面がどう変わっても JA は出さない」意思表示で
 *     あることと相性が悪い。
 *   - (c) content-prefix match: 部分文字列 / regex。brittle で policy drift を
 *     許す危険があるため却下。
 *
 * 採用 (a) の副作用として「本来抑止されるべきで無い 3 件目の drift」も
 * quota 尽きるまで抑止され得るが、現実には同種 drift がポリシー由来以外で
 * 同一 slug に同時発生する確率は低い。もし発生したら 3 件目は drift として
 * 表面化し、reviewer が quota 増やすか別 slug に分離するかを判断する。
 *
 * Spec: docs/superpowers/plans/2026-04-16-m2-parity-burndown.md §5.3.3
 *
 * @module ja_omission_policy_registry
 */

/**
 * initial entries。§5.3.3 reviewer gate 承認を前提に登録する。
 *
 * `overview/testim-overview` の 3 件の Tricentis policy omission:
 *   1. pricing callout 削除 (EN callout-body idx 0)
 *   2. changelog callout のオフセット由来 missing (EN callout-body idx 1)
 *      + JA 変更履歴 callout の orphan (segment-extra)
 *   3. http://testim.io intro URL 削除 (EN paragraph idx 0 の token-gap)
 *
 * これら 3 件に加えて、上記の 3 件が派生的に引き起こす 1 件の
 * `section-structure-mismatch` も合わせて計 5 baseline entries を抑止する。
 */
export const JA_OMISSION_POLICY_REGISTRY = Object.freeze([
  Object.freeze({
    slugs: Object.freeze(['overview/testim-overview']),
    issueTypes: Object.freeze(['segment-missing']),
    segmentKinds: Object.freeze(['callout-body']),
    missingToken: null,
    quota: 2,
    reason: 'tricentis-pricing-changelog-callout-removal',
    note:
      'EN の pricing / changelog callout は WRITING_GUIDE §「原文から意図的に ' +
      '除外するコンテンツ」により JA 側で意図的に削除 (2 件 quota)',
    expectedIssueType: 'segment-missing',
    policySource: 'docs/WRITING_GUIDE.md §原文から意図的に除外するコンテンツ',
    addedAt: '2026-04-17',
    linkedIssue: null,
  }),
  Object.freeze({
    slugs: Object.freeze(['overview/testim-overview']),
    issueTypes: Object.freeze(['segment-extra']),
    segmentKinds: Object.freeze(['callout-body']),
    missingToken: null,
    quota: 1,
    reason: 'tricentis-changelog-callout-offset-remnant',
    note:
      'JA の「変更履歴」callout は EN changelog callout の翻訳版だが、EN 側 ' +
      'callout 2 件 → JA 側 1 件のオフセットで LCS が対応付けできず segment- ' +
      'extra として表面化する',
    expectedIssueType: 'segment-extra',
    policySource: 'docs/WRITING_GUIDE.md §原文から意図的に除外するコンテンツ',
    addedAt: '2026-04-17',
    linkedIssue: null,
  }),
  Object.freeze({
    slugs: Object.freeze(['overview/testim-overview']),
    issueTypes: Object.freeze(['segment-token-gap']),
    segmentKinds: Object.freeze(['paragraph']),
    missingToken: 'http://testim.io',
    quota: 1,
    reason: 'tricentis-testim-io-url-removal',
    note:
      'EN の http://testim.io intro URL は WRITING_GUIDE §「原文から意図的に ' +
      '除外するコンテンツ」により JA 側で意図的に削除',
    expectedIssueType: 'segment-token-gap',
    policySource: 'docs/WRITING_GUIDE.md §原文から意図的に除外するコンテンツ',
    addedAt: '2026-04-17',
    linkedIssue: null,
  }),
  Object.freeze({
    slugs: Object.freeze(['overview/testim-overview']),
    issueTypes: Object.freeze(['section-structure-mismatch']),
    segmentKinds: null,
    missingToken: null,
    quota: 1,
    reason: 'tricentis-callout-removal-structure-derivative',
    note:
      '上記 pricing / changelog callout 削除の派生として kind-multiset が ' +
      'ズレる (EN=[p → callout → p → ul → callout] vs JA=[p → p → ul → callout])',
    expectedIssueType: 'section-structure-mismatch',
    policySource: 'docs/WRITING_GUIDE.md §原文から意図的に除外するコンテンツ',
    addedAt: '2026-04-17',
    linkedIssue: null,
  }),
]);

/**
 * 入力された diff 候補に一致する registry entry (の index) を返す。一致しない
 * なら -1。純粋関数 — 副作用ゼロ。
 *
 * match ルール:
 *   - `entry.slugs` に slug が含まれる
 *   - `entry.issueTypes` に issueType が含まれる
 *   - `entry.segmentKinds` が null でない場合、segmentKind が含まれる
 *   - `entry.missingToken` が指定されている場合、`missingTokens` 配列に含まれる
 *
 * @param {{slug: string, issueType: string, segmentKind?: string|null, missingTokens?: string[]|null}} params
 * @returns {number} entry index (-1 if no match)
 */
function findMatchingEntryIndex({ slug, issueType, segmentKind, missingTokens }) {
  for (let i = 0; i < JA_OMISSION_POLICY_REGISTRY.length; i++) {
    const entry = JA_OMISSION_POLICY_REGISTRY[i];
    if (!entry.slugs.includes(slug)) continue;
    if (!entry.issueTypes.includes(issueType)) continue;
    if (entry.segmentKinds !== null) {
      if (typeof segmentKind !== 'string') continue;
      if (!entry.segmentKinds.includes(segmentKind)) continue;
    }
    if (entry.missingToken !== null) {
      if (!Array.isArray(missingTokens)) continue;
      if (!missingTokens.includes(entry.missingToken)) continue;
    }
    return i;
  }
  return -1;
}

/**
 * 入力された diff 候補に一致する registry entry を返す (読み取り専用)。
 * quota は減算しない — read-only な policy lookup。
 *
 * @param {{slug: string, issueType: string, segmentKind?: string|null, missingTokens?: string[]|null}} params
 * @returns {object|null}
 */
export function matchPolicy(params) {
  const idx = findMatchingEntryIndex(params);
  if (idx < 0) return null;
  return JA_OMISSION_POLICY_REGISTRY[idx];
}

/**
 * registry の shallow copy を返す。呼び出し側で mutate しても registry 本体は
 * 影響を受けない (配列コピーのみ。entry 自体は Object.freeze 済み)。
 *
 * @returns {ReadonlyArray<object>}
 */
export function registryEntries() {
  return JA_OMISSION_POLICY_REGISTRY.slice();
}

/**
 * runtime coverage aggregator。run 単位で 1 個生成し、quota-based 抑止が
 * 発火したときに consume する。snapshot() は以下を返す:
 *   - registryEntries:  registry の entry 数
 *   - matchedHits:      consume が true を返した累計回数
 *   - bySlug:           { [slug]: count }
 *   - byIssueType:      { [issueType]: count }
 *   - byReason:         { [reason]: count }
 *   - quotaUsage:       [{ reason, slugs, quota, used, remaining }]
 *   - exhaustedEntries: quota を使い切った entry の reason 配列
 *
 * `consume({slug, issueType, segmentKind, missingTokens})` は atomic:
 *   1. registry を照合して entry を見つける
 *   2. 見つかり、かつ quota 残があれば: 減算して hit 記録、`true` を返す
 *   3. 見つからない、または quota 尽き: 何もせず `false` を返す
 *
 * 呼び出し側は `consume` が true のとき該当 diff を suppress する。
 *
 * @returns {{
 *   consume: (params: {slug: string, issueType: string, segmentKind?: string|null, missingTokens?: string[]|null}) => boolean,
 *   snapshot: () => {
 *     registryEntries: number,
 *     matchedHits: number,
 *     bySlug: Record<string, number>,
 *     byIssueType: Record<string, number>,
 *     byReason: Record<string, number>,
 *     quotaUsage: Array<{reason: string, slugs: string[], quota: number, used: number, remaining: number}>,
 *     exhaustedEntries: string[],
 *   },
 * }}
 */
export function createOmissionCoverage() {
  const remaining = JA_OMISSION_POLICY_REGISTRY.map((e) => e.quota);
  const hits = [];

  return {
    consume({ slug, issueType, segmentKind, missingTokens }) {
      const idx = findMatchingEntryIndex({ slug, issueType, segmentKind, missingTokens });
      if (idx < 0) return false;
      if (remaining[idx] <= 0) return false;
      remaining[idx] -= 1;
      const entry = JA_OMISSION_POLICY_REGISTRY[idx];
      hits.push({
        slug,
        issueType,
        segmentKind: segmentKind ?? null,
        reason: entry.reason,
      });
      return true;
    },
    snapshot() {
      const bySlug = {};
      const byIssueType = {};
      const byReason = {};
      for (const h of hits) {
        bySlug[h.slug] = (bySlug[h.slug] ?? 0) + 1;
        byIssueType[h.issueType] = (byIssueType[h.issueType] ?? 0) + 1;
        byReason[h.reason] = (byReason[h.reason] ?? 0) + 1;
      }
      const quotaUsage = JA_OMISSION_POLICY_REGISTRY.map((entry, i) => ({
        reason: entry.reason,
        slugs: entry.slugs.slice(),
        quota: entry.quota,
        used: entry.quota - remaining[i],
        remaining: remaining[i],
      }));
      const exhaustedEntries = quotaUsage
        .filter((u) => u.remaining === 0)
        .map((u) => u.reason);
      return {
        registryEntries: JA_OMISSION_POLICY_REGISTRY.length,
        matchedHits: hits.length,
        bySlug,
        byIssueType,
        byReason,
        quotaUsage,
        exhaustedEntries,
      };
    },
  };
}

/**
 * coverage を集計したくない呼び出し側が使う no-op aggregator。
 * `consume()` は常に `false` を返すため、diff 抑止は発火しない。
 */
export const NOOP_OMISSION_COVERAGE = Object.freeze({
  consume: () => false,
  snapshot: () => ({
    registryEntries: JA_OMISSION_POLICY_REGISTRY.length,
    matchedHits: 0,
    bySlug: {},
    byIssueType: {},
    byReason: {},
    quotaUsage: JA_OMISSION_POLICY_REGISTRY.map((entry) => ({
      reason: entry.reason,
      slugs: entry.slugs.slice(),
      quota: entry.quota,
      used: 0,
      remaining: entry.quota,
    })),
    exhaustedEntries: [],
  }),
});
