/**
 * tests for scripts/pipeline.mjs  (new module — will fail until implemented)
 *
 * The implementation must export:
 *   parseArgs(argv: string[]): { mode: string }
 *   loadCheckpoint(checkpointPath: string): CheckpointData | null
 *   saveCheckpoint(checkpointPath: string, data: CheckpointData): Promise<void>
 *
 * CheckpointData = {
 *   completed_phase?: string,
 *   completed_at?: string,
 *   next_phase?: string,
 *   step?: string,
 *   mode?: string,
 * }
 *
 * The implementation must also guard main() so importing does not trigger side effects.
 */
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

let parseArgs, loadCheckpoint, saveCheckpoint;
before(async () => {
  ({ parseArgs, loadCheckpoint, saveCheckpoint } = await import('../pipeline.mjs'));
});

// ---------------------------------------------------------------------------
// parseArgs
// ---------------------------------------------------------------------------
describe('parseArgs', () => {
  it('parses --mode=full', () => {
    const result = parseArgs(['--mode=full']);
    assert.equal(result.mode, 'full');
  });

  it('parses --mode=diff', () => {
    const result = parseArgs(['--mode=diff']);
    assert.equal(result.mode, 'diff');
  });

  it('defaults mode to "diff" when not specified (PR-final behavior)', () => {
    // Note: prior to PR-final, the default is 'full'; after PR-final it becomes 'diff'.
    // The test encodes the final target state.
    const result = parseArgs([]);
    assert.equal(result.mode, 'diff');
  });

  it('handles combined flags', () => {
    const result = parseArgs(['--mode=full']);
    assert.equal(result.mode, 'full');
  });
});

// ---------------------------------------------------------------------------
// loadCheckpoint / saveCheckpoint
// ---------------------------------------------------------------------------
describe('checkpoint persistence', () => {
  let tmpDir;
  before(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'takt-pipeline-test-'));
  });

  it('returns null when checkpoint file does not exist', () => {
    const cp = loadCheckpoint(path.join(tmpDir, 'nonexistent.json'));
    assert.equal(cp, null);
  });

  it('saves and loads checkpoint data round-trip', async () => {
    const cpPath = path.join(tmpDir, '.checkpoint');
    const data = {
      completed_phase: 'PR-0a',
      completed_at: '2026-03-13T10:00:00Z',
      next_phase: 'PR-0b',
      step: 'fetch_done',
      mode: 'full',
    };
    await saveCheckpoint(cpPath, data);
    const loaded = loadCheckpoint(cpPath);
    assert.deepEqual(loaded, data);
  });

  it('overwrites existing checkpoint on save', async () => {
    const cpPath = path.join(tmpDir, '.checkpoint-overwrite');
    await saveCheckpoint(cpPath, { step: 'url_collect_done' });
    await saveCheckpoint(cpPath, { step: 'fetch_done' });
    const loaded = loadCheckpoint(cpPath);
    assert.equal(loaded.step, 'fetch_done');
  });

  it('saveCheckpoint creates parent directories if missing', async () => {
    const nestedPath = path.join(tmpDir, 'sub', 'dir', '.checkpoint');
    await saveCheckpoint(nestedPath, { step: 'init' });
    assert.ok(fs.existsSync(nestedPath));
  });

  it('saved file is valid JSON', async () => {
    const cpPath = path.join(tmpDir, '.checkpoint-json');
    await saveCheckpoint(cpPath, { completed_phase: 'PR-0b', mode: 'diff' });
    const raw = fs.readFileSync(cpPath, 'utf8');
    assert.doesNotThrow(() => JSON.parse(raw));
  });

  it('checkpoint JSON includes all provided fields', async () => {
    const cpPath = path.join(tmpDir, '.checkpoint-fields');
    const data = {
      completed_phase: 'PR-0a',
      completed_at: '2026-03-13T10:00:00Z',
      next_phase: 'PR-0b',
      step: 'apply_llm_done',
      mode: 'full',
    };
    await saveCheckpoint(cpPath, data);
    const parsed = JSON.parse(fs.readFileSync(cpPath, 'utf8'));
    for (const [k, v] of Object.entries(data)) {
      assert.equal(parsed[k], v, `field ${k} must be persisted`);
    }
  });
});

// ---------------------------------------------------------------------------
// step update semantics
// ---------------------------------------------------------------------------
describe('checkpoint step update', () => {
  let tmpDir;
  before(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'takt-pipeline-step-'));
  });

  it('step field is updated without losing other fields', async () => {
    const cpPath = path.join(tmpDir, '.checkpoint-step');
    await saveCheckpoint(cpPath, {
      completed_phase: 'PR-0a',
      mode: 'full',
      step: 'url_collect_done',
    });

    const existing = loadCheckpoint(cpPath);
    await saveCheckpoint(cpPath, { ...existing, step: 'fetch_done' });

    const updated = loadCheckpoint(cpPath);
    assert.equal(updated.step, 'fetch_done');
    assert.equal(updated.completed_phase, 'PR-0a');
    assert.equal(updated.mode, 'full');
  });
});
