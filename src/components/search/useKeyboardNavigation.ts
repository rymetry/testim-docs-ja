/** React hook: ArrowUp/Down/Enter keyboard navigation for the search result list. Guards against IME composition events. */
import { useEffect } from 'react';
import type { Dispatch, KeyboardEvent as ReactKeyboardEvent, RefObject, SetStateAction } from 'react';
import type { SearchResult } from './types';

type UseKeyboardNavigationOptions = {
  flatResults: SearchResult[];
  listRef: RefObject<HTMLDivElement | null>;
  onNavigate: (href: string) => void;
  selectedIndex: number;
  setSelectedIndex: Dispatch<SetStateAction<number>>;
};

export function useKeyboardNavigation({
  flatResults,
  listRef,
  onNavigate,
  selectedIndex,
  setSelectedIndex,
}: UseKeyboardNavigationOptions) {
  useEffect(() => {
    if (!listRef.current) return;
    const activeElement = listRef.current.querySelector<HTMLElement>(
      `#search-result-${selectedIndex}`
    );
    activeElement?.scrollIntoView({ block: 'nearest' });
  }, [flatResults, selectedIndex]); // listRef is a stable RefObject — excluded from deps

  const handleInputKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing || (event.nativeEvent as KeyboardEvent).isComposing) return;

    if (event.key === 'ArrowDown') {
      if (flatResults.length === 0) return;
      event.preventDefault();
      setSelectedIndex((previousIndex) => (previousIndex + 1) % flatResults.length);
      return;
    }

    if (event.key === 'ArrowUp') {
      if (flatResults.length === 0) return;
      event.preventDefault();
      setSelectedIndex(
        (previousIndex) => (previousIndex - 1 + flatResults.length) % flatResults.length
      );
      return;
    }

    if (event.key === 'Enter' && flatResults[selectedIndex]) {
      event.preventDefault();
      const target = flatResults[selectedIndex];
      const href =
        target.type === 'heading' && target.headingSlug
          ? `/docs/${target.slug}#${target.headingSlug}`
          : `/docs/${target.slug}`;
      onNavigate(href);
    }
  };

  return { handleInputKeyDown };
}
