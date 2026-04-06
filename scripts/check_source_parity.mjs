#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

import {
  DOCS_DIR,
  ROOT_DIR,
  SIDEBAR_PATH,
  filePathToSlug,
  findMdFiles,
  matchesSectionFilter,
  readDocFile,
  resolveSlug,
} from './lib/project.mjs';
import {
  ISSUE_SEVERITY,
  compareSnapshotStructure,
  loadSidebarSlugs,
  localCheck,
  summarizeParityResults,
} from './lib/source_parity.mjs';
import {
  computeSnapshotFingerprint,
  validateAcknowledgements,
  tagIssuesWithAcknowledgements,
} from './lib/source_parity_acknowledgements.mjs';
import { isDirectRun as isDirectCliRun } from './lib/cli.mjs';
import turndown, { preprocessEnHtml } from './lib/turndown.mjs';
import { checkPageCoverage, checkSinglePageSnapshot } from './lib/source_parity_page_coverage.mjs';

const SNAPSHOTS_DIR = path.join(ROOT_DIR, 'snapshots', 'en', 'content');

const SOURCE_SYNC_STATUS_PATH = path.join(ROOT_DIR, 'source-sync-status.json');

const OUTPUT_PATH = path.join(ROOT_DIR, 'parity-check-status.json');

const ACKNOWLEDGEMENTS_PATH = path.join(ROOT_DIR, 'parity-acknowledgements.json');

/**
 * Load freshness state from source-sync-status.json.
 * Returns null if file doesn't exist or is invalid.
 */
function loadFreshnessState() {
  if (!fs.existsSync(SOURCE_SYNC_STATUS_PATH)) return null;
  try {
    const data = JSON.parse(fs.readFileSync(SOURCE_SYNC_STATUS_PATH, 'utf8'));
    return data.freshnessState ?? null;
  } catch {
    return null;
  }
}

/**
 * Collect slugs that have existing EN snapshot HTML files.
 */
export function collectSnapshotSlugs(snapshotsDir) {
  const slugs = new Set();
  if (!fs.existsSync(snapshotsDir)) return slugs;
  const walk = (dir, prefix) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        walk(path.join(dir, entry.name), prefix ? `${prefix}/${entry.name}` : entry.name);
      } else if (entry.name.endsWith('.html')) {
        const slug = prefix
          ? `${prefix}/${entry.name.replace(/\.html$/, '')}`
          : entry.name.replace(/\.html$/, '');
        slugs.add(slug);
      }
    }
  };
  walk(snapshotsDir, '');
  return slugs;
}

export function parseArgs(argv = process.argv.slice(2)) {
  const sectionArg = argv.find((arg) => arg.startsWith('--section='));
  const failOnArg = argv.find((arg) => arg.startsWith('--fail-on='));
  const slugArg = argv.find((arg) => arg.startsWith('--slug='));
  return {
    json: argv.includes('--json'),
    section: sectionArg ? sectionArg.split('=').slice(1).join('=') : null,
    failOn: failOnArg ? failOnArg.split('=').slice(1).join('=') : null,
    slug: slugArg ? slugArg.split('=').slice(1).join('=') : null,
  };
}

/**
 * Load and validate acknowledgements from parity-acknowledgements.json.
 * Returns { schemaVersion, entries } or empty structure if file missing.
 */
function loadAcknowledgementsFile(filePath = ACKNOWLEDGEMENTS_PATH) {
  if (!fs.existsSync(filePath)) return { schemaVersion: 1, entries: [] };
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return validateAcknowledgements(raw);
}

export async function checkSourceParity({
  json = false,
  section = null,
  failOn = null,
  slug = null,
} = {}) {
  const sidebarText = fs.existsSync(SIDEBAR_PATH) ? fs.readFileSync(SIDEBAR_PATH, 'utf8') : '';
  const sidebarSlugs = loadSidebarSlugs(sidebarText);
  const freshnessState = loadFreshnessState();
  const snapshotSlugs = collectSnapshotSlugs(SNAPSHOTS_DIR);
  const allFiles = findMdFiles(DOCS_DIR);

  let ackData = { schemaVersion: 1, entries: [] };
  try {
    ackData = loadAcknowledgementsFile();
  } catch (error) {
    console.error(`❌ ${error.message}`);
    return 1;
  }
  // Ack expiry uses UTC "today" intentionally so CI runs are timezone-independent
  // and match reviewAfter values (also stored as plain YYYY-MM-DD / UTC dates).
  const today = new Date().toISOString().slice(0, 10);

  // Resolve --slug to path-based slug (supports both basename and path-based input)
  const resolvedSlug = slug ? resolveSlug(slug) : null;
  if (slug && !resolvedSlug) {
    console.error(`❌ Unknown slug: "${slug}". No matching document found.`);
    return 1;
  }

  if (!json) {
    console.log('🔍 Source parity チェック開始\n');
    console.log(`📄 ${allFiles.length} ファイル対象`);
    if (resolvedSlug) console.log(`🔎 スラグ絞り込み: ${resolvedSlug}`);
    if (section) console.log(`📂 セクション絞り込み: ${section}`);
    if (failOn) console.log(`🚦 --fail-on=${failOn}`);
    console.log('');
  }

  const results = [];
  let checkedCount = 0;

  for (const filePath of allFiles) {
    const fileSlug = filePathToSlug(filePath);
    if (resolvedSlug && fileSlug !== resolvedSlug) {
      continue;
    }
    const doc = readDocFile(filePath);
    if (!resolvedSlug && !matchesSectionFilter(doc.relativePath, doc.data, section)) {
      continue;
    }

    checkedCount += 1;
    let issues = [...localCheck({ body: doc.body, sidebarSlugs, slug: fileSlug })];

    // Per-file snapshot-missing check (--slug mode only; global mode uses page coverage gate)
    if (resolvedSlug) {
      issues.push(
        ...checkSinglePageSnapshot(fileSlug, doc.data.sourceUrl || '', snapshotSlugs, freshnessState),
      );
    }

    // Snapshot structure comparison (image order, callout nesting, step counts)
    // EN snapshots are stored as HTML; convert to Markdown for structural comparison.
    const snapshotPath = path.join(SNAPSHOTS_DIR, fileSlug + '.html');
    let snapshotFingerprint = null;

    if (fs.existsSync(snapshotPath)) {
      const rawEnHtml = fs.readFileSync(snapshotPath, 'utf8');
      snapshotFingerprint = computeSnapshotFingerprint(rawEnHtml);

      let enBody;
      let enHtml;
      try {
        enHtml = preprocessEnHtml(rawEnHtml);
      } catch (e) {
        console.error(
          `preprocessEnHtml failed for ${fileSlug}: ${e.message}. Skipping snapshot comparison.`
        );
        issues.push({
          type: 'source-fetch-error',
          detail: `HTML前処理失敗: ${e.message}`,
          severity: ISSUE_SEVERITY['source-fetch-error'],
        });
      }
      if (enHtml != null) {
        try {
          enBody = turndown.turndown(enHtml);
        } catch (e) {
          console.error(
            `turndown failed for ${fileSlug}: ${e.message}. Skipping snapshot comparison.`
          );
          issues.push({
            type: 'source-fetch-error',
            detail: `HTML→Markdown 変換失敗: ${e.message}`,
            severity: ISSUE_SEVERITY['source-fetch-error'],
          });
        }
      }
      if (enBody) {
        issues.push(...compareSnapshotStructure(enBody, doc.body));
      }
    }

    // Tag with acknowledgements (replaces applyAllowlist)
    issues = tagIssuesWithAcknowledgements(
      fileSlug,
      issues,
      ackData.entries,
      snapshotFingerprint,
      today,
    );

    if (issues.length === 0) {
      continue;
    }

    results.push({
      file: doc.relativePath,
      sourceUrl: doc.data.sourceUrl || '',
      category: doc.data.category || '',
      issues,
    });

    if (!json) {
      const allAcked = issues.every(
        (i) => i.acknowledged === true && i.ackExpired !== true,
      );
      const icon = allAcked ? '⏸️' : '❌';
      const suffix = allAcked ? ' (all acknowledged)' : '';
      console.log(`${icon} ${doc.relativePath}${suffix}`);
      for (const issue of issues) {
        const location = issue.line ? `:${issue.line}` : '';
        const detail = issue.detail || issue.text || '';
        const artifactNote = issue.artifacts?.length
          ? ` [${issue.artifacts.join('; ')}]`
          : '';
        const ackTag =
          issue.acknowledged && !issue.ackExpired
            ? ' ⏸'
            : issue.acknowledged && issue.ackExpired
              ? ' ⚠expired'
              : '';
        console.log(
          `   [${issue.type}/${issue.severity}]${location}${ackTag} ${detail}${artifactNote}`,
        );
        if (issue.acknowledged && !issue.ackExpired) {
          console.log(
            `     ↳ acknowledged: ${issue.ackReason} (owner: ${issue.ackOwner}, review: ${issue.ackReviewAfter})`,
          );
        }
        if (issue.acknowledged && issue.ackExpired) {
          console.log(
            `     ↳ expired: ${issue.ackExpiryReason} (owner: ${issue.ackOwner})`,
          );
        }
      }
      console.log('');
    }
  }

  // Page coverage gate: global checks (skip in --slug mode)
  if (!resolvedSlug) {
    const localSlugs = new Set(allFiles.map((f) => filePathToSlug(f)));
    const localSourceUrls = new Map();
    for (const filePath of allFiles) {
      const doc = readDocFile(filePath);
      if (doc.data.sourceUrl) {
        localSourceUrls.set(filePathToSlug(filePath), doc.data.sourceUrl);
      }
    }

    const coverageIssues = checkPageCoverage({
      sidebarSlugs,
      localSlugs,
      localSourceUrls,
      snapshotSlugs,
      freshnessState,
    });

    if (coverageIssues.length > 0) {
      results.push({
        file: '_page-coverage-gate',
        sourceUrl: '',
        category: '',
        issues: coverageIssues,
      });
    }
  }

  const summary = {
    checkedAt: new Date().toISOString(),
    mode: 'local',
    totalFiles: allFiles.length,
    checkedFiles: checkedCount,
    ...summarizeParityResults(results),
  };

  const payload = {
    summary,
    files: results,
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(payload, null, 2));

  if (!json) {
    console.log(`${'='.repeat(60)}\n📊 チェック結果サマリー\n`);
    console.log(`チェック済み: ${checkedCount} / ${allFiles.length} ファイル`);
    const ackedFiles = summary.filesWithIssues - summary.activeFiles;
    console.log(`問題あり: ${summary.filesWithIssues} ファイル (active: ${summary.activeFiles}, acknowledged-only: ${ackedFiles})`);
    console.log(`actionable: ${summary.actionableFiles} ファイル (active: ${summary.activeActionableFiles})`);
    console.log(`signal-only: ${summary.signalFiles} ファイル`);
    console.log(`errors: ${summary.errorFiles} ファイル`);
    if (summary.acknowledgedIssues > 0) {
      console.log(`acknowledged: ${summary.acknowledgedIssues} 件`);
    }
    if (summary.expiredAcknowledgements > 0) {
      console.log(`expired acknowledgements: ${summary.expiredAcknowledgements} 件`);
    }
    console.log('\n問題種別:');
    for (const [type, count] of Object.entries(summary.issuesByType)) {
      console.log(`  ${type}: ${count} 件`);
    }
    console.log(`\n💾 詳細結果を ${path.relative(ROOT_DIR, OUTPUT_PATH)} に保存しました`);
  }

  // Exit code: fail only on active (non-acknowledged) issues
  if (failOn === 'actionable') {
    const hasActiveActionableOrError =
      (summary.activeActionableFiles || 0) > 0 || (summary.activeErrorFiles || 0) > 0;
    return hasActiveActionableOrError ? 1 : 0;
  }
  if (failOn === 'any') {
    return (summary.activeFiles || 0) > 0 ? 1 : 0;
  }
  return (summary.activeFiles || 0) > 0 ? 1 : 0;
}

async function main() {
  const code = await checkSourceParity(parseArgs());
  process.exit(code);
}

const isDirectRun = isDirectCliRun(import.meta.url);

if (isDirectRun) {
  main().catch((error) => {
    console.error('❌ エラー:', error);
    process.exit(1);
  });
}
