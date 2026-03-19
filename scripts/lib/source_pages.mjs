const DEFAULT_USER_AGENT = 'testim-docs-ja-source-check/2.0';
const DOCUMENT_UPDATED_AT_TIME_ZONE = 'Asia/Tokyo';
const ISO_DATE_FORMATTERS = new Map();

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function cleanWhitespace(value) {
  return String(value ?? '')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function shiftDate(now, amount, unit) {
  const date = new Date(now);
  switch (unit) {
    case 'days':
      date.setDate(date.getDate() - amount);
      break;
    case 'weeks':
      date.setDate(date.getDate() - amount * 7);
      break;
    case 'months':
      date.setMonth(date.getMonth() - amount);
      break;
    case 'years':
      date.setFullYear(date.getFullYear() - amount);
      break;
    default:
      return null;
  }
  return date;
}

export function toIsoDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().split('T')[0];
}

function getIsoDateFormatter(timeZone) {
  let formatter = ISO_DATE_FORMATTERS.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    ISO_DATE_FORMATTERS.set(timeZone, formatter);
  }
  return formatter;
}

export function toIsoDateInTimeZone(value, timeZone = DOCUMENT_UPDATED_AT_TIME_ZONE) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const formatter = getIsoDateFormatter(timeZone);
  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;

  return year && month && day ? `${year}-${month}-${day}` : null;
}

export function parseRelativeTime(text, now = new Date()) {
  const cleanText = cleanWhitespace(text);
  const patterns = [
    { regex: /(?:about )?(\d+) day(?:s)? ago/i, unit: 'days' },
    { regex: /(?:about )?(\d+) week(?:s)? ago/i, unit: 'weeks' },
    { regex: /(?:about )?(\d+) month(?:s)? ago/i, unit: 'months' },
    { regex: /(?:about )?(\d+) year(?:s)? ago/i, unit: 'years' },
  ];

  for (const { regex, unit } of patterns) {
    const match = cleanText.match(regex);
    if (!match) continue;
    const shifted = shiftDate(now, Number.parseInt(match[1], 10), unit);
    return toIsoDate(shifted);
  }

  return null;
}

export function extractDisplayRelativeDate(html, now = new Date()) {
  const relativeTimePattern =
    /Updated[\s\S]{0,80}?(?:about\s+)?\d+\s+(?:day|week|month|year)s?\s+ago/i;
  const match = html.match(relativeTimePattern);
  if (!match) {
    return {
      displayRelativeDate: null,
      displayRelativeText: null,
    };
  }

  const displayRelativeText = cleanWhitespace(match[0]);
  return {
    displayRelativeDate: parseRelativeTime(displayRelativeText, now),
    displayRelativeText,
  };
}

export function extractDocumentUpdatedAt(html) {
  const ssrPropsPattern = /<script[^>]*id=(["'])ssr-props\1[^>]*>([\s\S]*?)<\/script>/i;
  const ssrPropsMatch = html.match(ssrPropsPattern);
  if (!ssrPropsMatch) {
    return null;
  }

  try {
    const ssrProps = JSON.parse(ssrPropsMatch[2]);
    return toIsoDateInTimeZone(ssrProps?.document?.updated_at);
  } catch {
    return null;
  }
}

export function extractMetadataUpdatedAt(html, url = '') {
  const slug = url ? url.split('/').pop() : '';
  const jsonBlockPattern = /<script[^>]*>window\.__REDUX_STATE__\s*=\s*({[\s\S]*?})<\/script>/i;
  const jsonMatch = html.match(jsonBlockPattern);

  if (jsonMatch) {
    try {
      const jsonData = JSON.parse(jsonMatch[1]);
      const pageData = jsonData?.context?.page || jsonData?.page;
      const updatedAt = toIsoDate(pageData?.updatedAt);
      if (updatedAt) {
        return updatedAt;
      }
    } catch {
      // Fall back to string extraction.
    }
  }

  if (slug) {
    const escapedSlug = escapeRegExp(slug);
    const slugPattern = new RegExp(`"slug":"${escapedSlug}"[^}]{0,500}"updatedAt":"([^"]+)"`, 'i');
    const slugMatch = html.match(slugPattern);
    if (slugMatch) {
      return toIsoDate(slugMatch[1]);
    }
  }

  const genericMatch = html.match(/"updatedAt":"([^"]+)"/i);
  return genericMatch ? toIsoDate(genericMatch[1]) : null;
}

function stripNonContentTags(html) {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');
}

export function extractArticleHtml(html) {
  const sanitized = stripNonContentTags(html);
  const articleMatch = sanitized.match(/<article\b[\s\S]*?<\/article>/i);
  if (articleMatch) {
    return {
      articleHtml: articleMatch[0],
      contentRootExtractable: true,
      extractionStrategy: 'article-tag',
    };
  }

  const mainMatch = sanitized.match(/<main\b[\s\S]*?<\/main>/i);
  const mainHtml = mainMatch ? mainMatch[0] : sanitized;
  const h1Match = /<h1\b[\s\S]*?<\/h1>/i.exec(mainHtml);
  if (!h1Match || h1Match.index == null) {
    return {
      articleHtml: '',
      contentRootExtractable: false,
      extractionStrategy: 'missing-h1',
    };
  }

  const tail = mainHtml.slice(h1Match.index);
  const endPatterns = [
    /<footer\b/i,
    /Ask AI/i,
    /Updated[\s\S]{0,80}?(?:about\s+)?\d+\s+(?:day|week|month|year)s?\s+ago/i,
  ];

  let endIndex = tail.length;
  for (const pattern of endPatterns) {
    const match = pattern.exec(tail);
    if (!match || match.index == null) continue;
    endIndex = Math.min(endIndex, match.index);
  }

  const articleHtml = tail.slice(0, endIndex).trim();
  return {
    articleHtml,
    contentRootExtractable: articleHtml.length > 0,
    extractionStrategy: 'h1-slice',
  };
}

export function compareIsoDates(left, right) {
  if (!left || !right) return 0;
  if (left === right) return 0;
  return left > right ? 1 : -1;
}

export function diffDays(later, earlier) {
  const laterDate = new Date(later);
  const earlierDate = new Date(earlier);
  if (Number.isNaN(laterDate.getTime()) || Number.isNaN(earlierDate.getTime())) {
    return null;
  }
  return Math.floor((laterDate - earlierDate) / (1000 * 60 * 60 * 24));
}

export function resolveSourcePageInfo({ html, url, now = new Date(), exception = null }) {
  const documentUpdatedAt = extractDocumentUpdatedAt(html);
  const metadataUpdatedAt = extractMetadataUpdatedAt(html, url);
  const { displayRelativeDate, displayRelativeText } = extractDisplayRelativeDate(html, now);
  const { articleHtml, contentRootExtractable, extractionStrategy } = extractArticleHtml(html);

  const fallbackSourceDate =
    metadataUpdatedAt && displayRelativeDate && metadataUpdatedAt !== displayRelativeDate
      ? displayRelativeDate
      : (metadataUpdatedAt ?? displayRelativeDate ?? null);
  const resolvedSourceDate = documentUpdatedAt ?? metadataUpdatedAt ?? displayRelativeDate ?? null;
  const comparisonSourceDate = documentUpdatedAt ?? fallbackSourceDate;
  const sourceDateKind = documentUpdatedAt
    ? 'document-updated-at'
    : metadataUpdatedAt
      ? 'metadata-updatedAt'
      : displayRelativeDate
        ? 'display-relative-date'
        : 'unresolved';
  const comparisonSourceKind =
    comparisonSourceDate === documentUpdatedAt && documentUpdatedAt
      ? 'document-updated-at'
      : comparisonSourceDate === displayRelativeDate && displayRelativeDate
        ? 'display-relative-date'
        : sourceDateKind;
  const sourceDateDivergence = Boolean(
    metadataUpdatedAt && displayRelativeDate && metadataUpdatedAt !== displayRelativeDate
  );
  const exceptionApplied = Boolean(
    exception?.ignoredSourceDate &&
      comparisonSourceDate &&
      exception.ignoredSourceDate === comparisonSourceDate
  );

  return {
    documentUpdatedAt,
    metadataUpdatedAt,
    displayRelativeDate,
    displayRelativeText,
    resolvedSourceDate,
    comparisonSourceDate,
    sourceDateKind,
    comparisonSourceKind,
    sourceDateDivergence,
    contentRootExtractable,
    extractionStrategy,
    articleHtml,
    exceptionApplied,
    exception,
  };
}

export async function fetchSourcePageInfo(
  url,
  { fetchImpl = fetch, now = new Date(), exception = null } = {}
) {
  try {
    const response = await fetchImpl(url, {
      headers: { 'User-Agent': DEFAULT_USER_AGENT },
    });

    if (!response.ok) {
      return {
        url,
        fetchError: `HTTP ${response.status}`,
        documentUpdatedAt: null,
        metadataUpdatedAt: null,
        displayRelativeDate: null,
        displayRelativeText: null,
        resolvedSourceDate: null,
        comparisonSourceDate: null,
        sourceDateKind: 'unresolved',
        comparisonSourceKind: 'unresolved',
        sourceDateDivergence: false,
        contentRootExtractable: false,
        extractionStrategy: 'fetch-error',
        articleHtml: '',
        exceptionApplied: false,
        exception,
      };
    }

    const html = await response.text();
    return {
      url,
      fetchError: null,
      ...resolveSourcePageInfo({ html, url, now, exception }),
    };
  } catch (error) {
    return {
      url,
      fetchError: error.message,
      documentUpdatedAt: null,
      metadataUpdatedAt: null,
      displayRelativeDate: null,
      displayRelativeText: null,
      resolvedSourceDate: null,
      comparisonSourceDate: null,
      sourceDateKind: 'unresolved',
      comparisonSourceKind: 'unresolved',
      sourceDateDivergence: false,
      contentRootExtractable: false,
      extractionStrategy: 'fetch-error',
      articleHtml: '',
      exceptionApplied: false,
      exception,
    };
  }
}
