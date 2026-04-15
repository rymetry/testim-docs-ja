/**
 * frozen baseline が新しい mutation を吸収しないことを確認する。
 *
 * Builds a synthetic baseline from the current diff set of each representative
 * page, applies every diff=1 mutation from the mutation corpus, and asserts
 * that at least one resulting issue remains un-baselined.
 */
import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

let alignSegments;
let parityDiffsToIssues;
let extractSegmentsFromHtml;
let extractSegmentsFromMarkdown;
let computeSnapshotFingerprint;
let tagIssuesWithBaseline;
let MUTATION_TYPES;

before(async () => {
  ({ alignSegments, parityDiffsToIssues } = await import('../lib/source_parity_align.mjs'));
  ({ extractSegmentsFromHtml } = await import('../lib/source_parity_segments_en.mjs'));
  ({ extractSegmentsFromMarkdown } = await import('../lib/source_parity_segments_ja.mjs'));
  ({ computeSnapshotFingerprint } = await import('../lib/source_parity_acknowledgements.mjs'));
  ({ tagIssuesWithBaseline } = await import('../lib/source_parity_baseline.mjs'));
  ({ MUTATION_TYPES } = await import('../lib/mutation_corpus.mjs'));
});

const ROOT = join(import.meta.dirname, '../../');
const FIXTURES = join(ROOT, 'scripts/__tests__/fixtures/source-parity-goldens');
const MANIFEST_PATH = join(FIXTURES, 'manifest.json');
const BASELINE_ELIGIBLE = new Set([
  'segment-missing',
  'segment-extra',
  'segment-shifted',
  'segment-untranslated',
  'segment-token-gap',
  'segment-inconclusive',
]);

function loadManifest() {
  return JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')).pages;
}

function readEnHtml(slug) {
  return readFileSync(join(ROOT, 'snapshots/en/content', `${slug}.html`), 'utf8');
}

function readJaMarkdown(slug) {
  return readFileSync(join(ROOT, 'src/content/docs', `${slug}.md`), 'utf8');
}

function buildBaselineEntries(slug, issues, snapshotFingerprint) {
  return issues
    .filter((issue) => BASELINE_ELIGIBLE.has(issue.type))
    .map((issue) => ({
      slug,
      issueType: issue.type,
      sectionPath: issue.sectionPath ?? null,
      segmentKind: issue.segmentKind ?? null,
      enSegmentIndex: issue.enSegmentIndex ?? null,
      jaSegmentIndex: issue.jaSegmentIndex ?? null,
      enSourceFingerprint: issue.enSourceFingerprint ?? null,
      jaSourceFingerprint: issue.jaSourceFingerprint ?? null,
      missingTokens: Array.isArray(issue.missingTokens)
        ? [...new Set(issue.missingTokens)].sort()
        : null,
      snapshotFingerprint,
      inconclusiveCategory: issue.inconclusiveCategory ?? null,
      inconclusiveReason: issue.inconclusiveReason ?? null,
      reviewAfter: '2026-10-06',
    }));
}

function diffId(diff) {
  const tokenSig = Array.isArray(diff.missingTokens) ? [...diff.missingTokens].sort().join(',') : '';
  let fingerprint = '_';
  switch (diff.type) {
    case 'segment-missing':
    case 'segment-token-gap':
      fingerprint = diff.enSourceFingerprint ?? '_';
      break;
    case 'segment-extra':
    case 'segment-untranslated':
      fingerprint = diff.jaSourceFingerprint ?? '_';
      break;
    default:
      fingerprint = `${diff.enSourceFingerprint ?? '_'}:${diff.jaSourceFingerprint ?? '_'}`;
  }
  return [diff.type, diff.sectionIndex, diff.segmentKind, fingerprint, tokenSig].join('|');
}

describe('baseline does not absorb new mutations', () => {
  it('every diff=1 mutation leaves at least one un-baselined issue', () => {
    const manifest = loadManifest();
    const failures = [];

    for (const page of manifest) {
      const slug = page.slug;
      const html = readEnHtml(slug);
      const snapshotFingerprint = computeSnapshotFingerprint(html);
      const enSegments = extractSegmentsFromHtml(html);
      const jaOriginal = readJaMarkdown(slug);
      const jaSegmentsOriginal = extractSegmentsFromMarkdown(jaOriginal);
      const baselineAlignment = alignSegments(enSegments, jaSegmentsOriginal, { slug });

      if (baselineAlignment.inconclusive) continue;

      const baselineIssues = parityDiffsToIssues(baselineAlignment.diffs);
      if (baselineIssues.length === 0) continue;
      const baselineEntries = buildBaselineEntries(slug, baselineIssues, snapshotFingerprint);

      for (const [mutationType, mutationFn] of Object.entries(MUTATION_TYPES)) {
        const mutation = mutationFn(jaOriginal, 0);
        if (mutation === null) continue;

        const jaSegmentsMutated = extractSegmentsFromMarkdown(mutation.mutated);
        const mutatedAlignment = alignSegments(enSegments, jaSegmentsMutated, { slug });
        if (mutatedAlignment.inconclusive) continue;

        const mutatedIssues = parityDiffsToIssues(mutatedAlignment.diffs);
        if (mutatedIssues.length === 0) continue;
        const baselineIds = new Set(baselineIssues.map(diffId));
        const newIssues = mutatedIssues.filter((issue) => !baselineIds.has(diffId(issue)));
        if (newIssues.length === 0) continue;

        const tagged = tagIssuesWithBaseline(
          slug,
          newIssues,
          baselineEntries,
          snapshotFingerprint,
          '2026-04-06',
        );
        const activeIssues = tagged.tagged.filter((issue) => issue.baselined !== true);

        if (activeIssues.length === 0) {
          failures.push(
            `${slug} :: ${mutationType} :: all ${newIssues.length} new mutated issues were absorbed by baseline`,
          );
        }
      }
    }

    assert.equal(
      failures.length,
      0,
      `baseline absorbed new mutations:\n  ${failures.join('\n  ')}`,
    );
  });
});
