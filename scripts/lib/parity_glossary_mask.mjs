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
    try {
      const regex = new RegExp(regexMatch[1], 'g');
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
const CJK_RE = /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf\uff00-\uffef]/;

/**
 * After masking, decide whether the remaining text is (a) fully covered
 * (glossary + invariant + CJK only, no English prose) or (b) contains
 * untranslated English prose (= a bug).
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

  const { maskedText } = maskSegmentText(text);

  // Placeholder と inline code / URLs / backticks を除去して residue を見る
  const residue = maskedText
    .replace(new RegExp(GLOSSARY_PLACEHOLDER, 'g'), ' ')
    .replace(new RegExp(INVARIANT_PLACEHOLDER, 'g'), ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/\/docs\/\S+/g, ' ')
    .trim();

  const englishPortion = residue.replace(CJK_RE, ' ').trim();
  if (englishPortion.length < RESIDUE_MIN_LENGTH) {
    return { isFullyMasked: true, residue: '' };
  }
  const words = englishPortion.split(/\s+/).filter((w) => /[a-z]/i.test(w));
  if (words.length < RESIDUE_MIN_WORDS) {
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
