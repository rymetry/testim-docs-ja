/**
 * JA markdown canonical segment extractor (Issue #225 Phase 4).
 *
 * Walks a JA markdown document and emits a flat sequence of Segment records
 * for the future Phase 5 exact diff engine. The extractor is deliberately
 * conservative: kinds it cannot confidently classify are skipped so that
 * gate-eligible segments stay clean.
 *
 * @module source_parity_segments_ja
 */

import { createSegment, pushHeading, buildSectionPath } from './source_parity_segments_shared.mjs';

const FENCE_RE = /^(`{3,}|~{3,})/;
const HEADING_RE = /^(#{1,6})\s+(.+?)\s*$/;
const CALLOUT_OPEN_RE = /^:::(note|warning|info|tip|caution|danger)(?:\{[^}]*\})?\s*$/;
const CALLOUT_CLOSE_RE = /^:::\s*$/;
const DETAILS_OPEN_RE = /^<details\b/i;
const DETAILS_CLOSE_RE = /^<\/details>\s*$/i;
const SUMMARY_RE = /<summary\b[^>]*>([\s\S]*?)<\/summary>/i;
const IMAGE_RE = /^(?:!\[[^\]]*\]\([^)]+\)|<Image\b|<img\b)/i;
const UNORDERED_RE = /^(\s*)[-*+]\s+(.+)$/;
const ORDERED_RE = /^(\s*)\d+\.\s+(.+)$/;
const TABLE_ROW_RE = /^\|.+\|\s*$/;
const TABLE_SEPARATOR_RE = /^\|\s*:?-+:?\s*(?:\|\s*:?-+:?\s*)+\|\s*$/;
const HTML_TABLE_OPEN_RE = /^<table\b/i;
const HTML_TABLE_CLOSE_RE = /<\/table>/i;
const HORIZONTAL_RULE_RE = /^(-{3,}|\*{3,}|_{3,})$/;
const ANCHOR_SUFFIX_RE = /\s*\{#[^}]*\}\s*$/;

/**
 * Split a pipe table row into trimmed cells. Respects backslash-escaped pipes
 * (`\|`) inside cell content so table rows with literal pipe characters are
 * not over-split into phantom columns.
 */
function splitTableCells(line) {
  const trimmedRow = line.trim().replace(/^\|/, '').replace(/\|\s*$/, '');
  const cells = [];
  let current = '';
  for (let i = 0; i < trimmedRow.length; i++) {
    const ch = trimmedRow[i];
    if (ch === '\\' && trimmedRow[i + 1] === '|') {
      current += '|';
      i += 1;
      continue;
    }
    if (ch === '|') {
      cells.push(current.trim());
      current = '';
      continue;
    }
    current += ch;
  }
  cells.push(current.trim());
  return cells;
}

/**
 * Extract `<td>` cell text blocks from an HTML table block. Only cells inside
 * `<tbody>` contribute (header `<th>` inside `<thead>` is skipped for parity
 * with the EN extractor). If no explicit `<tbody>` is present, all `<tr><td>`
 * pairs are included.
 */
function extractHtmlTableCells(tableHtml) {
  const cells = [];
  const hasTbody = /<tbody\b/i.test(tableHtml);
  const bodyHtml = hasTbody
    ? (tableHtml.match(/<tbody\b[^>]*>([\s\S]*?)<\/tbody>/i)?.[1] ?? '')
    : tableHtml.replace(/<thead\b[\s\S]*?<\/thead>/gi, '');
  const tdPattern = /<td\b[^>]*>([\s\S]*?)<\/td>/gi;
  for (const match of bodyHtml.matchAll(tdPattern)) {
    const rawInner = match[1];
    // Strip nested HTML tags, keeping inner text; decode common entities.
    const text = rawInner
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/\s+/g, ' ')
      .trim();
    if (text.length > 0) cells.push(text);
  }
  return cells;
}

/**
 * Emit a single segment via a mutable emitter helper that tracks per-section
 * segmentIndex counters.
 */
function makeEmitter() {
  const counters = new Map();
  const segments = [];

  return {
    segments,
    emit(sectionPath, kind, rawText, line) {
      if (typeof rawText !== 'string' || rawText.trim() === '') return;
      const key = `${sectionPath}\u0000${kind}`;
      const index = counters.get(key) ?? 0;
      counters.set(key, index + 1);
      segments.push(
        createSegment({
          sectionPath,
          kind,
          segmentIndex: index,
          rawText,
          line: line ?? null,
        }),
      );
    },
  };
}

/**
 * Extract canonical segments from a JA markdown document body.
 *
 * The main loop uses a `paragraphKind` variable to decide whether an
 * accumulated plain-text run should be emitted as `paragraph` or as
 * `callout-body`. Inside `:::note`/`:::caution` blocks `paragraphKind`
 * flips to `callout-body`, so list items / images / tables still reach
 * the normal classification path and keep their proper segment kinds —
 * matching the EN walker's `walkCalloutBody` behavior.
 *
 * `<details>` / `</details>` lines are treated as block boundaries: only
 * the `<summary>` is extracted as a `details-summary` segment; everything
 * else inside flows through normal classification (again matching EN).
 *
 * @param {string} body  markdown content (frontmatter is stripped internally)
 * @returns {import('./source_parity_segments_shared.mjs').Segment[]}
 */
export function extractSegmentsFromMarkdown(body) {
  if (typeof body !== 'string') return [];

  const rawLines = body.split('\n');
  const lines = stripFrontmatter(rawLines);
  const lineOffset = rawLines.length - lines.length;

  const emitter = makeEmitter();
  let headingStack = [];
  let firstH1Consumed = false;

  // Paragraph accumulator — the emit kind depends on `paragraphKind`.
  let paragraphBuf = [];
  let paragraphStartLine = 0;
  let paragraphKind = 'paragraph';

  // Callout state: only tracks whether we are currently inside a ::: block.
  let inCallout = false;

  // Code fence state
  let inCodeFence = false;
  let codeFenceStartLine = 0;
  let codeFenceBuf = [];

  const flushParagraph = () => {
    if (paragraphBuf.length === 0) return;
    const path = buildSectionPath(headingStack);
    emitter.emit(path, paragraphKind, paragraphBuf.join(' '), paragraphStartLine);
    paragraphBuf = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const lineNo = i + 1 + lineOffset;

    // Code fence toggling — handled outside everything else
    if (FENCE_RE.test(trimmed)) {
      if (!inCodeFence) {
        flushParagraph();
        inCodeFence = true;
        codeFenceStartLine = lineNo;
        codeFenceBuf = [];
      } else {
        inCodeFence = false;
        const path = buildSectionPath(headingStack);
        emitter.emit(path, 'code-block', codeFenceBuf.join('\n'), codeFenceStartLine);
        codeFenceBuf = [];
      }
      continue;
    }
    if (inCodeFence) {
      codeFenceBuf.push(line);
      continue;
    }

    // HTML table block — scan forward to </table>, extract tbody td cells.
    if (HTML_TABLE_OPEN_RE.test(trimmed)) {
      flushParagraph();
      let endIdx = -1;
      for (let j = i; j < lines.length; j++) {
        if (HTML_TABLE_CLOSE_RE.test(lines[j])) {
          endIdx = j;
          break;
        }
      }
      if (endIdx !== -1) {
        const tableHtml = lines.slice(i, endIdx + 1).join('\n');
        const cells = extractHtmlTableCells(tableHtml);
        const path = buildSectionPath(headingStack);
        for (const cell of cells) {
          emitter.emit(path, 'table-cell', cell, lineNo);
        }
        i = endIdx;
        continue;
      }
      // Unterminated — fall through to normal paragraph handling
    }

    // <details> open/close are treated as block boundaries. Only the
    // <summary> line is special-cased; other nested content flows through
    // normal classification so lists/tables/images keep their proper kinds.
    if (DETAILS_OPEN_RE.test(trimmed) || DETAILS_CLOSE_RE.test(trimmed)) {
      flushParagraph();
      continue;
    }
    const summaryMatch = line.match(SUMMARY_RE);
    if (summaryMatch) {
      flushParagraph();
      const summaryText = summaryMatch[1].replace(/<[^>]+>/g, '').trim();
      if (summaryText.length > 0) {
        const path = buildSectionPath(headingStack);
        emitter.emit(path, 'details-summary', summaryText, lineNo);
      }
      continue;
    }

    // Callout open/close — switch paragraphKind between 'paragraph' and
    // 'callout-body' without short-circuiting the rest of the classifier.
    if (!inCallout && CALLOUT_OPEN_RE.test(trimmed)) {
      flushParagraph();
      inCallout = true;
      paragraphKind = 'callout-body';
      continue;
    }
    if (inCallout && CALLOUT_CLOSE_RE.test(trimmed)) {
      flushParagraph();
      inCallout = false;
      paragraphKind = 'paragraph';
      continue;
    }

    // Headings — flush buffered paragraph, update stack, emit heading segment
    const headingMatch = line.match(HEADING_RE);
    if (headingMatch) {
      flushParagraph();
      const level = headingMatch[1].length;
      // Strip Astro-style anchor suffix: "## Title {#anchor-id}" → "Title"
      const text = headingMatch[2].replace(ANCHOR_SUFFIX_RE, '').trim();
      if (level === 1 && !firstH1Consumed) {
        firstH1Consumed = true;
        // Title — do not emit as a heading segment, do not push to stack
        continue;
      }
      headingStack = pushHeading(headingStack, level, text);
      const path = buildSectionPath(headingStack);
      emitter.emit(path, 'heading', text, lineNo);
      continue;
    }

    // Standalone image line
    if (IMAGE_RE.test(trimmed)) {
      flushParagraph();
      const path = buildSectionPath(headingStack);
      emitter.emit(path, 'image', trimmed, lineNo);
      continue;
    }

    // Table row (with separator detection)
    if (TABLE_ROW_RE.test(trimmed)) {
      flushParagraph();
      if (TABLE_SEPARATOR_RE.test(trimmed)) continue;
      // Skip header rows: detected when the next line is the separator row
      const next = (lines[i + 1] || '').trim();
      if (TABLE_SEPARATOR_RE.test(next)) continue;
      const cells = splitTableCells(trimmed);
      const path = buildSectionPath(headingStack);
      for (const cell of cells) {
        emitter.emit(path, 'table-cell', cell, lineNo);
      }
      continue;
    }

    // Ordered list item
    const orderedMatch = line.match(ORDERED_RE);
    if (orderedMatch) {
      flushParagraph();
      const path = buildSectionPath(headingStack);
      emitter.emit(path, 'ordered-list-item', orderedMatch[2], lineNo);
      continue;
    }

    // Unordered list item
    const unorderedMatch = line.match(UNORDERED_RE);
    if (unorderedMatch) {
      flushParagraph();
      const path = buildSectionPath(headingStack);
      emitter.emit(path, 'unordered-list-item', unorderedMatch[2], lineNo);
      continue;
    }

    // Horizontal rule — not a content segment; EN emits nothing for <hr/>
    if (HORIZONTAL_RULE_RE.test(trimmed)) {
      flushParagraph();
      continue;
    }

    // Blank line terminates a paragraph
    if (trimmed === '') {
      flushParagraph();
      continue;
    }

    // Default: part of a paragraph (or callout-body, depending on context)
    if (paragraphBuf.length === 0) paragraphStartLine = lineNo;
    paragraphBuf.push(trimmed);
  }

  // Flush any trailing state (restore paragraphKind so final flush is sane)
  if (inCallout) {
    flushParagraph();
    paragraphKind = 'paragraph';
  } else {
    flushParagraph();
  }

  return emitter.segments;
}

/**
 * Strip YAML frontmatter if present. Returns the body lines without the
 * leading `---...---` block.
 */
function stripFrontmatter(lines) {
  if (lines.length === 0 || lines[0].trim() !== '---') return lines;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') return lines.slice(i + 1);
  }
  return lines;
}
