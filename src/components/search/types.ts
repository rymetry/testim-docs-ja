import type MiniSearch from 'minisearch';

export type SearchDocument = {
  id: string;
  type: 'page' | 'heading';
  title: string;
  slug: string;
  description: string;
  category: string;
  keywords: string[];
  parentTitle: string;
  headingSlug: string;
};

export type IndexedSearchDocument = Omit<SearchDocument, 'keywords'> & {
  keywords: string;
};

export type SearchResult = {
  id: string;
  type: 'page' | 'heading';
  title: string;
  slug: string;
  description: string;
  category: string;
  score: number;
  terms: string[];
  parentTitle: string;
  headingSlug: string;
};

export type ResultGroup = {
  slug: string;
  page?: SearchResult;
  headings: SearchResult[];
};

export type SearchIndexStatus = 'idle' | 'loading' | 'ready' | 'error';

export type SearchIndexState = {
  miniSearch: MiniSearch<IndexedSearchDocument> | null;
  categories: string[];
  indexStatus: SearchIndexStatus;
};
