import { useEffect } from "react";
import { Status } from "../models/types";

type KeyboardShortcutHandlers = {
  onComplete?: () => void;
  onPending?: () => void;
  onDelayed?: () => void;
  onToggleComplete?: () => void;
};

/**
 * Hook to handle keyboard shortcuts for status management
 *
 * Shortcuts:
 * - C: Mark as completed
 * - P: Mark as pending
 * - D: Mark as delayed
 * - Space: Toggle complete/pending
 *
 * @param itemId - The ID of the currently focused/selected item
 * @param handlers - Callback functions for each shortcut
 * @param enabled - Whether shortcuts are enabled (default: true)
 */
export function useKeyboardShortcuts(
  itemId: string | null,
  handlers: KeyboardShortcutHandlers,
  enabled: boolean = true,
) {
  useEffect(() => {
    if (!enabled || !itemId) return;

    function handleKeyPress(e: KeyboardEvent) {
      // Don't trigger if user is typing in an input
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      // C = Complete
      if (e.key === "c" || e.key === "C") {
        e.preventDefault();
        handlers.onComplete?.();
      }

      // P = Pending
      if (e.key === "p" || e.key === "P") {
        e.preventDefault();
        handlers.onPending?.();
      }

      // D = Delayed
      if (e.key === "d" || e.key === "D") {
        e.preventDefault();
        handlers.onDelayed?.();
      }

      // Space = Toggle complete
      if (e.key === " ") {
        e.preventDefault();
        handlers.onToggleComplete?.();
      }
    }

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [itemId, handlers, enabled]);
}

export default useKeyboardShortcuts;
