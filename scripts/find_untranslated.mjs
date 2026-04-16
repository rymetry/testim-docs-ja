/**
 * find_untranslated.mjs — Find untranslated English text in JA files
 *
 * Usage:
 *   node scripts/find_untranslated.mjs [--slug=<slug>] [--limit=<N>]
 *
 * Outputs each untranslated line with file path and line number.
 */
import fs from 'node:fs';
import path from 'node:path';
import { classifySegment } from './lib/parity_glossary_mask.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const DOCS_DIR = path.join(ROOT, 'src', 'content', 'docs');
const BASELINE_PATH = path.join(ROOT, 'parity-baseline.json');

const args = process.argv.slice(2);
const slugFilter = args.find(a => a.startsWith('--slug='))?.split('=')[1] || null;
const limit = parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] || '0', 10);

// Read baseline to get slugs with untranslated entries
const baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'));
const untranslatedSlugs = new Set(
  baseline.entries
    .filter(e => e.issueType === 'segment-untranslated')
    .map(e => e.slug)
);

const slugs = slugFilter
  ? [slugFilter]
  : [...untranslatedSlugs].sort();

let totalFound = 0;
let filesProcessed = 0;

for (const slug of slugs) {
  const filePath = path.join(DOCS_DIR, slug + '.md');
  if (!fs.existsSync(filePath)) {
    console.error(`SKIP: ${filePath} not found`);
    continue;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  // Skip frontmatter
  let bodyStart = 0;
  if (lines[0]?.trim() === '---') {
    const fmEnd = lines.indexOf('---', 1);
    if (fmEnd > 0) bodyStart = fmEnd + 1;
  }

  const findings = [];

  // Check each paragraph-like block
  let blockLines = [];
  let blockStart = bodyStart;

  for (let i = bodyStart; i <= lines.length; i++) {
    const line = i < lines.length ? lines[i] : '';
    const isEmpty = line.trim() === '';
    const isHeading = line.trim().startsWith('#');
    const isImage = line.trim().startsWith('![');
    const isCodeFence = line.trim().startsWith('```');
    const isCallout = line.trim().startsWith(':::');

    if (isEmpty || isHeading || isImage || isCodeFence || isCallout || i === lines.length) {
      if (blockLines.length > 0) {
        const blockText = blockLines.join(' ').trim();
        if (blockText.length > 0) {
          const cls = classifySegment(blockText);
          if (!cls.isFullyMasked && cls.residue.length > 0) {
            findings.push({
              lineStart: blockStart + 1,
              lineEnd: i,
              text: blockLines.join('\n'),
              residue: cls.residue,
            });
          }
        }
      }
      blockLines = [];
      blockStart = i + 1;
    } else {
      if (blockLines.length === 0) blockStart = i;
      blockLines.push(line);
    }
  }

  if (findings.length > 0) {
    filesProcessed++;
    console.log(`\n=== ${slug} (${findings.length} blocks) ===`);
    console.log(`    ${filePath}`);
    for (const f of findings) {
      totalFound++;
      console.log(`  L${f.lineStart}-${f.lineEnd}: [residue: ${f.residue.substring(0, 80)}]`);
      // Show first 2 lines of the block
      const preview = f.text.split('\n').slice(0, 2).join('\n');
      console.log(`    ${preview.substring(0, 120)}`);
    }
  }

  if (limit > 0 && filesProcessed >= limit) break;
}

console.log(`\n--- Total: ${totalFound} untranslated blocks in ${filesProcessed} files ---`);
