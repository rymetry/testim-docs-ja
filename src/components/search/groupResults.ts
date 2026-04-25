import type { ResultGroup, SearchResult } from './types';

export function groupSearchResults(results: SearchResult[]): {
  groups: ResultGroup[];
  flatResults: SearchResult[];
} {
  const groupsBySlug = new Map<string, ResultGroup>();

  for (const result of results) {
    const group = groupsBySlug.get(result.slug) ?? {
      slug: result.slug,
      headings: [],
    };

    if (result.type === 'page' && !group.page) {
      group.page = result;
    } else if (result.type === 'heading') {
      group.headings.push(result);
    }

    groupsBySlug.set(result.slug, group);
  }

  const groups = [...groupsBySlug.values()];
  const flatResults = groups.flatMap((group) =>
    group.page ? [group.page, ...group.headings] : group.headings
  );

  return { groups, flatResults };
}
