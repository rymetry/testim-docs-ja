/** 読み込み済み index に対して MiniSearch query を実行し、結果 state を組み立てる hook。 */
import { useEffect, useMemo, useState } from 'react';
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
  const [selectedIndex, setSelectedIndex] = useState(0);

  const { results, totalCount, searchError } = useMemo(() => {
    if (!miniSearch || !query.trim()) {
      return { results: [] as SearchResult[], totalCount: 0, searchError: false };
    }

    try {
      const searchResults = miniSearch.search(query, {
        fuzzy: 0.2,
        prefix: true,
        filter: selectedCategory ? (result) => result.category === selectedCategory : undefined,
      });

      const validResults = searchResults.filter((result) => isValidType(result.type));

      const formattedResults: SearchResult[] = validResults.slice(0, 20).map((result) => ({
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

      return { results: formattedResults, totalCount: validResults.length, searchError: false };
    } catch (error) {
      console.error('Search error:', error);
      return { results: [] as SearchResult[], totalCount: 0, searchError: true };
    }
  }, [miniSearch, query, selectedCategory]);

  // 結果が変わったら選択位置を先頭に戻す。
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  return { results, totalCount, selectedIndex, setSelectedIndex, searchError };
}
