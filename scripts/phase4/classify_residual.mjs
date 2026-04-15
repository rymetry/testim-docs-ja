// scripts/phase4/classify_residual.mjs
// Output: JSON to stdout
import { readFileSync } from 'node:fs';

// 本物の EN artifact (翻訳でも normalizer でも直らない)
const ARTIFACT_TOKEN_MATCHERS = [
  (t) => t === '/docs/index',
  (t) => t === 'http://google.com',
];
// Task 4.3 の URL normalizer が正規化すべきもの
const NORMALIZER_TOKEN_MATCHERS = [
  (t) => typeof t === 'string' && /^https?:\/\/help\.testim\.io/.test(t),
];
// Task 4.4 の HTML extractor で正規化すべき intentional divergence 候補 slug。
const INTENTIONAL_SLUGS = new Set(['administration/api-access']);
// intentional 候補として routing してよい issueType (callout 正規化で解消する
// 3 パターン)。token-gap 等は除外して、slug 別の actionable / artifact / normalizer
// 判定に fall through させる。
const INTENTIONAL_CALLOUT_ISSUE_TYPES = new Set([
  'section-structure-mismatch',
  'segment-extra',
  'segment-missing',
]);

function classify(entry) {
  if (entry.issueType === 'segment-inconclusive') return 'advisoryResidual';
  const missingTokens = entry.missingTokens ?? [];
  // intentional bucket は「slug が allow list に入り、かつ callout 関連の
  // issueType で、missingTokens が無い」という狭い条件にする。token gap は
  // たとえ同 slug でも normalizer / artifact / actionable 判定に回す。
  if (
    INTENTIONAL_SLUGS.has(entry.slug) &&
    INTENTIONAL_CALLOUT_ISSUE_TYPES.has(entry.issueType) &&
    missingTokens.length === 0
  ) {
    return 'intentionalDivergenceCandidates';
  }
  if (missingTokens.length > 0) {
    if (missingTokens.every(t => NORMALIZER_TOKEN_MATCHERS.some(f => f(t)))) return 'normalizerCandidates';
    if (missingTokens.every(t => ARTIFACT_TOKEN_MATCHERS.some(f => f(t)))) return 'artifactCandidates';
  }
  return 'actionable';
}

function main() {
  const baseline = JSON.parse(readFileSync('./parity-baseline.json', 'utf8'));
  let status = null, snapDiff = null;
  try { status = JSON.parse(readFileSync('./parity-check-status.json', 'utf8')); } catch {}
  try { snapDiff = JSON.parse(readFileSync('./snapshot-diff-status.json', 'utf8')); } catch {}

  const out = {
    baseline: { total: baseline.entries.length, byIssueType: {} },
    buckets: {
      actionable: [],
      artifactCandidates: [],
      normalizerCandidates: [],
      intentionalDivergenceCandidates: [],
      advisoryResidual: [],
    },
    summary: {
      reportableActiveFiles: status?.summary?.reportableActiveFiles ?? null,
      baselinedIssues: status?.summary?.baselinedIssues ?? null,
      advisoryQueueIssues: status?.summary?.advisoryQueueIssues ?? null,
      auditSignalIssues: status?.summary?.auditSignalIssues ?? null,
    },
    snapshotDiff: {
      changed: snapDiff?.summary?.changed ?? null,
      added:   snapDiff?.summary?.added   ?? null,
      removed: snapDiff?.summary?.removed ?? null,
    },
  };
  for (const e of baseline.entries) {
    out.baseline.byIssueType[e.issueType] = (out.baseline.byIssueType[e.issueType] ?? 0) + 1;
    out.buckets[classify(e)].push({
      slug: e.slug,
      issueType: e.issueType,
      sectionPath: e.sectionPath,
      segmentKind: e.segmentKind,
      missingTokens: e.missingTokens,
      inconclusiveCategory: e.inconclusiveCategory,
      inconclusiveReason: e.inconclusiveReason,
    });
  }
  process.stdout.write(JSON.stringify(out, null, 2));
}
main();
