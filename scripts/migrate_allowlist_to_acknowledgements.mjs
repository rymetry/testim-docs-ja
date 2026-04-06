#!/usr/bin/env node
/**
 * One-shot migration: reads parity-allowlist.json + EN snapshots,
 * computes fingerprints, writes parity-acknowledgements.json.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { computeSnapshotFingerprint } from './lib/source_parity_acknowledgements.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const ALLOWLIST_PATH = path.join(ROOT_DIR, 'parity-allowlist.json');
const SNAPSHOTS_DIR = path.join(ROOT_DIR, 'snapshots', 'en', 'content');
const OUTPUT_PATH = path.join(ROOT_DIR, 'parity-acknowledgements.json');
const REVIEW_AFTER = '2026-07-06';

const allowlist = JSON.parse(fs.readFileSync(ALLOWLIST_PATH, 'utf8'));
const entries = [];
let skipped = 0;

for (const [slug, rules] of Object.entries(allowlist)) {
  const snapshotPath = path.join(SNAPSHOTS_DIR, slug + '.html');
  const snapshotExists = fs.existsSync(snapshotPath);
  const fingerprint = snapshotExists
    ? computeSnapshotFingerprint(fs.readFileSync(snapshotPath, 'utf8'))
    : null;

  for (const rule of rules) {
    if (!fingerprint) {
      console.warn(`⚠ Skipping ${slug}/${rule.type}: no snapshot found`);
      skipped += 1;
      continue;
    }
    entries.push({
      slug,
      issueType: rule.type,
      ...(rule.detailIncludes ? { detailIncludes: rule.detailIncludes } : {}),
      ...(rule.detailRegex ? { detailRegex: rule.detailRegex } : {}),
      sourceFingerprint: fingerprint,
      reason: rule.reason,
      evidence: `Migrated from parity-allowlist.json on ${new Date().toISOString().slice(0, 10)}`,
      owner: 'rymetry',
      reviewAfter: REVIEW_AFTER,
    });
  }
}

const output = { schemaVersion: 1, entries };
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2) + '\n');
console.log(`✅ Migrated ${entries.length} entries to ${path.relative(ROOT_DIR, OUTPUT_PATH)}`);
if (skipped > 0) {
  console.log(`⚠ Skipped ${skipped} entries (no snapshot found)`);
}
