/**
 * tests for scripts/lint-docs.mjs  (new module — will fail until implemented)
 *
 * The implementation must export:
 *   lintContent(content: string, filePath: string): LintError[]
 *
 *   LintError = { file: string, line: number | null, rule: string, message: string, level: 'error' | 'warning' }
 */
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

let lintContent;
before(async () => {
  ({ lintContent } = await import('../lint-docs.mjs'));
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeDoc(overrides = {}) {
  const fm = {
    title: "Test Page",
    description: "A description.",
    category: "Overview",
    updated: "2026-01-01",
    sourceUrl: "https://help.testim.io/docs/testim-overview",
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

  it('returns error when sourceUrl has folder prefix', () => {
    // /docs/{folder}/{slug} form is invalid; must be /docs/{slug}
    const content = makeDoc({
      fm: { sourceUrl: 'https://help.testim.io/docs/overview/testim-overview' },
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
});

describe('frontmatter: description placeholder', () => {
  it('returns error when description starts with "原文:"', () => {
    const content = makeDoc({ fm: { description: '原文: https://help.testim.io/docs/foo' } });
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
// B. Internal link format
// ---------------------------------------------------------------------------
describe('internal link format', () => {
  it('returns error for /docs/{folder}/{slug} link', () => {
    const content = makeDoc({
      body: 'See [overview](/docs/overview/testim-overview).\n',
    });
    const errors = lintContent(content, 'src/content/docs/test.md');
    const e = errors.find((e) => e.rule === 'internal-link-format');
    assert.ok(e, 'expected internal-link-format error');
    assert.equal(e.level, 'error');
  });

  it('no error for /docs/{slug} link', () => {
    const content = makeDoc({
      body: 'See [overview](/docs/testim-overview).\n',
    });
    const errors = lintContent(content, 'src/content/docs/test.md');
    assert.equal(errorsOf(['internal-link-format'], errors).length, 0);
  });

  it('no error for external links', () => {
    const content = makeDoc({
      body: 'See [Testim](https://help.testim.io/docs/overview/testim-overview).\n',
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

  it('no error for known callout types (note, warning, tip, danger, success, info)', () => {
    for (const type of ['note', 'warning', 'tip', 'danger', 'success', 'info']) {
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
// Edge cases
// ---------------------------------------------------------------------------
describe('edge cases', () => {
  it('returns empty array for a fully valid document', () => {
    const content = makeDoc({
      body: '## Section\n\nSome content with [link](/docs/testim-overview).\n\n```js\nconst x = 1;\n```\n',
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
