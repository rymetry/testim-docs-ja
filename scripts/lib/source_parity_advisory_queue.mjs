/**
 * Phase 6B advisory review queue.
 *
 * Provider-free advisory layer: derives a manual review queue from existing
 * `segment-inconclusive` issues whose `inconclusiveCategory` is
 * `tokenless-near-tie`. This does NOT add a new detector, issue type, or gate
 * path; it only reshapes already-detected uncertainty into a focused review
 * list.
 */

const DOCS_PREFIX = 'src/content/docs/';

export function isAdvisoryReviewCandidate(issue) {
  return issue?.type === 'segment-inconclusive'
    && issue?.inconclusiveCategory === 'tokenless-near-tie';
}

function normalizeFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function normalizeSectionPath(value) {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function normalizeIssueMeta(issue) {
  const meta =
    issue?.inconclusiveMeta && typeof issue.inconclusiveMeta === 'object'
      ? issue.inconclusiveMeta
      : null;
  if (!meta) return null;

  const leftSectionPath = normalizeSectionPath(meta.leftSectionPath);
  const rightSectionPath = normalizeSectionPath(meta.rightSectionPath);
  const currentScore = normalizeFiniteNumber(meta.currentScore);
  const swapScore = normalizeFiniteNumber(meta.swapScore);

  if (!leftSectionPath && !rightSectionPath && currentScore === null && swapScore === null) {
    return null;
  }

  return {
    leftSectionPath,
    rightSectionPath,
    currentScore,
    swapScore,
  };
}

function fileToSlug(file) {
  if (typeof file !== 'string' || file.length === 0) return null;
  if (file.startsWith(DOCS_PREFIX)) {
    return file.slice(DOCS_PREFIX.length).replace(/\.md$/, '');
  }
  return file.replace(/\.md$/, '');
}

export function buildAdvisoryQueueIssueKey(slug, issue) {
  const meta = normalizeIssueMeta(issue);
  const key = [
    slug ?? '_unknown-slug_',
    issue?.type ?? '_unknown-type_',
    `category=${issue?.inconclusiveCategory ?? '_unknown-category_'}`,
  ];
  if (meta?.leftSectionPath || meta?.rightSectionPath) {
    key.push(
      `pair=${meta.leftSectionPath ?? '_null_'}=>${meta.rightSectionPath ?? '_null_'}`,
    );
  }
  return key.join('|');
}

export function buildAdvisoryReviewScope({
  totalFiles = 0,
  checkedFiles = 0,
  slug = null,
  section = null,
} = {}) {
  const resolvedSlug = typeof slug === 'string' && slug.length > 0 ? slug : null;
  const resolvedSection = typeof section === 'string' && section.length > 0 ? section : null;
  return {
    type: resolvedSlug ? 'slug' : resolvedSection ? 'section' : 'full',
    isComplete: resolvedSlug === null && resolvedSection === null,
    filters: {
      slug: resolvedSlug,
      section: resolvedSection,
    },
    checkedFiles: Number.isInteger(checkedFiles) && checkedFiles >= 0 ? checkedFiles : 0,
    totalFiles: Number.isInteger(totalFiles) && totalFiles >= 0 ? totalFiles : 0,
  };
}

export function buildAdvisoryReviewQueue(results) {
  const queue = [];

  for (const result of results) {
    const slug = fileToSlug(result.file);
    const advisoryIssues = (result.issues ?? [])
      .filter(isAdvisoryReviewCandidate)
      .map((issue) => {
        const meta = normalizeIssueMeta(issue);
        return {
          queueKey: buildAdvisoryQueueIssueKey(slug, issue),
          type: issue.type,
          severity: issue.severity,
          inconclusiveCategory: issue.inconclusiveCategory ?? null,
          inconclusiveReason: issue.inconclusiveReason ?? null,
          detail: issue.detail ?? issue.text ?? '',
          leftSectionPath: meta?.leftSectionPath ?? null,
          rightSectionPath: meta?.rightSectionPath ?? null,
          currentScore: meta?.currentScore ?? null,
          swapScore: meta?.swapScore ?? null,
          baselined: issue.baselined === true,
          baselineReviewAfter: issue.baselineReviewAfter ?? null,
          baselineExpired: issue.baselineExpired === true,
        };
      });

    if (advisoryIssues.length === 0) continue;

    queue.push({
      slug,
      file: result.file,
      sourceUrl: result.sourceUrl ?? '',
      category: result.category ?? '',
      blocking: advisoryIssues.some((issue) => issue.baselined !== true),
      issueCount: advisoryIssues.length,
      issues: advisoryIssues,
    });
  }

  return queue.sort((left, right) => left.file.localeCompare(right.file));
}

export function summarizeAdvisoryReviewQueue(queue, scope = null) {
  const advisoryQueueByCategory = {};
  let advisoryQueueIssues = 0;

  for (const entry of queue) {
    for (const issue of entry.issues ?? []) {
      advisoryQueueIssues += 1;
      const key = issue.inconclusiveCategory ?? '_unknown_';
      advisoryQueueByCategory[key] = (advisoryQueueByCategory[key] || 0) + 1;
    }
  }

  const summary = {
    advisoryQueueIssues,
    advisoryQueueFiles: queue.length,
    advisoryQueueByCategory,
  };
  if (scope && typeof scope === 'object') {
    summary.advisoryQueueComplete = scope.isComplete === true;
    summary.advisoryQueueScopeType = scope.type ?? null;
  }
  return summary;
}
