/**
 * Frozen baseline mechanism (schema v2 / Phase 4 final).
 *
 * baseline は cutover 時点の既存 drift を凍結する仕組み。ack は「人がレビュー
 * して了承した例外」、baseline は「cutover 時点の既知 debt」で意味も生成方法
 * も寿命も違うため、parity-acknowledgements.json とは別ファイルで管理する。
 *
 * 純粋関数のみ。filesystem I/O は呼び出し側 (check_source_parity.mjs /
 * generate_parity_baseline.mjs) が行う。loadBaselineFile だけ薄い fs wrapper。
 *
 * v2 変更点 (Phase 4):
 * - `reviewAfter` 概念を撤去 (期限切れ / expiringSoon も含めて全廃)
 * - BASELINE_ELIGIBLE_TYPES を JA-actionable 7 type に縮約
 *   (segment-inconclusive / snapshot-incomplete / source-unusable を除外)
 * - `inconclusiveCategory` / `inconclusiveReason` / `usabilityReason` は
 *   entry schema から除去 (runtime issue 側にのみ保持)
 * - `priority` (high/medium/low, default medium) / `note` (任意 free-text) を追加
 *
 * @module source_parity_baseline
 */

import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

import {
  STRUCTURE_MISMATCH_TYPES,
} from './source_parity_types.mjs';

/**
 * frozen baseline 対象になる issue type (schema v2)。
 *
 * JA-actionable な 7 type のみ。期限管理 / advisory の混在を避けるため
 * segment-inconclusive (advisory) / snapshot-incomplete / source-unusable
 * (source 側 debt) は eligibility から外した。identity key は
 * `buildBaselineKey` / `buildBaselineKeyFromEntry` で segment 系 vs
 * structure 系で分岐する。
 *
 * @type {ReadonlySet<string>}
 */
export const BASELINE_ELIGIBLE_TYPES = Object.freeze(
  new Set([
    'segment-missing',
    'segment-extra',
    'segment-shifted',
    'segment-untranslated',
    'segment-token-gap',
    'section-structure-mismatch',
    'segment-order-mismatch',
  ]),
);

/**
 * `generate_parity_baseline --types` で受け入れる issueType の allowlist。
 *
 * v2 では structure mismatch 2 type のみ。segment-* は `--regenerate` で
 * 全再構築するのが基本運用で、`--types` による partial regenerate は
 * structure family の migration 時のみ使う契約。
 *
 * `--types=` を空で渡した場合 (silent no-op が起きる入力パターン) も
 * `validateTypesArg` で reject される。
 *
 * @type {ReadonlySet<string>}
 */
export const TYPES_ARG_ALLOWLIST = Object.freeze(
  new Set([
    'section-structure-mismatch',
    'segment-order-mismatch',
  ]),
);

/**
 * baseline entry が取りうる priority 値 (schema v2)。
 * default は `medium`。generator / validator は in order で strict match する。
 *
 * @type {readonly ['high', 'medium', 'low']}
 */
export const PRIORITY_VALUES = Object.freeze(['high', 'medium', 'low']);

/**
 * baseline entry に付与できる free-text note の最大長 (v2)。
 * @type {number}
 */
export const NOTE_MAX_LENGTH = 500;

/**
 * `generate_parity_baseline.mjs --types=<csv>` の引数を検証する純粋関数。
 * `main()` は `process.argv.slice(2)` を直読みしているため単体テストしづらい
 * ので、検証ロジックを helper として切り出す。CLI wiring 側はこの helper の
 * 戻り値を見てエラー出力 → return 1 する thin wrapper に留める。
 *
 * 受理:
 *   - `null` (= `--types` flag が指定されていない) → `{ ok: true }`
 *   - `TYPES_ARG_ALLOWLIST` の非空部分集合 → `{ ok: true }`
 *
 * reject:
 *   - 非 Array → `{ ok: false, error: string }`
 *   - 空配列 → `{ ok: false, error: string }` (silent no-op 防止)
 *   - allowlist 外の要素を含む → `{ ok: false, error: string }`
 *
 * @param {unknown} types
 * @returns {{ ok: true } | { ok: false, error: string }}
 */
export function validateTypesArg(types) {
  if (types === null) return { ok: true };
  if (!Array.isArray(types)) {
    return {
      ok: false,
      error: `--types must be a comma-separated list (got ${typeof types})`,
    };
  }
  if (types.length === 0) {
    return {
      ok: false,
      error:
        '--types cannot be empty. Use --regenerate for a full rebuild, ' +
        `or pass a non-empty csv of: ${[...TYPES_ARG_ALLOWLIST].join(', ')}`,
    };
  }
  const unknown = types.filter((t) => !TYPES_ARG_ALLOWLIST.has(t));
  if (unknown.length > 0) {
    return {
      ok: false,
      error:
        `--types contains unsupported issueType(s): ${unknown.join(', ')}. ` +
        `Allowed: ${[...TYPES_ARG_ALLOWLIST].join(', ')}`,
    };
  }
  return { ok: true };
}

/**
 * structure mismatch baseline 対象の structureCategory 列。
 * `source_parity_structure.mjs` の 3 stage (kind-multiset / kind-sequence /
 * content-order) と 1:1 で対応する enum。emitter 側が新しい stage を追加
 * する際はこちらも同期する必要がある (test で pin)。
 *
 * @type {ReadonlySet<string>}
 */
export const STRUCTURE_CATEGORIES = Object.freeze(
  new Set(['kind-multiset', 'kind-sequence', 'content-order']),
);

/**
 * structure mismatch issue の payload から
 * `structureFingerprint` (sha256:<64 hex>) を derive する純粋関数。
 *
 * key 順序と join 記号を厳密に固定することで、runtime 側の
 * `buildBaselineKey` と disk 側の `buildBaselineKeyFromEntry` が同じ
 * fingerprint を経由して identity key を合成できるようにする。生の
 * enKinds / jaKinds / contentPermutation は baseline entry に保存せず、
 * ここで hash に畳み込む (§3.2 参照)。
 *
 * 注意点:
 *   - enKinds / jaKinds の順序は EN/JA それぞれの自然順を使う
 *     (`source_parity_structure.mjs::buildBaseDiff` の出力順)。
 *   - contentPermutation は `structureCategory === 'content-order'` の
 *     ときのみ使用し、enIndex 昇順に並べ替えて `enIndex->jaIndex`
 *     形式に join する。`score` は identity に含めない。
 *   - kind-multiset / kind-sequence では contentPermutation を無視する
 *     (null / undefined / 省略で同じ fingerprint になる)。
 *
 * @param {object} input
 * @param {string} input.structureCategory — STRUCTURE_CATEGORIES の 1 つ
 * @param {string[]} input.enKinds
 * @param {string[]} input.jaKinds
 * @param {Array<{enIndex: number, jaIndex: number, score?: number}>} [input.contentPermutation]
 * @returns {string} `sha256:<64 hex>`
 */
export function computeStructureFingerprint({
  structureCategory,
  enKinds,
  jaKinds,
  contentPermutation,
}) {
  const permutationDigest =
    structureCategory === 'content-order' && Array.isArray(contentPermutation)
      ? [...contentPermutation]
          .sort((a, b) => a.enIndex - b.enIndex)
          .map((p) => `${p.enIndex}->${p.jaIndex}`)
          .join(',')
      : '';
  const raw = [
    structureCategory,
    Array.isArray(enKinds) ? enKinds.join('|') : '',
    Array.isArray(jaKinds) ? jaKinds.join('|') : '',
    permutationDigest,
  ].join('\n');
  return 'sha256:' + createHash('sha256').update(raw).digest('hex');
}

const FINGERPRINT_RE = /^sha256:[0-9a-f]{64}$/;

function isValidFingerprint(value) {
  return typeof value === 'string' && FINGERPRINT_RE.test(value);
}

function isValidMissingTokens(value) {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((token) => typeof token === 'string' && token.length > 0)
  );
}

function missingTokensSignature(value) {
  if (!Array.isArray(value)) return '';
  return [...new Set(value)].sort().join(',');
}

/**
 * Validate a parsed parity-baseline.json object (schema v2).
 * Throws a descriptive Error on any schema violation.
 *
 * @param {unknown} parsed
 * @returns {object} the validated parsed object (same reference)
 */
export function validateBaseline(parsed) {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Baseline file must be a JSON object');
  }
  if (parsed.schemaVersion !== 2) {
    throw new Error(`Unsupported baseline schemaVersion: ${parsed.schemaVersion} (expected 2)`);
  }
  if (!Array.isArray(parsed.entries)) {
    throw new Error('Baseline must have an "entries" array');
  }

  for (let i = 0; i < parsed.entries.length; i += 1) {
    const entry = parsed.entries[i];
    const prefix = `Baseline entry #${i + 1}`;

    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      throw new Error(`${prefix}: must be an object`);
    }

    if (typeof entry.slug !== 'string' || entry.slug === '') {
      throw new Error(`${prefix}: missing or invalid "slug"`);
    }

    if (typeof entry.issueType !== 'string' || !BASELINE_ELIGIBLE_TYPES.has(entry.issueType)) {
      throw new Error(
        `${prefix}: invalid "issueType" — must be one of ${[...BASELINE_ELIGIBLE_TYPES].join(', ')}`,
      );
    }

    if (
      typeof entry.snapshotFingerprint !== 'string' ||
      !FINGERPRINT_RE.test(entry.snapshotFingerprint)
    ) {
      throw new Error(`${prefix}: invalid "snapshotFingerprint" — must be sha256:<64 hex>`);
    }

    // v2: priority (required, enum) / note (optional, <= 500 chars)
    if (!PRIORITY_VALUES.includes(entry.priority)) {
      throw new Error(
        `${prefix}: invalid "priority" — must be one of ${PRIORITY_VALUES.join(', ')}`,
      );
    }
    if (entry.note !== undefined && entry.note !== null) {
      if (typeof entry.note !== 'string') {
        throw new Error(`${prefix}: "note" must be a string when present`);
      }
      if (entry.note.length > NOTE_MAX_LENGTH) {
        throw new Error(
          `${prefix}: "note" exceeds ${NOTE_MAX_LENGTH} characters (got ${entry.note.length})`,
        );
      }
    }

    // issueType ごとに、baseline の同定に必要な構造化フィールドを検証する。
    if (STRUCTURE_MISMATCH_TYPES.has(entry.issueType)) {
      // sectionPath は可読性用に保持するが、同定には使わない。
      if (
        typeof entry.sectionIndex !== 'number' ||
        !Number.isInteger(entry.sectionIndex) ||
        entry.sectionIndex < 0
      ) {
        throw new Error(
          `${prefix}: ${entry.issueType} entry must have non-negative integer sectionIndex (machine identity key)`,
        );
      }
      if (typeof entry.sectionPath !== 'string') {
        throw new Error(
          `${prefix}: ${entry.issueType} entry must have string sectionPath (empty string allowed for preface; reviewer readability only, not identity)`,
        );
      }
      if (
        typeof entry.structureCategory !== 'string' ||
        !STRUCTURE_CATEGORIES.has(entry.structureCategory)
      ) {
        throw new Error(
          `${prefix}: ${entry.issueType} entry must have structureCategory in ` +
            `${[...STRUCTURE_CATEGORIES].join(', ')}`,
        );
      }
      if (!isValidFingerprint(entry.structureFingerprint)) {
        throw new Error(
          `${prefix}: ${entry.issueType} entry must have valid structureFingerprint (sha256:<64 hex>)`,
        );
      }
    } else if (entry.issueType === 'segment-extra' || entry.issueType === 'segment-untranslated') {
      if (typeof entry.jaSegmentIndex !== 'number') {
        throw new Error(
          `${prefix}: ${entry.issueType} entry must have numeric jaSegmentIndex (JA-owned diff)`,
        );
      }
      if (!isValidFingerprint(entry.jaSourceFingerprint)) {
        throw new Error(
          `${prefix}: ${entry.issueType} entry must have valid jaSourceFingerprint`,
        );
      }
    } else if (entry.issueType === 'segment-shifted') {
      if (typeof entry.enSegmentIndex !== 'number') {
        throw new Error(
          `${prefix}: ${entry.issueType} entry must have numeric enSegmentIndex (EN-owned diff)`,
        );
      }
      if (!isValidFingerprint(entry.enSourceFingerprint)) {
        throw new Error(
          `${prefix}: ${entry.issueType} entry must have valid enSourceFingerprint`,
        );
      }
      if (!isValidFingerprint(entry.jaSourceFingerprint)) {
        throw new Error(
          `${prefix}: ${entry.issueType} entry must have valid jaSourceFingerprint`,
        );
      }
    } else {
      // segment-missing / segment-token-gap
      if (typeof entry.enSegmentIndex !== 'number') {
        throw new Error(
          `${prefix}: ${entry.issueType} entry must have numeric enSegmentIndex (EN-owned diff)`,
        );
      }
      if (!isValidFingerprint(entry.enSourceFingerprint)) {
        throw new Error(
          `${prefix}: ${entry.issueType} entry must have valid enSourceFingerprint`,
        );
      }
      if (entry.issueType === 'segment-token-gap' && !isValidMissingTokens(entry.missingTokens)) {
        throw new Error(
          `${prefix}: ${entry.issueType} entry must have non-empty missingTokens`,
        );
      }
    }
  }

  return parsed;
}

/**
 * Load and validate a parity-baseline.json file from disk.
 *
 * @param {string} filePath
 * @returns {{ schemaVersion: number, entries: object[] } & Record<string, unknown>}
 */
export function loadBaselineFile(filePath) {
  const raw = readFileSync(filePath, 'utf8');
  const parsed = JSON.parse(raw);
  return validateBaseline(parsed);
}

/**
 * issueType の "ownership"。EN 側がオーナーなら enSegmentIndex を baseline
 * 同定に使う。JA 側がオーナーなら jaSegmentIndex を使う。recall test の
 * `diffId()` (source_parity_recall.test.mjs) と整合している。
 */
const JA_OWNED_TYPES = new Set(['segment-extra', 'segment-untranslated']);

/**
 * Build a stable lookup key from an issue object.
 *
 * Key rules (schema v2):
 *   - JA-owned (segment-extra, segment-untranslated):
 *       `slug + issueType + sectionPath + segmentKind + jaSegmentIndex + jaSourceFingerprint`
 *   - EN-owned (segment-missing, segment-shifted, segment-token-gap):
 *       `slug + issueType + sectionPath + segmentKind + enSegmentIndex + enSourceFingerprint`
 *   - structure mismatch: `slug + issueType + sectionIndex + structureCategory + structureFingerprint`
 *
 * @param {string} slug
 * @param {object} issue
 * @returns {string}
 */
export function buildBaselineKey(slug, issue) {
  if (STRUCTURE_MISMATCH_TYPES.has(issue.type)) {
    // structure diff は sectionIndex + category + fingerprint で同定する。
    const fp = computeStructureFingerprint({
      structureCategory: issue.structureCategory,
      enKinds: Array.isArray(issue.enKinds) ? issue.enKinds : [],
      jaKinds: Array.isArray(issue.jaKinds) ? issue.jaKinds : [],
      contentPermutation: issue.contentPermutation,
    });
    return (
      `${slug}|${issue.type}|idx=${issue.sectionIndex ?? '_null_'}|` +
      `cat=${issue.structureCategory ?? '_null_'}|sfp=${fp}`
    );
  }
  if (JA_OWNED_TYPES.has(issue.type)) {
    return (
      `${slug}|${issue.type}|${issue.sectionPath ?? ''}|${issue.segmentKind ?? ''}|ja|` +
      `${issue.jaSegmentIndex ?? '_null_'}|jafp=${issue.jaSourceFingerprint ?? '_null_'}`
    );
  }
  if (issue.type === 'segment-token-gap') {
    return (
      `${slug}|${issue.type}|${issue.sectionPath ?? ''}|${issue.segmentKind ?? ''}|en|` +
      `${issue.enSegmentIndex ?? '_null_'}|enfp=${issue.enSourceFingerprint ?? '_null_'}|` +
      `tokens=${missingTokensSignature(issue.missingTokens)}`
    );
  }
  if (issue.type === 'segment-shifted') {
    return (
      `${slug}|${issue.type}|${issue.sectionPath ?? ''}|${issue.segmentKind ?? ''}|en|` +
      `${issue.enSegmentIndex ?? '_null_'}|enfp=${issue.enSourceFingerprint ?? '_null_'}|` +
      `jafp=${issue.jaSourceFingerprint ?? '_null_'}`
    );
  }
  return (
    `${slug}|${issue.type}|${issue.sectionPath ?? ''}|${issue.segmentKind ?? ''}|en|` +
    `${issue.enSegmentIndex ?? '_null_'}|enfp=${issue.enSourceFingerprint ?? '_null_'}`
  );
}

/**
 * Build a stable lookup key from a baseline entry object.
 * Mirrors buildBaselineKey so issues and entries hash identically.
 *
 * @param {object} entry
 * @returns {string}
 */
export function buildBaselineKeyFromEntry(entry) {
  if (STRUCTURE_MISMATCH_TYPES.has(entry.issueType)) {
    // runtime 側と同じ順序で key を組み立てる。
    return (
      `${entry.slug}|${entry.issueType}|idx=${entry.sectionIndex ?? '_null_'}|` +
      `cat=${entry.structureCategory ?? '_null_'}|sfp=${entry.structureFingerprint ?? '_null_'}`
    );
  }
  if (JA_OWNED_TYPES.has(entry.issueType)) {
    return (
      `${entry.slug}|${entry.issueType}|${entry.sectionPath ?? ''}|${entry.segmentKind ?? ''}|ja|` +
      `${entry.jaSegmentIndex ?? '_null_'}|jafp=${entry.jaSourceFingerprint ?? '_null_'}`
    );
  }
  if (entry.issueType === 'segment-token-gap') {
    return (
      `${entry.slug}|${entry.issueType}|${entry.sectionPath ?? ''}|${entry.segmentKind ?? ''}|en|` +
      `${entry.enSegmentIndex ?? '_null_'}|enfp=${entry.enSourceFingerprint ?? '_null_'}|` +
      `tokens=${missingTokensSignature(entry.missingTokens)}`
    );
  }
  if (entry.issueType === 'segment-shifted') {
    return (
      `${entry.slug}|${entry.issueType}|${entry.sectionPath ?? ''}|${entry.segmentKind ?? ''}|en|` +
      `${entry.enSegmentIndex ?? '_null_'}|enfp=${entry.enSourceFingerprint ?? '_null_'}|` +
      `jafp=${entry.jaSourceFingerprint ?? '_null_'}`
    );
  }
  return (
    `${entry.slug}|${entry.issueType}|${entry.sectionPath ?? ''}|${entry.segmentKind ?? ''}|en|` +
    `${entry.enSegmentIndex ?? '_null_'}|enfp=${entry.enSourceFingerprint ?? '_null_'}`
  );
}

/**
 * Tag issues that match a baseline entry. Page-level invalidation: if any
 * baseline entry on the page exists but its snapshotFingerprint differs from
 * the current page snapshot, NO baseline entries on that page apply (all
 * issues stay un-tagged) and `invalidated` is reported true.
 *
 * Returns a fresh array — does not mutate inputs.
 *
 * v2 契約: `issue.baselined === true` を付与するだけ (期限管理 / tagging
 * metadata は全廃)。フィルタ側は `isFrozenByBaseline(issue) ≡
 * issue.baselined === true` で判定する。
 *
 * @param {string} slug
 * @param {object[]} issues
 * @param {object[]} baselineEntries — full entries array, may include other slugs
 * @param {string|null} currentSnapshotFingerprint
 * @returns {{ tagged: object[], invalidated: boolean, matchedKeys: Set<string> }}
 */
export function tagIssuesWithBaseline(
  slug,
  issues,
  baselineEntries,
  currentSnapshotFingerprint,
) {
  const slugEntries = baselineEntries.filter((e) => e.slug === slug);

  if (slugEntries.length === 0) {
    return {
      tagged: issues.map((i) => ({ ...i })),
      invalidated: false,
      matchedKeys: new Set(),
    };
  }

  // fingerprint がずれたページでは、そのページの baseline を一括無効化する。
  const fingerprintMismatch = slugEntries.some(
    (e) => e.snapshotFingerprint !== currentSnapshotFingerprint,
  );
  if (fingerprintMismatch) {
    return {
      tagged: issues.map((i) => ({ ...i })),
      invalidated: true,
      matchedKeys: new Set(),
    };
  }

  const entryKeyIndex = new Map();
  for (const entry of slugEntries) {
    entryKeyIndex.set(buildBaselineKeyFromEntry(entry), entry);
  }

  const matchedKeys = new Set();
  const tagged = issues.map((issue) => {
    if (!BASELINE_ELIGIBLE_TYPES.has(issue.type)) {
      return { ...issue };
    }
    const key = buildBaselineKey(slug, issue);
    if (entryKeyIndex.has(key)) {
      matchedKeys.add(key);
      return { ...issue, baselined: true };
    }
    return { ...issue };
  });

  return { tagged, invalidated: false, matchedKeys };
}

/**
 * `tagIssuesWithBaseline` の `matchedKeys` を使って orphan entry を返す。
 *
 * page-level invalidation 時は全 entry が unmatched になるため、呼び出し側で
 * `invalidated` を見て orphan 集計をスキップする。
 *
 * @param {string} slug
 * @param {object[]} baselineEntries — 全 slug 混じった entries でも良い
 * @param {Set<string>} matchedKeys — `tagIssuesWithBaseline` の戻り値
 * @returns {object[]} orphan baseline entries (sourceFingerprint 等そのまま)
 */
export function computeOrphanBaselineEntries(slug, baselineEntries, matchedKeys) {
  if (!Array.isArray(baselineEntries)) return [];
  if (!(matchedKeys instanceof Set)) return [];
  const slugEntries = baselineEntries.filter((e) => e.slug === slug);
  return slugEntries.filter((e) => {
    const key = buildBaselineKeyFromEntry(e);
    return !matchedKeys.has(key);
  });
}
