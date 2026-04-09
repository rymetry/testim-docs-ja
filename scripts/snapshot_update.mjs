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
 * EN-only, registry-aware recovery probe for a known source-side debt page.
 *
 * Checks whether the page is still broken for the **specific reason**
 * recorded in the registry (`exclusionEntry.expectedReason`). This is a
 * narrow / fail-close probe — it does NOT run the full `detectSourceUsability`
 * pipeline and has zero dependency on JA body / segments / parse state.
 *
 * Unsupported `expectedReason` values are treated as excluded-broken with
 * `expectedMatch: false` so that new registry reasons don't silently fall
 * through to recovered.
 *
 * @param {string} rawEnHtml   inner HTML of `#mc-main-content`
 * @param {object} exclusionEntry   registry entry (from `getExclusion`)
 * @returns {{ issueType: string, reason: string, expectedMatch: boolean } | null}
 *          object → still broken, null → recovered
 */
function probeRecoveryEnOnly(rawEnHtml, exclusionEntry, { extractFn = extractSegmentsFromHtml } = {}) {
  // Segment extraction — needed for extractor-empty check.
  // extractFn is injectable for testing the extract-error branch.
  let enSegments = [];
  let extractError = null;
  try {
    enSegments = extractFn(rawEnHtml);
  } catch (e) {
    extractError = e;
  }

  const expType = exclusionEntry.expectedIssueType;
  const expReason = exclusionEntry.expectedReason;

  function broken(reason, match) {
    return { issueType: expType, reason, expectedIssueType: expType, expectedReason: expReason, expectedMatch: match };
  }

  // extractError → fail-close: broken with probe-specific reason
  if (extractError) {
    return broken('extract-error', false);
  }

  const enBodyCount = enSegments.filter((s) => s.segmentKind !== 'heading').length;

  // すべての expectedReason で自動 recovery しない (fail-close)。
  //
  // extractor-empty でも body > 0 になっただけでは usable とは限らない
  // (shallow-snapshot 等の別種 unusable に移行した可能性がある)。
  // EN-only probe で「usable になったか」を安全に判定するには
  // detectSourceUsability 相当の全レイヤーが必要だが、それは JA 依存を
  // 戻すことになる。false recovery を完全に排除するため、probe は
  // 「registry の expected と同じ broken shape か」だけを観測し、
  // 復旧判定は人間に委ねる。
  //
  // expectedMatch の意味:
  //   true  = expected と同じ shape で壊れている (想定どおり)
  //   false = 壊れ方が変わった or 判定できない (registry 更新を検討)
  //
  // excluded-recovered になるのは runRecoveryProbe の fetch-failed 以外では
  // 起きない (= 自動 recovery は無い)。

  if (expReason === 'extractor-empty' && enBodyCount === 0) {
    return broken('extractor-empty', true);
  }

  if (expReason === 'extractor-empty' && enBodyCount > 0) {
    // body が出現したが usable かは不明。false recovery を避けるため
    // broken に倒す。expectedMatch=false で「壊れ方が変わった」と通知。
    return broken('body-appeared-inconclusive', false);
  }

  // その他の reason は EN-only で安全に判定できない。
  return broken('unsupported-recovery-probe', false);
}

/**
 * Run the EN-only recovery probe for a known source-side debt page.
 *
 * `content` is the raw `#mc-main-content` inner HTML from the live page.
 * When fetch failed (`content` is null), returns `excluded-broken` with a
 * synthetic probe so the debt counter is not reset by a network blip.
 *
 * JA body / segments / parse state には一切依存しない。translation-side
 * state と切り離した EN-only の fail-close 判定。
 *
 * @param {{ content: string|null, exclusionEntry: object }} opts
 * @returns {{ fetchStatus: string, recoveryProbe: object|null }}
 */
function runRecoveryProbe({ content, exclusionEntry }) {
  if (!content) {
    return {
      fetchStatus: 'excluded-broken',
      recoveryProbe: {
        issueType: exclusionEntry.expectedIssueType ?? 'snapshot-incomplete',
        reason: 'fetch-failed',
        expectedIssueType: exclusionEntry.expectedIssueType,
        expectedReason: exclusionEntry.expectedReason,
        expectedMatch: false,
      },
    };
  }

  const probe = probeRecoveryEnOnly(content, exclusionEntry);
  if (!probe) {
    return { fetchStatus: 'excluded-recovered', recoveryProbe: null };
  }

  return {
    fetchStatus: 'excluded-broken',
    recoveryProbe: probe,
  };
}

const FETCH_TIMEOUT_MS = 30_000;

/**
 * Extract the main content HTML from a full page.
 * Targets `<div id="mc-main-content" ...>...</div>` (MadCap Flare).
 */
// Exported for unit testing of fail-close branches.
export { probeRecoveryEnOnly as _probeRecoveryEnOnly };

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
        // recovery probe を実行し、結果は excluded-broken / excluded-recovered
        // として pageResults に載せる。404 / HTTP エラーも debt 側に吸収し、
        // 一時的な network 障害で counter が broken にフリップしないようにする。
        const probe = runRecoveryProbe({ content, exclusionEntry: getExclusion(target.slug) });
        const label = probe.fetchStatus === 'excluded-recovered' ? 'RECOV' : 'DEBT ';
        console.log(`  ${label} ${target.slug} — source-side debt (snapshot not written)`);
        excluded += 1;
        pageResults.push({
          slug: target.slug,
          fetchStatus: probe.fetchStatus,
          recoveryProbe: probe.recoveryProbe,
          debtCategory: 'source-side-debt',
        });
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
        // fetch が throw しても excluded 経路は debt にとどめる
        const probe = runRecoveryProbe({ content: null, exclusionEntry: getExclusion(target.slug) });
        console.log(`  DEBT ${target.slug} — source-side debt (fetch failed: ${error.message})`);
        excluded += 1;
        pageResults.push({
          slug: target.slug,
          fetchStatus: probe.fetchStatus,
          recoveryProbe: probe.recoveryProbe,
          debtCategory: 'source-side-debt',
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
