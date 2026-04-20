#!/usr/bin/env node
/**
 * check_glossary_duplicates.mjs — detect duplicate entries in docs/GLOSSARY.md.
 *
 * T21 (plan §3.2): main branch の 498 行から PR #291 head 2870 行へ 5.6x 肥大化し、
 * 同一 key 重複が多発（`Configuration Library` 4 回 / `Setup step` vs `Setup Step` /
 * `Add Custom Action` vs `Add custom action` 等）していたため、lint gate として導入。
 *
 * Duplicate policy:
 *   (a) Exact duplicate (byte-identical key) — hard error
 *   (b) Case-variant duplicate (same key modulo case) — hard error
 *   (c) Whitespace-normalized duplicate — hard error
 *
 * Usage:
 *   node scripts/check_glossary_duplicates.mjs          # lint mode, exit 2 on duplicate
 *   node scripts/check_glossary_duplicates.mjs --list   # list all duplicates without exit
 *
 * Exit codes:
 *   0 — no duplicates
 *   2 — duplicates found
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDirectRun } from '../lib/cli.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const GLOSSARY_PATH = path.join(ROOT, 'docs/GLOSSARY.md');

function parseGlossaryEntries(markdown) {
  const lines = markdown.split('\n');
  const entries = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Skip table header / separator / non-entry rows
    if (!line.startsWith('| ')) continue;
    if (line.startsWith('| --- ') || line.startsWith('| 用語 ')) continue;
    // Format: | term | description |
    const match = line.match(/^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|$/);
    if (!match) continue;
    const term = match[1].trim();
    // Skip obvious header rows
    if (term === '用語' || term === 'term') continue;
    entries.push({ line: i + 1, term, description: match[2].trim() });
  }
  return entries;
}

function normalizeKey(term) {
  return term.toLowerCase().replace(/\s+/g, ' ').trim();
}

function findDuplicates(entries) {
  const byNormalized = new Map();
  for (const entry of entries) {
    const key = normalizeKey(entry.term);
    if (!byNormalized.has(key)) byNormalized.set(key, []);
    byNormalized.get(key).push(entry);
  }
  const duplicates = [];
  for (const [key, group] of byNormalized) {
    if (group.length > 1) {
      duplicates.push({ normalizedKey: key, entries: group });
    }
  }
  return duplicates;
}

function main() {
  const args = process.argv.slice(2);
  const listMode = args.includes('--list');

  const md = fs.readFileSync(GLOSSARY_PATH, 'utf8');
  const entries = parseGlossaryEntries(md);
  const duplicates = findDuplicates(entries);

  if (duplicates.length === 0) {
    console.log(`OK: ${entries.length} entries, no duplicates detected.`);
    process.exit(0);
  }

  console.error(`DUPLICATES: ${duplicates.length} duplicate groups detected in ${GLOSSARY_PATH}`);
  for (const dup of duplicates) {
    console.error(`\n  "${dup.normalizedKey}" (${dup.entries.length} occurrences):`);
    for (const e of dup.entries) {
      console.error(`    L${e.line}: | ${e.term} | ${e.description} |`);
    }
  }
  console.error(
    `\nResolution: merge duplicates into 1 entry (pick the most precise description and delete the rest).`,
  );
  if (listMode) process.exit(0);
  process.exit(2);
}

if (isDirectRun(import.meta.url)) {
  main();
}

export { parseGlossaryEntries, normalizeKey, findDuplicates };
