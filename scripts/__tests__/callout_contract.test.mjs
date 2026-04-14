// scripts/__tests__/callout_contract.test.mjs
/**
 * Callout contract test — 4 レイヤーの callout type 集合が一致することを pin する。
 *
 * Layer 1: EN extractor (scripts/lib/source_parity_segments_en.mjs)
 *          CALLOUT_CLASS_RE で認識する class
 * Layer 2: JA extractor (scripts/lib/source_parity_segments_ja.mjs)
 *          CALLOUT_OPEN_RE で認識する :::type
 * Layer 3: Renderer (astro.config.mjs)
 *          remarkCalloutDirectives.callouts の keys
 * Layer 4: WRITING_GUIDE.md §133 callout mapping table
 *
 * 期待値: {note, caution, warning, info, tip, danger} 6 種。
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, '../..');

const EXPECTED = new Set(['note', 'caution', 'warning', 'info', 'tip', 'danger']);

function extractAlternationFromRegex(path, regexSource) {
  const content = readFileSync(path, 'utf8');
  const match = content.match(regexSource);
  if (!match) throw new Error('Pattern not found in ' + path);
  return match[1]
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean);
}

describe('callout contract — 4 レイヤーで type 集合が一致する', () => {
  it('Layer 1 (EN extractor): CALLOUT_CLASS_RE matches expected set', () => {
    const types = extractAlternationFromRegex(
      join(REPO_ROOT, 'scripts/lib/source_parity_segments_en.mjs'),
      /CALLOUT_CLASS_RE\s*=\s*\/\\b\(([^)]+)\)\\b\//,
    );
    assert.deepEqual(new Set(types), EXPECTED);
  });

  it('Layer 2 (JA extractor): CALLOUT_OPEN_RE matches expected set', () => {
    const types = extractAlternationFromRegex(
      join(REPO_ROOT, 'scripts/lib/source_parity_segments_ja.mjs'),
      /CALLOUT_OPEN_RE\s*=\s*\/\^:::\(([^)]+)\)/,
    );
    assert.deepEqual(new Set(types), EXPECTED);
  });

  it('Layer 3 (renderer astro.config.mjs): callouts keys match expected set', () => {
    const content = readFileSync(join(REPO_ROOT, 'astro.config.mjs'), 'utf8');
    const calloutsBlock = content.match(/callouts:\s*\{([\s\S]+?)\n\s+\},\s*\n\s*\},/);
    assert.ok(calloutsBlock, 'callouts block not found in astro.config.mjs');
    const keys = [];
    for (const m of calloutsBlock[1].matchAll(/^\s+(\w+):\s*\{/gm)) {
      keys.push(m[1]);
    }
    assert.deepEqual(new Set(keys), EXPECTED);
  });

  it('Layer 4 (WRITING_GUIDE §133): mapping table JA type column matches expected set', () => {
    const content = readFileSync(join(REPO_ROOT, 'docs/WRITING_GUIDE.md'), 'utf8');
    const section = content.match(
      /### 原文 blockquote → JA callout 変換マッピング[\s\S]+?\n\n([\s\S]+?)\n\n/,
    );
    assert.ok(section, 'callout mapping section not found');
    const tableRows = section[1].split('\n').filter((l) => l.startsWith('|') && !l.includes('---'));
    const types = new Set();
    for (const row of tableRows.slice(1)) {
      const cells = row.split('|').map((c) => c.trim());
      const jaType = (cells[2] ?? '').replace(/`/g, '').replace(/:::/g, '');
      if (EXPECTED.has(jaType)) types.add(jaType);
    }
    assert.deepEqual(types, EXPECTED);
  });
});
