import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';

let parseArgs;
let collectSnapshotSlugs;

before(async () => {
  ({ parseArgs, collectSnapshotSlugs } = await import('../check_source_parity.mjs'));
});

describe('parseArgs', () => {
  it('parses --fail-on=actionable', () => {
    const args = parseArgs(['--fail-on=actionable']);
    assert.equal(args.failOn, 'actionable');
  });

  it('parses --fail-on=any', () => {
    const args = parseArgs(['--fail-on=any']);
    assert.equal(args.failOn, 'any');
  });

  it('returns null failOn when not specified', () => {
    const args = parseArgs(['--json']);
    assert.equal(args.failOn, null);
  });

  it('parses --section and --json together with --fail-on', () => {
    const args = parseArgs(['--section=Overview', '--json', '--fail-on=actionable']);
    assert.equal(args.section, 'Overview');
    assert.equal(args.json, true);
    assert.equal(args.failOn, 'actionable');
  });

  it('parses --slug=testim-overview', () => {
    const args = parseArgs(['--slug=testim-overview']);
    assert.equal(args.slug, 'testim-overview');
  });

  it('returns null slug when not specified', () => {
    const args = parseArgs(['--json']);
    assert.equal(args.slug, null);
  });
});

describe('collectSnapshotSlugs', () => {
  it('returns empty set for non-existent directory', () => {
    const result = collectSnapshotSlugs('/nonexistent/path');
    assert.equal(result.size, 0);
  });

  it('collects slugs from nested HTML files', () => {
    const tmpDir = path.join(os.tmpdir(), `test-snapshots-${Date.now()}`);
    const subDir = path.join(tmpDir, 'overview');
    fs.mkdirSync(subDir, { recursive: true });
    fs.writeFileSync(path.join(subDir, 'testim-overview.html'), '<div>test</div>');
    fs.writeFileSync(path.join(subDir, 'changelog.html'), '<div>test</div>');

    try {
      const result = collectSnapshotSlugs(tmpDir);
      assert.equal(result.size, 2);
      assert.ok(result.has('overview/testim-overview'));
      assert.ok(result.has('overview/changelog'));
    } finally {
      fs.rmSync(tmpDir, { recursive: true });
    }
  });

  it('ignores non-HTML files', () => {
    const tmpDir = path.join(os.tmpdir(), `test-snapshots-${Date.now()}`);
    fs.mkdirSync(tmpDir, { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'readme.md'), '# test');
    fs.writeFileSync(path.join(tmpDir, 'test.html'), '<div>test</div>');

    try {
      const result = collectSnapshotSlugs(tmpDir);
      assert.equal(result.size, 1);
      assert.ok(result.has('test'));
    } finally {
      fs.rmSync(tmpDir, { recursive: true });
    }
  });
});
