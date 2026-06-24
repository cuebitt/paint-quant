import { useEffect, useRef } from "preact/hooks";
import type { AppState } from "@/app-state";

const STORAGE_KEY = "paintcraft-preferences";

interface PersistedPreferences {
  quantMethod: string;
  fitMode: string;
  resizeFilter: string;
  theme: string;
  lastUsed: number;
}

function savePreferences(state: AppState, theme: string): void {
  const prefs: PersistedPreferences = {
    quantMethod: state.quantMethod,
    fitMode: state.fitMode,
    resizeFilter: state.resizeFilter,
    theme,
    lastUsed: Date.now(),
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Storage quota exceeded or unavailable
  }
}

export function useLocalStorage(state: AppState, theme: string) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      savePreferences(state, theme);
    }, 500);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [state, state.quantMethod, state.fitMode, state.resizeFilter, theme]);
}
