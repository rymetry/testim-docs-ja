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
import { isDirectRun as isDirectCliRun } from './lib/cli.mjs';
import turndown, { preprocessEnHtml } from './lib/turndown.mjs';
import { extractSlugsFromSnapshot } from './lib/madcap_toc.mjs';
import { checkPageCoverage } from './lib/source_parity_page_coverage.mjs';

const SNAPSHOTS_DIR = path.join(ROOT_DIR, 'snapshots', 'en', 'content');

const SIDEBAR_SNAPSHOT_PATH = path.join(ROOT_DIR, 'snapshots', 'en', 'sidebar.json');
const SOURCE_SYNC_STATUS_PATH = path.join(ROOT_DIR, 'source-sync-status.json');

const OUTPUT_PATH = path.join(ROOT_DIR, 'parity-check-status.json');

const ALLOWLIST_PATH = path.join(ROOT_DIR, 'parity-allowlist.json');

// Signal-only issue types that can be suppressed by the allowlist
const ALLOWABLE_SEVERITIES = new Set(['signal']);

/**
 * Load sidebar slugs from EN sidebar snapshot (JSON), falling back to
 * SIDEBAR_URLS.md text-based extraction.
 */
function loadSidebarSlugsWithSnapshot(sidebarText) {
  if (fs.existsSync(SIDEBAR_SNAPSHOT_PATH)) {
    try {
      const snapshot = JSON.parse(fs.readFileSync(SIDEBAR_SNAPSHOT_PATH, 'utf8'));
      const slugs = extractSlugsFromSnapshot(snapshot);
      if (slugs.size > 0) return slugs;
    } catch {
      // Fall through to text-based extraction
    }
  }
  return loadSidebarSlugs(sidebarText);
}

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
 * Load and validate allowlist from parity-allowlist.json.
 * Returns the parsed object (slug → array of rules).
 * Throws if any rule targets a non-signal issue type.
 */
export function loadAllowlist(filePath = ALLOWLIST_PATH) {
  if (!fs.existsSync(filePath)) return {};
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  for (const [slug, rules] of Object.entries(raw)) {
    for (const rule of rules) {
      const severity = ISSUE_SEVERITY[rule.type];
      if (!severity) {
        throw new Error(
          `Allowlist error: "${slug}" rule targets unknown issue type "${rule.type}".`
        );
      }
      if (!ALLOWABLE_SEVERITIES.has(severity)) {
        throw new Error(
          `Allowlist error: "${slug}" rule targets "${rule.type}" (severity: ${severity}). Only signal-severity issues can be suppressed.`
        );
      }
      if (!rule.detailIncludes && !rule.detailRegex) {
        throw new Error(
          `Allowlist error: "${slug}" rule for "${rule.type}" must specify detailIncludes or detailRegex. Slug + type only suppression is not allowed.`
        );
      }
      if (rule.detailRegex) {
        try {
          new RegExp(rule.detailRegex);
        } catch {
          throw new Error(
            `Allowlist error: "${slug}" rule for "${rule.type}" has invalid detailRegex: "${rule.detailRegex}".`
          );
        }
      }
    }
  }

  return raw;
}

/**
 * Check if an issue matches an allowlist rule.
 */
export function isAllowlisted(slug, issue, allowlist) {
  const rules = allowlist[slug];
  if (!rules) return false;

  const severity = issue.severity || ISSUE_SEVERITY[issue.type];
  if (!ALLOWABLE_SEVERITIES.has(severity)) return false;

  return rules.some((rule) => {
    if (rule.type !== issue.type) return false;
    // Require at least detailIncludes or detailRegex — slug + type only is too coarse
    if (!rule.detailIncludes && !rule.detailRegex) return false;
    const detail = issue.detail || issue.text || '';
    if (rule.detailIncludes && !detail.includes(rule.detailIncludes)) return false;
    if (rule.detailRegex && !new RegExp(rule.detailRegex).test(detail)) return false;
    return true;
  });
}

/**
 * Filter issues through the allowlist, removing matched signal issues.
 */
export function applyAllowlist(slug, issues, allowlist) {
  if (!allowlist || Object.keys(allowlist).length === 0) return issues;
  return issues.filter((issue) => !isAllowlisted(slug, issue, allowlist));
}

export async function checkSourceParity({
  json = false,
  section = null,
  failOn = null,
  slug = null,
} = {}) {
  const sidebarText = fs.existsSync(SIDEBAR_PATH) ? fs.readFileSync(SIDEBAR_PATH, 'utf8') : '';
  const sidebarSlugs = loadSidebarSlugsWithSnapshot(sidebarText);
  const freshnessState = loadFreshnessState();
  const snapshotSlugs = collectSnapshotSlugs(SNAPSHOTS_DIR);
  const allFiles = findMdFiles(DOCS_DIR);

  let allowlist = {};
  try {
    allowlist = loadAllowlist();
  } catch (error) {
    console.error(`❌ ${error.message}`);
    return 1;
  }

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

    // Snapshot structure comparison (image order, callout nesting, step counts)
    // EN snapshots are stored as HTML; convert to Markdown for structural comparison.
    const snapshotPath = path.join(SNAPSHOTS_DIR, fileSlug + '.html');
    if (fs.existsSync(snapshotPath)) {
      const rawEnHtml = fs.readFileSync(snapshotPath, 'utf8');
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

    // Apply allowlist filtering
    issues = applyAllowlist(fileSlug, issues, allowlist);

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
      console.log(`❌ ${doc.relativePath}`);
      for (const issue of issues) {
        const location = issue.line ? `:${issue.line}` : '';
        const detail = issue.detail || issue.text || '';
        const artifactNote = issue.artifacts?.length ? ` [${issue.artifacts.join('; ')}]` : '';
        console.log(`   [${issue.type}/${issue.severity}]${location} ${detail}${artifactNote}`);
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
    console.log(`問題あり: ${summary.filesWithIssues} ファイル`);
    console.log(`actionable: ${summary.actionableFiles} ファイル`);
    console.log(`signal-only: ${summary.signalFiles} ファイル`);
    console.log(`errors: ${summary.errorFiles} ファイル\n`);
    console.log('問題種別:');
    for (const [type, count] of Object.entries(summary.issuesByType)) {
      console.log(`  ${type}: ${count} 件`);
    }
    console.log(`\n💾 詳細結果を ${path.relative(ROOT_DIR, OUTPUT_PATH)} に保存しました`);
  }

  // Exit code logic based on --fail-on flag
  if (failOn === 'actionable') {
    const hasActionableOrError =
      (summary.actionableFiles || 0) > 0 || (summary.errorFiles || 0) > 0;
    return hasActionableOrError ? 1 : 0;
  }
  if (failOn === 'any') {
    return summary.filesWithIssues > 0 ? 1 : 0;
  }

  // Default: exit 1 if any issues found
  return summary.filesWithIssues > 0 ? 1 : 0;
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
