// scripts/__tests__/ja_omission_policy_registry.test.mjs
/**
 * ja_omission_policy_registry の shape / empty-safe / inventory / runtime
 * coverage aggregator / alignSegments 統合を検証する。
 *
 * 本 registry は §5.3.3 で新設した JA-side intentional-omission suppression
 * mechanism で、alignSegments({slug, omissionCoverage}) から consume される。
 * quota-based disambiguator を採用しているため、quota 範囲内の diff は抑止
 * され、quota を超えた diff は通常通り surface される。
 */
import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';

let matchPolicy;
let registryEntries;
let createOmissionCoverage;
let NOOP_OMISSION_COVERAGE;
let alignSegments;
let createSegment;

before(async () => {
  ({
    matchPolicy,
    registryEntries,
    createOmissionCoverage,
    NOOP_OMISSION_COVERAGE,
  } = await import('../lib/ja_omission_policy_registry.mjs'));
  ({ alignSegments } = await import('../lib/source_parity_align.mjs'));
  ({ createSegment } = await import('../lib/source_parity_segments_shared.mjs'));
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSeg(sectionPath, kind, segmentIndex, rawText) {
  return createSegment({ sectionPath, kind, segmentIndex, rawText });
}

function makeHeading(sectionPath, segmentIndex, rawText) {
  return makeSeg(sectionPath, 'heading', segmentIndex, rawText);
}

// ---------------------------------------------------------------------------
// shape / empty-safe
// ---------------------------------------------------------------------------

describe('ja_omission_policy_registry (shape / empty-safe)', () => {
  it('matchPolicy returns null for unregistered (slug, issueType)', () => {
    assert.equal(
      matchPolicy({
        slug: 'nonexistent/slug',
        issueType: 'segment-missing',
        segmentKind: 'paragraph',
      }),
      null,
    );
  });

  it('matchPolicy returns null when slug matches but issueType does not', () => {
    assert.equal(
      matchPolicy({
        slug: 'overview/testim-overview',
        issueType: 'segment-untranslated',
        segmentKind: 'paragraph',
      }),
      null,
    );
  });

  it('registry entries have required shape', () => {
    for (const e of registryEntries()) {
      assert.ok(Array.isArray(e.slugs) && e.slugs.length > 0, 'slugs must be non-empty array');
      assert.ok(
        Array.isArray(e.issueTypes) && e.issueTypes.length > 0,
        'issueTypes must be non-empty array',
      );
      assert.ok(
        e.segmentKinds === null || (Array.isArray(e.segmentKinds) && e.segmentKinds.length > 0),
        'segmentKinds must be null or non-empty array',
      );
      assert.ok(
        e.missingToken === null || (typeof e.missingToken === 'string' && e.missingToken.length > 0),
        'missingToken must be null or non-empty string',
      );
      assert.ok(Number.isInteger(e.quota) && e.quota > 0, 'quota must be positive integer');
      assert.ok(typeof e.reason === 'string' && e.reason.length > 0, 'reason must be non-empty string');
      assert.ok(typeof e.note === 'string' && e.note.length > 0, 'note must be non-empty string');
      assert.ok(typeof e.policySource === 'string' && e.policySource.length > 0,
        'policySource must be non-empty string');
      assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(e.addedAt), 'addedAt must be YYYY-MM-DD');
    }
  });

  it('registry entries are frozen (immutable)', () => {
    for (const e of registryEntries()) {
      assert.ok(Object.isFrozen(e), 'entry must be frozen');
      assert.ok(Object.isFrozen(e.slugs), 'slugs must be frozen');
      assert.ok(Object.isFrozen(e.issueTypes), 'issueTypes must be frozen');
    }
  });
});

// ---------------------------------------------------------------------------
// inventory — testim-overview initial entries (2026-04-17 baseline)
// ---------------------------------------------------------------------------

describe('ja_omission_policy_registry (inventory — testim-overview)', () => {
  it('covers pricing/changelog callout-body segment-missing (quota=2)', () => {
    const entry = matchPolicy({
      slug: 'overview/testim-overview',
      issueType: 'segment-missing',
      segmentKind: 'callout-body',
    });
    assert.ok(entry !== null, 'policy must match');
    assert.equal(entry.quota, 2);
    assert.equal(entry.reason, 'tricentis-pricing-changelog-callout-removal');
  });

  it('covers changelog callout-body segment-extra (quota=1)', () => {
    const entry = matchPolicy({
      slug: 'overview/testim-overview',
      issueType: 'segment-extra',
      segmentKind: 'callout-body',
    });
    assert.ok(entry !== null);
    assert.equal(entry.quota, 1);
    assert.equal(entry.reason, 'tricentis-changelog-callout-offset-remnant');
  });

  it('covers testim.io URL segment-token-gap (quota=1)', () => {
    const entry = matchPolicy({
      slug: 'overview/testim-overview',
      issueType: 'segment-token-gap',
      segmentKind: 'paragraph',
      missingTokens: ['http://testim.io'],
    });
    assert.ok(entry !== null);
    assert.equal(entry.missingToken, 'http://testim.io');
    assert.equal(entry.quota, 1);
  });

  it('does NOT match segment-token-gap with different missing token', () => {
    assert.equal(
      matchPolicy({
        slug: 'overview/testim-overview',
        issueType: 'segment-token-gap',
        segmentKind: 'paragraph',
        missingTokens: ['http://example.com'],
      }),
      null,
    );
  });

  it('covers the derivative section-structure-mismatch (quota=1, segmentKinds=null)', () => {
    const entry = matchPolicy({
      slug: 'overview/testim-overview',
      issueType: 'section-structure-mismatch',
      segmentKind: null,
    });
    assert.ok(entry !== null);
    assert.equal(entry.segmentKinds, null);
    assert.equal(entry.quota, 1);
  });

  it('does NOT match for non-registered slug even with matching issueType', () => {
    assert.equal(
      matchPolicy({
        slug: 'overview/nonexistent',
        issueType: 'segment-missing',
        segmentKind: 'callout-body',
      }),
      null,
    );
  });
});

// ---------------------------------------------------------------------------
// createOmissionCoverage — quota + hit aggregation
// ---------------------------------------------------------------------------

describe('createOmissionCoverage (quota + aggregation)', () => {
  it('starts empty — consume always returns false for unregistered inputs', () => {
    const c = createOmissionCoverage();
    const s0 = c.snapshot();
    assert.equal(s0.matchedHits, 0);
    assert.equal(
      c.consume({
        slug: 'nonexistent/slug',
        issueType: 'segment-missing',
        segmentKind: 'paragraph',
      }),
      false,
    );
    assert.equal(c.snapshot().matchedHits, 0);
  });

  it('consumes callout-body segment-missing up to quota=2, then stops', () => {
    const c = createOmissionCoverage();
    const call = () =>
      c.consume({
        slug: 'overview/testim-overview',
        issueType: 'segment-missing',
        segmentKind: 'callout-body',
      });
    assert.equal(call(), true, 'first consume within quota');
    assert.equal(call(), true, 'second consume within quota');
    assert.equal(call(), false, 'third consume exceeds quota=2');
    const s = c.snapshot();
    assert.equal(s.matchedHits, 2);
    assert.equal(s.bySlug['overview/testim-overview'], 2);
    assert.equal(s.byIssueType['segment-missing'], 2);
    assert.equal(s.byReason['tricentis-pricing-changelog-callout-removal'], 2);
    assert.ok(s.exhaustedEntries.includes('tricentis-pricing-changelog-callout-removal'));
  });

  it('tracks per-entry quotaUsage including untouched entries', () => {
    const c = createOmissionCoverage();
    c.consume({
      slug: 'overview/testim-overview',
      issueType: 'segment-token-gap',
      segmentKind: 'paragraph',
      missingTokens: ['http://testim.io'],
    });
    const s = c.snapshot();
    const tokenGapEntry = s.quotaUsage.find(
      (u) => u.reason === 'tricentis-testim-io-url-removal',
    );
    assert.ok(tokenGapEntry);
    assert.equal(tokenGapEntry.used, 1);
    assert.equal(tokenGapEntry.remaining, 0);

    const pricingEntry = s.quotaUsage.find(
      (u) => u.reason === 'tricentis-pricing-changelog-callout-removal',
    );
    assert.ok(pricingEntry);
    assert.equal(pricingEntry.used, 0);
    assert.equal(pricingEntry.remaining, 2);
  });

  it('atomicity: consume=false does not advance quota when match fails', () => {
    const c = createOmissionCoverage();
    // wrong missingToken → no match → no quota decrement
    const r = c.consume({
      slug: 'overview/testim-overview',
      issueType: 'segment-token-gap',
      segmentKind: 'paragraph',
      missingTokens: ['/docs/index'],
    });
    assert.equal(r, false);
    const entry = c
      .snapshot()
      .quotaUsage.find((u) => u.reason === 'tricentis-testim-io-url-removal');
    assert.equal(entry.used, 0, 'quota must not decrement on mismatch');
  });
});

// ---------------------------------------------------------------------------
// NOOP_OMISSION_COVERAGE — default for non-integrated callers
// ---------------------------------------------------------------------------

describe('NOOP_OMISSION_COVERAGE', () => {
  it('consume always returns false', () => {
    assert.equal(
      NOOP_OMISSION_COVERAGE.consume({
        slug: 'overview/testim-overview',
        issueType: 'segment-missing',
        segmentKind: 'callout-body',
      }),
      false,
    );
  });

  it('snapshot returns 0 hits with quotaUsage populated from registry', () => {
    const s = NOOP_OMISSION_COVERAGE.snapshot();
    assert.equal(s.matchedHits, 0);
    assert.equal(s.registryEntries, registryEntries().length);
    assert.ok(Array.isArray(s.quotaUsage));
    assert.equal(s.quotaUsage.length, registryEntries().length);
    for (const u of s.quotaUsage) {
      assert.equal(u.used, 0);
      assert.equal(u.remaining, u.quota);
    }
  });
});

// ---------------------------------------------------------------------------
// alignSegments integration — §5.3.3 suppression in practice
// ---------------------------------------------------------------------------

describe('alignSegments — §5.3.3 JA omission policy integration', () => {
  it('suppresses segment-missing callout-body in overview/testim-overview (quota-based)', () => {
    // EN には callout-body が 2 つ、JA には 0。通常なら segment-missing × 2 が
    // 出るが registry の quota=2 で両方抑止される。
    const en = [
      makeSeg('', 'paragraph', 0, 'Intro paragraph.'),
      makeSeg('', 'callout-body', 0, 'Pricing information removed.'),
      makeSeg('', 'callout-body', 1, 'Changelog callout body.'),
    ];
    const ja = [makeSeg('', 'paragraph', 0, '紹介段落')];
    const coverage = createOmissionCoverage();
    const result = alignSegments(en, ja, {
      slug: 'overview/testim-overview',
      omissionCoverage: coverage,
    });
    const missing = result.diffs.filter((d) => d.type === 'segment-missing');
    assert.equal(
      missing.length,
      0,
      `callout-body segment-missing should be suppressed (got ${missing.length})`,
    );
    const snap = coverage.snapshot();
    assert.ok(snap.matchedHits >= 2, 'coverage should record both hits');
    assert.equal(snap.bySlug['overview/testim-overview'] >= 2, true);
  });

  it('does NOT suppress segment-missing for unregistered slug', () => {
    const en = [
      makeSeg('', 'paragraph', 0, 'Intro.'),
      makeSeg('', 'callout-body', 0, 'Callout body.'),
    ];
    const ja = [makeSeg('', 'paragraph', 0, '紹介段落')];
    const coverage = createOmissionCoverage();
    const result = alignSegments(en, ja, {
      slug: 'unregistered/slug',
      omissionCoverage: coverage,
    });
    const missing = result.diffs.filter((d) => d.type === 'segment-missing');
    assert.ok(missing.length >= 1, 'unregistered slug should emit segment-missing');
    assert.equal(coverage.snapshot().matchedHits, 0);
  });

  it('suppresses section-structure-mismatch (segmentKinds=null)', () => {
    // EN: p → callout → p → ul → callout
    // JA: p → p → ul → callout
    const en = [
      makeSeg('', 'paragraph', 0, 'Intro paragraph with http://testim.io.'),
      makeSeg('', 'callout-body', 0, 'Pricing callout.'),
      makeSeg('', 'paragraph', 1, 'Second EN paragraph.'),
      makeSeg('', 'unordered-list-item', 0, 'list 1'),
      makeSeg('', 'callout-body', 1, 'Changelog callout.'),
    ];
    const ja = [
      makeSeg('', 'paragraph', 0, '紹介段落'),
      makeSeg('', 'paragraph', 1, '2 つ目の段落'),
      makeSeg('', 'unordered-list-item', 0, 'リスト 1'),
      makeSeg('', 'callout-body', 0, '変更履歴 callout。'),
    ];
    const coverage = createOmissionCoverage();
    const result = alignSegments(en, ja, {
      slug: 'overview/testim-overview',
      omissionCoverage: coverage,
    });
    const structure = result.diffs.filter((d) => d.type === 'section-structure-mismatch');
    assert.equal(structure.length, 0, 'structure mismatch should be suppressed');
    const snap = coverage.snapshot();
    const hits = snap.byIssueType['section-structure-mismatch'] ?? 0;
    assert.equal(hits, 1);
  });

  it('default NOOP_OMISSION_COVERAGE (no option) does not suppress anything', () => {
    const en = [
      makeSeg('', 'paragraph', 0, 'Intro.'),
      makeSeg('', 'callout-body', 0, 'Pricing callout.'),
    ];
    const ja = [makeSeg('', 'paragraph', 0, '紹介段落')];
    const result = alignSegments(en, ja, { slug: 'overview/testim-overview' });
    const missing = result.diffs.filter((d) => d.type === 'segment-missing');
    assert.ok(
      missing.length >= 1,
      'without omissionCoverage option, suppression is no-op and diffs still surface',
    );
  });
});
