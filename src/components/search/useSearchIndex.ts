/** React hook: lazy-loads the MiniSearch index from /api/search.json when the modal opens. */
import { useEffect, useRef, useState } from 'react';
import MiniSearch from 'minisearch';
import type { IndexedSearchDocument, SearchDocument, SearchIndexState } from './types';

export function useSearchIndex(isOpen: boolean): SearchIndexState {
  const [miniSearch, setMiniSearch] = useState<MiniSearch<IndexedSearchDocument> | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [indexStatus, setIndexStatus] = useState<SearchIndexState['indexStatus']>('idle');
  const loadControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!isOpen || miniSearch || loadControllerRef.current) return;

    const controller = new AbortController();
    loadControllerRef.current = controller;
    setIndexStatus('loading');

    const loadSearchIndex = async () => {
      try {
        const response = await fetch('/api/search.json', { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`Failed to load search index: HTTP ${response.status}`);
        }

        const docs: SearchDocument[] = await response.json();
        const nextMiniSearch = new MiniSearch<IndexedSearchDocument>({
          fields: ['title', 'description', 'keywords'],
          storeFields: [
            'type',
            'title',
            'slug',
            'description',
            'category',
            'parentTitle',
            'headingSlug',
          ],
          searchOptions: {
            boost: { title: 3, description: 2, keywords: 2 },
            fuzzy: 0.2,
            prefix: true,
            combineWith: 'OR',
          },
        });

        nextMiniSearch.addAll(
          docs.map((doc) => ({
            ...doc,
            keywords: Array.isArray(doc.keywords) ? doc.keywords.join(' ') : '',
          }))
        );

        setMiniSearch(nextMiniSearch);
        setIndexStatus('ready');
        setCategories(
          [...new Set(docs.filter((doc) => doc.type === 'page').map((doc) => doc.category))].sort()
        );
      } catch (error) {
        const isAbort =
          error instanceof DOMException && error.name === 'AbortError';
        if (!isAbort) {
          console.error('Failed to load search index:', error);
          setIndexStatus('error');
        }
      } finally {
        if (loadControllerRef.current === controller) {
          loadControllerRef.current = null;
        }
      }
    };

    loadSearchIndex();

    return () => {
      controller.abort();
      if (loadControllerRef.current === controller) {
        loadControllerRef.current = null;
      }
    };
  }, [isOpen, miniSearch]);

  return { miniSearch, categories, indexStatus };
}
