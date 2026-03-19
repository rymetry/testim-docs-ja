import { useEffect, useState, useRef, useMemo } from 'react';
import type { ReactNode } from 'react';
import MiniSearch from 'minisearch';

type SearchDocument = {
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

// MiniSearch に渡すインデックス用型（keywords を string に変換済み）
type IndexedSearchDocument = Omit<SearchDocument, 'keywords'> & { keywords: string };

type SearchResult = {
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

type ResultGroup = {
  slug: string;
  page?: SearchResult;
  headings: SearchResult[];
};

function highlightText(text: string, terms: string[]): ReactNode {
  if (!text) return text;
  // CJKガード: 1文字termsを除外（MiniSearchはLatin向けspace-split）
  // 降順ソートで長い語を優先マッチ（例: "test"+"testing" → "testing"を先にヒット）
  const safeTerms = [...terms.filter((t) => t.length >= 2)].sort((a, b) => b.length - a.length);
  if (!safeTerms.length) return text;
  const escaped = safeTerms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = new RegExp(`(${escaped.join('|')})`, 'gi');
  const parts = text.split(pattern);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="rounded bg-yellow-200 px-0.5 text-yellow-900">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

export default function SearchModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [miniSearch, setMiniSearch] = useState<MiniSearch<IndexedSearchDocument> | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [indexStatus, setIndexStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const loadControllerRef = useRef<AbortController | null>(null);

  // グルーピングとフラットナビリストを構築
  const { groups, flatResults } = useMemo(() => {
    const slugSeen = new Set<string>();
    const slugOrder: string[] = [];
    for (const r of results) {
      if (!slugSeen.has(r.slug)) {
        slugSeen.add(r.slug);
        slugOrder.push(r.slug);
      }
    }
    const gs: ResultGroup[] = slugOrder.map((slug) => ({
      slug,
      page: results.find((r) => r.slug === slug && r.type === 'page'),
      headings: results.filter((r) => r.slug === slug && r.type === 'heading'),
    }));
    const flat: SearchResult[] = [];
    for (const g of gs) {
      if (g.page) flat.push(g.page);
      flat.push(...g.headings);
    }
    return { groups: gs, flatResults: flat };
  }, [results]);

  // キーボード選択アイテムをスクロール追従させる
  // results も依存に含めることで、クエリ変更後に selectedIndex=0 のまま結果が更新された場合も追従
  useEffect(() => {
    if (!listRef.current) return;
    const activeEl = listRef.current.querySelector<HTMLElement>(`#search-result-${selectedIndex}`);
    activeEl?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex, results]);

  // 検索インデックスの遅延初期化（初回オープン時にフェッチ — 未使用時の 500KB+ 転送を回避）
  // loadControllerRef で in-flight ガード — cleanup で同期的に null 化して
  // open→close→reopen のデッドロックを防止
  useEffect(() => {
    if (!isOpen || miniSearch || loadControllerRef.current) return;

    const controller = new AbortController();
    loadControllerRef.current = controller;
    setIndexStatus('loading');

    const loadSearchIndex = async () => {
      try {
        const response = await fetch('/api/search.json', { signal: controller.signal });
        const docs: SearchDocument[] = await response.json();

        // parentTitle は storeFields のみ（検索対象外）— ページタイトル検索で無関係な
        // 見出しが大量ヒットするのを防ぐ
        const ms = new MiniSearch<IndexedSearchDocument>({
          fields: ['title', 'description', 'keywords'],
          storeFields: ['type', 'title', 'slug', 'description', 'category', 'parentTitle', 'headingSlug'],
          searchOptions: {
            boost: { title: 3, description: 2, keywords: 2 },
            fuzzy: 0.2,
            prefix: true,
            combineWith: 'OR',
          },
        });

        const indexDocs: IndexedSearchDocument[] = docs.map((doc) => ({
          ...doc,
          keywords: Array.isArray(doc.keywords) ? doc.keywords.join(' ') : '',
        }));

        ms.addAll(indexDocs);
        setMiniSearch(ms);
        setIndexStatus('ready');

        // ページdocumentからカテゴリ一覧を抽出
        const cats = [...new Set(docs.filter((d) => d.type === 'page').map((d) => d.category))].sort();
        setCategories(cats);
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Failed to load search index:', error);
          setIndexStatus('error');
        }
      }
    };

    loadSearchIndex();

    return () => {
      controller.abort();
      // 同期的に ref をクリア — 非同期の finally を待たずに次の effect がフェッチを再開できる
      if (loadControllerRef.current === controller) {
        loadControllerRef.current = null;
      }
    };
  }, [isOpen, miniSearch]);

  // モーダルの開閉状態を ref で保持（グローバル keydown ハンドラから stale closure なしで参照するため）
  const isOpenRef = useRef(isOpen);
  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  // キーボードショートカット（⌘K / Ctrl+K / Escape）
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // 既に開いている場合は previousFocusRef を上書きしない
        if (!isOpenRef.current) {
          const active = document.activeElement;
          // body/documentElement はフォーカス復帰先として不適切なので保存しない
          previousFocusRef.current =
            active instanceof HTMLElement &&
            active !== document.body &&
            active !== document.documentElement
              ? active
              : null;
          setIsOpen(true);
        }
        return;
      }

      // モーダルが開いているときのみ Escape で閉じる
      // IME変換中のEscapeは無視（日本語変換キャンセルでモーダルが閉じないように）
      if (isOpenRef.current && e.key === 'Escape' && !e.isComposing) {
        closeModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // モーダルが開いたときにフォーカスを当てる
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // モーダル開閉に合わせてルートにクラスを付与し、背景スクロールを制御
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    if (isOpen) {
      root.classList.add('search-modal-open');
      body.style.overflow = 'hidden';
    } else {
      root.classList.remove('search-modal-open');
      body.style.overflow = '';
    }

    return () => {
      root.classList.remove('search-modal-open');
      body.style.overflow = '';
    };
  }, [isOpen]);

  // 検索実行
  useEffect(() => {
    if (!miniSearch || !query.trim()) {
      setResults([]);
      setTotalCount(0);
      setSelectedIndex(0);
      return;
    }

    try {
      const searchResults = miniSearch.search(query, {
        fuzzy: 0.2,
        prefix: true,
        filter: selectedCategory ? (result) => result.category === selectedCategory : undefined,
      });

      setTotalCount(searchResults.length);
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

      setResults(formattedResults);
      setSelectedIndex(0);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
      setTotalCount(0);
    }
  }, [query, miniSearch, selectedCategory]);

  // キーボードナビゲーション
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // IME変換中はすべてのキーイベントを無視（かな/漢字変換の候補ナビゲーションを妨げない）
    if (e.nativeEvent.isComposing || e.nativeEvent.keyCode === 229) return;

    if (e.key === 'ArrowDown') {
      if (flatResults.length === 0) return;
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % flatResults.length);
      return;
    }

    if (e.key === 'ArrowUp') {
      if (flatResults.length === 0) return;
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + flatResults.length) % flatResults.length);
      return;
    }

    if (e.key === 'Enter' && flatResults[selectedIndex]) {
      e.preventDefault();
      const target = flatResults[selectedIndex];
      const href =
        target.type === 'heading' && target.headingSlug
          ? `/docs/${target.slug}#${target.headingSlug}`
          : `/docs/${target.slug}`;
      window.location.href = href;
    }
  };

  // モーダル内の Tab フォーカストラップ
  const handleModalKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Tab' || !modalRef.current) return;
    const focusable = Array.from(
      modalRef.current.querySelectorAll<HTMLElement>(
        'a[href]:not([tabindex="-1"]), button:not([disabled]), input, [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => !el.closest('[aria-hidden="true"]'));
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const closeModal = () => {
    setIsOpen(false);
    setQuery('');
    setResults([]);
    setSelectedCategory(null);
    // モーダルを開く前にフォーカスがあった要素に復帰（なければトリガーボタンにフォールバック）
    setTimeout(() => {
      const target = previousFocusRef.current;
      if (target && document.contains(target)) {
        target.focus();
      } else {
        triggerRef.current?.focus();
      }
      previousFocusRef.current = null;
    }, 0);
  };

  if (!isOpen) {
    return (
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(true)}
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
      className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/50 pt-[8vh] px-4"
      role="dialog"
      aria-modal="true"
      aria-label="ドキュメント検索"
      onClick={closeModal}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleModalKeyDown}
      >
        {/* 検索入力 */}
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
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="キーワードを入力してドキュメントを検索..."
            className="flex-1 border-none bg-transparent text-base text-slate-900 placeholder-slate-400 outline-none sm:py-5 sm:text-lg"
            role="combobox"
            aria-label="検索クエリ"
            aria-autocomplete="list"
            aria-controls={flatResults.length > 0 ? 'search-listbox' : undefined}
            aria-expanded={flatResults.length > 0}
            aria-activedescendant={flatResults.length > 0 ? `search-result-${selectedIndex}` : undefined}
          />
          <button
            onClick={closeModal}
            className="self-end rounded-md bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-200 sm:self-auto"
            aria-label="検索を閉じる"
          >
            ESC
          </button>
        </div>

        {/* カテゴリフィルター（2カテゴリ以上のときのみ表示） */}
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
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                aria-pressed={selectedCategory === cat}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition ${
                  selectedCategory === cat
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* 検索結果 */}
        <div className="max-h-[60vh] overflow-y-auto px-1" ref={listRef}>
          {/* インデックス読み込み中 */}
          {query.trim() && indexStatus === 'loading' && (
            <div className="px-4 py-12 text-center sm:px-6" role="status">
              <svg
                className="mx-auto h-12 w-12 animate-spin text-slate-300"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="mt-4 text-base font-medium text-slate-600">検索インデックスを読み込み中...</p>
            </div>
          )}

          {/* インデックス読み込みエラー */}
          {query.trim() && indexStatus === 'error' && (
            <div className="px-4 py-12 text-center sm:px-6" role="alert">
              <p className="text-base font-medium text-red-600">検索インデックスの読み込みに失敗しました</p>
              <p className="mt-2 text-sm text-slate-500">ページを再読み込みしてお試しください</p>
            </div>
          )}

          {/* 検索結果なし（インデックス準備済みの場合のみ表示） */}
          {query.trim() && indexStatus === 'ready' && results.length === 0 && (
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
              <p className="mt-4 text-base font-medium text-slate-600">検索結果が見つかりませんでした</p>
              <p className="mt-2 text-sm text-slate-500">別のキーワードでお試しください</p>
            </div>
          )}

          {results.length > 0 && (
            <>
              {/* 結果件数（実際のヒット数 vs 表示数） */}
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
                  <li key={group.slug} role="group" aria-label={group.page?.title || group.headings[0]?.parentTitle || group.slug}>
                    {/* ページ結果 */}
                    {group.page &&
                      (() => {
                        const result = group.page!;
                        const flatIdx = flatResults.indexOf(result);
                        return (
                          <div
                            id={`search-result-${flatIdx}`}
                            role="option"
                            aria-selected={flatIdx === selectedIndex}
                            className={`flex cursor-pointer flex-col gap-2 rounded-xl px-4 py-4 transition sm:px-6 ${
                              flatIdx === selectedIndex
                                ? 'border-l-4 border-blue-500 bg-blue-50'
                                : 'border-l-4 border-transparent hover:bg-slate-50'
                            }`}
                            onMouseEnter={() => setSelectedIndex(flatIdx)}
                            onClick={() => { window.location.href = `/docs/${result.slug}`; }}
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
                    {/* 見出し結果 */}
                    {group.headings.map((heading) => {
                      const flatIdx = flatResults.indexOf(heading);
                      return (
                        <div
                          key={heading.id}
                          id={`search-result-${flatIdx}`}
                          role="option"
                          aria-selected={flatIdx === selectedIndex}
                          className={`flex cursor-pointer min-w-0 items-center gap-2 rounded-xl px-4 py-2.5 transition sm:px-6 ${
                            flatIdx === selectedIndex
                              ? 'border-l-4 border-blue-500 bg-blue-50'
                              : 'border-l-4 border-transparent hover:bg-slate-50'
                          }`}
                          onMouseEnter={() => setSelectedIndex(flatIdx)}
                          onClick={() => { window.location.href = `/docs/${heading.slug}#${heading.headingSlug}`; }}
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
        </div>

        {/* フッター */}
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
