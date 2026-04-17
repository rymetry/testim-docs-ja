/** source parity 用に Markdown 構造を抽出・解析する補助関数群。 */
import { extractSlug as extractSlugFromUrl } from './madcap_toc.mjs';
import { buildBasenameToPathMap, resolveToFullSlug } from './project.mjs';
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

/**
 * Section 5.3.5: Insert a space after an ordered-list-item period when the
 * body of that list item is glued to the numeral (e.g. `1.foo` to `1. foo`).
 *
 * Guards:
 *   - Only triggers when the first character after the period is a non-space
 *     non-digit.
 *   - Skips sub-step numbering like `1.1.` / `2.3.` so decimal / IP-like
 *     constructs (`1.0`, `1.2.3.4`) are untouched.
 *
 * This helper is deliberately minimal so it can be applied symmetrically to
 * BOTH EN and JA bodies inside `compareSnapshotStructure` without carrying
 * the EN-only artifact strips (wrapping fence unwrap, zero-width whitespace
 * line collapse, trailing backslash strip). Those remain the exclusive
 * responsibility of `normalizeEnArtifacts`.
 *
 * Rationale: turndown output and directly-authored markdown can expose the
 * same `\d+\.(\S)` pattern on either side. A single-sided normalize causes
 * asymmetric paragraph splitting, which in turn emits audit-signal noise
 * (`paragraph-count-mismatch` / `step-count-mismatch`) even when the two
 * bodies are structurally equivalent. Applying the same insertion to JA
 * eliminates the asymmetry at the source.
 */
export function normalizeNumericPeriodSpacing(body) {
  if (typeof body !== 'string') return body;
  const lines = body.split('\n');
  const processed = lines.map((line) => {
    if (/^\d+\.\D/.test(line) && !/^\d+\.\d+\./.test(line)) {
      return line.replace(/^(\d+)\.(\S)/, '$1. $2');
    }
    return line;
  });
  return processed.join('\n');
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

// GFM §tables-extension: 行頭 (trim 後) の `|` のみが cell 区切りとして機能し、
// `\|` (backslash-escaped) は literal pipe として cell 内容になる。さらに、pipe
// table は直後に separator 行 (`| --- |` / `| :--- |` / `| :---: |`) を必要と
// する — separator 無しの単独 `| ... |` 行は GFM 上では table ではなく段落。
//
// WRITING_GUIDE §5 「broken-table-row paragraph mirror」では、EN MadCap Flare の
// 壊れた table row を JA 側で `\| ... \|` (backslash-escape) として render して、
// 意図的に paragraph に戻す pattern を採用する (salesforce Wave 2 sentinel
// `use-agentic-test-automation-for-salesforce`)。この pattern が table-shape-
// mismatch の false-positive を誘発しないよう、(1) 行頭 backslash-pipe で
// 始まる行は table 扱いしない、(2) cell split は unescaped pipe のみで行い、
// (3) separator 行の存在を要求する。
//
// 参考: https://github.github.com/gfm/#tables-extension-
const GFM_TABLE_SEPARATOR_RE =
  /^\|(?:\s*:?-{1,}:?\s*\|)+$/;
// cell split: backslash-escaped pipe (\|) は文字として扱い、unescaped pipe のみで
// 区切る。JS 正規表現は可変長 lookbehind をサポートするため `(?<!\\)` で十分。
const UNESCAPED_PIPE_SPLIT_RE = /(?<!\\)\|/;

function isGfmTableCandidateLine(trimmed) {
  // 先頭が backslash-pipe (`\|...`) の行は GFM 的に table row ではない。
  // trimmed[0] === '|' かつ末尾が unescaped `|` で終わることを要求する。
  if (!trimmed.startsWith('|')) return false;
  if (!/(?<!\\)\|\s*$/.test(trimmed)) return false;
  // 内容部 (先頭末尾の `|` を除く) が空の場合も table ではない。
  const inner = trimmed.slice(1, trimmed.lastIndexOf('|'));
  return inner.trim().length > 0;
}

function splitGfmTableCells(trimmed) {
  // 先頭 `|` と末尾 unescaped `|` を削ぎ、unescaped pipe で split する。
  const lastPipeIndex = trimmed.lastIndexOf('|');
  const inner = trimmed.slice(1, lastPipeIndex);
  return inner
    .split(UNESCAPED_PIPE_SPLIT_RE)
    .map((cell) => cell.trim().replace(/\\\|/g, '|'));
}

export function extractMarkdownTables(body) {
  const lines = body.split('\n');
  const tables = [];
  let inCodeBlock = false;

  // pending candidate rows を蓄積し、separator 行を検出した時点で確定する。
  // separator に到達しないまま候補行が途切れたら (非候補行が来たら) 破棄する。
  let pendingRows = null; // { rows: [{cells}], startIndex: number }

  function flushPending() {
    pendingRows = null;
  }

  function finalizePendingAsTable() {
    if (!pendingRows) return;
    tables.push({ rows: pendingRows.rows, line: pendingRows.startIndex + 1 });
    pendingRows = null;
  }

  let confirmedTable = null; // 既に separator 確定済みの table (後続 body row を追加)

  function closeConfirmedTable() {
    if (!confirmedTable) return;
    tables.push(confirmedTable);
    confirmedTable = null;
  }

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (FENCE_LINE_RE.test(line)) {
      inCodeBlock = !inCodeBlock;
      flushPending();
      closeConfirmedTable();
      continue;
    }
    if (inCodeBlock) continue;

    const trimmed = line.trim();

    // separator 行の検出 (確定待ちの header 行を table として固定する)
    if (GFM_TABLE_SEPARATOR_RE.test(trimmed)) {
      if (pendingRows && pendingRows.rows.length >= 1) {
        confirmedTable = {
          rows: pendingRows.rows.slice(),
          line: pendingRows.startIndex + 1,
        };
        pendingRows = null;
      } else {
        // separator だけで先行の header が無い場合は無視 (broken markdown)。
        flushPending();
      }
      continue;
    }

    if (isGfmTableCandidateLine(trimmed)) {
      const cells = splitGfmTableCells(trimmed);
      if (confirmedTable) {
        // separator 確定後の body row として追加。
        confirmedTable.rows.push(cells);
        continue;
      }
      if (!pendingRows) {
        pendingRows = { rows: [], startIndex: index };
      }
      pendingRows.rows.push(cells);
      continue;
    }

    // 候補行が途切れた: separator 未到達の pending は GFM 上 table では
    // ないため破棄。separator 確定済みの table は確定保存。
    flushPending();
    closeConfirmedTable();
  }

  // 末尾処理 — pending は separator 未到達のため破棄、confirmed は保存。
  flushPending();
  closeConfirmedTable();

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
    if (slug) {
      const full = resolveToFullSlug(slug);
      // ambiguous basename (null from buildBasenameToPathMap): skip URL token
      // emission to avoid false-positive token-gap vs a JA side that uses
      // the canonical path-based URL. The original URL is still in the raw
      // text so content comparison happens at textNorm / weak-position level.
      if (buildBasenameToPathMap().get(slug.split('/').pop()) === null) return null;
      return `/docs/${full}`;
    }
  }
  if (/\.htm(?:[?#]|$)/.test(cleaned)) {
    // 相対 prefix (../../, ../, ./) と fragment/query を落とす。
    const stripped = cleaned.replace(/^(?:\.\.\/)+|^(?:\.\/)+/, '').replace(/[?#].*$/, '');
    // すでに root-relative な /content/ path はそのまま使う。
    const contentPath = stripped.startsWith('/content/') ? stripped : `/content/${stripped}`;
    const slug = extractSlugFromUrl(contentPath);
    if (slug) {
      const full = resolveToFullSlug(slug);
      // ambiguous basename: skip URL token emission (see comment above).
      if (buildBasenameToPathMap().get(slug.split('/').pop()) === null) return null;
      return `/docs/${full}`;
    }
  }
  // /docs/ path は fragment を落として比較する。EN/JA で fragment がずれるため。
  if (cleaned.startsWith('/docs/') && cleaned.includes('#')) {
    return cleaned.replace(/#.*$/, '');
  }
  return cleaned;
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
    const token = normalizeUrlToken(match[0]);
    if (token !== null) tokenSet.add(token);
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
    const token = normalizeUrlToken(match[1]);
    if (token !== null) tokenSet.add(token);
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
