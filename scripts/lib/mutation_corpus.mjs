/**
 * Synthetic mutation corpus generator for diff=1 recall testing.
 *
 * Produces minimally-mutated JA markdown content (exactly one structural change)
 * for each of 7 mutation types. Used by Phase 4–5 segment extraction / exact diff
 * engine to verify 100% recall on diff=1 mutations.
 *
 * @module mutation_corpus
 */

const FENCE_LINE_RE = /^(`{3,}|~{3,})/;

/**
 * @typedef {object} LineClassification
 * @property {number} index
 * @property {string} kind - 'paragraph' | 'bullet' | 'step' | 'heading' | 'table' |
 *   'callout-open' | 'callout-close' | 'callout-body' | 'code-fence' | 'code' |
 *   'frontmatter' | 'blank' | 'image' | 'details-open' | 'details-close' | 'summary'
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

    // Frontmatter handling
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

    // Code fence handling
    if (FENCE_LINE_RE.test(trimmed)) {
      inCodeBlock = !inCodeBlock;
      result.push({ index: i, kind: 'code-fence', text: line });
      continue;
    }
    if (inCodeBlock) {
      result.push({ index: i, kind: 'code', text: line });
      continue;
    }

    // Content classification
    const kind = classifyContentLine(trimmed, calloutDepth > 0);
    if (kind === 'callout-open') calloutDepth++;
    if (kind === 'callout-close') calloutDepth = Math.max(0, calloutDepth - 1);
    result.push({ index: i, kind, text: line });
  }

  return result;
}

/**
 * @typedef {object} MutationResult
 * @property {string} mutated - The mutated markdown content
 * @property {object} metadata
 * @property {string} metadata.type - Mutation type identifier
 * @property {number} metadata.lineIndex - 0-based line index of mutation
 * @property {string} metadata.originalText - Original text at mutation point
 * @property {string} metadata.description - Human-readable description
 */

/**
 * Remove one paragraph from the markdown.
 * @param {string} md
 * @param {number} [nth=0] - Which eligible paragraph to remove (0-based)
 * @returns {MutationResult | null}
 */
export function deleteParagraph(md, nth = 0) {
  const classified = classifyLines(md);
  const paragraphs = classified.filter(
    (l) => l.kind === 'paragraph' && l.text.trim().length > 0,
  );
  if (paragraphs.length === 0) return null;
  const target = paragraphs[nth % paragraphs.length];
  const lines = md.split('\n');
  const newLines = lines.filter((_, i) => i !== target.index);
  return {
    mutated: newLines.join('\n'),
    metadata: {
      type: 'paragraph-delete',
      lineIndex: target.index,
      originalText: target.text,
      description: `段落削除 (L${target.index + 1}): "${target.text.slice(0, 60)}..."`,
    },
  };
}

/**
 * Remove one bullet list item.
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
  const newLines = lines.filter((_, i) => i !== target.index);
  return {
    mutated: newLines.join('\n'),
    metadata: {
      type: 'bullet-delete',
      lineIndex: target.index,
      originalText: target.text,
      description: `箇条書き削除 (L${target.index + 1}): "${target.text.slice(0, 60)}..."`,
    },
  };
}

/**
 * Remove one paragraph from inside a callout block.
 * @param {string} md
 * @param {number} [nth=0]
 * @returns {MutationResult | null}
 */
export function deleteCalloutParagraph(md, nth = 0) {
  const classified = classifyLines(md);
  const calloutBodies = classified.filter(
    (l) => l.kind === 'callout-body' && l.text.trim().length > 0,
  );
  if (calloutBodies.length === 0) return null;
  const target = calloutBodies[nth % calloutBodies.length];
  const lines = md.split('\n');
  const newLines = lines.filter((_, i) => i !== target.index);
  return {
    mutated: newLines.join('\n'),
    metadata: {
      type: 'callout-paragraph-delete',
      lineIndex: target.index,
      originalText: target.text,
      description: `callout内段落削除 (L${target.index + 1}): "${target.text.slice(0, 60)}..."`,
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
  // Identify separator rows — require at least one for a well-formed table
  const separatorIndices = new Set(
    tableRows
      .filter((l) => /^\|\s*:?-+:?\s*\|/.test(l.text))
      .map((l) => l.index),
  );
  if (separatorIndices.size === 0) return null;
  // Data rows: not separator, not header (immediately before separator)
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
      originalText: originalCell.trim(),
      description: `table cell削除 (L${targetRow.index + 1}, col${cellIdx}): "${originalCell.trim().slice(0, 40)}..."`,
    },
  };
}

/**
 * Swap two adjacent paragraphs within the same section.
 * @param {string} md
 * @param {number} [nth=0]
 * @returns {MutationResult | null}
 */
export function moveSegment(md, nth = 0) {
  const classified = classifyLines(md);
  const paragraphs = classified.filter(
    (l) => l.kind === 'paragraph' && l.text.trim().length > 0,
  );
  // Find adjacent paragraph pairs (no heading between, not identical text)
  const pairs = [];
  for (let i = 0; i < paragraphs.length - 1; i++) {
    const a = paragraphs[i];
    const b = paragraphs[i + 1];
    if (a.text === b.text) continue; // swap would be identity
    const between = classified.slice(a.index + 1, b.index);
    const hasHeading = between.some((l) => l.kind === 'heading');
    if (!hasHeading) {
      pairs.push([a, b]);
    }
  }
  if (pairs.length === 0) return null;
  const [a, b] = pairs[nth % pairs.length];
  const lines = md.split('\n');
  const newLines = [...lines];
  newLines[a.index] = b.text;
  newLines[b.index] = a.text;
  return {
    mutated: newLines.join('\n'),
    metadata: {
      type: 'segment-move',
      lineIndex: a.index,
      originalText: `${a.text} \u2194 ${b.text}`,
      description: `segment移動 (L${a.index + 1} \u2194 L${b.index + 1})`,
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
  // Find paragraphs containing CJK characters
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
  // Order: most-specific first so dedup prefers longer matches
  const tokenPatterns = [
    /`--[\w-]+`/g, // Backtick-wrapped CLI flags
    /`[A-Z_]{2,}`/g, // Constants like `YOUR_TOKEN`
    /https?:\/\/[^\s)]+/g, // URLs
    /--[\w-]+/g, // Bare CLI flags
  ];
  const skipKinds = new Set(['frontmatter', 'code', 'code-fence', 'blank', 'image']);
  const classified = classifyLines(md);
  const rawCandidates = [];
  for (const line of classified) {
    if (skipKinds.has(line.kind)) continue;
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
  // Deduplicate: if a shorter match is fully contained within a longer match
  // on the same line, keep only the longer match
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
      originalText: target.token,
      description: `token欠落 (L${target.lineIndex + 1}): "${target.token}" を除去`,
    },
  };
}

/** All mutation functions indexed by type name. */
export const MUTATION_TYPES = {
  'paragraph-delete': deleteParagraph,
  'bullet-delete': deleteBullet,
  'callout-paragraph-delete': deleteCalloutParagraph,
  'table-cell-delete': deleteTableCell,
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
        // Avoid duplicates (when fewer candidates than count)
        const isDuplicate = mutations.some(
          (m) =>
            m.metadata.lineIndex === result.metadata.lineIndex &&
            m.metadata.originalText === result.metadata.originalText,
        );
        if (!isDuplicate) {
          mutations.push(result);
        }
      }
    }
    if (mutations.length > 0) {
      results.set(type, mutations);
    }
  }
  return results;
}
