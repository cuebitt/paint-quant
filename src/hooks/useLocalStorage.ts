import { useEffect, useRef } from "preact/hooks";
import type { AppState } from "@/app/app-state";
import type { QuantMethod } from "@/core/quantize";
import type { ImageFitMode } from "@/types";
import type { ResizeFilter } from "@/core/preprocess";

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

const VALID_QUANT_METHODS = new Set<string>(["median-cut", "neuquant", "wuquant"]);
const VALID_FIT_MODES = new Set<string>(["contain", "fill", "width", "height"]);
const VALID_RESIZE_FILTERS = new Set<string>([
  "nearest",
  "box",
  "hamming",
  "lanczos2",
  "lanczos3",
  "mks2013",
]);

export function loadPreferences(): Partial<AppState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const data = JSON.parse(raw) as PersistedPreferences;
    const result: Partial<AppState> = {};
    if (data.quantMethod && VALID_QUANT_METHODS.has(data.quantMethod))
      result.quantMethod = data.quantMethod as QuantMethod;
    if (data.fitMode && VALID_FIT_MODES.has(data.fitMode))
      result.fitMode = data.fitMode as ImageFitMode;
    if (data.resizeFilter && VALID_RESIZE_FILTERS.has(data.resizeFilter))
      result.resizeFilter = data.resizeFilter as ResizeFilter;
    return result;
  } catch {
    return {};
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
