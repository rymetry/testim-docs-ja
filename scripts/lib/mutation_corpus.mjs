/**
 * Synthetic mutation corpus generator for diff=1 recall testing.
 *
 * Produces minimally-mutated JA markdown content (exactly one structural change)
 * for each of 9 mutation types. Used by Phase 4–5 segment extraction / exact diff
 * engine to verify 100% recall on diff=1 mutations.
 *
 * @module mutation_corpus
 */

const FENCE_LINE_RE = /^(`{3,}|~{3,})/;

// ---------------------------------------------------------------------------
// Line classification
// ---------------------------------------------------------------------------

/**
 * @typedef {object} LineClassification
 * @property {number} index
 * @property {string} kind
 * @property {string} text
 */

/** Classify a single content line (outside frontmatter/code). */
function classifyContentLine(trimmed, inCallout) {
  if (/^:::/.test(trimmed)) return trimmed === ':::' ? 'callout-close' : 'callout-open';
  if (/^<details\b/i.test(trimmed)) return 'details-open';
  if (/^<\/details>/i.test(trimmed)) return 'details-close';
  if (/^<summary\b/i.test(trimmed)) return 'summary';
  if (trimmed === '') return 'blank';
  if (/^#{1,6}\s/.test(trimmed)) return 'heading';
  if (/^\|/.test(trimmed)) return 'table';
  if (/^!\[/.test(trimmed) || /^<Image\b/.test(trimmed) || /^<img\b/i.test(trimmed)) {
    return 'image';
  }
  if (/^[-*+]\s/.test(trimmed)) return inCallout ? 'callout-body' : 'bullet';
  if (/^\d+\.\s/.test(trimmed)) return inCallout ? 'callout-body' : 'step';
  if (inCallout) return 'callout-body';
  return 'paragraph';
}

/**
 * Classify every line in a markdown document.
 * @param {string} md
 * @returns {LineClassification[]}
 */
export function classifyLines(md) {
  const lines = md.split('\n');
  const result = [];
  let inFrontmatter = false;
  let frontmatterDashes = 0;
  let inCodeBlock = false;
  let calloutDepth = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trimStart();

    if (i === 0 && trimmed === '---') {
      inFrontmatter = true;
      frontmatterDashes = 1;
      result.push({ index: i, kind: 'frontmatter', text: line });
      continue;
    }
    if (inFrontmatter) {
      if (trimmed === '---' && ++frontmatterDashes >= 2) inFrontmatter = false;
      result.push({ index: i, kind: 'frontmatter', text: line });
      continue;
    }
    if (FENCE_LINE_RE.test(trimmed)) {
      inCodeBlock = !inCodeBlock;
      result.push({ index: i, kind: 'code-fence', text: line });
      continue;
    }
    if (inCodeBlock) {
      result.push({ index: i, kind: 'code', text: line });
      continue;
    }

    const kind = classifyContentLine(trimmed, calloutDepth > 0);
    if (kind === 'callout-open') calloutDepth++;
    if (kind === 'callout-close') calloutDepth = Math.max(0, calloutDepth - 1);
    result.push({ index: i, kind, text: line });
  }

  return result;
}

// ---------------------------------------------------------------------------
// Block-extent helpers
// ---------------------------------------------------------------------------

/** Leading whitespace count of a raw line. */
function lineIndent(line) {
  return line.length - line.trimStart().length;
}

/**
 * Find the end index (exclusive) of a list item block.
 * Includes continuation lines, child items, and blank lines between them.
 * @param {string[]} lines - All lines of the document
 * @param {number} start - Index of the list item line
 * @returns {number} Exclusive end index
 */
export function listItemBlockEnd(lines, start) {
  const baseIndent = lineIndent(lines[start]);
  let end = start + 1;
  while (end < lines.length) {
    const line = lines[end];
    if (line.trim() === '') {
      // Blank line — include only if followed by deeper-indented content
      let nextContent = end + 1;
      while (nextContent < lines.length && lines[nextContent].trim() === '') nextContent++;
      if (nextContent < lines.length && lineIndent(lines[nextContent]) > baseIndent) {
        end = nextContent;
        continue;
      }
      break;
    }
    if (lineIndent(line) <= baseIndent) break;
    end++;
  }
  return end;
}

/**
 * Find the start and end (exclusive) of a consecutive paragraph block.
 * A paragraph block = contiguous lines all classified as 'paragraph' with no gaps.
 * @param {LineClassification[]} classified
 * @param {number} targetClassifiedIdx - Index within the classified array
 * @returns {[number, number]} [startLineIdx, endLineIdx) in the original document
 */
export function paragraphBlockRange(classified, targetClassifiedIdx) {
  let lo = targetClassifiedIdx;
  while (lo > 0 && classified[lo - 1].kind === 'paragraph' &&
         classified[lo - 1].index === classified[lo].index - 1) {
    lo--;
  }
  let hi = targetClassifiedIdx;
  while (hi < classified.length - 1 && classified[hi + 1].kind === 'paragraph' &&
         classified[hi + 1].index === classified[hi].index + 1) {
    hi++;
  }
  return [classified[lo].index, classified[hi].index + 1];
}

/** Remove lines [start, end) from an array, returning a new array. */
function removeLineRange(lines, start, end) {
  return [...lines.slice(0, start), ...lines.slice(end)];
}

// ---------------------------------------------------------------------------
// Mutation result type
// ---------------------------------------------------------------------------

/**
 * @typedef {object} MutationResult
 * @property {string} mutated - The mutated markdown content
 * @property {object} metadata
 * @property {string} metadata.type - Mutation type identifier
 * @property {number} metadata.lineIndex - 0-based line index of mutation start
 * @property {number} metadata.linesRemoved - Number of lines removed (0 for in-place)
 * @property {string} metadata.originalText - Original text at mutation point
 * @property {string} metadata.description - Human-readable description
 */

// ---------------------------------------------------------------------------
// Mutation functions
// ---------------------------------------------------------------------------

/**
 * Remove one paragraph block from the markdown.
 * A paragraph block is a sequence of consecutive paragraph lines.
 * @param {string} md
 * @param {number} [nth=0]
 * @returns {MutationResult | null}
 */
export function deleteParagraph(md, nth = 0) {
  const classified = classifyLines(md);
  // Find paragraph block starts (first line of each consecutive paragraph run)
  const blockStarts = [];
  for (let i = 0; i < classified.length; i++) {
    if (classified[i].kind !== 'paragraph' || classified[i].text.trim() === '') continue;
    const isBlockStart = i === 0 ||
      classified[i - 1].kind !== 'paragraph' ||
      classified[i - 1].index !== classified[i].index - 1;
    if (isBlockStart) blockStarts.push(i);
  }
  if (blockStarts.length === 0) return null;
  const targetClassifiedIdx = blockStarts[nth % blockStarts.length];
  const [start, end] = paragraphBlockRange(classified, targetClassifiedIdx);
  const lines = md.split('\n');
  const removedText = lines.slice(start, end).join('\n');
  return {
    mutated: removeLineRange(lines, start, end).join('\n'),
    metadata: {
      type: 'paragraph-delete',
      lineIndex: start,
      linesRemoved: end - start,
      originalText: removedText,
      description: `段落削除 (L${start + 1}-${end}, ${end - start}行)`,
    },
  };
}

/**
 * Remove one bullet list item block (including continuation/child lines).
 * @param {string} md
 * @param {number} [nth=0]
 * @returns {MutationResult | null}
 */
export function deleteBullet(md, nth = 0) {
  const classified = classifyLines(md);
  const bullets = classified.filter((l) => l.kind === 'bullet');
  if (bullets.length === 0) return null;
  const target = bullets[nth % bullets.length];
  const lines = md.split('\n');
  const end = listItemBlockEnd(lines, target.index);
  const removedText = lines.slice(target.index, end).join('\n');
  return {
    mutated: removeLineRange(lines, target.index, end).join('\n'),
    metadata: {
      type: 'bullet-delete',
      lineIndex: target.index,
      linesRemoved: end - target.index,
      originalText: removedText,
      description: `箇条書き削除 (L${target.index + 1}-${end}, ${end - target.index}行)`,
    },
  };
}

/**
 * Remove one numbered step item block (including continuation/child lines).
 * @param {string} md
 * @param {number} [nth=0]
 * @returns {MutationResult | null}
 */
export function deleteStep(md, nth = 0) {
  const classified = classifyLines(md);
  const steps = classified.filter((l) => l.kind === 'step');
  if (steps.length === 0) return null;
  const target = steps[nth % steps.length];
  const lines = md.split('\n');
  const end = listItemBlockEnd(lines, target.index);
  const removedText = lines.slice(target.index, end).join('\n');
  return {
    mutated: removeLineRange(lines, target.index, end).join('\n'),
    metadata: {
      type: 'step-delete',
      lineIndex: target.index,
      linesRemoved: end - target.index,
      originalText: removedText,
      description: `手順削除 (L${target.index + 1}-${end}, ${end - target.index}行)`,
    },
  };
}

/**
 * Detect the block extent of a callout-body element.
 * If the line is a list item (bullet/step), uses listItemBlockEnd.
 * If it's a plain text line, extends through consecutive plain callout-body lines.
 * @param {string[]} lines
 * @param {number} start
 * @param {number} calloutCloseIdx - Line index of the callout's closing :::
 * @returns {number} Exclusive end index
 */
function calloutBodyBlockEnd(lines, start, calloutCloseIdx) {
  const trimmed = lines[start].trimStart();
  // List item inside callout — reuse indent-based block detection
  if (/^[-*+]\s/.test(trimmed) || /^\d+\.\s/.test(trimmed)) {
    const raw = listItemBlockEnd(lines, start);
    return Math.min(raw, calloutCloseIdx);
  }
  // Plain text — extend through consecutive non-blank, non-list callout lines
  let end = start + 1;
  while (end < calloutCloseIdx) {
    const line = lines[end];
    const t = line.trimStart();
    if (t === '' || /^[-*+]\s/.test(t) || /^\d+\.\s/.test(t) || /^:::/.test(t)) break;
    end++;
  }
  return end;
}

/**
 * Remove one structural element from inside a callout block.
 * Handles both plain paragraphs and list items block-aware.
 * @param {string} md
 * @param {number} [nth=0]
 * @returns {MutationResult | null}
 */
export function deleteCalloutParagraph(md, nth = 0) {
  const classified = classifyLines(md);
  const lines = md.split('\n');
  // Build candidate list: first line of each block within callouts
  const candidates = [];
  const seen = new Set();
  for (let ci = 0; ci < classified.length; ci++) {
    const entry = classified[ci];
    if (entry.kind !== 'callout-body' || entry.text.trim() === '') continue;
    if (seen.has(entry.index)) continue;
    // Find the callout's closing :::
    let closeIdx = lines.length;
    for (let j = ci + 1; j < classified.length; j++) {
      if (classified[j].kind === 'callout-close') {
        closeIdx = classified[j].index;
        break;
      }
    }
    const blockEnd = calloutBodyBlockEnd(lines, entry.index, closeIdx);
    // Mark all lines in this block as seen to avoid sub-elements
    for (let li = entry.index; li < blockEnd; li++) seen.add(li);
    candidates.push({ lineIndex: entry.index, blockEnd, closeIdx });
  }
  if (candidates.length === 0) return null;
  const target = candidates[nth % candidates.length];
  const removedText = lines.slice(target.lineIndex, target.blockEnd).join('\n');
  const linesRemoved = target.blockEnd - target.lineIndex;
  return {
    mutated: removeLineRange(lines, target.lineIndex, target.blockEnd).join('\n'),
    metadata: {
      type: 'callout-paragraph-delete',
      lineIndex: target.lineIndex,
      linesRemoved,
      originalText: removedText,
      description: `callout内削除 (L${target.lineIndex + 1}-${target.blockEnd}, ${linesRemoved}行)`,
    },
  };
}

/**
 * Empty one cell in a markdown pipe table (data row, not header/separator).
 * @param {string} md
 * @param {number} [nth=0]
 * @returns {MutationResult | null}
 */
export function deleteTableCell(md, nth = 0) {
  const classified = classifyLines(md);
  const tableRows = classified.filter((l) => l.kind === 'table');
  const separatorIndices = new Set(
    tableRows
      .filter((l) => /^\|\s*:?-+:?\s*\|/.test(l.text))
      .map((l) => l.index),
  );
  if (separatorIndices.size === 0) return null;
  const candidateRows = tableRows.filter((l) => {
    if (separatorIndices.has(l.index)) return false;
    if (separatorIndices.has(l.index + 1)) return false;
    return true;
  });
  if (candidateRows.length === 0) return null;
  const targetRow = candidateRows[nth % candidateRows.length];
  const cells = targetRow.text.split('|').filter((_, i, arr) => i > 0 && i < arr.length - 1);
  if (cells.length === 0) return null;
  const cellIdx = nth % cells.length;
  const originalCell = cells[cellIdx];
  const newCells = cells.map((c, i) => (i === cellIdx ? ' ' : c));
  const newRow = '|' + newCells.join('|') + '|';
  const lines = md.split('\n');
  const newLines = [...lines];
  newLines[targetRow.index] = newRow;
  return {
    mutated: newLines.join('\n'),
    metadata: {
      type: 'table-cell-delete',
      lineIndex: targetRow.index,
      linesRemoved: 0,
      originalText: originalCell.trim(),
      description: `table cell削除 (L${targetRow.index + 1}, col${cellIdx})`,
    },
  };
}

/**
 * Empty one <td> cell in an HTML table.
 * @param {string} md
 * @param {number} [nth=0]
 * @returns {MutationResult | null}
 */
export function deleteHtmlTableCell(md, nth = 0) {
  // Match <td>...</td> blocks (potentially multi-line)
  const tdPattern = /<td\b[^>]*>([\s\S]*?)<\/td>/gi;
  const candidates = [];
  let match;
  while ((match = tdPattern.exec(md)) !== null) {
    const content = match[1].trim();
    if (content.length === 0) continue; // already empty
    candidates.push({
      fullMatch: match[0],
      content,
      matchIndex: match.index,
      matchLength: match[0].length,
    });
  }
  if (candidates.length === 0) return null;
  const target = candidates[nth % candidates.length];
  // Replace the <td>content</td> with <td></td>, preserving attributes
  const openTagEnd = target.fullMatch.indexOf('>') + 1;
  const openTag = target.fullMatch.slice(0, openTagEnd);
  const replacement = `${openTag}\n   </td>`;
  const before = md.slice(0, target.matchIndex);
  const after = md.slice(target.matchIndex + target.matchLength);
  const lineIndex = md.slice(0, target.matchIndex).split('\n').length - 1;
  return {
    mutated: before + replacement + after,
    metadata: {
      type: 'html-table-cell-delete',
      lineIndex,
      linesRemoved: 0,
      originalText: target.content.slice(0, 80),
      description: `HTML table cell削除 (offset ${target.matchIndex})`,
    },
  };
}

/**
 * Swap two adjacent paragraph blocks within the same section.
 * A paragraph block may span multiple consecutive lines.
 * @param {string} md
 * @param {number} [nth=0]
 * @returns {MutationResult | null}
 */
export function moveSegment(md, nth = 0) {
  const classified = classifyLines(md);
  // Collect paragraph block boundaries (deduped to block starts)
  const blocks = [];
  for (let i = 0; i < classified.length; i++) {
    if (classified[i].kind !== 'paragraph' || classified[i].text.trim() === '') continue;
    const isStart = i === 0 ||
      classified[i - 1].kind !== 'paragraph' ||
      classified[i - 1].index !== classified[i].index - 1;
    if (isStart) {
      const [bStart, bEnd] = paragraphBlockRange(classified, i);
      blocks.push({ start: bStart, end: bEnd });
    }
  }
  // Find truly adjacent block pairs — only blank lines between them
  const pairs = [];
  for (let i = 0; i < blocks.length - 1; i++) {
    const a = blocks[i];
    const b = blocks[i + 1];
    const lines = md.split('\n');
    const aText = lines.slice(a.start, a.end).join('\n');
    const bText = lines.slice(b.start, b.end).join('\n');
    if (aText === bText) continue;
    // Reject if any structural element (code, table, image, heading, etc.)
    // sits between the two paragraph blocks
    const between = classified.filter(
      (l) => l.index >= a.end && l.index < b.start,
    );
    const hasStructure = between.some((l) => l.kind !== 'blank');
    if (hasStructure) continue;
    pairs.push({ a, b, aText, bText });
  }
  if (pairs.length === 0) return null;
  const pair = pairs[nth % pairs.length];
  const lines = md.split('\n');
  const aLines = lines.slice(pair.a.start, pair.a.end);
  const bLines = lines.slice(pair.b.start, pair.b.end);
  const gapLines = lines.slice(pair.a.end, pair.b.start);
  const newLines = [
    ...lines.slice(0, pair.a.start),
    ...bLines,
    ...gapLines,
    ...aLines,
    ...lines.slice(pair.b.end),
  ];
  return {
    mutated: newLines.join('\n'),
    metadata: {
      type: 'segment-move',
      lineIndex: pair.a.start,
      linesRemoved: 0,
      originalText: `[${pair.a.start + 1}-${pair.a.end}] \u2194 [${pair.b.start + 1}-${pair.b.end}]`,
      description: `segment移動 (L${pair.a.start + 1}-${pair.a.end} \u2194 L${pair.b.start + 1}-${pair.b.end})`,
    },
  };
}

/**
 * Replace one JA paragraph with English text (simulating untranslated residual).
 * @param {string} md
 * @param {number} [nth=0]
 * @returns {MutationResult | null}
 */
export function insertEnResidual(md, nth = 0) {
  const classified = classifyLines(md);
  const jaParagraphs = classified.filter(
    (l) =>
      l.kind === 'paragraph' &&
      /[\u3000-\u9fff\uf900-\ufaff]/.test(l.text),
  );
  if (jaParagraphs.length === 0) return null;
  const target = jaParagraphs[nth % jaParagraphs.length];
  const enText =
    'Click on the Settings button and configure the required parameters for your test execution.';
  const lines = md.split('\n');
  const newLines = [...lines];
  newLines[target.index] = enText;
  return {
    mutated: newLines.join('\n'),
    metadata: {
      type: 'en-residual',
      lineIndex: target.index,
      linesRemoved: 0,
      originalText: target.text,
      description: `EN残留 (L${target.index + 1}): JA\u2192EN置換`,
    },
  };
}

/**
 * Drop one invariant token (CLI flag, URL, or code reference) from a line.
 * @param {string} md
 * @param {number} [nth=0]
 * @returns {MutationResult | null}
 */
export function dropInvariantToken(md, nth = 0) {
  const tokenPatterns = [
    /`--[\w-]+`/g,
    /`[A-Z_]{2,}`/g,
    /https?:\/\/[^\s)]+/g,
    /--[\w-]+/g,
  ];
  const skipKinds = new Set(['frontmatter', 'code', 'code-fence', 'blank', 'image']);
  // Pipe-table separator rows like `| :--- | :---: |` look like CLI flag
  // candidates to the `--[\w-]+` pattern, but stripping the dashes breaks
  // the table separator regex used by the JA segment extractor and
  // re-classifies the header row as a body row, producing a cascade of
  // spurious table-cell segments. Skip those rows so token-drop stays
  // a true diff=1 mutation.
  const TABLE_SEPARATOR_LINE_RE = /^\s*\|\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)*\|\s*$/;
  const classified = classifyLines(md);
  const rawCandidates = [];
  for (const line of classified) {
    if (skipKinds.has(line.kind)) continue;
    if (TABLE_SEPARATOR_LINE_RE.test(line.text)) continue;
    for (const pattern of tokenPatterns) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(line.text)) !== null) {
        rawCandidates.push({
          lineIndex: line.index,
          lineText: line.text,
          token: match[0],
          matchIndex: match.index,
          matchLength: match[0].length,
        });
      }
    }
  }
  const candidates = rawCandidates.filter((c) => {
    const dominated = rawCandidates.some(
      (other) =>
        other !== c &&
        other.lineIndex === c.lineIndex &&
        other.matchIndex <= c.matchIndex &&
        other.matchIndex + other.matchLength >= c.matchIndex + c.matchLength &&
        other.matchLength > c.matchLength,
    );
    return !dominated;
  });
  if (candidates.length === 0) return null;
  const target = candidates[nth % candidates.length];
  const lines = md.split('\n');
  const newLines = [...lines];
  const before = target.lineText.slice(0, target.matchIndex);
  const after = target.lineText.slice(target.matchIndex + target.matchLength);
  newLines[target.lineIndex] = before + after;
  return {
    mutated: newLines.join('\n'),
    metadata: {
      type: 'token-drop',
      lineIndex: target.lineIndex,
      linesRemoved: 0,
      originalText: target.token,
      description: `token欠落 (L${target.lineIndex + 1}): "${target.token}" を除去`,
    },
  };
}

// ---------------------------------------------------------------------------
// Registry and generators
// ---------------------------------------------------------------------------

/** All mutation functions indexed by type name. */
export const MUTATION_TYPES = {
  'paragraph-delete': deleteParagraph,
  'bullet-delete': deleteBullet,
  'step-delete': deleteStep,
  'callout-paragraph-delete': deleteCalloutParagraph,
  'table-cell-delete': deleteTableCell,
  'html-table-cell-delete': deleteHtmlTableCell,
  'segment-move': moveSegment,
  'en-residual': insertEnResidual,
  'token-drop': dropInvariantToken,
};

/**
 * Generate all applicable mutations for a given markdown document.
 * Returns one mutation per type (the first eligible instance).
 * @param {string} md
 * @returns {Map<string, MutationResult>}
 */
export function generateAllMutations(md) {
  const results = new Map();
  for (const [type, fn] of Object.entries(MUTATION_TYPES)) {
    const result = fn(md, 0);
    if (result !== null) {
      results.set(type, result);
    }
  }
  return results;
}

/**
 * Generate multiple mutations per type for comprehensive corpus.
 * @param {string} md
 * @param {number} [count=3] - Number of mutations per type
 * @returns {Map<string, MutationResult[]>}
 */
export function generateCorpus(md, count = 3) {
  const results = new Map();
  for (const [type, fn] of Object.entries(MUTATION_TYPES)) {
    const mutations = [];
    for (let i = 0; i < count; i++) {
      const result = fn(md, i);
      if (result !== null) {
        const isDuplicate = mutations.some(
          (m) =>
            m.metadata.lineIndex === result.metadata.lineIndex &&
            m.metadata.originalText === result.metadata.originalText,
        );
        if (!isDuplicate) mutations.push(result);
      }
    }
    if (mutations.length > 0) {
      results.set(type, mutations);
    }
  }
  return results;
}
