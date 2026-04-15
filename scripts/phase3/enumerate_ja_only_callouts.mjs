#!/usr/bin/env node
/**
 * Phase 3.1: JA 独自 callout 候補の enumerate + 分類 (v1 — UNSAFE for editing)
 *
 * parity-baseline.json の entries から issueType==='segment-extra' かつ
 * segmentKind==='callout-body' のものを抽出し、各エントリが JA md ファイルの
 * どの callout ブロックに対応するかを特定して Markdown で出力する。
 *
 * ---
 *
 * ⚠ **v1 は Round 2 の編集対象確定には使えない。** 理由:
 *
 * 1. sectionPath の leaf heading が JA md 内に一致しない場合 (例: JA は
 *    `## API キーの管理（API keys management）` のように日本語（English） 併記)、
 *    whole-document fallback に入り「別 section の最初の callout」を誤対象化する。
 *    Round 1 の `administration/api-access` 誤修正 (preface の `:::tip` を
 *    `API keys management` section 対象として扱った) はこの fallback が直接原因。
 * 2. 現 baseline では **17 entries 中 14 entries が fallback に該当** する。
 *    つまり v1 の出力のほとんどは unsafe。
 * 3. fallback が発生した entry には output 中に `⚠ HEADING-NOT-FOUND (UNSAFE FALLBACK)`
 *    を明示し、プロセスを exit status 1 で終了する。Round 2 script は `jaSourceFingerprint`
 *    を JA md body と照合する v2 に差し替えが必要。
 *
 * **Round 2 で対応が必要な作業** (詳細は plan の `Round 1 Post-mortem` を参照):
 *
 * - `日本語（English）` heading 解決 (括弧内英語を副キーとして leaf heading resolver に追加)
 * - `jaSourceFingerprint` -> JA md body の fingerprint match (heading text match 不可時の最終 resolver)
 * - `enHasCallout: bool` pre-flight (EN snapshot 側の対応 section に `<div class="note">` 等が
 *   存在するかを grep し、分類2 を機械的にガード)
 *
 * ---
 *
 * NOTE: RegExp.prototype.exec は使用禁止。
 * String.prototype.match / matchAll / RegExp.prototype.test のみ使用する。
 *
 * Usage:
 *   node scripts/phase3/enumerate_ja_only_callouts.mjs
 *   # unresolved entries があれば exit 1 (現時点ではほぼ常に 1)
 *
 * @module scripts/phase3/enumerate_ja_only_callouts
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// ---------------------------------------------------------------------------
// Path resolution
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** Repository root (scripts/phase3/ から 2 階層上) */
const REPO_ROOT = join(__dirname, '../..');
const DOCS_DIR = join(REPO_ROOT, 'src', 'content', 'docs');

// ---------------------------------------------------------------------------
// Regex constants (match/matchAll/test のみ使用)
// ---------------------------------------------------------------------------

/** Matches a callout opening line: :::type or :::type{...} */
const CALLOUT_OPEN_RE = /^:::(note|warning|info|tip|caution|danger)(?:\{[^}]*\})?\s*$/;
/** Matches a bare ::: closing line */
const CALLOUT_CLOSE_RE = /^:::\s*$/;
/** Matches a markdown heading line */
const HEADING_RE = /^(#{1,6})\s+(.+?)\s*$/;
/** Code fence delimiter */
const FENCE_RE = /^(`{3,}|~{3,})/;

// ---------------------------------------------------------------------------
// Baseline loading
// ---------------------------------------------------------------------------

function loadBaseline() {
  const raw = readFileSync(join(REPO_ROOT, 'parity-baseline.json'), 'utf8');
  return JSON.parse(raw);
}

// ---------------------------------------------------------------------------
// Heading stack helpers (mirrors source_parity_segments_shared)
// ---------------------------------------------------------------------------

/**
 * Push a new heading onto the stack, dropping any headings of equal or
 * deeper level first. Returns a new array (immutable).
 * @param {Array<{level:number,text:string}>} stack
 * @param {number} level
 * @param {string} text
 * @returns {Array<{level:number,text:string}>}
 */
function pushHeading(stack, level, text) {
  const trimmed = (typeof text === 'string' ? text : '').trim();
  const kept = stack.filter((entry) => entry.level < level);
  return [...kept, { level, text: trimmed }];
}

/**
 * Build the ' > ' joined section path from a heading stack.
 * @param {Array<{level:number,text:string}>} stack
 * @returns {string}
 */
function buildSectionPath(stack) {
  return stack.map((e) => e.text).filter(Boolean).join(' > ');
}

// ---------------------------------------------------------------------------
// Frontmatter stripping
// ---------------------------------------------------------------------------

/**
 * Strip YAML frontmatter from lines. Returns body lines and the offset count.
 * @param {string[]} lines
 * @returns {{bodyLines: string[], offset: number}}
 */
function stripFrontmatter(lines) {
  if (lines.length === 0 || lines[0].trim() !== '---') {
    return { bodyLines: lines, offset: 0 };
  }
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      return { bodyLines: lines.slice(i + 1), offset: i + 1 };
    }
  }
  return { bodyLines: lines, offset: 0 };
}

// ---------------------------------------------------------------------------
// Callout block scanning
// ---------------------------------------------------------------------------

/**
 * Represents a callout block found in a JA markdown file.
 * @typedef {object} CalloutBlock
 * @property {number} openLine  - 1-based line number of ::: opening
 * @property {number} closeLine - 1-based line number of ::: closing
 * @property {string} type      - note|warning|info|tip|caution|danger
 * @property {string} body      - full body text (joined lines)
 * @property {string} sectionPath - section path at the time of the callout
 */

/**
 * Scan all callout blocks in a JA markdown file.
 * Returns the full list (document-order), with each block's sectionPath.
 *
 * @param {string} content - raw file content
 * @returns {CalloutBlock[]}
 */
function scanCallouts(content) {
  const rawLines = content.split('\n');
  const { bodyLines, offset } = stripFrontmatter(rawLines);

  const blocks = [];
  let headingStack = [];
  let firstH1Consumed = false;
  let inCodeFence = false;
  let inCallout = false;
  let calloutType = '';
  let calloutOpenLine = 0;
  let calloutBodyLines = [];
  let calloutSectionPath = '';

  for (let i = 0; i < bodyLines.length; i++) {
    const line = bodyLines[i];
    const trimmed = line.trim();
    const lineNo = i + 1 + offset; // 1-based, accounting for frontmatter

    // Code fence toggle — callouts inside fences are not real callouts
    if (FENCE_RE.test(trimmed)) {
      inCodeFence = !inCodeFence;
      continue;
    }
    if (inCodeFence) continue;

    // Callout close
    if (inCallout && CALLOUT_CLOSE_RE.test(trimmed)) {
      blocks.push({
        openLine: calloutOpenLine,
        closeLine: lineNo,
        type: calloutType,
        body: calloutBodyLines.join('\n'),
        sectionPath: calloutSectionPath,
      });
      inCallout = false;
      calloutType = '';
      calloutBodyLines = [];
      calloutSectionPath = '';
      continue;
    }

    // Inside callout — accumulate body lines
    if (inCallout) {
      if (trimmed !== '') calloutBodyLines.push(trimmed);
      continue;
    }

    // Heading — update stack
    const headingMatch = line.match(HEADING_RE);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2].trim();
      if (level === 1 && !firstH1Consumed) {
        firstH1Consumed = true;
        continue;
      }
      headingStack = pushHeading(headingStack, level, text);
      continue;
    }

    // Callout open — use match (not exec) to extract type
    if (CALLOUT_OPEN_RE.test(trimmed)) {
      const m = trimmed.match(CALLOUT_OPEN_RE);
      inCallout = true;
      calloutType = m ? m[1] : 'note';
      calloutOpenLine = lineNo;
      calloutBodyLines = [];
      calloutSectionPath = buildSectionPath(headingStack);
      continue;
    }
  }

  // Unterminated callout — include it anyway with closeLine=-1
  if (inCallout) {
    blocks.push({
      openLine: calloutOpenLine,
      closeLine: -1,
      type: calloutType,
      body: calloutBodyLines.join('\n'),
      sectionPath: calloutSectionPath,
    });
  }

  return blocks;
}

// ---------------------------------------------------------------------------
// Section-scoped callout lookup
// ---------------------------------------------------------------------------

/**
 * Get the leaf heading from a sectionPath string.
 * @param {string} sectionPath
 * @returns {string}
 */
function leafHeading(sectionPath) {
  const parts = sectionPath.split(' > ');
  return parts[parts.length - 1].trim();
}

/**
 * Find callouts in the JA file that belong to the section identified by
 * sectionPath, and return the one at position jaSegmentIndex.
 *
 * Strategy:
 * 1. Try to find the leaf heading from sectionPath in the file lines.
 *    Restrict scanning to the region from that heading until the next heading
 *    of equal or higher level.
 * 2. If the heading is not found, fall back to the entire document.
 * 3. Pick the callout at jaSegmentIndex. If out of range, pick the first
 *    and set mismatch=true.
 *
 * @param {CalloutBlock[]} allCallouts - all callouts in document order
 * @param {string[]} rawLines          - raw file lines (rawLines[lineNo-1] for 1-based)
 * @param {string} sectionPath         - EN sectionPath from baseline
 * @param {number} jaSegmentIndex      - 0-based index within the section
 * @param {number} totalLines          - total line count of file
 * @returns {{block: CalloutBlock|null, mismatch: boolean, sectionCalloutCount: number, headingResolved: boolean}}
 *
 * `headingResolved = false` は sectionPath が非 empty なのに JA 内で対応 heading を
 * 見つけられず whole-document fallback した危険状態。Round 1 の `administration/api-access`
 * 誤対象化 (preface の :::tip を目標にしてしまう) はこの silent fallback が直接原因。
 * 呼び出し側は unresolved を明示してプロセスを non-zero 終了する。
 */
function findCalloutForEntry(allCallouts, rawLines, sectionPath, jaSegmentIndex, totalLines) {
  let sectionCallouts;
  let headingResolved = true;

  if (!sectionPath) {
    // Empty sectionPath — document-root (fallback ではなく正当に whole document)
    sectionCallouts = allCallouts;
  } else {
    const leaf = leafHeading(sectionPath);
    // Find the heading line matching the leaf (exact text match)
    let sectionStartLine = -1;
    let sectionHeadingLevel = -1;

    for (let i = 0; i < rawLines.length; i++) {
      const trimmed = rawLines[i].trim();
      const hm = trimmed.match(HEADING_RE);
      if (hm) {
        const level = hm[1].length;
        const text = hm[2].trim();
        if (text === leaf) {
          sectionStartLine = i + 1; // 1-based
          sectionHeadingLevel = level;
          break;
        }
      }
    }

    if (sectionStartLine === -1) {
      // Heading not found — 対象 section を確定できない。whole-document fallback は不安全で、
      // api-access Round 1 で preface の :::tip を誤対象化した直接原因。
      headingResolved = false;
      sectionCallouts = allCallouts;
    } else {
      // Find end of section: next heading at equal or higher level (lower number)
      let sectionEndLine = totalLines + 1;
      for (let i = sectionStartLine; i < rawLines.length; i++) {
        const trimmed = rawLines[i].trim();
        const hm = trimmed.match(HEADING_RE);
        if (hm) {
          const level = hm[1].length;
          if (level <= sectionHeadingLevel) {
            sectionEndLine = i + 1; // 1-based
            break;
          }
        }
      }
      // Filter callouts that open inside the section region
      sectionCallouts = allCallouts.filter(
        (b) => b.openLine > sectionStartLine && b.openLine < sectionEndLine,
      );
    }
  }

  const sectionCalloutCount = sectionCallouts.length;
  let mismatch = false;
  let block = null;

  if (sectionCallouts.length === 0) {
    block = null;
  } else if (jaSegmentIndex < sectionCallouts.length) {
    block = sectionCallouts[jaSegmentIndex];
  } else {
    block = sectionCallouts[0];
    mismatch = true;
  }

  return { block, mismatch, sectionCalloutCount, headingResolved };
}

// ---------------------------------------------------------------------------
// Context lines helper
// ---------------------------------------------------------------------------

/**
 * Get 2 lines before and 2 lines after a callout block.
 * @param {string[]} rawLines  - all file lines (0-indexed)
 * @param {number} openLine    - 1-based opening line
 * @param {number} closeLine   - 1-based closing line
 * @returns {{before: string[], after: string[]}}
 */
function getContext(rawLines, openLine, closeLine) {
  const before = [];
  for (let i = openLine - 3; i <= openLine - 2; i++) {
    before.push(i >= 0 ? (rawLines[i] || '') : '');
  }
  const after = [];
  for (let i = closeLine; i <= closeLine + 1; i++) {
    after.push(i < rawLines.length ? (rawLines[i] || '') : '');
  }
  return { before, after };
}

// ---------------------------------------------------------------------------
// Body preview helper
// ---------------------------------------------------------------------------

/**
 * Truncate body to at most 400 chars, appending '…' if clipped.
 * @param {string} body
 * @returns {string}
 */
function previewBody(body) {
  if (body.length <= 400) return body;
  return body.slice(0, 400) + '\u2026';
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

/**
 * Slugs where Phase 2 Round 1 で UX 優先の intentional divergence として保持した
 * callout が存在する可能性がある (:::danger 等)。
 *
 * **注意:** このマーカーは「該当 callout が存在するかもしれない」シグナルであり、
 * classification (分類1/2/3) を固定するものではない。Round 1 では api-access の
 * `:::tip` を誤対象化して分類3を強制した失敗があった。Round 2 以降は baseline entry の
 * `jaSourceFingerprint` と JA md body の照合で対象 callout を先に確定させ、
 * その後で分類を決定すること。
 */
const UX_CARRYOVER_SLUGS = new Set(['administration/api-access']);

function main() {
  const baseline = loadBaseline();
  const targets = baseline.entries.filter(
    (e) => e.issueType === 'segment-extra' && e.segmentKind === 'callout-body',
  );

  // Group by slug: { slug -> entry[] }
  const bySlug = new Map();
  for (const e of targets) {
    if (!bySlug.has(e.slug)) bySlug.set(e.slug, []);
    bySlug.get(e.slug).push(e);
  }

  // Sort slugs by entry count descending, then alphabetically for ties
  const sortedSlugs = [...bySlug.entries()].sort((a, b) => {
    const diff = b[1].length - a[1].length;
    if (diff !== 0) return diff;
    return a[0].localeCompare(b[0]);
  });

  const outLines = [];
  /** @type {Array<{slug: string, sectionPath: string, jaSegmentIndex: number, jaSourceFingerprint: string|null, sectionCalloutCount: number}>} */
  const unresolvedEntries = [];
  outLines.push('# Phase 3 JA-only callouts (deterministic)');
  outLines.push('');
  outLines.push(`Total: ${targets.length} entries in ${bySlug.size} slugs`);
  outLines.push('');

  for (const [slug, entries] of sortedSlugs) {
    // Sort entries within slug by sectionPath then jaSegmentIndex
    const sortedEntries = [...entries].sort((a, b) => {
      const sp = a.sectionPath.localeCompare(b.sectionPath);
      if (sp !== 0) return sp;
      return a.jaSegmentIndex - b.jaSegmentIndex;
    });

    const uxCarryoverMarker = UX_CARRYOVER_SLUGS.has(slug)
      ? ' **[UX-CARRYOVER: Phase 2 UX保護 callout が別にある可能性。分類は fingerprint 照合後に決定]**'
      : '';

    outLines.push(`## ${slug} (${entries.length} entries)${uxCarryoverMarker}`);
    outLines.push(`- file: src/content/docs/${slug}.md`);
    outLines.push(`- EN snapshot: snapshots/en/content/${slug}.html`);

    // Load JA file
    const filePath = join(DOCS_DIR, `${slug}.md`);
    let content;
    try {
      content = readFileSync(filePath, 'utf8');
    } catch {
      outLines.push(`- **ERROR: file not found: ${filePath}**`);
      outLines.push('');
      continue;
    }
    const rawLines = content.split('\n');
    const allCallouts = scanCallouts(content);
    outLines.push(`- total callouts in JA: ${allCallouts.length}`);
    outLines.push('');

    for (let i = 0; i < sortedEntries.length; i++) {
      const entry = sortedEntries[i];
      const { block, mismatch, sectionCalloutCount, headingResolved } = findCalloutForEntry(
        allCallouts,
        rawLines,
        entry.sectionPath,
        entry.jaSegmentIndex,
        rawLines.length,
      );

      if (!headingResolved) {
        unresolvedEntries.push({
          slug,
          sectionPath: entry.sectionPath,
          jaSegmentIndex: entry.jaSegmentIndex,
          jaSourceFingerprint: entry.jaSourceFingerprint,
          sectionCalloutCount,
        });
      }

      outLines.push(`### entry[${i}] jaSegmentIndex=${entry.jaSegmentIndex}`);
      outLines.push(
        `- sectionPath: ${entry.sectionPath ? entry.sectionPath : '(document-root)'}`,
      );
      outLines.push(`- jaSourceFingerprint: ${entry.jaSourceFingerprint ?? 'null'}`);
      if (!headingResolved) {
        outLines.push(
          '- **⚠ HEADING-NOT-FOUND (UNSAFE FALLBACK):** EN の sectionPath が JA md 内に一致しません。',
        );
        outLines.push(
          '  - 下記の `line range` / `body` は whole-document fallback の結果で、**別 section の callout を誤対象化している可能性**があります。',
        );
        outLines.push(
          '  - Round 2 作業前に `jaSourceFingerprint` と JA md body の照合で対象を再特定してください。script exit は非零になります。',
        );
      }

      if (!block) {
        outLines.push(`- callout type: (not found — sectionCalloutCount=${sectionCalloutCount})`);
        outLines.push('- line range: (not found)');
        outLines.push('- body:');
        outLines.push('  ```');
        outLines.push('  (no callout found)');
        outLines.push('  ```');
        outLines.push('- context before: (blank) / (blank)');
        outLines.push('- context after: (blank) / (blank)');
      } else {
        const mismatchNote = mismatch ? ' \u26a0 (index out of range, fell back to first)' : '';
        const fallbackNote = !headingResolved ? ' \u26a0 (whole-document fallback; 対象未確定)' : '';
        outLines.push(`- callout type: :::${block.type}${fallbackNote}`);
        const closeLabel = block.closeLine === -1 ? '(unterminated)' : String(block.closeLine);
        outLines.push(`- line range: L${block.openLine}-L${closeLabel}${mismatchNote}`);
        outLines.push('- body:');
        outLines.push('  ```');
        const preview = previewBody(block.body);
        for (const bodyLine of preview.split('\n')) {
          outLines.push(`  ${bodyLine}`);
        }
        outLines.push('  ```');

        const effectiveClose = block.closeLine === -1 ? block.openLine : block.closeLine;
        const ctx = getContext(rawLines, block.openLine, effectiveClose);
        const beforeStr = ctx.before.map((l) => l.trim() || '(blank)').join(' / ');
        const afterStr = ctx.after.map((l) => l.trim() || '(blank)').join(' / ');
        outLines.push(`- context before: ${beforeStr}`);
        outLines.push(`- context after: ${afterStr}`);
      }
      outLines.push('');
    }
  }

  // stdout: banner first when unresolved exists, then body
  const banner = [];
  if (unresolvedEntries.length > 0) {
    banner.push('> \u26a0\u26a0\u26a0 **UNSAFE OUTPUT — DO NOT USE FOR EDITING** \u26a0\u26a0\u26a0');
    banner.push('>');
    banner.push(`> enumerate v1 は ${unresolvedEntries.length} / ${targets.length} entries で heading resolver が失敗し、whole-document fallback しています。`);
    banner.push('>');
    banner.push('> Round 1 の `administration/api-access` 誤対象化 (preface `:::tip` を `API keys management` section 対象として扱ってしまった) と同じ失敗モードです。');
    banner.push('>');
    banner.push('> **対応が必要:** `jaSourceFingerprint` 突き合わせを含む enumerate v2 で Round 2 を進めてください。詳細は plan の `Round 1 Post-mortem` セクションを参照。');
    banner.push('>');
    banner.push('> 該当 entries:');
    for (const u of unresolvedEntries) {
      banner.push(`> - ${u.slug} | sectionPath=${u.sectionPath} | jaSegmentIndex=${u.jaSegmentIndex} | fp=${u.jaSourceFingerprint ?? 'null'}`);
    }
    banner.push('');
  }
  process.stdout.write(banner.join('\n'));
  process.stdout.write(outLines.join('\n') + '\n');

  if (unresolvedEntries.length > 0) {
    process.stderr.write(
      `\n[enumerate v1] UNSAFE: ${unresolvedEntries.length} / ${targets.length} entries had heading-not-found fallback. ` +
      `Exiting with status 1. Use enumerate v2 (see plan).\n`,
    );
    process.exit(1);
  }
}

main();
