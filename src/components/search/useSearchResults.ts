import { startTransition, useEffect, useState } from 'react';
import type MiniSearch from 'minisearch';
import type { IndexedSearchDocument, SearchResult } from './types';

type UseSearchResultsOptions = {
  miniSearch: MiniSearch<IndexedSearchDocument> | null;
  query: string;
  selectedCategory: string | null;
};

export function useSearchResults({ miniSearch, query, selectedCategory }: UseSearchResultsOptions) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!miniSearch || !query.trim()) {
      startTransition(() => {
        setResults([]);
        setTotalCount(0);
        setSelectedIndex(0);
      });
      return;
    }

    try {
      const searchResults = miniSearch.search(query, {
        fuzzy: 0.2,
        prefix: true,
        filter: selectedCategory ? (result) => result.category === selectedCategory : undefined,
      });

      const formattedResults: SearchResult[] = searchResults.slice(0, 20).map((result) => ({
        id: result.id,
        type: result.type as 'page' | 'heading',
        title: result.title,
        slug: result.slug,
        description: result.description || '',
        category: result.category,
        score: result.score,
        terms: result.terms,
        parentTitle: result.parentTitle || '',
        headingSlug: result.headingSlug || '',
      }));

      startTransition(() => {
        setTotalCount(searchResults.length);
        setResults(formattedResults);
        setSelectedIndex(0);
      });
    } catch {
      startTransition(() => {
        setResults([]);
        setTotalCount(0);
        setSelectedIndex(0);
      });
    }
  }, [miniSearch, query, selectedCategory]);

  return { results, totalCount, selectedIndex, setSelectedIndex };
}
