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
  alignSegments,
  buildAdvisoryArtifacts,
  compareSnapshotStructure,
  extractSegmentsFromHtml,
  extractSegmentsFromMarkdown,
  isNonBlockingParityIssue,
  loadSidebarSlugs,
  localCheck,
  parityDiffsToIssues,
  summarizeParityResults,
} from './lib/source_parity.mjs';
import { isValidAcknowledgedIssue } from './lib/source_parity_issue_state.mjs';
export { isValidAcknowledgedIssue };
import {
  computeSnapshotFingerprint,
  validateAcknowledgements,
  tagIssuesWithAcknowledgements,
} from './lib/source_parity_acknowledgements.mjs';
import {
  loadBaselineFile,
  tagIssuesWithBaseline,
} from './lib/source_parity_baseline.mjs';
import { isDirectRun as isDirectCliRun } from './lib/cli.mjs';
import turndown, { preprocessEnHtml } from './lib/turndown.mjs';
import { checkPageCoverage, checkSinglePageSnapshot } from './lib/source_parity_page_coverage.mjs';
import { buildRunScope, validateRunLinkage } from './lib/source_sync_health.mjs';
export { buildRunScope };

const SNAPSHOTS_DIR = path.join(ROOT_DIR, 'snapshots', 'en', 'content');

const SOURCE_SYNC_STATUS_PATH = path.join(ROOT_DIR, 'source-sync-status.json');

const OUTPUT_PATH = path.join(ROOT_DIR, 'parity-check-status.json');

const ACKNOWLEDGEMENTS_PATH = path.join(ROOT_DIR, 'parity-acknowledgements.json');

const BASELINE_PATH = path.join(ROOT_DIR, 'parity-baseline.json');

/**
 * Schema version for `parity-check-status.json`. Bumped whenever the
 * top-level shape changes (added top-level fields like `result`,
 * `schemaVersion`, etc.). Downstream validators MUST treat
 * `schemaVersion !== PARITY_CHECK_STATUS_SCHEMA_VERSION` as
 * non-loadable rather than silently coercing.
 */
export const PARITY_CHECK_STATUS_SCHEMA_VERSION = 1;

function buildSegmentInconclusiveIssue(reason, category, meta = null) {
  // category is the structured enum from alignSegments (`inconclusiveCategory`)
  // — `heading-count-mismatch`, `align-exception`, or `tokenless-near-tie`.
  // Required by parity-baseline.json so segment-inconclusive entries can be
  // identified by category rather than the volatile free-text `reason`.
  const inconclusiveMeta =
    meta && typeof meta === 'object' && !Array.isArray(meta)
      ? { ...meta }
      : null;
  return {
    type: 'segment-inconclusive',
    severity: ISSUE_SEVERITY['segment-inconclusive'],
    inconclusiveCategory: category ?? 'align-exception',
    inconclusiveMeta,
    inconclusiveReason: reason,
    detail: `alignment inconclusive [${category ?? 'align-exception'}]: ${reason}`,
  };
}

export function isNonBlockingIssue(issue) {
  return isNonBlockingParityIssue(issue);
}

/**
 * `checkSourceParity` 一回ぶんの実行 scope を分類する純粋ヘルパー。結果は
 * `parity-check-status.json.summary.runScope` に埋め込まれ、downstream tool
 * が full-repo run か partial (`--slug` / `--section`) run かを判別できる。
 *
 * `.github/scripts/sync-detection-issues.cjs` の partial-run guard が
 * `runScope.isComplete === true` を managed GitHub issue 同期の前提条件と
 * しているため、deep-audit / 手動デバッグ run の artifact が誤って workflow
 * に紛れ込んでも managed issue body を上書きしない契約になっている。
 *
 * 入力:
 *   slug    — slug 解決後の --slug 値 (なければ null)
 *   section — --section 値 (なければ null)
 *
 * 出力:
 *   { type: 'full' | 'slug' | 'section',
 *     isComplete: boolean,
 *     filters: { slug: string|null, section: string|null } }
 *
 * `checkSourceParity` 内で `--slug` が `--section` より優先される (slug が
 * セットされていると section フィルタはスキップされる) ため、両方が指定
 * された防衛的ケースでは `type: 'slug'` を返しつつ section フィルタも
 * 診断用に保持する。
 */
/**
 * parity-check summary を CLI exit code にマップする純粋ヘルパー。
 * `checkSourceParity` から切り出してあり、フルパイプラインを起動せずに
 * gate 挙動を unit test できるようにしている。
 *
 * 入力:
 *   summary  — summarizeParityResults() の出力 (または同じ shape のオブジェクト)
 *   failOn   — 'actionable' | 'any' | null (それ以外の値は 'any' 相当)
 *
 * 0 (gate pass) か 1 (gate fail) を返す。gate は `reportableActive*`
 * counters のみを参照する。coarse audit signal は ack / baseline が
 * 期限切れでも exit code に影響しない。legacy の `activeFiles` /
 * `activeActionableFiles` は downstream 互換のためここでは意図的に無視する。
 *
 * `activeErrorFiles` は全モードで参照する。`source-fetch-error` のような
 * 実 runtime error は reportable issue が 0 件でも gate を fail させる契約。
 */
export function computeExitCode(summary, failOn) {
  if (!summary || typeof summary !== 'object') return 0;
  const errorFiles = summary.activeErrorFiles || 0;
  if (failOn === 'actionable') {
    const reportableActionable = summary.reportableActiveActionableFiles || 0;
    return reportableActionable > 0 || errorFiles > 0 ? 1 : 0;
  }
  // Default and 'any' both look at the broader reportable bucket, but
  // still fail on real runtime errors such as source-fetch-error.
  const reportable = summary.reportableActiveFiles || 0;
  return reportable > 0 || errorFiles > 0 ? 1 : 0;
}

/**
 * parity summary を 3 値 (pass / fail / inconclusive) に畳み込むヘルパー。
 * 結果は `parity-check-status.json.summary.result` に乗り、downstream の
 * fail-closed gate (sync-detection-issues.cjs) が inconclusive run からの
 * issue 同期を拒否できるようにする。counter 全集合を読み返す必要はない。
 *
 *   pass         — no reportable parity issues, no error files, source
 *                  sync is fresh (or freshness state is unknown for
 *                  partial / legacy runs)
 *   fail         — at least one reportable issue or error
 *   inconclusive — source freshness was not "fresh" so the run cannot
 *                  rule out gaps. We never down-grade `inconclusive` to
 *                  `pass` even if all files happen to be clean.
 *
 * `freshnessState` is the value read from
 * `source-sync-status.json.freshnessState`. Pass `null` when the file
 * is missing (legacy runs); the helper treats null as "no freshness
 * info available, do not block".
 */
export function computeParityResult(summary, freshnessState = null) {
  if (!summary || typeof summary !== 'object') return 'inconclusive';
  const reportable = summary.reportableActiveFiles || 0;
  const errors = summary.activeErrorFiles || 0;
  if (freshnessState && freshnessState !== 'fresh') {
    // stale / partial / broken / unknown source — never call this a pass.
    // We still report fail when there ARE reportable issues so the gate
    // does not lose its signal, but a clean run is degraded to
    // inconclusive instead of pass.
    if (reportable > 0 || errors > 0) return 'fail';
    return 'inconclusive';
  }
  if (reportable > 0 || errors > 0) return 'fail';
  return 'pass';
}

export function getConsoleCoverageState(issues) {
  if (!Array.isArray(issues) || issues.length === 0) {
    return {
      allAcked: false,
      allCovered: false,
      icon: '❌',
      suffix: '',
    };
  }

  const allAcked = issues.every((issue) => isValidAcknowledgedIssue(issue));
  const allCovered = issues.every((issue) => isNonBlockingIssue(issue));

  return {
    allAcked,
    allCovered,
    icon: allCovered ? '⏸️' : '❌',
    suffix: allAcked
      ? ' (all acknowledged)'
      : allCovered
        ? ' (covered by baseline/ack)'
        : '',
  };
}

/**
 * Load source-sync-status.json. Returns the parsed payload or null if
 * the file doesn't exist / is invalid. Used both for freshness state
 * (legacy callers) and for §3 run linkage validation (which needs the
 * full payload, not just freshnessState).
 */
function loadSourceSyncPayload() {
  if (!fs.existsSync(SOURCE_SYNC_STATUS_PATH)) return null;
  try {
    return JSON.parse(fs.readFileSync(SOURCE_SYNC_STATUS_PATH, 'utf8'));
  } catch {
    return null;
  }
}

const SNAPSHOT_DIFF_STATUS_PATH = path.join(ROOT_DIR, 'snapshot-diff-status.json');

/**
 * Load snapshot-diff-status.json for §3 run linkage validation. Returns
 * the parsed payload or null if missing. The parity gate does NOT
 * require this file to exist (PR CI runs parity without first running
 * snapshot_diff); when it is missing the linkage validator returns
 * "missing" and the result stays at whatever computeParityResult
 * decides from the freshness state alone.
 */
function loadSnapshotDiffPayload() {
  if (!fs.existsSync(SNAPSHOT_DIFF_STATUS_PATH)) return null;
  try {
    return JSON.parse(fs.readFileSync(SNAPSHOT_DIFF_STATUS_PATH, 'utf8'));
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
    includeAdvisory: argv.includes('--include-advisory'),
    // 降格された coarse audit signals を CLI 詳細表示する opt-in flag。
    // --include-advisory と同じく表示専用で gate exit code には影響しない。
    includeAuditSignals: argv.includes('--include-audit-signals'),
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

/**
 * parity-baseline.json をロードし validation を通す。
 * Returns { schemaVersion, entries } or empty structure if file missing.
 */
function loadBaselineFileSafe(filePath = BASELINE_PATH) {
  if (!fs.existsSync(filePath)) {
    return { schemaVersion: 1, entries: [] };
  }
  return loadBaselineFile(filePath);
}

export async function checkSourceParity({
  json = false,
  includeAdvisory = false,
  includeAuditSignals = false,
  section = null,
  failOn = null,
  slug = null,
} = {}) {
  const sidebarText = fs.existsSync(SIDEBAR_PATH) ? fs.readFileSync(SIDEBAR_PATH, 'utf8') : '';
  const sidebarSlugs = loadSidebarSlugs(sidebarText);
  const sourceSyncPayload = loadSourceSyncPayload();
  const freshnessState = sourceSyncPayload?.freshnessState ?? null;
  const snapshotDiffPayload = loadSnapshotDiffPayload();
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

  // frozen baseline をロード。acknowledgement とは別ファイル / 別意味で管理する。
  let baselineData = { schemaVersion: 1, entries: [] };
  try {
    baselineData = loadBaselineFileSafe();
  } catch (error) {
    console.error(`❌ ${error.message}`);
    return 1;
  }
  const baselineInvalidatedSlugs = new Set();

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
    if (includeAdvisory) console.log('📝 tokenless-near-tie review queue 表示: ON');
    if (includeAuditSignals) console.log('🔍 audit signals 表示: ON');
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
    let issues = [...localCheck({ body: doc.body })];

    // Per-file page coverage checks (--slug mode only; global mode uses
    // page coverage gate after the per-file loop). Mirrors the bulk
    // checkLocalPageOrphan / checkSinglePageSnapshot semantics so a
    // single-page run can still surface coverage gaps.
    if (resolvedSlug) {
      if (sidebarSlugs && sidebarSlugs.size > 0 && !sidebarSlugs.has(fileSlug)) {
        issues.push({
          type: 'local-page-orphan',
          severity: ISSUE_SEVERITY['local-page-orphan'],
          detail: `ローカルファイルが SIDEBAR_URLS.md に未掲載: ${fileSlug}`,
        });
      }
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
        // segment-level exact diff をまず実行する。inconclusive (heading count
        // mismatch / 必要な入力が無い) のときは legacy coarse signals に
        // フォールバックし、ページが silent green になることを防ぐ。
        // alignment が conclusive のときも coarse complementary check
        // (image order, callout nesting, table shape) を併走させる。これらは
        // segment engine が意図的に無視する欠陥 (画像順序の入れ替え等) を
        // 補完的に拾う。
        let segmentIssues = [];
        let alignmentInconclusive = false;
        let alignmentInconclusiveReason = null;
        let alignmentInconclusiveCategory = null;
        let alignmentInconclusiveMeta = null;
        try {
          const enSegments = extractSegmentsFromHtml(rawEnHtml);
          const jaSegments = extractSegmentsFromMarkdown(doc.body);
          const alignment = alignSegments(enSegments, jaSegments);
          segmentIssues = parityDiffsToIssues(alignment.diffs);
          if (alignment.inconclusive) {
            alignmentInconclusive = true;
            alignmentInconclusiveReason = alignment.inconclusiveReason;
            alignmentInconclusiveCategory = alignment.inconclusiveCategory;
            alignmentInconclusiveMeta = alignment.inconclusiveMeta ?? null;
          }
        } catch (e) {
          alignmentInconclusive = true;
          alignmentInconclusiveReason = e.message;
          alignmentInconclusiveCategory = 'align-exception';
          alignmentInconclusiveMeta = null;
          console.error(
            `alignSegments failed for ${fileSlug}: ${e.message}. Falling back to coarse parity.`,
          );
        }

        if (alignmentInconclusive) {
          // Fallback: alignment 済みの exact diff を保持し、inconclusive を
          // 示す補助 issue を追加した上で legacy coarse 比較を併走させる。
          // ページが silent green になることを防ぐ。
          issues.push(...segmentIssues);
          issues.push(
            buildSegmentInconclusiveIssue(
              alignmentInconclusiveReason || 'unknown reason',
              alignmentInconclusiveCategory,
              alignmentInconclusiveMeta,
            ),
          );
          issues.push(...compareSnapshotStructure(enBody, doc.body));
        } else {
          // Primary gate: segment-level diffs に加え、補完的な coarse
          // signals (image order, callout nesting, table shape) も併走させる。
          // count-based mismatches は COARSE_SIGNAL_TYPES allowlist 経由で
          // audit-only に降格済みで、`signal` severity では出るが
          // parityRegression / gate exit code には乗らない。
          issues.push(...segmentIssues);
          issues.push(...compareSnapshotStructure(enBody, doc.body));
        }
      }
    }

    issues = tagIssuesWithAcknowledgements(
      fileSlug,
      issues,
      ackData.entries,
      snapshotFingerprint,
      today,
    );

    // baseline タグ付け。frozen (非 expired) baseline entries は
    // isFrozenByBaseline / isReportableParityIssue で gate から除外される
    // (scripts/lib/source_parity_issue_state.mjs を参照)。期限切れ baseline
    // entries は gate に refire する。
    {
      const baselineResult = tagIssuesWithBaseline(
        fileSlug,
        issues,
        baselineData.entries,
        snapshotFingerprint,
        today,
      );
      issues = baselineResult.tagged;
      if (baselineResult.invalidated) {
        baselineInvalidatedSlugs.add(fileSlug);
      }
    }

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
      const { icon, suffix } = getConsoleCoverageState(issues);
      console.log(`${icon} ${doc.relativePath}${suffix}`);
      for (const issue of issues) {
        const location = issue.line ? `:${issue.line}` : '';
        const detail = issue.detail || issue.text || '';
        const artifactNote = issue.artifacts?.length
          ? ` [${issue.artifacts.join('; ')}]`
          : '';
        const tags = [];
        if (issue.acknowledged && !issue.ackExpired) tags.push('⏸');
        if (issue.acknowledged && issue.ackExpired) tags.push('⚠expired');
        if (issue.baselined && issue.baselineExpired) tags.push('🧊expired-baseline');
        else if (issue.baselined) tags.push('🧊baseline');
        const issueTag = tags.length > 0 ? ` ${tags.join(' ')}` : '';
        console.log(
          `   [${issue.type}/${issue.severity}]${location}${issueTag} ${detail}${artifactNote}`,
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
        if (issue.baselined) {
          const baselineState = issue.baselineExpired ? 'expired' : 'active';
          console.log(
            `     ↳ baseline: ${baselineState} (review: ${issue.baselineReviewAfter ?? 'n/a'})`,
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

  const {
    advisoryQueueScope,
    advisoryQueue,
    advisoryQueueSummary,
    advisoryQueueError,
  } = buildAdvisoryArtifacts({
    results,
    totalFiles: allFiles.length,
    checkedFiles: checkedCount,
    slug: resolvedSlug,
    section,
  });
  if (advisoryQueueError) {
    console.error(`⚠ tokenless-near-tie review queue 構築失敗: ${advisoryQueueError}`);
  }
  // run linkage validation: source-sync-status / snapshot-diff-status と
  // parity gate 自身の run scope の整合を検証する。結果は computeParityResult
  // に折り込まれ、"linked" 以外の状態では clean run でも pass→inconclusive へ
  // 降格する (stale run を silent pass にしない)。
  const parityRunScope = buildRunScope({ slug: resolvedSlug, section });
  const linkageState = validateRunLinkage(
    sourceSyncPayload,
    snapshotDiffPayload,
    parityRunScope,
  );
  // PR CI runs parity without first running snapshot_diff and without
  // a source-sync payload. Treat that as the legacy "no linkage info"
  // case (linkage='missing') and don't downgrade the result. Live runs
  // (which have a source-sync payload) MUST link cleanly.
  const linkageBlocking = sourceSyncPayload != null && linkageState !== 'linked';
  const effectiveFreshnessState = linkageState === 'stale'
    ? 'stale'
    : freshnessState;

  const summaryBase = {
    checkedAt: new Date().toISOString(),
    mode: 'local',
    totalFiles: allFiles.length,
    checkedFiles: checkedCount,
    ...summarizeParityResults(results),
    ...advisoryQueueSummary,
    baselineInvalidatedSlugs: [...baselineInvalidatedSlugs].sort(),
    // run scope を summary に出力。downstream の sync tooling は partial run
    // での managed issue 上書きを refuse する (buildRunScope() を参照)。
    runScope: parityRunScope,
    // source freshness を summary に複写。validators は
    // source-sync-status.json を再読する必要がなくなる。
    freshnessState: effectiveFreshnessState ?? null,
    // linkage state と snapshot_diff runId (なければ null)。
    // detection_reports / sync guards から参照される。
    linkageState,
    snapshotDiffRunId: snapshotDiffPayload?.runId ?? null,
    sourceSyncRunId: sourceSyncPayload?.runId ?? null,
    sourceInventoryFingerprint: sourceSyncPayload?.sourceInventoryFingerprint ?? null,
  };
  // computeParityResult depends on the full counter set, so it has to
  // run after summarizeParityResults has been spread into summaryBase.
  // The linkage check is layered on top: if the linkage is broken
  // (stale / scope-mismatch), we degrade pass→inconclusive but keep
  // fail as fail (so a real regression still surfaces).
  const baseResult = computeParityResult(summaryBase, effectiveFreshnessState);
  const summary = {
    ...summaryBase,
    result: linkageBlocking && baseResult === 'pass' ? 'inconclusive' : baseResult,
  };

  const payload = {
    schemaVersion: PARITY_CHECK_STATUS_SCHEMA_VERSION,
    summary,
    files: results,
    advisoryQueueScope,
    advisoryQueue,
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(payload, null, 2));

  if (!json) {
    console.log(`${'='.repeat(60)}\n📊 チェック結果サマリー\n`);
    console.log(`チェック済み: ${checkedCount} / ${allFiles.length} ファイル`);
    const coveredFiles = summary.filesWithIssues - summary.activeFiles;
    console.log(
      `問題あり: ${summary.filesWithIssues} ファイル (active: ${summary.activeFiles}, ` +
        `covered by baseline/ack: ${coveredFiles})`,
    );
    console.log(`actionable: ${summary.actionableFiles} ファイル (active: ${summary.activeActionableFiles})`);
    console.log(`signal-only: ${summary.signalFiles} ファイル`);
    console.log(`errors: ${summary.errorFiles} ファイル`);
    if (summary.acknowledgedIssues > 0) {
      console.log(`acknowledged: ${summary.acknowledgedIssues} 件`);
    }
    if (summary.expiredAcknowledgements > 0) {
      console.log(`expired acknowledgements: ${summary.expiredAcknowledgements} 件`);
    }
    if (summary.expiredBaselineEntries > 0) {
      console.log(`expired baseline entries: ${summary.expiredBaselineEntries} 件`);
    }
    if (summary.expiringBaselineEntries30d > 0) {
      console.log(
        `expiring baseline entries (≤30 日): ${summary.expiringBaselineEntries30d} 件`,
      );
    }
    console.log('\n問題種別:');
    for (const [type, count] of Object.entries(summary.issuesByType)) {
      console.log(`  ${type}: ${count} 件`);
    }
    if ((summary.baselinedIssues || 0) > 0) {
      console.log(
        `\n[frozen baseline] 凍結 drift (gate から除外): ${summary.baselinedIssues} 件 / ${summary.baselinedFiles} ファイル`,
      );
      for (const [type, count] of Object.entries(summary.baselinedByType ?? {})) {
        console.log(`  ${type}: ${count} 件`);
      }
      const incCats = summary.baselinedByInconclusiveCategory ?? {};
      if (Object.keys(incCats).length > 0) {
        console.log('  inconclusiveCategory 別:');
        for (const [cat, count] of Object.entries(incCats)) {
          console.log(`    ${cat}: ${count} 件`);
        }
      }
    }
    if (summary.baselineInvalidatedSlugs && summary.baselineInvalidatedSlugs.length > 0) {
      console.log(
        `\n[frozen baseline] invalidated slugs (snapshot 変更で baseline 失効): ${summary.baselineInvalidatedSlugs.length}`,
      );
      for (const slug of summary.baselineInvalidatedSlugs) {
        console.log(`  ${slug}`);
      }
    }
    // 降格された audit signals は --include-audit-signals なしでも常に
    // 1 行 summary を出して可視化を保つ。--include-audit-signals は
    // type 別内訳の表示だけを切り替え、デフォルトの CLI 出力を簡潔に保つ。
    if ((summary.auditSignalIssues || 0) > 0 || includeAuditSignals) {
      console.log(
        `\n[audit signals] coarse heuristics (gate から除外): ${summary.auditSignalIssues || 0} 件 / ${summary.auditSignalFiles || 0} ファイル`,
      );
      console.log(
        '  parity-regression issue body には載せません。deep-audit workflow と --include-audit-signals でのみ詳細を確認できます',
      );
      if (includeAuditSignals) {
        const byType = summary.auditSignalsByType ?? {};
        const sortedTypes = Object.keys(byType).sort();
        if (sortedTypes.length === 0) {
          console.log('  (no coarse signals in this run)');
        } else {
          for (const type of sortedTypes) {
            console.log(`    ${type}: ${byType[type]} 件`);
          }
        }
      }
    }
    if (includeAdvisory) {
      const scopeLabel = advisoryQueueScope.isComplete
        ? 'full-repo queue'
        : advisoryQueueScope.type === 'slug'
          ? `partial scope: slug=${advisoryQueueScope.filters.slug}`
          : `partial scope: section=${advisoryQueueScope.filters.section}`;
      console.log(
        `\n[review queue] tokenless-near-tie: ${summary.advisoryQueueIssues} 件 / ${summary.advisoryQueueFiles} ファイル (${scopeLabel})`,
      );
      console.log('  derived from existing segment-inconclusive issues only; no detector, no gate impact');
      if (advisoryQueueError) {
        console.log(`  queue unavailable: ${advisoryQueueError}`);
      }
      if (!advisoryQueueScope.isComplete) {
        console.log('  partial queue only; use a full-repo run before workflow automation or queue-wide triage');
      }
      for (const entry of advisoryQueue) {
        const state = entry.blocking ? 'blocking review' : 'baselined review';
        console.log(`  ${entry.slug ?? entry.file} (${state})`);
        for (const issue of entry.issues) {
          const review = issue.baselineReviewAfter ? ` review=${issue.baselineReviewAfter}` : '';
          const expired = issue.baselineExpired ? ' expired-baseline' : '';
          const pair =
            issue.leftSectionPath && issue.rightSectionPath
              ? ` pair="${issue.leftSectionPath}" <-> "${issue.rightSectionPath}"`
              : '';
          console.log(`    - ${issue.detail}${review}${expired}${pair}`);
        }
      }
    }
    console.log(`\n💾 詳細結果を ${path.relative(ROOT_DIR, OUTPUT_PATH)} に保存しました`);
  }

  // gate exit code は reportableActive* counters のみ参照する。coarse
  // audit signals (paragraph/bullet/step/section count, heading,
  // table-shape, table-cell-* heuristics) は ack / baseline が期限切れでも
  // build を fail させない。legacy の `activeFiles` / `activeActionableFiles`
  // は downstream 互換のため意味を保ったまま summary に残しているが、
  // ここでは参照しない。
  return computeExitCode(summary, failOn);
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
