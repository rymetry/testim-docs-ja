#!/usr/bin/env node
/**
 * Phase 2.0: `segment-untranslated` 残件の enumerate。
 *
 * `parity-baseline.json` の現物から `segment-untranslated` entries を抽出し、
 * slug / segmentKind / sectionPath 別に集計。glossary 監査と翻訳 lane 分割の
 * 判断材料となるレポートを生成する。
 *
 * 出力:
 *   - segmentKind 内訳
 *   - Top N slugs (entry 数降順)
 *   - 各 slug の sectionPath / segmentKind / enSegmentIndex 詳細
 *   - 他 issueType との同居状況 (missing / token-gap / extra / structure)
 *
 * Usage:
 *   node scripts/phase2/enumerate_untranslated_residuals.mjs
 *   node scripts/phase2/enumerate_untranslated_residuals.mjs --top=20
 *   node scripts/phase2/enumerate_untranslated_residuals.mjs --slug=<slug>
 *   node scripts/phase2/enumerate_untranslated_residuals.mjs > /tmp/phase2-0-untranslated.md
 */

import { loadBaseline } from './lib/baseline.mjs';

const TOP_ARG = process.argv.find((a) => a.startsWith('--top='));
const TOP = TOP_ARG ? parseInt(TOP_ARG.slice('--top='.length), 10) : 30;

const SLUG_ARG = process.argv.find((a) => a.startsWith('--slug='));
const SLUG_FILTER = SLUG_ARG ? SLUG_ARG.slice('--slug='.length) : null;

const baseline = loadBaseline();

const allUntranslated = baseline.entries.filter(
  (e) => e.issueType === 'segment-untranslated',
);

const filtered = SLUG_FILTER
  ? allUntranslated.filter((e) => e.slug === SLUG_FILTER)
  : allUntranslated;

// 他 issueType の slug 情報
const coIssueBySlug = new Map();
for (const e of baseline.entries) {
  if (e.issueType === 'segment-untranslated') continue;
  if (!coIssueBySlug.has(e.slug)) coIssueBySlug.set(e.slug, {});
  const rec = coIssueBySlug.get(e.slug);
  rec[e.issueType] = (rec[e.issueType] ?? 0) + 1;
}

// slug 別集計
const bySlug = new Map();
for (const e of filtered) {
  if (!bySlug.has(e.slug)) bySlug.set(e.slug, []);
  bySlug.get(e.slug).push(e);
}
const sortedSlugs = [...bySlug.entries()].sort((a, b) => b[1].length - a[1].length);

// segmentKind 集計 (全体)
const kindCount = new Map();
for (const e of filtered) {
  kindCount.set(e.segmentKind, (kindCount.get(e.segmentKind) ?? 0) + 1);
}

// Markdown 出力
const lines = [];
lines.push(`# Phase 2.0 segment-untranslated 対象一覧${SLUG_FILTER ? ` (slug=${SLUG_FILTER})` : ''}`);
lines.push('');
lines.push(`対象: ${filtered.length} entries / ${bySlug.size} slugs`);
lines.push(`(全 segment-untranslated: ${allUntranslated.length} entries / ${new Set(allUntranslated.map((e) => e.slug)).size} slugs)`);
lines.push('');

lines.push('## segmentKind 内訳');
lines.push('');
for (const [kind, c] of [...kindCount.entries()].sort((a, b) => b[1] - a[1])) {
  lines.push(`- \`${kind}\`: ${c}`);
}
lines.push('');

lines.push(`## Top ${TOP} slugs (entry 数降順)`);
lines.push('');

const topSlugs = sortedSlugs.slice(0, TOP);
for (const [slug, entries] of topSlugs) {
  const co = coIssueBySlug.get(slug) ?? {};
  const coSummary = Object.entries(co)
    .map(([k, v]) => `${k}=${v}`)
    .join(', ');
  const coPart = coSummary ? ` — **同 slug**: ${coSummary}` : '';
  lines.push(`### ${slug} (${entries.length} entries${coPart})`);
  lines.push(`- EN snapshot: \`snapshots/en/content/${slug}.html\``);
  lines.push(`- JA file: \`src/content/docs/${slug}.md\``);

  // sectionPath × segmentKind 集計 (上位 15 entry を詳細表示)
  const sectionKind = new Map();
  for (const e of entries) {
    const key = `${e.sectionPath || '(preface)'} | ${e.segmentKind}`;
    sectionKind.set(key, (sectionKind.get(key) ?? 0) + 1);
  }
  lines.push('');
  lines.push('**sectionPath × segmentKind:**');
  for (const [key, c] of [...sectionKind.entries()].sort((a, b) => b[1] - a[1])) {
    lines.push(`- ${key}: ${c}`);
  }
  lines.push('');
}

if (sortedSlugs.length > TOP) {
  lines.push(`## Remaining ${sortedSlugs.length - TOP} slugs (件数のみ)`);
  lines.push('');
  for (const [slug, entries] of sortedSlugs.slice(TOP)) {
    const co = coIssueBySlug.get(slug) ?? {};
    const coSummary = Object.entries(co)
      .map(([k, v]) => `${k}=${v}`)
      .join(', ');
    const coPart = coSummary ? ` (${coSummary})` : '';
    lines.push(`- \`${slug}\`: ${entries.length}${coPart}`);
  }
  lines.push('');
}

console.log(lines.join('\n'));
