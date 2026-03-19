import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

let buildActionableReport;
let buildAuditManifest;

before(async () => {
  ({ buildActionableReport, buildAuditManifest } = await import(
    '../lib/detection_reports.mjs'
  ));
});

describe('buildAuditManifest', () => {
  it('buckets entries into high-confidence, parser-sensitive, and date-only groups', () => {
    const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'docs-audit-'));
    const files = [
      'src/content/docs/steps-editing-tests/one.md',
      'src/content/docs/validations/two.md',
      'src/content/docs/overview/three.md',
    ];

    fs.mkdirSync(path.join(tmpRoot, 'src', 'content', 'docs', 'steps-editing-tests'), {
      recursive: true,
    });
    fs.mkdirSync(path.join(tmpRoot, 'src', 'content', 'docs', 'validations'), {
      recursive: true,
    });
    fs.mkdirSync(path.join(tmpRoot, 'src', 'content', 'docs', 'overview'), {
      recursive: true,
    });

    fs.writeFileSync(
      path.join(tmpRoot, files[0]),
      '## Section\n\n![A](/images/a.png)\n',
    );
    fs.writeFileSync(
      path.join(tmpRoot, files[1]),
      '## Section\n\n<Image src="/images/a.png" alt={1} />\n',
    );
    fs.writeFileSync(path.join(tmpRoot, files[2]), '## Section\n\nPlain content.\n');

    const updates = {
      files: files.map((file) => ({
        file,
        needsUpdate: true,
        englishUpdated: '2025-09-19',
        japaneseUpdated: '2025-09-13',
      })),
    };
    const parity = {
      files: [
        {
          file: files[0],
          issues: [{ type: 'image-mismatch', severity: 'actionable', detail: 'EN=4 JA=1 (3枚不足)' }],
        },
        {
          file: files[1],
          issues: [{ type: 'image-mismatch', severity: 'actionable', detail: 'EN=4 JA=1 (3枚不足)' }],
        },
      ],
    };

    const manifest = buildAuditManifest(updates, parity, {
      rootDir: tmpRoot,
      groupCount: 2,
    });

    const one = manifest.find((entry) => entry.file === files[0]);
    const two = manifest.find((entry) => entry.file === files[1]);
    const three = manifest.find((entry) => entry.file === files[2]);

    assert.equal(one.bucket, 'high-confidence drift');
    assert.equal(two.bucket, 'parser-sensitive');
    assert.equal(three.bucket, 'date-only provisional');
    assert.match(one.reviewGroup, /^review-group-/);
    assert.equal(one.verificationStatus, 'needs-human-review');
  });
});

describe('buildActionableReport', () => {
  it('does not open a parity issue for heading-only signal entries', () => {
    const updates = {
      checkedAt: '2026-03-19T00:00:00Z',
      files: [],
    };
    const parity = {
      summary: {
        checkedAt: '2026-03-19T00:00:00Z',
        actionableFiles: 0,
        signalFiles: 1,
        errorFiles: 0,
        issuesByType: { 'heading-mismatch': 1 },
        issuesBySeverity: { signal: 1 },
      },
      files: [
        {
          file: 'src/content/docs/example.md',
          issues: [{ type: 'heading-mismatch', severity: 'signal', detail: 'h2: EN=10 JA=2' }],
        },
      ],
    };

    const report = buildActionableReport(updates, parity, []);
    assert.equal(report.parityRegression.shouldOpenIssue, false);
  });

  it('keeps date-drift and parity-regression as separate issue payloads', () => {
    const updates = {
      checkedAt: '2026-03-19T00:00:00Z',
      files: [
        {
          file: 'src/content/docs/example.md',
          japaneseUpdated: '2025-09-13',
          englishUpdated: '2025-09-19',
          needsUpdate: true,
          daysBehind: 6,
          status: 'outdated',
          comparisonStatus: 'outdated',
        },
      ],
    };
    const parity = {
      summary: {
        checkedAt: '2026-03-19T00:00:00Z',
        actionableFiles: 1,
        signalFiles: 0,
        errorFiles: 0,
        issuesByType: { 'image-mismatch': 1 },
        issuesBySeverity: { actionable: 1 },
      },
      files: [
        {
          file: 'src/content/docs/example.md',
          issues: [{ type: 'image-mismatch', severity: 'actionable', detail: 'EN=8 JA=2 (6枚不足)' }],
        },
      ],
    };

    const report = buildActionableReport(updates, parity, []);
    assert.equal(report.dateDrift.shouldOpenIssue, true);
    assert.equal(report.parityRegression.shouldOpenIssue, true);
    assert.match(report.dateDrift.body, /example\.md/);
    assert.match(report.parityRegression.body, /image-mismatch/);
  });
});
