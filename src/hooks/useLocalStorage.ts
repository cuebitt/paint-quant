import { useEffect, useRef } from "preact/hooks";
import type { AppState } from "@/app/app-state";

const STORAGE_KEY = "paintcraft-preferences";

interface PersistedPreferences {
  quantMethod: string;
  fitMode: string;
  resizeFilter: string;
  theme: string;
  lastUsed: number;
}

function savePreferences(
  prefs: Pick<AppState, "quantMethod" | "fitMode" | "resizeFilter">,
  theme: string,
) {
  const data: PersistedPreferences = {
    quantMethod: prefs.quantMethod,
    fitMode: prefs.fitMode,
    resizeFilter: prefs.resizeFilter,
    theme,
    lastUsed: Date.now(),
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage quota exceeded or unavailable
  }
}

export function useLocalStorage(state: AppState, theme: string) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const { quantMethod, fitMode, resizeFilter } = state;
    timeoutRef.current = setTimeout(() => {
      savePreferences({ quantMethod, fitMode, resizeFilter }, theme);
    }, 500);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [state.quantMethod, state.fitMode, state.resizeFilter, theme]);
}
