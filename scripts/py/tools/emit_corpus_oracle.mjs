#!/usr/bin/env node
/**
 * emit_corpus_oracle.mjs — 288-page matrix conformance oracle JSONL emitter。
 *
 * Phase 5 coexistence 中、Python pytest (288-matrix) が expected値として
 * 参照する oracle snapshot を生成する。mjs harness と同じ scripts/lib/* を
 * 直接 import して、288 slug × 3 suite (segments_en / turndown / align) の
 * 組み合わせを 1 run で batch 計算する。
 *
 * Usage:
 *   node scripts/py/tools/emit_corpus_oracle.mjs --out <path> [--suite <list>]
 *
 * Options:
 *   --out <path>   出力先 JSONL (必須)。絶対パスまたは cwd 相対。temp file に
 *                  書いて成功時だけ rename する (atomic write)。
 *   --suite <list> カンマ区切り suite 名 (default: ``segments_en,turndown``)。
 *                  有効値: ``segments_en``, ``turndown``, ``align``。
 *                  ``all`` は全 suite。
 *                  **``align`` suite は experimental** — 現行
 *                  ``test_align_288_matrix.py`` は Python-generated segments
 *                  を mjs ``alignSegments()`` に渡す 2-stage conformance で、
 *                  本 tool の ``align`` (mjs extractor + mjs align) とは
 *                  保証対象が異なる。Phase 6b で 2-stage oracle (新規)
 *                  に置換予定。それまで ``align`` を golden / nightly
 *                  artifact に混ぜると "保証対象違いの data が流用される"
 *                  リスクがあるため、default は 2 suite のみ。``align`` は
 *                  明示 opt-in したときに stderr で warning を出す。
 *
 * Output format (JSONL, 1 row per line):
 *   {
 *     "schemaVersion": 1,
 *     "suite": "segments_en" | "turndown" | "align",
 *     "slug": "<relative path without extension>",
 *     "sha256": "<hex digest of canonical-JSON(expected)>",
 *     "expected": <suite-specific JSON value>
 *   }
 *
 * `sha256` は drift 検知用の tamper fingerprint。``expected`` を canonical JSON
 * (``sort_keys=True, separators=(",", ":")`` 相当) に serialize してから SHA-256
 * を取る。Python 側 loader も同じ方式で再計算して一致確認する契約。
 *
 * Failure handling:
 *   1 slug / suite でも throw したら stderr に失敗一覧を emit して exit 1 する。
 *   atomic write のため partial JSONL は最終 path に残さない。
 *
 * Phase 6a で committed golden (`scripts/py/tests/conformance/__oracle__/
 * corpus_golden.jsonl`) が main に入った。以降 CI の ``python-corpus`` job は
 * committed golden を expected として使い、本 script は PR CI / nightly の
 * drift check (live mjs output vs committed golden の byte-identical 比較) と
 * local regen (``npm run test:py:corpus:regen``) でのみ使われる。Phase 6b
 * atomic cutover で mjs 削除時に本 script も retire する (docs/PYTHON_MIGRATION_PLAN.md
 * Phase 6 参照)。
 */

import process from 'node:process';
import { readFileSync, readdirSync, renameSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve as pathResolve, dirname, relative as pathRelative } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  CALLOUT_NORMALIZATION_SLUGS,
  extractSegmentsFromHtml,
} from '../../lib/source_parity_segments_en.mjs';
import { extractSegmentsFromMarkdown } from '../../lib/source_parity_segments_ja.mjs';
import { convertEnHtmlToMd } from '../../lib/turndown.mjs';
import { alignSegments } from '../../lib/source_parity_align.mjs';

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

/**
 * Minimal argv parser. We intentionally avoid bringing in a flag-parsing
 * dependency so this script has no runtime install cost beyond what
 * scripts/lib/* already pull in.
 *
 * @param {string[]} argv - process.argv.slice(2)
 * @returns {{out: string, suites: Set<string>}}
 */
function parseArgs(argv) {
  let out = null;
  // Phase 6a で default を ``all`` → ``segments_en,turndown`` に変更 (PR #387
  // review P2)。``align`` は Phase 6b で 2-stage oracle に置換予定の experimental
  // suite で、現行 ``test_align_288_matrix.py`` の保証対象 (Python extractor →
  // mjs align) と異なるため default 生成からは外す。明示 opt-in したときは
  // 下の stderr warning で再度注意喚起する。
  let suiteArg = 'segments_en,turndown';
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--out') {
      out = argv[++i];
    } else if (arg.startsWith('--out=')) {
      out = arg.slice('--out='.length);
    } else if (arg === '--suite') {
      suiteArg = argv[++i];
    } else if (arg.startsWith('--suite=')) {
      suiteArg = arg.slice('--suite='.length);
    } else if (arg === '-h' || arg === '--help') {
      console.error(
        'Usage: node scripts/py/tools/emit_corpus_oracle.mjs --out <path>\n' +
          '                                                 [--suite segments_en,turndown[,align]|all]\n' +
          '                                                 (default: segments_en,turndown)',
      );
      process.exit(0);
    } else {
      console.error(`Unknown argument: ${arg}`);
      process.exit(2);
    }
  }
  if (!out) {
    console.error('Error: --out <path> is required');
    process.exit(2);
  }
  const validSuites = new Set(['segments_en', 'turndown', 'align']);
  const suites =
    suiteArg === 'all'
      ? new Set(validSuites)
      : new Set(
          suiteArg
            .split(',')
            .map((s) => s.trim())
            .filter((s) => s.length > 0),
        );
  for (const s of suites) {
    if (!validSuites.has(s)) {
      console.error(`Unknown suite: ${s}. Valid: ${[...validSuites].join(', ')}`);
      process.exit(2);
    }
  }
  if (suites.has('align')) {
    // ``align`` を opt-in した caller に現行 test_align_288_matrix との保証対象
    // 違いを明示的に警告する (PR #387 review P2 対応、Phase 6b で 2-stage
    // oracle に置換するまで golden / nightly artifact への流用を防ぐ).
    console.error(
      '[emit_corpus_oracle] WARNING: ``align`` suite is experimental.\n' +
        '  Current test_align_288_matrix.py feeds Python-generated segments into\n' +
        '  mjs alignSegments(), which is a different contract from this tool\'s\n' +
        '  (mjs extractor + mjs align). Do NOT commit these align rows into\n' +
        '  tests/conformance/__oracle__/ as golden. Phase 6b will replace this\n' +
        '  with a 2-stage oracle (plan doc: Phase 6b align 288-matrix golden 化).',
    );
  }
  return { out, suites };
}

// ---------------------------------------------------------------------------
// Canonical JSON + SHA-256
// ---------------------------------------------------------------------------

/**
 * Canonical JSON serializer matching Python
 * ``json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False)``.
 *
 * JS の JSON.stringify には sort_keys 相当が無いため自前で実装する。オブジェクト
 * の key を Unicode code-point 順 (Python sort_keys のデフォルト) で並べる。
 *
 * @param {unknown} value
 * @returns {string}
 */
function canonicalStringify(value) {
  if (value === null) return 'null';
  const t = typeof value;
  if (t === 'number' || t === 'boolean') return JSON.stringify(value);
  if (t === 'string') return JSON.stringify(value);
  if (Array.isArray(value)) {
    return '[' + value.map(canonicalStringify).join(',') + ']';
  }
  if (t === 'object') {
    const keys = Object.keys(value).sort();
    return (
      '{' +
      keys.map((k) => JSON.stringify(k) + ':' + canonicalStringify(value[k])).join(',') +
      '}'
    );
  }
  // undefined / function / symbol は silently drop する (JSON.stringify と同じ
  // 挙動)。ただし本 oracle では emitter が扱う expected は plain JSON のみ。
  return JSON.stringify(value);
}

/** @param {unknown} value */
function canonicalSha256(value) {
  return createHash('sha256').update(canonicalStringify(value), 'utf8').digest('hex');
}

// ---------------------------------------------------------------------------
// Corpus discovery
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// scripts/py/tools/emit_corpus_oracle.mjs → repo root
const REPO_ROOT = pathResolve(__dirname, '..', '..', '..');

const EN_SNAPSHOT_ROOT = pathResolve(REPO_ROOT, 'snapshots', 'en', 'content');
const JA_DOCS_ROOT = pathResolve(REPO_ROOT, 'src', 'content', 'docs');

/**
 * Recursively walk a directory and return every file matching ``predicate``.
 *
 * ``fs.promises.glob`` は Node 22+ 限定のため (``package.json`` engines は
 * ``>=18 <25`` を宣言)、再帰 ``readdirSync`` で自前実装する。Node 18 対応を
 * 保つことで CI / local dev の Node version drift に対して defensive。
 *
 * @param {string} dir - absolute path
 * @param {(relPath: string) => boolean} predicate - keeps file if returns true
 * @returns {string[]} posix-style relative paths from ``dir``
 */
function collectFilesRecursive(dir, predicate) {
  /** @type {string[]} */
  const out = [];
  /** @param {string} cur @param {string} rel */
  const walk = (cur, rel) => {
    const entries = readdirSync(cur, { withFileTypes: true });
    for (const entry of entries) {
      const childRel = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        walk(pathResolve(cur, entry.name), childRel);
      } else if (entry.isFile() && predicate(childRel)) {
        out.push(childRel);
      }
    }
  };
  walk(dir, '');
  return out;
}

/**
 * Collect (slug, html) pairs from ``snapshots/en/content/**\/*.html``.
 *
 * @returns {Array<{slug: string, html: string}>}
 */
function collectEnSnapshots() {
  if (!existsSync(EN_SNAPSHOT_ROOT)) return [];
  const relPaths = collectFilesRecursive(EN_SNAPSHOT_ROOT, (p) => p.endsWith('.html'));
  const pairs = relPaths.map((entry) => ({
    slug: entry.replace(/\.html$/, ''),
    html: readFileSync(pathResolve(EN_SNAPSHOT_ROOT, entry), 'utf8'),
  }));
  // Deterministic order (filesystem iteration order is platform-dependent).
  pairs.sort((a, b) => (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0));
  return pairs;
}

/**
 * Load JA markdown body for a slug (if both JA md and EN snapshot exist).
 *
 * @param {string} slug
 * @returns {string | null}
 */
function loadJaBodyIfExists(slug) {
  const mdPath = pathResolve(JA_DOCS_ROOT, slug + '.md');
  if (!existsSync(mdPath)) return null;
  return readFileSync(mdPath, 'utf8');
}

// ---------------------------------------------------------------------------
// Suite computers
// ---------------------------------------------------------------------------

/**
 * segments_en suite: extractSegmentsFromHtml(html, {slug, calloutAllowSlugs}).
 *
 * The options shape matches production callers (and matches
 * tests/conformance/test_segments_en_288_matrix.py line 132-134).
 */
function computeSegmentsEnExpected(slug, html) {
  return extractSegmentsFromHtml(html, {
    slug,
    calloutAllowSlugs: CALLOUT_NORMALIZATION_SLUGS,
  });
}

/**
 * turndown suite: convertEnHtmlToMd(html).
 */
function computeTurndownExpected(_slug, html) {
  return convertEnHtmlToMd(html);
}

/**
 * align suite: alignSegments wrapped in {ok, error} envelope (matches harness).
 * Requires both EN snapshot and JA markdown to exist for the slug.
 *
 * Returns null if JA body is missing — align is only run on paired slugs.
 */
function computeAlignExpected(slug, html) {
  const jaBody = loadJaBodyIfExists(slug);
  if (jaBody === null) return null;
  try {
    const enSegments = extractSegmentsFromHtml(html, {
      slug,
      calloutAllowSlugs: CALLOUT_NORMALIZATION_SLUGS,
    });
    const jaSegments = extractSegmentsFromMarkdown(jaBody);
    return {
      ok: true,
      result: alignSegments(enSegments, jaSegments, { slug }),
    };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const { out, suites } = parseArgs(process.argv.slice(2));

  const snapshots = collectEnSnapshots();
  if (snapshots.length === 0) {
    console.error(
      `Error: no EN snapshots found under ${EN_SNAPSHOT_ROOT}. ` +
        `Run \`npm run check:snapshots:fetch\` first.`,
    );
    process.exit(3);
  }

  const rows = [];
  const failures = [];

  for (const { slug, html } of snapshots) {
    if (suites.has('segments_en')) {
      try {
        const expected = computeSegmentsEnExpected(slug, html);
        rows.push({
          schemaVersion: 1,
          suite: 'segments_en',
          slug,
          sha256: canonicalSha256(expected),
          expected,
        });
      } catch (e) {
        failures.push(`segments_en/${slug}: ${e.message}`);
      }
    }
    if (suites.has('turndown')) {
      try {
        const expected = computeTurndownExpected(slug, html);
        rows.push({
          schemaVersion: 1,
          suite: 'turndown',
          slug,
          sha256: canonicalSha256(expected),
          expected,
        });
      } catch (e) {
        failures.push(`turndown/${slug}: ${e.message}`);
      }
    }
    if (suites.has('align')) {
      try {
        const expected = computeAlignExpected(slug, html);
        if (expected !== null) {
          rows.push({
            schemaVersion: 1,
            suite: 'align',
            slug,
            sha256: canonicalSha256(expected),
            expected,
          });
        }
      } catch (e) {
        failures.push(`align/${slug}: ${e.message}`);
      }
    }
  }

  if (failures.length > 0) {
    console.error(`emit_corpus_oracle: ${failures.length} slug/suite failed:`);
    for (const f of failures.slice(0, 20)) console.error(`  ${f}`);
    if (failures.length > 20) console.error(`  ... (${failures.length - 20} more)`);
    process.exit(1);
  }

  // Atomic write: serialize full payload first, then temp-write + rename.
  const jsonl = rows.map((r) => JSON.stringify(r)).join('\n') + '\n';
  const outResolved = pathResolve(process.cwd(), out);
  const tmp = outResolved + '.tmp-' + process.pid;
  writeFileSync(tmp, jsonl, 'utf8');
  renameSync(tmp, outResolved);

  const relOut = pathRelative(process.cwd(), outResolved) || outResolved;
  console.error(
    `emit_corpus_oracle: wrote ${rows.length} rows across ${suites.size} suite(s) → ${relOut}`,
  );
}

try {
  main();
} catch (e) {
  console.error(`emit_corpus_oracle: unexpected fatal error: ${e.stack || e.message}`);
  process.exit(1);
}
