import { useCallback, useMemo, useState } from 'react';
import { SearchResultList } from './search/SearchResultList';
import { useKeyboardNavigation } from './search/useKeyboardNavigation';
import { useModalBehavior } from './search/useModalBehavior';
import { useSearchIndex } from './search/useSearchIndex';
import { useSearchResults } from './search/useSearchResults';
import type { ResultGroup } from './search/types';

export default function SearchModal() {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const {
    isOpen,
    openModal,
    closeModal,
    handleModalKeyDown,
    inputRef,
    listRef,
    modalRef,
    triggerRef,
  } = useModalBehavior({
    onClose: () => {
      setQuery('');
      setSelectedCategory(null);
      setSelectedIndex(0);
    },
  });
  const { miniSearch, categories, indexStatus } = useSearchIndex(isOpen);
  const { results, totalCount, selectedIndex, setSelectedIndex, searchError } = useSearchResults({
    miniSearch,
    query,
    selectedCategory,
  });

  const { groups, flatResults } = useMemo(() => {
    const slugOrder: string[] = [];
    const seenSlugs = new Set<string>();

    for (const result of results) {
      if (!seenSlugs.has(result.slug)) {
        seenSlugs.add(result.slug);
        slugOrder.push(result.slug);
      }
    }

    const nextGroups: ResultGroup[] = slugOrder.map((slug) => ({
      slug,
      page: results.find((result) => result.slug === slug && result.type === 'page'),
      headings: results.filter((result) => result.slug === slug && result.type === 'heading'),
    }));
    const nextFlatResults = nextGroups.flatMap((group) =>
      group.page ? [group.page, ...group.headings] : group.headings
    );

    return { groups: nextGroups, flatResults: nextFlatResults };
  }, [results]);

  const navigateTo = useCallback((href: string) => {
    window.location.href = href;
  }, []);

  const { handleInputKeyDown } = useKeyboardNavigation({
    flatResults,
    listRef,
    onNavigate: navigateTo,
    selectedIndex,
    setSelectedIndex,
  });

  if (!isOpen) {
    return (
      <button
        ref={triggerRef}
        onClick={openModal}
        className="flex w-full items-center gap-2.5 justify-between rounded-lg border-2 border-slate-300 bg-white px-4 py-2 text-left text-sm text-slate-700 shadow-sm transition hover:border-blue-500 hover:bg-blue-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto sm:justify-start"
        aria-label="検索"
      >
        <svg
          className="h-4 w-4 text-slate-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <span className="font-medium">ドキュメントを検索</span>
        <kbd className="ml-auto hidden rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-600 sm:inline">
          ⌘K
        </kbd>
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/50 px-4 pt-[8vh]"
      role="dialog"
      aria-modal="true"
      aria-label="ドキュメント検索"
      onClick={closeModal}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={handleModalKeyDown}
      >
        <div className="flex flex-col gap-4 border-b-2 border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:px-6">
          <svg
            className="h-6 w-6 text-slate-400"
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
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="キーワードを入力してドキュメントを検索..."
            className="flex-1 border-none bg-transparent text-base text-slate-900 placeholder-slate-400 outline-none sm:py-5 sm:text-lg"
            role="combobox"
            aria-label="検索クエリ"
            aria-autocomplete="list"
            aria-controls={flatResults.length > 0 ? 'search-listbox' : undefined}
            aria-expanded={flatResults.length > 0}
            aria-activedescendant={
              flatResults.length > 0 ? `search-result-${selectedIndex}` : undefined
            }
          />
          <button
            onClick={closeModal}
            className="self-end rounded-md bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-200 sm:self-auto"
            aria-label="検索を閉じる"
          >
            ESC
          </button>
        </div>

        {categories.length > 1 && (
          <div
            className="flex gap-2 overflow-x-auto border-b border-slate-200 px-4 py-2 sm:px-6"
            role="group"
            aria-label="カテゴリフィルター"
          >
            <button
              onClick={() => setSelectedCategory(null)}
              aria-pressed={selectedCategory === null}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition ${
                selectedCategory === null
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              すべて
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(selectedCategory === category ? null : category)}
                aria-pressed={selectedCategory === category}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition ${
                  selectedCategory === category
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        )}

        <div className="max-h-[60vh] overflow-y-auto px-1" ref={listRef}>
          <SearchResultList
            flatResults={flatResults}
            groups={groups}
            indexStatus={indexStatus}
            onNavigate={navigateTo}
            query={query}
            searchError={searchError}
            selectedIndex={selectedIndex}
            setSelectedIndex={setSelectedIndex}
            totalCount={totalCount}
          />
        </div>

        <div className="flex flex-col gap-4 border-t-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
            <span className="flex items-center gap-2">
              <kbd className="rounded-md border border-slate-300 bg-white px-2 py-1 font-mono text-xs font-semibold shadow-sm">
                ↑↓
              </kbd>
              <span className="font-medium">移動</span>
            </span>
            <span className="flex items-center gap-2">
              <kbd className="rounded-md border border-slate-300 bg-white px-2 py-1 font-mono text-xs font-semibold shadow-sm">
                Enter
              </kbd>
              <span className="font-medium">選択</span>
            </span>
          </div>
          <span className="flex items-center gap-2">
            <kbd className="rounded-md border border-slate-300 bg-white px-2 py-1 font-mono text-xs font-semibold shadow-sm">
              ESC
            </kbd>
            <span className="font-medium">閉じる</span>
          </span>
        </div>
      </div>
    </div>
  );
}
