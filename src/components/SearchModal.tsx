import { useEffect, useState, useRef } from 'react';
import MiniSearch from 'minisearch';

type SearchDocument = {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  keywords: string[];
  headings: { text: string; slug: string; depth: number }[];
};

type SearchResult = {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  score: number;
  match?: {
    heading?: string;
    headingSlug?: string;
  };
};

export default function SearchModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [miniSearch, setMiniSearch] = useState<MiniSearch | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // 検索インデックスの初期化
  useEffect(() => {
    const loadSearchIndex = async () => {
      try {
        const response = await fetch('/api/search.json');
        const docs: SearchDocument[] = await response.json();

        const ms = new MiniSearch<SearchDocument>({
          fields: ['title', 'description', 'keywords', 'headingText'],
          storeFields: ['title', 'slug', 'description', 'category', 'headings'],
          searchOptions: {
            boost: { title: 3, description: 2, keywords: 2 },
            fuzzy: 0.2,
            prefix: true,
            combineWith: 'OR',
          },
        });

        // ドキュメントと見出しをインデックス化
        const indexDocs = docs.map((doc) => ({
          ...doc,
          keywords: doc.keywords.join(' '),
          headingText: doc.headings.map((h) => h.text).join(' '),
        }));

        ms.addAll(indexDocs as any);
        setMiniSearch(ms);
      } catch (error) {
        console.error('Failed to load search index:', error);
      }
    };

    loadSearchIndex();
  }, []);

  // キーボードショートカット（⌘K / Ctrl+K）
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }

      if (e.key === 'Escape') {
        setIsOpen(false);
        setQuery('');
        setResults([]);
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
      setSelectedIndex(0);
      return;
    }

    try {
      const searchResults = miniSearch.search(query, {
        fuzzy: 0.2,
        prefix: true,
      });

      const formattedResults: SearchResult[] = searchResults.slice(0, 10).map((result) => ({
        id: result.id,
        title: result.title,
        slug: result.slug,
        description: result.description,
        category: result.category,
        score: result.score,
      }));

      setResults(formattedResults);
      setSelectedIndex(0);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    }
  }, [query, miniSearch]);

  // キーボードナビゲーション
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      if (results.length === 0) {
        return;
      }
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
      return;
    }

    if (e.key === 'ArrowUp') {
      if (results.length === 0) {
        return;
      }
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
      return;
    }

    if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      const target = results[selectedIndex];
      const urlSlug = target.slug.split('/').pop() || target.slug;
      window.location.href = `/docs/${urlSlug}`;
    }
  };

  if (!isOpen) {
    return (
      <button
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
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/50 pt-[8vh] px-4">
      <div
        className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 検索入力 */}
        <div className="flex flex-col gap-4 border-b-2 border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:px-6">
          <svg
            className="h-6 w-6 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
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
          />
          <button
            onClick={() => {
              setIsOpen(false);
              setQuery('');
              setResults([]);
            }}
            className="self-end rounded-md bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-200 sm:self-auto"
          >
            ESC
          </button>
        </div>

        {/* 検索結果 */}
        <div className="max-h-[65vh] overflow-y-auto px-1">
          {query && results.length === 0 && (
            <div className="px-4 py-12 text-center sm:px-6">
              <svg
                className="mx-auto h-12 w-12 text-slate-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
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
            <ul className="py-2">
              {results.map((result, index) => {
                // slug から最後のファイル名部分のみを取得（例: "overview/testim-overview" → "testim-overview"）
                const urlSlug = result.slug.split('/').pop() || result.slug;
                return (
                  <li key={result.id}>
                    <a
                      href={`/docs/${urlSlug}`}
                      className={`flex flex-col gap-2 rounded-xl px-4 py-4 transition sm:px-6 ${
                        index === selectedIndex
                          ? 'bg-blue-50 border-l-4 border-blue-500'
                          : 'border-l-4 border-transparent hover:bg-slate-50'
                      }`}
                      onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                        {result.category}
                      </span>
                      <span className="text-base font-bold text-slate-900">{result.title}</span>
                    </div>
                    <p className="line-clamp-2 text-sm leading-relaxed text-slate-600">{result.description}</p>
                  </a>
                </li>
              );
            })}
            </ul>
          )}

          {!query && (
            <div className="px-4 py-12 text-center sm:px-6">
              <svg
                className="mx-auto h-16 w-16 text-slate-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
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

      {/* 背景クリックで閉じる */}
      <div
        className="absolute inset-0 -z-10"
        onClick={() => {
          setIsOpen(false);
          setQuery('');
          setResults([]);
        }}
      />
    </div>
  );
}
