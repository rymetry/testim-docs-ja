import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { parseFragment } from 'parse5';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

function runCases() {
  const result = spawnSync(
    process.execPath,
    ['--experimental-strip-types', 'scripts/issue-414/run-satteri-plugin-cases.mjs'],
    { cwd: repoRoot, encoding: 'utf8' }
  );
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout.trim());
}

function count(html, pattern) {
  return [...html.matchAll(pattern)].length;
}

test('Sätteri heading IDs are stable per document in serial and parallel renders', () => {
  const result = runCases();
  assert.match(result.duplicateHeadings, /id="同じ"/);
  assert.match(result.duplicateHeadings, /id="同じ-1"/);
  for (const html of result.sequentialHeadings) {
    assert.match(html, /id="同じ"/);
    assert.doesNotMatch(html, /同じ-1/);
  }
  for (const html of result.parallelHeadings) {
    assert.match(html, /id="並列"/);
    assert.doesNotMatch(html, /並列-1/);
  }
  assert.equal(count(result.duplicateHeadings, /class="heading-link"/g), 2);
});

test('Sätteri callouts preserve all six DOM contracts and nested Markdown', () => {
  const result = runCases();
  assert.deepEqual(Object.keys(result.callouts).sort(), [
    'caution',
    'danger',
    'info',
    'note',
    'tip',
    'warning',
  ]);
  for (const [type, html] of Object.entries(result.callouts)) {
    assert.match(html, new RegExp(`<aside class="callout callout-${type}">`));
    assert.match(html, /class="callout-hint"><svg/);
    assert.match(html, /class="callout-title">明示タイトル<\/div>/);
    assert.match(html, /class="callout-content">/);
    assert.match(html, /<strong>太字<\/strong>/);
    assert.match(html, /<a href="\/docs">リンク<\/a>/);
    assert.match(html, /<code>code<\/code>/);
    assert.match(html, /<ul>/);
  }
});

test('Sätteri table wrapper is exact and idempotent', () => {
  const result = runCases();
  assert.equal(count(result.table, /class="overflow-x-auto my-8"/g), 1);
  assert.equal(count(result.prewrapped, /class="overflow-x-auto my-8"/g), 1);
  assert.doesNotThrow(() => parseFragment(result.table));
});

test('custom plugins leave fenced code available to the later Expressive Code pass', () => {
  const result = runCases();
  assert.match(result.codeFence, /<pre>/);
  assert.match(result.codeFence, /<code class="language-js">/);
  assert.match(result.codeFence, /console\.log/);
});
