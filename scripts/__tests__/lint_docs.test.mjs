/**
 * tests for scripts/tools/lint_docs.mjs
 *
 * Exported API:
 *   lintContent(content: string, filePath: string, context?: LintContext): LintError[]
 *   toKebab(text: string): string
 *
 *   LintError = { file: string, line: number | null, rule: string, message: string, level: 'error' | 'warning' }
 *   LintContext = { allSlugs?: Set<string>, headingsBySlug?: Map<string, Set<string>> }
 */
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

let lintContent;
let toKebab;
before(async () => {
  ({ lintContent, toKebab } = await import('../tools/lint_docs.mjs'));
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeDoc(overrides = {}) {
  const fm = {
    title: 'Test Page',
    description: 'A description.',
    category: 'Overview',
    updated: '2026-01-01',
    sourceUrl: 'https://docs.tricentis.com/testim/content/overview/testim-overview/index.htm',
    ...overrides.fm,
  };
  const fmLines = Object.entries(fm)
    .map(([k, v]) => `${k}: '${v}'`)
    .join('\n');
  const body = overrides.body ?? '## Section\n\nSome content.\n';
  return `---\n${fmLines}\n---\n\n${body}`;
}

function errorsOf(rules, errors) {
  return errors.filter((e) => rules.includes(e.rule));
}

// ---------------------------------------------------------------------------
// A. frontmatter validation
// ---------------------------------------------------------------------------
describe('frontmatter: sourceUrl', () => {
  it('returns error when sourceUrl is missing', () => {
    const content = makeDoc({ fm: { sourceUrl: undefined } });
    const errors = lintContent(content, 'src/content/docs/test.md');
    const e = errors.find((e) => e.rule === 'sourceUrl-required');
    assert.ok(e, 'expected sourceUrl-required error');
    assert.equal(e.level, 'error');
  });

  it('returns error for wrong sourceUrl domain', () => {
    const content = makeDoc({ fm: { sourceUrl: 'https://example.com/docs/foo' } });
    const errors = lintContent(content, 'src/content/docs/test.md');
    const e = errors.find((e) => e.rule === 'sourceUrl-format');
    assert.ok(e, 'expected sourceUrl-format error');
  });

  it('returns error when sourceUrl has old domain format', () => {
    // old help.testim.io format is no longer valid
    const content = makeDoc({
      fm: { sourceUrl: 'https://help.testim.io/docs/testim-overview' },
    });
    const errors = lintContent(content, 'src/content/docs/test.md');
    const e = errors.find((e) => e.rule === 'sourceUrl-format');
    assert.ok(e, 'expected sourceUrl-format error for double-path');
  });

  it('no error for valid sourceUrl', () => {
    const content = makeDoc();
    const errors = lintContent(content, 'src/content/docs/test.md');
    assert.equal(errorsOf(['sourceUrl-required', 'sourceUrl-format'], errors).length, 0);
  });

  it('no error for valid sourceUrl with .htm format', () => {
    const content = makeDoc({
      fm: {
        sourceUrl:
          'https://docs.tricentis.com/testim/content/getting-started/setting-up-your-account.htm',
      },
    });
    const errors = lintContent(content, 'src/content/docs/test.md');
    const e = errors.find((e) => e.rule === 'sourceUrl-format');
    assert.ok(!e, 'should not report error for valid .htm sourceUrl');
  });
});

describe('frontmatter: description placeholder', () => {
  it('returns error when description starts with "原文:"', () => {
    const content = makeDoc({
      fm: { description: '原文: https://docs.tricentis.com/testim/content/overview/foo.htm' },
    });
    const errors = lintContent(content, 'src/content/docs/test.md');
    const e = errors.find((e) => e.rule === 'description-placeholder');
    assert.ok(e, 'expected description-placeholder error');
    assert.equal(e.level, 'error');
  });

  it('returns error when description starts with "TODO"', () => {
    const content = makeDoc({ fm: { description: 'TODO: write description' } });
    const errors = lintContent(content, 'src/content/docs/test.md');
    const e = errors.find((e) => e.rule === 'description-placeholder');
    assert.ok(e);
  });

  it('returns error for TODO in any case', () => {
    const content = makeDoc({ fm: { description: 'todo: fill this in' } });
    const errors = lintContent(content, 'src/content/docs/test.md');
    const e = errors.find((e) => e.rule === 'description-placeholder');
    assert.ok(e);
  });

  it('no error for a real description', () => {
    const content = makeDoc({ fm: { description: 'Testim の概要を説明します。' } });
    const errors = lintContent(content, 'src/content/docs/test.md');
    assert.equal(errorsOf(['description-placeholder'], errors).length, 0);
  });
});

describe('frontmatter: required fields', () => {
  for (const field of ['title', 'category', 'updated']) {
    it(`returns error when ${field} is missing`, () => {
      const content = makeDoc({ fm: { [field]: undefined } });
      const errors = lintContent(content, 'src/content/docs/test.md');
      const e = errors.find((e) => e.rule === `${field}-required`);
      assert.ok(e, `expected ${field}-required error`);
    });
  }

  it('no errors when all required fields are present', () => {
    const content = makeDoc();
    const errors = lintContent(content, 'src/content/docs/test.md');
    const rules = ['title-required', 'category-required', 'updated-required'];
    assert.equal(errorsOf(rules, errors).length, 0);
  });
});

// ---------------------------------------------------------------------------
// B. Internal link format (internal-link-format rule removed for path-based slugs)
// ---------------------------------------------------------------------------
describe('internal link format', () => {
  it('no warning for /docs/{folder}/{slug} link (now the correct format)', () => {
    const content = makeDoc({
      body: 'See [overview](/docs/overview/testim-overview).\n',
    });
    const errors = lintContent(content, 'src/content/docs/test.md');
    assert.equal(errorsOf(['internal-link-format'], errors).length, 0);
  });

  it('no warning for /docs/{basename} link (no allSlugs provided)', () => {
    const content = makeDoc({
      body: 'See [overview](/docs/testim-overview).\n',
    });
    // Without allSlugs, no link-target checks are performed
    const errors = lintContent(content, 'src/content/docs/test.md');
    assert.equal(errorsOf(['internal-link-format'], errors).length, 0);
  });

  it('no warning for external links', () => {
    const content = makeDoc({
      body: 'See [Testim](https://docs.tricentis.com/testim/content/overview/testim-overview/index.htm).\n',
    });
    const errors = lintContent(content, 'src/content/docs/test.md');
    assert.equal(errorsOf(['internal-link-format'], errors).length, 0);
  });

  it('no warning for HTML <a href="/docs/{folder}/{slug}"> link', () => {
    const content = makeDoc({
      body: 'See <a href="/docs/overview/testim-overview">overview</a>.\n',
    });
    const errors = lintContent(content, 'src/content/docs/test.md');
    assert.equal(errorsOf(['internal-link-format'], errors).length, 0);
  });
});

// ---------------------------------------------------------------------------
// C. Testim feature name Japanese translation check
// ---------------------------------------------------------------------------
describe('Testim feature name preservation', () => {
  it('returns error when "Testim拡張機能" appears outside code block', () => {
    const content = makeDoc({ body: 'Testim拡張機能を使ってテストを記録します。\n' });
    const errors = lintContent(content, 'src/content/docs/test.md');
    const e = errors.find((e) => e.rule === 'feature-name-japanese');
    assert.ok(e, 'expected feature-name-japanese error for Testim拡張機能');
    assert.equal(e.level, 'error');
  });

  it('returns error when "ビジュアルエディタ" appears outside code block', () => {
    const content = makeDoc({ body: 'ビジュアルエディタで編集します。\n' });
    const errors = lintContent(content, 'src/content/docs/test.md');
    const e = errors.find((e) => e.rule === 'feature-name-japanese');
    assert.ok(e);
  });

  it('no error when NG word is inside a fenced code block', () => {
    const content = makeDoc({
      body: '```\nTestim拡張機能\n```\n',
    });
    const errors = lintContent(content, 'src/content/docs/test.md');
    assert.equal(errorsOf(['feature-name-japanese'], errors).length, 0);
  });

  it('no error when NG word is inside inline code', () => {
    const content = makeDoc({ body: '`Testim拡張機能` と呼びます。\n' });
    const errors = lintContent(content, 'src/content/docs/test.md');
    assert.equal(errorsOf(['feature-name-japanese'], errors).length, 0);
  });

  it('no error for correct English feature names', () => {
    const content = makeDoc({
      body: 'Use the Testim Extension to record tests.\n',
    });
    const errors = lintContent(content, 'src/content/docs/test.md');
    assert.equal(errorsOf(['feature-name-japanese'], errors).length, 0);
  });
});

// ---------------------------------------------------------------------------
// D. Markdown syntax checks
// ---------------------------------------------------------------------------
describe('Markdown syntax: fenced code blocks', () => {
  it('returns warning for code block without language specifier', () => {
    const content = makeDoc({ body: '```\nsome code\n```\n' });
    const errors = lintContent(content, 'src/content/docs/test.md');
    const e = errors.find((e) => e.rule === 'code-block-no-language');
    assert.ok(e, 'expected code-block-no-language warning');
    assert.equal(e.level, 'warning');
  });

  it('no warning when language is specified', () => {
    const content = makeDoc({ body: '```js\nconst x = 1;\n```\n' });
    const errors = lintContent(content, 'src/content/docs/test.md');
    assert.equal(errorsOf(['code-block-no-language'], errors).length, 0);
  });
});

describe('Markdown syntax: callout directives', () => {
  it('returns error for unknown ::: type', () => {
    const content = makeDoc({ body: '::: unknown-type\nContent\n:::\n' });
    const errors = lintContent(content, 'src/content/docs/test.md');
    const e = errors.find((e) => e.rule === 'callout-unknown-type');
    assert.ok(e, 'expected callout-unknown-type error');
    assert.equal(e.level, 'error');
  });

  it('no error for known callout types (note, caution, warning, tip, danger, info)', () => {
    for (const type of ['note', 'caution', 'warning', 'tip', 'danger', 'info']) {
      const content = makeDoc({ body: `::: ${type}\nContent\n:::\n` });
      const errors = lintContent(content, 'src/content/docs/test.md');
      assert.equal(
        errorsOf(['callout-unknown-type'], errors).length,
        0,
        `"${type}" should be a valid callout type`
      );
    }
  });

  it('no error for four-colon fence with custom title', () => {
    const content = makeDoc({ body: '::::info{title="補足"}\nContent\n::::\n' });
    const errors = lintContent(content, 'src/content/docs/test.md');
    assert.equal(errorsOf(['callout-unknown-type'], errors).length, 0);
  });
});

// ---------------------------------------------------------------------------
// E. Internal link target existence
// ---------------------------------------------------------------------------
describe('internal link target existence', () => {
  // Path-based slugs (folder/basename)
  const slugs = new Set([
    'overview/testim-overview',
    'getting-started/getting-started',
    'advanced-editing/advanced-features',
  ]);
  const headings = new Map([
    ['overview/testim-overview', new Set(['overview', 'features', 'getting-started-section'])],
    ['getting-started/getting-started', new Set(['installation', 'first-test'])],
    ['advanced-editing/advanced-features', new Set(['custom-actions', 'data-driven'])],
  ]);

  it('returns error for markdown link to nonexistent basename slug', () => {
    const content = makeDoc({
      body: 'See [page](/docs/nonexistent-page) for details.\n',
    });
    const errors = lintContent(content, 'test.md', { allSlugs: slugs, headingsBySlug: headings });
    const e = errors.find((e) => e.rule === 'link-target-missing');
    assert.ok(e, 'expected link-target-missing error');
    assert.equal(e.level, 'error');
    assert.match(e.message, /nonexistent-page/);
  });

  it('returns error for markdown link to basename slug (not path-based)', () => {
    const content = makeDoc({
      body: 'See [overview](/docs/testim-overview) for details.\n',
    });
    const errors = lintContent(content, 'test.md', { allSlugs: slugs, headingsBySlug: headings });
    const e = errors.find((e) => e.rule === 'link-target-missing');
    assert.ok(e, 'expected link-target-missing error for basename-only link');
  });

  it('returns error for HTML <a href> link to nonexistent basename slug', () => {
    const content = makeDoc({
      body: 'See <a href="/docs/nonexistent-page">page</a> for details.\n',
    });
    const errors = lintContent(content, 'test.md', { allSlugs: slugs, headingsBySlug: headings });
    const e = errors.find((e) => e.rule === 'link-target-missing');
    assert.ok(e, 'expected link-target-missing error for HTML link');
    assert.equal(e.level, 'error');
  });

  it('returns error for HTML <a href> link to basename slug (not path-based)', () => {
    const content = makeDoc({
      body: 'See <a href="/docs/getting-started">start</a> here.\n',
    });
    const errors = lintContent(content, 'test.md', { allSlugs: slugs, headingsBySlug: headings });
    const e = errors.find((e) => e.rule === 'link-target-missing');
    assert.ok(e, 'expected link-target-missing error for basename-only HTML link');
  });

  it('returns error (not fragment warning) for basename link with fragment', () => {
    const content = makeDoc({
      body: 'See [section](/docs/testim-overview#nonexistent-section) here.\n',
    });
    const errors = lintContent(content, 'test.md', { allSlugs: slugs, headingsBySlug: headings });
    // Basename link → target missing error takes precedence over fragment check
    const e = errors.find((e) => e.rule === 'link-target-missing');
    assert.ok(e, 'expected link-target-missing error for basename link');
    assert.equal(errorsOf(['link-fragment-missing'], errors).length, 0);
  });

  it('returns error (not fragment warning) for basename link with valid fragment', () => {
    const content = makeDoc({
      body: 'See [section](/docs/testim-overview#features) here.\n',
    });
    const errors = lintContent(content, 'test.md', { allSlugs: slugs, headingsBySlug: headings });
    const e = errors.find((e) => e.rule === 'link-target-missing');
    assert.ok(e, 'expected link-target-missing for basename link even with valid fragment');
  });

  it('returns error for HTML basename link with fragment', () => {
    const content = makeDoc({
      body: 'See <a href="/docs/getting-started#bad-section">link</a>.\n',
    });
    const errors = lintContent(content, 'test.md', { allSlugs: slugs, headingsBySlug: headings });
    const e = errors.find((e) => e.rule === 'link-target-missing');
    assert.ok(e, 'expected link-target-missing for basename HTML link');
  });

  it('skips link-target check when allSlugs is not provided', () => {
    const content = makeDoc({
      body: 'See [page](/docs/nonexistent-page) for details.\n',
    });
    // No opts → backward compatible, no link-target-missing errors
    const errors = lintContent(content, 'test.md');
    assert.equal(errorsOf(['link-target-missing'], errors).length, 0);
  });

  it('skips links inside code blocks', () => {
    const content = makeDoc({
      body: '```\nSee [page](/docs/nonexistent-page).\n```\n',
    });
    const errors = lintContent(content, 'test.md', { allSlugs: slugs, headingsBySlug: headings });
    assert.equal(errorsOf(['link-target-missing'], errors).length, 0);
  });

  it('skips links inside inline code', () => {
    const content = makeDoc({
      body: 'Use `[page](/docs/nonexistent-page)` syntax.\n',
    });
    const errors = lintContent(content, 'test.md', { allSlugs: slugs, headingsBySlug: headings });
    assert.equal(errorsOf(['link-target-missing'], errors).length, 0);
  });

  it('no error for path-based link when path-slug exists', () => {
    const content = makeDoc({
      body: 'See [overview](/docs/overview/testim-overview) for details.\n',
    });
    const errors = lintContent(content, 'test.md', { allSlugs: slugs, headingsBySlug: headings });
    assert.equal(errorsOf(['link-target-missing'], errors).length, 0);
  });

  it('returns error for path-based link when path-slug does not exist', () => {
    const content = makeDoc({
      body: 'See [page](/docs/overview/nonexistent-page) for details.\n',
    });
    const errors = lintContent(content, 'test.md', { allSlugs: slugs, headingsBySlug: headings });
    const e = errors.find((e) => e.rule === 'link-target-missing');
    assert.ok(e, 'expected link-target-missing for unknown slug in path-based link');
    assert.equal(e.level, 'error');
  });

  it('returns fragment warning for path-based link with bad fragment', () => {
    const content = makeDoc({
      body: 'See [section](/docs/overview/testim-overview#nonexistent-section) here.\n',
    });
    const errors = lintContent(content, 'test.md', { allSlugs: slugs, headingsBySlug: headings });
    const e = errors.find((e) => e.rule === 'link-fragment-missing');
    assert.ok(e, 'expected link-fragment-missing warning');
    assert.equal(e.level, 'warning');
  });

  it('no fragment warning for path-based link with valid fragment', () => {
    const content = makeDoc({
      body: 'See [section](/docs/overview/testim-overview#features) here.\n',
    });
    const errors = lintContent(content, 'test.md', { allSlugs: slugs, headingsBySlug: headings });
    assert.equal(errorsOf(['link-fragment-missing'], errors).length, 0);
  });

  it('no error for path-based HTML link when path-slug exists', () => {
    const content = makeDoc({
      body: 'See <a href="/docs/overview/testim-overview">overview</a>.\n',
    });
    const errors = lintContent(content, 'test.md', { allSlugs: slugs, headingsBySlug: headings });
    assert.equal(errorsOf(['link-target-missing'], errors).length, 0);
  });

  it('returns error for ambiguous basename-only link', () => {
    // Two slugs share the same basename "shared-name"
    const ambiguousSlugs = new Set(['folder-a/shared-name', 'folder-b/shared-name']);
    const content = makeDoc({
      body: 'See [page](/docs/shared-name) for details.\n',
    });
    const errors = lintContent(content, 'test.md', { allSlugs: ambiguousSlugs });
    const e = errors.find((e) => e.rule === 'link-target-missing');
    assert.ok(e, 'expected link-target-missing error for ambiguous basename link');
  });

  it('returns error for path-based link with wrong folder', () => {
    const content = makeDoc({
      body: 'See [page](/docs/wrong-folder/testim-overview) for details.\n',
    });
    const errors = lintContent(content, 'test.md', { allSlugs: slugs, headingsBySlug: headings });
    const e = errors.find((e) => e.rule === 'link-target-missing');
    assert.ok(e, 'expected link-target-missing for wrong folder in path-based link');
  });
});

// ---------------------------------------------------------------------------
// F. toKebab helper
// ---------------------------------------------------------------------------
describe('toKebab', () => {
  it('converts simple heading to kebab-case', () => {
    assert.equal(toKebab('Getting Started'), 'getting-started');
  });

  it('handles special characters', () => {
    assert.equal(toKebab('Step 1: Install'), 'step-1-install');
  });

  it('strips inline code backticks', () => {
    assert.equal(toKebab('Using `testim` CLI'), 'using-testim-cli');
  });

  it('strips bold/italic markers', () => {
    assert.equal(toKebab('**Bold** and *italic*'), 'bold-and-italic');
  });

  it('strips markdown link syntax', () => {
    assert.equal(toKebab('See [Testim](https://example.com)'), 'see-testim');
  });

  it('preserves Japanese (CJK) characters', () => {
    assert.equal(toKebab('ルールの説明'), 'ルールの説明');
  });

  it('converts Japanese heading with parenthesized qualifier', () => {
    assert.equal(toKebab('要素の表示を待つ（web）'), '要素の表示を待つ（web）');
  });

  it('handles mixed Japanese and ASCII', () => {
    assert.equal(toKebab('DOM で最も大きい要素を選ぶ'), 'dom-で最も大きい要素を選ぶ');
  });

  it('handles mixed English and Japanese with slash', () => {
    assert.equal(
      toKebab('Add Custom Validation / Add Custom Action ステップの追加'),
      'add-custom-validation-add-custom-action-ステップの追加'
    );
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------
describe('edge cases', () => {
  it('returns empty array for a fully valid document', () => {
    const content = makeDoc({
      body: '## Section\n\nSome content with [link](/docs/overview/testim-overview).\n\n```js\nconst x = 1;\n```\n',
    });
    const errors = lintContent(content, 'src/content/docs/test.md');
    assert.equal(errors.filter((e) => e.level === 'error').length, 0);
  });

  it('handles document with no frontmatter', () => {
    const content = '## Just a body\n\nNo frontmatter here.\n';
    const errors = lintContent(content, 'src/content/docs/test.md');
    // Must report errors for all required frontmatter fields
    const rules = ['title-required', 'category-required', 'updated-required', 'sourceUrl-required'];
    for (const rule of rules) {
      assert.ok(
        errors.some((e) => e.rule === rule),
        `expected ${rule} error when frontmatter is absent`
      );
    }
  });
});

// ---------------------------------------------------------------------------
// legacy-fa-icon check
// ---------------------------------------------------------------------------
describe('legacy-fa-icon check', () => {
  it('detects :fa-arrow-right: in body', () => {
    const content = makeDoc({ body: ':fa-arrow-right: **テストを作成するには:**\n' });
    const errors = lintContent(content, 'src/content/docs/test.md');
    const e = errors.find((e) => e.rule === 'legacy-fa-icon');
    assert.ok(e, 'expected legacy-fa-icon error for :fa-arrow-right:');
    assert.equal(e.level, 'error');
  });

  it('detects :fa-cog: in body', () => {
    const content = makeDoc({ body: '**Properties**（:fa-cog:）をクリック\n' });
    const errors = lintContent(content, 'src/content/docs/test.md');
    const e = errors.find((e) => e.rule === 'legacy-fa-icon');
    assert.ok(e, 'expected legacy-fa-icon error for :fa-cog:');
  });

  it('detects :fa-check: in body', () => {
    const content = makeDoc({ body: ':fa-check: は合格を示します。\n' });
    const errors = lintContent(content, 'src/content/docs/test.md');
    assert.ok(errors.some((e) => e.rule === 'legacy-fa-icon'));
  });

  it('no error when :fa-*: is inside a code block', () => {
    const content = makeDoc({ body: '```\n:fa-arrow-right: text\n```\n' });
    const errors = lintContent(content, 'src/content/docs/test.md');
    assert.equal(errorsOf(['legacy-fa-icon'], errors).length, 0);
  });

  it('no error when no :fa-*: pattern exists', () => {
    const content = makeDoc({ body: '**テストを作成するには:**\n' });
    const errors = lintContent(content, 'src/content/docs/test.md');
    assert.equal(errorsOf(['legacy-fa-icon'], errors).length, 0);
  });
});
