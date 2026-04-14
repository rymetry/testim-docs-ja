#!/usr/bin/env node
/**
 * Phase 2.4: residual `segment-extra` (非 callout-body) と
 * `section-structure-mismatch` の enumerate。
 *
 * callout-body の `segment-extra` は Phase 3 scope なので別出力する。
 *
 * 出力:
 *   - segment-extra: segmentKind 内訳 / slug 別詳細 (callout-body を除く)
 *   - callout-body: 参考情報として件数のみ
 *   - section-structure-mismatch: slug 別詳細 (対応する segment 修正の副次効果で解消を狙う)
 *
 * Usage:
 *   node scripts/phase2/enumerate_residual_structure.mjs
 *   node scripts/phase2/enumerate_residual_structure.mjs > /tmp/phase2-4-structure.md
 */

import { loadBaseline } from './lib/baseline.mjs';

const baseline = loadBaseline();

const allExtra = baseline.entries.filter(
  (e) => e.issueType === 'segment-extra',
);
const nonCalloutExtra = allExtra.filter(
  (e) => e.segmentKind !== 'callout-body',
);
const calloutExtra = allExtra.filter(
  (e) => e.segmentKind === 'callout-body',
);
const structureMismatch = baseline.entries.filter(
  (e) => e.issueType === 'section-structure-mismatch',
);

// 他 issueType の slug 情報 (整合修正時に副次効果を見るため)
const coIssueBySlug = new Map();
for (const e of baseline.entries) {
  if (!coIssueBySlug.has(e.slug)) coIssueBySlug.set(e.slug, {});
  const rec = coIssueBySlug.get(e.slug);
  rec[e.issueType] = (rec[e.issueType] ?? 0) + 1;
}

function kindCountOf(entries) {
  const m = new Map();
  for (const e of entries) {
    m.set(e.segmentKind, (m.get(e.segmentKind) ?? 0) + 1);
  }
  return m;
}

function groupBySlug(entries) {
  const m = new Map();
  for (const e of entries) {
    if (!m.has(e.slug)) m.set(e.slug, []);
    m.get(e.slug).push(e);
  }
  return [...m.entries()].sort((a, b) => b[1].length - a[1].length);
}

const lines = [];
lines.push('# Phase 2.4 residual structure 対象一覧');
lines.push('');
lines.push(`- segment-extra (全): ${allExtra.length}`);
lines.push(`- segment-extra (非 callout-body, 本 phase scope): ${nonCalloutExtra.length}`);
lines.push(`- segment-extra (callout-body, Phase 3 送り): ${calloutExtra.length}`);
lines.push(`- section-structure-mismatch: ${structureMismatch.length}`);
lines.push('');

// ---------- segment-extra (非 callout-body) ----------
lines.push('## segment-extra (非 callout-body)');
lines.push('');
lines.push('### segmentKind 内訳');
lines.push('');
for (const [kind, c] of [...kindCountOf(nonCalloutExtra).entries()].sort((a, b) => b[1] - a[1])) {
  lines.push(`- \`${kind}\`: ${c}`);
}
lines.push('');
lines.push('### slug 別 (entry 数降順)');
lines.push('');
for (const [slug, entries] of groupBySlug(nonCalloutExtra)) {
  const co = coIssueBySlug.get(slug) ?? {};
  const coSummary = Object.entries(co)
    .filter(([k]) => k !== 'segment-extra')
    .map(([k, v]) => `${k}=${v}`)
    .join(', ');
  const coPart = coSummary ? ` — **同 slug 他 issueType**: ${coSummary}` : '';
  lines.push(`#### ${slug} (${entries.length} entries${coPart})`);
  lines.push(`- EN snapshot: \`snapshots/en/content/${slug}.html\``);
  lines.push(`- JA file: \`src/content/docs/${slug}.md\``);
  for (const e of entries) {
    const detail = e.inconclusiveReason ?? e.usabilityReason ?? '';
    const detailPart = detail ? ` (detail: ${detail})` : '';
    lines.push(
      `- section "${e.sectionPath || '(preface)'}" segmentKind=\`${e.segmentKind}\` jaSegmentIndex=${e.jaSegmentIndex ?? '?'}${detailPart}`,
    );
  }
  lines.push('');
}

// ---------- segment-extra (callout-body) 参考 ----------
lines.push('## segment-extra (callout-body) — Phase 3 reference');
lines.push('');
if (calloutExtra.length === 0) {
  lines.push('(none)');
} else {
  for (const [slug, entries] of groupBySlug(calloutExtra)) {
    lines.push(`- \`${slug}\`: ${entries.length}`);
  }
}
lines.push('');

// ---------- section-structure-mismatch ----------
lines.push('## section-structure-mismatch');
lines.push('');
lines.push('**注意:** 単独で潰しにいかず、同 slug の segment 差分を直した副次効果として落とす。');
lines.push('');
for (const [slug, entries] of groupBySlug(structureMismatch)) {
  const co = coIssueBySlug.get(slug) ?? {};
  const coSummary = Object.entries(co)
    .filter(([k]) => k !== 'section-structure-mismatch')
    .map(([k, v]) => `${k}=${v}`)
    .join(', ');
  const coPart = coSummary ? ` — **同 slug 他 issueType**: ${coSummary}` : '';
  lines.push(`### ${slug} (${entries.length} entries${coPart})`);
  lines.push(`- EN snapshot: \`snapshots/en/content/${slug}.html\``);
  lines.push(`- JA file: \`src/content/docs/${slug}.md\``);
  for (const e of entries) {
    const detail = e.inconclusiveReason ?? e.usabilityReason ?? '';
    const detailPart = detail ? ` (detail: ${detail})` : '';
    lines.push(
      `- section "${e.sectionPath || '(preface)'}"${detailPart}`,
    );
  }
  lines.push('');
}

console.log(lines.join('\n'));
