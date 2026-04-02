import fs from 'node:fs';
import path from 'node:path';

import { extractSlug as extractSlugFromUrl, matchAllTricentisUrls } from './madcap_toc.mjs';
import {
  FENCE_LINE_RE,
  H1_IN_BODY_RE,
  ISSUE_SEVERITY,
  JSX_CALLOUT_RE,
  LEGACY_CALLOUT_RE,
  UNTRANSLATED_PATTERNS,
} from './source_parity_types.mjs';

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
  if (/^(?:#{1,6}\s|[-*>|]|```|:::|!\[|<!--|\[.*\]\()/.test(trimmed)) return false;
  if (/^<\/?(?:table|thead|tbody|tr|td|th|details|summary|img|kbd|br|hr|Image)\b/i.test(trimmed)) {
    return false;
  }
  if (/[\u3000-\u9FFF\uF900-\uFAFF]/.test(trimmed)) return false;

  const textOnly = trimmed.replace(/^\d+\.\s*/, '');
  if (!textOnly || textOnly.length < 15) return false;

  return UNTRANSLATED_PATTERNS.some((pattern) => pattern.test(textOnly));
}

export function loadSidebarSlugs(sidebarText) {
  const slugs = new Set();
  for (const match of matchAllTricentisUrls(sidebarText)) {
    const slug = extractSlugFromUrl(match[0]);
    if (slug) slugs.add(slug);
  }
  return slugs;
}

export function localCheck({ body, sidebarSlugs, slug }) {
  const issues = [];
  const lines = body.split('\n');
  let inCodeBlock = false;

  if (sidebarSlugs && slug && !sidebarSlugs.has(slug)) {
    issues.push(withSeverity({ type: 'orphan-page', detail: 'SIDEBAR_URLS.md に未掲載' }));
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
        })
      );
    }

    if (JSX_CALLOUT_RE.test(line.trim())) {
      issues.push(
        withSeverity({
          type: 'jsx-callout',
          line: index + 1,
          text: line.trim().slice(0, 80),
        })
      );
    }

    if (H1_IN_BODY_RE.test(line) && index > 0) {
      issues.push(
        withSeverity({
          type: 'h1-in-body',
          line: index + 1,
          text: line.trim().slice(0, 80),
        })
      );
    }

    if (isEnglishOnlyLine(line)) {
      issues.push(
        withSeverity({
          type: 'untranslated',
          line: index + 1,
          text: line.trim().slice(0, 100),
        })
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

const IMAGE_PATTERNS = [
  /!\[[^\]]*\]\(([^)]+)\)/g,
  /<Image\b[^>]*\bsrc\s*=\s*"([^"]+)"/g,
  /<img\b[^>]*\bsrc\s*=\s*"([^"]+)"/gi,
];

export function extractImageSequence(body) {
  const lines = body.split('\n');
  const images = [];
  let inCodeBlock = false;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (FENCE_LINE_RE.test(line)) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    for (const pattern of IMAGE_PATTERNS) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(line)) !== null) {
        const source = match[1];
        const file = source
          .split('/')
          .pop()
          .replace(/\.[^.]+$/, '');
        images.push({ file, line: index + 1 });
      }
    }
  }

  return images;
}

export function extractCalloutPositions(body) {
  const lines = body.split('\n');
  const callouts = [];
  let inCodeBlock = false;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (FENCE_LINE_RE.test(line)) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    const directiveMatch = line.match(/^(\s*):::(note|warning|info|tip|caution|danger)/);
    if (directiveMatch) {
      const indent = directiveMatch[1].length;
      callouts.push({ type: directiveMatch[2], depth: indent >= 2 ? 1 : 0, line: index + 1 });
      continue;
    }

    const trimmedForCallout = line.trimStart();
    if (LEGACY_CALLOUT_RE.test(trimmedForCallout)) {
      const indent = line.match(/^(\s*)/)[1].length;
      const typeMatch = line.match(/(📘|🚧|❗️?|⚠️|👍|📝|✅|❌|💡|ℹ️)/);
      callouts.push({
        type: typeMatch ? typeMatch[1] : 'unknown',
        depth: indent >= 2 ? 1 : 0,
        line: index + 1,
      });
    }
  }

  return callouts;
}

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
      if (!sections.has(currentSection)) sections.set(currentSection, 0);
      continue;
    }

    if (!inCallout && /^\d+(?:\\)?\.\s/.test(line)) {
      sections.set(currentSection, (sections.get(currentSection) || 0) + 1);
    }
  }

  return sections;
}

export function stripTitleH1(body) {
  let firstH1Skipped = false;
  return body
    .split('\n')
    .map((line) => {
      if (!/^# /.test(line)) return line;
      if (!firstH1Skipped) {
        firstH1Skipped = true;
        return '';
      }
      return line.replace(/^# /, '## ');
    })
    .join('\n');
}

export function normalizeEnArtifacts(body) {
  let normalized = body;
  const wrappingFence = /^```\w*\n([\s\S]*)\n```\s*$/.exec(normalized.trim());
  if (wrappingFence) {
    normalized = wrappingFence[1];
  }

  const processed = [];
  for (const originalLine of normalized.split('\n')) {
    let line = originalLine.replace(/[\u200B\u200C\u200D\uFEFF]/g, '');

    if (/^\d+\.\D/.test(line) && !/^\d+\.\d+\./.test(line)) {
      line = line.replace(/^(\d+)\.(\S)/, '$1. $2');
    }

    if (/^[\s]*$/.test(line) && originalLine !== line && originalLine.trim().length > 0) {
      continue;
    }

    if (line.endsWith('\\')) {
      line = line.slice(0, -1).trimEnd();
    }

    processed.push(line);
  }

  const result = processed.join('\n');
  return result.endsWith('\n') ? result : `${result}\n`;
}

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
      if (!sections.has(currentSection)) sections.set(currentSection, 0);
      continue;
    }

    if (!inCallout && /^[-*+]\s/.test(trimmed)) {
      sections.set(currentSection, (sections.get(currentSection) || 0) + 1);
    }
  }

  return sections;
}

function createExtractState(state = {}) {
  return {
    currentSection: '__top__',
    inCallout: false,
    inCodeBlock: false,
    inHtmlComment: false,
    inParagraph: false,
    inTable: false,
    ...state,
  };
}

export function classifyLine(line, state = {}) {
  const nextState = createExtractState(state);
  const trimmed = line.trim();

  if (FENCE_LINE_RE.test(line)) {
    nextState.inCodeBlock = !nextState.inCodeBlock;
    nextState.inParagraph = false;
    return { kind: 'fence', nextState };
  }
  if (nextState.inCodeBlock) {
    nextState.inParagraph = false;
    return { kind: 'code', nextState };
  }

  if (/^<(?:Table|table)\b/i.test(trimmed)) {
    nextState.inTable = true;
    nextState.inParagraph = false;
    return { kind: 'table-open', nextState };
  }
  if (nextState.inTable && /^<\/(?:Table|table)>/i.test(trimmed)) {
    nextState.inTable = false;
    return { kind: 'table-close', nextState };
  }
  if (nextState.inTable) {
    nextState.inParagraph = false;
    return { kind: 'table', nextState };
  }

  if (/^:::(note|warning|info|tip|caution|danger)/.test(trimmed)) {
    nextState.inCallout = true;
    nextState.inParagraph = false;
    return { kind: 'callout-open', nextState };
  }
  if (nextState.inCallout && trimmed === ':::') {
    nextState.inCallout = false;
    nextState.inParagraph = false;
    return { kind: 'callout-close', nextState };
  }
  if (nextState.inCallout) {
    return { kind: 'callout', nextState };
  }

  if (/^>/.test(trimmed)) {
    nextState.inParagraph = false;
    return { kind: 'blockquote', nextState };
  }

  const headingMatch = line.match(/^#{2,4}\s+(.+)/);
  if (headingMatch) {
    nextState.currentSection = headingMatch[1].trim();
    nextState.inCallout = false;
    nextState.inParagraph = false;
    return { kind: 'heading', heading: nextState.currentSection, nextState };
  }

  if (/^\d+(?:\\)?\.\s/.test(line)) {
    nextState.inParagraph = false;
    return { kind: 'ordered-list', nextState };
  }
  if (/^[-*+]\s/.test(trimmed) || /^\s+[-*+]\s/.test(line)) {
    nextState.inParagraph = false;
    return { kind: 'unordered-list', nextState };
  }
  if (/^!\[/.test(trimmed) || /<img\b/i.test(trimmed) || /<Image\b/.test(trimmed)) {
    nextState.inParagraph = false;
    return { kind: 'image', nextState };
  }
  if (/^\|/.test(trimmed)) {
    nextState.inParagraph = false;
    return { kind: 'markdown-table', nextState };
  }
  if (/^<\/?(br|hr|div|details|summary)\b/i.test(trimmed)) {
    nextState.inParagraph = false;
    return { kind: 'html-structure', nextState };
  }
  if (/^<\/?(thead|tbody|tfoot|tr|td|th)\b/i.test(trimmed)) {
    nextState.inParagraph = false;
    return { kind: 'html-table-structure', nextState };
  }

  if (nextState.inHtmlComment) {
    if (/-->/.test(trimmed)) nextState.inHtmlComment = false;
    nextState.inParagraph = false;
    return { kind: 'html-comment', nextState };
  }
  if (/^<!--/.test(trimmed)) {
    if (!/-->/.test(trimmed)) nextState.inHtmlComment = true;
    nextState.inParagraph = false;
    return { kind: 'html-comment-start', nextState };
  }

  if (!trimmed || /^[\u200B\u200C\u200D\uFEFF]+$/.test(trimmed)) {
    nextState.inParagraph = false;
    return { kind: 'blank', nextState };
  }

  if (!nextState.inParagraph) {
    nextState.inParagraph = true;
    return { kind: 'paragraph-start', nextState };
  }

  return { kind: 'paragraph', nextState };
}

export function extractParagraphCounts(body) {
  const sections = new Map();
  let state = createExtractState();

  for (const line of body.split('\n')) {
    const classification = classifyLine(line, state);
    state = classification.nextState;

    if (classification.kind === 'heading') {
      if (!sections.has(classification.heading)) {
        sections.set(classification.heading, 0);
      }
      continue;
    }

    if (classification.kind === 'paragraph-start') {
      sections.set(state.currentSection, (sections.get(state.currentSection) || 0) + 1);
    }
  }

  return sections;
}

export function extractHeadingSequence(body) {
  const headings = [];
  let inCodeBlock = false;

  for (const line of body.split('\n')) {
    if (FENCE_LINE_RE.test(line)) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    const match = line.match(/^(#{2,6})\s+(.+)/);
    if (match) {
      headings.push({ level: match[1].length, text: match[2].trim() });
    }
  }

  return headings;
}

function compareSectionCounts(enMap, jaMap, issueType, label, minDiff = 1) {
  const issues = [];
  const enSections = [...enMap.entries()].filter(([key]) => key !== '__top__');
  const jaSections = [...jaMap.entries()].filter(([key]) => key !== '__top__');

  if (enSections.length > 0 && enSections.length === jaSections.length) {
    for (let index = 0; index < enSections.length; index += 1) {
      const [enHeading, enCount] = enSections[index];
      const [, jaCount] = jaSections[index];
      const diff = jaCount - enCount;
      if (Math.abs(diff) >= minDiff && (enCount > 0 || jaCount > 0)) {
        issues.push(
          withSeverity({
            type: issueType,
            detail: `セクション #${index + 1} "${enHeading}": ${label} EN=${enCount}, JA=${jaCount} (${diff > 0 ? '+' : ''}${diff})`,
          })
        );
      }
    }
    return issues;
  }

  if (enSections.length === 0 && jaSections.length === 0) return issues;

  const enTotal = [...enMap.values()].reduce((sum, value) => sum + value, 0);
  const jaTotal = [...jaMap.values()].reduce((sum, value) => sum + value, 0);
  if (
    enTotal !== jaTotal &&
    (enTotal > 0 || jaTotal > 0) &&
    Math.abs(jaTotal - enTotal) >= minDiff
  ) {
    const diff = jaTotal - enTotal;
    issues.push(
      withSeverity({
        type: issueType,
        detail: `${label}の総数が原文と異なります: EN=${enTotal}, JA=${jaTotal} (${diff > 0 ? '+' : ''}${diff})`,
      })
    );
  }

  return issues;
}

export function stripMarkdown(text) {
  return text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/`[^`]*`/g, '')
    .replace(/\*\*([^*]*)\*\*/g, '$1')
    .replace(/\*([^*]*)\*/g, '$1')
    .replace(/(?<![a-zA-Z0-9])_([^_]+)_(?![a-zA-Z0-9])/g, '$1')
    .replace(/~~([^~]*)~~/g, '$1')
    .trim();
}

export function isUntranslatedCell(cell) {
  const stripped = stripMarkdown(cell).trim();
  if (stripped.length < 20) return false;
  if (/^https?:\/\//.test(stripped)) return false;
  if (/^[`']/.test(stripped)) return false;
  if (/^\d+(\.\d+)?%?$/.test(stripped)) return false;
  if (/[\u3000-\u9FFF\uF900-\uFAFF]/.test(stripped)) return false;
  if (/^[a-z][a-zA-Z0-9]*$/.test(stripped)) return false;
  if (/^[A-Z][a-z][a-zA-Z0-9]*$/.test(stripped)) return false;
  if (/^[a-zA-Z_]\w*(?:\.\w+)+$/.test(stripped)) return false;
  if (
    /(?:^|[\s+,/])(?:Alt|Ctrl|Cmd|Shift|Enter|Tab|Esc|Space|Option|Command|Control|Delete|Backspace|Return|Home|End|F\d{1,2}|[⌥⌘⌃⇧])\b/i.test(
      stripped
    ) &&
    /[+/,]/.test(stripped)
  ) {
    return false;
  }
  if (/^\d+\s*(?:s|ms|px|em|rem|%|MB|GB|KB)$/i.test(stripped)) return false;

  const words = stripped.split(/\s+/);
  if (words.length < 3) return false;

  const letters = stripped.replace(/[^A-Za-z]/g, '');
  return letters.length / stripped.length > 0.6;
}

export function extractMarkdownTables(body) {
  const lines = body.split('\n');
  const tables = [];
  let currentTable = null;
  let inCodeBlock = false;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
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
      const isSeparator = /^\|[\s:|-]+\|$/.test(trimmed);
      const cells = trimmed
        .slice(1, -1)
        .split('|')
        .map((cell) => cell.trim());

      if (!currentTable) currentTable = { rows: [], line: index + 1 };
      if (!isSeparator) currentTable.rows.push(cells);
      continue;
    }

    if (currentTable) {
      tables.push(currentTable);
      currentTable = null;
    }
  }

  if (currentTable) tables.push(currentTable);
  return tables;
}

export function extractHtmlTables(body) {
  const tables = [];
  const tableRegex = /<table\b[^>]*>([\s\S]*?)<\/table>/gi;
  let tableMatch;

  while ((tableMatch = tableRegex.exec(body)) !== null) {
    const tableHtml = tableMatch[1];
    const line = body.slice(0, tableMatch.index).split('\n').length;
    const rows = [];

    const rowRegex = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
    let rowMatch;
    while ((rowMatch = rowRegex.exec(tableHtml)) !== null) {
      const cells = [];
      const cellRegex = /<(?:td|th)\b[^>]*>([\s\S]*?)<\/(?:td|th)>/gi;
      let cellMatch;
      while ((cellMatch = cellRegex.exec(rowMatch[1])) !== null) {
        let cellHtml = cellMatch[1];
        cellHtml = cellHtml.replace(
          /<code\b[^>]*>([\s\S]*?)<\/code>/gi,
          (_, content) =>
            `\`${content
              .replace(/<[^>]*>/g, '')
              .replace(/\s+/g, ' ')
              .trim()}\``
        );
        cellHtml = cellHtml.replace(
          /<a\b[^>]*\bhref\s*=\s*"([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi,
          (_, href, text) => `${text.replace(/<[^>]*>/g, '')} [${href}]`
        );
        cells.push(cellHtml.replace(/<[^>]*>/g, '').trim());
      }
      if (cells.length > 0) rows.push(cells);
    }

    if (rows.length > 0) {
      tables.push({ rows, line });
    }
  }

  return tables;
}

function normalizeUrlToken(url) {
  if (url.match(/^https?:\/\/docs\.tricentis\.com\/testim\/content\//)) {
    const slug = extractSlugFromUrl(url);
    if (slug) return `/docs/${slug}`;
  }
  if (/\.htm(?:[?#]|$)/.test(url)) {
    const withLeadingSlash = url.startsWith('/') ? url : `/${url}`;
    const slug = extractSlugFromUrl(withLeadingSlash.replace(/[?#].*$/, ''));
    if (slug) return `/docs/${slug}`;
  }
  return url;
}

export function extractInvariantTokens(cell) {
  const tokenSet = new Set();
  const codeRe = /`([^`]+)`/g;
  let match;
  while ((match = codeRe.exec(cell)) !== null) {
    tokenSet.add(match[1]);
  }

  let rest = cell.replace(/`[^`]*`/g, '');
  const urlRe = /https?:\/\/[^\s)>\]]+/g;
  const urlSpans = [];
  while ((match = urlRe.exec(rest)) !== null) {
    tokenSet.add(normalizeUrlToken(match[0]));
    urlSpans.push([match.index, match.index + match[0].length]);
  }
  for (let index = urlSpans.length - 1; index >= 0; index -= 1) {
    rest =
      rest.slice(0, urlSpans[index][0]) +
      ' '.repeat(urlSpans[index][1] - urlSpans[index][0]) +
      rest.slice(urlSpans[index][1]);
  }

  const linkDestRe =
    /(?:\]\(|(?:^|\s)\[)((?:\/docs\/[\w-]+(?:\/[\w-]+)*(?:#[^\]\)\s]+)?|https?:\/\/[^\s)\]]+|[^\s)\]]*\.htm(?:#[^\]\)\s]*)?))\]?\)?/g;
  const linkSpans = [];
  while ((match = linkDestRe.exec(rest)) !== null) {
    tokenSet.add(normalizeUrlToken(match[1]));
    linkSpans.push([match.index, match.index + match[0].length]);
  }
  for (let index = linkSpans.length - 1; index >= 0; index -= 1) {
    rest =
      rest.slice(0, linkSpans[index][0]) +
      ' '.repeat(linkSpans[index][1] - linkSpans[index][0]) +
      rest.slice(linkSpans[index][1]);
  }

  const flagRe = /(?:^|\s)(--?[a-zA-Z][\w-]*)(?=\s|$)/g;
  while ((match = flagRe.exec(rest)) !== null) tokenSet.add(match[1]);

  const knownDotPrefixRe =
    /^(params|test|config|step|suite|browser|element|window|document|process|module|exports)\./;
  const dotRe = /\b([a-zA-Z_]\w*(?:\.\w+)+)\b/g;
  while ((match = dotRe.exec(rest)) !== null) {
    const dotPath = match[1];
    const segmentCount = dotPath.split('.').length;
    if (segmentCount >= 3 || knownDotPrefixRe.test(dotPath)) {
      tokenSet.add(dotPath);
    }
  }

  const versionRe = /\bv?\d+\.\d+\.\d+\b/g;
  while ((match = versionRe.exec(rest)) !== null) tokenSet.add(match[0]);

  const numberUnitRe = /\b(\d+(?:\.\d+)?\s*(?:sec|ms|s|px|em|rem|%|MB|GB|KB|min|hr))\b/gi;
  while ((match = numberUnitRe.exec(rest)) !== null) {
    tokenSet.add(match[1].replace(/\s+/g, ''));
  }

  const pathRe = /(?:^|\s)(\/[a-zA-Z][\w.-]+(?:\/[\w.-]+)+)/g;
  while ((match = pathRe.exec(rest)) !== null) tokenSet.add(match[1]);

  return [...tokenSet].sort();
}

export function extractTableStructure(body) {
  return [...extractMarkdownTables(body), ...extractHtmlTables(body)].sort(
    (a, b) => a.line - b.line
  );
}

function compareTableStructure(enBody, jaBody) {
  const issues = [];
  const enTables = extractTableStructure(enBody);
  const jaTables = extractTableStructure(jaBody);

  if (enTables.length !== jaTables.length && (enTables.length > 0 || jaTables.length > 0)) {
    issues.push(
      withSeverity({
        type: 'table-shape-mismatch',
        detail: `テーブル数: EN=${enTables.length}, JA=${jaTables.length}`,
      })
    );
    return issues;
  }
  if (enTables.length === 0) return issues;

  for (let tableIndex = 0; tableIndex < enTables.length; tableIndex += 1) {
    const enTable = enTables[tableIndex];
    const jaTable = jaTables[tableIndex];
    const enRows = enTable.rows.length;
    const jaRows = jaTable.rows.length;
    const enCols = enTable.rows[0]?.length || 0;
    const jaCols = jaTable.rows[0]?.length || 0;

    if (enRows !== jaRows || enCols !== jaCols) {
      issues.push(
        withSeverity({
          type: 'table-shape-mismatch',
          detail: `テーブル #${tableIndex + 1}: EN=${enRows}行×${enCols}列, JA=${jaRows}行×${jaCols}列`,
        })
      );
      continue;
    }

    for (let rowIndex = 0; rowIndex < enRows; rowIndex += 1) {
      for (let columnIndex = 0; columnIndex < enCols; columnIndex += 1) {
        const enCell = (enTable.rows[rowIndex]?.[columnIndex] || '').trim();
        const jaCell = (jaTable.rows[rowIndex]?.[columnIndex] || '').trim();
        const enEmpty = enCell.length === 0;
        const jaEmpty = jaCell.length === 0;

        if (enEmpty !== jaEmpty) {
          issues.push(
            withSeverity({
              type: 'table-cell-empty-mismatch',
              detail: `テーブル #${tableIndex + 1} [${rowIndex + 1},${columnIndex + 1}]: EN=${enEmpty ? '空' : '非空'}, JA=${jaEmpty ? '空' : '非空'}`,
            })
          );
          continue;
        }

        if (!enEmpty && !jaEmpty) {
          const normalizeDocLink = (token) => token.replace(/^(\/docs\/[\w-]+)#.*$/, '$1');
          const enTokens = extractInvariantTokens(enCell).map(normalizeDocLink);
          const jaTokens = extractInvariantTokens(jaCell).map(normalizeDocLink);
          const enSet = [...new Set(enTokens)].sort();
          const jaSet = [...new Set(jaTokens)].sort();

          if (enSet.length > 0 && enSet.join('|') !== jaSet.join('|')) {
            const missing = enSet.filter((token) => !jaSet.includes(token));
            const added = jaSet.filter((token) => !enSet.includes(token));
            const detailParts = [];
            if (missing.length > 0) detailParts.push(`欠落: ${missing.slice(0, 3).join(', ')}`);
            if (added.length > 0) detailParts.push(`追加: ${added.slice(0, 3).join(', ')}`);
            if (detailParts.length > 0) {
              issues.push(
                withSeverity({
                  type: 'table-cell-token-mismatch',
                  detail: `テーブル #${tableIndex + 1} [${rowIndex + 1},${columnIndex + 1}]: ${detailParts.join('; ')}`,
                })
              );
            }
          }
        }

        const normalizeForCompare = (value) =>
          stripMarkdown(value)
            .replace(/\s*\[[^\]]*\]\s*/g, ' ')
            .trim()
            .replace(/\s+/g, ' ')
            .toLowerCase();
        if (
          !jaEmpty &&
          normalizeForCompare(enCell) !== normalizeForCompare(jaCell) &&
          isUntranslatedCell(jaCell)
        ) {
          issues.push(
            withSeverity({
              type: 'table-cell-english-residual',
              detail: `テーブル #${tableIndex + 1} [${rowIndex + 1},${columnIndex + 1}]: "${jaCell.slice(0, 50)}"`,
            })
          );
        }
      }
    }
  }

  return issues;
}

export function detectEnArtifacts(enBody) {
  const artifacts = [];
  if (/<details\b/i.test(enBody)) artifacts.push('EN uses <details> blocks');

  const lines = enBody.split('\n');
  let fenceDepth = 0;
  let fencedLines = 0;
  for (const line of lines) {
    if (/^```/.test(line.trim())) {
      fenceDepth = fenceDepth === 0 ? 1 : 0;
    } else if (fenceDepth > 0) {
      fencedLines += 1;
    }
  }
  if (fencedLines > lines.length * 0.5) {
    artifacts.push('EN body largely wrapped in code fence');
  }
  return artifacts;
}

export function compareSnapshotStructure(enBody, jaBody) {
  const issues = [];
  const enArtifacts = detectEnArtifacts(enBody);
  const enImages = extractImageSequence(enBody);
  const jaImages = extractImageSequence(jaBody);

  if (enImages.length > 0 && jaImages.length > 0) {
    const enFiles = enImages.map((image) => image.file);
    const jaFiles = jaImages.map((image) => image.file);
    const uniqueEn = [...new Set(enFiles.filter((file) => jaFiles.includes(file)))];
    const uniqueJa = [...new Set(jaFiles.filter((file) => enFiles.includes(file)))];

    if (uniqueEn.length >= 2 && uniqueEn.length === uniqueJa.length) {
      const jaIndex = new Map(uniqueJa.map((file, index) => [file, index]));
      const inversions = [];

      for (let left = 0; left < uniqueEn.length; left += 1) {
        for (let right = left + 1; right < uniqueEn.length; right += 1) {
          const first = uniqueEn[left];
          const second = uniqueEn[right];
          if (
            jaIndex.has(first) &&
            jaIndex.has(second) &&
            jaIndex.get(first) > jaIndex.get(second)
          ) {
            inversions.push([first, second]);
          }
        }
      }

      if (inversions.length > 0) {
        issues.push(
          withSeverity({
            type: 'image-order-mismatch',
            detail: `画像の順序が原文と異なります (${inversions.length} 箇所): ${inversions
              .slice(0, 3)
              .map(([first, second]) => `${first} / ${second}`)
              .join('; ')}`,
          })
        );
      }
    }
  }

  const enCallouts = extractCalloutPositions(enBody);
  const jaCallouts = extractCalloutPositions(jaBody);
  if (enCallouts.length === jaCallouts.length && enCallouts.length > 0) {
    for (let index = 0; index < enCallouts.length; index += 1) {
      if (enCallouts[index].depth === jaCallouts[index].depth) continue;
      const enLevel = enCallouts[index].depth === 0 ? 'トップレベル' : 'ネスト';
      const jaLevel = jaCallouts[index].depth === 0 ? 'トップレベル' : 'ネスト';
      issues.push(
        withSeverity({
          type: 'callout-nesting-mismatch',
          line: jaCallouts[index].line,
          detail: `callout #${index + 1}: EN=${enLevel} → JA=${jaLevel}`,
        })
      );
    }
  }

  issues.push(...compareTableStructure(enBody, jaBody));

  const normalizedEnBody = normalizeEnArtifacts(stripTitleH1(enBody));
  const countSectionHeadings = (body) => {
    let count = 0;
    let inCode = false;
    for (const line of body.split('\n')) {
      if (FENCE_LINE_RE.test(line)) {
        inCode = !inCode;
        continue;
      }
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
      })
    );
  }

  const enHeadings = extractHeadingSequence(normalizedEnBody);
  const jaHeadings = extractHeadingSequence(jaBody);
  const headingCompareLength = Math.min(enHeadings.length, jaHeadings.length);
  if (headingCompareLength > 0) {
    const mismatches = [];
    for (let index = 0; index < headingCompareLength; index += 1) {
      if (enHeadings[index].level !== jaHeadings[index].level) {
        mismatches.push({ en: enHeadings[index], ja: jaHeadings[index] });
      }
    }
    if (mismatches.length > 0) {
      issues.push(
        withSeverity({
          type: 'heading-mismatch',
          detail: `見出しレベル不一致 (${mismatches.length}件): ${mismatches
            .slice(0, 3)
            .map(
              (mismatch) =>
                `EN H${mismatch.en.level} '${mismatch.en.text}' → JA H${mismatch.ja.level}`
            )
            .join('; ')}`,
        })
      );
    }
  }

  const enSteps = extractStepCounts(normalizedEnBody);
  const jaSteps = extractStepCounts(jaBody);
  const enBullets = extractBulletCounts(normalizedEnBody);
  const jaBullets = extractBulletCounts(jaBody);
  const enParagraphs = extractParagraphCounts(normalizedEnBody);
  const jaParagraphs = extractParagraphCounts(jaBody);

  const enStepTotal = [...enSteps.values()].reduce((sum, value) => sum + value, 0);
  const jaStepTotal = [...jaSteps.values()].reduce((sum, value) => sum + value, 0);
  if (enStepTotal > 0 && jaStepTotal > 0 && enStepTotal !== jaStepTotal) {
    const diff = jaStepTotal - enStepTotal;
    issues.push(
      withSeverity({
        type: 'step-count-mismatch',
        detail: `番号付きステップ数が原文と異なります: EN=${enStepTotal}, JA=${jaStepTotal} (${Math.abs(diff)} ${diff > 0 ? '多い' : '少ない'})`,
      })
    );
  }

  issues.push(
    ...compareSectionCounts(enSteps, jaSteps, 'step-count-mismatch', 'ステップ数'),
    ...compareSectionCounts(enBullets, jaBullets, 'bullet-count-mismatch', '箇条書き数'),
    ...compareSectionCounts(enParagraphs, jaParagraphs, 'paragraph-count-mismatch', '段落数')
  );

  if (enArtifacts.length > 0) {
    for (const issue of issues) {
      issue.artifacts = enArtifacts;
    }
  }

  return issues;
}

export function checkSidebarCoverage({ sidebarSlugs, existingSlugs }) {
  const issues = [];
  for (const slug of sidebarSlugs) {
    if (!existingSlugs.has(slug)) {
      issues.push(
        withSeverity({
          type: 'sidebar-missing-file',
          detail: `SIDEBAR_URLS.md に掲載だがローカルファイルが存在しない: ${slug}`,
        })
      );
    }
  }
  return issues;
}

export function checkSourceSnapshotMissing({ slug, sourceUrl, snapshotsDir }) {
  if (!sourceUrl) return [];

  const snapshotPath = path.join(snapshotsDir, `${slug}.html`);
  if (fs.existsSync(snapshotPath)) return [];

  return [
    withSeverity({
      type: 'source-snapshot-missing',
      detail: `sourceUrl があるが EN スナップショットが存在しない: ${slug}`,
    }),
  ];
}
