export const ISSUE_SEVERITY = {
  untranslated: 'actionable',
  'legacy-callout': 'actionable',
  'jsx-callout': 'actionable',
  'h1-in-body': 'actionable',
  'image-mismatch': 'actionable',
  'codeblock-mismatch': 'actionable',
  'orphan-page': 'actionable',
  'image-order-mismatch': 'actionable',
  'callout-nesting-mismatch': 'actionable',
  'step-count-mismatch': 'signal',
  'bullet-count-mismatch': 'signal',
  'paragraph-count-mismatch': 'signal',
  'heading-mismatch': 'signal',
  'content-root-missing': 'signal',
  'section-count-mismatch': 'signal',
  'table-shape-mismatch': 'signal',
  'table-cell-english-residual': 'signal',
  'table-cell-empty-mismatch': 'signal',
  'table-cell-token-mismatch': 'signal',
  'source-fetch-error': 'error',
};

export const ACTIONABLE_ISSUE_TYPES = new Set(
  Object.entries(ISSUE_SEVERITY)
    .filter(([, severity]) => severity === 'actionable')
    .map(([type]) => type),
);

const UNTRANSLATED_PATTERNS = [
  /^(?:\d+\.\s*)?Hover over the\b/i,
  /^(?:\d+\.\s*)?Click on the\b/i,
  /^(?:\d+\.\s*)?Click on \*\*/i,
  /^(?:\d+\.\s*)?Scroll down through the menu/i,
  /^(?:\d+\.\s*)?Select the\b/i,
  /^(?:\d+\.\s*)?If you would like to\b/i,
  /^(?:\d+\.\s*)?The file is uploaded/i,
  /^(?:\d+\.\s*)?In the\b.*\bpanel\b/i,
  /^(?:\d+\.\s*)?From the\b.*\bdrop-?down\b/i,
];

const LEGACY_CALLOUT_RE =
  /^>\s*(?:📘|❗️?|🚧|👍|⚠️|📝|✅|❌|💡|ℹ️|⛔|🔥|💥|🎯|📌|🏷️)\s/;
const JSX_CALLOUT_RE = /^<Callout\b/i;
const H1_IN_BODY_RE = /^#\s+\S/;
const FENCE_LINE_RE = /^\s*(?:(?:[-*+]\s+|\d+\.\s+))?```/;

function withSeverity(issue) {
  return {
    ...issue,
    severity: ISSUE_SEVERITY[issue.type] ?? 'signal',
  };
}

export function isActionableIssue(issue) {
  return issue.severity === 'actionable';
}

export function isEnglishOnlyLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (/^(?:#{1,6}\s|[-*>|]|```|:::|!\[|<!--|\[.*\]\()/.test(trimmed)) {
    return false;
  }
  if (
    /^<\/?(?:table|thead|tbody|tr|td|th|details|summary|img|kbd|br|hr|Image)\b/i.test(
      trimmed,
    )
  ) {
    return false;
  }
  if (/[\u3000-\u9FFF\uF900-\uFAFF]/.test(trimmed)) return false;

  const textOnly = trimmed.replace(/^\d+\.\s*/, '');
  if (!textOnly || textOnly.length < 15) return false;

  return UNTRANSLATED_PATTERNS.some((pattern) => pattern.test(textOnly));
}

export function loadSidebarSlugs(sidebarText) {
  const urls = sidebarText.match(/https:\/\/help\.testim\.io\/docs\/([\w-]+)/g) || [];
  return new Set(urls.map((url) => url.split('/').pop()));
}

export function localCheck({ body, sidebarSlugs, slug }) {
  const issues = [];
  const lines = body.split('\n');
  let inCodeBlock = false;

  if (sidebarSlugs && slug && !sidebarSlugs.has(slug)) {
    issues.push(
      withSeverity({
        type: 'orphan-page',
        detail: 'SIDEBAR_URLS.md に未掲載',
      }),
    );
  }

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (FENCE_LINE_RE.test(line)) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    if (LEGACY_CALLOUT_RE.test(line)) {
      issues.push(
        withSeverity({
          type: 'legacy-callout',
          line: index + 1,
          text: line.trim().slice(0, 80),
        }),
      );
    }

    if (JSX_CALLOUT_RE.test(line.trim())) {
      issues.push(
        withSeverity({
          type: 'jsx-callout',
          line: index + 1,
          text: line.trim().slice(0, 80),
        }),
      );
    }

    if (H1_IN_BODY_RE.test(line) && index > 0) {
      issues.push(
        withSeverity({
          type: 'h1-in-body',
          line: index + 1,
          text: line.trim().slice(0, 80),
        }),
      );
    }

    if (isEnglishOnlyLine(line)) {
      issues.push(
        withSeverity({
          type: 'untranslated',
          line: index + 1,
          text: line.trim().slice(0, 100),
        }),
      );
    }
  }

  return issues;
}

export function extractFromMd(body) {
  const lines = body.split('\n');
  let h2Count = 0;
  let h3Count = 0;
  let imgCount = 0;
  let codeBlockCount = 0;
  let calloutCount = 0;
  let inCodeBlock = false;

  for (const line of lines) {
    if (FENCE_LINE_RE.test(line)) {
      if (!inCodeBlock) codeBlockCount += 1;
      inCodeBlock = !inCodeBlock;
      continue;
    }

    if (inCodeBlock) continue;

    if (/^##\s/.test(line)) h2Count += 1;
    if (/^###\s/.test(line)) h3Count += 1;
    imgCount += (line.match(/!\[/g) || []).length;
    imgCount += (line.match(/<Image\b[^>]*\bsrc\s*=/g) || []).length;
    imgCount += (line.match(/<img\b[^>]*\bsrc\s*=/gi) || []).length;
    if (/^:::/.test(line.trim())) calloutCount += 1;
    if (LEGACY_CALLOUT_RE.test(line)) calloutCount += 1;
  }

  return { h2Count, h3Count, imgCount, codeBlockCount, calloutCount };
}

// ---------------------------------------------------------------------------
// Snapshot structure comparison helpers
// ---------------------------------------------------------------------------

const IMAGE_PATTERNS = [
  /!\[[^\]]*\]\(([^)]+)\)/g,
  /<Image\b[^>]*\bsrc\s*=\s*"([^"]+)"/g,
  /<img\b[^>]*\bsrc\s*=\s*"([^"]+)"/gi,
];

/**
 * Extract normalised image filenames from Markdown body in document order.
 * Returns an array of { file, line } objects.
 */
export function extractImageSequence(body) {
  const lines = body.split('\n');
  const images = [];
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (FENCE_LINE_RE.test(line)) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    for (const pattern of IMAGE_PATTERNS) {
      pattern.lastIndex = 0;
      let m;
      while ((m = pattern.exec(line)) !== null) {
        const src = m[1];
        // Normalise to bare filename without extension for robust matching
        const file = src.split('/').pop().replace(/\.[^.]+$/, '');
        images.push({ file, line: i + 1 });
      }
    }
  }

  return images;
}

/**
 * Parse callout positions and nesting depth.
 * Returns an array of { type, depth, line } objects.
 *   depth 0 = top-level, depth > 0 = nested under list/blockquote
 */
export function extractCalloutPositions(body) {
  const lines = body.split('\n');
  const callouts = [];
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (FENCE_LINE_RE.test(line)) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    // Directive callouts (:::note, :::warning, etc.)
    const directiveMatch = line.match(/^(\s*):::(note|warning|info|tip|caution|danger)/);
    if (directiveMatch) {
      const indent = directiveMatch[1].length;
      // 2+ spaces or inside list context = nested
      const depth = indent >= 2 ? 1 : 0;
      callouts.push({ type: directiveMatch[2], depth, line: i + 1 });
      continue;
    }

    // Legacy blockquote callouts (> 📘, > 🚧, etc.) — also match indented
    const trimmedForCallout = line.trimStart();
    if (LEGACY_CALLOUT_RE.test(trimmedForCallout)) {
      // Only consider nested if explicitly indented (inside a list item)
      const indent = line.match(/^(\s*)/)[1].length;
      const depth = indent >= 2 ? 1 : 0;
      const typeMatch = line.match(/(📘|🚧|❗️?|⚠️|👍|📝|✅|❌|💡|ℹ️)/);
      const type = typeMatch ? typeMatch[1] : 'unknown';
      callouts.push({ type, depth, line: i + 1 });
    }
  }

  return callouts;
}

/**
 * Count numbered steps (ordered list items) per h2/h3 section.
 * Returns a Map<sectionHeading, stepCount>.
 */
export function extractStepCounts(body) {
  const lines = body.split('\n');
  const sections = new Map();
  let currentSection = '__top__';
  let inCodeBlock = false;
  let inCallout = false;

  for (const line of lines) {
    if (FENCE_LINE_RE.test(line)) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    // Track callout directive blocks (:::note, :::warning, etc.)
    const trimmed = line.trim();
    if (/^:::(note|warning|info|tip|caution|danger)/.test(trimmed)) {
      inCallout = true;
      continue;
    }
    if (inCallout && trimmed === ':::') {
      inCallout = false;
      continue;
    }

    // Skip blockquote lines (legacy callouts etc.) — stateless per-line check
    if (/^>/.test(trimmed)) {
      continue;
    }

    const headingMatch = line.match(/^#{2,4}\s+(.+)/);
    if (headingMatch) {
      inCallout = false; // Reset unclosed callout at section boundary
      currentSection = headingMatch[1].trim();
      if (!sections.has(currentSection)) {
        sections.set(currentSection, 0);
      }
      continue;
    }

    // Count top-level numbered steps (not inside callout/blockquote/code)
    // Match: "1. text", "5\. text" (EN escaped numbering)
    // Skip indented sub-lists (lines starting with whitespace)
    if (!inCallout && /^\d+(?:\\)?\.\s/.test(line)) {
      sections.set(currentSection, (sections.get(currentSection) || 0) + 1);
    }
  }

  return sections;
}

/**
 * Strip the first H1 (page title) and demote remaining H1s to H2.
 * EN snapshots use H1 for sections while JA uses H2; this normalises them
 * so that section-based comparisons can match by ordinal position.
 */
export function stripTitleH1(body) {
  let firstH1Skipped = false;
  return body
    .split('\n')
    .map((line) => {
      if (/^# /.test(line)) {
        if (!firstH1Skipped) {
          firstH1Skipped = true;
          return ''; // Remove page title H1
        }
        return line.replace(/^# /, '## '); // Demote section H1 to H2
      }
      return line;
    })
    .join('\n');
}

/**
 * Count unordered list items (top-level only) per h2/h3 section.
 * Returns a Map<sectionHeading, count>.
 */
export function extractBulletCounts(body) {
  const lines = body.split('\n');
  const sections = new Map();
  let currentSection = '__top__';
  let inCodeBlock = false;
  let inCallout = false;

  for (const line of lines) {
    if (FENCE_LINE_RE.test(line)) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    const trimmed = line.trim();
    if (/^:::(note|warning|info|tip|caution|danger)/.test(trimmed)) {
      inCallout = true;
      continue;
    }
    if (inCallout && trimmed === ':::') {
      inCallout = false;
      continue;
    }

    if (/^>/.test(trimmed)) continue;

    const headingMatch = line.match(/^#{2,4}\s+(.+)/);
    if (headingMatch) {
      inCallout = false;
      currentSection = headingMatch[1].trim();
      if (!sections.has(currentSection)) {
        sections.set(currentSection, 0);
      }
      continue;
    }

    // Unordered list items at any nesting level
    if (!inCallout && /^[-*+]\s/.test(trimmed)) {
      sections.set(currentSection, (sections.get(currentSection) || 0) + 1);
    }
  }

  return sections;
}

/**
 * Count text paragraphs per h2/h3 section.
 * A paragraph is a contiguous block of non-blank content lines that are not
 * headings, list items, images, code fences, callouts, or blockquotes.
 * Returns a Map<sectionHeading, count>.
 */
export function extractParagraphCounts(body) {
  const lines = body.split('\n');
  const sections = new Map();
  let currentSection = '__top__';
  let inCodeBlock = false;
  let inCallout = false;
  let inTable = false;
  let inParagraph = false;

  for (const line of lines) {
    if (FENCE_LINE_RE.test(line)) {
      inCodeBlock = !inCodeBlock;
      inParagraph = false;
      continue;
    }
    if (inCodeBlock) {
      inParagraph = false;
      continue;
    }

    const trimmed = line.trim();

    // Track HTML table blocks (EN snapshots use <Table>/<table>)
    if (/^<(?:Table|table)\b/i.test(trimmed)) {
      inTable = true;
      inParagraph = false;
      continue;
    }
    if (inTable && /^<\/(?:Table|table)>/i.test(trimmed)) {
      inTable = false;
      continue;
    }
    if (inTable) {
      inParagraph = false;
      continue;
    }

    if (/^:::(note|warning|info|tip|caution|danger)/.test(trimmed)) {
      inCallout = true;
      inParagraph = false;
      continue;
    }
    if (inCallout && trimmed === ':::') {
      inCallout = false;
      inParagraph = false;
      continue;
    }
    if (inCallout) continue;

    if (/^>/.test(trimmed)) {
      inParagraph = false;
      continue;
    }

    const headingMatch = line.match(/^#{2,4}\s+(.+)/);
    if (headingMatch) {
      inCallout = false;
      currentSection = headingMatch[1].trim();
      if (!sections.has(currentSection)) {
        sections.set(currentSection, 0);
      }
      inParagraph = false;
      continue;
    }

    // Lines that break a paragraph (structural elements)
    if (/^\d+(?:\\)?\.\s/.test(line)) { inParagraph = false; continue; }
    if (/^[-*+]\s/.test(line)) { inParagraph = false; continue; }
    if (/^\s+[-*+]\s/.test(line)) { inParagraph = false; continue; }
    if (/^!\[/.test(trimmed) || /<img\b/i.test(trimmed) || /<Image\b/.test(trimmed)) {
      inParagraph = false;
      continue;
    }
    // Skip markdown pipe table rows
    if (/^\|/.test(trimmed)) { inParagraph = false; continue; }
    // Skip HTML structural tags (br, hr, div, details, etc.)
    if (/^<\/?(br|hr|div|details|summary)\b/i.test(trimmed)) {
      inParagraph = false;
      continue;
    }
    // Skip remaining HTML block tags (thead, tbody, tr, td, th, etc.)
    if (/^<\/?(thead|tbody|tfoot|tr|td|th)\b/i.test(trimmed)) {
      inParagraph = false;
      continue;
    }

    if (!trimmed) {
      inParagraph = false;
      continue;
    }

    // Non-blank, non-structural content line — start of a new paragraph
    if (!inParagraph) {
      inParagraph = true;
      sections.set(currentSection, (sections.get(currentSection) || 0) + 1);
    }
  }

  return sections;
}

/**
 * Compare section-level counts between EN and JA.
 * Filters out __top__ and only compares when section counts match.
 */
function compareSectionCounts(enMap, jaMap, issueType, label, minDiff = 1) {
  const issues = [];
  const enSections = [...enMap.entries()].filter(([k]) => k !== '__top__');
  const jaSections = [...jaMap.entries()].filter(([k]) => k !== '__top__');

  if (enSections.length > 0 && enSections.length === jaSections.length) {
    // Per-section ordinal comparison
    for (let i = 0; i < enSections.length; i += 1) {
      const [enHeading, enCount] = enSections[i];
      const [, jaCount] = jaSections[i];
      const diff = jaCount - enCount;
      if (Math.abs(diff) >= minDiff && (enCount > 0 || jaCount > 0)) {
        issues.push(
          withSeverity({
            type: issueType,
            detail: `セクション #${i + 1} "${enHeading}": ${label} EN=${enCount}, JA=${jaCount} (${diff > 0 ? '+' : ''}${diff})`,
          }),
        );
      }
    }
  } else if (enSections.length > 0 || jaSections.length > 0) {
    // Fallback: total comparison when section counts differ
    const enTotal = [...enMap.values()].reduce((a, b) => a + b, 0);
    const jaTotal = [...jaMap.values()].reduce((a, b) => a + b, 0);
    if (enTotal !== jaTotal && (enTotal > 0 || jaTotal > 0)) {
      const absDiff = Math.abs(jaTotal - enTotal);
      if (absDiff >= minDiff) {
        const diff = jaTotal - enTotal;
        issues.push(
          withSeverity({
            type: issueType,
            detail: `${label}の総数が原文と異なります: EN=${enTotal}, JA=${jaTotal} (${diff > 0 ? '+' : ''}${diff})`,
          }),
        );
      }
    }
  }

  return issues;
}

// ---------------------------------------------------------------------------
// Table structure comparison helpers
// ---------------------------------------------------------------------------

/**
 * Strip markdown formatting from a cell value.
 */
export function stripMarkdown(text) {
  return text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '') // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // links → text
    .replace(/`[^`]*`/g, '') // inline code
    .replace(/\*\*([^*]*)\*\*/g, '$1') // bold
    .replace(/\*([^*]*)\*/g, '$1') // italic
    .replace(/~~([^~]*)~~/g, '$1') // strikethrough
    .trim();
}

/**
 * Check if a table cell contains untranslated English *prose*.
 * Designed to catch full English sentences/phrases left untranslated,
 * while excluding identifiers, property names, UI labels, shortcuts, etc.
 */
export function isUntranslatedCell(cell) {
  const stripped = stripMarkdown(cell).trim();
  // Require substantial text — short cells are usually identifiers/labels
  if (stripped.length < 20) return false;

  // Skip cells that are only URLs, code, or numbers
  if (/^https?:\/\//.test(stripped)) return false;
  if (/^[`']/.test(stripped)) return false;
  if (/^\d+(\.\d+)?%?$/.test(stripped)) return false;

  // Skip cells with CJK characters (already has some translation)
  if (/[\u3000-\u9FFF\uF900-\uFAFF]/.test(stripped)) return false;

  // Skip camelCase/PascalCase identifiers (e.g., projectId, testName)
  if (/^[a-z][a-zA-Z0-9]*$/.test(stripped)) return false;
  if (/^[A-Z][a-z][a-zA-Z0-9]*$/.test(stripped)) return false;

  // Skip dot-notation property paths (e.g., params.timeout, test.id)
  if (/^[a-zA-Z_]\w*(?:\.\w+)+$/.test(stripped)) return false;

  // Skip keyboard shortcuts (e.g., Alt + H, Ctrl + Shift + Enter)
  if (/^(?:Alt|Ctrl|Cmd|Shift|Enter|Tab|Esc|Space)\b/i.test(stripped) && /\+/.test(stripped)) return false;

  // Skip cells with numbers and units (e.g., 30s, 5000ms, 100px)
  if (/^\d+\s*(?:s|ms|px|em|rem|%|MB|GB|KB)$/i.test(stripped)) return false;

  // Require multiple words (single-word cells are usually identifiers/labels)
  const words = stripped.split(/\s+/);
  if (words.length < 3) return false;

  // Must look like English prose: has spaces between words, mostly ASCII letters
  const letters = stripped.replace(/[^A-Za-z]/g, '');
  const ratio = letters.length / stripped.length;
  return ratio > 0.6;
}

/**
 * Parse markdown pipe tables from body.
 * Returns array of { rows: string[][], line: number }.
 * Each row is an array of cell strings.
 */
export function extractMarkdownTables(body) {
  const lines = body.split('\n');
  const tables = [];
  let currentTable = null;
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (FENCE_LINE_RE.test(line)) {
      inCodeBlock = !inCodeBlock;
      if (currentTable) {
        tables.push(currentTable);
        currentTable = null;
      }
      continue;
    }
    if (inCodeBlock) continue;

    const trimmed = line.trim();
    if (/^\|(.+)\|$/.test(trimmed)) {
      // Check if this is a separator row (| --- | --- |)
      const isSeparator = /^\|[\s:|-]+\|$/.test(trimmed);
      const cells = trimmed
        .slice(1, -1) // remove leading/trailing pipes
        .split('|')
        .map((c) => c.trim());

      if (!currentTable) {
        currentTable = { rows: [], line: i + 1 };
      }
      if (!isSeparator) {
        currentTable.rows.push(cells);
      }
    } else {
      if (currentTable) {
        tables.push(currentTable);
        currentTable = null;
      }
    }
  }

  if (currentTable) {
    tables.push(currentTable);
  }

  return tables;
}

/**
 * Parse HTML tables from body (EN snapshots often use HTML).
 * Returns array of { rows: string[][], line: number }.
 */
export function extractHtmlTables(body) {
  const tables = [];
  const tableRegex = /<table\b[^>]*>([\s\S]*?)<\/table>/gi;
  let match;

  while ((match = tableRegex.exec(body)) !== null) {
    const tableHtml = match[1];
    const lineNum = body.slice(0, match.index).split('\n').length;
    const rows = [];

    const rowRegex = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
    let rowMatch;
    while ((rowMatch = rowRegex.exec(tableHtml)) !== null) {
      const rowHtml = rowMatch[1];
      const cells = [];
      const cellRegex = /<(?:td|th)\b[^>]*>([\s\S]*?)<\/(?:td|th)>/gi;
      let cellMatch;
      while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
        // Strip HTML tags from cell content
        const cellText = cellMatch[1].replace(/<[^>]*>/g, '').trim();
        cells.push(cellText);
      }
      if (cells.length > 0) {
        rows.push(cells);
      }
    }

    if (rows.length > 0) {
      tables.push({ rows, line: lineNum });
    }
  }

  return tables;
}

/**
 * Extract invariant tokens from a table cell that must be preserved during translation.
 * Returns a sorted array of token strings for comparison.
 * Targets: URLs, inline code, CLI flags, dot-paths, versions, number+unit.
 */
export function extractInvariantTokens(cell) {
  const tokens = [];

  // Inline code: `--grep`, `params.timeout`, etc.
  const codeRe = /`([^`]+)`/g;
  let m;
  while ((m = codeRe.exec(cell)) !== null) {
    tokens.push(m[1]);
  }

  // Strip inline code before extracting other tokens to avoid double-counting
  const withoutCode = cell.replace(/`[^`]*`/g, '');

  // URLs: https://..., http://...
  const urlRe = /https?:\/\/[^\s)>\]]+/g;
  while ((m = urlRe.exec(withoutCode)) !== null) {
    tokens.push(m[0]);
  }

  // CLI flags: --flag, -f (standalone, not inside words)
  const flagRe = /(?:^|\s)(--?[a-zA-Z][\w-]*)(?=\s|$)/g;
  while ((m = flagRe.exec(withoutCode)) !== null) {
    tokens.push(m[1]);
  }

  // Dot-notation paths: params.timeout, test.id.value
  const dotRe = /\b([a-zA-Z_]\w*(?:\.\w+)+)\b/g;
  while ((m = dotRe.exec(withoutCode)) !== null) {
    tokens.push(m[1]);
  }

  // Versions: v1.2.3, 2.0.0
  const verRe = /\bv?\d+\.\d+\.\d+\b/g;
  while ((m = verRe.exec(withoutCode)) !== null) {
    tokens.push(m[0]);
  }

  // Number + unit: 30sec, 500ms, 10%, 5000ms, 100px
  const numUnitRe = /\b(\d+(?:\.\d+)?\s*(?:sec|ms|s|px|em|rem|%|MB|GB|KB|min|hr))\b/gi;
  while ((m = numUnitRe.exec(withoutCode)) !== null) {
    tokens.push(m[1].replace(/\s+/g, ''));
  }

  // File paths: /api/foo, /docs/slug
  const pathRe = /(?:^|\s)(\/[a-zA-Z][\w/.-]+)/g;
  while ((m = pathRe.exec(withoutCode)) !== null) {
    tokens.push(m[1]);
  }

  return tokens.sort();
}

/**
 * Extract all tables (markdown + HTML) from body, sorted by document order.
 */
export function extractTableStructure(body) {
  return [...extractMarkdownTables(body), ...extractHtmlTables(body)]
    .sort((a, b) => a.line - b.line);
}

/**
 * Compare tables between EN and JA for structural and content issues.
 */
function compareTableStructure(enBody, jaBody) {
  const issues = [];
  const enTables = extractTableStructure(enBody);
  const jaTables = extractTableStructure(jaBody);

  // Report table count mismatch (table drop/add)
  if (enTables.length !== jaTables.length && (enTables.length > 0 || jaTables.length > 0)) {
    issues.push(
      withSeverity({
        type: 'table-shape-mismatch',
        detail: `テーブル数: EN=${enTables.length}, JA=${jaTables.length}`,
      }),
    );
    return issues; // Skip per-cell comparison when table counts differ
  }

  if (enTables.length === 0) {
    return issues;
  }

  for (let t = 0; t < enTables.length; t += 1) {
    const enTable = enTables[t];
    const jaTable = jaTables[t];

    const enRows = enTable.rows.length;
    const jaRows = jaTable.rows.length;
    const enCols = enTable.rows[0]?.length || 0;
    const jaCols = jaTable.rows[0]?.length || 0;

    // Shape comparison (row/column count)
    if (enRows !== jaRows || enCols !== jaCols) {
      issues.push(
        withSeverity({
          type: 'table-shape-mismatch',
          detail: `テーブル #${t + 1}: EN=${enRows}行×${enCols}列, JA=${jaRows}行×${jaCols}列`,
        }),
      );
      continue; // Skip cell-level comparison if shape differs
    }

    // Cell-level comparison
    for (let r = 0; r < enRows; r += 1) {
      for (let c = 0; c < enCols; c += 1) {
        const enCell = (enTable.rows[r]?.[c] || '').trim();
        const jaCell = (jaTable.rows[r]?.[c] || '').trim();

        // Empty mismatch: EN non-empty, JA empty (or vice versa)
        // Use raw trimmed content (not stripMarkdown) so code-only cells
        // like `--grep` are not treated as empty
        const enEmpty = enCell.length === 0;
        const jaEmpty = jaCell.length === 0;
        if (enEmpty !== jaEmpty) {
          issues.push(
            withSeverity({
              type: 'table-cell-empty-mismatch',
              detail: `テーブル #${t + 1} [${r + 1},${c + 1}]: EN=${enEmpty ? '空' : '非空'}, JA=${jaEmpty ? '空' : '非空'}`,
            }),
          );
          continue;
        }

        // Invariant token comparison: URLs, code, flags, versions, numbers must match
        if (!enEmpty && !jaEmpty) {
          const enTokens = extractInvariantTokens(enCell);
          const jaTokens = extractInvariantTokens(jaCell);
          if (enTokens.length > 0 && enTokens.join('|') !== jaTokens.join('|')) {
            const missing = enTokens.filter((t) => !jaTokens.includes(t));
            const added = jaTokens.filter((t) => !enTokens.includes(t));
            const parts = [];
            if (missing.length > 0) parts.push(`欠落: ${missing.slice(0, 3).join(', ')}`);
            if (added.length > 0) parts.push(`追加: ${added.slice(0, 3).join(', ')}`);
            if (parts.length > 0) {
              issues.push(
                withSeverity({
                  type: 'table-cell-token-mismatch',
                  detail: `テーブル #${t + 1} [${r + 1},${c + 1}]: ${parts.join('; ')}`,
                }),
              );
            }
          }
        }

        // English prose residual: long untranslated English text in JA cell
        // Short labels (UI names, step names) are intentionally English in Testim docs
        if (!jaEmpty && isUntranslatedCell(jaCell)) {
          issues.push(
            withSeverity({
              type: 'table-cell-english-residual',
              detail: `テーブル #${t + 1} [${r + 1},${c + 1}]: "${jaCell.slice(0, 50)}"`,
            }),
          );
        }
      }
    }
  }

  return issues;
}

/**
 * Compare EN snapshot with JA translation for structural issues.
 * Returns an array of issue objects.
 */
export function compareSnapshotStructure(enBody, jaBody) {
  const issues = [];

  // --- Image order comparison ---
  const enImages = extractImageSequence(enBody);
  const jaImages = extractImageSequence(jaBody);

  if (enImages.length > 0 && jaImages.length > 0) {
    const enFiles = enImages.map((img) => img.file);
    const jaFiles = jaImages.map((img) => img.file);

    // Find common images and check their relative order
    const commonEn = enFiles.filter((f) => jaFiles.includes(f));
    const commonJa = jaFiles.filter((f) => enFiles.includes(f));

    // Deduplicate while preserving order
    const uniqueEn = [...new Set(commonEn)];
    const uniqueJa = [...new Set(commonJa)];

    if (uniqueEn.length >= 2 && uniqueEn.length === uniqueJa.length) {
      // Check for order mismatches using inversion counting
      const jaIndex = new Map(uniqueJa.map((f, i) => [f, i]));
      const inversions = [];

      for (let i = 0; i < uniqueEn.length; i += 1) {
        for (let j = i + 1; j < uniqueEn.length; j += 1) {
          const a = uniqueEn[i];
          const b = uniqueEn[j];
          if (jaIndex.has(a) && jaIndex.has(b)) {
            if (jaIndex.get(a) > jaIndex.get(b)) {
              inversions.push([a, b]);
            }
          }
        }
      }

      if (inversions.length > 0) {
        const sample = inversions.slice(0, 3).map(([a, b]) => `${a} / ${b}`);
        issues.push(
          withSeverity({
            type: 'image-order-mismatch',
            detail: `画像の順序が原文と異なります (${inversions.length} 箇所): ${sample.join('; ')}`,
          }),
        );
      }
    }
  }

  // --- Callout nesting comparison ---
  const enCallouts = extractCalloutPositions(enBody);
  const jaCallouts = extractCalloutPositions(jaBody);

  // Only compare when callout counts match (ordinal matching is unreliable otherwise)
  if (enCallouts.length === jaCallouts.length && enCallouts.length > 0) {
    for (let i = 0; i < enCallouts.length; i += 1) {
      if (enCallouts[i].depth !== jaCallouts[i].depth) {
        const enLevel = enCallouts[i].depth === 0 ? 'トップレベル' : 'ネスト';
        const jaLevel = jaCallouts[i].depth === 0 ? 'トップレベル' : 'ネスト';
        issues.push(
          withSeverity({
            type: 'callout-nesting-mismatch',
            line: jaCallouts[i].line,
            detail: `callout #${i + 1}: EN=${enLevel} → JA=${jaLevel}`,
          }),
        );
      }
    }
  }

  // --- Table structure comparison ---
  issues.push(...compareTableStructure(enBody, jaBody));

  // --- Section-based comparisons (steps, bullets, paragraphs) ---
  // Normalise EN headings: strip title H1, demote remaining H1→H2
  const normalizedEnBody = stripTitleH1(enBody);

  // --- Section count mismatch (H2-H4 key count comparison) ---
  // Count headings outside code blocks for accurate comparison
  const countSectionHeadings = (body) => {
    let count = 0;
    let inCode = false;
    for (const line of body.split('\n')) {
      if (FENCE_LINE_RE.test(line)) { inCode = !inCode; continue; }
      if (!inCode && /^#{2,4}\s+/.test(line)) count += 1;
    }
    return count;
  };
  const enSectionCount = countSectionHeadings(normalizedEnBody);
  const jaSectionCount = countSectionHeadings(jaBody);
  if (enSectionCount > 0 && enSectionCount !== jaSectionCount) {
    issues.push(
      withSeverity({
        type: 'section-count-mismatch',
        detail: `H2-H4 セクション数: EN=${enSectionCount}, JA=${jaSectionCount}`,
      }),
    );
  }

  const enSteps = extractStepCounts(normalizedEnBody);
  const jaSteps = extractStepCounts(jaBody);
  const enBullets = extractBulletCounts(normalizedEnBody);
  const jaBullets = extractBulletCounts(jaBody);
  const enParagraphs = extractParagraphCounts(normalizedEnBody);
  const jaParagraphs = extractParagraphCounts(jaBody);

  // Coarse total step comparison (kept for large-scale mismatches)
  const enTotal = [...enSteps.values()].reduce((a, b) => a + b, 0);
  const jaTotal = [...jaSteps.values()].reduce((a, b) => a + b, 0);

  if (enTotal > 0 && jaTotal > 0 && enTotal !== jaTotal) {
    const absDiff = Math.abs(jaTotal - enTotal);
    const pctDiff = absDiff / Math.max(enTotal, jaTotal);
    if (absDiff > 3 && pctDiff > 0.1) {
      const diff = jaTotal - enTotal;
      const direction = diff > 0 ? '多い' : '少ない';
      issues.push(
        withSeverity({
          type: 'step-count-mismatch',
          detail: `番号付きステップ数が原文と異なります: EN=${enTotal}, JA=${jaTotal} (${Math.abs(diff)} ${direction})`,
        }),
      );
    }
  }

  // Per-section comparisons (ordinal matching, diff >= 1)
  issues.push(
    ...compareSectionCounts(enSteps, jaSteps, 'step-count-mismatch', 'ステップ数'),
    ...compareSectionCounts(enBullets, jaBullets, 'bullet-count-mismatch', '箇条書き数'),
    ...compareSectionCounts(enParagraphs, jaParagraphs, 'paragraph-count-mismatch', '段落数', 2),
  );

  return issues;
}

export function summarizeParityResults(results) {
  const issuesByType = {};
  const issuesBySeverity = {};
  let actionableFiles = 0;
  let signalFiles = 0;
  let errorFiles = 0;

  for (const result of results) {
    let hasActionable = false;
    let hasSignal = false;
    let hasError = false;

    for (const issue of result.issues) {
      issuesByType[issue.type] = (issuesByType[issue.type] || 0) + 1;
      issuesBySeverity[issue.severity] = (issuesBySeverity[issue.severity] || 0) + 1;

      if (issue.severity === 'actionable') hasActionable = true;
      if (issue.severity === 'signal') hasSignal = true;
      if (issue.severity === 'error') hasError = true;
    }

    if (hasActionable) {
      actionableFiles += 1;
    } else if (hasError) {
      errorFiles += 1;
    } else if (hasSignal) {
      signalFiles += 1;
    }
  }

  return {
    filesWithIssues: results.length,
    actionableFiles,
    signalFiles,
    errorFiles,
    issuesByType,
    issuesBySeverity,
  };
}
