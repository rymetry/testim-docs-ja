import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { buildLegacyDocRedirects } from '../../src/lib/legacy-doc-redirects.mjs';

function withTempDir(run) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'legacy-doc-redirects-'));
  try {
    return run(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

describe('buildLegacyDocRedirects', () => {
  it('generates redirect from /docs/{basename} to /docs/{folder}/{basename}', () => {
    withTempDir((dir) => {
      fs.mkdirSync(path.join(dir, 'overview'));
      fs.writeFileSync(path.join(dir, 'overview', 'page-a.md'), '---\ntitle: A\n---\n');

      const redirects = buildLegacyDocRedirects(dir);

      assert.equal(redirects['/docs/page-a'], '/docs/overview/page-a');
    });
  });

  it('skips top-level files', () => {
    withTempDir((dir) => {
      fs.writeFileSync(path.join(dir, 'top-level.md'), '---\ntitle: T\n---\n');

      assert.deepEqual(buildLegacyDocRedirects(dir), {});
    });
  });

  it('skips ambiguous basenames', () => {
    withTempDir((dir) => {
      fs.mkdirSync(path.join(dir, 'folder-a'));
      fs.mkdirSync(path.join(dir, 'folder-b'));
      fs.writeFileSync(path.join(dir, 'folder-a', 'page.md'), '---\ntitle: A\n---\n');
      fs.writeFileSync(path.join(dir, 'folder-b', 'page.md'), '---\ntitle: B\n---\n');

      assert.equal(buildLegacyDocRedirects(dir)['/docs/page'], undefined);
    });
  });

  it('warns on ambiguous basenames when enabled', () => {
    withTempDir((dir) => {
      fs.mkdirSync(path.join(dir, 'folder-a'));
      fs.mkdirSync(path.join(dir, 'folder-b'));
      fs.writeFileSync(path.join(dir, 'folder-a', 'page.md'), '---\ntitle: A\n---\n');
      fs.writeFileSync(path.join(dir, 'folder-b', 'page.md'), '---\ntitle: B\n---\n');

      const warnings = [];
      const originalWarn = console.warn;
      console.warn = (...args) => warnings.push(args.join(' '));
      try {
        buildLegacyDocRedirects(dir, { warnOnAmbiguous: true });
      } finally {
        console.warn = originalWarn;
      }

      assert.equal(warnings.length, 1);
      assert.match(warnings[0], /Skipping ambiguous basename "page"/);
    });
  });

  it('returns an empty object for an empty directory', () => {
    withTempDir((dir) => {
      assert.deepEqual(buildLegacyDocRedirects(dir), {});
    });
  });

  it('returns an empty object and warns when docs directory is missing', () => {
    const missingDir = path.join(os.tmpdir(), `missing-docs-${Date.now()}`);
    const warnings = [];
    const originalWarn = console.warn;
    console.warn = (...args) => warnings.push(args.join(' '));
    try {
      assert.deepEqual(buildLegacyDocRedirects(missingDir, { warnOnMissing: true }), {});
    } finally {
      console.warn = originalWarn;
    }

    assert.equal(warnings.length, 1);
    assert.match(warnings[0], /Docs directory not found/);
  });

  it('returns an empty object and warns when docs path is not a directory', () => {
    withTempDir((dir) => {
      const docsFile = path.join(dir, 'docs.md');
      fs.writeFileSync(docsFile, 'not a directory');
      const warnings = [];
      const originalWarn = console.warn;
      console.warn = (...args) => warnings.push(args.join(' '));
      try {
        assert.deepEqual(buildLegacyDocRedirects(docsFile, { warnOnMissing: true }), {});
      } finally {
        console.warn = originalWarn;
      }

      assert.equal(warnings.length, 1);
      assert.match(warnings[0], /Docs path is not a directory/);
    });
  });

  it('handles nested directories', () => {
    withTempDir((dir) => {
      fs.mkdirSync(path.join(dir, 'cat', 'sub'), { recursive: true });
      fs.writeFileSync(path.join(dir, 'cat', 'sub', 'deep.md'), '---\ntitle: D\n---\n');

      assert.equal(buildLegacyDocRedirects(dir)['/docs/deep'], '/docs/cat/sub/deep');
    });
  });
});
