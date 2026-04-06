/**
 * Shared TurndownService singleton for HTML → Markdown conversion.
 * Configuration is centralized here to prevent divergence across consumers.
 *
 * Custom rules handle MadCap Flare HTML patterns that the default rules
 * cannot convert accurately:
 *   - <div class="note|caution"> → :::note / :::caution directives
 *   - <a class="codeSnippetCopyButton"> → stripped (parity noise)
 *   - <ol> with interspersed <img>, <p>, <div>, <ul> siblings alongside <li>
 *   - <table> → Markdown pipe table
 */

import TurndownService from 'turndown';

const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
});

// ---------------------------------------------------------------------------
// MadCap Flare callout: <div class="note|caution"> → :::directive
// ---------------------------------------------------------------------------

const CALLOUT_CLASS_MAP = {
  note: 'note',
  caution: 'caution',
};

turndown.addRule('madcap-callout', {
  filter(node) {
    if (node.nodeName !== 'DIV') return false;
    const cls = (node.getAttribute('class') || '').trim();
    return Object.hasOwn(CALLOUT_CLASS_MAP, cls);
  },
  replacement(content, node) {
    const cls = (node.getAttribute('class') || '').trim();
    const directive = CALLOUT_CLASS_MAP[cls];
    if (!directive) return content;
    return `\n\n:::${directive}\n${content.trim()}\n:::\n\n`;
  },
});

// ---------------------------------------------------------------------------
// MadCap Flare code snippet: strip <a class="codeSnippetCopyButton">
//
// EN HTML wraps code blocks in <div class="codeSnippet"> which contains an
// <a class="codeSnippetCopyButton">Copy</a> link. Without this rule, turndown
// emits "[Copy](javascript:void(0);)" as a text paragraph, inflating
// paragraph counts in parity checks.
// ---------------------------------------------------------------------------

turndown.addRule('madcap-code-snippet-copy', {
  filter(node) {
    if (node.nodeName !== 'A') return false;
    const classes = (node.getAttribute('class') || '').split(/\s+/);
    return classes.includes('codeSnippetCopyButton');
  },
  replacement() {
    return '';
  },
});

// ---------------------------------------------------------------------------
// MadCap Flare ordered list: <ol> with <li>/<img>/<p>/<div>/<ul> siblings
//
// MadCap Flare produces <ol> blocks where <img>, <p>, <div class="note">,
// and <ul> appear as siblings of <li> (not nested inside <li>).
// Default turndown cannot handle this — it drops or merges siblings.
//
// This rule walks the child nodes of <ol> and reconstructs the list:
//   - <li value="N"> → "N. content"
//   - Non-<li> siblings are emitted as block content between steps
// ---------------------------------------------------------------------------

turndown.addRule('madcap-ordered-list', {
  filter: 'ol',
  replacement(_content, node) {
    const children = Array.from(node.childNodes);
    const parts = [];

    for (const child of children) {
      // Skip pure whitespace text nodes
      if (child.nodeType === 3 && !child.textContent.trim()) continue;

      if (child.nodeName === 'LI') {
        const value = child.getAttribute('value');
        const inner = turndown.turndown(child.innerHTML).trim();
        if (value) {
          parts.push(`${value}. ${inner}`);
        } else {
          // <li> without value — sub-item within the list
          parts.push(`- ${inner}`);
        }
      } else {
        // Non-<li> sibling: convert to markdown and emit as block content
        const md = turndown.turndown(child.outerHTML || child.textContent).trim();
        if (md) {
          parts.push(md);
        }
      }
    }

    return '\n\n' + parts.join('\n\n') + '\n\n';
  },
});

// ---------------------------------------------------------------------------
// MadCap Flare table: <table class="TableStyle-Table_new"> → Markdown pipe table
//
// MadCap uses <p class="tableBody|tableHeading"> inside <td>/<th>, plus
// <col> elements and style attributes that confuse default turndown.
// All 47 EN tables follow the same pattern: <thead> + <tbody>, single class.
// ---------------------------------------------------------------------------

/**
 * Extract text content from a table cell node, converting inner HTML to MD.
 * Collapses to a single line for pipe table cells.
 */
function cellToMd(cellNode) {
  const inner = turndown.turndown(cellNode.innerHTML).trim();
  return inner.replace(/\n+/g, ' ').replace(/\|/g, '\\|');
}

turndown.addRule('madcap-table', {
  filter(node) {
    return node.nodeName === 'TABLE';
  },
  replacement(_content, node) {
    // node.rows is available via HTMLTableElement API (turndown's DOM).
    // Fall back to default content if rows API is unavailable.
    if (!node.rows || node.rows.length === 0) return _content;

    const rows = [];
    for (let i = 0; i < node.rows.length; i++) {
      const row = node.rows[i];
      const cells = [];
      if (row.cells) {
        for (let j = 0; j < row.cells.length; j++) {
          cells.push(cellToMd(row.cells[j]));
        }
      }
      if (cells.length > 0) {
        rows.push(cells);
      }
    }

    if (rows.length === 0) return '';

    const colCount = Math.max(...rows.map((r) => r.length));

    const lines = [];
    for (let i = 0; i < rows.length; i++) {
      const padded = rows[i].concat(Array(colCount - rows[i].length).fill(''));
      lines.push('| ' + padded.join(' | ') + ' |');

      if (i === 0) {
        lines.push('| ' + Array(colCount).fill('---').join(' | ') + ' |');
      }
    }

    return '\n\n' + lines.join('\n') + '\n\n';
  },
});

// ---------------------------------------------------------------------------
// HTML <details>/<summary> → ## heading + content
//
// MadCap FAQ pages use <details><summary><b>Question</b></summary> Answer</details>.
// JA translations use H2 headings for each Q&A. This rule converts <summary>
// to H2 headings so the structural comparison aligns.
// ---------------------------------------------------------------------------

turndown.addRule('html-details', {
  filter: 'details',
  replacement(content) {
    return '\n\n' + content.trim() + '\n\n';
  },
});

turndown.addRule('html-summary', {
  filter: 'summary',
  replacement(content) {
    return '\n\n## ' + content.trim() + '\n\n';
  },
});

// ---------------------------------------------------------------------------
// EN HTML preprocessing: normalize MadCap artifacts before turndown conversion
//
// preprocessEnHtml() normalizes EN HTML before turndown conversion:
//   - Unescapes HTML-entity-encoded <details> blocks in <p> elements
//   - Converts escaped callout patterns (&gt; Title &gt; &gt; Content) to
//     <div class="note"> for the madcap-callout rule
//
// NOTE: The <p> regex assumes MadCap-generated HTML where attributes never
// contain '>' or '</p>'. If processing arbitrary HTML, use a DOM parser.
// ---------------------------------------------------------------------------

/** Detect likely attribute truncation from `>` inside attribute values. */
function hasTruncatedAttribute(innerHtml) {
  return /^[^<]*">/.test(innerHtml);
}

/**
 * Unescape HTML-entity-encoded `<details><summary>` blocks inside <p> elements.
 *
 * MadCap sometimes serializes `<details>` FAQ accordions as escaped entities
 * inside `<p>`, e.g. `<p>&lt;details&gt; &lt;summary&gt;...&lt;/summary&gt; ...&lt;/details&gt;</p>`.
 * This restores them to real HTML so turndown's details/summary rules can convert them.
 */
function unescapeDetails(html) {
  return html.replace(
    /<p\b[^>]*>([\s\S]*?)<\/p>/gi,
    (fullMatch, innerHtml) => {
      if (hasTruncatedAttribute(innerHtml)) return fullMatch;

      const trimmed = innerHtml.trim();
      const startsWithOpen = trimmed.startsWith('&lt;details&gt;');
      const startsWithCloseAndOpen =
        trimmed.startsWith('&lt;/details&gt;') && trimmed.includes('&lt;details&gt;');
      if (!startsWithOpen && !startsWithCloseAndOpen) {
        return fullMatch;
      }
      const unescaped = trimmed
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&');
      return unescaped;
    }
  );
}

/**
 * Convert escaped callout patterns (`&gt; Title &gt; &gt; Content`)
 * inside `<p>` elements to `<div class="note">` for the madcap-callout rule.
 *
 * Only matches when the first `&gt;` appears at or near the start of the `<p>`
 * content. Mid-paragraph `&gt;` patterns (e.g. instructional text about the
 * `>` operator) are left unchanged to prevent false positives.
 */
function normalizeEscapedCallouts(html) {
  return html.replace(
    /<p\b[^>]*>([\s\S]*?)<\/p>/gi,
    (fullMatch, innerHtml) => {
      if (hasTruncatedAttribute(innerHtml)) return fullMatch;

      const firstGt = innerHtml.indexOf('&gt;');
      if (firstGt === -1) return fullMatch;

      // Guard: real MadCap callouts start with &gt; (possibly preceded by
      // whitespace only). If there is substantial text before the first &gt;,
      // this is not a callout — skip to avoid false positives.
      const textBefore = innerHtml.slice(0, firstGt).trim();
      if (textBefore.length > 0) return fullMatch;

      const afterOpening = innerHtml.slice(firstGt + 4);
      const sepMatch = afterOpening.match(/&gt;\s*&gt;/);
      if (!sepMatch) return fullMatch;

      const sepAbsIndex = firstGt + 4 + sepMatch.index;
      // Title is intentionally dropped — JA translations use :::note without
      // titles, and the madcap-callout rule only emits the directive + body.
      const body = innerHtml.slice(sepAbsIndex + sepMatch[0].length).trim();

      if (!body) return fullMatch;

      const noteDiv = `<div class="note"><p>${body}</p></div>`;
      return noteDiv;
    }
  );
}

/**
 * Normalize EN HTML before turndown conversion.
 *
 * Chains two preprocessing steps:
 *   1. `unescapeDetails` — restore entity-encoded `<details>` blocks
 *   2. `normalizeEscapedCallouts` — convert escaped `>` callout patterns
 *
 * @param {string} html - Raw MadCap Flare HTML from EN snapshot
 * @returns {string} Normalized HTML with escaped callouts/details restored
 */
export function preprocessEnHtml(html) {
  if (typeof html !== 'string') {
    throw new TypeError(`preprocessEnHtml expected string, got ${typeof html}`);
  }
  return normalizeEscapedCallouts(unescapeDetails(html));
}

/**
 * Convert EN HTML to Markdown in a single call (preprocess + turndown).
 *
 * Use this instead of calling `preprocessEnHtml` + `turndown.turndown`
 * separately to avoid the implicit two-step protocol.
 *
 * @param {string} html - Raw MadCap Flare HTML from EN snapshot
 * @returns {string} Markdown output
 */
export function convertEnHtmlToMd(html) {
  return turndown.turndown(preprocessEnHtml(html));
}

export default turndown;
