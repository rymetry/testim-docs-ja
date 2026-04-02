/** React hook: search modal lifecycle — Cmd+K toggle, Escape close, focus trap, and scroll lock. */
import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, RefObject } from 'react';

type UseModalBehaviorOptions = {
  onClose?: () => void;
};

type UseModalBehaviorResult = {
  inputRef: RefObject<HTMLInputElement | null>;
  isOpen: boolean;
  listRef: RefObject<HTMLDivElement | null>;
  modalRef: RefObject<HTMLDivElement | null>;
  openModal: () => void;
  closeModal: () => void;
  handleModalKeyDown: (event: ReactKeyboardEvent<HTMLDivElement>) => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
};

export function useModalBehavior({
  onClose,
}: UseModalBehaviorOptions = {}): UseModalBehaviorResult {
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const isOpenRef = useRef(isOpen);

  // useEffectEvent reads the latest onClose without re-subscribing effects
  const runOnClose = useEffectEvent(() => {
    onClose?.();
  });

  // useCallback for stable identity — safe to pass as JSX event handler props
  const openModal = useCallback(() => {
    const active = document.activeElement;
    previousFocusRef.current =
      active instanceof HTMLElement &&
      active !== document.body &&
      active !== document.documentElement
        ? active
        : null;
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    runOnClose();
    setTimeout(() => {
      const target = previousFocusRef.current;
      if (target && document.contains(target)) {
        target.focus();
      } else if (triggerRef.current && document.contains(triggerRef.current)) {
        triggerRef.current.focus();
      }
      previousFocusRef.current = null;
    }, 0);
  }, [runOnClose]);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        if (!isOpenRef.current) {
          openModal();
        }
        return;
      }

      if (isOpenRef.current && event.key === 'Escape' && !event.isComposing) {
        closeModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openModal, closeModal]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

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

  const handleModalKeyDown = useCallback((event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab' || !modalRef.current) return;

    const focusable = Array.from(
      modalRef.current.querySelectorAll<HTMLElement>(
        'a[href]:not([tabindex="-1"]), button:not([disabled]), input, [tabindex]:not([tabindex="-1"])'
      )
    ).filter((element) => !element.closest('[aria-hidden="true"]'));

    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }, []);

  return {
    inputRef,
    isOpen,
    listRef,
    modalRef,
    openModal,
    closeModal,
    handleModalKeyDown,
    triggerRef,
  };
}
