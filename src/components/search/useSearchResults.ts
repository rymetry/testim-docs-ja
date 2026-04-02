/** React hook: runs MiniSearch queries against the loaded index and manages result state. */
import { startTransition, useEffect, useState } from 'react';
import type MiniSearch from 'minisearch';
import type { IndexedSearchDocument, SearchResult } from './types';

function isValidType(value: unknown): value is 'page' | 'heading' {
  return value === 'page' || value === 'heading';
}

type UseSearchResultsOptions = {
  miniSearch: MiniSearch<IndexedSearchDocument> | null;
  query: string;
  selectedCategory: string | null;
};

export function useSearchResults({ miniSearch, query, selectedCategory }: UseSearchResultsOptions) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchError, setSearchError] = useState(false);

  useEffect(() => {
    if (!miniSearch || !query.trim()) {
      startTransition(() => {
        setResults([]);
        setTotalCount(0);
        setSelectedIndex(0);
        setSearchError(false);
      });
      return;
    }

    try {
      const searchResults = miniSearch.search(query, {
        fuzzy: 0.2,
        prefix: true,
        filter: selectedCategory ? (result) => result.category === selectedCategory : undefined,
      });

      const formattedResults: SearchResult[] = searchResults
        .filter((result) => isValidType(result.type))
        .slice(0, 20)
        .map((result) => ({
          id: result.id,
          type: result.type as 'page' | 'heading',
          title: String(result.title ?? ''),
          slug: String(result.slug ?? ''),
          description: String(result.description ?? ''),
          category: String(result.category ?? ''),
          score: result.score,
          terms: result.terms,
          parentTitle: String(result.parentTitle ?? ''),
          headingSlug: String(result.headingSlug ?? ''),
        }));

      startTransition(() => {
        setTotalCount(searchResults.length);
        setResults(formattedResults);
        setSelectedIndex(0);
        setSearchError(false);
      });
    } catch (error) {
      console.error('Search error:', error);
      startTransition(() => {
        setResults([]);
        setTotalCount(0);
        setSelectedIndex(0);
        setSearchError(true);
      });
    }
  }, [miniSearch, query, selectedCategory]);

  return { results, totalCount, selectedIndex, setSelectedIndex, searchError };
}
