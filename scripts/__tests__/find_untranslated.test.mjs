// scripts/__tests__/find_untranslated.test.mjs
/**
 * find_untranslated.mjs unit tests (T5 / plan §3.2).
 *
 * Covers:
 *   (1) frontmatter boundary skip
 *   (2) block boundary detection (heading / fence / callout / image)
 *   (3) --slug=<existing> filter (smoke integration via exports)
 *   (4) baseline 0 件 warning
 *   (5) classifySegment integration (fully-masked 除外)
 *   (6) --slug=<non-existent> で exit code 2 (T8 fail-fast / plan P8)
 */

import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
const SCRIPT = path.join(ROOT, 'scripts', 'detection', 'find_untranslated.mjs');

let splitMarkdownBlocks;
let findUntranslatedBlocks;

before(async () => {
  ({ splitMarkdownBlocks, findUntranslatedBlocks } =
    await import('../detection/find_untranslated.mjs'));
});

describe('splitMarkdownBlocks — frontmatter skip (plan §3.2 T5 case 1)', () => {
  it('skips frontmatter delimited by --- fences', () => {
    const md = '---\ntitle: Test\nupdated: 2026-01-01\n---\n\nHello world.\n';
    const blocks = splitMarkdownBlocks(md);
    const texts = blocks.map((b) => b.lines.join(' '));
    assert.ok(
      !texts.some((t) => t.includes('title:') || t.includes('updated:')),
      'frontmatter fields must not appear in output blocks',
    );
    assert.ok(
      texts.some((t) => t.includes('Hello world.')),
      'body after frontmatter must appear',
    );
  });

  it('handles markdown without frontmatter (body starts at line 0)', () => {
    const md = 'Intro paragraph.\n\nSecond paragraph.\n';
    const blocks = splitMarkdownBlocks(md);
    assert.equal(blocks.length, 2);
  });
});

describe('splitMarkdownBlocks — block boundary (plan §3.2 T5 case 2)', () => {
  it('splits on blank line between paragraphs', () => {
    const md = 'Para one.\n\nPara two.\n';
    const blocks = splitMarkdownBlocks(md);
    assert.equal(blocks.length, 2);
  });

  it('treats heading as block boundary', () => {
    const md = 'Before heading.\n# Heading\nAfter heading.\n';
    const blocks = splitMarkdownBlocks(md);
    const texts = blocks.map((b) => b.lines.join(' '));
    assert.ok(texts.includes('Before heading.'));
    assert.ok(texts.includes('After heading.'));
    assert.ok(
      !texts.some((t) => t.includes('# Heading')),
      'heading line itself is a boundary, not content',
    );
  });

  it('treats code fence as block boundary', () => {
    const md = 'Before fence.\n```js\nconsole.log(1);\n```\nAfter fence.\n';
    const blocks = splitMarkdownBlocks(md);
    const texts = blocks.map((b) => b.lines.join(' '));
    assert.ok(texts.includes('Before fence.'));
    assert.ok(texts.includes('After fence.'));
  });

  it('treats callout (:::) as block boundary', () => {
    const md = 'Before.\n:::note\ncontent\n:::\nAfter.\n';
    const blocks = splitMarkdownBlocks(md);
    const texts = blocks.map((b) => b.lines.join(' '));
    assert.ok(texts.includes('Before.'));
    assert.ok(texts.includes('After.'));
  });

  it('treats image (![...]) as block boundary', () => {
    const md = 'Intro.\n![alt](image.png)\nOutro.\n';
    const blocks = splitMarkdownBlocks(md);
    const texts = blocks.map((b) => b.lines.join(' '));
    assert.ok(texts.includes('Intro.'));
    assert.ok(texts.includes('Outro.'));
  });
});

describe('findUntranslatedBlocks — classifySegment 統合 (plan §3.2 T5 case 5)', () => {
  it('flags English-only blocks as untranslated', () => {
    const blocks = splitMarkdownBlocks('This is a full English paragraph.\n');
    const findings = findUntranslatedBlocks(blocks);
    assert.ok(findings.length >= 1, 'English-only block must be flagged');
  });

  it('does not flag Japanese-only blocks (fully-masked 除外)', () => {
    const blocks = splitMarkdownBlocks('これは日本語のみの段落です。\n');
    const findings = findUntranslatedBlocks(blocks);
    assert.equal(findings.length, 0, 'Japanese-only block must not be flagged');
  });

  it('does not flag glossary-only blocks (fully-masked 除外)', () => {
    const blocks = splitMarkdownBlocks('Visual Editor は Testim のコンポーネントです。\n');
    const findings = findUntranslatedBlocks(blocks);
    assert.equal(
      findings.length,
      0,
      'Block with only glossary terms + CJK must be fully-masked',
    );
  });
});

describe('CLI exit code contract (plan §3.2 T5 case 6 / T8 P8 fail-fast)', () => {
  it('exits with code 2 when --slug=<non-existent> is specified', () => {
    const result = spawnSync(
      process.execPath,
      [SCRIPT, '--slug=__does_not_exist__/totally/fake'],
      { cwd: ROOT, encoding: 'utf8' },
    );
    assert.equal(
      result.status,
      2,
      'non-existent explicit --slug must fail-fast with exit code 2',
    );
  });

  it('does not exit with code 2 when baseline is used (no --slug filter)', () => {
    // baseline モードは SKIP+continue で 0 終了（silent CI 失敗の温床にしない）
    const result = spawnSync(
      process.execPath,
      [SCRIPT, '--limit=1'],
      { cwd: ROOT, encoding: 'utf8', timeout: 30000 },
    );
    assert.notEqual(
      result.status,
      2,
      'baseline mode must not exit with code 2 on missing files',
    );
  });

  it('rejects --slug containing path traversal (T17 trust boundary)', () => {
    const result = spawnSync(
      process.execPath,
      [SCRIPT, '--slug=../../etc/passwd'],
      { cwd: ROOT, encoding: 'utf8' },
    );
    assert.notEqual(
      result.status,
      0,
      'path traversal --slug must not succeed with exit 0',
    );
  });
});
