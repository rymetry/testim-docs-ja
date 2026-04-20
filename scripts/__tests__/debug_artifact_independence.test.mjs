// scripts/__tests__/debug_artifact_independence.test.mjs
/**
 * Spec Invariant 3: gate logic / baseline 生成 / ack 判定は parity-check-status.json
 * の debug.* namespace を一切読まない。
 *
 * 静的 grep based contract test。
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, '../..');

const GATE_SENSITIVE_FILES = [
  'scripts/lib/source_parity_baseline.mjs',
  'scripts/lib/source_parity_acknowledgements.mjs',
  'scripts/lib/source_parity_summary.mjs',
  'scripts/lib/source_parity_issue_state.mjs',
  'scripts/detection/generate_parity_baseline.mjs',
];

const FORBIDDEN_PATTERNS = [
  /\.debug\.maskCoverage/,
  /status\.debug\b/,
  /parityCheckStatus\.debug/,
  /['"`]debug['"`]\s*\]/,
  /from\s+['"]\.\/parity_glossary_mask\.mjs['"]/,
  /from\s+['"]\.\/parity_normalize\.mjs['"]/,
];

describe('debug artifact independence (Spec Invariant 3)', () => {
  for (const file of GATE_SENSITIVE_FILES) {
    it(file + ' does not read debug.* namespace or import mask/normalize modules', () => {
      const content = readFileSync(join(REPO_ROOT, file), 'utf8');
      for (const pattern of FORBIDDEN_PATTERNS) {
        const match = content.match(pattern);
        assert.equal(
          match,
          null,
          file + ' contains forbidden reference: ' + (match?.[0] ?? ''),
        );
      }
    });
  }
});
