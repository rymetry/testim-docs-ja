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

export function maskSegmentText(_text) {
  throw new Error('not implemented');
}

export function classifySegment(_text) {
  throw new Error('not implemented');
}
