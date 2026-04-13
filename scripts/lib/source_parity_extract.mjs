/** source parity 用に Markdown 構造を抽出・解析する補助関数群。 */
import { extractSlug as extractSlugFromUrl } from './madcap_toc.mjs';
import { resolveToFullSlug } from './project.mjs';
import { FENCE_LINE_RE } from './source_parity_types.mjs';

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
    if (/^>\s*(?:📘|❗️?|🚧|👍|⚠️|📝|✅|❌|💡|ℹ️|⛔|🔥|💥|🎯|📌|🏷️)\s/.test(trimmedForCallout)) {
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

function extractTrailingContentAfterLeadingMarkdownImage(line) {
  if (!/^!\[/.test(line)) return null;
  const afterImage = line.replace(/^!\[[^\]]*\]\([^)"]*(?:\s+"[^"]*")?\)\s*/, '');
  if (afterImage.length === 0 || /^!\[/.test(afterImage)) return null;
  return afterImage;
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

    // Markdown の pipe table 行は、セル内の記号を箇条書きとして数えない。
    if (/^\|/.test(trimmed)) continue;

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

    const listCandidate = extractTrailingContentAfterLeadingMarkdownImage(trimmed) ?? line;
    if (!inCallout && /^\d+(?:\\)?\.\s/.test(listCandidate)) {
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

    // Markdown の pipe table 行は、セル内の記号を箇条書きとして数えない。
    if (/^\|/.test(trimmed)) continue;

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

    const listCandidate =
      extractTrailingContentAfterLeadingMarkdownImage(trimmed) ?? trimmed;
    if (!inCallout && /^[-*+]\s/.test(listCandidate)) {
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
    // 画像記法の後ろに本文が続く行の分類。turndown が `![](img)3.  text`
    // のように画像とリスト項目を 1 行に連結することがあるため、後続部分の
    // 構造を判定してリスト / 段落を正しく分類する。
    if (/^!\[/.test(trimmed)) {
      const afterImage = extractTrailingContentAfterLeadingMarkdownImage(trimmed);
      if (afterImage) {
        if (/^\d+(?:\\)?\.\s/.test(afterImage)) {
          nextState.inParagraph = false;
          return { kind: 'ordered-list', nextState };
        }
        if (/^[-*+]\s/.test(afterImage)) {
          nextState.inParagraph = false;
          return { kind: 'unordered-list', nextState };
        }
        nextState.inParagraph = true;
        return { kind: 'paragraph-start', nextState };
      }
    }
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

// 相対 `.htm` link は親パスを省略することがあるため、比較前に full slug へ正規化する。
function normalizeUrlToken(url) {
  // MadCap の `\&amp;` エスケープが entity decode 後に `\&` として残るため、
  // backslash を除去してから正規化する。
  const cleaned = url.replace(/\\/g, '');
  if (cleaned.match(/^https?:\/\/docs\.tricentis\.com\/testim\/content\//)) {
    const slug = extractSlugFromUrl(cleaned.replace(/[?#].*$/, ''));
    if (slug) return `/docs/${resolveToFullSlug(slug)}`;
  }
  if (/\.htm(?:[?#]|$)/.test(cleaned)) {
    // 相対 prefix (../../, ../, ./) と fragment/query を落とす。
    const stripped = cleaned.replace(/^(?:\.\.\/)+|^(?:\.\/)+/, '').replace(/[?#].*$/, '');
    // すでに root-relative な /content/ path はそのまま使う。
    const contentPath = stripped.startsWith('/content/') ? stripped : `/content/${stripped}`;
    const slug = extractSlugFromUrl(contentPath);
    if (slug) return `/docs/${resolveToFullSlug(slug)}`;
  }
  // /docs/ path は fragment を落として比較する。EN/JA で fragment がずれるため。
  if (cleaned.startsWith('/docs/') && cleaned.includes('#')) {
    return cleaned.replace(/#.*$/, '');
  }
  return cleaned;
}

// WRITING_GUIDE「原文から意図的に除外するコンテンツ」で JA から削除すると
// 指定されている既知 URL 一覧。EN/JA 両側の invariant token から除外して、
// guide 準拠の JA と EN snapshot の間で token-gap が発生しないようにする。
const EXCLUDED_INVARIANT_URL_TOKENS = Object.freeze(
  new Set([
    'https://www.testim.io/pricing/',
    'https://www.testim.io/pricing',
  ]),
);

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

  // WRITING_GUIDE 除外ルール: JA から削除された既知 URL は EN 側でも token
  // として emit しない。これにより guide 準拠の JA と raw EN snapshot の
  // 間で false-positive な segment-token-gap が発生しない。
  for (const excluded of EXCLUDED_INVARIANT_URL_TOKENS) {
    tokenSet.delete(excluded);
  }

  return [...tokenSet].sort();
}

export function extractTableStructure(body) {
  return [...extractMarkdownTables(body), ...extractHtmlTables(body)].sort(
    (a, b) => a.line - b.line
  );
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
