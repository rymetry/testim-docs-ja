import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';

let parseAmdModule;
let buildIndexLookup;
let buildSections;
let extractSlug;
let resolveUrl;
let buildSidebarSnapshot;
let extractSlugsFromSnapshot;

before(async () => {
  ({
    parseAmdModule,
    buildIndexLookup,
    buildSections,
    extractSlug,
    resolveUrl,
    buildSidebarSnapshot,
    extractSlugsFromSnapshot,
  } = await import('../lib/madcap_toc.mjs'));
});

// ---------------------------------------------------------------------------
// parseAmdModule
// ---------------------------------------------------------------------------
describe('parseAmdModule', () => {
  it('parses a simple define() wrapper with unquoted keys', () => {
    const js = "define({numchunks:2,prefix:'Main_Chunk'});";
    const result = parseAmdModule(js);
    assert.equal(result.numchunks, 2);
    assert.equal(result.prefix, 'Main_Chunk');
  });

  it('parses chunk data with path keys and array values', () => {
    const js = `define({'/content/overview/testim-overview/index.htm':{i:[3],t:['Testim overview'],b:['']}});`;
    const result = parseAmdModule(js);
    const entry = result['/content/overview/testim-overview/index.htm'];
    assert.deepEqual(entry.i, [3]);
    assert.deepEqual(entry.t, ['Testim overview']);
  });

  it('handles unicode escapes in values', () => {
    const js = `define({'/content/test.htm':{i:[1],t:['Drag \\u0026 Drop'],b:['']}});`;
    const result = parseAmdModule(js);
    assert.equal(result['/content/test.htm'].t[0], 'Drag & Drop');
  });

  it('handles tree structure with nested nodes', () => {
    const js = 'define({tree:{n:[{i:0,c:0},{i:1,c:1,n:[{i:2,c:0}]}]}});';
    const result = parseAmdModule(js);
    assert.equal(result.tree.n.length, 2);
    assert.equal(result.tree.n[1].n[0].i, 2);
  });
});

// ---------------------------------------------------------------------------
// buildIndexLookup
// ---------------------------------------------------------------------------
describe('buildIndexLookup', () => {
  it('builds a map from index to url and title', () => {
    const chunks = [
      {
        '/content/overview/testim-overview/index.htm': { i: [3], t: ['Testim overview'], b: [''] },
        '/content/overview/testim-automate.htm': { i: [4], t: ['Web and Mobile Testing'], b: [''] },
      },
    ];
    const lookup = buildIndexLookup(chunks);
    assert.equal(lookup.get(3).url, '/content/overview/testim-overview/index.htm');
    assert.equal(lookup.get(3).title, 'Testim overview');
    assert.equal(lookup.get(4).title, 'Web and Mobile Testing');
  });

  it('merges multiple chunks', () => {
    const chunks = [
      { '/content/a.htm': { i: [1], t: ['Page A'], b: [''] } },
      { '/content/b.htm': { i: [2], t: ['Page B'], b: [''] } },
    ];
    const lookup = buildIndexLookup(chunks);
    assert.equal(lookup.size, 2);
    assert.equal(lookup.get(1).title, 'Page A');
    assert.equal(lookup.get(2).title, 'Page B');
  });

  it('handles ___ multi-index entry for section headings', () => {
    const chunks = [
      {
        '/content/page.htm': { i: [10], t: ['A Page'], b: [''] },
        '___': { i: [1, 8, 12], t: ['Overview', 'Getting Started', 'Recording'], b: ['', '', ''] },
      },
    ];
    const lookup = buildIndexLookup(chunks);
    assert.equal(lookup.size, 4);
    assert.equal(lookup.get(1).title, 'Overview');
    assert.equal(lookup.get(8).title, 'Getting Started');
    assert.equal(lookup.get(12).title, 'Recording');
    assert.equal(lookup.get(10).title, 'A Page');
  });
});

// ---------------------------------------------------------------------------
// extractSlug
// ---------------------------------------------------------------------------
describe('extractSlug', () => {
  it('extracts slug from /slug/index.htm path', () => {
    assert.equal(extractSlug('/content/overview/testim-overview/index.htm'), 'testim-overview');
  });

  it('extracts slug from /slug.htm path', () => {
    assert.equal(extractSlug('/content/overview/testim-automate.htm'), 'testim-automate');
  });

  it('returns null for invalid path', () => {
    assert.equal(extractSlug('/content/'), null);
  });

  it('lowercases the slug', () => {
    assert.equal(extractSlug('/content/Overview/TestPage.htm'), 'testpage');
  });

  it('extracts slug with underscores', () => {
    assert.equal(extractSlug('/content/integrations/visual-validation/lambdatest_integration.htm'), 'lambdatest_integration');
  });

  it('extracts slug with underscores from index path', () => {
    assert.equal(extractSlug('/content/integrations/visual_validation/index.htm'), 'visual_validation');
  });
});

// ---------------------------------------------------------------------------
// resolveUrl
// ---------------------------------------------------------------------------
describe('resolveUrl', () => {
  it('resolves path starting with /', () => {
    assert.equal(
      resolveUrl('/content/overview/testim-overview/index.htm'),
      'https://docs.tricentis.com/testim/content/overview/testim-overview/index.htm',
    );
  });

  it('resolves path without leading /', () => {
    assert.equal(
      resolveUrl('content/test.htm'),
      'https://docs.tricentis.com/testim/content/test.htm',
    );
  });

  it('uses custom base URL', () => {
    assert.equal(
      resolveUrl('/content/test.htm', 'https://example.com'),
      'https://example.com/content/test.htm',
    );
  });
});

// ---------------------------------------------------------------------------
// buildSections
// ---------------------------------------------------------------------------
describe('buildSections', () => {
  it('builds sections from tree and lookup', () => {
    const tree = {
      n: [
        { i: 0, c: 0 },
        { i: 1, c: 0, n: [{ i: 2, c: 0 }, { i: 3, c: 0 }] },
      ],
    };
    const lookup = new Map([
      [0, { url: '', title: 'Home' }],
      [1, { url: '/content/overview', title: 'Overview' }],
      [2, { url: '/content/overview/testim-overview/index.htm', title: 'Testim overview' }],
      [3, { url: '/content/overview/testim-automate.htm', title: 'Web and Mobile Testing' }],
    ]);

    const sections = buildSections(tree, lookup);
    assert.equal(sections.length, 2);
    assert.equal(sections[0].title, 'Home');
    assert.equal(sections[0].pages.length, 0);
    assert.equal(sections[1].title, 'Overview');
    assert.equal(sections[1].pages.length, 2);
    assert.equal(sections[1].pages[0].slug, 'testim-overview');
  });

  it('emits top-level leaf node with content URL as a self-contained page', () => {
    const tree = {
      n: [
        { i: 0, c: 0 },
        { i: 1, c: 0, n: [{ i: 2, c: 0 }] },
      ],
    };
    const lookup = new Map([
      [0, { url: '/content/changelog.htm', title: 'Changelog' }],
      [1, { url: '/content/overview', title: 'Overview' }],
      [2, { url: '/content/overview/testim-overview/index.htm', title: 'Testim overview' }],
    ]);

    const sections = buildSections(tree, lookup);
    assert.equal(sections[0].title, 'Changelog');
    assert.equal(sections[0].pages.length, 1);
    assert.equal(sections[0].pages[0].slug, 'changelog');
    assert.equal(sections[0].pages[0].title, 'Changelog');
  });

  it('excludes non-doc leaf slugs like home', () => {
    const tree = { n: [{ i: 0, c: 0 }] };
    const lookup = new Map([
      [0, { url: '/content/home.htm', title: 'Home' }],
    ]);
    const sections = buildSections(tree, lookup);
    assert.equal(sections[0].pages.length, 0);
  });

  it('skips duplicate leaf slugs already claimed by another section', () => {
    const tree = {
      n: [
        { i: 0, c: 0, n: [{ i: 1, c: 0 }] },
        { i: 2, c: 0 },
      ],
    };
    const lookup = new Map([
      [0, { url: '/content/overview', title: 'Overview' }],
      [1, { url: '/content/overview/changelog.htm', title: 'Changelog' }],
      [2, { url: '/content/salesforce/changelog.htm', title: 'SF Changelog' }],
    ]);
    const sections = buildSections(tree, lookup);
    // First section has changelog as a child page
    assert.equal(sections[0].pages.length, 1);
    assert.equal(sections[0].pages[0].slug, 'changelog');
    // Second section's leaf would collide — skipped
    assert.equal(sections[1].pages.length, 0);
  });

  it('deduplicates child pages with the same slug across sections', () => {
    const tree = {
      n: [
        { i: 0, c: 0 },
        { i: 1, c: 0, n: [{ i: 2, c: 0 }] },
      ],
    };
    const lookup = new Map([
      [0, { url: '/content/overview/changelog.htm', title: 'Changelog' }],
      [1, { url: '/content/salesforce', title: 'Salesforce' }],
      [2, { url: '/content/salesforce/changelog.htm', title: 'SF Changelog' }],
    ]);
    const sections = buildSections(tree, lookup);
    // Leaf promotion claims 'changelog' first
    assert.equal(sections[0].pages.length, 1);
    assert.equal(sections[0].pages[0].slug, 'changelog');
    // Child page with same slug is dropped
    assert.equal(sections[1].pages.length, 0);
  });

  it('skips nodes not found in lookup', () => {
    const tree = { n: [{ i: 999, c: 0 }] };
    const lookup = new Map();
    const sections = buildSections(tree, lookup);
    assert.equal(sections.length, 0);
  });
});

// ---------------------------------------------------------------------------
// buildSidebarSnapshot + extractSlugsFromSnapshot
// ---------------------------------------------------------------------------
describe('buildSidebarSnapshot', () => {
  it('builds a serializable snapshot', () => {
    const sections = [
      {
        title: 'Overview',
        url: '/content/overview',
        pages: [
          { title: 'Testim overview', url: '/content/overview/testim-overview/index.htm', slug: 'testim-overview' },
        ],
      },
    ];
    const snapshot = buildSidebarSnapshot(sections);
    assert.equal(snapshot.sections.length, 1);
    assert.equal(snapshot.sections[0].pages[0].slug, 'testim-overview');
    assert.ok(snapshot.sections[0].pages[0].url.startsWith('https://'));
    assert.ok(snapshot.fetchedAt);
  });
});

describe('extractSlugsFromSnapshot', () => {
  it('extracts all slugs from a snapshot', () => {
    const snapshot = {
      sections: [
        { title: 'A', pages: [{ slug: 'foo', url: 'x', title: 'Foo' }] },
        { title: 'B', pages: [{ slug: 'bar', url: 'y', title: 'Bar' }, { slug: null, url: 'z', title: 'Z' }] },
      ],
    };
    const slugs = extractSlugsFromSnapshot(snapshot);
    assert.equal(slugs.size, 2);
    assert.ok(slugs.has('foo'));
    assert.ok(slugs.has('bar'));
  });
});
