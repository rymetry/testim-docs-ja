import fs from 'node:fs';
import path from 'node:path';
import { extractSegmentsFromMarkdown } from './lib/source_parity_segments_ja.mjs';
import { classifySegment, __clearCaches } from './lib/parity_glossary_mask.mjs';
__clearCaches();

const baseline = JSON.parse(fs.readFileSync('parity-baseline.json', 'utf8'));
const advedSlugs = new Set(
  baseline.entries
    .filter((e) => e.slug.startsWith('advanced-editing/'))
    .map((e) => e.slug),
);

const ACTIVE_KINDS = new Set([
  'ordered-list-item',
  'unordered-list-item',
  'paragraph',
  'callout-body',
  'table-cell',
  'details-summary',
]);

const bySlug = {};
for (const slug of advedSlugs) {
  const mdPath = path.join('src/content/docs', `${slug}.md`);
  if (!fs.existsSync(mdPath)) continue;
  const md = fs.readFileSync(mdPath, 'utf8');
  const segments = extractSegmentsFromMarkdown(md);
  const flagged = [];
  for (const seg of segments) {
    if (!ACTIVE_KINDS.has(seg.segmentKind)) continue;
    const cls = classifySegment(seg.textNorm);
    if (!cls.isFullyMasked) {
      flagged.push({
        section: seg.sectionPath,
        kind: seg.segmentKind,
        idx: seg.segmentIndex,
        line: seg.line,
        text: seg.textNorm.slice(0, 250),
        residue: cls.residue.slice(0, 200),
      });
    }
  }
  if (flagged.length > 0) bySlug[slug] = flagged;
}

const sorted = Object.entries(bySlug).sort((a, b) => b[1].length - a[1].length);
for (const [slug, flagged] of sorted) {
  console.log(`\n=== ${slug} (${flagged.length}) ===`);
  for (const f of flagged) {
    console.log(`  L${f.line} ${f.kind}#${f.idx} [${f.section}]`);
    console.log(`    text: ${f.text}`);
    console.log(`    res:  ${f.residue}`);
  }
}
console.log('\nTotal flagged:', sorted.reduce((s, [_, v]) => s + v.length, 0));
