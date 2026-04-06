import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';

let parseArgs;
let loadAllowlist;
let isAllowlisted;
let applyAllowlist;
let collectSnapshotSlugs;

before(async () => {
  ({ parseArgs, loadAllowlist, isAllowlisted, applyAllowlist, collectSnapshotSlugs } = await import(
    '../check_source_parity.mjs'
  ));
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

describe('loadAllowlist', () => {
  it('returns empty object when file does not exist', () => {
    const result = loadAllowlist('/nonexistent/path.json');
    assert.deepEqual(result, {});
  });

  it('throws when allowlist targets non-signal severity', () => {
    const tmpFile = path.join(os.tmpdir(), `test-allowlist-${Date.now()}.json`);
    fs.writeFileSync(
      tmpFile,
      JSON.stringify({
        'some-slug': [{ type: 'untranslated', reason: 'bad' }],
      }),
    );
    try {
      assert.throws(
        () => loadAllowlist(tmpFile),
        /Only signal-severity issues can be suppressed/,
      );
    } finally {
      fs.unlinkSync(tmpFile);
    }
  });

  it('throws when allowlist contains unknown issue type', () => {
    const tmpFile = path.join(os.tmpdir(), `test-allowlist-${Date.now()}.json`);
    fs.writeFileSync(
      tmpFile,
      JSON.stringify({
        'some-slug': [{ type: 'paragraph-count-missmatch', reason: 'typo' }],
      }),
    );
    try {
      assert.throws(
        () => loadAllowlist(tmpFile),
        /unknown issue type/,
      );
    } finally {
      fs.unlinkSync(tmpFile);
    }
  });

  it('throws when allowlist has invalid detailRegex', () => {
    const tmpFile = path.join(os.tmpdir(), `test-allowlist-${Date.now()}.json`);
    fs.writeFileSync(
      tmpFile,
      JSON.stringify({
        'some-slug': [{ type: 'paragraph-count-mismatch', detailRegex: '(' }],
      }),
    );
    try {
      assert.throws(
        () => loadAllowlist(tmpFile),
        /invalid detailRegex/,
      );
    } finally {
      fs.unlinkSync(tmpFile);
    }
  });

  it('throws when allowlist rule has no detailIncludes or detailRegex', () => {
    const tmpFile = path.join(os.tmpdir(), `test-allowlist-${Date.now()}.json`);
    fs.writeFileSync(
      tmpFile,
      JSON.stringify({
        'some-slug': [{ type: 'paragraph-count-mismatch', reason: 'too coarse' }],
      }),
    );
    try {
      assert.throws(
        () => loadAllowlist(tmpFile),
        /must specify detailIncludes or detailRegex/,
      );
    } finally {
      fs.unlinkSync(tmpFile);
    }
  });

  it('accepts allowlist with signal-severity issues', () => {
    const tmpFile = path.join(os.tmpdir(), `test-allowlist-${Date.now()}.json`);
    fs.writeFileSync(
      tmpFile,
      JSON.stringify({
        'some-slug': [
          { type: 'paragraph-count-mismatch', detailIncludes: 'セクション #3', reason: 'test' },
        ],
      }),
    );
    try {
      const result = loadAllowlist(tmpFile);
      assert.equal(Object.keys(result).length, 1);
    } finally {
      fs.unlinkSync(tmpFile);
    }
  });
});

describe('isAllowlisted', () => {
  it('returns true when issue matches slug + type + detailIncludes', () => {
    const allowlist = {
      'test-page': [
        {
          type: 'paragraph-count-mismatch',
          detailIncludes: 'セクション #3',
          reason: 'intentional',
        },
      ],
    };
    const issue = {
      type: 'paragraph-count-mismatch',
      severity: 'signal',
      detail: 'セクション #3 "Overview": 段落数 EN=4, JA=2 (-2)',
    };
    assert.equal(isAllowlisted('test-page', issue, allowlist), true);
  });

  it('returns false when detail does not match', () => {
    const allowlist = {
      'test-page': [
        {
          type: 'paragraph-count-mismatch',
          detailIncludes: 'セクション #3',
          reason: 'intentional',
        },
      ],
    };
    const issue = {
      type: 'paragraph-count-mismatch',
      severity: 'signal',
      detail: 'セクション #1 "Setup": 段落数 EN=2, JA=1 (-1)',
    };
    assert.equal(isAllowlisted('test-page', issue, allowlist), false);
  });

  it('returns false for non-signal issues even if listed', () => {
    const allowlist = {
      'test-page': [
        { type: 'untranslated', reason: 'should not work' },
      ],
    };
    const issue = {
      type: 'untranslated',
      severity: 'actionable',
      text: 'Click on the button',
    };
    assert.equal(isAllowlisted('test-page', issue, allowlist), false);
  });

  it('returns false when rule has only slug + type (no detailIncludes/detailRegex)', () => {
    const allowlist = {
      'test-page': [
        { type: 'paragraph-count-mismatch', reason: 'too coarse' },
      ],
    };
    const issue = {
      type: 'paragraph-count-mismatch',
      severity: 'signal',
      detail: 'セクション #1 "Overview": 段落数 EN=4, JA=2 (-2)',
    };
    assert.equal(isAllowlisted('test-page', issue, allowlist), false);
  });

  it('returns false when slug not in allowlist', () => {
    const allowlist = {
      'other-page': [
        { type: 'paragraph-count-mismatch', detailIncludes: 'test', reason: 'test' },
      ],
    };
    const issue = {
      type: 'paragraph-count-mismatch',
      severity: 'signal',
      detail: 'some detail',
    };
    assert.equal(isAllowlisted('test-page', issue, allowlist), false);
  });

  it('supports detailRegex matching', () => {
    const allowlist = {
      'test-page': [
        {
          type: 'section-count-mismatch',
          detailRegex: 'EN=\\d+, JA=\\d+',
          reason: 'regex test',
        },
      ],
    };
    const issue = {
      type: 'section-count-mismatch',
      severity: 'signal',
      detail: 'H2-H4 セクション数: EN=5, JA=4',
    };
    assert.equal(isAllowlisted('test-page', issue, allowlist), true);
  });
});

describe('applyAllowlist', () => {
  it('filters out allowlisted signal issues', () => {
    const allowlist = {
      'test-page': [
        {
          type: 'paragraph-count-mismatch',
          detailIncludes: 'セクション #1',
          reason: 'intentional',
        },
      ],
    };
    const issues = [
      { type: 'untranslated', severity: 'actionable', text: 'Click on' },
      {
        type: 'paragraph-count-mismatch',
        severity: 'signal',
        detail: 'セクション #1 "Overview": 段落数 EN=4, JA=2 (-2)',
      },
      {
        type: 'paragraph-count-mismatch',
        severity: 'signal',
        detail: 'セクション #2 "Setup": 段落数 EN=3, JA=1 (-2)',
      },
    ];
    const filtered = applyAllowlist('test-page', issues, allowlist);
    assert.equal(filtered.length, 2);
    assert.equal(filtered[0].type, 'untranslated');
    assert.equal(filtered[1].detail.includes('セクション #2'), true);
  });

  it('returns all issues when allowlist is empty', () => {
    const issues = [
      { type: 'untranslated', severity: 'actionable', text: 'test' },
    ];
    const filtered = applyAllowlist('test-page', issues, {});
    assert.equal(filtered.length, 1);
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
