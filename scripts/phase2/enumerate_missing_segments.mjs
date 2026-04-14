#!/usr/bin/env node
/**
 * Phase 2.2 / 共通: `segment-missing` 残件の enumerate。
 *
 * `parity-baseline.json` の現物から `segment-missing` entries を抽出し、slug 別に
 * 降順 (entry 数) で並べる。任意で Phase 2.1 の Top 2 slug (`editing-tests/steps`
 * など、別 lane 管理) を除外できる。
 *
 * 出力項目 (per entry):
 *   - slug
 *   - sectionPath
 *   - segmentKind (paragraph / table-cell / ordered-list-item / unordered-list-item / callout-body / etc.)
 *   - enSegmentIndex
 *   - detail (inconclusiveReason ?? usabilityReason)
 *
 * 同 slug に `segment-token-gap` がある場合は参考情報として併記 (Phase 2.2 agent が
 * 統合修正すべきかの判断材料)。
 *
 * Usage:
 *   node scripts/phase2/enumerate_missing_segments.mjs                        # all segment-missing
 *   node scripts/phase2/enumerate_missing_segments.mjs --exclude-top2         # Phase 2.1 scope 除外
 *   node scripts/phase2/enumerate_missing_segments.mjs > /tmp/phase2-2-tasklist.md
 */

import { loadBaseline } from './lib/baseline.mjs';

const EXCLUDE_TOP2 = process.argv.includes('--exclude-top2');

const TOP2_SLUGS = new Set([
  'editing-tests/steps',
  'editing-tests/editing-your-tests/editing-a-steps-properties',
]);

const baseline = loadBaseline();

const allMissing = baseline.entries.filter(
  (e) => e.issueType === 'segment-missing',
);
const allTokenGap = baseline.entries.filter(
  (e) => e.issueType === 'segment-token-gap',
);

const filtered = EXCLUDE_TOP2
  ? allMissing.filter((e) => !TOP2_SLUGS.has(e.slug))
  : allMissing;

// slug 単位で集計、entry 数降順
const bySlug = new Map();
for (const e of filtered) {
  if (!bySlug.has(e.slug)) bySlug.set(e.slug, []);
  bySlug.get(e.slug).push(e);
}
const sortedSlugs = [...bySlug.entries()].sort((a, b) => b[1].length - a[1].length);

// slug ごとの token-gap 件数も参照
const tokenGapBySlug = new Map();
for (const e of allTokenGap) {
  tokenGapBySlug.set(e.slug, (tokenGapBySlug.get(e.slug) ?? 0) + 1);
}

// segmentKind 集計
const kindCount = new Map();
for (const e of filtered) {
  kindCount.set(e.segmentKind, (kindCount.get(e.segmentKind) ?? 0) + 1);
}

// Markdown 出力
const lines = [];
lines.push(
  `# Phase 2.2 segment-missing 対象一覧${EXCLUDE_TOP2 ? ' (--exclude-top2)' : ''}`,
);
lines.push('');
lines.push(`対象: ${filtered.length} entries / ${bySlug.size} slugs`);
lines.push(`(全 segment-missing: ${allMissing.length} entries / ${new Set(allMissing.map((e) => e.slug)).size} slugs)`);
lines.push('');

lines.push('## segmentKind 内訳');
lines.push('');
for (const [kind, c] of [...kindCount.entries()].sort((a, b) => b[1] - a[1])) {
  lines.push(`- \`${kind}\`: ${c}`);
}
lines.push('');

lines.push('## slug 別 (entry 数降順)');
lines.push('');

for (const [slug, entries] of sortedSlugs) {
  const tgCount = tokenGapBySlug.get(slug) ?? 0;
  const tgNote = tgCount > 0 ? ` — **+ ${tgCount} segment-token-gap** (統合修正推奨)` : '';
  lines.push(`### ${slug} (${entries.length} entries${tgNote})`);
  lines.push(`- EN snapshot: \`snapshots/en/content/${slug}.html\``);
  lines.push(`- JA file: \`src/content/docs/${slug}.md\``);
  for (const e of entries) {
    const detail = e.inconclusiveReason ?? e.usabilityReason ?? '';
    const detailPart = detail ? ` (detail: ${detail})` : '';
    lines.push(
      `- section "${e.sectionPath || '(preface)'}" segmentKind=\`${e.segmentKind}\` enSegmentIndex=${e.enSegmentIndex}${detailPart}`,
    );
  }
  lines.push('');
}

console.log(lines.join('\n'));
