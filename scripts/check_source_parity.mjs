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
  detectSourceUsability,
  extractSegmentsFromHtml,
  extractSegmentsFromMarkdown,
  formatSourceUnusableSection,
  isNonBlockingParityIssue,
  loadSidebarSlugs,
  localCheck,
  parityDiffsToIssues,
  summarizeParityResults,
} from './lib/source_parity.mjs';
import { CALLOUT_NORMALIZATION_SLUGS } from './lib/source_parity_segments_en.mjs';
import {
  isAdvisoryOnlyParityIssue,
  isValidAcknowledgedIssue,
} from './lib/source_parity_issue_state.mjs';
export { isValidAcknowledgedIssue };
import {
  computeSnapshotFingerprint,
  validateAcknowledgements,
  tagIssuesWithAcknowledgements,
} from './lib/source_parity_acknowledgements.mjs';
import {
  loadBaselineFile,
  tagIssuesWithBaseline,
  computeOrphanBaselineEntries,
} from './lib/source_parity_baseline.mjs';
import { isDirectRun as isDirectCliRun } from './lib/cli.mjs';
import { convertEnHtmlToMd, preprocessEnHtml } from './lib/turndown.mjs';
import { checkPageCoverage, checkSinglePageSnapshot } from './lib/source_parity_page_coverage.mjs';
import { buildRunScope, validateRunLinkage } from './lib/source_sync_health.mjs';
import { createMaskCoverage, maskSegmentText } from './lib/parity_glossary_mask.mjs';
import { createArtifactCoverage } from './lib/parity_artifact_registry.mjs';
export { buildRunScope };

const SNAPSHOTS_DIR = path.join(ROOT_DIR, 'snapshots', 'en', 'content');

const SOURCE_SYNC_STATUS_PATH = path.join(ROOT_DIR, 'source-sync-status.json');

const OUTPUT_PATH = path.join(ROOT_DIR, 'parity-check-status.json');

const ACKNOWLEDGEMENTS_PATH = path.join(ROOT_DIR, 'parity-acknowledgements.json');

const BASELINE_PATH = path.join(ROOT_DIR, 'parity-baseline.json');

/**
 * `parity-check-status.json` の schema version。
 * top-level shape が変わったら更新し、downstream は不一致 payload を拒否する。
 */
export const PARITY_CHECK_STATUS_SCHEMA_VERSION = 1;

function buildSegmentInconclusiveIssue(reason, category, meta = null) {
  // free-text reason ではなく structured enum で inconclusive を識別する。
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
 * `getConsoleCoverageState` 用の薄いラッパー。
 * `isAdvisoryOnlyParityIssue` は source-unusable 系だけを advisory とみなし、
 * structure mismatch は reportable 扱いにする。
 * console 経路から直接 import しないため、ここで再 export する。
 */
export function isAdvisoryOnlyIssue(issue) {
  return isAdvisoryOnlyParityIssue(issue);
}

// runScope の詳細契約は shared helper
// (`scripts/lib/source_sync_health.mjs::buildRunScope`) に集約する。
/**
 * parity-check summary を CLI exit code に写像する純粋ヘルパー。
 * `checkSourceParity` から切り出し、フル pipeline なしで gate 挙動を test できる。
 *
 * 入力:
 *   summary  — summarizeParityResults() の出力、または同 shape の object
 *   failOn   — `'actionable' | 'any' | null`。それ以外は `'any'` 扱い
 *
 * 0 (gate pass) か 1 (gate fail) を返す。
 * gate は `reportableActive*` counter だけを見る。coarse audit signal は
 * ack / baseline が期限切れでも exit code に影響させない。
 * legacy の `activeFiles` / `activeActionableFiles` は downstream 互換のため残すが、
 * ここでは意図的に参照しない。
 *
 * `activeErrorFiles` は常に参照する。`source-fetch-error` のような
 * runtime error は reportable issue が 0 件でも fail にする。
 */
export function computeExitCode(summary, failOn) {
  if (!summary || typeof summary !== 'object') return 0;
  const errorFiles = summary.activeErrorFiles || 0;
  if (failOn === 'actionable') {
    const reportableActionable = summary.reportableActiveActionableFiles || 0;
    return reportableActionable > 0 || errorFiles > 0 ? 1 : 0;
  }
  // default と `any` は reportable bucket を見るが、runtime error でも fail にする。
  const reportable = summary.reportableActiveFiles || 0;
  return reportable > 0 || errorFiles > 0 ? 1 : 0;
}

/**
 * parity summary を `pass | fail | inconclusive` の 3 値へ畳み込む。
 * 結果は `parity-check-status.json.summary.result` に入り、downstream の
 * fail-closed gate が inconclusive run からの issue 同期を拒否できるようにする。
 *
 *   pass         — reportable parity issue なし、error file なし、source sync fresh
 *   fail         — reportable issue または error が 1 件以上ある
 *   inconclusive — source freshness が fresh ではなく、欠落を否定できない
 *
 * `freshnessState` には `source-sync-status.json.freshnessState` を渡す。
 * file が無い場合は `null` にし、「freshness 情報なし」として扱う。
 */
export function computeParityResult(summary, freshnessState = null) {
  if (!summary || typeof summary !== 'object') return 'inconclusive';
  const reportable = summary.reportableActiveFiles || 0;
  const errors = summary.activeErrorFiles || 0;
  if (freshnessState && freshnessState !== 'fresh') {
    // stale / partial / broken / unknown source は pass にしない。
    // reportable issue が無い場合も clean pass ではなく inconclusive に落とす。
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

  // 各 issue を 4 状態に分類する。優先度は
  // ack > baseline > advisory > active reportable で、上の状態が当たれば
  // 下は見ない契約。
  //
  //   ack         — `isValidAcknowledgedIssue` が true
  //   baseline    — `isFrozenByBaseline` が true (= isNonBlockingIssue が
  //                 true で ack でないもの)
  //   advisory    — source-unusable (snapshot-incomplete / source-unusable)
  //                 のうち ack / baseline で覆われていないもの。structure
  //                 mismatch は reportable に昇格しているため、
  //                 この分類には含まれない (`isAdvisoryOnlyParityIssue` の
  //                 scope が source-unusable のみに縮小されている)。
  //   reportable  — それ以外 (= active gate-blocking issue)
  const allAcked = issues.every((issue) => isValidAcknowledgedIssue(issue));
  const allBaselineOrAck = issues.every((issue) => isNonBlockingIssue(issue));
  const allCoveredOrAdvisory = issues.every(
    (issue) => isNonBlockingIssue(issue) || isAdvisoryOnlyIssue(issue),
  );
  const hasAdvisory = issues.some((issue) => isAdvisoryOnlyIssue(issue));
  const hasBaselineOrAck = issues.some((issue) => isNonBlockingIssue(issue));

  // active reportable issue が 1 つでも残っていればファイルはブロッキング扱い。
  if (!allCoveredOrAdvisory) {
    return {
      allAcked: false,
      allCovered: false,
      icon: '❌',
      suffix: '',
    };
  }

  // すべて非ブロッキング (ack / baseline / advisory) のいずれか。
  // suffix は具体的な状態に応じて切り分ける。
  let suffix;
  if (allAcked) {
    suffix = ' (all acknowledged)';
  } else if (allBaselineOrAck) {
    // 全件が ack / baseline で覆われている (structure mismatch の baseline
    // もこの経路でカバーされる)。
    suffix = ' (covered by baseline/ack)';
  } else if (hasAdvisory && !hasBaselineOrAck) {
    // advisory の scope は source-unusable のみ。翻訳者責任外の
    // snapshot / source 側 debt であることを CLI で明示する。
    suffix = ' (source unusable)';
  } else {
    // 混在: source-unusable advisory と既存の ack/baseline が同居。
    // "covered by baseline/ack" と書くと advisory が ack/baseline で
    // 覆われているように誤読されるので、明示的に分けて表記する。
    suffix = ' (advisory + baseline/ack)';
  }

  return {
    allAcked,
    allCovered: allBaselineOrAck,
    icon: '⏸️',
    suffix,
  };
}

/**
 * `source-sync-status.json` を読み込む。
 * file が無い、または壊れていれば null。freshness 判定と run linkage 検証の両方で使う。
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
 * run linkage 検証用に `snapshot-diff-status.json` を読み込む。
 * file が無ければ null。missing 扱いにして freshness 判定だけで継続する。
 */
function loadSnapshotDiffPayload() {
  if (!fs.existsSync(SNAPSHOT_DIFF_STATUS_PATH)) return null;
  try {
    return JSON.parse(fs.readFileSync(SNAPSHOT_DIFF_STATUS_PATH, 'utf8'));
  } catch {
    return null;
  }
}

/** 既存 EN snapshot HTML がある slug を集める。 */
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

/** `parity-acknowledgements.json` を読み込み、validation 済み payload を返す。 */
function loadAcknowledgementsFile(filePath = ACKNOWLEDGEMENTS_PATH) {
  if (!fs.existsSync(filePath)) return { schemaVersion: 1, entries: [] };
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return validateAcknowledgements(raw);
}

/**
 * `parity-baseline.json` を読み込み、validation 済み payload を返す。
 * file が無ければ空の structure を返す。
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
  // test 用 dependency injection。
  // repo-global な state file を奪い合わないよう path を差し替えられる。
  // 既定値は従来どおり ROOT_DIR 直下。
  // CLI の parseArgs surface は増やさず、script 呼び出し時の引数でだけ注入する。
  baselinePath = BASELINE_PATH,
  outputPath = OUTPUT_PATH,
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
  // ack expiry は UTC の `today` で判定する。
  // CI の timezone 差を消し、`reviewAfter` の YYYY-MM-DD と揃えるため。
  const today = new Date().toISOString().slice(0, 10);

  // frozen baseline をロード。acknowledgement とは別ファイル / 別意味で管理する。
  // テストでは baselinePath を差し替えて隔離実行できる。
  let baselineData = { schemaVersion: 1, entries: [] };
  try {
    baselineData = loadBaselineFileSafe(baselinePath);
  } catch (error) {
    console.error(`❌ ${error.message}`);
    return 1;
  }
  const baselineInvalidatedSlugs = new Set();

  // `--slug` は path-based slug に正規化する。basename 入力も後方互換で受ける。
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
  // orphan baseline entries を per-slug で蓄積する。
  // 完走後に byType で集計して summary に出す。invalidated slug のものは
  // 含まない (snapshot 更新での再タグ付け待ちなので orphan ではない)。
  const orphanBaselineEntries = [];
  let checkedCount = 0;

  // debug.maskCoverage: per-segment mask 結果を収集する。
  const maskCoverage = createMaskCoverage();

  // debug.artifactCoverage: alignSegments の slug-scope artifact 抑止 hit を
  // 集計する run 単位 aggregator。Phase 4 で新設。
  const artifactCoverage = createArtifactCoverage();

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

    // `--slug` 時だけ page coverage を file 単位で追加確認する。
    // bulk 実行後の global gate と同じ意味を、single-page run でも出すため。
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

    // snapshot の構造比較。画像順、callout nesting、step 数などを見る。
    // EN snapshot は HTML なので、構造比較の前に Markdown へ寄せる。
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
          enBody = convertEnHtmlToMd(rawEnHtml);
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
        // source usability gate を alignSegments の前に挟む。
        // enSegments / jaSegments を先に取得し、extractError を明示的に渡す。
        // detector は extractError != null のとき enSegments を信用しない契約
        // (Layer 1 / Layer 3 を skip し、rawEnHtml 単独で動く Layer 2 のみ評価)。
        let enSegments = [];
        let jaSegments = [];
        let extractError = null;
        try {
          enSegments = extractSegmentsFromHtml(rawEnHtml, {
            slug: fileSlug,
            calloutAllowSlugs: CALLOUT_NORMALIZATION_SLUGS,
          });
          jaSegments = extractSegmentsFromMarkdown(doc.body);
        } catch (e) {
          extractError = e;
          console.error(
            `extractSegments failed for ${fileSlug}: ${e.message}. Falling back to coarse parity.`,
          );
        }

        // debug.maskCoverage: JA segments の mask 結果を収集する。
        // extractError 時は jaSegments が空なので何も記録されない。
        for (const seg of jaSegments) {
          const { masks } = maskSegmentText(seg.textNorm ?? seg.rawText ?? '');
          maskCoverage.record({
            slug: fileSlug,
            segmentKind: seg.segmentKind,
            sectionPath: seg.sectionPath,
            masks,
          });
        }

        const usabilityIssue = detectSourceUsability({
          rawEnHtml,
          enSegments,
          jaSegments,
          extractError,
        });

        if (usabilityIssue) {
          // 比較不能ページ — alignSegments と compareSnapshotStructure を両方
          // suppress し、page-scope の usability issue を 1 件だけ push する。
          // localCheck (JA-side) は既に実行済みでそのまま残る。
          issues.push(usabilityIssue);
        } else if (extractError) {
          // detector が usable と判定 (Layer 2 が発火しなかった) が extractor は
          // 落ちていたケース。extractor 側の bug / 実装回帰の可能性が高いため、
          // source 起因に取り違えず既存の align-exception 経路に明示的にフォールバック。
          issues.push(
            buildSegmentInconclusiveIssue(extractError.message, 'align-exception', null),
          );
          issues.push(...compareSnapshotStructure(enBody, doc.body));
        } else {
          // 既存パス: segment-level exact diff をまず実行する。inconclusive
          // (heading count mismatch 等) のときは legacy coarse signals に
          // フォールバックし、ページが silent green になることを防ぐ。
          // alignment が conclusive のときも coarse complementary check
          // (image order, callout nesting, table shape) を併走させる。
          let alignment;
          try {
            alignment = alignSegments(enSegments, jaSegments, {
              slug: fileSlug,
              coverage: artifactCoverage,
            });
          } catch (e) {
            console.error(
              `alignSegments failed for ${fileSlug}: ${e.message}. Falling back to coarse parity.`,
            );
            issues.push(
              buildSegmentInconclusiveIssue(e.message, 'align-exception', null),
            );
            issues.push(...compareSnapshotStructure(enBody, doc.body));
          }
          if (alignment) {
            const segmentIssues = parityDiffsToIssues(alignment.diffs);
            if (alignment.inconclusive) {
              // fallback として、alignment 済みの exact diff を保持したまま
              // inconclusive 補助 issue と legacy coarse 比較を併走させる。
              issues.push(...segmentIssues);
              issues.push(
                buildSegmentInconclusiveIssue(
                  alignment.inconclusiveReason || 'unknown reason',
                  alignment.inconclusiveCategory,
                  alignment.inconclusiveMeta ?? null,
                ),
              );
              issues.push(...compareSnapshotStructure(enBody, doc.body));
            } else {
              // 主 gate は segment-level diff だが、補完的な coarse signal
              // (image order, callout nesting, table shape) も併走させる。
              // count-based mismatch は COARSE_SIGNAL_TYPES allowlist 経由で
              // audit-only に降格済みで、`signal` severity では出るが
              // parityRegression / gate exit code には乗らない。
              issues.push(...segmentIssues);
              issues.push(...compareSnapshotStructure(enBody, doc.body));
            }
          }
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
    // matchedKeys を consumer 側で消費して orphan
    // baseline entry を集計する。invalidated なページは skip する契約。
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
      } else {
        const orphans = computeOrphanBaselineEntries(
          fileSlug,
          baselineData.entries,
          baselineResult.matchedKeys,
        );
        for (const o of orphans) {
          orphanBaselineEntries.push(o);
        }
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

  // global 実行時だけ page coverage gate を走らせる。
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
  // source-sync-status / snapshot-diff-status と parity run scope の整合を検証する。
  // `linked` 以外なら clean run でも pass ではなく inconclusive に落とす。
  const parityRunScope = buildRunScope({ slug: resolvedSlug, section });
  const linkageState = validateRunLinkage(
    sourceSyncPayload,
    snapshotDiffPayload,
    parityRunScope,
  );
  // CI の parity 単体実行は snapshot_diff / source-sync payload を持たないことがある。
  // その場合は legacy の「linkage 情報なし」とみなし、結果を降格しない。
  // live run は source-sync payload を持つ前提なので、link clean である必要がある。
  const linkageBlocking = sourceSyncPayload != null && linkageState !== 'linked';
  const effectiveFreshnessState = linkageState === 'stale'
    ? 'stale'
    : freshnessState;

  // orphan baseline entries の byType 集計。
  // --slug / --section mode では checked 範囲だけが対象 (未 check 分は
  // orphan 判定できない)。
  const orphanBaselineByType = {};
  for (const o of orphanBaselineEntries) {
    orphanBaselineByType[o.issueType] = (orphanBaselineByType[o.issueType] || 0) + 1;
  }

  const summaryBase = {
    checkedAt: new Date().toISOString(),
    mode: 'local',
    totalFiles: allFiles.length,
    checkedFiles: checkedCount,
    ...summarizeParityResults(results, {
      orphanBaselineEntries: orphanBaselineEntries.length,
      orphanBaselineByType,
    }),
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
  // `computeParityResult` は summarize 後の full counter を必要とする。
  // その上に linkage 判定を重ね、broken linkage なら pass だけを inconclusive へ落とす。
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
    debug: {
      maskCoverage: maskCoverage.toJSON(),
      artifactCoverage: artifactCoverage.snapshot(),
    },
  };

  // テストでは outputPath を差し替えて隔離実行できる。
  // 既定は ROOT_DIR/parity-check-status.json で従来と同一挙動。
  fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2));

  if (!json) {
    console.log(`${'='.repeat(60)}\n📊 チェック結果サマリー\n`);
    console.log(`チェック済み: ${checkedCount} / ${allFiles.length} ファイル`);
    const coveredFiles = summary.filesWithIssues - summary.activeFiles;
    console.log(
      `問題あり: ${summary.filesWithIssues} ファイル (active: ${summary.activeFiles}, ` +
        `covered by baseline/ack: ${coveredFiles})`,
    );
    // orphan baseline entries を reviewer に可視化する。
    // 0 件なら silent、非ゼロなら件数 + byType 上位を 1 行で表示する。
    if ((summary.orphanBaselineEntries || 0) > 0) {
      const top = Object.entries(summary.orphanBaselineByType || {})
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([type, count]) => `${type}×${count}`)
        .join(', ');
      console.log(
        `🧹 orphan baseline entries: ${summary.orphanBaselineEntries} 件 (${top}) — ` +
          `runtime で一致しないため掃除対象。--slug で再生成してください`,
      );
    }
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
    // structure mismatch は reportable 扱いなので
    // CLI 独立セクションは削除した。件数は通常の `Active issue files` 経由
    // で表示される。source unusable は引き続き advisory なので独立 section
    // を維持する (0 件時は null を返して省略する)。
    const sourceUnusableSection = formatSourceUnusableSection(summary);
    if (sourceUnusableSection) {
      console.log('');
      console.log(sourceUnusableSection);
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

async function main({ outputPath = OUTPUT_PATH } = {}) {
  return checkSourceParity({ ...parseArgs(), outputPath });
}

export default main;

const isDirectRun = isDirectCliRun(import.meta.url);

if (isDirectRun) {
  main()
    .then((code) => {
      process.exit(code);
    })
    .catch((error) => {
      console.error('❌ エラー:', error);
      process.exit(1);
    });
}
