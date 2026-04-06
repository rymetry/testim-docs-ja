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

/**
 * Split a pipe table row into trimmed cells, ignoring the leading/trailing
 * pipe characters.
 */
function splitTableCells(line) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|\s*$/, '')
    .split('|')
    .map((cell) => cell.trim());
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
 * @param {string} body  markdown content (without frontmatter handled below)
 * @returns {import('./source_parity_segments_shared.mjs').Segment[]}
 */
export function extractSegmentsFromMarkdown(body) {
  if (typeof body !== 'string') return [];

  const rawLines = body.split('\n');
  const lines = stripFrontmatter(rawLines);

  const emitter = makeEmitter();
  let headingStack = [];
  let firstH1Consumed = false;

  // Paragraph accumulator (outside callouts)
  let paragraphBuf = [];
  let paragraphStartLine = 0;

  // Callout state
  let inCallout = false;
  let calloutBuf = [];
  let calloutStartLine = 0;

  // Details state (for summary extraction only)
  let inDetails = false;

  // Code fence state
  let inCodeFence = false;
  let codeFenceStartLine = 0;
  let codeFenceBuf = [];

  const flushParagraph = () => {
    if (paragraphBuf.length === 0) return;
    const path = buildSectionPath(headingStack);
    emitter.emit(path, 'paragraph', paragraphBuf.join(' '), paragraphStartLine);
    paragraphBuf = [];
  };

  const flushCalloutBody = () => {
    if (calloutBuf.length === 0) return;
    const path = buildSectionPath(headingStack);
    emitter.emit(path, 'callout-body', calloutBuf.join(' '), calloutStartLine);
    calloutBuf = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const lineNo = i + 1 + (rawLines.length - lines.length);

    // Code fence toggling — handled outside everything else
    if (FENCE_RE.test(trimmed)) {
      if (!inCodeFence) {
        flushParagraph();
        if (inCallout) flushCalloutBody();
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
      const startIdx = i;
      let endIdx = -1;
      for (let j = i; j < lines.length; j++) {
        if (HTML_TABLE_CLOSE_RE.test(lines[j])) {
          endIdx = j;
          break;
        }
      }
      if (endIdx !== -1) {
        const tableHtml = lines.slice(startIdx, endIdx + 1).join('\n');
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

    // Details block — only the <summary> inside is emitted as a segment kind
    if (DETAILS_OPEN_RE.test(trimmed)) {
      flushParagraph();
      inDetails = true;
      continue;
    }
    if (inDetails && DETAILS_CLOSE_RE.test(trimmed)) {
      inDetails = false;
      continue;
    }
    if (inDetails) {
      const summaryMatch = line.match(SUMMARY_RE);
      if (summaryMatch) {
        const path = buildSectionPath(headingStack);
        emitter.emit(path, 'details-summary', summaryMatch[1].trim(), lineNo);
      } else if (trimmed) {
        // Treat plain text inside <details> as paragraph content
        paragraphBuf.push(trimmed);
        if (paragraphBuf.length === 1) paragraphStartLine = lineNo;
      } else {
        flushParagraph();
      }
      continue;
    }

    // Callout open/close
    if (!inCallout && CALLOUT_OPEN_RE.test(trimmed)) {
      flushParagraph();
      inCallout = true;
      calloutBuf = [];
      calloutStartLine = lineNo;
      continue;
    }
    if (inCallout && CALLOUT_CLOSE_RE.test(trimmed)) {
      flushCalloutBody();
      inCallout = false;
      continue;
    }

    if (inCallout) {
      if (trimmed === '') {
        flushCalloutBody();
        continue;
      }
      if (calloutBuf.length === 0) calloutStartLine = lineNo;
      calloutBuf.push(trimmed);
      continue;
    }

    // Headings — flush buffered paragraph, update stack, emit heading segment
    const headingMatch = line.match(HEADING_RE);
    if (headingMatch) {
      flushParagraph();
      const level = headingMatch[1].length;
      // Strip Astro-style anchor suffix: "## Title {#anchor-id}" → "Title"
      const text = headingMatch[2].replace(/\s*\{#[^}]*\}\s*$/, '').trim();
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
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      flushParagraph();
      continue;
    }

    // Blank line terminates a paragraph
    if (trimmed === '') {
      flushParagraph();
      continue;
    }

    // Default: part of a paragraph run
    if (paragraphBuf.length === 0) paragraphStartLine = lineNo;
    paragraphBuf.push(trimmed);
  }

  // Flush any trailing state
  if (inCallout) flushCalloutBody();
  flushParagraph();

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
