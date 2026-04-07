import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { buildRedirectMap } from '../lib/redirects.mjs';

describe('buildRedirectMap', () => {
  it('generates redirect from /docs/{basename} to /docs/{folder}/{basename}', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'redirects-'));
    fs.mkdirSync(path.join(dir, 'overview'));
    fs.writeFileSync(path.join(dir, 'overview', 'page-a.md'), '---\ntitle: A\n---\n');
    const map = buildRedirectMap(dir);
    assert.equal(map['/docs/page-a'], '/docs/overview/page-a');
    fs.rmSync(dir, { recursive: true });
  });

  it('skips top-level files (no folder prefix)', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'redirects-'));
    fs.writeFileSync(path.join(dir, 'top-level.md'), '---\ntitle: T\n---\n');
    const map = buildRedirectMap(dir);
    assert.equal(Object.keys(map).length, 0);
    fs.rmSync(dir, { recursive: true });
  });

  it('skips ambiguous basenames (same filename in two folders)', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'redirects-'));
    fs.mkdirSync(path.join(dir, 'folder-a'));
    fs.mkdirSync(path.join(dir, 'folder-b'));
    fs.writeFileSync(path.join(dir, 'folder-a', 'page.md'), '---\ntitle: A\n---\n');
    fs.writeFileSync(path.join(dir, 'folder-b', 'page.md'), '---\ntitle: B\n---\n');
    const map = buildRedirectMap(dir);
    assert.equal(map['/docs/page'], undefined);
    fs.rmSync(dir, { recursive: true });
  });

  it('can warn on ambiguous basenames when enabled', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'redirects-'));
    fs.mkdirSync(path.join(dir, 'folder-a'));
    fs.mkdirSync(path.join(dir, 'folder-b'));
    fs.writeFileSync(path.join(dir, 'folder-a', 'page.md'), '---\ntitle: A\n---\n');
    fs.writeFileSync(path.join(dir, 'folder-b', 'page.md'), '---\ntitle: B\n---\n');

    const warnings = [];
    const originalWarn = console.warn;
    console.warn = (...args) => warnings.push(args.join(' '));
    try {
      buildRedirectMap(dir, { warnOnAmbiguous: true });
    } finally {
      console.warn = originalWarn;
      fs.rmSync(dir, { recursive: true });
    }

    assert.equal(warnings.length, 1);
    assert.match(warnings[0], /Skipping ambiguous basename "page"/);
  });

  it('returns empty object for empty directory', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'redirects-'));
    const map = buildRedirectMap(dir);
    assert.deepEqual(map, {});
    fs.rmSync(dir, { recursive: true });
  });

  it('handles nested directories (multi-level paths)', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'redirects-'));
    fs.mkdirSync(path.join(dir, 'cat', 'sub'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'cat', 'sub', 'deep.md'), '---\ntitle: D\n---\n');
    const map = buildRedirectMap(dir);
    assert.equal(map['/docs/deep'], '/docs/cat/sub/deep');
    fs.rmSync(dir, { recursive: true });
  });
});
