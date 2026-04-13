/**
 * Boundary stability benchmark.
 *
 * Runs the new EN HTML and JA markdown canonical segment extractors against
 * the representative pages from the mutation corpus manifest and
 * verifies that segment boundaries are stable enough to feed the exact diff
 * exact diff engine.
 *
 * Hard assertions (structural invariants — must match exactly):
 *   - heading count
 *   - unordered-list-item count
 *   - callout-body count (after the callout-block-parsing refactor)
 *   - ordered-list-item count, with narrow documented exceptions
 *
 * Soft assertions (stability score thresholds):
 *   - per-page gate-eligible stability score ≥ 0.85
 *   - mean stability score across all pages ≥ 0.95
 *
 * `KNOWN_ORDERED_DRIFTS` lists slugs where EN embeds "1. x 2. y 3. z" as
 * plain text in a single <p> while JA uses a proper numbered list. This is
 * a legitimate translation improvement that the exact diff engine
 * must handle; this suite keeps the invariant on the other pages so
 * ordered-list regressions there are still caught.
 *
 * The stability score is 1 - (total absolute count diffs / (2 * total segments))
 * across gate-eligible kinds. A score of 1.0 means every kind is identical;
 * 0.9 means ~10% of segments differ in count.
 *
 * The test also writes a report file to scripts/__tests__/fixtures/source-parity-goldens/
 * for inspection by humans when boundaries drift.
 */
import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

let extractSegmentsFromHtml;
let extractSegmentsFromMarkdown;
let GATE_ELIGIBLE_KINDS;

before(async () => {
  ({ extractSegmentsFromHtml } = await import('../lib/source_parity_segments_en.mjs'));
  ({ extractSegmentsFromMarkdown } = await import('../lib/source_parity_segments_ja.mjs'));
  ({ GATE_ELIGIBLE_KINDS } = await import('../lib/source_parity_segments_shared.mjs'));
});

const ROOT = join(import.meta.dirname, '../../');
const FIXTURES = join(ROOT, 'scripts/__tests__/fixtures/source-parity-goldens');
const MANIFEST_PATH = join(FIXTURES, 'manifest.json');
const REPORT_PATH = join(FIXTURES, 'segment-boundary-report.json');

/**
 * Slugs where ordered-list-item counts are allowed to diverge between EN
 * and JA because of a known translation improvement. Each entry documents
 * the EXACT expected counts on both sides plus a reason, so the
 * stale-exception guard can reject any deviation — whether the drift
 * disappears entirely or shifts into a new shape (e.g. EN=100/JA=120 or
 * EN=90/JA=103 would all fail the guard and force the map to be
 * re-reviewed before the test suite is green again).
 *
 * @type {Readonly<Record<string, {expectedEn: number, expectedJa: number, reason: string}>>}
 */
const KNOWN_ORDERED_DRIFTS = Object.freeze({});

function loadManifest() {
  return JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')).pages;
}

function countByKind(segments) {
  const counts = {};
  for (const segment of segments) {
    counts[segment.segmentKind] = (counts[segment.segmentKind] ?? 0) + 1;
  }
  return counts;
}

function filterGateEligible(segments, gateSet) {
  return segments.filter((segment) => gateSet.has(segment.segmentKind));
}

function stabilityScore(enCounts, jaCounts) {
  const kinds = new Set([...Object.keys(enCounts), ...Object.keys(jaCounts)]);
  let totalEn = 0;
  let totalJa = 0;
  let diff = 0;
  for (const kind of kinds) {
    const e = enCounts[kind] ?? 0;
    const j = jaCounts[kind] ?? 0;
    totalEn += e;
    totalJa += j;
    diff += Math.abs(e - j);
  }
  const max = Math.max(totalEn, totalJa);
  if (max === 0) return 1;
  return 1 - diff / (max * 2);
}

function analyzePage(slug, gateSet) {
  const html = readFileSync(join(ROOT, 'snapshots/en/content', `${slug}.html`), 'utf8');
  const md = readFileSync(join(ROOT, 'src/content/docs', `${slug}.md`), 'utf8');

  const enSegments = extractSegmentsFromHtml(html);
  const jaSegments = extractSegmentsFromMarkdown(md);

  const enGate = filterGateEligible(enSegments, gateSet);
  const jaGate = filterGateEligible(jaSegments, gateSet);

  const enCounts = countByKind(enGate);
  const jaCounts = countByKind(jaGate);

  return {
    slug,
    enTotal: enGate.length,
    jaTotal: jaGate.length,
    enCounts,
    jaCounts,
    stabilityScore: stabilityScore(enCounts, jaCounts),
  };
}

// ---------------------------------------------------------------------------
// Benchmark suite
// ---------------------------------------------------------------------------

describe('boundary stability benchmark', () => {
  it('runs the extractors on every representative page without errors', () => {
    const gateSet = new Set(GATE_ELIGIBLE_KINDS);
    const manifest = loadManifest();
    assert.ok(manifest.length >= 5, 'manifest should contain representative pages');
    for (const page of manifest) {
      const analysis = analyzePage(page.slug, gateSet);
      assert.ok(analysis.enTotal > 0, `${page.slug}: EN segments should not be empty`);
      assert.ok(analysis.jaTotal > 0, `${page.slug}: JA segments should not be empty`);
    }
  });

  it('heading counts match exactly between EN and JA on every page', () => {
    const gateSet = new Set(GATE_ELIGIBLE_KINDS);
    const manifest = loadManifest();
    for (const page of manifest) {
      const analysis = analyzePage(page.slug, gateSet);
      const en = analysis.enCounts.heading ?? 0;
      const ja = analysis.jaCounts.heading ?? 0;
      assert.equal(
        en,
        ja,
        `${page.slug}: heading count mismatch (EN=${en}, JA=${ja})`,
      );
    }
  });

  it('unordered-list-item counts match exactly between EN and JA on every page', () => {
    const gateSet = new Set(GATE_ELIGIBLE_KINDS);
    const manifest = loadManifest();
    for (const page of manifest) {
      const analysis = analyzePage(page.slug, gateSet);
      const en = analysis.enCounts['unordered-list-item'] ?? 0;
      const ja = analysis.jaCounts['unordered-list-item'] ?? 0;
      assert.equal(
        en,
        ja,
        `${page.slug}: unordered-list-item count mismatch (EN=${en}, JA=${ja})`,
      );
    }
  });

  it('ordered-list-item counts match exactly except for documented drifts', () => {
    const gateSet = new Set(GATE_ELIGIBLE_KINDS);
    const manifest = loadManifest();
    for (const page of manifest) {
      if (KNOWN_ORDERED_DRIFTS[page.slug]) continue;
      const analysis = analyzePage(page.slug, gateSet);
      const en = analysis.enCounts['ordered-list-item'] ?? 0;
      const ja = analysis.jaCounts['ordered-list-item'] ?? 0;
      assert.equal(
        en,
        ja,
        `${page.slug}: ordered-list-item count mismatch (EN=${en}, JA=${ja}). ` +
          `If this is a newly-intentional translation improvement, add the ` +
          `slug to KNOWN_ORDERED_DRIFTS with a reason.`,
      );
    }
  });

  it('KNOWN_ORDERED_DRIFTS slugs all exist in the representative corpus manifest', () => {
    // Guard against dead exception entries: if the representative corpus
    // is restructured and a slug is removed, the matching exception must
    // be removed too — otherwise the entry silently persists without
    // running. Fail loudly so the map stays a live document of real drift.
    const manifest = loadManifest();
    const manifestSlugs = new Set(manifest.map((page) => page.slug));
    for (const slug of Object.keys(KNOWN_ORDERED_DRIFTS)) {
      assert.ok(
        manifestSlugs.has(slug),
        `${slug}: not present in the representative corpus manifest. ` +
          `Remove the entry from KNOWN_ORDERED_DRIFTS.`,
      );
    }
  });

  it('KNOWN_ORDERED_DRIFTS entries still produce the exact documented counts', () => {
    // Strong guard: the exception only stands if the observed EN and JA
    // counts match the documented values EXACTLY. Any deviation (drift
    // resolved, drift grown, drift shifted, or direction flipped) fails
    // the test and forces the map to be re-reviewed before the suite is
    // green again. This prevents a future regression like EN=100/JA=120
    // or EN=90/JA=103 from slipping through as a "known drift".
    const gateSet = new Set(GATE_ELIGIBLE_KINDS);
    for (const [slug, entry] of Object.entries(KNOWN_ORDERED_DRIFTS)) {
      const analysis = analyzePage(slug, gateSet);
      const en = analysis.enCounts['ordered-list-item'] ?? 0;
      const ja = analysis.jaCounts['ordered-list-item'] ?? 0;
      assert.equal(
        en,
        entry.expectedEn,
        `${slug}: EN ordered-list-item count changed (expected ${entry.expectedEn}, got ${en}). ` +
          `Update KNOWN_ORDERED_DRIFTS or remove the exception.`,
      );
      assert.equal(
        ja,
        entry.expectedJa,
        `${slug}: JA ordered-list-item count changed (expected ${entry.expectedJa}, got ${ja}). ` +
          `Update KNOWN_ORDERED_DRIFTS or remove the exception.`,
      );
      // Sanity: the documented values must actually differ — an entry with
      // expectedEn === expectedJa means no drift and the exception is moot.
      assert.notEqual(
        entry.expectedEn,
        entry.expectedJa,
        `${slug}: KNOWN_ORDERED_DRIFTS entry has identical expected counts; remove it.`,
      );
    }
  });

  it('callout-body counts match exactly between EN and JA on every page', () => {
    // callout block parsing 後も、list items inside a
    // callout are classified as list-items on both sides. The remaining
    // callout-body segments are plain-paragraph content, which should align
    // exactly between the two extractors.
    const gateSet = new Set(GATE_ELIGIBLE_KINDS);
    const manifest = loadManifest();
    for (const page of manifest) {
      const analysis = analyzePage(page.slug, gateSet);
      const en = analysis.enCounts['callout-body'] ?? 0;
      const ja = analysis.jaCounts['callout-body'] ?? 0;
      assert.equal(
        en,
        ja,
        `${page.slug}: callout-body count mismatch (EN=${en}, JA=${ja})`,
      );
    }
  });

  it('per-page stability score is at least 0.85 for all representative pages', () => {
    const gateSet = new Set(GATE_ELIGIBLE_KINDS);
    const manifest = loadManifest();
    for (const page of manifest) {
      const analysis = analyzePage(page.slug, gateSet);
      assert.ok(
        analysis.stabilityScore >= 0.85,
        `${page.slug}: stability score ${analysis.stabilityScore.toFixed(3)} < 0.85`,
      );
    }
  });

  it('mean stability score across all representative pages is at least 0.95', () => {
    const gateSet = new Set(GATE_ELIGIBLE_KINDS);
    const manifest = loadManifest();
    const scores = manifest.map((page) => analyzePage(page.slug, gateSet).stabilityScore);
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    assert.ok(mean >= 0.95, `mean stability score ${mean.toFixed(3)} < 0.95`);
  });

  it('extractors are idempotent: same input yields identical segments across runs', () => {
    const gateSet = new Set(GATE_ELIGIBLE_KINDS);
    const manifest = loadManifest();
    const slug = manifest[0].slug;
    const html = readFileSync(join(ROOT, 'snapshots/en/content', `${slug}.html`), 'utf8');
    const md = readFileSync(join(ROOT, 'src/content/docs', `${slug}.md`), 'utf8');
    const enA = extractSegmentsFromHtml(html);
    const enB = extractSegmentsFromHtml(html);
    const jaA = extractSegmentsFromMarkdown(md);
    const jaB = extractSegmentsFromMarkdown(md);
    assert.deepEqual(enA, enB);
    assert.deepEqual(jaA, jaB);
    assert.ok(gateSet.size > 0);
  });

  it('writes a machine-readable boundary report for inspection', () => {
    const gateSet = new Set(GATE_ELIGIBLE_KINDS);
    const manifest = loadManifest();
    const pages = manifest.map((page) => analyzePage(page.slug, gateSet));
    const meanStabilityScore =
      pages.reduce((sum, p) => sum + p.stabilityScore, 0) / pages.length;
    // Report is deterministic (no timestamps) so it can be committed as a
    // baseline. The file acts as a snapshot test: if extractors drift, the
    // diff is visible in code review.
    const report = {
      schemaVersion: 1,
      meanStabilityScore,
      pages,
    };
    writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
    assert.ok(meanStabilityScore > 0);
  });
});
