/**
 * EN HTML direct canonical segment extractor.
 *
 * Walks MadCap Flare HTML directly — without routing through turndown —
 * so segment boundaries stay stable across turndown version changes.
 *
 * The pipeline is:
 *   1. Preprocess: strip codeSnippet blocks, Copy buttons, anchor-only <a>,
 *      <thead> (header rows are non-gate).
 *   2. Tokenize into an open/close/void/text stream.
 *   3. Build a lightweight DOM tree.
 *   4. Walk the tree with a heading stack and per-context emitters.
 *
 * The tag vocabulary is scoped to MadCap Flare's output; anything unknown is
 * traversed transparently so inner content is not dropped.
 *
 * @module source_parity_segments_en
 */

import { createSegment, pushHeading, buildSectionPath } from './source_parity_segments_shared.mjs';
import { preprocessEnHtml } from './turndown.mjs';

// ---------------------------------------------------------------------------
// Preprocessing — strip noise that would produce spurious segments
// ---------------------------------------------------------------------------

const COPY_BUTTON_RE = /<a\b[^>]*\bclass\s*=\s*"[^"]*\bcodeSnippetCopyButton\b[^"]*"[^>]*>[\s\S]*?<\/a>/gi;
const ANCHOR_ONLY_RE = /<a\b[^>]*\bname\s*=\s*"[^"]*"[^>]*>\s*<\/a>/gi;
const THEAD_RE = /<thead\b[^>]*>[\s\S]*?<\/thead>/gi;
const HTML_COMMENT_RE = /<!--[\s\S]*?-->/g;
const SCRIPT_STYLE_RE = /<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi;
const COL_TAG_RE = /<col\b[^>]*\/?>/gi;

/**
 * Preprocess raw MadCap Flare HTML by removing line-oriented noise and simple
 * self-contained structures that would otherwise produce spurious segments.
 *
 * NOTE: `<div class="codeSnippet">` is intentionally NOT stripped here — a
 * regex-based strip would break on nested `<div class="codeSnippetBody">` (the
 * non-greedy match stops at the first `</div>`, corrupting the outer tree).
 * Instead the walker drops codeSnippet divs on traversal so nested structures
 * inside a callout are preserved correctly.
 */
export function preprocessHtml(html) {
  if (typeof html !== 'string' || html.length === 0) return '';
  let text = html;
  text = text.replace(HTML_COMMENT_RE, '');
  text = text.replace(SCRIPT_STYLE_RE, '');
  text = text.replace(COPY_BUTTON_RE, '');
  text = text.replace(ANCHOR_ONLY_RE, '');
  text = text.replace(THEAD_RE, '');
  text = text.replace(COL_TAG_RE, '');
  return text;
}

/**
 * Return true when a div's class list contains the `codeSnippet` marker
 * (either the outer container or the inner `codeSnippetBody`).
 */
function isCodeSnippetDiv(node) {
  if (node.tag !== 'div') return false;
  const cls = node.attrs?.class ?? '';
  return /\bcodeSnippet(?:Body)?\b/.test(cls);
}

// ---------------------------------------------------------------------------
// HTML entity decoding (covers the subset MadCap produces)
// ---------------------------------------------------------------------------

const NAMED_ENTITIES = Object.freeze({
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: '\u00A0',
  hellip: '\u2026',
  rsquo: '\u2019',
  lsquo: '\u2018',
  rdquo: '\u201D',
  ldquo: '\u201C',
  ndash: '\u2013',
  mdash: '\u2014',
  copy: '\u00A9',
  reg: '\u00AE',
  trade: '\u2122',
});

export function decodeEntities(text) {
  if (typeof text !== 'string') return '';
  return text.replace(/&(#x?[0-9a-f]+|[a-z][a-z0-9]*);/gi, (match, inner) => {
    if (inner[0] === '#') {
      if (inner[1] === 'x' || inner[1] === 'X') {
        const code = parseInt(inner.slice(2), 16);
        return Number.isFinite(code) ? String.fromCodePoint(code) : match;
      }
      const code = parseInt(inner.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : match;
    }
    const named = NAMED_ENTITIES[inner.toLowerCase()];
    return named ?? match;
  });
}

// ---------------------------------------------------------------------------
// Tokenizer
// ---------------------------------------------------------------------------

const VOID_TAGS = new Set(['img', 'br', 'hr', 'input', 'meta', 'link', 'col', 'area', 'base']);

/**
 * Find the closing `>` of an HTML tag starting at `start`, respecting quoted
 * attribute values so `<p data-value="5>3">` is tokenized correctly.
 */
function findTagEnd(html, start) {
  let quote = null;
  for (let i = start; i < html.length; i++) {
    const ch = html[i];
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

function parseAttrs(attrString) {
  const attrs = {};
  if (!attrString) return attrs;
  const pattern = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
  for (const match of attrString.matchAll(pattern)) {
    const name = match[1].toLowerCase();
    const value = match[2] ?? match[3] ?? match[4] ?? '';
    attrs[name] = value;
  }
  return attrs;
}

/**
 * Tokenize HTML into a stream of {type: 'open'|'close'|'void'|'text', ...}.
 * Supports MadCap Flare's HTML subset with minimal strictness.
 */
export function tokenize(html) {
  const tokens = [];
  let i = 0;
  const n = html.length;

  while (i < n) {
    const ch = html[i];
    if (ch !== '<') {
      const next = html.indexOf('<', i);
      const end = next === -1 ? n : next;
      const text = html.slice(i, end);
      if (text.length > 0) tokens.push({ type: 'text', value: text });
      i = end;
      continue;
    }

    // '<!--' comment (already stripped in preprocess but handle defensively)
    if (html.startsWith('<!--', i)) {
      const end = html.indexOf('-->', i + 4);
      i = end === -1 ? n : end + 3;
      continue;
    }

    // '<!DOCTYPE ...>' or other declarations
    if (html[i + 1] === '!') {
      const end = html.indexOf('>', i);
      i = end === -1 ? n : end + 1;
      continue;
    }

    // Closing tag
    if (html[i + 1] === '/') {
      const end = findTagEnd(html, i + 2);
      if (end === -1) {
        i = n;
        break;
      }
      const tag = html.slice(i + 2, end).trim().toLowerCase();
      tokens.push({ type: 'close', tag });
      i = end + 1;
      continue;
    }

    // Opening or self-closing tag
    const end = findTagEnd(html, i + 1);
    if (end === -1) {
      i = n;
      break;
    }
    let inner = html.slice(i + 1, end);
    let selfClose = false;
    if (inner.endsWith('/')) {
      selfClose = true;
      inner = inner.slice(0, -1);
    }
    const spaceIdx = inner.search(/\s/);
    const tag = (spaceIdx === -1 ? inner : inner.slice(0, spaceIdx)).toLowerCase();
    const attrs = parseAttrs(spaceIdx === -1 ? '' : inner.slice(spaceIdx + 1));
    if (selfClose || VOID_TAGS.has(tag)) {
      tokens.push({ type: 'void', tag, attrs });
    } else {
      tokens.push({ type: 'open', tag, attrs });
    }
    i = end + 1;
  }

  return tokens;
}

// ---------------------------------------------------------------------------
// Tree builder
// ---------------------------------------------------------------------------

/**
 * Build a lightweight DOM tree from the token stream. Closing tags that do not
 * match the current open element pop intermediate levels to stay resilient to
 * MadCap's mildly malformed output.
 */
export function buildTree(tokens) {
  const root = { tag: 'root', attrs: {}, children: [] };
  const stack = [root];

  for (const token of tokens) {
    const top = stack[stack.length - 1];
    if (token.type === 'text') {
      top.children.push({ type: 'text', value: token.value });
    } else if (token.type === 'void') {
      top.children.push({ type: 'element', tag: token.tag, attrs: token.attrs, children: [] });
    } else if (token.type === 'open') {
      const node = { type: 'element', tag: token.tag, attrs: token.attrs, children: [] };
      top.children.push(node);
      stack.push(node);
    } else if (token.type === 'close') {
      // Pop until we find the matching open; if not found, ignore.
      for (let i = stack.length - 1; i > 0; i--) {
        if (stack[i].tag === token.tag) {
          while (stack.length > i) stack.pop();
          break;
        }
      }
    }
  }

  return root;
}

// ---------------------------------------------------------------------------
// Text collection (inline rendering for a segment-producing element)
// ---------------------------------------------------------------------------

const INLINE_JOIN_TAGS = new Set([
  'span', 'strong', 'em', 'b', 'i', 'a', 'code', 'kbd', 'sub', 'sup', 'mark',
  'small', 'u', 's', 'del', 'ins', 'cite', 'q', 'abbr', 'dfn', 'var', 'samp',
]);

/**
 * Render an element's subtree as a single inline text string, preserving
 * invariant tokens (code, links) by wrapping them with markdown-like markers
 * so extractInvariantTokens (via createSegment) can pick them up.
 */
function renderInlineText(node, buffer) {
  if (!node) return;
  if (node.type === 'text') {
    buffer.push(decodeEntities(node.value));
    return;
  }
  if (node.type !== 'element') return;

  const tag = node.tag;

  // Line breaks, rules, and inline images become a single space
  if (tag === 'br' || tag === 'hr' || tag === 'img') {
    buffer.push(' ');
    return;
  }

  // Inline code: wrap with backticks so extractInvariantTokens picks it up
  if (tag === 'code') {
    const inner = [];
    for (const child of node.children) renderInlineText(child, inner);
    buffer.push('`', inner.join('').trim(), '`');
    return;
  }

  // Anchor: wrap as markdown link so URL token is captured
  if (tag === 'a') {
    const inner = [];
    for (const child of node.children) renderInlineText(child, inner);
    const label = inner.join('').trim();
    const href = node.attrs?.href;
    if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
      buffer.push('[', label, '](', href, ')');
    } else {
      buffer.push(label);
    }
    return;
  }

  // Transparent inline tags
  if (INLINE_JOIN_TAGS.has(tag)) {
    for (const child of node.children) renderInlineText(child, buffer);
    return;
  }

  // Nested block-level inside an inline context — recurse transparently
  for (const child of node.children) renderInlineText(child, buffer);
}

function collectInlineText(node) {
  const buffer = [];
  for (const child of node.children) renderInlineText(child, buffer);
  return buffer.join('').replace(/\s+/g, ' ').trim();
}

// ---------------------------------------------------------------------------
// Walker — emits segments with heading stack tracking
// ---------------------------------------------------------------------------

const CALLOUT_CLASS_RE = /\b(note|caution|warning|info|tip|danger)\b/i;

function makeEmitter() {
  const counters = new Map();
  const segments = [];
  return {
    segments,
    emit(sectionPath, kind, rawText) {
      if (!rawText || rawText.trim() === '') return;
      const key = `${sectionPath}\u0000${kind}`;
      const index = counters.get(key) ?? 0;
      counters.set(key, index + 1);
      segments.push(
        createSegment({ sectionPath, kind, segmentIndex: index, rawText }),
      );
    },
  };
}

/**
 * Walk context — a shared mutable context passed by reference to the walker.
 * Using an object instead of parameters keeps the per-call signature small.
 */
function createWalkState() {
  return {
    emitter: makeEmitter(),
    headingStack: [],
    h1Consumed: false,
  };
}

function currentSectionPath(state) {
  return buildSectionPath(state.headingStack);
}

/**
 * Walk a block container (body/root/section-like) and emit segments for each
 * block-level child.
 *
 * Loose text nodes directly inside the container (not wrapped in `<p>`) and
 * any consecutive inline elements (`<em>`, `<strong>`, `<a>`, `<span>` 等)
 * が sibling 列として現れる場合は、**1 つの paragraph として merge** して
 * emit する。これにより non-standard HTML でも 1 論理段落が不必要に分断されない。
 */
function walkBlockContainer(node, state) {
  let looseBuffer = [];
  const flushLoose = () => {
    if (looseBuffer.length === 0) return;
    const text = looseBuffer.join('').replace(/\s+/g, ' ').trim();
    looseBuffer = [];
    if (text.length > 0) {
      state.emitter.emit(currentSectionPath(state), 'paragraph', text);
    }
  };

  for (const child of node.children) {
    if (child.type === 'text') {
      looseBuffer.push(decodeEntities(child.value));
      continue;
    }
    if (child.type !== 'element') continue;

    // Inline element encountered among block siblings: accumulate its inline
    // text into the loose paragraph buffer instead of recursing as a block.
    if (INLINE_JOIN_TAGS.has(child.tag) || child.tag === 'br') {
      renderInlineText(child, looseBuffer);
      continue;
    }

    // Block element boundary: flush any pending loose text as a paragraph
    // first, then walk the block normally.
    flushLoose();
    walkBlock(child, state);
  }

  flushLoose();
}

function isCalloutDiv(node) {
  if (node.tag !== 'div') return false;
  const cls = node.attrs?.class ?? '';
  return CALLOUT_CLASS_RE.test(cls);
}

function walkBlock(node, state) {
  const tag = node.tag;

  // Headings ---------------------------------------------------------------
  if (/^h[1-6]$/.test(tag)) {
    const level = Number(tag.slice(1));
    const text = collectInlineText(node);
    if (level === 1 && !state.h1Consumed) {
      state.h1Consumed = true;
      return; // title — not emitted, not pushed to stack
    }
    state.headingStack = pushHeading(state.headingStack, level, text);
    state.emitter.emit(currentSectionPath(state), 'heading', text);
    return;
  }

  // MadCap codeSnippet wrapper — drop entirely (code is not gate-compared)
  if (isCodeSnippetDiv(node)) {
    return;
  }

  // Callouts (MadCap div.note | div.caution | ...) -------------------------
  if (isCalloutDiv(node)) {
    walkCalloutBody(node, state);
    return;
  }

  // Generic <div> — walk children transparently
  if (tag === 'div' || tag === 'section' || tag === 'article' || tag === 'main') {
    walkBlockContainer(node, state);
    return;
  }

  // Paragraph --------------------------------------------------------------
  if (tag === 'p') {
    const text = collectInlineText(node);
    if (text.length > 0) {
      state.emitter.emit(currentSectionPath(state), 'paragraph', text);
    }
    return;
  }

  // Unordered list ---------------------------------------------------------
  if (tag === 'ul') {
    walkListChildren(node, state, 'unordered-list-item');
    return;
  }

  // Ordered list (MadCap: li siblings can include p/img/div) ---------------
  if (tag === 'ol') {
    walkListChildren(node, state, 'ordered-list-item');
    return;
  }

  // Table ------------------------------------------------------------------
  if (tag === 'table') {
    walkTable(node, state);
    return;
  }

  // Details / summary ------------------------------------------------------
  if (tag === 'details') {
    walkDetails(node, state);
    return;
  }

  // Image (standalone block) ----------------------------------------------
  if (tag === 'img') {
    const src = node.attrs?.src ?? '';
    state.emitter.emit(currentSectionPath(state), 'image', src);
    return;
  }

  // Preformatted code — only reaches here if codeSnippet stripping missed it
  if (tag === 'pre') {
    const text = collectInlineText(node);
    if (text.length > 0) {
      state.emitter.emit(currentSectionPath(state), 'code-block', text);
    }
    return;
  }

  // Unknown block — walk children transparently so nested content is kept.
  walkBlockContainer(node, state);
}

function walkListChildren(listNode, state, itemKind) {
  for (const child of listNode.children) {
    if (child.type === 'text') {
      // Ignore stray whitespace text nodes between list items
      continue;
    }
    if (child.type !== 'element') continue;

    if (child.tag === 'li') {
      const text = collectInlineText(child);
      if (text.length > 0) {
        state.emitter.emit(currentSectionPath(state), itemKind, text);
      }
      continue;
    }

    // Non-li sibling — render in the list's outer section path as a normal block.
    // This handles MadCap Flare's fragmented <ol> where <p>/<img>/<div> sit
    // alongside <li> elements.
    walkBlock(child, state);
  }
}

function walkCalloutBody(node, state) {
  // Walk children; each <p> inside becomes a callout-body segment.
  for (const child of node.children) {
    if (child.type === 'text') continue;
    if (child.type !== 'element') continue;
    if (child.tag === 'p') {
      const text = collectInlineText(child);
      if (text.length > 0) {
        state.emitter.emit(currentSectionPath(state), 'callout-body', text);
      }
      continue;
    }
    // Nested lists or blocks inside a callout — walk transparently.
    walkBlock(child, state);
  }
}

function walkTable(node, state) {
  // <thead> was preprocessed out. Walk <tbody> (if present) and emit td content.
  for (const child of node.children) {
    if (child.type !== 'element') continue;
    if (child.tag === 'tbody' || child.tag === 'tfoot') {
      walkTableRows(child, state);
      continue;
    }
    if (child.tag === 'tr') {
      // Table without explicit tbody wrapper
      walkTableRow(child, state);
      continue;
    }
  }
}

function walkTableRows(container, state) {
  for (const child of container.children) {
    if (child.type !== 'element') continue;
    if (child.tag === 'tr') walkTableRow(child, state);
  }
}

function walkTableRow(row, state) {
  for (const cell of row.children) {
    if (cell.type !== 'element') continue;
    if (cell.tag !== 'td' && cell.tag !== 'th') continue;
    const text = collectInlineText(cell);
    if (text.length > 0) {
      state.emitter.emit(currentSectionPath(state), 'table-cell', text);
    }
  }
}

function walkDetails(node, state) {
  for (const child of node.children) {
    if (child.type !== 'element') continue;
    if (child.tag === 'summary') {
      const text = collectInlineText(child);
      if (text.length > 0) {
        state.emitter.emit(currentSectionPath(state), 'details-summary', text);
      }
      continue;
    }
    walkBlock(child, state);
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Extract canonical segments from an EN HTML snapshot.
 *
 * @param {string} html  raw MadCap Flare HTML
 * @returns {import('./source_parity_segments_shared.mjs').Segment[]}
 */
export function extractSegmentsFromHtml(html) {
  if (typeof html !== 'string') return [];
  const trimmed = html.trim();
  if (trimmed.length === 0) return [];
  // Reuse the existing turndown preprocessor so entity-encoded <details>
  // blocks and escaped callouts become real HTML before our own pass runs.
  const normalized = preprocessEnHtml(html);
  const preprocessed = preprocessHtml(normalized);
  const tokens = tokenize(preprocessed);
  const tree = buildTree(tokens);
  const state = createWalkState();
  walkBlockContainer(tree, state);
  return state.emitter.segments;
}
