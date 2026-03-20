import { fetchSourcePageInfo } from './source_pages.mjs';

export const ISSUE_SEVERITY = {
  untranslated: 'actionable',
  'legacy-callout': 'actionable',
  'jsx-callout': 'actionable',
  'h1-in-body': 'actionable',
  'image-mismatch': 'actionable',
  'codeblock-mismatch': 'actionable',
  'orphan-page': 'actionable',
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

export function extractFromHtml(html) {
  const h2Count = (html.match(/<h2[\s>]/gi) || []).length;
  const h3Count = (html.match(/<h3[\s>]/gi) || []).length;
  const imgCount = (html.match(/<img[\s>]/gi) || []).length;
  const codeBlockCount = (html.match(/<pre[\s>][\s\S]*?<\/pre>/gi) || [])
    .filter((block) => block.replace(/<[^>]*>/g, '').trim().length > 0)
    .length;
  const calloutCount = (html.match(/class="[^"]*callout[^"]*"/gi) || []).length;

  return { h2Count, h3Count, imgCount, codeBlockCount, calloutCount };
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

export function buildStructuralIssues(englishStats, japaneseStats) {
  const issues = [];

  const headingDelta = Math.abs(englishStats.h2Count - japaneseStats.h2Count);
  if (headingDelta >= 1) {
    issues.push(
      withSeverity({
        type: 'heading-mismatch',
        detail: `h2: EN=${englishStats.h2Count} JA=${japaneseStats.h2Count}`,
        delta: headingDelta,
      }),
    );
  }

  const imageDiff = englishStats.imgCount - japaneseStats.imgCount;
  if (imageDiff >= 1) {
    issues.push(
      withSeverity({
        type: 'image-mismatch',
        detail: `EN=${englishStats.imgCount} JA=${japaneseStats.imgCount} (${imageDiff}枚不足)`,
        delta: imageDiff,
      }),
    );
  }

  const codeBlockDiff = englishStats.codeBlockCount - japaneseStats.codeBlockCount;
  if (codeBlockDiff >= 1) {
    issues.push(
      withSeverity({
        type: 'codeblock-mismatch',
        detail: `EN=${englishStats.codeBlockCount} JA=${japaneseStats.codeBlockCount}`,
        delta: codeBlockDiff,
      }),
    );
  }

  return issues;
}

/**
 * Per-slug suppression for known layout divergences.
 * Each entry pins an expectedDelta — if the actual delta drifts,
 * the suppression lifts and the issue surfaces again.
 */
export const PARITY_SUPPRESSIONS = {
  'salesforce-testing-overview': [
    {
      type: 'heading-mismatch',
      expectedDelta: 8,
      reason: 'EN card layout uses 9 h2 titles; JA uses h3 text list (#115)',
    },
    {
      type: 'image-mismatch',
      expectedDelta: 9,
      reason: 'EN embeds 9 SVG card icons; JA uses text links (#115)',
    },
  ],
  'pull-requests': [
    {
      type: 'codeblock-mismatch',
      expectedDelta: 1,
      reason: 'EN <pre> is a readme.io CodeTabs container, not user-facing code (#132)',
    },
  ],
};

export function applySuppressions(issues, slug) {
  const entries = PARITY_SUPPRESSIONS[slug];
  if (!entries) return issues;

  return issues.filter((issue) => {
    const suppression = entries.find((s) => s.type === issue.type);
    if (!suppression) return true;
    return issue.delta !== suppression.expectedDelta;
  });
}

export async function remoteCheck(sourceUrl, mdBody, options = {}) {
  const page = await fetchSourcePageInfo(sourceUrl, options);
  if (page.fetchError) {
    return [
      withSeverity({
        type: 'source-fetch-error',
        detail: page.fetchError,
      }),
    ];
  }

  if (!page.contentRootExtractable || !page.articleHtml) {
    return [
      withSeverity({
        type: 'content-root-missing',
        detail: `strategy=${page.extractionStrategy}`,
      }),
    ];
  }

  return buildStructuralIssues(extractFromHtml(page.articleHtml), extractFromMd(mdBody));
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
