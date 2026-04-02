/**
 * migrate-links.mjs — One-time migration: convert basename links to path-based links.
 *
 * Usage:
 *   node scripts/migrate-links.mjs              # dry-run (report only)
 *   node scripts/migrate-links.mjs --write      # apply changes
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSlugIndex } from './lib/project.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOCS_DIR = path.resolve(__dirname, '..', 'src', 'content', 'docs');

// ---------------------------------------------------------------------------
// Build basename → pathSlug lookup
// ---------------------------------------------------------------------------
function buildBasenameToPathMap(docsDir = DOCS_DIR) {
  const slugIndex = buildSlugIndex(docsDir);
  /** @type {Map<string, string | null>} */
  const map = new Map();
  for (const slug of Object.keys(slugIndex)) {
    const bn = slug.split('/').pop();
    if (map.has(bn)) {
      map.set(bn, null); // ambiguous
    } else {
      map.set(bn, slug);
    }
  }
  return map;
}

// ---------------------------------------------------------------------------
// Strip code blocks, inline code & HTML comments to avoid replacing links inside them
// ---------------------------------------------------------------------------
function buildCodeMask(content) {
  // Returns an array of [start, end] ranges that are inside code
  const ranges = [];
  // Fenced code blocks
  const fencedRe = /^```[^\n]*\n[\s\S]*?^```/gm;
  let m;
  while ((m = fencedRe.exec(content)) !== null) {
    ranges.push([m.index, m.index + m[0].length]);
  }
  // Inline code (must not span newlines)
  const inlineRe = /`[^`\n]+`/g;
  while ((m = inlineRe.exec(content)) !== null) {
    ranges.push([m.index, m.index + m[0].length]);
  }
  // HTML comments
  const commentRe = /<!--[\s\S]*?-->/g;
  while ((m = commentRe.exec(content)) !== null) {
    ranges.push([m.index, m.index + m[0].length]);
  }
  return ranges;
}

function isInCodeRange(pos, ranges) {
  return ranges.some(([start, end]) => pos >= start && pos < end);
}

// ---------------------------------------------------------------------------
// Main migration logic
// ---------------------------------------------------------------------------
function migrateFile(filePath, basenameToPath, write) {
  const content = fs.readFileSync(filePath, 'utf8');
  const codeRanges = buildCodeMask(content);
  const replacements = [];

  // Pattern A: Markdown links [text](/docs/{basename}#fragment)
  const mdRe = /\]\(\/docs\/([a-z0-9_-]+)(#[^)]+)?\)/g;
  let match;
  while ((match = mdRe.exec(content)) !== null) {
    if (isInCodeRange(match.index, codeRanges)) continue;
    const basename = match[1];
    // Skip if it already looks path-based (contains /)
    if (basename.includes('/')) continue;
    const resolved = basenameToPath.get(basename);
    if (resolved === undefined) continue; // not in index — leave as-is
    if (resolved === null) {
      // Ambiguous — report as error
      replacements.push({ type: 'AMBIGUOUS', basename, index: match.index, original: match[0] });
      continue;
    }
    const fragment = match[2] || '';
    const original = match[0];
    const replacement = `](/docs/${resolved}${fragment})`;
    if (original !== replacement) {
      replacements.push({ type: 'REPLACE', index: match.index, original, replacement, basename });
    }
  }

  // Pattern B: HTML <a href="/docs/{basename}#fragment">
  const htmlRe = /<a\b([^>]*?)href=["']\/docs\/([a-z0-9_-]+)(#[^\s"']*)?\s*["']/gi;
  while ((match = htmlRe.exec(content)) !== null) {
    if (isInCodeRange(match.index, codeRanges)) continue;
    const basename = match[2];
    if (basename.includes('/')) continue;
    const resolved = basenameToPath.get(basename);
    if (resolved === undefined) continue;
    if (resolved === null) {
      replacements.push({ type: 'AMBIGUOUS', basename, index: match.index, original: match[0] });
      continue;
    }
    const prefix = match[1];
    const fragment = match[3] || '';
    const original = match[0];
    // Reconstruct preserving the quote character used
    const quoteChar = original.includes("href='") ? "'" : '"';
    const replacement = `<a${prefix}href=${quoteChar}/docs/${resolved}${fragment}${quoteChar}`;
    if (original !== replacement) {
      replacements.push({ type: 'REPLACE', index: match.index, original, replacement, basename });
    }
  }

  if (replacements.length === 0) return { changed: false, count: 0, ambiguous: [] };

  const ambiguous = replacements.filter((r) => r.type === 'AMBIGUOUS');
  const toReplace = replacements.filter((r) => r.type === 'REPLACE');

  if (write && toReplace.length > 0) {
    // Apply replacements in reverse order to preserve indices
    let updated = content;
    const sorted = [...toReplace].sort((a, b) => b.index - a.index);
    for (const r of sorted) {
      updated = updated.slice(0, r.index) + r.replacement + updated.slice(r.index + r.original.length);
    }
    fs.writeFileSync(filePath, updated, 'utf8');
  }

  return { changed: toReplace.length > 0, count: toReplace.length, ambiguous };
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------
function main() {
  const args = process.argv.slice(2);
  const write = args.includes('--write');

  console.log(write ? '✏️  WRITE mode — files will be modified' : '🔍 DRY-RUN mode — no files will be changed (use --write to apply)');
  console.log();

  const basenameToPath = buildBasenameToPathMap();
  console.log(`Basename → path mappings: ${[...basenameToPath.values()].filter(Boolean).length} unique, ${[...basenameToPath.values()].filter((v) => v === null).length} ambiguous`);

  // Collect all .md files
  const files = [];
  const walk = (dir) => {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(full);
      else if (ent.isFile() && ent.name.endsWith('.md')) files.push(full);
    }
  };
  walk(DOCS_DIR);

  let totalFiles = 0;
  let totalLinks = 0;
  const allAmbiguous = [];

  for (const file of files) {
    const { changed, count, ambiguous } = migrateFile(file, basenameToPath, write);
    if (changed || ambiguous.length > 0) {
      const rel = path.relative(DOCS_DIR, file);
      if (count > 0) console.log(`  ${write ? '✓' : '→'} ${rel}: ${count} link(s)`);
      if (ambiguous.length > 0) {
        for (const a of ambiguous) {
          console.log(`  ⚠️  ${rel}: AMBIGUOUS basename "${a.basename}" — manual fix needed`);
        }
      }
      totalFiles += changed ? 1 : 0;
      totalLinks += count;
      allAmbiguous.push(...ambiguous.map((a) => ({ ...a, file })));
    }
  }

  console.log();
  console.log(`${write ? 'Updated' : 'Would update'}: ${totalLinks} link(s) in ${totalFiles} file(s)`);

  if (allAmbiguous.length > 0) {
    console.log(`\n❌ ${allAmbiguous.length} ambiguous basename(s) require manual resolution:`);
    for (const a of allAmbiguous) {
      console.log(`   ${path.relative(DOCS_DIR, a.file)}: "${a.basename}"`);
    }
    process.exit(1);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
