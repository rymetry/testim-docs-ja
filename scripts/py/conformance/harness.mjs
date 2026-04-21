#!/usr/bin/env node
/**
 * クロスランタイム conformance ハーネス。
 *
 * stdin から JSON payload を以下の形式で受け取り
 *
 *   [{ "function": "<name>", "args": [...] }, ...]
 *
 * 結果の並列配列を stdout へ JSON 出力する。Python 側の conformance テストは
 * サンプル集合を 1 回の呼び出しでバッチ評価し、mjs 側の authoritative 出力と
 * Python 版 port を byte 一致で照合する。node プロセス起動コスト (約 100ms)
 * を分散させるため、call 単位ではなくバッチ単位で起動する契約。
 *
 * mjs の新規 leaf を port するたびに DISPATCH を拡張すること。Python 側
 * `__all__` と対をなす (片方だけ更新すると drift detection が機能しない)。
 *
 * 各 call は try/catch で隔離されており、1 件が throw してもバッチ全体は
 * 継続する。失敗 call は `{ "__error": msg }` として記録される。
 */

import process from 'node:process';

import {
  EN_SOURCE_PATCHES,
  applyEnSourcePatches,
  countOccurrences,
  DEFECT_CLASSES,
} from '../../lib/en_source_patches.mjs';
import { preprocessEnHtml } from '../../lib/turndown.mjs';
import {
  CALLOUT_NORMALIZATION_SLUGS,
  decodeEntities,
  extractSegmentsFromHtml,
} from '../../lib/source_parity_segments_en.mjs';
import { extractSegmentsFromMarkdown } from '../../lib/source_parity_segments_ja.mjs';
import {
  ARTIFACT_REGISTRY,
  createArtifactCoverage,
  isArtifactExcluded,
} from '../../lib/parity_artifact_registry.mjs';
import {
  classifySegment,
  createMaskCoverage,
  loadGlossary,
  loadInvariantPatterns,
  maskSegmentText,
} from '../../lib/parity_glossary_mask.mjs';
import {
  canonicalizeDocsUrl,
  normalizeSegmentTokens,
  normalizeUrlForParity,
} from '../../lib/parity_normalize.mjs';
import {
  buildIndexLookup,
  buildSections,
  buildSidebarSnapshot,
  extractSlug,
  extractSlugsFromSnapshot,
  parseAmdModule,
  resolveUrl,
} from '../../lib/madcap_toc.mjs';
import {
  buildBasenameToPathMap,
  buildDocsIndex,
  buildSlugIndex,
  extractSourceContentPath,
  filePathToSlug,
  findMdFiles,
  getDocSection,
  matchesSectionFilter,
  readDocFile,
  resolveSlug,
  resolveToFullSlug,
  splitFrontmatter,
  toKebab,
  toRelativeDocPath,
} from '../../lib/project.mjs';
import {
  extractJapaneseLabel,
  filterItemsBySection,
  findSidebarSection,
  getSectionSlugSet,
  loadSidebarSections,
  parseSidebarSections,
} from '../../lib/sidebar.mjs';
import {
  computeWeakLengthScore,
  computeWeakPositionScore,
  scoreSegmentMatch,
} from '../../lib/source_parity_align_scoring.mjs';
import {
  buildSectionPath,
  computeSegmentFingerprint,
  createSegment,
  GATE_ELIGIBLE_KINDS,
  isGateEligible,
  normalizeSegmentText,
  pushHeading,
  SEGMENT_KINDS,
} from '../../lib/source_parity_segments_shared.mjs';
import { ISSUE_SEVERITY } from '../../lib/source_parity_types.mjs';
import {
  classifyLine,
  detectEnArtifacts,
  extractBulletCounts,
  extractCalloutPositions,
  extractHeadingSequence,
  extractHtmlTables,
  extractImageSequence,
  extractInvariantTokens,
  extractMarkdownTables,
  extractParagraphCounts,
  extractStepCounts,
  extractTableStructure,
  isUntranslatedCell,
  normalizeEnArtifacts,
  normalizeNumericPeriodSpacing,
  stripMarkdown,
  stripTitleH1,
} from '../../lib/source_parity_extract.mjs';
import {
  STRUCTURE_COMPARATOR_KINDS,
  __collapseBodyToBlocks as collapseBodyToBlocks,
  compareSectionStructure,
} from '../../lib/source_parity_structure.mjs';
import {
  compareSnapshotStructure,
  isEnglishOnlyLine,
  loadSidebarSlugs,
  localCheck,
} from '../../lib/source_parity_checks.mjs';
import {
  alignSegments,
  parityDiffsToIssues,
} from '../../lib/source_parity_align.mjs';
import { formatSourceUnusableSection } from '../../lib/source_parity_summary_format.mjs';
import {
  isActiveParityIssue,
  isAdvisoryOnlyParityIssue,
  isCoarseAuditSignal,
  isFrozenByBaseline,
  isNonBlockingParityIssue,
  isReportableParityIssue,
  isSourceUnusableIssue,
  isStructureMismatchIssue,
  isValidAcknowledgedIssue,
} from '../../lib/source_parity_issue_state.mjs';
import {
  SOURCE_SYNC_EXCLUSIONS,
  getExclusion,
  isSourceSideDebt,
  listSourceSideDebtSlugs,
} from '../../lib/source_sync_exclusions.mjs';
import {
  checkLocalPageOrphan,
  checkMissingSnapshot,
  checkPageCoverage,
  checkSinglePageSnapshot,
  checkSourcePageMissingLocal,
} from '../../lib/source_parity_page_coverage.mjs';
import {
  NON_ACKNOWLEDGEABLE_TYPES,
  computeSnapshotFingerprint,
  findMatchingAcknowledgement,
  isAcknowledgementExpired,
  tagIssuesWithAcknowledgements,
  validateAcknowledgements,
} from '../../lib/source_parity_acknowledgements.mjs';
import {
  buildAdvisoryArtifacts,
  buildAdvisoryQueueIssueKey,
  buildAdvisoryReviewQueue,
  buildAdvisoryReviewScope,
  isAdvisoryReviewCandidate,
  isBlockingAdvisoryReviewIssue,
  isValidAdvisoryAcknowledgement,
  summarizeAdvisoryReviewQueue,
} from '../../lib/source_parity_advisory_queue.mjs';
import { detectSourceUsability } from '../../lib/source_parity_source_usability.mjs';
import {
  SOURCE_SYNC_STATUS_SCHEMA_VERSION,
  buildRunScope,
  buildSourceSyncStatus,
  computeFreshnessState,
  fingerprint as syncHealthFingerprint,
  validateRunLinkage,
} from '../../lib/source_sync_health.mjs';
import { summarizeParityResults } from '../../lib/source_parity_summary.mjs';
import {
  MUTATION_TYPES as MUTATION_CORPUS_TYPES,
  classifyLines as mutationClassifyLines,
  generateAllMutations,
  generateCorpus,
  listItemBlockEnd,
  paragraphBlockRange,
} from '../../lib/mutation_corpus.mjs';
import {
  BASELINE_ELIGIBLE_TYPES,
  NOTE_MAX_LENGTH as BASELINE_NOTE_MAX_LENGTH,
  PRIORITY_VALUES as BASELINE_PRIORITY_VALUES,
  STRUCTURE_CATEGORIES as BASELINE_STRUCTURE_CATEGORIES,
  TYPES_ARG_ALLOWLIST as BASELINE_TYPES_ARG_ALLOWLIST,
  buildBaselineKey,
  buildBaselineKeyFromEntry,
  computeOrphanBaselineEntries,
  computeStructureFingerprint,
  tagIssuesWithBaseline,
  validateBaseline,
  validateTypesArg,
} from '../../lib/source_parity_baseline.mjs';

// ---------------------------------------------------------------------------
// Helpers (Map / Set を JSON-safe に正規化する)
// ---------------------------------------------------------------------------

function mapToObject(map) {
  const out = {};
  for (const [k, v] of map) out[String(k)] = v;
  return out;
}

function setToSortedArray(set) {
  return [...set].sort();
}

// ---------------------------------------------------------------------------
// Dispatch table — Python `__all__` と 1:1 で対応させる
// ---------------------------------------------------------------------------

// Python `__all__` との対応契約:
//   - 以下 DISPATCH は Python 側の **各モジュール** が宣言する ``__all__`` の
//     コール可能 surface と 1:1 で対応させる (ルートパッケージ ``testim_parity``
//     は re-export を行わず、module 単位で surface を持つ: Phase 0 review M3)。
//     新規 leaf を port したら、その module の ``__all__`` に name を追加し、
//     以下 DISPATCH に対応する関数名を追加する。
//   - **意図的に除外** している Python エクスポート:
//     * `match_all_tricentis_urls` — Python-only API (mjs 側に対応する export
//       が無い; JS 側は `TRICENTIS_URL_RE` + 呼び出し側で matchAll を組み立てる
//       旧パターン)。
//     * `create_en_source_patch_coverage` — factory。patch content の byte
//       parity は `patch_registry_dump` が既にカバーしており、stateful
//       aggregator を harness 経由で conformance する必要性が低い。
//     * 定数 (`SCORE_*`, `CJK_RE`, `GATE_ELIGIBLE_KINDS`, `SEGMENT_KINDS`,
//       `Segment` モデル, `ISSUE_SEVERITY`) は値が変わらない純データのため
//       unit test 側で個別カバー。
const DISPATCH = {
  // -------- normalize --------
  normalize_url_for_parity: ([url]) => normalizeUrlForParity(url),
  canonicalize_docs_url: ([url]) => canonicalizeDocsUrl(url),
  normalize_segment_tokens: ([tokens]) => normalizeSegmentTokens(tokens),

  // -------- align_scoring --------
  compute_weak_position_score: ([i, j, n, m]) => computeWeakPositionScore(i, j, n, m),
  compute_weak_length_score: ([enText, jaText]) => computeWeakLengthScore(enText, jaText),
  score_segment_match: ([en, ja, i, j, n, m]) => scoreSegmentMatch(en, ja, i, j, n, m),

  // -------- types --------
  issue_severity_lookup: ([key]) => ISSUE_SEVERITY[key] ?? null,
  issue_severity_all: () => ({ ...ISSUE_SEVERITY }),

  // -------- madcap_toc --------
  madcap_extract_slug: ([url]) => extractSlug(url),
  madcap_resolve_url: ([urlPath, baseUrl]) => resolveUrl(urlPath, baseUrl),
  madcap_parse_amd_module: ([text]) => parseAmdModule(text),
  madcap_build_index_lookup: ([chunks]) => mapToObject(buildIndexLookup(chunks)),
  madcap_build_sections: ([tree, lookupEntries]) =>
    buildSections(tree, new Map(lookupEntries)),
  madcap_build_sidebar_snapshot: ([sections, baseUrl, fetchedAt]) => {
    const snap = buildSidebarSnapshot(sections, baseUrl ?? undefined);
    return { ...snap, fetchedAt: fetchedAt ?? '' };
  },
  madcap_extract_slugs_from_snapshot: ([sidebarJson]) =>
    setToSortedArray(extractSlugsFromSnapshot(sidebarJson)),

  // -------- sidebar --------
  sidebar_parse_sections: ([text]) => parseSidebarSections(text),
  sidebar_find_section: ([sections, name]) => findSidebarSection(sections, name) ?? null,
  sidebar_get_section_slug_set: ([name]) => {
    // 外側 wrapper の ``__error`` (dispatch / runtime エラー) とは別の封筒に
    // 入れる。こうしないと ``{__error}`` という単一 shape が
    //   (a) harness infrastructure エラー (dispatch 失敗 / throw)
    //   (b) ドメイン的エラー (section が sidebar に無い)
    // の 2 つに読めるため、Python 側の test が混同する。
    try {
      return setToSortedArray(getSectionSlugSet(name));
    } catch (e) {
      return { __domain_error: e.message };
    }
  },
  sidebar_extract_japanese_label: ([title]) => extractJapaneseLabel(title),
  sidebar_filter_items_by_section: ([items, name]) => filterItemsBySection(items, name),
  sidebar_load_sections: () => loadSidebarSections(),

  // -------- project --------
  project_file_path_to_slug: ([filePath, docsDir]) => filePathToSlug(filePath, docsDir),
  project_resolve_to_full_slug: ([slug]) => resolveToFullSlug(slug),
  project_resolve_slug: ([input]) => resolveSlug(input) ?? null,
  project_basename_to_path_map: () => mapToObject(buildBasenameToPathMap()),
  project_slug_index_keys: () =>
    Object.keys(buildSlugIndex()).sort(),
  project_docs_index_slug_list: () => Object.keys(buildDocsIndex()).sort(),
  project_extract_source_content_path: ([url]) => extractSourceContentPath(url),
  project_split_frontmatter: ([md]) => splitFrontmatter(md),
  project_to_kebab: ([value]) => toKebab(value),
  project_find_md_count: () => findMdFiles().length,
  project_get_doc_section: ([relPath]) => getDocSection(relPath),
  project_matches_section_filter: ([relPath, data, section]) =>
    matchesSectionFilter(relPath, data ?? null, section),
  project_read_doc_file: ([filePath]) => {
    const doc = readDocFile(filePath);
    // ``content`` は巨大 & 改行差分で比較しづらいので除外。重要な metadata
    // サーフェスのみを比較する。
    return {
      body: doc.body,
      data: doc.data,
      relativePath: doc.relativePath,
      section: doc.section,
    };
  },
  project_to_relative_doc_path: ([filePath]) => toRelativeDocPath(filePath),

  // -------- extract --------
  extract_invariant_tokens: ([cell]) => extractInvariantTokens(cell),

  // -------- segments_shared --------
  seg_normalize_text: ([raw]) => normalizeSegmentText(raw),
  seg_fingerprint: ([raw]) => computeSegmentFingerprint(raw),
  seg_push_heading: ([stack, level, text]) => pushHeading(stack, level, text),
  seg_build_section_path: ([stack]) => buildSectionPath(stack),
  seg_is_gate_eligible: ([kind]) => isGateEligible(kind),
  seg_kinds: () => [...SEGMENT_KINDS],
  seg_gate_eligible_kinds: () => [...GATE_ELIGIBLE_KINDS],
  seg_create: ([args]) => createSegment(args),

  // -------- glossary_mask --------
  mask_segment_text: ([text]) => maskSegmentText(text),
  mask_classify_segment: ([text]) => classifySegment(text),
  mask_load_glossary: () => setToSortedArray(loadGlossary()),
  mask_load_invariant_patterns: () =>
    loadInvariantPatterns().map((p) => ({
      id: p.id,
      source: p.regex.source,
      flags: p.regex.flags,
    })),
  mask_coverage_roundtrip: ([records]) => {
    const cov = createMaskCoverage();
    for (const r of records) cov.record(r);
    return cov.toJSON();
  },

  // -------- artifact_registry --------
  artifact_is_excluded: ([slug, token]) => isArtifactExcluded({ slug, token }),
  artifact_registry_size: () => ARTIFACT_REGISTRY.length,
  artifact_registry_dump: () =>
    ARTIFACT_REGISTRY.map((entry) => ({
      slugs: [...entry.slugs],
      token: entry.token,
      reason: entry.reason,
      note: entry.note,
      expectedIssueType: entry.expectedIssueType,
      addedAt: entry.addedAt,
      linkedIssue: entry.linkedIssue,
    })),
  artifact_coverage_roundtrip: ([records]) => {
    const cov = createArtifactCoverage();
    for (const r of records) cov.record(r);
    return cov.snapshot();
  },

  // -------- en_source_patches --------
  patch_count_occurrences: ([haystack, needle]) => countOccurrences(haystack, needle),
  patch_defect_classes: () => [...DEFECT_CLASSES],
  patch_registry_size: () => EN_SOURCE_PATCHES.length,
  patch_registry_ids: () => EN_SOURCE_PATCHES.map((p) => p.id),
  patch_registry_dump: () =>
    // 全 patch の full payload を吐き出す。これが無いと dual-source-of-truth
    // (mjs と JSON) の drift detection が成立しない。
    EN_SOURCE_PATCHES.map((p) => ({
      id: p.id,
      slugs: [...p.slugs],
      defectClass: p.defectClass,
      find: p.find,
      replace: p.replace,
      rationale: p.rationale,
      linkedDefect: p.linkedDefect,
      addedAt: p.addedAt,
      reviewAfter: p.reviewAfter,
    })),
  patch_apply: ([html, slug]) => applyEnSourcePatches(html, slug),
  patch_apply_find_string: ([patchId]) => {
    // patch.find を入力 HTML として applyEnSourcePatches を実行し、replace が
    // 反映されることを確認する replay テスト用。patchId が該当するなら slugs[0]
    // を使う。non-existent patchId は null を返す。
    const patch = EN_SOURCE_PATCHES.find((p) => p.id === patchId);
    if (!patch) return null;
    return applyEnSourcePatches(patch.find, patch.slugs[0]);
  },

  // -------- preprocess_en --------
  preprocess_en_html: ([html, slug]) => {
    // 第二引数は options object。slug が非 nullish なら patchCoverage は
    // NOOP_PATCH_COVERAGE が default で入るので渡さない。Python 側も
    // patch_coverage=None がデフォルトで同じ経路を通る契約。
    const options = slug ? { slug } : {};
    return preprocessEnHtml(html, options);
  },

  // -------- segments_en --------
  segments_en_decode_entities: ([text]) => decodeEntities(text),
  segments_en_callout_normalization_slugs: () =>
    [...CALLOUT_NORMALIZATION_SLUGS].sort(),
  segments_en_extract: ([html, slug]) => {
    // options の build 規則:
    //   - slug が falsy (null / undefined / '')  → options = {}
    //     (mjs `normalizeCallouts` は calloutAllowSlugs を instanceof Set で
    //      チェックするため、未 bind なら normalization を skip)
    //   - slug が truthy → calloutAllowSlugs を CALLOUT_NORMALIZATION_SLUGS に
    //     bind する。Python 側も同じ Set を明示的に渡す契約 (review H4)。
    //     これで production caller (`extract_segments_from_html(html, slug=...,
    //     callout_allow_slugs=CALLOUT_NORMALIZATION_SLUGS)`) と同じ shape で
    //     byte 一致を比較できる。
    const options = slug
      ? { slug, calloutAllowSlugs: CALLOUT_NORMALIZATION_SLUGS }
      : {};
    return extractSegmentsFromHtml(html, options);
  },

  // -------- summary_format --------
  // Phase 3 M1: formatSourceUnusableSection は summary dict を受け取って複数行
  // テキスト (または null) を返す純粋フォーマッタ。mjs と byte 一致。
  // Consumer: scripts/py/tests/conformance/test_summary_format_parity.py
  summary_format_source_unusable: ([summary]) => formatSourceUnusableSection(summary),

  // -------- issue_state --------
  // Phase 3 M1: issue 状態判定述語 (pure predicates)。ack / baseline / severity /
  // type (coarse / structure / source-unusable) の組合せで issue を分類する。
  // Consumer: scripts/py/tests/conformance/test_issue_state_parity.py
  issue_state_is_valid_acknowledged: ([issue]) => isValidAcknowledgedIssue(issue),
  issue_state_is_frozen_by_baseline: ([issue]) => isFrozenByBaseline(issue),
  issue_state_is_active: ([issue]) => isActiveParityIssue(issue),
  issue_state_is_coarse_audit_signal: ([issue]) => isCoarseAuditSignal(issue),
  issue_state_is_structure_mismatch: ([issue]) => isStructureMismatchIssue(issue),
  issue_state_is_source_unusable: ([issue]) => isSourceUnusableIssue(issue),
  issue_state_is_reportable: ([issue]) => isReportableParityIssue(issue),
  issue_state_is_advisory_only: ([issue]) => isAdvisoryOnlyParityIssue(issue),
  issue_state_is_non_blocking: ([issue]) => isNonBlockingParityIssue(issue),

  // -------- sync_exclusions --------
  // Phase 3 M1: source-side debt registry (upstream broken page の固定化)。
  // Python 側は MappingProxyType で immutable を再現。registry content の byte
  // parity は sync_exclusions_dump で保証する。
  // Consumer: scripts/py/tests/conformance/test_sync_exclusions_parity.py
  sync_exclusions_is_source_side_debt: ([slug]) => isSourceSideDebt(slug),
  sync_exclusions_get: ([slug]) => getExclusion(slug),
  sync_exclusions_list_slugs: () => listSourceSideDebtSlugs(),
  sync_exclusions_dump: () =>
    // registry 全体を dump。dual-source-of-truth (mjs と Python の定数) の drift
    // detection 用 — mjs 側 const と Python 側 _REGISTRY を byte 比較する。
    Object.fromEntries(
      Object.entries(SOURCE_SYNC_EXCLUSIONS).map(([slug, entry]) => [slug, { ...entry }]),
    ),

  // -------- page_coverage --------
  // Phase 3 M1: page coverage gate (sidebar / local / snapshot 三者整合)。
  // severity は ISSUE_SEVERITY lookup なので、freshness state と type の組合せ
  // で actionable / signal が切り替わる。
  // Consumer: scripts/py/tests/conformance/test_page_coverage_parity.py
  page_coverage_source_missing_local: ([sidebarSlugs, localSlugs]) =>
    checkSourcePageMissingLocal(new Set(sidebarSlugs), new Set(localSlugs)),
  page_coverage_local_orphan: ([localSlugs, sidebarSlugs]) =>
    checkLocalPageOrphan(new Set(localSlugs), new Set(sidebarSlugs)),
  page_coverage_missing_snapshot: ([localSourceUrls, snapshotSlugs, freshnessState]) =>
    checkMissingSnapshot(
      new Map(Object.entries(localSourceUrls)),
      new Set(snapshotSlugs),
      freshnessState,
    ),
  page_coverage_single_page: ([slug, sourceUrl, snapshotSlugs, freshnessState]) =>
    checkSinglePageSnapshot(slug, sourceUrl, new Set(snapshotSlugs), freshnessState),
  page_coverage_all: ([opts]) =>
    checkPageCoverage({
      sidebarSlugs: new Set(opts.sidebarSlugs ?? []),
      localSlugs: new Set(opts.localSlugs ?? []),
      localSourceUrls: new Map(Object.entries(opts.localSourceUrls ?? {})),
      snapshotSlugs: new Set(opts.snapshotSlugs ?? []),
      freshnessState: opts.freshnessState ?? null,
    }),

  // -------- acknowledgements --------
  // Phase 3 M2: SHA-256 fingerprint, schema validation, ack match + tagging。
  // Consumer: scripts/py/tests/conformance/test_acknowledgements_parity.py
  acknowledgements_fingerprint: ([content]) => computeSnapshotFingerprint(content),
  acknowledgements_non_acknowledgeable_types: () => [...NON_ACKNOWLEDGEABLE_TYPES].sort(),
  acknowledgements_is_expired: ([entry, currentFingerprint, today]) =>
    isAcknowledgementExpired(entry, currentFingerprint, today),
  acknowledgements_find_match: ([slug, issue, entries, currentFingerprint, today]) =>
    findMatchingAcknowledgement(slug, issue, entries, currentFingerprint, today),
  acknowledgements_tag_issues: ([slug, issues, entries, currentFingerprint, today]) =>
    tagIssuesWithAcknowledgements(slug, issues, entries, currentFingerprint, today),
  acknowledgements_validate: ([parsed]) => {
    // throw 経路は harness 外 try/catch で捕まると {__error} として返るが、
    // validateAcknowledgements は schema 違反で Error を throw するため
    // domain error は ``{__domain_error}`` envelope で分離する。
    try {
      validateAcknowledgements(parsed);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  },

  // -------- advisory_queue --------
  // Phase 3 M2: tokenless-near-tie advisory queue builder + summarizer。
  // Consumer: scripts/py/tests/conformance/test_advisory_queue_parity.py
  advisory_is_candidate: ([issue]) => isAdvisoryReviewCandidate(issue),
  advisory_is_valid_ack: ([issue]) => isValidAdvisoryAcknowledgement(issue),
  advisory_is_blocking: ([issue]) => isBlockingAdvisoryReviewIssue(issue),
  advisory_build_issue_key: ([slug, issue]) => buildAdvisoryQueueIssueKey(slug, issue),
  advisory_build_scope: ([opts]) => buildAdvisoryReviewScope(opts ?? {}),
  advisory_build_queue: ([results]) => buildAdvisoryReviewQueue(results ?? []),
  advisory_summarize: ([queue, scope]) =>
    summarizeAdvisoryReviewQueue(queue ?? [], scope ?? null),
  // typescript-reviewer MEDIUM 指摘: ``opts.buildQueue`` は JSON 越しに function
  // reference を渡せないため、mjs production default (``buildAdvisoryReviewQueue``)
  // が常に使われる。Python test が custom queue builder を注入したい場合は
  // harness 経由ではなく直接 ``build_advisory_artifacts`` を Python 側で呼ぶ。
  advisory_build_artifacts: ([opts]) => buildAdvisoryArtifacts(opts ?? {}),

  // -------- source_usability --------
  // Phase 3 M2: Layer 1/2/3 source usability detection。preprocess_en を使う
  // ため ``segment`` list は ``{segmentKind}`` shape に限定した minimal fixture
  // を Python 側で用意して渡す。
  // **fixture shape 契約** (typescript-reviewer MEDIUM 指摘): ``opts`` は
  //   { rawEnHtml: string, enSegments: [{segmentKind}], jaSegments: [{segmentKind}],
  //     extractError?: truthy }
  // を verbatim で渡す。追加 field があっても detectSourceUsability は
  // destructure するため silently drop される。Python test は同じ shape で kwargs
  // 経由 (raw_en_html / en_segments / ja_segments / extract_error) で呼ぶ。
  // Consumer: scripts/py/tests/conformance/test_source_usability_parity.py
  usability_detect: ([opts]) => detectSourceUsability(opts ?? {}),

  // -------- sync_health --------
  // Phase 3 M2: source-sync-status.json builder。runId の deterministic 生成
  // のため conformance sample では常に ``now`` (ISO string) と ``runSeed`` を渡す。
  // Consumer: scripts/py/tests/conformance/test_sync_health_parity.py
  sync_health_schema_version: () => SOURCE_SYNC_STATUS_SCHEMA_VERSION,
  sync_health_build_run_scope: ([opts]) => buildRunScope(opts ?? {}),
  sync_health_fingerprint: ([items]) => syncHealthFingerprint(items ?? []),
  sync_health_compute_freshness: ([pages, sidebarVerified]) =>
    computeFreshnessState(pages ?? [], Boolean(sidebarVerified)),
  sync_health_validate_linkage: ([sourceSync, snapshotDiff, parityRunScope]) =>
    validateRunLinkage(sourceSync, snapshotDiff, parityRunScope),
  sync_health_build_status: ([opts]) => {
    // opts.now は ISO string で渡す想定。mjs は Date 型を期待するため変換する。
    const normalized = {
      pages: opts.pages ?? [],
      sidebarResult: opts.sidebarResult ?? { ok: false },
      runScope: opts.runScope ?? { type: 'full', isComplete: true, filters: { slug: null, section: null } },
      now: opts.now ? new Date(opts.now) : undefined,
      runSeed: opts.runSeed,
    };
    return buildSourceSyncStatus(normalized);
  },

  // -------- extract (Phase 3 M3) --------
  // markdown 構造抽出 13 関数。conformance で mjs と byte 一致を保証。
  // Consumer: scripts/py/tests/conformance/test_extract_parity.py
  extract_image_sequence: ([body]) => extractImageSequence(body),
  extract_callout_positions: ([body]) => extractCalloutPositions(body),
  extract_step_counts: ([body]) => {
    const map = extractStepCounts(body);
    return Array.from(map.entries());
  },
  extract_bullet_counts: ([body]) => {
    const map = extractBulletCounts(body);
    return Array.from(map.entries());
  },
  extract_paragraph_counts: ([body]) => {
    const map = extractParagraphCounts(body);
    return Array.from(map.entries());
  },
  extract_heading_sequence: ([body]) => extractHeadingSequence(body),
  extract_strip_markdown: ([text]) => stripMarkdown(text),
  extract_is_untranslated_cell: ([cell]) => isUntranslatedCell(cell),
  extract_strip_title_h1: ([body]) => stripTitleH1(body),
  extract_normalize_numeric_period: ([body]) => normalizeNumericPeriodSpacing(body),
  extract_normalize_en_artifacts: ([body]) => normalizeEnArtifacts(body),
  extract_markdown_tables: ([body]) => extractMarkdownTables(body),
  extract_html_tables: ([body]) => extractHtmlTables(body),
  extract_table_structure: ([body]) => extractTableStructure(body),
  extract_detect_en_artifacts: ([body]) => detectEnArtifacts(body),
  extract_classify_line: ([line, state]) => {
    const { kind, heading = null, nextState } = classifyLine(line, state ?? {});
    // heading field は mjs が付ける時だけ present。Python も同じ shape を返すので
    // ``?? null`` で明示的に null に埋める (conformance で field 欠如 vs null の
    // 差を作らないため)。
    return { kind, heading, nextState };
  },

  // -------- structure (Phase 3 M3) --------
  // Consumer: scripts/py/tests/conformance/test_structure_parity.py
  // typescript-reviewer MEDIUM: 他 dispatch (acknowledgements / sidebar_slugs / etc.)
  // と揃えて sort() 経由で contract を uniform にする。insertion order 保証と
  // 並んだ assertion の両方が安定する。
  structure_comparator_kinds: () => [...STRUCTURE_COMPARATOR_KINDS].sort(),
  structure_collapse_body: ([body]) => collapseBodyToBlocks(body),
  structure_compare: ([enSection, jaSection]) => compareSectionStructure(enSection, jaSection),

  // -------- checks (Phase 3 M3) --------
  // Consumer: scripts/py/tests/conformance/test_checks_parity.py
  checks_is_english_only_line: ([line]) => isEnglishOnlyLine(line),
  checks_load_sidebar_slugs: ([text]) => [...loadSidebarSlugs(text)].sort(),
  checks_local: ([doc]) => localCheck(doc),
  checks_compare_snapshot_structure: ([enBody, jaBody]) =>
    compareSnapshotStructure(enBody, jaBody),

  // -------- align (Phase 3 M4) --------
  // weighted LCS alignment + ParityDiff 生成。diff payload の byte-identical
  // は baseline identity key (Phase 3 M5) に直結するため厳密に検証する。
  // typescript-reviewer HIGH 指摘対応: slug 欠落 (domain constraint) を
  // infrastructure error ({__error}) と混ざらないよう {ok, error} envelope に
  // 包む。acknowledgements_validate と同じ pattern。
  // Consumer: scripts/py/tests/conformance/test_align_parity.py
  align_segments: ([enSegments, jaSegments, options]) => {
    try {
      return {
        ok: true,
        result: alignSegments(enSegments, jaSegments, options ?? {}),
      };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  },
  align_parity_diffs_to_issues: ([diffs]) => parityDiffsToIssues(diffs),

  // -------- baseline (Phase 3 M5) --------
  // Consumer: scripts/py/tests/conformance/test_baseline_parity.py
  // baseline identity key は align ParityDiff 出力に直結するため、fingerprint /
  // build_key / validate / tagging の戻り値 shape を byte-identical に縛る。
  baseline_eligible_types: () => [...BASELINE_ELIGIBLE_TYPES].sort(),
  baseline_types_arg_allowlist: () => [...BASELINE_TYPES_ARG_ALLOWLIST].sort(),
  baseline_priority_values: () => [...BASELINE_PRIORITY_VALUES],
  baseline_structure_categories: () => [...BASELINE_STRUCTURE_CATEGORIES].sort(),
  baseline_note_max_length: () => BASELINE_NOTE_MAX_LENGTH,
  baseline_validate_types_arg: ([types]) => validateTypesArg(types),
  baseline_compute_structure_fingerprint: ([payload]) =>
    computeStructureFingerprint(payload),
  baseline_validate: ([parsed]) => {
    // validate_baseline は正常時に parsed reference を返すため conformance では
    // {ok: true} のみ送り返し、Python 側は ValueError を raise するシグネチャに
    // 合わせる。dispatch 全般と同じ {ok, error} envelope。
    try {
      validateBaseline(parsed);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  },
  baseline_build_key: ([slug, issue]) => buildBaselineKey(slug, issue),
  baseline_build_key_from_entry: ([entry]) => buildBaselineKeyFromEntry(entry),
  baseline_tag_issues: ([slug, issues, entries, fp]) => {
    const { tagged, invalidated, matchedKeys } = tagIssuesWithBaseline(
      slug,
      issues,
      entries,
      fp,
    );
    return { tagged, invalidated, matchedKeys: [...matchedKeys].sort() };
  },
  baseline_orphan_entries: ([slug, entries, matchedKeys]) =>
    computeOrphanBaselineEntries(slug, entries, new Set(matchedKeys)),

  // -------- summary (Phase 3 M5) --------
  // Consumer: scripts/py/tests/conformance/test_summary_parity.py
  // 全 counter (reportableActiveFiles / auditSignalIssues / baselinedIssues /
  // structureMismatchFiles / ...) は 5-counter=0 DoD に直結するため、mjs と
  // Python の結果 dict を deep-equal 比較で byte 一致に縛る。
  summary_summarize: ([results, orphanMeta]) =>
    summarizeParityResults(results, orphanMeta ?? {}),

  // -------- mutation_corpus (Phase 3 M6) --------
  // Consumer: scripts/py/tests/conformance/test_mutation_corpus_parity.py
  // diff=1 recall test の corpus generator。9/9 recall は translation-parity
  // pipeline の quality gate そのものなので、各 mutation の shape / description
  // / lineIndex を byte-identical に縛る。
  mutation_classify_lines: ([md]) => mutationClassifyLines(md),
  mutation_list_item_block_end: ([lines, start]) => listItemBlockEnd(lines, start),
  mutation_paragraph_block_range: ([classified, idx]) =>
    paragraphBlockRange(classified, idx),
  mutation_type_keys: () => Object.keys(MUTATION_CORPUS_TYPES),
  mutation_run: ([typeName, md, nth]) => {
    const fn = MUTATION_CORPUS_TYPES[typeName];
    if (!fn) return { __domain_error: `unknown mutation type: ${typeName}` };
    return fn(md, nth ?? 0);
  },
  mutation_generate_all: ([md]) => {
    const map = generateAllMutations(md);
    // Map → object で dispatch。Python dict (挿入順保持) と byte 一致。
    return Object.fromEntries(map);
  },
  mutation_generate_corpus: ([md, count]) => {
    const map = generateCorpus(md, count ?? 3);
    return Object.fromEntries(map);
  },

  // -------- segments_ja --------
  // Phase 2: JA markdown canonical segment extractor. Byte-identical conformance
  // is expected for all inputs EXCEPT nested-list patterns — the Python port
  // intentionally flattens nested <li> text into the top-level item (Issue #368
  // fix), while mjs emits each nested line as its own segment. Conformance
  // samples that exercise nested lists go through dedicated Python-only unit
  // tests; the harness dispatch samples must remain nest-free.
  // Consumers: scripts/py/tests/conformance/test_segments_ja_parity.py
  //   (nest-free byte parity + 288-page corpus regression guard) and
  //   scripts/py/tests/test_segments_ja.py::TestIssue368NestedListFlattening
  //   (Python-only flatten behaviour record).
  segments_ja_extract: ([body]) => extractSegmentsFromMarkdown(body),
};

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

const raw = await readStdin();
const calls = JSON.parse(raw);
const results = calls.map(({ function: name, args }) => {
  const fn = DISPATCH[name];
  if (!fn) return { __error: `unknown function: ${name}` };
  try {
    return fn(args ?? []);
  } catch (err) {
    return { __error: `${name}: ${err.message}` };
  }
});
process.stdout.write(JSON.stringify(results));
