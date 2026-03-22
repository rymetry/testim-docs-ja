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

    const headingMatch = line.match(/^#{2,3}\s+(.+)/);
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

    const headingMatch = line.match(/^#{2,3}\s+(.+)/);
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

    const headingMatch = line.match(/^#{2,3}\s+(.+)/);
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
  } else if (enSections.length > 0 && jaSections.length > 0) {
    // Fallback: total comparison when section counts differ
    const enTotal = [...enMap.values()].reduce((a, b) => a + b, 0);
    const jaTotal = [...jaMap.values()].reduce((a, b) => a + b, 0);
    if (enTotal > 0 && jaTotal > 0 && enTotal !== jaTotal) {
      const absDiff = Math.abs(jaTotal - enTotal);
      if (absDiff > 3) {
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

  // --- Section-based comparisons (steps, bullets, paragraphs) ---
  // Normalise EN headings: strip title H1, demote remaining H1→H2
  const normalizedEnBody = stripTitleH1(enBody);

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
