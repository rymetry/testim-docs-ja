#!/usr/bin/env node
/**
 * Phase 2.3 / 共通: `segment-token-gap` 残件の分類と enumerate。
 *
 * **データソース:** `parity-baseline.json` の **現物** (hardcoded slug list なし)。
 * Phase 2.3 の元々の scope (gap-only 29 slug) は baseline から算出できるため、
 * このスクリプトは母集団を baseline で決定し、`--scope` オプションで filter する。
 *
 * 分類カテゴリ (`categorizeToken` in ./lib/baseline.mjs):
 *   - enSideArtifact : EN 側 typo / 不正 link で JA 側修正不能 (registry 管理)
 *   - cliFlag        : -- or - で始まるトークン (CLI フラグ)
 *   - internalLink   : /docs/ で始まるトークン
 *   - numericOrUnit  : 数値 + 単位 (ms, sec, %, x 等)
 *   - externalUrl    : http で始まるトークン
 *   - other          : それ以外
 *
 * **複合 token-gap への対応:** `missingTokens[0]` だけでなく全トークンを分類し、
 * entry を該当する全カテゴリに登録する (PR#267 review で改善)。
 *
 * Usage:
 *   node scripts/phase2/enumerate_token_gaps.mjs                # all token-gap entries
 *   node scripts/phase2/enumerate_token_gaps.mjs --scope=gap-only  # Phase 2.3 scope (not overlapping missing)
 *   node scripts/phase2/enumerate_token_gaps.mjs --scope=overlap   # overlap with missing (Phase 2.2 responsibility)
 *   node scripts/phase2/enumerate_token_gaps.mjs > /tmp/phase2-3-targets.md
 */

import { loadBaseline, categorizeToken } from './lib/baseline.mjs';

const SCOPE_ARG = process.argv.find((a) => a.startsWith('--scope='));
const SCOPE = SCOPE_ARG ? SCOPE_ARG.slice('--scope='.length) : 'all';
const VALID_SCOPES = ['all', 'gap-only', 'overlap'];
if (!VALID_SCOPES.includes(SCOPE)) {
  console.error(`Invalid --scope=${SCOPE}. Must be one of: ${VALID_SCOPES.join(', ')}`);
  process.exit(2);
}

const CATEGORY_ORDER = [
  'enSideArtifact',
  'cliFlag',
  'internalLink',
  'numericOrUnit',
  'externalUrl',
  'other',
];

const baseline = loadBaseline();

// 全 token-gap entries と missing slugs を baseline から算出
const allTokenGap = baseline.entries.filter((e) => e.issueType === 'segment-token-gap');
const missingSlugs = new Set(
  baseline.entries.filter((e) => e.issueType === 'segment-missing').map((e) => e.slug),
);

// scope に応じて filter (hardcode なし、baseline から算出)
function isInScope(entry) {
  switch (SCOPE) {
    case 'all':
      return true;
    case 'gap-only':
      return !missingSlugs.has(entry.slug);
    case 'overlap':
      return missingSlugs.has(entry.slug);
    default:
      return true;
  }
}

const inScope = allTokenGap.filter(isInScope);

// entry を token ごとにカテゴリに投入。同じ entry が複数カテゴリに現れてよい。
const byCategory = Object.fromEntries(CATEGORY_ORDER.map((c) => [c, []]));
let multiCategoryEntryCount = 0;

for (const entry of inScope) {
  const tokens = entry.missingTokens ?? [];
  const cats = new Map();

  for (const token of tokens) {
    const cat = categorizeToken(token);
    if (!cats.has(cat)) cats.set(cat, []);
    cats.get(cat).push(token);
  }

  if (cats.size > 1) multiCategoryEntryCount += 1;

  for (const [cat, catTokens] of cats) {
    byCategory[cat].push({
      slug: entry.slug,
      sectionPath: entry.sectionPath,
      allTokens: tokens,
      categoryTokens: catTokens,
      detail: entry.inconclusiveReason ?? entry.usabilityReason ?? '',
    });
  }
}

const slugCount = new Set(inScope.map((e) => e.slug)).size;
const totalTokenGap = allTokenGap.length;
const totalSlugs = new Set(allTokenGap.map((e) => e.slug)).size;

// Markdown 出力
const lines = [];
lines.push(`# Phase 2.3 segment-token-gap 対象一覧 (scope=${SCOPE})`);
lines.push('');
lines.push(`対象: ${inScope.length} entries / ${slugCount} slugs`);
lines.push(`(全 token-gap: ${totalTokenGap} entries / ${totalSlugs} slugs — scope filter で絞り込み)`);
lines.push(`複数カテゴリにまたがる entry: ${multiCategoryEntryCount}`);
lines.push('');
lines.push('## Scope definition');
lines.push('');
lines.push('- `all`: baseline 内の全 `segment-token-gap` entries');
lines.push('- `gap-only`: `segment-missing` を持たない slug のみ (Phase 2.3 の元々の scope)');
lines.push('- `overlap`: `segment-missing` と同 slug にある entries (Phase 2.2 responsibility)');
lines.push('');

for (const cat of CATEGORY_ORDER) {
  const entries = byCategory[cat];
  if (entries.length === 0) continue;
  lines.push(`## ${cat} (${entries.length} occurrences)`);
  lines.push('');
  for (const e of entries) {
    lines.push(`### ${e.slug}`);
    lines.push(`- **sectionPath**: ${e.sectionPath}`);
    lines.push(
      `- **categoryTokens**: \`${e.categoryTokens.join('`, `')}\``,
    );
    if (e.allTokens.length > e.categoryTokens.length) {
      lines.push(
        `- **allTokens**: \`${e.allTokens.join('`, `')}\` (複合 token-gap — 他カテゴリも確認)`,
      );
    }
    if (e.detail) lines.push(`- **detail**: ${e.detail}`);
    lines.push('');
  }
}

console.log(lines.join('\n'));
