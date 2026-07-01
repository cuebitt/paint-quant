const STORAGE_KEY = "paintcraft-preferences";

interface PersistedPreferences {
  quantMethod: string;
  fitMode: string;
  resizeFilter: string;
  paintFormat: string;
  theme: string;
  lastUsed: number;
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
const VALID_PAINT_FORMATS = new Set<string>(["jop-1x", "jop-delta", "jop-2x"]);

export function savePreferences(
  prefs: { quantMethod: string; fitMode: string; resizeFilter: string; paintFormat: string },
  theme: string,
) {
  const data: PersistedPreferences = {
    ...prefs,
    theme,
    lastUsed: Date.now(),
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage quota exceeded or unavailable
  }
}

export function loadPreferences() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const data = JSON.parse(raw) as PersistedPreferences;
    const result: Record<string, unknown> = {};
    if (data.quantMethod && VALID_QUANT_METHODS.has(data.quantMethod))
      result.quantMethod = data.quantMethod;
    if (data.fitMode && VALID_FIT_MODES.has(data.fitMode)) result.fitMode = data.fitMode;
    if (data.resizeFilter && VALID_RESIZE_FILTERS.has(data.resizeFilter))
      result.resizeFilter = data.resizeFilter;
    if (data.paintFormat && VALID_PAINT_FORMATS.has(data.paintFormat))
      result.paintFormat = data.paintFormat;
    return result;
  } catch {
    return {};
  }
}
