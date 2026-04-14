// scripts/__tests__/debug_mask_coverage.test.mjs
/**
 * parity-check-status.json の debug.maskCoverage 出力契約 (Spec Invariant 3).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('parity-check-status.json — debug.maskCoverage emit', () => {
  it('output includes debug.maskCoverage with summary counters', async () => {
    const { default: main } = await import('../check_source_parity.mjs');
    const tmp = mkdtempSync(join(tmpdir(), 'parity-debug-'));
    const outputPath = join(tmp, 'parity-check-status.json');
    try {
      await main({ outputPath });
      const status = JSON.parse(readFileSync(outputPath, 'utf8'));
      assert.ok(status.debug, 'debug namespace should exist');
      assert.ok(status.debug.maskCoverage, 'debug.maskCoverage should exist');
      const summary = status.debug.maskCoverage.summary;
      assert.ok(summary && typeof summary === 'object');
      assert.equal(typeof summary.segmentsMasked, 'number');
      assert.ok(summary.byGlossaryEntry && typeof summary.byGlossaryEntry === 'object');
      assert.ok(summary.byInvariantPattern && typeof summary.byInvariantPattern === 'object');
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});
