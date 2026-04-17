// scripts/lib/parity_glossary_mask.mjs
/**
 * Glossary + invariant pattern masker for parity detection.
 *
 * Reads docs/GLOSSARY.md and docs/INVARIANT_TOKENS.md, masks segment text
 * against the union of glossary terms and invariant patterns. Returns both
 * masked text and a per-match record (source, entry/pattern, span) for
 * debug.maskCoverage emission.
 *
 * @module parity_glossary_mask
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, '../..');

const GLOSSARY_PATH = join(REPO_ROOT, 'docs/GLOSSARY.md');
const INVARIANT_PATH = join(REPO_ROOT, 'docs/INVARIANT_TOKENS.md');

let glossaryCache = null;
let patternsCache = null;

/**
 * Parses docs/GLOSSARY.md and returns a Set of canonical terms.
 * Extracts leading table-cell text from any "| term | ... |" row under any
 * `## ` heading, ignoring backtick-wrapped code cells and header separators.
 */
export function loadGlossary() {
  if (glossaryCache) return glossaryCache;
  const md = readFileSync(GLOSSARY_PATH, 'utf8');
  const terms = new Set();
  const lines = md.split('\n');
  let inTable = false;
  let skipSeparator = false;
  for (const line of lines) {
    if (line.startsWith('## ')) {
      inTable = false;
      continue;
    }
    if (line.startsWith('|') && line.includes('|')) {
      if (!inTable) {
        inTable = true;
        skipSeparator = true;
        continue; // header row
      }
      if (skipSeparator) {
        skipSeparator = false;
        continue; // separator row
      }
      const cells = line.split('|').map((c) => c.trim());
      const raw = cells[1] ?? '';
      if (!raw) continue;
      const term = raw.replace(/^`|`$/g, '').trim();
      if (term.length > 0) terms.add(term);
    } else {
      inTable = false;
    }
  }
  glossaryCache = terms;
  return terms;
}

/**
 * Parses docs/INVARIANT_TOKENS.md and returns [{ id, regex }] for each pattern.
 * Expects sections named `## <id>` with a table containing `id` / `regex` rows.
 */
export function loadInvariantPatterns() {
  if (patternsCache) return patternsCache;
  const md = readFileSync(INVARIANT_PATH, 'utf8');
  const patterns = [];
  const sections = md.split(/^## /m).slice(1);
  for (const section of sections) {
    const firstLine = section.split('\n')[0].trim();
    if (!firstLine || firstLine === '登録手順') continue;
    const id = firstLine;
    const regexMatch = section.match(/\|\s*regex\s*\|\s*`(.+?)`\s*\|/);
    if (!regexMatch) continue;
    const flagsMatch = section.match(/\|\s*flags\s*\|\s*`(.+?)`\s*\|/);
    const baseFlags = flagsMatch ? flagsMatch[1] : '';
    const flags = baseFlags.includes('g') ? baseFlags : baseFlags + 'g';
    try {
      const regex = new RegExp(regexMatch[1], flags);
      patterns.push({ id, regex });
    } catch {
      // invalid regex — skip (will be caught by tests)
    }
  }
  patternsCache = patterns;
  return patterns;
}

// Test 用 cache クリア
export function __clearCaches() {
  glossaryCache = null;
  patternsCache = null;
}

const GLOSSARY_PLACEHOLDER = '__GLOSSARY__';
const INVARIANT_PLACEHOLDER = '__INVARIANT__';

/**
 * Mask glossary terms and invariant patterns in text, returning both the
 * masked string and a list of mask records.
 *
 * Process order: longest glossary terms first (to handle multi-word matches
 * before single-word substrings), then invariant patterns applied to remainder.
 */
export function maskSegmentText(text) {
  if (typeof text !== 'string' || text.length === 0) {
    return { maskedText: text, masks: [] };
  }

  const glossary = loadGlossary();
  const patterns = loadInvariantPatterns();
  const masks = [];

  const sortedTerms = [...glossary].sort((a, b) => b.length - a.length);

  let masked = text;
  for (const term of sortedTerms) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp('\\b' + escaped + '\\b', 'gi');
    for (const match of masked.matchAll(re)) {
      masks.push({
        source: 'glossary',
        entry: term,
        span: { start: match.index, end: match.index + match[0].length },
      });
    }
    masked = masked.replace(re, GLOSSARY_PLACEHOLDER);
  }

  for (const { id, regex } of patterns) {
    const localRe = new RegExp(regex.source, regex.flags);
    for (const match of masked.matchAll(localRe)) {
      if (match[0].length === 0) continue;
      masks.push({
        source: 'invariant-pattern',
        pattern: id,
        span: { start: match.index, end: match.index + match[0].length },
      });
    }
    masked = masked.replace(new RegExp(regex.source, regex.flags), INVARIANT_PLACEHOLDER);
  }

  return { maskedText: masked, masks };
}

const RESIDUE_MIN_WORDS = 3;
const RESIDUE_MIN_LENGTH = 15;
const CJK_RE = /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf\uff00-\uffef]/g;

/**
 * §5.3.7: technical-vocabulary residue allowlist.
 *
 * After the §5.3.6 preStrip backtick fix and §5.3.7 CJK_RE `g`-flag fix, the
 * classifier correctly strips CJK globally instead of only the first match.
 * That fix surfaced 30+ latent false-positives across 15 slugs where JA
 * textNorm contains short enum / technical-token lists separated by CJK
 * punctuation (e.g. `xhr、js、css、img、media、font、doc、ws、manifest`). After
 * CJK strip these collapse into residues like `xhr js css img media font doc
 * ws manifest` (9 English "words") that trigger the `RESIDUE_MIN_WORDS=3`
 * threshold despite being legitimate untranslatable technical vocabulary
 * (HTTP request types, accessibility severity levels, visual match levels,
 * etc.).
 *
 * Resolution (§5.3.7): define a deterministic allowlist of short technical
 * tokens that appear in Testim docs as invariant enum values. During residue
 * word-counting, classify each word as either "allowlisted tech token" or
 * "potential English prose". The `RESIDUE_MIN_WORDS` threshold is then
 * applied to the NON-allowlisted count, so enum-only residues are absorbed
 * while genuine untranslated prose ("choose integrate any other application
 * you don't find in the gallery ...") still crosses the threshold.
 *
 * Allowlist categories (each category documents its source/justification):
 *
 *  - **http-request-type**: filter types in DevTools Network panel — matches
 *    the exact enum options shown in Testim's network-logs UI
 *    (`XHR|JS|CSS|Img|Media|Font|Doc|WS|Manifest`). See
 *    `src/content/docs/results/test-results/network-logs.md`.
 *  - **accessibility-severity**: axe-core severity levels
 *    (`critical|serious|moderate|minor`). See
 *    `src/content/docs/advanced-editing/validations/accessibility-validations.md`.
 *  - **visual-match-level**: Applitools Eyes visual comparison levels
 *    (`exact|strict|content|layout`). See
 *    `src/content/docs/advanced-editing/validations/pixel-validation-and-pixel-wait-for.md`.
 *  - **log-level**: console/log levels (`verbose|info|warning|error`). See
 *    `src/content/docs/debugging-tests/debug-helper-panels.md`.
 *  - **file-format-token**: common document file formats
 *    (`csv|jpg|ppt|pdf|xls|image|doc`). See
 *    `src/content/docs/advanced-editing/validations/validate-download.md`.
 *  - **release-channel**: browser/product release channel names
 *    (`beta|dev|canary|stable`). See
 *    `src/content/docs/recording-tests/how-to-record-a-test.md`.
 *  - **salesforce-edition**: Salesforce license editions
 *    (`enterprise|performance|unlimited|developer|professional|essentials`).
 *    See `src/content/docs/salesforce-testing/troubleshoot.md`.
 *  - **html-attribute-name**: common HTML attribute names as cited in
 *    attribute-validation docs (`src|alt|href|title|disabled`). See
 *    `src/content/docs/advanced-editing/validations/html-attribute-validation.md`.
 *  - **status-enum**: test status enum values from qtest / test-runs UI
 *    (`passed|failed|skipped|blocked`). See
 *    `src/content/docs/integrations/test-management-integrations/qtest-integration.md`,
 *    `src/content/docs/results/test-runs.md`.
 *  - **keyboard-key-word**: keyboard key names appearing as a **list** outside
 *    the `keyboard-shortcut` invariant pattern (which requires `+` composition)
 *    (`enter|tab|esc|page|up|down`). See
 *    `src/content/docs/editing-tests/steps.md`.
 *  - **api-component**: generic API request component names
 *    (`body|header|status|code`). See
 *    `src/content/docs/advanced-editing/api-testing.md`.
 *
 * Scope lock (§5.3.7):
 * - Allowlist ONLY masks words when evaluating the
 *   `RESIDUE_MIN_WORDS` threshold; it does NOT mask them in `maskSegmentText`
 *   output (no impact on `debug.maskCoverage` shape).
 * - Allowlist does NOT interact with URL-before-mask ordering (PR #293)
 *   or preStrip backtick handling (§5.3.6).
 * - Adding new tokens is L2-gated via `docs/PARITY_GUIDE.md §5.3.7`:
 *   document the source slug and enum domain before adding.
 * - Single-character noise (punctuation artifacts like lone `x` / `v`) is
 *   also filtered here: words with length < 2 are not counted as English
 *   prose (they're almost always CJK-strip aftermath).
 */
const TECH_TOKEN_ALLOWLIST = new Set([
  // http-request-type (Testim network-logs filter enum)
  'xhr',
  'js',
  'css',
  'img',
  'media',
  'font',
  'doc',
  'ws',
  'manifest',
  // accessibility-severity (axe-core)
  'critical',
  'serious',
  'moderate',
  'minor',
  // visual-match-level (Applitools Eyes)
  'exact',
  'strict',
  'content',
  'layout',
  // log-level
  'verbose',
  'info',
  'warning',
  'error',
  // file-format-token
  'csv',
  'jpg',
  'ppt',
  'pdf',
  'xls',
  'image',
  // 'doc' already in http-request-type
  // release-channel
  'beta',
  'dev',
  'canary',
  'stable',
  // salesforce-edition
  'enterprise',
  'performance',
  'unlimited',
  'developer',
  'professional',
  'essentials',
  // html-attribute-name
  'src',
  'alt',
  'href',
  'title',
  'disabled',
  // status-enum
  'passed',
  'failed',
  'skipped',
  'blocked',
  // keyboard-key-word (list-context, not keyboard-shortcut invariant)
  'enter',
  'tab',
  'esc',
  'page',
  'up',
  'down',
  // api-component
  'body',
  'header',
  'status',
  'code',
]);

/**
 * @param {string} word lowercase residue word (already CJK-stripped)
 * @returns {boolean} true if the word is either a single-char/punctuation
 *   artifact OR a known technical-vocabulary token (does not count toward
 *   prose threshold).
 *
 * Single-alpha-char artifacts include enumeration markers `a.` / `b.` / `c.`
 * and single letters like `x` / `v` used as status symbols in tables. Real
 * English prose words contain ≥2 alphabetic characters (even 2-letter
 * function words like `is` / `to` / `of` / `in` / `at` qualify, allowing
 * genuine untranslated prose detection to remain sensitive).
 */
function isTechVocabularyResidue(word) {
  // Strip leading/trailing non-alpha punctuation (e.g. "a." -> "a").
  const alphaOnly = word.replace(/[^a-z]/gi, '');
  if (alphaOnly.length < 2) return true;
  return TECH_TOKEN_ALLOWLIST.has(word) || TECH_TOKEN_ALLOWLIST.has(alphaOnly.toLowerCase());
}

/**
 * After masking, decide whether the remaining text is (a) fully covered
 * (glossary + invariant + CJK only, no English prose) or (b) contains
 * untranslated English prose (= a bug).
 *
 * Ordering contract: inline code / markdown links / autolinks / bare URLs /
 * `/docs` links are stripped **before** glossary + invariant masking.
 * Otherwise glossary terms embedded inside URLs (e.g. `https`, `ios`) are
 * consumed by the glossary matcher first, defeating the URL regex applied
 * afterwards and leaving English fragments (`byby.dev`, `open.spotify.com`
 * 等) in the residue — a deterministic false-positive pattern for
 * callout-body / paragraph segments that embed external references.
 */
export function classifySegment(text) {
  if (typeof text !== 'string' || text.length === 0) {
    return { isFullyMasked: true, residue: '' };
  }

  // ASCII 英字が全くなければ翻訳の問題はない
  const stripped = text.trim();
  const hasAscii = /[a-zA-Z]/.test(stripped);
  if (!hasAscii) {
    return { isFullyMasked: true, residue: '' };
  }

  // Pre-strip link/code/URL atoms BEFORE masking. The maskSegmentText
  // preserves raw tokens for fingerprinting elsewhere; the stripping here is
  // classifier-local and does not leak back to callers.
  //
  // Inline code: GFM 準拠で **double-backtick pair** (``code``) を alternation
  // で single より先に消費する。double-pair は内部に single backtick を含み
  // 得る (GFM §code-spans) ため negative-lookahead `` `(?!`) `` で
  // consecutive backtick だけを exclude する。旧実装 `/`[^`]*`/g` は先頭の
  // `` (空の single pair) に最長一致を譲って 2 個目以降の content が residue
  // に残り、backtick strip が実質 no-op になるケースがあった (§5.3.6 bug 1)。
  const preStripped = text
    .replace(/``(?:[^`]|`(?!`))*``|`[^`]*`/g, ' ') // inline code (GFM double + single)
    .replace(/\[[^\]]*\]\([^)]*\)/g, ' ') // markdown link [label](url)
    .replace(/<https?:\/\/[^>]+>/g, ' ') // GFM autolink
    .replace(/https?:\/\/\S+/g, ' ') // bare URL
    .replace(/\/docs\/\S+/g, ' '); // internal /docs link

  const { maskedText } = maskSegmentText(preStripped);

  const residue = maskedText
    .replace(new RegExp(GLOSSARY_PLACEHOLDER, 'g'), ' ')
    .replace(new RegExp(INVARIANT_PLACEHOLDER, 'g'), ' ')
    .trim();

  const englishPortion = residue.replace(CJK_RE, ' ').trim();
  if (englishPortion.length < RESIDUE_MIN_LENGTH) {
    return { isFullyMasked: true, residue: '' };
  }
  const words = englishPortion.split(/\s+/).filter((w) => /[a-z]/i.test(w));
  if (words.length < RESIDUE_MIN_WORDS) {
    return { isFullyMasked: true, residue: '' };
  }

  // §5.3.7: if the ORIGINAL text contains no CJK characters, the segment is
  // (by construction) pure English — apply the classic threshold without the
  // tech-vocabulary allowlist. A pure-EN segment like "Press Enter key" must
  // still be flagged as untranslated so that `enter` / `tab` appearing in
  // the allowlist does not silently bypass the Spec Invariant 5 guard
  // (`GLOSSARY common-word false-negative regression` — see plan §3.2 T4).
  // The allowlist mechanism is ONLY relevant for mixed JA+EN segments where
  // the residue after CJK strip consists of enum/tech-token lists embedded
  // in otherwise-translated prose.
  const hasCjk = /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf\uff00-\uffef]/.test(
    text,
  );
  if (!hasCjk) {
    return { isFullyMasked: false, residue: englishPortion };
  }

  // §5.3.7: filter out single-char noise and technical-vocabulary allowlist
  // tokens before applying the prose-threshold. Words that pass through this
  // filter are candidate "English prose" words — if fewer than
  // RESIDUE_MIN_WORDS remain, the segment is considered fully masked.
  // See TECH_TOKEN_ALLOWLIST comment above for rationale.
  const proseWords = words.filter((w) => !isTechVocabularyResidue(w.toLowerCase()));
  if (proseWords.length < RESIDUE_MIN_WORDS) {
    return { isFullyMasked: true, residue: '' };
  }

  return { isFullyMasked: false, residue: englishPortion };
}

/**
 * Mask coverage collector — 各 segment の mask 結果を集約する stateful
 * utility。check_source_parity.mjs が run 単位で create し、align 側から
 * record で記録、run 終了後に toJSON() で debug.maskCoverage を得る。
 */
export function createMaskCoverage() {
  const entries = [];
  const byGlossary = new Map();
  const byPattern = new Map();
  return {
    record({ slug, segmentKind, sectionPath, masks }) {
      if (!Array.isArray(masks) || masks.length === 0) return;
      entries.push({ slug, segmentKind, sectionPath, masks });
      for (const m of masks) {
        if (m.source === 'glossary') {
          byGlossary.set(m.entry, (byGlossary.get(m.entry) ?? 0) + 1);
        } else if (m.source === 'invariant-pattern') {
          byPattern.set(m.pattern, (byPattern.get(m.pattern) ?? 0) + 1);
        }
      }
    },
    toJSON() {
      return {
        maskedSegments: entries,
        summary: {
          segmentsMasked: entries.length,
          byGlossaryEntry: Object.fromEntries(byGlossary),
          byInvariantPattern: Object.fromEntries(byPattern),
        },
      };
    },
  };
}
