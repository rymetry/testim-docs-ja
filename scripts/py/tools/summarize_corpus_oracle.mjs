#!/usr/bin/env node
/**
 * summarize_corpus_oracle.mjs — oracle JSONL の sha256 一覧を TSV で抽出する。
 *
 * nightly-python-oracle workflow が `.oracle_today.jsonl` (MB オーダ) を
 * upload すると retention cost が積もるため、sha256 一覧 (KB オーダ) を
 * 別 artifact として分離する。Phase 6a で committed golden との hash 比較に
 * 移行する段階では、本 TSV が比較入力になる。
 *
 * Usage:
 *   node scripts/py/tools/summarize_corpus_oracle.mjs --in <jsonl> --out <tsv>
 *
 * 出力形式: 1 row = "<suite>\t<slug>\t<sha256>\n"、lexicographic sort。
 */

import process from 'node:process';
import { readFileSync, writeFileSync } from 'node:fs';

function parseArgs(argv) {
  let input = null;
  let output = null;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--in') input = argv[++i];
    else if (arg.startsWith('--in=')) input = arg.slice('--in='.length);
    else if (arg === '--out') output = argv[++i];
    else if (arg.startsWith('--out=')) output = arg.slice('--out='.length);
    else if (arg === '-h' || arg === '--help') {
      console.error('Usage: node summarize_corpus_oracle.mjs --in <jsonl> --out <tsv>');
      process.exit(0);
    } else {
      console.error(`Unknown argument: ${arg}`);
      process.exit(2);
    }
  }
  if (!input || !output) {
    console.error('Error: --in and --out are required');
    process.exit(2);
  }
  return { input, output };
}

const { input, output } = parseArgs(process.argv.slice(2));

const raw = readFileSync(input, 'utf8');
const rows = raw
  .split('\n')
  .filter((line) => line.trim().length > 0)
  .map((line) => JSON.parse(line));

// Lexicographic sort by (suite, slug) for deterministic diff-friendly output.
rows.sort((a, b) => {
  if (a.suite !== b.suite) return a.suite < b.suite ? -1 : 1;
  return a.slug < b.slug ? -1 : 1;
});

const tsv = rows.map((r) => `${r.suite}\t${r.slug}\t${r.sha256}`).join('\n') + '\n';
writeFileSync(output, tsv, 'utf8');
console.error(`summarize_corpus_oracle: ${rows.length} rows → ${output}`);
