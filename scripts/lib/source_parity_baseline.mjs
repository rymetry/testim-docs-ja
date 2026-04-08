/**
 * Frozen baseline mechanism (Issue #225 で導入)。
 *
 * baseline は cutover 時点の既存 drift を凍結する仕組み。ack は「人がレビュー
 * して了承した例外」、baseline は「cutover 時点の既知 debt」で意味も生成方法
 * も寿命も違うため、parity-acknowledgements.json とは別ファイルで管理する。
 *
 * 純粋関数のみ。filesystem I/O は呼び出し側 (check_source_parity.mjs /
 * generate_parity_baseline.mjs) が行う。loadBaselineFile だけ薄い fs wrapper。
 *
 * @module source_parity_baseline
 */

import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

import {
  STRUCTURE_MISMATCH_TYPES,
  SOURCE_UNUSABLE_TYPES,
} from './source_parity_types.mjs';

/**
 * frozen baseline 対象になる issue type。
 *
 * Issue #247 PR5 — structure mismatch (section-structure-mismatch /
 * segment-order-mismatch) と source unusable (snapshot-incomplete /
 * source-unusable) を baseline 可能にした。identity key は segment-*
 * ファミリとは別系統で、structure 系は sectionIndex + structureCategory +
 * structureFingerprint、source unusable 系は usabilityReason のみで同定
 * する (§3.2 / §3.3)。`source-unusable` / `snapshot-incomplete` は gate
 * には載らないが (翻訳者責任外な source 側 debt)、ack / baseline で人手
 * 管理できる枠を提供する。
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
    'segment-inconclusive',
    'section-structure-mismatch',
    'segment-order-mismatch',
    'snapshot-incomplete',
    'source-unusable',
  ]),
);

/**
 * Issue #247 post-merge — `generate_parity_baseline --types` で受け入れる
 * issueType の allowlist。BASELINE_ELIGIBLE_TYPES より狭く、PR5 migration
 * 対象 (structure mismatch + source unusable) の 4 type のみを許可する。
 *
 * これより広くすると `--types` が既存 segment-* entry を touch できて
 * しまい、reviewAfter の意図しない shift を起こす (§7.4 の意図と反する)。
 * 逆にこれより狭くすると PR5 migration 自体が不可能になる。
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
    'snapshot-incomplete',
    'source-unusable',
  ]),
);

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
 * Issue #247 PR5 — structure mismatch baseline 対象の structureCategory 列。
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
 * Issue #247 PR5 — source unusable baseline 対象の usabilityReason 列。
 * `source_parity_source_usability.mjs::buildIssue` の reason と 1:1 で対応
 * する enum。emitter 側が新しい reason を追加する際はこちらも同期する
 * 必要がある (test で pin)。
 *
 * @type {ReadonlySet<string>}
 */
export const USABILITY_REASONS = Object.freeze(
  new Set(['shallow-snapshot', 'escaped-details-residue', 'extractor-empty']),
);

/**
 * Issue #247 PR5 — structure mismatch issue の payload から
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

/**
 * `segment-inconclusive` の構造化カテゴリ。free text の `inconclusiveReason` は
 * baseline 同定に使わず、必ずこの enum で同定する。
 *
 * @type {ReadonlySet<string>}
 */
export const INCONCLUSIVE_CATEGORIES = Object.freeze(
  new Set([
    'heading-count-mismatch',
    'align-exception',
    'tokenless-near-tie',
  ]),
);

const REVIEW_AFTER_RE = /^\d{4}-\d{2}-\d{2}$/;
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
 * Validate a parsed parity-baseline.json object.
 * Throws a descriptive Error on any schema violation.
 *
 * @param {unknown} parsed
 * @returns {object} the validated parsed object (same reference)
 */
export function validateBaseline(parsed) {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Baseline file must be a JSON object');
  }
  if (parsed.schemaVersion !== 1) {
    throw new Error(`Unsupported baseline schemaVersion: ${parsed.schemaVersion}`);
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

    if (typeof entry.reviewAfter !== 'string' || !REVIEW_AFTER_RE.test(entry.reviewAfter)) {
      throw new Error(`${prefix}: invalid "reviewAfter" — must be strict YYYY-MM-DD`);
    }
    const [year, month, day] = entry.reviewAfter.split('-').map(Number);
    const roundTrip = new Date(Date.UTC(year, month - 1, day));
    if (
      roundTrip.getUTCFullYear() !== year ||
      roundTrip.getUTCMonth() + 1 !== month ||
      roundTrip.getUTCDate() !== day
    ) {
      throw new Error(
        `${prefix}: "reviewAfter" "${entry.reviewAfter}" is not a valid calendar date`,
      );
    }

    // issueType-specific required fields. Ownership of the diff determines
    // which side's index keys the baseline:
    //   - EN-owned: segment-missing, segment-shifted, segment-token-gap → enSegmentIndex
    //   - JA-owned: segment-extra, segment-untranslated → jaSegmentIndex
    //   - page-level: segment-inconclusive → inconclusiveCategory
    //   - PR5 section: section-structure-mismatch / segment-order-mismatch →
    //       sectionIndex + structureCategory + structureFingerprint
    //   - PR5 page: snapshot-incomplete / source-unusable → usabilityReason
    if (STRUCTURE_MISMATCH_TYPES.has(entry.issueType)) {
      // Issue #247 PR5 — section 粒度の structure diff。
      //
      // identity surface (machine key):
      //   sectionIndex + structureCategory + structureFingerprint
      //
      // sectionPath は reviewer 可読性 / sort 補助のために保存するが
      // identity には使わない。sectionPath は同一ページ内で一意の保証が
      // 無く、両方同じ sectionPath を持つ section が共存するケースで
      // baseline が silently 誤った section を覆うのを防ぐため
      // (レビュー指摘 Finding 2)。
      //
      // 生の enKinds / jaKinds / contentPermutation は
      // structureFingerprint に畳み込まれる (computeStructureFingerprint
      // 参照)。reviewer 用の raw data は parity-check-status.json 側に
      // 出る。
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
    } else if (SOURCE_UNUSABLE_TYPES.has(entry.issueType)) {
      // Issue #247 PR5 — page 粒度の source unusable detector。
      //
      // identity surface: usabilityReason のみ。
      // sectionPath / structureCategory / structureFingerprint は持たない
      // (page-level な issue なので)。数値フィールド (enBodySegmentCount
      // 等) は drift 発火の閾値判定に使われる根拠であって identity では
      // ないため baseline には保存しない。
      if (
        typeof entry.usabilityReason !== 'string' ||
        !USABILITY_REASONS.has(entry.usabilityReason)
      ) {
        throw new Error(
          `${prefix}: ${entry.issueType} entry must have usabilityReason in ` +
            `${[...USABILITY_REASONS].join(', ')}`,
        );
      }
    } else if (entry.issueType === 'segment-inconclusive') {
      if (
        typeof entry.inconclusiveCategory !== 'string' ||
        !INCONCLUSIVE_CATEGORIES.has(entry.inconclusiveCategory)
      ) {
        throw new Error(
          `${prefix}: segment-inconclusive entry must have inconclusiveCategory in ` +
            `${[...INCONCLUSIVE_CATEGORIES].join(', ')}`,
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

export function isBaselineExpired(entry, today) {
  if (typeof today !== 'string' || !REVIEW_AFTER_RE.test(today)) return false;
  return today > entry.reviewAfter;
}

/**
 * Pre-expiry warning window in days. The baseline `reviewAfter` cliff used
 * to fire all 1000+ entries on the same day; the §5 stagger fixes the cliff
 * itself, and this warning window gives a runway for paydown PRs to land
 * before any individual entry actually re-enters the gate.
 */
export const BASELINE_EXPIRY_WARNING_DAYS = 30;

/**
 * Returns true when an entry's `reviewAfter` is within
 * `BASELINE_EXPIRY_WARNING_DAYS` of `today` (inclusive of the boundary)
 * but the entry has not yet expired.
 *
 * Both inputs MUST be strict YYYY-MM-DD strings; this function does not
 * accept Date objects so callers cannot accidentally introduce timezone
 * drift.
 *
 * @param {object} entry
 * @param {string} today — strict YYYY-MM-DD
 * @returns {boolean}
 */
export function isBaselineExpiringSoon(entry, today) {
  if (typeof today !== 'string' || !REVIEW_AFTER_RE.test(today)) return false;
  if (typeof entry.reviewAfter !== 'string' || !REVIEW_AFTER_RE.test(entry.reviewAfter)) {
    return false;
  }
  if (today > entry.reviewAfter) return false; // already expired
  const [ty, tm, td] = today.split('-').map(Number);
  const [ry, rm, rd] = entry.reviewAfter.split('-').map(Number);
  const todayUtc = Date.UTC(ty, tm - 1, td);
  const reviewUtc = Date.UTC(ry, rm - 1, rd);
  const diffDays = Math.floor((reviewUtc - todayUtc) / 86400000);
  return diffDays >= 0 && diffDays <= BASELINE_EXPIRY_WARNING_DAYS;
}

/**
 * Build a stable lookup key from an issue object.
 *
 * Key rules:
 *   - JA-owned (segment-extra, segment-untranslated):
 *       `slug + issueType + sectionPath + segmentKind + jaSegmentIndex`
 *   - EN-owned (segment-missing, segment-shifted, segment-token-gap):
 *       `slug + issueType + sectionPath + segmentKind + enSegmentIndex`
 *   - segment-inconclusive: `slug + issueType + inconclusiveCategory`
 *
 * The free-text `inconclusiveReason` is intentionally NOT used as part of
 * the key — it changes with wording tweaks and would silently break the
 * baseline match. Use the structured `inconclusiveCategory` enum instead.
 *
 * @param {string} slug
 * @param {object} issue
 * @returns {string}
 */
export function buildBaselineKey(slug, issue) {
  if (STRUCTURE_MISMATCH_TYPES.has(issue.type)) {
    // Issue #247 PR5 — section 粒度の structure diff。
    // identity surface: sectionIndex + structureCategory + structureFingerprint。
    // sectionPath は entry 側に保存するが machine identity key には含めない
    // (同一ページ内で一意の保証が無いため — Finding 2)。
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
  if (SOURCE_UNUSABLE_TYPES.has(issue.type)) {
    // Issue #247 PR5 — page 粒度の source unusable detector。
    // identity surface: usabilityReason のみ。
    const reason = issue.usabilitySignals?.reason ?? '_null_';
    return `${slug}|${issue.type}|reason=${reason}`;
  }
  if (issue.type === 'segment-inconclusive') {
    return `${slug}|${issue.type}|category=${issue.inconclusiveCategory ?? '_null_'}`;
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
    // Issue #247 PR5 — buildBaselineKey (runtime) と同じ合成順・同じ区切り
    // 文字を使う。runtime 側は毎回 fingerprint を derive するが disk 側は
    // 事前計算された structureFingerprint をそのまま読む。
    return (
      `${entry.slug}|${entry.issueType}|idx=${entry.sectionIndex ?? '_null_'}|` +
      `cat=${entry.structureCategory ?? '_null_'}|sfp=${entry.structureFingerprint ?? '_null_'}`
    );
  }
  if (SOURCE_UNUSABLE_TYPES.has(entry.issueType)) {
    return `${entry.slug}|${entry.issueType}|reason=${entry.usabilityReason ?? '_null_'}`;
  }
  if (entry.issueType === 'segment-inconclusive') {
    return `${entry.slug}|${entry.issueType}|category=${entry.inconclusiveCategory ?? '_null_'}`;
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
 * @param {string} slug
 * @param {object[]} issues
 * @param {object[]} baselineEntries — full entries array, may include other slugs
 * @param {string|null} currentSnapshotFingerprint
 * @param {string|null} [today]
 * @returns {{ tagged: object[], invalidated: boolean, matchedKeys: Set<string> }}
 */
export function tagIssuesWithBaseline(
  slug,
  issues,
  baselineEntries,
  currentSnapshotFingerprint,
  today = null,
) {
  const slugEntries = baselineEntries.filter((e) => e.slug === slug);

  if (slugEntries.length === 0) {
    return {
      tagged: issues.map((i) => ({ ...i })),
      invalidated: false,
      matchedKeys: new Set(),
    };
  }

  // Page-level invalidation: any fingerprint mismatch invalidates the entire page
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

  // Build a key index of slug entries
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
      const entry = entryKeyIndex.get(key);
      matchedKeys.add(key);
      const taggedIssue = {
        ...issue,
        baselined: true,
        baselineReviewAfter: entry.reviewAfter,
      };
      if (isBaselineExpired(entry, today)) {
        taggedIssue.baselineExpired = true;
      } else if (isBaselineExpiringSoon(entry, today)) {
        taggedIssue.baselineExpiringSoon = true;
      }
      return taggedIssue;
    }
    return { ...issue };
  });

  return { tagged, invalidated: false, matchedKeys };
}

/**
 * Issue #247 post-merge — tagIssuesWithBaseline の `matchedKeys` を使って
 * 「runtime に一致する issue が無かった baseline entry」= orphan を返す
 * 純粋関数。detector/emitter が仕様変更したときに legacy entry が
 * 取り残されるパターン(PR5 migration で `segment-inconclusive` が 3 slug
 * 分残った件)を可視化する。
 *
 * 呼び出し側の契約:
 *   - page-level invalidation (fingerprint mismatch) 時は `matchedKeys` が
 *     空になり、全 entry が「unmatched」として返るが、それは orphan では
 *     ない (snapshot 更新に伴う invalidation)。呼び出し側が
 *     `tagIssuesWithBaseline` の `invalidated` フラグを見て orphan 集計を
 *     スキップすること。
 *   - helper 自体は entries 配列と matchedKeys Set を機械的に突き合わせ
 *     るのみで、invalidation 状態や checked/unchecked の概念を持たない。
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
