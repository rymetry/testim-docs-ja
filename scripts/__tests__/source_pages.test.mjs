import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

let extractArticleHtml;
let extractDisplayRelativeDate;
let extractDocumentUpdatedAt;
let extractMetadataUpdatedAt;
let fetchSourcePageInfo;
let parseRelativeTime;
let resolveSourcePageInfo;
let toIsoDateInTimeZone;

before(async () => {
  ({
    extractArticleHtml,
    extractDisplayRelativeDate,
    extractDocumentUpdatedAt,
    extractMetadataUpdatedAt,
    fetchSourcePageInfo,
    parseRelativeTime,
    resolveSourcePageInfo,
    toIsoDateInTimeZone,
  } = await import('../lib/source_pages.mjs'));
});

describe('toIsoDateInTimeZone', () => {
  it('normalizes absolute timestamps using the project timezone', () => {
    assert.equal(toIsoDateInTimeZone('2025-09-18T21:08:46.000Z'), '2025-09-19');
  });
});

describe('parseRelativeTime', () => {
  it('parses relative text with HTML comments', () => {
    const now = new Date('2026-03-19T00:00:00Z');
    const result = parseRelativeTime('Updated <!-- note --> about 2 weeks ago', now);
    assert.equal(result, '2026-03-05');
  });
});

describe('extractDocumentUpdatedAt', () => {
  it('extracts document.updated_at from ssr-props JSON', () => {
    const html =
      '<script id="ssr-props" type="application/json">{"document":{"updated_at":"2025-09-18T21:08:46.000Z"}}</script>';
    assert.equal(extractDocumentUpdatedAt(html), '2025-09-19');
  });
});

describe('extractMetadataUpdatedAt', () => {
  it('extracts updatedAt from redux state JSON', () => {
    const html =
      '<script>window.__REDUX_STATE__={"context":{"page":{"updatedAt":"2026-01-15T13:52:49.000Z"}}}</script>';
    assert.equal(
      extractMetadataUpdatedAt(html, 'https://help.testim.io/docs/example-page'),
      '2026-01-15'
    );
  });

  it('escapes regex metacharacters in slug fallback matching', () => {
    const html =
      '{"slug":"example.page","updatedAt":"2026-02-11T00:00:00.000Z"}{"slug":"exampleXpage","updatedAt":"2025-01-01T00:00:00.000Z"}';
    assert.equal(
      extractMetadataUpdatedAt(html, 'https://help.testim.io/docs/example.page'),
      '2026-02-11'
    );
  });
});

describe('extractDisplayRelativeDate', () => {
  it('extracts the visible relative date', () => {
    const now = new Date('2026-03-19T00:00:00Z');
    const result = extractDisplayRelativeDate('<p>Updated 6 months ago</p>', now);
    assert.equal(result.displayRelativeDate, '2025-09-19');
    assert.equal(result.displayRelativeText, 'Updated 6 months ago');
  });
});

describe('resolveSourcePageInfo', () => {
  it('falls back to the visible relative date when metadata is missing', () => {
    const now = new Date('2026-03-19T00:00:00Z');
    const html = `
      <main>
        <nav><h2>Sidebar</h2></nav>
        <h1>Example</h1>
        <h2>Section</h2>
        <p>Updated 6 months ago</p>
      </main>
    `;
    const result = resolveSourcePageInfo({
      html,
      url: 'https://help.testim.io/docs/example',
      now,
    });
    assert.equal(result.resolvedSourceDate, '2025-09-19');
    assert.equal(result.comparisonSourceDate, '2025-09-19');
    assert.equal(result.sourceDateKind, 'display-relative-date');
    assert.equal(result.comparisonSourceKind, 'display-relative-date');
    assert.equal(result.contentRootExtractable, true);
  });

  it('marks fallback divergence and applies exceptions only for the comparison source date', () => {
    const now = new Date('2026-03-19T00:00:00Z');
    const html = `
      <script>window.__REDUX_STATE__={"context":{"page":{"updatedAt":"2026-01-15T00:00:00.000Z"}}}</script>
      <main>
        <h1>Example</h1>
        <p>Updated 6 months ago</p>
      </main>
    `;
    const result = resolveSourcePageInfo({
      html,
      url: 'https://help.testim.io/docs/example',
      now,
      exception: {
        ignoredSourceDate: '2025-09-19',
        reason: 'No substantive content change',
        reviewedAt: '2026-03-19',
      },
    });
    assert.equal(result.metadataUpdatedAt, '2026-01-15');
    assert.equal(result.displayRelativeDate, '2025-09-19');
    assert.equal(result.resolvedSourceDate, '2026-01-15');
    assert.equal(result.comparisonSourceDate, '2025-09-19');
    assert.equal(result.sourceDateKind, 'metadata-updatedAt');
    assert.equal(result.comparisonSourceKind, 'display-relative-date');
    assert.equal(result.metadataDisplayDivergence, true);
    assert.equal(result.documentDisplayDivergence, false);
    assert.equal(result.sourceDateDivergence, true);
    assert.equal(result.exceptionApplied, true);
  });

  it('keeps metadata divergence diagnostic-only when document.updated_at matches the displayed JST date', () => {
    const now = new Date('2026-03-19T00:00:00Z');
    const html = `
      <script id="ssr-props" type="application/json">{"document":{"updated_at":"2025-09-18T21:08:46.000Z"}}</script>
      <script>window.__REDUX_STATE__={"context":{"page":{"updatedAt":"2026-01-15T00:00:00.000Z"}}}</script>
      <main>
        <h1>Example</h1>
        <p>Updated 6 months ago</p>
      </main>
    `;
    const result = resolveSourcePageInfo({
      html,
      url: 'https://help.testim.io/docs/example',
      now,
    });
    assert.equal(result.documentUpdatedAt, '2025-09-19');
    assert.equal(result.metadataUpdatedAt, '2026-01-15');
    assert.equal(result.displayRelativeDate, '2025-09-19');
    assert.equal(result.resolvedSourceDate, '2025-09-19');
    assert.equal(result.comparisonSourceDate, '2025-09-19');
    assert.equal(result.sourceDateKind, 'document-updated-at');
    assert.equal(result.comparisonSourceKind, 'document-updated-at');
    assert.equal(result.metadataDisplayDivergence, true);
    assert.equal(result.documentDisplayDivergence, false);
    assert.equal(result.sourceDateDivergence, false);
  });

  it('prefers document.updated_at when it truly diverges from the visible date', () => {
    const now = new Date('2026-03-19T00:00:00Z');
    const html = `
      <script id="ssr-props" type="application/json">{"document":{"updated_at":"2025-09-18T03:00:00.000Z"}}</script>
      <script>window.__REDUX_STATE__={"context":{"page":{"updatedAt":"2026-01-15T00:00:00.000Z"}}}</script>
      <main>
        <h1>Example</h1>
        <p>Updated 6 months ago</p>
      </main>
    `;
    const result = resolveSourcePageInfo({
      html,
      url: 'https://help.testim.io/docs/example',
      now,
      exception: {
        ignoredSourceDate: '2025-09-19',
        reason: 'No substantive content change',
        reviewedAt: '2026-03-19',
      },
    });
    assert.equal(result.documentUpdatedAt, '2025-09-18');
    assert.equal(result.metadataUpdatedAt, '2026-01-15');
    assert.equal(result.displayRelativeDate, '2025-09-19');
    assert.equal(result.resolvedSourceDate, '2025-09-18');
    assert.equal(result.comparisonSourceDate, '2025-09-18');
    assert.equal(result.sourceDateKind, 'document-updated-at');
    assert.equal(result.comparisonSourceKind, 'document-updated-at');
    assert.equal(result.metadataDisplayDivergence, true);
    assert.equal(result.documentDisplayDivergence, true);
    assert.equal(result.sourceDateDivergence, false);
    assert.equal(result.exceptionApplied, false);
  });

  it('treats document/display divergence as non-actionable when document.updated_at is authoritative', () => {
    const now = new Date('2026-03-19T00:00:00Z');
    const html = `
      <script id="ssr-props" type="application/json">{"document":{"updated_at":"2025-09-23T07:50:53.000Z"}}</script>
      <main>
        <h1>Example</h1>
        <p>Updated 6 months ago</p>
      </main>
    `;
    const result = resolveSourcePageInfo({
      html,
      url: 'https://help.testim.io/docs/example',
      now,
    });
    assert.equal(result.documentUpdatedAt, '2025-09-23');
    assert.equal(result.displayRelativeDate, '2025-09-19');
    assert.equal(result.comparisonSourceDate, '2025-09-23');
    assert.equal(result.comparisonSourceKind, 'document-updated-at');
    assert.equal(result.documentDisplayDivergence, true);
    assert.equal(result.sourceDateDivergence, false);
  });
});

describe('extractArticleHtml', () => {
  it('extracts article content after the first h1 and before footer markers', () => {
    const html = `
      <main>
        <nav><h2>Sidebar</h2></nav>
        <h1>Article title</h1>
        <p>Intro</p>
        <h2>Section</h2>
        <img src="/image.png" />
        <p>Updated 6 months ago</p>
        <footer>Footer</footer>
      </main>
    `;
    const result = extractArticleHtml(html);
    assert.equal(result.contentRootExtractable, true);
    assert.match(result.articleHtml, /<h1\b/i);
    assert.match(result.articleHtml, /<h2\b/i);
    assert.doesNotMatch(result.articleHtml, /Sidebar/);
    assert.doesNotMatch(result.articleHtml, /Updated 6 months ago/);
  });
});

describe('fetchSourcePageInfo', () => {
  it('returns fetch-error details without throwing', async () => {
    const result = await fetchSourcePageInfo('https://help.testim.io/docs/example', {
      fetchImpl: async () => ({ ok: false, status: 503 }),
    });
    assert.equal(result.fetchError, 'HTTP 503');
    assert.equal(result.documentUpdatedAt, null);
    assert.equal(result.metadataDisplayDivergence, false);
    assert.equal(result.documentDisplayDivergence, false);
    assert.equal(result.resolvedSourceDate, null);
    assert.equal(result.comparisonSourceDate, null);
  });
});
