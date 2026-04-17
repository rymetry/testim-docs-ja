// scripts/__tests__/bulk_wave5_fix.test.mjs
/**
 * bulk_wave5_fix — Wave 5 long-tail bulk-fix mechanism (prototype).
 *
 * Coverage targets:
 *   1. CLI arg parsing (default dry-run, --apply, --slug filter).
 *   2. Wave 5 slug selection from baseline (Tier C = <= 2 entries per slug).
 *   3. Three prototyped patterns exercised against fixture status + content:
 *      - generic-english-residue (reporting-only, confidence=0.0)
 *      - url-verbatim (deterministic swap candidate, confidence=0.5)
 *      - ja-extra-intro-paragraph (report-only candidate, confidence=0.2)
 *   4. `--dry-run` must NOT write (assert fs.writeFileSync is never called).
 *   5. `--apply` only writes high-confidence candidates (>= 0.5).
 *   6. `buildCandidates` output is deterministic for identical inputs.
 */

import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';

let parseCliArgs;
let selectWave5Slugs;
let applySlugFilter;
let buildCandidates;
let applyCandidates;
let IMPLEMENTED_PATTERNS;

before(async () => {
  ({
    parseCliArgs,
    selectWave5Slugs,
    applySlugFilter,
    buildCandidates,
    applyCandidates,
    IMPLEMENTED_PATTERNS,
  } = await import('../bulk_wave5_fix.mjs'));
});

// ---------------------------------------------------------------------------
// Fixtures — inlined so tests do not need on-disk parity-check-status.json.
// ---------------------------------------------------------------------------

function buildFixtureBaseline() {
  // Two Tier C slugs (<= 2 entries), one Tier B slug (3 entries) to confirm
  // the <= 2 filter excludes it.
  return {
    entries: [
      // Tier C: 2 entries — url-verbatim flavor.
      { slug: 'group-a/url-slug', issueType: 'segment-token-gap' },
      { slug: 'group-a/url-slug', issueType: 'segment-token-gap' },
      // Tier C: 1 entry — residue flavor.
      { slug: 'group-b/residue-slug', issueType: 'segment-untranslated' },
      // Tier C: 2 entries — structure flavor.
      { slug: 'group-c/structure-slug', issueType: 'section-structure-mismatch' },
      { slug: 'group-c/structure-slug', issueType: 'segment-extra' },
      // Tier B (excluded from Wave 5).
      { slug: 'group-d/big-slug', issueType: 'segment-missing' },
      { slug: 'group-d/big-slug', issueType: 'segment-extra' },
      { slug: 'group-d/big-slug', issueType: 'section-structure-mismatch' },
    ],
  };
}

function buildFixtureStatus() {
  return {
    files: [
      {
        file: 'src/content/docs/group-a/url-slug.md',
        issues: [
          {
            type: 'segment-token-gap',
            severity: 'actionable',
            segmentKind: 'paragraph',
            sectionPath: 'Links Section',
            missingTokens: ['/docs/configuration-file-run-hooks'],
            detail: 'JA paragraph is missing invariant tokens: /docs/configuration-file-run-hooks',
          },
          {
            type: 'segment-token-gap',
            severity: 'actionable',
            segmentKind: 'paragraph',
            sectionPath: 'Links Section',
            missingTokens: ['-variable'],
            detail: 'JA paragraph is missing invariant tokens: -variable',
          },
        ],
      },
      {
        file: 'src/content/docs/group-b/residue-slug.md',
        issues: [
          {
            type: 'segment-untranslated',
            severity: 'actionable',
            segmentKind: 'paragraph',
            sectionPath: 'Untranslated Section',
            detail: 'JA paragraph appears to be untranslated English',
          },
        ],
      },
      {
        file: 'src/content/docs/group-c/structure-slug.md',
        issues: [
          {
            type: 'section-structure-mismatch',
            severity: 'actionable',
            sectionPath: 'Extra Paragraph Section',
            enKinds: ['paragraph', 'ordered-list'],
            jaKinds: ['paragraph', 'paragraph', 'ordered-list'],
          },
          {
            type: 'segment-extra',
            severity: 'actionable',
            sectionPath: 'Extra Paragraph Section',
            segmentKind: 'paragraph',
            detail: 'JA paragraph has no EN counterpart',
          },
        ],
      },
      {
        file: 'src/content/docs/group-d/big-slug.md',
        issues: [],
      },
    ],
  };
}

/**
 * Memory-backed FS shim. `writes` records every writeFileSync call so tests can
 * assert that --dry-run never writes.
 */
function buildMemoryFs(initialFiles) {
  const files = new Map(Object.entries(initialFiles));
  const writes = [];
  return {
    files,
    writes,
    readFileSync: (path) => {
      if (!files.has(path)) throw new Error(`ENOENT: ${path}`);
      return files.get(path);
    },
    writeFileSync: (path, content) => {
      writes.push({ path, content });
      files.set(path, content);
    },
    existsSync: (path) => files.has(path),
  };
}

// ---------------------------------------------------------------------------
// Test 1 — CLI arg parsing
// ---------------------------------------------------------------------------

describe('parseCliArgs', () => {
  it('defaults to dry-run', () => {
    const opts = parseCliArgs(['--pattern=url-verbatim']);
    assert.equal(opts.dryRun, true);
    assert.equal(opts.apply, false);
    assert.equal(opts.pattern, 'url-verbatim');
    assert.equal(opts.slugs, null);
  });

  it('parses --apply and unsets dry-run', () => {
    const opts = parseCliArgs(['--pattern=url-verbatim', '--apply']);
    assert.equal(opts.apply, true);
    assert.equal(opts.dryRun, false);
  });

  it('parses --slug=csv into an array', () => {
    const opts = parseCliArgs(['--pattern=url-verbatim', '--slug=a/b,c/d']);
    assert.deepEqual(opts.slugs, ['a/b', 'c/d']);
  });

  it('--dry-run overrides a prior --apply later in argv', () => {
    const opts = parseCliArgs(['--pattern=p', '--apply', '--dry-run']);
    assert.equal(opts.dryRun, true);
    assert.equal(opts.apply, false);
  });

  it('exposes the implemented pattern list', () => {
    assert.ok(Array.isArray(IMPLEMENTED_PATTERNS));
    assert.ok(IMPLEMENTED_PATTERNS.includes('generic-english-residue'));
    assert.ok(IMPLEMENTED_PATTERNS.includes('url-verbatim'));
    assert.ok(IMPLEMENTED_PATTERNS.includes('ja-extra-intro-paragraph'));
  });
});

// ---------------------------------------------------------------------------
// Test 2 — Wave 5 slug selection
// ---------------------------------------------------------------------------

describe('selectWave5Slugs', () => {
  it('returns slugs with <= 2 baseline entries, sorted', () => {
    const slugs = selectWave5Slugs(buildFixtureBaseline());
    assert.deepEqual(slugs, ['group-a/url-slug', 'group-b/residue-slug', 'group-c/structure-slug']);
    // Tier B slug excluded.
    assert.ok(!slugs.includes('group-d/big-slug'));
  });

  it('applySlugFilter narrows to the requested subset', () => {
    const slugs = selectWave5Slugs(buildFixtureBaseline());
    const filtered = applySlugFilter(slugs, ['group-b/residue-slug']);
    assert.deepEqual(filtered, ['group-b/residue-slug']);
  });

  it('applySlugFilter with null filter returns original', () => {
    const slugs = ['a', 'b', 'c'];
    assert.deepEqual(applySlugFilter(slugs, null), slugs);
    assert.deepEqual(applySlugFilter(slugs, []), slugs);
  });
});

// ---------------------------------------------------------------------------
// Test 3a — url-verbatim pattern
// ---------------------------------------------------------------------------

describe('buildCandidates — url-verbatim', () => {
  it('proposes a verbatim URL swap when JA basename matches the missing EN token', () => {
    const mem = buildMemoryFs({
      '/fake-root/src/content/docs/group-a/url-slug.md': [
        '---',
        'title: Demo',
        '---',
        '',
        'Line one mentions a link to',
        '[configure hooks](/docs/running-tests/configuration-file-run-hooks) here.',
        '',
      ].join('\n'),
    });

    const report = buildCandidates({
      pattern: 'url-verbatim',
      slugs: ['group-a/url-slug'],
      baseline: buildFixtureBaseline(),
      status: buildFixtureStatus(),
      root: '/fake-root',
      fs: mem,
    });

    const hiConf = report.candidates.filter((c) => c.confidence >= 0.5);
    assert.equal(hiConf.length, 1, 'exactly one high-confidence URL swap expected');
    assert.equal(hiConf[0].before, '/docs/running-tests/configuration-file-run-hooks');
    assert.equal(hiConf[0].after, '/docs/configuration-file-run-hooks');
    assert.equal(hiConf[0].line, 6); // 1-based line number

    // Low-confidence report for the CLI-flag missing-token (no URL swap possible).
    const loConf = report.candidates.filter((c) => c.confidence === 0.0);
    assert.equal(loConf.length, 1);
    assert.match(loConf[0].before, /-variable/);

    // Dry-run must not write.
    assert.equal(mem.writes.length, 0);
  });

  it('produces deterministic output on identical input', () => {
    const baseline = buildFixtureBaseline();
    const status = buildFixtureStatus();
    const content = '[link](/docs/running-tests/configuration-file-run-hooks)\n';
    const makeFs = () =>
      buildMemoryFs({ '/r/src/content/docs/group-a/url-slug.md': content });
    const first = buildCandidates({
      pattern: 'url-verbatim',
      slugs: ['group-a/url-slug'],
      baseline,
      status,
      root: '/r',
      fs: makeFs(),
    });
    const second = buildCandidates({
      pattern: 'url-verbatim',
      slugs: ['group-a/url-slug'],
      baseline,
      status,
      root: '/r',
      fs: makeFs(),
    });
    const redact = (c) => ({
      pattern: c.pattern,
      slug: c.slug,
      line: c.line,
      before: c.before,
      after: c.after,
      confidence: c.confidence,
    });
    assert.deepEqual(first.candidates.map(redact), second.candidates.map(redact));
  });
});

// ---------------------------------------------------------------------------
// Test 3b — generic-english-residue pattern
// ---------------------------------------------------------------------------

describe('buildCandidates — generic-english-residue', () => {
  it('reports each segment-untranslated issue as zero-confidence manual-rewrite candidate', () => {
    const mem = buildMemoryFs({
      '/r/src/content/docs/group-b/residue-slug.md': '# Body\n\n(placeholder)\n',
    });
    const report = buildCandidates({
      pattern: 'generic-english-residue',
      slugs: ['group-b/residue-slug'],
      baseline: buildFixtureBaseline(),
      status: buildFixtureStatus(),
      root: '/r',
      fs: mem,
    });
    assert.equal(report.candidates.length, 1);
    assert.equal(report.candidates[0].confidence, 0.0);
    assert.match(report.candidates[0].after, /manual rewrite required/);
    assert.equal(mem.writes.length, 0);
  });
});

// ---------------------------------------------------------------------------
// Test 3c — ja-extra-intro-paragraph pattern
// ---------------------------------------------------------------------------

describe('buildCandidates — ja-extra-intro-paragraph', () => {
  it('flags sections with exactly one extra JA paragraph', () => {
    const mem = buildMemoryFs({
      '/r/src/content/docs/group-c/structure-slug.md': '# Body\n\n(placeholder)\n',
    });
    const report = buildCandidates({
      pattern: 'ja-extra-intro-paragraph',
      slugs: ['group-c/structure-slug'],
      baseline: buildFixtureBaseline(),
      status: buildFixtureStatus(),
      root: '/r',
      fs: mem,
    });
    assert.equal(report.candidates.length, 1);
    assert.equal(report.candidates[0].confidence, 0.2);
    assert.equal(report.candidates[0].pattern, 'ja-extra-intro-paragraph');
    assert.equal(mem.writes.length, 0);
  });

  it('does not flag structure issues with multi-kind mismatch', () => {
    const status = {
      files: [
        {
          file: 'src/content/docs/group-c/structure-slug.md',
          issues: [
            {
              type: 'section-structure-mismatch',
              severity: 'actionable',
              sectionPath: 'Mixed',
              // JA has an extra paragraph AND an extra ordered-list — not the
              // pure "intro paragraph" pattern.
              enKinds: ['paragraph', 'ordered-list'],
              jaKinds: ['paragraph', 'paragraph', 'ordered-list', 'ordered-list'],
            },
            {
              type: 'segment-extra',
              severity: 'actionable',
              sectionPath: 'Mixed',
              segmentKind: 'paragraph',
            },
          ],
        },
      ],
    };
    const mem = buildMemoryFs({
      '/r/src/content/docs/group-c/structure-slug.md': '# Body\n',
    });
    const report = buildCandidates({
      pattern: 'ja-extra-intro-paragraph',
      slugs: ['group-c/structure-slug'],
      baseline: buildFixtureBaseline(),
      status,
      root: '/r',
      fs: mem,
    });
    assert.equal(report.candidates.length, 0);
  });
});

// ---------------------------------------------------------------------------
// Test 4 — dry-run never writes
// ---------------------------------------------------------------------------

describe('dry-run purity', () => {
  it('buildCandidates never writes to the injected fs', () => {
    const mem = buildMemoryFs({
      '/r/src/content/docs/group-a/url-slug.md': '[x](/docs/running-tests/configuration-file-run-hooks)\n',
      '/r/src/content/docs/group-b/residue-slug.md': 'x\n',
      '/r/src/content/docs/group-c/structure-slug.md': 'x\n',
    });
    for (const pattern of IMPLEMENTED_PATTERNS) {
      buildCandidates({
        pattern,
        slugs: null,
        baseline: buildFixtureBaseline(),
        status: buildFixtureStatus(),
        root: '/r',
        fs: mem,
      });
    }
    assert.equal(mem.writes.length, 0, 'dry-run must not invoke writeFileSync');
  });
});

// ---------------------------------------------------------------------------
// Test 5 — --apply writes only high-confidence candidates
// ---------------------------------------------------------------------------

describe('applyCandidates', () => {
  it('applies confidence >= 0.5 candidates only, rewriting the target line', () => {
    const originalContent = [
      '# Page',
      '',
      'See also [hooks](/docs/running-tests/configuration-file-run-hooks).',
      '',
    ].join('\n');
    const mem = buildMemoryFs({
      '/r/src/content/docs/group-a/url-slug.md': originalContent,
    });
    const report = buildCandidates({
      pattern: 'url-verbatim',
      slugs: ['group-a/url-slug'],
      baseline: buildFixtureBaseline(),
      status: buildFixtureStatus(),
      root: '/r',
      fs: mem,
    });
    // No writes yet.
    assert.equal(mem.writes.length, 0);

    const applied = applyCandidates(report.candidates, { fs: mem, minConfidence: 0.5 });
    assert.equal(applied.length, 1);
    assert.equal(mem.writes.length, 1);
    const [write] = mem.writes;
    assert.match(write.content, /\[hooks\]\(\/docs\/configuration-file-run-hooks\)/);
    assert.ok(!write.content.includes('/docs/running-tests/configuration-file-run-hooks'));
  });

  it('skips all candidates when every candidate is below the confidence threshold', () => {
    const mem = buildMemoryFs({
      '/r/src/content/docs/group-b/residue-slug.md': '# body\n',
    });
    const report = buildCandidates({
      pattern: 'generic-english-residue',
      slugs: ['group-b/residue-slug'],
      baseline: buildFixtureBaseline(),
      status: buildFixtureStatus(),
      root: '/r',
      fs: mem,
    });
    const applied = applyCandidates(report.candidates, { fs: mem, minConfidence: 0.5 });
    assert.equal(applied.length, 0);
    assert.equal(mem.writes.length, 0);
  });
});
