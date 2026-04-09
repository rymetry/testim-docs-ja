#!/usr/bin/env node

/**
 * Fetch English source pages and save HTML snapshots.
 *
 * Fetches the main content (`#mc-main-content`) from each page and stores it
 * as HTML in `snapshots/en/content/{slug}.html`. Also fetches the MadCap Flare
 * TOC data for sidebar verification and stores it as `snapshots/en/sidebar.json`.
 *
 * Always writes `source-sync-status.json` (even in --dry-run) as fetch metadata.
 * --dry-run skips writing snapshot HTML and sidebar JSON only.
 *
 * Usage:
 *   node scripts/snapshot_update.mjs                   # all pages
 *   node scripts/snapshot_update.mjs --section="Overview"
 *   node scripts/snapshot_update.mjs --slug=overview/testim-overview
 *   node scripts/snapshot_update.mjs --dry-run
 */

import fs from 'node:fs';
import path from 'node:path';

import {
  DOCS_DIR,
  ROOT_DIR,
  filePathToSlug,
  findMdFiles,
  matchesSectionFilter,
  readDocFile,
  resolveSlug,
} from './lib/project.mjs';
import { fetchTocData, buildSidebarSnapshot, extractSlugsFromSnapshot } from './lib/madcap_toc.mjs';
import { isDirectRun } from './lib/cli.mjs';
import { buildRunScope, buildSourceSyncStatus } from './lib/source_sync_health.mjs';
import { isSourceSideDebt, getExclusion } from './lib/source_sync_exclusions.mjs';
import { extractSegmentsFromHtml } from './lib/source_parity_segments_en.mjs';
import { extractSegmentsFromMarkdown } from './lib/source_parity_segments_ja.mjs';
import { detectSourceUsability } from './lib/source_parity_source_usability.mjs';

const SNAPSHOTS_DIR = path.join(ROOT_DIR, 'snapshots', 'en');
const CONTENT_DIR = path.join(SNAPSHOTS_DIR, 'content');
const SIDEBAR_PATH = path.join(SNAPSHOTS_DIR, 'sidebar.json');

const SOURCE_SYNC_STATUS_PATH = path.join(ROOT_DIR, 'source-sync-status.json');
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
  // Resolve --slug to path-based slug (supports both basename and path-based input)
  const resolvedSlug = slug ? resolveSlug(slug) : null;
  if (slug && !resolvedSlug) {
    console.error(`❌ Unknown slug: "${slug}". No matching document found.`);
    return [];
  }

  for (const filePath of files) {
    const doc = readDocFile(filePath);
    const { data } = doc;
    if (!data.sourceUrl) continue;

    const fileSlug = filePathToSlug(filePath);
    if (resolvedSlug && fileSlug !== resolvedSlug) continue;
    if (section && !matchesSectionFilter(doc.relativePath, data, section)) continue;

    targets.push({
      slug: fileSlug,
      sourceUrl: data.sourceUrl,
      relativePath: doc.relativePath,
    });
  }

  return targets;
}

/**
 * Synthetic JA segments for recovery probe.
 *
 * detectSourceUsability は JA body / heading 数を閾値に使う
 * (`extractor-empty`: jaBody >= 3, `shallow-snapshot`: jaBody >= 5,
 * `escaped-details-residue`: jaHeading >= 2)。recovery probe が実 JA に
 * 依存すると、未翻訳や短い JA で false recovery が発生する。
 *
 * recovery probe は "現在の expectedReason" ではなく detector が持つ
 * すべての閾値を一度に満たす synthetic JA を使う。これにより
 * `extractor-empty` → `shallow-snapshot` のような cross-reason drift でも
 * fail-close を維持できる。
 */
function buildProbeJaSegments() {
  return extractSegmentsFromMarkdown(
    '# Probe\n\n## Section One\n\nA\n\nB\n\n## Section Two\n\nC\n\nD\n\nE',
  );
}

const SUPPORTED_RECOVERY_REASONS = new Set([
  'extractor-empty',
  'shallow-snapshot',
  'escaped-details-residue',
]);

function buildBrokenRecoveryProbe({
  actualIssueType,
  actualReason,
  exclusionEntry,
}) {
  return {
    fetchStatus: 'excluded-broken',
    recoveryProbe: {
      issueType: actualIssueType,
      reason: actualReason,
      expectedIssueType: exclusionEntry.expectedIssueType,
      expectedReason: exclusionEntry.expectedReason,
      expectedMatch:
        actualIssueType === exclusionEntry.expectedIssueType &&
        actualReason === exclusionEntry.expectedReason,
    },
  };
}

/**
 * Recovery probe for a known source-side debt page.
 *
 * `detectSourceUsability()` を再利用して、registry に登録された
 * broken upstream source が復旧したかを判定する。detector が対応する
 * `extractor-empty` / `shallow-snapshot` / `escaped-details-residue` を
 * そのまま扱えるため、registry 追加だけで新しい debt reason を運用に載せられる。
 *
 * JA body には依存しない — synthetic segments を使って EN-only 判定を維持。
 *
 * Unsupported registry reasons and extractor exceptions both fail closed.
 * A debt page is only `excluded-recovered` when the extractor succeeds and
 * `detectSourceUsability()` returns no issue.
 *
 * @param {{ rawEnHtml: string, exclusionEntry: object, extractSegments?: (html: string) => any[] }} opts
 * @returns {{ fetchStatus: string, recoveryProbe: object|null }}
 */
export function runRecoveryProbe({
  rawEnHtml,
  exclusionEntry,
  extractSegments = extractSegmentsFromHtml,
}) {
  if (!SUPPORTED_RECOVERY_REASONS.has(exclusionEntry.expectedReason)) {
    return buildBrokenRecoveryProbe({
      actualIssueType: 'probe-failed',
      actualReason: 'unsupported-expected-reason',
      exclusionEntry,
    });
  }

  let enSegments = [];
  let extractError = null;
  try {
    enSegments = extractSegments(rawEnHtml);
  } catch (error) {
    extractError = error;
  }

  if (extractError !== null) {
    return buildBrokenRecoveryProbe({
      actualIssueType: 'probe-failed',
      actualReason: 'extractor-throw',
      exclusionEntry,
    });
  }

  const jaSegments = buildProbeJaSegments();

  const issue = detectSourceUsability({
    rawEnHtml,
    enSegments,
    jaSegments,
    extractError,
  });

  if (!issue) return { fetchStatus: 'excluded-recovered', recoveryProbe: null };

  return buildBrokenRecoveryProbe({
    actualIssueType: issue.type,
    actualReason: issue.usabilitySignals?.reason ?? 'unknown',
    exclusionEntry,
  });
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
  let lastCloseIndex = -1;

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
      lastCloseIndex = closeMatch.index;
      pos = closeMatch.index + closeMatch[0].length;
    }
  }

  if (depth !== 0 || lastCloseIndex < 0) return null;

  return html.slice(startMatch.index + startMatch[0].length, lastCloseIndex);
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
    const sidebarSlugs = [...extractSlugsFromSnapshot(snapshot)];
    return { ok: true, sectionCount: sections.length, pageCount: totalPages, sidebarSlugs };
  } catch (error) {
    console.error('verifySidebar failed:', error);
    return { ok: false, reason: error.message };
  }
}

export async function main(argv) {
  const args = parseArgs(argv);
  const targets = collectTargets(args);
  const resolvedSlug = args.slug ? resolveSlug(args.slug) : null;
  const runScope = buildRunScope({
    slug: resolvedSlug,
    section: args.section,
  });

  if (targets.length === 0) {
    console.log('No targets found.');
    return { fetched: 0, notFound: 0, errors: args.slug ? 1 : 0, skipped: 0 };
  }

  // Ensure directories exist
  if (!args.dryRun) {
    fs.mkdirSync(CONTENT_DIR, { recursive: true });
  }

  console.log(`Fetching ${targets.length} page(s)...`);

  let fetched = 0;
  let notFound = 0;
  let errors = 0;
  let excluded = 0;
  const pageResults = [];

  for (const target of targets) {
    const excludedSlug = isSourceSideDebt(target.slug);

    try {
      const { content, status, reason } = await fetchHtmlContent(target.sourceUrl);
      const snapshotPath = path.join(CONTENT_DIR, target.slug + '.html');

      if (excludedSlug) {
        // Issue #255 — source-side debt: fetch しても snapshot file は
        // 絶対に上書きしない (hand-authored を凍結参照として温存)。
        //
        // fetch 失敗 (HTTP error / 404 / mc-main-content missing) と
        // 正常 fetch + recovery probe は分離する。fetch 失敗は
        // excluded-fetch-error として errors に計上し、freshness 劣化を
        // 可視化する。probe は content が取れたときのみ実行する。
        if (!content) {
          const detail =
            status !== 200 ? `HTTP ${status}` :
            reason === 'mc-main-content-not-found' ? '#mc-main-content not found' :
            'fetch failed';
          console.log(`  FERR ${target.slug} — source-side debt (${detail})`);
          errors += 1;
          pageResults.push({
            slug: target.slug,
            fetchStatus: 'excluded-fetch-error',
            debtCategory: 'source-side-debt',
            errorDetail: detail,
            recoveryProbe: null,
          });
        } else {
          const probe = runRecoveryProbe({ rawEnHtml: content, exclusionEntry: getExclusion(target.slug) });
          const label = probe.fetchStatus === 'excluded-recovered' ? 'RECOV' : 'DEBT ';
          console.log(`  ${label} ${target.slug} — source-side debt (snapshot not written)`);
          excluded += 1;
          pageResults.push({
            slug: target.slug,
            fetchStatus: probe.fetchStatus,
            recoveryProbe: probe.recoveryProbe,
            debtCategory: 'source-side-debt',
          });
        }
      } else if (status === 404) {
        if (!args.dryRun) {
          fs.mkdirSync(path.dirname(snapshotPath), { recursive: true });
          fs.writeFileSync(snapshotPath, MARKER_404(target.sourceUrl));
        }
        console.log(`  404  ${target.slug}`);
        notFound += 1;
        pageResults.push({ slug: target.slug, fetchStatus: 'not-found' });
      } else if (!content) {
        const detail = reason === 'mc-main-content-not-found'
          ? '#mc-main-content not found (page structure changed?)'
          : `HTTP ${status}`;
        console.log(`  SKIP ${target.slug} — ${detail}`);
        errors += 1;
        pageResults.push({ slug: target.slug, fetchStatus: 'error', errorDetail: detail });
      } else {
        if (!args.dryRun) {
          fs.mkdirSync(path.dirname(snapshotPath), { recursive: true });
          fs.writeFileSync(snapshotPath, content);
        }
        console.log(`  OK   ${target.slug}`);
        fetched += 1;
        pageResults.push({ slug: target.slug, fetchStatus: 'ok' });
      }
    } catch (error) {
      if (excludedSlug) {
        // fetch が throw した → excluded-fetch-error として errors に計上。
        // live EN を観測できなかったことを source-sync 劣化として可視化する。
        console.log(`  FERR ${target.slug} — source-side debt (fetch failed: ${error.message})`);
        errors += 1;
        pageResults.push({
          slug: target.slug,
          fetchStatus: 'excluded-fetch-error',
          debtCategory: 'source-side-debt',
          errorDetail: error.message,
          recoveryProbe: null,
        });
      } else {
        console.log(`  ERR  ${target.slug} — ${error.message}`);
        errors += 1;
        pageResults.push({ slug: target.slug, fetchStatus: 'error', errorDetail: error.message });
      }
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

  // Build source sync status (always written — metadata, not content)
  const sourceSyncStatus = buildSourceSyncStatus({
    pages: pageResults,
    sidebarResult,
    runScope,
  });
  fs.writeFileSync(
    SOURCE_SYNC_STATUS_PATH,
    JSON.stringify(sourceSyncStatus, null, 2) + '\n',
  );

  console.log();
  console.log(
    `Done: ${fetched} fetched, ${notFound} not found, ${errors} errors, ${excluded} excluded (source-side debt)`,
  );
  console.log(`Freshness: ${sourceSyncStatus.freshnessState}`);
  if (args.dryRun) console.log('(dry-run — snapshots not written, source-sync-status.json updated)');

  return {
    fetched,
    notFound,
    errors,
    excluded,
    skipped: 0,
    sidebarVerified: sidebarResult.ok,
    sourceSyncStatus,
  };
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
