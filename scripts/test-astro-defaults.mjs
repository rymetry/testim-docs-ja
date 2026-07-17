#!/usr/bin/env node

import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { chromium } from '@playwright/test';
import { parse } from 'parse5';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fixtureRoot = join(repoRoot, 'tests/fixtures/astro-whitespace');
const astroBin = join(repoRoot, 'node_modules/.bin/astro');

function run(command, args, options) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, { ...options, stdio: 'inherit' });
    child.on('error', reject);
    child.on('close', (exitCode) => {
      if (exitCode === 0) resolvePromise();
      else reject(new Error(`${command} exited with ${exitCode}`));
    });
  });
}

function findCases(node, result = new Map()) {
  const attributes = Object.fromEntries((node.attrs ?? []).map(({ name, value }) => [name, value]));
  if (attributes['data-whitespace-case']) result.set(attributes['data-whitespace-case'], node);
  for (const child of node.childNodes ?? []) findCases(child, result);
  return result;
}

function textNodes(node, result = []) {
  if (node.nodeName === '#text') result.push(node.value);
  for (const child of node.childNodes ?? []) textNodes(child, result);
  return result;
}

async function build(mode, outputRoot) {
  const outputDirectory = join(outputRoot, mode);
  await run(astroBin, ['--root', fixtureRoot, 'build', '--outDir', outputDirectory], {
    cwd: repoRoot,
    env: { ...process.env, ISSUE_414_COMPRESS_HTML: mode },
  });
  return join(outputDirectory, 'index.html');
}

async function browserText(htmlPath) {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(pathToFileURL(htmlPath).href);
    return Object.fromEntries(
      await page
        .locator('[data-whitespace-case]')
        .evaluateAll((elements) =>
          elements.map((element) => [
            element.getAttribute('data-whitespace-case'),
            element.textContent,
          ])
        )
    );
  } finally {
    await browser.close();
  }
}

const expectedText = {
  'japanese-link': '日本語のリンクです。',
  'strong-code': '強調とinline()です。',
  'adjacent-components': ' 甲乙 ',
  multiline: '複数行の テキストです。',
  'explicit-spaces': '半角 空白と全角　空白',
  punctuation: '句読点、そのまま。保持します！',
  'inline-boundaries': '前 中央 後',
  'block-newlines': ' ブロックA ブロックB ',
};

const outputRoot = await mkdtemp(join(tmpdir(), 'testim-astro-whitespace-'));
try {
  const htmlPaths = {
    true: await build('true', outputRoot),
    jsx: await build('jsx', outputRoot),
  };
  const parsed = {};
  const browser = {};

  for (const [mode, htmlPath] of Object.entries(htmlPaths)) {
    const document = parse(await readFile(htmlPath, 'utf8'));
    parsed[mode] = Object.fromEntries(
      [...findCases(document)].map(([name, node]) => [name, textNodes(node)])
    );
    browser[mode] = await browserText(htmlPath);
  }

  assert.deepEqual(Object.keys(parsed.true).sort(), Object.keys(expectedText).sort());
  assert.deepEqual(
    parsed.jsx,
    parsed.true,
    'inline text-node sequence changed under compressHTML: "jsx"'
  );
  assert.deepEqual(
    browser.jsx,
    browser.true,
    'browser textContent changed under compressHTML: "jsx"'
  );
  assert.deepEqual(
    browser.true,
    expectedText,
    'fixture no longer represents the intended whitespace contract'
  );
  for (const mode of ['true', 'jsx']) {
    assert.deepEqual(
      Object.fromEntries(
        Object.entries(parsed[mode]).map(([name, values]) => [name, values.join('')])
      ),
      browser[mode],
      `${mode} serialized text and browser textContent differ`
    );
  }

  console.log(
    `Astro whitespace contract passed (${Object.keys(expectedText).length} cases × 2 modes).`
  );
} finally {
  await rm(outputRoot, { recursive: true, force: true });
}
