#!/usr/bin/env node
/**
 * Phase 2.3: segment-token-gap 残件を対象 29 slug に絞り分類するスクリプト。
 *
 * 分類カテゴリ (`categorizeToken` in ./lib/baseline.mjs):
 *   - enSideArtifact : EN 側 typo / 不正 link で JA 側修正不能 (registry 管理)
 *   - cliFlag        : -- or - で始まるトークン (CLI フラグ)
 *   - internalLink   : /docs/ で始まるトークン
 *   - numericOrUnit  : 数値 + 単位 (ms, sec, %, x 等)
 *   - externalUrl    : http で始まるトークン
 *   - other          : それ以外
 *
 * **複合 token-gap への対応 (PR#267 review 対応):**
 * `missingTokens[0]` だけでなく **全トークンを分類** し、entry を該当する全カテゴリに
 * 登録する。例: `[--chrome-extra-args, /docs/index]` を持つ entry は
 * `cliFlag` と `enSideArtifact` の両方に現れる。従来実装は先頭トークンのみ見て
 * 内部リンク欠落を見落とす問題があった。
 *
 * Usage:
 *   node scripts/phase2/enumerate_token_gaps.mjs
 *   node scripts/phase2/enumerate_token_gaps.mjs > /tmp/phase2-3-targets.md
 */

import { loadBaseline, categorizeToken } from './lib/baseline.mjs';

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

const CATEGORY_ORDER = [
  'enSideArtifact',
  'cliFlag',
  'internalLink',
  'numericOrUnit',
  'externalUrl',
  'other',
];

const baseline = loadBaseline();

const inScope = baseline.entries.filter(
  (e) => e.issueType === 'segment-token-gap' && TARGET_SLUGS.has(e.slug),
);

// entry を token ごとにカテゴリに投入。同じ entry が複数カテゴリに現れてよい。
const byCategory = Object.fromEntries(CATEGORY_ORDER.map((c) => [c, []]));
let multiCategoryEntryCount = 0;

for (const entry of inScope) {
  const tokens = entry.missingTokens ?? [];
  const cats = new Map(); // category -> tokens matching that category

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

// Markdown 出力
const lines = [];
lines.push('# Phase 2.3 segment-token-gap 対象一覧');
lines.push('');
lines.push(
  `総件数: ${inScope.length} entries / ${TARGET_SLUGS.size} slugs ` +
    `(うち複数カテゴリにまたがる entry: ${multiCategoryEntryCount})`,
);
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
