import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';

let parseArgs;
let collectSnapshotSlugs;
let isValidAcknowledgedIssue;
let isNonBlockingIssue;
let getConsoleCoverageState;

before(async () => {
  ({
    parseArgs,
    collectSnapshotSlugs,
    isValidAcknowledgedIssue,
    isNonBlockingIssue,
    getConsoleCoverageState,
  } = await import('../check_source_parity.mjs'));
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

describe('CLI coverage helpers', () => {
  it('treats only unexpired acknowledgements as valid acknowledgements', () => {
    assert.equal(isValidAcknowledgedIssue({ acknowledged: true, ackExpired: false }), true);
    assert.equal(isValidAcknowledgedIssue({ acknowledged: true, ackExpired: true }), false);
    assert.equal(isValidAcknowledgedIssue({ acknowledged: false, ackExpired: false }), false);
  });

  it('treats baseline and valid acknowledgements as non-blocking', () => {
    assert.equal(isNonBlockingIssue({ baselined: true }), true);
    assert.equal(isNonBlockingIssue({ acknowledged: true, ackExpired: false }), true);
    assert.equal(isNonBlockingIssue({ baselined: true, baselineExpired: true }), true);
    assert.equal(isNonBlockingIssue({ acknowledged: true, ackExpired: true }), false);
    assert.equal(isNonBlockingIssue({ severity: 'actionable' }), false);
  });

  it('reports all-acknowledged files with the acknowledged suffix', () => {
    const state = getConsoleCoverageState([
      { acknowledged: true, ackExpired: false },
      { acknowledged: true, ackExpired: false },
    ]);
    assert.deepEqual(state, {
      allAcked: true,
      allCovered: true,
      icon: '⏸️',
      suffix: ' (all acknowledged)',
    });
  });

  it('reports baseline plus acknowledgement mix as covered by baseline/ack', () => {
    const state = getConsoleCoverageState([
      { baselined: true },
      { acknowledged: true, ackExpired: false },
    ]);
    assert.deepEqual(state, {
      allAcked: false,
      allCovered: true,
      icon: '⏸️',
      suffix: ' (covered by baseline/ack)',
    });
  });

  it('keeps expired baselines non-blocking for console coverage', () => {
    const state = getConsoleCoverageState([{ baselined: true, baselineExpired: true }]);
    assert.deepEqual(state, {
      allAcked: false,
      allCovered: true,
      icon: '⏸️',
      suffix: ' (covered by baseline/ack)',
    });
  });

  it('keeps expired acknowledgements and active issues blocking', () => {
    const expiredAck = getConsoleCoverageState([{ acknowledged: true, ackExpired: true }]);
    assert.deepEqual(expiredAck, {
      allAcked: false,
      allCovered: false,
      icon: '❌',
      suffix: '',
    });

    const mixed = getConsoleCoverageState([
      { baselined: true },
      { severity: 'actionable' },
    ]);
    assert.deepEqual(mixed, {
      allAcked: false,
      allCovered: false,
      icon: '❌',
      suffix: '',
    });
  });
});
