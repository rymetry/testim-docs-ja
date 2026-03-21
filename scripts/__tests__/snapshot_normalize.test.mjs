import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';

let extractSidebar;
let stripScriptAndStyle;
let stripAttributes;
let prettyPrint;
let normalizeSidebar;

before(async () => {
  ({
    extractSidebar,
    stripScriptAndStyle,
    stripAttributes,
    prettyPrint,
    normalizeSidebar,
  } = await import('../lib/snapshot_normalize.mjs'));
});

// ---------------------------------------------------------------------------
// extractSidebar
// ---------------------------------------------------------------------------
describe('extractSidebar', () => {
  it('extracts nav with id="hub-sidebar"', () => {
    const html = '<html><nav id="hub-sidebar"><ul><li>Item</li></ul></nav></html>';
    const result = extractSidebar(html);
    assert.equal(result.found, true);
    assert.match(result.html, /^<nav/);
    assert.match(result.html, /<\/nav>$/);
    assert.match(result.html, /<li>Item<\/li>/);
  });

  it('returns found: false when no hub-sidebar', () => {
    const html = '<html><nav id="other"><ul></ul></nav></html>';
    const result = extractSidebar(html);
    assert.equal(result.found, false);
  });

  it('handles nested nav tags correctly', () => {
    const html = '<nav id="hub-sidebar"><nav><ul><li>Nested</li></ul></nav></nav>';
    const result = extractSidebar(html);
    assert.equal(result.found, true);
    assert.match(result.html, /Nested/);
    // Should include the outer closing tag
    assert.ok(result.html.endsWith('</nav>'));
  });

  it('preserves full nesting depth (sections, categories, subpages)', () => {
    const html = `<nav id="hub-sidebar">
      <section><h2>Overview</h2>
        <ul><li><a href="/docs/overview">Overview</a>
          <ul><li><a href="/docs/sub">Sub</a></li></ul>
        </li></ul>
      </section>
    </nav>`;
    const result = extractSidebar(html);
    assert.equal(result.found, true);
    assert.match(result.html, /Overview/);
    assert.match(result.html, /Sub/);
  });
});

// ---------------------------------------------------------------------------
// stripScriptAndStyle
// ---------------------------------------------------------------------------
describe('stripScriptAndStyle', () => {
  it('removes script tags and content', () => {
    const html = '<div><script>alert("x")</script><p>Keep</p></div>';
    assert.equal(stripScriptAndStyle(html), '<div><p>Keep</p></div>');
  });

  it('removes style tags and content', () => {
    const html = '<div><style>.foo { color: red; }</style><p>Keep</p></div>';
    assert.equal(stripScriptAndStyle(html), '<div><p>Keep</p></div>');
  });

  it('removes Tailwind CSS boilerplate (real pattern)', () => {
    const html = `<div><style>/*! tailwindcss v4.1.17 | MIT License */
@layer theme, base, components, utilities;
@layer utilities;</style><p>Content</p></div>`;
    const result = stripScriptAndStyle(html);
    assert.ok(!result.includes('tailwindcss'));
    assert.match(result, /<p>Content<\/p>/);
  });

  it('handles multiple script/style tags', () => {
    const html = '<script>a</script><style>b</style><p>c</p><script>d</script>';
    assert.equal(stripScriptAndStyle(html), '<p>c</p>');
  });

  it('preserves all other tags', () => {
    const html = '<svg><path d="M0 0"></path></svg><button>Click</button><i class="icon"></i>';
    assert.equal(stripScriptAndStyle(html), html);
  });
});

// ---------------------------------------------------------------------------
// stripAttributes
// ---------------------------------------------------------------------------
describe('stripAttributes', () => {
  it('removes class, id, style attributes', () => {
    const html = '<div class="foo" id="bar" style="color:red"><p>Text</p></div>';
    assert.equal(stripAttributes(html), '<div><p>Text</p></div>');
  });

  it('removes data-* and aria-* attributes', () => {
    const html = '<div data-testid="x" aria-label="y" data-foo="z"><p>Text</p></div>';
    assert.equal(stripAttributes(html), '<div><p>Text</p></div>');
  });

  it('preserves src attribute on img', () => {
    const html = '<img class="photo" src="image.png" alt="Photo" data-size="large">';
    assert.equal(stripAttributes(html), '<img src="image.png" alt="Photo">');
  });

  it('preserves href on a tags', () => {
    const html = '<a class="link" href="/docs/foo" target="_blank">Link</a>';
    assert.equal(stripAttributes(html), '<a href="/docs/foo">Link</a>');
  });

  it('preserves colspan and rowspan on table cells', () => {
    const html = '<td class="cell" colspan="2" rowspan="3" style="width:50%">Data</td>';
    assert.equal(stripAttributes(html), '<td colspan="2" rowspan="3">Data</td>');
  });

  it('preserves theme attribute (callout type)', () => {
    const html = '<blockquote class="callout callout_info" theme="📘"><p>Note</p></blockquote>';
    assert.equal(stripAttributes(html), '<blockquote theme="📘"><p>Note</p></blockquote>');
  });

  it('preserves start attribute on ol', () => {
    const html = '<ol class="list" start="5"><li>Item</li></ol>';
    assert.equal(stripAttributes(html), '<ol start="5"><li>Item</li></ol>');
  });

  it('handles self-closing tags', () => {
    const html = '<img class="x" src="a.png" />';
    assert.equal(stripAttributes(html), '<img src="a.png" />');
  });

  it('handles tags with no attributes', () => {
    const html = '<p>Text</p>';
    assert.equal(stripAttributes(html), '<p>Text</p>');
  });

  it('handles single-quoted attribute values', () => {
    const html = "<a class='link' href='/docs/foo'>Link</a>";
    assert.equal(stripAttributes(html), '<a href="/docs/foo">Link</a>');
  });

  it('strips role attribute', () => {
    const html = '<nav role="navigation" id="sidebar"><ul></ul></nav>';
    assert.equal(stripAttributes(html), '<nav><ul></ul></nav>');
  });
});

// ---------------------------------------------------------------------------
// prettyPrint
// ---------------------------------------------------------------------------
describe('prettyPrint', () => {
  it('indents nested block elements', () => {
    const html = '<article><section><p>Text</p></section></article>';
    const result = prettyPrint(html);
    const lines = result.split('\n').filter(Boolean);
    assert.match(lines[0], /^<article>/);
    assert.match(lines[1], /^\s{2}<section>/);
    assert.match(lines[2], /^\s{4}<p>/);
  });

  it('ends with newline', () => {
    const result = prettyPrint('<p>Text</p>');
    assert.ok(result.endsWith('\n'));
  });

  it('collapses whitespace', () => {
    const html = '<p>  Multiple   spaces   here  </p>';
    const result = prettyPrint(html);
    assert.match(result, /Multiple spaces here/);
  });

  it('is deterministic (same input produces same output)', () => {
    const html = '<article><h1>Title</h1><p>Body</p><img src="x.png" alt="x"></article>';
    const result1 = prettyPrint(html);
    const result2 = prettyPrint(html);
    assert.equal(result1, result2);
  });

  it('handles inline elements within block elements', () => {
    const html = '<p>Text with <a href="url">link</a> and <strong>bold</strong></p>';
    const result = prettyPrint(html);
    // Inline elements should stay on the same line as their parent
    assert.match(result, /<a href="url">link<\/a>/);
  });

  it('preserves whitespace inside <pre> blocks', () => {
    const html = '<div><pre><code>function hello() {\n  return "world";\n}</code></pre></div>';
    const result = prettyPrint(html);
    // The code formatting inside <pre> must be preserved exactly
    assert.match(result, /function hello\(\) \{\n  return "world";\n\}/);
  });

  it('preserves <pre> blocks while normalizing surrounding HTML', () => {
    const html = '<article>  <p>  Before  </p>  <pre>  keep  spaces  </pre>  <p>  After  </p>  </article>';
    const result = prettyPrint(html);
    // Surrounding whitespace collapsed
    assert.match(result, /Before/);
    assert.match(result, /After/);
    // Pre block content preserved
    assert.match(result, /<pre>  keep  spaces  <\/pre>/);
  });

  it('does not de-indent for closing inline tags', () => {
    // A closing inline tag like </span> at line start should not reduce indent
    const html = '<div><p>Text with </span> stray closing</p></div>';
    const result = prettyPrint(html);
    const lines = result.split('\n').filter(Boolean);
    // </div> should still be at indent 0, not negative
    const divClose = lines.find((l) => l.includes('</div>'));
    assert.ok(divClose);
    assert.match(divClose, /^<\/div>/);
  });

  it('handles self-closing block tags (hr, br)', () => {
    const html = '<div><hr><p>After</p></div>';
    const result = prettyPrint(html);
    const lines = result.split('\n').filter(Boolean);
    const hrLine = lines.find((l) => l.includes('<hr>'));
    assert.ok(hrLine);
    // hr should be indented inside div but not increase indent
    assert.match(hrLine, /^\s{2}<hr>/);
  });

  it('handles multiple <pre> blocks independently', () => {
    const html = '<div><pre>  block one  </pre><p>middle</p><pre>  block two  </pre></div>';
    const result = prettyPrint(html);
    assert.match(result, /<pre>  block one  <\/pre>/);
    assert.match(result, /<pre>  block two  <\/pre>/);
    assert.match(result, /middle/);
  });

  it('preserves <pre> blocks with attributes', () => {
    const html = '<div><pre class="language-js"><code>const x = 1;</code></pre></div>';
    const result = prettyPrint(html);
    assert.match(result, /<pre class="language-js"><code>const x = 1;<\/code><\/pre>/);
  });

  it('handles empty input', () => {
    const result = prettyPrint('');
    assert.equal(result, '\n');
  });
});

// ---------------------------------------------------------------------------
// stripAttributes (additional edge cases)
// ---------------------------------------------------------------------------
describe('stripAttributes (edge cases)', () => {
  it('handles empty attribute values', () => {
    const html = '<div class="" id=""><p>Text</p></div>';
    assert.equal(stripAttributes(html), '<div><p>Text</p></div>');
  });

  it('handles unquoted attribute values', () => {
    const html = '<img src=photo.png alt=test>';
    const result = stripAttributes(html);
    assert.match(result, /src="photo.png"/);
    assert.match(result, /alt="test"/);
  });

  it('preserves whitelisted boolean-like attrs even without value', () => {
    const html = '<div hidden disabled><p>Text</p></div>';
    assert.equal(stripAttributes(html), '<div><p>Text</p></div>');
  });
});

// ---------------------------------------------------------------------------
// normalizeSidebar (end-to-end pipeline)
// ---------------------------------------------------------------------------
describe('normalizeSidebar', () => {
  it('extracts sidebar, strips attributes, preserves nesting', () => {
    const html = `<html><body>
      <nav aria-label="Secondary" class="rm-Sidebar" id="hub-sidebar" role="navigation">
        <section class="sidebar-section">
          <h2 class="sidebar-heading">Overview</h2>
          <ul class="sidebar-list">
            <li class="sidebar-item">
              <a class="sidebar-link" href="/docs/testim-overview">
                <span class="link-text">Testim overview</span>
                <button aria-expanded="false" class="expand-btn">▶</button>
              </a>
              <ul class="subpages">
                <li class="sidebar-item">
                  <a class="sidebar-link" href="/docs/testim-automate">
                    <span class="link-text">Web and Mobile</span>
                  </a>
                </li>
              </ul>
            </li>
          </ul>
        </section>
      </nav>
    </body></html>`;

    const result = normalizeSidebar(html);
    assert.equal(result.found, true);

    // Attributes stripped
    assert.ok(!result.html.includes('class='));
    assert.ok(!result.html.includes('aria-label'));
    assert.ok(!result.html.includes('role='));
    assert.ok(!result.html.includes('aria-expanded'));

    // href preserved
    assert.match(result.html, /href="\/docs\/testim-overview"/);
    assert.match(result.html, /href="\/docs\/testim-automate"/);

    // Structure preserved (nesting)
    assert.match(result.html, /Testim overview/);
    assert.match(result.html, /Web and Mobile/);

    // Button and span preserved (tags remain)
    assert.match(result.html, /<button>/);
    assert.match(result.html, /<span>/);
  });

  it('returns found: false when no hub-sidebar nav', () => {
    const html = '<html><nav id="other-nav"><ul></ul></nav></html>';
    const result = normalizeSidebar(html);
    assert.equal(result.found, false);
  });
});
