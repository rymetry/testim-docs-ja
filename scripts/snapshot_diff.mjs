#!/usr/bin/env node

/**
 * Compare committed Markdown snapshots (HEAD) with working tree snapshots
 * and generate a change report.
 *
 * Usage:
 *   node scripts/snapshot_diff.mjs
 *   node scripts/snapshot_diff.mjs --section="Overview"
 *   node scripts/snapshot_diff.mjs --json
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import {
  DOCS_DIR,
  ROOT_DIR,
  findMdFiles,
  matchesSectionFilter,
  readDocFile,
} from './lib/project.mjs';
import { isDirectRun } from './lib/cli.mjs';

const SNAPSHOTS_DIR = path.join(ROOT_DIR, 'snapshots', 'en');
const CONTENT_DIR = path.join(SNAPSHOTS_DIR, 'content');
const SIDEBAR_PATH = path.join(SNAPSHOTS_DIR, 'sidebar.html');
const OUTPUT_PATH = path.join(ROOT_DIR, 'snapshot-diff-status.json');

export const MARKER_404_RE = /^<!-- 404:/;

/**
 * Classify changed lines by content type.
 */
export const CHANGE_CLASSIFIERS = [
  { type: 'heading', pattern: /^ {0,3}#{1,6}\s|<\/?h[1-6]\b/i },
  { type: 'image', pattern: /!\[|<Image\b|<img\b/i },
  { type: 'code', pattern: /^ {0,3}```|<\/?pre\b/i },
  { type: 'callout', pattern: /^ {0,3}>\s*(?:📘|📙|🚧|❗|✅|👍|⚠️)|^ {0,3}<Callout\b|<blockquote\b[^>]*theme=/i },
];

export function parseArgs(argv = process.argv.slice(2)) {
  const args = { section: null, slug: null, json: false };
  for (const arg of argv) {
    if (arg.startsWith('--section=')) args.section = arg.slice('--section='.length);
    else if (arg.startsWith('--slug=')) args.slug = arg.slice('--slug='.length);
    else if (arg === '--json') args.json = true;
  }
  return args;
}

/**
 * Get the committed (HEAD) version of a file via git.
 * Returns null if the file doesn't exist in HEAD.
 */
function getHeadContent(relativePath) {
  try {
    return execFileSync('git', ['show', `HEAD:${relativePath}`], {
      encoding: 'utf8',
      cwd: ROOT_DIR,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch {
    return null;
  }
}

/**
 * Classify diff lines into content categories.
 */
export function classifyChanges(headContent, currentContent) {
  const headLines = headContent.split('\n');
  const currentLines = currentContent.split('\n');

  // Simple line-level diff: find added and removed lines
  const headSet = new Set(headLines);
  const currentSet = new Set(currentLines);

  const added = currentLines.filter((line) => !headSet.has(line));
  const removed = headLines.filter((line) => !currentSet.has(line));

  const categories = {
    heading: { added: 0, removed: 0 },
    image: { added: 0, removed: 0 },
    code: { added: 0, removed: 0 },
    callout: { added: 0, removed: 0 },
    content: { added: 0, removed: 0 },
  };

  for (const line of added) {
    let classified = false;
    for (const { type, pattern } of CHANGE_CLASSIFIERS) {
      if (pattern.test(line)) {
        categories[type].added += 1;
        classified = true;
        break;
      }
    }
    if (!classified) categories.content.added += 1;
  }

  for (const line of removed) {
    let classified = false;
    for (const { type, pattern } of CHANGE_CLASSIFIERS) {
      if (pattern.test(line)) {
        categories[type].removed += 1;
        classified = true;
        break;
      }
    }
    if (!classified) categories.content.removed += 1;
  }

  return { categories, diffLines: added.length + removed.length };
}

/**
 * Build slug-to-sourceUrl index from doc files for report enrichment.
 */
function buildSourceUrlIndex({ section }) {
  const files = findMdFiles(DOCS_DIR);
  const index = {};
  for (const filePath of files) {
    const doc = readDocFile(filePath);
    if (!doc.data.sourceUrl) continue;
    if (section && !matchesSectionFilter(doc.relativePath, doc.data, section)) continue;
    const slug = path.basename(filePath, '.md');
    index[slug] = doc.data.sourceUrl;
  }
  return index;
}

/**
 * Diff sidebar snapshot (HEAD vs working tree).
 */
function diffSidebar() {
  const sidebarRelPath = path.relative(ROOT_DIR, SIDEBAR_PATH);

  if (!fs.existsSync(SIDEBAR_PATH)) {
    return { changed: false, addedPages: [], removedPages: [] };
  }

  const headContent = getHeadContent(sidebarRelPath);
  const currentContent = fs.readFileSync(SIDEBAR_PATH, 'utf8');

  if (!headContent) {
    // New sidebar (first time)
    const pages = [...currentContent.matchAll(/href="\/docs\/([\w-]+)"/g)].map((m) => m[1]);
    return { changed: true, addedPages: pages, removedPages: [] };
  }

  if (headContent === currentContent) {
    return { changed: false, addedPages: [], removedPages: [] };
  }

  // Extract page slugs from both versions
  const headPages = new Set([...headContent.matchAll(/href="\/docs\/([\w-]+)"/g)].map((m) => m[1]));
  const currentPages = new Set([...currentContent.matchAll(/href="\/docs\/([\w-]+)"/g)].map((m) => m[1]));

  const addedPages = [...currentPages].filter((p) => !headPages.has(p));
  const removedPages = [...headPages].filter((p) => !currentPages.has(p));

  return { changed: true, addedPages, removedPages };
}

export async function main(argv) {
  const args = parseArgs(argv);
  const sourceUrls = buildSourceUrlIndex(args);

  if (!fs.existsSync(CONTENT_DIR)) {
    console.log('No snapshots found. Run check:snapshots:fetch first.');
    return;
  }

  const snapshotFiles = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.md'));
  const changes = [];

  let unchanged = 0;

  for (const file of snapshotFiles) {
    const slug = file.replace(/\.md$/, '');

    // Apply slug filter (takes priority over section)
    if (args.slug && slug !== args.slug) continue;

    // Apply section filter via sourceUrl index
    if (!args.slug && args.section && !sourceUrls[slug]) continue;

    const snapshotPath = path.join(CONTENT_DIR, file);
    const relPath = path.relative(ROOT_DIR, snapshotPath);
    const currentContent = fs.readFileSync(snapshotPath, 'utf8');

    const is404 = MARKER_404_RE.test(currentContent);
    const headContent = getHeadContent(relPath);

    if (!headContent) {
      // No committed version → new page
      if (is404) {
        // 404 for a page we never had → ignore
        continue;
      }
      changes.push({
        slug,
        type: 'page-added',
        sourceUrl: sourceUrls[slug] || `https://help.testim.io/docs/${slug}`,
        categories: null,
        diffLines: 0,
      });
      continue;
    }

    if (is404 && !MARKER_404_RE.test(headContent)) {
      // Was alive, now 404
      changes.push({
        slug,
        type: 'page-removed',
        sourceUrl: sourceUrls[slug] || `https://help.testim.io/docs/${slug}`,
        categories: null,
        diffLines: 0,
      });
      continue;
    }

    if (headContent === currentContent) {
      unchanged += 1;
      continue;
    }

    // Content changed
    const { categories, diffLines } = classifyChanges(headContent, currentContent);
    changes.push({
      slug,
      type: 'page-changed',
      sourceUrl: sourceUrls[slug] || `https://help.testim.io/docs/${slug}`,
      categories,
      diffLines,
    });
  }

  // Sidebar diff
  const sidebar = diffSidebar();

  const report = {
    checkedAt: new Date().toISOString(),
    summary: {
      totalSnapshots: snapshotFiles.length,
      changed: changes.filter((c) => c.type === 'page-changed').length,
      added: changes.filter((c) => c.type === 'page-added').length,
      removed: changes.filter((c) => c.type === 'page-removed').length,
      unchanged,
    },
    changes: changes.sort((a, b) => (b.diffLines || 0) - (a.diffLines || 0)),
    sidebar,
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(report, null, 2) + '\n');

  if (!args.json) {
    console.log(`Snapshot diff: ${report.summary.changed} changed, ${report.summary.added} added, ${report.summary.removed} removed, ${report.summary.unchanged} unchanged`);

    if (sidebar.changed) {
      console.log(`Sidebar: ${sidebar.addedPages.length} page(s) added, ${sidebar.removedPages.length} page(s) removed`);
    }

    if (changes.length > 0) {
      console.log();
      console.log('Changes:');
      for (const change of changes) {
        if (change.type === 'page-changed') {
          const cats = Object.entries(change.categories)
            .filter(([, v]) => v.added > 0 || v.removed > 0)
            .map(([k, v]) => `${k}:+${v.added}/-${v.removed}`)
            .join(', ');
          console.log(`  CHANGED  ${change.slug} (${change.diffLines} lines: ${cats})`);
        } else if (change.type === 'page-added') {
          console.log(`  ADDED    ${change.slug}`);
        } else if (change.type === 'page-removed') {
          console.log(`  REMOVED  ${change.slug}`);
        }
      }
    }
  }

  return report;
}

if (isDirectRun(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
