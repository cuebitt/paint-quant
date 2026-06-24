import { useEffect, useRef } from "preact/hooks";

interface ShortcutMap {
  [key: string]: () => void;
}

export function useKeyboardShortcuts(shortcuts: ShortcutMap) {
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = [];
      if (e.ctrlKey || e.metaKey) key.push("ctrl");
      if (e.shiftKey) key.push("shift");
      if (e.altKey) key.push("alt");
      key.push(e.key.toLowerCase());
      const combo = key.join("+");

      if (shortcutsRef.current[combo]) {
        e.preventDefault();
        shortcutsRef.current[combo]();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}
