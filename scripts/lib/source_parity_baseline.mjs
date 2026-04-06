/**
 * Frozen baseline mechanism for Issue #225 Phase 6A.
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

/**
 * Phase 6A で baseline 対象になる issue type。
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
  ]),
);

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
    if (entry.issueType === 'segment-inconclusive') {
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
    } else {
      // segment-missing / segment-shifted / segment-token-gap
      if (typeof entry.enSegmentIndex !== 'number') {
        throw new Error(
          `${prefix}: ${entry.issueType} entry must have numeric enSegmentIndex (EN-owned diff)`,
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
 * Key rules (locked-in for Phase 6A):
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
  if (issue.type === 'segment-inconclusive') {
    return `${slug}|${issue.type}|category=${issue.inconclusiveCategory ?? '_null_'}`;
  }
  if (JA_OWNED_TYPES.has(issue.type)) {
    return (
      `${slug}|${issue.type}|${issue.sectionPath ?? ''}|${issue.segmentKind ?? ''}|ja|` +
      `${issue.jaSegmentIndex ?? '_null_'}`
    );
  }
  return (
    `${slug}|${issue.type}|${issue.sectionPath ?? ''}|${issue.segmentKind ?? ''}|en|` +
    `${issue.enSegmentIndex ?? '_null_'}`
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
  if (entry.issueType === 'segment-inconclusive') {
    return `${entry.slug}|${entry.issueType}|category=${entry.inconclusiveCategory ?? '_null_'}`;
  }
  if (JA_OWNED_TYPES.has(entry.issueType)) {
    return (
      `${entry.slug}|${entry.issueType}|${entry.sectionPath ?? ''}|${entry.segmentKind ?? ''}|ja|` +
      `${entry.jaSegmentIndex ?? '_null_'}`
    );
  }
  return (
    `${entry.slug}|${entry.issueType}|${entry.sectionPath ?? ''}|${entry.segmentKind ?? ''}|en|` +
    `${entry.enSegmentIndex ?? '_null_'}`
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
 * @returns {{ tagged: object[], invalidated: boolean, matchedKeys: Set<string> }}
 */
export function tagIssuesWithBaseline(slug, issues, baselineEntries, currentSnapshotFingerprint) {
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
      matchedKeys.add(key);
      return { ...issue, baselined: true };
    }
    return { ...issue };
  });

  return { tagged, invalidated: false, matchedKeys };
}
