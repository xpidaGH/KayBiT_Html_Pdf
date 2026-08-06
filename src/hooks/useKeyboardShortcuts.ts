import { useEffect, useRef } from 'react';

export interface ShortcutHandlers {
  onGeneratePdf?: () => void;
  onToggleFocusMode?: () => void;
  onSyncSave?: () => void;
  onOpenSettings?: () => void;
  onOpenHistory?: () => void;
  onOpenBatchExport?: () => void;
  onOpenFlashcards?: () => void;
  onCloseModals?: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  const handlersRef = useRef(handlers);

  // Keep ref synchronized with latest handlers props to avoid stale closures
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      const target = e.target as HTMLElement | null;
      const isInputElement =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      const h = handlersRef.current;

      // Escape key to close modals or exit focus mode
      if (e.key === 'Escape') {
        if (h.onCloseModals) {
          h.onCloseModals();
        }
        return;
      }

      if (!isCmdOrCtrl) return;

      const key = e.key.toLowerCase();

      // Ctrl+P / Cmd+P -> Generate PDF
      if (key === 'p') {
        e.preventDefault();
        h.onGeneratePdf?.();
        return;
      }

      // Ctrl+F / Cmd+F or Ctrl+Shift+F / Cmd+Shift+F -> Toggle Focus Mode
      if (key === 'f') {
        if (e.shiftKey || !isInputElement) {
          e.preventDefault();
          h.onToggleFocusMode?.();
          return;
        }
      }

      // Ctrl+S / Cmd+S -> Quick Save & Remote Endpoint Sync
      if (key === 's') {
        e.preventDefault();
        h.onSyncSave?.();
        return;
      }

      // Ctrl+, / Cmd+, -> Open Settings Modal
      if (key === ',') {
        e.preventDefault();
        h.onOpenSettings?.();
        return;
      }

      // Ctrl+H / Cmd+H or Ctrl+Shift+H -> Open PDF Export History
      if (key === 'h' && (e.shiftKey || !isInputElement)) {
        e.preventDefault();
        h.onOpenHistory?.();
        return;
      }

      // Ctrl+B / Cmd+B -> Open Batch Export
      if (key === 'b' && (e.shiftKey || !isInputElement)) {
        e.preventDefault();
        h.onOpenBatchExport?.();
        return;
      }

      // Ctrl+K / Cmd+K -> Open Flashcards / AI Study Guide
      if (key === 'k') {
        e.preventDefault();
        h.onOpenFlashcards?.();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
}
