/**
 * Shared TurndownService singleton for HTML → Markdown conversion.
 * Configuration is centralized here to prevent divergence across consumers.
 *
 * Custom rules handle MadCap Flare HTML patterns that the default rules
 * cannot convert accurately:
 *   - <div class="note|caution"> → :::note / :::caution directives
 *   - <ol> with interspersed <img>, <p>, <div>, <ul> siblings alongside <li>
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

export default turndown;
