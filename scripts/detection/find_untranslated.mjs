/**
 * find_untranslated.mjs — Find untranslated English text in JA files.
 *
 * Usage:
 *   node scripts/find_untranslated.mjs [--slug=<slug>] [--limit=<N>]
 *
 * Exit codes:
 *   0 — 正常終了（0 件も含む）
 *   2 — --slug 明示指定で対象ファイル不在、または trust-boundary 違反（T8 / T17）
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { classifySegment } from '../lib/parity_glossary_mask.mjs';
import { isDirectRun } from '../lib/cli.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DOCS_DIR = path.join(ROOT, 'src', 'content', 'docs');
const BASELINE_PATH = path.join(ROOT, 'parity-baseline.json');

function resolveSafeSlugPath(slug) {
  const resolved = path.resolve(DOCS_DIR, slug + '.md');
  const docsPrefix = DOCS_DIR + path.sep;
  if (!resolved.startsWith(docsPrefix)) return null;
  return resolved;
}

export function splitMarkdownBlocks(markdown) {
  const lines = markdown.split('\n');
  let bodyStart = 0;
  if (lines[0]?.trim() === '---') {
    const fmEnd = lines.indexOf('---', 1);
    if (fmEnd > 0) bodyStart = fmEnd + 1;
  }

  const blocks = [];
  let current = [];
  let start = bodyStart;

  for (let i = bodyStart; i <= lines.length; i++) {
    const line = i < lines.length ? lines[i] : '';
    const trimmed = line.trim();
    const isBoundary =
      trimmed === '' ||
      trimmed.startsWith('#') ||
      trimmed.startsWith('![') ||
      trimmed.startsWith('```') ||
      trimmed.startsWith(':::') ||
      i === lines.length;

    if (isBoundary) {
      if (current.length > 0) {
        blocks.push({ lineStart: start + 1, lineEnd: i, lines: current.slice() });
      }
      current = [];
      start = i + 1;
    } else {
      if (current.length === 0) start = i;
      current.push(line);
    }
  }
  return blocks;
}

export function findUntranslatedBlocks(blocks) {
  const findings = [];
  for (const block of blocks) {
    const text = block.lines.join(' ').trim();
    if (text.length === 0) continue;
    const cls = classifySegment(text);
    if (!cls.isFullyMasked) {
      findings.push({ ...block, residue: cls.residue });
    }
  }
  return findings;
}

export function printFindings(slug, filePath, findings) {
  if (findings.length === 0) return;
  console.log(`\n=== ${slug} (${findings.length} blocks) ===`);
  console.log(`    ${filePath}`);
  for (const f of findings) {
    console.log(`  L${f.lineStart}-${f.lineEnd}: [residue: ${f.residue.substring(0, 80)}]`);
    const preview = f.lines.slice(0, 2).join('\n');
    console.log(`    ${preview.substring(0, 120)}`);
  }
}

function main() {
  const args = process.argv.slice(2);
  const slugArg = args.find((a) => a.startsWith('--slug='));
  const slugFilter = slugArg ? slugArg.slice('--slug='.length) : null;
  const limitArg = args.find((a) => a.startsWith('--limit='));
  const limit = parseInt(limitArg ? limitArg.slice('--limit='.length) : '0', 10);

  const baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'));
  const untranslatedSlugs = new Set(
    baseline.entries
      .filter((e) => e.issueType === 'segment-untranslated')
      .map((e) => e.slug),
  );
  if (untranslatedSlugs.size === 0 && !slugFilter) {
    console.warn('WARN: baseline contains no segment-untranslated entries — nothing to scan.');
  }

  const slugs = slugFilter ? [slugFilter] : [...untranslatedSlugs].sort();

  let totalFound = 0;
  let filesProcessed = 0;

  for (const slug of slugs) {
    const filePath = resolveSafeSlugPath(slug);
    if (!filePath) {
      console.error(`REJECT: "${slug}" outside docs dir (trust boundary)`);
      process.exit(2);
    }
    if (!fs.existsSync(filePath)) {
      if (slugFilter) {
        console.error(`FAIL: ${filePath} not found (--slug explicitly specified)`);
        process.exit(2);
      }
      console.error(`SKIP: ${filePath} not found`);
      continue;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const blocks = splitMarkdownBlocks(content);
    const findings = findUntranslatedBlocks(blocks);

    if (findings.length > 0) {
      filesProcessed++;
      totalFound += findings.length;
      printFindings(slug, filePath, findings);
    }
    if (limit > 0 && filesProcessed >= limit) break;
  }

  console.log(
    `\n--- Total: ${totalFound} untranslated blocks in ${filesProcessed} files ---`,
  );
}

if (isDirectRun(import.meta.url)) {
  main();
}
