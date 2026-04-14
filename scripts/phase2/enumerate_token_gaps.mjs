#!/usr/bin/env node
/**
 * Phase 2.3: segment-token-gap 残件を対象 29 slug に絞り分類するスクリプト。
 *
 * 分類カテゴリ:
 *   - cliFlag      : -- or - で始まるトークン (CLI フラグ)
 *   - internalLink : /docs/ で始まるトークン
 *   - numericOrUnit: 数値 + 単位 (ms, sec, %, x 等)
 *   - externalUrl  : http で始まるトークン
 *   - other        : それ以外
 *
 * Usage:
 *   node scripts/phase2/enumerate_token_gaps.mjs
 *   node scripts/phase2/enumerate_token_gaps.mjs > /tmp/phase2-3-targets.md
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, '../..');

const TARGET_SLUGS = new Set([
  'advanced-editing/hooks',
  'advanced-editing/parameters',
  'advanced-editing/parameters/exports-parameters',
  'editing-tests/conditions/advanced-conditions-settings',
  'editing-tests/editing-your-tests/editing-target-element-properties-mobile',
  'editing-tests/search-within-a-test',
  'getting-started/creating-your-first-codeless-test',
  'guides/generate-random-data-with-js',
  'guides/mobile-web-testing',
  'integrations/grid-management/virtual-mobile-grid',
  'integrations/integrate-testim-to-your-ci/gearset-integration',
  'integrations/integrate-testim-to-your-ci/teamcity-integration',
  'integrations/visual-validation/visual_validation_index',
  'recording-tests/recording-a-mobile-test/recording-a-local-mobile-test',
  'recording-tests/recording-a-mobile-test/recording-a-vmg-mobile-test',
  'running-tests/base-url',
  'running-tests/the-command-line-cli/allow-chrome-browser-to-use-microphone',
  'salesforce-testing/salesforce-steps/sfdc-step-apex-action',
  'salesforce-testing/salesforce-steps/sfdc-step-create',
  'salesforce-testing/salesforce-steps/sfdc-step-edit',
  'salesforce-testing/salesforce-steps/sfdc-step-login',
  'salesforce-testing/salesforce-steps/sfdc-step-quickactions',
  'salesforce-testing/salesforce-steps/sfdc-step-relatedlistaction',
  'salesforce-testing/salesforce-steps/sfdc-step-salesforce-flows',
  'salesforce-testing/salesforce-steps/sfdc-step-validate',
  'test-management/configuration-library-mobile',
  'test-management/dependencies-and-ordering-of-tests',
  'test-management/labels',
  'testops/insights/dashboard',
]);

/** カテゴリを判定する (最初の missingToken を基準にする) */
function categorize(token) {
  if (!token) return 'other';
  if (token.startsWith('--') || /^-[a-zA-Z]/.test(token)) return 'cliFlag';
  if (token.startsWith('/docs/')) return 'internalLink';
  if (/^\d+(\.\d+)?(ms|sec|s|min|hr|px|em|rem|MB|GB|KB|%|x)$/i.test(token))
    return 'numericOrUnit';
  if (token.startsWith('http')) return 'externalUrl';
  return 'other';
}

const baseline = JSON.parse(
  readFileSync(join(REPO_ROOT, 'parity-baseline.json'), 'utf8'),
);

const inScope = baseline.entries.filter(
  (e) => e.issueType === 'segment-token-gap' && TARGET_SLUGS.has(e.slug),
);

// カテゴリごとに集約
const byCategory = {
  cliFlag: [],
  internalLink: [],
  numericOrUnit: [],
  externalUrl: [],
  other: [],
};

for (const entry of inScope) {
  const firstToken = entry.missingTokens?.[0] ?? '';
  const cat = categorize(firstToken);
  byCategory[cat].push({
    slug: entry.slug,
    sectionPath: entry.sectionPath,
    missingTokens: entry.missingTokens,
    detail: entry.inconclusiveReason ?? entry.usabilityReason ?? '',
  });
}

// Markdown 出力
const lines = [];
lines.push('# Phase 2.3 segment-token-gap 対象一覧');
lines.push('');
lines.push(`総件数: ${inScope.length} entries / ${TARGET_SLUGS.size} slugs`);
lines.push('');

for (const [cat, entries] of Object.entries(byCategory)) {
  if (entries.length === 0) continue;
  lines.push(`## ${cat} (${entries.length} entries)`);
  lines.push('');
  for (const e of entries) {
    lines.push(`### ${e.slug}`);
    lines.push(`- **sectionPath**: ${e.sectionPath}`);
    lines.push(`- **missingTokens**: \`${e.missingTokens?.join('`, `')}\``);
    if (e.detail) lines.push(`- **detail**: ${e.detail}`);
    lines.push('');
  }
}

console.log(lines.join('\n'));
