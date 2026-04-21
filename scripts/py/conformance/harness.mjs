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
import { extractInvariantTokens } from '../../lib/source_parity_extract.mjs';

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
