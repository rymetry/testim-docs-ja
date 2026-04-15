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
// Task 4.4 の HTML extractor で正規化すべき intentional divergence 候補
const INTENTIONAL_SLUGS = new Set(['administration/api-access']);

function classify(entry) {
  if (entry.issueType === 'segment-inconclusive') return 'advisoryResidual';
  if (INTENTIONAL_SLUGS.has(entry.slug)) return 'intentionalDivergenceCandidates';
  const tokens = entry.missingTokens ?? [];
  if (tokens.length > 0) {
    if (tokens.every(t => NORMALIZER_TOKEN_MATCHERS.some(f => f(t)))) return 'normalizerCandidates';
    if (tokens.every(t => ARTIFACT_TOKEN_MATCHERS.some(f => f(t)))) return 'artifactCandidates';
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
