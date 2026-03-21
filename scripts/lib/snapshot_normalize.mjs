/**
 * HTML snapshot normalization for English source change detection.
 *
 * Extracts content from help.testim.io pages and normalizes to a
 * deterministic, attribute-stripped HTML format suitable for git diffing.
 */

/** Attributes preserved through normalization (all others stripped). */
const ATTR_WHITELIST = new Set([
  'src',
  'alt',
  'href',
  'colspan',
  'rowspan',
  'theme',
  'start',
]);

/** Block-level tags that get their own line in pretty-printed output. */
const BLOCK_TAGS = new Set([
  'article',
  'section',
  'div',
  'header',
  'footer',
  'nav',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'p',
  'ul',
  'ol',
  'li',
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'td',
  'th',
  'blockquote',
  'pre',
  'hr',
  'br',
  'figure',
  'figcaption',
  'details',
  'summary',
]);

/**
 * Extract <article>...</article> from full page HTML.
 * @returns {{ html: string, found: boolean }}
 */
export function extractArticle(html) {
  const match = html.match(/<article\b[\s\S]*?<\/article>/i);
  if (!match) return { html: '', found: false };
  return { html: match[0], found: true };
}

/**
 * Extract <nav id="hub-sidebar">...</nav> from full page HTML.
 * Preserves full nesting depth (sections, categories, subpages).
 * @returns {{ html: string, found: boolean }}
 */
export function extractSidebar(html) {
  const startMatch = /<nav\b[^>]*id=["']hub-sidebar["'][^>]*>/i.exec(html);
  if (!startMatch) return { html: '', found: false };

  // Find matching </nav> accounting for nested <nav> tags
  let depth = 1;
  let pos = startMatch.index + startMatch[0].length;
  const openRe = /<nav\b/gi;
  const closeRe = /<\/nav>/gi;

  while (depth > 0 && pos < html.length) {
    openRe.lastIndex = pos;
    closeRe.lastIndex = pos;
    const openMatch = openRe.exec(html);
    const closeMatch = closeRe.exec(html);

    if (!closeMatch) break;

    if (openMatch && openMatch.index < closeMatch.index) {
      depth += 1;
      pos = openMatch.index + openMatch[0].length;
    } else {
      depth -= 1;
      pos = closeMatch.index + closeMatch[0].length;
    }
  }

  if (depth !== 0) return { html: '', found: false };

  return { html: html.slice(startMatch.index, pos), found: true };
}

/**
 * Remove <script> and <style> tags and their contents.
 */
export function stripScriptAndStyle(html) {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[\s\S]*?<\/style>/gi, '');
}

/**
 * Strip all HTML attributes except those in the whitelist.
 *
 * Handles quoted attributes (double and single), unquoted values,
 * and boolean attributes (no value).
 */
export function stripAttributes(html) {
  return html.replace(/<([a-zA-Z][a-zA-Z0-9]*)((?:\s[^>]*?)?)\s*(\/?)>/g, (_match, tag, attrStr, selfClose) => {
    if (!attrStr || !attrStr.trim()) {
      return selfClose ? `<${tag} />` : `<${tag}>`;
    }

    const kept = [];
    const attrRe = /([a-zA-Z][\w-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|(\S+)))?/g;
    let attrMatch;
    while ((attrMatch = attrRe.exec(attrStr)) !== null) {
      const name = attrMatch[1].toLowerCase();
      if (ATTR_WHITELIST.has(name)) {
        const value = attrMatch[2] ?? attrMatch[3] ?? attrMatch[4] ?? '';
        kept.push(`${name}="${value}"`);
      }
    }

    const attrs = kept.length ? ` ${kept.join(' ')}` : '';
    return selfClose ? `<${tag}${attrs} />` : `<${tag}${attrs}>`;
  });
}

/**
 * Pretty-print HTML with deterministic indentation.
 * Block-level tags get their own line with 2-space indentation.
 * Whitespace inside <pre> blocks is preserved as-is.
 */
export function prettyPrint(html) {
  // Extract <pre>...</pre> blocks, replace with placeholders to protect whitespace
  const preBlocks = [];
  let withPlaceholders = html.replace(/<pre\b[^>]*>[\s\S]*?<\/pre>/gi, (match) => {
    const index = preBlocks.length;
    preBlocks.push(match);
    return `__PRE_BLOCK_${index}__`;
  });

  // Normalize whitespace outside <pre>: collapse runs to single space, trim
  let normalized = withPlaceholders.replace(/\s+/g, ' ').trim();

  // Insert newlines around block-level tags
  const blockPattern = BLOCK_TAGS.size > 0
    ? [...BLOCK_TAGS].join('|')
    : '';

  const closingBlockRe = new RegExp(`^</(${blockPattern})>`, 'i');

  // Before opening block tags
  normalized = normalized.replace(
    new RegExp(`\\s*<(${blockPattern})(\\s|>|/>)`, 'gi'),
    (_m, tag, rest) => `\n<${tag}${rest}`,
  );

  // Before closing block tags
  normalized = normalized.replace(
    new RegExp(`\\s*</(${blockPattern})>`, 'gi'),
    (_m, tag) => `\n</${tag}>`,
  );

  // Apply indentation
  const lines = normalized.split('\n');
  const result = [];
  let indent = 0;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Check if line starts with a closing block tag (not any closing tag)
    const isClosing = closingBlockRe.test(line);
    // Check if line is a self-closing block tag
    const isSelfClosing = /^<(?:hr|br)\b[^>]*\/?>$/i.test(line);
    // Check if line starts with an opening block tag
    const isOpening = !isClosing && !isSelfClosing &&
      new RegExp(`^<(${blockPattern})\\b`, 'i').test(line);

    if (isClosing) indent = Math.max(0, indent - 1);

    result.push('  '.repeat(indent) + line);

    if (isOpening) indent += 1;
  }

  // Restore <pre> blocks
  let output = result.join('\n') + '\n';
  for (let i = 0; i < preBlocks.length; i++) {
    output = output.replace(`__PRE_BLOCK_${i}__`, preBlocks[i]);
  }

  return output;
}

/**
 * Full normalization pipeline for page content.
 * Extracts <article>, strips script/style, strips attributes, pretty-prints.
 * @returns {{ html: string, found: boolean }}
 */
export function normalizeContent(html) {
  const { html: articleHtml, found } = extractArticle(html);
  if (!found) return { html: '', found: false };

  const stripped = stripScriptAndStyle(articleHtml);
  const cleaned = stripAttributes(stripped);
  return { html: prettyPrint(cleaned), found: true };
}

/**
 * Full normalization pipeline for sidebar.
 * Extracts <nav id="hub-sidebar">, strips script/style, strips attributes, pretty-prints.
 * @returns {{ html: string, found: boolean }}
 */
export function normalizeSidebar(html) {
  const { html: sidebarHtml, found } = extractSidebar(html);
  if (!found) return { html: '', found: false };

  const stripped = stripScriptAndStyle(sidebarHtml);
  const cleaned = stripAttributes(stripped);
  return { html: prettyPrint(cleaned), found: true };
}
