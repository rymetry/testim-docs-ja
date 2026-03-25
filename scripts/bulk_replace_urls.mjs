#!/usr/bin/env node
/**
 * bulk_replace_urls.mjs — Phase B: Replace all help.testim.io URLs with new docs.tricentis.com URLs
 *
 * ONE-TIME SCRIPT: Delete after Phase B migration is complete.
 *
 * Reads scripts/url_mapping.json and replaces old_url → new_url across:
 *   - src/content/docs/**\/*.md (frontmatter sourceUrl)
 *   - docs/SIDEBAR_URLS.md
 *   - scripts/_sidebar_sections.json
 *
 * Usage:
 *   node scripts/bulk_replace_urls.mjs           # perform replacements
 *   node scripts/bulk_replace_urls.mjs --dry-run  # preview only
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(fileURLToPath(import.meta.url), '../..');
const MAPPING_PATH = path.join(ROOT, 'scripts', 'url_mapping.json');

function loadMappings() {
  const raw = JSON.parse(fs.readFileSync(MAPPING_PATH, 'utf8'));
  // Build old_url → new_url map, sorted by URL length descending
  // to avoid substring collisions (e.g. "auto-grouping" replacing part of "auto-grouping2")
  const entries = Object.values(raw.mappings)
    .sort((a, b) => b.old_url.length - a.old_url.length);
  const map = new Map();
  for (const entry of entries) {
    map.set(entry.old_url, entry.new_url);
  }
  return map;
}

function replaceInFile(filePath, urlMap, dryRun) {
  const original = fs.readFileSync(filePath, 'utf8');
  let content = original;

  for (const [oldUrl, newUrl] of urlMap) {
    content = content.replaceAll(oldUrl, newUrl);
  }

  if (content !== original) {
    if (!dryRun) {
      fs.writeFileSync(filePath, content, 'utf8');
    }
    return true;
  }
  return false;
}

function findMdFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { recursive: true })) {
    if (entry.endsWith('.md')) {
      results.push(path.join(dir, entry));
    }
  }
  return results;
}

function main() {
  const dryRun = process.argv.includes('--dry-run');
  const urlMap = loadMappings();

  console.log(`Loaded ${urlMap.size} URL mappings`);
  if (dryRun) console.log('DRY RUN — no files will be modified\n');

  const targets = [
    ...findMdFiles(path.join(ROOT, 'src', 'content', 'docs')),
    path.join(ROOT, 'docs', 'SIDEBAR_URLS.md'),
    path.join(ROOT, 'scripts', '_sidebar_sections.json'),
  ];

  let changedCount = 0;
  for (const filePath of targets) {
    if (!fs.existsSync(filePath)) continue;
    const changed = replaceInFile(filePath, urlMap, dryRun);
    if (changed) {
      changedCount++;
      console.log(`${dryRun ? '[DRY] ' : ''}Updated: ${path.relative(ROOT, filePath)}`);
    }
  }

  console.log(`\n${dryRun ? 'Would update' : 'Updated'} ${changedCount} file(s)`);
}

main();
