import { describe, it, before, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

let resolveTranslationSlug, validateTranslation, writeFileAtomic, processOneTranslation;

before(async () => {
  ({ resolveTranslationSlug, validateTranslation, writeFileAtomic, processOneTranslation } =
    await import('../apply_llm_translations.mjs'));
});

// --- resolveTranslationSlug ---

describe('resolveTranslationSlug', () => {
  const makeIndex = (slugs) => {
    const index = {};
    for (const s of slugs) index[s] = { filePath: `/docs/${s}.md` };
    return index;
  };

  it('resolves nested path via exact match', () => {
    const index = makeIndex(['overview/testim-overview', 'results/page']);
    assert.equal(resolveTranslationSlug('overview/testim-overview.md', index), 'overview/testim-overview');
  });

  it('returns null for nested path that does not match exactly', () => {
    const index = makeIndex(['overview/testim-overview']);
    assert.equal(resolveTranslationSlug('wrong-folder/testim-overview.md', index), null);
  });

  it('does not basename-fallback for nested paths', () => {
    // Even if 'page' exists uniquely, a nested mistyped path should not resolve
    const index = makeIndex(['results/page']);
    assert.equal(resolveTranslationSlug('wrong/page.md', index), null);
  });

  it('resolves flat file via exact match first', () => {
    // If a top-level slug exists (unlikely but possible)
    const index = makeIndex(['page']);
    assert.equal(resolveTranslationSlug('page.md', index), 'page');
  });

  it('resolves flat file via basename lookup from index', () => {
    const index = makeIndex(['results/page']);
    assert.equal(resolveTranslationSlug('page.md', index), 'results/page');
  });

  it('returns null for ambiguous flat basename', () => {
    const index = makeIndex(['results/page', 'overview/page']);
    assert.equal(resolveTranslationSlug('page.md', index), null);
  });

  it('returns null for non-existent flat basename', () => {
    const index = makeIndex(['results/other']);
    assert.equal(resolveTranslationSlug('nonexistent.md', index), null);
  });
});

// --- validateTranslation ---

describe('validateTranslation', () => {
  it('returns null for valid fm + valid translated', () => {
    assert.equal(validateTranslation('---\ntitle: T\n---', '# Hello\n\nContent'), null);
  });

  it('rejects empty frontmatter', () => {
    const reason = validateTranslation('', '# Hello');
    assert.ok(reason);
    assert.ok(reason.includes('frontmatter'));
  });

  it('rejects empty translation', () => {
    const reason = validateTranslation('---\ntitle: T\n---', '');
    assert.ok(reason);
    assert.ok(reason.includes('empty'));
  });

  it('rejects whitespace-only translation', () => {
    const reason = validateTranslation('---\ntitle: T\n---', '   \n  \n  ');
    assert.ok(reason);
    assert.ok(reason.includes('empty'));
  });

  it('rejects untranslated prompt file', () => {
    const prompt = '# 翻訳タスク (overview/testim-overview)\n\n下記のMarkdown本文を日本語に翻訳してください。';
    const reason = validateTranslation('---\ntitle: T\n---', prompt);
    assert.ok(reason);
    assert.ok(reason.includes('prompt'));
  });

  it('rejects translated body containing frontmatter block', () => {
    const doubled = '---\ntitle: Oops\n---\n# Content';
    const reason = validateTranslation('---\ntitle: T\n---', doubled);
    assert.ok(reason);
    assert.ok(reason.includes('frontmatter'));
  });

  it('allows translated body starting with thematic break (not frontmatter)', () => {
    // A thematic break (---) without a closing delimiter is valid markdown
    const thematicBreak = '---\n\n# Section Title\n\nContent here';
    // This has ---\n but no closing \n--- so it's just a thematic break
    assert.equal(validateTranslation('---\ntitle: T\n---', thematicBreak), null);
  });
});

// --- writeFileAtomic ---

describe('writeFileAtomic', () => {
  it('writes content atomically', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'atomic-'));
    const filePath = path.join(dir, 'test.md');
    fs.writeFileSync(filePath, 'original', 'utf8');

    writeFileAtomic(filePath, 'updated');
    assert.equal(fs.readFileSync(filePath, 'utf8'), 'updated');

    // No leftover tmp files
    const files = fs.readdirSync(dir);
    assert.equal(files.length, 1);
    assert.equal(files[0], 'test.md');

    fs.rmSync(dir, { recursive: true });
  });

  it('preserves original on write failure (read-only dir)', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'atomic-fail-'));
    const subdir = path.join(dir, 'readonly');
    fs.mkdirSync(subdir);
    const filePath = path.join(subdir, 'test.md');
    fs.writeFileSync(filePath, 'original', 'utf8');

    // Make the directory read-only to prevent tmp file creation
    fs.chmodSync(subdir, 0o444);

    try {
      assert.throws(() => writeFileAtomic(filePath, 'should-fail'));
      // Original file should be untouched
      fs.chmodSync(subdir, 0o755);
      assert.equal(fs.readFileSync(filePath, 'utf8'), 'original');
    } finally {
      fs.chmodSync(subdir, 0o755);
      fs.rmSync(dir, { recursive: true });
    }
  });
});

// --- processOneTranslation ---

describe('processOneTranslation', () => {
  /** Create a temp dir with a doc file and translation file */
  function setup(opts = {}) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'apply-'));
    const docDir = path.join(dir, 'doc');
    const transDir = path.join(dir, 'trans');
    fs.mkdirSync(docDir, { recursive: true });
    fs.mkdirSync(transDir, { recursive: true });

    const fm = opts.fm ?? '---\ntitle: Test\ncategory: Overview\n---';
    const body = opts.body ?? '# Original content';
    const docContent = fm ? `${fm}\n${body}\n` : body;
    const docPath = path.join(docDir, 'page.md');
    fs.writeFileSync(docPath, docContent, 'utf8');

    const translated = opts.translated ?? '# 翻訳されたコンテンツ\n\nこれはテストです。';
    const transPath = path.join(transDir, 'page.md');
    fs.writeFileSync(transPath, translated, 'utf8');

    return {
      dir,
      docPath,
      transPath,
      hit: { filePath: docPath },
      cleanup: () => fs.rmSync(dir, { recursive: true }),
    };
  }

  it('applies valid translation and preserves frontmatter', () => {
    const { transPath, hit, cleanup } = setup();
    try {
      const result = processOneTranslation({ slug: 'test/page', transPath, hit });
      assert.equal(result, 'applied');
      const content = fs.readFileSync(hit.filePath, 'utf8');
      assert.ok(content.startsWith('---\ntitle: Test'));
      assert.ok(content.includes('翻訳されたコンテンツ'));
      assert.ok(!content.includes('Original content'));
    } finally {
      cleanup();
    }
  });

  it('skips when source doc has no frontmatter', () => {
    const { transPath, hit, docPath, cleanup } = setup({ fm: '' });
    const original = fs.readFileSync(docPath, 'utf8');
    try {
      const result = processOneTranslation({ slug: 'test/page', transPath, hit });
      assert.equal(result, 'skipped');
      assert.equal(fs.readFileSync(hit.filePath, 'utf8'), original);
    } finally {
      cleanup();
    }
  });

  it('skips when translation file is empty', () => {
    const { transPath, hit, docPath, cleanup } = setup({ translated: '' });
    const original = fs.readFileSync(docPath, 'utf8');
    try {
      const result = processOneTranslation({ slug: 'test/page', transPath, hit });
      assert.equal(result, 'skipped');
      assert.equal(fs.readFileSync(hit.filePath, 'utf8'), original);
    } finally {
      cleanup();
    }
  });

  it('skips when translation contains prompt header', () => {
    const prompt = '# 翻訳タスク (test/page)\n\n下記のMarkdown本文を日本語に翻訳してください。\n\n--- 原文本文ここから ---\n\n# Original';
    const { transPath, hit, docPath, cleanup } = setup({ translated: prompt });
    const original = fs.readFileSync(docPath, 'utf8');
    try {
      const result = processOneTranslation({ slug: 'test/page', transPath, hit });
      assert.equal(result, 'skipped');
      assert.equal(fs.readFileSync(hit.filePath, 'utf8'), original);
    } finally {
      cleanup();
    }
  });

  it('skips when translation contains frontmatter block', () => {
    const doubled = '---\ntitle: Oops\n---\n# Content';
    const { transPath, hit, docPath, cleanup } = setup({ translated: doubled });
    const original = fs.readFileSync(docPath, 'utf8');
    try {
      const result = processOneTranslation({ slug: 'test/page', transPath, hit });
      assert.equal(result, 'skipped');
      assert.equal(fs.readFileSync(hit.filePath, 'utf8'), original);
    } finally {
      cleanup();
    }
  });

  it('returns unchanged when final content matches current', () => {
    const fm = '---\ntitle: Test\n---';
    const body = '# Already translated';
    const { transPath, hit, cleanup } = setup({ fm, body, translated: body });
    try {
      const result = processOneTranslation({ slug: 'test/page', transPath, hit });
      assert.equal(result, 'unchanged');
    } finally {
      cleanup();
    }
  });
});
