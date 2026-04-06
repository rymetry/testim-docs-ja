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
import { extractSegmentsFromHtml } from './source_parity_segments_en.mjs';

const FENCE_RE = /^(`{3,}|~{3,})/;
const HEADING_RE = /^(#{1,6})\s+(.+?)\s*$/;
const CALLOUT_OPEN_RE = /^:::(note|warning|info|tip|caution|danger)(?:\{[^}]*\})?\s*$/;
const CALLOUT_CLOSE_RE = /^:::\s*$/;
const DETAILS_TOKEN_RE = /<\/?details\b|<summary\b/i;
const DETAILS_OPEN_PREFIX_RE = /^<details\b/i;
const DETAILS_CLOSE_PREFIX_RE = /^<\/details\s*>/i;
const SUMMARY_OPEN_PREFIX_RE = /^<summary\b/i;
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
 * Find the closing `>` of an HTML tag starting at `start`, respecting
 * quoted attribute values so `<details data-x="1>0">` is tokenized
 * correctly. Mirrors the same helper in the EN extractor.
 */
function findTagEnd(text, start) {
  let quote = null;
  for (let i = start; i < text.length; i += 1) {
    const ch = text[i];
    if (quote) {
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }
    if (ch === '>') return i;
  }
  return -1;
}

/**
 * Scan a string for the `</summary>` close tag that matches an open at
 * nesting depth `startDepth`. Walks character-by-character respecting
 * quoted attribute values (via findTagEnd), increments depth on nested
 * `<summary>` opens, decrements on `</summary>` closes, and returns the
 * position of the close where depth reaches zero.
 *
 * @param {string} text
 * @param {number} startDepth  initial depth (typically 1 when called
 *                             immediately after consuming an outer
 *                             `<summary>` opening tag)
 * @returns {{depth:number, closePos:number, closeLen:number}}
 *   - `closePos = -1` if no matching close is found in `text`
 *   - `depth` is the final depth (useful for cross-line accumulation)
 */
function scanForMatchingSummaryClose(text, startDepth) {
  let depth = startDepth;
  let i = 0;
  const n = text.length;
  while (i < n) {
    if (text[i] !== '<') {
      i += 1;
      continue;
    }
    const tail = text.slice(i);
    // </summary> close — candidate for depth decrement
    const closeMatch = tail.match(/^<\/summary\s*>/i);
    if (closeMatch) {
      depth -= 1;
      if (depth === 0) {
        return { depth, closePos: i, closeLen: closeMatch[0].length };
      }
      i += closeMatch[0].length;
      continue;
    }
    // <summary> open — nested; increment depth and skip past the tag
    if (/^<summary\b/i.test(tail)) {
      depth += 1;
      const tagEnd = findTagEnd(text, i + 1);
      if (tagEnd === -1) return { depth, closePos: -1, closeLen: 0 };
      i = tagEnd + 1;
      continue;
    }
    // Any other tag — skip past it respecting quoted attribute values
    if (tail.startsWith('</') || /^<[a-zA-Z]/.test(tail)) {
      const tagEnd = findTagEnd(text, i + 1);
      if (tagEnd === -1) {
        i += 1;
        continue;
      }
      i = tagEnd + 1;
      continue;
    }
    // Stray '<' — treat as text
    i += 1;
  }
  return { depth, closePos: -1, closeLen: 0 };
}

/**
 * @typedef {{type:'text', value:string}
 *          | {type:'details-open'}
 *          | {type:'summary', inner:string}
 *          | {type:'summary-open', initialInner:string}
 *          | {type:'details-close'}} DetailsLineEvent
 */

/**
 * Tokenize a markdown line into an ordered sequence of events so that
 * `<details>` / `<summary>` / `</details>` tokens and their surrounding
 * plain text can be processed left-to-right. This lets condensed one-liners
 * like `Lead <details><summary>Q</summary></details> tail` emit both the
 * surrounding paragraph text and the details-summary segment in the
 * correct order, matching the EN walker.
 *
 * The scanner is quote-aware via `findTagEnd`, so attribute values that
 * contain ">" (e.g. `data-x="1>0"`) do not split the opening tag
 * mid-attribute.
 *
 * @param {string} line
 * @returns {DetailsLineEvent[]}
 */
function tokenizeDetailsLine(line) {
  /** @type {DetailsLineEvent[]} */
  const events = [];
  const n = line.length;
  let cursor = 0;
  let i = 0;

  const emitPendingText = (upto) => {
    if (upto > cursor) {
      events.push({ type: 'text', value: line.slice(cursor, upto) });
    }
  };

  while (i < n) {
    if (line[i] !== '<') {
      i += 1;
      continue;
    }
    const tail = line.slice(i);

    // </details ...>
    const closeMatch = tail.match(DETAILS_CLOSE_PREFIX_RE);
    if (closeMatch) {
      emitPendingText(i);
      events.push({ type: 'details-close' });
      i += closeMatch[0].length;
      cursor = i;
      continue;
    }

    // <details ...> with quote-aware end scan
    if (DETAILS_OPEN_PREFIX_RE.test(tail)) {
      const tagEnd = findTagEnd(line, i + 1);
      if (tagEnd === -1) break;
      emitPendingText(i);
      events.push({ type: 'details-open' });
      i = tagEnd + 1;
      cursor = i;
      continue;
    }

    // <summary ...>INNER</summary> with quote-aware open-tag end scan and
    // nesting-aware close matching. Nested <summary> tags are counted so
    // the inner close does not prematurely terminate the outer range.
    if (SUMMARY_OPEN_PREFIX_RE.test(tail)) {
      const openEnd = findTagEnd(line, i + 1);
      if (openEnd === -1) break;
      const afterOpen = line.slice(openEnd + 1);
      const scan = scanForMatchingSummaryClose(afterOpen, 1);
      if (scan.closePos === -1) {
        // No matching close on this line — enter multi-line state. Carry
        // the current nesting depth forward so subsequent lines continue
        // to track nested <summary> pairs correctly.
        emitPendingText(i);
        events.push({
          type: 'summary-open',
          initialInner: afterOpen,
          initialDepth: scan.depth,
        });
        cursor = line.length;
        i = line.length;
        break;
      }
      emitPendingText(i);
      const innerText = afterOpen.slice(0, scan.closePos);
      events.push({ type: 'summary', inner: innerText });
      i = openEnd + 1 + scan.closePos + scan.closeLen;
      cursor = i;
      continue;
    }

    // Not a details/summary tag — keep scanning.
    i += 1;
  }

  if (cursor < n) {
    events.push({ type: 'text', value: line.slice(cursor) });
  }
  return events;
}

/**
 * Decode the subset of HTML entities that appear in MadCap Flare output and
 * in JA-authored inline HTML. Kept deliberately small — we match what the EN
 * walker's decodeEntities covers for the same tag vocabulary.
 */
function decodeHtmlEntities(text) {
  return text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'");
}

/**
 * Convert an HTML inline fragment to markdown-ish plain text, preserving the
 * invariant-token-bearing constructs (`<a href>` and `<code>`) as markdown
 * link / inline-code syntax so createSegment's extractInvariantTokens picks
 * them up. Other tags are stripped but their inner text is preserved.
 *
 * This mirrors the EN walker's renderInlineText behaviour so segments on
 * both sides expose the same invariant token set.
 *
 * Rewrite order matters: `<code>` must be converted to backticks BEFORE
 * `<a>`. Otherwise the `<a>` branch's tag-strip step would drop the
 * backticks for constructs like `<a href="X"><code>Y</code></a>`, losing
 * the inline-code invariant token. With the correct order, the `<a>` inner
 * is already `` `Y` `` when the link regex runs, so the backticks survive
 * into the final markdown.
 */
function htmlInlineToMarkdownText(html) {
  if (typeof html !== 'string') return '';
  let text = html;

  // <code>Z</code> → `Z` (run first so nesting inside <a> is preserved).
  text = text.replace(/<code\b[^>]*>([\s\S]*?)<\/code>/gi, (_match, inner) => {
    return `\`${inner.replace(/<[^>]+>/g, '').trim()}\``;
  });

  // <a href="X">Y</a> → [Y](X) (skip #fragment-only and javascript: hrefs).
  text = text.replace(
    /<a\b[^>]*\bhref\s*=\s*["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi,
    (_match, href, inner) => {
      // Strip any remaining non-code tags from the label, but preserve the
      // backtick characters emitted by the code rewrite above.
      const label = inner.replace(/<[^>]+>/g, '').trim();
      if (!href || href.startsWith('#') || href.startsWith('javascript:')) {
        return label;
      }
      return `[${label}](${href})`;
    },
  );

  // Strip any remaining tags
  text = text.replace(/<[^>]+>/g, ' ');

  // Decode entities and collapse whitespace
  text = decodeHtmlEntities(text).replace(/\s+/g, ' ').trim();
  return text;
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
    const text = htmlInlineToMarkdownText(match[1]);
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

  // <details> nesting state. When we enter a <details>, paragraphKind flips
  // to 'paragraph' (EN walkDetails → walkBlock emits regular paragraphs even
  // when the <details> is inside a callout). We save/restore the outer kind
  // across the boundary so trailing callout text still classifies correctly.
  let detailsDepth = 0;
  const detailsKindStack = [];

  // Multi-line <summary> accumulator. When the tokenizer sees a <summary>
  // opening tag with no matching close on the same line, subsequent lines
  // are buffered here until the *matching* outer `</summary>` is found.
  // `multilineSummaryDepth` tracks nested <summary> pairs across lines so
  // an inner close does not prematurely terminate the outer range.
  let inMultilineSummary = false;
  let multilineSummaryBuf = [];
  let multilineSummaryStartLine = 0;
  let multilineSummaryDepth = 1;

  /**
   * Emit the contents of a loose (outside `<details>`) summary fragment
   * by delegating to the EN walker. EN's walkBlockContainer fallback
   * handles element children (img, ul/ol, table, …) via the full
   * classifier, so child elements keep their proper segment kinds and
   * quoted attribute values with `>` are tokenized safely. The returned
   * segments are re-emitted through the JA emitter so they inherit the
   * current JA sectionPath and per-kind index counters.
   */
  const emitLooseSummaryInner = (innerHtml, startLineNo) => {
    const enSegments = extractSegmentsFromHtml(innerHtml);
    const pathAtLine = buildSectionPath(headingStack);
    for (const seg of enSegments) {
      // The EN walker embeds its own raw text via createSegment; re-emit
      // through the JA emitter using textNorm as the raw text so the
      // resulting segment fingerprint / token extraction is consistent
      // with other JA-side paragraphs.
      emitter.emit(pathAtLine, seg.segmentKind, seg.textNorm, startLineNo);
    }
  };

  const flushMultilineSummary = (closingLineNo) => {
    const joined = multilineSummaryBuf.join(' ');
    const startLine = multilineSummaryStartLine || closingLineNo;
    if (detailsDepth > 0) {
      const summaryText = htmlInlineToMarkdownText(joined);
      if (summaryText.length > 0) {
        const pathAtClose = buildSectionPath(headingStack);
        emitter.emit(pathAtClose, 'details-summary', summaryText, startLine);
      }
    } else {
      emitLooseSummaryInner(joined, startLine);
    }
    inMultilineSummary = false;
    multilineSummaryBuf = [];
    multilineSummaryStartLine = 0;
    multilineSummaryDepth = 1;
  };

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

    // Multi-line <summary> accumulator. Tracks nested <summary> depth
    // across lines so inner close tags do not prematurely terminate the
    // outer range. Trailing content after the matching outer close is
    // fed back into the main loop by mutating lines[i] + `i -= 1`.
    if (inMultilineSummary) {
      const scan = scanForMatchingSummaryClose(line, multilineSummaryDepth);
      if (scan.closePos === -1) {
        multilineSummaryBuf.push(line);
        multilineSummaryDepth = scan.depth;
        continue;
      }
      multilineSummaryBuf.push(line.slice(0, scan.closePos));
      flushMultilineSummary(lineNo);
      const remainder = line.slice(scan.closePos + scan.closeLen);
      if (remainder.trim().length > 0) {
        lines[i] = remainder;
        i -= 1;
      }
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

    // <details> / <summary> / </details> tokens on this line are handled
    // left-to-right so condensed one-liners like
    //   Lead <details><summary>Q</summary></details> tail
    // emit the surrounding plain text as paragraph (or callout-body inside
    // a callout) while the depth stack is pushed and popped in order and
    // the summary is extracted. paragraphKind is saved/restored across
    // each <details> boundary so a details block inside a :::note does
    // not leak 'callout-body' into the inner paragraphs.
    if (DETAILS_TOKEN_RE.test(line)) {
      flushParagraph();
      const events = tokenizeDetailsLine(line);
      const pathAtLine = buildSectionPath(headingStack);
      for (const ev of events) {
        if (ev.type === 'text') {
          const textSpan = ev.value.trim();
          if (textSpan.length > 0) {
            // Emit as the CURRENT paragraphKind so text between <details>
            // boundaries (if present) is classified as plain 'paragraph',
            // while text outside stays at the caller's kind (e.g.
            // 'callout-body' inside a :::note).
            emitter.emit(buildSectionPath(headingStack), paragraphKind, textSpan, lineNo);
          }
          continue;
        }
        if (ev.type === 'details-open') {
          detailsKindStack.push(paragraphKind);
          paragraphKind = 'paragraph';
          detailsDepth += 1;
          continue;
        }
        if (ev.type === 'summary') {
          if (detailsDepth > 0) {
            // Inside a <details> — emit a single details-summary segment
            // with markdown-converted inline content so link/code invariant
            // tokens survive.
            const summaryText = htmlInlineToMarkdownText(ev.inner);
            if (summaryText.length > 0) {
              emitter.emit(pathAtLine, 'details-summary', summaryText, lineNo);
            }
          } else {
            // Loose <summary> outside any <details> — delegate the inner
            // fragment to the EN walker so element children (img, ul, ol,
            // table, …) keep their proper segment kinds, quoted attributes
            // with ">" are handled correctly, and every text child becomes
            // its own 'paragraph' segment. Re-emit through the JA emitter
            // so the segments inherit the current JA sectionPath.
            emitLooseSummaryInner(ev.inner, lineNo);
          }
          continue;
        }
        if (ev.type === 'summary-open') {
          inMultilineSummary = true;
          multilineSummaryBuf = [ev.initialInner];
          multilineSummaryStartLine = lineNo;
          // Carry depth forward: the tokenizer already counted any nested
          // <summary> opens/closes in the initial inner content.
          multilineSummaryDepth = ev.initialDepth ?? 1;
          continue;
        }
        if (ev.type === 'details-close') {
          if (detailsDepth > 0) {
            detailsDepth -= 1;
            paragraphKind = detailsKindStack.pop() ?? 'paragraph';
          }
          continue;
        }
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
  if (inMultilineSummary) {
    // Unterminated multi-line summary — emit what we have as a best-effort.
    flushMultilineSummary(lines.length + lineOffset);
  }
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
