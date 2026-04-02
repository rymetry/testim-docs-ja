/** Presentational component: renders grouped search results with term highlighting and status indicators. */
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import type { ResultGroup, SearchIndexStatus, SearchResult } from './types';

type SearchResultListProps = {
  flatResults: SearchResult[];
  groups: ResultGroup[];
  indexStatus: SearchIndexStatus;
  onNavigate: (href: string) => void;
  query: string;
  results: SearchResult[];
  searchError: boolean;
  selectedIndex: number;
  setSelectedIndex: Dispatch<SetStateAction<number>>;
  totalCount: number;
};

/** Split text on matched search terms and wrap matches in <mark> elements. Terms shorter than 2 chars are ignored to avoid excessive CJK highlighting. */
function highlightText(text: string, terms: string[]): ReactNode {
  if (!text) return text;
  const safeTerms = [...terms.filter((term) => term.length >= 2)].sort(
    (left, right) => right.length - left.length
  );
  if (!safeTerms.length) return text;

  const escapedTerms = safeTerms.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = new RegExp(`(${escapedTerms.join('|')})`, 'gi');
  const parts = text.split(pattern);

  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <mark key={index} className="rounded bg-yellow-200 px-0.5 text-yellow-900">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

export function SearchResultList({
  flatResults,
  groups,
  indexStatus,
  onNavigate,
  query,
  results,
  searchError,
  selectedIndex,
  setSelectedIndex,
  totalCount,
}: SearchResultListProps) {
  return (
    <>
      {query.trim() && indexStatus === 'loading' && (
        <div className="px-4 py-12 text-center sm:px-6" role="status">
          <svg
            className="mx-auto h-12 w-12 animate-spin text-slate-300"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <p className="mt-4 text-base font-medium text-slate-600">
            検索インデックスを読み込み中...
          </p>
        </div>
      )}

      {query.trim() && indexStatus === 'error' && (
        <div className="px-4 py-12 text-center sm:px-6" role="alert">
          <p className="text-base font-medium text-red-600">
            検索インデックスの読み込みに失敗しました
          </p>
          <p className="mt-2 text-sm text-slate-500">ページを再読み込みしてお試しください</p>
        </div>
      )}

      {query.trim() && searchError && (
        <div className="px-4 py-12 text-center sm:px-6" role="alert">
          <p className="text-base font-medium text-red-600">検索中にエラーが発生しました</p>
          <p className="mt-2 text-sm text-slate-500">別のキーワードでお試しください</p>
        </div>
      )}

      {query.trim() && indexStatus === 'ready' && !searchError && results.length === 0 && (
        <div className="px-4 py-12 text-center sm:px-6" role="status">
          <svg
            className="mx-auto h-12 w-12 text-slate-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="mt-4 text-base font-medium text-slate-600">
            検索結果が見つかりませんでした
          </p>
          <p className="mt-2 text-sm text-slate-500">別のキーワードでお試しください</p>
        </div>
      )}

      {results.length > 0 && (
        <>
          <div
            className="px-4 pt-3 pb-1 text-xs text-slate-400 sm:px-6"
            aria-live="polite"
            aria-atomic="true"
          >
            {totalCount > flatResults.length
              ? `${totalCount}件中 ${flatResults.length}件を表示`
              : `${totalCount}件の結果`}
          </div>
          <ul className="py-1" role="listbox" id="search-listbox" aria-label="検索結果">
            {groups.map((group) => (
              <li
                key={group.slug}
                role="group"
                aria-label={group.page?.title || group.headings[0]?.parentTitle || group.slug}
              >
                {group.page &&
                  (() => {
                    const result = group.page;
                    const flatIndex = flatResults.indexOf(result);
                    return (
                      <div
                        id={`search-result-${flatIndex}`}
                        role="option"
                        aria-selected={flatIndex === selectedIndex}
                        className={`flex cursor-pointer flex-col gap-2 rounded-xl px-4 py-4 transition sm:px-6 ${
                          flatIndex === selectedIndex
                            ? 'border-l-4 border-blue-500 bg-blue-50'
                            : 'border-l-4 border-transparent hover:bg-slate-50'
                        }`}
                        onMouseEnter={() => setSelectedIndex(flatIndex)}
                        onClick={() => onNavigate(`/docs/${result.slug}`)}
                      >
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                            {result.category}
                          </span>
                          <span className="text-base font-bold text-slate-900">
                            {highlightText(result.title, result.terms)}
                          </span>
                        </div>
                        <p className="line-clamp-2 text-sm leading-relaxed text-slate-600">
                          {highlightText(result.description, result.terms)}
                        </p>
                      </div>
                    );
                  })()}

                {group.headings.map((heading) => {
                  const flatIndex = flatResults.indexOf(heading);
                  return (
                    <div
                      key={heading.id}
                      id={`search-result-${flatIndex}`}
                      role="option"
                      aria-selected={flatIndex === selectedIndex}
                      className={`flex cursor-pointer min-w-0 items-center gap-2 rounded-xl px-4 py-2.5 transition sm:px-6 ${
                        flatIndex === selectedIndex
                          ? 'border-l-4 border-blue-500 bg-blue-50'
                          : 'border-l-4 border-transparent hover:bg-slate-50'
                      }`}
                      onMouseEnter={() => setSelectedIndex(flatIndex)}
                      onClick={() => onNavigate(`/docs/${heading.slug}#${heading.headingSlug}`)}
                    >
                      <span className="shrink-0 text-xs text-slate-400">{heading.parentTitle}</span>
                      <span className="shrink-0 text-xs text-slate-300">#</span>
                      <span className="min-w-0 truncate text-sm font-semibold text-slate-700">
                        {highlightText(heading.title, heading.terms)}
                      </span>
                    </div>
                  );
                })}
              </li>
            ))}
          </ul>
        </>
      )}

      {!query.trim() && (
        <div className="px-4 py-12 text-center sm:px-6">
          <svg
            className="mx-auto h-16 w-16 text-slate-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <p className="mt-4 text-base font-medium text-slate-700">ドキュメントを検索</p>
          <p className="mt-2 text-sm text-slate-500">キーワードを入力して検索を開始してください</p>
        </div>
      )}
    </>
  );
}
