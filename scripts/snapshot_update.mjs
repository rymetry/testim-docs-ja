#!/usr/bin/env node

/**
 * Fetch English source pages and save raw Markdown snapshots.
 *
 * Usage:
 *   node scripts/snapshot_update.mjs                   # all pages
 *   node scripts/snapshot_update.mjs --section="Overview"
 *   node scripts/snapshot_update.mjs --slug=testim-overview
 *   node scripts/snapshot_update.mjs --dry-run
 */

import fs from 'node:fs';
import path from 'node:path';

import {
  DOCS_DIR,
  ROOT_DIR,
  findMdFiles,
  matchesSectionFilter,
  readDocFile,
  toRelativeDocPath,
} from './lib/project.mjs';
import { normalizeSidebar } from './lib/snapshot_normalize.mjs';
import { isDirectRun } from './lib/cli.mjs';

const SNAPSHOTS_DIR = path.join(ROOT_DIR, 'snapshots', 'en');
const CONTENT_DIR = path.join(SNAPSHOTS_DIR, 'content');
const SIDEBAR_PATH = path.join(SNAPSHOTS_DIR, 'sidebar.html');

const DEFAULT_USER_AGENT = 'testim-docs-ja-snapshot/1.0';
const THROTTLE_MS = 100;
const MARKER_404 = (url) => `<!-- 404: page not found at ${url} -->\n`;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseArgs(argv = process.argv.slice(2)) {
  const args = { section: null, slug: null, dryRun: false };
  for (const arg of argv) {
    if (arg.startsWith('--section=')) args.section = arg.slice('--section='.length);
    else if (arg.startsWith('--slug=')) args.slug = arg.slice('--slug='.length);
    else if (arg === '--dry-run') args.dryRun = true;
  }
  return args;
}

/**
 * Build list of { slug, sourceUrl, relativePath } from doc files.
 */
function collectTargets({ section, slug }) {
  const files = findMdFiles(DOCS_DIR);
  const targets = [];

  for (const filePath of files) {
    const doc = readDocFile(filePath);
    const { data } = doc;
    if (!data.sourceUrl) continue;

    const fileSlug = path.basename(filePath, '.md');
    if (slug && fileSlug !== slug) continue;
    if (section && !matchesSectionFilter(doc.relativePath, data, section)) continue;

    targets.push({
      slug: fileSlug,
      sourceUrl: data.sourceUrl,
      relativePath: doc.relativePath,
    });
  }

  return targets;
}

const FETCH_TIMEOUT_MS = 30_000;

async function fetchMarkdown(url) {
  const mdUrl = `${url}.md`;
  const response = await fetch(mdUrl, {
    headers: { 'User-Agent': DEFAULT_USER_AGENT, Accept: 'text/markdown' },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!response.ok) {
    return { markdown: null, status: response.status };
  }
  return { markdown: await response.text(), status: response.status };
}

async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: { 'User-Agent': DEFAULT_USER_AGENT },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!response.ok) {
    return { html: null, status: response.status };
  }
  return { html: await response.text(), status: response.status };
}

export async function main(argv) {
  const args = parseArgs(argv);
  const targets = collectTargets(args);

  if (targets.length === 0) {
    console.log('No targets found.');
    return { fetched: 0, notFound: 0, errors: 0, skipped: 0 };
  }

  // Ensure directories exist
  if (!args.dryRun) {
    fs.mkdirSync(CONTENT_DIR, { recursive: true });
  }

  console.log(`Fetching ${targets.length} page(s)...`);

  let fetched = 0;
  let notFound = 0;
  let errors = 0;
  let sidebarSaved = false;

  for (const target of targets) {
    try {
      const { markdown, status } = await fetchMarkdown(target.sourceUrl);
      const snapshotPath = path.join(CONTENT_DIR, `${target.slug}.md`);

      if (status === 404) {
        if (!args.dryRun) {
          fs.writeFileSync(snapshotPath, MARKER_404(target.sourceUrl));
        }
        console.log(`  404  ${target.slug}`);
        notFound += 1;
      } else if (!markdown) {
        console.log(`  SKIP ${target.slug} — HTTP ${status}`);
        errors += 1;
      } else {
        if (!args.dryRun) {
          fs.writeFileSync(snapshotPath, markdown);
        }
        console.log(`  OK   ${target.slug}`);
        fetched += 1;

        // Save sidebar from the first successful page (requires HTML fetch)
        if (!sidebarSaved && !args.dryRun) {
          try {
            const { html } = await fetchHtml(target.sourceUrl);
            if (html) {
              const sidebar = normalizeSidebar(html);
              if (sidebar.found) {
                fs.writeFileSync(SIDEBAR_PATH, sidebar.html);
                console.log(`  OK   sidebar (from ${target.slug})`);
                sidebarSaved = true;
              } else {
                console.log(`  WARN sidebar — no hub-sidebar found in ${target.slug}`);
              }
            } else {
              console.log(`  WARN sidebar — HTML fetch failed for ${target.slug}`);
            }
          } catch (sidebarError) {
            console.log(`  WARN sidebar — ${sidebarError.message}`);
          }
        }
      }
    } catch (error) {
      console.log(`  ERR  ${target.slug} — ${error.message}`);
      errors += 1;
    }

    await sleep(THROTTLE_MS);
  }

  console.log();
  console.log(`Done: ${fetched} fetched, ${notFound} not found, ${errors} errors`);
  if (args.dryRun) console.log('(dry-run — no files written)');

  return { fetched, notFound, errors, skipped: 0 };
}

if (isDirectRun(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
