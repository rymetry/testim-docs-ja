#!/usr/bin/env node

/**
 * Fetch English source pages and save HTML snapshots.
 *
 * Fetches the main content (`#mc-main-content`) from each page and stores it
 * as HTML in `snapshots/en/content/{slug}.html`. Also fetches the MadCap Flare
 * TOC data for sidebar verification and stores it as `snapshots/en/sidebar.json`.
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
} from './lib/project.mjs';
import { fetchTocData, buildSidebarSnapshot } from './lib/madcap_toc.mjs';
import { isDirectRun } from './lib/cli.mjs';

const SNAPSHOTS_DIR = path.join(ROOT_DIR, 'snapshots', 'en');
const CONTENT_DIR = path.join(SNAPSHOTS_DIR, 'content');
const SIDEBAR_PATH = path.join(SNAPSHOTS_DIR, 'sidebar.json');

const DEFAULT_USER_AGENT = 'testim-docs-ja-snapshot/1.0';
const THROTTLE_MS = 100;
const MARKER_404 = (url) => `<!-- 404: page not found at ${url} -->\n`;

const MAX_RETRIES = 3;
const RETRY_BASE_MS = 1000;

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

/**
 * Extract the main content HTML from a full page.
 * Targets `<div id="mc-main-content" ...>...</div>` (MadCap Flare).
 */
export function extractMainContent(html) {
  const startMatch = /<div[^>]*\bid=["']mc-main-content["'][^>]*>/i.exec(html);
  if (!startMatch) return null;

  let depth = 1;
  let pos = startMatch.index + startMatch[0].length;
  const openRe = /<div\b/gi;
  const closeRe = /<\/div>/gi;
  let lastCloseMatch = null;

  while (depth > 0 && pos < html.length) {
    openRe.lastIndex = pos;
    closeRe.lastIndex = pos;
    const openMatch = openRe.exec(html);
    const closeMatch = closeRe.exec(html);

    if (!closeMatch) break;

    if (openMatch && openMatch.index < closeMatch.index) {
      depth += 1;
      pos = openMatch.index + openMatch[0].length;
    } else {
      depth -= 1;
      lastCloseMatch = closeMatch;
      pos = closeMatch.index + closeMatch[0].length;
    }
  }

  if (depth !== 0 || !lastCloseMatch) return null;

  return html.slice(startMatch.index + startMatch[0].length, pos - lastCloseMatch[0].length);
}

/**
 * Fetch a page's HTML with retry and exponential backoff.
 * Retries on HTTP 522 status and network errors (timeout, DNS, etc.).
 */
async function fetchHtmlWithRetry(url) {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': DEFAULT_USER_AGENT,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });

      if (response.status === 522 && attempt < MAX_RETRIES) {
        await sleep(RETRY_BASE_MS * Math.pow(2, attempt));
        continue;
      }

      if (!response.ok) {
        return { html: null, status: response.status };
      }

      return { html: await response.text(), status: response.status };
    } catch (e) {
      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_BASE_MS * Math.pow(2, attempt));
        continue;
      }
      throw e;
    }
  }

  return { html: null, status: 522 };
}

/**
 * Fetch HTML page and extract the main content area.
 * Returns the raw inner HTML of `#mc-main-content`.
 */
async function fetchHtmlContent(url) {
  const { html, status } = await fetchHtmlWithRetry(url);

  if (!html) {
    return { content: null, status };
  }

  const mainContent = extractMainContent(html);
  if (!mainContent) {
    return { content: null, status, reason: 'mc-main-content-not-found' };
  }

  return { content: mainContent, status, reason: null };
}

/**
 * Verify sidebar by fetching MadCap Flare TOC data.
 * Stores the result as a JSON snapshot.
 */
async function verifySidebar({ dryRun = false } = {}) {
  try {
    const { sections } = await fetchTocData();
    if (sections.length === 0) {
      return { ok: false, reason: 'TOC data returned 0 sections' };
    }

    const snapshot = buildSidebarSnapshot(sections);

    if (!dryRun) {
      fs.writeFileSync(SIDEBAR_PATH, JSON.stringify(snapshot, null, 2) + '\n');
    }

    const totalPages = sections.reduce((sum, s) => sum + s.pages.length, 0);
    return { ok: true, sectionCount: sections.length, pageCount: totalPages };
  } catch (error) {
    return { ok: false, reason: error.message };
  }
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

  for (const target of targets) {
    try {
      const { content, status, reason } = await fetchHtmlContent(target.sourceUrl);
      const snapshotPath = path.join(CONTENT_DIR, `${target.slug}.html`);

      if (status === 404) {
        if (!args.dryRun) {
          fs.writeFileSync(snapshotPath, MARKER_404(target.sourceUrl));
        }
        console.log(`  404  ${target.slug}`);
        notFound += 1;
      } else if (!content) {
        const detail = reason === 'mc-main-content-not-found'
          ? '#mc-main-content not found (page structure changed?)'
          : `HTTP ${status}`;
        console.log(`  SKIP ${target.slug} — ${detail}`);
        errors += 1;
      } else {
        if (!args.dryRun) {
          fs.writeFileSync(snapshotPath, content);
        }
        console.log(`  OK   ${target.slug}`);
        fetched += 1;
      }
    } catch (error) {
      console.log(`  ERR  ${target.slug} — ${error.message}`);
      errors += 1;
    }

    await sleep(THROTTLE_MS);
  }

  // Verify sidebar via TOC data (independent of individual page fetches)
  const sidebarResult = await verifySidebar({ dryRun: args.dryRun });
  if (sidebarResult.ok) {
    const mode = args.dryRun ? 'dry-run' : 'saved';
    console.log(`  OK   sidebar (${mode}: ${sidebarResult.sectionCount} sections, ${sidebarResult.pageCount} pages)`);
  } else {
    console.log(`  ERR  sidebar — ${sidebarResult.reason}`);
    errors += 1;
  }

  console.log();
  console.log(`Done: ${fetched} fetched, ${notFound} not found, ${errors} errors`);
  if (args.dryRun) console.log('(dry-run — no files written)');

  return { fetched, notFound, errors, skipped: 0, sidebarVerified: sidebarResult.ok };
}

if (isDirectRun(import.meta.url)) {
  main()
    .then((result) => {
      process.exit(result.errors > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
